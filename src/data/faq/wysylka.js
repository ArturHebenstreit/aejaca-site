// ============================================================
// PYTANIA O WYSYLKE I KOSZTY DOSTAWY
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
    id: "ile-kosztuje-wysylka-w-polsce",
    temat: "dostawa",
    strona: "/shipping/",
    q: {
      pl: "Ile kosztuje wysyłka w Polsce?",
      en: "How much does shipping cost within Poland?",
      de: "Wie viel kostet der Versand innerhalb Polens?",
    },
    a: {
      pl: (f) => `W Polsce: kurier InPost od ${f.courier}, paczkomat InPost od ${f.locker}, a odbiór osobisty w Warszawie i okolicach jest bezpłatny. Przy zamówieniu od ${f.free} wysyłka w Polsce jest darmowa.`,
      en: (f) => `Within Poland: InPost courier from ${f.courier}, InPost parcel locker from ${f.locker}, and personal pickup in the Warsaw area is free. Orders over ${f.free} ship free within Poland.`,
      de: (f) => `Innerhalb Polens: InPost Kurier ab ${f.courier}, InPost Paketautomat ab ${f.locker}, persönliche Abholung im Raum Warschau kostenlos. Bestellungen ab ${f.free} werden innerhalb Polens kostenlos versandt.`,
    },
  },
  {
    id: "czy-wysylacie-do-krajow-unii",
    temat: "dostawa",
    strona: "/shipping/",
    q: {
      pl: "Czy wysyłacie do krajów Unii Europejskiej?",
      en: "Do you ship to EU countries?",
      de: "Versenden Sie in EU-Länder?",
    },
    a: {
      pl: (f) => `Tak. Wysyłka do UE od ${f.eu}, dostawa zwykle 5–10 dni roboczych. Korzystamy z InPost tam, gdzie jest dostępny, a w pozostałych krajach z DHL.`,
      en: (f) => `Yes. Shipping to the EU from ${f.eu}, usually 5–10 business days. We use InPost where available, otherwise DHL.`,
      de: (f) => `Ja. Versand in die EU ab ${f.eu}, in der Regel 5–10 Werktage. Wir nutzen InPost, wo verfügbar, sonst DHL.`,
    },
  },
  {
    id: "ile-kosztuje-wysylka-do-wielkiej",
    temat: "dostawa",
    strona: "/shipping/",
    q: {
      pl: "Ile kosztuje wysyłka do Wielkiej Brytanii?",
      en: "How much does shipping to the United Kingdom cost?",
      de: "Wie viel kostet der Versand nach Großbritannien?",
    },
    a: {
      pl: (f) => `Kurierem ekspresowym (DHL, UPS, FedEx) zwykle 5–10 dni roboczych. Koszt zależy od wagi: do 5 kg ${f.uk5}, do 10 kg ${f.uk10}, 20–30 kg ${f.uk2030}. Od czasu Brexitu przesyłki podlegają odprawie celnej.`,
      en: (f) => `By express courier (DHL, UPS, FedEx), typically 5–10 business days. Cost depends on weight: up to 5 kg ${f.uk5}, up to 10 kg ${f.uk10}, 20–30 kg ${f.uk2030}. Since Brexit, parcels clear customs.`,
      de: (f) => `Per Express-Kurier (DHL, UPS, FedEx), in der Regel 3–5 Werktage. Die Kosten richten sich nach dem Gewicht: bis 5 kg ${f.uk5}, bis 10 kg ${f.uk10}, 20–30 kg ${f.uk2030}. Seit dem Brexit werden Pakete verzollt.`,
    },
  },
  {
    id: "ile-kosztuje-wysylka-do-usa",
    temat: "dostawa",
    strona: "/shipping/",
    q: {
      pl: "Ile kosztuje wysyłka do USA i innych krajów świata?",
      en: "How much does shipping to the USA and the rest of the world cost?",
      de: "Wie viel kostet der Versand in die USA und den Rest der Welt?",
    },
    a: {
      pl: (f) => `DHL Express lotniczo na cały świat, w tym USA i Azja, zwykle 5–18 dni roboczych. Koszt: do 1 kg ${f.usa1}, do 10 kg ${f.usa10}.`,
      en: (f) => `DHL Express by air worldwide, including the USA and Asia, typically 5–18 business days. Cost: up to 1 kg ${f.usa1}, up to 10 kg ${f.usa10}.`,
      de: (f) => `DHL Express per Luftfracht weltweit, inkl. USA und Asien, in der Regel 2–5 Werktage. Kosten: bis 1 kg ${f.usa1}, bis 10 kg ${f.usa10}.`,
    },
  },
  {
    id: "czy-musze-zaplacic-clo",
    temat: "dostawa",
    strona: "/shipping/",
    q: {
      pl: "Czy muszę zapłacić cło?",
      en: "Will I have to pay customs duty?",
      de: "Muss ich Zoll bezahlen?",
    },
    a: {
      pl: () => `Przesyłki poza UE (m.in. Wielka Brytania, USA, Azja) mogą podlegać cłu i podatkom importowym naliczanym przez kraj odbiorcy. Koszty te ponosi odbiorca i nie są wliczone w cenę wysyłki.`,
      en: () => `Shipments outside the EU (including the UK, USA, Asia) may be subject to customs duties and import taxes charged by the destination country. These are paid by the recipient and are not included in the shipping price.`,
      de: () => `Sendungen außerhalb der EU (inkl. Großbritannien, USA, Asien) können Zöllen und Einfuhrsteuern unterliegen, die vom Bestimmungsland erhoben werden. Diese trägt der Empfänger und sind nicht im Versandpreis enthalten.`,
    },
  },
  {
    id: "jak-dlugo-trwa-realizacja-zamowienia",
    temat: "dostawa",
    strona: "/shipping/",
    q: {
      pl: "Jak długo trwa realizacja zamówienia?",
      en: "How long does an order take to make?",
      de: "Wie lange dauert die Anfertigung einer Bestellung?",
    },
    a: {
      pl: () => `Biżuteria: do 7 dni roboczych przy materiałach na stanie, 10–14 dni przy zamawianiu materiałów. Studio (druk 3D, laser): 3–5 dni na stanie, 6–12 dni przy zamawianiu materiałów. Czas realizacji jest niezależny od czasu transportu i potwierdzamy go indywidualnie.`,
      en: () => `Jewelry: up to 7 business days when materials are in stock, 10–14 days if materials must be ordered. Studio (3D printing, laser): 3–5 days in stock, 6–12 days if materials must be ordered. Fulfillment time is separate from shipping transit time and is confirmed individually.`,
      de: () => `Schmuck: bis zu 7 Werktage bei Material auf Lager, 10–14 Tage bei Materialbestellung. Studio (3D-Druck, Laser): 3–5 Tage auf Lager, 6–12 Tage bei Materialbestellung. Die Bearbeitungszeit ist unabhängig von der Transportzeit und wird individuell bestätigt.`,
    },
  },
];
