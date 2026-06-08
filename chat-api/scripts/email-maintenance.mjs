// One-off Gmail email-tracking maintenance.
//
// Usage (run inside the Chat API container, e.g. Railway Console):
//   node scripts/email-maintenance.mjs --wipe --backfill=30d
//
// Flags:
//   --wipe            TRUNCATE email_threads + email_messages and delete the
//                     junk leads auto-created from email today (calculator='email').
//   --backfill=<win>  Re-pull Gmail over <win> (e.g. 30d, 90d, 7d) through the
//                     current isAutomatedEmail() filter so only real client
//                     correspondence is stored. Default window: 30d.
//   --dry             Print what would happen without writing.
//
// Safe to run repeatedly — processGmailMessage dedups on gmail_message_id.

import pg from "pg";
import { createGmailClient, pollRecentMessages } from "../gmail.js";

const args = process.argv.slice(2);
const doWipe = args.includes("--wipe");
const dry = args.includes("--dry");
const backfillArg = args.find(a => a.startsWith("--backfill"));
const doBackfill = !!backfillArg;
const windowRaw = backfillArg?.split("=")[1] || "30d";
const query = windowRaw.startsWith("newer_than:") ? windowRaw : `newer_than:${windowRaw}`;

if (!process.env.DATABASE_URL) {
  console.error("[maint] DATABASE_URL missing");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  // Show current state
  const before = await pool.query(
    "SELECT (SELECT COUNT(*) FROM email_threads) AS threads, (SELECT COUNT(*) FROM email_messages) AS messages, (SELECT COUNT(*) FROM leads WHERE calculator='email') AS email_leads"
  );
  console.log("[maint] before:", before.rows[0]);

  if (doWipe) {
    if (dry) {
      console.log("[maint] --dry: would TRUNCATE email_threads, email_messages and delete today's calculator='email' leads");
    } else {
      await pool.query("TRUNCATE email_messages, email_threads RESTART IDENTITY");
      const del = await pool.query(
        "DELETE FROM leads WHERE calculator = 'email' AND created_at >= CURRENT_DATE"
      );
      console.log(`[maint] wiped email tables; deleted ${del.rowCount} junk email-leads`);
    }
  }

  if (doBackfill) {
    const gmail = createGmailClient();
    if (!gmail) {
      console.error("[maint] Gmail not configured (missing client id/secret/refresh token)");
      await pool.end();
      process.exit(1);
    }
    if (dry) {
      console.log(`[maint] --dry: would backfill with query "${query}" (up to 50 pages/label)`);
    } else {
      console.log(`[maint] backfilling with query "${query}" …`);
      const count = await pollRecentMessages(gmail, pool, { query, maxPages: 50 });
      console.log(`[maint] backfill done: ${count} messages stored`);
    }
  }

  const after = await pool.query(
    "SELECT (SELECT COUNT(*) FROM email_threads) AS threads, (SELECT COUNT(*) FROM email_messages) AS messages, (SELECT COUNT(*) FROM leads WHERE calculator='email') AS email_leads"
  );
  console.log("[maint] after:", after.rows[0]);

  await pool.end();
})().catch(err => {
  console.error("[maint] error:", err);
  process.exit(1);
});
