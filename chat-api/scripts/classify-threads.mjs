// One-off: classify existing email_threads through the LLM classifier.
//
// Usage (inside the Chat API container, e.g. Railway Console):
//   node scripts/classify-threads.mjs            # classify only 'unclassified'
//   node scripts/classify-threads.mjs --all      # re-classify every thread
//   node scripts/classify-threads.mjs --dry      # print, don't write
//
// Each thread is scored from its subject + the first inbound message body.
// Safe to run repeatedly. Requires OPENAI_API_KEY.

import pg from "pg";
import { classifyEmailThread } from "../gmail.js";

const args = process.argv.slice(2);
const reAll = args.includes("--all");
const dry = args.includes("--dry");

if (!process.env.DATABASE_URL) {
  console.error("[classify] DATABASE_URL missing");
  process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
  console.error("[classify] OPENAI_API_KEY missing");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const where = reAll ? "" : "WHERE et.tag = 'unclassified'";
  const { rows } = await pool.query(`
    SELECT et.id, et.subject,
      (SELECT em.body_text FROM email_messages em
        WHERE em.thread_id = et.id AND em.direction = 'inbound'
        ORDER BY em.received_at ASC LIMIT 1) AS body_text
    FROM email_threads et
    ${where}
    ORDER BY et.last_message_at DESC NULLS LAST
  `);

  console.log(`[classify] ${rows.length} thread(s) to score${dry ? " (dry run)" : ""}`);
  const tally = { lead: 0, not_lead: 0, spam: 0, unclassified: 0 };

  for (const t of rows) {
    const tag = await classifyEmailThread(t.subject || "", t.body_text || "");
    tally[tag] = (tally[tag] || 0) + 1;
    console.log(`  #${t.id} → ${tag}  | ${(t.subject || "(brak tematu)").slice(0, 60)}`);
    if (!dry && tag !== "unclassified") {
      await pool.query("UPDATE email_threads SET tag = $1 WHERE id = $2", [tag, t.id]);
    }
  }

  console.log("[classify] done:", tally);
  await pool.end();
})().catch(err => {
  console.error("[classify] error:", err);
  process.exit(1);
});
