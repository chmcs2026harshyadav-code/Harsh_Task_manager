import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Delete locally stored files (urls look like "/uploads/abc.png").
// Remote urls (old firebase links etc.) are ignored.
export const removeUploadedFiles = (urls = []) => {
  for (const url of urls) {
    if (typeof url !== "string" || !url.startsWith("/uploads/")) continue;
    const file = path.basename(url);
    const full = path.join(UPLOAD_DIR, file);
    fs.promises.unlink(full).catch(() => {});
  }
};

// Keep only safe urls: our own uploads, or (for old data) normal http(s) links
export const cleanAssetUrls = (urls) =>
  (Array.isArray(urls) ? urls : []).filter(
    (u) =>
      typeof u === "string" &&
      (/^\/uploads\/[\w.\-]+$/.test(u) || /^https?:\/\//.test(u))
  );

// Only our own uploads (used for work-submission photos)
export const cleanLocalUploads = (urls) =>
  (Array.isArray(urls) ? urls : []).filter(
    (u) => typeof u === "string" && /^\/uploads\/[\w.\-]+$/.test(u)
  );
