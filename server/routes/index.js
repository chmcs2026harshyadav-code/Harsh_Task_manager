import express from "express";
import taskRoutes from "./taskRoute.js";
import userRoutes from "./userRoute.js";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/task", taskRoutes);

export default router;
