// ============================================================
// POLITYKA PRYWATNOSCI
// ============================================================
// Ten sam ksztalt co termsContent.js: sekcje numerowane, kazda z tytulem
// i lista akapitow, gdzie tablica zagniezdzona jest wypunktowaniem.
//
// Poprzednia wersja byla czterema ogolnymi akapitami i nie realizowala
// obowiazku z art. 13 RODO: nie bylo administratora z imienia, podstaw
// prawnych, odbiorcow, okresow przechowywania ani prawa skargi do UODO.
//
// ZASADA, ktorej trzeba trzymac sie przy kazdej zmianie: tu wolno napisac
// wylacznie to, co system faktycznie robi. Okresy przechowywania sa
// egzekwowane zadaniem w chat-api/retention.js. Skrocenie okresu w tym pliku
// bez zmiany tamtego zamienia polityke w obietnice bez pokrycia.

import { SELLER } from "./sellerInfo.js";

export const PRIVACY_EFFECTIVE_DATE = "2026-08-03";

const ADDRESS = SELLER.addressLines.join(", ");

export const PRIVACY = {
  pl: {
    title: "Polityka prywatności",
    intro:
      "Ten dokument mówi, kto przetwarza Twoje dane, po co, na jakiej podstawie, komu je przekazuje i jak długo je trzyma. Bez ogólników, bo z ogólników nic nie wynika.",
    sections: [
      {
        n: "1",
        title: "Kto jest administratorem",
        items: [
          `Administratorem danych jest ${SELLER.legalName}, prowadzący działalność nierejestrowaną pod marką ${SELLER.brandName}, adres do korespondencji: ${ADDRESS}.`,
          `Kontakt w sprawach danych: ${SELLER.email}, telefon ${SELLER.phone}.`,
          "Nie wyznaczono inspektora ochrony danych, bo przepisy tego w tym przypadku nie wymagają. Wszystkie sprawy dotyczące danych prowadzi administrator osobiście.",
        ],
      },
      {
        n: "2",
        title: "Skąd mamy Twoje dane",
        items: [
          "Wyłącznie od Ciebie: z formularza kontaktowego, zamówienia, zapisu do newslettera, rozmowy z asystentem na stronie albo wiadomości e-mail. Nie kupujemy baz danych i nie pobieramy danych z innych serwisów.",
        ],
      },
      {
        n: "3",
        title: "Cele, podstawy prawne i okresy przechowywania",
        items: [
          "Każdy cel ma własną podstawę i własny termin. Wyliczenie jest pełne, nie przykładowe.",
          [
            "Zamówienie i jego realizacja, w tym dostawa i kontakt w sprawie zlecenia. Podstawa: art. 6 ust. 1 lit. b RODO, wykonanie umowy. Okres: czas realizacji, a potem do upływu terminu przedawnienia roszczeń, zwykle 6 lat.",
            "Rozliczenia i dokumentacja sprzedaży. Podstawa: art. 6 ust. 1 lit. c RODO, obowiązek prawny. Okres: 5 lat licząc od końca roku, w którym powstał obowiązek podatkowy.",
            "Reklamacje, odstąpienia od umowy i obrona przed roszczeniami. Podstawa: art. 6 ust. 1 lit. c oraz lit. f RODO. Okres: do upływu terminu przedawnienia.",
            "Wycena i odpowiedź na zapytanie, także gdy nie kończy się zamówieniem. Podstawa: art. 6 ust. 1 lit. b RODO, działania przed zawarciem umowy. Okres: 24 miesiące od ostatniego kontaktu.",
            "Pliki wgrane do wyceny (modele 3D, projekty). Podstawa: jak wyżej. Okres: 30 dni od wgrania, jeżeli nie powstało z nich zamówienie; przy zamówieniu razem z jego dokumentacją.",
            "Newsletter i wiadomości marketingowe. Podstawa: art. 6 ust. 1 lit. a RODO, Twoja zgoda. Okres: do wycofania zgody, które jest możliwe w każdej chwili i nie wymaga uzasadnienia.",
            "Rozmowa z asystentem na stronie. Podstawa: art. 6 ust. 1 lit. f RODO, obsługa pytań i poprawianie odpowiedzi. Okres: 12 miesięcy.",
            "Statystyka odwiedzin, bez identyfikowania osoby. Podstawa: art. 6 ust. 1 lit. f RODO. Okres: 24 miesiące.",
            "Zabezpieczenie przed nadużyciami, w tym skrócony zapis adresu IP przy zamówieniu i rozmowie. Podstawa: art. 6 ust. 1 lit. f RODO. Okres: 12 miesięcy.",
          ],
          "Adres IP zapisujemy wyłącznie jako skrót nieodwracalny, służący do liczenia zapytań z jednego miejsca, a nie do ustalania, kto je wysłał.",
          "Co dzieje się po upływie terminu przy zamówieniu: sam dokument sprzedaży zostaje, bo wymaga tego prawo podatkowe, ale znikają z niego Twoje dane. Po sześciu latach kasujemy z zamówienia imię i nazwisko, telefon, adres dostawy i skrót adresu IP, a adres e-mail zastępujemy adresem zastępczym. Zostają wyłącznie kwoty, daty, numer zamówienia i to, co kupiono. Robi to zadanie uruchamiane raz na dobę, a nie ręczna pamięć.",
          "Surowe komunikaty od operatora płatności, które służą do wyjaśnienia spornej wpłaty, czyścimy po 12 miesiącach. Sam ślad, że płatność była i jaka, zostaje przy zamówieniu.",
        ],
      },
      {
        n: "4",
        title: "Komu przekazujemy dane",
        items: [
          "Danych nie sprzedajemy i nie udostępniamy nikomu do jego własnych celów marketingowych. Korzystamy natomiast z usług, bez których serwis nie działałby wcale. Każdy z tych podmiotów przetwarza dane na nasze polecenie:",
          [
            "Railway Corp. (Stany Zjednoczone) i Cloudflare, Inc. (Stany Zjednoczone), utrzymanie aplikacji, bazy danych i serwisu.",
            "Google Ireland Ltd., poczta, logowanie do panelu i profil firmy z opiniami.",
            "OpenAI Ireland Ltd., działanie asystenta na stronie.",
            "Autopay S.A. (Sopot), obsługa płatności. Autopay jest osobnym administratorem danych płatniczych, a my nie mamy dostępu do danych kart ani do danych logowania do banku.",
            "InPost S.A. oraz firmy kurierskie, doręczenie przesyłki. Otrzymują imię, nazwisko, adres albo numer paczkomatu i numer telefonu.",
            "Dostawca automatyzacji przepływów (n8n), wysyłka powiadomień i wiadomości.",
          ],
          "Dane mogą też trafić do organów państwowych, jeżeli obowiązek ich przekazania wynika z przepisów.",
        ],
      },
      {
        n: "5",
        title: "Przekazywanie poza Europejski Obszar Gospodarczy",
        items: [
          "Część usług, z których korzystamy, ma serwery lub spółki macierzyste poza Europejskim Obszarem Gospodarczym, przede wszystkim w Stanach Zjednoczonych. Dotyczy to utrzymania aplikacji i bazy danych oraz działania asystenta na stronie.",
          "Przekazanie odbywa się na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską albo decyzji o odpowiednim stopniu ochrony, w zależności od dostawcy. Kopię zastosowanych zabezpieczeń udostępniamy na żądanie.",
          "Praktyczny wniosek dla Ciebie: treść rozmowy z asystentem na stronie opuszcza Europejski Obszar Gospodarczy. Nie podawaj w niej danych, których nie chcesz tam wysłać. Do spraw wymagających podania danych osobowych służy formularz kontaktowy albo poczta.",
        ],
      },
      {
        n: "6",
        title: "Twoje prawa",
        items: [
          "Przysługuje Ci prawo do:",
          [
            "dostępu do swoich danych i otrzymania ich kopii,",
            "sprostowania danych nieprawidłowych i uzupełnienia niekompletnych,",
            "usunięcia danych, o ile nie stoi temu na przeszkodzie obowiązek prawny, na przykład obowiązek przechowywania dokumentacji sprzedaży,",
            "ograniczenia przetwarzania,",
            "przeniesienia danych, które przekazałeś nam na podstawie zgody albo umowy,",
            "sprzeciwu wobec przetwarzania opartego na naszym prawnie uzasadnionym interesie,",
            "wycofania zgody w każdej chwili, bez wpływu na zgodność z prawem tego, co zrobiliśmy przed jej wycofaniem.",
          ],
          `Aby skorzystać z któregokolwiek z tych praw, wystarczy wiadomość na ${SELLER.email}. Odpowiadamy bez zbędnej zwłoki, najpóźniej w ciągu miesiąca.`,
          "Masz też prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl.",
        ],
      },
      {
        n: "7",
        title: "Czy podanie danych jest obowiązkowe",
        items: [
          "Podanie danych jest dobrowolne, ale bez niektórych z nich nie da się wykonać usługi. Do złożenia zamówienia potrzebujemy adresu e-mail, imienia i nazwiska oraz numeru telefonu: nazwisko idzie na etykietę przesyłki, kurier dzwoni przed doręczeniem, a paczkomat wysyła kod odbioru wiadomością. Do wysyłki kurierskiej potrzebny jest adres.",
          "Do zapisu do newslettera wystarczy adres e-mail i zgoda. Rezygnacja jest możliwa w każdej chwili.",
        ],
      },
      {
        n: "8",
        title: "Zautomatyzowane decyzje i profilowanie",
        items: [
          "Nie podejmujemy decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, które wywoływałyby wobec Ciebie skutki prawne lub w podobny sposób istotnie na Ciebie wpływały. Nie profilujemy Cię pod kątem reklam.",
          "Kalkulatory na stronie liczą cenę z podanych przez Ciebie parametrów. To rachunek na liczbach, a nie ocena osoby.",
        ],
      },
      {
        n: "9",
        title: "Dane przechowywane w Twojej przeglądarce",
        items: [
          "Serwis zapisuje w pamięci przeglądarki kilka rzeczy, bez których nie mógłby działać albo działałby gorzej:",
          [
            "zawartość koszyka, żeby nie znikała po odświeżeniu strony,",
            "ustawienia kalkulatorów, żeby nie trzeba było ich wpisywać od nowa,",
            "wybrany tryb jasny albo ciemny,",
            "zapis rozmowy z asystentem na czas jednej wizyty.",
          ],
          "To zapisy niezbędne do świadczenia usługi, o którą sam prosisz, więc nie wymagają zgody. Nie używamy plików śledzących, nie mamy reklam ani narzędzi reklamowych innych firm, nie osadzamy pikseli sieci społecznościowych.",
          "Statystykę odwiedzin prowadzimy we własnym zakresie, bez identyfikowania osoby i bez przekazywania czegokolwiek na zewnątrz. Nie zapisuje ona w Twojej przeglądarce niczego: zdarzenia idą prosto na nasz serwer, a identyfikator odwiedzin ginie razem z zamknięciem strony, więc nie łączy dwóch wizyt tej samej osoby.",
        ],
      },
      {
        n: "10",
        title: "Bezpieczeństwo",
        items: [
          "Połączenie z serwisem jest szyfrowane. Dostęp do panelu administracyjnego wymaga logowania kontem Google z listy uprawnionych adresów. Dane płatnicze nigdy nie trafiają na nasze serwery, obsługuje je operator płatności.",
          "Numery rachunków bankowych i klucze do systemów płatności trzymamy wyłącznie w konfiguracji serwera, nigdy w kodzie serwisu.",
        ],
      },
      {
        n: "11",
        title: "Zmiany polityki",
        items: [
          `Wersja obowiązująca od ${PRIVACY_EFFECTIVE_DATE}. O istotnych zmianach informujemy na stronie, a osoby zapisane do newslettera również wiadomością.`,
        ],
      },
    ],
  },

  en: {
    title: "Privacy policy",
    intro:
      "This document states who processes your data, for what purpose, on what legal basis, who receives it and how long it is kept. Without generalities, because nothing follows from generalities.",
    sections: [
      {
        n: "1",
        title: "Who is the controller",
        items: [
          `The controller is ${SELLER.legalName}, carrying out unregistered business activity under the ${SELLER.brandName} brand, correspondence address: ${ADDRESS}.`,
          `Contact on data matters: ${SELLER.email}, phone ${SELLER.phone}.`,
          "No data protection officer has been appointed, because the law does not require one here. All data matters are handled by the controller in person.",
        ],
      },
      {
        n: "2",
        title: "Where your data comes from",
        items: [
          "From you and only you: the contact form, an order, a newsletter signup, a conversation with the assistant on the site, or an email. We do not buy databases and do not harvest data from other services.",
        ],
      },
      {
        n: "3",
        title: "Purposes, legal bases and retention",
        items: [
          "Each purpose has its own basis and its own period. The list is complete, not illustrative.",
          [
            "Handling an order, including delivery and contact about the job. Basis: Article 6(1)(b) GDPR, performance of a contract. Period: for the duration of the order, then until claims become time-barred, usually 6 years.",
            "Accounting and sales records. Basis: Article 6(1)(c) GDPR, legal obligation. Period: 5 years from the end of the year in which the tax obligation arose.",
            "Complaints, withdrawals and defence against claims. Basis: Article 6(1)(c) and (f) GDPR. Period: until claims become time-barred.",
            "Quoting and answering an enquiry, also when it does not end in an order. Basis: Article 6(1)(b) GDPR, steps prior to entering into a contract. Period: 24 months from the last contact.",
            "Files uploaded for a quote (3D models, artwork). Basis: as above. Period: 30 days from upload if no order follows; with an order, together with its documentation.",
            "Newsletter and marketing messages. Basis: Article 6(1)(a) GDPR, your consent. Period: until consent is withdrawn, which is possible at any time and needs no justification.",
            "Conversation with the assistant on the site. Basis: Article 6(1)(f) GDPR, answering questions and improving the answers. Period: 12 months.",
            "Visit statistics, without identifying a person. Basis: Article 6(1)(f) GDPR. Period: 24 months.",
            "Abuse prevention, including a shortened record of the IP address with an order or a conversation. Basis: Article 6(1)(f) GDPR. Period: 12 months.",
          ],
          "The IP address is stored only as an irreversible hash, used to count requests from one place, not to establish who sent them.",
          "What happens to an order once its period runs out: the sales record itself stays, because tax law requires it, but your data leaves it. After six years we erase the name, phone number, delivery address and hashed IP from the order, and replace the email address with a placeholder. Only amounts, dates, the order number and what was bought remain. A job does this daily; it does not depend on anyone remembering.",
          "Raw messages from the payment provider, kept to settle a disputed payment, are cleared after 12 months. The record that a payment happened, and for how much, stays with the order.",
        ],
      },
      {
        n: "4",
        title: "Who receives the data",
        items: [
          "We do not sell data and do not share it with anyone for their own marketing. We do rely on services without which the site would not run at all. Each of them processes data on our instructions:",
          [
            "Railway Corp. (United States) and Cloudflare, Inc. (United States), running the application, the database and the site.",
            "Google Ireland Ltd., email, panel sign-in and the business profile with reviews.",
            "OpenAI Ireland Ltd., running the assistant on the site.",
            "Autopay S.A. (Sopot, Poland), payment handling. Autopay is a separate controller of payment data; we have no access to card details or bank credentials.",
            "InPost S.A. and courier companies, delivery. They receive the name, the address or locker number and the phone number.",
            "The workflow automation provider (n8n), sending notifications and messages.",
          ],
          "Data may also be passed to public authorities where the law requires it.",
        ],
      },
      {
        n: "5",
        title: "Transfers outside the European Economic Area",
        items: [
          "Some of the services we use have servers or parent companies outside the European Economic Area, mainly in the United States. This concerns hosting of the application and the database, and the assistant on the site.",
          "Transfers rely on standard contractual clauses approved by the European Commission or on an adequacy decision, depending on the provider. A copy of the safeguards applied is available on request.",
          "The practical point for you: the content of a conversation with the assistant leaves the European Economic Area. Do not enter data there that you would rather not send outside. For anything requiring personal data, use the contact form or email.",
        ],
      },
      {
        n: "6",
        title: "Your rights",
        items: [
          "You have the right to:",
          [
            "access your data and receive a copy of it,",
            "have inaccurate data corrected and incomplete data completed,",
            "have data erased, unless a legal obligation stands in the way, for example the duty to keep sales records,",
            "restrict processing,",
            "port data you gave us on the basis of consent or a contract,",
            "object to processing based on our legitimate interest,",
            "withdraw consent at any time, without affecting the lawfulness of what was done before the withdrawal.",
          ],
          `To exercise any of these rights, an email to ${SELLER.email} is enough. We answer without undue delay and within one month at the latest.`,
          "You also have the right to lodge a complaint with the President of the Personal Data Protection Office, ul. Stawki 2, 00-193 Warsaw, Poland, uodo.gov.pl.",
        ],
      },
      {
        n: "7",
        title: "Is providing data mandatory",
        items: [
          "Providing data is voluntary, but without some of it the service cannot be delivered. Placing an order requires an email address, a full name and a phone number: the name goes on the parcel label, the courier calls before delivery, and the locker texts the pickup code. Courier delivery also requires an address.",
          "A newsletter signup needs an email address and consent. You can unsubscribe at any time.",
        ],
      },
      {
        n: "8",
        title: "Automated decisions and profiling",
        items: [
          "We do not take decisions based solely on automated processing that would produce legal effects concerning you or similarly significantly affect you. We do not profile you for advertising.",
          "The calculators on the site compute a price from the parameters you enter. That is arithmetic on numbers, not an assessment of a person.",
        ],
      },
      {
        n: "9",
        title: "Data stored in your browser",
        items: [
          "The site stores a few things in the browser, without which it would not work or would work worse:",
          [
            "the contents of the basket, so it survives a page refresh,",
            "calculator settings, so they need not be entered again,",
            "the chosen light or dark mode,",
            "the assistant conversation, for the duration of one visit.",
          ],
          "These are necessary for the service you asked for, so they require no consent. We use no tracking files, we have no advertising or third-party advertising tools, and we embed no social network pixels.",
          "Visit statistics are kept in-house, without identifying a person and without sending anything outside. They store nothing in your browser: events go straight to our server, and the visit identifier dies with the page, so it cannot link two visits by the same person.",
        ],
      },
      {
        n: "10",
        title: "Security",
        items: [
          "The connection to the site is encrypted. Access to the admin panel requires a Google sign-in from a list of permitted addresses. Payment details never reach our servers; the payment provider handles them.",
          "Bank account numbers and payment system keys live only in the server configuration, never in the site's code.",
        ],
      },
      {
        n: "11",
        title: "Changes to this policy",
        items: [
          `Version effective from ${PRIVACY_EFFECTIVE_DATE}. We announce material changes on the site, and newsletter subscribers also receive a message.`,
        ],
      },
    ],
  },

  de: {
    title: "Datenschutzerklärung",
    intro:
      "Dieses Dokument sagt, wer Ihre Daten verarbeitet, wozu, auf welcher Grundlage, wer sie erhält und wie lange sie gespeichert werden. Ohne Allgemeinplätze, denn aus Allgemeinplätzen folgt nichts.",
    sections: [
      {
        n: "1",
        title: "Wer ist verantwortlich",
        items: [
          `Verantwortlicher ist ${SELLER.legalName}, nicht registrierte Erwerbstätigkeit unter der Marke ${SELLER.brandName}, Korrespondenzanschrift: ${ADDRESS}.`,
          `Kontakt in Datenschutzfragen: ${SELLER.email}, Telefon ${SELLER.phone}.`,
          "Ein Datenschutzbeauftragter wurde nicht bestellt, da dies hier gesetzlich nicht erforderlich ist. Alle Datenschutzangelegenheiten bearbeitet der Verantwortliche persönlich.",
        ],
      },
      {
        n: "2",
        title: "Woher wir Ihre Daten haben",
        items: [
          "Ausschließlich von Ihnen: aus dem Kontaktformular, einer Bestellung, der Newsletter-Anmeldung, einem Gespräch mit dem Assistenten auf der Website oder einer E-Mail. Wir kaufen keine Datenbestände und erheben keine Daten aus anderen Diensten.",
        ],
      },
      {
        n: "3",
        title: "Zwecke, Rechtsgrundlagen und Speicherdauer",
        items: [
          "Jeder Zweck hat seine eigene Grundlage und seine eigene Frist. Die Aufzählung ist vollständig, nicht beispielhaft.",
          [
            "Bestellung und ihre Abwicklung, einschließlich Lieferung und Rückfragen. Grundlage: Art. 6 Abs. 1 lit. b DSGVO, Vertragserfüllung. Dauer: für die Dauer der Abwicklung, danach bis zur Verjährung der Ansprüche, in der Regel 6 Jahre.",
            "Abrechnung und Verkaufsunterlagen. Grundlage: Art. 6 Abs. 1 lit. c DSGVO, rechtliche Verpflichtung. Dauer: 5 Jahre ab Ende des Jahres, in dem die Steuerpflicht entstanden ist.",
            "Reklamationen, Widerrufe und Abwehr von Ansprüchen. Grundlage: Art. 6 Abs. 1 lit. c und lit. f DSGVO. Dauer: bis zur Verjährung.",
            "Angebot und Beantwortung einer Anfrage, auch ohne spätere Bestellung. Grundlage: Art. 6 Abs. 1 lit. b DSGVO, vorvertragliche Maßnahmen. Dauer: 24 Monate ab dem letzten Kontakt.",
            "Für ein Angebot hochgeladene Dateien (3D-Modelle, Vorlagen). Grundlage: wie oben. Dauer: 30 Tage ab Upload, wenn keine Bestellung folgt; bei einer Bestellung zusammen mit deren Unterlagen.",
            "Newsletter und Werbenachrichten. Grundlage: Art. 6 Abs. 1 lit. a DSGVO, Ihre Einwilligung. Dauer: bis zum Widerruf, jederzeit und ohne Begründung möglich.",
            "Gespräch mit dem Assistenten auf der Website. Grundlage: Art. 6 Abs. 1 lit. f DSGVO, Beantwortung von Fragen und Verbesserung der Antworten. Dauer: 12 Monate.",
            "Besuchsstatistik, ohne Identifizierung einer Person. Grundlage: Art. 6 Abs. 1 lit. f DSGVO. Dauer: 24 Monate.",
            "Missbrauchsabwehr, einschließlich einer verkürzten Speicherung der IP-Adresse bei Bestellung und Gespräch. Grundlage: Art. 6 Abs. 1 lit. f DSGVO. Dauer: 12 Monate.",
          ],
          "Die IP-Adresse wird ausschließlich als nicht umkehrbarer Hashwert gespeichert und dient dem Zählen von Anfragen aus einer Quelle, nicht der Feststellung, wer sie gesendet hat.",
          "Was nach Ablauf der Frist mit einer Bestellung geschieht: Der Verkaufsbeleg bleibt, da das Steuerrecht dies verlangt, Ihre Daten verlassen ihn jedoch. Nach sechs Jahren löschen wir Namen, Telefonnummer, Lieferanschrift und den IP-Hashwert aus der Bestellung und ersetzen die E-Mail-Adresse durch eine Platzhalteradresse. Es bleiben nur Beträge, Daten, die Bestellnummer und der Inhalt. Das erledigt ein täglich laufender Vorgang, nicht das Gedächtnis eines Menschen.",
          "Rohe Meldungen des Zahlungsdienstleisters, die der Klärung strittiger Zahlungen dienen, löschen wir nach 12 Monaten. Der Nachweis, dass und in welcher Höhe gezahlt wurde, bleibt bei der Bestellung.",
        ],
      },
      {
        n: "4",
        title: "Wer die Daten erhält",
        items: [
          "Wir verkaufen keine Daten und geben sie niemandem für dessen eigene Werbezwecke weiter. Wir nutzen jedoch Dienste, ohne die die Website gar nicht liefe. Jeder dieser Dienste verarbeitet Daten in unserem Auftrag:",
          [
            "Railway Corp. (USA) und Cloudflare, Inc. (USA), Betrieb der Anwendung, der Datenbank und der Website.",
            "Google Ireland Ltd., E-Mail, Anmeldung am Panel und Unternehmensprofil mit Bewertungen.",
            "OpenAI Ireland Ltd., Betrieb des Assistenten auf der Website.",
            "Autopay S.A. (Sopot, Polen), Zahlungsabwicklung. Autopay ist eigener Verantwortlicher für Zahlungsdaten; wir haben keinen Zugriff auf Kartendaten oder Bankzugangsdaten.",
            "InPost S.A. und Kurierdienste, Zustellung. Sie erhalten Name, Anschrift bzw. Paketstationsnummer und Telefonnummer.",
            "Der Anbieter der Workflow-Automatisierung (n8n), Versand von Benachrichtigungen und Nachrichten.",
          ],
          "Daten können außerdem an staatliche Stellen gelangen, soweit die Weitergabe gesetzlich vorgeschrieben ist.",
        ],
      },
      {
        n: "5",
        title: "Übermittlung außerhalb des Europäischen Wirtschaftsraums",
        items: [
          "Einige der genutzten Dienste haben Server oder Muttergesellschaften außerhalb des Europäischen Wirtschaftsraums, überwiegend in den USA. Das betrifft den Betrieb der Anwendung und der Datenbank sowie den Assistenten auf der Website.",
          "Die Übermittlung stützt sich je nach Anbieter auf die von der Europäischen Kommission genehmigten Standardvertragsklauseln oder auf einen Angemessenheitsbeschluss. Eine Kopie der Garantien stellen wir auf Anfrage bereit.",
          "Praktisch bedeutet das: Der Inhalt eines Gesprächs mit dem Assistenten verlässt den Europäischen Wirtschaftsraum. Geben Sie dort keine Daten ein, die Sie nicht außerhalb versenden möchten. Für alles, was personenbezogene Daten erfordert, nutzen Sie bitte das Kontaktformular oder E-Mail.",
        ],
      },
      {
        n: "6",
        title: "Ihre Rechte",
        items: [
          "Sie haben das Recht auf:",
          [
            "Auskunft über Ihre Daten und eine Kopie davon,",
            "Berichtigung unrichtiger und Vervollständigung unvollständiger Daten,",
            "Löschung, soweit keine gesetzliche Pflicht entgegensteht, etwa die Aufbewahrung von Verkaufsunterlagen,",
            "Einschränkung der Verarbeitung,",
            "Datenübertragbarkeit für Daten, die Sie uns aufgrund einer Einwilligung oder eines Vertrags übermittelt haben,",
            "Widerspruch gegen eine Verarbeitung, die auf unserem berechtigten Interesse beruht,",
            "Widerruf der Einwilligung jederzeit, ohne dass die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung berührt wird.",
          ],
          `Für die Ausübung dieser Rechte genügt eine Nachricht an ${SELLER.email}. Wir antworten unverzüglich, spätestens innerhalb eines Monats.`,
          "Sie haben zudem das Recht, sich beim Präsidenten des polnischen Datenschutzamts zu beschweren: ul. Stawki 2, 00-193 Warschau, uodo.gov.pl.",
        ],
      },
      {
        n: "7",
        title: "Ist die Angabe der Daten verpflichtend",
        items: [
          "Die Angabe ist freiwillig, ohne manche Daten lässt sich die Leistung jedoch nicht erbringen. Für eine Bestellung benötigen wir E-Mail-Adresse, Vor- und Nachnamen sowie Telefonnummer: Der Name steht auf dem Paketaufkleber, der Kurier ruft vor der Zustellung an, und die Paketstation sendet den Abholcode per Nachricht. Für den Kurierversand ist zusätzlich die Anschrift nötig.",
          "Für den Newsletter genügen E-Mail-Adresse und Einwilligung. Die Abmeldung ist jederzeit möglich.",
        ],
      },
      {
        n: "8",
        title: "Automatisierte Entscheidungen und Profiling",
        items: [
          "Wir treffen keine ausschließlich auf automatisierter Verarbeitung beruhenden Entscheidungen, die Ihnen gegenüber rechtliche Wirkung entfalten oder Sie in ähnlicher Weise erheblich beeinträchtigen. Wir erstellen kein Werbeprofil von Ihnen.",
          "Die Rechner auf der Website ermitteln einen Preis aus den von Ihnen eingegebenen Parametern. Das ist Rechnen mit Zahlen, keine Bewertung einer Person.",
        ],
      },
      {
        n: "9",
        title: "In Ihrem Browser gespeicherte Daten",
        items: [
          "Die Website speichert einige Dinge im Browser, ohne die sie nicht oder schlechter funktionieren würde:",
          [
            "den Inhalt des Warenkorbs, damit er ein Neuladen übersteht,",
            "Einstellungen der Rechner, damit sie nicht erneut eingegeben werden müssen,",
            "den gewählten hellen oder dunklen Modus,",
            "das Gespräch mit dem Assistenten für die Dauer eines Besuchs.",
          ],
          "Diese Speicherungen sind für die von Ihnen angeforderte Leistung erforderlich und bedürfen daher keiner Einwilligung. Wir verwenden keine Tracking-Dateien, keine Werbung und keine Werbewerkzeuge Dritter und binden keine Social-Media-Pixel ein.",
          "Die Besuchsstatistik führen wir selbst, ohne Identifizierung einer Person und ohne Weitergabe nach außen. Sie speichert nichts in Ihrem Browser: Ereignisse gehen direkt an unseren Server, und die Besuchskennung endet mit der Seite, kann also zwei Besuche derselben Person nicht verknüpfen.",
        ],
      },
      {
        n: "10",
        title: "Sicherheit",
        items: [
          "Die Verbindung zur Website ist verschlüsselt. Der Zugang zum Administrationsbereich erfordert eine Google-Anmeldung von einer Liste zugelassener Adressen. Zahlungsdaten gelangen nie auf unsere Server, sie werden vom Zahlungsdienstleister verarbeitet.",
          "Bankverbindungen und Schlüssel der Zahlungssysteme liegen ausschließlich in der Serverkonfiguration, nie im Code der Website.",
        ],
      },
      {
        n: "11",
        title: "Änderungen dieser Erklärung",
        items: [
          `Fassung gültig ab ${PRIVACY_EFFECTIVE_DATE}. Wesentliche Änderungen kündigen wir auf der Website an, Newsletter-Abonnenten erhalten zusätzlich eine Nachricht.`,
        ],
      },
    ],
  },
};

export default PRIVACY;
