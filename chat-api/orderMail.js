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
import { zoneForCountry, przewoznicyZNazwy, sledzenieUrl, sledzenieDomena } from "./pricing/shipping.js";
// Termin oferty liczy TA SAMA funkcja, ktora liczy go na stronie oferty
// i przy zamowieniu: dwie liczby na jedno pytanie sa gorsze niz brak jednej.
import { selectedQuoteItems, terminGrupy, SAVED_QUOTE_SOURCE } from "./quotes.js";
import { SELLER as SELLER_DATA } from "./pricing/sellerInfo.js";
import { koperta, stopkaText, odnosnikiText, dzien, dni as dniSlownie } from "./mailSzata.js";
import { withdrawalSummary, REGIME } from "./withdrawal.js";
import { describeFinding, distortionLine } from "./pricing/quoteSummary.js";

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
    dimsTitle: "Ustalone wymiary",
    dimsIntro: "Poniższe pozycje wykonamy w wymiarach zmienionych względem przysłanego pliku. Zapisujemy to jako ustalenie.",
    delivery: "Dostawa",
    total: "Zapłacono",
    leadTitle: "Termin realizacji",
    leadPlanned: (ile, data) => `${ile}. Planowana finalizacja: ${data}.`,
    leadDetails: (ile) => ile
      ? `Najpierw ustalimy z Tobą szczegóły, odezwiemy się w tej sprawie. Czas realizacji, ${ile}, liczymy dopiero od ustaleń.`
      : "Najpierw ustalimy z Tobą szczegóły, odezwiemy się w tej sprawie. Czas realizacji liczymy dopiero od ustaleń.",
    next: "Co dalej",
    printTitle: "Uwagi do modelu, potwierdzone przy zamówieniu",
    printIntro: "Przed dodaniem pozycji do koszyka pokazaliśmy poniższe uwagi do przesłanego pliku, a mimo nich zostało zaznaczone potwierdzenie polecenia wykonania wydruku. Powtarzamy je tutaj, żeby zostały udokumentowane po obu stronach.",
    printAccepted: "Potwierdzenie zaznaczone przy dodawaniu pozycji do koszyka.",
    printRights: "To nie ogranicza Twoich uprawnień konsumenta. Oznacza tylko, że wydruk wykonujemy według Twojej specyfikacji, mimo ujawnionej właściwości pliku, więc jej skutek nie będzie traktowany jako nasza wada wykonania.",
    printSettings: (tech, nozzle) => nozzle ? `Ustawienia: ${tech}, dysza ${nozzle} mm.` : `Ustawienia: ${tech}.`,
    // "Co dalej" konczy sie tym, co klient wybral przy zamowieniu, a nie
    // wyliczeniem obu mozliwosci: sposob dostawy stoi w tym samym mailu,
    // kilka wierszy wyzej.
    nextBody: {
      ship: "Zabieramy się do pracy. Odezwiemy się, gdy zamówienie będzie spakowane i pojedzie do Ciebie. Jeśli coś w Twoim zleceniu będzie wymagało doprecyzowania, napiszemy wcześniej.",
      pickup: "Zabieramy się do pracy. Odezwiemy się, gdy zamówienie będzie gotowe do odbioru, i umówimy godzinę. Jeśli coś w Twoim zleceniu będzie wymagało doprecyzowania, napiszemy wcześniej.",
      digital: "Zabieramy się do pracy. Odezwiemy się, gdy pliki będą gotowe do pobrania. Jeśli coś w Twoim zleceniu będzie wymagało doprecyzowania, napiszemy wcześniej.",
    },
    nextBodyPliki:
      "Pliki masz powyżej i są Twoje na zawsze. Nic nie wysyłamy i na nic nie czekasz. Gdyby link wygasł, zanim zdążysz pobrać, albo gdybyś potrzebował innego formatu, napisz do nas.",
    filesTitle: "Pliki do pobrania",
    filesIntro: (dni, ile) =>
      `Zamówione pliki są gotowe. Link działa ${dni} dni i wystarcza na ${ile} pobrań, więc spokojnie pobierz je od razu i zachowaj kopię. Paczka ZIP zawiera STL i 3MF: STL rozumie każdy program, a 3MF niesie jednostkę, więc drukarka nie pomyli milimetrów z calami.`,
    filesCta: "Pobierz pliki",
    filesNominal: "Model jest nominalny, w wymiarach gotowego pierścionka, bez kompensacji skurczu odlewniczego. Jeśli odlewasz u siebie, powiększ go najpierw naszym kalkulatorem skurczu.",
    withdrawal: "Prawo odstąpienia",
    wdStandard:
      "Masz 14 dni na odstąpienie od umowy bez podania przyczyny, licząc od dnia odebrania przesyłki. Wystarczy wiadomość na contact@aejaca.com, nie trzeba podawać powodu ani używać żadnego formularza. Zwracamy wszystkie otrzymane płatności, w tym koszt najtańszej oferowanej dostawy, w ciągu 14 dni od otrzymania oświadczenia. Bezpośredni koszt odesłania rzeczy ponosisz Ty.",
    wdMadeToOrder:
      "Zamówienie dotyczy rzeczy wykonywanej według Twojej specyfikacji, więc zgodnie z art. 38 pkt 3 ustawy o prawach konsumenta i złożonym przez Ciebie oświadczeniem prawo odstąpienia od umowy nie przysługuje po rozpoczęciu wykonania.",
    wdDigital:
      "Zamówienie obejmuje treść cyfrową dostarczaną poza nośnikiem materialnym. Zgodnie z art. 38 pkt 13 ustawy o prawach konsumenta i Twoją wyraźną zgodą prawo odstąpienia wygasa z chwilą rozpoczęcia pobierania.",
    wdMixedCovered: "Prawo odstąpienia w terminie 14 dni obejmuje:",
    wdMixedExcluded: "Prawo odstąpienia nie obejmuje poniższych pozycji, bo powstają pod Twoje zamówienie albo są treścią cyfrową:",
    wdSzczegoly: "Szczegóły i terminy znajdziesz pod adresem",
    wdZalacznik: "Wzór oświadczenia o odstąpieniu dołączyliśmy do tej wiadomości. Jest dobrowolny, wystarczy zwykła wiadomość na contact@aejaca.com.",
    wdPlik: "odstapienie-od-umowy",
    wdFormTitle: "Wzór oświadczenia o odstąpieniu od umowy",
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
    zdanieStatus: "Sprawdź status swojego zamówienia pod adresem ",
    zdanieStatusAlbo: " lub odwiedź ",
    zdanieStatusPodaj: (ref) => ` i podaj numer ${ref} oraz adres e-mail, na który przyszła ta wiadomość.`,
    zdanieProces: "Dowiedz się, jak wygląda proces realizacji zamówienia: ",
    zdanieRegulamin: "Regulamin serwisu znajdziesz pod adresem ",
    zdaniePlatnosci: "Jak przebiega płatność, przeczytasz pod adresem ",
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
    // ---- Wplata inna niz kwota zamowienia, i wygasniecie bez wplaty ----
    dpSubject: (ref) => `Zamówienie ${ref}, prosimy o dopłatę`,
    dpIntro: "Twoja wpłata dotarła, ale jest niższa od kwoty zamówienia. Poniżej różnica i dane do dopłaty. Zamówienie czeka, nic nie przepada.",
    dpWplynelo: "Wpłynęło",
    dpNalezne: "Kwota zamówienia",
    dpBrakuje: "Do dopłaty",
    dpTermin: (data) => `Na dopłatę czekamy do ${data}.`,
    dpCoDalej: "Jeżeli różnica nie dotrze do tego dnia, zamykamy zamówienie, a otrzymaną kwotę odsyłamy w całości na rachunek, z którego przyszła. Nic nie tracisz, zamówienie można złożyć ponownie w każdej chwili.",
    dpTytul: "Prosimy o tę samą nazwę w tytule przelewu, po niej rozpoznajemy zamówienie.",

    wgSubject: (ref) => `Zamówienie ${ref} zostało zamknięte`,
    wgIntro: "wpłata nie dotarła w terminie, więc zamykamy zamówienie, a zarezerwowany towar wraca do sprzedaży.",
    wgIntroCzesc: (kwota) => `wpłata nie została uzupełniona w terminie, więc zamykamy zamówienie, a zarezerwowany towar wraca do sprzedaży. Otrzymane ${kwota} odsyłamy na rachunek, z którego przyszły.`,
    wgPoTerminie: "Gdyby przelew wyszedł po tym terminie, zwrócimy go na rachunek nadawcy. Nie musisz o to prosić.",
    wgPonownie: "Zamówienie możesz złożyć ponownie w każdej chwili, na tych samych zasadach. Ceny kruszcu przeliczymy wtedy na nowo.",

    nadplata: (ile) => `Wpłynęło o ${ile} więcej niż kwota zamówienia. Nadwyżkę odsyłamy na rachunek, z którego przyszła.`,
    niedoplataDrobna: (ile) => `Wpłynęło o ${ile} mniej niż kwota zamówienia, zwykle bierze się to z prowizji banku pośredniczącego. Różnicę bierzemy na siebie, zamówienie jest opłacone w całości.`,
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
    dimsTitle: "Agreed dimensions",
    dimsIntro: "The items below will be made in dimensions changed from the file you sent. We record this as agreed.",
    delivery: "Delivery",
    total: "Paid",
    leadTitle: "Lead time",
    leadPlanned: (ile, data) => `${ile}. Planned completion: ${data}.`,
    leadDetails: (ile) => ile
      ? `We will agree the details with you first and will be in touch about it. The lead time of ${ile} starts only after that.`
      : "We will agree the details with you first and will be in touch about it. The lead time starts only after that.",
    next: "What happens next",
    printTitle: "Notes on the model, confirmed with the order",
    printIntro: "Before this item went into the cart we showed you the notes below on the file you supplied, and you confirmed an instruction to print despite them. We repeat them here so the record exists on both sides.",
    printAccepted: "Confirmation ticked when the item was added to the cart.",
    printRights: "This does not limit your consumer rights. It only means we print to your specification despite the disclosed property of the file, so its consequence will not be treated as a fault in our workmanship.",
    printSettings: (tech, nozzle) => nozzle ? `Settings: ${tech}, ${nozzle} mm nozzle.` : `Settings: ${tech}.`,
    nextBody: {
      ship: "We are starting work. We will write once your order is packed and on its way to you. If anything in your order needs clarification, we will write to you earlier.",
      pickup: "We are starting work. We will write once your order is ready for collection, and we will agree a time. If anything in your order needs clarification, we will write to you earlier.",
      digital: "We are starting work. We will write once your files are ready to download. If anything in your order needs clarification, we will write to you earlier.",
    },
    nextBodyPliki:
      "Your files are above and they are yours for good. Nothing is being shipped and there is nothing to wait for. If the link expires before you download them, or if you need another format, write to us.",
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
    wdSzczegoly: "The details and the deadlines are at",
    wdZalacznik: "The model withdrawal declaration is attached to this message. It is optional, a plain e-mail to contact@aejaca.com is enough.",
    wdPlik: "withdrawal-form",
    wdFormTitle: "Model withdrawal form",
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
    zdanieStatus: "Check the status of your order at ",
    zdanieStatusAlbo: " or go to ",
    zdanieStatusPodaj: (ref) => ` and enter the number ${ref} together with the e-mail address this message arrived at.`,
    zdanieProces: "Read how an order is made: ",
    zdanieRegulamin: "The terms of service are at ",
    zdaniePlatnosci: "How payment works is described at ",
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
    dpSubject: (ref) => `Order ${ref}, a top-up is needed`,
    dpIntro: "Your payment arrived, but it is lower than the order amount. Below is the difference and the details for the top-up. The order is waiting, nothing is lost.",
    dpWplynelo: "Received",
    dpNalezne: "Order amount",
    dpBrakuje: "Still due",
    dpTermin: (data) => `We will wait for the top-up until ${data}.`,
    dpCoDalej: "If the difference does not arrive by that day, we close the order and send the received amount back in full to the account it came from. Nothing is lost, and you can order again at any time.",
    dpTytul: "Please keep the same payment reference, that is how we recognise your order.",

    wgSubject: (ref) => `Order ${ref} has been closed`,
    wgIntro: "the payment did not arrive in time, so we are closing the order and the reserved goods go back on sale.",
    wgIntroCzesc: (kwota) => `the payment was not topped up in time, so we are closing the order and the reserved goods go back on sale. The ${kwota} we received is going back to the account it came from.`,
    wgPoTerminie: "Should the transfer leave after that date, we will return it to the sender's account. You do not need to ask.",
    wgPonownie: "You can place the order again at any time, on the same terms. Precious metal will be recalculated then at the current rate.",

    nadplata: (ile) => `That is ${ile} more than the order amount. We are sending the surplus back to the account it came from.`,
    niedoplataDrobna: (ile) => `That is ${ile} less than the order amount, usually a fee taken by an intermediary bank. We are covering the difference, your order is paid in full.`,
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
    dimsTitle: "Vereinbarte Maße",
    dimsIntro: "Die folgenden Positionen fertigen wir in gegenüber der eingesandten Datei geänderten Maßen. Wir halten das als Vereinbarung fest.",
    delivery: "Lieferung",
    total: "Bezahlt",
    leadTitle: "Lieferzeit",
    leadPlanned: (ile, data) => `${ile}. Geplante Fertigstellung: ${data}.`,
    leadDetails: (ile) => ile
      ? `Wir stimmen zuerst die Details mit Ihnen ab und melden uns dazu. Die Lieferzeit von ${ile} beginnt erst danach.`
      : "Wir stimmen zuerst die Details mit Ihnen ab und melden uns dazu. Die Lieferzeit beginnt erst danach.",
    next: "Wie es weitergeht",
    printTitle: "Hinweise zum Modell, mit der Bestellung bestätigt",
    printIntro: "Bevor diese Position in den Warenkorb kam, haben wir Ihnen die folgenden Hinweise zur eingereichten Datei angezeigt, und Sie haben den Druckauftrag trotzdem bestätigt. Wir wiederholen sie hier, damit der Vorgang beidseitig dokumentiert ist.",
    printAccepted: "Bestätigung beim Hinzufügen zum Warenkorb angekreuzt.",
    printRights: "Das schränkt Ihre Verbraucherrechte nicht ein. Es bedeutet nur, dass wir nach Ihrer Vorgabe drucken, trotz der offengelegten Eigenschaft der Datei, sodass deren Folge nicht als Mangel unserer Ausführung gilt.",
    printSettings: (tech, nozzle) => nozzle ? `Einstellungen: ${tech}, Düse ${nozzle} mm.` : `Einstellungen: ${tech}.`,
    nextBody: {
      ship: "Wir beginnen mit der Arbeit. Wir melden uns, sobald Ihre Bestellung verpackt ist und zu Ihnen unterwegs geht. Sollte etwas an Ihrem Auftrag klärungsbedürftig sein, schreiben wir Ihnen vorher.",
      pickup: "Wir beginnen mit der Arbeit. Wir melden uns, sobald Ihre Bestellung zur Abholung bereit ist, und vereinbaren eine Uhrzeit. Sollte etwas an Ihrem Auftrag klärungsbedürftig sein, schreiben wir Ihnen vorher.",
      digital: "Wir beginnen mit der Arbeit. Wir melden uns, sobald Ihre Dateien zum Download bereitstehen. Sollte etwas an Ihrem Auftrag klärungsbedürftig sein, schreiben wir Ihnen vorher.",
    },
    nextBodyPliki:
      "Ihre Dateien stehen oben und gehören dauerhaft Ihnen. Es wird nichts versandt und Sie warten auf nichts. Falls der Link abläuft, bevor Sie sie geladen haben, oder Sie ein anderes Format brauchen, schreiben Sie uns.",
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
    wdSzczegoly: "Einzelheiten und Fristen finden Sie unter",
    wdZalacznik: "Das Muster-Widerrufsformular liegt dieser Nachricht bei. Es ist freiwillig, eine formlose Nachricht an contact@aejaca.com genügt.",
    wdPlik: "widerrufsformular",
    wdFormTitle: "Muster-Widerrufsformular",
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
    zdanieStatus: "Den Status Ihrer Bestellung prüfen Sie unter ",
    zdanieStatusAlbo: " oder besuchen Sie ",
    zdanieStatusPodaj: (ref) => ` und geben Sie die Nummer ${ref} sowie die E-Mail-Adresse an, an die diese Nachricht ging.`,
    zdanieProces: "So läuft die Fertigung einer Bestellung ab: ",
    zdanieRegulamin: "Die AGB finden Sie unter ",
    zdaniePlatnosci: "Wie die Zahlung abläuft, lesen Sie unter ",
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
    dpSubject: (ref) => `Bestellung ${ref}, bitte um Nachzahlung`,
    dpIntro: "Ihre Zahlung ist eingegangen, liegt aber unter dem Bestellbetrag. Nachfolgend die Differenz und die Daten für die Nachzahlung. Die Bestellung wartet, nichts geht verloren.",
    dpWplynelo: "Eingegangen",
    dpNalezne: "Bestellbetrag",
    dpBrakuje: "Noch offen",
    dpTermin: (data) => `Auf die Nachzahlung warten wir bis zum ${data}.`,
    dpCoDalej: "Geht die Differenz bis dahin nicht ein, schließen wir die Bestellung und senden den eingegangenen Betrag vollständig an das Konto zurück, von dem er kam. Es geht nichts verloren, Sie können jederzeit erneut bestellen.",
    dpTytul: "Bitte behalten Sie denselben Verwendungszweck bei, daran erkennen wir Ihre Bestellung.",

    wgSubject: (ref) => `Bestellung ${ref} wurde geschlossen`,
    wgIntro: "die Zahlung ist nicht rechtzeitig eingegangen, daher schließen wir die Bestellung und die reservierte Ware geht zurück in den Verkauf.",
    wgIntroCzesc: (kwota) => `die Zahlung wurde nicht rechtzeitig ergänzt, daher schließen wir die Bestellung und die reservierte Ware geht zurück in den Verkauf. Die eingegangenen ${kwota} senden wir an das Konto zurück, von dem sie kamen.`,
    wgPoTerminie: "Sollte die Überweisung nach diesem Termin herausgehen, erstatten wir sie auf das Konto des Absenders. Sie müssen nicht darum bitten.",
    wgPonownie: "Sie können jederzeit erneut bestellen, zu denselben Bedingungen. Edelmetall rechnen wir dann zum aktuellen Kurs neu.",

    nadplata: (ile) => `Das sind ${ile} mehr als der Bestellbetrag. Den Überschuss senden wir an das Konto zurück, von dem er kam.`,
    niedoplataDrobna: (ile) => `Das sind ${ile} weniger als der Bestellbetrag, meist eine Gebühr einer Zwischenbank. Die Differenz übernehmen wir, Ihre Bestellung ist vollständig bezahlt.`,
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

  // Wzor oswiadczenia nie idzie juz w TRESCI maila: rozbijal ja na trzy czesci
  // i spychal wszystko pozostale pod spod. Idzie ZALACZNIKIEM, bo mail jest
  // potwierdzeniem umowy na trwalym nosniku i wzor ma dotrzec razem z nim,
  // a odnosnik do strony trwalym nosnikiem nie jest.
  const form = w.hasCovered
    ? l.wdForm.map((line) =>
        line
          .replace("{seller}", SELLER.legalName)
          .replace("{address}", SELLER.addressLines.join(", "))
          .replace("{ref}", order.order_ref))
    : null;

  return { paras, doWziecia: w.hasCovered, form, samePliki: w.single === REGIME.DIGITAL };
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
/**
 * Pozycje, w ktorych klient zmienil ksztalt wyrobu wzgledem pliku.
 *
 * To jest DOWOD USTALENIA, a nie ozdoba maila: wykonamy rzecz o innych
 * proporcjach niz oryginal, wiec potwierdzenie musi to mowic wprost i podac
 * wymiary, na ktore klient przystal. Zdanie bierzemy z `quoteSummary`, bo
 * to samo stoi w kalkulatorze i w koszyku.
 */
function distortedItems(items, lang) {
  return items
    .filter((i) => i.params?.znieksztalcony)
    .map((i) => ({ title: i.title, line: distortionLine(i.params, lang), wymiary: i.params?.wymiary || null }))
    .filter((x) => x.line);
}

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

/**
 * Termin realizacji zdaniem dla KLIENTA.
 *
 * Zwraca null, gdy pozycje oferty nie mialy terminu: puste zdanie o terminie
 * jest gorsze niz jego brak, bo wyglada jak obietnica, ktorej nikt nie zlozyl.
 * Ta sama tresc idzie do wersji tekstowej i do HTML, wiec obie mowia to samo.
 */
function terminKlienta(order, l, lang) {
  // `lead_days` idzie przez `dniSlownie`, bo "1 dni" w potwierdzeniu wyglada
  // jak usterka. Data przez `dzien`, bo sterownik bazy oddaje kolumne DATE
  // jako obiekt Date i samo `String(...).slice(0, 10)` dawalo "Mon Aug 31",
  // czyli angielska date w polskim mailu.
  const ile = order.lead_days ? dniSlownie(order.lead_days, lang) : null;
  if (order.requires_details) return l.leadDetails(ile);
  if (order.deadline_at && ile) return l.leadPlanned(ile, dzien(order.deadline_at));
  // Sam czas, bez daty. Wczesniej stalo tu `leadPlanned(ile, "-")` obciete
  // wyrazeniem, ktore nic nie obcinalo, wiec do klienta szlo "Planowana
  // wysylka: -.".
  if (ile) return `${ile}.`;
  return null;
}

/** Adres strony w jezyku maila. Polski stoi bez prefiksu, reszta pod swoim. */
function adres(lang, sciezka) {
  return lang === "pl" ? `${SELLER.site}${sciezka}` : `${SELLER.site}/${lang}${sciezka}`;
}

/** Prywatny odnosnik do zlecenia. Bez zetonu strona i tak wpusci po numerze
 *  i adresie e-mail, wiec odnosnik ma sens takze wtedy. */
function linkZlecenia(order, lang) {
  const baza = adres(lang, "/order/status/");
  const zeton = order.access_token ? `&token=${encodeURIComponent(order.access_token)}` : "";
  return `${baza}?ref=${encodeURIComponent(order.order_ref)}${zeton}`;
}

/** Adres do pokazania: bez protokolu, bo to on zajmuje pol wiersza. */
const doPokazania = (url) => url.replace(/^https?:\/\//, "");

/** Zdanie z widocznym adresem: "Tresc ... https://www.aejaca.com/cos/". */
function zdanieZAdresem(tresc, url) {
  return [tresc, { href: url, pokaz: doPokazania(url) }];
}

/** Zdanie o procesie realizacji, to samo w kazdym mailu o zamowieniu. */
const zdanieProces = (l, lang) => zdanieZAdresem(l.zdanieProces, adres(lang, "/order-process/"));

/** Zdanie o regulaminie, to samo w kazdym mailu. */
const zdanieRegulamin = (l, lang) => zdanieZAdresem(l.zdanieRegulamin, adres(lang, "/terms/"));

/**
 * Zdania pod mailem o zamowieniu.
 *
 * Pierwsze podaje DWIE drogi do tej samej strony: prywatny odnosnik z tego
 * maila i zwykly adres, pod ktory klient wejdzie z numerem i adresem e-mail.
 * Odnosnik ginie razem z mailem, numer zostaje.
 */
function odnosnikiZamowienia(order, l, lang) {
  const prywatny = linkZlecenia(order, lang);
  const ogolny = adres(lang, "/order/status/");
  return [
    [
      l.zdanieStatus, { href: prywatny, pokaz: doPokazania(prywatny) },
      l.zdanieStatusAlbo, { href: ogolny, pokaz: doPokazania(ogolny) },
      l.zdanieStatusPodaj(order.order_ref),
    ],
    zdanieProces(l, lang),
    zdanieRegulamin(l, lang),
  ];
}

/**
 * Zdanie o roznicy miedzy tym, co wplynelo, a kwota zamowienia, albo null.
 *
 * Klient, ktoremu bank posredniczacy sciagnal kilka euro, dostawal
 * potwierdzenie "zaplacono w calosci" i nie wiedzial, czy o roznicy jeszcze
 * uslyszy. Nadplata milczala tak samo, a to sa jego pieniadze.
 */
function zdanieRoznicy(order, l) {
  const oczekiwane = order.amount_eur_cents;
  const wplynelo = order.transfer_received_cents;
  if (oczekiwane == null || wplynelo == null) return null;
  const roznica = wplynelo - oczekiwane;
  if (roznica === 0) return null;
  const ile = `${(Math.abs(roznica) / 100).toFixed(2)} EUR`;
  return roznica > 0 ? l.nadplata(ile) : l.niedoplataDrobna(ile);
}

function customerHtml(order, items, lang) {
  const l = T[lang] || T.pl;
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.title)}${i.qty > 1 ? ` &times; ${i.qty}` : ""}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${money(i.line_grosze)}</td>
      </tr>`
    )
    .join("");

  const deliveryName = l.deliveryNames[order.delivery_method] || order.delivery_method || "";
  const wd = withdrawalParts(order, items, l);
  const printNotes = acceptedPrintNotes(items, lang);
  const zmienioneWymiary = distortedItems(items, lang);
  const pliki = downloadLinks(items);

  return koperta({ lang, odnosniki: odnosnikiZamowienia(order, l, lang), srodek: `
    <p style="margin:0 0 6px">${l.hi}</p>
    <p style="margin:0 0 20px;line-height:1.6">${order.payment_method === "bank_transfer" ? l.thanksTransfer : l.thanks}</p>
    ${zdanieRoznicy(order, l) ? `<p style="margin:-8px 0 20px;line-height:1.6;font-size:13px;color:#666">${esc(zdanieRoznicy(order, l))}</p>` : ""}

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

    ${terminKlienta(order, l, lang) ? `
      <p style="margin:18px 0 4px;font-size:12px;color:#777">${l.leadTitle}</p>
      <p style="margin:0;line-height:1.6;font-size:13px;color:#444">${esc(terminKlienta(order, l, lang))}</p>
    ` : ""}

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
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${wd.samePliki ? l.nextBodyPliki : l.nextBody[drogaWydania(order)]}</p>

    ${zmienioneWymiary.length ? `
      <h3 style="font-size:14px;margin:24px 0 6px">${l.dimsTitle}</h3>
      <p style="margin:0 0 10px;line-height:1.6;font-size:13px;color:#444">${esc(l.dimsIntro)}</p>
      ${zmienioneWymiary.map((n) => `
        <div style="border:1px solid #e8dcc0;background:#fdfaf2;border-radius:8px;padding:12px;margin:0 0 10px">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700">${esc(n.title)}</p>
          <p style="margin:0;font-size:13px;color:#444;line-height:1.6">${esc(n.line)}</p>
        </div>`).join("")}
    ` : ""}

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
    ${wd.doWziecia ? `
      <p style="margin:8px 0 0;line-height:1.6;font-size:13px;color:#666">${esc(l.wdZalacznik)}</p>
      <p style="margin:6px 0 0;line-height:1.6;font-size:13px;color:#666">${esc(l.wdSzczegoly)}
        <a href="${esc(adres(lang, "/returns/"))}" style="color:#b58a3c;font-weight:700;text-decoration:none;word-break:break-word">${esc(doPokazania(adres(lang, "/returns/")))}</a></p>` : ""}

    <h3 style="font-size:14px;margin:20px 0 6px">${l.questions}</h3>
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${l.questionsBody}</p>

  ` });
}

function customerText(order, items, lang) {
  const l = T[lang] || T.pl;
  const lines = items.map((i) => `- ${i.title}${i.qty > 1 ? ` x ${i.qty}` : ""}: ${money(i.line_grosze)}`);
  const wd = withdrawalParts(order, items, l);
  const printNotes = acceptedPrintNotes(items, lang);
  const zmienioneWymiary = distortedItems(items, lang);
  const pliki = downloadLinks(items);
  return [
    l.hi,
    "",
    order.payment_method === "bank_transfer" ? l.thanksTransfer : l.thanks,
    ...(zdanieRoznicy(order, l) ? ["", zdanieRoznicy(order, l)] : []),
    "",
    `${l.orderNo}: ${order.order_ref}`,
    "",
    `${l.items}:`,
    ...lines,
    `${l.delivery}: ${l.deliveryNames[order.delivery_method] || order.delivery_method || ""} ${money(order.shipping_grosze)}`,
    `${l.total}: ${paidAmount(order)}`,
    // Ta sama tresc, co w wersji HTML: dwie rozne odpowiedzi na pytanie "kiedy"
    // w jednym mailu bylyby gorsze niz jedna, nawet gdyby obie byly prawdziwe.
    ...(terminKlienta(order, l, lang) ? ["", `${l.leadTitle}: ${terminKlienta(order, l, lang)}`] : []),
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
    `${l.next}: ${wd.samePliki ? l.nextBodyPliki : l.nextBody[drogaWydania(order)]}`,
    // Wersja tekstowa jest tym, co przeczyta klient z czytnikiem ekranu i to,
    // co zostaje, gdy klient wylaczy HTML. Zapis o zmienionych wymiarach
    // i o potwierdzonych uwagach musi byc w obu, inaczej dokumentacja
    // ustalenia zalezy od ustawien poczty.
    ...(zmienioneWymiary.length ? [
      "",
      `${l.dimsTitle}:`,
      l.dimsIntro,
      ...zmienioneWymiary.map((n) => `${n.title}. ${n.line}`),
    ] : []),
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
    ...(wd.doWziecia ? ["", l.wdZalacznik, `${l.wdSzczegoly} ${adres(lang, "/returns/")}`] : []),
    "",
    `${l.questions}: ${l.questionsBody}`,
    "",
    odnosnikiText(lang, odnosnikiZamowienia(order, l, lang)),
    "",
    stopkaText(lang),
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

/**
 * Parametry pozycji BEZ tego, co i tak stoi w mailu osobno.
 *
 * `fromQuote` ma wlasny wiersz, a `description` wlasny akapit. Zostawione
 * w zrzucie JSON pokazywaly sie drugi raz, w postaci nieczytelnej dla
 * czlowieka, i to one robily z tego maila sciane nawiasow: przy zamowieniu
 * z oferty caly zrzut to bylo dokladnie te dwa pola, z czego jedno puste.
 */
function parametryDoPokazania(params) {
  if (!params || typeof params !== "object") return null;
  const reszta = { ...params };
  delete reszta.fromQuote;
  delete reszta.description;
  return Object.keys(reszta).length ? JSON.stringify(reszta) : null;
}

function internalText(order, items, attachments = []) {
  const lines = items.map(
    (i) => `- ${i.title} x ${i.qty} = ${money(i.line_grosze)}${
      // Pozycja z oferty nie ma kalkulatora i nie ma czego o nim mowic.
      // "kalkulator: null" bylo informacja o tym, ze pole istnieje, a nie
      // o zamowieniu.
      i.calculator ? `\n  kalkulator: ${i.calculator}` : ""
    }${
      i.params?.fromQuote ? `\n  z oferty: ${i.params.fromQuote}` : ""
    }${
      parametryDoPokazania(i.params) ? `\n  parametry: ${parametryDoPokazania(i.params)}` : ""
    }${i.params?.wymiary ? `\n  WYMIARY: ${i.params.wymiary}` : ""}${i.params?.znieksztalcony ? `\n  !! WYROB ZNIEKSZTALCONY: osie zmieniane osobno, ksztalt inny niz w pliku` : ""}${i.params?.description ? `\n  OPIS OD KLIENTA: ${i.params.description}` : ""}${i.params?.podloze ? `\n  PODLOZE: ${PODLOZE_PL[i.params.podloze] || i.params.podloze}${i.params.spare ? `, ${SPARE_PL[i.params.spare] || i.params.spare}` : ""}${i.params.materialNote ? `, material: ${i.params.materialNote}` : ""}` : ""}${i.params?.personalization ? `\n  GRAWER NA WYROBIE: ${i.params.personalization}` : ""}${i.params?.packagingText ? `\n  GRAWER NA WIEKU: ${i.params.packagingText}` : ""}${i.params?.packagingTextBack ? `\n  GRAWER WEWNATRZ WIEKA: ${i.params.packagingTextBack}` : ""}${i.file_name ? `\n  plik: ${i.file_name} (sha256 ${String(i.file_sha256 || "").slice(0, 16)})${i.file_url ? `\n  Dysk: ${i.file_url}` : "\n  Dysk: link jeszcze nie dotarl z n8n"}${i.upload_token && API_BASE ? `\n  Podglad: ${API_BASE}/api/uploads/${i.upload_token}/thumb` : ""}` : ""}${
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
    // TERMIN REALIZACJI. Bez tego wiersza mail o zaplacie milczal o jedynej
    // rzeczy, ktora po zaplacie ma znaczenie dla pracowni: do kiedy.
    order.requires_details
      ? `TERMIN: zegar STOI, zlecenie czeka na ustalenie szczegolow${order.lead_days ? `. Po ustaleniach: ${order.lead_days} dni` : ""}`
      : order.deadline_at
      ? `TERMIN: ${order.lead_days} dni, planowana wysylka ${String(order.deadline_at).slice(0, 10)}`
      : order.lead_days
      ? `TERMIN: ${order.lead_days} dni`
      : "TERMIN: nie ustalony przy pozycjach oferty",
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

  // Wzor oswiadczenia jedzie ZALACZNIKIEM, i tylko wtedy, gdy w zamowieniu
  // jest cokolwiek, od czego da sie odstapic. Przy rzeczy robionej pod klienta
  // formularz odstapienia bylby obietnica prawa, ktorego nie ma.
  //
  // Plik tekstowy, a nie PDF: usluga platnosci nie ma biblioteki do PDF,
  // a wbudowane kroje pisma nie znaja polskich znakow, wiec "odstąpieniu"
  // wyszloby jako "odst pieniu". Tekst w UTF-8 otwiera sie wszedzie, klient
  // wkleja go wprost do wiadomosci i wlasnie tak go wysle.
  const wd = withdrawalParts(order, items, l);
  const zalaczniki = wd.form
    ? [{
        filename: `${l.wdPlik}-${order.order_ref}.txt`,
        mime: "text/plain",
        content: [l.wdFormTitle, "", ...wd.form].join("\r\n") + "\r\n",
      }]
    : [];

  return [
    {
      to: order.customer_email,
      from: FROM,
      replyTo: SELLER.email,
      subject: l.subject(order.order_ref),
      text: customerText(order, items, lang),
      html: customerHtml(order, items, lang),
      attachments: zalaczniki,
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
    [l.trDue, tr.dueAt ? dzien(new Date(tr.dueAt)) : null],
  ].filter(([, v]) => v);
}

export function buildTransferMessage(order, tr) {
  const lang = ["pl", "en", "de"].includes(order.lang) ? order.lang : "en";
  const l = T[lang];
  const rows = transferRows(l, tr);
  const odnosniki = [
    zdanieZAdresem(l.zdaniePlatnosci, adres(lang, "/payments/")),
    zdanieProces(l, lang),
    zdanieRegulamin(l, lang),
  ];

  const html = koperta({ lang, odnosniki, srodek: `
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
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${l.questionsBody}</p>
  ` });

  const text = [
    l.hi, "", l.trIntro, "",
    `${l.trAmount}: ${tr.amountEur} EUR`,
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "", `${l.trSteps}: ${l.trStepsBody}`,
    "", `${l.questions}: ${l.questionsBody}`,
    "", odnosnikiText(lang, odnosniki),
    "", stopkaText(lang),
  ].join("\n");

  return { to: order.customer_email, from: FROM, replyTo: SELLER.email, subject: l.trSubject(order.order_ref), text, html };
}

/**
 * Prosba o doplate, gdy wplata jest nizsza od kwoty zamowienia.
 *
 * Idzie DOPIERO powyzej progu drobnej roznicy: kilka euro sciagnietych przez
 * bank posredniczacy pokrywamy sami, bo zatrzymanie zamowienia na trzy dni
 * kosztuje klienta wiecej niz nas ta roznica.
 *
 * Mail nie straszy. Mowi, ile wplynelo, ile brakuje, do kiedy czekamy i co
 * stanie sie potem, razem z ta czescia, ktora najbardziej uspokaja: pieniadze
 * wracaja w calosci, a zamowienie mozna zlozyc od nowa.
 */
export function buildTopUpRequest(order, tr, brakujeCents) {
  const lang = ["pl", "en", "de"].includes(order.lang) ? order.lang : "en";
  const l = T[lang];
  const eur = (c) => `${(c / 100).toFixed(2)} EUR`;
  const oczekiwane = order.amount_eur_cents ?? 0;
  const wplynelo = order.transfer_received_cents ?? 0;
  const doKiedy = order.expires_at ? dzien(order.expires_at) : null;

  // Dane rachunku te same, co w pierwszej wiadomosci: klient ma doplacic tam,
  // gdzie placil, i z tym samym tytulem.
  const rows = transferRows(l, { ...tr, amountEur: (brakujeCents / 100).toFixed(2) })
    .filter(([k]) => k !== l.trDue);
  // Odnosnik do wlasnego zlecenia stoi tu tak samo jak w potwierdzeniu: klient,
  // ktory dostaje prosbe o doplate, najpierw chce zobaczyc, co my widzimy.
  const odnosniki = [
    zdanieZAdresem(l.zdaniePlatnosci, adres(lang, "/payments/")),
    ...odnosnikiZamowienia(order, l, lang).slice(0, 1),
    zdanieRegulamin(l, lang),
  ];

  const kwoty = [
    [l.dpWplynelo, eur(wplynelo)],
    [l.dpNalezne, eur(oczekiwane)],
  ];

  const html = koperta({ lang, odnosniki, srodek: `
    <p style="margin:0 0 6px">${esc(l.hi)}</p>
    <p style="margin:0 0 20px;line-height:1.6">${esc(l.dpIntro)}</p>

    <div style="border:1px solid #eee;border-radius:10px;padding:18px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${kwoty.map(([k, v]) => `<tr>
          <td style="padding:4px 0;color:#777">${esc(k)}</td>
          <td style="padding:4px 0;text-align:right;font-family:ui-monospace,monospace">${esc(v)}</td>
        </tr>`).join("")}
      </table>
      <p style="margin:14px 0 4px;font-size:12px;color:#777">${esc(l.dpBrakuje)}</p>
      <p style="margin:0 0 16px;font-size:26px;font-weight:800;color:#7a5f22">${esc(eur(brakujeCents))}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${rows.map(([k, v]) => `<tr>
          <td style="padding:6px 0;color:#777;white-space:nowrap;vertical-align:top">${esc(k)}</td>
          <td style="padding:6px 0;text-align:right;font-family:ui-monospace,monospace;word-break:break-all">${esc(String(v))}</td>
        </tr>`).join("")}
      </table>
      <p style="margin:12px 0 0;font-size:12px;color:#777;line-height:1.6">${esc(l.dpTytul)}</p>
    </div>

    ${doKiedy ? `<p style="margin:0 0 6px;font-size:15px;font-weight:700">${esc(l.dpTermin(doKiedy))}</p>` : ""}
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${esc(l.dpCoDalej)}</p>
  ` });

  const text = [
    l.hi, "", l.dpIntro, "",
    ...kwoty.map(([k, v]) => `${k}: ${v}`),
    `${l.dpBrakuje}: ${eur(brakujeCents)}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "", l.dpTytul,
    ...(doKiedy ? ["", l.dpTermin(doKiedy)] : []),
    "", l.dpCoDalej,
    "", odnosnikiText(lang, odnosniki),
    "", stopkaText(lang),
  ].join("\n");

  return { to: order.customer_email, from: FROM, replyTo: SELLER.email, subject: l.dpSubject(order.order_ref), text, html };
}

/**
 * Zamowienie wygaslo: wplata nie przyszla albo nie zostala uzupelniona.
 *
 * Zamowienie zamykalo sie DO 2026-08-30 po cichu. Klient, ktory przegapil
 * termin, dowiadywal sie o tym dopiero wtedy, gdy sam zajrzal na strone,
 * a klient, ktory przelal pieniadze dzien po terminie, nie mial skad wiedziec,
 * ze wracaja do niego.
 */
export function buildOrderExpired(order) {
  const lang = ["pl", "en", "de"].includes(order.lang) ? order.lang : "en";
  const l = T[lang];
  const wplynelo = order.transfer_received_cents ?? 0;
  const czesciowa = wplynelo > 0;
  const wstep = czesciowa ? l.wgIntroCzesc(`${(wplynelo / 100).toFixed(2)} EUR`) : l.wgIntro;
  const odnosniki = [
    zdanieZAdresem(l.zdaniePlatnosci, adres(lang, "/payments/")),
    zdanieRegulamin(l, lang),
  ];

  const html = koperta({ lang, odnosniki, srodek: `
    <h1 style="margin:0 0 6px;font-size:20px;line-height:1.3;font-weight:700">${esc(l.wgSubject(order.order_ref))}</h1>
    <p style="margin:0 0 4px;font-size:12px;color:#777">${esc(l.orderNo)}</p>
    <p style="margin:0 0 20px;font-size:15px;font-weight:700;font-family:ui-monospace,monospace">${esc(order.order_ref)}</p>

    <p style="margin:0 0 6px">${esc(l.hi)}</p>
    <p style="margin:0 0 18px;line-height:1.6">${esc(wstep)}</p>
    ${czesciowa ? "" : `<p style="margin:0 0 18px;line-height:1.6;font-size:14px;color:#444">${esc(l.wgPoTerminie)}</p>`}
    <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${esc(l.wgPonownie)}</p>
  ` });

  const text = [
    l.hi, "", wstep,
    ...(czesciowa ? [] : ["", l.wgPoTerminie]),
    "", l.wgPonownie,
    "", `${l.orderNo}: ${order.order_ref}`,
    "", odnosnikiText(lang, odnosniki),
    "", stopkaText(lang),
  ].join("\n");

  return { to: order.customer_email, from: FROM, replyTo: SELLER.email, subject: l.wgSubject(order.order_ref), text, html };
}

/**
 * Prosba o doplate do klienta. Nie rzuca wyjatkiem: termin jest juz zapisany
 * w bazie i nieudany mail nie ma prawa go cofnac.
 */
export async function sendTopUpRequest(pool, orderId, tr) {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    const order = rows[0];
    if (!order?.customer_email) return false;
    const brakuje = (order.amount_eur_cents ?? 0) - (order.transfer_received_cents ?? 0);
    if (brakuje <= 0) return false;
    return await sendViaGmail([buildTopUpRequest(order, tr, brakuje)]);
  } catch (e) {
    console.error("[doplata] prosba nie zostala wyslana:", e.message);
    return false;
  }
}

/** Wiadomosc o wygasnieciu zamowienia. Wolana z crona, wiec nigdy nie rzuca. */
export async function sendOrderExpired(pool, orderId) {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    const order = rows[0];
    if (!order?.customer_email) return false;
    return await sendViaGmail([buildOrderExpired(order)]);
  } catch (e) {
    console.error("[wygasniecie] wiadomosc nie zostala wyslana:", e.message);
    return false;
  }
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
/**
 * Sklada wiadomosc w postaci, ktorej oczekuje Gmail.
 *
 * Dwie warstwy, gdy sa zalaczniki: `multipart/mixed` obejmuje calosc, a w nim
 * siedzi `multipart/alternative` z para tekst i HTML. Odwrotna kolejnosc
 * sprawia, ze klient pocztowy pokazuje zalacznik ZAMIAST tresci albo obok
 * niej jako druga wersje maila.
 *
 * @param {{attachments?: Array<{filename: string, content: string, mime?: string}>}} arg
 *   `content` jest napisem w UTF-8. Base64 zawijamy po 76 znakow, bo dluzsze
 *   linie lamie czesc serwerow poczty.
 */
export function buildRaw({ to, from, subject, text, html, replyTo, attachments = [], inReplyTo }) {
  const tresc = `bnd_${Math.random().toString(36).slice(2)}`;
  const zewnetrzny = `mix_${Math.random().toString(36).slice(2)}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const zZalacznikami = attachments.length > 0;
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    // Odpowiedz W WATKU, a nie osobna wiadomosc obok. Bez tych dwoch naglowkow
    // Gmail klienta pokazuje nasza odpowiedz jako nowy list, a rozmowa rozpada
    // sie na dwa kawalki po jego stronie.
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : null,
    inReplyTo ? `References: ${inReplyTo}` : null,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    zZalacznikami
      ? `Content-Type: multipart/mixed; boundary="${zewnetrzny}"`
      : `Content-Type: multipart/alternative; boundary="${tresc}"`,
  ].filter(Boolean);

  const zawin = (b64) => b64.match(/.{1,76}/g)?.join("\r\n") || "";
  const czescTresci = [
    `--${tresc}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    zawin(Buffer.from(text, "utf8").toString("base64")),
    `--${tresc}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    zawin(Buffer.from(html, "utf8").toString("base64")),
    `--${tresc}--`,
  ];

  const body = zZalacznikami
    ? [
        "",
        `--${zewnetrzny}`,
        `Content-Type: multipart/alternative; boundary="${tresc}"`,
        "",
        ...czescTresci,
        ...attachments.flatMap((z) => [
          `--${zewnetrzny}`,
          `Content-Type: ${z.mime || "text/plain"}; charset=UTF-8; name="${z.filename}"`,
          "Content-Transfer-Encoding: base64",
          `Content-Disposition: attachment; filename="${z.filename}"`,
          "",
          zawin(Buffer.from(z.content, "utf8").toString("base64")),
        ]),
        `--${zewnetrzny}--`,
        "",
      ]
    : ["", ...czescTresci, ""];

  return Buffer.from(headers.concat(body).join("\r\n"), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Wysylka wiadomosci zlozonych gdzie indziej (`leadMail.js`).
 *
 * Ten sam kanal Gmaila, ten sam `buildRaw`, ta sama obsluga watku. Drugi
 * nadawca rozjechalby sie z pierwszym przy pierwszej zmianie naglowkow.
 */
export async function sendLeadMail(messages) {
  return sendViaGmail(messages);
}

async function sendViaGmail(messages) {
  // Import dynamiczny, zeby brak googleapis nie wywracal calego modulu
  // przy starcie serwera. Poczta ma byc dodatkiem, nie warunkiem dzialania.
  const { createGmailClient } = await import("./gmail.js");
  const gmail = createGmailClient();
  if (!gmail) return false;
  for (const m of messages) {
    await gmail.users.messages.send({
      userId: "me",
      // `threadId` wpina wiadomosc w istniejaca rozmowe po NASZEJ stronie,
      // naglowki `In-Reply-To` po stronie klienta. Potrzebne sa oba.
      requestBody: { raw: buildRaw(m), ...(m.threadId ? { threadId: m.threadId } : {}) },
    });
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

export function buildPaymentReviewMessage(order) {
  const reason = order.payment_review_reason || "unknown";
  const previous = order.payment_review_previous_status || "unknown";
  const text = [
    `PILNE: PLATNOSC DO RECZNEJ WERYFIKACJI ${order.order_ref}`,
    "",
    `Kwota: ${money(order.total_grosze)}`,
    `Klient: ${order.customer_name || "(brak nazwiska)"} <${order.customer_email}>`,
    `Poprzedni stan: ${previous}`,
    `Powod: ${reason}`,
    `Status Autopay: ${order.payment_status || "-"} / ${order.payment_status_details || "-"}`,
    `remoteID: ${order.payment_remote_id || "-"}`,
    "",
    "Pieniadze zostaly odnotowane, ale realizacja NIE zostala uruchomiona.",
    "Nie wydano plikow, nie zuzyto rezerwacji ani kodu rabatowego i nie wyslano klientowi potwierdzenia realizacji.",
    "Sprawdz dostepnosc towaru i zdecyduj recznie: realizacja po odtworzeniu rezerwacji albo zwrot.",
  ].join("\n");

  return {
    to: INTERNAL_TO,
    from: FROM,
    replyTo: order.customer_email,
    subject: `[PILNE PLATNOSC] ${order.order_ref}, wymaga decyzji`,
    text,
    html: `<pre style="font-family:ui-monospace,monospace;font-size:13px;white-space:pre-wrap">${esc(text)}</pre>`,
  };
}

/**
 * Przypomnienie o terminie realizacji. Idzie WYLACZNIE do nas.
 *
 * Klient dostal termin w ofercie i widzi go na stronie zamowienia; codzienne
 * dopowiadanie mu, ile dni zostalo, zamienilo by nasza dyscypline w jego
 * niepokoj. To jest narzedzie pracowni, nie kanal obslugi.
 */
function buildDeadlineReminder(order, items, dniDoTerminu) {
  const kiedy = dniDoTerminu > 0
    ? `za ${dniDoTerminu} ${dniDoTerminu === 1 ? "dzien" : "dni"}`
    : dniDoTerminu === 0 ? "DZISIAJ" : `${Math.abs(dniDoTerminu)} dni TEMU`;

  const text = [
    `TERMIN REALIZACJI ${order.order_ref}: ${kiedy}`,
    "",
    `Termin: ${String(order.deadline_at || "").slice(0, 10)}`,
    `Praca ruszyla: ${order.production_started_at ? new Date(order.production_started_at).toISOString().slice(0, 10) : "-"}`,
    `Umowiony czas: ${order.lead_days || "-"} dni`,
    `Klient: ${order.customer_name || "(brak nazwiska)"} <${order.customer_email || "brak"}>`,
    `Dostawa: ${order.delivery_method || "-"}`,
    "",
    "Pozycje:",
    ...items.map((i) => `  - ${i.title} x ${i.qty}`),
    "",
    dniDoTerminu < 0
      ? "Termin minal. Odezwij sie do klienta, zanim on odezwie sie do nas."
      : "Gdy paczka wyszla albo rzecz zostala przekazana, zaznacz to w kolejce: wtedy przypomnienia milkna.",
  ].join("\n");

  return {
    to: INTERNAL_TO,
    from: FROM,
    replyTo: order.customer_email || undefined,
    subject: `[TERMIN ${kiedy}] ${order.order_ref}`,
    text,
    html: `<pre style="font-family:ui-monospace,monospace;font-size:13px;white-space:pre-wrap">${esc(text)}</pre>`,
  };
}

/** Zlecenie zaplacone, ktore stoi w ustalaniu szczegolow i nikt go nie rusza. */
function buildDetailsNudge(order, items, dniStania) {
  const text = [
    `USTALANIE SZCZEGOLOW STOI OD ${dniStania} DNI: ${order.order_ref}`,
    "",
    "Klient zaplacil, a zlecenie czeka na ustalenie szczegolow. Zegar realizacji",
    "NIE BIEGNIE, wiec to zlecenie nie odezwie sie samo z terminem.",
    "",
    `Klient: ${order.customer_name || "(brak nazwiska)"} <${order.customer_email || "brak"}>`,
    `Telefon: ${order.customer_phone || "-"}`,
    `Umowiony czas po ustaleniach: ${order.lead_days || "-"} dni`,
    "",
    "Pozycje:",
    ...items.map((i) => `  - ${i.title} x ${i.qty}`),
    "",
    "Po ustaleniach przestaw zlecenie w kolejce na \"Zlecenie w realizacji\": dopiero wtedy rusza termin.",
  ].join("\n");

  return {
    to: INTERNAL_TO,
    from: FROM,
    replyTo: order.customer_email || undefined,
    subject: `[USTALENIA ${dniStania} dni] ${order.order_ref}`,
    text,
    html: `<pre style="font-family:ui-monospace,monospace;font-size:13px;white-space:pre-wrap">${esc(text)}</pre>`,
  };
}

// ============================================================
// POWIADOMIENIE O ZMIANIE ETAPU, DLA KLIENTA
// ============================================================
// Klient dostawal maila przy zaplacie i przy wysylce, a miedzy nimi cisza.
// Zlecenie robione trzy tygodnie milczalo tyle samo, wiec pytanie "co sie
// dzieje" wracalo do nas mailem i odpowiadal na nie czlowiek.
//
// Mail wychodzi WYLACZNIE wtedy, gdy pracownia go zaznaczy przy przestawianiu
// etapu. Automat przy kazdej zmianie zamienilby skrzynke klienta w dziennik
// naszej pracy, a cofniecie omylkowego klikniecia wysylaloby sprostowanie
// czegos, o czym klient nie zdazyl sie dowiedziec.

const SITE = (process.env.SITE_URL || "https://www.aejaca.com").replace(/\/$/, "");

const ETAP_T = {
  pl: {
    subject: (ref) => `Twoje zamówienie ${ref}, aktualizacja`,
    hi: "Dzień dobry,",
    zamkniecie: "Pozdrawiamy,\nZespół AEJaCA",
    podglad: "Podgląd zamówienia",
    orderNo: "Numer zamówienia",
    progress: "Postęp zlecenia",
    terminLabel: "Planowana finalizacja",
    przesylkaLabel: "Numer przesyłki",
    przewoznikLabel: (kto) => `Przesyłkę wiezie ${kto}`,
    sledzLabel: "Sprawdź przesyłkę na stronie przewoźnika",
    dostarczone: "Dostarczone",
    odebrane: "Odebrane",
    stopka: "AEJaCA, Artisan Elegance Jewelry and Crafted Art",

    termin: (data) => `Planowana finalizacja: ${data}.`,
    przesylka: (nr) => `Numer przesyłki: ${nr}.`,
    stany: {
      details: "wracamy do ustalania szczegółów Twojego zlecenia. Odezwiemy się z pytaniami, a czas realizacji w tym czasie nie biegnie.",
      queued: "wszystkie ustalenia mamy komplet. Zlecenie czeka w kolejce pracowni, a termin realizacji już biegnie. Odezwiemy się, gdy weźmiemy je do ręki.",
      in_production: "zabraliśmy się do pracy nad Twoim zleceniem.",
      // Wydanie ma trzy drogi i kazda mowi sie inaczej. Wczesniej stalo tu
      // jedno zdanie "do wysylki albo do odbioru", chociaz `delivery_method`
      // znamy od zamowienia, a przy wysylce dokladalismy podmiane slow
      // w gotowym tekscie, osobna dla kazdego jezyka.
      ready: {
        ship: "zlecenie jest gotowe. Pakujemy je i przygotowujemy do wysyłki.",
        pickup: "zlecenie jest gotowe. Przygotowujemy je do odbioru osobistego, odezwiemy się, żeby umówić godzinę.",
        digital: "zlecenie jest gotowe. Pliki do pobrania są w mailu z potwierdzeniem zamówienia.",
      },
      shipped: {
        ship: "zlecenie wyszło z pracowni.",
        pickup: "zlecenie czeka na odbiór w Józefosławiu, o umówionej godzinie.",
        digital: "zlecenie jest przekazane.",
      },
      completed: {
        ship: "potwierdzamy dostarczenie przesyłki. Zamówienie jest zamknięte, dziękujemy i do zobaczenia.",
        pickup: "potwierdzamy odbiór zamówienia. Zamówienie jest zamknięte, dziękujemy i do zobaczenia.",
        digital: "zamówienie jest zamknięte. Dziękujemy i do zobaczenia.",
      },
    },
  },
  en: {
    subject: (ref) => `Your order ${ref}, an update`,
    hi: "Hello,",
    zamkniecie: "Best regards,\nThe AEJaCA team",
    podglad: "View your order",
    orderNo: "Order number",
    progress: "Order progress",
    terminLabel: "Planned completion",
    przesylkaLabel: "Tracking number",
    przewoznikLabel: (kto) => `Your parcel is carried by ${kto}`,
    sledzLabel: "Check the parcel on the carrier site",
    dostarczone: "Delivered",
    odebrane: "Collected",
    stopka: "AEJaCA, Artisan Elegance Jewelry and Crafted Art",

    termin: (data) => `Planned completion: ${data}.`,
    przesylka: (nr) => `Tracking number: ${nr}.`,
    stany: {
      details: "we are going back to agreeing the details of your order. We will be in touch with questions, and the lead time does not run in the meantime.",
      queued: "everything is agreed. Your order is waiting in the workshop queue and the lead time is running. We will write again once someone picks it up.",
      in_production: "we have started working on your order.",
      ready: {
        ship: "your order is finished. We are packing it for dispatch.",
        pickup: "your order is finished. We are getting it ready for collection and will write to agree a time.",
        digital: "your order is finished. The download links are in your order confirmation e-mail.",
      },
      shipped: {
        ship: "your order has left the workshop.",
        pickup: "your order is waiting for collection in Józefosław, at the time we agreed.",
        digital: "your order has been handed over.",
      },
      completed: {
        ship: "we confirm your parcel has been delivered. The order is now closed, thank you and see you next time.",
        pickup: "we confirm your order has been collected. The order is now closed, thank you and see you next time.",
        digital: "your order is now closed. Thank you, and see you next time.",
      },
    },
  },
  de: {
    subject: (ref) => `Ihre Bestellung ${ref}, Aktualisierung`,
    hi: "Guten Tag,",
    zamkniecie: "Mit freundlichen Grüßen,\nIhr AEJaCA-Team",
    podglad: "Bestellung ansehen",
    orderNo: "Bestellnummer",
    progress: "Auftragsfortschritt",
    terminLabel: "Geplante Fertigstellung",
    przesylkaLabel: "Sendungsnummer",
    przewoznikLabel: (kto) => `Ihre Sendung transportiert ${kto}`,
    sledzLabel: "Sendung auf der Seite des Zustellers prüfen",
    dostarczone: "Zugestellt",
    odebrane: "Abgeholt",
    stopka: "AEJaCA, Artisan Elegance Jewelry and Crafted Art",

    termin: (data) => `Geplante Fertigstellung: ${data}.`,
    przesylka: (nr) => `Sendungsnummer: ${nr}.`,
    stany: {
      details: "wir kehren zur Abstimmung der Details Ihres Auftrags zurück. Wir melden uns mit Fragen, die Lieferzeit läuft in dieser Zeit nicht.",
      queued: "alle Absprachen sind vollständig. Ihr Auftrag wartet in der Werkstattschlange und die Lieferzeit läuft. Wir melden uns erneut, sobald ihn jemand in die Hand nimmt.",
      in_production: "wir haben mit der Arbeit an Ihrem Auftrag begonnen.",
      ready: {
        ship: "Ihr Auftrag ist fertig. Wir verpacken ihn für den Versand.",
        pickup: "Ihr Auftrag ist fertig. Wir bereiten ihn zur Abholung vor und melden uns, um eine Uhrzeit zu vereinbaren.",
        digital: "Ihr Auftrag ist fertig. Die Download-Links stehen in Ihrer Bestellbestätigung.",
      },
      shipped: {
        ship: "Ihr Auftrag hat die Werkstatt verlassen.",
        pickup: "Ihr Auftrag wartet in Józefosław zur vereinbarten Uhrzeit auf Sie.",
        digital: "Ihr Auftrag wurde übergeben.",
      },
      completed: {
        ship: "wir bestätigen die Zustellung Ihrer Sendung. Die Bestellung ist abgeschlossen, vielen Dank und bis zum nächsten Mal.",
        pickup: "wir bestätigen die Abholung Ihrer Bestellung. Die Bestellung ist abgeschlossen, vielen Dank und bis zum nächsten Mal.",
        digital: "Ihre Bestellung ist abgeschlossen. Vielen Dank und bis zum nächsten Mal.",
      },
    },
  },
};

/**
 * Nazwy etapow na pasku postepu w mailu. Te same, ktore klient widzi na stronie
 * zamowienia: dwa opisy tej samej drogi rozjechalyby sie przy pierwszej zmianie.
 */
const ETAP_KROKI = {
  pl: { paid: "Zapłacone", details: "Ustalenia", queued: "W kolejce", work: "W realizacji", ready: "Gotowe", shipped: "Wysłane", handed: "Przekazane", delivered: "Dostarczone", collected: "Odebrane" },
  en: { paid: "Paid", details: "Details", queued: "In the queue", work: "In the workshop", ready: "Finished", shipped: "Dispatched", handed: "Handed over", delivered: "Delivered", collected: "Collected" },
  de: { paid: "Bezahlt", details: "Absprachen", queued: "In Warteschlange", work: "In Arbeit", ready: "Fertig", shipped: "Versandt", handed: "Übergeben", delivered: "Zugestellt", collected: "Abgeholt" },
};

/** Naglowek maila, krotszy od zdania w tresci. */
const ETAP_TYTUL = {
  pl: { details: "Ustalamy szczegóły", queued: "Zlecenie czeka w kolejce", in_production: "Zlecenie w realizacji", ready: "Zlecenie gotowe", shipped: "Zlecenie wysłane", completed: "Zamówienie dostarczone" },
  en: { details: "Agreeing the details", queued: "Order is in the queue", in_production: "Order in the workshop", ready: "Order finished", shipped: "Order dispatched", completed: "Order delivered" },
  de: { details: "Details klären", queued: "Auftrag in der Warteschlange", in_production: "Auftrag in Arbeit", ready: "Auftrag fertig", shipped: "Auftrag versandt", completed: "Bestellung zugestellt" },
};

/**
 * Ktora droga zlecenie opusci pracownie. Zdania o wydaniu wybieraja sie tym,
 * a nie podmiana slow w gotowym tekscie: podmiana wymagala trzech regulek na
 * jezyk i milczaco przestawala dzialac przy kazdej poprawce stylistycznej.
 */
function drogaWydania(order) {
  if (order.delivery_method === "pickup") return "pickup";
  if (order.delivery_method === "digital") return "digital";
  return "ship";
}

/**
 * Kto wiezie przesylke i gdzie klient ja sprawdzi.
 *
 * Numer bez nazwy przewoznika i bez adresu, pod ktory da sie go wkleic, jest
 * dla klienta ciagiem dwudziestu czterech cyfr.
 *
 * Nazwa bierze sie z tego, co pracownia wybrala przy nadaniu (`carrier`).
 * Dopoki tego pola nie ma, wraca stara droga: przewoznik ze strefy, ktora
 * wycenila przesylke. Strefy swiatowe nosza dwie nazwy naraz ("DHL / FedEx"),
 * wiec bez wyboru z panelu odsylamy do obu: numer w reku i zadnego miejsca do
 * jego wklejenia jest gorsze niz dwa adresy.
 *
 * @returns {{nazwa: string, adresy: Array<{pokaz: string, href: string}>}|null}
 */
function przewoznik(order, lang) {
  if (!order.tracking_number || drogaWydania(order) !== "ship") return null;
  const strefa = zoneForCountry(order.country || "PL");
  // Paczkomat stoi tylko w Polsce, wiec brak strefy nie zmienia przewoznika.
  const zNadania = order.delivery_method === "inpost_locker" ? "InPost" : order.carrier;
  const nazwy = przewoznicyZNazwy(zNadania || strefa?.carrier);
  if (!nazwy.length) return null;
  const adresy = nazwy
    .map((kto) => ({ pokaz: sledzenieDomena(kto), href: sledzenieUrl(kto, order.tracking_number, lang) }))
    .filter((a) => a.href);
  return adresy.length ? { nazwa: nazwy.join(" / "), adresy } : null;
}

/**
 * Pasek postepu w mailu, jako tabela. Nie SVG i nie obrazek: klient pocztowy
 * blokuje obrazki zewnetrzne domyslnie, a wtedy z calej grafiki zostaje pusta
 * ramka i zdanie traci to, co miala wzmocnic. Tabela z kolorowymi kropkami
 * wyswietla sie wszedzie, lacznie z Outlookiem.
 */
function paseczek(order, lang) {
  const n = ETAP_KROKI[lang] || ETAP_KROKI.pl;
  const odbior = order.delivery_method === "pickup";
  const kroki = [{ id: "paid", label: n.paid, stempel: order.paid_at }];
  if (order.requires_details) kroki.push({ id: "details", label: n.details, stempel: order.details_at });
  // "Czeka w kolejce" i "w realizacji" to OSOBNE przystanki (decyzja
  // wlasciciela, 2026-08-30). Wczesniej dzielily jeden, wiec dwa powiadomienia
  // pod rzad rysowaly klientowi ten sam obrazek, a zlecenie lezace w kolejce
  // przedstawialo sie jako juz robione.
  kroki.push({ id: "queued", label: n.queued, stempel: order.queued_at });
  kroki.push({ id: "work", label: n.work, stempel: order.production_started_at });
  kroki.push({ id: "ready", label: n.ready, stempel: order.ready_at });
  kroki.push({ id: "shipped", label: odbior ? n.handed : n.shipped, stempel: order.shipped_at });
  // Doreczenie jest OSOBNYM przystankiem (decyzja wlasciciela, 2026-08-30).
  // Wczesniej "wyslane" i "zamkniete" dzielily ostatnia kropke, wiec paczka
  // wlozona do paczkomatu wygladala tak samo jak paczka odebrana, a droga
  // klienta nigdy nie konczyla sie na zielono.
  kroki.push({ id: "delivered", label: odbior ? n.collected : n.delivered, stempel: order.completed_at });

  const gdzie = order.requires_details
    ? { paid: 0, details: 1, queued: 2, in_production: 3, ready: 4, shipped: 5, completed: 6 }
    : { paid: 0, details: 0, queued: 1, in_production: 2, ready: 3, shipped: 4, completed: 5 };
  // Potwierdzone doreczenie zamyka cala droge, wiec KAZDA kropka jest przebyta.
  // Ostatni przystanek jako "biezacy" swiecilby na bursztynowo, czyli mowilby
  // "trwa" o czymkolwiek, co juz sie stalo.
  const naEtapie = order.status === "completed" ? kroki.length : gdzie[order.status] ?? 0;

  const komorki = kroki.map((k, i) => {
    const przebyty = i < naEtapie;
    const biezacy = i === naEtapie;
    const kolor = biezacy ? "#b58a3c" : przebyty ? "#3f9e6a" : "#d9d9d9";
    const napis = biezacy ? "#b58a3c" : przebyty ? "#444" : "#aaa";
    const waga = biezacy ? "700" : "400";
    return `<td style="text-align:center;vertical-align:top;padding:0 2px;width:${Math.round(100 / kroki.length)}%">
      <div style="width:12px;height:12px;border-radius:12px;background:${kolor};margin:0 auto 8px"></div>
      <div style="font-size:11px;line-height:1.3;color:${napis};font-weight:${waga}">${esc(k.label)}</div>
      <div style="font-size:10px;color:#bbb;margin-top:2px">${k.stempel ? esc(String(k.stempel).slice(0, 10).split("-").reverse().join(".")) : "&nbsp;"}</div>
    </td>`;
  }).join("");

  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0 4px"><tr>${komorki}</tr></table>`;
}

/**
 * Mail do klienta o nowym etapie zlecenia.
 *
 * @returns {object|null} null, gdy o tym etapie nie ma czego pisac
 */
export function buildStatusUpdate(order) {
  const lang = ETAP_T[order.lang] ? order.lang : "pl";
  const l = ETAP_T[lang];
  const wpis = l.stany[order.status];
  const tresc = typeof wpis === "string" ? wpis : wpis?.[drogaWydania(order)];
  if (!tresc || !order.customer_email) return null;
  const tytul = (ETAP_TYTUL[lang] || ETAP_TYTUL.pl)[order.status] || l.subject(order.order_ref);

  const link = linkZlecenia(order, lang);
  // List przewozowy tylko przy przesylce. Panel chowa to pole przy przekazaniu
  // osobistym, ale warunek patrzyl wylacznie na status, wiec jedna omylkowa
  // wartosc w bazie dorabiala numer przesylki do paczki, ktora nigdzie nie
  // jechala.
  const zPrzesylka = order.status === "shipped" && order.tracking_number
    && drogaWydania(order) === "ship";
  const kurier = zPrzesylka ? przewoznik(order, lang) : null;
  // Karta z terminem stoi tylko dopoki termin jest jeszcze obietnica. Przy
  // etapie "gotowe" praca jest skonczona, wiec "planowana finalizacja" w
  // przyszlosci przeczylaby zdaniu stojacemu wyzej w tym samym mailu.
  const zTerminem = order.deadline_at && ["queued", "in_production"].includes(order.status);
  // Odnosniki te same co w potwierdzeniu, bez powtarzania odnosnika do
  // zlecenia: ten stoi wyzej jako przycisk i drugi raz byloby go za duzo.
  const t = T[lang] || T.pl;
  const odnosniki = [zdanieProces(t, lang), zdanieRegulamin(t, lang)];

  // Wersja tekstowa zostaje: czesc klientow pocztowych i czytniki ekranu biora
  // wlasnie ja, a mail bez niej ladu je czesciej w spamie.
  const linie = [l.hi, "", tresc.charAt(0).toUpperCase() + tresc.slice(1)];
  if (zTerminem) linie.push("", l.termin(dzien(order.deadline_at)));
  if (zPrzesylka) linie.push("", l.przesylka(order.tracking_number));
  if (kurier) {
    linie.push(`${l.przewoznikLabel(kurier.nazwa)}. ${l.sledzLabel}:`);
    for (const a of kurier.adresy) linie.push(a.href);
  }
  linie.push("", `${l.podglad}: ${link}`);
  linie.push("", odnosnikiText(lang, odnosniki), "", stopkaText(lang));
  const text = linie.join("\n");

  const html = koperta({ lang, odnosniki, srodek: `
    <h1 style="margin:0 0 6px;font-size:20px;line-height:1.3;font-weight:700">${esc(tytul)}</h1>
    <p style="margin:0 0 4px;font-size:12px;color:#777">${l.orderNo}</p>
    <p style="margin:0 0 20px;font-size:15px;font-weight:700;font-family:ui-monospace,monospace">${esc(order.order_ref)}</p>

    <p style="margin:0 0 22px;line-height:1.6">${esc(tresc.charAt(0).toUpperCase() + tresc.slice(1))}</p>

    <div style="border-top:1px solid #eee;padding-top:18px">
      <p style="margin:0 0 2px;font-size:12px;color:#777">${l.progress}</p>
      ${paseczek(order, lang)}
    </div>

    ${zTerminem ? `
      <div style="margin-top:18px;background:#faf6ee;border-radius:8px;padding:14px 16px">
        <span style="font-size:12px;color:#8a7a5c">${l.terminLabel}</span>
        <div style="font-size:18px;font-weight:700;color:#7a5f22;margin-top:2px">${esc(dzien(order.deadline_at))}</div>
      </div>
    ` : ""}

    ${zPrzesylka ? `
      <div style="margin-top:14px;background:#f4f4f4;border-radius:8px;padding:14px 16px">
        <span style="font-size:12px;color:#777">${l.przesylkaLabel}</span>
        <div style="font-size:15px;font-weight:700;font-family:ui-monospace,monospace;margin-top:2px">${esc(order.tracking_number)}</div>
        ${kurier ? `
          <div style="margin-top:10px;font-size:13px;color:#444">${esc(l.przewoznikLabel(kurier.nazwa))}.</div>
          <div style="margin-top:2px;font-size:13px">${kurier.adresy.map((a) => `<a href="${esc(a.href)}" style="color:#b58a3c;font-weight:700">${esc(a.pokaz)}</a>`).join(" &nbsp;|&nbsp; ")}</div>
        ` : ""}
      </div>
    ` : ""}

    <p style="margin:24px 0 0">
      <a href="${esc(link)}" style="display:inline-block;background:#b58a3c;color:#fff;text-decoration:none;border-radius:6px;padding:12px 22px;font-size:14px;font-weight:700">${esc(l.podglad)}</a>
    </p>

  ` });

  return { to: order.customer_email, from: FROM, subject: `${tytul}, ${order.order_ref}`, text, html };
}

/**
 * Wysylka powiadomienia o etapie. Wolana TYLKO wtedy, gdy pracownia zaznaczyla
 * to przy przestawianiu zlecenia.
 *
 * @returns {Promise<boolean>} czy mail naprawde wyszedl
 */
export async function sendStatusUpdate(pool, orderId) {
  try {
    const { rows } = await pool.query(
      `SELECT order_ref, status, lang, customer_email, access_token,
              deadline_at, tracking_number, carrier, delivery_method, country, requires_details,
              paid_at, details_at, queued_at, production_started_at, ready_at, shipped_at,
              completed_at
         FROM orders WHERE id = $1`,
      [orderId]
    );
    const wiadomosc = rows[0] ? buildStatusUpdate(rows[0]) : null;
    if (!wiadomosc) return false;
    return await sendViaGmail([wiadomosc]);
  } catch (e) {
    console.error("[etap] powiadomienie nie zostalo wyslane:", e.message);
    return false;
  }
}

/** Pozycje zamowienia w postaci, ktorej potrzebuja oba przypomnienia. */
async function pozycjeZamowienia(pool, orderId) {
  const { rows } = await pool.query(
    "SELECT title, qty FROM order_items WHERE order_id = $1 ORDER BY id",
    [orderId]
  );
  return rows;
}

/**
 * @returns {Promise<boolean>} czy mail naprawde wyszedl. Wynik ma znaczenie:
 *   zapis "wyslane" bez wyslania zamknalby ten prog na zawsze.
 */
export async function sendDeadlineReminder(pool, order, dniDoTerminu) {
  try {
    const items = await pozycjeZamowienia(pool, order.id);
    return await sendViaGmail([buildDeadlineReminder(order, items, dniDoTerminu)]);
  } catch (e) {
    console.error("[termin] przypomnienie nie zostalo wyslane:", e.message);
    return false;
  }
}

export async function sendDetailsNudge(pool, order, dniStania) {
  try {
    const items = await pozycjeZamowienia(pool, order.id);
    return await sendViaGmail([buildDetailsNudge(order, items, dniStania)]);
  } catch (e) {
    console.error("[ustalenia] szturchniecie nie zostalo wyslane:", e.message);
    return false;
  }
}

export async function sendPaymentReviewAlert(pool, orderId) {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    const order = rows[0];
    if (!order || order.status !== "payment_review") return false;
    if (await sendViaGmail([buildPaymentReviewMessage(order)])) {
      console.log(`[payment-review] wyslano alert dla ${order.order_ref}`);
      return true;
    }
    console.error(`[payment-review] PILNE, brak kanalu alertu dla ${order.order_ref}`);
    return false;
  } catch (e) {
    console.error("[payment-review] alert nie zostal wyslany:", e.message);
    return false;
  }
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

/**
 * Plakietka przy nazwie pozycji: "do wyboru", "dodatek", "zaznaczone".
 *
 * Klient pocztowy blokuje wlasne arkusze stylow, wiec kazda regula stoi wprost
 * przy elemencie. Tlo, a nie sama ramka: ramka w Outlooku bywa gubiona.
 */
function plakietka(rodzaj, wybrany) {
  const tlo = wybrany ? "#f3ead6" : "#f0f0f0";
  const napis = wybrany ? "#7a5f22" : "#888";
  return `<span style="display:inline-block;background:${tlo};color:${napis};font-size:11px;`
    + `border-radius:4px;padding:1px 6px;margin-right:6px;white-space:nowrap">${esc(rodzaj)}</span>`;
}

const QUOTE_T = {
  pl: {
    hi: "Dzień dobry,",
    total: "Razem",
    // Ta sama wiadomosc wychodzi w dwoch zupelnie roznych chwilach: klient
    // zapisuje sobie wycene z kalkulatora ALBO dostaje od nas oferte na swoje
    // zapytanie. "Wycena, ktora zapisales" bylo w tym drugim przypadku
    // nieprawda, i to nieprawda widoczna: klient wariantow sam sobie nie
    // ulozyl. Rozstrzyga `quotes.source`, bo ta informacja jest w bazie od
    // poczatku i nie trzeba jej zgadywac.
    zapisana: {
      subject: (ref) => `Twoja wycena ${ref}, AEJaCA`,
      intro: "poniżej wycena zapisana na aejaca.com. Link otwiera ją w każdej chwili, także na innym urządzeniu.",
      items: "Wyceniane pozycje",
      numer: "Numer wyceny",
      open: "Otwórz wycenę",
      validUntil: (d) => `Wycena obowiązuje do ${d}.`,
      validLabel: "Wycena ważna do",
      noObligation: "Zapisanie wyceny nie jest zamówieniem i do niczego nie zobowiązuje.",
    },
    oferta: {
      subject: (ref) => `Oferta ${ref}, AEJaCA`,
      intro: "poniżej oferta przygotowana na podstawie Twojego zapytania. Link otwiera ją w każdej chwili, także na innym urządzeniu.",
      items: "Pozycje oferty",
      numer: "Numer oferty",
      open: "Otwórz ofertę",
      validUntil: (d) => `Oferta obowiązuje do ${d}.`,
      validLabel: "Oferta ważna do",
      noObligation: "Oferta nie jest zamówieniem i do niczego nie zobowiązuje. Zamówienie powstaje dopiero wtedy, gdy opłacisz wybrane pozycje.",
    },
    leadLabel: "Termin realizacji",
    leadZdanie: (ile) => `Termin realizacji: ${ile} od zapłaty.`,
    leadDetails: (ile) => `Termin realizacji: ${ile}. Liczymy go od domknięcia ustaleń, bo zaznaczone pozycje wymagają wcześniejszej rozmowy.`,
    numerZdanie: (ref) => `Numer ${ref} wpiszesz też ręcznie, na stronie oferty, w sklepie albo w koszyku.`,
    metalNote:
      "Robocizna w tej kwocie jest wiążąca przez cały okres ważności. Wartość kruszcu przeliczamy w dniu zamówienia według bieżącego kursu, więc przy złocie i srebrze kwota końcowa może się nieznacznie różnić.",
    pick: "do wyboru",
    addon: "dodatek",
    chosen: "zaznaczone",
    configNote: "Kwota dotyczy układu zaznaczonego wyżej. Wariant i dodatki zmienisz na stronie oferty, a kwota policzy się od nowa.",
    questions: "Pytania",
    bye: "Pozdrawiamy",
  },
  en: {
    hi: "Hello,",
    total: "Total",
    zapisana: {
      subject: (ref) => `Your quote ${ref}, AEJaCA`,
      intro: "here is the quote saved on aejaca.com. The link opens it any time, on any device.",
      items: "Quoted items",
      numer: "Quote number",
      open: "Open the quote",
      validUntil: (d) => `The quote is valid until ${d}.`,
      validLabel: "Quote valid until",
      noObligation: "Saving a quote is not an order and commits you to nothing.",
    },
    oferta: {
      subject: (ref) => `Offer ${ref}, AEJaCA`,
      intro: "here is the offer we prepared for your enquiry. The link opens it any time, on any device.",
      items: "Items in the offer",
      numer: "Offer number",
      open: "Open the offer",
      validUntil: (d) => `The offer is valid until ${d}.`,
      validLabel: "Offer valid until",
      noObligation: "An offer is not an order and commits you to nothing. The order begins when you pay for the items you picked.",
    },
    leadLabel: "Lead time",
    leadZdanie: (ile) => `Lead time: ${ile} from payment.`,
    leadDetails: (ile) => `Lead time: ${ile}. It is counted from the moment the details are agreed, because the selected items need a conversation first.`,
    numerZdanie: (ref) => `You can also type the number ${ref} yourself, on the offer page, in the shop or in the cart.`,
    metalNote:
      "The labour in this amount is binding for the whole validity period. Precious metal is recalculated on the day of the order at the current rate, so for gold and silver the final amount may differ slightly.",
    pick: "choice",
    addon: "add-on",
    chosen: "selected",
    configNote: "The amount covers the configuration marked above. You can change the variant and the add-ons on the offer page and the amount follows.",
    questions: "Questions",
    bye: "Best regards",
  },
  de: {
    hi: "Guten Tag,",
    total: "Gesamt",
    zapisana: {
      subject: (ref) => `Ihre Kalkulation ${ref}, AEJaCA`,
      intro: "hier ist die auf aejaca.com gespeicherte Kalkulation. Der Link öffnet sie jederzeit, auch auf einem anderen Gerät.",
      items: "Kalkulierte Positionen",
      numer: "Kalkulationsnummer",
      open: "Kalkulation öffnen",
      validUntil: (d) => `Die Kalkulation gilt bis ${d}.`,
      validLabel: "Kalkulation gültig bis",
      noObligation: "Eine gespeicherte Kalkulation ist keine Bestellung und verpflichtet zu nichts.",
    },
    oferta: {
      subject: (ref) => `Angebot ${ref}, AEJaCA`,
      intro: "hier ist das Angebot, das wir zu Ihrer Anfrage erstellt haben. Der Link öffnet es jederzeit, auch auf einem anderen Gerät.",
      items: "Positionen des Angebots",
      numer: "Angebotsnummer",
      open: "Angebot öffnen",
      validUntil: (d) => `Das Angebot gilt bis ${d}.`,
      validLabel: "Angebot gültig bis",
      noObligation: "Ein Angebot ist keine Bestellung und verpflichtet zu nichts. Die Bestellung entsteht erst mit der Zahlung der gewählten Positionen.",
    },
    leadLabel: "Lieferzeit",
    leadZdanie: (ile) => `Lieferzeit: ${ile} ab Zahlung.`,
    leadDetails: (ile) => `Lieferzeit: ${ile}. Sie zählt ab dem Abschluss der Absprachen, denn die gewählten Positionen brauchen vorher ein Gespräch.`,
    numerZdanie: (ref) => `Die Nummer ${ref} können Sie auch selbst eingeben, auf der Angebotsseite, im Shop oder im Warenkorb.`,
    metalNote:
      "Die Arbeitsleistung in diesem Betrag ist für den gesamten Gültigkeitszeitraum verbindlich. Edelmetall wird am Tag der Bestellung zum aktuellen Kurs neu berechnet, bei Gold und Silber kann der Endbetrag daher leicht abweichen.",
    pick: "zur Auswahl",
    addon: "Zusatz",
    chosen: "ausgewählt",
    configNote: "Der Betrag gilt für die oben markierte Zusammenstellung. Variante und Zusätze ändern Sie auf der Angebotsseite, der Betrag folgt.",
    questions: "Fragen",
    bye: "Mit freundlichen Grüßen",
  },
};

/**
 * Mail z wycena. Wystawiony na zewnatrz, zeby dalo sie go sprawdzic bez bazy:
 * wyglad maila jest tym, co widzi klient, i ma byc pod kontrola sprawdzianu.
 */
export function buildQuoteMessage(quote, items, url) {
  const lang = ["pl", "en", "de"].includes(quote.lang) ? quote.lang : "pl";
  const l = QUOTE_T[lang];
  // Wycena zapisana przez klienta czy oferta wystawiona przez nas. Rozstrzyga
  // `source`, zapisany przy tworzeniu wyceny: klient zapisuje z kalkulatora
  // (`saved`), reszta zrodel to zapytania, na ktore odpowiadamy oferta.
  const w = quote.source === SAVED_QUOTE_SOURCE ? l.zapisana : l.oferta;
  // Wiersz musi mowic, czym pozycja JEST. Bez tego oferta z wariantami
  // pokazuje trzy kwoty i sume nizsza od ich sumy, co wyglada jak blad
  // rachunkowy, a jest po prostu wyborem jednej rzeczy z trzech.
  const wybor = items.some((i) => i.kind === "variant" || i.kind === "option");
  // Wariant odznaczony wygladal tak samo jak wybrany, wiec suma wychodzila
  // nizsza od sumy wierszy i dopiero zdanie pod tabela to tlumaczylo. W HTML
  // pokazuje to sam wiersz: wybrany normalnie, odrzucony szaro. Wersja tekstowa
  // zostaje przy nawiasach, bo tam nie ma czym pokolorowac.
  const rows = items.map((i) => {
    const rodzaj = i.kind === "variant" ? l.pick : i.kind === "option" ? l.addon : null;
    const wybrany = Boolean(rodzaj) && i.selected === true;
    const stan = rodzaj && i.selected ? `, ${l.chosen}` : "";
    const ilosc = i.qty > 1 ? ` x ${i.qty}` : "";
    return {
      label: `${rodzaj ? `[${rodzaj}${stan}] ` : ""}${i.title}${ilosc}`,
      // Plakietka zamiast nawiasow kwadratowych: `[do wyboru]` czytalo sie
      // jak znacznik z kodu, ktory zostal w tresci przez nieuwage.
      // Plakietka niesie takze slowo "zaznaczone", a nie sam kolor: czytnik
      // ekranu koloru nie przeczyta, a to od niego zalezy kwota.
      html: `${rodzaj ? plakietka(`${rodzaj}${stan}`, wybrany) : ""}${esc(i.title)}${esc(ilosc)}`,
      value: money(i.line_grosze ?? i.unit_grosze ?? 0),
      przygaszony: Boolean(rodzaj) && i.selected === false,
    };
  });

  // Wycena to moment, w ktorym klient decyduje, wiec pyta o dwie rzeczy:
  // jak zaplacic i co bedzie potem. Oba odnosniki stoja tu, a nie w stopce
  // serwisu, ktorej i tak nie otworzy z maila.
  const t = T[lang] || T.pl;
  const odnosniki = [
    zdanieZAdresem(t.zdaniePlatnosci, adres(lang, "/payments/")),
    [l.numerZdanie(quote.quote_ref)],
    zdanieProces(t, lang),
    zdanieRegulamin(t, lang),
  ];
  const wazneDo = quote.valid_until ? dzien(quote.valid_until) : null;

  // Klient pyta o dwie liczby naraz: ile to kosztuje i na kiedy to bedzie.
  // Druga stala dotad tylko na stronie oferty, wiec mail odpowiadal na polowe
  // pytania. Termin liczy sie z pozycji ZAZNACZONYCH, tak samo jak kwota,
  // wiec obie liczby zawsze mowia o tym samym ukladzie oferty.
  // Cala oferta, nie same pozycje: przy starej ofercie `pick_one` rodzaj
  // pozycji bierze sie z pola na WYCENIE, a `chosen_item_id` rozstrzyga wybor
  // tam, gdzie nic nie jest zaznaczone.
  const wybrane = selectedQuoteItems({ ...quote, items });
  const dniTerminu = terminGrupy(wybrane);
  const zUstaleniami = wybrane.some((i) => i.requires_details === true);
  const termin = dniTerminu
    ? (zUstaleniami ? l.leadDetails(dniSlownie(dniTerminu, lang)) : l.leadZdanie(dniSlownie(dniTerminu, lang)))
    : null;

  const html = koperta({ lang, odnosniki, srodek: `
    <p style="margin:0 0 6px">${esc(l.hi)}</p>
    <p style="margin:0 0 20px;line-height:1.6">${esc(w.intro)}</p>

    <p style="margin:0 0 4px;font-size:12px;color:#777">${esc(w.numer)}</p>
    <p style="margin:0 0 20px;font-size:18px;font-weight:700;font-family:ui-monospace,monospace">${esc(quote.quote_ref)}</p>

    <p style="margin:0 0 6px;font-size:12px;color:#777">${esc(w.items)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows.map((r) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;color:${r.przygaszony ? "#999" : "#111"}">${r.html}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;color:${r.przygaszony ? "#999" : "#111"}">${esc(r.value)}</td>
      </tr>`).join("")}
      <tr>
        <td style="padding:12px 0;font-weight:700">${esc(l.total)}</td>
        <td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px">${esc(money(quote.total_grosze))}</td>
      </tr>
    </table>

    ${wybor ? `<p style="margin:12px 0 0;line-height:1.6;font-size:13px;color:#666">${esc(l.configNote)}</p>` : ""}

    <p style="margin:24px 0 0">
      <a href="${esc(url)}" style="display:inline-block;background:#b58a3c;color:#fff;text-decoration:none;border-radius:6px;padding:12px 22px;font-size:14px;font-weight:700">${esc(w.open)}</a>
    </p>

    ${wazneDo ? `
      <div style="margin-top:20px;background:#faf6ee;border-radius:8px;padding:14px 16px">
        <span style="font-size:12px;color:#8a7a5c">${esc(w.validLabel)}</span>
        <div style="font-size:18px;font-weight:700;color:#7a5f22;margin-top:2px">${esc(wazneDo)}</div>
      </div>` : ""}

    ${termin ? `<p style="margin:14px 0 0;line-height:1.6;font-size:13px;color:#444"><strong>${esc(l.leadLabel)}.</strong> ${esc(termin.replace(/^[^:]+:\s*/, ""))}</p>` : ""}

    <p style="margin:18px 0 0;line-height:1.6;font-size:13px;color:#666">${esc(l.metalNote)}</p>
    <p style="margin:10px 0 0;line-height:1.6;font-size:13px;color:#666">${esc(w.noObligation)}</p>
  ` });

  const text = [
    l.hi, "", w.intro, "",
    `${w.numer}: ${quote.quote_ref}`, "",
    w.items + ":",
    ...rows.map((r) => `- ${r.label}: ${r.value}`),
    `${l.total}: ${money(quote.total_grosze)}`,
    wybor ? `\n${l.configNote}` : null,
    "", `${w.open}: ${url}`,
    wazneDo ? `\n${w.validUntil(wazneDo)}` : "",
    termin ? `\n${termin}` : null,
    "", l.metalNote,
    "", w.noObligation,
    "", odnosnikiText(lang, odnosniki),
    "", stopkaText(lang),
  ].filter((line) => line !== null).join("\n");

  return { to: quote.customer_email, from: FROM, replyTo: SELLER.email, subject: w.subject(quote.quote_ref), text, html };
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
      // `id` i `group_key` decyduja o tym, ktory wariant jest wybrany, a `order_id`
      // razem ze stanem zamowienia o tym, czy pozycja jest jeszcze do wziecia.
      // Bez nich `selectedQuoteItems` nie ma czym rozrozniac pozycji i termin
      // policzylby sie z WSZYSTKICH wariantow, takze odznaczonych.
      `SELECT qi.id, qi.title, qi.qty, qi.unit_grosze, qi.line_grosze, qi.kind, qi.selected,
              qi.group_key, qi.lead_days, qi.requires_details, qi.order_id, o.status AS order_status
         FROM quote_items qi
         LEFT JOIN orders o ON o.id = qi.order_id
        WHERE qi.quote_id = $1
        ORDER BY qi.id`,
      [quote.id]
    );

    try {
      if (await sendViaGmail([buildQuoteMessage(quote, items, url)])) {
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
