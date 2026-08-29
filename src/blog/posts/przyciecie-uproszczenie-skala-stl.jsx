import { H2, H3, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox, Sources } from "../../components/blog/Prose.jsx";

export { meta } from "./przyciecie-uproszczenie-skala-stl.meta.js";

export function Body({ lang }) {
  const t = (pl, en, de) => (lang === "pl" ? pl : lang === "de" ? de : en);

  return (
    <>
      <Lead>{t(
        "Plik STL rzadko jest gotowy od razu. Model bywa większy od stołu drukarki, siatka bywa gęstsza, niż drukarka potrafi zobaczyć, skala bywa cudza, a ustawienie na stole decyduje o tym, czy wydruk pęknie przy pierwszym zgięciu. Cztery operacje, cztery decyzje i jedna zasada wspólna: każdą z nich robi się na modelu, a nie na cenie.",
        "An STL file is rarely ready as it comes. The model may be larger than the print bed, the mesh denser than the printer can see, the scale someone else's, and the way it sits on the bed decides whether the print snaps the first time it is bent. Four operations, four decisions, and one rule shared by all of them: each is done to the model, not to the price.",
        "Eine STL-Datei ist selten sofort fertig. Das Modell ist größer als das Druckbett, das Netz dichter, als der Drucker sehen kann, der Maßstab fremd, und die Lage auf dem Bett entscheidet, ob der Druck beim ersten Biegen bricht. Vier Eingriffe, vier Entscheidungen und eine gemeinsame Regel: jeder betrifft das Modell, nicht den Preis."
      )}</Lead>

      <H2 id={t("przyciecie", "cutting", "schneiden")}>
        {t("Przycięcie i podział modelu", "Cutting and splitting the model", "Modell schneiden und teilen")}
      </H2>
      <P>{t(
        "Model większy niż przestrzeń robocza nie jest przeszkodą, tylko decyzją o miejscu cięcia. Nasza drukarka FDM ma pole 300 × 320 × 325 mm, drukarka żywiczna znacznie mniej, więc figurka wysoka na pół metra wychodzi z dwóch albo trzech części sklejanych po druku.",
        "A model larger than the build volume is not an obstacle, it is a decision about where to cut. Our FDM machine has a 300 × 320 × 325 mm build volume and the resin printer far less, so a half-metre figure comes out in two or three parts glued after printing.",
        "Ein Modell, das größer ist als der Bauraum, ist kein Hindernis, sondern eine Entscheidung über die Schnittstelle. Unsere FDM-Maschine hat 300 × 320 × 325 mm, der Harzdrucker deutlich weniger, also entsteht eine halbmetrige Figur aus zwei oder drei verklebten Teilen."
      )}</P>
      <P>{t(
        "Cięcie płaszczyzną robi każdy popularny program: PrusaSlicer i Bambu Studio mają narzędzie noża wbudowane w krajalnik, Blender tnie modyfikatorem Boolean, Meshmixer poleceniem Plane Cut. Różnica nie leży w narzędziu, tylko w tym, gdzie poprowadzisz płaszczyznę.",
        "A plane cut is available in every common program: PrusaSlicer and Bambu Studio have a knife tool inside the slicer, Blender cuts with a Boolean modifier, Meshmixer with Plane Cut. The difference is not the tool, it is where you put the plane.",
        "Einen Ebenenschnitt beherrscht jedes gängige Programm: PrusaSlicer und Bambu Studio haben ein Messerwerkzeug im Slicer, Blender schneidet mit einem Boolean-Modifikator, Meshmixer mit Plane Cut. Der Unterschied liegt nicht im Werkzeug, sondern in der Lage der Ebene."
      )}</P>
      <UL>
        <LI>{t(
          "Tnij tam, gdzie szew i tak zginie: wzdłuż krawędzi kształtu, na styku dwóch elementów, po linii ubrania figurki. Płaska powierzchnia w połowie gładkiego walca będzie widoczna zawsze.",
          "Cut where the seam disappears anyway: along an edge of the shape, at the junction of two elements, along the line of a figure's clothing. A flat cut halfway up a smooth cylinder will always show.",
          "Schneiden Sie dort, wo die Naht ohnehin verschwindet: entlang einer Kante, am Übergang zweier Elemente, entlang der Kleidungslinie einer Figur. Ein flacher Schnitt mitten auf einem glatten Zylinder bleibt immer sichtbar."
        )}</LI>
        <LI>{t(
          "Dodaj kołki i gniazda, zanim wytniesz. Dwa bolce o średnicy 4 mm z luzem 0,2 mm składają części same, bez pilnowania kąta przy klejeniu.",
          "Add pins and sockets before you cut. Two 4 mm pins with 0.2 mm clearance align the parts on their own, with no fiddling over the angle while the glue sets.",
          "Setzen Sie Stifte und Aufnahmen, bevor Sie schneiden. Zwei Stifte mit 4 mm Durchmesser und 0,2 mm Spiel richten die Teile von selbst aus, ohne Winkelkorrektur beim Kleben."
        )}</LI>
        <LI>{t(
          "Każda część po cięciu musi zostać bryłą zamkniętą. Krajalnik zwykle domyka przekrój sam, ale eksport z Blendera po prostym Boolean potrafi zostawić otwartą dziurę.",
          "Each part must remain a closed solid after the cut. A slicer normally caps the section itself, but an export from Blender after a plain Boolean can leave an open hole.",
          "Jedes Teil muss nach dem Schnitt ein geschlossener Körper bleiben. Ein Slicer deckelt den Querschnitt meist selbst, ein Export aus Blender nach einem einfachen Boolean kann ein offenes Loch hinterlassen."
        )}</LI>
      </UL>
      <Callout accent="blue">{t(
        "Model przekraczający pole robocze nie jest u nas odrzucany po cichu. Kalkulator mierzy wymiary po wgraniu i mówi wprost, o ile jest za duży, a dla odlewu ze srebra i złota proponuje jednym kliknięciem największą skalę, która mieści się w kolbie.",
        "A model that overruns the build volume is not silently rejected here. The calculator measures the dimensions on upload and says by how much it is too large, and for silver and gold casting it offers, in one click, the largest scale that still fits the flask.",
        "Ein Modell, das den Bauraum überschreitet, wird bei uns nicht stillschweigend abgelehnt. Der Kalkulator misst die Maße beim Hochladen und nennt die Überschreitung; für Silber- und Goldguss bietet er mit einem Klick den größten Maßstab an, der noch in die Küvette passt."
      )}</Callout>

      <H2 id={t("uproszczenie", "simplify", "vereinfachen")}>
        {t("Uproszczenie siatki", "Simplifying the mesh", "Netz vereinfachen")}
      </H2>
      <P>{t(
        "Skan trójwymiarowy albo model wyeksportowany z CAD-a z maksymalną dokładnością potrafi mieć kilka milionów trójkątów i ważyć kilkaset megabajtów. Drukarka i tak nie zobaczy większości z nich, bo tnie model na warstwy o wysokości od 0,06 do 0,28 mm, a trójkąt mniejszy od warstwy nie ma jak się w niej odbić.",
        "A 3D scan, or a CAD model exported at maximum accuracy, can carry several million triangles and weigh hundreds of megabytes. The printer will not see most of them anyway, because it slices the model into layers 0.06 to 0.28 mm high, and a triangle smaller than a layer has no way of showing up in it.",
        "Ein 3D-Scan oder ein mit maximaler Genauigkeit exportiertes CAD-Modell kann mehrere Millionen Dreiecke haben und Hunderte Megabyte wiegen. Der Drucker sieht die meisten davon ohnehin nicht, denn er zerlegt das Modell in Schichten von 0,06 bis 0,28 mm, und ein Dreieck kleiner als eine Schicht kann sich darin nicht abbilden."
      )}</P>
      <P>{t(
        "Uproszczenie, czyli decymacja, zmniejsza liczbę trójkątów przy zachowaniu kształtu. W Blenderze robi to modyfikator Decimate w trybie Collapse, w Meshmixerze polecenie Reduce, w MeshLabie filtr Quadric Edge Collapse Decimation. Rozsądny cel dla wydruku to od stu do trzystu tysięcy trójkątów; poniżej dziesięciu tysięcy zaczyna być widać wielokąty na łukach.",
        "Simplification, or decimation, cuts the triangle count while keeping the shape. Blender does it with the Decimate modifier in Collapse mode, Meshmixer with Reduce, MeshLab with the Quadric Edge Collapse Decimation filter. A sensible target for printing is one to three hundred thousand triangles; below ten thousand the polygons start to show on arcs.",
        "Vereinfachung, also Dezimierung, senkt die Dreieckszahl bei erhaltener Form. Blender nutzt dafür den Decimate-Modifikator im Collapse-Modus, Meshmixer den Befehl Reduce, MeshLab den Filter Quadric Edge Collapse Decimation. Ein sinnvolles Ziel für den Druck sind ein- bis dreihunderttausend Dreiecke; unter zehntausend zeigen sich Vielecke auf Rundungen."
      )}</P>
      <Callout accent="amber">{t(
        "Uproszczenie jest nieodwracalne. Zapisz je jako nowy plik i zachowaj oryginał, bo z siatki uproszczonej nie da się odzyskać szczegółu, którego już w niej nie ma.",
        "Simplification cannot be undone. Save it as a new file and keep the original, because detail that is gone from a decimated mesh cannot be recovered from it.",
        "Vereinfachung ist unumkehrbar. Speichern Sie sie als neue Datei und behalten Sie das Original, denn Details, die aus einem dezimierten Netz verschwunden sind, lassen sich daraus nicht zurückholen."
      )}</Callout>

      <H2 id={t("skala", "scale", "skalieren")}>
        {t("Skalowanie", "Rescaling", "Skalieren")}
      </H2>
      <P>{t(
        "Skalowanie wygląda na najprostszą z czterech operacji i jest z nich najbardziej zdradliwe, bo zmienia wszystko naraz. Zmniejszenie modelu do 60 procent zmniejsza tak samo grubość ścianki, średnicę bolca i szerokość napisu.",
        "Rescaling looks like the simplest of the four operations and is the most treacherous, because it changes everything at once. Shrinking a model to 60 percent shrinks the wall thickness, the pin diameter and the width of the lettering by exactly as much.",
        "Skalieren wirkt wie der einfachste der vier Eingriffe und ist der tückischste, denn es verändert alles zugleich. Eine Verkleinerung auf 60 Prozent verkleinert Wandstärke, Stiftdurchmesser und Schriftbreite im selben Maß."
      )}</P>
      <Table
        headers={[
          t("Ze skali na skalę", "From scale to scale", "Von Maßstab zu Maßstab"),
          t("Mnożnik wymiaru", "Dimension factor", "Maßfaktor"),
          t("Objętość i materiał", "Volume and material", "Volumen und Material"),
        ]}
        rows={[
          ["1:6 → 1:10", "0,60", "≈ 22 %"],
          ["1:10 → 1:6", "1,67", "≈ 463 %"],
          ["1:35 → 1:56", "0,63", "≈ 25 %"],
          [t("połowa", "half", "Hälfte"), "0,50", "12,5 %"],
        ]}
      />
      <P>{t(
        "Mnożnik przy zmianie skali to iloraz mianowników w drugą stronę: z 1:6 na 1:10 mnożysz przez 6/10, czyli 0,6. Objętość zmienia się z trzecią potęgą, więc figurka zmniejszona do 60 procent wysokości zużywa około 22 procent materiału. To jest też powód, dla którego cena spada mocniej, niż podpowiada oko.",
        "The factor for a scale change is the inverse ratio of the denominators: from 1:6 to 1:10 you multiply by 6/10, that is 0.6. Volume follows the cube, so a figure reduced to 60 percent of its height uses about 22 percent of the material. That is also why the price drops more steeply than the eye expects.",
        "Der Faktor beim Maßstabswechsel ist das umgekehrte Verhältnis der Nenner: von 1:6 auf 1:10 multiplizieren Sie mit 6/10, also 0,6. Das Volumen folgt der dritten Potenz, eine auf 60 Prozent Höhe verkleinerte Figur verbraucht also rund 22 Prozent Material. Deshalb fällt auch der Preis stärker, als das Auge erwartet."
      )}</P>
      <P>{t(
        "Po każdym zmniejszeniu sprawdź najcieńszy element osobno. Ścianka 0,8 mm po zejściu do 60 procent ma 0,48 mm i przestaje być drukowalna na FDM, bo dysza ma 0,4 mm i taka ścianka to jedna ścieżka bez żadnego zapasu. W biżuterii to samo dotyczy krap: cienka krapa po zmniejszeniu nie utrzyma kamienia.",
        "After every reduction, check the thinnest feature separately. A 0.8 mm wall taken down to 60 percent measures 0.48 mm and stops being printable on FDM, because the nozzle is 0.4 mm and such a wall is a single path with no margin. In jewelry the same applies to prongs: a thin prong will not hold the stone once shrunk.",
        "Prüfen Sie nach jeder Verkleinerung das dünnste Element gesondert. Eine 0,8-mm-Wand ergibt bei 60 Prozent noch 0,48 mm und ist im FDM nicht mehr druckbar, denn die Düse hat 0,4 mm und eine solche Wand ist eine einzige Bahn ohne Reserve. Im Schmuck gilt dasselbe für Krappen: eine dünne Krappe hält den Stein nach dem Verkleinern nicht mehr."
      )}</P>
      <Callout accent="blue">{t(
        "Suwak wielkości w naszym kalkulatorze skaluje geometrię, a nie etykietę. Cena przelicza się z modelu po zmianie skali, a nie z przedziału wielkości, więc kwota, którą widzisz, dotyczy dokładnie tego, co wydrukujemy.",
        "The size slider in our calculator scales the geometry, not a label. The price is recomputed from the rescaled model rather than from a size bracket, so the figure you see refers to exactly what we will print.",
        "Der Größenregler in unserem Kalkulator skaliert die Geometrie, nicht ein Etikett. Der Preis wird aus dem skalierten Modell neu berechnet, nicht aus einer Größenklasse, der angezeigte Betrag gilt also genau für das, was wir drucken."
      )}</Callout>

      <H2 id={t("kat", "angle", "winkel")}>
        {t("Kąt ustawienia na stole", "Print angle on the bed", "Druckwinkel auf dem Bett")}
      </H2>
      <P>{t(
        "Ustawienie modelu decyduje o trzech rzeczach naraz i żadnej z nich nie da się poprawić po wydruku. Pierwsza to podpory: każda powierzchnia nachylona bardziej niż mniej więcej 45 stopni od pionu potrzebuje podparcia, a podpora zostawia ślad. Druga to schodki na krzywiznach, tym wyraźniejsze, im bardziej powierzchnia zbliża się do poziomu. Trzecia to wytrzymałość.",
        "Orientation decides three things at once, and none of them can be fixed after printing. First, supports: any surface leaning more than roughly 45 degrees from vertical needs support, and support leaves a mark. Second, stair-stepping on curves, which grows more visible the closer a surface comes to horizontal. Third, strength.",
        "Die Ausrichtung entscheidet über drei Dinge zugleich, und keines davon lässt sich nach dem Druck korrigieren. Erstens Stützen: jede Fläche, die mehr als etwa 45 Grad aus der Senkrechten kippt, braucht Stützmaterial, und Stützmaterial hinterlässt Spuren. Zweitens Treppenstufen auf Rundungen, umso sichtbarer, je waagerechter die Fläche liegt. Drittens die Festigkeit."
      )}</P>
      <P>{t(
        "Wytrzymałość jest tą, o której zapomina się najczęściej. Wydruk FDM jest zbudowany z warstw sklejonych ze sobą, więc rozchodzi się wzdłuż warstwy łatwiej, niż pęka w poprzek materiału. Hak, uchwyt albo dźwignia ustawione tak, że siła próbuje rozdzielić warstwy, urywają się przy obciążeniu, przy którym ten sam element obrócony o dziewięćdziesiąt stopni wytrzymuje kilkukrotnie więcej.",
        "Strength is the one most often forgotten. An FDM print is built from layers bonded to each other, so it comes apart along a layer more easily than it breaks across the material. A hook, a handle or a lever placed so that the force tries to separate the layers will fail at a load the same part, turned ninety degrees, survives several times over.",
        "Die Festigkeit wird am häufigsten vergessen. Ein FDM-Druck besteht aus miteinander verklebten Schichten, er löst sich also entlang einer Schicht leichter, als das Material quer bricht. Ein Haken, Griff oder Hebel, bei dem die Kraft die Schichten zu trennen versucht, versagt bei einer Last, die dasselbe Teil um neunzig Grad gedreht mehrfach aushält."
      )}</P>
      <H3 id={t("kat-praktyka", "angle-practice", "winkel-praxis")}>
        {t("Trzy typowe przypadki", "Three typical cases", "Drei typische Fälle")}
      </H3>
      <UL>
        <LI>{t(
          "Element mechaniczny, obciążany: warstwy w poprzek działającej siły, nawet kosztem podpór i dłuższego druku.",
          "A loaded mechanical part: layers across the working force, even at the cost of supports and a longer print.",
          "Ein belastetes mechanisches Teil: Schichten quer zur wirkenden Kraft, auch auf Kosten von Stützen und Druckzeit."
        )}</LI>
        <LI>{t(
          "Figurka: przechylona o kilkanaście stopni od pionu, żeby żadna duża płaszczyzna nie leżała równolegle do warstw i nie zbierała schodków na twarzy.",
          "A figurine: tilted a dozen or so degrees off vertical, so that no large plane lies parallel to the layers and collects stair-stepping across the face.",
          "Eine Figur: um etwa fünfzehn Grad aus der Senkrechten gekippt, damit keine große Fläche parallel zu den Schichten liegt und Treppenstufen im Gesicht sammelt."
        )}</LI>
        <LI>{t(
          "Wzorzec odlewniczy z żywicy: pod kątem, który daje najmniejszą powierzchnię przekroju w każdej warstwie, bo od niej zależy siła odrywania od kuwety.",
          "A castable resin pattern: at an angle giving the smallest cross-section in each layer, because that is what sets the peel force off the vat.",
          "Ein Gussmodell aus Harz: in einem Winkel mit der kleinsten Querschnittsfläche je Schicht, denn davon hängt die Abzugskraft vom Becken ab."
        )}</LI>
      </UL>

      <H2 id={t("sprawdzenie", "check", "pruefen")}>
        {t("Sprawdzenie przed wysyłką", "Check before sending", "Prüfen vor dem Senden")}
      </H2>
      <P>{t(
        "Zanim wyślesz plik do wyceny, otwórz go jeszcze raz i przejrzyj cztery rzeczy: czy każda część mieści się w polu roboczym, czy siatka jest zamknięta po cięciu, czy najcieńszy element po zmianie skali nadal ma sens, i czy zapisany plik to naprawdę ten po zmianach. Ostatnie zdarza się częściej, niż można przypuszczać.",
        "Before you send a file for a quote, open it once more and look at four things: whether every part fits the build volume, whether the mesh is closed after the cut, whether the thinnest feature still makes sense at the new scale, and whether the saved file is really the edited one. The last one happens more often than you would think.",
        "Bevor Sie eine Datei zur Kalkulation schicken, öffnen Sie sie noch einmal und prüfen Sie vier Dinge: ob jedes Teil in den Bauraum passt, ob das Netz nach dem Schnitt geschlossen ist, ob das dünnste Element im neuen Maßstab noch sinnvoll ist, und ob die gespeicherte Datei wirklich die bearbeitete ist. Letzteres passiert häufiger, als man denkt."
      )}</P>
      <P>{t(
        "Naprawianie błędów siatki, formaty i eksport z popularnych programów opisaliśmy osobno w poradniku ",
        "Mesh repair, file formats and export from common programs are covered separately in the guide ",
        "Netzreparatur, Dateiformate und Export aus gängigen Programmen behandeln wir gesondert im Ratgeber "
      )}
        <A href="/blog/jak-przygotowac-plik-stl/">{t("Jak przygotować plik STL do druku 3D", "How to prepare an STL file for 3D printing", "STL-Datei für den 3D-Druck vorbereiten")}</A>.
      </P>

      <CTABox
        accent="blue"
        title={t("Sprawdź swój model", "Check your model", "Modell prüfen")}
        text={t(
          "Wgraj plik, a kalkulator zmierzy wymiary i objętość, powie, czy mieści się w polu roboczym, i poda wiążącą cenę liczoną z geometrii, nie z przedziału wielkości.",
          "Upload the file and the calculator measures dimensions and volume, tells you whether it fits the build volume, and returns a binding price computed from the geometry, not from a size bracket.",
          "Laden Sie die Datei hoch: der Kalkulator misst Maße und Volumen, sagt, ob sie in den Bauraum passt, und nennt einen verbindlichen Preis aus der Geometrie statt aus einer Größenklasse."
        )}
        href="/studio/?tab=3dprint#calculator"
        cta={t("Kalkulator druku 3D", "3D print calculator", "3D-Druck-Kalkulator")}
      />

      <Sources
        lang={lang}
        items={[
          {
            title: "Blender Manual, Decimate Modifier",
            href: "https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html",
            note: t(
              "tryb Collapse zmniejsza liczbę krawędzi o zadany ułamek, zachowując kształt bryły",
              "Collapse mode reduces the edge count by a set ratio while keeping the overall shape",
              "der Collapse-Modus reduziert die Kantenzahl um einen festgelegten Anteil und erhält die Form"
            ),
          },
          {
            title: t(
              "ISO/ASTM 52900:2021, Additive manufacturing. General principles. Fundamentals and vocabulary",
              "ISO/ASTM 52900:2021, Additive manufacturing. General principles. Fundamentals and vocabulary",
              "ISO/ASTM 52900:2021, Additive manufacturing. General principles. Fundamentals and vocabulary"
            ),
            href: "https://www.iso.org/standard/74514.html",
            note: t(
              "obowiązujące nazewnictwo druku przyrostowego, w tym pojęcie orientacji budowy",
              "the current additive manufacturing terminology, including the notion of build orientation",
              "die geltende Terminologie der additiven Fertigung, einschließlich der Bauausrichtung"
            ),
          },
        ]}
      />
    </>
  );
}
