// ============================================================
// MAILE PO OPLACONYM ZAMOWIENIU
// ============================================================
// Dwa maile: potwierdzenie dla klienta i powiadomienie do warsztatu.
// Wysylamy je WYLACZNIE raz, przy pierwszym SUCCESS z ITN. Autopay
// potrafi przyslac SUCCESS wielokrotnie, a klient nie powinien dostac
// trzech potwierdzen tego samego zamowienia.
//
// Kanal wysylki, w kolejnosci:
//  1. Gmail API, jesli sa dane OAuth (nie wymaga niczego wiecej),
//  2. webhook n8n, jesli ustawiono N8N_ORDER_WEBHOOK_URL,
//  3. jesli nic nie jest dostepne, logujemy i nie przerywamy obslugi ITN.
// Blad wysylki maila NIGDY nie moze wywrocic potwierdzenia platnosci.

// Lustro src/data/sellerInfo.js. Przy zmianie danych sprzedawcy poprawic w obu miejscach.
const SELLER = {
  brand: "AEJaCA",
  email: "contact@aejaca.com",
  phone: "+48 780 737 786",
  site: "https://www.aejaca.com",
};

// Adres wlasnego API, pod ktorym leza miniatury modeli. Bez niego mail
// warsztatowy po prostu nie pokaze podgladu, reszta dziala tak samo.
const API_BASE = (process.env.PUBLIC_API_URL || "").replace(/\/$/, "");

const INTERNAL_TO = process.env.ORDER_NOTIFY_EMAIL || SELLER.email;
const FROM = process.env.ORDER_FROM_EMAIL || SELLER.email;

const T = {
  pl: {
    subject: (ref) => `Potwierdzenie zamówienia ${ref}, AEJaCA`,
    hi: "Dzień dobry,",
    thanks: "dziękujemy za zamówienie i za dokonaną płatność. Poniżej podsumowanie.",
    orderNo: "Numer zamówienia",
    items: "Zamówione pozycje",
    delivery: "Dostawa",
    total: "Zapłacono",
    next: "Co dalej",
    nextBody:
      "Zabieramy się do pracy. Odezwiemy się, gdy zamówienie będzie gotowe do wysyłki lub odbioru. Jeśli coś w Twoim zleceniu będzie wymagało doprecyzowania, napiszemy wcześniej.",
    withdrawal: "Prawo odstąpienia",
    withdrawalBody:
      "Zamówienie dotyczy rzeczy wykonywanej według Twojej specyfikacji, więc zgodnie z art. 38 ustawy o prawach konsumenta i złożonym przez Ciebie oświadczeniem prawo odstąpienia od umowy nie przysługuje po rozpoczęciu wykonania.",
    questions: "Pytania",
    questionsBody: "Odpisz na tę wiadomość albo zadzwoń.",
    terms: "Regulamin",
    bye: "Pozdrawiamy",
    deliveryNames: { pickup: "Odbiór osobisty", inpost_locker: "Paczkomat InPost", courier: "Kurier", digital: "Dostawa cyfrowa" },
  },
  en: {
    subject: (ref) => `Order confirmation ${ref}, AEJaCA`,
    hi: "Hello,",
    thanks: "thank you for your order and for the payment. Here is the summary.",
    orderNo: "Order number",
    items: "Items ordered",
    delivery: "Delivery",
    total: "Paid",
    next: "What happens next",
    nextBody:
      "We are starting work. We will get in touch once your order is ready for shipping or collection. If anything in your order needs clarification, we will write to you earlier.",
    withdrawal: "Right of withdrawal",
    withdrawalBody:
      "This order concerns an item made to your specification, so under Article 38 of the Polish Consumer Rights Act and the statement you submitted, the right of withdrawal does not apply once production has begun.",
    questions: "Questions",
    questionsBody: "Just reply to this message or call us.",
    terms: "Terms of Service",
    bye: "Best regards",
    deliveryNames: { pickup: "Personal pickup", inpost_locker: "InPost locker", courier: "Courier", digital: "Digital delivery" },
  },
  de: {
    subject: (ref) => `Bestellbestätigung ${ref}, AEJaCA`,
    hi: "Guten Tag,",
    thanks: "vielen Dank für Ihre Bestellung und für die Zahlung. Nachfolgend die Zusammenfassung.",
    orderNo: "Bestellnummer",
    items: "Bestellte Positionen",
    delivery: "Lieferung",
    total: "Bezahlt",
    next: "Wie es weitergeht",
    nextBody:
      "Wir beginnen mit der Arbeit. Wir melden uns, sobald Ihre Bestellung zum Versand oder zur Abholung bereit ist. Sollte etwas an Ihrem Auftrag klärungsbedürftig sein, schreiben wir Ihnen vorher.",
    withdrawal: "Widerrufsrecht",
    withdrawalBody:
      "Die Bestellung betrifft eine nach Ihren Vorgaben gefertigte Sache. Gemäß Art. 38 des polnischen Verbraucherrechtsgesetzes und Ihrer abgegebenen Erklärung besteht nach Fertigungsbeginn kein Widerrufsrecht.",
    questions: "Fragen",
    questionsBody: "Antworten Sie einfach auf diese Nachricht oder rufen Sie uns an.",
    terms: "AGB",
    bye: "Mit freundlichen Grüßen",
    deliveryNames: { pickup: "Selbstabholung", inpost_locker: "InPost-Paketstation", courier: "Kurier", digital: "Digitale Lieferung" },
  },
};

const money = (grosze) => `${(grosze / 100).toFixed(2).replace(".", ",")} PLN`;

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function customerHtml(order, items, lang) {
  const l = T[lang] || T.pl;
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.title)} &times; ${i.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${money(i.line_grosze)}</td>
      </tr>`
    )
    .join("");

  const deliveryName = l.deliveryNames[order.delivery_method] || order.delivery_method || "";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
    <div style="font-size:12px;letter-spacing:2px;color:#b58a3c;font-weight:700;margin-bottom:18px">AEJACA</div>
    <p style="margin:0 0 6px">${l.hi}</p>
    <p style="margin:0 0 20px;line-height:1.6">${l.thanks}</p>

    <p style="margin:0 0 4px;font-size:12px;color:#777">${l.orderNo}</p>
    <p style="margin:0 0 20px;font-size:18px;font-weight:700;font-family:ui-monospace,monospace">${esc(order.order_ref)}</p>

    <p style="margin:0 0 6px;font-size:12px;color:#777">${l.items}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${l.delivery}: ${esc(deliveryName)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(order.shipping_grosze)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;font-weight:700">${l.total}</td>
        <td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px">${money(order.total_grosze)}</td>
      </tr>
    </table>

    <h3 style="font-size:14px;margin:24px 0 6px">${l.next}</h3>
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${l.nextBody}</p>

    <h3 style="font-size:14px;margin:20px 0 6px">${l.withdrawal}</h3>
    <p style="margin:0;line-height:1.6;font-size:13px;color:#666">${l.withdrawalBody}</p>

    <h3 style="font-size:14px;margin:20px 0 6px">${l.questions}</h3>
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${l.questionsBody}<br>
      ${SELLER.email} &middot; ${SELLER.phone}</p>

    <p style="margin:24px 0 0;font-size:12px;color:#999">
      ${l.bye},<br>${SELLER.brand}<br>
      <a href="${SELLER.site}/terms/" style="color:#b58a3c">${l.terms}</a>
    </p>
  </div></body></html>`;
}

function customerText(order, items, lang) {
  const l = T[lang] || T.pl;
  const lines = items.map((i) => `- ${i.title} x ${i.qty}: ${money(i.line_grosze)}`);
  return [
    l.hi,
    "",
    l.thanks,
    "",
    `${l.orderNo}: ${order.order_ref}`,
    "",
    `${l.items}:`,
    ...lines,
    `${l.delivery}: ${l.deliveryNames[order.delivery_method] || order.delivery_method || ""} ${money(order.shipping_grosze)}`,
    `${l.total}: ${money(order.total_grosze)}`,
    "",
    `${l.next}: ${l.nextBody}`,
    "",
    `${l.withdrawal}: ${l.withdrawalBody}`,
    "",
    `${l.questions}: ${SELLER.email}, ${SELLER.phone}`,
    "",
    `${l.bye}, ${SELLER.brand}`,
    `${SELLER.site}/terms/`,
  ].join("\n");
}

function internalText(order, items) {
  const lines = items.map(
    (i) => `- ${i.title} x ${i.qty} = ${money(i.line_grosze)}
  kalkulator: ${i.calculator}
  parametry: ${JSON.stringify(i.params)}${i.file_name ? `\n  plik: ${i.file_name} (sha256 ${String(i.file_sha256 || "").slice(0, 16)})${i.file_url ? `\n  Dysk: ${i.file_url}` : "\n  Dysk: link jeszcze nie dotarl z n8n"}${i.upload_token && API_BASE ? `\n  Podglad: ${API_BASE}/api/uploads/${i.upload_token}/thumb` : ""}` : ""}${
      i.geometry ? `\n  geometria: ${Number(i.geometry.volumeCm3).toFixed(2)} cm3, bbox ${i.geometry.bbox?.x}x${i.geometry.bbox?.y}x${i.geometry.bbox?.z} cm` : ""
    }`
  );
  return [
    `NOWE OPLACONE ZAMOWIENIE ${order.order_ref}`,
    "",
    `Kwota: ${money(order.total_grosze)}`,
    `Klient: ${order.customer_name || "(brak nazwiska)"} <${order.customer_email}>${order.customer_phone ? `, tel. ${order.customer_phone}` : ""}`,
    `Jezyk: ${order.lang}`,
    "",
    "Pozycje:",
    ...lines,
    "",
    `Dostawa: ${order.delivery_method || "-"}`,
    order.delivery_point ? `Paczkomat: ${order.delivery_point}` : "",
    order.address_line1 ? `Adres: ${order.address_line1}, ${order.postal_code || ""} ${order.city || ""}` : "",
    "",
    `Platnosc: ${order.payment_status} / ${order.payment_status_details || "-"}, remoteID ${order.payment_remote_id || "-"}`,
    `Zgody: regulamin ${order.accepted_terms_at ? "tak" : "NIE"}, art. 38 UPK ${order.waived_withdrawal_at ? "tak" : "NIE"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Wyodrebnione, zeby dalo sie obejrzec tresc maili bez wysylania ich komukolwiek */
export function buildOrderMessages(order, items) {
  const lang = ["pl", "en", "de"].includes(order.lang) ? order.lang : "pl";
  const l = T[lang];

  return [
    {
      to: order.customer_email,
      from: FROM,
      replyTo: SELLER.email,
      subject: l.subject(order.order_ref),
      text: customerText(order, items, lang),
      html: customerHtml(order, items, lang),
    },
    {
      to: INTERNAL_TO,
      from: FROM,
      replyTo: order.customer_email,
      subject: `[ZAMOWIENIE] ${order.order_ref}, ${money(order.total_grosze)}`,
      text: internalText(order, items),
      html: `<pre style="font-family:ui-monospace,monospace;font-size:13px;white-space:pre-wrap">${esc(internalText(order, items))}</pre>`,
    },
  ];
}

/** RFC 2822 w postaci, ktorej oczekuje Gmail API (base64url) */
function buildRaw({ to, from, subject, text, html, replyTo }) {
  const boundary = `bnd_${Math.random().toString(36).slice(2)}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);

  const body = [
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf8").toString("base64"),
    `--${boundary}--`,
    "",
  ];

  return Buffer.from(headers.concat(body).join("\r\n"), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendViaGmail(messages) {
  // Import dynamiczny, zeby brak googleapis nie wywracal calego modulu
  // przy starcie serwera. Poczta ma byc dodatkiem, nie warunkiem dzialania.
  const { createGmailClient } = await import("./gmail.js");
  const gmail = createGmailClient();
  if (!gmail) return false;
  for (const m of messages) {
    await gmail.users.messages.send({ userId: "me", requestBody: { raw: buildRaw(m) } });
  }
  return true;
}

async function sendViaWebhook(order, items) {
  const url = process.env.N8N_ORDER_WEBHOOK_URL;
  if (!url) return false;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order, items, source: "order_paid" }),
  });
  return resp.ok;
}

/**
 * Wysyla oba maile. Zwraca true, gdy udalo sie ktorymkolwiek kanalem.
 * Nigdy nie rzuca wyjatkiem: obsluga ITN musi sie zakonczyc potwierdzeniem
 * niezaleznie od tego, czy poczta zadziala.
 */
export async function sendOrderPaidEmails(pool, orderId) {
  try {
    const { rows: orders } = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    const order = orders[0];
    if (!order) return false;

    const { rows: items } = await pool.query(
      `SELECT oi.title, oi.qty, oi.unit_grosze, oi.line_grosze, oi.calculator, oi.params,
              oi.file_name, oi.file_sha256, oi.file_url, oi.geometry, u.token AS upload_token
         FROM order_items oi
         LEFT JOIN uploads u ON u.id = oi.upload_id
        WHERE oi.order_id = $1
        ORDER BY oi.id`,
      [orderId]
    );

    const messages = buildOrderMessages(order, items);
    try {
      if (await sendViaGmail(messages)) {
        console.log(`[order-mail] wyslano potwierdzenia dla ${order.order_ref} przez Gmail`);
        return true;
      }
    } catch (e) {
      console.error("[order-mail] Gmail nie zadzialal:", e.message);
    }

    try {
      if (await sendViaWebhook(order, items)) {
        console.log(`[order-mail] wyslano potwierdzenia dla ${order.order_ref} przez n8n`);
        return true;
      }
    } catch (e) {
      console.error("[order-mail] webhook nie zadzialal:", e.message);
    }

    console.error(`[order-mail] BRAK KANALU WYSYLKI, zamowienie ${order.order_ref} oplacone bez powiadomienia`);
    return false;
  } catch (e) {
    console.error("[order-mail] blad:", e.message);
    return false;
  }
}
