import { Queue, Worker } from "bullmq";
import { User } from "../models/user.model.js";
import { UserFile } from "../models/user_file.model.js";
import { Directory } from "../models/directory.model.js";
import { redisClient } from "../configs/redis.js";
import { invalidateUser } from "../utils/responseCache.js";
import { deleteS3Objects } from "../services/s3Client.js";
import { createNotification } from "../services/notificationService.js";
import { getBandwidthResetAt } from "../utils/bandwidthWindow.js";
import { fileURLToPath, pathToFileURL } from "node:url";
import connectMongoose from "../configs/connect.js";

function parseRedisUrl() {
  const url = process.env.REDIS_URL;
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname || "127.0.0.1",
        port: Number(parsed.port) || 6379,
        password: parsed.password || undefined,
      };
    } catch { /* fall through to individual vars */ }
  }
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

const redisConnection = parseRedisUrl();

export const backgroundQueue = new Queue("StorageApp-Cron-Queue", {
  connection: redisConnection,
});

let worker = null;
let workerStarted = false;

export const startBullMQWorker = () => {
  if (workerStarted) return worker;
  workerStarted = true;

  worker = new Worker(
    "StorageApp-Cron-Queue",
    async (job) => {
    try {
      const now = new Date();
      switch (job.name) {
        case "trash-collector":
          // console.log("Running Trash Collector...");
          const [expiredFiles, expiredDirs] = await Promise.all([
            UserFile.find({
              isDeleted: true,
              permanentDeleteAt: { $lte: now },
            }).lean(),
            Directory.find({
              isDeleted: true,
              permanentDeleteAt: { $lte: now },
            }).lean(),
          ]);

          if (expiredFiles.length === 0 && expiredDirs.length === 0) break;

          const tcDirectoryBulkOps = [];
          const tcFileBulkOps = [];
          const tcDirBulkOps = [];
          const tcS3KeysToDelete = [];
          const tcThumbKeysToDelete = [];
          const expiredFileIds = expiredFiles.map((f) => f._id);
          const tcUniqueKeys = new Map();
          const tcUniqueThumbs = new Map();

          for (const file of expiredFiles) {
            if (file.key && !tcUniqueKeys.has(file.key))
              tcUniqueKeys.set(file.key, { key: file.key, id: file.versionId });
            if (file.thumbnailKey && !tcUniqueThumbs.has(file.thumbnailKey))
              tcUniqueThumbs.set(file.thumbnailKey, {
                key: file.thumbnailKey,
                id: file.thumbId,
              });
            if (file.path && file.path.length > 0) {
              // Trashed bytes stay counted on the root until purge; 
              // non-root folders were already de-counted when the item was trashed.
              tcDirectoryBulkOps.push({
                updateMany: {
                  filter: { _id: file.path[0] },
                  update: [
                    {
                      $set: {
                        size: {
                          $max: [0, { $subtract: ["$size", file.size] }],
                        },
                      },
                    },
                  ],
                  updatePipeline: true,
                },
              });
            }
            tcFileBulkOps.push({ deleteOne: { filter: { _id: file._id } } });
          }

          for (const dir of expiredDirs) {
            tcDirBulkOps.push({ deleteOne: { filter: { _id: dir._id } } });
          }

          const tcKeysToCheck = Array.from(tcUniqueKeys.keys());
          const tcThumbKeysToCheck = Array.from(tcUniqueThumbs.keys());

          const [tcOtherFilesWithKeys, tcOtherFilesWithThumbs] =
            await Promise.all([
              tcKeysToCheck.length > 0
                ? UserFile.find({
                    key: { $in: tcKeysToCheck },
                    _id: { $nin: expiredFileIds },
                  })
                    .select("key")
                    .lean()
                : Promise.resolve([]),
              tcThumbKeysToCheck.length > 0
                ? UserFile.find({
                    thumbnailKey: { $in: tcThumbKeysToCheck },
                    _id: { $nin: expiredFileIds },
                  })
                    .select("thumbnailKey")
                    .lean()
                : Promise.resolve([]),
            ]);

          const tcKeysWithOtherCopies = new Set(
            tcOtherFilesWithKeys.map((f) => f.key),
          );
          const tcThumbsWithOtherCopies = new Set(
            tcOtherFilesWithThumbs.map((f) => f.thumbnailKey),
          );

          for (const key of tcKeysToCheck) {
            if (!tcKeysWithOtherCopies.has(key))
              tcS3KeysToDelete.push(tcUniqueKeys.get(key));
          }
          for (const key of tcThumbKeysToCheck) {
            if (!tcThumbsWithOtherCopies.has(key))
              tcThumbKeysToDelete.push(tcUniqueThumbs.get(key));
          }

          if (tcS3KeysToDelete.length > 0)
            await deleteS3Objects(tcS3KeysToDelete);
          if (tcThumbKeysToDelete.length > 0)
            await deleteS3Objects(tcThumbKeysToDelete, true);

          if (tcFileBulkOps.length > 0) {
            await Directory.bulkWrite(tcDirectoryBulkOps);
            await UserFile.bulkWrite(tcFileBulkOps);
          }
          if (tcDirBulkOps.length > 0) await Directory.bulkWrite(tcDirBulkOps);

          const deletedByUser = new Map();
          const trackDeleted = (item, kind) => {
            const key = item.userId.toString();
            const entry = deletedByUser.get(key) || {
              files: 0,
              dirs: 0,
              names: [],
            };
            entry[kind]++;
            if (entry.names.length < 3) entry.names.push(item.name);
            deletedByUser.set(key, entry);
          };
          for (const file of expiredFiles) trackDeleted(file, "files");
          for (const dir of expiredDirs) trackDeleted(dir, "dirs");

          await Promise.all(
            Array.from(deletedByUser.entries()).map(([userId, entry]) => {
              const parts = [];
              if (entry.files)
                parts.push(
                  `${entry.files} file${entry.files !== 1 ? "s" : ""}`,
                );
              if (entry.dirs)
                parts.push(
                  `${entry.dirs} folder${entry.dirs !== 1 ? "s" : ""}`,
                );
              const suffix = entry.names.length
                ? ` (e.g., ${entry.names.join(", ")})`
                : "";
              return Promise.all([
                invalidateUser(userId),
                createNotification({
                  userId,
                  type: "storage_warning",
                  title: "Items permanently deleted",
                  message: `${parts.join(" and ")} permanently deleted from your Bin${suffix}.`,
                  link: "/bin",
                }),
              ]);
            }),
          );

          console.log(
            `🗑️ Permanently deleted ${expiredFiles.length} files, ${expiredDirs.length} directories.`,
          );
          break;

        case "quota-reaper":
          // console.log("Running Quota Reaper...");
          const usersOverQuota = await User.find({
            gracePeriodEndsAt: { $lte: now },
          }).populate("root", "size");

          for (const user of usersOverQuota) {
            let currentSize = user.root?.size || 0;
            if (currentSize <= user.maxQuota) {
              await User.findByIdAndUpdate(user._id, {
                $unset: { gracePeriodEndsAt: 1 },
              });
              continue;
            }

            const oldestFiles = await UserFile.find({
              userId: user._id,
              isDeleted: false,
            }).sort({ createdAt: 1 });

            const filesToReap = [];
            for (const file of oldestFiles) {
              if (currentSize <= user.maxQuota) break;
              filesToReap.push(file);
              currentSize -= file.size;
            }

            const reapIds = filesToReap.map((f) => f._id);
            const qrDirectoryBulkOps = [];
            const qrFileBulkOps = [];
            const qrS3KeysToDelete = [];
            const qrThumbKeysToDelete = [];
            const qrUniqueKeys = new Map();
            const qrUniqueThumbs = new Map();

            for (const file of filesToReap) {
              if (file.key && !qrUniqueKeys.has(file.key))
                qrUniqueKeys.set(file.key, { key: file.key, id: file.versionId });
              if (file.thumbnailKey && !qrUniqueThumbs.has(file.thumbnailKey))
                qrUniqueThumbs.set(file.thumbnailKey, {
                  key: file.thumbnailKey,
                  id: file.thumbId,
                });

              // Quota-reaper deletes LIVE files: every ancestor (incl. root)
              // still counts the bytes, so debit the full path — clamped so a
              // stray stored value can never be driven below zero.
              qrDirectoryBulkOps.push({
                updateMany: {
                  filter: { _id: { $in: file.path } },
                  update: [
                    {
                      $set: {
                        size: {
                          $max: [0, { $subtract: ["$size", file.size] }],
                        },
                      },
                    },
                  ],
                  updatePipeline: true,
                },
              });

              qrFileBulkOps.push({
                deleteOne: { filter: { _id: file._id } },
              });
            }

            const qrKeysToCheck = Array.from(qrUniqueKeys.keys());
            const qrThumbKeysToCheck = Array.from(qrUniqueThumbs.keys());

            const [qrOtherFilesWithKeys, qrOtherFilesWithThumbs] =
              await Promise.all([
                qrKeysToCheck.length > 0
                  ? UserFile.find({
                      key: { $in: qrKeysToCheck },
                      _id: { $nin: reapIds },
                    })
                      .select("key")
                      .lean()
                  : Promise.resolve([]),
                qrThumbKeysToCheck.length > 0
                  ? UserFile.find({
                      thumbnailKey: { $in: qrThumbKeysToCheck },
                      _id: { $nin: reapIds },
                    })
                      .select("thumbnailKey")
                      .lean()
                  : Promise.resolve([]),
              ]);

            const qrKeysWithOtherCopies = new Set(
              qrOtherFilesWithKeys.map((f) => f.key),
            );
            const qrThumbsWithOtherCopies = new Set(
              qrOtherFilesWithThumbs.map((f) => f.thumbnailKey),
            );

            for (const key of qrKeysToCheck) {
              if (!qrKeysWithOtherCopies.has(key))
                qrS3KeysToDelete.push(qrUniqueKeys.get(key));
            }
            for (const key of qrThumbKeysToCheck) {
              if (!qrThumbsWithOtherCopies.has(key))
                qrThumbKeysToDelete.push(qrUniqueThumbs.get(key));
            }

            if (qrS3KeysToDelete.length > 0) {
              await deleteS3Objects(qrS3KeysToDelete);
            }

            if (qrThumbKeysToDelete.length > 0) {
              await deleteS3Objects(qrThumbKeysToDelete, true);
            }

            if (qrDirectoryBulkOps.length > 0) {
              await Directory.bulkWrite(qrDirectoryBulkOps);
              await UserFile.bulkWrite(qrFileBulkOps);
            }

            await User.findByIdAndUpdate(user._id, {
              $unset: { gracePeriodEndsAt: 1 },
            });
            await redisClient.del(`storageApp:user:${user._id}:userdata`);
            await invalidateUser(user._id);

            await createNotification({
              userId: user._id,
              type: "storage_warning",
              title: "Files removed due to storage limit",
              message:
                "Some of your oldest files were deleted because you exceeded your storage limit.",
              link: "/settings",
            });
          }
          break;

        case "bandwidth-reset":
          // console.log("Running Bandwidth Reset...");
          // Per-user rolling 30-day window: due when the window expired, plus a
          // one-time backfill for legacy users who already used bandwidth but
          // never got a reset timestamp.
          const dueUsers = await User.find(
            {
              $or: [
                { bandwidthResetAt: null, usedBandwidthQuota: { $gt: 0 } },
                { bandwidthResetAt: { $lte: now } },
              ],
            },
            { _id: 1 },
          ).lean();
          await User.updateMany(
            {
              $or: [
                { bandwidthResetAt: null, usedBandwidthQuota: { $gt: 0 } },
                { bandwidthResetAt: { $lte: now } },
              ],
            },
            {
              $set: {
                usedBandwidthQuota: 0,
                bandwidthResetAt: getBandwidthResetAt(),
              },
            },
          );
          await Promise.all(
            dueUsers.map((u) =>
              redisClient.del(`storageApp:user:${u._id}:userdata`),
            ),
          );
          await Promise.all(dueUsers.map((u) => invalidateUser(u._id)));
          await Promise.all(
            dueUsers.map((u) =>
              createNotification({
                userId: u._id,
                type: "system",
                title: "Bandwidth quota reset",
                message:
                  "Your 30-day bandwidth quota has been reset. Enjoy fresh download bandwidth!",
                link: "/",
              }),
            ),
          );
          console.log(`Reset bandwidth quota for ${dueUsers.length} users.`);
          break;

        case "share-token-invalidator":
          // console.log("Running Token Invalidator...");
          const query = [
            {
              shareTokenExpiresAt: { $lt: now },
              shareToken: { $exists: true },
            },
            {
              $unset: {
                shareToken: 1,
                shareTokenExpiresAt: 1,
                publicRole: 1,
                shareLink: 1,
              },
            },
          ];
          const [dir, file] = await Promise.all([
            Directory.updateMany(...query),
            UserFile.updateMany(...query),
          ]);
          console.log(
            `shareTokens are invalidated for ${dir.modifiedCount} dirs & ${file.modifiedCount} files`,
          );

          break;

        case "active-users-sweeper": {
          // console.log("Running Active Users Sweeper...");
          const cutoff = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
          await redisClient.zRemRangeByScore(
            "storageApp:active_users",
            0,
            `(${cutoff}`,
          );
          break;
        }

        case "session-reaper": {
          // Reclaim expired upload/import sessions (version-delete orphans).
          const sessionPatterns = [
            "storageApp:user:*:upload:*",
            "storageApp:user:*:import:*",
          ];
          let reclaimedKeys = 0;

          for (const pattern of sessionPatterns) {
            let cursor = 0;
            do {
              const { cursor: nextCursor, keys } = await redisClient.scan(
                cursor,
                { MATCH: pattern, COUNT: 100 },
              );
              cursor = Number(nextCursor);

              for (const sessionKey of keys) {
                try {
                  const record = await redisClient.json.get(sessionKey);
                  if (
                    !record ||
                    typeof record.expire !== "number" ||
                    record.expire >= Date.now()
                  ) {
                    continue;
                  }

                  if (record.status !== "completed") {
                    const fileFinalized =
                      record.s3ObjectCreated === true ||
                      record.status === "can_complete" ||
                      record.status === "failed";
                    if (record.key && (record.versionId || fileFinalized)) {
                      await deleteS3Objects([
                        { key: record.key, id: record.versionId },
                      ]);
                    }
                    if (record.thumbnailKey && record.thumbId) {
                      await deleteS3Objects(
                        [{ key: record.thumbnailKey, id: record.thumbId }],
                        true,
                      );
                    }
                  }
                  await redisClient.del(sessionKey);
                  reclaimedKeys += 1;
                } catch (err) {
                  console.error(
                    `session-reaper: failed to reclaim ${sessionKey}:`,
                    err.message,
                  );
                }
              }
            } while (cursor !== 0);
          }

          console.log(
            `Reclaimed ${reclaimedKeys} expired upload/import session(s).`,
          );
          break;
        }
      }
    } catch (error) {
      console.log("Error occured executing jobs!!", error.message);
      return error;
    }
  },
  { connection: redisConnection },
);

  worker.on("failed", (job, err) =>
    console.error(`Job ${job.name} failed:`, err),
  );

  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down BullMQ worker…`);
    await worker.close();
    process.exit(0);
  };

  process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.once("SIGINT", () => gracefulShutdown("SIGINT"));

  return worker;
};

let started = false;

// Trim finished jobs so BullMQ lists don't grow unbounded (Redis key buildup).
// Old completed/failed job records are dropped after 7 days, capped by count.
const JOB_OPTS = {
  removeOnComplete: { age: 7 * 24 * 3600, count: 100 },
  removeOnFail: { age: 7 * 24 * 3600, count: 200 },
};

export const startBullMQJobs = async () => {
  if (started) return;
  started = true;

  console.log("🚀 Initializing BullMQ Repeatable Jobs...");

  try {
    const repeatableJobs = await backgroundQueue.getJobSchedulers();
    for (const job of repeatableJobs) {
      await backgroundQueue.removeJobScheduler(job.key);
    }

    // 00:00 — Date-gated resets (bandwidth + stale tokens)
    await backgroundQueue.add(
      "share-token-invalidator",
      {},
      { ...JOB_OPTS, repeat: { pattern: "0 0 * * *" } }, // daily at midnight
    );
    await backgroundQueue.add(
      "bandwidth-reset",
      {},
      { ...JOB_OPTS, repeat: { pattern: "0 0 * * *" } }, // daily at midnight
    );
    // 01:00 — Trash collector (heavy, runs alone)
    await backgroundQueue.add(
      "trash-collector",
      {},
      { ...JOB_OPTS, repeat: { pattern: "0 1 * * *" } }, // daily at 1am
    );
    // 02:00 — Quota reaper (medium-heavy, after trash cleanup)
    await backgroundQueue.add(
      "quota-reaper",
      {},
      { ...JOB_OPTS, repeat: { pattern: "0 2 * * *" } }, // daily at 2am
    );
    // 03:00 — Active users sweep (light)
    await backgroundQueue.add(
      "active-users-sweeper",
      {},
      { ...JOB_OPTS, repeat: { pattern: "0 3 * * *" } }, // daily at 3am
    );
    // Every 30 min — Reap expired upload/import sessions. Orphaned S3 objects
    // are version-deleted, or hidden (versionless delete) for lifecycle purge.
    await backgroundQueue.add(
      "session-reaper",
      {},
      { ...JOB_OPTS, repeat: { pattern: "*/30 * * * *" } },
    );
    // Only start consuming AFTER schedulers are (re)registered
    startBullMQWorker();
  } catch (err) {
    console.error("Failed to initialize BullMQ repeatable jobs:", err);
    started = false;
  }
};

// Standalone entrypoint: `node jobs/queueJobs.js [scheduler|worker]`
// Run the worker on its own process to avoid duplicate execution when app.js is scaled across multiple instances.
const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const mode = process.argv[2] || process.env.QUEUE_MODE || "worker";
  await connectMongoose();
  if (mode === "scheduler") {
    await startBullMQJobs();
  } else {
    startBullMQWorker();
  }
}