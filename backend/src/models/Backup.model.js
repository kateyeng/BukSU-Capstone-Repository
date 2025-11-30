import mongoose from "mongoose";

const BackupSchema = new mongoose.Schema(
    {
        fileName: { type: String, required: true },
        sizeBytes: { type: Number, default: 0 },
        dbName: { type: String, default: "test" },
        collectionsCount: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export default mongoose.model("Backup", BackupSchema);
