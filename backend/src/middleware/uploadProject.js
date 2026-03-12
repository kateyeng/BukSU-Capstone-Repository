// middleware/uploadProject.js
import multer from "multer";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (file.mimetype !== "application/pdf") {
    // don't throw; set a flag the controller can read
    req.fileValidationError = "Only PDF files are allowed";
    return cb(null, false);
  }
  cb(null, true);
}

const uploadProject = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export default uploadProject;