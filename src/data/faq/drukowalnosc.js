// ============================================================
// PYTANIA O SPRAWDZANIE DRUKOWALNOSCI MODELU
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
    id: "czy-moj-plik-gdzies-trafia",
    temat: "narzedzia",
    strona: "/toolstudio/printability/",
    q: {
      pl: "Czy mój plik gdzieś trafia?",
      en: "Does my file go anywhere?",
      de: "Geht meine Datei irgendwohin?",
    },
    a: {
      pl: "Nie. Cała analiza dzieje się w Twojej przeglądarce, w osobnym wątku roboczym. Plik nie jest wysyłany na żaden serwer, nie zapisujemy go i nie mamy do niego dostępu. Możesz sprawdzić: odetnij internet po wczytaniu strony, narzędzie nadal zadziała. Jeden wyjątek warto znać: przy wejściu tutaj z konfiguratora model przejeżdża do tej karty przez pamięć Twojej przeglądarki, żeby nie trzeba było wgrywać go drugi raz. Ten zapis leży na Twoim dysku, kasujemy go w chwili odczytania i wygasa po kwadransie.",
      en: "No. The whole analysis runs in your browser, in a separate worker thread. The file is not uploaded to any server, we do not store it and we have no access to it. You can verify this: disconnect from the internet after the page loads and the tool still works. One exception is worth knowing: if you came here from the configurator, the model travelled to this tab through your browser's own storage, so you would not have to upload it twice. That record sits on your disk, we delete it the moment it is read and it expires after fifteen minutes.",
      de: "Nein. Die gesamte Analyse läuft in Ihrem Browser, in einem eigenen Worker-Thread. Die Datei wird auf keinen Server geladen, wir speichern sie nicht und haben keinen Zugriff darauf. Sie können es prüfen: Trennen Sie nach dem Laden der Seite die Internetverbindung, das Tool arbeitet weiter. Eine Ausnahme sollten Sie kennen: Kommen Sie aus dem Konfigurator, ist das Modell über den Speicher Ihres eigenen Browsers in diesen Tab gelangt, damit Sie es nicht zweimal hochladen müssen. Dieser Eintrag liegt auf Ihrer Festplatte, wir löschen ihn beim Lesen und er verfällt nach einer Viertelstunde.",
    },
  },
  {
    id: "jaka-jest-minimalna-grubosc-scianki",
    temat: "narzedzia",
    strona: "/toolstudio/printability/",
    q: {
      pl: "Jaka jest minimalna grubość ścianki przy dyszy 0,4?",
      en: "What is the minimum wall thickness with a 0.4 nozzle?",
      de: "Wie dünn darf eine Wand bei 0,4 mm Düse sein?",
    },
    a: {
      pl: "Jedna ścieżka to 0,4 mm i tyle da się wydrukować. Ścianka użytkowa powinna mieć dwie ścieżki, czyli około 0,84 mm, bo pojedyncza ścieżka nie ma wiązania poprzecznego i pęka przy nacisku. Poniżej 0,4 mm drukarka nie ma jak niczego ułożyć i w tym miejscu zostanie dziura. Uwaga na kontekst: napis, faktura albo fazka poniżej progu to nie jest ścianka i nie traktujemy tego jak wady. Takie detale po prostu wychodzą zaokrąglone.",
      en: "One path is 0.4 mm and that much will print. A functional wall wants two paths, about 0.84 mm, because a single path has no cross-binding and cracks under pressure. Below 0.4 mm the printer has nothing to lay down and a hole is left. Context matters: lettering, texture or a chamfer below the threshold is not a wall and we do not treat it as a defect. Such detail simply comes out rounded.",
      de: "Eine Bahn misst 0,4 mm, so viel lässt sich drucken. Eine Funktionswand sollte zwei Bahnen haben, etwa 0,84 mm, denn einer einzelnen Bahn fehlt die Querbindung und sie bricht unter Druck. Unter 0,4 mm kann der Drucker nichts ablegen, dort bleibt ein Loch. Auf den Zusammenhang achten: Schrift, Struktur oder eine Fase unterhalb der Grenze ist keine Wand und gilt uns nicht als Mangel. Solche Details kommen einfach abgerundet heraus.",
    },
  },
  {
    id: "czy-przy-dyszy",
    temat: "narzedzia",
    strona: "/toolstudio/printability/",
    q: {
      pl: "Czy przy dyszy 0,2 wydrukuję cieńsze detale?",
      en: "Will a 0.2 nozzle print finer detail?",
      de: "Druckt eine 0,2er Düse feinere Details?",
    },
    a: {
      pl: "Tak, minimum schodzi do 0,2 mm, a bezpieczna ścianka do około 0,42 mm. Cena rośnie, bo ta sama część wymaga więcej ścieżek i więcej warstw, więc druk trwa nawet kilkakrotnie dłużej. Przy detalach poniżej 0,3 mm zwykle sensowniejsza jest żywica.",
      en: "Yes, the minimum drops to 0.2 mm and a safe wall to about 0.42 mm. The price rises, because the same part needs more paths and more layers, so printing takes several times longer. Below roughly 0.3 mm of detail, resin usually makes more sense.",
      de: "Ja, das Minimum sinkt auf 0,2 mm, eine sichere Wand auf etwa 0,42 mm. Der Preis steigt, weil dasselbe Teil mehr Bahnen und mehr Schichten braucht und der Druck ein Vielfaches länger dauert. Unterhalb von etwa 0,3 mm Detail ist Harz meist sinnvoller.",
    },
  },
  {
    id: "co-znaczy-ze-siatka-nie",
    temat: "narzedzia",
    strona: "/toolstudio/printability/",
    q: {
      pl: "Co znaczy, że siatka nie jest szczelna?",
      en: "What does a mesh that is not watertight mean?",
      de: "Was heißt, das Netz sei nicht geschlossen?",
    },
    a: {
      pl: "Że w powierzchni są dziury: krawędzie, przy których brakuje sąsiedniej ścianki. Kilka takich krawędzi to codzienność w plikach z CAD-a i współczesne slicery naprawiają je same, bez słowa, więc nie robimy z tego przeszkody. Warto jednak wiedzieć, bo objętość, z której liczymy cenę, jest wtedy przybliżona. Naprawa jednym kliknięciem: Meshmixer, Blender (3D Print Toolbox) albo funkcja naprawy w PrusaSlicer i Bambu Studio. Inaczej wygląda plik, w którym brzeg to znaczna część krawędzi: to nie jest bryła, tylko powierzchnia, i takiego nie da się wydrukować.",
      en: "That the surface has holes: edges where the neighbouring face is missing. A handful of those is everyday life in CAD exports and modern slicers repair them silently, so we do not make an obstacle of it. It is worth knowing all the same, because the volume we price from is then approximate. One-click repair: Meshmixer, Blender (3D Print Toolbox) or the repair function in PrusaSlicer and Bambu Studio. A file where the boundary makes up a large share of the edges is a different matter: that is a surface rather than a solid and cannot be printed.",
      de: "Dass die Oberfläche Löcher hat: Kanten, an denen die Nachbarfläche fehlt. Ein paar davon sind bei CAD-Exporten Alltag, moderne Slicer reparieren sie stillschweigend, wir machen daraus also kein Hindernis. Wissenswert ist es dennoch, weil das Volumen für den Preis dann angenähert ist. Reparatur per Klick: Meshmixer, Blender (3D Print Toolbox) oder die Reparaturfunktion in PrusaSlicer und Bambu Studio. Anders liegt der Fall bei einer Datei, in der der Rand einen großen Teil der Kanten ausmacht: das ist eine Fläche und kein Körper und lässt sich nicht drucken.",
    },
  },
  {
    id: "kiedy-narzedzie-naprawde-zatrzymuje-zamowienie",
    temat: "narzedzia",
    strona: "/toolstudio/printability/",
    q: {
      pl: "Kiedy narzędzie naprawdę zatrzymuje zamówienie?",
      en: "When does the tool actually hold an order?",
      de: "Wann hält das Tool eine Bestellung wirklich auf?",
    },
    a: {
      pl: "Tylko w trzech przypadkach, w których wydruk nie powstanie: model nie mieści się na stole nawet po obrocie, plik zawiera powierzchnię zamiast zamkniętej bryły, albo przeważająca część modelu jest cieńsza niż jedna ścieżka przy wybranych ustawieniach. Cała reszta, łącznie z cienkimi ściankami na fragmencie modelu i drobnymi nieszczelnościami, jest informacją i niczego nie blokuje. Narzędzie, które odrzuca poprawne modele, jest gorsze niż jego brak.",
      en: "Only in the three cases where no print can result: the model does not fit the plate even rotated, the file holds a surface rather than a closed solid, or the majority of the model is thinner than one path at the chosen settings. Everything else, including thin walls on part of a model and small mesh gaps, is information and blocks nothing. A tool that rejects sound models is worse than no tool.",
      de: "Nur in den drei Fällen, in denen kein Druck entstehen kann: das Modell passt auch gedreht nicht auf die Platte, die Datei enthält eine Fläche statt eines geschlossenen Körpers, oder der überwiegende Teil des Modells ist dünner als eine Bahn bei den gewählten Einstellungen. Alles andere, auch dünne Wände an einem Teil des Modells und kleine Netzlücken, ist Information und blockiert nichts. Ein Werkzeug, das einwandfreie Modelle ablehnt, ist schlechter als gar keines.",
    },
  },
  {
    id: "dlaczego-nie-mierzycie-grubosci-przy",
    temat: "narzedzia",
    strona: "/toolstudio/printability/",
    q: {
      pl: "Dlaczego nie mierzycie grubości przy dziurawej siatce?",
      en: "Why do you not measure thickness on a mesh with holes?",
      de: "Warum messen Sie die Wandstärke bei offenem Netz nicht?",
    },
    a: {
      pl: "Bo wynik byłby nieprawdziwy, a to gorsze niż jego brak. Promień pomiarowy wychodzi z powierzchni w głąb materiału i szuka drugiej strony. Przy dziurze wylatuje przez nią i trafia w przypadkową ściankę po drugiej stronie modelu, pokazując grubość kilkanaście razy większą od rzeczywistej.",
      en: "Because the answer would be wrong, and that is worse than no answer. The measuring ray leaves the surface, travels into the material and looks for the other side. At a hole it escapes and hits a random wall on the far side of the model, reporting a thickness many times the real one.",
      de: "Weil das Ergebnis falsch wäre, und das ist schlimmer als keines. Der Messstrahl verlässt die Oberfläche nach innen und sucht die Gegenseite. An einem Loch entweicht er und trifft eine beliebige Wand auf der anderen Seite des Modells, was ein Vielfaches der echten Stärke anzeigt.",
    },
  },
  {
    id: "model-nie-miesci-sie",
    temat: "narzedzia",
    strona: "/toolstudio/printability/",
    q: {
      pl: "Model nie mieści się na stole. Co dalej?",
      en: "The model does not fit on the plate. Now what?",
      de: "Das Modell passt nicht auf die Platte. Was nun?",
    },
    a: {
      pl: "Albo skalowanie w dół, albo pocięcie na części i sklejenie po wydruku. Cięcie nie jest porażką, przy dużych obiektach to standard, ale miejsce cięcia warto dobrać tak, żeby szew wypadł w krawędzi, a nie na widocznej płaszczyźnie. Napiszcie, podpowiemy gdzie.",
      en: "Either scale it down, or split it and bond the parts after printing. Splitting is not a failure, it is standard on large objects, but the cut is worth placing so the seam falls on an edge rather than a visible face. Write to us and we will suggest where.",
      de: "Entweder verkleinern oder teilen und nach dem Druck fügen. Teilen ist kein Scheitern, bei großen Objekten ist es Standard, aber die Trennstelle sollte so liegen, dass die Naht auf eine Kante fällt und nicht auf eine Sichtfläche. Schreiben Sie uns, wir schlagen eine Stelle vor.",
    },
  },
  {
    id: "czy-100-podpor-to-problem",
    temat: "narzedzia",
    strona: "/toolstudio/printability/",
    q: {
      pl: "Czy 100% podpór to problem?",
      en: "Is a lot of support a problem?",
      de: "Sind viele Stützen ein Problem?",
    },
    a: {
      pl: "Nie, ale kosztuje. Podpory zużywają materiał i czas, a po ich usunięciu zostaje ślad, który trzeba doczyścić. Przy udziale powyżej jednej trzeciej powierzchni warto sprawdzić, czy obrót modelu albo podział na dwie części nie da lepszego efektu taniej.",
      en: "No, but it costs. Support consumes material and time, and leaves a mark that has to be cleaned up. Above roughly a third of the surface it is worth checking whether rotating the model, or splitting it in two, gives a better result for less.",
      de: "Nein, aber sie kosten. Stützen verbrauchen Material und Zeit und hinterlassen Spuren, die nachgearbeitet werden müssen. Ab etwa einem Drittel der Fläche lohnt die Prüfung, ob Drehen oder Teilen ein besseres Ergebnis für weniger Geld bringt.",
    },
  },
  {
    id: "czy-analiza-zastepuje-wydruk-probny",
    temat: "narzedzia",
    strona: "/toolstudio/printability/",
    q: {
      pl: "Czy analiza zastępuje wydruk próbny?",
      en: "Does this replace a test print?",
      de: "Ersetzt die Analyse einen Testdruck?",
    },
    a: {
      pl: "Nie. Opisuje geometrię, a nie zachowanie materiału: skurcz, warping, przyczepność do stołu, sprężystość cienkich elementów. Przy nietypowych kształtach i przy detalach dokładnie na granicy progu odezwij się, sprawdzimy to na maszynie.",
      en: "No. It describes geometry, not how the material behaves: shrinkage, warping, bed adhesion, the springiness of thin features. For unusual shapes, and for detail sitting exactly on the threshold, get in touch and we will check it on the machine.",
      de: "Nein. Sie beschreibt die Geometrie, nicht das Materialverhalten: Schwund, Verzug, Haftung auf der Platte, Federung dünner Elemente. Bei ungewöhnlichen Formen und bei Details genau an der Grenze melden Sie sich, wir prüfen es auf der Maschine.",
    },
  },
];
