import mongoose from "mongoose";

const DeletedProjectBackupSchema = new mongoose.Schema(
  {
    originalProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
      index: true,
    },

    projectData: {
      type: Object,
      required: true,
    },

    deletedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    restoredAt: {
      type: Date,
      default: null,
    },

    isRestored: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const DeletedProjectBackup = mongoose.model(
  "deletedProjectBackup",
  DeletedProjectBackupSchema
);

export default DeletedProjectBackup;