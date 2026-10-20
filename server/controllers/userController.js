import asyncHandler from "express-async-handler";
import Notice from "../models/notis.js";
import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import createJWT from "../utils/index.js";

const fail = (res, code, message) =>
  res.status(code).json({ status: false, message });

// POST - login
const loginUser = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return fail(res, 401, "Invalid email or password.");
  }

  if (!user.isActive) {
    return fail(
      res,
      401,
      "User account has been deactivated, contact the administrator."
    );
  }

  createJWT(res, user._id);

  user.password = undefined;
  res.status(200).json(user);
});

// POST - create a new user (ADMIN ONLY - see routes)
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin, role, title } = req.body;

  if (!name || !email || !password || !role || !title) {
    return fail(res, 400, "Name, email, title, role and password are required.");
  }
  if (String(password).length < 6) {
    return fail(res, 400, "Password must be at least 6 characters.");
  }

  const userExists = await User.findOne({
    email: String(email).toLowerCase().trim(),
  });

  if (userExists) return fail(res, 400, "Email address already exists");

  const user = await User.create({
    name,
    email,
    password,
    isAdmin: !!isAdmin,
    role,
    title,
  });

  user.password = undefined;
  res.status(201).json(user);
});

// POST - logout
const logoutUser = (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Logged out successfully" });
};

// GET - team list (admin) with task counts per user
const getTeamList = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = {};

  if (search) {
    const s = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query = {
      $or: [
        { title: { $regex: s, $options: "i" } },
        { name: { $regex: s, $options: "i" } },
        { role: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
      ],
    };
  }

  const users = await User.find(query)
    .select("name title role email isActive isAdmin createdAt")
    .sort({ createdAt: -1 })
    .lean();

  // task counts per user (only non-trashed tasks)
  const counts = await Task.aggregate([
    { $match: { isTrashed: false } },
    { $unwind: "$team" },
    { $group: { _id: { user: "$team", stage: "$stage" }, n: { $sum: 1 } } },
  ]);

  const map = {};
  counts.forEach(({ _id, n }) => {
    const key = String(_id.user);
    map[key] = map[key] || {};
    map[key][_id.stage] = n;
  });

  const result = users.map((u) => ({
    ...u,
    counts: {
      todo: map[String(u._id)]?.["todo"] || 0,
      inProgress: map[String(u._id)]?.["in progress"] || 0,
      submitted: map[String(u._id)]?.["submitted"] || 0,
      completed: map[String(u._id)]?.["completed"] || 0,
    },
  }));

  res.status(200).json(result);
});

// GET - my notifications
const getNotificationsList = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const notice = await Notice.find({
    team: userId,
    isRead: { $nin: [userId] },
  })
    .populate("task", "title")
    .sort({ _id: -1 })
    .limit(50);

  res.status(200).json(notice);
});

// PUT - mark notification(s) as read
const markNotificationRead = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { isReadType, id } = req.query;

  if (isReadType === "all") {
    await Notice.updateMany(
      { team: userId, isRead: { $nin: [userId] } },
      { $push: { isRead: userId } }
    );
  } else if (id) {
    await Notice.findOneAndUpdate(
      { _id: id, isRead: { $nin: [userId] } },
      { $push: { isRead: userId } }
    );
  }

  res.status(200).json({ status: true, message: "Done" });
});

// PUT - update profile (own profile, admin can update anyone)
const updateUserProfile = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { _id } = req.body;

  const id = isAdmin && _id ? _id : userId;

  const user = await User.findById(id);
  if (!user) return fail(res, 404, "User not found");

  user.name = req.body.name || user.name;
  user.title = req.body.title || user.title;
  user.role = req.body.role || user.role;

  // only an admin may change admin flag, and never for himself
  if (isAdmin && typeof req.body.isAdmin === "boolean" && id !== userId) {
    user.isAdmin = req.body.isAdmin;
  }

  const updatedUser = await user.save();
  updatedUser.password = undefined;

  res.status(200).json({
    status: true,
    message: "Profile Updated Successfully.",
    user: updatedUser,
  });
});

// PUT - activate / deactivate (admin)
const activateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user.userId) {
    return fail(res, 400, "You can not deactivate your own account.");
  }

  const user = await User.findById(id);
  if (!user) return fail(res, 404, "User not found");

  user.isActive = !!req.body.isActive;
  await user.save();

  res.status(200).json({
    status: true,
    message: `User account has been ${user.isActive ? "activated" : "disabled"}`,
  });
});

// PUT - change my own password
const changeUserPassword = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { password, currentPassword } = req.body;

  if (!password || String(password).length < 6) {
    return fail(res, 400, "New password must be at least 6 characters.");
  }

  const user = await User.findById(userId);
  if (!user) return fail(res, 404, "User not found");

  if (!currentPassword || !(await user.matchPassword(currentPassword))) {
    return fail(res, 400, "Current password is wrong.");
  }

  user.password = password;
  await user.save();

  res
    .status(200)
    .json({ status: true, message: "Password changed successfully." });
});

// PUT - admin sets a new password for a user
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || String(password).length < 6) {
    return fail(res, 400, "Password must be at least 6 characters.");
  }

  const user = await User.findById(id);
  if (!user) return fail(res, 404, "User not found");

  user.password = password;
  await user.save();

  res
    .status(200)
    .json({ status: true, message: `Password reset for ${user.name}.` });
});

// DELETE - delete a user (admin)
const deleteUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user.userId) {
    return fail(res, 400, "You can not delete your own account.");
  }

  await User.findByIdAndDelete(id);
  // remove the user from all tasks
  await Task.updateMany({ team: id }, { $pull: { team: id } });

  res.status(200).json({ status: true, message: "User deleted successfully" });
});

export {
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
};
