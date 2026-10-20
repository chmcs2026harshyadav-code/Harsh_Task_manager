import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorHandler, routeNotFound } from "./middleware/errorMiddleware.js";
import { protectRoute } from "./middleware/authMiddleware.js";
import routes from "./routes/index.js";
import dbConnection from "./utils/connectDB.js";
import { UPLOAD_DIR } from "./utils/files.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in server/.env");
  process.exit(1);
}

dbConnection();

const port = process.env.PORT || 8800;

const app = express();

const origins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: [...origins, "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Uploaded images are stored on YOUR server (server/uploads) and are only
// visible to logged-in users.
app.use("/uploads", protectRoute, express.static(UPLOAD_DIR));

app.use("/api", routes);

app.use(routeNotFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server listening on ${port}`));
