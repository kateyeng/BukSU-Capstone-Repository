// backend/scripts/getDriveToken.js
import readline from "readline";
import { google } from "googleapis";
import dotenv from "dotenv";

// If .env is in backend/, this is correct:
dotenv.config({ path: "./.env" });

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

console.log("Loaded env values:");
console.log("GOOGLE_CLIENT_ID:", clientId);
console.log("GOOGLE_CLIENT_SECRET:", clientSecret ? "(set)" : "(missing)");
console.log("GOOGLE_REDIRECT_URI:", redirectUri);
console.log("");

if (!clientId || !clientSecret || !redirectUri) {
    console.error(
        "❌ Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI in .env"
    );
    process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
);

// Ask for Drive access
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"],
});

console.log("Authorize this app by visiting this URL:\n");
console.log(authUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("\nEnter the code from that page here: ", async (code) => {
    try {
        const { tokens } = await oAuth2Client.getToken(code.trim());
        console.log("\nYour refresh token is:\n");
        console.log(tokens.refresh_token);
        console.log(
            "\nPut this value in your .env as GOOGLE_REFRESH_TOKEN"
        );
    } catch (err) {
        console.error("Error retrieving access token:", err.response?.data || err);
    } finally {
        rl.close();
    }
});
