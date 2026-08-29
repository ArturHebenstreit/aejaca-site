export const meta = {
  slug: "przyciecie-uproszczenie-skala-stl",
  // Usluga domykajaca wpis, pokazywana pod trescia.
  service: "print_fdm",
  category: "studio",
  accent: "blue",
  publishedAt: "2026-08-29",
  // Ten sam obraz co przy poradniku o przygotowaniu pliku: oba wpisy mowia
  // o tym samym pliku na tym samym etapie. Do wymiany, gdy powstanie wlasny.
  coverImage: "/img/blog/jak-przygotowac-plik-stl.webp",
  readingTime: { pl: 8, en: 7, de: 7 },
  title: {
    pl: "Jak przyciąć, uprościć i przeskalować model STL",
    en: "How to Cut, Simplify and Rescale an STL Model",
    de: "STL-Modell schneiden, vereinfachen und skalieren",
  },
  description: {
    pl: "Cztery operacje, które ratują wydruk: podział modelu większego niż stół, uproszczenie zbyt gęstej siatki, skalowanie bez utraty ścianek i wybór kąta ustawienia.",
    en: "Four operations that save a print: splitting a model bigger than the bed, simplifying a dense mesh, rescaling without losing walls, and choosing the angle.",
    de: "Vier Eingriffe, die den Druck retten: ein zu großes Modell teilen, ein dichtes Netz vereinfachen, ohne Wandverlust skalieren und den Druckwinkel wählen.",
  },
  keywords: {
    pl: "jak przyciąć plik STL, jak uprościć STL, jak przeskalować model STL, optymalny kąt druku 3D, podział modelu na części, AEJaCA sTuDiO",
    en: "how to cut an STL file, simplify STL mesh, rescale STL model, optimal 3D print angle, splitting a model, AEJaCA sTuDiO",
    de: "STL-Datei schneiden, STL-Netz vereinfachen, STL-Modell skalieren, optimaler Druckwinkel, Modell teilen, AEJaCA sTuDiO",
  },
  toc: {
    pl: [
      { id: "przyciecie", label: "Przycięcie i podział" },
      { id: "uproszczenie", label: "Uproszczenie siatki" },
      { id: "skala", label: "Skalowanie" },
      { id: "kat", label: "Kąt ustawienia" },
      { id: "sprawdzenie", label: "Sprawdzenie przed wysyłką" },
    ],
    en: [
      { id: "cutting", label: "Cutting and splitting" },
      { id: "simplify", label: "Simplifying the mesh" },
      { id: "scale", label: "Rescaling" },
      { id: "angle", label: "Print angle" },
      { id: "check", label: "Check before sending" },
    ],
    de: [
      { id: "schneiden", label: "Schneiden und Teilen" },
      { id: "vereinfachen", label: "Netz vereinfachen" },
      { id: "skalieren", label: "Skalieren" },
      { id: "winkel", label: "Druckwinkel" },
      { id: "pruefen", label: "Prüfen vor dem Senden" },
    ],
  },
  faq: {
    pl: [
      {
        q: "Jak przeskalować model ze skali 1:6 na 1:10?",
        a: "Mnożnik to iloraz mianowników w drugą stronę: 6 podzielone przez 10, czyli 0,6. Model zmniejsza się do 60 procent każdego wymiaru, a jego objętość spada do 0,6 do potęgi trzeciej, czyli do około 22 procent. Dlatego cena materiału spada mocniej niż wysokość figurki, a najcieńsze elementy trzeba sprawdzić osobno: 0,8 mm po takim zmniejszeniu to 0,48 mm i przestaje być drukowalne.",
      },
      {
        q: "Czy uproszczenie siatki pogorszy wydruk?",
        a: "Zwykle nie, bo drukarka i tak tnie model na warstwy o wysokości od 0,06 do 0,28 mm i nie widzi trójkątów mniejszych niż jej rozdzielczość. Uproszczenie szkodzi w dwóch miejscach: na dużych powierzchniach walcowych i kulistych, gdzie z okręgu robi się wielokąt, oraz na cienkich krawędziach, które potrafią zniknąć. Prosta zasada: schodź stopniowo i po każdym kroku obejrzyj model z bliska.",
      },
      {
        q: "Pod jakim kątem ustawić model do druku?",
        a: "Nie ma jednego kąta dobrego dla wszystkich modeli. Ustawienie decyduje o trzech rzeczach naraz: ile podpór trzeba postawić, jak widoczne będą schodki na krzywiznach i w którą stronę wydruk będzie najsłabszy, bo warstwy rozchodzą się łatwiej niż pęka materiał. Element narażony na zginanie ustawia się tak, żeby warstwy leżały w poprzek siły, nawet kosztem dłuższego druku.",
      },
    ],
    en: [
      {
        q: "How do I rescale a model from 1:6 to 1:10?",
        a: "The multiplier is the inverse ratio of the denominators: 6 divided by 10, so 0.6. Every dimension drops to 60 percent, while the volume drops to 0.6 cubed, roughly 22 percent. That is why the material cost falls faster than the height of the figure, and the thinnest features need checking separately: 0.8 mm becomes 0.48 mm and stops being printable.",
      },
      {
        q: "Will simplifying the mesh spoil the print?",
        a: "Usually not, because the printer slices the model into layers 0.06 to 0.28 mm high and cannot see triangles smaller than its own resolution. Simplification hurts in two places: on large cylindrical and spherical surfaces, where a circle turns into a polygon, and on thin edges, which can vanish altogether. Go down in steps and inspect the model closely after each one.",
      },
      {
        q: "What angle should the model be printed at?",
        a: "There is no single angle that suits every model. Orientation decides three things at once: how much support is needed, how visible the stair-stepping on curves will be, and which direction the part will be weakest in, because layers separate more easily than the material itself breaks. A part that will be bent is placed so the layers run across the force, even if that means a longer print.",
      },
    ],
    de: [
      {
        q: "Wie skaliere ich ein Modell von 1:6 auf 1:10?",
        a: "Der Faktor ist das umgekehrte Verhältnis der Nenner: 6 geteilt durch 10, also 0,6. Jede Abmessung sinkt auf 60 Prozent, das Volumen dagegen auf 0,6 hoch drei, rund 22 Prozent. Deshalb fallen die Materialkosten stärker als die Höhe der Figur, und die dünnsten Stellen müssen einzeln geprüft werden: aus 0,8 mm werden 0,48 mm, und das ist nicht mehr druckbar.",
      },
      {
        q: "Verschlechtert das Vereinfachen des Netzes den Druck?",
        a: "Meist nicht, denn der Drucker zerlegt das Modell in Schichten von 0,06 bis 0,28 mm und sieht Dreiecke unterhalb seiner Auflösung nicht. Schaden entsteht an zwei Stellen: auf großen zylindrischen und kugeligen Flächen, wo aus dem Kreis ein Vieleck wird, und an dünnen Kanten, die ganz verschwinden können. Schrittweise reduzieren und nach jedem Schritt genau hinsehen.",
      },
      {
        q: "In welchem Winkel sollte das Modell gedruckt werden?",
        a: "Es gibt keinen Winkel, der zu jedem Modell passt. Die Ausrichtung entscheidet über drei Dinge zugleich: wie viel Stützmaterial nötig ist, wie sichtbar die Treppenstufen auf Rundungen werden und in welcher Richtung das Teil am schwächsten ist, denn Schichten lösen sich leichter, als das Material bricht. Ein Teil, das gebogen wird, stellt man quer zur Kraft.",
      },
    ],
  },
  relatedPosts: ["jak-przygotowac-plik-stl", "druk-3d-krok-po-kroku"],
};
