import { Router } from "express";
import {
  changeUserRole,
  deleteUser,
  getDashboardStats,
  getAllUsers,
  getSingleUser,
  logoutUser,
  recoverUser,
  sendUserEmail,
  tempRemoveUser,
  updateUserQuota,
} from "../controllers/adminControllers.js";
import { getUserStats } from "../controllers/userControllers.js";

const router = Router();

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);

router.get("/user/:id", getSingleUser);
router.get("/user/:id/storage", getUserStats);
router.post("/user/:id/email", sendUserEmail);

// super-admin can promote/demote all users, admins are restricted to user and guests
router.patch("/user/:id/role", changeUserRole);

//super-admin can logout all users, admins are restricted to user and guests
router.patch("/user/:id/logout", logoutUser);

//super-admin can soft-delete all users, admins are restricted to user and guests
router.patch("/user/:id/temp-remove", tempRemoveUser);

//super-admin only
router.patch("/user/:id/quota", updateUserQuota)
router.patch("/user/:id/recover", recoverUser);
router.delete("/user/:id/delete", deleteUser);

export default router;
