// backend/src/config/multer.js
import multer from "multer";

function pdfFilter(req, file, cb) {
  const mimeOk = file.mimetype === "application/pdf";
  const nameOk = /\.pdf$/i.test(file.originalname || "");

  if (mimeOk && nameOk) {
    cb(null, true);
  } else {
    // 👇 don't throw; just remember the error and skip the file
    req.fileValidationError = "Only PDF files are allowed";
    cb(null, false);
  }
}

// For Cloudinary: keep file in memory (no local disk file)
export const uploadProjectFile = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
