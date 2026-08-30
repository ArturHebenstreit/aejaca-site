// ============================================================
// PYTANIA O BIZUTERIE NA ZAMOWIENIE
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
    id: "jak-dlugo-trwa-projekt-bizuterii",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Jak długo trwa projekt biżuterii na zamówienie?",
      en: "How long does a custom jewelry project take?",
      de: "Wie lange dauert ein individuelles Schmuckprojekt?",
    },
    a: {
      pl: "Zazwyczaj 2–4 tygodnie, w zależności od złożoności. Po omówieniu projektu podamy dokładny termin.",
      en: "Typically 2–4 weeks depending on complexity. We'll give you a precise timeline after discussing your design.",
      de: "Normalerweise 2–4 Wochen, je nach Komplexität. Nach Besprechung Ihres Designs geben wir einen genauen Zeitrahmen an.",
    },
  },
  {
    id: "czy-moge-dostarczyc-wlasny-kamien",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Czy mogę dostarczyć własny kamień szlachetny?",
      en: "Can I provide my own gemstone?",
      de: "Kann ich meinen eigenen Edelstein mitbringen?",
    },
    a: {
      pl: "Oczywiście! Chętnie pracujemy z kamieniami dostarczonymi przez klientów. Doradzimy najlepszy sposób osadzenia.",
      en: "Absolutely! We're happy to work with stones you provide. We'll advise on the best setting approach.",
      de: "Selbstverständlich! Wir arbeiten gerne mit Steinen, die Sie bereitstellen. Wir beraten zum besten Fassungsansatz.",
    },
  },
  {
    id: "czy-oferujecie-zmiane-rozmiaru-lub",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Czy oferujecie zmianę rozmiaru lub modyfikacje?",
      en: "Do you offer resizing or modifications?",
      de: "Bieten Sie Größenänderungen oder Modifikationen an?",
    },
    a: {
      pl: "Tak. Możemy zmienić rozmiar pierścionków i modyfikować projekty. Skontaktuj się z nami, a znajdziemy najlepsze rozwiązanie.",
      en: "Yes. We can resize rings and modify designs. Contact us with your needs and we'll find the best solution.",
      de: "Ja. Wir können Ringe vergrößern/verkleinern und Designs modifizieren. Kontaktieren Sie uns mit Ihren Wünschen.",
    },
  },
  {
    id: "z-jakimi-metalami-pracujecie",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Z jakimi metalami pracujecie?",
      en: "What metals do you work with?",
      de: "Mit welchen Metallen arbeiten Sie?",
    },
    a: {
      pl: "Głównie srebro próby 925 i złoto (14K, 18K). Pracujemy też z mieszanymi metalami przy unikalnych projektach.",
      en: "Primarily sterling silver (925) and gold (14K, 18K). We also work with mixed metals for unique designs.",
      de: "Hauptsächlich Sterlingsilber (925) und Gold (14K, 18K). Wir arbeiten auch mit Mischmetallen für einzigartige Designs.",
    },
  },
  {
    id: "jak-ustalane-sa-ceny",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Jak ustalane są ceny?",
      en: "How are prices determined?",
      de: "Wie werden die Preise bestimmt?",
    },
    a: {
      pl: "Cena zależy od metalu, kamieni szlachetnych, złożoności i nakładu pracy. Przed rozpoczęciem podajemy szczegółową wycenę.",
      en: "Pricing depends on the metal, gemstones, complexity, and labor involved. We provide a detailed quote before starting.",
      de: "Der Preis hängt von Metall, Edelsteinen, Komplexität und Arbeitsaufwand ab. Wir erstellen vor Beginn ein detailliertes Angebot.",
    },
  },
  {
    id: "czy-wysylacie-za-granice",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Czy wysyłacie za granicę?",
      en: "Do you ship internationally?",
      de: "Versenden Sie international?",
    },
    a: {
      pl: "Tak! Wysyłamy na cały świat przesyłkami śledzonymi i ubezpieczonymi. Koszty wysyłki zależą od miejsca docelowego.",
      en: "Yes! We ship worldwide via tracked and insured postal services. Shipping costs vary by destination.",
      de: "Ja! Wir versenden weltweit per Sendungsverfolgung und versichert. Versandkosten variieren je nach Zielort.",
    },
  },
  {
    id: "ile-trwa-realizacja-zamowienia",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Ile trwa realizacja zamówienia?",
      en: "How long does order fulfillment take?",
      de: "Wie lange dauert die Auftragsabwicklung?",
    },
    a: {
      pl: "Jeśli posiadamy materiały (kruszec + kamienie), realizacja trwa do 7 dni roboczych. Jeśli materiały wymagają zamówienia, proces wydłuża się o 3–7 dni roboczych.",
      en: "If we have the materials (metal + stones), fulfillment takes up to 7 business days. Custom or engraved pieces, up to 14 days. You'll receive a tracking number as soon as the order ships.",
      de: "Bei vorhandenen Materialien (Metall + Steine) bis zu 7 Werktage. Individuell gefertigte oder gravierte Stücke, bis zu 14 Tage. Sie erhalten eine Sendungsverfolgungsnummer, sobald die Bestellung versandt wird.",
    },
  },
  {
    id: "czy-moge-zwrocic-bizuterie",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Czy mogę zwrócić biżuterię?",
      en: "Can I return jewelry?",
      de: "Kann ich Schmuck zurückgeben?",
    },
    a: {
      pl: "Produkty uniwersalne, tak, w ciągu 14 dni. Biżuteria personalizowana wykonana na indywidualne zamówienie nie podlega zwrotowi. Szczegóły na stronie [Zwroty](/returns).",
      en: "Universal products, yes, within 14 days of delivery (unworn, original packaging). Custom-made pieces (engraving, non-standard size) are excluded from returns. Details on our [Returns](/returns) page.",
      de: "Universalprodukte, ja, innerhalb von 14 Tagen nach Lieferung (ungetragen, Originalverpackung). Maßanfertigungen (Gravur, Sondergröße) sind vom Umtausch ausgeschlossen. Details auf unserer [Rückgabeseite](/returns).",
    },
  },
  {
    id: "ile-kosztuje-wysylka",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Ile kosztuje wysyłka?",
      en: "How much does shipping cost?",
      de: "Was kostet der Versand?",
    },
    a: {
      pl: (w) => `Paczkomat InPost ${w.paczkomat} zł, kurier ${w.kurier} zł, darmowa wysyłka od ${w.darmowaOd} zł. Za granicę od ${w.ueOdPln} zł (Niemcy, Czechy, Słowacja, Litwa), reszta Unii ${w.ueDoPln} zł. Szczegóły na stronie [Wysyłka](/shipping).`,
      en: (w) => `InPost parcel locker ${w.paczkomat} PLN, courier ${w.kurier} PLN, free delivery on orders over ${w.darmowaOd} PLN. International from ${w.ueOdPln} PLN (Germany, Czechia, Slovakia, Lithuania), rest of the EU ${w.ueDoPln} PLN. Details on our [Shipping](/shipping) page.`,
      de: (w) => `InPost-Paketautomat ${w.paczkomat} PLN, Kurier ${w.kurier} PLN, kostenloser Versand ab ${w.darmowaOd} PLN. International ab ${w.ueOdPln} PLN (Deutschland, Tschechien, Slowakei, Litauen), übrige EU ${w.ueDoPln} PLN. Details auf unserer [Versandseite](/shipping).`,
    },
  },
  {
    id: "jaka-jest-gwarancja",
    temat: "bizuteria",
    strona: "/jewelry/",
    q: {
      pl: "Jaka jest gwarancja?",
      en: "What warranty do you offer?",
      de: "Welche Garantie bieten Sie?",
    },
    a: {
      pl: "24 miesiące na wady produkcyjne. Bezpłatne pierwsze czyszczenie w ciągu 12 miesięcy. Szczegóły na stronie [Gwarancja](/warranty).",
      en: "24 months on manufacturing defects. The warranty covers structural faults, not mechanical damage or normal wear. Full details on our [Warranty](/warranty) page.",
      de: "24 Monate auf Herstellungsfehler. Die Garantie deckt strukturelle Mängel, nicht mechanische Beschädigungen oder normalen Verschleiß. Vollständige Details auf unserer [Garantieseite](/warranty).",
    },
  },
];
