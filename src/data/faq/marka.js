// ============================================================
// PYTANIA O MARKE AEJACA
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
    id: "czym-jest-aejaca",
    temat: "firma",
    strona: "/",
    q: {
      pl: "Czym jest AEJaCA?",
      en: "What is AEJaCA?",
      de: "Was ist AEJaCA?",
    },
    a: {
      pl: "AEJaCA (Artisan Elegance Jewelry and Crafted Art) to niezależne polskie studio projektowe założone w 2023 roku w Józefosławiu pod Warszawą. Łączy ręcznie tworzoną biżuterię artystyczną (AEJaCA Biżuteria) z cyfrową produkcją na zamówienie - drukiem 3D, grawerem laserowym i odlewami żywicznymi (AEJaCA sTuDiO). Obsługujemy klientów po polsku, angielsku i niemiecku, z wysyłką na cały świat.",
      en: "AEJaCA (Artisan Elegance Jewelry and Crafted Art) is an independent Polish design studio founded in 2023 in Józefosław near Warsaw. It combines handmade artisanal jewelry (AEJaCA Jewelry) with on-demand digital fabrication - 3D printing, laser engraving and resin casting (AEJaCA sTuDiO). We serve customers in Polish, English and German, and ship worldwide.",
      de: "AEJaCA (Artisan Elegance Jewelry and Crafted Art) ist ein unabhängiges polnisches Designstudio, gegründet 2023 in Józefosław bei Warschau. Es verbindet handgefertigten Schmuck (AEJaCA Jewelry) mit digitaler Fertigung auf Bestellung - 3D-Druck, Lasergravur und Harzguss (AEJaCA sTuDiO). Wir betreuen Kunden auf Polnisch, Englisch und Deutsch und versenden weltweit.",
    },
  },
  {
    id: "czy-tworzycie-bizuterie-na-zamowienie",
    temat: "firma",
    strona: "/",
    q: {
      pl: "Czy tworzycie biżuterię na zamówienie?",
      en: "Do you make custom jewelry?",
      de: "Fertigen Sie individuellen Schmuck an?",
    },
    a: {
      pl: "Tak. Projektujemy i wykonujemy unikatową biżuterię na zamówienie - pierścionki zaręczynowe, obrączki ślubne, naszyjniki, bransoletki i kolczyki ze srebra 925 oraz złota 14K/18K, z naturalnymi kamieniami szlachetnymi. Modelujemy w 3D (Rhino, Fusion 360) od szkicu lub pomysłu, a całość powstaje w technologii traconego wosku z ręcznym wykończeniem.",
      en: "Yes. We design and craft one-of-a-kind custom jewelry - engagement rings, wedding bands, necklaces, bracelets and earrings in 925 sterling silver and 14K/18K gold with natural gemstones. We model in 3D (Rhino, Fusion 360) from a sketch or idea, then produce via lost-wax casting with hand finishing.",
      de: "Ja. Wir entwerfen und fertigen einzigartigen Schmuck nach Maß - Verlobungsringe, Eheringe, Halsketten, Armbänder und Ohrringe aus 925er Sterlingsilber und 14K/18K-Gold mit echten Edelsteinen. Wir modellieren in 3D (Rhino, Fusion 360) aus einer Skizze oder Idee und fertigen im Wachsausschmelzverfahren mit Handveredelung.",
    },
  },
  {
    id: "co-oferuje-aejaca-studio",
    temat: "firma",
    strona: "/",
    q: {
      pl: "Co oferuje AEJaCA sTuDiO?",
      en: "What does AEJaCA sTuDiO offer?",
      de: "Was bietet AEJaCA sTuDiO?",
    },
    a: {
      pl: "AEJaCA sTuDiO to cyfrowa produkcja na zamówienie: modelowanie 3D / CAD części technicznych i funkcjonalnych (Rhino, Fusion 360), druk 3D FDM/SLA, grawerowanie i cięcie laserem CO2, znakowanie laserem fiber, odlewy z żywicy oraz prototypowanie. Możesz przesłać własny plik STL/SVG albo zlecić nam zaprojektowanie modelu od podstaw.",
      en: "AEJaCA sTuDiO is on-demand digital fabrication: 3D modeling / CAD of technical and functional parts (Rhino, Fusion 360), FDM/SLA 3D printing, CO2 laser engraving and cutting, fiber-laser marking, resin casting and prototyping. You can upload your own STL/SVG file or commission a model designed from scratch.",
      de: "AEJaCA sTuDiO ist digitale Fertigung auf Bestellung: 3D-Modellierung / CAD technischer und funktionaler Teile (Rhino, Fusion 360), FDM/SLA-3D-Druck, CO2-Lasergravur und -schnitt, Faserlaser-Markierung, Harzguss und Prototyping. Sie können Ihre eigene STL/SVG-Datei hochladen oder ein Modell von Grund auf entwerfen lassen.",
    },
  },
  {
    id: "ile-kosztuje-zamowienie-i-jak",
    temat: "firma",
    strona: "/",
    q: {
      pl: "Ile kosztuje zamówienie i jak szybko dostanę wycenę?",
      en: "How much does an order cost and how fast is a quote?",
      de: "Was kostet eine Bestellung und wie schnell erhalte ich ein Angebot?",
    },
    a: {
      pl: "Wycenę otrzymasz online w około 30 sekund dzięki kalkulatorom AEJaCA - bez czekania na e-mail. Tryb prosty daje szybki szacunek, a tryb zaawansowany pełną kontrolę nad metalem, kamieniami i wykończeniem. Przykładowo: srebrny pierścionek z kamieniem od 400 zł, brelok z druku 3D od 25 zł.",
      en: "You get an online quote in about 30 seconds with AEJaCA's calculators - no waiting for email. Simple mode gives a quick estimate; advanced mode gives full control over metal, stones and finish. For example: a silver ring with a gemstone from €95, a 3D-printed keychain from €6.",
      de: "Mit den AEJaCA-Rechnern erhalten Sie online in etwa 30 Sekunden ein Angebot - ohne auf eine E-Mail zu warten. Der einfache Modus liefert eine schnelle Schätzung, der erweiterte Modus volle Kontrolle über Metall, Steine und Veredelung. Zum Beispiel: ein Silberring mit Edelstein ab 95 €, ein 3D-gedruckter Schlüsselanhänger ab 6 €.",
    },
  },
  {
    id: "gdzie-znajduje-sie-aejaca",
    temat: "firma",
    strona: "/",
    q: {
      pl: "Gdzie znajduje się AEJaCA i czy wysyłacie za granicę?",
      en: "Where is AEJaCA based and do you ship internationally?",
      de: "Wo befindet sich AEJaCA und versenden Sie international?",
    },
    a: {
      pl: (w) => `Studio mieści się w Józefosławiu pod Warszawą i wysyła na cały świat. W Polsce: paczkomat InPost ${w.paczkomat} zł, kurier ${w.kurier} zł, darmowa wysyłka od ${w.darmowaOd} zł. Realizujemy też dostawy do UE, Wielkiej Brytanii i USA kurierem DHL Express.`,
      en: (w) => `The studio is in Józefosław near Warsaw and ships worldwide. Within Poland: InPost parcel locker PLN ${w.paczkomat}, courier PLN ${w.kurier}, free delivery on orders over PLN ${w.darmowaOd}. We also deliver to the EU, the UK and the USA via DHL Express.`,
      de: (w) => `Das Studio befindet sich in Józefosław bei Warschau und versendet weltweit. Innerhalb Polens: InPost-Paketautomat ${w.paczkomat} PLN, Kurier ${w.kurier} PLN, kostenloser Versand ab ${w.darmowaOd} PLN. Wir liefern auch in die EU, nach Großbritannien und in die USA per DHL Express.`,
    },
  },
];
