// ============================================================
// PYTANIA O WYCENE KRUSZCU
// ============================================================
// Pytania stoja w danych, a nie w pliku strony, bo czyta je DWOJE:
// strona, ktorej dotycza, i wspolna sekcja `/faq/` z wyszukiwarka. Kopia
// w drugim miejscu rozjechalaby sie przy pierwszej poprawce, i to po cichu:
// klient dostalby dwie rozne odpowiedzi zaleznie od tego, gdzie trafil.
//
// `id` jest kotwica w adresie, wiec ZOSTAJE, nawet gdy zmieni sie tresc:
// odnosnik do konkretnej odpowiedzi ma dzialac za rok.

export default [
  {
    id: "ile-dostane-za-gram-zlota",
    temat: "narzedzia",
    strona: "/toolsjewelry/metal-pricing/",
    q: {
      pl: "Ile dostanę za gram złota 585 w skupie?",
      en: "How much will I get for a gram of 585 gold?",
      de: "Wie viel bekomme ich für ein Gramm 585er Gold?",
    },
    a: {
      pl: "Od 70 do 90% wartości kruszcu. Przy złocie 585 wartość kruszcu to 58,5% ceny czystego złota za gram, więc skup płaci mniej więcej od 41 do 53% ceny złota próby 999. Dokładna stawka zależy od masy partii i od tego, czy skup musi najpierw sprawdzić próbę.",
      en: "Between 70 and 90% of the metal value. In 585 gold the metal value is 58.5% of the price of pure gold per gram, so a buyer pays roughly 41 to 53% of the 999 gold price. The exact rate depends on the size of the lot and on whether the buyer has to verify the purity first.",
      de: "Zwischen 70 und 90% des Materialwerts. Bei 585er Gold beträgt der Materialwert 58,5% des Feingoldpreises pro Gramm, ein Ankäufer zahlt also etwa 41 bis 53% des 999er Goldpreises. Der genaue Satz hängt von der Menge ab und davon, ob der Feingehalt erst geprüft werden muss.",
    },
  },
  {
    id: "czy-kamienie-w-pierscionku-licza",
    temat: "narzedzia",
    strona: "/toolsjewelry/metal-pricing/",
    q: {
      pl: "Czy kamienie w pierścionku liczą się do wagi?",
      en: "Do the stones in a ring count towards the weight?",
      de: "Zählen Steine im Ring zum Gewicht?",
    },
    a: {
      pl: "Nie. Skup kupuje metal, a kamienie są dla niego balastem, który trzeba usunąć. Cyrkonie zwykle przepadają. Diament, szafir czy szmaragd o sensownej wielkości warto wyjąć i wycenić osobno, bo jego wartość bywa wyższa niż całej oprawy.",
      en: "No. A buyer purchases metal, and stones are ballast that has to be removed. Cubic zirconia is usually lost. A diamond, sapphire or emerald of any real size is worth removing and valuing separately, because it can be worth more than the whole setting.",
      de: "Nein. Der Ankauf kauft Metall, Steine sind Ballast, der entfernt werden muss. Zirkonia geht meist verloren. Ein Diamant, Saphir oder Smaragd von nennenswerter Größe sollte ausgefasst und getrennt bewertet werden, sein Wert übersteigt oft den der ganzen Fassung.",
    },
  },
  {
    id: "co-oznacza-proba-585",
    temat: "narzedzia",
    strona: "/toolsjewelry/metal-pricing/",
    q: {
      pl: "Co oznacza próba 585 w karatach?",
      en: "What is 585 fineness in karat?",
      de: "Was bedeutet Feingehalt 585 in Karat?",
    },
    a: {
      pl: "14 karatów. Próba to zawartość czystego złota w tysięcznych, karat w dwudziestych czwartych. 585 tysięcznych to 58,5%, a 14 z 24 części to 58,3%, więc obie liczby opisują ten sam stop.",
      en: "14 karat. Fineness states the pure gold content in thousandths, karat in twenty-fourths. 585 thousandths is 58.5%, and 14 parts out of 24 is 58.3%, so both numbers describe the same alloy.",
      de: "14 Karat. Der Feingehalt nennt den Reingoldanteil in Tausendsteln, Karat in Vierundzwanzigsteln. 585 Tausendstel sind 58,5%, und 14 von 24 Teilen sind 58,3%, beide Zahlen beschreiben dieselbe Legierung.",
    },
  },
  {
    id: "moja-bizuteria-nie-ma-zadnej",
    temat: "narzedzia",
    strona: "/toolsjewelry/metal-pricing/",
    q: {
      pl: "Moja biżuteria nie ma żadnej cechy. Co teraz?",
      en: "My jewelry has no hallmark. What now?",
      de: "Mein Schmuck hat keine Punze. Was nun?",
    },
    a: {
      pl: "Brak cechy nie oznacza, że to nie złoto, ale sam nie ustalisz próby na oko. Jubiler lub skup sprawdzi ją kamieniem probierczym z kwasami albo spektrometrem XRF, zwykle bezpłatnie i bez uszkodzenia wyrobu. Dopiero z tym wynikiem kalkulator ma sens.",
      en: "A missing stamp does not mean it is not gold, but you cannot establish the fineness by eye. A jeweler or a buyer will test it with a touchstone and acids or with an XRF spectrometer, usually free of charge and without damaging the piece. Only with that result does the calculator mean anything.",
      de: "Eine fehlende Punze heißt nicht, dass es kein Gold ist, aber der Feingehalt lässt sich nicht mit bloßem Auge bestimmen. Ein Juwelier oder Ankäufer prüft ihn mit Prüfstein und Säuren oder per XRF-Spektrometer, meist kostenlos und ohne Schaden am Stück. Erst mit diesem Ergebnis ist der Rechner aussagekräftig.",
    },
  },
  {
    id: "czy-zloto-biale-jest-warte",
    temat: "narzedzia",
    strona: "/toolsjewelry/metal-pricing/",
    q: {
      pl: "Czy złoto białe jest warte tyle samo co żółte?",
      en: "Is white gold worth the same as yellow?",
      de: "Ist Weißgold so viel wert wie Gelbgold?",
    },
    a: {
      pl: "Przy tej samej próbie tak. Kolor bierze się z domieszek, a te są bez znaczenia dla wyceny. Złoto białe 585 zawiera dokładnie tyle samo czystego złota co żółte 585. Powłoka rodowa nie dodaje wartości.",
      en: "At the same fineness, yes. The colour comes from the alloying metals, which do not matter for valuation. White gold 585 holds exactly as much pure gold as yellow 585. Rhodium plating adds no value.",
      de: "Bei gleichem Feingehalt ja. Die Farbe kommt von den Zusatzmetallen, die für die Bewertung ohne Belang sind. Weißgold 585 enthält genauso viel Reingold wie gelbes 585. Eine Rhodinierung erhöht den Wert nicht.",
    },
  },
  {
    id: "czy-oplaca-sie-sprzedac-stara",
    temat: "narzedzia",
    strona: "/toolsjewelry/metal-pricing/",
    q: {
      pl: "Czy opłaca się sprzedać starą biżuterię na wagę?",
      en: "Is it worth selling old jewelry by weight?",
      de: "Lohnt es sich, alten Schmuck nach Gewicht zu verkaufen?",
    },
    a: {
      pl: "Nie zawsze. Wyroby sygnowane, przedwojenne albo po prostu sprawne i ładne bywają warte kilkukrotność wartości metalu na rynku wtórnym. Sprzedaż na wagę ma sens przy uszkodzonych, pogiętych i pojedynczych sztukach, których nikt nie kupi jako biżuterii.",
      en: "Not always. Signed, pre-war or simply intact and attractive pieces can be worth several times the metal value on the secondary market. Selling by weight makes sense for damaged, bent and odd single pieces that nobody would buy as jewelry.",
      de: "Nicht immer. Signierte, Vorkriegs- oder schlicht intakte und schöne Stücke erzielen auf dem Zweitmarkt oft ein Vielfaches des Materialwerts. Der Verkauf nach Gewicht lohnt bei beschädigten, verbogenen und einzelnen Teilen, die niemand als Schmuck kauft.",
    },
  },
  {
    id: "czy-zamiast-sprzedawac-mozna-przerobic",
    temat: "narzedzia",
    strona: "/toolsjewelry/metal-pricing/",
    q: {
      pl: "Czy zamiast sprzedawać, można przerobić stare złoto?",
      en: "Can old gold be remade instead of sold?",
      de: "Kann man Altgold umarbeiten statt verkaufen?",
    },
    a: {
      pl: "Tak i często wychodzi to korzystniej. Przyjmujemy powierzony metal, przetapiamy go i wykonujemy z niego nowy wyrób, a wtedy płacisz tylko za robociznę i ewentualny brakujący surowiec, zamiast tracić marżę skupu i marżę na zakupie nowego złota.",
      en: "Yes, and it often works out better. We accept metal you supply, melt it down and make a new piece from it. You then pay for the work and any material shortfall, instead of losing both the buyer's margin and the margin on buying new gold.",
      de: "Ja, und häufig ist das günstiger. Wir nehmen beigestelltes Metall an, schmelzen es ein und fertigen daraus ein neues Stück. Sie zahlen dann Arbeitszeit und fehlendes Material, statt gleichzeitig die Ankaufsmarge und die Marge auf neues Gold zu verlieren.",
    },
  },
];
