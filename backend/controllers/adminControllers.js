import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { getErrorObject, getUserPayload } from "../utils/helper.js";
import { Directory } from "../models/directory.model.js";
import { UserFile } from "../models/user_file.model.js";
import {
  sendAccountBannedEmail,
  sendAccountRecoveredEmail,
  sendAdminDirectEmail,
} from "../services/emailService.js";
import { redisClient } from "../configs/redis.js";
import { invalidateUser } from "../utils/responseCache.js";
import { deleteS3Objects } from "../services/s3Client.js";
import { IS_SAAS_MODE } from "../misc/constants.js";
import { Permission } from "../models/permission.model.js";
import { quotaSchema } from "../schemas/userSchema.js";

/**
 * path: /api/admin/dashboard
 * what it do: Return aggregate stats for the admin dashboard overview.
 * requirements:
 *   - req.user: authenticated admin/super_admin user
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const limit =
      req.query?.limit > 0 && req.query?.limit <= 100 ? req.query?.limit : 20;

    const [
      totalUsers,
      activeUsers,
      storageResult,
      fileStats,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({}),

      (async () => {
        const nowSec = Math.floor(Date.now() / 1000);
        return redisClient.zCount(
          "storageApp:active_users",
          nowSec - 60,
          nowSec,
        );
      })(),

      (async () => {
        const roots = await User.distinct("root", { isDeleted: { $ne: true } });
        if (!roots.length) return [];
        return Directory.aggregate([
          { $match: { _id: { $in: roots } } },
          { $group: { _id: null, total: { $sum: "$size" } } },
        ]);
      })(),

      UserFile.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalFiles: { $sum: 1 },
            totalSize: { $sum: "$size" },
          },
        },
      ]),

      User.find({})
        .select(
          "name email role isDeleted lastLogin lastActiveAt createdAt",
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    const storageUsedBytes = storageResult[0]?.total || 0;
    const totalFiles = fileStats[0]?.totalFiles || 0;
    const totalDirs = await Directory.countDocuments({
      isDeleted: { $ne: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        storageUsedBytes,
        totalFiles,
        totalDirs,
        recentUsers: recentUsers.map((u) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          isDeleted: u.isDeleted,
          lastLogin: u.lastLogin,
          lastActiveAt: u.lastActiveAt,
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * path: /api/admin/users
 * what it do: Get paginated list of users with search, role, status, and sort filters.
 * requirements:
 *   - req.query: { page?, limit?, search?, role?, status?, sortBy?, sortOrder? }
 *   - req.user: authenticated admin/super_admin user
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query?.page) || 1);
    const lim = parseInt(req.query?.limit);
    const limit = lim > 0 && lim <= 100 ? lim : 20;
    const skip = (page - 1) * limit;

    const search = req.query?.search?.trim();
    const role = req.query?.role?.toLowerCase().trim();
    const status = req.query?.status?.toLowerCase().trim();

    const query = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    // status filter (default: "all")
    //   active -> isDeleted = false
    //   banned -> isDeleted = true
    //   "all" / absent -> BOTH active and banned users are returned
    if (status === "banned" || role === "banned") {
      query.isDeleted = true;
    } else if (status === "active") {
      query.isDeleted = false;
    }

    // role filter (default: "all")
    //   specific role -> only users with that role
    //   "all" / absent -> every role; a role filter never narrows the status
    if (role && role !== "banned" && role !== "all") {
      query.role = role;
    }

    // sorting: name / date / role, asc or desc (default newest first)
    const sortOrder = req.query?.sortOrder?.toLowerCase() === "asc" ? 1 : -1;
    const sortFieldMap = {
      name: "name",
      date: "createdAt",
      role: "role",
    };
    const sortField =
      sortFieldMap[req.query?.sortBy?.toLowerCase()] || "createdAt";
    const sort = { [sortField]: sortOrder };

    const findQuery = User.find(query)
      .populate("root")
      .collation({ locale: "en" })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const [users, totalCount] = await Promise.all([
      findQuery.lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const usersData = await Promise.all(
      users.map(async (user) => {
        const indexKey = `storageApp:user:${user._id.toString()}:session_index`;
        const sessionKeys = await redisClient.sMembers(indexKey);

        const payload = await getUserPayload(user);
        payload.sessionCount = sessionKeys.length;
        payload.role = user.role;

        return payload;
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Users found.",
      data: { users: usersData, totalPages, page, totalCount },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * path: /api/admin/user/:id
 * what it do: Get a single user by id.
 * requirements:
 *   - req.params: { id: string } (valid Mongo ObjectId)
 *   - req.user: authenticated admin user
 *   - Only accessible by ADMIN or SUPER_ADMIN
 */
export const getSingleUser = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return next(getErrorObject("Invalid id."));

    const user = await User.findById(req.params.id)
      .populate("root")
      .lean();
    if (!user) return next(getErrorObject("User not found."));

    return res.status(200).json({
      success: true,
      message: "User found.",
      data: { user: await getUserPayload(user) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * path: /api/admin/user/:id/role
 * what it do: Change the role of a user.
 * requirements:
 *   - req.params: { id: string } (valid Mongo ObjectId)
 *   - req.body | req.query: { role: string } (USER, ADMIN, SUPER_ADMIN)
 *   - req.user: authenticated admin user
 *   - Only accessible by ADMIN or SUPER_ADMIN
 */
export const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    let requestedRole = req.body.role || req.query?.role;
    requestedRole = String(requestedRole).toLowerCase();

    if (
      !requestedRole ||
      !["user", "admin", "super_admin"].includes(requestedRole)
    )
      return next(getErrorObject("Invalid role."));

    if (!mongoose.isValidObjectId(id) || id === req.user._id.toString())
      return next(getErrorObject("Invalid id."));

    const target = await User.findById(id).select("role isDeleted").lean();
    if (!target || target.isDeleted)
      return next(getErrorObject("User not found.", 404));

    const requesterRole = req.user.role;

    // Regular admins can only manage regular users and never grant super_admin
    if (requesterRole !== "super_admin") {
      if (target.role !== "user" || requestedRole === "super_admin")
        return next(getErrorObject("You don't have this permission.", 409));
    } else {
      // Super admins can't demote/promote other super admins
      if (target.role === "super_admin")
        return next(getErrorObject("You don't have this permission.", 409));
    }

    const user = await User.findOneAndUpdate(
      { _id: id },
      { role: requestedRole },
      { returnDocument: "after" },
    ).select("_id role");
    if (!user) return next(getErrorObject("User not found.", 404));

    // Invalidate the user's cached payload so new permissions apply immediately
    await redisClient.del(`storageApp:user:${id}:userdata`).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "User role changed.",
      data: { user: { id: user._id.toString(), role: user.role } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * path: /api/admin/user/:id/quota
 * what it do: Manually updates a user's quota in Self-Hosted mode.
 * requirements:
 * - req.params: { id: string }
 * - req.user: authenticated ADMIN or SUPER_ADMIN
 */
export const updateUserQuota = async (req, res, next) => {
  try {
    if (req.user.role !== "super_admin" && req.user.role !== "admin") {
      return next(getErrorObject("You don't have this permission.", 409));
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return next(getErrorObject("Invalid user id."));

    const { success, data, error } = quotaSchema.safeParse(req.body);
    if (!success) {
      const message = error.issues.map((e) => e.message).join(", ");
      return next(getErrorObject(message));
    }
    const { maxStorageQuota, maxBandwidthQuota } = data;

    if (IS_SAAS_MODE && (maxStorageQuota > 500e9 || maxBandwidthQuota > 1000e9))
      return next(getErrorObject("Invalid request."));

    const updatePayload = {};
    if (maxStorageQuota) updatePayload.maxQuota = maxStorageQuota;
    if (maxBandwidthQuota) updatePayload.maxBandwidthQuota = maxBandwidthQuota;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { returnDocument: "after" },
    ).select("_id maxQuota maxBandwidthQuota").lean();

    if (!updatedUser) return next(getErrorObject("User not found.", 404));

    await redisClient.del(`storageApp:user:${id}:userdata`);
    await invalidateUser(id);

    return res.status(200).json({
      success: true,
      message: "User quotas updated successfully.",
      data: { user: updatedUser },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * path: /api/admin/user/:id/logout
 * what it do: Log out a user by deleting their sessions.
 * requirements:
 *   - req.params: { id: string } (valid Mongo ObjectId)
 *   - req.user: authenticated admin user
 *   - Only accessible by ADMIN or SUPER_ADMIN
 */
export const logoutUser = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return next(getErrorObject("Invalid id."));

  if (id === req.user._id.toString())
    return next(getErrorObject("You cannot logout yourself."));

  if (req.user.role !== "super_admin" && req.user.role !== "admin")
    return next(getErrorObject("You don't have this permission.", 409));

  try {
    const session = await mongoose.startSession();
    let user = null;

    await session.withTransaction(async () => {
      user = await User.findOne({
        _id: id,
        role: { $nin: ["admin", "super_admin"] },
      }).lean();

      if (!user) throw getErrorObject("You don't have this permission.", 409);

      const indexKey = `storageApp:user:${id}:session_index`;
      const sessions = await redisClient.sMembers(indexKey);
      if (sessions.length > 0) {
        await redisClient.sRem(indexKey, sessions);
        await redisClient.del(sessions);
        await redisClient.del(`storageApp:user:${id}:userdata`);
      }
    });

    await session.endSession();
    return res.status(200).json({
      success: true,
      message: "User logged out and all the user sessions are deleted.",
      data: {
        user: {
          id: user._id.toString(),
          isLogged:
            (await redisClient.sCard(`storageApp:user:${id}:session_index`)) >
            0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * path: /api/admin/user/:id/temp-remove
 * what it do: Soft-delete a user (can be recovered).
 * requirements:
 *   - req.params: { id: string } (valid Mongo ObjectId)
 *   - req.user: authenticated admin user
 *   - Only accessible by ADMIN or SUPER_ADMIN
 */
export const tempRemoveUser = async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.length < 10)
    return next(
      getErrorObject("Reason must be at least 10 characters long.", 400),
    );

  if (!mongoose.isValidObjectId(id)) return next(getErrorObject("Invalid id."));
  if (id === req.user._id.toString())
    return next(getErrorObject("You cannot remove yourself."));

  try {
    let user = await User.findById(id);

    if (!user) return next(getErrorObject("User not found.", 404));
    if (user.isDeleted) return next(getErrorObject("User already banned."));
    if (user.role === req.user.role || user.role === "super_admin")
      return next(getErrorObject("You don't have this permission.", 409));

    user = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          isDeleted: true,
          deletedBy: req.user._id,
          deletedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )
      .select("_id isDeleted name email")
      .lean();

    const indexKey = `storageApp:user:${user._id}:session_index`;
    const sessions = await redisClient.sMembers(indexKey);
    if (sessions.length > 0) {
      await redisClient.sRem(indexKey, sessions);
      await redisClient.del(sessions);
      await redisClient.del(`storageApp:user:${id}:userdata`);
    }

    // Send account banned email
    sendAccountBannedEmail(user.name, user.email).catch((err) =>
      console.error("Email sending failed:", err),
    );

    return res.status(200).json({
      success: true,
      message: "User banned.",
      data: { user: { _id: user._id, isDeleted: user.isDeleted } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * path: /api/admin/user/:id/recover
 * what it do: Recover a soft-deleted user. Only SUPER_ADMIN can recover.
 * requirements:
 *   - req.params: { id: string } (valid Mongo ObjectId)
 *   - req.user: authenticated SUPER_ADMIN user
 */
export const recoverUser = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id) || id === req.user._id.toString())
    return next(getErrorObject("Invalid id."));
  if (req.user.role !== "super_admin")
    return next(getErrorObject("You don't have this permission.", 409));

  try {
    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false }, $unset: { deletedBy: "", deletedAt: "" } },
      { returnDocument: "after" },
    )
      .select("_id isDeleted name email")
      .lean();
    if (!user) return next(getErrorObject("User not found.", 404));

    // Send account recovered email
    sendAccountRecoveredEmail(user.name, user.email).catch((err) =>
      console.error("Email sending failed:", err),
    );

    return res.status(200).json({
      success: true,
      message: "User recovered.",
      data: { user: { _id: user._id, isDeleted: user.isDeleted } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * path: /api/admin/user/:id/delete
 * what it do: Permanently delete a user and all their data. Only SUPER_ADMIN can delete.
 * requirements:
 *   - req.params: { id: string } (valid Mongo ObjectId)
 *   - req.user: authenticated SUPER_ADMIN user
 */
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id) || id === req.user._id.toString())
    return next(getErrorObject("Invalid id."));

  if (req.user.role !== "super_admin")
    return next(getErrorObject("You don't have this permission.", 409));

  try {
    const user = await User.findById(id)
      .select("_id avatarKey avatarVersionId")
      .lean();
    if (!user) return next(getErrorObject("User not found.", 404));

    const files = await UserFile.find({ userId: user._id })
      .select("key thumbnailKey versionId thumbId")
      .lean();

    const v = new Map();
    const th = new Map();
    files.forEach((f) => {
      if (f.key) v.set(f.key, { key: f.key, id: f.versionId });
      if (f.thumbnailKey)
        th.set(f.thumbnailKey, { key: f.thumbnailKey, id: f.thumbId });
    });

    const filesToDelete = Array.from(v.values());
    const thumbnailsToDelete = Array.from(th.values());

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Promise.all([
          User.deleteOne({ _id: user._id }).session(session),
          Directory.deleteMany({ userId: user._id }).session(session),
          UserFile.deleteMany({ userId: user._id }).session(session),
          Permission.deleteMany({ userId: user._id }).session(session),
        ]);
      });
    } finally {
      await session.endSession();
    }

    if (user.avatarKey) {
      await deleteS3Objects(
        [{ key: user.avatarKey, id: user.avatarVersionId }],
        true,
      ).catch((err) => console.error("S3 Deletion failed:", err));
    }

    if (filesToDelete.length > 0) {
      await deleteS3Objects(filesToDelete).catch((err) =>
        console.error("S3 Deletion failed:", err),
      );
    }

    if (thumbnailsToDelete.length > 0) {
      await deleteS3Objects(thumbnailsToDelete, true).catch((err) =>
        console.error("S3 Deletion failed:", err),
      );
    }

    const indexKey = `storageApp:user:${user._id}:session_index`;
    const sessions = await redisClient.sMembers(indexKey);
    if (sessions.length > 0) {
      await redisClient.sRem(indexKey, sessions);
      await redisClient.del(sessions);
      await redisClient.del(`storageApp:user:${user._id}:userdata`);
    }

    return res.status(200).json({
      success: true,
      message: "User deleted permanently and no longer available.",
      data: { user: { _id: user._id } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * path: /api/admin/user/:id/email
 * what it do: Send a direct email to a user from the admin.
 */
export const sendUserEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body || {};

    const cleanSubject = typeof subject === "string" ? subject.trim() : "";
    const cleanMessage = typeof message === "string" ? message.trim() : "";

    if (cleanSubject.length < 3)
      return next(getErrorObject("Subject must be at least 3 characters."));
    if (cleanSubject.length > 200)
      return next(getErrorObject("Subject cannot exceed 200 characters."));
    if (cleanMessage.length < 10)
      return next(getErrorObject("Message must be at least 10 characters."));
    if (cleanMessage.length > 10000)
      return next(getErrorObject("Message cannot exceed 10000 characters."));
    if (!mongoose.isValidObjectId(id))
      return next(getErrorObject("Invalid user id."));

    const user = await User.findById(id).select("name email").lean();
    if (!user) return next(getErrorObject("User not found.", 404));

    if (req.user._id.toString() === user._id.toString())
      return next(getErrorObject("You cannot send an email to yourself.", 400));

    await sendAdminDirectEmail(user, cleanSubject, cleanMessage);

    return res.status(200).json({
      success: true,
      message: "Email sent to the user.",
    });
  } catch (err) {
    next(err);
  }
};
