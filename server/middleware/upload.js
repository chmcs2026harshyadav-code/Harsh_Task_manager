import crypto from "crypto";
import multer from "multer";
import path from "path";
import { UPLOAD_DIR } from "../utils/files.js";

const ALLOWED = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // 5 MB each, max 6 files
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype.startsWith("image/") && ALLOWED.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error("Only image files (jpg, png, webp, gif) are allowed."));
  },
});

export default upload;
