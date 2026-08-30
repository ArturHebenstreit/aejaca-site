// ============================================================
// PYTANIA O AEJACA STUDIO
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
    id: "jaka-jest-minimalna-ilosc-zamowienia",
    temat: "studio",
    strona: "/studio/",
    q: {
      pl: "Jaka jest minimalna ilość zamówienia?",
      en: "What's the minimum order quantity?",
      de: "Gibt es eine Mindestbestellmenge?",
    },
    a: {
      pl: "Przyjmujemy zamówienia na pojedyncze prototypy oraz produkcję seryjną. Brak minimalnej ilości.",
      en: "We accept single prototype orders as well as batch production. No minimum quantity required.",
      de: "Wir nehmen Einzelprototyp-Aufträge ebenso wie Serienproduktion an. Keine Mindestmenge erforderlich.",
    },
  },
  {
    id: "jak-dlugo-trwa-typowy-projekt",
    temat: "studio",
    strona: "/studio/",
    q: {
      pl: "Jak długo trwa typowy projekt?",
      en: "How long does a typical project take?",
      de: "Wie lange dauert ein typisches Projekt?",
    },
    a: {
      pl: "Proste projekty: 1–3 dni. Złożone prototypy: 1–2 tygodnie. Terminy produkcji seryjnej zależą od ilości.",
      en: "Simple projects: 1–3 days. Complex prototypes: 1–2 weeks. Batch production timelines depend on quantity.",
      de: "Einfache Projekte: 1–3 Tage. Komplexe Prototypen: 1–2 Wochen. Serienproduktion je nach Menge.",
    },
  },
  {
    id: "czy-moge-dostarczyc-wlasne-pliki",
    temat: "studio",
    strona: "/studio/",
    q: {
      pl: "Czy mogę dostarczyć własne pliki 3D?",
      en: "Can you work from my own 3D files?",
      de: "Können Sie mit meinen eigenen 3D-Dateien arbeiten?",
    },
    a: {
      pl: "Tak! Przyjmujemy STL, STEP, OBJ i większość popularnych formatów CAD. Możemy też zaprojektować od zera.",
      en: "Yes! We accept STL, STEP, OBJ, and most common CAD formats. We can also design from scratch.",
      de: "Ja! Wir akzeptieren STL, STEP, OBJ und die meisten gängigen CAD-Formate. Wir können auch von Grund auf designen.",
    },
  },
  {
    id: "z-jakimi-materialami-pracujecie",
    temat: "studio",
    strona: "/studio/",
    q: {
      pl: "Z jakimi materiałami pracujecie?",
      en: "What materials do you work with?",
      de: "Mit welchen Materialien arbeiten Sie?",
    },
    a: {
      pl: "PLA, PETG, ABS, żywica do druku 3D. Metale, drewno, akryl, szkło, skóra do pracy laserowej. Żywice UV i epoksydowe do odlewów.",
      en: "PLA, PETG, ABS, resin for 3D printing. Metals, wood, acrylic, glass, leather for laser work. UV and epoxy resins for casting.",
      de: "PLA, PETG, ABS, Harz für 3D-Druck. Metalle, Holz, Acryl, Glas, Leder für Laserarbeiten. UV- und Epoxidharze für Guss.",
    },
  },
  {
    id: "czy-oferujecie-uslugi-projektowania",
    temat: "studio",
    strona: "/studio/",
    q: {
      pl: "Czy oferujecie usługi projektowania?",
      en: "Do you offer design services?",
      de: "Bieten Sie Designdienstleistungen an?",
    },
    a: {
      pl: "Oczywiście. Zapewniamy pełne usługi projektowania CAD, od koncepcji po pliki gotowe do produkcji.",
      en: "Absolutely. Our team provides full CAD design services, from concept to manufacturing-ready files.",
      de: "Selbstverständlich. Unser Team bietet vollständige CAD-Design-Services, vom Konzept bis zu fertigungsreifen Dateien.",
    },
  },
  {
    id: "jak-kalkulowane-sa-ceny",
    temat: "studio",
    strona: "/studio/",
    q: {
      pl: "Jak kalkulowane są ceny?",
      en: "How are prices calculated?",
      de: "Wie werden Preise berechnet?",
    },
    a: {
      pl: "Na podstawie technologii, materiału, rozmiaru, złożoności i ilości. Zawsze podajemy szczegółową wycenę z góry.",
      en: "Based on technology, material, size, complexity, and quantity. We always provide a detailed quote upfront.",
      de: "Basierend auf Technologie, Material, Größe, Komplexität und Menge. Wir erstellen immer vorab ein detailliertes Angebot.",
    },
  },
  {
    id: "ile-trwa-realizacja-projektu",
    temat: "studio",
    strona: "/studio/",
    q: {
      pl: "Ile trwa realizacja projektu?",
      en: "How long does project fulfillment take?",
      de: "Wie lange dauert die Projektabwicklung?",
    },
    a: {
      pl: "Jeśli materiał jest na stanie, realizacja trwa 3–5 dni roboczych (w zależności od ilości). Zamówienie materiałów wydłuża czas o 3–7 dni. W przypadku, gdy realizacja zamówienia wymaga sprowadzenia specjalistycznych komponentów zgodnych ze specyfikacją (np. konkretne kamienie, nietypowe filamenty, komponenty elektroniczne), czas realizacji może wydłużyć się o dodatkowe 7–14 dni roboczych.",
      en: "If material is in stock, fulfillment takes 3–5 business days (depending on quantity). Ordering materials extends the timeline by 3–7 days. If the order requires sourcing specialized components to match the specification (e.g., specific gemstones, specialty filaments, electronic components), fulfillment may take an additional 7–14 business days.",
      de: "Bei vorhandenem Material 3–5 Werktage (je nach Menge). Materialbestellung verlängert die Zeit um 3–7 Tage. Wenn die Auftragsausführung die Beschaffung spezialisierter Komponenten gemäß der Spezifikation erfordert (z. B. bestimmte Edelsteine, Spezialfilamente, elektronische Bauteile), kann sich die Lieferzeit um weitere 7–14 Werktage verlängern.",
    },
  },
];
