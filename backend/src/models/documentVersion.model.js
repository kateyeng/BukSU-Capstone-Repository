import mongoose from "mongoose";

const DocumentVersionSchema = new mongoose.Schema(
  {
    // Reference to the project
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      required: true,
      index: true,
    },

    // File info for this version
    fileUrl: { type: String, default: null },
    cloudinaryPublicId: { type: String, default: null },
    filePath: { type: String, default: null },
    fileSize: { type: Number, default: null },
    mimeType: { type: String, default: null },

    // Metadata
    versionNumber: { type: Number, required: true },
    title: { type: String, trim: true, maxlength: 200 },
    abstract: { type: String, default: "", trim: true, maxlength: 10000 },

    // Who uploaded/changed
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    uploadedByName: { type: String, trim: true, default: "" },

    // Change notes
    changeNotes: { type: String, default: "", trim: true, maxlength: 500 },

    // Status after this version
    statusAtVersion: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

DocumentVersionSchema.index({ project: 1, versionNumber: -1 });
DocumentVersionSchema.index({ uploadedBy: 1 });
DocumentVersionSchema.index({ createdAt: -1 });

const DocumentVersion = mongoose.model("documentVersion", DocumentVersionSchema);
export default DocumentVersion;
