// backend/src/models/backup.model.js
import mongoose from "mongoose";

const backupSchema = new mongoose.Schema(
    {
        fileName: { type: String, required: true },      // e.g. "backup-2025-11-30_07-37-26"
        dbName: { type: String, default: "test" },

        // Local folder path containing BSON files: .../backup-YYYY-MM-DD_HH-MM-SS
        localPath: { type: String, required: true },

        // Local zip path: localPath + ".zip"
        zipPath: { type: String, required: true },

        // Backup engine used to generate the backup
        format: {
            type: String,
            enum: ["mongodump", "json"],
            default: "mongodump",
        },

        sizeBytes: { type: Number, default: 0 },
        collectionsCount: { type: Number, default: 0 },

        // These are now unused (no Drive upload), but keeping them is safe
        driveFileId: { type: String, default: null },
        driveWebViewLink: { type: String, default: null },
        driveWebContentLink: { type: String, default: null },
    },
    { timestamps: true }
);

const Backup = mongoose.model("backup", backupSchema);

export default Backup;
