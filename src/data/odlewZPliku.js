// ============================================================
// STRONA USLUGI: ODLEW Z PLIKU KLIENTA
// ============================================================
// Tresc strony `/uslugi/odlew-z-pliku/` w trzech jezykach. Osobny plik danych,
// a nie `src/i18n/`, z tego samego powodu co `localPages.js` i `glossary.js`:
// to jest tresc sterowana danymi, a nie zbior etykiet interfejsu.
//
// POWOD ISTNIENIA STRONY. Do dzis klient poznawal nasze wymagania dopiero
// w kreatorze, po wgraniu pliku, czyli najpozniej jak sie da: model juz
// powstal, a dopiero wtedy okazywalo sie, ze scianka jest za cienka albo ze
// skurcz zostal policzony dwa razy. Ta strona przesuwa te wiedze PRZED
// modelowanie.
//
// ZADNEJ LICZBY NIE MA W TYM PLIKU. Grubosci, skurcz, gestosc, naddatki,
// koperta kolby i prog rozbieznosci otworu siedza w swoich modulach i strona
// czyta je stamtad (`OdlewZPliku.jsx`). Liczba przepisana do tresci
// marketingowej rozjezdza sie z warsztatem przy pierwszej korekcie, a rozjazd
// w obietnicy danej klientowi jest drozszy od rozjazdu w kodzie.
//
// Wersja polska jest wiazaca, angielska i niemiecka sa jej tlumaczeniem.

export const ODLEW_Z_PLIKU = {
  path: "/uslugi/odlew-z-pliku/",
  seoKey: "odlewZPliku",
};

export const ODLEW_TRESC = {
  pl: {
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    kicker: "Odlew w srebrze i złocie",
    h1: "Odlew z Twojego pliku",
    lead: "Przysyłasz model 3D, my drukujemy z niego wzorzec i odlewamy go w srebrze albo w złocie. Ta strona mówi, czego model potrzebuje, zanim plik trafi do kreatora.",

    introTitle: "Model do odlewu to nie to samo, co model do druku",
    intro: [
      "Wydruk jest wyrobem gotowym: to, co widać na ekranie, wychodzi z drukarki. Odlew jest dopiero początkiem drogi. Wzorzec z żywicy wypala się w masie formierskiej, metal wlany na jego miejsce kurczy się przy stygnięciu, a powierzchnia surowego odlewu idzie potem pod szlif i poler.",
      "Każdy z tych trzech kroków zmienia wymiar o dziesiąte części milimetra i żadnego z nich nie widać w pliku. Dlatego o model do odlewu pytamy więcej niż o model do druku. Nie po to, żeby postawić przeszkodę, tylko po to, żeby wyrób, który weźmiesz do ręki, miał wymiar, który podajesz.",
    ],

    zasadaTytul: "Podajesz wymiar gotowy, resztą zajmujemy się my",
    zasadaTresc: "Model ma mieć wymiary wyrobu, który chcesz dostać. Skurcz metalu, naddatek na szlif i układ wlewowy dokładamy u siebie, według tabel z tej strony. Przed potwierdzeniem zamówienia pokazujemy cały rachunek: wymiar docelowy, naddatek, mnożnik skurczu i wymiar wzorca, który pójdzie do druku.",
    zasadaTolerancja: (tol) => `Proces odlewniczy trzyma wymiar z dokładnością ${tol} i tyle obiecujemy. Tam, gdzie potrzebna jest większa dokładność, lepiej sprawdza się obróbka po odlaniu, a to ustalamy osobno.`,

    gruboscTytul: "Minimalne grubości w gotowym wyrobie",
    gruboscWstep: "Dwie kolumny, bo to są dwa różne zdania. „Minimum” to granica, poniżej której odlew się nie wypełni i zamówienia nie przyjmujemy. „Bezpiecznie” to grubość, przy której odwzorowanie jest pewne niezależnie od tego, jak model ułoży się w kolbie. Między jedną a drugą odlejemy, ale bez obietnicy pełnego odwzorowania.",
    gruboscCecha: "Cecha modelu",
    gruboscMin: "Minimum",
    gruboscPewne: "Bezpiecznie",
    gruboscMierzona: "mierzone automatycznie z pliku",
    gruboscUwaga: "Grubość ścianki mierzymy automatycznie z wgranego pliku. Pozostałych wierszy nie da się rozpoznać w siatce trójkątów, bo trzeba by wiedzieć, czym dana cecha jest: te wartości zostają decyzją przy projektowaniu.",

    metaleTytul: "Metale, które odlewamy",
    metaleWstep: "Skurcz to mnożnik, o który powiększamy wzorzec, żeby odlew wyszedł w Twoim wymiarze. Gęstość służy do policzenia masy, a masa kruszcu jest głównym składnikiem rachunku. Pokazujemy obie liczby, bo z nich wychodzi wszystko, co dzieje się z modelem po drodze.",
    metaleStop: "Stop",
    metaleSkurcz: "Skurcz",
    metaleGestosc: "Gęstość",
    metaleUwaga: "W tabeli stoi gęstość podstawowa stopu. Białe złoto bierze cięższe domieszki, więc przy tej samej bryle waży zauważalnie więcej niż żółte, i wycena liczy je osobno.",

    nieMusiszTytul: "Czego nie musisz robić",
    nieMusisz: [
      {
        t: "Nie musisz skalować modelu o skurcz",
        d: "Robimy to sami, mnożnikiem właściwym dla stopu wybranego w zamówieniu. Jeśli plik jest już powiększony, wystarczy wskazać w kreatorze stop, dla którego był skalowany: doskalujemy wtedy samą różnicę, a przy zgodnym stopie plik idzie do druku nietknięty.",
      },
      {
        t: "Nie dodawaj układu wlewowego",
        d: "Kanały i stożek wlewowy ustawiamy sami, bo ich miejsce zależy od tego, jak model stanie w kolbie i którędy metal ma dojść najdalej. Wlew dodany w pliku i tak trzeba by odciąć.",
      },
      {
        t: "Nie dodawaj naddatku na obróbkę",
        d: "Otwór obrączki zwężamy sami, bo szlif otwór powiększa. Naddatek na powierzchni zewnętrznej dokładamy tylko przy zamówieniu z polerem lustrzanym. Obie wartości znajdziesz w rachunku, który widać przed potwierdzeniem.",
      },
      {
        t: "Nie dodawaj naddatku na powierzchni zdobionej",
        d: "Tekstura, młotkowanie, grawer i relief nie dostają naddatku nigdy, niezależnie od wybranego wykończenia. Szlif zabrałby ten detal, dla którego składasz zamówienie. Zaznacz w kreatorze, że powierzchnia jest zdobiona, a naddatek schodzi do zera.",
      },
    ],

    plikTytul: "Czego potrzebuje plik",
    plik: [
      { t: "Formaty i rozmiar", d: (f, mb) => `Przyjmujemy ${f}, do ${mb}. Ten sam zestaw co w druku 3D, bo klient nie ma powodu pamiętać, że odlew czyta plik inaczej.` },
      { t: "Jednostki", d: (bez) => `${bez} nie niosą jednostki w formacie, więc czytamy je jako milimetry. Pozostałe formaty jednostkę niosą i wtedy bierzemy ją z pliku.` },
      { t: "Bryła zamknięta", d: "Siatka bez otwartych krawędzi. Bez tego nie da się odczytać, gdzie jest metal, a gdzie powietrze, i żadna wycena z takiego pliku nie jest wiążąca." },
      { t: "Jedna bryła", d: "Kilka przenikających się brył zostawia we wnętrzu obszar niezdefiniowany. Złóż je działaniem Boolean Union albo zamów naprawę pliku u nas." },
      { t: "Gabaryt kolby", d: (k) => `Model musi zmieścić się w świetle kolby, czyli ${k}. Liczy się przekątna podstawy, bo kolba jest walcem, a nie prostopadłościanem: rzecz płaska i szeroka mieści się lepiej, niż wygląda. Co większe, idzie na wycenę indywidualną.` },
      { t: "Otwór na palec", d: (prog) => `Przy obrączce, pierścionku i bransolecie sztywnej podajesz średnicę otworu w gotowym wyrobie. Gdy otwór zmierzony w pliku różni się od podanego rozmiaru o więcej niż ${prog}, zamówienie się zatrzymuje: roztoczenie otworu zabiera grubość szyny, więc nie poprawiamy tego bez rozmowy.` },
    ],
    plikSprawdzamy: "Po wgraniu pliku liczymy szczelność, liczbę brył, gabaryt, najcieńszą ściankę i średnicę otworu. Wynik widać od razu, jeszcze przed złożeniem zamówienia, a nie w mailu dzień później. Przy bardzo gęstej siatce pomiar grubości pomijamy i sprawdzamy ją ręcznie, a kreator mówi o tym wprost.",

    dostajeszTytul: "Co dostajesz",
    dostajesz: [
      { t: "Odlew w wybranym stopie", d: "Srebro 800 albo 925, złoto 9K, 14K albo 18K. Kruszec możesz wziąć nasz albo powierzyć własny." },
      { t: "Obróbkę w wybranym zakresie", d: "Od surowego odlewu z odciętymi kanałami po wykończenie jubilerskie, czyli szlif, poler i kontrolę przed wydaniem. Poziom wybierasz w kreatorze i widzisz, co każdy z nich obejmuje." },
      { t: "Kanały wlewowe tam, gdzie są Twoje", d: "Przy kruszcu powierzonym metal z kanałów jest Twój, więc jedzie razem z odlewem. Przy kruszcu naszym kanały zostają u nas i wracają do przetopu." },
      { t: "Cechowanie po ustaleniu", d: "Znak wytwórcy AEJaCA i zgłoszenie do Urzędu Probierczego, na życzenie przy zamówieniu. Wyrób można też odebrać bez cech, obowiązek zgłoszenia przechodzi wtedy na odbiorcę." },
    ],

    faqTytul: "Najczęstsze pytania",

    ctaTytul: "Masz gotowy plik?",
    ctaTresc: "Wgraj model do kreatora odlewu. Po wgraniu zobaczysz sprawdzenie geometrii i pełny rachunek wymiaru, zanim cokolwiek potwierdzisz.",
    ctaKalkulator: "Przejdź do kreatora odlewu",
    ctaKontakt: "Zapytaj o model",
  },

  en: {
    breadHome: "Home",
    breadStudio: "sTuDiO",
    kicker: "Casting in silver and gold",
    h1: "Casting from your file",
    lead: "You send a 3D model, we print a pattern from it and cast it in silver or gold. This page explains what the model needs, before the file reaches the configurator.",

    introTitle: "A model for casting is not a model for printing",
    intro: [
      "A print is the finished object: what you see on screen comes out of the printer. A casting is only the beginning. The resin pattern burns out of the investment, the metal poured into its place shrinks as it cools, and the surface of the raw casting then goes under the grinder and the polisher.",
      "Each of those three steps moves the dimension by tenths of a millimetre, and none of them is visible in the file. That is why we ask more about a casting model than about a printing model. Not to put an obstacle in the way, but so that the piece you finally hold has the dimension you gave us.",
    ],

    zasadaTytul: "You give the finished dimension, we handle the rest",
    zasadaTresc: "The model should carry the dimensions of the piece you want to receive. Metal shrinkage, the grinding allowance and the sprue layout are added on our side, following the tables on this page. Before you confirm an order we show the whole calculation: target dimension, allowance, shrinkage factor and the pattern size that goes to the printer.",
    zasadaTolerancja: (tol) => `The casting process holds a dimension to ${tol}, and that is what we promise. Where tighter accuracy is needed, machining after casting works better, and we agree that separately.`,

    gruboscTytul: "Minimum thicknesses in the finished piece",
    gruboscWstep: "Two columns, because these are two different statements. “Minimum” is the limit below which the casting will not fill and we do not take the order. “Safe” is the thickness at which reproduction is certain regardless of how the model sits in the flask. Between the two we will cast, but without a promise of full reproduction.",
    gruboscCecha: "Model feature",
    gruboscMin: "Minimum",
    gruboscPewne: "Safe",
    gruboscMierzona: "measured automatically from the file",
    gruboscUwaga: "Wall thickness is measured automatically from the uploaded file. The other rows cannot be recognised in a triangle mesh, because that would mean knowing what each feature is: those values stay a design decision.",

    metaleTytul: "Metals we cast",
    metaleWstep: "Shrinkage is the factor by which we enlarge the pattern so the casting comes out at your dimension. Density gives the mass, and the mass of precious metal dominates the bill. We show both numbers, because everything that happens to the model along the way follows from them.",
    metaleStop: "Alloy",
    metaleSkurcz: "Shrinkage",
    metaleGestosc: "Density",
    metaleUwaga: "The table gives the base density of the alloy. White gold takes heavier additions, so at the same volume it weighs noticeably more than yellow, and the quote accounts for that separately.",

    nieMusiszTytul: "What you do not have to do",
    nieMusisz: [
      {
        t: "You do not have to scale the model for shrinkage",
        d: "We do it ourselves, with the factor that belongs to the alloy chosen in the order. If the file is already enlarged, just name the alloy it was scaled for in the configurator: we then add only the difference, and for a matching alloy the file goes to the printer untouched.",
      },
      {
        t: "Do not add a sprue system",
        d: "We set the sprues and the pouring cone ourselves, because their position depends on how the model stands in the flask and where the metal has the furthest to travel. A sprue modelled into the file would have to be cut off anyway.",
      },
      {
        t: "Do not add a machining allowance",
        d: "We narrow the ring hole ourselves, because grinding makes a hole larger. An allowance on the outer surface is added only for an order with a mirror polish. Both values appear in the calculation shown before you confirm.",
      },
      {
        t: "Do not add an allowance on a decorated surface",
        d: "Texture, hammering, engraving and relief never receive an allowance, whatever the chosen finish. Grinding would take away the very detail the order is placed for. Mark the surface as decorated in the configurator and the allowance drops to zero.",
      },
    ],

    plikTytul: "What the file needs",
    plik: [
      { t: "Formats and size", d: (f, mb) => `We accept ${f}, up to ${mb}. The same set as for 3D printing, because there is no reason for a customer to remember that casting reads a file differently.` },
      { t: "Units", d: (bez) => `${bez} carry no unit in the format, so we read them as millimetres. The other formats do carry a unit and then we take it from the file.` },
      { t: "A closed solid", d: "A mesh with no open edges. Without it there is no reading where the metal is and where the air is, and no quote from such a file is binding." },
      { t: "A single solid", d: "Several interpenetrating solids leave an undefined region inside. Merge them with a boolean union, or order a file repair from us." },
      { t: "Flask envelope", d: (k) => `The model has to fit the flask envelope, that is ${k}. What counts is the diagonal of the footprint, because a flask is a cylinder and not a box: a flat, wide piece fits better than it looks. Anything larger goes to an individual quote.` },
      { t: "Finger hole", d: (prog) => `For a ring, a wedding band and a bangle you give the inner diameter of the finished piece. If the hole measured in the file differs from your size by more than ${prog}, the order stops: opening the hole eats into the shank, so we do not change it without talking to you.` },
    ],
    plikSprawdzamy: "After upload we compute watertightness, the number of solids, the envelope, the thinnest wall and the hole diameter. The result is visible straight away, before the order is placed, not in an email the next day. On a very dense mesh we skip the thickness measurement and check it by hand, and the configurator says so plainly.",

    dostajeszTytul: "What you receive",
    dostajesz: [
      { t: "A casting in the chosen alloy", d: "Silver 800 or 925, gold 9K, 14K or 18K. The metal can be ours, or you can supply your own." },
      { t: "Finishing at the chosen level", d: "From a raw casting with the sprues cut off, to a jewellery finish, meaning grinding, polishing and a check before release. You pick the level in the configurator and see what each one covers." },
      { t: "Sprue metal where it is yours", d: "With customer-supplied metal the sprues are your metal, so they travel with the casting. With our metal the sprues stay here and go back to the melt." },
      { t: "Hallmarking by arrangement", d: "The AEJaCA maker's mark and a report to the Polish Assay Office, on request with the order. A piece can also be collected unmarked, the reporting obligation then passes to the recipient." },
    ],

    faqTytul: "Frequently asked questions",

    ctaTytul: "File ready?",
    ctaTresc: "Upload the model to the casting configurator. After upload you see the geometry check and the full dimension calculation, before anything is confirmed.",
    ctaKalkulator: "Go to the casting configurator",
    ctaKontakt: "Ask about a model",
  },

  de: {
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    kicker: "Guss in Silber und Gold",
    h1: "Guss aus Ihrer Datei",
    lead: "Sie schicken ein 3D-Modell, wir drucken daraus ein Modell und gießen es in Silber oder Gold. Diese Seite erklärt, was das Modell braucht, bevor die Datei in den Konfigurator geht.",

    introTitle: "Ein Gussmodell ist kein Druckmodell",
    intro: [
      "Ein Druck ist das fertige Stück: Was auf dem Bildschirm zu sehen ist, kommt aus dem Drucker. Ein Guss ist erst der Anfang. Das Harzmodell brennt aus der Einbettmasse aus, das an seine Stelle gegossene Metall schwindet beim Erkalten, und die Oberfläche des Rohgusses geht danach unter Schleifer und Polierscheibe.",
      "Jeder dieser drei Schritte verschiebt das Maß um Zehntelmillimeter, und keiner davon ist in der Datei sichtbar. Deshalb fragen wir beim Gussmodell mehr als beim Druckmodell. Nicht um eine Hürde aufzubauen, sondern damit das Stück in Ihrer Hand genau das Maß hat, das Sie angeben.",
    ],

    zasadaTytul: "Sie nennen das Fertigmaß, um den Rest kümmern wir uns",
    zasadaTresc: "Das Modell soll die Maße des Stücks tragen, das Sie erhalten möchten. Schwund, Schleifaufmaß und Angusssystem ergänzen wir auf unserer Seite, nach den Tabellen dieser Seite. Vor der Bestätigung zeigen wir die vollständige Rechnung: Zielmaß, Aufmaß, Schwundfaktor und die Modellgröße, die in den Druck geht.",
    zasadaTolerancja: (tol) => `Der Gussprozess hält das Maß auf ${tol} genau, und genau das sagen wir zu. Wo höhere Genauigkeit nötig ist, hilft die spanende Bearbeitung nach dem Guss, und die vereinbaren wir gesondert.`,

    gruboscTytul: "Mindeststärken am fertigen Stück",
    gruboscWstep: "Zwei Spalten, weil es zwei verschiedene Aussagen sind. „Minimum“ ist die Grenze, unterhalb derer sich der Guss nicht füllt und wir die Bestellung nicht annehmen. „Sicher“ ist die Stärke, bei der die Abformung unabhängig von der Lage in der Küvette gelingt. Dazwischen gießen wir, aber ohne Zusage vollständiger Abformung.",
    gruboscCecha: "Merkmal des Modells",
    gruboscMin: "Minimum",
    gruboscPewne: "Sicher",
    gruboscMierzona: "automatisch aus der Datei gemessen",
    gruboscUwaga: "Die Wandstärke messen wir automatisch aus der hochgeladenen Datei. Die übrigen Zeilen lassen sich im Dreiecksnetz nicht erkennen, denn dazu müsste man wissen, was das jeweilige Merkmal ist: diese Werte bleiben eine Entscheidung beim Entwurf.",

    metaleTytul: "Legierungen, die wir gießen",
    metaleWstep: "Der Schwund ist der Faktor, um den wir das Modell vergrößern, damit der Guss Ihr Maß erreicht. Die Dichte ergibt die Masse, und die Masse des Edelmetalls bestimmt die Rechnung. Wir zeigen beide Zahlen, weil sich daraus alles ergibt, was mit dem Modell unterwegs geschieht.",
    metaleStop: "Legierung",
    metaleSkurcz: "Schwund",
    metaleGestosc: "Dichte",
    metaleUwaga: "In der Tabelle steht die Grunddichte der Legierung. Weißgold enthält schwerere Zusätze und wiegt bei gleichem Volumen spürbar mehr als Gelbgold, die Kalkulation rechnet das gesondert.",

    nieMusiszTytul: "Was Sie nicht tun müssen",
    nieMusisz: [
      {
        t: "Sie müssen das Modell nicht auf Schwund skalieren",
        d: "Das übernehmen wir, mit dem Faktor der in der Bestellung gewählten Legierung. Ist die Datei bereits vergrößert, nennen Sie im Konfigurator einfach die Legierung, für die skaliert wurde: dann ergänzen wir nur die Differenz, und bei gleicher Legierung geht die Datei unverändert in den Druck.",
      },
      {
        t: "Kein Angusssystem hinzufügen",
        d: "Kanäle und Gusstrichter setzen wir selbst, denn ihre Lage hängt davon ab, wie das Modell in der Küvette steht und wo das Metall den weitesten Weg hat. Ein in der Datei modellierter Anguss müsste ohnehin abgetrennt werden.",
      },
      {
        t: "Kein Bearbeitungsaufmaß hinzufügen",
        d: "Die Ringbohrung verengen wir selbst, denn Schleifen vergrößert eine Bohrung. Ein Aufmaß an der Außenfläche kommt nur bei einer Bestellung mit Hochglanzpolitur dazu. Beide Werte stehen in der Rechnung, die vor der Bestätigung sichtbar ist.",
      },
      {
        t: "Kein Aufmaß an verzierten Flächen",
        d: "Struktur, Hammerschlag, Gravur und Relief erhalten nie ein Aufmaß, unabhängig vom gewählten Finish. Das Schleifen würde genau das Detail abtragen, für das die Bestellung erfolgt. Markieren Sie die Fläche im Konfigurator als verziert, dann fällt das Aufmaß auf null.",
      },
    ],

    plikTytul: "Was die Datei braucht",
    plik: [
      { t: "Formate und Größe", d: (f, mb) => `Wir nehmen ${f}, bis ${mb}. Derselbe Satz wie beim 3D-Druck, denn niemand muss sich merken, dass der Guss eine Datei anders liest.` },
      { t: "Einheiten", d: (bez) => `${bez} tragen im Format keine Einheit, wir lesen sie daher als Millimeter. Die übrigen Formate tragen eine Einheit, dann übernehmen wir sie aus der Datei.` },
      { t: "Geschlossener Körper", d: "Ein Netz ohne offene Kanten. Sonst lässt sich nicht ablesen, wo Metall ist und wo Luft, und kein Angebot aus einer solchen Datei ist verbindlich." },
      { t: "Ein einziger Körper", d: "Mehrere sich durchdringende Körper lassen im Inneren einen undefinierten Bereich zurück. Vereinigen Sie sie mit Boolean Union oder bestellen Sie die Dateireparatur bei uns." },
      { t: "Küvettenraum", d: (k) => `Das Modell muss in den Küvettenraum passen, also ${k}. Maßgeblich ist die Diagonale der Grundfläche, denn die Küvette ist ein Zylinder und kein Quader: ein flaches, breites Stück passt besser, als es aussieht. Alles Größere geht in die Einzelkalkulation.` },
      { t: "Fingerbohrung", d: (prog) => `Bei Ring, Trauring und Armreif nennen Sie den Innendurchmesser des fertigen Stücks. Weicht die in der Datei gemessene Bohrung um mehr als ${prog} von Ihrer Größe ab, stoppt die Bestellung: das Aufweiten geht auf die Schienenstärke, das ändern wir nicht ohne Rücksprache.` },
    ],
    plikSprawdzamy: "Nach dem Hochladen berechnen wir Dichtheit, Anzahl der Körper, Bauraum, dünnste Wand und Bohrungsdurchmesser. Das Ergebnis ist sofort sichtbar, noch vor der Bestellung und nicht per Mail am Folgetag. Bei sehr dichten Netzen entfällt die Wandstärkenmessung, wir prüfen sie von Hand, und der Konfigurator sagt das klar.",

    dostajeszTytul: "Was Sie erhalten",
    dostajesz: [
      { t: "Guss in der gewählten Legierung", d: "Silber 800 oder 925, Gold 9K, 14K oder 18K. Das Metall stellen wir, oder Sie stellen es bei." },
      { t: "Bearbeitung im gewählten Umfang", d: "Vom Rohguss mit abgetrennten Kanälen bis zum Juwelierfinish, also Schleifen, Polieren und Kontrolle vor der Ausgabe. Die Stufe wählen Sie im Konfigurator und sehen, was jede umfasst." },
      { t: "Kanalmetall, wo es Ihres ist", d: "Bei beigestelltem Metall gehören die Kanäle Ihnen und gehen mit dem Guss zurück. Bei unserem Metall bleiben sie hier und kommen in den Umschmelz." },
      { t: "Punzierung nach Absprache", d: "AEJaCA-Herstellerzeichen und Meldung beim polnischen Punzierungsamt, auf Wunsch bei der Bestellung. Ein Stück kann auch unpunziert übergeben werden, die Meldepflicht geht dann auf den Empfänger über." },
    ],

    faqTytul: "Häufige Fragen",

    ctaTytul: "Datei fertig?",
    ctaTresc: "Laden Sie das Modell in den Guss-Konfigurator. Nach dem Hochladen sehen Sie die Geometrieprüfung und die vollständige Maßrechnung, bevor irgendetwas bestätigt wird.",
    ctaKalkulator: "Zum Guss-Konfigurator",
    ctaKontakt: "Zum Modell nachfragen",
  },
};
