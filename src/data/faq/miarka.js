// ============================================================
// PYTANIA O MIARKE DO PIERSCIONKOW
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
    id: "czy-miarka-do-wydruku-jest",
    temat: "narzedzia",
    strona: "/toolsjewelry/ring-sizer/",
    q: {
      pl: "Czy miarka do wydruku jest dokładna?",
      en: "Is a printable ring sizer accurate?",
      de: "Ist ein ausgedrucktes Ringmaßband genau?",
    },
    a: {
      pl: "Tak, pod jednym warunkiem: wydruk musi być w skali 100%. Opcja „Dopasuj do strony” zmniejsza kartkę o kilka procent, co przy obwodzie palca oznacza pomyłkę o jeden do dwóch rozmiarów. Dlatego na arkuszu jest prostokąt w rozmiarze karty płatniczej i linijka 100 mm do sprawdzenia.",
      en: "Yes, on one condition: the sheet has to print at 100% scale. „Fit to page” shrinks it by a few percent, which on a finger circumference is worth one to two sizes. That is why the sheet carries a payment-card rectangle and a 100 mm ruler to check against.",
      de: "Ja, unter einer Bedingung: der Ausdruck muss in 100% erfolgen. „An Seite anpassen” verkleinert das Blatt um einige Prozent, beim Fingerumfang entspricht das ein bis zwei Größen. Deshalb enthält das Blatt ein Bankkarten-Rechteck und ein 100-mm-Lineal zur Kontrolle.",
    },
  },
  {
    id: "o-jakiej-porze-dnia-mierzyc",
    temat: "narzedzia",
    strona: "/toolsjewelry/ring-sizer/",
    q: {
      pl: "O jakiej porze dnia mierzyć palec?",
      en: "What time of day should I measure?",
      de: "Zu welcher Tageszeit sollte man messen?",
    },
    a: {
      pl: "Wieczorem. Rano palce są węższe nawet o pół rozmiaru, a po wysiłku, w upale albo po zmarznięciu różnica dochodzi do całego rozmiaru.",
      en: "In the evening. Fingers are up to half a size slimmer in the morning, and after exercise, in heat or in the cold the swing reaches a full size.",
      de: "Abends. Morgens sind Finger bis zu einer halben Größe schlanker, nach Sport, bei Hitze oder Kälte erreicht der Unterschied eine ganze Größe.",
    },
  },
  {
    id: "czy-rozmiar-eu-to-obwod",
    temat: "narzedzia",
    strona: "/toolsjewelry/ring-sizer/",
    q: {
      pl: "Czy rozmiar EU to obwód palca?",
      en: "Is the EU size the finger circumference?",
      de: "Ist die EU-Größe der Fingerumfang?",
    },
    a: {
      pl: "Tak. W systemie europejskim rozmiar równa się obwodowi palca w milimetrach. Obwód 54 mm to rozmiar 54, czyli średnica wewnętrzna 17,2 mm.",
      en: "Yes. In the European system the size equals the circumference in millimetres. A 54 mm circumference is size 54, which is a 17.2 mm inner diameter.",
      de: "Ja. Im europäischen System entspricht die Größe dem Umfang in Millimetern. 54 mm Umfang ist Größe 54, also 17,2 mm Innendurchmesser.",
    },
  },
  {
    id: "czy-szeroka-obraczka-wymaga-innego",
    temat: "narzedzia",
    strona: "/toolsjewelry/ring-sizer/",
    q: {
      pl: "Czy szeroka obrączka wymaga innego rozmiaru?",
      en: "Does a wide band need a different size?",
      de: "Braucht ein breiter Ring eine andere Größe?",
    },
    a: {
      pl: "Tak. Obrączka szersza niż 6 mm siedzi ciaśniej, bo dotyka większej powierzchni palca. Weź pół rozmiaru więcej niż zmierzony.",
      en: "Yes. A band wider than 6 mm sits tighter because it touches more of the finger. Take half a size up from the measurement.",
      de: "Ja. Ein Ring breiter als 6 mm sitzt enger, weil er mehr Fingerfläche berührt. Nehmen Sie eine halbe Größe mehr als gemessen.",
    },
  },
  {
    id: "mam-duza-kostke-co-wtedy",
    temat: "narzedzia",
    strona: "/toolsjewelry/ring-sizer/",
    q: {
      pl: "Mam dużą kostkę, co wtedy?",
      en: "My knuckle is large, what then?",
      de: "Ich habe einen großen Knöchel, was nun?",
    },
    a: {
      pl: "Zmierz osobno kostkę i nasadę palca, a potem wybierz wartość pośrednią. Pierścionek musi przejść przez kostkę, ale nie może obracać się luźno na nasadzie.",
      en: "Measure the knuckle and the base of the finger separately, then pick a value in between. The ring has to pass the knuckle without spinning loosely at the base.",
      de: "Messen Sie Knöchel und Fingeransatz getrennt und wählen Sie einen Wert dazwischen. Der Ring muss über den Knöchel passen, darf am Ansatz aber nicht lose drehen.",
    },
  },
  {
    id: "czy-da-sie-zmienic-rozmiar",
    temat: "narzedzia",
    strona: "/toolsjewelry/ring-sizer/",
    q: {
      pl: "Czy da się zmienić rozmiar gotowego pierścionka?",
      en: "Can a finished ring be resized?",
      de: "Lässt sich ein fertiger Ring in der Größe ändern?",
    },
    a: {
      pl: "Zwykle tak, ale nie zawsze bez śladu. Przy pierścionku z kamieniami na całym obwodzie albo z grawerem wewnątrz zmiana rozmiaru oznacza ingerencję w zdobienie. Dlatego lepiej ustalić rozmiar przed wykonaniem.",
      en: "Usually yes, but not always invisibly. On a ring set with stones all around, or engraved inside, resizing means touching the decoration. Settling the size before making it is the safer route.",
      de: "Meistens ja, aber nicht immer spurlos. Bei rundum gefassten Steinen oder einer Innengravur greift die Änderung in den Schmuck ein. Die Größe vorher festzulegen ist der sicherere Weg.",
    },
  },
];
