// ============================================================
// LOCAL LANDING PAGES - druk 3D, treść per miasto
// ------------------------------------------------------------
// Dlaczego osobny plik danych, a nie i18n:
// tak samo jak glossary.js i resins.js, to jest treść sterowana
// danymi, a nie pojedyncze etykiety interfejsu.
//
// ZASADA NADRZĘDNA: treść każdego miasta musi być realnie inna.
// Sklonowane strony z podmienioną nazwą miasta Google traktuje
// jako strony przejściowe (doorway pages) i obniża całą witrynę.
// Różnicujemy: sposób odbioru, czas dojazdu, typ odbiorcy,
// przykłady zleceń i FAQ.
// ============================================================

export const LOCAL_PAGES = {
  piaseczno: {
    id: "piaseczno",
    path: "/druk-3d-piaseczno/",
    seoKey: "druk3dPiaseczno",
    city: "Piaseczno",
    pl: {
      h1: "Druk 3D Piaseczno",
      lead: "Pracownia druku 3D w Józefosławiu, 10 minut od centrum Piaseczna. Odbierzesz osobiście, bez czekania na kuriera.",
      introTitle: "Najbliższa drukarnia 3D w okolicy",
      intro: "Nasza pracownia stoi w Józefosławiu, przy samej granicy Piaseczna. W praktyce oznacza to, że wydruk zamówiony rano możesz odebrać po pracy tego samego dnia albo następnego, bez pośrednictwa kuriera i bez kosztu wysyłki. Przy prototypach, gdzie zwykle potrzeba dwóch albo trzech poprawek, ta różnica skraca cały projekt z dwóch tygodni do kilku dni.",
      whoTitle: "Dla kogo najczęściej drukujemy w Piasecznie",
      who: [
        "Mieszkańcy, którym pękła część w sprzęcie AGD, w wózku, w meblu albo w rowerze i nie da się jej już kupić",
        "Lokalne warsztaty i firmy usługowe potrzebujące uchwytów, adapterów i szablonów montażowych",
        "Modelarze i gracze, którym zależy na detalu z żywicy 16K",
        "Rodzice szukający jednej sztuki prezentu, którego nie ma w sklepie",
      ],
      pickupTitle: "Odbiór osobisty",
      pickup: "Odbiór po wcześniejszym umówieniu, w Józefosławiu. Dojazd z centrum Piaseczna zajmuje około 10 minut samochodem. Możesz też przywieźć uszkodzoną część na miejsce, obejrzymy ją razem i od razu powiemy, czy da się ją odtworzyć.",
      faq: [
        {
          q: "Czy mogę odebrać wydruk osobiście w Piasecznie?",
          a: "Tak, po wcześniejszym umówieniu terminu. Pracownia mieści się w Józefosławiu, około 10 minut jazdy od centrum Piaseczna. Odbiór osobisty jest bezpłatny.",
        },
        {
          q: "Nie mam pliku 3D, mam tylko zepsutą część. Poradzicie sobie?",
          a: "Tak. Odtwarzamy geometrię na podstawie zdjęć i pomiarów albo modelujemy część od zera w Rhino lub Fusion 360. Modelowanie wyceniamy osobno od samego druku, więc od razu wiesz, za co płacisz.",
        },
        {
          q: "Ile trwa realizacja?",
          a: "Zwykle 3 do 5 dni roboczych od zatwierdzenia wyceny. Przy prostych kształtach i odbiorze osobistym często udaje się szybciej, bo odpada czas dostawy.",
        },
        {
          q: "Jaka jest minimalna wartość zamówienia?",
          a: "49 zł. Drukujemy od jednej sztuki, nie ma minimalnego nakładu.",
        },
      ],
    },
    en: {
      h1: "3D Printing in Piaseczno",
      lead: "A 3D printing workshop in Józefosław, 10 minutes from central Piaseczno. Collect in person, no waiting for a courier.",
      introTitle: "The nearest 3D printing workshop",
      intro: "Our workshop sits in Józefosław, right on the Piaseczno border. In practice a print ordered in the morning can be collected after work the same or the next day, with no courier and no shipping cost. On prototypes, where two or three revisions are the norm, that shortens a project from two weeks to a few days.",
      whoTitle: "Who we usually print for in Piaseczno",
      who: [
        "Residents with a broken part in an appliance, a pram, a piece of furniture or a bike that is no longer sold",
        "Local workshops and service firms needing jigs, adapters and assembly templates",
        "Modellers and gamers who want 16K resin detail",
        "Parents looking for a single gift that no shop carries",
      ],
      pickupTitle: "Personal collection",
      pickup: "Collection by appointment, in Józefosław, roughly 10 minutes by car from central Piaseczno. You can also bring the broken part in person, we will look at it together and tell you straight away whether it can be reproduced.",
      faq: [
        {
          q: "Can I collect my print in person in Piaseczno?",
          a: "Yes, by appointment. The workshop is in Józefosław, about 10 minutes from central Piaseczno. Collection is free of charge.",
        },
        {
          q: "I have no 3D file, only a broken part. Can you work with that?",
          a: "Yes. We reconstruct the geometry from photographs and measurements, or model the part from scratch in Rhino or Fusion 360. Modelling is quoted separately from printing, so you always see what you are paying for.",
        },
        {
          q: "How long does it take?",
          a: "Usually 3 to 5 working days from quote approval. Simple shapes collected in person are often ready sooner, since delivery time drops out.",
        },
        {
          q: "What is the minimum order?",
          a: "49 PLN. We print from a single piece, there is no minimum run.",
        },
      ],
    },
    de: {
      h1: "3D-Druck Piaseczno",
      lead: "3D-Druckwerkstatt in Józefosław, 10 Minuten vom Zentrum Piasecznos. Abholung vor Ort, ohne auf einen Kurier zu warten.",
      introTitle: "Die nächstgelegene 3D-Druckerei",
      intro: "Unsere Werkstatt liegt in Józefosław, direkt an der Grenze zu Piaseczno. Ein morgens bestellter Druck lässt sich dadurch oft noch am selben oder am nächsten Tag abholen, ohne Kurier und ohne Versandkosten. Bei Prototypen, die üblicherweise zwei bis drei Korrekturschleifen brauchen, verkürzt das ein Projekt von zwei Wochen auf wenige Tage.",
      whoTitle: "Für wen wir in Piaseczno drucken",
      who: [
        "Anwohner mit einem gebrochenen Teil in Haushaltsgerät, Kinderwagen, Möbel oder Fahrrad, das es nicht mehr zu kaufen gibt",
        "Lokale Werkstätten und Dienstleister, die Halterungen, Adapter und Montageschablonen brauchen",
        "Modellbauer und Spieler, denen es auf 16K-Harzdetails ankommt",
        "Eltern auf der Suche nach einem Einzelstück, das kein Laden führt",
      ],
      pickupTitle: "Persönliche Abholung",
      pickup: "Abholung nach Terminvereinbarung in Józefosław, etwa 10 Autominuten vom Zentrum Piasecznos. Sie können das defekte Teil auch vorbeibringen, wir sehen es uns gemeinsam an und sagen sofort, ob es sich nachbauen lässt.",
      faq: [
        {
          q: "Kann ich meinen Druck in Piaseczno persönlich abholen?",
          a: "Ja, nach Terminvereinbarung. Die Werkstatt liegt in Józefosław, rund 10 Minuten vom Zentrum Piasecznos. Die Abholung ist kostenlos.",
        },
        {
          q: "Ich habe keine 3D-Datei, nur ein defektes Teil. Geht das?",
          a: "Ja. Wir rekonstruieren die Geometrie aus Fotos und Maßen oder modellieren das Teil von Grund auf in Rhino oder Fusion 360. Die Modellierung wird getrennt vom Druck ausgewiesen.",
        },
        {
          q: "Wie lange dauert die Umsetzung?",
          a: "In der Regel 3 bis 5 Werktage ab Freigabe des Angebots. Einfache Formen mit Abholung sind oft schneller fertig, weil die Versandzeit entfällt.",
        },
        {
          q: "Wie hoch ist der Mindestbestellwert?",
          a: "49 PLN. Wir drucken ab einem Stück, es gibt keine Mindestauflage.",
        },
      ],
    },
  },

  warszawa: {
    id: "warszawa",
    path: "/druk-3d-warszawa/",
    seoKey: "druk3dWarszawa",
    city: "Warszawa",
    pl: {
      h1: "Druk 3D Warszawa",
      lead: "Druk FDM i żywiczny dla Warszawy. Wyceniamy z pliku STL, wysyłamy Paczkomatem albo kurierem następnego dnia po wykonaniu.",
      introTitle: "Druk 3D na zamówienie dla Warszawy",
      intro: "Pracownia mieści się w Józefosławiu, tuż za południową granicą miasta, więc przesyłka do Warszawy idzie jedną nocą. Obsługujemy zarówno pojedyncze sztuki dla osób prywatnych, jak i krótkie serie dla firm. Nie mamy minimalnego nakładu i nie wymagamy, żeby klient przychodził z gotowym plikiem: jeśli masz tylko pomysł albo zdjęcie części, zamodelujemy ją sami.",
      whoTitle: "Typowe zlecenia z Warszawy",
      who: [
        "Prototypy dla firm i zespołów produktowych, w krótkich seriach i z kolejnymi iteracjami",
        "Makiety i modele architektoniczne dla pracowni projektowych",
        "Elementy scenografii, rekwizyty i modele wystawiennicze",
        "Wzorce odlewnicze dla warsztatów jubilerskich bez własnej drukarki żywicznej",
        "Części zamienne i uchwyty, których nie ma już w sprzedaży",
      ],
      pickupTitle: "Dostawa w Warszawie",
      pickup: "Paczkomat InPost albo kurier, nadanie następnego dnia roboczego po zakończeniu produkcji. Dla zleceń firmowych możliwy odbiór osobisty w Józefosławiu po umówieniu, około 20 minut od Ursynowa.",
      faq: [
        {
          q: "Czy wyceniacie z pliku od razu?",
          a: "Tak. Wgraj plik STL do kalkulatora na stronie, a dostaniesz wycenę na podstawie objętości modelu, wybranego materiału i nakładu. Nietypowe geometrie weryfikujemy ręcznie przed potwierdzeniem.",
        },
        {
          q: "Realizujecie krótkie serie dla firm?",
          a: "Tak, do kilkudziesięciu sztuk. Przy druku żywicznym liczba sztuk mieszczących się na jednej platformie zależy od gabarytu modelu, więc przy większych nakładach termin ustalamy indywidualnie.",
        },
        {
          q: "Wystawiacie fakturę?",
          a: "Tak, dla firm i osób prywatnych.",
        },
        {
          q: "Jak długo idzie przesyłka do Warszawy?",
          a: "Nadajemy następnego dnia roboczego po zakończeniu produkcji, a Paczkomat i kurier docierają do Warszawy zwykle w ciągu jednego dnia.",
        },
      ],
    },
    en: {
      h1: "3D Printing in Warsaw",
      lead: "FDM and resin printing for Warsaw. We quote from your STL file and ship by parcel locker or courier the next working day.",
      introTitle: "Custom 3D printing for Warsaw",
      intro: "The workshop sits in Józefosław, just beyond the southern edge of the city, so a parcel reaches Warsaw overnight. We handle single pieces for individuals and short runs for companies alike. There is no minimum order, and you do not need a finished file: if you only have an idea or a photograph of a part, we will model it.",
      whoTitle: "Typical work from Warsaw",
      who: [
        "Prototypes for companies and product teams, in short runs and successive iterations",
        "Architectural models and massing studies for design studios",
        "Set pieces, props and exhibition models",
        "Casting patterns for jewellery workshops without a resin printer of their own",
        "Spare parts and brackets that are no longer sold",
      ],
      pickupTitle: "Delivery in Warsaw",
      pickup: "InPost parcel locker or courier, dispatched the next working day after production ends. Business orders can also be collected in person in Józefosław by appointment, roughly 20 minutes from Ursynów.",
      faq: [
        {
          q: "Do you quote straight from a file?",
          a: "Yes. Upload an STL to the calculator on the site and you get a quote based on model volume, chosen material and quantity. Unusual geometry is checked by hand before we confirm.",
        },
        {
          q: "Do you take short runs for companies?",
          a: "Yes, up to a few dozen pieces. In resin printing the number of parts per build plate depends on model size, so lead time on larger runs is agreed individually.",
        },
        {
          q: "Do you issue invoices?",
          a: "Yes, for both companies and private customers.",
        },
        {
          q: "How long does delivery to Warsaw take?",
          a: "We dispatch the next working day after production, and both parcel lockers and couriers usually reach Warsaw within a day.",
        },
      ],
    },
    de: {
      h1: "3D-Druck Warschau",
      lead: "FDM- und Harzdruck für Warschau. Angebot direkt aus Ihrer STL-Datei, Versand per Paketstation oder Kurier am nächsten Werktag.",
      introTitle: "3D-Druck nach Maß für Warschau",
      intro: "Die Werkstatt liegt in Józefosław, direkt hinter der südlichen Stadtgrenze, sodass eine Sendung Warschau über Nacht erreicht. Wir fertigen Einzelstücke für Privatpersonen ebenso wie Kleinserien für Unternehmen. Es gibt keine Mindestauflage, und eine fertige Datei ist keine Voraussetzung: Wenn Sie nur eine Idee oder ein Foto des Teils haben, modellieren wir es.",
      whoTitle: "Typische Aufträge aus Warschau",
      who: [
        "Prototypen für Unternehmen und Produktteams, in Kleinserien und mehreren Iterationen",
        "Architekturmodelle und Studien für Planungsbüros",
        "Bühnenelemente, Requisiten und Ausstellungsmodelle",
        "Gussmodelle für Goldschmiedewerkstätten ohne eigenen Harzdrucker",
        "Ersatzteile und Halterungen, die nicht mehr erhältlich sind",
      ],
      pickupTitle: "Lieferung in Warschau",
      pickup: "InPost-Paketstation oder Kurier, Versand am nächsten Werktag nach Produktionsende. Geschäftskunden können nach Absprache auch persönlich in Józefosław abholen, etwa 20 Minuten von Ursynów.",
      faq: [
        {
          q: "Erstellen Sie das Angebot direkt aus der Datei?",
          a: "Ja. Laden Sie eine STL-Datei in den Kalkulator auf der Website, und Sie erhalten ein Angebot auf Basis von Modellvolumen, Material und Stückzahl. Ungewöhnliche Geometrien prüfen wir vor der Bestätigung manuell.",
        },
        {
          q: "Übernehmen Sie Kleinserien für Unternehmen?",
          a: "Ja, bis zu einigen Dutzend Stück. Beim Harzdruck hängt die Zahl der Teile pro Bauplattform von der Modellgröße ab, daher werden Termine bei größeren Auflagen individuell vereinbart.",
        },
        {
          q: "Stellen Sie Rechnungen aus?",
          a: "Ja, für Unternehmen und Privatpersonen.",
        },
        {
          q: "Wie lange dauert der Versand nach Warschau?",
          a: "Wir versenden am nächsten Werktag nach Produktionsende, Paketstation und Kurier erreichen Warschau meist innerhalb eines Tages.",
        },
      ],
    },
  },
};

// Wspólne dla obu stron: park maszynowy i materiały. To są fakty
// techniczne, więc powtórzenie ich nie czyni ze stron duplikatów,
// tak samo jak specyfikacja produktu powtarza się u każdego dealera.
export const LOCAL_MACHINES = [
  {
    name: "Bambu Lab H2D",
    tech: "FDM",
    specs: { pl: "Pole robocze do 32 cm", en: "Build area up to 32 cm", de: "Bauraum bis 32 cm" },
    materials: "PLA, PETG, ABS, PA6-CF, PPA-CF",
  },
  {
    name: "Elegoo Saturn 4 Ultra 16K",
    tech: "MSLA",
    specs: { pl: "21,8 x 12,3 x 25 cm, warstwa od 0,03 mm", en: "21.8 x 12.3 x 25 cm, layer from 0.03 mm", de: "21,8 x 12,3 x 25 cm, Schicht ab 0,03 mm" },
    materials: { pl: "Żywice standardowe, techniczne i odlewnicze", en: "Standard, technical and castable resins", de: "Standard-, Technik- und Gussharze" },
  },
];
