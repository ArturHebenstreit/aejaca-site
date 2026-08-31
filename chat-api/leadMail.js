// ============================================================
// MAILE DO KLIENTA SPRZED ZAMOWIENIA
// ============================================================
// Szacunek z kalkulatora, dwa przypomnienia do niego, potwierdzenie formularza
// kontaktowego, powitanie w newsletterze i autoodpowiedz na maila. Szesc
// wiadomosci, ktore do 2026-08-31 mieszkaly w wezlach n8n, kazda z wlasnym
// HTML-em: ciemna koperta, niebieskie akcenty, znak wstawiony z filtrem CSS,
// ktorego zaden klient pocztowy nie wykonuje, i podpis w trzech linijkach bez
// telefonu. Klient dostawal w jednym tygodniu dwie firmy.
//
// Tresc mieszka TUTAJ (decyzja wlasciciela, 2026-08-31), a n8n zostaje przy
// tym, co robi dobrze: webhooki, Dysk, powiadomienia dla pracowni i odliczanie
// 48 godzin oraz 7 dni. Zysk jest prosty: jedna zmiana podpisu poprawia
// wszystkie maile naraz, a kazdy z tych szesciu wchodzi do podgladu
// (`npm run mail:podglad`) i do sprawdzianu razem z pozostalymi.

import { SELLER } from "./pricing/sellerInfo.js";
import { esc, koperta, odnosnikiText, stopkaText, SITE } from "./mailSzata.js";

const FROM = `AEJaCA <${SELLER.email}>`;

/** Adres strony w jezyku maila. Polski stoi bez prefiksu, reszta pod swoim. */
function adres(lang, sciezka) {
  return lang === "pl" ? `${SITE}${sciezka}` : `${SITE}/${lang}${sciezka}`;
}

const doPokazania = (url) => url.replace(/^https?:\/\//, "");
const zAdresem = (tresc, url) => [tresc, { href: url, pokaz: doPokazania(url) }];

const T = {
  pl: {
    hi: "Dzień dobry,",
    ctaRozmowa: "Napisz do nas",
    ctaSklep: "Zobacz sklep",
    zdanieSklep: "Sklep i kalkulatory stoją pod adresem ",
    zdanieProces: "Jak wygląda realizacja zamówienia, przeczytasz pod adresem ",
    zdanieRegulamin: "Regulamin serwisu znajdziesz pod adresem ",

    // 1. Szacunek z kalkulatora
    kalkSubject: "Twoja wycena z kalkulatora AEJaCA",
    kalkIntro: "poniżej wycena policzona przez nasz kalkulator. Jest szacunkiem, a nie ofertą: cenę wiążącą podajemy po obejrzeniu projektu, bo o kwocie decydują szczegóły, których kalkulator nie zna.",
    kalkNarzedzie: "Narzędzie",
    kalkParametry: "Co policzyliśmy",
    kalkPlik: "Przysłany plik",
    kalkCena: "Szacowana cena",
    kalkCoDalej: "Co dalej",
    kalkCoDalejTresc: "Odpisz na tę wiadomość i napisz, co chcesz zrobić. Odezwiemy się w ciągu jednego dnia roboczego z ceną wiążącą i terminem. Jeżeli wycena była tylko rozeznaniem, nic nie musisz robić: nie odzywamy się bez powodu.",

    // 2. Przypomnienie po 48 godzinach
    fu48Subject: "Pytania do wyceny z AEJaCA?",
    fu48Intro: "dwa dni temu policzyliśmy dla Ciebie wycenę i nie chcemy zostawiać jej bez słowa. Jeżeli coś w niej nie gra, napisz: kwota bierze się z materiału, pracochłonności i wykończenia, a każdą z tych rzeczy da się jeszcze zmienić.",
    fu48CoMozna: "Najczęściej pytacie o trzy rzeczy: czy da się taniej przy innym materiale, ile potrwa realizacja i czy przyjmiemy własny projekt. Odpowiedź na każdą z nich jest twierdząca, a szczegóły zależą od Twojego zlecenia.",
    fu48Cisza: "Jeżeli sprawa jest nieaktualna, po prostu nie odpisuj. To był ostatni raz, kiedy przypominamy o tej wycenie, nie licząc jednej wiadomości o rabacie.",

    // 3. Rabat po siedmiu dniach
    rabatSubject: (kod) => `Rabat ${kod} na Twoje zlecenie w AEJaCA`,
    rabatIntro: "wracamy do Ciebie ostatni raz w sprawie wyceny sprzed tygodnia. Dokładamy do niej rabat, bo wolimy zrobić coś dla Ciebie taniej, niż nie zrobić wcale.",
    rabatKod: "Twój kod",
    rabatIle: (proc) => `${proc} na całe zlecenie`,
    rabatWaznyDo: (data) => `Kod działa do ${data}.`,
    rabatJak: "Kod wpisujesz przy zamówieniu albo podajesz nam w wiadomości, jeżeli wolisz ustalić szczegóły rozmową.",
    rabatKoniec: "To ostatnia wiadomość w tej sprawie. Nie dopisujemy nikogo do newslettera bez zapisu.",
    kodPrzypomnimy: "Na pięć dni przed końcem ważności przypomnimy o kodzie jedną wiadomością, żeby nie przepadł niezauważony.",

    // 4. Potwierdzenie formularza kontaktowego
    kontaktSubject: "Mamy Twoją wiadomość, AEJaCA",
    kontaktIntro: "dziękujemy za wiadomość. Odpowiadamy zwykle w ciągu jednego dnia roboczego, a przy pytaniach wymagających policzenia, do dwóch.",
    kontaktCytat: "Twoja wiadomość",
    kontaktCoDalej: "Odpowiedź przyjdzie z tego samego adresu, więc warto go zachować. Jeżeli sprawa jest pilna, zadzwoń albo napisz na WhatsApp, numer stoi w stopce.",

    // 5. Powitanie w newsletterze
    newsSubject: (proc) => `Twój kod ${proc} od AEJaCA`,
    newsIntro: "dziękujemy za zapisanie się. Poniżej kod na pierwsze zamówienie, jednorazowy i wystawiony na Twój adres.",
    newsKod: "Twój kod",
    newsJak: "Kod wpisujesz w koszyku albo na stronie oferty. Obejmuje pozycje zamówienia, nie obejmuje kosztu wysyłki.",
    newsCzegoSieSpodziewac: "Czego się spodziewać",
    newsCzegoTresc: "Piszemy rzadko i tylko wtedy, gdy mamy o czym: nowa technika, nowy materiał, rzecz, którą właśnie skończyliśmy. Wypisujesz się jednym kliknięciem w każdej wiadomości.",

    // 7. Przypomnienie o kodzie, ktory zaraz wygasnie
    przypSubject: (kod) => `Kod ${kod} traci ważność`,
    przypIntro: (dni) => `kod od nas jest jeszcze ważny, ale zostało mu ${dni}. Przypominamy raz, bo szkoda, żeby przepadł niezauważony.`,
    przypJak: "Kod wpisujesz w koszyku albo na stronie oferty. Obejmuje pozycje zamówienia, nie obejmuje kosztu wysyłki.",
    przypKoniec: "To jedyne przypomnienie o tym kodzie. Jeżeli nie masz teraz na co go wykorzystać, po prostu przepadnie i nic się nie stanie.",

    // 6. Autoodpowiedz na maila
    autoSubject: "Mamy Twoją wiadomość, AEJaCA",
    autoIntro: "potwierdzamy, że wiadomość do nas dotarła. Czyta ją człowiek, nie automat, i odpisze w ciągu jednego dnia roboczego, a przy pytaniach wymagających policzenia, do dwóch.",
    autoCoDalej: "Nie musisz nic robić, ta wiadomość jest tylko potwierdzeniem. Jeżeli sprawa jest pilna, zadzwoń albo napisz na WhatsApp, numer stoi w stopce.",
  },

  en: {
    hi: "Hello,",
    ctaRozmowa: "Write to us",
    ctaSklep: "See the shop",
    zdanieSklep: "The shop and the calculators are at ",
    zdanieProces: "How an order is made is described at ",
    zdanieRegulamin: "The terms of service are at ",

    kalkSubject: "Your estimate from the AEJaCA calculator",
    kalkIntro: "here is the estimate our calculator produced. It is an estimate and not an offer: we give a binding price once we have seen the project, because the amount depends on details the calculator cannot know.",
    kalkNarzedzie: "Tool",
    kalkParametry: "What we priced",
    kalkPlik: "The file you sent",
    kalkCena: "Estimated price",
    kalkCoDalej: "What happens next",
    kalkCoDalejTresc: "Reply to this message and tell us what you would like to do. We will come back within one business day with a binding price and a lead time. If the estimate was only research, you need not do anything: we do not write without a reason.",

    fu48Subject: "Any questions about your AEJaCA estimate?",
    fu48Intro: "two days ago we priced a project for you and we do not want to leave it without a word. If something does not add up, write to us: the amount comes from the material, the work involved and the finish, and each of those can still be changed.",
    fu48CoMozna: "People usually ask three things: whether a different material would be cheaper, how long the work takes, and whether we accept your own design. The answer to each is yes, and the details depend on your project.",
    fu48Cisza: "If the matter is no longer current, simply do not reply. This is the last reminder about this estimate, apart from one message about a discount.",

    rabatSubject: (kod) => `Discount ${kod} for your AEJaCA project`,
    rabatIntro: "this is our last word about the estimate from a week ago. We are adding a discount to it, because we would rather make something for you for less than not make it at all.",
    rabatKod: "Your code",
    rabatIle: (proc) => `${proc} off the whole order`,
    rabatWaznyDo: (data) => `The code works until ${data}.`,
    rabatJak: "Enter the code when ordering, or give it to us in a message if you prefer to settle the details in conversation.",
    rabatKoniec: "This is the last message on the subject. We never add anyone to the newsletter without them signing up.",
    kodPrzypomnimy: "Five days before it expires we will send one reminder, so the code does not lapse unnoticed.",

    kontaktSubject: "We have your message, AEJaCA",
    kontaktIntro: "thank you for writing. We usually answer within one business day, and within two when the question needs calculating.",
    kontaktCytat: "Your message",
    kontaktCoDalej: "The answer will come from this same address, so it is worth keeping. If the matter is urgent, call or write on WhatsApp, the number is in the footer.",

    newsSubject: (proc) => `Your ${proc} code from AEJaCA`,
    newsIntro: "thank you for signing up. Below is your code for a first order, single use and issued to your address.",
    newsKod: "Your code",
    newsJak: "Enter the code in the cart or on the offer page. It covers the items, it does not cover shipping.",
    newsCzegoSieSpodziewac: "What to expect",
    newsCzegoTresc: "We write rarely and only when there is something to say: a new technique, a new material, a piece we have just finished. One click in any message unsubscribes you.",

    przypSubject: (kod) => `Code ${kod} is about to expire`,
    przypIntro: (dni) => `the code we sent you is still valid, but only for ${dni}. This is a single reminder, so it does not lapse unnoticed.`,
    przypJak: "Enter the code in the cart or on the offer page. It covers the items, it does not cover shipping.",
    przypKoniec: "This is the only reminder about this code. If there is nothing you want to use it on right now, it will simply lapse and nothing happens.",

    autoSubject: "We have your message, AEJaCA",
    autoIntro: "this confirms your message reached us. A person reads it, not a machine, and will answer within one business day, or within two when the question needs calculating.",
    autoCoDalej: "You need not do anything, this is only a confirmation. If the matter is urgent, call or write on WhatsApp, the number is in the footer.",
  },

  de: {
    hi: "Guten Tag,",
    ctaRozmowa: "Schreiben Sie uns",
    ctaSklep: "Zum Shop",
    zdanieSklep: "Shop und Rechner finden Sie unter ",
    zdanieProces: "Wie ein Auftrag entsteht, lesen Sie unter ",
    zdanieRegulamin: "Die Nutzungsbedingungen finden Sie unter ",

    kalkSubject: "Ihre Kalkulation vom AEJaCA-Rechner",
    kalkIntro: "nachfolgend die Kalkulation aus unserem Rechner. Sie ist eine Schätzung und kein Angebot: einen verbindlichen Preis nennen wir, sobald wir das Projekt gesehen haben, denn über den Betrag entscheiden Details, die der Rechner nicht kennt.",
    kalkNarzedzie: "Werkzeug",
    kalkParametry: "Was wir berechnet haben",
    kalkPlik: "Ihre Datei",
    kalkCena: "Geschätzter Preis",
    kalkCoDalej: "Wie es weitergeht",
    kalkCoDalejTresc: "Antworten Sie auf diese Nachricht und schreiben Sie, was Sie vorhaben. Wir melden uns innerhalb eines Werktages mit einem verbindlichen Preis und einer Lieferzeit. War die Kalkulation nur eine Orientierung, müssen Sie nichts tun: wir schreiben nicht ohne Grund.",

    fu48Subject: "Fragen zu Ihrer AEJaCA-Kalkulation?",
    fu48Intro: "vor zwei Tagen haben wir für Sie ein Projekt kalkuliert und möchten es nicht unkommentiert lassen. Wenn etwas nicht passt, schreiben Sie uns: der Betrag ergibt sich aus Material, Arbeitsaufwand und Finish, und jedes davon lässt sich noch ändern.",
    fu48CoMozna: "Meist werden drei Dinge gefragt: ob ein anderes Material günstiger wäre, wie lange die Arbeit dauert und ob wir einen eigenen Entwurf annehmen. Die Antwort ist jeweils ja, die Details hängen von Ihrem Auftrag ab.",
    fu48Cisza: "Ist die Sache nicht mehr aktuell, antworten Sie einfach nicht. Das war die letzte Erinnerung an diese Kalkulation, abgesehen von einer Nachricht zu einem Rabatt.",

    rabatSubject: (kod) => `Rabatt ${kod} für Ihr AEJaCA-Projekt`,
    rabatIntro: "wir melden uns ein letztes Mal zur Kalkulation von vor einer Woche. Wir legen einen Rabatt dazu, denn wir fertigen lieber günstiger für Sie als gar nicht.",
    rabatKod: "Ihr Code",
    rabatIle: (proc) => `${proc} auf den gesamten Auftrag`,
    rabatWaznyDo: (data) => `Der Code gilt bis zum ${data}.`,
    rabatJak: "Den Code geben Sie bei der Bestellung ein oder nennen ihn uns in einer Nachricht, wenn Sie die Details lieber im Gespräch klären.",
    rabatKoniec: "Das ist die letzte Nachricht dazu. Wir tragen niemanden ohne Anmeldung in den Newsletter ein.",
    kodPrzypomnimy: "Fünf Tage vor Ablauf senden wir eine einzige Erinnerung, damit der Code nicht unbemerkt verfällt.",

    kontaktSubject: "Ihre Nachricht ist da, AEJaCA",
    kontaktIntro: "vielen Dank für Ihre Nachricht. Wir antworten in der Regel innerhalb eines Werktages, bei Fragen mit Rechenaufwand innerhalb von zwei.",
    kontaktCytat: "Ihre Nachricht",
    kontaktCoDalej: "Die Antwort kommt von derselben Adresse, es lohnt sich also, sie zu behalten. Ist die Sache dringend, rufen Sie an oder schreiben Sie auf WhatsApp, die Nummer steht in der Fußzeile.",

    newsSubject: (proc) => `Ihr ${proc}-Code von AEJaCA`,
    newsIntro: "vielen Dank für Ihre Anmeldung. Nachfolgend Ihr Code für die erste Bestellung, einmalig und auf Ihre Adresse ausgestellt.",
    newsKod: "Ihr Code",
    newsJak: "Den Code geben Sie im Warenkorb oder auf der Angebotsseite ein. Er gilt für die Positionen, nicht für den Versand.",
    newsCzegoSieSpodziewac: "Was Sie erwartet",
    newsCzegoTresc: "Wir schreiben selten und nur, wenn es etwas zu sagen gibt: eine neue Technik, ein neues Material, ein gerade fertiggestelltes Stück. Ein Klick in jeder Nachricht meldet Sie wieder ab.",

    przypSubject: (kod) => `Code ${kod} läuft bald ab`,
    przypIntro: (dni) => `der Code, den Sie von uns erhalten haben, gilt noch, aber nur ${dni}. Wir erinnern einmal daran, damit er nicht unbemerkt verfällt.`,
    przypJak: "Den Code geben Sie im Warenkorb oder auf der Angebotsseite ein. Er gilt für die Positionen, nicht für den Versand.",
    przypKoniec: "Das ist die einzige Erinnerung an diesen Code. Wenn Sie ihn gerade nicht brauchen, verfällt er einfach und es passiert nichts.",

    autoSubject: "Ihre Nachricht ist da, AEJaCA",
    autoIntro: "wir bestätigen den Eingang Ihrer Nachricht. Sie wird von einem Menschen gelesen, nicht von einem Automaten, und innerhalb eines Werktages beantwortet, bei Fragen mit Rechenaufwand innerhalb von zwei.",
    autoCoDalej: "Sie müssen nichts tun, dies ist nur eine Bestätigung. Ist die Sache dringend, rufen Sie an oder schreiben Sie auf WhatsApp, die Nummer steht in der Fußzeile.",
  },
};

const jezyk = (lang) => (T[lang] ? lang : "pl");

/** Odnosniki pod trescia, te same trzy w kazdej z tych wiadomosci. */
function odnosniki(l, lang) {
  return [
    // Sklep, a nie osobna strona narzedzi: kazdy kalkulator ma swoje wejscie
    // wlasnie stamtad, a jednego adresu "wszystkie narzedzia" serwis nie ma.
    zAdresem(l.zdanieSklep, adres(lang, "/shop/")),
    zAdresem(l.zdanieProces, adres(lang, "/order-process/")),
    zAdresem(l.zdanieRegulamin, adres(lang, "/terms/")),
  ];
}

/** Wiersz w ramce z danymi, ten sam ksztalt co w mailach zamowieniowych. */
const wiersz = (k, v) => `<tr>
  <td style="padding:6px 0;color:#777;white-space:nowrap;vertical-align:top">${esc(k)}</td>
  <td style="padding:6px 0;text-align:right;word-break:break-word">${esc(String(v))}</td>
</tr>`;

/** Duzy przycisk. Jeden na wiadomosc: dwa rownorzedne to zaden. */
const przycisk = (href, napis) => `<p style="margin:24px 0 0">
  <a href="${esc(href)}" style="display:inline-block;background:#b58a3c;color:#fff;text-decoration:none;border-radius:6px;padding:12px 22px;font-size:14px;font-weight:700">${esc(napis)}</a>
</p>`;

/** Wyrozniony kod rabatowy albo kwota. */
const ramkaKodu = (etykieta, wartosc, dopisek) => `
  <div style="margin-top:20px;background:#faf6ee;border-radius:8px;padding:16px 18px;text-align:center">
    <span style="font-size:12px;color:#8a7a5c">${esc(etykieta)}</span>
    <div style="font-size:26px;font-weight:800;color:#7a5f22;margin-top:4px;font-family:ui-monospace,monospace;letter-spacing:1px">${esc(wartosc)}</div>
    ${dopisek ? `<div style="font-size:12px;color:#8a7a5c;margin-top:6px">${esc(dopisek)}</div>` : ""}
  </div>`;

/**
 * Wspolny szkielet: naglowek, tresc, odnosniki, podpis.
 *
 * @param {object} dane
 * @param {string} dane.lang     pl | en | de
 * @param {string} dane.to       adres klienta
 * @param {string} dane.subject  temat
 * @param {string} dane.naglowek tytul nad trescia, albo pusty
 * @param {string} dane.html     srodek wiadomosci
 * @param {string[]} dane.linie  ta sama tresc dla wersji tekstowej
 */
function zloz({ lang, to, subject, naglowek, html, linie, inReplyTo, threadId }) {
  const l = T[lang];
  const odn = odnosniki(l, lang);
  const srodek = `
    ${naglowek ? `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;font-weight:700">${esc(naglowek)}</h1>` : ""}
    <p style="margin:0 0 6px">${esc(l.hi)}</p>
    ${html}
  `;
  const text = [l.hi, "", ...linie, "", odnosnikiText(lang, odn), "", stopkaText(lang)].join("\n");
  return {
    to, from: FROM, replyTo: SELLER.email, subject,
    text, html: koperta({ lang, odnosniki: odn, srodek }),
    ...(inReplyTo ? { inReplyTo } : {}),
    ...(threadId ? { threadId } : {}),
  };
}

/**
 * 1. Szacunek z kalkulatora.
 *
 * Kalkulator podaje WIDELKI, a nie kwote: dwie liczby, bo do wiazacej ceny
 * brakuje rzeczy, ktorych narzedzie nie zna. Mail nazywa to szacunkiem
 * i mowi to wprost, zamiast pozwalac klientowi czytac widelek jak oferty.
 */
export function buildKalkulatorEstimate({ lang = "pl", to, kalkulator, parametry, plik, cenaPln, cenaEur }) {
  const l = T[jezyk(lang)];
  const kwoty = [
    cenaPln ? `${cenaPln} PLN` : null,
    cenaEur ? `${cenaEur} EUR` : null,
  ].filter(Boolean);
  const dane = [
    kalkulator ? [l.kalkNarzedzie, kalkulator] : null,
    parametry ? [l.kalkParametry, parametry] : null,
    plik ? [l.kalkPlik, plik] : null,
  ].filter(Boolean);

  return zloz({
    lang: jezyk(lang), to, subject: l.kalkSubject, naglowek: l.kalkSubject,
    html: `
      <p style="margin:0 0 20px;line-height:1.6">${esc(l.kalkIntro)}</p>
      ${dane.length ? `<table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #eee;border-radius:10px;padding:6px">${dane.map(([k, v]) => wiersz(k, v)).join("")}</table>` : ""}
      ${kwoty.length ? `
        <div style="margin-top:20px;background:#faf6ee;border-radius:8px;padding:16px 18px">
          <span style="font-size:12px;color:#8a7a5c">${esc(l.kalkCena)}</span>
          ${kwoty.map((k) => `<div style="font-size:22px;font-weight:800;color:#7a5f22;margin-top:2px">${esc(k)}</div>`).join("")}
        </div>` : ""}
      <h3 style="font-size:14px;margin:22px 0 6px">${esc(l.kalkCoDalej)}</h3>
      <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${esc(l.kalkCoDalejTresc)}</p>
      ${przycisk(`mailto:${SELLER.email}`, l.ctaRozmowa)}
    `,
    linie: [
      l.kalkIntro, "",
      ...dane.map(([k, v]) => `${k}: ${v}`),
      ...(kwoty.length ? ["", `${l.kalkCena}: ${kwoty.join(" / ")}`] : []),
      "", `${l.kalkCoDalej}: ${l.kalkCoDalejTresc}`,
    ],
  });
}

/** 2. Przypomnienie po dwoch dniach. Jedno, i mowi, ze jest jedno. */
export function buildFollowUp48({ lang = "pl", to }) {
  const l = T[jezyk(lang)];
  return zloz({
    lang: jezyk(lang), to, subject: l.fu48Subject, naglowek: l.fu48Subject,
    html: `
      <p style="margin:0 0 16px;line-height:1.6">${esc(l.fu48Intro)}</p>
      <p style="margin:0 0 16px;line-height:1.6;font-size:14px;color:#444">${esc(l.fu48CoMozna)}</p>
      <p style="margin:0;line-height:1.6;font-size:13px;color:#666">${esc(l.fu48Cisza)}</p>
      ${przycisk(`mailto:${SELLER.email}`, l.ctaRozmowa)}
    `,
    linie: [l.fu48Intro, "", l.fu48CoMozna, "", l.fu48Cisza],
  });
}

/**
 * 3. Rabat po tygodniu, ostatnia wiadomosc w sprawie.
 *
 * Kod przychodzi z zewnatrz, bo wystawia go sklep: jednorazowy i wystawiony na
 * adres klienta. Kod staly, wpisany w tresc maila, jest kodem publicznym
 * w chwili, w ktorej ktokolwiek go przeklei.
 */
export function buildRabat7({ lang = "pl", to, kod, procent = "5%", waznyDo }) {
  const l = T[jezyk(lang)];
  return zloz({
    lang: jezyk(lang), to, subject: l.rabatSubject(kod), naglowek: l.rabatSubject(kod),
    html: `
      <p style="margin:0 0 16px;line-height:1.6">${esc(l.rabatIntro)}</p>
      ${ramkaKodu(l.rabatKod, kod, l.rabatIle(procent))}
      ${waznyDo ? `<p style="margin:14px 0 0;font-size:14px;font-weight:700">${esc(l.rabatWaznyDo(waznyDo))}</p>` : ""}
      <p style="margin:10px 0 0;line-height:1.6;font-size:14px;color:#444">${esc(l.rabatJak)}</p>
      ${waznyDo ? `<p style="margin:10px 0 0;line-height:1.6;font-size:13px;color:#666">${esc(l.kodPrzypomnimy)}</p>` : ""}
      <p style="margin:14px 0 0;line-height:1.6;font-size:13px;color:#666">${esc(l.rabatKoniec)}</p>
      ${przycisk(adres(jezyk(lang), "/shop/"), l.ctaSklep)}
    `,
    linie: [
      l.rabatIntro, "",
      `${l.rabatKod}: ${kod} (${l.rabatIle(procent)})`,
      ...(waznyDo ? [l.rabatWaznyDo(waznyDo)] : []),
      "", l.rabatJak,
      ...(waznyDo ? ["", l.kodPrzypomnimy] : []),
      "", l.rabatKoniec,
    ],
  });
}

/** 4. Potwierdzenie formularza kontaktowego, z cytatem tego, co przyszlo. */
export function buildKontaktPotwierdzenie({ lang = "pl", to, wiadomosc }) {
  const l = T[jezyk(lang)];
  return zloz({
    lang: jezyk(lang), to, subject: l.kontaktSubject, naglowek: l.kontaktSubject,
    html: `
      <p style="margin:0 0 20px;line-height:1.6">${esc(l.kontaktIntro)}</p>
      ${wiadomosc ? `
        <p style="margin:0 0 6px;font-size:12px;color:#777">${esc(l.kontaktCytat)}</p>
        <div style="border-left:3px solid #e2d5b8;padding:10px 14px;background:#faf9f6;border-radius:0 8px 8px 0;font-size:14px;color:#444;line-height:1.6;white-space:pre-wrap">${esc(wiadomosc)}</div>` : ""}
      <p style="margin:20px 0 0;line-height:1.6;font-size:14px;color:#444">${esc(l.kontaktCoDalej)}</p>
    `,
    linie: [
      l.kontaktIntro,
      ...(wiadomosc ? ["", `${l.kontaktCytat}:`, wiadomosc] : []),
      "", l.kontaktCoDalej,
    ],
  });
}

/** 5. Powitanie w newsletterze razem z kodem na pierwsze zamowienie. */
export function buildNewsletterPowitanie({ lang = "pl", to, kod, procent = "10%", waznyDo }) {
  const l = T[jezyk(lang)];
  // Data waznosci i zapowiedz przypomnienia stoja przy KAZDYM kodzie (decyzja
  // wlasciciela, 2026-08-31). Kod bez daty konca jest obietnica bez terminu,
  // a przypomnienie, ktorego nikt nie zapowiedzial, wyglada jak nagabywanie.
  return zloz({
    lang: jezyk(lang), to, subject: l.newsSubject(procent), naglowek: l.newsSubject(procent),
    html: `
      <p style="margin:0 0 16px;line-height:1.6">${esc(l.newsIntro)}</p>
      ${ramkaKodu(l.newsKod, kod, l.rabatIle(procent))}
      ${waznyDo ? `<p style="margin:14px 0 0;font-size:14px;font-weight:700">${esc(l.rabatWaznyDo(waznyDo))}</p>` : ""}
      <p style="margin:10px 0 0;line-height:1.6;font-size:14px;color:#444">${esc(l.newsJak)}</p>
      <p style="margin:10px 0 0;line-height:1.6;font-size:13px;color:#666">${esc(l.kodPrzypomnimy)}</p>
      <h3 style="font-size:14px;margin:22px 0 6px">${esc(l.newsCzegoSieSpodziewac)}</h3>
      <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${esc(l.newsCzegoTresc)}</p>
      ${przycisk(adres(jezyk(lang), "/shop/"), l.ctaSklep)}
    `,
    linie: [
      l.newsIntro, "",
      `${l.newsKod}: ${kod} (${l.rabatIle(procent)})`,
      ...(waznyDo ? [l.rabatWaznyDo(waznyDo)] : []),
      "", l.newsJak,
      "", l.kodPrzypomnimy,
      "", `${l.newsCzegoSieSpodziewac}: ${l.newsCzegoTresc}`,
    ],
  });
}

/**
 * 6. Autoodpowiedz na maila, jako odpowiedz W WATKU.
 *
 * `threadId` wpina ja w rozmowe po naszej stronie, `inReplyTo` po stronie
 * klienta. Bez obu rozmowa rozpada sie na dwa kawalki i klient odpisuje
 * automatowi zamiast nam.
 */
export function buildAutoOdpowiedz({ lang = "pl", to, temat, inReplyTo, threadId }) {
  const l = T[jezyk(lang)];
  const subject = temat ? (/^re:/i.test(temat) ? temat : `Re: ${temat}`) : l.autoSubject;
  return zloz({
    lang: jezyk(lang), to, subject, naglowek: "",
    html: `
      <p style="margin:0 0 16px;line-height:1.6">${esc(l.autoIntro)}</p>
      <p style="margin:0;line-height:1.6;font-size:14px;color:#444">${esc(l.autoCoDalej)}</p>
    `,
    linie: [l.autoIntro, "", l.autoCoDalej],
    inReplyTo, threadId,
  });
}

/**
 * 7. Przypomnienie o kodzie, ktory zaraz wygasnie.
 *
 * Idzie RAZ na kod, piec dni przed koncem waznosci, i tylko wtedy, gdy kod
 * jest nietkniety. Zapowiadamy je w kazdej wiadomosci, ktora niesie kod, wiec
 * nie jest zaskoczeniem, tylko dotrzymaniem slowa.
 */
export function buildPrzypomnienieKodu({ lang = "pl", to, kod, procent, waznyDo, dni }) {
  const l = T[jezyk(lang)];
  return zloz({
    lang: jezyk(lang), to, subject: l.przypSubject(kod), naglowek: l.przypSubject(kod),
    html: `
      <p style="margin:0 0 16px;line-height:1.6">${esc(l.przypIntro(dni))}</p>
      ${ramkaKodu(l.rabatKod, kod, procent ? l.rabatIle(procent) : "")}
      ${waznyDo ? `<p style="margin:14px 0 0;font-size:14px;font-weight:700">${esc(l.rabatWaznyDo(waznyDo))}</p>` : ""}
      <p style="margin:10px 0 0;line-height:1.6;font-size:14px;color:#444">${esc(l.przypJak)}</p>
      <p style="margin:14px 0 0;line-height:1.6;font-size:13px;color:#666">${esc(l.przypKoniec)}</p>
      ${przycisk(adres(jezyk(lang), "/shop/"), l.ctaSklep)}
    `,
    linie: [
      l.przypIntro(dni), "",
      `${l.rabatKod}: ${kod}${procent ? ` (${l.rabatIle(procent)})` : ""}`,
      ...(waznyDo ? [l.rabatWaznyDo(waznyDo)] : []),
      "", l.przypJak, "", l.przypKoniec,
    ],
  });
}

/** Wszystkie maile pod jedna nazwa, zeby trasa API nie miala wlasnego switcha. */
export const LEAD_MAILE = {
  kalkulator: buildKalkulatorEstimate,
  followup48: buildFollowUp48,
  rabat7: buildRabat7,
  kontakt: buildKontaktPotwierdzenie,
  newsletter: buildNewsletterPowitanie,
  autoodpowiedz: buildAutoOdpowiedz,
  przypomnienieKodu: buildPrzypomnienieKodu,
};
