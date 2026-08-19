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

// Dane sprzedawcy jada z src/data/sellerInfo.js przez `npm run sync:pricing`.
// Reczne lustro zdazylo sie juz rozjechac z oryginalem, a te dane stoja
// w pouczeniu o odstapieniu, wiec musza byc jedne.
import { DOWNLOAD_DAYS, MAX_DOWNLOADS } from "./digitalDelivery.js";
import { SELLER as SELLER_DATA } from "./pricing/sellerInfo.js";
import { withdrawalSummary, REGIME } from "./withdrawal.js";
import { describeFinding } from "./pricing/quoteSummary.js";

const SELLER = {
  ...SELLER_DATA,
  brand: SELLER_DATA.brandName,
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
    printTitle: "Uwagi do modelu, potwierdzone przy zamówieniu",
    printIntro: "Przed dodaniem pozycji do koszyka pokazaliśmy poniższe uwagi do przesłanego pliku, a Ty potwierdziłeś polecenie wykonania wydruku mimo nich. Powtarzamy je tutaj, żeby zostały udokumentowane po obu stronach.",
    printAccepted: "Potwierdzenie zaznaczone przy dodawaniu pozycji do koszyka.",
    printRights: "To nie ogranicza Twoich uprawnień konsumenta. Oznacza tylko, że wydruk wykonujemy według Twojej specyfikacji, mimo ujawnionej właściwości pliku, więc jej skutek nie będzie traktowany jako nasza wada wykonania.",
    printSettings: (tech, nozzle) => nozzle ? `Ustawienia: ${tech}, dysza ${nozzle} mm.` : `Ustawienia: ${tech}.`,
    nextBody:
      "Zabieramy się do pracy. Odezwiemy się, gdy zamówienie będzie gotowe do wysyłki lub odbioru. Jeśli coś w Twoim zleceniu będzie wymagało doprecyzowania, napiszemy wcześniej.",
    filesTitle: "Pliki do pobrania",
    filesIntro: (dni, ile) =>
      `Zamówione pliki są gotowe. Link działa ${dni} dni i wystarcza na ${ile} pobrań, więc spokojnie pobierz je od razu i zachowaj kopię. Paczka ZIP zawiera STL i 3MF: STL rozumie każdy program, a 3MF niesie jednostkę, więc drukarka nie pomyli milimetrów z calami.`,
    filesCta: "Pobierz pliki",
    filesNominal: "Model jest nominalny, w wymiarach gotowego pierścionka, bez kompensacji skurczu odlewniczego. Jeśli odlewasz u siebie, powiększ go najpierw naszym kalkulatorem skurczu.",
    withdrawal: "Prawo odstąpienia",
    wdStandard:
      "Masz 14 dni na odstąpienie od umowy bez podania przyczyny, licząc od dnia, w którym odebrałeś przesyłkę. Wystarczy wiadomość na contact@aejaca.com, nie trzeba podawać powodu ani używać żadnego formularza. Zwracamy wszystkie otrzymane płatności, w tym koszt najtańszej oferowanej dostawy, w ciągu 14 dni od otrzymania oświadczenia. Bezpośredni koszt odesłania rzeczy ponosisz Ty.",
    wdMadeToOrder:
      "Zamówienie dotyczy rzeczy wykonywanej według Twojej specyfikacji, więc zgodnie z art. 38 pkt 3 ustawy o prawach konsumenta i złożonym przez Ciebie oświadczeniem prawo odstąpienia od umowy nie przysługuje po rozpoczęciu wykonania.",
    wdDigital:
      "Zamówienie obejmuje treść cyfrową dostarczaną poza nośnikiem materialnym. Zgodnie z art. 38 pkt 13 ustawy o prawach konsumenta i Twoją wyraźną zgodą prawo odstąpienia wygasa z chwilą rozpoczęcia pobierania.",
    wdMixedCovered: "Prawo odstąpienia w terminie 14 dni obejmuje:",
    wdMixedExcluded: "Prawo odstąpienia nie obejmuje poniższych pozycji, bo powstają pod Twoje zamówienie albo są treścią cyfrową:",
    wdFormTitle: "Wzór formularza odstąpienia od umowy",
    wdFormNote: "Formularz jest dobrowolny, wystarczy zwykła wiadomość. Zostawiamy go, żebyś nie musiał go szukać.",
    wdForm: [
      "Adresat: {seller}, {address}, contact@aejaca.com",
      "Ja niniejszym informuję o moim odstąpieniu od umowy sprzedaży następujących rzeczy:",
      "Numer zamówienia: {ref}",
      "Data odbioru:",
      "Imię i nazwisko konsumenta:",
      "Adres konsumenta:",
      "Data:",
      "Podpis (tylko jeżeli formularz jest przesyłany w wersji papierowej):",
    ],
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
    printTitle: "Notes on the model, confirmed with the order",
    printIntro: "Before this item went into the cart we showed you the notes below on the file you supplied, and you confirmed an instruction to print despite them. We repeat them here so the record exists on both sides.",
    printAccepted: "Confirmation ticked when the item was added to the cart.",
    printRights: "This does not limit your consumer rights. It only means we print to your specification despite the disclosed property of the file, so its consequence will not be treated as a fault in our workmanship.",
    printSettings: (tech, nozzle) => nozzle ? `Settings: ${tech}, ${nozzle} mm nozzle.` : `Settings: ${tech}.`,
    nextBody:
      "We are starting work. We will get in touch once your order is ready for shipping or collection. If anything in your order needs clarification, we will write to you earlier.",
    filesTitle: "Your files",
    filesIntro: (dni, ile) =>
      `Your files are ready. The link is valid for ${dni} days and allows ${ile} downloads, so download them now and keep a copy. The ZIP holds an STL and a 3MF: every program reads STL, while 3MF carries the unit, so your printer will not mistake millimetres for inches.`,
    filesCta: "Download the files",
    filesNominal: "The model is nominal, at finished ring dimensions, with no casting shrinkage compensation. If you cast it yourself, scale it up first with our shrinkage calculator.",
    withdrawal: "Right of withdrawal",
    wdStandard:
      "You have 14 days to withdraw from the contract without giving a reason, counted from the day you received the parcel. An email to contact@aejaca.com is enough, no reason and no form required. We refund every payment received, including the cost of the cheapest delivery we offer, within 14 days of receiving your statement. You bear the direct cost of returning the goods.",
    wdMadeToOrder:
      "This order concerns an item made to your specification, so under Article 38(3) of the Polish Consumer Rights Act and the statement you submitted, the right of withdrawal does not apply once production has begun.",
    wdDigital:
      "This order includes digital content supplied without a tangible medium. Under Article 38(13) of the Polish Consumer Rights Act and your express consent, the right of withdrawal ends once the download begins.",
    wdMixedCovered: "The 14-day right of withdrawal covers:",
    wdMixedExcluded: "It does not cover the items below, because they are made to your order or are digital content:",
    wdFormTitle: "Model withdrawal form",
    wdFormNote: "The form is optional, a plain message is enough. We include it so you do not have to look for it.",
    wdForm: [
      "To: {seller}, {address}, contact@aejaca.com",
      "I hereby give notice that I withdraw from the contract of sale of the following goods:",
      "Order number: {ref}",
      "Date of receipt:",
      "Consumer's name:",
      "Consumer's address:",
      "Date:",
      "Signature (only if this form is sent on paper):",
    ],
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
    printTitle: "Hinweise zum Modell, mit der Bestellung bestätigt",
    printIntro: "Bevor diese Position in den Warenkorb kam, haben wir Ihnen die folgenden Hinweise zur eingereichten Datei angezeigt, und Sie haben den Druckauftrag trotzdem bestätigt. Wir wiederholen sie hier, damit der Vorgang beidseitig dokumentiert ist.",
    printAccepted: "Bestätigung beim Hinzufügen zum Warenkorb angekreuzt.",
    printRights: "Das schränkt Ihre Verbraucherrechte nicht ein. Es bedeutet nur, dass wir nach Ihrer Vorgabe drucken, trotz der offengelegten Eigenschaft der Datei, sodass deren Folge nicht als Mangel unserer Ausführung gilt.",
    printSettings: (tech, nozzle) => nozzle ? `Einstellungen: ${tech}, Düse ${nozzle} mm.` : `Einstellungen: ${tech}.`,
    nextBody:
      "Wir beginnen mit der Arbeit. Wir melden uns, sobald Ihre Bestellung zum Versand oder zur Abholung bereit ist. Sollte etwas an Ihrem Auftrag klärungsbedürftig sein, schreiben wir Ihnen vorher.",
    filesTitle: "Ihre Dateien",
    filesIntro: (dni, ile) =>
      `Ihre Dateien sind fertig. Der Link gilt ${dni} Tage und erlaubt ${ile} Downloads, laden Sie sie also gleich herunter und bewahren Sie eine Kopie auf. Das ZIP enthält STL und 3MF: STL liest jedes Programm, 3MF trägt die Einheit, damit Ihr Drucker Millimeter nicht für Zoll hält.`,
    filesCta: "Dateien herunterladen",
    filesNominal: "Das Modell ist nominal, in den Maßen des fertigen Rings, ohne Schwindungskompensation. Wenn Sie selbst gießen, skalieren Sie es zuerst mit unserem Schwindungsrechner.",
    withdrawal: "Widerrufsrecht",
    wdStandard:
      "Sie haben 14 Tage Zeit, ohne Angabe von Gründen vom Vertrag zurückzutreten, gerechnet ab dem Tag, an dem Sie die Sendung erhalten haben. Eine Nachricht an contact@aejaca.com genügt, ohne Begründung und ohne Formular. Wir erstatten alle erhaltenen Zahlungen einschließlich der Kosten der günstigsten von uns angebotenen Lieferung innerhalb von 14 Tagen nach Eingang Ihrer Erklärung. Die unmittelbaren Kosten der Rücksendung tragen Sie.",
    wdMadeToOrder:
      "Die Bestellung betrifft eine nach Ihren Vorgaben gefertigte Sache. Gemäß Art. 38 Nr. 3 des polnischen Verbraucherrechtsgesetzes und Ihrer abgegebenen Erklärung besteht nach Fertigungsbeginn kein Widerrufsrecht.",
    wdDigital:
      "Die Bestellung umfasst digitale Inhalte, die nicht auf einem körperlichen Datenträger geliefert werden. Gemäß Art. 38 Nr. 13 des polnischen Verbraucherrechtsgesetzes und Ihrer ausdrücklichen Zustimmung erlischt das Widerrufsrecht mit Beginn des Downloads.",
    wdMixedCovered: "Das 14-tägige Widerrufsrecht gilt für:",
    wdMixedExcluded: "Nicht erfasst sind die folgenden Positionen, da sie nach Ihren Vorgaben gefertigt werden oder digitale Inhalte sind:",
    wdFormTitle: "Muster-Widerrufsformular",
    wdFormNote: "Das Formular ist freiwillig, eine formlose Nachricht genügt. Wir legen es bei, damit Sie nicht danach suchen müssen.",
    wdForm: [
      "An: {seller}, {address}, contact@aejaca.com",
      "Hiermit widerrufe ich den Vertrag über den Kauf der folgenden Waren:",
      "Bestellnummer: {ref}",
      "Erhalten am:",
      "Name des Verbrauchers:",
      "Anschrift des Verbrauchers:",
      "Datum:",
      "Unterschrift (nur bei Mitteilung auf Papier):",
    ],
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

/**
 * Pouczenie o odstapieniu, dobrane do tego, co jest w zamowieniu.
 *
 * Zwraca akapity i, gdy cokolwiek jest objete prawem, wzor formularza.
 * Zamowienie mieszane dostaje obie listy z nazwami pozycji, zeby klient
 * wiedzial, czego dotyczy ktore zdanie, zamiast zgadywac.
 */
function withdrawalParts(order, items, l) {
  const w = withdrawalSummary(items);
  const paras = [];

  if (w.single === REGIME.STANDARD) paras.push(l.wdStandard);
  else if (w.single === REGIME.MADE_TO_ORDER) paras.push(l.wdMadeToOrder);
  else if (w.single === REGIME.DIGITAL) paras.push(l.wdDigital);
  else if (w.mixed) {
    if (w.hasCovered) {
      paras.push(`${l.wdMixedCovered} ${w.covered.map((i) => i.title).join(", ")}.`);
      paras.push(l.wdStandard);
    }
    if (w.hasExcluded) {
      paras.push(`${l.wdMixedExcluded} ${w.excluded.map((i) => i.title).join(", ")}.`);
    }
  }

  const form = w.hasCovered
    ? l.wdForm.map((line) =>
        line
          .replace("{seller}", SELLER.legalName)
          .replace("{address}", SELLER.addressLines.join(", "))
          .replace("{ref}", order.order_ref))
    : null;

  return { paras, form, note: form ? l.wdFormNote : null, title: l.wdFormTitle };
}

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


// ------------------------------------------------------------
// Uwagi do modelu potwierdzone przy zamowieniu
// ------------------------------------------------------------
// Slownik ustalen bramki drukowalnosci stoi w src/pricing/quoteSummary.js,
// bo ten sam tekst opisuje model w kalkulatorze, w mailu z wycena i tutaj, w
// mailu do zamowienia. Trzy kopie tego samego zdania rozjezdzaja sie przy
// pierwszej poprawce redakcyjnej i nikt tego nie zauwaza.
//
// Do maila zamowienia trafiaja wylacznie ustalenia poziomu `blocker`, czyli
// te, ktore realnie wymagaly pokwitowania. Ostrzezenia klient widzial, ale
// ich nie potwierdzal, wiec przypominanie ich w dokumencie potwierdzajacym
// sugerowaloby zgode, ktorej nie bylo.
const TECH_NAME = { fdm: "FDM", msla: "MSLA" };

/**
 * Pozycje z potwierdzonymi uwagami do modelu, w jezyku zamowienia.
 * Zwraca puste, gdy nikt niczego nie potwierdzal.
 */
function acceptedPrintNotes(items, lang) {
  const out = [];
  for (const i of items) {
    const p = i.params?.printability;
    if (!p || !p.accepted) continue;
    const lines = (p.findings || [])
      .filter((f) => f.level === "blocker")
      .map((f) => describeFinding(f, lang))
      .filter(Boolean);
    if (lines.length) {
      out.push({ title: i.title, tech: TECH_NAME[p.tech] || p.tech, nozzle: p.nozzle, lines });
    }
  }
  return out;
}

/**
 * Adres, pod ktorym stoi API. Link do pliku prowadzi WPROST do niego, a nie
 * przez strone: strona i tak musialaby tylko przekierowac, a kazde ogniwo
 * miedzy mailem a plikiem to kolejne miejsce, w ktorym link moze umrzec.
 *
 * Braku adresu NIE zastepujemy zgadywaniem. Link zbudowany z bledna domena
 * wyglada jak dzialajacy i klient dowiaduje sie o usterce dopiero po
 * kliknieciu, a my nie dowiadujemy sie wcale. Bez adresu sekcja plikow po
 * prostu nie powstaje, a w dzienniku zostaje ostrzezenie.
 */
const API_URL = process.env.API_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null);

function downloadLinks(items) {
  const cyfrowe = items.filter((i) => i.download_token);
  if (!cyfrowe.length) return [];
  if (!API_URL) {
    console.warn("[mail] jest plik do wydania, ale brak API_URL, wiec link nie powstal");
    return [];
  }
  return cyfrowe.map((i) => ({
    title: i.title,
    url: `${API_URL}/api/download/${i.download_token}`,
    days: i.download_days ?? DOWNLOAD_DAYS,
    max: i.download_max ?? MAX_DOWNLOADS,
  }));
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
  const wd = withdrawalParts(order, items, l);
  const printNotes = acceptedPrintNotes(items, lang);
  const pliki = downloadLinks(items);

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

    ${pliki.length ? `
      <h3 style="font-size:14px;margin:24px 0 6px">${l.filesTitle}</h3>
      <p style="margin:0 0 12px;line-height:1.6;font-size:13px;color:#444">${esc(l.filesIntro(pliki[0].days, pliki[0].max))}</p>
      ${pliki.map((f) => `
        <p style="margin:0 0 10px">
          <a href="${esc(f.url)}" style="display:inline-block;background:#b58a3c;color:#fff;text-decoration:none;border-radius:6px;padding:10px 18px;font-size:14px;font-weight:700">${l.filesCta}</a>
          <span style="display:block;margin-top:4px;font-size:12px;color:#777">${esc(f.title)}</span>
        </p>`).join("")}
      <p style="margin:0 0 4px;line-height:1.6;font-size:12px;color:#777">${esc(l.filesNominal)}</p>
    ` : ""}

    <h3 style="font-size:14px;margin:24px 0 6px">${l.next}</h3>
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${l.nextBody}</p>

    ${printNotes.length ? `
      <h3 style="font-size:14px;margin:24px 0 6px">${l.printTitle}</h3>
      <p style="margin:0 0 10px;line-height:1.6;font-size:13px;color:#444">${esc(l.printIntro)}</p>
      ${printNotes.map((n) => `
        <div style="border:1px solid #e8d5d5;background:#fdf7f7;border-radius:8px;padding:12px;margin:0 0 10px">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700">${esc(n.title)}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#777">${esc(l.printSettings(n.tech, n.nozzle))}</p>
          <ul style="margin:0;padding-left:18px;font-size:13px;color:#444;line-height:1.6">
            ${n.lines.map((t) => `<li>${esc(t)}</li>`).join("")}
          </ul>
          <p style="margin:8px 0 0;font-size:12px;color:#777">${esc(l.printAccepted)}</p>
        </div>`).join("")}
      <p style="margin:0 0 4px;line-height:1.6;font-size:12px;color:#777">${esc(l.printRights)}</p>
    ` : ""}

    <h3 style="font-size:14px;margin:20px 0 6px">${l.withdrawal}</h3>
    ${wd.paras.map((t) => `<p style="margin:0 0 8px;line-height:1.6;font-size:13px;color:#666">${esc(t)}</p>`).join("")}
    ${wd.form ? `
      <p style="margin:12px 0 4px;font-size:12px;color:#888">${esc(wd.title)}. ${esc(wd.note)}</p>
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:12px;font-size:12px;color:#555;line-height:1.9">
        ${wd.form.map((line) => esc(line)).join("<br>")}
      </div>` : ""}

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
  const wd = withdrawalParts(order, items, l);
  const printNotes = acceptedPrintNotes(items, lang);
  const pliki = downloadLinks(items);
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
    // Link MUSI byc takze tutaj. Wersja tekstowa jest tym, co zostaje przy
    // wylaczonym HTML i w czytniku ekranu, a bez linku klient nie ma jak
    // dojsc do tego, za co zaplacil.
    ...(pliki.length ? [
      "",
      `${l.filesTitle}: ${l.filesIntro(pliki[0].days, pliki[0].max)}`,
      ...pliki.map((f) => `${f.title}: ${f.url}`),
      l.filesNominal,
    ] : []),
    "",
    `${l.next}: ${l.nextBody}`,
    // Wersja tekstowa jest tym, co przeczyta klient z czytnikiem ekranu i to,
    // co zostaje, gdy klient wylaczy HTML. Zapis o potwierdzonych uwagach musi
    // byc w obu, inaczej dokumentacja zalezy od ustawien poczty.
    ...(printNotes.length ? [
      "",
      `${l.printTitle}:`,
      l.printIntro,
      ...printNotes.flatMap((n) => [
        "",
        `${n.title}. ${l.printSettings(n.tech, n.nozzle)}`,
        ...n.lines.map((t) => `- ${t}`),
        l.printAccepted,
      ]),
      "",
      l.printRights,
    ] : []),
    "",
    `${l.withdrawal}: ${wd.paras.join(" ")}`,
    ...(wd.form ? ["", `${wd.title}:`, ...wd.form] : []),
    "",
    `${l.questions}: ${SELLER.email}, ${SELLER.phone}`,
    "",
    `${l.bye}, ${SELLER.brand}`,
    `${SELLER.site}/terms/`,
  ].join("\n");
}

// Podloze uslugi laserowej po ludzku. Bez tego wybor trafialby do pracowni
// wylacznie w blobie JSON z parametrami, a pole, ktorego sie nie czyta, nie
// istnieje: to od niego zalezy, czy czekamy na paczke od klienta, czy kupujemy
// material, i czy jest na czym zrobic probe parametrow.
const PODLOZE_PL = {
  own_item: "PRZEDMIOT KLIENTA, klient go przysyla",
  own_stock: "MATERIAL KLIENTA, klient go przysyla",
  our_stock: "material nasz",
};
const SPARE_PL = {
  extra: "dosyla sztuke na proby",
  unique: "PRZEDMIOT NIEPOWTARZALNY, zgoda na probe w miejscu niewidocznym",
};

function internalText(order, items, attachments = []) {
  const lines = items.map(
    (i) => `- ${i.title} x ${i.qty} = ${money(i.line_grosze)}
  kalkulator: ${i.calculator}
  parametry: ${JSON.stringify(i.params)}${i.params?.description ? `\n  OPIS OD KLIENTA: ${i.params.description}` : ""}${i.params?.podloze ? `\n  PODLOZE: ${PODLOZE_PL[i.params.podloze] || i.params.podloze}${i.params.spare ? `, ${SPARE_PL[i.params.spare] || i.params.spare}` : ""}${i.params.materialNote ? `, material: ${i.params.materialNote}` : ""}` : ""}${i.params?.personalization ? `\n  GRAWER NA WYROBIE: ${i.params.personalization}` : ""}${i.params?.packagingText ? `\n  GRAWER NA WIEKU: ${i.params.packagingText}` : ""}${i.params?.packagingTextBack ? `\n  GRAWER WEWNATRZ WIEKA: ${i.params.packagingTextBack}` : ""}${i.file_name ? `\n  plik: ${i.file_name} (sha256 ${String(i.file_sha256 || "").slice(0, 16)})${i.file_url ? `\n  Dysk: ${i.file_url}` : "\n  Dysk: link jeszcze nie dotarl z n8n"}${i.upload_token && API_BASE ? `\n  Podglad: ${API_BASE}/api/uploads/${i.upload_token}/thumb` : ""}` : ""}${
      i.geometry ? `\n  geometria: ${Number(i.geometry.volumeCm3).toFixed(2)} cm3, bbox ${i.geometry.bbox?.x}x${i.geometry.bbox?.y}x${i.geometry.bbox?.z} cm` : ""
    }${
      // Wyroznione, bo w warsztacie to jest instrukcja: drukowac mimo wykrytej
      // wady. Zakopane w JSON-ie parametrow zostaloby przeoczone.
      i.params?.printability?.accepted
        ? `\n  !! KLIENT POTWIERDZIL DRUK MIMO UWAG (${(i.params.printability.findings || []).filter((f) => f.level === "blocker").map((f) => f.id).join(", ")}), najcienszy mur ${i.params.printability.thinnestMm ?? "?"} mm, ${i.params.printability.tech}${i.params.printability.nozzle ? ` dysza ${i.params.printability.nozzle}` : ""}`
        : i.params?.printability?.blocked
        ? `\n  !! UWAGA: pozycja ma wykryte wady modelu BEZ potwierdzenia klienta, sprawdz przed drukiem`
        : ""
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
    // KIERUNEK ODWROTNY: jak klient dostarczy NAM swoj przedmiot. Pojawia sie
    // tylko przy zamowieniach, ktore tego wymagaja (naprawa, renowacja,
    // material powierzony), wiec pusta linia znaczy, ze nic nie przysyla.
    order.inbound_delivery
      ? `KLIENT DOSTARCZA NAM PRZEDMIOT: ${
          { inpost_locker: "paczkomat InPost", in_person: "osobiscie", courier: "kurierem" }[order.inbound_delivery]
          || order.inbound_delivery
        }`
      : "",
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
      // `item_type` oraz rodzaj i sposob sprzedazy produktu decyduja o tym,
      // ktore pouczenie o odstapieniu trafi do maila (withdrawal.js). Bez tych
      // trzech kolumn mail nie ma z czego wybierac i wysyla jedno dla wszystkich.
      // `download_token` decyduje o sekcji z plikami. Wiersz w `downloads`
      // powstaje tuz przed wyslaniem maila, wiec jesli go tu nie ma, to plik
      // nie zostal wydany i linku nie wolno obiecywac.
      `SELECT oi.title, oi.qty, oi.unit_grosze, oi.line_grosze, oi.calculator, oi.params,
              oi.file_name, oi.file_sha256, oi.file_url, oi.geometry, u.token AS upload_token,
              oi.item_type, p.kind AS product_kind, p.offer AS product_offer,
              d.token AS download_token, d.max_downloads AS download_max
         FROM order_items oi
         LEFT JOIN uploads u ON u.id = oi.upload_id
         LEFT JOIN products p ON p.id = oi.product_id
         LEFT JOIN downloads d ON d.order_item_id = oi.id
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

// ============================================================
// MAIL Z ZAPISANA WYCENA
// ============================================================
// To nie jest potwierdzenie zamowienia i nie moze go przypominac. Klient
// niczego nie kupil i niczym sie nie zobowiazal, wiec mail ma jedno zadanie:
// oddac mu link do wlasnej kalkulacji.
//
// Kopii do warsztatu tu nie ma. Zapisanie wyceny to czynnosc, ktora klient
// moze powtorzyc dziesiec razy przy przesuwaniu suwaka, a skrzynka zasypana
// wlasnymi powiadomieniami przestaje byc czytana takze wtedy, gdy przyjdzie
// prawdziwe zamowienie.

const QUOTE_T = {
  pl: {
    subject: (ref) => `Twoja wycena ${ref}, AEJaCA`,
    hi: "Dzień dobry,",
    intro: "poniżej wycena, którą zapisałeś na aejaca.com. Link otwiera ją w każdej chwili, także na innym urządzeniu.",
    items: "Wyceniane pozycje",
    total: "Razem",
    open: "Otwórz wycenę",
    validUntil: (d) => `Wycena obowiązuje do ${d}.`,
    metalNote:
      "Robocizna w tej kwocie jest wiążąca przez cały okres ważności. Wartość kruszcu przeliczamy w dniu zamówienia według bieżącego kursu, więc przy złocie i srebrze kwota końcowa może się nieznacznie różnić.",
    noObligation: "Zapisanie wyceny nie jest zamówieniem i do niczego nie zobowiązuje.",
    questions: "Pytania",
    bye: "Pozdrawiamy",
  },
  en: {
    subject: (ref) => `Your quote ${ref}, AEJaCA`,
    hi: "Hello,",
    intro: "here is the quote you saved on aejaca.com. The link opens it any time, on any device.",
    items: "Quoted items",
    total: "Total",
    open: "Open the quote",
    validUntil: (d) => `The quote is valid until ${d}.`,
    metalNote:
      "The labour in this amount is binding for the whole validity period. Precious metal is recalculated on the day of the order at the current rate, so for gold and silver the final amount may differ slightly.",
    noObligation: "Saving a quote is not an order and commits you to nothing.",
    questions: "Questions",
    bye: "Best regards",
  },
  de: {
    subject: (ref) => `Ihr Angebot ${ref}, AEJaCA`,
    hi: "Guten Tag,",
    intro: "hier ist das Angebot, das Sie auf aejaca.com gespeichert haben. Der Link öffnet es jederzeit, auch auf einem anderen Gerät.",
    items: "Kalkulierte Positionen",
    total: "Gesamt",
    open: "Angebot öffnen",
    validUntil: (d) => `Das Angebot gilt bis ${d}.`,
    metalNote:
      "Die Arbeitsleistung in diesem Betrag ist für den gesamten Gültigkeitszeitraum verbindlich. Edelmetall wird am Tag der Bestellung zum aktuellen Kurs neu berechnet, bei Gold und Silber kann der Endbetrag daher leicht abweichen.",
    noObligation: "Das Speichern eines Angebots ist keine Bestellung und verpflichtet zu nichts.",
    questions: "Fragen",
    bye: "Mit freundlichen Grüßen",
  },
};

function quoteMessage(quote, items, url) {
  const l = QUOTE_T[quote.lang] || QUOTE_T.pl;
  const rows = items.map((i) => ({
    label: `${i.title}${i.qty > 1 ? ` x ${i.qty}` : ""}`,
    value: money(i.line_grosze ?? i.unit_grosze ?? 0),
  }));

  const html = [
    `<p>${esc(l.hi)}</p>`,
    `<p>${esc(l.intro)}</p>`,
    `<h3>${esc(l.items)}</h3>`,
    "<table cellpadding=\"6\" style=\"border-collapse:collapse\">",
    ...rows.map((r) => `<tr><td>${esc(r.label)}</td><td align="right"><strong>${esc(r.value)}</strong></td></tr>`),
    `<tr><td style="border-top:1px solid #ddd">${esc(l.total)}</td><td align="right" style="border-top:1px solid #ddd"><strong>${esc(money(quote.total_grosze))}</strong></td></tr>`,
    "</table>",
    `<p><a href="${esc(url)}">${esc(l.open)}</a></p>`,
    quote.valid_until ? `<p>${esc(l.validUntil(String(quote.valid_until).slice(0, 10)))}</p>` : "",
    `<p style="color:#555">${esc(l.metalNote)}</p>`,
    `<p style="color:#555">${esc(l.noObligation)}</p>`,
    `<p>${esc(l.questions)}: ${esc(SELLER.email)}<br>${esc(l.bye)}, ${esc(SELLER.brand)}</p>`,
  ].filter(Boolean).join("\n");

  const text = [
    l.hi, "", l.intro, "",
    l.items + ":",
    ...rows.map((r) => `- ${r.label}: ${r.value}`),
    `${l.total}: ${money(quote.total_grosze)}`,
    "", `${l.open}: ${url}`,
    quote.valid_until ? `\n${l.validUntil(String(quote.valid_until).slice(0, 10))}` : "",
    "", l.metalNote,
    "", l.noObligation,
    "", `${l.questions}: ${SELLER.email}`,
    "", `${l.bye}, ${SELLER.brand}`,
  ].filter((line) => line !== null).join("\n");

  return { to: quote.customer_email, from: FROM, replyTo: SELLER.email, subject: l.subject(quote.quote_ref), text, html };
}

/**
 * Wysyla klientowi link do zapisanej wyceny.
 * Nigdy nie rzuca wyjatkiem: wycena jest juz zapisana, a nieudany mail nie
 * moze skasowac tego, co klient wlasnie zrobil.
 */
export async function sendQuoteLink(pool, quoteRef, url) {
  try {
    const { rows } = await pool.query("SELECT * FROM quotes WHERE quote_ref = $1", [String(quoteRef)]);
    const quote = rows[0];
    if (!quote?.customer_email) return false;

    const { rows: items } = await pool.query(
      "SELECT title, qty, unit_grosze, line_grosze FROM quote_items WHERE quote_id = $1 ORDER BY id",
      [quote.id]
    );

    try {
      if (await sendViaGmail([quoteMessage(quote, items, url)])) {
        console.log(`[wycena-mail] wyslano link do ${quote.quote_ref}`);
        return true;
      }
    } catch (e) {
      console.error("[wycena-mail] Gmail nie zadzialal:", e.message);
    }
    console.error(`[wycena-mail] BRAK KANALU WYSYLKI dla ${quote.quote_ref}`);
    return false;
  } catch (e) {
    console.error("[wycena-mail] blad:", e.message);
    return false;
  }
}
