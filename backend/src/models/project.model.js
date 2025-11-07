import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    // Display
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
    authors: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((a) => typeof a === "string" && a.trim().length > 0),
        message: "Authors must be non-empty strings",
      },
    },

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
    },
  },
  { timestamps: true }
);

/* ---------- Indexes (speed up common queries) ---------- */
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ title: "text", abstract: "text", tags: 1 }); // enables simple text search
ProjectSchema.index({ category: 1, year: -1 });
ProjectSchema.index({ owner: 1 });

/* ---------- Helpers ---------- */
// Clean authors input like "A, B , C" when provided as a single string
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

// Public JSON (hide internal fields you don’t want to leak)
ProjectSchema.methods.toPublic = function () {
  const o = this.toObject({ versionKey: false });
  // optionally remove filePath if you don’t want to expose disk paths publicly
  return o;
};

const Project = mongoose.model("project", ProjectSchema);
export default Project;
