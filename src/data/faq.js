// ============================================================
// NAJCZESCIEJ ZADAWANE PYTANIA, JEDNO ZRODLO
// ============================================================
// Pytania stoja tutaj, a nie w tresci stron, bo czyta je kilka miejsc naraz:
// strona platnosci bierze swoj temat, strona procesu swoj, a `/faq/` wszystkie
// razem z wyszukiwarka. Trzy kopie tego samego pytania rozjechalyby sie przy
// pierwszej poprawce, i to po cichu: klient dostalby dwie rozne odpowiedzi
// w zaleznosci od tego, na ktora strone trafil.
//
// `temat` decyduje, gdzie pytanie sie pokaze i jak filtruje sie na `/faq/`.
// `id` jest kotwica w adresie, wiec ZOSTAJE, nawet gdy zmieni sie tresc:
// odnosnik wyslany klientowi mailem ma dzialac za rok.

import { EUR_FX_MARGIN } from "../pricing/currency.js";

/** Narzut kursowy jako procent, liczony z tej samej stalej co kasa. */
const FX_PCT = Math.round((EUR_FX_MARGIN - 1) * 100);

export const FAQ_TEMATY = [
  { id: "platnosc", label: { pl: "Płatność", en: "Payment", de: "Zahlung" } },
  { id: "oferta", label: { pl: "Oferty i wyceny", en: "Offers and quotes", de: "Angebote" } },
  { id: "realizacja", label: { pl: "Realizacja", en: "Order process", de: "Ablauf" } },
  { id: "dostawa", label: { pl: "Dostawa i odbiór", en: "Delivery", de: "Lieferung" } },
];

export const FAQ = [
  {
    id: "karta",
    temat: "platnosc",
    q: {
      pl: "Czy mogę zapłacić kartą?",
      en: "Can I pay by card?",
      de: "Kann ich mit Karte zahlen?",
    },
    a: {
      pl: "Nie. Dostępne są BLIK i szybki przelew online w złotych, a dla klientów rozliczających się w euro przelew SEPA. Nie ma też płatności za pobraniem.",
      en: "No. BLIK and instant bank transfer are available in złoty, and a SEPA transfer for customers settling in euro. Cash on delivery is not available either.",
      de: "Nein. Verfügbar sind BLIK und Sofortüberweisung in Złoty sowie eine SEPA-Überweisung für die Abrechnung in Euro. Nachnahme gibt es ebenfalls nicht.",
    },
  },
  {
    id: "numer-oferty",
    temat: "oferta",
    q: {
      pl: "Gdzie wpisuję numer oferty?",
      en: "Where do I enter the offer number?",
      de: "Wo gebe ich die Angebotsnummer ein?",
    },
    a: {
      pl: "Na stronie oferty, na stronie sklepu albo w koszyku. Wszędzie tam jest pole \"Masz numer oferty?\". Po wpisaniu numeru potwierdzasz jeszcze adres e-mail, na który poszła oferta.",
      en: "On the offer page, on the shop page or in the cart. All three carry a \"Have an offer number?\" field. After the number you also confirm the e-mail address the offer was sent to.",
      de: "Auf der Angebotsseite, auf der Shopseite oder im Warenkorb. Überall dort steht das Feld \"Haben Sie eine Angebotsnummer?\". Nach der Nummer bestätigen Sie zusätzlich die E-Mail-Adresse, an die das Angebot ging.",
    },
  },
  {
    id: "kod-rabatowy",
    temat: "platnosc",
    q: {
      pl: "Gdzie wpisuję kod rabatowy?",
      en: "Where do I enter a discount code?",
      de: "Wo gebe ich einen Rabattcode ein?",
    },
    a: {
      pl: "Przy zakupie w sklepie w polu pod podsumowaniem zamówienia. Przy zapłacie za ofertę na stronie oferty, przed przejściem do płatności. Zniżkę widzisz przed zapłatą, nigdy nie zwracamy jej po fakcie.",
      en: "When buying in the shop, in the field under the order summary. When paying for an offer, on the offer page before moving to payment. You see the discount before paying; we never refund it afterwards.",
      de: "Beim Kauf im Shop im Feld unter der Bestellübersicht. Bei Zahlung für ein Angebot auf der Angebotsseite, vor dem Wechsel zur Zahlung. Den Rabatt sehen Sie vor der Zahlung, im Nachhinein erstatten wir ihn nie.",
    },
  },
  {
    id: "rabat-dostawa",
    temat: "platnosc",
    q: {
      pl: "Czy rabat obejmuje dostawę?",
      en: "Does a discount cover delivery?",
      de: "Gilt ein Rabatt auch für den Versand?",
    },
    a: {
      pl: "Nie. Kod schodzi wyłącznie z pozycji zlecenia i nigdy nie obniża kosztu dostawy.",
      en: "No. A code comes off the order items only and never lowers the delivery cost.",
      de: "Nein. Ein Code geht ausschließlich von den Auftragspositionen ab und senkt nie die Versandkosten.",
    },
  },
  {
    id: "cena-euro",
    temat: "platnosc",
    q: {
      pl: "Dlaczego cena w euro nie jest ceną w złotych podzieloną przez kurs?",
      en: "Why is the euro price not the złoty price divided by the rate?",
      de: "Warum ist der Europreis nicht der Złoty-Preis geteilt durch den Kurs?",
    },
    a: {
      pl: `Bo do kursu Narodowego Banku Polskiego doliczamy ${FX_PCT} procent. Między zamrożeniem kwoty a zaksięgowaniem przelewu mija kilka dni, a kurs w tym czasie się rusza.`,
      en: `Because we add ${FX_PCT} percent to the National Bank of Poland rate. Several days pass between freezing the amount and the transfer clearing, and the rate moves in the meantime.`,
      de: `Weil wir auf den Kurs der Polnischen Nationalbank ${FX_PCT} Prozent aufschlagen. Zwischen dem Einfrieren des Betrags und dem Eingang der Überweisung vergehen einige Tage, und der Kurs bewegt sich in dieser Zeit.`,
    },
  },
  {
    id: "waluta-jezyk",
    temat: "platnosc",
    q: {
      pl: "Jestem w Polsce, ale czytam stronę po angielsku. W jakiej walucie zapłacę?",
      en: "I am in Poland but reading the site in English. Which currency will I pay in?",
      de: "Ich bin in Polen, lese die Seite aber auf Deutsch. In welcher Währung zahle ich?",
    },
    a: {
      pl: "W takiej, jaką wybierzesz. Język podpowiada walutę i tylko tyle: angielski i niemiecki zaczynają od euro, polski od złotych. Walutę przestawisz w menu języka, w kasie i na stronie oferty, a wybór zostaje na następną wizytę. Waluta wynika z tego, gdzie masz konto, a nie z tego, w jakim języku czytasz.",
      en: "Whichever you choose. The language only suggests a currency: English and German start in euro, Polish in złoty. You can switch it in the language menu, at checkout and on the offer page, and the choice sticks for your next visit. Currency follows where you keep your money, not what language you read in.",
      de: "In der, die Sie wählen. Die Sprache schlägt die Währung nur vor: Englisch und Deutsch starten in Euro, Polnisch in Złoty. Umstellen können Sie sie im Sprachmenü, an der Kasse und auf der Angebotsseite, und die Wahl bleibt bis zum nächsten Besuch. Die Währung richtet sich danach, wo Sie Ihr Geld haben, nicht danach, welche Sprache Sie lesen.",
    },
  },
  {
    id: "waznosc-oferty",
    temat: "oferta",
    q: {
      pl: "Jak długo ważna jest oferta?",
      en: "How long is an offer valid?",
      de: "Wie lange ist ein Angebot gültig?",
    },
    a: {
      pl: "Domyślnie 7 dni, ale obowiązuje zawsze data wpisana w Twojej ofercie. Termin ustalamy osobno dla każdej z nich, bo przy wyrobach z kruszcu krótszy bywa uczciwszy niż długi. Po tej dacie oferta nie przyjmuje zapłaty i wystawiamy nową.",
      en: "Seven days by default, but the date written on your offer is always the one that counts. We set it separately for each one, because on metal pieces a shorter term is often the honest one. Past that date the offer takes no payment and we issue a new one.",
      de: "Standardmäßig sieben Tage, maßgeblich ist aber immer das auf Ihrem Angebot genannte Datum. Wir legen es für jedes Angebot einzeln fest, denn bei Metallstücken ist eine kürzere Frist oft die ehrlichere. Nach diesem Datum nimmt das Angebot keine Zahlung mehr an und wir stellen ein neues aus.",
    },
  },
  {
    id: "kwota-po-otwarciu",
    temat: "oferta",
    q: {
      pl: "Kwota po otwarciu zapisanej wyceny różni się od tej, którą pamiętam. Dlaczego?",
      en: "The amount on my saved quote differs from the one I remember. Why?",
      de: "Der Betrag in meiner gespeicherten Kalkulation weicht von dem ab, den ich in Erinnerung habe. Warum?",
    },
    a: {
      pl: "Bo przy wyrobach z kruszcu robocizna jest wiążąca przez cały okres ważności, ale sam metal liczymy z dnia, w którym otwierasz link. Doliczamy wyłącznie różnicę wynikającą z ruchu kursu złota czy platyny, nigdy zmiany naszego cennika. Przy ofercie ustalonej z człowiekiem tak się nie dzieje: tam kwota jest stała aż do daty ważności.",
      en: "Because on metal pieces the labour is binding for the whole validity period, while the metal itself is priced on the day you open the link. We add only the difference caused by the gold or platinum rate moving, never by a change in our own price list. This does not happen on an offer agreed with a person: there the amount is fixed until its expiry date.",
      de: "Weil bei Metallstücken die Arbeitsleistung für die gesamte Gültigkeitsdauer verbindlich ist, das Metall selbst aber zum Tag der Linköffnung gerechnet wird. Wir addieren ausschließlich die Differenz aus der Kursbewegung von Gold oder Platin, nie aus einer Änderung unserer Preisliste. Bei einem persönlich vereinbarten Angebot passiert das nicht: dort steht der Betrag bis zum Ablaufdatum fest.",
    },
  },
  {
    id: "ile-trwa",
    temat: "realizacja",
    q: {
      pl: "Ile trwa realizacja i skąd wiem, na kiedy?",
      en: "How long does it take and how do I know the date?",
      de: "Wie lange dauert es und woher kenne ich den Termin?",
    },
    a: {
      pl: "Termin liczymy w dniach kalendarzowych. Przy zleceniu, które nie wymaga ustaleń, biegnie od zapłaty; przy takim, które ich wymaga, dopiero od chwili, gdy wszystko jest ustalone. Konkretną datę widzisz na stronie zlecenia, razem z liczbą dni, które zostały. Gdy w zamówieniu jest kilka rzeczy, obowiązuje najdłuższy z terminów, bo paczka wychodzi jedna.",
      en: "We count in calendar days. For an order that needs no agreeing, the clock starts at payment; for one that does, only once everything is agreed. The exact date is on your order page together with the days remaining. With several items in one order, the longest of their times applies, because one parcel goes out.",
      de: "Wir rechnen in Kalendertagen. Bei einem Auftrag ohne Absprachen läuft die Zeit ab der Zahlung, bei einem mit Absprachen erst, wenn alles geklärt ist. Das genaue Datum steht auf Ihrer Auftragsseite, samt der verbleibenden Tage. Bei mehreren Positionen gilt die längste Zeit, denn es geht ein Paket raus.",
    },
  },
  {
    id: "ustalanie-szczegolow",
    temat: "realizacja",
    q: {
      pl: "Co znaczy „ustalanie szczegółów”?",
      en: "What does agreeing the details mean?",
      de: "Was bedeutet Details klären?",
    },
    a: {
      pl: "Że zanim zaczniemy pracę, musimy coś z Tobą uzgodnić: rozmiar, wzór, literę na sygnecie, materiał. Na stronie zlecenia widzisz, której pozycji dotyczy pytanie. W tym czasie czas realizacji nie biegnie, więc czekanie na Twoją odpowiedź nie zjada Twojego terminu. Po ustaleniach zapisujemy jednym zdaniem, na czym stanęło, i to samo zdanie widzisz u siebie.",
      en: "That before we start we need something settled with you: a size, a pattern, the letters on a signet, a material. The order page names the item in question. The lead time does not run during that wait, so answering us does not eat into your date. Once agreed, we write down in one sentence what we settled on, and you see the same sentence.",
      de: "Dass wir vor dem Arbeitsbeginn etwas mit Ihnen abstimmen müssen: eine Größe, ein Muster, die Buchstaben auf einem Siegelring, ein Material. Die Auftragsseite nennt die betroffene Position. Während dieser Zeit läuft die Lieferzeit nicht, Ihre Antwort geht also nicht von Ihrem Termin ab. Nach der Absprache halten wir in einem Satz fest, worauf wir uns geeinigt haben, und Sie sehen denselben Satz.",
    },
  },
  {
    id: "powiadomienia",
    temat: "realizacja",
    q: {
      pl: "Czy dostanę wiadomość, gdy coś się zmieni?",
      en: "Will I be told when something changes?",
      de: "Werde ich informiert, wenn sich etwas ändert?",
    },
    a: {
      pl: "Tak, przy istotnych etapach: gdy zlecenie wchodzi do realizacji, gdy jest gotowe i gdy wychodzi. Wiadomość nie idzie z automatu przy każdym ruchu w warsztacie, bo skrzynka nie jest dziennikiem naszej pracy. Aktualny stan masz zawsze na stronie zlecenia.",
      en: "Yes, at the stages that matter: when the order enters the workshop, when it is finished and when it leaves. We do not email on every move inside the workshop, because your inbox is not our work log. The current state is always on your order page.",
      de: "Ja, bei den wichtigen Etappen: wenn der Auftrag in die Werkstatt geht, wenn er fertig ist und wenn er hinausgeht. Wir schreiben nicht bei jedem Schritt in der Werkstatt, denn Ihr Postfach ist kein Arbeitsjournal. Den aktuellen Stand finden Sie immer auf der Auftragsseite.",
    },
  },
  {
    id: "zgubiony-link",
    temat: "realizacja",
    q: {
      pl: "Zgubiłem link do zamówienia. Jak sprawdzę, co się dzieje?",
      en: "I lost the link to my order. How do I check on it?",
      de: "Ich habe den Link zur Bestellung verloren. Wie sehe ich den Stand?",
    },
    a: {
      pl: "Wejdź na stronę zamówienia i podaj numer razem z adresem e-mail, na który poszło potwierdzenie. Numer zaczyna się od AE. Sam numer nie wystarczy, bo strona pokazuje adres i zawartość zamówienia.",
      en: "Open the order page and give the number together with the e-mail address the confirmation went to. The number starts with AE. The number alone is not enough, because the page shows your address and what you ordered.",
      de: "Öffnen Sie die Bestellseite und geben Sie die Nummer zusammen mit der E-Mail-Adresse an, an die die Bestätigung ging. Die Nummer beginnt mit AE. Die Nummer allein genügt nicht, weil die Seite Ihre Adresse und den Inhalt der Bestellung zeigt.",
    },
  },
  {
    id: "przesuniety-termin",
    temat: "realizacja",
    q: {
      pl: "Termin się przesunął. Co wtedy?",
      en: "The date moved. What then?",
      de: "Der Termin hat sich verschoben. Was dann?",
    },
    a: {
      pl: "Jeżeli zmiana wynika z ustaleń z Tobą, zapisujemy nowy termin razem z datą, w której go uzgodniliśmy, i widać to na stronie zlecenia. Jeżeli opóźnienie jest po naszej stronie, odzywamy się sami.",
      en: "If the change comes from something agreed with you, we record the new date together with the day we agreed it, and it shows on your order page. If the delay is on our side, we contact you ourselves.",
      de: "Beruht die Änderung auf einer Absprache mit Ihnen, halten wir den neuen Termin samt dem Tag der Absprache fest, sichtbar auf Ihrer Auftragsseite. Liegt die Verzögerung bei uns, melden wir uns von selbst.",
    },
  },
  {
    id: "odbior",
    temat: "dostawa",
    q: {
      pl: "Jak odbieram gotową rzecz?",
      en: "How do I collect the finished piece?",
      de: "Wie erhalte ich das fertige Stück?",
    },
    a: {
      pl: "Tak, jak wybrałeś przy zamówieniu: paczkomat InPost, kurier albo odbiór osobisty w Józefosławiu. Po nadaniu numer przesyłki pojawia się na stronie zlecenia i w wiadomości. Przy odbiorze osobistym umawiamy się na godzinę.",
      en: "However you chose when ordering: an InPost locker, a courier or personal pickup in Józefosław. Once posted, the tracking number appears on your order page and in the message. For a personal pickup we agree a time.",
      de: "So, wie Sie es bei der Bestellung gewählt haben: InPost-Paketstation, Kurier oder Selbstabholung in Józefosław. Nach dem Versand erscheint die Sendungsnummer auf der Auftragsseite und in der Nachricht. Für die Selbstabholung stimmen wir eine Uhrzeit ab.",
    },
  },
  {
    id: "po-zaplacie",
    temat: "realizacja",
    q: {
      pl: "Zapłaciłem, i co dalej?",
      en: "I have paid, what now?",
      de: "Ich habe bezahlt, wie geht es weiter?",
    },
    a: {
      pl: "Dostajesz maila z potwierdzeniem i prywatny odnośnik do strony statusu. Widać na niej etap pracy, a przy wysyłce także numer przesyłki. Zamówienia realizujemy w kolejności wpłat.",
      en: "You get a confirmation e-mail and a private link to the status page. It shows the stage of the work and, once shipped, the tracking number. We work in the order payments arrived.",
      de: "Sie erhalten eine Bestätigungsmail und einen privaten Link zur Statusseite. Sie zeigt den Arbeitsstand und nach dem Versand die Sendungsnummer. Wir arbeiten in der Reihenfolge der Zahlungseingänge.",
    },
  },
];

/** Pytania jednego tematu, w kolejnosci z tablicy. */
export function faqTematu(temat) {
  return FAQ.filter((f) => f.temat === temat);
}

/**
 * Wyszukiwanie po tresci, bez rozrozniania wielkosci liter i polskich znakow.
 *
 * `normalizuj` sciaga znaki diakrytyczne, bo klient szukajacy "termin
 * realizacji" wpisuje rownie czesto "termin realizacji" bez ogonkow, a pytanie
 * ktore sie nie znajduje jest z jego strony pytaniem, ktorego nie ma.
 */
export function normalizuj(tekst) {
  return String(tekst || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .toLowerCase();
}

export function szukajFaq(fraza, lang, temat = null) {
  const szukane = normalizuj(fraza).trim();
  return FAQ.filter((f) => {
    if (temat && f.temat !== temat) return false;
    if (!szukane) return true;
    return normalizuj(`${f.q[lang] || f.q.pl} ${f.a[lang] || f.a.pl}`).includes(szukane);
  });
}
