// ============================================================
// REGULAMIN KARTY PODARUNKOWEJ, SEKCJA 7a (ODLOZONE)
// ============================================================
// Gotowa tresc do wklejenia z powrotem do `src/data/termsContent.js`.
// Kazdy blok wstawia sie PRZED sekcja o numerze "8" w odpowiedniej wersji
// jezykowej. Kolejnosc blokow ponizej: pl, en, de.
//
// Do definicji w sekcji 2 trzeba dopisac dwa pojecia, na koncu listy
// wypunktowanej, tuz za "Towar na zamowienie" / "Made-to-order goods" /
// "Ware nach Kundenspezifikation". Sa na koncu tego pliku.
//
// Po wklejeniu: `node scripts/check-terms-parity.mjs` musi przejsc, a
// TERMS_EFFECTIVE_DATE trzeba podniesc na dzien wejscia w zycie.
//
// UWAGA co do tresci: ustep o waznosci NIE zawiera klauzuli o przepadku
// niewykorzystanych srodkow i ma jej nie zawierac. Powod w README.md.

// ---------------------------------------------------------------- pl
      {
        n: "7a",
        title: "Karty podarunkowe",
        items: [
          "Karta podarunkowa jest bonem różnego przeznaczenia w rozumieniu art. 2 pkt 44 ustawy o podatku od towarów i usług. Uprawnia do zapłaty za wyroby i usługi z oferty Sprzedawcy do wysokości salda Karty. Karta nie jest instrumentem płatniczym, kartą płatniczą ani pieniądzem elektronicznym.",
          "Karta jest wydawana na okaziciela. Sprzedawca realizuje Kartę na rzecz osoby, która poda jej numer, i nie bada, czy osoba ta jest Nabywcą ani czy otrzymała Kartę od uprawnionego. Numer Karty należy chronić tak jak gotówkę.",
          "Nominał Karty ustala Nabywca w przedziale od 100 zł do 10 000 zł. Karta wyrażona jest w złotych polskich. Klientowi rozliczającemu się w euro kwotę przelicza się po kursie stosowanym w Serwisie w dniu zamówienia.",
          "Nabycie Karty następuje na podstawie zamówienia złożonego za pośrednictwem formularza w Serwisie. Sprzedawca przesyła dane do przelewu, a Kartę wydaje po zaksięgowaniu wpłaty, pocztą elektroniczną na adres wskazany przez Nabywcę, wraz z numerem, kwotą, datą ważności oraz treścią niniejszej sekcji.",
          "Karta jest ważna 12 miesięcy od dnia jej wydania. Data ważności jest wskazana na Karcie i możliwa do sprawdzenia w Serwisie. Po upływie tego terminu Kartą nie można bezpośrednio opłacić zamówienia.",
          "Upływ terminu ważności nie powoduje przepadku niewykorzystanych środków. Posiadacz Karty może w każdym czasie zwrócić się na adres contact@aejaca.com o przedłużenie ważności Karty albo o wydanie nowej Karty na pozostałą kwotę, a jeżeli tego zażąda, o zwrot niewykorzystanych środków. Sprzedawca nie zatrzymuje kwot wpłaconych na Kartę i nieodebranych w towarze ani w usłudze.",
          "Kartą można zapłacić za dowolne wyroby i usługi z aktualnej oferty Sprzedawcy, w tym za koszt dostawy. Karta nie służy do nabycia innej Karty podarunkowej.",
          "Kartę można wykorzystać wielokrotnie, aż do wyczerpania salda. Jeżeli wartość zamówienia jest niższa od salda Karty, różnica pozostaje na Karcie do wykorzystania w okresie jej ważności. Jeżeli wartość zamówienia przekracza saldo Karty, różnicę Klient dopłaca dowolną dostępną metodą płatności.",
          "Kartę można łączyć z kodem rabatowym w jednym zamówieniu. Kwotę do zapłaty ustala się w następującej kolejności:",
          [
            "rabat obniża wartość objętych nim pozycji zamówienia,",
            "do tak ustalonej kwoty dolicza się koszt dostawy,",
            "od sumy odejmuje się saldo Karty, nie więcej niż do zera.",
          ],
          "Karta nie podlega wymianie na środki pieniężne, w całości ani w części. Sprzedawca nie wypłaca reszty w gotówce ani przelewem.",
          "Nabywca będący Konsumentem może odstąpić od umowy nabycia Karty w terminie 14 dni od dnia jej wydania, bez podania przyczyny, o ile Karta nie została wykorzystana choćby w części. Oświadczenie wystarczy przesłać na adres contact@aejaca.com. Sprzedawca zwraca całą wpłaconą kwotę w terminie 14 dni i unieważnia Kartę.",
          "Zapłata Kartą nie ogranicza uprawnień Konsumenta opisanych w sekcjach 10 i 11. W razie odstąpienia od umowy sprzedaży opłaconej Kartą albo uwzględnienia reklamacji Sprzedawca zwraca kwotę zapłaconą Kartą przez ponowne zasilenie jej salda, a jeżeli Karta w międzyczasie wygasła, przez wydanie nowej Karty o tej samej wartości i z nowym terminem ważności. Kwotę dopłaconą inną metodą płatności zwraca się tą samą metodą.",
          "Utratę Karty lub ujawnienie jej numeru osobie nieuprawnionej należy zgłosić na adres contact@aejaca.com. Sprzedawca blokuje Kartę i wydaje nową na pozostałe saldo, z zachowaniem pierwotnego terminu ważności. Sprzedawca nie odpowiada za wykorzystanie Karty przed otrzymaniem zgłoszenia.",
          "Sprzedawca może zablokować Kartę wydaną w wyniku błędu, oszustwa albo płatności, która została cofnięta lub nie doszła do skutku. O blokadzie informuje niezwłocznie na adres, na który Karta została wysłana.",
          "Saldo i termin ważności Karty można sprawdzić w każdej chwili na stronie aejaca.com/gift-card/, podając numer Karty. Nie wymaga to konta ani logowania.",
          "Reklamacje dotyczące Karty rozpatruje się na zasadach określonych w sekcji 11.",
        ],
      },

// ---------------------------------------------------------------- en
      {
        n: "7a",
        title: "Gift cards",
        items: [
          "A gift card is a multi-purpose voucher within the meaning of Article 2(44) of the Polish VAT Act. It entitles the holder to pay for goods and services from the Seller's offer up to the balance held on the Card. The Card is not a payment instrument, a payment card or electronic money.",
          "The Card is issued to bearer. The Seller honours the Card for whoever presents its number and does not verify whether that person is the Purchaser or received the Card from an authorised holder. The Card number should be protected in the same way as cash.",
          "The face value is set by the Purchaser between PLN 100 and PLN 10 000. The Card is denominated in Polish zloty. For Customers settling in euro the amount is converted at the rate applied in the Service on the day of the order.",
          "A Card is purchased on the basis of an order placed through the form in the Service. The Seller sends bank transfer details and issues the Card once the payment clears, by email to the address indicated by the Purchaser, together with the number, the amount, the expiry date and the text of this section.",
          "The Card is valid for 12 months from the date of issue. The expiry date is stated on the Card and can be checked in the Service. After that date the Card can no longer be used to pay for an order directly.",
          "Expiry does not cause the unused balance to be forfeited. The holder may at any time write to contact@aejaca.com to have the Card extended, to have a new Card issued for the remaining amount, or, if they so request, to have the unused balance refunded. The Seller does not keep amounts paid onto a Card that were never taken in goods or services.",
          "The Card may be used to pay for any goods and services from the Seller's current offer, including the cost of delivery. A Card may not be used to buy another gift card.",
          "The Card may be used more than once, until its balance is exhausted. Where the order is worth less than the balance, the difference remains on the Card for use within its validity period. Where the order is worth more, the Customer pays the difference by any available payment method.",
          "A Card may be combined with a discount code on a single order. The amount due is established in the following order:",
          [
            "the discount reduces the value of the order lines it covers,",
            "the cost of delivery is added to the amount so established,",
            "the balance of the Card is deducted from the total, down to zero at most.",
          ],
          "The Card is not exchangeable for cash, in whole or in part. The Seller does not pay out any remainder in cash or by transfer.",
          "A Purchaser who is a Consumer may withdraw from the contract for the purchase of a Card within 14 days of its issue, without giving a reason, provided the Card has not been used even in part. A statement sent to contact@aejaca.com is sufficient. The Seller refunds the full amount paid within 14 days and cancels the Card.",
          "Payment by Card does not limit the Consumer rights described in sections 10 and 11. Where a sale paid for by Card is withdrawn from, or a complaint is upheld, the Seller refunds the amount paid by Card by crediting its balance again, or, if the Card has expired in the meantime, by issuing a new Card of the same value with a new expiry date. Any amount paid on top by another method is refunded by that same method.",
          "Loss of a Card, or disclosure of its number to an unauthorised person, should be reported to contact@aejaca.com. The Seller blocks the Card and issues a new one for the remaining balance, keeping the original expiry date. The Seller is not liable for use of the Card before the report is received.",
          "The Seller may block a Card issued as a result of an error, fraud, or a payment that has been reversed or never completed. The Seller notifies the block without delay to the address the Card was sent to.",
          "The balance and expiry date of a Card can be checked at any time at aejaca.com/gift-card/ by entering the Card number. No account or login is required.",
          "Complaints concerning a Card are handled under the rules set out in section 11.",
        ],
      },

// ---------------------------------------------------------------- de
      {
        n: "7a",
        title: "Geschenkkarten",
        items: [
          "Die Geschenkkarte ist ein Mehrzweckgutschein im Sinne von Art. 2 Nr. 44 des polnischen Umsatzsteuergesetzes. Sie berechtigt zur Zahlung für Waren und Leistungen aus dem Angebot des Verkäufers bis zur Höhe des Kartenguthabens. Die Karte ist kein Zahlungsinstrument, keine Zahlungskarte und kein E-Geld.",
          "Die Karte lautet auf den Inhaber. Der Verkäufer löst die Karte zugunsten derjenigen Person ein, die ihre Nummer angibt, und prüft nicht, ob diese Person der Käufer ist oder die Karte von einem Berechtigten erhalten hat. Die Kartennummer ist wie Bargeld zu schützen.",
          "Den Nennwert legt der Käufer zwischen 100 PLN und 10 000 PLN fest. Die Karte lautet auf polnische Zloty. Für Kunden, die in Euro abrechnen, wird der Betrag zu dem im Service am Bestelltag angewandten Kurs umgerechnet.",
          "Der Erwerb erfolgt auf Grundlage einer über das Formular im Service abgegebenen Bestellung. Der Verkäufer übersendet die Überweisungsdaten und stellt die Karte nach Zahlungseingang aus, per E-Mail an die vom Käufer angegebene Adresse, zusammen mit Nummer, Betrag, Ablaufdatum und dem Text dieses Abschnitts.",
          "Die Karte ist 12 Monate ab Ausstellung gültig. Das Ablaufdatum steht auf der Karte und lässt sich im Service prüfen. Nach Ablauf kann mit der Karte keine Bestellung mehr unmittelbar bezahlt werden.",
          "Der Ablauf führt nicht zum Verfall des Restguthabens. Der Inhaber kann sich jederzeit unter contact@aejaca.com melden, um die Gültigkeit verlängern zu lassen, eine neue Karte über den Restbetrag zu erhalten oder, auf Wunsch, das nicht genutzte Guthaben erstattet zu bekommen. Der Verkäufer behält keine auf eine Karte gezahlten Beträge ein, die nicht in Waren oder Leistungen abgerufen wurden.",
          "Mit der Karte können beliebige Waren und Leistungen aus dem aktuellen Angebot des Verkäufers bezahlt werden, einschließlich der Lieferkosten. Mit einer Karte kann keine weitere Geschenkkarte erworben werden.",
          "Die Karte kann mehrfach genutzt werden, bis das Guthaben aufgebraucht ist. Liegt der Bestellwert unter dem Guthaben, verbleibt die Differenz für die Restlaufzeit auf der Karte. Liegt der Bestellwert darüber, zahlt der Kunde die Differenz mit einer beliebigen verfügbaren Zahlungsart.",
          "Die Karte lässt sich in einer Bestellung mit einem Rabattcode kombinieren. Der Zahlbetrag wird in folgender Reihenfolge ermittelt:",
          [
            "der Rabatt mindert den Wert der von ihm erfassten Bestellpositionen,",
            "auf den so ermittelten Betrag werden die Lieferkosten aufgeschlagen,",
            "von der Summe wird das Kartenguthaben abgezogen, höchstens bis auf null.",
          ],
          "Die Karte wird weder ganz noch teilweise in Bargeld umgetauscht. Der Verkäufer zahlt kein Restguthaben in bar oder per Überweisung aus.",
          "Ein Käufer, der Verbraucher ist, kann binnen 14 Tagen ab Ausstellung ohne Angabe von Gründen vom Kaufvertrag über die Karte zurücktreten, sofern die Karte nicht einmal teilweise genutzt wurde. Eine Erklärung an contact@aejaca.com genügt. Der Verkäufer erstattet den gesamten gezahlten Betrag binnen 14 Tagen und annulliert die Karte.",
          "Die Zahlung mit Karte schränkt die in den Abschnitten 10 und 11 beschriebenen Verbraucherrechte nicht ein. Bei Widerruf eines mit Karte bezahlten Kaufvertrags oder bei begründeter Reklamation erstattet der Verkäufer den mit der Karte gezahlten Betrag durch erneute Gutschrift auf der Karte, oder, falls die Karte zwischenzeitlich abgelaufen ist, durch Ausstellung einer neuen Karte gleichen Werts mit neuem Ablaufdatum. Ein zusätzlich mit anderer Zahlungsart gezahlter Betrag wird über dieselbe Zahlungsart erstattet.",
          "Der Verlust der Karte oder die Preisgabe ihrer Nummer an eine unbefugte Person ist an contact@aejaca.com zu melden. Der Verkäufer sperrt die Karte und stellt eine neue über das Restguthaben aus, unter Beibehaltung des ursprünglichen Ablaufdatums. Für eine Nutzung vor Eingang der Meldung haftet der Verkäufer nicht.",
          "Der Verkäufer kann eine Karte sperren, die aufgrund eines Fehlers, eines Betrugs oder einer rückgängig gemachten beziehungsweise nicht zustande gekommenen Zahlung ausgestellt wurde. Über die Sperre informiert er unverzüglich an die Adresse, an die die Karte gesendet wurde.",
          "Guthaben und Ablaufdatum lassen sich jederzeit unter aejaca.com/gift-card/ durch Eingabe der Kartennummer prüfen. Ein Konto oder eine Anmeldung ist dafür nicht erforderlich.",
          "Reklamationen zur Karte werden nach den Regeln des Abschnitts 11 behandelt.",
        ],
      },

// ---------------------------------------------------------- definicje (sekcja 2)
/*
            "Karta podarunkowa - bon różnego przeznaczenia uprawniający do zapłaty za wyroby i usługi z oferty Sprzedawcy, na zasadach określonych w sekcji 7a.",
            "Nabywca - osoba, która nabywa Kartę podarunkową; nie musi być tożsama z osobą, która z Karty korzysta.",
            "Gift card - a multi-purpose voucher entitling the holder to pay for goods and services from the Seller's offer, on the terms set out in section 7a.",
            "Purchaser - the person who buys a Gift card; not necessarily the same person as the one who uses it.",
            "Geschenkkarte - ein Mehrzweckgutschein, der zur Zahlung für Waren und Leistungen aus dem Angebot des Verkäufers berechtigt, nach den Regeln in Abschnitt 7a.",
            "Käufer - die Person, die eine Geschenkkarte erwirbt; nicht zwingend dieselbe Person, die sie einlöst.",
*/
