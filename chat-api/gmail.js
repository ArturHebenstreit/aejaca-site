import { google } from "googleapis";

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
    const receivedAt = data.internalDate
      ? new Date(parseInt(data.internalDate)).toISOString()
      : new Date().toISOString();

    const bodyText = extractBody(data.payload);
    const direction = labelIds.includes("SENT") ? "outbound" : "inbound";

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

// Poll Gmail for recent messages — used as fallback when Pub/Sub is unavailable
export async function pollRecentMessages(gmail, pool) {
  let count = 0;
  try {
    // Fetch recent INBOX and SENT messages (last 15 minutes)
    for (const label of ["INBOX", "SENT"]) {
      const listRes = await gmail.users.messages.list({
        userId: "me",
        labelIds: [label],
        q: "newer_than:15m",
        maxResults: 20,
      });
      const messages = listRes.data.messages || [];
      for (const { id } of messages) {
        const result = await processGmailMessage(gmail, pool, id);
        if (result) count++;
      }
    }
  } catch (err) {
    console.error("[gmail] pollRecentMessages error:", err.message);
  }
  return count;
}
