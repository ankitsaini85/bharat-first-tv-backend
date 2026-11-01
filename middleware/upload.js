const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { isObjectStorageEnabled } = require("../config/r2");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const buildFilename = (file) => {
  const ext = path.extname(file.originalname);
  const base = path
    .basename(file.originalname, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 40);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${base}${ext}`;
};

// When Cloudflare R2 object storage is enabled, keep the file in memory so it
// can be streamed straight to the bucket instead of touching local disk.
const storage = isObjectStorageEnabled()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => cb(null, buildFilename(file)),
    });

const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|webm|avi|mkv/;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");
  if ((isImage || isVideo) && allowedTypes.test(ext)) {
    return cb(null, true);
  }
  cb(new Error("Only image or video files are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;
module.exports.buildFilename = buildFilename;
