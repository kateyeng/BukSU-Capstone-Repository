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
        validator: (arr) => arr.every((a) => typeof a === "string" && a.trim().length > 0),
        message: "Authors must be non-empty strings",
      },
    },

      adviser: { type: String, trim: true, maxlength: 200 },

        submitterEmail: { type: String, trim: true, lowercase: true }, // <-- new
        contactEmail:   { type: String, trim: true, lowercase: true }, // optional fallback
    // Ownership (optional for dev; make required:true when auth is ready)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // kept as-is to match your current codebase
      required: false,
    },

    // File info
    filePath: { type: String, default: null },
    mimeType: { type: String, default: null },
    fileSize: { type: Number, default: null, min: 0 },

    // Metrics
    views: { type: Number, default: 0, min: 0 },
    downloads: { type: Number, default: 0, min: 0 },

    // Tags/keywords
    tags: {
      type: [String],
      default: [],
      set: (arr) => arr.map((t) => String(t).trim().toLowerCase()).filter(Boolean),
    },

    // Moderation status (NEW)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // Visibility (you can keep this if you still use it; status now controls browse results)
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ---------- Indexes ---------- */
ProjectSchema.index({ createdAt: -1 });
// text-only index (no arrays mixed into text index)
ProjectSchema.index({ title: "text", abstract: "text" });
// multikey index for tag filtering
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ category: 1, year: -1 });
// helpful for browse filters that include status
ProjectSchema.index({ status: 1, category: 1, year: -1 });
ProjectSchema.index({ owner: 1 });

/* ---------- Helpers ---------- */
ProjectSchema.path("authors").set(function (val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
});

// Keep your existing toPublic, or limit fields if you prefer
ProjectSchema.methods.toPublic = function () {
  const o = this.toObject({ versionKey: false });
  return o;
};

const Project = mongoose.model("project", ProjectSchema);
export default Project;
