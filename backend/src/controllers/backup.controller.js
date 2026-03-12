// backend/src/controllers/backup.controller.js
// Local folder backup (for restore) + ZIP archive + Google Drive upload (for safekeeping)
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import archiver from "archiver";
import { google } from "googleapis";
import Backup from "../models/backup.model.js";
import User from "../models/user.model.js";
import { logActivity } from "../utils/activityLogger.js";

/* ========= Helper: exec as Promise ========= */
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

/* ========= Helper: strip quotes from paths ========= */
function stripQuotes(p) {
    if (!p) return p;
    return p.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

/* ========= Helper: base backup directory ========= */
function getBackupRootDir() {
    if (process.env.BACKUP_DIR && process.env.BACKUP_DIR.trim() !== "") {
        return process.env.BACKUP_DIR;
    }
    return path.join(process.cwd(), "db_backups");
}

/* ========= Mongo URI & DB name helpers ========= */
function getMongoToolsUri() {
    const fromEnv = process.env.MONGO_TOOLS_URI || process.env.atlas_URI;
    if (!fromEnv) return null;
    // strip any ?query part
    return fromEnv.split("?")[0];
}

function getDbName() {
    if (process.env.MONGO_DB_NAME) return process.env.MONGO_DB_NAME;
    const uri = process.env.MONGO_TOOLS_URI || process.env.atlas_URI || "";
    const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
    return match?.[1] || "test";
}

/* ========= Mongo tools paths ========= */
function getMongoDumpBin() {
    const p = process.env.MONGODUMP_PATH;
    if (p && p.trim() !== "") return stripQuotes(p.trim());
    return "mongodump";
}

function getMongoRestoreBin() {
    const p = process.env.MONGORESTORE_PATH;
    if (p && p.trim() !== "") return stripQuotes(p.trim());
    return "mongorestore";
}

/* ========= Zip a folder ========= */
function zipFolder(folderPath, zipPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => resolve());
        archive.on("error", (err) => reject(err));

        archive.pipe(output);
        archive.directory(folderPath, false);
        archive.finalize();
    });
}

/* ========= Google Drive client (OAuth user account, DRIVE ONLY) ========= */

function getDriveClient() {
    const {
        GOOGLE_DRIVE_CLIENT_ID,
        GOOGLE_DRIVE_CLIENT_SECRET,
        GOOGLE_DRIVE_REDIRECT_URI,
        GOOGLE_DRIVE_REFRESH_TOKEN,
    } = process.env;

    // Debug: only show booleans so we see which ones are loaded
    console.log("[Backup] Google Drive env presence:", {
        GOOGLE_DRIVE_CLIENT_ID: !!GOOGLE_DRIVE_CLIENT_ID,
        GOOGLE_DRIVE_CLIENT_SECRET: !!GOOGLE_DRIVE_CLIENT_SECRET,
        GOOGLE_DRIVE_REDIRECT_URI: !!GOOGLE_DRIVE_REDIRECT_URI,
        GOOGLE_DRIVE_REFRESH_TOKEN: !!GOOGLE_DRIVE_REFRESH_TOKEN,
    });

    if (
        !GOOGLE_DRIVE_CLIENT_ID ||
        !GOOGLE_DRIVE_CLIENT_SECRET ||
        !GOOGLE_DRIVE_REDIRECT_URI ||
        !GOOGLE_DRIVE_REFRESH_TOKEN
    ) {
        console.warn(
            "[Backup] GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET / GOOGLE_DRIVE_REDIRECT_URI / GOOGLE_DRIVE_REFRESH_TOKEN not set. Skipping Drive upload."
        );
        return null;
    }

    const oAuth2Client = new google.auth.OAuth2(
        GOOGLE_DRIVE_CLIENT_ID,
        GOOGLE_DRIVE_CLIENT_SECRET,
        GOOGLE_DRIVE_REDIRECT_URI
    );

    // refresh token gives us access tokens automatically
    oAuth2Client.setCredentials({ refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN });

    return google.drive({ version: "v3", auth: oAuth2Client });
}

async function uploadZipToDrive(zipPath, backupFolderName) {
    const drive = getDriveClient();
    if (!drive) return { driveError: "Drive client not configured" };

    if (!fs.existsSync(zipPath)) {
        return { driveError: "ZIP file does not exist" };
    }

    const folderId = process.env.DRIVE_BACKUP_FOLDER_ID || null;
    const fileName = `${backupFolderName}.zip`;

    const fileMetadata = { name: fileName };
    if (folderId) fileMetadata.parents = [folderId];

    const media = {
        mimeType: "application/zip",
        body: fs.createReadStream(zipPath),
    };

    try {
        const resp = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: "id, webViewLink, webContentLink, size",
        });

        const f = resp.data;
        console.log("[Backup] Drive upload success. File ID:", f.id);

        return {
            driveFileId: f.id || null,
            driveWebViewLink: f.webViewLink || null,
            driveWebContentLink: f.webContentLink || null,
            driveSizeBytes: f.size ? Number(f.size) : null,
        };
    } catch (err) {
        console.error("[Backup] Drive upload failed:", err.response?.data || err);
        return {
            driveError:
                err.response?.data?.error?.message ||
                err.message ||
                "Drive upload failed",
        };
    }
}

/* ============================================
   CREATE BACKUP → local folder + ZIP + Drive
============================================ */

export const runDbBackup = async (req, res) => {
    try {
        const mongoUri = getMongoToolsUri();
        const dbName = getDbName();

        if (!mongoUri) {
            return res.status(500).json({
                success: false,
                message: "MONGO_TOOLS_URI or atlas_URI is not set.",
            });
        }

        // 1) Ensure root dir exists
        const rootDir = getBackupRootDir();
        fs.mkdirSync(rootDir, { recursive: true });

        // 2) Build folder name + paths
        const timestamp = new Date()
            .toISOString()
            .replace(/T/, "_")
            .replace(/:/g, "-")
            .replace(/\..+/, "");
        const folderName = `backup-${timestamp}`;
        const backupDir = path.join(rootDir, folderName);
        const zipPath = `${backupDir}.zip`;

        // 3) Run mongodump
        const mongodumpBin = getMongoDumpBin();
        const cmd = `"${mongodumpBin}" --uri="${mongoUri}" --out="${backupDir}"`;

        console.log("\n========== BACKUP: MONGODUMP ==========");
        console.log("[Backup] Using DB:", dbName);
        console.log("[Backup] Using URI:", mongoUri);
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

        // 4) Check that backup folder + DB subfolder exists
        const dbDir = path.join(backupDir, dbName);
        if (!fs.existsSync(dbDir)) {
            console.error("[Backup] DB folder missing AFTER mongodump:", dbDir);
            return res.status(500).json({
                success: false,
                message: `Backup folder for DB not created at: ${dbDir}`,
                dumpStdout,
                dumpStderr,
                cmd,
            });
        }

        // 5) Calculate approximate size (sum of files in dbDir)
        let sizeBytes = 0;
        let collectionsCount = 0;
        try {
            const entries = fs.readdirSync(dbDir);
            for (const name of entries) {
                const full = path.join(dbDir, name);
                const stat = fs.statSync(full);
                if (stat.isFile()) {
                    sizeBytes += stat.size;
                    if (name.endsWith(".bson")) collectionsCount++;
                }
            }
        } catch {
            sizeBytes = 0;
            collectionsCount = 0;
        }

        const userCountAtBackup = await User.countDocuments();

        // 6) ZIP the whole backup folder
        console.log("[Backup] Zipping folder:", backupDir);
        await zipFolder(backupDir, zipPath);
        const zipStat = fs.statSync(zipPath);
        const zipSize = zipStat.size;

        // 7) Upload ZIP to Google Drive (for keeping only)
        const driveResult = await uploadZipToDrive(zipPath, folderName);

        // 8) Save record in MongoDB
        const record = await Backup.create({
            fileName: folderName,
            dbName,
            localPath: backupDir,
            zipPath,
            sizeBytes: zipSize,
            collectionsCount,
            driveFileId: driveResult.driveFileId || null,
            driveWebViewLink: driveResult.driveWebViewLink || null,
            driveWebContentLink: driveResult.driveWebContentLink || null,
        });

        console.log("[Backup] SUCCESS. Backup id:", record._id.toString());
        await logActivity(
            req,
            "backup_create",
            {
                backupId: record._id.toString(),
                fileName: record.fileName,
            },
            req.user
        );

        return res.json({
            success: true,
            message:
                "Backup created, zipped and stored locally. ZIP also uploaded to Google Drive (if configured).",
            backup: record,
            debug: {
                backupDir,
                dbDir,
                zipPath,
                cmd,
                userCountAtBackup,
                dumpStdout,
                dumpStderr,
                drive: driveResult,
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
   DOWNLOAD BACKUP ZIP (local only)
============================================ */

export const downloadBackup = async (req, res) => {
    try {
        const backup = await Backup.findById(req.params.id);
        if (!backup) {
            return res
                .status(404)
                .json({ success: false, message: "Backup not found" });
        }

        if (!fs.existsSync(backup.zipPath)) {
            return res.status(404).json({
                success: false,
                message: "Local ZIP file not found on server.",
            });
        }

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${path.basename(backup.zipPath)}`
        );
        res.setHeader("Content-Type", "application/zip");

        const stream = fs.createReadStream(backup.zipPath);
        stream.pipe(res);
    } catch (err) {
        console.error("[Backup] downloadBackup error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ============================================
   RESTORE BACKUP (from local folder ONLY)
============================================ */

export const restoreBackup = async (req, res) => {
    try {
        const mongoUri = getMongoToolsUri();
        const dbName = getDbName();

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

        const backupDir = backup.localPath;
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
        await logActivity(
            req,
            "backup_restore",
            {
                backupId: backup._id.toString(),
                fileName: backup.fileName,
            },
            req.user
        );

        return res.json({
            success: true,
            message: "Database restored from local backup.",
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

        if (backup.localPath && fs.existsSync(backup.localPath)) {
            fs.rmSync(backup.localPath, { recursive: true, force: true });
        }

        if (backup.zipPath && fs.existsSync(backup.zipPath)) {
            fs.rmSync(backup.zipPath, { recursive: true, force: true });
        }

        await backup.deleteOne();
        await logActivity(
            req,
            "backup_delete",
            {
                backupId: backup._id.toString(),
                fileName: backup.fileName,
            },
            req.user
        );
        res.json({ success: true, message: "Backup deleted." });
    } catch (err) {
        console.error("[Backup] deleteBackup error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
