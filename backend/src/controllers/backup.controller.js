// backend/src/controllers/backup.controller.js
// Backup & Restore using mongodump / mongorestore
//
// Required ENV:
//   atlas_URI           → your main MongoDB URI (with ?appName is OK here)
//   MONGO_TOOLS_URI     → tools URI without ?appName, e.g. ...mongodb.net/test
//   BACKUP_DIR          → local backup root folder, e.g. C:/buksu_db_backups
//   MONGODUMP_PATH      → full path to mongodump.exe  (optional)
//   MONGORESTORE_PATH   → full path to mongorestore.exe (optional)
//   MONGO_DB_NAME       → database name (e.g. "test")

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import Backup from "../models/backup.model.js";
import User from "../models/user.model.js";

/* ============================================
   Helper: promisified exec
============================================ */

function execPromise(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                err.stdout = stdout;
                err.stderr = stderr;
                return reject(err);
            }
            resolve({ stdout, stderr });
        });
    });
}

/* ============================================
   Helper: paths / binaries
============================================ */

function getBackupRootDir() {
    if (process.env.BACKUP_DIR && process.env.BACKUP_DIR.trim() !== "") {
        return process.env.BACKUP_DIR; // e.g. C:/buksu_db_backups
    }
    return path.join(process.cwd(), "db_backups");
}

function getMongoDumpBin() {
    return process.env.MONGODUMP_PATH || "mongodump";
}

function getMongoRestoreBin() {
    return process.env.MONGORESTORE_PATH || "mongorestore";
}

function getMongoToolsUri() {
    // Prefer dedicated tools URI (no ?appName)
    return process.env.MONGO_TOOLS_URI || process.env.atlas_URI;
}

function getDbName() {
    return process.env.MONGO_DB_NAME || "test";
}

/* ============================================
   Helper: recursive folder size
============================================ */

function getFolderSizeRecursive(dir) {
    let total = 0;

    if (!fs.existsSync(dir)) return 0;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            total += getFolderSizeRecursive(fullPath);
        } else if (entry.isFile()) {
            total += fs.statSync(fullPath).size;
        }
    }

    return total;
}

/* ============================================
   CREATE BACKUP
============================================ */

export const runDbBackup = async (req, res) => {
    try {
        const mongoUri = getMongoToolsUri();
        if (!mongoUri) {
            return res.status(500).json({
                success: false,
                message: "MONGO_TOOLS_URI or atlas_URI is not set in .env",
            });
        }

        const rootDir = getBackupRootDir();
        fs.mkdirSync(rootDir, { recursive: true });

        const timestamp = new Date()
            .toISOString()
            .replace(/T/, "_")
            .replace(/:/g, "-")
            .replace(/\..+/, "");
        const folderName = `backup-${timestamp}`;
        const backupDir = path.join(rootDir, folderName);

        const mongodumpBin = getMongoDumpBin();
        const cmd = `"${mongodumpBin}" --uri="${mongoUri}" --out="${backupDir}"`;

        console.log("\n========== BACKUP: MONGODUMP ==========");
        console.log("[Backup] Using mongodump bin:", mongodumpBin);
        console.log("[Backup] Running:", cmd);
        console.log("=======================================\n");

        let dumpStdout = "";
        let dumpStderr = "";

        try {
            const { stdout, stderr } = await execPromise(cmd);
            dumpStdout = stdout?.toString() || "";
            dumpStderr = stderr?.toString() || "";
            if (dumpStdout) console.log("[mongodump stdout]:", dumpStdout);
            if (dumpStderr) console.log("[mongodump stderr]:", dumpStderr);
        } catch (err) {
            console.error("\n===== MONGODUMP FAILED =====");
            console.error("Command:", cmd);
            console.error("Error message:", err.message);
            console.error("STDERR:", err.stderr?.toString());
            console.error("STDOUT:", err.stdout?.toString());
            console.error("================================\n");

            return res.status(500).json({
                success: false,
                message: "mongodump failed.",
                error: err.message,
                stderr: err.stderr?.toString(),
                stdout: err.stdout?.toString(),
                cmd,
            });
        }

        if (!fs.existsSync(backupDir)) {
            console.error("[Backup] Folder missing AFTER mongodump:", backupDir);
            return res.status(500).json({
                success: false,
                message: `Backup folder not created at: ${backupDir}`,
                dumpStdout,
                dumpStderr,
                cmd,
            });
        }

        // 🔹 Total size of backup folder (all nested files)
        const sizeBytes = getFolderSizeRecursive(backupDir);

        // 🔹 Count collections = *.bson files under /<dbName>
        const dbName = getDbName();
        let collectionsCount = 0;
        const dbFolder = path.join(backupDir, dbName);
        if (fs.existsSync(dbFolder)) {
            const files = fs.readdirSync(dbFolder);
            collectionsCount = files.filter((f) => f.endsWith(".bson")).length;
        }

        const userCountAtBackup = await User.countDocuments();

        const record = await Backup.create({
            fileName: folderName,
            sizeBytes,
            dbName,
            collectionsCount,
        });

        console.log("[Backup] SUCCESS. Backup id:", record._id.toString());

        return res.json({
            success: true,
            message: "Backup created and stored locally.",
            backup: record,
            debug: {
                backupDir,
                cmd,
                userCountAtBackup,
                dumpStdout,
                dumpStderr,
                sizeBytes,
                collectionsCount,
            },
        });
    } catch (err) {
        console.error("[Backup] UNHANDLED ERROR:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

/* ============================================
   LIST BACKUPS
============================================ */

export const listBackups = async (req, res) => {
    try {
        const backups = await Backup.find().sort({ createdAt: -1 });
        res.json({ backups });
    } catch (err) {
        console.error("[Backup] listBackups error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ============================================
   DOWNLOAD BACKUP (placeholder)
============================================ */

export const downloadBackup = async (req, res) => {
    return res.status(501).json({
        success: false,
        message:
            "Download is not implemented for folder-based backups yet. You can manually copy the backup folder from the server.",
    });
};

/* ============================================
   RESTORE BACKUP
============================================ */

export const restoreBackup = async (req, res) => {
    try {
        const mongoUri = getMongoToolsUri();
        if (!mongoUri) {
            return res.status(500).json({
                success: false,
                message: "MONGO_TOOLS_URI or atlas_URI is not set.",
            });
        }

        const backup = await Backup.findById(req.params.id);
        if (!backup) {
            return res
                .status(404)
                .json({ success: false, message: "Backup not found" });
        }

        const rootDir = getBackupRootDir();
        const backupDir = path.join(rootDir, backup.fileName);

        if (!fs.existsSync(backupDir)) {
            return res.status(404).json({
                success: false,
                message: "Backup folder missing on server.",
            });
        }

        // 👉 point directly to the DB subfolder (e.g. ...\backup-xxx\test)
        const dbName = getDbName(); // "test" from env or default
        const dbDir = path.join(backupDir, dbName);

        if (!fs.existsSync(dbDir)) {
            return res.status(404).json({
                success: false,
                message: `Database folder "${dbName}" not found inside backup.`,
            });
        }

        const usersBefore = await User.countDocuments();
        console.log("[Restore] Users BEFORE:", usersBefore);

        const mongorestoreBin = getMongoRestoreBin();

        // 🔑 use DB folder as --dir
        const cmd = `"${mongorestoreBin}" --uri="${mongoUri}" --drop --dir="${dbDir}"`;

        console.log("\n========== RESTORE: MONGORESTORE ==========");
        console.log("[Restore] Using mongorestore bin:", mongorestoreBin);
        console.log("[Restore] Running:", cmd);
        console.log("===========================================\n");

        let restoreStdout = "";
        let restoreStderr = "";

        try {
            const { stdout, stderr } = await execPromise(cmd);
            restoreStdout = stdout?.toString() || "";
            restoreStderr = stderr?.toString() || "";
            if (restoreStdout) console.log("[mongorestore stdout]:", restoreStdout);
            if (restoreStderr) console.log("[mongorestore stderr]:", restoreStderr);
        } catch (err) {
            console.error("\n===== MONGORESTORE FAILED =====");
            console.error("Command:", cmd);
            console.error("Error message:", err.message);
            console.error("STDERR:", err.stderr?.toString());
            console.error("STDOUT:", err.stdout?.toString());
            console.error("================================\n");

            return res.status(500).json({
                success: false,
                message: "mongorestore failed.",
                error: err.message,
                stderr: err.stderr?.toString(),
                stdout: err.stdout?.toString(),
                cmd,
            });
        }

        const usersAfter = await User.countDocuments();
        console.log("[Restore] Users AFTER:", usersAfter);

        return res.json({
            success: true,
            message: "Database restored from backup.",
            debug: {
                usersBefore,
                usersAfter,
                cmd,
                restoreStdout,
                restoreStderr,
            },
        });
    } catch (err) {
        console.error("[Restore] UNHANDLED ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};


/* ============================================
   DELETE BACKUP
============================================ */

export const deleteBackup = async (req, res) => {
    try {
        const backup = await Backup.findById(req.params.id);
        if (!backup) {
            return res
                .status(404)
                .json({ success: false, message: "Backup not found" });
        }

        const rootDir = getBackupRootDir();
        const backupDir = path.join(rootDir, backup.fileName);

        if (fs.existsSync(backupDir)) {
            fs.rmSync(backupDir, { recursive: true, force: true });
        }

        await backup.deleteOne();
        res.json({ success: true, message: "Backup deleted." });
    } catch (err) {
        console.error("[Backup] deleteBackup error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
