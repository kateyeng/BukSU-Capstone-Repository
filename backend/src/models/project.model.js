import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    // Display
<<<<<<< HEAD
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true, // e.g. "Information Technology", "Computer Engineering"
      trim: true,
      maxlength: 100,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: 3000,
    },
    abstract: {
      type: String,
      default: "",
      trim: true,
      maxlength: 10000,
    },
=======
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    year: { type: Number, required: true, min: 1900, max: 3000 },
    abstract: { type: String, default: "", trim: true, maxlength: 10000 },
>>>>>>> major-changes
    authors: {
      type: [String],
      default: [],
      validate: {
<<<<<<< HEAD
        validator: (arr) => arr.every((a) => typeof a === "string" && a.trim().length > 0),
=======
        validator: (arr) =>
          arr.every((a) => typeof a === "string" && a.trim().length > 0),
>>>>>>> major-changes
        message: "Authors must be non-empty strings",
      },
    },

<<<<<<< HEAD
    // Ownership (used by ownerOrAdmin guard)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // matches your user.model.js export
      required: true,
    },

    // File info (used by download/preview)
    filePath: {
      type: String, // local disk path (e.g., uploads/projects/xyz.pdf) or cloud URL
      default: null,
    },
    mimeType: {
      type: String,
      default: null, // e.g. application/pdf
    },
    fileSize: {
      type: Number,
      default: null, // bytes
      min: 0,
    },

    // Metrics
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional tags/keywords for search
    tags: {
      type: [String],
      default: [],
      set: (arr) => arr.map((t) => String(t).trim().toLowerCase()).filter(Boolean),
    },

    // Visibility (if you later need moderation)
    isPublished: {
      type: Boolean,
      default: true,
=======
    adviser: { type: String, trim: true, maxlength: 200 },

    submitterEmail: { type: String, trim: true, lowercase: true },
    contactEmail: { type: String, trim: true, lowercase: true },

    // Ownership
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },

    // File info (legacy local fields)
    filePath: { type: String, default: null },
    mimeType: { type: String, default: null },
    fileSize: { type: Number, default: null, min: 0 },

    // Cloudinary file info (preferred)
    fileUrl: { type: String, default: null }, // secure_url
    cloudinaryPublicId: { type: String, default: null }, // public_id

    // Metrics
    views: { type: Number, default: 0, min: 0 },
    downloads: { type: Number, default: 0, min: 0 },

    // Tags/keywords
    tags: {
      type: [String],
      default: [],
      set: (arr) =>
        arr
          .map((t) => String(t).trim().toLowerCase())
          .filter(Boolean),
    },

    // Moderation status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // Visibility
    isPublished: { type: Boolean, default: true },

    // 2PL edit lock (shared by student/teacher/admin)
    editLock: {
      lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      lockedByRole: { type: String, trim: true },
      lockedByName: { type: String, trim: true },
      lockedByEmail: { type: String, trim: true },
      lockedAt: { type: Date },
      expiresAt: { type: Date },
      releasedAt: { type: Date },
>>>>>>> major-changes
    },
  },
  { timestamps: true }
);

<<<<<<< HEAD
/* ---------- Indexes (speed up common queries) ---------- */
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ title: "text", abstract: "text", tags: 1 }); // enables simple text search
ProjectSchema.index({ category: 1, year: -1 });
ProjectSchema.index({ owner: 1 });

/* ---------- Helpers ---------- */
// Clean authors input like "A, B , C" when provided as a single string
=======
/* ---------- Indexes ---------- */
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ title: "text", abstract: "text" });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ category: 1, year: -1 });
ProjectSchema.index({ status: 1, category: 1, year: -1 });
ProjectSchema.index({ owner: 1 });

/* ---------- Helpers ---------- */
>>>>>>> major-changes
ProjectSchema.path("authors").set(function (val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
});

<<<<<<< HEAD
// Public JSON (hide internal fields you don’t want to leak)
ProjectSchema.methods.toPublic = function () {
  const o = this.toObject({ versionKey: false });
  // optionally remove filePath if you don’t want to expose disk paths publicly
=======
// You can still customize which fields are exposed here if you want
ProjectSchema.methods.toPublic = function () {
  const o = this.toObject({ versionKey: false });
>>>>>>> major-changes
  return o;
};

const Project = mongoose.model("project", ProjectSchema);
export default Project;
