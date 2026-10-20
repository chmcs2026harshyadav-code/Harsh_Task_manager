import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const unauthorized = (res, message = "Not authorized. Try login again.") =>
  res.status(401).json({ status: false, message });

const protectRoute = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return unauthorized(res);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "isAdmin email isActive"
    );

    if (!user) return unauthorized(res);

    if (!user.isActive) {
      return unauthorized(
        res,
        "Your account has been deactivated. Contact the administrator."
      );
    }

    req.user = {
      email: user.email,
      isAdmin: user.isAdmin,
      userId: String(user._id),
    };

    next();
  } catch (error) {
    return unauthorized(res);
  }
});

const isAdminRoute = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next();

  return res.status(403).json({
    status: false,
    message: "Only admin can do this action.",
  });
};

export { isAdminRoute, protectRoute };
