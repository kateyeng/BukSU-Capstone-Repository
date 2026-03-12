import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    // Display
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    year: { type: Number, required: true, min: 1900, max: 3000 },
    abstract: { type: String, default: "", trim: true, maxlength: 10000 },
    authors: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) =>
          arr.every((a) => typeof a === "string" && a.trim().length > 0),
        message: "Authors must be non-empty strings",
      },
    },

    // Original adviser selected during submission
    adviser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
      default: null,
    },
    adviserName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    // Teacher/admin who reviewed or updated the thesis
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
      default: null,
    },
    reviewedByName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    // Department / program text
    department: { type: String, trim: true, maxlength: 200, default: "" },

    submitterEmail: { type: String, trim: true, lowercase: true, default: "" },
    contactEmail: { type: String, trim: true, lowercase: true, default: "" },

    // Ownership
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
      default: null,
    },

    // File info (legacy local fields)
    filePath: { type: String, default: null },
    mimeType: { type: String, default: null },
    fileSize: { type: Number, default: null, min: 0 },

    // Cloudinary file info
    fileUrl: { type: String, default: null },
    cloudinaryPublicId: { type: String, default: null },

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

    // Grading (teacher's evaluation)
    grade: {
      score: { type: Number, min: 0, max: 100, default: null },
      justification: { type: String, default: "", trim: true, maxlength: 5000 },
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null,
      },
      gradedByName: { type: String, default: "", trim: true },
      gradedAt: { type: Date, default: null },
    },

    // Visibility
    isPublished: { type: Boolean, default: true },

    // 2PL edit lock
    editLock: {
      lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      lockedByRole: { type: String, trim: true },
      lockedByName: { type: String, trim: true },
      lockedByEmail: { type: String, trim: true },
      lockedAt: { type: Date },
      expiresAt: { type: Date },
      releasedAt: { type: Date },
    },
  },
  { timestamps: true }
);

/* ---------- Indexes ---------- */
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ title: "text", abstract: "text" });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ category: 1, year: -1 });
ProjectSchema.index({ status: 1, category: 1, year: -1 });
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ adviser: 1 });
ProjectSchema.index({ reviewedBy: 1 });

/* ---------- Helpers ---------- */
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

ProjectSchema.methods.toPublic = function () {
  const o = this.toObject({ versionKey: false });
  return o;
};

const Project = mongoose.model("project", ProjectSchema);
export default Project;