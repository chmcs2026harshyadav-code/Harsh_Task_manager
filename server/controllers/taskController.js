import asyncHandler from "express-async-handler";
import Notice from "../models/notis.js";
import Task, { PRIORITIES, STAGES } from "../models/taskModel.js";
import User from "../models/userModel.js";
import {
  cleanAssetUrls,
  cleanLocalUploads,
  removeUploadedFiles,
} from "../utils/files.js";

/* ----------------------------- helpers ----------------------------- */

const fail = (res, code, message) =>
  res.status(code).json({ status: false, message });

const idOf = (x) => String(x?._id || x);

const isMember = (task, userId) =>
  (task.team || []).some((t) => idOf(t) === String(userId));

const canAccess = (task, user) => user.isAdmin || isMember(task, user.userId);

const EMPLOYEE_STAGES = ["todo", "in progress"];

const STAGE_ACTIVITY = {
  todo: "assigned",
  "in progress": "in progress",
  submitted: "submitted",
  completed: "completed",
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseLinks = (links) => {
  if (Array.isArray(links)) return links.map((l) => String(l).trim()).filter(Boolean);
  if (typeof links === "string" && links.trim()) {
    return links.split(",").map((l) => l.trim()).filter(Boolean);
  }
  return [];
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// send an in-app notification to some users
const notify = async (recipients, text, taskId, exceptUserId) => {
  const ids = [...new Set(recipients.map(idOf))].filter(
    (id) => id && id !== String(exceptUserId)
  );
  if (!ids.length) return;
  await Notice.create({ team: ids, text, task: taskId });
};

const getAdminIds = async () => {
  const admins = await User.find({ isAdmin: true, isActive: true }).select("_id");
  return admins.map((a) => a._id);
};

// Loads a task and checks that the current user may see it.
// Returns null (and already sent the response) when not allowed.
const loadTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    fail(res, 404, "Task not found.");
    return null;
  }
  if (!canAccess(task, req.user)) {
    fail(res, 403, "You do not have access to this task.");
    return null;
  }
  return task;
};

/* ------------------------------ create ------------------------------ */

const createTask = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { title, stage, date, priority, assets, links, description } = req.body;
  let { team } = req.body;

  if (!title || !String(title).trim()) {
    return fail(res, 400, "Task title is required.");
  }

  // employee can only create tasks for himself
  team = isAdmin ? (Array.isArray(team) ? team.map(idOf) : []) : [userId];
  if (!team.length) {
    return fail(res, 400, "Assign the task to at least one user.");
  }

  let taskStage = String(stage || "todo").toLowerCase();
  if (!STAGES.includes(taskStage)) taskStage = "todo";
  if (!isAdmin && !EMPLOYEE_STAGES.includes(taskStage)) taskStage = "todo";

  let taskPriority = String(priority || "normal").toLowerCase();
  if (!PRIORITIES.includes(taskPriority)) taskPriority = "normal";

  const creator = await User.findById(userId).select("name");

  const task = await Task.create({
    title,
    team,
    stage: taskStage,
    date: date || new Date(),
    priority: taskPriority,
    assets: cleanAssetUrls(assets),
    links: parseLinks(links),
    description,
    createdBy: userId,
    activities: [
      {
        type: "assigned",
        activity: isAdmin
          ? `Task created and assigned to ${team.length} user(s).`
          : "Task created.",
        by: userId,
      },
    ],
  });

  await User.updateMany({ _id: { $in: team } }, { $addToSet: { tasks: task._id } });

  await notify(
    team,
    `${creator?.name || "Admin"} assigned you a new task "${task.title}" (${taskPriority} priority, due ${new Date(
      task.date
    ).toDateString()}).`,
    task._id,
    userId
  );

  res
    .status(200)
    .json({ status: true, task, message: "Task created successfully." });
});

const duplicateTask = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const task = await Task.findById(req.params.id);
  if (!task) return fail(res, 404, "Task not found.");

  const newTask = await Task.create({
    title: "Duplicate - " + task.title,
    description: task.description,
    priority: task.priority,
    date: task.date,
    team: task.team,
    assets: task.assets,
    links: task.links,
    subTasks: task.subTasks.map((s) => ({
      title: s.title,
      date: s.date,
      tag: s.tag,
      isCompleted: false,
    })),
    stage: "todo",
    createdBy: userId,
    activities: [
      { type: "assigned", activity: "Task duplicated.", by: userId },
    ],
  });

  await User.updateMany(
    { _id: { $in: task.team } },
    { $addToSet: { tasks: newTask._id } }
  );
  await notify(task.team, `A new task "${newTask.title}" was assigned to you.`, newTask._id, userId);

  res.status(200).json({ status: true, message: "Task duplicated successfully." });
});

/* ------------------------------ update ------------------------------ */

const updateTask = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const task = await loadTask(req, res);
  if (!task) return;

  if (!isAdmin) {
    if (task.isTrashed) return fail(res, 400, "Restore the task before editing it.");
    if (["submitted", "completed"].includes(task.stage)) {
      return fail(res, 400, `A ${task.stage} task can not be edited.`);
    }
  }

  const { title, date, stage, priority, assets, links, description } = req.body;

  if (title !== undefined) {
    if (!String(title).trim()) return fail(res, 400, "Task title is required.");
    task.title = title;
  }
  if (date) task.date = date;
  if (priority && PRIORITIES.includes(String(priority).toLowerCase())) {
    task.priority = String(priority).toLowerCase();
  }
  if (description !== undefined) task.description = description;
  if (links !== undefined) task.links = parseLinks(links);

  if (assets !== undefined) {
    const next = cleanAssetUrls(assets);
    // delete files that were removed from the task
    removeUploadedFiles(task.assets.filter((a) => !next.includes(a)));
    task.assets = next;
  }

  if (stage) {
    const s = String(stage).toLowerCase();
    if (STAGES.includes(s) && (isAdmin || EMPLOYEE_STAGES.includes(s))) {
      if (s === "completed" && task.stage !== "completed") task.completedAt = new Date();
      task.stage = s;
    }
  }

  // only admin can re-assign
  let added = [];
  if (isAdmin && Array.isArray(req.body.team) && req.body.team.length) {
    const next = req.body.team.map(idOf);
    const prev = task.team.map(idOf);
    added = next.filter((id) => !prev.includes(id));
    const removed = prev.filter((id) => !next.includes(id));
    task.team = next;
    if (removed.length) await User.updateMany({ _id: { $in: removed } }, { $pull: { tasks: task._id } });
    if (next.length) await User.updateMany({ _id: { $in: next } }, { $addToSet: { tasks: task._id } });
  }

  await task.save();

  if (added.length) {
    await notify(added, `You were assigned to the task "${task.title}".`, task._id, userId);
  }

  res.status(200).json({ status: true, message: "Task updated successfully." });
});

const updateTaskStage = asyncHandler(async (req, res) => {
  const { isAdmin } = req.user;
  const task = await loadTask(req, res);
  if (!task) return;

  const stage = String(req.body.stage || "").toLowerCase();
  if (!STAGES.includes(stage)) return fail(res, 400, "Invalid stage.");

  if (!isAdmin) {
    if (task.isTrashed) return fail(res, 400, "This task is in trash.");
    if (!EMPLOYEE_STAGES.includes(stage)) {
      return fail(res, 403, "Use 'Submit for review' to finish your work. Only admin can complete a task.");
    }
    if (["submitted", "completed"].includes(task.stage)) {
      return fail(res, 400, `A ${task.stage} task can not be moved.`);
    }
  }

  task.stage = stage;
  if (stage === "completed") task.completedAt = new Date();
  task.activities.push({
    type: STAGE_ACTIVITY[stage],
    activity: `Stage changed to "${stage}".`,
    by: req.user.userId,
  });
  await task.save();

  res.status(200).json({ status: true, message: "Task stage changed successfully." });
});

/* ------------------- employee submit / admin review ------------------- */

const submitTask = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const task = await loadTask(req, res);
  if (!task) return;

  if (!isMember(task, userId)) {
    return fail(res, 403, "Only the assigned employee can submit this task.");
  }
  if (task.isTrashed) return fail(res, 400, "This task is in trash.");
  if (!EMPLOYEE_STAGES.includes(task.stage)) {
    return fail(res, 400, `This task is already ${task.stage}.`);
  }

  const note = String(req.body.note || "").trim();
  const images = cleanLocalUploads(req.body.images);

  if (!note) return fail(res, 400, "Please write what you did (work note).");

  // replacing an older (rejected) submission -> remove old photos
  if (task.submission?.images?.length) {
    removeUploadedFiles(task.submission.images.filter((i) => !images.includes(i)));
  }

  task.submission = { note, images, submittedAt: new Date(), by: userId };
  task.stage = "submitted";
  task.activities.push({ type: "submitted", activity: note, by: userId });
  await task.save();

  const me = await User.findById(userId).select("name");
  await notify(
    await getAdminIds(),
    `${me?.name || "An employee"} submitted "${task.title}" for review.`,
    task._id,
    userId
  );

  res.status(200).json({ status: true, message: "Work submitted for review." });
});

const reviewTask = asyncHandler(async (req, res) => {
  const { userId } = req.user; // route is admin-only
  const task = await Task.findById(req.params.id);
  if (!task) return fail(res, 404, "Task not found.");

  if (task.stage !== "submitted") {
    return fail(res, 400, "Only submitted tasks can be reviewed.");
  }

  const action = req.body.action;
  const remark = String(req.body.remark || "").trim();

  if (action === "approve") {
    task.stage = "completed";
    task.completedAt = new Date();
    task.reviewNote = remark;
    task.activities.push({
      type: "completed",
      activity: remark ? `Approved: ${remark}` : "Work approved and marked completed.",
      by: userId,
    });
    await task.save();
    await notify(task.team, `Your work on "${task.title}" was approved. Task completed!`, task._id, userId);
    return res.status(200).json({ status: true, message: "Task marked as completed." });
  }

  if (action === "reject") {
    if (!remark) return fail(res, 400, "Please write what needs to be corrected.");
    task.stage = "in progress";
    task.reviewNote = remark;
    task.activities.push({
      type: "rejected",
      activity: `Sent back: ${remark}`,
      by: userId,
    });
    await task.save();
    await notify(task.team, `"${task.title}" was sent back for changes: ${remark}`, task._id, userId);
    return res.status(200).json({ status: true, message: "Task sent back to the employee." });
  }

  return fail(res, 400, "Invalid action.");
});

/* ------------------------------- read ------------------------------- */

const buildListQuery = (req) => {
  const { userId, isAdmin } = req.user;
  const { stage, priority, search, assignee, due, isTrashed } = req.query;

  const and = [{ isTrashed: isTrashed === "true" }];

  if (!isAdmin) and.push({ team: userId });
  else if (assignee) and.push({ team: assignee });

  if (stage && STAGES.includes(stage)) and.push({ stage });
  if (priority && PRIORITIES.includes(priority)) and.push({ priority });

  if (due === "overdue") {
    and.push({ date: { $lt: startOfToday() }, stage: { $ne: "completed" } });
  } else if (due === "today") {
    const s = startOfToday();
    const e = new Date(s);
    e.setDate(e.getDate() + 1);
    and.push({ date: { $gte: s, $lt: e } });
  } else if (due === "week") {
    const s = startOfToday();
    const e = new Date(s);
    e.setDate(e.getDate() + 7);
    and.push({ date: { $gte: s, $lt: e } });
  }

  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    and.push({
      $or: [{ title: rx }, { description: rx }, { stage: rx }, { priority: rx }],
    });
  }

  return { $and: and };
};

const getTasks = asyncHandler(async (req, res) => {
  const sortKey = req.query.sort;
  const sort =
    sortKey === "due" ? { date: 1 } : sortKey === "oldest" ? { _id: 1 } : { _id: -1 };

  const tasks = await Task.find(buildListQuery(req))
    .populate({ path: "team", select: "name title email" })
    .sort(sort);

  res.status(200).json({ status: true, tasks });
});

const getTask = asyncHandler(async (req, res) => {
  const found = await loadTask(req, res);
  if (!found) return;

  const task = await Task.findById(req.params.id)
    .populate({ path: "team", select: "name title role email" })
    .populate({ path: "createdBy", select: "name" })
    .populate({ path: "submission.by", select: "name" })
    .populate({ path: "activities.by", select: "name" });

  res.status(200).json({ status: true, task });
});

/* ----------------------- comments / sub-tasks ----------------------- */

const postTaskActivity = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const task = await loadTask(req, res);
  if (!task) return;

  const text = String(req.body.activity || "").trim();
  if (!text) return fail(res, 400, "Comment can not be empty.");
  if (text.length > 1000) return fail(res, 400, "Comment is too long (max 1000 characters).");

  task.activities.push({ type: "commented", activity: text, by: userId });
  await task.save();

  const me = await User.findById(userId).select("name");
  const recipients = isAdmin ? task.team : [...task.team, ...(await getAdminIds())];
  await notify(recipients, `${me?.name || "Someone"} commented on "${task.title}".`, task._id, userId);

  res.status(200).json({ status: true, message: "Comment added." });
});

const createSubTask = asyncHandler(async (req, res) => {
  const task = await loadTask(req, res);
  if (!task) return;

  const title = String(req.body.title || "").trim();
  if (!title) return fail(res, 400, "Sub-task title is required.");

  task.subTasks.push({
    title,
    date: req.body.date || new Date(),
    tag: req.body.tag || "",
    isCompleted: false,
  });
  await task.save();

  res.status(200).json({ status: true, message: "SubTask added successfully." });
});

const updateSubTaskStage = asyncHandler(async (req, res) => {
  const { taskId, subTaskId } = req.params;
  const task = await Task.findById(taskId);
  if (!task) return fail(res, 404, "Task not found.");
  if (!canAccess(task, req.user)) return fail(res, 403, "You do not have access to this task.");

  const sub = task.subTasks.id(subTaskId);
  if (!sub) return fail(res, 404, "Sub-task not found.");

  sub.isCompleted = !!req.body.status;
  await task.save();

  res.status(200).json({
    status: true,
    message: sub.isCompleted
      ? "Sub-task marked as done."
      : "Sub-task marked as not done.",
  });
});

/* ----------------------------- trash / delete ----------------------------- */

const trashTask = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const task = await loadTask(req, res);
  if (!task) return;

  if (task.isTrashed) return fail(res, 400, "Task is already in trash.");

  task.isTrashed = true;
  task.trashedBy = userId;
  task.trashedAt = new Date();
  task.activities.push({ type: "trashed", activity: "Moved to trash.", by: userId });
  await task.save();

  const me = await User.findById(userId).select("name");
  await notify(
    isAdmin ? task.team : await getAdminIds(),
    `${me?.name || "Someone"} moved "${task.title}" to trash.`,
    task._id,
    userId
  );

  res.status(200).json({ status: true, message: "Task moved to trash." });
});

const deleteTasksForever = async (tasks) => {
  if (!tasks.length) return;
  const ids = tasks.map((t) => t._id);
  tasks.forEach((t) =>
    removeUploadedFiles([...(t.assets || []), ...(t.submission?.images || [])])
  );
  await Task.deleteMany({ _id: { $in: ids } });
  await User.updateMany({ tasks: { $in: ids } }, { $pull: { tasks: { $in: ids } } });
  await Notice.deleteMany({ task: { $in: ids } });
};

const deleteRestoreTask = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { id } = req.params;
  const { actionType } = req.query;

  if (actionType === "delete" || actionType === "deleteAll") {
    if (!isAdmin) {
      return fail(res, 403, "Only admin can delete tasks permanently.");
    }
    const tasks =
      actionType === "delete"
        ? await Task.find({ _id: id, isTrashed: true })
        : await Task.find({ isTrashed: true });
    await deleteTasksForever(tasks);
    return res.status(200).json({ status: true, message: "Deleted permanently." });
  }

  if (actionType === "restore") {
    const task = await loadTask(req, res);
    if (!task) return;
    if (!task.isTrashed) return fail(res, 400, "Task is not in trash.");
    task.isTrashed = false;
    task.trashedBy = undefined;
    task.trashedAt = undefined;
    task.activities.push({ type: "restored", activity: "Restored from trash.", by: userId });
    await task.save();
    return res.status(200).json({ status: true, message: "Task restored." });
  }

  if (actionType === "restoreAll") {
    await Task.updateMany(
      isAdmin ? { isTrashed: true } : { isTrashed: true, team: userId },
      { $set: { isTrashed: false }, $unset: { trashedBy: "", trashedAt: "" } }
    );
    return res.status(200).json({ status: true, message: "All tasks restored." });
  }

  return fail(res, 400, "Invalid action.");
});

/* ----------------------------- dashboard ----------------------------- */

const dashboardStatistics = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;

  const filter = isAdmin ? { isTrashed: false } : { isTrashed: false, team: userId };

  const allTasks = await Task.find(filter)
    .populate({ path: "team", select: "name role title email" })
    .sort({ _id: -1 });

  const today = startOfToday();
  const isOverdue = (t) => t.stage !== "completed" && new Date(t.date) < today;

  const groupedTasks = {};
  const prio = {};
  allTasks.forEach((t) => {
    groupedTasks[t.stage] = (groupedTasks[t.stage] || 0) + 1;
    prio[t.priority] = (prio[t.priority] || 0) + 1;
  });

  const graphData = Object.entries(prio).map(([name, total]) => ({ name, total }));

  const open = allTasks.filter((t) => t.stage !== "completed");

  const summary = {
    totalTasks: allTasks.length,
    overdue: allTasks.filter(isOverdue).length,
    tasks: groupedTasks,
    graphData,
    last10Task: allTasks.slice(0, 10),
    upcoming: [...open]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
    pendingReview: allTasks.filter((t) => t.stage === "submitted").slice(0, 6),
    users: [],
    totalUsers: 0,
  };

  if (isAdmin) {
    summary.users = await User.find({ isActive: true })
      .select("name title role isActive isAdmin createdAt")
      .limit(8)
      .sort({ _id: -1 });
    summary.totalUsers = await User.countDocuments({ isActive: true });
  }

  res.status(200).json({ status: true, ...summary });
});

/* ------------------------------- upload ------------------------------- */

const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) return fail(res, 400, "No image selected.");

  res.status(200).json({
    status: true,
    urls: files.map((f) => `/uploads/${f.filename}`),
  });
});

export {
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
};
