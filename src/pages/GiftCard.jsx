// ============================================================
// KARTA PODARUNKOWA
// ============================================================
// Strona robi trzy rzeczy naraz i kolejnosc nie jest przypadkowa:
//
//   1. sprzedaje karte komus, kto nie wie, co kupic     (formularz zamowienia)
//   2. sprawdza saldo komus, kto karte juz dostal        (pole z numerem)
//   3. tlumaczy zasady, zanim ktos o nie zapyta mailem   (FAQ + schemat)
//
// Sprzedaz idzie przez zapytanie i przelew, a nie przez kase. Karta w koszyku
// wymagalaby obejscia wysylki (katalog nie zna dzis pojecia towaru cyfrowego)
// i osobnej sciezki w Autopay, a nie wiemy jeszcze, czy jest popyt. Realizacja
// karty dziala juz w pelni automatycznie, wiec automat po stronie sprzedazy
// mozna dolozyc bez ruszania niczego innego.
//
// Sprawdzenie salda jest tu, a nie w kasie, z prostego powodu: obdarowany
// pyta "ile mam", zanim zacznie kompletowac koszyk, a nie po. W kasie pole
// tez jest, ale odpowiada juz na inne pytanie: "ile z tego zamowienia karta
// pokryje".

import { useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Wallet, Send, Check, AlertCircle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import { API_URL, postJSON } from "../utils/api.js";
import { useMarketRates } from "../hooks/useMarketRates.js";

const URL = `${SITE.url}/gift-card/`;

/** Nominaly do wyboru, w zlotowkach. Pokrywaja sie z widelkami z `giftcards.js`. */
const AMOUNTS = [200, 300, 500, 800, 1200, 2000];

const L10N = {
  pl: {
    heroTag: "Prezent",
    heroTitle: "Karta podarunkowa AEJaCA",
    heroDesc: "Kiedy wiesz, komu chcesz zrobić prezent, ale nie chcesz zgadywać rozmiaru, kamienia ani koloru złota.",
    breadHome: "Strona główna",
    breadThis: "Karta podarunkowa",

    whyTitle: "Dlaczego karta, a nie gotowy pierścionek",
    whyText: "Robimy na zamówienie, więc prawie każdy nasz wyrób wymaga ustaleń: rozmiar palca, próba, kamień, grawer. Karta przenosi te decyzje na osobę, która będzie tę biżuterię nosić, i nie zamienia prezentu w loterię. Działa też na usługi pracowni, na druk 3D i na grawer, więc nie zawęża wyboru do jednej półki.",

    howTitle: "Jak to działa",
    steps: [
      { t: "Wybierasz kwotę", d: "Od 100 do 10 000 zł. Nominał ustalasz sam, nie musi być okrągły." },
      { t: "Dostajesz dane do przelewu", d: "Odpowiadamy zwykle w ciągu 24 godzin, w dni robocze." },
      { t: "Wysyłamy kartę", d: "Po zaksięgowaniu wpłaty przesyłamy kartę z numerem i dedykacją, mailem do Ciebie albo prosto do obdarowanej osoby." },
      { t: "Obdarowany wpisuje numer w kasie", d: "Karta zdejmuje kwotę z zamówienia. Reszta zostaje na karcie do następnego razu." },
    ],

    rulesTitle: "Zasady bez gwiazdek",
    rules: [
      "Ważna 12 miesięcy od wydania, data jest wypisana na karcie. Po tym terminie karta wygasa, a niewykorzystane środki przepadają.",
      "Pokrywa też koszt wysyłki, bo to przedpłata, a nie rabat.",
      "Reszta zostaje na karcie i można ją wykorzystać przy kolejnym zamówieniu.",
      "Można ją łączyć z kodem rabatowym: najpierw liczy się rabat, potem karta schodzi od kwoty do zapłaty.",
      "Obejmuje całą ofertę: biżuterię, usługi pracowni, druk 3D, grawer i cięcie laserem.",
      "Jest na okaziciela: kto poda numer, ten może z niej skorzystać. Chroń numer tak jak gotówkę.",
      "Nie wymieniamy jej na gotówkę, ani w całości, ani w części.",
    ],

    orderTitle: "Zamów kartę",
    orderIntro: "Wypełnij formularz, a odeślemy dane do przelewu. Kartę wystawiamy po zaksięgowaniu wpłaty.",
    amountLabel: "Kwota",
    amountCustom: "Inna kwota (zł)",
    nameLabel: "Twoje imię",
    emailLabel: "Twój adres e-mail",
    forWhomLabel: "Dla kogo (imię, opcjonalnie)",
    dedicationLabel: "Dedykacja na karcie (opcjonalnie)",
    dedicationPlaceholder: "Wszystkiego najlepszego, Aniu",
    sendBtn: "Wyślij zapytanie",
    sending: "Wysyłam...",
    sentTitle: "Zapytanie wysłane",
    sentText: "Odezwiemy się z danymi do przelewu, zwykle w ciągu 24 godzin w dni robocze.",
    sendError: "Nie udało się wysłać. Spróbuj ponownie albo napisz na contact@aejaca.com.",

    balanceTitle: "Sprawdź saldo karty",
    balanceIntro: "Masz już kartę? Wpisz numer, żeby zobaczyć, ile na niej zostało i do kiedy jest ważna.",
    balanceLabel: "Numer karty",
    balanceBtn: "Sprawdź",
    balanceChecking: "Sprawdzam...",
    balanceAvailable: "Dostępne",
    balanceOf: "z",
    balanceValidTo: "Ważna do",
    balanceUse: "Przejdź do sklepu",

    faqTitle: "Częste pytania",
    ctaTitle: "Wolisz zapytać, zanim kupisz?",
    ctaText: "Napisz, dla kogo szukasz prezentu, a podpowiemy, czy karta jest tu lepszym pomysłem niż konkretny wyrób.",
    ctaBtn: "Napisz do nas",
    required: "Uzupełnij kwotę, imię i adres e-mail.",
    consent: "Zapoznałem się z regulaminem karty podarunkowej i akceptuję jego treść.",
    consentLink: "Regulamin karty podarunkowej",
    consentRequired: "Potwierdź zapoznanie się z regulaminem karty.",
    rulesFull: "Pełne warunki: regulamin, sekcja 7a",
  },
  en: {
    heroTag: "Gift",
    heroTitle: "AEJaCA gift card",
    heroDesc: "For when you know who the present is for, but would rather not guess a ring size, a stone or a shade of gold.",
    breadHome: "Home",
    breadThis: "Gift card",

    whyTitle: "Why a card rather than a finished ring",
    whyText: "We make to order, so almost every piece needs decisions: finger size, fineness, stone, engraving. A card hands those decisions to the person who will actually wear the jewelry, and stops the present from being a lottery. It also covers workshop services, 3D printing and engraving, so it does not narrow the choice to one shelf.",

    howTitle: "How it works",
    steps: [
      { t: "Pick an amount", d: "From 100 to 10 000 PLN. You set the figure, it does not have to be round." },
      { t: "We send the transfer details", d: "We usually reply within 24 hours on working days." },
      { t: "We issue the card", d: "Once the payment clears we send the card with its number and your dedication, to you or straight to the recipient." },
      { t: "They enter the number at checkout", d: "The card takes its amount off the order. Whatever is left stays on the card for next time." },
    ],

    rulesTitle: "The rules, without asterisks",
    rules: [
      "Valid for 12 months from issue, and the date is printed on the card. After that date the card expires and any unused balance is lost.",
      "It covers shipping too, because it is prepayment and not a discount.",
      "Any remainder stays on the card and can be used on a later order.",
      "It combines with a discount code: the discount applies first, then the card comes off the amount due.",
      "It covers the whole offer: jewelry, workshop services, 3D printing, engraving and laser cutting.",
      "It is issued to bearer: whoever gives the number can use it. Protect the number as you would cash.",
      "It is not exchangeable for cash, in whole or in part.",
    ],

    orderTitle: "Order a card",
    orderIntro: "Fill in the form and we will send you the transfer details. The card is issued once the payment clears.",
    amountLabel: "Amount",
    amountCustom: "Other amount (PLN)",
    nameLabel: "Your name",
    emailLabel: "Your email address",
    forWhomLabel: "For whom (name, optional)",
    dedicationLabel: "Dedication on the card (optional)",
    dedicationPlaceholder: "Happy birthday, Anna",
    sendBtn: "Send enquiry",
    sending: "Sending...",
    sentTitle: "Enquiry sent",
    sentText: "We will come back with the transfer details, usually within 24 hours on working days.",
    sendError: "Sending failed. Try again or write to contact@aejaca.com.",

    balanceTitle: "Check a card balance",
    balanceIntro: "Already have a card? Enter its number to see what is left on it and how long it is valid.",
    balanceLabel: "Card number",
    balanceBtn: "Check",
    balanceChecking: "Checking...",
    balanceAvailable: "Available",
    balanceOf: "of",
    balanceValidTo: "Valid until",
    balanceUse: "Go to the shop",

    faqTitle: "Common questions",
    ctaTitle: "Would you rather ask before buying?",
    ctaText: "Tell us who the present is for and we will say whether a card beats a specific piece in your case.",
    ctaBtn: "Contact us",
    required: "Please fill in the amount, your name and your email address.",
    consent: "I have read the gift card terms and accept them.",
    consentLink: "Gift card terms",
    consentRequired: "Please confirm you have read the gift card terms.",
    rulesFull: "Full terms: Terms of Service, section 7a",
  },
  de: {
    heroTag: "Geschenk",
    heroTitle: "AEJaCA Geschenkkarte",
    heroDesc: "Für den Fall, dass Sie wissen, wen Sie beschenken wollen, aber Ringgröße, Stein und Goldton nicht raten möchten.",
    breadHome: "Startseite",
    breadThis: "Geschenkkarte",

    whyTitle: "Warum eine Karte statt eines fertigen Rings",
    whyText: "Wir fertigen nach Maß, fast jedes Stück braucht daher Entscheidungen: Fingergröße, Feingehalt, Stein, Gravur. Eine Karte überlässt diese Entscheidungen der Person, die den Schmuck später trägt, und macht aus dem Geschenk keine Lotterie. Sie gilt auch für Werkstattleistungen, 3D-Druck und Gravur, engt die Auswahl also nicht auf ein Regal ein.",

    howTitle: "So funktioniert es",
    steps: [
      { t: "Betrag wählen", d: "Von 100 bis 10 000 PLN. Sie legen die Summe fest, sie muss nicht rund sein." },
      { t: "Sie erhalten die Überweisungsdaten", d: "Wir antworten in der Regel innerhalb von 24 Stunden an Werktagen." },
      { t: "Wir stellen die Karte aus", d: "Nach Zahlungseingang senden wir die Karte mit Nummer und Widmung, an Sie oder direkt an die beschenkte Person." },
      { t: "Die Nummer wird an der Kasse eingegeben", d: "Die Karte zieht ihren Betrag von der Bestellung ab. Der Rest bleibt für das nächste Mal auf der Karte." },
    ],

    rulesTitle: "Die Regeln, ohne Sternchen",
    rules: [
      "12 Monate ab Ausstellung gültig, das Datum steht auf der Karte. Danach verfällt die Karte, nicht genutztes Guthaben verfällt mit ihr.",
      "Sie deckt auch den Versand, denn sie ist eine Vorauszahlung und kein Rabatt.",
      "Ein Restbetrag bleibt auf der Karte und lässt sich später einlösen.",
      "Sie ist mit einem Rabattcode kombinierbar: erst der Rabatt, dann die Karte vom Zahlbetrag.",
      "Sie gilt für das gesamte Angebot: Schmuck, Werkstattleistungen, 3D-Druck, Gravur und Laserschnitt.",
      "Sie lautet auf den Inhaber: wer die Nummer nennt, kann sie einlösen. Schützen Sie die Nummer wie Bargeld.",
      "Sie wird weder ganz noch teilweise in Bargeld umgetauscht.",
    ],

    orderTitle: "Karte bestellen",
    orderIntro: "Füllen Sie das Formular aus, wir senden Ihnen die Überweisungsdaten. Die Karte wird nach Zahlungseingang ausgestellt.",
    amountLabel: "Betrag",
    amountCustom: "Anderer Betrag (PLN)",
    nameLabel: "Ihr Name",
    emailLabel: "Ihre E-Mail-Adresse",
    forWhomLabel: "Für wen (Name, optional)",
    dedicationLabel: "Widmung auf der Karte (optional)",
    dedicationPlaceholder: "Alles Gute, Anna",
    sendBtn: "Anfrage senden",
    sending: "Senden...",
    sentTitle: "Anfrage gesendet",
    sentText: "Wir melden uns mit den Überweisungsdaten, in der Regel innerhalb von 24 Stunden an Werktagen.",
    sendError: "Senden fehlgeschlagen. Versuchen Sie es erneut oder schreiben Sie an contact@aejaca.com.",

    balanceTitle: "Kartenguthaben prüfen",
    balanceIntro: "Sie haben bereits eine Karte? Geben Sie die Nummer ein, um Restguthaben und Gültigkeit zu sehen.",
    balanceLabel: "Kartennummer",
    balanceBtn: "Prüfen",
    balanceChecking: "Prüfen...",
    balanceAvailable: "Verfügbar",
    balanceOf: "von",
    balanceValidTo: "Gültig bis",
    balanceUse: "Zum Shop",

    faqTitle: "Häufige Fragen",
    ctaTitle: "Lieber vorher fragen?",
    ctaText: "Sagen Sie uns, für wen das Geschenk ist, und wir sagen Ihnen, ob eine Karte in Ihrem Fall besser passt als ein konkretes Stück.",
    ctaBtn: "Kontakt",
    required: "Bitte Betrag, Name und E-Mail-Adresse ausfüllen.",
    consent: "Ich habe die Bedingungen für die Geschenkkarte gelesen und akzeptiere sie.",
    consentLink: "Bedingungen für die Geschenkkarte",
    consentRequired: "Bitte bestätigen Sie, dass Sie die Bedingungen gelesen haben.",
    rulesFull: "Vollständige Bedingungen: AGB, Abschnitt 7a",
  },
};

const SEO_META = {
  pl: {
    title: "Karta podarunkowa AEJaCA, prezent bez zgadywania rozmiaru",
    description: "Karta podarunkowa na biżuterię i usługi pracowni. Od 100 do 10 000 zł, ważna 12 miesięcy, reszta zostaje na karcie. Pokrywa też wysyłkę.",
  },
  en: {
    title: "AEJaCA gift card, a present without guessing the size",
    description: "A gift card for jewelry and workshop services. From 100 to 10 000 PLN, valid 12 months, any remainder stays on the card. Covers shipping too.",
  },
  de: {
    title: "AEJaCA Geschenkkarte, schenken ohne Größe zu raten",
    description: "Geschenkkarte für Schmuck und Werkstattleistungen. Von 100 bis 10 000 PLN, 12 Monate gültig, Restguthaben bleibt erhalten. Deckt auch den Versand.",
  },
};

const FAQ = {
  pl: [
    { q: "Czy karta obejmuje koszt wysyłki?", a: "Tak. Karta jest przedpłatą, a nie rabatem, więc pokrywa całą kwotę do zapłaty razem z dostawą. Kod rabatowy działa inaczej i wysyłki nie obejmuje nigdy." },
    { q: "Co się dzieje, gdy zamówienie jest tańsze niż karta?", a: "Reszta zostaje na karcie i można ją wykorzystać przy kolejnym zamówieniu, aż do końca ważności. Nie przepada i nie musisz dobierać czegokolwiek na siłę, żeby wykorzystać całość." },
    { q: "A jeśli zamówienie jest droższe?", a: "Karta pokrywa tyle, ile na niej jest, a resztę dopłacasz normalnie: BLIK-iem, przelewem natychmiastowym albo przelewem zwykłym. Kasa policzy to sama." },
    { q: "Jak długo karta jest ważna?", a: "12 miesięcy od wydania. Data jest wypisana na karcie, więc nie trzeba jej szukać w regulaminie. Przy robocie na zamówienie to spokojny zapas na ustalenie projektu i wykonanie." },
    { q: "Czy kartę można łączyć z kodem rabatowym?", a: "Tak. Najpierw liczy się rabat od pozycji w koszyku, potem doliczana jest wysyłka, a karta schodzi na końcu od kwoty do zapłaty." },
    { q: "Czy karta działa też na usługi pracowni?", a: "Tak, obejmuje całą ofertę: biżuterię z półki i na zamówienie, druk 3D FDM i żywiczny, grawerowanie, cięcie laserem oraz odlewy. To jedna z głównych zalet karty przy prezencie dla kogoś, kto majsterkuje." },
    { q: "Zgubiłem numer karty. Da się go odzyskać?", a: "Napisz do nas z adresu, na który karta została wysłana, albo podaj dane osoby, która ją kupiła. Znajdziemy kartę i wyślemy numer ponownie. Karty zgłoszone jako zgubione blokujemy i wydajemy w zamian nową na pozostałe saldo." },
    { q: "Czy kartę można zwrócić albo wymienić na gotówkę?", a: "Na gotówkę nie wymieniamy jej w żadnym wypadku. Możesz natomiast odstąpić od zakupu karty w ciągu 14 dni od jej wydania, bez podania przyczyny, o ile nie została wykorzystana choćby w części. Wystarczy wiadomość na contact@aejaca.com, zwracamy całą kwotę w 14 dni." },
    { q: "Co się dzieje po upływie ważności?", a: "Karta wygasa, a niewykorzystane środki przepadają i nie podlegają zwrotowi. Ważności nie przedłużamy, dlatego data jest wypisana wprost na karcie, a saldo i termin możesz sprawdzić w każdej chwili na tej stronie. Przy 12 miesiącach i robocie na zamówienie to spory zapas, ale warto o tym pamiętać." },
    { q: "Czy karta jest przypisana do osoby?", a: "Nie, karta jest na okaziciela. Realizujemy ją dla każdego, kto poda numer, i nie sprawdzamy, kto nim dysponuje. To wygodne, gdy chcesz przekazać kartę dalej, ale oznacza też, że numer trzeba chronić tak jak gotówkę. Zgubiony numer zgłoś nam, zablokujemy kartę i wydamy nową na pozostałe saldo." },
    { q: "Zwracam rzecz kupioną za kartę. Co odzyskam?", a: "Kwotę zapłaconą kartą oddajemy na kartę, doładowując jej saldo. Jeżeli karta w międzyczasie wygasła, wydajemy nową o tej samej wartości i z nowym terminem ważności. To, co dopłaciłeś inną metodą, wraca tą samą metodą. Zapłata kartą nie odbiera Ci żadnych praw konsumenta." },
  ],
  en: [
    { q: "Does the card cover shipping?", a: "Yes. The card is prepayment rather than a discount, so it covers the full amount due including delivery. A discount code works differently and never covers shipping." },
    { q: "What happens if the order costs less than the card?", a: "The remainder stays on the card and can be used on a later order, until it expires. Nothing is lost and you do not have to pad an order to use it all up." },
    { q: "And if the order costs more?", a: "The card covers what is on it and you pay the difference as normal: BLIK, instant transfer or an ordinary bank transfer. The checkout works it out for you." },
    { q: "How long is the card valid?", a: "12 months from issue. The date is printed on the card, so there is no need to hunt for it in the terms. For made-to-order work that is a comfortable margin for agreeing a design and making it." },
    { q: "Can the card be combined with a discount code?", a: "Yes. The discount applies to the cart lines first, then shipping is added, and the card comes off the amount due at the end." },
    { q: "Does the card work for workshop services too?", a: "Yes, it covers the whole offer: ready-made and made-to-order jewelry, FDM and resin 3D printing, engraving, laser cutting and casting. That is one of its main advantages when the present is for someone who makes things." },
    { q: "I lost the card number. Can it be recovered?", a: "Write to us from the address the card was sent to, or give us the details of the person who bought it. We will find the card and resend the number. Cards reported lost are blocked and reissued for the remaining balance." },
    { q: "Can a card be returned or exchanged for cash?", a: "We never exchange cards for cash. You can, however, withdraw from the purchase within 14 days of issue, without giving a reason, provided the card has not been used even in part. An email to contact@aejaca.com is enough and we refund the full amount within 14 days." },
    { q: "What happens after the card expires?", a: "The card expires and any unused balance is lost and not refunded. We do not extend validity, which is why the date is printed on the card and the balance and expiry can be checked here at any time. With 12 months and made-to-order work that is a comfortable margin, but it is worth keeping in mind." },
    { q: "Is the card tied to a person?", a: "No, it is issued to bearer. We honour it for anyone who gives the number and do not check who holds it. That makes it easy to pass on, but it also means the number has to be protected like cash. Report a lost number to us and we will block the card and issue a new one for the remaining balance." },
    { q: "I am returning something bought with a card. What do I get back?", a: "The amount paid by card goes back onto the card by crediting its balance. If the card has expired in the meantime we issue a new one of the same value with a new expiry date. Anything you paid on top by another method comes back the same way. Paying by card takes none of your consumer rights away." },
  ],
  de: [
    { q: "Deckt die Karte den Versand?", a: "Ja. Die Karte ist eine Vorauszahlung und kein Rabatt, sie deckt daher den gesamten Zahlbetrag einschließlich Lieferung. Ein Rabattcode funktioniert anders und deckt den Versand nie." },
    { q: "Was passiert, wenn die Bestellung günstiger ist als die Karte?", a: "Das Restguthaben bleibt auf der Karte und lässt sich bis zum Ablauf für eine spätere Bestellung nutzen. Nichts verfällt, und Sie müssen nichts dazukaufen, um den Betrag aufzubrauchen." },
    { q: "Und wenn die Bestellung teurer ist?", a: "Die Karte deckt ihren Betrag, die Differenz zahlen Sie normal: BLIK, Sofortüberweisung oder klassische Überweisung. Die Kasse rechnet das selbst aus." },
    { q: "Wie lange ist die Karte gültig?", a: "12 Monate ab Ausstellung. Das Datum steht auf der Karte, Sie müssen es nicht in den AGB suchen. Bei Maßanfertigung ist das ein bequemer Spielraum für Entwurf und Fertigung." },
    { q: "Lässt sich die Karte mit einem Rabattcode kombinieren?", a: "Ja. Zuerst greift der Rabatt auf die Warenkorbpositionen, dann kommt der Versand hinzu, und am Ende zieht die Karte vom Zahlbetrag ab." },
    { q: "Gilt die Karte auch für Werkstattleistungen?", a: "Ja, sie gilt für das gesamte Angebot: Schmuck von der Stange und nach Maß, FDM- und Harz-3D-Druck, Gravur, Laserschnitt und Guss. Das ist einer ihrer größten Vorteile, wenn das Geschenk für jemanden ist, der selbst baut." },
    { q: "Ich habe die Kartennummer verloren. Lässt sie sich wiederherstellen?", a: "Schreiben Sie uns von der Adresse aus, an die die Karte ging, oder nennen Sie die Daten der Person, die sie gekauft hat. Wir finden die Karte und senden die Nummer erneut. Als verloren gemeldete Karten sperren wir und stellen eine neue über das Restguthaben aus." },
    { q: "Kann eine Karte zurückgegeben oder in bar ausgezahlt werden?", a: "In bar zahlen wir Karten grundsätzlich nicht aus. Sie können jedoch binnen 14 Tagen ab Ausstellung ohne Angabe von Gründen vom Kauf zurücktreten, sofern die Karte nicht einmal teilweise genutzt wurde. Eine E-Mail an contact@aejaca.com genügt, wir erstatten den vollen Betrag binnen 14 Tagen." },
    { q: "Was passiert nach Ablauf der Gültigkeit?", a: "Die Karte verfällt, nicht genutztes Guthaben verfällt mit ihr und wird nicht erstattet. Wir verlängern die Gültigkeit nicht, deshalb steht das Datum auf der Karte und Guthaben wie Frist lassen sich hier jederzeit prüfen. Bei 12 Monaten und Maßanfertigung ist das reichlich Spielraum, im Hinterkopf behalten sollte man es trotzdem." },
    { q: "Ist die Karte an eine Person gebunden?", a: "Nein, sie lautet auf den Inhaber. Wir lösen sie für jeden ein, der die Nummer nennt, und prüfen nicht, wer sie besitzt. Das erleichtert das Weitergeben, bedeutet aber auch, dass die Nummer wie Bargeld zu schützen ist. Melden Sie eine verlorene Nummer, wir sperren die Karte und stellen eine neue über das Restguthaben aus." },
    { q: "Ich gebe etwas zurück, das ich mit der Karte bezahlt habe. Was bekomme ich?", a: "Der mit der Karte gezahlte Betrag wird der Karte wieder gutgeschrieben. Ist die Karte zwischenzeitlich abgelaufen, stellen wir eine neue gleichen Werts mit neuem Ablaufdatum aus. Was Sie zusätzlich mit anderer Zahlungsart gezahlt haben, kommt auf demselben Weg zurück. Die Zahlung mit Karte nimmt Ihnen keine Verbraucherrechte." },
  ],
};

const CARD_INPUT = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder:text-neutral-600";

export default function GiftCard() {
  const { lang } = useLanguage();
  const L = L10N[lang] || L10N.pl;
  const seo = SEO_META[lang] || SEO_META.pl;
  const faq = FAQ[lang] || FAQ.pl;
  const showEur = lang === "en" || lang === "de";
  const { rates } = useMarketRates();
  const plnPerEur = rates?.pln_per_eur || 4.25;

  const whyRef = useScrollReveal();
  const howRef = useScrollReveal();
  const rulesRef = useScrollReveal();
  const orderRef = useScrollReveal();
  const balanceRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [form, setForm] = useState({ name: "", email: "", recipient: "", dedication: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");
  const [consent, setConsent] = useState(false);

  const [cardCode, setCardCode] = useState("");
  const [balance, setBalance] = useState(null);
  const [balanceBusy, setBalanceBusy] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  const chosenPln = customAmount ? Math.round(Number(customAmount) || 0) : amount;

  // Cena w walucie jezyka, tak jak wszedzie indziej w serwisie. Karte
  // wystawiamy w zlotowkach, bo w nich prowadzimy cennik, wiec przy euro
  // pokazujemy przelicznik obok, a nie zamiast.
  function money(pln, { exact = false } = {}) {
    const locale = lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "pl-PL";
    const primary = showEur ? pln / plnPerEur : pln;
    // Nominal do wyboru jest okragly, wiec grosze byly tam tylko szumem.
    // Saldo okragle nie jest i zaokraglenie do pelnych zlotych zawyzalo je:
    // 120,51 zl pokazywalo sie jako 121 zl, czyli o 49 groszy wiecej, niz
    // karta realnie pokryje. Przy pieniadzach klienta to nie jest kosmetyka.
    const digits = exact || showEur ? 2 : 0;
    return `${primary.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${showEur ? "EUR" : "zł"}`;
  }
  function moneyGrosze(grosze) {
    return money(grosze / 100, { exact: true });
  }

  async function handleOrder(e) {
    e.preventDefault();
    setSendError("");
    if (!chosenPln || !form.name.trim() || !form.email.trim()) {
      setSendError(L.required);
      return;
    }
    // Karta to przedplata na 12 miesiecy, z regulaminem, ktory mowi wprost,
    // ze po tym terminie niewykorzystane srodki przepadaja. Klient ma to
    // zobaczyc przed wplata, a nie dowiedziec sie z maila po fakcie.
    if (!consent) {
      setSendError(L.consentRequired);
      return;
    }
    setSending(true);
    // Idzie tym samym kanalem, co formularz kontaktowy: jeden adres, jedna
    // skrzynka, jeden przeplyw w n8n. Osobny endpoint dla zapytania o karte
    // nie dawalby nic poza druga rzecza, ktora moze przestac dzialac.
    const message = [
      `Zamowienie karty podarunkowej`,
      `Kwota: ${chosenPln} PLN`,
      form.recipient.trim() ? `Dla: ${form.recipient.trim()}` : null,
      form.dedication.trim() ? `Dedykacja: ${form.dedication.trim()}` : null,
    ].filter(Boolean).join("\n");

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("subject", "giftcard");
      fd.append("message", message);
      fd.append("lang", lang);
      fd.append("source", "giftcard");
      const res = await fetch(`${API_URL}/api/contact`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setSent(true);
      else setSendError(L.sendError);
    } catch {
      setSendError(L.sendError);
    } finally {
      setSending(false);
    }
  }

  async function checkBalance(e) {
    e.preventDefault();
    const code = cardCode.trim().toUpperCase();
    if (!code || !API_URL) return;
    setBalanceBusy(true);
    setBalanceError("");
    setBalance(null);
    try {
      const r = await postJSON(`${API_URL}/api/giftcards/check`, { code });
      if (r.ok && r.data?.ok) setBalance(r.data);
      else setBalanceError(r.data?.error || L.sendError);
    } catch {
      setBalanceError(L.sendError);
    } finally {
      setBalanceBusy(false);
    }
  }

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: URL, lang }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadThis, url: URL },
    ]),
    buildFAQSchema(faq),
  ];

  return (
    <>
      <SEOHead pageKey="home" path="/gift-card" schemas={schemas} title={seo.title} description={seo.description} />
      <div className="bg-neutral-950">

        <section className="pt-28 pb-6 px-4 text-center">
          <div className="text-amber-400 text-xs font-medium uppercase tracking-[0.35em] mb-4">{L.heroTag}</div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-4 leading-tight">{L.heroTitle}</h1>
          <p className="text-neutral-300 text-base max-w-xl mx-auto leading-relaxed">{L.heroDesc}</p>
        </section>

        <div className="max-w-3xl mx-auto px-4 pt-2 pb-2">
          <Breadcrumb items={[{ label: L.breadHome, href: "/" }, { label: L.breadThis }]} />
        </div>

        {/* Dlaczego karta */}
        <section className="py-6 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={whyRef} className="reveal p-6 rounded-2xl bg-amber-400/5 border border-amber-400/15">
              <h2 className="font-sans text-xl font-semibold text-amber-300 mb-3">{L.whyTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.whyText}</p>
            </div>
          </div>
        </section>

        {/* Jak to dziala */}
        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={howRef} className="reveal">
              <h2 className="text-xl font-semibold text-white mb-5">{L.howTitle}</h2>
              <ol className="grid sm:grid-cols-2 gap-3">
                {L.steps.map((s, i) => (
                  <li key={s.t} className="flex gap-4 p-5 rounded-2xl glass">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-white font-medium text-sm mb-1">{s.t}</h3>
                      <p className="text-neutral-400 text-sm leading-relaxed">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Zasady */}
        <section className="py-6 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={rulesRef} className="reveal p-6 rounded-2xl glass">
              <h2 className="text-xl font-semibold text-white mb-4">{L.rulesTitle}</h2>
              <ul className="space-y-2.5">
                {L.rules.map((r) => (
                  <li key={r} className="flex gap-3 text-neutral-400 text-sm leading-relaxed">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              {/* Skrot nie zastepuje dokumentu. Odnosnik prowadzi do sekcji 7a
                  regulaminu, ktora jest tym, co realnie wiaze obie strony. */}
              <Link
                to="/terms/#sec-7a"
                className="inline-block text-amber-400 text-sm font-medium mt-5 hover:text-amber-300"
              >
                {L.rulesFull}
              </Link>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Zamowienie karty */}
        <section className="py-8 px-4" id="order">
          <div className="max-w-3xl mx-auto">
            <div ref={orderRef} className="reveal">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-semibold text-white">{L.orderTitle}</h2>
              </div>
              <p className="text-neutral-400 text-sm mb-5">{L.orderIntro}</p>

              {sent ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-400/25">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-emerald-300" />
                    <h3 className="text-white font-semibold">{L.sentTitle}</h3>
                  </div>
                  <p className="text-neutral-300 text-sm">{L.sentText}</p>
                </div>
              ) : (
                <form onSubmit={handleOrder} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.amountLabel}</div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {AMOUNTS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => { setAmount(a); setCustomAmount(""); }}
                          className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                            !customAmount && amount === a
                              ? "bg-amber-500/20 border-amber-400 text-amber-300"
                              : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-400/50 hover:text-white"
                          }`}
                        >
                          {money(a)}
                        </button>
                      ))}
                    </div>
                    <label className="block text-neutral-400 text-xs mb-1.5" htmlFor="gc-custom">{L.amountCustom}</label>
                    <input
                      id="gc-custom"
                      type="number"
                      min="100"
                      max="10000"
                      step="10"
                      inputMode="decimal"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className={CARD_INPUT}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-neutral-400 text-xs mb-1.5" htmlFor="gc-name">{L.nameLabel}</label>
                      <input id="gc-name" type="text" required value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })} className={CARD_INPUT} />
                    </div>
                    <div>
                      <label className="block text-neutral-400 text-xs mb-1.5" htmlFor="gc-email">{L.emailLabel}</label>
                      <input id="gc-email" type="email" required value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} className={CARD_INPUT} />
                    </div>
                    <div>
                      <label className="block text-neutral-400 text-xs mb-1.5" htmlFor="gc-recipient">{L.forWhomLabel}</label>
                      <input id="gc-recipient" type="text" value={form.recipient}
                        onChange={(e) => setForm({ ...form, recipient: e.target.value })} className={CARD_INPUT} />
                    </div>
                    <div>
                      <label className="block text-neutral-400 text-xs mb-1.5" htmlFor="gc-dedication">{L.dedicationLabel}</label>
                      <input id="gc-dedication" type="text" maxLength={120} value={form.dedication}
                        placeholder={L.dedicationPlaceholder}
                        onChange={(e) => setForm({ ...form, dedication: e.target.value })} className={CARD_INPUT} />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-amber-500"
                    />
                    <span className="text-neutral-400 text-xs leading-relaxed">
                      {L.consent}{" "}
                      <Link to="/terms/#sec-7a" className="text-amber-400 hover:text-amber-300 underline">
                        {L.consentLink}
                      </Link>
                    </span>
                  </label>

                  {sendError && (
                    <div className="flex items-start gap-2 text-rose-300 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{sendError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? L.sending : L.sendBtn}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Sprawdzenie salda */}
        <section className="py-8 px-4" id="balance">
          <div className="max-w-3xl mx-auto">
            <div ref={balanceRef} className="reveal">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-semibold text-white">{L.balanceTitle}</h2>
              </div>
              <p className="text-neutral-400 text-sm mb-5">{L.balanceIntro}</p>

              <form onSubmit={checkBalance} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
                <label className="block text-neutral-400 text-xs mb-1.5" htmlFor="gc-balance">{L.balanceLabel}</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="gc-balance"
                    type="text"
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value)}
                    placeholder="AEJ-XXXX-XXXX"
                    className={`${CARD_INPUT} font-mono uppercase`}
                  />
                  <button
                    type="submit"
                    disabled={balanceBusy}
                    className="shrink-0 px-6 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm font-medium hover:border-amber-400/50 transition-all duration-200 disabled:opacity-60"
                  >
                    {balanceBusy ? L.balanceChecking : L.balanceBtn}
                  </button>
                </div>

                {balanceError && (
                  <div className="flex items-start gap-2 text-rose-300 text-sm mt-4">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{balanceError}</span>
                  </div>
                )}

                {balance && (
                  <div className="mt-5 p-5 rounded-xl bg-amber-500/10 border border-amber-400/20">
                    <div className="text-amber-300 text-xs mb-1">{L.balanceAvailable}</div>
                    <div className="text-white font-mono font-bold text-2xl">
                      {moneyGrosze(balance.availableGrosze)}
                      <span className="text-neutral-400 font-normal text-sm font-sans">
                        {" "}{L.balanceOf} {moneyGrosze(balance.initialGrosze)}
                      </span>
                    </div>
                    <div className="text-neutral-400 text-xs mt-2">
                      {L.balanceValidTo}: {new Date(balance.validTo).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "pl-PL")}
                    </div>
                    <Link to="/shop/" className="inline-block text-amber-400 text-sm font-medium mt-3 hover:text-amber-300">
                      {L.balanceUse}
                    </Link>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* FAQ */}
        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={faqRef} className="reveal">
              <h2 className="text-xl font-semibold text-white mb-5">{L.faqTitle}</h2>
              <div className="space-y-4">
                {faq.map((item) => (
                  <div key={item.q} className="p-5 rounded-2xl glass">
                    <h3 className="text-white font-medium text-sm mb-2">{item.q}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* CTA */}
        <section className="py-10 px-4 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.ctaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.ctaText}</p>
            <a
              href="/contact/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
            >
              {L.ctaBtn}
            </a>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
