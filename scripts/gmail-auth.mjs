// Usage: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/gmail-auth.mjs
import { google } from "googleapis";
import readline from "readline";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"  // desktop app redirect
);

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://mail.google.com/",
];

const url = oauth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES, prompt: "consent" });
console.log("\nOtwórz ten URL w przeglądarce:\n", url, "\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Wklej kod autoryzacji: ", async (code) => {
  rl.close();
  const { tokens } = await oauth2Client.getToken(code);
  console.log("\nRefresh token (dodaj jako GMAIL_REFRESH_TOKEN w Railway):\n", tokens.refresh_token);
});
