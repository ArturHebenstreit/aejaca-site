// ============================================================
// PROCES REALIZACJI
// ============================================================
// Wydzielone ze strony platnosci (decyzja wlasciciela, 2026-08-30). Tamta
// odpowiadala na pytanie "jak zaplacic" i doklejala na koncu wszystko, co
// dzieje sie pozniej, wiec klient szukajacy terminu przewijal caly opis
// przelewow, kursu euro i kodow rabatowych.
//
// Tu stoi tylko to, co dzieje sie PO zaplacie: etapy, termin, powiadomienia,
// odbior i wejscie na wlasne zamowienie. Obie strony linkuja do siebie
// wzajemnie, a spis tresci na gorze skraca droge do kazdej sekcji do jednego
// klikniecia.

import { Link } from "../i18n/nav.jsx";
import { Hammer, CalendarClock, Mail, PackageCheck, Search, HelpCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import PolicyLinks from "../components/PolicyLinks.jsx";
import FaqLista from "../components/FaqLista.jsx";
import SpisTresci from "../components/SpisTresci.jsx";
import TERMIN from "../data/faq/termin.js";
import SKLEP from "../data/faq/sklep.js";

const L = {
  pl: {
    tag: "Realizacja",
    title: "Proces realizacji",
    description: "Co dzieje się z zamówieniem po zapłacie: etapy pracy, jak liczymy termin, kiedy piszemy, jak sprawdzić swoje zlecenie i jak odebrać gotową rzecz.",
    lead: "Płatność to początek. Ta strona opisuje resztę drogi: co robimy, w jakiej kolejności, kiedy zaczyna biec termin i gdzie to wszystko widzisz.",
    spis: [
      { id: "etapy", label: "Etapy" },
      { id: "termin", label: "Termin" },
      { id: "wiadomosci", label: "Wiadomości" },
      { id: "odbior", label: "Odbiór" },
      { id: "sprawdz", label: "Sprawdź zlecenie" },
      { id: "faq", label: "FAQ" },
    ],
    stagesTitle: "Etapy pracy",
    stages: [
      ["Zapłacone", "Status zmienia wyłącznie podpisany komunikat od operatora płatności. Powrót do przeglądarki niczego nie zmienia, nasze kliknięcie też nie. Przy przelewie w euro liczy się chwila zaksięgowania."],
      ["Ustalanie szczegółów", "Tylko przy zleceniach, które tego wymagają: rozmiar, wzór, litera na sygnecie, materiał. Czas realizacji w tym czasie NIE biegnie, więc czekanie na Twoją odpowiedź nie zjada Twojego terminu. Na stronie zlecenia widzisz, której pozycji dotyczy pytanie."],
      ["Czeka w kolejce", "Wszystko ustalone, zlecenie stoi w kolejce pracowni, a termin już biegnie. Nikt jeszcze nie wziął go do ręki i mówimy o tym wprost, zamiast udawać, że praca trwa."],
      ["W realizacji", "Ktoś wziął zlecenie do ręki i pracuje nad nim."],
      ["Gotowe", "Praca skończona. Przy wysyłce pakujemy zamówienie, przy odbiorze osobistym przygotowujemy je i umawiamy godzinę, a przy plikach udostępniamy je do pobrania. Na stronie zlecenia i w wiadomości piszemy o Twojej drodze, a nie o wszystkich naraz."],
      ["Wysłane lub przekazane", "Przy wysyłce numer przesyłki pojawia się na stronie zlecenia i w wiadomości, razem z nazwą przewoźnika i odnośnikiem do śledzenia. Przy odbiorze osobistym umawiamy godzinę."],
      ["Dostarczone", "Ostatni przystanek zapala się dopiero wtedy, gdy potwierdzimy doręczenie albo odbiór. Do tej chwili droga na stronie zlecenia nie jest zamknięta, bo paczka włożona do paczkomatu to jeszcze nie paczka odebrana."],
    ],
    stagesNote: "Zamówienia robimy w kolejności wpłat. Kto pierwszy zapłacił, ten pierwszy dostaje.",
    deadlineTitle: "Termin realizacji",
    deadlineRows: [
      ["Co oznacza ta data", "To planowana finalizacja, czyli dzień, w którym kończymy pracę i przekazujemy paczkę kurierowi albo mamy ją gotową do odbioru. Nie jest to dzień doręczenia: czas przewozu liczy się od niej."],
      ["W dniach kalendarzowych", "Nie w roboczych. Termin, który widzisz, to data, a nie liczba do przeliczania."],
      ["Start", "Od zapłaty, a przy zleceniu wymagającym ustaleń dopiero od chwili, gdy wszystko jest ustalone."],
      ["Kilka rzeczy w jednym zamówieniu", "Obowiązuje najdłuższy z terminów, bo paczka wychodzi jedna."],
      ["Zmiana po zapłacie", "Zapisujemy nowy termin razem z datą, w której ustaliliśmy go z Tobą. Widać to na stronie zlecenia."],
      ["Gdzie go zobaczysz", "Na stronie zlecenia, razem z liczbą dni, które zostały. Termin pojawia się w ofercie jeszcze przed zapłatą, przy wybranych pozycjach."],
    ],
    mailsTitle: "Kiedy do Ciebie piszemy",
    mailsBody: "Przy istotnych etapach: gdy zlecenie trafia do kolejki i rusza termin, gdy ktoś bierze je do ręki, gdy jest gotowe i gdy wychodzi. Wiadomość nie idzie z automatu przy każdym ruchu w warsztacie, bo Twoja skrzynka nie jest dziennikiem naszej pracy. Aktualny stan masz zawsze na stronie zlecenia, o każdej porze.",
    pickupTitle: "Odbiór",
    pickupRows: [
      ["Paczkomat InPost", "Tylko na terenie Polski. Numer paczkomatu wybierasz przy zamówieniu i widzisz go potem na stronie zlecenia."],
      ["Kurier", "Polska i zagranica, według cennika wysyłki. Po nadaniu dostajesz numer przesyłki."],
      ["Odbiór osobisty", "Józefosław pod Warszawą, po umówieniu godziny. Wtedy nie ma listu przewozowego, bo paczka nigdzie nie jedzie."],
    ],
    checkTitle: "Sprawdź swoje zlecenie",
    checkBody: "Prywatny odnośnik do strony zlecenia dostajesz mailem zaraz po zapłacie. Widać na nim oś czasu, termin, ustalenia i numer przesyłki.",
    checkLost: "Zgubiłeś link? Wejdź na stronę zamówienia i podaj numer zaczynający się od AE razem z adresem e-mail, na który poszło potwierdzenie. Sam numer nie wystarcza, bo strona pokazuje Twój adres i zawartość zamówienia.",
    checkCta: "Otwórz stronę zamówienia",
    checkOffer: "Ofertę przed zapłatą sprawdzisz tak samo, numerem zaczynającym się od WY.",
    checkOfferCta: "Strona oferty",
    faqTitle: "Pytania o realizację",
    faqMore: "Wszystkie pytania i odpowiedzi",
    payTitle: "Szukasz informacji o płatności?",
    payBody: "Metody, waluty, ważność kwoty, kody rabatowe i co zrobić, gdy płatność się nie powiedzie, opisuje osobna strona.",
    payCta: "Proces płatności",
  },
  en: {
    tag: "Order process",
    title: "How we make your order",
    description: "What happens after payment: the stages of work, how the delivery date is counted, when we write and how you collect the finished piece.",
    lead: "Payment is the beginning. This page covers the rest of the road: what we do, in what order, when the clock starts and where you can see all of it.",
    spis: [
      { id: "etapy", label: "Stages" },
      { id: "termin", label: "Delivery date" },
      { id: "wiadomosci", label: "Messages" },
      { id: "odbior", label: "Collection" },
      { id: "sprawdz", label: "Check your order" },
      { id: "faq", label: "FAQ" },
    ],
    stagesTitle: "Stages of work",
    stages: [
      ["Paid", "The status is changed only by a signed message from the payment provider. Returning to the browser changes nothing, and neither does a click of ours. For a euro transfer, what counts is the moment the money clears."],
      ["Agreeing the details", "Only for orders that need it: a size, a pattern, the letters on a signet, a material. The lead time does NOT run during that wait, so answering us does not eat into your date. The order page names the item we are waiting on."],
      ["In the queue", "Everything agreed, the order is in the workshop queue and the clock is running. Nobody has picked it up yet, and we say so rather than pretend the work is under way."],
      ["In the workshop", "Someone has picked the order up and is working on it."],
      ["Finished", "The work is done. For a shipment we pack the order, for a personal pickup we get it ready and agree a time, and for files we release the download. Your order page and our message name your own route, not every possible one."],
      ["Dispatched or handed over", "For a shipment, the tracking number appears on the order page and in the message, with the carrier named and a tracking link. For a personal pickup we agree a time."],
      ["Delivered", "The last stop lights up only once we confirm the delivery or the collection. Until then the road on your order page is not closed, because a parcel put into a locker is not yet a parcel collected."],
    ],
    stagesNote: "We work in the order payments arrived. Whoever paid first is served first.",
    deadlineTitle: "The delivery date",
    deadlineRows: [
      ["What the date means", "It is the planned completion: the day we finish the work and hand the parcel to the carrier, or have it ready for collection. It is not the delivery day, because transit starts from it."],
      ["Counted in calendar days", "Not working days. What you see is a date, not a number to convert."],
      ["When it starts", "At payment, or, for an order that needs agreeing, only once everything is agreed."],
      ["Several items in one order", "The longest of their times applies, because one parcel goes out."],
      ["A change after payment", "We record the new date together with the day we agreed it with you. It shows on your order page."],
      ["Where you see it", "On your order page, with the days remaining. The time also appears in an offer before payment, next to the selected items."],
    ],
    mailsTitle: "When we write to you",
    mailsBody: "At the stages that matter: when the order joins the queue and the clock starts, when someone picks it up, when it is finished and when it leaves. We do not email on every move inside the workshop, because your inbox is not our work log. The current state is always on your order page, at any hour.",
    pickupTitle: "Collection",
    pickupRows: [
      ["InPost locker", "Inside Poland only. You pick the locker when ordering and see it later on your order page."],
      ["Courier", "Poland and abroad, per the shipping price list. Once posted you get a tracking number."],
      ["Personal pickup", "Józefosław near Warsaw, at an agreed time. There is no waybill then, because the parcel travels nowhere."],
    ],
    checkTitle: "Check your order",
    checkBody: "A private link to your order page arrives by e-mail right after payment. It shows the timeline, the date, what was agreed and the tracking number.",
    checkLost: "Lost the link? Open the order page and give the number starting with AE together with the e-mail address the confirmation went to. The number alone is not enough, because the page shows your address and what you ordered.",
    checkCta: "Open the order page",
    checkOffer: "An offer before payment works the same way, with a number starting with WY.",
    checkOfferCta: "Offer page",
    faqTitle: "Questions about the process",
    faqMore: "All questions and answers",
    payTitle: "Looking for payment information?",
    payBody: "Methods, currencies, how long an amount holds, discount codes and what to do when a payment fails are on a separate page.",
    payCta: "How payment works",
  },
  de: {
    tag: "Ablauf",
    title: "Ablauf der Fertigung",
    description: "Was nach der Zahlung geschieht: Arbeitsetappen, wie der Termin gezählt wird, wann wir schreiben und wie Sie das fertige Stück erhalten.",
    lead: "Die Zahlung ist der Anfang. Diese Seite beschreibt den Rest des Weges: was wir tun, in welcher Reihenfolge, wann die Zeit läuft und wo Sie das alles sehen.",
    spis: [
      { id: "etapy", label: "Etappen" },
      { id: "termin", label: "Termin" },
      { id: "wiadomosci", label: "Nachrichten" },
      { id: "odbior", label: "Erhalt" },
      { id: "sprawdz", label: "Auftrag prüfen" },
      { id: "faq", label: "FAQ" },
    ],
    stagesTitle: "Arbeitsetappen",
    stages: [
      ["Bezahlt", "Den Status ändert ausschließlich eine signierte Nachricht des Zahlungsanbieters. Die Rückkehr in den Browser ändert nichts, ein Klick von uns ebenso wenig. Bei einer Euro-Überweisung zählt der Moment der Gutschrift."],
      ["Details klären", "Nur bei Aufträgen, die es brauchen: eine Größe, ein Muster, die Buchstaben auf einem Siegelring, ein Material. Die Lieferzeit läuft in dieser Zeit NICHT, Ihre Antwort geht also nicht von Ihrem Termin ab. Die Auftragsseite nennt die betroffene Position."],
      ["In der Warteschlange", "Alles geklärt, der Auftrag steht in der Werkstattschlange und die Zeit läuft. In die Hand genommen hat ihn noch niemand, und das sagen wir offen, statt Arbeit vorzutäuschen."],
      ["In Arbeit", "Jemand hat den Auftrag in die Hand genommen."],
      ["Fertig", "Die Arbeit ist getan. Beim Versand verpacken wir die Bestellung, bei Selbstabholung bereiten wir sie vor und vereinbaren eine Uhrzeit, bei Dateien geben wir den Download frei. Auftragsseite und Nachricht nennen Ihren Weg, nicht alle auf einmal."],
      ["Versandt oder übergeben", "Beim Versand erscheint die Sendungsnummer auf der Auftragsseite und in der Nachricht, zusammen mit dem Namen des Zustellers und einem Link zur Sendungsverfolgung. Bei Selbstabholung stimmen wir eine Uhrzeit ab."],
      ["Zugestellt", "Der letzte Halt leuchtet erst, wenn wir die Zustellung oder die Abholung bestätigen. Bis dahin ist der Weg auf Ihrer Auftragsseite nicht geschlossen, denn ein Paket in der Paketstation ist noch kein abgeholtes Paket."],
    ],
    stagesNote: "Wir arbeiten in der Reihenfolge der Zahlungseingänge. Wer zuerst zahlt, kommt zuerst dran.",
    deadlineTitle: "Der Liefertermin",
    deadlineRows: [
      ["Was dieses Datum bedeutet", "Es ist die geplante Fertigstellung: der Tag, an dem wir die Arbeit beenden und das Paket dem Zusteller übergeben oder es zur Abholung bereithalten. Es ist nicht der Zustelltag, denn die Laufzeit beginnt erst danach."],
      ["In Kalendertagen", "Nicht in Werktagen. Was Sie sehen, ist ein Datum und keine Zahl zum Umrechnen."],
      ["Beginn", "Ab der Zahlung, bei Aufträgen mit Absprachen erst, wenn alles geklärt ist."],
      ["Mehrere Positionen in einer Bestellung", "Es gilt die längste Zeit, denn es geht ein Paket raus."],
      ["Änderung nach der Zahlung", "Wir halten den neuen Termin samt dem Tag der Absprache fest. Das steht auf Ihrer Auftragsseite."],
      ["Wo Sie ihn sehen", "Auf Ihrer Auftragsseite, samt den verbleibenden Tagen. Die Zeit erscheint auch im Angebot vor der Zahlung, bei den gewählten Positionen."],
    ],
    mailsTitle: "Wann wir Ihnen schreiben",
    mailsBody: "Bei den wichtigen Etappen: wenn der Auftrag in die Warteschlange kommt und die Frist beginnt, wenn ihn jemand in die Hand nimmt, wenn er fertig ist und wenn er hinausgeht. Wir schreiben nicht bei jedem Schritt in der Werkstatt, denn Ihr Postfach ist kein Arbeitsjournal. Den aktuellen Stand finden Sie jederzeit auf der Auftragsseite.",
    pickupTitle: "Erhalt",
    pickupRows: [
      ["InPost-Paketstation", "Nur innerhalb Polens. Sie wählen die Station bei der Bestellung und sehen sie später auf der Auftragsseite."],
      ["Kurier", "Polen und Ausland, nach der Versandpreisliste. Nach dem Versand erhalten Sie eine Sendungsnummer."],
      ["Selbstabholung", "Józefosław bei Warschau, nach Terminabsprache. Dann gibt es keinen Frachtbrief, denn das Paket reist nirgendwohin."],
    ],
    checkTitle: "Ihren Auftrag prüfen",
    checkBody: "Einen privaten Link zur Auftragsseite erhalten Sie direkt nach der Zahlung per E-Mail. Er zeigt den Zeitstrahl, den Termin, die Absprachen und die Sendungsnummer.",
    checkLost: "Link verloren? Öffnen Sie die Bestellseite und geben Sie die Nummer, die mit AE beginnt, zusammen mit der E-Mail-Adresse an, an die die Bestätigung ging. Die Nummer allein genügt nicht, weil die Seite Ihre Adresse und den Inhalt zeigt.",
    checkCta: "Bestellseite öffnen",
    checkOffer: "Ein Angebot vor der Zahlung prüfen Sie genauso, mit einer Nummer, die mit WY beginnt.",
    checkOfferCta: "Angebotsseite",
    faqTitle: "Fragen zum Ablauf",
    faqMore: "Alle Fragen und Antworten",
    payTitle: "Suchen Sie Informationen zur Zahlung?",
    payBody: "Methoden, Währungen, Gültigkeit des Betrags, Rabattcodes und was bei einer fehlgeschlagenen Zahlung zu tun ist, stehen auf einer eigenen Seite.",
    payCta: "Zahlungsablauf",
  },
};

function Karta({ icon: Icon, id, title, children, innerRef }) {
  return (
    <div id={id} ref={innerRef} className="reveal scroll-mt-32 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-5">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-amber-400 shrink-0" />
        <h2 className="text-white font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Wiersze({ rows }) {
  return (
    <div className="divide-y divide-neutral-800">
      {rows.map(([nazwa, opis], i) => (
        <div key={i} className="py-3 first:pt-0 last:pb-0">
          <div className="text-sm text-neutral-200">{nazwa}</div>
          <p className="text-neutral-400 text-sm leading-relaxed mt-1">{opis}</p>
        </div>
      ))}
    </div>
  );
}

export default function OrderProcess() {
  const { lang } = useLanguage();
  const l = L[lang] || L.pl;
  const etapyRef = useScrollReveal();
  const terminRef = useScrollReveal();
  const mailRef = useScrollReveal();
  const odbiorRef = useScrollReveal();
  const sprawdzRef = useScrollReveal();

  const pytania = [...SKLEP.filter((f) => f.temat === "realizacja" || f.temat === "dostawa"), ...TERMIN];
  const pageUrl = `${SITE.url}/order-process/`;
  const schemas = [
    buildWebPageSchema({ title: `${l.title}, ${SITE.name}`, description: l.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: l.tag, url: pageUrl },
    ]),
    buildFAQSchema(pytania.map((f) => ({ q: f.q[lang] || f.q.pl, a: f.a[lang] || f.a.pl }))),
  ];

  return (
    <>
      <SEOHead pageKey="orderProcess" path="/order-process" title={`${l.title}, AEJaCA`} description={l.description} schemas={schemas} />

      <div className="bg-neutral-950 min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Breadcrumb items={[{ label: l.tag }]} />

          <div className="flex items-center gap-3 mb-2 mt-4">
            <Hammer className="w-6 h-6 text-amber-400 shrink-0" />
            <h1 className="text-3xl font-bold text-white">{l.title}</h1>
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">{l.lead}</p>

          <SpisTresci pozycje={l.spis} />

          <Karta icon={Hammer} id="etapy" title={l.stagesTitle} innerRef={etapyRef}>
            <Wiersze rows={l.stages} />
            <p className="text-neutral-500 text-sm mt-4">{l.stagesNote}</p>
          </Karta>

          <Karta icon={CalendarClock} id="termin" title={l.deadlineTitle} innerRef={terminRef}>
            <Wiersze rows={l.deadlineRows} />
          </Karta>

          <Karta icon={Mail} id="wiadomosci" title={l.mailsTitle} innerRef={mailRef}>
            <p className="text-neutral-400 text-sm leading-relaxed">{l.mailsBody}</p>
          </Karta>

          <Karta icon={PackageCheck} id="odbior" title={l.pickupTitle} innerRef={odbiorRef}>
            <Wiersze rows={l.pickupRows} />
          </Karta>

          <Karta icon={Search} id="sprawdz" title={l.checkTitle} innerRef={sprawdzRef}>
            <p className="text-neutral-400 text-sm leading-relaxed mb-3">{l.checkBody}</p>
            <p className="text-neutral-400 text-sm leading-relaxed mb-4">{l.checkLost}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/order/status/" className="inline-flex items-center gap-2 bg-amber-400 text-neutral-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-amber-300 transition-colors">
                {l.checkCta} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/oferta/" className="inline-flex items-center gap-2 border border-neutral-700 text-neutral-200 rounded-lg px-4 py-2 text-sm hover:border-neutral-500 transition-colors">
                {l.checkOfferCta}
              </Link>
            </div>
            <p className="text-neutral-500 text-xs leading-relaxed mt-3">{l.checkOffer}</p>
          </Karta>

          <div id="faq" className="scroll-mt-32 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <h2 className="text-white font-semibold">{l.faqTitle}</h2>
            </div>
            <FaqLista pytania={pytania} />
            <p className="mt-4">
              <Link to="/faq/" className="text-amber-400 hover:text-amber-300 text-sm">{l.faqMore}</Link>
            </p>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-8">
            <h2 className="text-white font-semibold mb-2">{l.payTitle}</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-3">{l.payBody}</p>
            <Link to="/payments/" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm">
              {l.payCta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <PolicyLinks current="orderProcess" />
        </div>
      </div>
    </>
  );
}
