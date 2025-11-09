import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads", "projects");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // unique name: 1712345678-abc.pdf
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .slice(0, 50);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

// Allow pdf, doc, docx only
const allowed = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (_req, file, cb) => {
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF/DOC/DOCX files are allowed"));
};

export const uploadProjectFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});
