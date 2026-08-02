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
    thanksTransfer: "potwierdzamy wpływ Twojej wpłaty. Poniżej podsumowanie zamówienia. Zabieramy się do pracy.",
    trSubject: (ref) => `Zamówienie ${ref}, dane do przelewu, AEJaCA`,
    trIntro: "dziękujemy za zamówienie. Nic nie zostało jeszcze pobrane. Poniżej dane do przelewu.",
    trAmount: "Kwota do przelewu",
    trIban: "Numer rachunku (IBAN)",
    trBic: "BIC / SWIFT",
    trHolder: "Odbiorca",
    trBank: "Bank",
    trRef: "Tytuł przelewu",
    trDue: "Rezerwacja i kwota obowiązują do",
    trSteps: "Co się wydarzy dalej",
    trStepsBody: "Gdy pieniądze wpłyną na konto, potwierdzamy to ręcznie i wysyłamy potwierdzenie przyjęcia należności wraz z informacją o rozpoczęciu prac. Termin realizacji liczymy od zaksięgowania wpłaty, nie od złożenia zamówienia. Prosimy o zachowanie tytułu przelewu, po nim rozpoznajemy zamówienie. Towar i kwota są dla Ciebie zarezerwowane przez 3 dni robocze. Jeżeli czwartego dnia roboczego wpłata nie zostanie zaksięgowana na wskazanym koncie, rezerwacja zostaje zdjęta, a towar wraca do sprzedaży.",
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
    thanksTransfer: "we confirm that your payment has arrived. Here is the summary of your order. We are starting work.",
    trSubject: (ref) => `Order ${ref}, transfer details, AEJaCA`,
    trIntro: "thank you for your order. Nothing has been charged yet. Below are the transfer details.",
    trAmount: "Amount to transfer",
    trIban: "Account number (IBAN)",
    trBic: "BIC / SWIFT",
    trHolder: "Beneficiary",
    trBank: "Bank",
    trRef: "Payment reference",
    trDue: "Reservation and amount valid until",
    trSteps: "What happens next",
    trStepsBody: "Once the money lands on our account we confirm it by hand and send you a receipt confirmation together with a note that work has started. The lead time is counted from the day the money clears, not from the day you ordered. Please keep the payment reference, that is how we recognise your order. The goods and the amount are reserved for you for 3 business days. If the payment has not cleared on the stated account by the fourth business day, the reservation is released and the goods go back on sale.",
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
    thanksTransfer: "wir bestätigen den Eingang Ihrer Zahlung. Nachfolgend die Zusammenfassung Ihrer Bestellung. Wir beginnen mit der Arbeit.",
    trSubject: (ref) => `Bestellung ${ref}, Überweisungsdaten, AEJaCA`,
    trIntro: "vielen Dank für Ihre Bestellung. Es wurde noch nichts abgebucht. Nachfolgend die Überweisungsdaten.",
    trAmount: "Zu überweisender Betrag",
    trIban: "Kontonummer (IBAN)",
    trBic: "BIC / SWIFT",
    trHolder: "Empfänger",
    trBank: "Bank",
    trRef: "Verwendungszweck",
    trDue: "Reservierung und Betrag gültig bis",
    trSteps: "Wie es weitergeht",
    trStepsBody: "Sobald das Geld auf unserem Konto eingeht, bestätigen wir es persönlich und senden Ihnen die Zahlungsbestätigung samt Hinweis, dass die Arbeit beginnt. Die Lieferzeit zählt ab Geldeingang, nicht ab Bestelldatum. Bitte behalten Sie den Verwendungszweck bei, daran erkennen wir Ihre Bestellung. Ware und Betrag sind 3 Werktage lang für Sie reserviert. Ist die Zahlung bis zum vierten Werktag nicht auf dem angegebenen Konto eingegangen, wird die Reservierung aufgehoben und die Ware geht zurück in den Verkauf.",
  },
};

const money = (grosze) => `${(grosze / 100).toFixed(2).replace(".", ",")} PLN`;

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/** Przy przelewie klient przelal euro, wiec taka kwote ma zobaczyc.
 *  W zlotowkach rozliczamy sie dalej, ale to jego nie dotyczy. */
function paidAmount(order) {
  return order.payment_method === "bank_transfer" && order.amount_eur_cents != null
    ? `${(order.amount_eur_cents / 100).toFixed(2)} EUR`
    : money(order.total_grosze);
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
    <p style="margin:0 0 20px;line-height:1.6">${order.payment_method === "bank_transfer" ? l.thanksTransfer : l.thanks}</p>

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
        <td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px">${paidAmount(order)}</td>
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
    order.payment_method === "bank_transfer" ? l.thanksTransfer : l.thanks,
    "",
    `${l.orderNo}: ${order.order_ref}`,
    "",
    `${l.items}:`,
    ...lines,
    `${l.delivery}: ${l.deliveryNames[order.delivery_method] || order.delivery_method || ""} ${money(order.shipping_grosze)}`,
    `${l.total}: ${paidAmount(order)}`,
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

function internalText(order, items, attachments = []) {
  const lines = items.map(
    (i) => `- ${i.title} x ${i.qty} = ${money(i.line_grosze)}
  kalkulator: ${i.calculator}
  parametry: ${JSON.stringify(i.params)}${i.params?.description ? `\n  OPIS OD KLIENTA: ${i.params.description}` : ""}${i.params?.personalization ? `\n  GRAWER NA WYROBIE: ${i.params.personalization}` : ""}${i.params?.packagingText ? `\n  GRAWER NA WIEKU: ${i.params.packagingText}` : ""}${i.params?.packagingTextBack ? `\n  GRAWER WEWNATRZ WIEKA: ${i.params.packagingTextBack}` : ""}${i.file_name ? `\n  plik: ${i.file_name} (sha256 ${String(i.file_sha256 || "").slice(0, 16)})${i.file_url ? `\n  Dysk: ${i.file_url}` : "\n  Dysk: link jeszcze nie dotarl z n8n"}${i.upload_token && API_BASE ? `\n  Podglad: ${API_BASE}/api/uploads/${i.upload_token}/thumb` : ""}` : ""}${
      i.geometry ? `\n  geometria: ${Number(i.geometry.volumeCm3).toFixed(2)} cm3, bbox ${i.geometry.bbox?.x}x${i.geometry.bbox?.y}x${i.geometry.bbox?.z} cm` : ""
    }`
  );
  const attachmentLines = attachments.length
    ? ["", "ZALACZNIKI (projekty do wykonania):",
       ...attachments.map((a) => `- ${a.file_name}${a.drive_url ? `\n  Dysk: ${a.drive_url}` : "\n  Dysk: link jeszcze nie dotarl z n8n"}`)]
    : [];

  return [
    `NOWE OPLACONE ZAMOWIENIE ${order.order_ref}`,
    "",
    `Kwota: ${money(order.total_grosze)}`,
    `Klient: ${order.customer_name || "(brak nazwiska)"} <${order.customer_email}>${order.customer_phone ? `, tel. ${order.customer_phone}` : ""}`,
    `Jezyk: ${order.lang}`,
    "",
    "Pozycje:",
    ...lines,
    ...attachmentLines,
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
export function buildOrderMessages(order, items, attachments = []) {
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
      text: internalText(order, items, attachments),
      html: `<pre style="font-family:ui-monospace,monospace;font-size:13px;white-space:pre-wrap">${esc(internalText(order, items, attachments))}</pre>`,
    },
  ];
}

// ------------------------------------------------------------
// Mail z danymi do przelewu
// ------------------------------------------------------------
// Wysylany od razu po zlozeniu zamowienia, zanim cokolwiek wplynie. Klient
// musi miec te dane poza przegladarka, bo strone zamknie, a przelew zrobi
// wieczorem z telefonu.
function transferRows(l, tr) {
  return [
    [l.trIban, tr.iban],
    [l.trBic, tr.bic],
    [l.trHolder, tr.holder],
    [l.trBank, tr.bank],
    [l.trRef, tr.reference],
    [l.trDue, tr.dueAt ? new Date(tr.dueAt).toISOString().slice(0, 10) : null],
  ].filter(([, v]) => v);
}

export function buildTransferMessage(order, tr) {
  const lang = ["pl", "en", "de"].includes(order.lang) ? order.lang : "en";
  const l = T[lang];
  const rows = transferRows(l, tr);

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
    <div style="font-size:12px;letter-spacing:2px;color:#b58a3c;font-weight:700;margin-bottom:18px">AEJACA</div>
    <p style="margin:0 0 6px">${l.hi}</p>
    <p style="margin:0 0 20px;line-height:1.6">${l.trIntro}</p>

    <div style="border:1px solid #eee;border-radius:10px;padding:18px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-size:12px;color:#777">${l.trAmount}</p>
      <p style="margin:0 0 16px;font-size:26px;font-weight:800">${tr.amountEur} EUR</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${rows.map(([k, v]) => `<tr>
          <td style="padding:6px 0;color:#777;white-space:nowrap;vertical-align:top">${esc(k)}</td>
          <td style="padding:6px 0;text-align:right;font-family:ui-monospace,monospace;word-break:break-all">${esc(String(v))}</td>
        </tr>`).join("")}
      </table>
    </div>

    <h3 style="font-size:14px;margin:0 0 6px">${l.trSteps}</h3>
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${l.trStepsBody}</p>

    <h3 style="font-size:14px;margin:20px 0 6px">${l.questions}</h3>
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${l.questionsBody}<br>
      ${SELLER.email} &middot; ${SELLER.phone}</p>

    <p style="margin:24px 0 0;font-size:12px;color:#999">
      ${l.bye},<br>${SELLER.brand}<br>
      <a href="${SELLER.site}/terms/" style="color:#b58a3c">${l.terms}</a>
    </p>
  </div></body></html>`;

  const text = [
    l.hi, "", l.trIntro, "",
    `${l.trAmount}: ${tr.amountEur} EUR`,
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "", `${l.trSteps}: ${l.trStepsBody}`,
    "", `${l.questions}: ${SELLER.email}, ${SELLER.phone}`,
    "", `${l.bye}, ${SELLER.brand}`,
  ].join("\n");

  return { to: order.customer_email, from: FROM, replyTo: SELLER.email, subject: l.trSubject(order.order_ref), text, html };
}

/** Mail z danymi do przelewu plus kopia dla nas, zebysmy wiedzieli, na co czekamy */
export async function sendTransferInstructions(pool, orderId, tr) {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    const order = rows[0];
    if (!order) return false;

    const messages = [
      buildTransferMessage(order, tr),
      {
        to: INTERNAL_TO, from: FROM, replyTo: order.customer_email,
        subject: `[PRZELEW] ${order.order_ref}, ${tr.amountEur} EUR, czekamy na wplate`,
        text: [
          `ZAMOWIENIE ${order.order_ref} ZLOZONE, PLATNOSC PRZELEWEM`,
          "",
          `Kwota: ${tr.amountEur} EUR (${money(order.total_grosze)} po kursie ${order.eur_rate})`,
          `Klient: ${order.customer_name || "(brak nazwiska)"} <${order.customer_email}>`,
          `Tytul przelewu: ${tr.reference}`,
          `Kwota wazna do: ${tr.dueAt ? new Date(tr.dueAt).toISOString().slice(0, 10) : "-"}`,
          "",
          "Po zaksiegowaniu potwierdz wplate, wtedy pojda maile i pliki trafia do Zamowien.",
        ].join("\n"),
      },
    ];

    try {
      if (await sendViaGmail(messages)) {
        console.log(`[przelew-mail] wyslano dane do przelewu dla ${order.order_ref}`);
        return true;
      }
    } catch (e) {
      console.error("[przelew-mail] Gmail nie zadzialal:", e.message);
    }
    console.error(`[przelew-mail] BRAK KANALU WYSYLKI dla ${order.order_ref}`);
    return false;
  } catch (e) {
    console.error("[przelew-mail] blad:", e.message);
    return false;
  }
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

    // Rysunki techniczne wisza przy zamowieniu, nie przy linii, wiec bierzemy
    // je osobno. Bez tego warsztat dostalby zlecenie bez projektu do wyciecia.
    const { rows: attachments } = await pool.query(
      `SELECT file_name, drive_url, file_sha256
         FROM uploads
        WHERE order_id = $1 AND geometry IS NULL
        ORDER BY id`,
      [orderId]
    );

    const messages = buildOrderMessages(order, items, attachments);
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
