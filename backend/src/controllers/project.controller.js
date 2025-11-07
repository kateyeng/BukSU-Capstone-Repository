import Project from "../models/project.model.js";

export const createProject = async (req, res) => {
  try {
    // multer attached the file as req.file
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const {
      title,
      category,
      year,
      abstract = "",
      authors = "",
      tags = "",
      isPublished = "true",
    } = req.body;

    if (!title || !category || !year) {
      return res.status(400).json({ message: "title, category, year are required" });
    }

    // authors and tags can be CSV strings from form-data
    const authorsArr = Array.isArray(authors)
      ? authors
      : String(authors)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    const tagsArr = Array.isArray(tags)
      ? tags
      : String(tags)
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

    const project = await Project.create({
      title,
      category,
      year: Number(year),
      abstract,
      authors: authorsArr,
      owner: req.user._id, // from protect middleware
      filePath: `/uploads/projects/${req.file.filename}`, // public path
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      tags: tagsArr,
      isPublished: String(isPublished).toLowerCase() !== "false",
    });

    return res.status(201).json({ message: "Project uploaded", project });
  } catch (err) {
    console.error("createProject error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// (Optional) download by id
export const downloadProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || !project.filePath) return res.status(404).json({ message: "Not found" });
    // If you saved a public path starting with /uploads, map it to disk path:
    const diskPath = project.filePath.startsWith("/uploads")
      ? process.cwd() + project.filePath
      : project.filePath;
    res.download(diskPath, project.title + (project.mimeType === "application/pdf" ? ".pdf" : ""));
  } catch (err) {
    console.error("downloadProject error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
