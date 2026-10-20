import express from "express";
import {
  activateUserProfile,
  changeUserPassword,
  deleteUserProfile,
  getNotificationsList,
  getTeamList,
  loginUser,
  logoutUser,
  markNotificationRead,
  registerUser,
  resetUserPassword,
  updateUserProfile,
} from "../controllers/userController.js";
import { isAdminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", logoutUser);

// only a logged-in ADMIN can create users (old code let anybody register as admin)
router.post("/register", protectRoute, isAdminRoute, registerUser);

router.get("/get-team", protectRoute, isAdminRoute, getTeamList);
router.get("/notifications", protectRoute, getNotificationsList);

router.put("/profile", protectRoute, updateUserProfile);
router.put("/read-noti", protectRoute, markNotificationRead);
router.put("/change-password", protectRoute, changeUserPassword);

// ADMIN ONLY
router.put("/reset-password/:id", protectRoute, isAdminRoute, resetUserPassword);
router
  .route("/:id")
  .put(protectRoute, isAdminRoute, activateUserProfile)
  .delete(protectRoute, isAdminRoute, deleteUserProfile);

export default router;
