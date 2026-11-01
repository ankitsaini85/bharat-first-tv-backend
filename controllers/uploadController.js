const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getR2Client, isObjectStorageEnabled } = require("../config/r2");
const { buildFilename } = require("../middleware/upload");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";

    if (isObjectStorageEnabled()) {
      // req.file.buffer is populated because upload middleware switches to
      // memory storage when object storage is enabled (see middleware/upload.js).
      const client = getR2Client();
      const key = buildFilename(req.file);

      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      const publicBase = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
      const url = `${publicBase}/${key}`;
      return res.status(201).json({ url, mediaType, filename: key });
    }

    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url, mediaType, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
