import { google } from "googleapis";
import OpenAI from "openai";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createGmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const { GMAIL_REFRESH_TOKEN } = process.env;
  if (!clientId || !clientSecret || !GMAIL_REFRESH_TOKEN) return null;

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: "v1", auth: oauth2 });
}

export function extractEmail(str) {
  if (!str) return null;
  const match = str.match(/<([^>]+)>/);
  const email = (match ? match[1] : str).trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

export function getHeader(headers, name) {
  if (!Array.isArray(headers)) return null;
  const lower = name.toLowerCase();
  const found = headers.find(h => h.name?.toLowerCase() === lower);
  return found?.value || null;
}

// Senders that are clearly machines, not clients. Matches the local-part or
// full address — deliberately does NOT match generic business addresses like
// info@ or contact@ which can be real correspondence.
const AUTOMATED_SENDER_RE = /(no-?reply|do-?not-?reply|donotreply|no_reply|mailer-daemon|postmaster@|bounce|notifications?@|newsletter|mailchimp|sendgrid|mailerlite|sendinblue|amazonses|dmarc|abuse@|@(?:bounce|email|mail|reports?|news)\.)/i;

// True when an INBOUND message is automated mail (newsletters, DMARC/domain
// reports, autoresponders, mailing lists) rather than real client correspondence.
// Detection is header-based so it works regardless of Gmail tab settings.
export function isAutomatedEmail(headers, from) {
  if (AUTOMATED_SENDER_RE.test((from || "").toLowerCase())) return true;
  // Marketing / mailing-list signals
  if (getHeader(headers, "List-Unsubscribe")) return true;
  if (getHeader(headers, "List-Id")) return true;
  const precedence = (getHeader(headers, "Precedence") || "").toLowerCase();
  if (["bulk", "list", "junk", "auto_reply"].includes(precedence)) return true;
  // Auto-generated mail: DMARC reports, vacation replies, system notices
  const autoSubmitted = (getHeader(headers, "Auto-Submitted") || "").toLowerCase();
  if (autoSubmitted && autoSubmitted !== "no") return true;
  if (getHeader(headers, "X-Auto-Response-Suppress")) return true;
  // Feedback-loop / DMARC aggregate reports ("Report Domain: …")
  if ((getHeader(headers, "Content-Type") || "").toLowerCase().includes("report-type=")) return true;
  return false;
}

export function extractBody(payload) {
  if (!payload) return "";

  // Direct text/plain body
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8").slice(0, 10000);
  }

  // Recurse into parts
  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return "";
}

// Core classifier: returns { tag, lang } in one LLM call.
// tag  in lead | not_lead | spam | unclassified
// lang in pl | en | de  (best-effort language of the sender; defaults to "pl")
export async function classifyEmailThreadFull(subject, bodyText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { tag: "unclassified", lang: "pl" };
  try {
    const openai = new OpenAI({ apiKey });
    const prompt = `Jesteś filtrem dla studia jubilerskiego AEJaCA (biżuteria autorska + druk 3D/laser).

Oceń poniższy e-mail i odpowiedz DOKŁADNIE w formacie "tag|lang" (jedna linia).

tag:
- "lead" (potencjalny klient pyta o biżuterię, wycenę, projekt, zamówienie, materiały lub usługi AEJaCA)
- "not_lead" (wiadomość ogólna, informacyjna, niebiznesowa)
- "spam" (alert systemowy, notyfikacja automatyczna, reklama, promo, newsletter, raport)

lang, język nadawcy: "pl", "en" albo "de" (jeśli niepewne, "pl").

Przykład odpowiedzi: lead|pl

Temat: ${subject}
Treść: ${(bodyText || "").slice(0, 800)}`;
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
      temperature: 0,
    });
    const raw = (resp.choices[0]?.message?.content || "").trim().toLowerCase();
    const [tagPart, langPart] = raw.split("|").map(s => (s || "").trim());
    const tag = ["lead", "not_lead", "spam"].includes(tagPart) ? tagPart : "unclassified";
    const lang = ["pl", "en", "de"].includes(langPart) ? langPart : "pl";
    return { tag, lang };
  } catch {
    return { tag: "unclassified", lang: "pl" };
  }
}

// Backward-compatible wrapper, returns just the tag string.
// Used by scripts/classify-threads.mjs.
export async function classifyEmailThread(subject, bodyText) {
  const { tag } = await classifyEmailThreadFull(subject, bodyText);
  return tag;
}

// Domains we never auto-reply to (our own mailboxes). Comma-separated env override.
const SELF_DOMAINS = (process.env.AUTOREPLY_SELF_DOMAINS || "aejaca.com")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

// Send an AEJaCA "thank you for contacting us" acknowledgement for a fresh
// client inquiry. The actual email is sent by n8n (same channel as the contact
// and quote forms); here we only decide *whether* to send and guard against
// duplicates and loops. Never throws — a failure here must not break ingestion.
export async function maybeSendAutoReply(pool, { threadDbId, toEmail, subject, lang, messageIdHeader, gmailMessageId, snippet }) {
  try {
    if (process.env.AUTOREPLY_ENABLED !== "true") return;
    if (!toEmail) return;
    // Never acknowledge our own outbound-looking senders.
    const domain = toEmail.split("@")[1] || "";
    if (SELF_DOMAINS.includes(domain)) return;

    const webhook = process.env.N8N_AUTOREPLY_WEBHOOK_URL;
    const dryRun = process.env.AUTOREPLY_DRY_RUN === "true";

    // Rate-limit: at most one acknowledgement per sender per 24h across threads.
    const recent = await pool.query(
      `SELECT 1 FROM email_threads et
         JOIN leads l ON l.id = et.lead_id
        WHERE l.email = $1 AND et.auto_replied_at > NOW() - INTERVAL '24 hours'
        LIMIT 1`,
      [toEmail]
    );
    if (recent.rows.length > 0) {
      console.log(`[autoreply] skip ${toEmail} — already acknowledged in last 24h`);
      return;
    }

    if (dryRun || !webhook) {
      console.log(`[autoreply] DRY_RUN would acknowledge ${toEmail} (lang=${lang}) re: "${(subject || "").slice(0, 60)}"`);
      return;
    }

    // Atomically claim this thread so we never send twice, even under races.
    const claim = await pool.query(
      `UPDATE email_threads SET auto_replied_at = NOW()
        WHERE id = $1 AND auto_replied_at IS NULL RETURNING id`,
      [threadDbId]
    );
    if (claim.rows.length === 0) return; // already acknowledged

    const payload = {
      to: toEmail,
      subject: subject || "",
      lang: ["pl", "en", "de"].includes(lang) ? lang : "pl",
      gmail_message_id: gmailMessageId || null,
      in_reply_to: messageIdHeader || null,
      snippet: snippet || "",
      source: "autoreply",
    };
    try {
      const r = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) console.error(`[autoreply] n8n webhook ${r.status} for ${toEmail}`);
      else console.log(`[autoreply] acknowledged ${toEmail} (lang=${payload.lang})`);
    } catch (err) {
      console.error(`[autoreply] webhook error for ${toEmail}:`, err.message);
    }
  } catch (err) {
    console.error("[autoreply] maybeSendAutoReply error:", err.message);
  }
}

export async function processGmailMessage(gmail, pool, messageId) {
  try {
    // Dedup check
    const existing = await pool.query(
      "SELECT id FROM email_messages WHERE gmail_message_id = $1",
      [messageId]
    );
    if (existing.rows.length > 0) return null;

    // Fetch full message
    const { data } = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const headers = data.payload?.headers || [];
    const from = getHeader(headers, "From") || "";
    const to = getHeader(headers, "To") || "";
    const cc = getHeader(headers, "Cc") || "";
    const subject = getHeader(headers, "Subject") || "";
    const labelIds = data.labelIds || [];
    const threadId = data.threadId;
    const snippet = (data.snippet || "").slice(0, 500);
    const messageIdHeader = getHeader(headers, "Message-ID") || "";
    const receivedAt = data.internalDate
      ? new Date(parseInt(data.internalDate)).toISOString()
      : new Date().toISOString();

    const bodyText = extractBody(data.payload);
    const direction = labelIds.includes("SENT") ? "outbound" : "inbound";

    // Skip automated inbound mail (newsletters, DMARC/domain reports,
    // autoresponders, mailing lists) — not real client correspondence.
    // Outbound (our own SENT replies) is always kept.
    if (direction === "inbound" && isAutomatedEmail(headers, from)) {
      return null;
    }

    // Determine which email to match against leads
    const matchEmail = direction === "outbound"
      ? extractEmail(to.split(",")[0])
      : extractEmail(from);

    let leadId = null;

    if (matchEmail) {
      const leadRes = await pool.query(
        "SELECT id FROM leads WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
        [matchEmail]
      );

      if (leadRes.rows.length > 0) {
        leadId = leadRes.rows[0].id;
      } else if (direction === "inbound") {
        // Auto-create lead for inbound emails from unknown senders
        const newLead = await pool.query(
          `INSERT INTO leads (email, lang, calculator, params, status) VALUES ($1, 'pl', 'email', $2, 'new') RETURNING id`,
          [matchEmail, subject.slice(0, 400)]
        );
        leadId = newLead.rows[0].id;
      }
    }

    // Find or create thread
    const threadRes = await pool.query(
      "SELECT id, lead_id FROM email_threads WHERE gmail_thread_id = $1",
      [threadId]
    );

    let threadDbId;
    if (threadRes.rows.length > 0) {
      threadDbId = threadRes.rows[0].id;
      const existingLeadId = threadRes.rows[0].lead_id;
      await pool.query(
        `UPDATE email_threads
         SET message_count = message_count + 1,
             last_message_at = $1,
             lead_id = COALESCE(lead_id, $2)
         WHERE id = $3`,
        [receivedAt, leadId, threadDbId]
      );
      if (!existingLeadId && leadId) {
        // lead_id was just set, already handled by COALESCE above
      }
    } else {
      const newThread = await pool.query(
        `INSERT INTO email_threads (gmail_thread_id, lead_id, subject, last_message_at, message_count)
         VALUES ($1, $2, $3, $4, 1) RETURNING id`,
        [threadId, leadId, subject.slice(0, 500), receivedAt]
      );
      threadDbId = newThread.rows[0].id;
      if (direction === "inbound") {
        const { tag, lang } = await classifyEmailThreadFull(subject, bodyText);
        if (tag !== "unclassified") {
          await pool.query("UPDATE email_threads SET tag = $1 WHERE id = $2", [tag, threadDbId]);
        }
        // Acknowledge genuine client inquiries with an AEJaCA thank-you note.
        // Only for brand-new inbound lead threads — never on ongoing replies,
        // never on not_lead/spam. Sending itself is delegated to n8n.
        if (tag === "lead") {
          await maybeSendAutoReply(pool, {
            threadDbId,
            toEmail: matchEmail,
            subject,
            lang,
            messageIdHeader,
            gmailMessageId: messageId,
            snippet,
          });
        }
      }
    }

    // Save message
    await pool.query(
      `INSERT INTO email_messages
         (thread_id, gmail_message_id, direction, from_addr, to_addr, cc_addr, subject, body_text, snippet, gmail_labels, received_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [threadDbId, messageId, direction, from.slice(0, 300), to, cc || null, subject.slice(0, 500), bodyText, snippet, labelIds, receivedAt]
    );

    // Update lead status for outbound
    if (direction === "outbound" && leadId) {
      await pool.query(
        `UPDATE leads
         SET contacted_at = COALESCE(contacted_at, $1),
             status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END
         WHERE id = $2`,
        [receivedAt, leadId]
      );
    }

    return { threadDbId, direction, leadId };
  } catch (err) {
    console.error("[gmail] processGmailMessage error:", err.message);
    return null;
  }
}

export async function processHistory(gmail, pool, startHistoryId) {
  let count = 0;
  try {
    const { data } = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
    });

    const history = data.history || [];
    for (const record of history) {
      const added = record.messagesAdded || [];
      for (const item of added) {
        const msgId = item.message?.id;
        if (!msgId) continue;
        const result = await processGmailMessage(gmail, pool, msgId);
        if (result) count++;
      }
    }
  } catch (err) {
    console.error("[gmail] processHistory error:", err.message);
  }
  return count;
}

export async function setupGmailWatch(gmail) {
  const { data } = await gmail.users.watch({
    userId: "me",
    requestBody: {
      labelIds: ["INBOX", "SENT"],
      topicName: process.env.GMAIL_PUBSUB_TOPIC,
    },
  });
  return { historyId: data.historyId, expiration: data.expiration };
}

// Poll Gmail for recent messages — used as fallback when Pub/Sub is unavailable.
// opts.query: Gmail search query (default last 15 min, for the 5-min cron).
// opts.maxPages: how many 100-message pages to walk per label (default 1;
//   raise for a one-time backfill over a wider window).
export async function pollRecentMessages(gmail, pool, opts = {}) {
  const query = opts.query || "newer_than:15m";
  const maxPages = opts.maxPages || 1;
  let count = 0;
  try {
    for (const label of ["INBOX", "SENT"]) {
      let pageToken;
      let pages = 0;
      do {
        const listRes = await gmail.users.messages.list({
          userId: "me",
          labelIds: [label],
          q: query,
          maxResults: 100,
          pageToken,
        });
        const messages = listRes.data.messages || [];
        for (const { id } of messages) {
          const result = await processGmailMessage(gmail, pool, id);
          if (result) count++;
        }
        pageToken = listRes.data.nextPageToken;
        pages++;
      } while (pageToken && pages < maxPages);
    }
  } catch (err) {
    console.error("[gmail] pollRecentMessages error:", err.message);
  }
  return count;
}
