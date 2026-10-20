import mongoose, { Schema } from "mongoose";

export const STAGES = ["todo", "in progress", "submitted", "completed"];
export const PRIORITIES = ["high", "medium", "normal", "low"];

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    // "date" is the DUE date of the task
    date: { type: Date, default: Date.now },
    priority: { type: String, default: "normal", enum: PRIORITIES },
    stage: { type: String, default: "todo", enum: STAGES },

    // timeline + comments
    activities: [
      {
        type: {
          type: String,
          default: "assigned",
          enum: [
            "assigned",
            "started",
            "in progress",
            "bug",
            "completed",
            "commented",
            "submitted",
            "rejected",
            "trashed",
            "restored",
          ],
        },
        activity: String,
        date: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],

    subTasks: [
      {
        title: String,
        date: Date,
        tag: String,
        isCompleted: Boolean,
      },
    ],

    description: String,
    assets: [String], // images attached while creating the task
    links: [String],
    team: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },

    // employee's work submission (note + proof photos)
    submission: {
      note: String,
      images: [String],
      submittedAt: Date,
      by: { type: Schema.Types.ObjectId, ref: "User" },
    },
    // admin's review feedback (when work is rejected / approved)
    reviewNote: String,
    completedAt: Date,

    isTrashed: { type: Boolean, default: false },
    trashedBy: { type: Schema.Types.ObjectId, ref: "User" },
    trashedAt: Date,
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
