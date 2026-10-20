import express from "express";
import {
  createSubTask,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  postTaskActivity,
  reviewTask,
  submitTask,
  trashTask,
  updateSubTaskStage,
  updateTask,
  updateTaskStage,
  uploadImages,
} from "../controllers/taskController.js";
import { isAdminRoute, protectRoute } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// every route needs login; extra checks (who can touch which task) are in the controller
router.use(protectRoute);

router.post("/upload", upload.array("images", 6), uploadImages);

router.post("/create", createTask);
router.post("/duplicate/:id", isAdminRoute, duplicateTask);
router.post("/activity/:id", postTaskActivity);
router.post("/submit/:id", submitTask);

router.get("/dashboard", dashboardStatistics);
router.get("/", getTasks);
router.get("/:id", getTask);

router.put("/review/:id", isAdminRoute, reviewTask);
router.put("/trash/:id", trashTask);
router.put("/create-subtask/:id", createSubTask);
router.put("/update/:id", updateTask);
router.put("/change-stage/:id", updateTaskStage);
router.put("/change-status/:taskId/:subTaskId", updateSubTaskStage);

router.delete("/delete-restore/:id?", deleteRestoreTask);

export default router;
