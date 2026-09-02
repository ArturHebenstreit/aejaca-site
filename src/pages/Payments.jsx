// ============================================================
// PROCES PLATNOSCI
// ============================================================
// Strona istnieje po to, zeby MIEC DOKAD ODESLAC klienta, ktory pyta "jak to
// dziala". Do tej pory odpowiedz byla rozsypana po regulaminie, stronie oferty
// i mailach, wiec za kazdym razem skladal ja czlowiek od nowa.
//
// Zasada redakcyjna: schemat, nie proza. Klient ma przebiec wzrokiem kroki
// i znalezc swoj przypadek, a nie czytac akapit o filozofii platnosci.
//
// Liczby i metody MUSZA zgadzac sie z kodem. Narzut kursowy bierzemy
// z `src/pricing/currency.js`, a nie z pamieci, bo to jedna z tych wartosci,
// ktore rozjezdzaja sie po cichu i klient widzi inna kwote niz zaplaci.

import { Link } from "../i18n/nav.jsx";
import { ShoppingBag, FileText, Wallet, Globe, Coins, TrendingUp, Clock, ShieldCheck, AlertTriangle, RotateCcw, ArrowRight, Hammer } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE, adresStrony } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import PolicyLinks from "../components/PolicyLinks.jsx";
import FaqLista from "../components/FaqLista.jsx";
import SpisTresci from "../components/SpisTresci.jsx";
import SKLEP from "../data/faq/sklep.js";
import { EUR_FX_MARGIN } from "../pricing/currency.js";
import { TRANSFER_HOLD_BUSINESS_DAYS } from "../pricing/businessDays.js";

/** Narzut kursowy jako procent, liczony z tej samej stalej co kasa. */
const FX_PCT = Math.round((EUR_FX_MARGIN - 1) * 100);

const L = {
  pl: {
    tag: "Płatności",
    title: "Proces płatności",
    description: "Jak płacisz za zamówienie w AEJaCA: krok po kroku, z czego składa się kwota, jakie są metody i co dzieje się po zapłacie.",
    pathsTitle: "Dwie drogi do zapłaty",
    flowTitle: "Co dzieje się po kliknięciu „zapłać”",
    flowLead: "Waluta wybiera drogę. Kwota jest ta sama, różni się to, kiedy pieniądze do nas docierają i kiedy zaczynamy pracę.",
    flowPlnTitle: "Płacisz w złotych",
    flowPln: [
      ["Składasz zamówienie", "teraz"],
      ["Bramka: BLIK albo przelew online", "teraz"],
      ["Potwierdzenie wraca do nas", "kilka sekund"],
      ["Zamówienie trafia do pracowni", "od razu"],
    ],
    flowEurTitle: "Płacisz w euro",
    flowEur: [
      ["Składasz zamówienie, kwota i kurs zamrożone", "teraz"],
      ["Dostajesz numer rachunku i tytuł przelewu", "teraz, także mailem"],
      ["Robisz przelew SEPA w swoim banku", "Twój bank"],
      ["Księgujemy wpłatę ręcznie", "zwykle następny dzień roboczy"],
      ["Zamówienie trafia do pracowni", "po zaksięgowaniu"],
    ],
    flowHold: "Kwota w euro i kurs obowiązują {days} dni robocze od złożenia zamówienia. Termin realizacji liczymy od zaksięgowania wpłaty, nie od kliknięcia.",
    pathsLead: "Wszystko, co u nas kupujesz, idzie jedną z dwóch dróg. Reszta strony opisuje obie.",
    pathA: "Kupujesz sam, w sklepie albo w kalkulatorze",
    pathADesc: "Cenę liczy nasz kalkulator albo bierze ją z karty produktu. Płacisz od razu.",
    pathB: "Masz od nas ofertę z numerem",
    pathBDesc: "Cenę ustaliliśmy z Tobą mailem albo w rozmowie. Dostajesz numer i płacisz za tę konkretną ofertę.",
    shopTitle: "Droga A: zakup w sklepie",
    shopSteps: [
      ["Wybierasz", "Produkt z półki albo usługę wycenioną w kalkulatorze. Kalkulator pokazuje widełki, a pod nimi kwotę wiążącą."],
      ["Koszyk", "Możesz zebrać kilka pozycji. Kwoty w koszyku są informacyjne."],
      ["Dane i dostawa", "Podajesz adres albo paczkomat. Koszt dostawy dolicza nasz serwer z własnego cennika."],
      ["Kod rabatowy", "Jeżeli masz kod, wpisujesz go w polu pod podsumowaniem. Zniżkę widzisz przed zapłatą."],
      ["Płatność", "Przechodzisz do operatora płatności i wybierasz BLIK albo swój bank."],
      ["Potwierdzenie", "Wracasz na stronę statusu zamówienia. Potwierdzenie przychodzi też mailem."],
    ],
    offerTitle: "Droga B: zapłata za ofertę z numerem",
    offerLead: "Tą drogą płacisz, gdy cenę ustaliliśmy z Tobą mailem albo przez telefon. Kalkulator jej nie policzy, bo to praca opisana słowami, a nie wybrana z listy.",
    offerSteps: [
      ["Dostajesz numer", "Każde zapytanie dostaje numer w postaci WY20260826-A1B2C3D4 od razu, jeszcze zanim wpiszemy kwoty. Tym numerem nazywamy wątek w korespondencji."],
      ["Otwierasz ofertę", "Dwie możliwości. Klikasz link z naszego maila, albo wpisujesz sam numer: na stronie oferty, na stronie sklepu, albo w koszyku."],
      ["Potwierdzasz, że to Ty", "Link z maila o nic nie pyta. Wchodząc z samego numeru, podajesz jeszcze adres e-mail, na który poszła oferta. Jeżeli rozmawialiśmy przez telefon i adres nie padł, podajesz krótki kod odbioru, który podaliśmy w rozmowie."],
      ["Widzisz ofertę", "Pozycje, kwoty jednostkowe, nasza notatka co wchodzi w zakres, i termin ważności. Jeżeli przygotowaliśmy kilka wariantów do wyboru, zaznaczasz jeden, a kwota do zapłaty dopasowuje się do niego. Wybór możesz zmienić aż do zapłaty i tylko wybrany wariant trafia do zamówienia."],
      ["Kod rabatowy", "Wpisujesz go tutaj, przed zapłatą. Kwota schodzi od razu, nie zwracamy różnicy po fakcie."],
      ["Dane wysyłki", "Adres albo paczkomat. Koszt dostawy dolicza serwer, tak samo jak w sklepie."],
      ["Płatność", "Ten sam operator i te same metody co w sklepie. Tytułem płatności jest numer oferty, więc wpłata zawsze wskazuje pracę, której dotyczy."],
    ],
    goOffer: "Przejdź do zapłaty za ofertę",
    goOfferNote: "Tutaj podajesz numer oferty. Jeżeli masz link z naszego maila, możesz kliknąć jego i pominąć wpisywanie.",
    whyNumber: "Dlaczego sam numer nie wystarcza",
    whyNumberBody: "Oferta niesie Twoje nazwisko, telefon i adres. Gdyby wystarczał sam numer, każdy, kto zobaczyłby go przez ramię, zobaczyłby też te dane. Dlatego wejście z numeru zawsze pyta o jedną rzecz więcej.",
    sumTitle: "Z czego składa się kwota",
    sumRows: [
      ["Pozycje zlecenia", "To, co robimy albo wysyłamy."],
      ["Dostawa", "Według wybranej metody. Odbiór osobisty kosztuje zero."],
      ["Rabat", "Odejmowany, jeżeli kod rabatowy jest ważny."],
      ["Do zapłaty", "Pozycje plus dostawa, minus rabat."],
    ],
    sumRules: [
      "Kwotę wiążącą liczy zawsze nasz serwer. Cena z przeglądarki nie jest brana pod uwagę, także wtedy, gdy ktoś spróbuje ją podmienić.",
      "Rabat obejmuje wyłącznie pozycje zlecenia. Nigdy nie schodzi z kosztu dostawy.",
      "Rabat nie zejdzie poniżej zera. Kod wyższy od wartości zamówienia obniża je do zera, nie tworzy nadpłaty.",
      "Jeden kod na zamówienie.",
    ],
    plTitle: "Płatność z Polski, w złotych",
    plLead: "Tak wygląda zapłata, kiedy rozliczasz się w złotych. To domyślna waluta polskiej wersji strony, ale wybierasz ją sam: walutę przestawisz w menu języka, w kasie i na stronie oferty, niezależnie od tego, w jakim języku czytasz.",
    plRows: [
      ["BLIK", "Kod z aplikacji banku. Najszybsza droga."],
      ["Szybki przelew online", "Ponad dwadzieścia polskich banków. Na wierzchu jest BLIK, banki chowają się pod jednym wierszem z wyszukiwarką, żeby nie trzeba było przewijać długiej listy."],
    ],
    plNote: "Płatność potwierdza się od razu i od razu ruszamy z pracą. Towar rezerwujemy na 20 minut, czyli na czas potrzebny do dokończenia płatności. Porzucony koszyk nic nie zabiera: rezerwacja wygasa sama.",
    euTitle: "Płatność z zagranicy, w euro",
    euLead: "Tak wygląda zapłata, kiedy rozliczasz się w euro. To domyślna waluta wersji angielskiej i niemieckiej, ale wybrać ją może każdy. Należność rozliczamy przelewem SEPA na nasze konto w euro.",
    euRows: [
      ["Przelew SEPA", "Numer rachunku pokazujemy po złożeniu zamówienia i wysyłamy mailem. Tytułem przelewu jest numer zamówienia."],
      ["BLIK albo polski bank, jeżeli wolisz", "Płatność natychmiastową da się wybrać także na tych wersjach strony. Ma to sens, gdy masz polskie konto: rozliczenie idzie wtedy w złotych, tak jak wyżej."],
      ["Gdy wpłynie inna kwota", "Drobną różnicę na minus, zwykle prowizję banku pośredniczącego, bierzemy na siebie i zamówienie rusza normalnie. Przy większej różnicy piszemy z prośbą o dopłatę i czekamy trzy dni; jeżeli nie dotrze, zamykamy zamówienie i odsyłamy otrzymaną kwotę na rachunek nadawcy. Nadwyżkę zwracamy tą samą drogą, a realizacja rusza od razu."],
    ],
    euNote: "Wpływ przelewu potwierdzamy ręcznie, bo przelew zagraniczny nie wraca do nas automatycznie. Kwota i rezerwacja towaru obowiązują 3 dni robocze. Jeżeli czwartego dnia roboczego wpłata nie jest zaksięgowana, rezerwacja spada, a towar wraca do sprzedaży. Termin realizacji liczymy od zaksięgowania, nie od złożenia zamówienia.",
    euFxTitle: "Skąd bierze się kwota w euro",
    euFx: [
      "Kwota powstaje z ceny złotowej po kursie Narodowego Banku Polskiego, powiększonym o {fx} procent.",
      "Ten narzut nie jest ukrytą marżą. Między zamrożeniem kwoty a zaksięgowaniem przelewu mijają dni, a kurs w tym czasie się rusza. Narzut pokrywa tę różnicę i koszt przewalutowania po naszej stronie.",
      "Kwotę w euro i kurs zamrażamy w chwili składania zamówienia. Późniejszy ruch kursu nie zmienia tego, ile masz przelać.",
    ],
    noMethods: "Niezależnie od wersji strony: nie ma płatności kartą, Google Pay, Apple Pay ani za pobraniem. Odbiór osobisty jest bezpłatny, ale sama zapłata i tak idzie jedną z dróg powyżej.",
    metalTitle: "Kruszec a termin ważności",
    metalLead: "Złoto i platyna potrafią ruszyć się o kilka procent w dwa tygodnie. Dlatego „ważne przez X dni” znaczy co innego przy każdej z trzech dróg i warto wiedzieć, która dotyczy Ciebie.",
    metalRows: [
      ["Kwota wiążąca w kalkulatorze", "Ważna 7 dni. Zwykle płacisz od razu, więc kruszec nie zdąży się ruszyć."],
      ["Zapisana wycena z kalkulatora", "Robocizna jest wiążąca przez cały okres ważności. Kruszec liczymy z dnia, w którym otwierasz link. Doliczamy wyłącznie różnicę wynikającą z ruchu kursu metalu, nigdy zmiany naszego cennika, więc obiecana praca zostaje w obiecanej cenie. Dotyczy to wyrobów z kruszcu; przy druku i laserze nie ma czego przeliczać. Po terminie ważności nie przeliczamy już nic, bo wycena wygasła."],
      ["Oferta ustalona z człowiekiem", "Kwotę wpisaliśmy ręcznie, więc jest stała do daty podanej w ofercie, niezależnie od tego, co zrobi kurs. Ryzyko ruchu kruszcu bierzemy w tym czasie na siebie i dlatego przy złocie ta data bywa bliższa."],
    ],
    metalNote: "Domyślnie oferta wiąże nas 7 dni od wystawienia, ale termin ustalamy osobno dla każdej i podajemy go w niej wprost. Przy wyrobie, w którym kruszec jest główną składową ceny, bywa krótszy. Dlatego liczba z tej strony jest tylko punktem wyjścia: obowiązuje data wpisana w Twojej ofercie. Po tej dacie nie przedłużamy starej oferty, tylko wystawiamy nową, i to jest dokładnie ten powód: przez ten czas metal mógł się ruszyć.",
    timeTitle: "Terminy",
    timeRows: [
      ["Rezerwacja towaru, płatność z Polski", "20 minut"],
      ["Rezerwacja towaru, przelew w euro z zagranicy", "3 dni robocze, czwartego towar wraca do sprzedaży"],
      ["Ważność oferty ustalonej z człowiekiem", "domyślnie 7 dni, obowiązuje data podana w Twojej ofercie"],
      ["Ważność kwoty wiążącej z kalkulatora", "7 dni, kruszec z dnia zamówienia"],
    ],
    timeNote: "Po terminie ważności oferta nie przyjmuje zapłaty. Wystawiamy nową, nie przedłużamy starej, bo w międzyczasie mogły zmienić się ceny materiałów.",
    spis: [
      { id: "drogi", label: "Dwie drogi" },
      { id: "sklep", label: "Sklep" },
      { id: "oferta", label: "Oferta" },
      { id: "kwota", label: "Kwota" },
      { id: "metody", label: "Metody" },
      { id: "kruszec", label: "Kruszec" },
      { id: "terminy", label: "Terminy" },
      { id: "klopoty", label: "Gdy coś nie tak" },
      { id: "faq", label: "FAQ" },
    ],
    afterTitle: "Co dzieje się po zapłacie",
    afterBody: "Zapłata kończy tę stronę i zaczyna następną. Etapy pracy, sposób liczenia terminu, wiadomości od nas i odbiór gotowej rzeczy opisuje osobny rozdział, żeby dojście do nich nie wymagało przewijania całego opisu płatności.",
    afterCta: "Proces realizacji",
    afterCheck: "Sprawdź swoje zamówienie",
    faqTitle: "Najczęstsze pytania o płatność i oferty",
    faqMore: "Wszystkie pytania i odpowiedzi",
    safeTitle: "Bezpieczeństwo",
    safeRows: [
      "Danych Twojej karty ani hasła do banku nigdy nie widzimy. Płacisz na stronie operatora, nie u nas.",
      "Kwotę wiążącą liczy serwer, więc nie da się jej podmienić po drodze.",
      "Status opłaconego zamówienia jest nieodwracalny: późniejsza nieudana próba go nie cofa.",
      "Pełny status zamówienia wymaga prywatnego odnośnika. Sam numer go nie otwiera.",
    ],
    troubleTitle: "Gdy coś pójdzie nie tak",
    troubleRows: [
      ["Płatność nie doszła do skutku", "Nic nie zostało pobrane. Na stronie statusu masz przycisk, który ponawia płatność na tym samym zamówieniu. Nie powstaje przez to drugie zamówienie."],
      ["Płatność wymaga naszej weryfikacji", "Zdarza się, gdy wpłata przyszła po zamknięciu zamówienia albo w innej kwocie. Nie płać drugi raz. Sprawdzamy to ręcznie i odzywamy się."],
      ["Nie mam już linku do oferty", "Wpisz sam numer oferty w sklepie, w koszyku albo na stronie oferty i potwierdź adresem e-mail."],
      ["Chcę zrezygnować", "Napisz do nas. Zasady zwrotu opisuje osobny dokument."],
    ],
    refundTitle: "Zwrot pieniędzy",
    refundBody: "Konsument ma 14 dni od odebrania przesyłki na odstąpienie od umowy bez podania przyczyny. Zwracamy wszystkie płatności, w tym koszt najtańszej oferowanej dostawy. Wyjątki i pełne zasady stoją w polityce zwrotów i w regulaminie.",
    refundLink: "Polityka zwrotów",
    contact: "Masz pytanie, na które ta strona nie odpowiada? Napisz do nas.",
    contactLink: "Kontakt",
  },

  en: {
    tag: "Payments",
    title: "How payment works",
    description: "Paying for an AEJaCA order step by step: what the amount is made of, which methods exist and what happens once you have paid.",
    pathsTitle: "Two ways to pay",
    flowTitle: "What happens after you press pay",
    flowLead: "The currency picks the route. The amount is the same; what differs is when the money reaches us and when we start work.",
    flowPlnTitle: "Paying in złoty",
    flowPln: [
      ["You place the order", "now"],
      ["Gateway: BLIK or an online transfer", "now"],
      ["The confirmation reaches us", "seconds"],
      ["The order goes to the workshop", "straight away"],
    ],
    flowEurTitle: "Paying in euro",
    flowEur: [
      ["You place the order, amount and rate locked", "now"],
      ["You get the account number and the payment title", "now, also by email"],
      ["You make the SEPA transfer in your bank", "your bank"],
      ["We book the payment by hand", "usually the next working day"],
      ["The order goes to the workshop", "once booked"],
    ],
    flowHold: "The euro amount and the rate hold for {days} business days from placing the order. The lead time runs from the money clearing, not from the click.",
    pathsLead: "Everything you buy from us goes down one of two routes. The rest of this page describes both.",
    pathA: "You buy on your own, in the shop or the calculator",
    pathADesc: "The price comes from our calculator or from the product page. You pay straight away.",
    pathB: "You have an offer from us, with a number",
    pathBDesc: "We agreed the price with you by e-mail or on the phone. You get a number and pay for that particular offer.",
    shopTitle: "Route A: buying in the shop",
    shopSteps: [
      ["You choose", "A product off the shelf or a service priced in the calculator. The calculator shows a range, and a binding amount beneath it."],
      ["Cart", "You can collect several items. Amounts in the cart are indicative."],
      ["Details and delivery", "You give an address or a locker. Our server adds the delivery cost from its own price list."],
      ["Discount code", "If you have one, enter it in the field under the order summary. You see the discount before you pay."],
      ["Payment", "You move to the payment provider and choose BLIK or your bank."],
      ["Confirmation", "You come back to the order status page. A confirmation also arrives by e-mail."],
    ],
    offerTitle: "Route B: paying for an offer by its number",
    offerLead: "This route is for prices we agreed with you by e-mail or on the phone. The calculator cannot produce them, because the work is described in words rather than picked from a list.",
    offerSteps: [
      ["You get a number", "Every enquiry gets a number like WY20260826-A1B2C3D4 straight away, before we enter any amounts. We use that number to name the thread in our correspondence."],
      ["You open the offer", "Two ways. Click the link in our e-mail, or type the number alone: on the offer page, on the shop page, or in the cart."],
      ["You confirm it is you", "The link from the e-mail asks nothing. Entering the number alone, you also give the e-mail address the offer was sent to. If we spoke on the phone and you left no address, you give the short pickup code we read out to you."],
      ["You see the offer", "The items, unit amounts, our note on what is and is not included, and the expiry date. If we prepared several variants to choose from, you tick one and the amount to pay follows it. You can change the choice until you pay, and only the chosen variant becomes the order."],
      ["Discount code", "You enter it here, before paying. The amount drops immediately; we never refund the difference afterwards."],
      ["Delivery details", "An address or a locker. The server adds the delivery cost, exactly as in the shop."],
      ["Payment", "The same provider and the same methods as the shop. The payment reference is the offer number, so a transfer always points to the work it pays for."],
    ],
    goOffer: "Go and pay for your offer",
    goOfferNote: "This is where you enter the offer number. If you still have the link from our e-mail, click that instead and skip the typing.",
    whyNumber: "Why the number alone is not enough",
    whyNumberBody: "An offer carries your name, phone number and address. If the number alone were enough, anyone who saw it over your shoulder would see those details too. That is why entering the number always asks for one more thing.",
    sumTitle: "What the amount is made of",
    sumRows: [
      ["Order items", "What we make or send."],
      ["Delivery", "By the method you choose. Personal pickup costs nothing."],
      ["Discount", "Subtracted if you gave a valid code."],
      ["To pay", "Items plus delivery, minus the discount."],
    ],
    sumRules: [
      "The binding amount is always calculated by our server. A price coming from the browser is never trusted, including when someone tries to change it.",
      "A discount applies to the order items only. It never comes off the delivery cost.",
      "A discount never goes below zero. A code larger than the order brings it to zero, it does not create a credit.",
      "One code per order.",
    ],
    plTitle: "Paying from Poland, in złoty",
    plLead: "This is how payment works when you settle in złoty. It is the default on the Polish version, but the choice is yours: switch the currency in the language menu, at checkout or on the offer page, whatever language you read in.",
    plRows: [
      ["BLIK", "A code from your banking app. The fastest route."],
      ["Instant bank transfer", "Over twenty Polish banks. BLIK sits on top and the banks hide behind one row with a search box, so nobody has to scroll a long list."],
    ],
    plNote: "The payment confirms immediately and we start work immediately. Goods are reserved for 20 minutes, the time needed to finish paying. An abandoned cart takes nothing: the reservation expires on its own.",
    euTitle: "Paying from abroad, in euro",
    euLead: "This is how payment works when you settle in euro. It is the default on the English and German versions, but anyone can choose it. We settle by SEPA transfer to our euro account.",
    euRows: [
      ["SEPA transfer", "We show the account number once the order is placed and send it by e-mail. The payment reference is the order number."],
      ["BLIK or a Polish bank, if you prefer", "Instant payment can be chosen on these versions too. It makes sense if you hold a Polish account: settlement then runs in złoty, as above."],
      ["If a different amount arrives", "A small shortfall, usually a fee taken by an intermediary bank, we cover ourselves and the order proceeds as normal. For a larger difference we write asking for a top-up and wait three days; if it does not arrive, we close the order and send the received amount back to the sender's account. A surplus goes back the same way, and the work starts right away."],
    ],
    euNote: "We confirm an incoming transfer by hand, because a foreign transfer does not report back to us automatically. The amount and the reservation hold for 3 business days. If the payment has not cleared by the fourth business day, the reservation is released and the goods go back on sale. The lead time runs from the money clearing, not from the order being placed.",
    euFxTitle: "Where the euro amount comes from",
    euFx: [
      "The amount comes from the złoty price at the National Bank of Poland rate, increased by {fx} percent.",
      "That markup is not a hidden margin. Days pass between freezing the amount and the transfer clearing, and the rate moves in the meantime. The markup covers that difference and the cost of the conversion on our side.",
      "We freeze the euro amount and the rate at the moment the order is placed. A later move in the rate does not change what you have to send.",
    ],
    noMethods: "Whichever version of the site you use: there are no card payments, no Google Pay, no Apple Pay and no cash on delivery. Personal pickup is free, but the payment itself still goes one of the routes above.",
    metalTitle: "Precious metal and the expiry date",
    metalLead: "Gold and platinum can move several percent in a fortnight. That is why \"valid for X days\" means something different on each of the three routes, and it is worth knowing which one applies to you.",
    metalRows: [
      ["A binding calculator amount", "Valid 7 days. You normally pay straight away, so the metal has no time to move."],
      ["A saved calculator quote", "The labour is binding for the whole validity period. The metal is priced on the day you open the link. We add only the difference that comes from the metal rate moving, never from a change in our own price list, so promised work stays at the promised price. This applies to metal pieces; there is nothing to reprice on printing or laser work. Past the expiry date we reprice nothing, because the quote has lapsed."],
      ["An offer agreed with a person", "We typed the amount by hand, so it is fixed until the date given on the offer, whatever the rate does. We carry the metal risk during that time, which is why on gold that date tends to be nearer."],
    ],
    metalNote: "By default an offer binds us for 7 days from issue, but we set the expiry date separately for every offer and state it on the offer itself. On a piece where the metal is the main part of the price it tends to be shorter. So the number on this page is only a starting point: the date written on your offer is the one that counts. Past that date we issue a new offer rather than extending the old one, and this is exactly the reason: the metal may have moved.",
    timeTitle: "Deadlines",
    timeRows: [
      ["Goods reserved, paying from Poland", "20 minutes"],
      ["Goods reserved, euro transfer from abroad", "3 business days; on the fourth the goods go back on sale"],
      ["Validity of an offer agreed with a person", "7 days by default, the date given on your offer applies"],
      ["Validity of a binding calculator amount", "7 days; metal priced on the day of ordering"],
    ],
    timeNote: "Past its expiry date an offer takes no payment. We issue a new one rather than extending the old, because material prices may have moved in the meantime.",
    spis: [
      { id: "drogi", label: "Two routes" },
      { id: "sklep", label: "Shop" },
      { id: "oferta", label: "Offer" },
      { id: "kwota", label: "The amount" },
      { id: "metody", label: "Methods" },
      { id: "kruszec", label: "Metal" },
      { id: "terminy", label: "Validity" },
      { id: "klopoty", label: "If it goes wrong" },
      { id: "faq", label: "FAQ" },
    ],
    afterTitle: "What happens once you have paid",
    afterBody: "Payment ends this page and starts the next one. The stages of work, how the delivery date is counted, when we write and how you collect the finished piece are on a page of their own, so reaching them does not mean scrolling through the whole payment story.",
    afterCta: "How we make your order",
    afterCheck: "Check your order",
    faqTitle: "Common questions about payment and offers",
    faqMore: "All questions and answers",
    safeTitle: "Security",
    safeRows: [
      "We never see your card details or your banking password. You pay on the provider's site, not on ours.",
      "The binding amount is calculated on the server, so it cannot be swapped in transit.",
      "The status of a paid order is irreversible: a later failed attempt does not undo it.",
      "The full order status requires a private link. The number alone does not open it.",
    ],
    troubleTitle: "When something goes wrong",
    troubleRows: [
      ["The payment did not go through", "Nothing was charged. The status page has a button that retries payment on the same order. It does not create a second order."],
      ["The payment needs our review", "This happens when the money arrived after the order closed, or in a different amount. Do not pay again. We check it by hand and get in touch."],
      ["I no longer have the offer link", "Type the offer number in the shop, in the cart or on the offer page, and confirm with your e-mail address."],
      ["I want to cancel", "Write to us. A separate document covers the return rules."],
    ],
    refundTitle: "Refunds",
    refundBody: "A consumer has 14 days from receiving the parcel to withdraw from the contract without giving a reason. We return all payments, including the cost of the cheapest delivery we offer. Exceptions and the full rules are in the returns policy and the terms.",
    refundLink: "Returns policy",
    contact: "A question this page does not answer? Write to us.",
    contactLink: "Contact",
  },

  de: {
    tag: "Zahlungen",
    title: "Zahlungsablauf",
    description: "Bezahlen einer AEJaCA Bestellung Schritt für Schritt: woraus der Betrag besteht, welche Methoden es gibt und was nach der Zahlung passiert.",
    pathsTitle: "Zwei Wege zur Zahlung",
    flowTitle: "Was nach dem Klick auf „bezahlen” passiert",
    flowLead: "Die Währung wählt den Weg. Der Betrag bleibt gleich; anders ist, wann das Geld bei uns ankommt und wann wir anfangen.",
    flowPlnTitle: "Zahlung in Złoty",
    flowPln: [
      ["Sie bestellen", "jetzt"],
      ["Gateway: BLIK oder Online-Überweisung", "jetzt"],
      ["Die Bestätigung erreicht uns", "Sekunden"],
      ["Die Bestellung geht in die Werkstatt", "sofort"],
    ],
    flowEurTitle: "Zahlung in Euro",
    flowEur: [
      ["Sie bestellen, Betrag und Kurs eingefroren", "jetzt"],
      ["Sie erhalten Kontonummer und Verwendungszweck", "jetzt, auch per E-Mail"],
      ["Sie überweisen per SEPA in Ihrer Bank", "Ihre Bank"],
      ["Wir buchen die Zahlung von Hand", "meist am nächsten Werktag"],
      ["Die Bestellung geht in die Werkstatt", "nach der Buchung"],
    ],
    flowHold: "Eurobetrag und Kurs gelten {days} Werktage ab Bestellung. Die Lieferzeit rechnen wir ab Zahlungseingang, nicht ab dem Klick.",
    pathsLead: "Alles, was Sie bei uns kaufen, läuft über einen von zwei Wegen. Der Rest dieser Seite beschreibt beide.",
    pathA: "Sie kaufen selbst, im Shop oder im Kalkulator",
    pathADesc: "Den Preis liefert unser Kalkulator oder die Produktseite. Sie zahlen sofort.",
    pathB: "Sie haben ein Angebot von uns, mit einer Nummer",
    pathBDesc: "Den Preis haben wir per E-Mail oder im Gespräch mit Ihnen festgelegt. Sie erhalten eine Nummer und zahlen für dieses Angebot.",
    shopTitle: "Weg A: Kauf im Shop",
    shopSteps: [
      ["Sie wählen", "Ein Produkt aus dem Regal oder eine im Kalkulator kalkulierte Leistung. Der Kalkulator zeigt eine Spanne und darunter einen verbindlichen Betrag."],
      ["Warenkorb", "Sie können mehrere Positionen sammeln. Beträge im Warenkorb sind unverbindlich."],
      ["Daten und Versand", "Sie geben eine Adresse oder eine Paketstation an. Die Versandkosten rechnet unser Server aus seiner eigenen Preisliste hinzu."],
      ["Rabattcode", "Falls vorhanden, tragen Sie ihn im Feld unter der Bestellübersicht ein. Den Rabatt sehen Sie vor der Zahlung."],
      ["Zahlung", "Sie wechseln zum Zahlungsanbieter und wählen BLIK oder Ihre Bank."],
      ["Bestätigung", "Sie kehren zur Statusseite der Bestellung zurück. Eine Bestätigung kommt zusätzlich per E-Mail."],
    ],
    offerTitle: "Weg B: Zahlung für ein Angebot mit Nummer",
    offerLead: "Dieser Weg gilt für Preise, die wir per E-Mail oder am Telefon mit Ihnen festgelegt haben. Der Kalkulator kann sie nicht liefern, weil die Arbeit in Worten beschrieben und nicht aus einer Liste gewählt wird.",
    offerSteps: [
      ["Sie erhalten eine Nummer", "Jede Anfrage bekommt sofort eine Nummer der Form WY20260826-A1B2C3D4, noch bevor wir Beträge eintragen. Mit dieser Nummer benennen wir den Vorgang in der Korrespondenz."],
      ["Sie öffnen das Angebot", "Zwei Möglichkeiten. Der Link aus unserer E-Mail, oder die Nummer allein: auf der Angebotsseite, auf der Shopseite oder im Warenkorb."],
      ["Sie bestätigen, dass Sie es sind", "Der Link aus der E-Mail fragt nichts. Bei Eingabe der Nummer geben Sie zusätzlich die E-Mail-Adresse an, an die das Angebot ging. Falls wir telefoniert haben und keine Adresse vorliegt, geben Sie den kurzen Abholcode an, den wir Ihnen genannt haben."],
      ["Sie sehen das Angebot", "Positionen, Einzelbeträge, unsere Notiz zum Umfang und das Ablaufdatum. Falls wir mehrere Varianten zur Auswahl vorbereitet haben, wählen Sie eine, und der zu zahlende Betrag folgt ihr. Die Auswahl können Sie bis zur Zahlung ändern, und nur die gewählte Variante wird zur Bestellung."],
      ["Rabattcode", "Sie geben ihn hier ein, vor der Zahlung. Der Betrag sinkt sofort; wir erstatten die Differenz nie im Nachhinein."],
      ["Versanddaten", "Adresse oder Paketstation. Die Versandkosten rechnet der Server hinzu, genau wie im Shop."],
      ["Zahlung", "Derselbe Anbieter und dieselben Methoden wie im Shop. Verwendungszweck ist die Angebotsnummer, damit eine Zahlung immer der Arbeit zuzuordnen ist."],
    ],
    goOffer: "Zum Bezahlen des Angebots",
    goOfferNote: "Hier geben Sie die Angebotsnummer ein. Wenn Sie den Link aus unserer E-Mail noch haben, klicken Sie diesen und sparen sich die Eingabe.",
    whyNumber: "Warum die Nummer allein nicht genügt",
    whyNumberBody: "Ein Angebot enthält Ihren Namen, Ihre Telefonnummer und Ihre Adresse. Würde die Nummer allein genügen, sähe jeder, der sie über Ihre Schulter erblickt, auch diese Daten. Deshalb fragt der Weg über die Nummer immer nach einer Sache mehr.",
    sumTitle: "Woraus der Betrag besteht",
    sumRows: [
      ["Auftragspositionen", "Was wir anfertigen oder versenden."],
      ["Versand", "Nach der gewählten Methode. Persönliche Abholung kostet nichts."],
      ["Rabatt", "Wird abgezogen, wenn Sie einen gültigen Code angegeben haben."],
      ["Zu zahlen", "Positionen plus Versand, minus Rabatt."],
    ],
    sumRules: [
      "Den verbindlichen Betrag berechnet immer unser Server. Ein Preis aus dem Browser wird nie übernommen, auch dann nicht, wenn jemand versucht, ihn zu ändern.",
      "Ein Rabatt gilt ausschließlich für die Auftragspositionen. Er geht nie vom Versand ab.",
      "Ein Rabatt geht nie unter null. Ein Code über dem Bestellwert senkt ihn auf null und erzeugt kein Guthaben.",
      "Ein Code pro Bestellung.",
    ],
    plTitle: "Zahlung aus Polen, in Złoty",
    plLead: "So läuft die Zahlung, wenn Sie in Złoty abrechnen. Das ist die Voreinstellung der polnischen Version, die Wahl liegt aber bei Ihnen: die Währung stellen Sie im Sprachmenü, an der Kasse und auf der Angebotsseite um, unabhängig von der Sprache.",
    plRows: [
      ["BLIK", "Ein Code aus Ihrer Banking-App. Der schnellste Weg."],
      ["Sofortüberweisung", "Über zwanzig polnische Banken. BLIK steht oben, die Banken verbergen sich hinter einer Zeile mit Suchfeld, damit niemand eine lange Liste scrollen muss."],
    ],
    plNote: "Die Zahlung wird sofort bestätigt und wir beginnen sofort mit der Arbeit. Die Ware reservieren wir 20 Minuten, also für die Dauer des Bezahlvorgangs. Ein abgebrochener Warenkorb nimmt nichts weg: die Reservierung verfällt von selbst.",
    euTitle: "Zahlung aus dem Ausland, in Euro",
    euLead: "So läuft die Zahlung, wenn Sie in Euro abrechnen. Das ist die Voreinstellung der englischen und deutschen Version, wählen kann sie aber jeder. Abgerechnet wird per SEPA-Überweisung auf unser Eurokonto.",
    euRows: [
      ["SEPA-Überweisung", "Die Kontonummer zeigen wir nach der Bestellung und senden sie per E-Mail. Verwendungszweck ist die Bestellnummer."],
      ["BLIK oder eine polnische Bank, falls gewünscht", "Die Sofortzahlung lässt sich auch auf diesen Versionen wählen. Sinnvoll ist das mit einem polnischen Konto: die Abrechnung läuft dann in Złoty wie oben."],
      ["Wenn ein anderer Betrag eingeht", "Eine kleine Unterzahlung, meist eine Gebühr einer Zwischenbank, übernehmen wir, die Bestellung läuft normal weiter. Bei einer größeren Differenz bitten wir um eine Nachzahlung und warten drei Tage; geht sie nicht ein, schließen wir die Bestellung und senden den eingegangenen Betrag an das Konto des Absenders zurück. Einen Überschuss erstatten wir auf demselben Weg, die Arbeit beginnt sofort."],
    ],
    euNote: "Den Zahlungseingang bestätigen wir von Hand, weil eine Auslandsüberweisung nicht automatisch an uns zurückmeldet. Betrag und Reservierung gelten 3 Werktage. Ist die Zahlung am vierten Werktag nicht eingegangen, verfällt die Reservierung und die Ware geht zurück in den Verkauf. Die Lieferzeit rechnen wir ab Zahlungseingang, nicht ab Bestellung.",
    euFxTitle: "Woher der Eurobetrag kommt",
    euFx: [
      "Der Betrag entsteht aus dem Złoty-Preis zum Kurs der Polnischen Nationalbank, erhöht um {fx} Prozent.",
      "Dieser Aufschlag ist keine versteckte Marge. Zwischen dem Einfrieren des Betrags und dem Zahlungseingang vergehen Tage, und der Kurs bewegt sich in dieser Zeit. Der Aufschlag deckt diese Differenz und die Kosten der Umrechnung auf unserer Seite.",
      "Eurobetrag und Kurs frieren wir im Moment der Bestellung ein. Eine spätere Kursbewegung ändert nichts an dem, was Sie überweisen müssen.",
    ],
    noMethods: "Unabhängig von der Sprachversion: keine Kartenzahlung, kein Google Pay, kein Apple Pay, keine Nachnahme. Die persönliche Abholung ist kostenlos, die Zahlung selbst läuft aber weiterhin über einen der Wege oben.",
    metalTitle: "Edelmetall und die Gültigkeitsdauer",
    metalLead: "Gold und Platin können sich in zwei Wochen um mehrere Prozent bewegen. Deshalb bedeutet \"gültig X Tage\" auf jedem der drei Wege etwas anderes, und es lohnt sich zu wissen, welcher für Sie gilt.",
    metalRows: [
      ["Verbindlicher Kalkulatorbetrag", "Gültig 7 Tage. In der Regel zahlen Sie sofort, das Metall hat also keine Zeit, sich zu bewegen."],
      ["Gespeicherte Kalkulation", "Die Arbeitsleistung ist für die gesamte Gültigkeitsdauer verbindlich. Das Metall rechnen wir zum Tag, an dem Sie den Link öffnen. Wir addieren ausschließlich die Differenz aus der Kursbewegung des Metalls, nie aus einer Änderung unserer eigenen Preisliste; zugesagte Arbeit bleibt also zum zugesagten Preis. Das betrifft Metallstücke; bei Druck und Laser gibt es nichts umzurechnen. Nach Ablauf rechnen wir nichts mehr um, die Kalkulation ist verfallen."],
      ["Persönlich vereinbartes Angebot", "Den Betrag haben wir von Hand eingetragen, er steht also bis zu dem im Angebot genannten Datum fest, unabhängig vom Kurs. Das Metallrisiko tragen wir in dieser Zeit, weshalb dieses Datum bei Gold meist näher liegt."],
    ],
    metalNote: "Standardmäßig bindet uns ein Angebot 7 Tage ab Ausstellung, die Gültigkeitsdauer legen wir jedoch für jedes Angebot einzeln fest und nennen sie im Angebot selbst. Bei einem Stück, dessen Preis überwiegend vom Metall bestimmt wird, fällt sie meist kürzer aus. Die Zahl auf dieser Seite ist also nur ein Ausgangspunkt: maßgeblich ist das Datum auf Ihrem Angebot. Nach diesem Datum stellen wir ein neues Angebot aus statt das alte zu verlängern, und genau das ist der Grund: das Metall kann sich bewegt haben.",
    timeTitle: "Fristen",
    timeRows: [
      ["Warenreservierung, Zahlung aus Polen", "20 Minuten"],
      ["Warenreservierung, Euro-Überweisung aus dem Ausland", "3 Werktage; am vierten geht die Ware zurück in den Verkauf"],
      ["Gültigkeit eines persönlich vereinbarten Angebots", "standardmäßig 7 Tage, es gilt das im Angebot genannte Datum"],
      ["Gültigkeit eines verbindlichen Kalkulatorbetrags", "7 Tage; Metall zum Tag der Bestellung"],
    ],
    timeNote: "Nach Ablauf nimmt ein Angebot keine Zahlung mehr an. Wir stellen ein neues aus statt das alte zu verlängern, weil sich Materialpreise zwischenzeitlich bewegt haben können.",
    spis: [
      { id: "drogi", label: "Zwei Wege" },
      { id: "sklep", label: "Shop" },
      { id: "oferta", label: "Angebot" },
      { id: "kwota", label: "Der Betrag" },
      { id: "metody", label: "Methoden" },
      { id: "kruszec", label: "Metall" },
      { id: "terminy", label: "Gültigkeit" },
      { id: "klopoty", label: "Wenn etwas schiefgeht" },
      { id: "faq", label: "FAQ" },
    ],
    afterTitle: "Was nach der Zahlung passiert",
    afterBody: "Die Zahlung beendet diese Seite und beginnt die nächste. Arbeitsetappen, die Zählung des Termins, unsere Nachrichten und der Erhalt des fertigen Stücks stehen auf einer eigenen Seite, damit der Weg dorthin nicht durch den gesamten Zahlungstext führt.",
    afterCta: "Ablauf der Fertigung",
    afterCheck: "Bestellung prüfen",
    faqTitle: "Häufige Fragen zu Zahlung und Angeboten",
    faqMore: "Alle Fragen und Antworten",
    safeTitle: "Sicherheit",
    safeRows: [
      "Ihre Kartendaten oder Ihr Bankpasswort sehen wir nie. Sie zahlen auf der Seite des Anbieters, nicht bei uns.",
      "Den verbindlichen Betrag berechnet der Server, er lässt sich unterwegs nicht austauschen.",
      "Der Status einer bezahlten Bestellung ist unumkehrbar: ein späterer fehlgeschlagener Versuch hebt ihn nicht auf.",
      "Der vollständige Bestellstatus erfordert einen privaten Link. Die Nummer allein öffnet ihn nicht.",
    ],
    troubleTitle: "Wenn etwas schiefgeht",
    troubleRows: [
      ["Die Zahlung kam nicht zustande", "Es wurde nichts abgebucht. Auf der Statusseite gibt es eine Schaltfläche, die die Zahlung für dieselbe Bestellung wiederholt. Eine zweite Bestellung entsteht dabei nicht."],
      ["Die Zahlung muss geprüft werden", "Das passiert, wenn das Geld nach dem Schließen der Bestellung oder in anderer Höhe eingegangen ist. Zahlen Sie nicht erneut. Wir prüfen das von Hand und melden uns."],
      ["Ich habe den Angebotslink nicht mehr", "Geben Sie die Angebotsnummer im Shop, im Warenkorb oder auf der Angebotsseite ein und bestätigen Sie mit Ihrer E-Mail-Adresse."],
      ["Ich möchte stornieren", "Schreiben Sie uns. Die Rückgaberegeln stehen in einem eigenen Dokument."],
    ],
    refundTitle: "Rückerstattung",
    refundBody: "Verbraucher haben 14 Tage ab Erhalt der Sendung, um ohne Angabe von Gründen vom Vertrag zurückzutreten. Wir erstatten alle Zahlungen, einschließlich der Kosten der günstigsten von uns angebotenen Lieferung. Ausnahmen und die vollständigen Regeln stehen in der Rückgaberichtlinie und in den AGB.",
    refundLink: "Rückgaberichtlinie",
    contact: "Eine Frage, die diese Seite nicht beantwortet? Schreiben Sie uns.",
    contactLink: "Kontakt",
  },
};

/** Numerowany krok. Numer jest duzy, bo strona ma sie przebiegac wzrokiem. */
function Krok({ n, title, body }) {
  return (
    <li className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <span className="shrink-0 w-7 h-7 rounded-full border border-amber-400/40 text-amber-400 text-xs flex items-center justify-center font-medium">
        {n}
      </span>
      <div className="min-w-0">
        <div className="text-white text-sm font-medium">{title}</div>
        <p className="text-neutral-400 text-sm leading-relaxed mt-1">{body}</p>
      </div>
    </li>
  );
}

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

export default function Payments() {
  const { lang } = useLanguage();
  const l = L[lang] || L.en;

  const headerRef = useScrollReveal();
  const pathsRef = useScrollReveal();
  const flowRef = useScrollReveal();
  const shopRef = useScrollReveal();
  const offerRef = useScrollReveal();
  const sumRef = useScrollReveal();
  const methodsRef = useScrollReveal();
  const currencyRef = useScrollReveal();
  const metalRef = useScrollReveal();
  const timeRef = useScrollReveal();
  const afterRef = useScrollReveal();
  const safeRef = useScrollReveal();
  const troubleRef = useScrollReveal();
  const faqRef = useScrollReveal();

  // Pytania stoja w `src/data/faq/sklep.js`, wiec ta sama odpowiedz nie
  // rozjedzie sie miedzy ta strona, procesem realizacji a `/faq/`.
  const pytania = SKLEP.filter((f) => f.temat === "platnosc" || f.temat === "oferta");
  const pageUrl = adresStrony("/payments/", lang);
  const schemas = [
    buildWebPageSchema({ title: `${l.title}, ${SITE.name}`, description: l.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: adresStrony("/", lang) },
      { name: l.tag, url: pageUrl },
    ]),
    buildFAQSchema(pytania.map((f) => ({ q: f.q[lang] || f.q.pl, a: f.a[lang] || f.a.pl }))),
  ];

  return (
    <>
      <SEOHead pageKey="payments" path="/payments" schemas={schemas} />
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-4xl mx-auto">
            <Breadcrumb items={[{ href: "/", label: "Home" }, { label: l.tag }]} />

            <div ref={headerRef} className="reveal text-center mb-14">
              <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{l.tag}</div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                {l.title}
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto">{l.description}</p>
            </div>

            <SpisTresci pozycje={l.spis} />

            {/* Rozwidlenie na samej gorze: klient ma najpierw rozpoznac swoj
                przypadek, a dopiero potem czytac szczegoly. */}
            <div id="drogi" ref={pathsRef} className="reveal scroll-mt-32 mb-5">
              <h2 className="text-white font-semibold mb-2">{l.pathsTitle}</h2>
              <p className="text-neutral-400 text-sm mb-4">{l.pathsLead}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag className="w-5 h-5 text-amber-400 shrink-0" />
                    <span className="text-white text-sm font-medium">A</span>
                  </div>
                  <div className="text-white text-sm font-medium">{l.pathA}</div>
                  <p className="text-neutral-400 text-sm leading-relaxed mt-1">{l.pathADesc}</p>
                </div>
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                    <span className="text-white text-sm font-medium">B</span>
                  </div>
                  <div className="text-white text-sm font-medium">{l.pathB}</div>
                  <p className="text-neutral-400 text-sm leading-relaxed mt-1">{l.pathBDesc}</p>
                </div>
              </div>
            </div>

            {/* Diagram dwoch drog zaplaty. Rysunek zamiast akapitu, bo pytanie
                brzmi "kiedy co sie stanie", a na to odpowiada os czasu, a nie
                proza. Kroki i terminy sa te same, ktore wykonuje kod. */}
            <div ref={flowRef} className="reveal mb-5">
              <h2 className="text-white font-semibold mb-2">{l.flowTitle}</h2>
              <p className="text-neutral-400 text-sm mb-4">{l.flowLead}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { tytul: l.flowPlnTitle, kroki: l.flowPln, ikona: Wallet, kolor: "text-amber-400", kropka: "bg-amber-400" },
                  { tytul: l.flowEurTitle, kroki: l.flowEur, ikona: Globe, kolor: "text-blue-400", kropka: "bg-blue-400" },
                ].map((droga) => (
                  <div key={droga.tytul} className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <droga.ikona className={`w-4 h-4 shrink-0 ${droga.kolor}`} />
                      <span className="text-white text-sm font-medium">{droga.tytul}</span>
                    </div>
                    <ol className="relative">
                      {/* Pionowa linia laczaca kroki: to ona robi z listy os czasu. */}
                      <span className="absolute left-[5px] top-2 bottom-2 w-px bg-neutral-800" aria-hidden="true" />
                      {droga.kroki.map(([krok, kiedy], i) => (
                        <li key={i} className="relative pl-6 pb-4 last:pb-0">
                          <span className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ${droga.kropka}`} aria-hidden="true" />
                          <span className="block text-neutral-200 text-sm leading-snug">{krok}</span>
                          <span className="block text-neutral-500 text-xs mt-0.5">{kiedy}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
              <p className="text-neutral-500 text-xs leading-relaxed mt-3">
                {l.flowHold.replace("{days}", String(TRANSFER_HOLD_BUSINESS_DAYS))}
              </p>
            </div>

            <Karta icon={ShoppingBag} id="sklep" title={l.shopTitle} innerRef={shopRef}>
              <ol className="divide-y divide-neutral-800">
                {l.shopSteps.map(([t, b], i) => <Krok key={i} n={i + 1} title={t} body={b} />)}
              </ol>
            </Karta>

            <Karta icon={FileText} id="oferta" title={l.offerTitle} innerRef={offerRef}>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4">{l.offerLead}</p>
              <ol className="divide-y divide-neutral-800">
                {l.offerSteps.map(([t, b], i) => <Krok key={i} n={i + 1} title={t} body={b} />)}
              </ol>
              <div className="mt-5 rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-4">
                <Link
                  to="/oferta/"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-amber-300"
                >
                  {l.goOffer} <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-neutral-400 text-xs leading-relaxed mt-3">{l.goOfferNote}</p>
              </div>

              <div className="mt-5 rounded-lg border border-blue-400/25 bg-blue-400/[0.05] p-4">
                <div className="text-blue-300 text-xs font-medium mb-1">{l.whyNumber}</div>
                <p className="text-neutral-400 text-sm leading-relaxed">{l.whyNumberBody}</p>
              </div>
            </Karta>

            <Karta icon={Coins} id="kwota" title={l.sumTitle} innerRef={sumRef}>
              <div className="divide-y divide-neutral-800 mb-4">
                {l.sumRows.map(([name, desc], i) => (
                  <div key={i} className="py-3 first:pt-0">
                    <div className="text-sm text-neutral-200">{name}</div>
                    <div className="text-neutral-500 text-xs mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>
              <ul className="space-y-2">
                {l.sumRules.map((r, i) => (
                  <li key={i} className="text-neutral-400 text-sm leading-relaxed pl-4 border-l border-amber-400/30">{r}</li>
                ))}
              </ul>
            </Karta>

            {/* Dwa osobne bloki, a nie jedna lista metod z kolumna waluty.
                Klient z Polski i klient z zagranicy maja inna walute, inne
                metody, inny czas rezerwacji i inny moment, od ktorego liczy sie
                termin realizacji. Zlepione w jedna tabele zmuszaly kazdego
                z nich do czytania polowy, ktora go nie dotyczy. */}
            <Karta icon={Wallet} id="metody" title={l.plTitle} innerRef={methodsRef}>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4">{l.plLead}</p>
              <div className="divide-y divide-neutral-800">
                {l.plRows.map(([name, desc], i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-neutral-200">{name}</span>
                      <span className="text-amber-400 text-xs font-medium shrink-0">PLN</span>
                    </div>
                    <p className="text-neutral-500 text-xs leading-relaxed mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-neutral-500 text-xs leading-relaxed mt-4 pt-4 border-t border-neutral-800">{l.plNote}</p>
            </Karta>

            <Karta icon={Globe} title={l.euTitle} innerRef={currencyRef}>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4">{l.euLead}</p>
              <div className="divide-y divide-neutral-800">
                {l.euRows.map(([name, desc], i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-neutral-200">{name}</span>
                      <span className="text-blue-400 text-xs font-medium shrink-0">{i === 0 ? "EUR" : "PLN"}</span>
                    </div>
                    <p className="text-neutral-500 text-xs leading-relaxed mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-neutral-500 text-xs leading-relaxed mt-4 pt-4 border-t border-neutral-800">{l.euNote}</p>

              <div className="mt-4 rounded-lg border border-blue-400/25 bg-blue-400/[0.05] p-4">
                <div className="text-blue-300 text-xs font-medium mb-2">{l.euFxTitle}</div>
                {l.euFx.map((p, i) => (
                  <p key={i} className="text-neutral-400 text-sm leading-relaxed mb-2 last:mb-0">
                    {p.replace("{fx}", String(FX_PCT))}
                  </p>
                ))}
              </div>
            </Karta>

            <p className="text-neutral-500 text-xs leading-relaxed mb-5 px-1">{l.noMethods}</p>

            {/* Kruszec ma wlasna karte, a nie przypis pod terminami. Regula
                "robocizna wiazaca, kruszec z dnia zamowienia" jest nieoczywista
                i to o nia klient pyta, gdy kwota po otwarciu linku rozni sie
                od tej, ktora pamieta. */}
            <Karta icon={TrendingUp} id="kruszec" title={l.metalTitle} innerRef={metalRef}>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4">{l.metalLead}</p>
              <div className="divide-y divide-neutral-800">
                {l.metalRows.map(([name, desc], i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="text-sm text-neutral-200">{name}</div>
                    <p className="text-neutral-400 text-sm leading-relaxed mt-1">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/[0.05] p-4">
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {l.metalNote}
                </p>
              </div>
            </Karta>

            <Karta icon={Clock} id="terminy" title={l.timeTitle} innerRef={timeRef}>
              <div className="divide-y divide-neutral-800">
                {l.timeRows.map(([name, value], i) => (
                  <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                    <span className="text-sm text-neutral-300">{name}</span>
                    <span className="text-sm text-amber-400 font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-neutral-500 text-xs leading-relaxed mt-4">{l.timeNote}</p>
            </Karta>

            {/* Realizacja ma wlasna strone (zgloszenie wlasciciela 2026-08-30).
                Tu zostaje sam drogowskaz, zeby ktos szukajacy terminu nie musial
                przewijac calego opisu przelewow. */}
            <Karta icon={Hammer} id="realizacja" title={l.afterTitle} innerRef={afterRef}>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4">{l.afterBody}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/order-process/" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-amber-300">
                  {l.afterCta} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/order/status/" className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500">
                  {l.afterCheck}
                </Link>
              </div>
            </Karta>

            <Karta icon={ShieldCheck} title={l.safeTitle} innerRef={safeRef}>
              <ul className="space-y-2">
                {l.safeRows.map((r, i) => (
                  <li key={i} className="text-neutral-400 text-sm leading-relaxed pl-4 border-l border-emerald-400/30">{r}</li>
                ))}
              </ul>
            </Karta>

            <Karta icon={AlertTriangle} id="klopoty" title={l.troubleTitle} innerRef={troubleRef}>
              <div className="divide-y divide-neutral-800">
                {l.troubleRows.map(([q, a], i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="text-sm text-neutral-200">{q}</div>
                    <p className="text-neutral-400 text-sm leading-relaxed mt-1">{a}</p>
                  </div>
                ))}
              </div>
            </Karta>

            <Karta icon={RotateCcw} title={l.refundTitle} innerRef={faqRef}>
              <p className="text-neutral-400 text-sm leading-relaxed">{l.refundBody}</p>
              <Link to="/returns/" className="inline-block mt-3 text-amber-400 hover:text-amber-300 text-sm">
                {l.refundLink}
              </Link>
            </Karta>

            <div id="faq" className="scroll-mt-32 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-5">
              <h2 className="text-white font-semibold mb-4">{l.faqTitle}</h2>
              <FaqLista pytania={pytania} />
              <p className="mt-4">
                <Link to="/faq/" className="text-amber-400 hover:text-amber-300 text-sm">{l.faqMore}</Link>
              </p>
            </div>

            <p className="text-neutral-500 text-sm text-center mb-8">
              {l.contact}{" "}
              <Link to="/contact/" className="text-amber-400 hover:text-amber-300">{l.contactLink}</Link>
            </p>

            <PolicyLinks current="payments" />
          </div>
        </section>
      </div>
    </>
  );
}
