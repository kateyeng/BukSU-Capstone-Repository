// backend/src/config/multer.js
import multer from "multer";

function pdfFilter(req, file, cb) {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
}

// For Cloudinary: keep file in memory (no local disk file)
export const uploadProjectFile = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
