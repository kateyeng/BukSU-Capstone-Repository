// backend/src/utils/googleDrive.js
import fs from "fs";
import { google } from "googleapis";

function getPrivateKey() {
    const raw = process.env.GOOGLE_PRIVATE_KEY || "";

    // If the key contains "\n", convert to real newlines.
    if (raw.includes("\\n")) {
        return raw.replace(/\\n/g, "\n");
    }
    // Otherwise assume it’s already multi-line PEM.
    return raw;
}

const privateKey = getPrivateKey();

console.log("[Drive] Using client email:", process.env.GOOGLE_CLIENT_EMAIL);
console.log("[Drive] Private key length:", privateKey.length);

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
});

export async function uploadBackupZipToDrive(localPath, fileName) {
    const client = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: client });

    const folderId = process.env.DRIVE_BACKUP_FOLDER_ID || undefined;

    const fileMetadata = {
        name: fileName,
        ...(folderId ? { parents: [folderId] } : {}),
    };

    const media = {
        mimeType: "application/zip",
        body: fs.createReadStream(localPath),
    };

    const res = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id, webViewLink, webContentLink",
    });

    const file = res.data;

    // Make sure at least you (owner) can see it; optional share logic can go here.

    return {
        id: file.id,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
    };
}
