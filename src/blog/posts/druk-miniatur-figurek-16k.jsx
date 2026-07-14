import { H2, H3, P, Lead, OL, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./druk-miniatur-figurek-16k.meta.js";

// ======================= PL =======================
function BodyPL() {
  return (
    <>
      <Lead>
        Miniatura do gry bitewnej ma 28 mm wysokości i musi pokazać fałdy płaszcza, oczy, ćwieki na napierśniku. Żaden FDM tego nie odda. Dlatego do figurek i miniatur używamy wyłącznie druku żywicznego MSLA, na sprzęcie, który liczy detal w mikrometrach, nie w milimetrach.
      </Lead>

      <H2 id="dlaczego-zywica">Dlaczego żywica bije FDM przy miniaturach</H2>
      <P>
        Druk FDM buduje obiekt, wyciskając stopiony filament przez dyszę o średnicy 0,4 mm lub, w wersji precyzyjnej, 0,2 mm. To dobra technologia do obudów, uchwytów i dużych prototypów, ale przy 28-milimetrowej figurce dysza jest po prostu za gruba na detale twarzy, ostrza miecza czy sierść wilka.
      </P>
      <P>
        Druk żywiczny MSLA działa inaczej: cała warstwa jest utwardzana naraz światłem UV wyświetlanym przez ekran mono LCD. Rozdzielczość takiego ekranu liczy się w pikselach, a nie w średnicy dyszy, więc detal schodzi do ułamków milimetra.
      </P>
      <Table
        headers={["", "FDM (0,4 / 0,2 mm dysza)", "Żywica MSLA (piksel 14 µm)"]}
        rows={[
          ["Najmniejszy detal", "ok. 0,4-0,8 mm", "od 0,2 mm"],
          ["Powierzchnia", "Widoczne warstwy, chropowata", "Gładka, formowa jakość"],
          ["Twarze, oczy, faktury", "Rozmyte, zależne od skali", "Wyraźne nawet w skali 28 mm"],
          ["Najlepsze do", "Duże elementy, prototypy funkcjonalne", "Miniatury, figurki, wzorce jubilerskie"],
        ]}
      />
      <P>
        <Strong>Krótko:</Strong> im mniejszy obiekt i im więcej detalu na powierzchni, tym bardziej opłaca się <A href="/glossary/druk-msla">druk MSLA</A>. Miniatury bitewne, biusty kolekcjonerskie, terenowe elementy do gier planszowych to klasyczny przypadek dla żywicy, nie filamentu.
      </P>

      <H2 id="sprzet">Nasz sprzęt: Elegoo Saturn 4 Ultra 16K</H2>
      <P>
        Miniatury drukujemy na Elegoo Saturn 4 Ultra 16K, drukarce z 10-calowym ekranem mono LCD o rozdzielczości 16384 x 9216 pikseli. Pojedynczy piksel ma 14 x 19 µm, czyli mniej niż grubość ludzkiego włosa. Obszar roboczy to 218 x 123 x 250 mm, więc mieści się na nim cała platforma miniatur naraz, a nie tylko jedna sztuka.
      </P>
      <UL>
        <LI><Strong>Grzana wanna (30°C)</Strong> - stabilizuje lepkość żywicy, mniej nieudanych warstw</LI>
        <LI><Strong>Tilt Release</Strong> - redukuje siły ścinające przy odklejaniu warstwy od folii, mniej pękniętych podpór przy delikatnych elementach</LI>
        <LI><Strong>Auto-poziomowanie z detekcją AI</Strong> - powtarzalność między zleceniami, mniej ludzkiego błędu</LI>
      </UL>
      <P>
        Do mycia i utwardzania używamy myjki Elegoo Mercury Plus V3.0, kompatybilnej z platformą Saturn 4 Ultra, więc świeżo wydrukowane figurki trafiają od razu do mycia IPA (lub wody, przy żywicach water washable) i utwardzania UV, bez ręcznego przekładania.
      </P>

      <H2 id="zastosowania">Co drukujemy: od bitewniaków po prototypy planszówek</H2>
      <P>
        W AEJaCA sTuDiO druk miniatur i figurek to naturalne rozszerzenie tego samego warsztatu, w którym drukujemy wzorce jubilerskie, więc dokładność 14 µm nie jest u nas ciekawostką na etykiecie, tylko codziennym standardem pracy. Poniżej najczęstsze zlecenia, jakie do nas trafiają.
      </P>
      <H3>Miniatury do gier bitewnych i RPG</H3>
      <P>
        Skala 28 mm i 32 mm to standard w grach bitewnych i RPG. Piksel 14 µm oddaje fałdy tkanin, łuski zbroi, wyraz twarzy - detale, które przy druku FDM po prostu by zniknęły.
      </P>
      <H3>Figurki kolekcjonerskie</H3>
      <P>
        Popiersia, statuetki, modele postaci z gier i filmów - drukujemy je w większej skali, z gładką powierzchnią gotową pod primer i malowanie.
      </P>
      <H3>Prototypy planszówek</H3>
      <P>
        Twórcy gier planszowych zlecają nam pierwsze prototypy pionków, żetonów i elementów terenu, zanim zdecydują się na produkcję seryjną.
      </P>
      <H3>Modelarstwo</H3>
      <P>
        Detale do dioram, elementy zamienne do modeli, drobne części, których nie da się kupić gotowych.
      </P>
      <P>
        Do wyboru mamy żywice standardowe (uniwersalne, dobry stosunek jakości do ceny) oraz żywice high precision typu ABS-like, które dają wyższą sztywność i ostrzejsze krawędzie, polecane przy figurkach z drobnymi elementami wystającymi (miecze, dzidy, pióra).
      </P>

      <H3>Wykończenie: podpory, mycie, primer</H3>
      <P>
        Każdy wydruk żywiczny przechodzi ten sam proces post-processingu, niezależnie od tego, czy to pojedyncza figurka, czy cała drużyna. Po zdjęciu z platformy model trafia do mycia w izopropanolu (lub wodzie, przy żywicach water washable), suszenia sprężonym powietrzem i utwardzania UV. Dopiero potem szczypcami jubilerskimi usuwamy podpory z miejsc, w których dotykały modelu, i delikatnie wygładzamy ślady po ich odcięciu. Efekt: figurka gotowa do malowania, bez konieczności długiego szlifowania.
      </P>

      <H2 id="batching">Batching: cała platforma za cenę jednej ekspozycji</H2>
      <P>
        Kluczowa własność druku MSLA: cała platforma robocza (218 x 123 mm) utwardza się warstwa po warstwie w tym samym czasie, niezależnie od tego, czy stoi na niej jedna figurka, czy dwadzieścia. Czas druku zależy od wysokości modelu, nie od liczby sztuk.
      </P>
      <Callout accent="blue" title="Dlaczego to ważne dla Ciebie">
        Jeśli zamawiasz serię (np. drużynę do gry bitewnej albo komplet pionków do planszówki), koszt maszyny i czasu druku rozkłada się na wiele sztuk. Efekt: <Strong>niższa cena za sztukę przy większym zamówieniu</Strong>, bo płacisz głównie za materiał i przygotowanie pliku, a nie za dodatkowy czas maszyny.
      </Callout>
      <Table
        headers={["Pozycja", "Cena orientacyjna"]}
        rows={[
          ["Minimum zlecenia", "od 49 zł"],
          ["Figurka ok. 8 cm (żywica standardowa)", "49-69 zł"],
          ["Figurka z żywicy high precision, drobne detale", "od 69 zł"],
          ["Seria 10+ szt. (miniatury bitewne, skala 28-32 mm)", "wycena indywidualna, cena/szt. spada"],
        ]}
      />
      <P>
        Dokładna wycena zależy od wysokości modelu, gęstości podpór i wybranej żywicy. Prześlij plik .STL, a wycenę dostaniesz w ciągu 24h, albo sprawdź orientacyjną cenę od razu w kalkulatorze sTuDiO.
      </P>
      <P>
        Praktyczna wskazówka: jeśli planujesz zamówić więcej niż jedną figurkę, prześlij wszystkie pliki naraz. Ustawimy je na jednej platformie i policzymy wycenę zbiorczą, zamiast wielu osobnych zleceń rozłożonych na kilka dni.
      </P>

      <H2 id="prawa-autorskie">Prawa autorskie: co drukujemy, a czego nie</H2>
      <P>
        To temat, który traktujemy poważnie i o którym wolimy mówić wprost, zanim wyślesz plik. Świat druku 3D miniatur żyje w dużej mierze na modelach chronionych prawem autorskim: systemy bitewne, uniwersa gier i filmów, twórczość niezależnych rzeźbiarzy cyfrowych publikowana na Patreonie czy MyMiniFactory.
      </P>
      <P>
        <Strong>Drukujemy wyłącznie:</Strong>
      </P>
      <UL>
        <LI>Pliki własne klienta (Twój projekt, Twój skan, Twoja rzeźba cyfrowa)</LI>
        <LI>Modele na licencji komercyjnej pozwalającej na druk na zamówienie (np. patronaty z tzw. merchant tier, licencje wyraźnie dopuszczające drukowanie i sprzedaż wydruku)</LI>
        <LI>Nasze własne projekty CAD</LI>
      </UL>
      <P>
        <Strong>Nie drukujemy</Strong> modeli objętych cudzymi prawami autorskimi bez odpowiedniej licencji - w tym figurek popularnych systemów bitewnych pobranych z sieci bez uprawnień do druku komercyjnego. To nie jest formalność: naruszenie praw autorskich naraża zarówno nas, jak i Ciebie jako zamawiającego. Jeśli nie masz pewności co do statusu pliku, zapytaj przed złożeniem zamówienia - chętnie pomożemy to wyjaśnić.
      </P>

      <H2 id="srebro">Wariant ekskluzywny: figurka odlana w srebrze 925</H2>
      <P>
        Dla figurek o szczególnym znaczeniu (kolekcjonerskie limitowane edycje, pamiątki, prezenty premium) oferujemy wariant, którego nie znajdziesz u typowego drukarza 3D: <Strong>odlew w srebrze 925 metodą lost-resin</Strong>. Wydrukowana w żywicy castable figurka staje się wzorcem, który wypalamy i odlewamy w metalu szlachetnym w naszej pracowni jubilerskiej - dokładnie tak, jak robimy to z pierścionkami.
      </P>
      <P>
        To projekt jednostkowy: wycena zależy od wielkości figurki, ilości detalu i masy srebra. Jeśli zależy Ci na prawdziwym, metalowym kolekcjonerskim obiekcie zamiast kolejnego wydruku z żywicy, napisz do nas z opisem projektu.
      </P>
      <P>
        W praktyce ten sam pipeline stosujemy przy pierścionkach: wydruk żywiczny jako wzorzec, wypalanie w piecu, odlew próżniowy w metalu, obróbka powierzchni. Figurka w srebrze przechodzi dokładnie tę samą ścieżkę produkcyjną co biżuteria, więc jakość wykończenia jest analogiczna, mikroskop, tumbler magnetyczny i polerowanie chemiczne włącznie.
      </P>

      <CTABox
        accent="blue"
        title="Wyceń swoją figurkę"
        text="Prześlij plik .STL swojej miniatury lub figurki, a otrzymasz wycenę w 24h. Ścieżka figurka w kalkulatorze sTuDiO da Ci szacunek od razu."
        href="/studio/#calculator"
        cta="Otwórz kalkulator sTuDiO"
      />
    </>
  );
}

// ======================= EN =======================
function BodyEN() {
  return (
    <>
      <Lead>
        A tabletop wargame miniature stands 28 mm tall and still needs to show cloak folds, eyes, and studs on a breastplate. No FDM printer can deliver that. That's why figurines and miniatures at AEJaCA sTuDiO are printed exclusively with MSLA resin, on hardware that measures detail in micrometers, not millimeters.
      </Lead>

      <H2 id="why-resin">Why resin beats FDM for miniatures</H2>
      <P>
        FDM printing builds an object by extruding melted filament through a 0.4 mm nozzle, or 0.2 mm in the fine variant. That's a great technology for enclosures, jigs, and large prototypes, but on a 28 mm figurine the nozzle is simply too thick for facial detail, a sword edge, or fur texture.
      </P>
      <P>
        MSLA resin printing works differently: an entire layer is cured at once by UV light projected through a mono LCD screen. Resolution is measured in pixels, not nozzle diameter, so detail drops down to fractions of a millimeter.
      </P>
      <Table
        headers={["", "FDM (0.4 / 0.2 mm nozzle)", "MSLA resin (14 µm pixel)"]}
        rows={[
          ["Smallest detail", "approx. 0.4-0.8 mm", "from 0.2 mm"],
          ["Surface", "Visible layer lines, rough", "Smooth, near-mold quality"],
          ["Faces, eyes, texture", "Blurred, scale-dependent", "Sharp even at 28 mm scale"],
          ["Best for", "Large parts, functional prototypes", "Miniatures, figurines, jewelry patterns"],
        ]}
      />
      <P>
        <Strong>In short:</Strong> the smaller the object and the more surface detail it carries, the more <A href="/glossary/druk-msla">MSLA resin printing</A> pays off. Wargame miniatures, collectible busts, and board game terrain pieces are the textbook case for resin, not filament.
      </P>

      <H2 id="hardware">Our hardware: Elegoo Saturn 4 Ultra 16K</H2>
      <P>
        We print miniatures on the Elegoo Saturn 4 Ultra 16K, a printer with a 10-inch mono LCD screen at 16384 x 9216 pixel resolution. A single pixel measures 14 x 19 µm, thinner than a human hair. The build volume is 218 x 123 x 250 mm, large enough to hold an entire platform of miniatures at once, not just one piece.
      </P>
      <UL>
        <LI><Strong>Heated vat (30°C)</Strong>, stabilizes resin viscosity, fewer failed layers</LI>
        <LI><Strong>Tilt Release</Strong>, reduces shear force during layer separation, fewer broken supports on delicate parts</LI>
        <LI><Strong>Auto-leveling with AI detection</Strong>, consistent results between orders, less room for human error</LI>
      </UL>
      <P>
        For washing and curing we use the Elegoo Mercury Plus V3.0, compatible with the Saturn 4 Ultra's build platform, so freshly printed figurines go straight into IPA (or water, for water-washable resins) washing and UV curing without manual transfer.
      </P>

      <H2 id="applications">What we print: from wargame squads to board game prototypes</H2>
      <P>
        At AEJaCA sTuDiO, miniature and figurine printing is a natural extension of the same workshop where we print jewelry patterns, so 14 µm accuracy isn't a marketing footnote here, it's an everyday standard. Below are the orders we see most often.
      </P>
      <H3>Wargame and RPG miniatures</H3>
      <P>
        28 mm and 32 mm are the standard scales in tabletop wargaming and RPGs. A 14 µm pixel captures cloth folds, armor scales, and facial expression, detail that would simply disappear on an FDM print.
      </P>
      <H3>Collectible figurines</H3>
      <P>
        Busts, statuettes, character models from games and films. We print these at larger scale with a smooth surface ready for primer and painting.
      </P>
      <H3>Board game prototypes</H3>
      <P>
        Game designers commission us for the first prototype run of pawns, tokens, and terrain pieces before committing to serial production.
      </P>
      <H3>Modeling and hobby scale</H3>
      <P>
        Diorama details, replacement parts for scale models, small pieces you can't buy off the shelf.
      </P>
      <P>
        We offer standard resins (versatile, good value) and high-precision, ABS-like resins that give higher rigidity and sharper edges, recommended for figurines with fine protruding elements such as swords, spears, or feathers.
      </P>

      <H3>Finishing: supports, washing, primer</H3>
      <P>
        Every resin print goes through the same post-processing, whether it's a single figurine or a whole squad. After removal from the platform, the model is washed in isopropyl alcohol (or water, for water-washable resins), dried with compressed air, and UV cured. Only then do we remove the supports with jeweler's pliers, from the exact points where they touched the model, and lightly smooth the cut marks. Result: a figurine ready for paint, without lengthy sanding.
      </P>

      <H2 id="batching">Batching: the whole platform for one exposure</H2>
      <P>
        A key property of MSLA printing: the entire build platform (218 x 123 mm) cures layer by layer at the same time, whether it holds one figurine or twenty. Print time depends on model height, not piece count.
      </P>
      <Callout accent="blue" title="Why this matters to you">
        If you order a batch, such as a full wargame squad or a complete set of board game pawns, machine time and print cost spread across many pieces. Result: <Strong>lower price per piece for larger orders</Strong>, since you mainly pay for material and file preparation, not additional machine time.
      </Callout>
      <Table
        headers={["Item", "Approximate price"]}
        rows={[
          ["Minimum order", "from €12"],
          ["Figurine, approx. 8 cm (standard resin)", "€12-16"],
          ["High-precision resin, fine detail", "from €16"],
          ["Batch of 10+ (wargame miniatures, 28-32 mm scale)", "individual quote, per-piece price drops"],
        ]}
      />
      <P>
        The exact price depends on model height, support density, and chosen resin. Send your .STL file for a quote within 24h, or check an estimate right away in the sTuDiO calculator.
      </P>
      <P>
        Practical tip: if you plan to order more than one figurine, send all the files at once. We'll arrange them on a single platform and give you one combined quote, instead of several separate orders spread across multiple days.
      </P>

      <H2 id="copyright">Copyright: what we print and what we don't</H2>
      <P>
        This is a topic we take seriously and prefer to address directly, before you send a file. The 3D miniature printing world runs largely on copyrighted content: wargame systems, game and film universes, and independent digital sculptors publishing on Patreon or MyMiniFactory.
      </P>
      <P>
        <Strong>We print exclusively:</Strong>
      </P>
      <UL>
        <LI>Your own files (your design, your scan, your digital sculpt)</LI>
        <LI>Models under a commercial license allowing print-on-demand (e.g. merchant-tier Patreon access, licenses explicitly permitting printing and selling the print)</LI>
        <LI>Our own CAD designs</LI>
      </UL>
      <P>
        <Strong>We do not print</Strong> models covered by someone else's copyright without proper licensing, including figures from popular wargame systems downloaded online without commercial printing rights. This isn't a formality: copyright infringement puts both us and you, as the client, at risk. If you're unsure about a file's status, ask before placing the order, we're happy to help clarify it.
      </P>

      <H2 id="silver">Exclusive option: a figurine cast in 925 silver</H2>
      <P>
        For figurines that carry special meaning (limited collector editions, keepsakes, premium gifts) we offer an option you won't find at a typical 3D print shop: <Strong>casting in 925 silver via lost-resin</Strong>. A figurine printed in castable resin becomes the pattern, which we burn out and cast in precious metal in our own jewelry workshop, exactly as we do with rings.
      </P>
      <P>
        This is a one-off project: pricing depends on figurine size, detail level, and silver mass. If you want a real, metal collector's object instead of another resin print, write to us with a description of your project.
      </P>
      <P>
        In practice, this is the same pipeline we use for rings: a resin print as the pattern, kiln burnout, vacuum casting in metal, then surface finishing. A silver figurine follows exactly the same production path as our jewelry, so the finish quality is the same, microscope inspection, magnetic tumbling, and chemical polishing included.
      </P>

      <CTABox
        accent="blue"
        title="Get a quote for your figurine"
        text="Send the .STL file of your miniature or figurine and get a quote within 24h. The figurine path in the sTuDiO calculator gives you an instant estimate."
        href="/studio/#calculator"
        cta="Open sTuDiO calculator"
      />
    </>
  );
}

// ======================= DE =======================
function BodyDE() {
  return (
    <>
      <Lead>
        Eine Tabletop-Miniatur ist 28 mm hoch und muss trotzdem Umhangfalten, Augen und Nieten auf dem Brustpanzer zeigen. Kein FDM-Drucker kann das leisten. Deshalb drucken wir Figuren und Miniaturen bei AEJaCA sTuDiO ausschließlich mit MSLA-Harz, auf einer Hardware, die Details in Mikrometern misst, nicht in Millimetern.
      </Lead>

      <H2 id="warum-harz">Warum Harz FDM bei Miniaturen schlägt</H2>
      <P>
        Der FDM-Druck baut ein Objekt auf, indem geschmolzenes Filament durch eine 0,4-mm-Düse gepresst wird, in der Fein­version durch 0,2 mm. Das ist eine gute Technologie für Gehäuse, Vorrichtungen und große Prototypen, aber bei einer 28-mm-Figur ist die Düse schlicht zu dick für Gesichtsdetails, eine Schwertklinge oder eine Fellstruktur.
      </P>
      <P>
        MSLA-Harzdruck funktioniert anders: Eine ganze Schicht wird gleichzeitig durch UV-Licht ausgehärtet, das über einen Mono-LCD-Bildschirm projiziert wird. Die Auflösung wird in Pixeln gemessen, nicht im Düsendurchmesser, sodass Details bis in den Bruchteil-Millimeter-Bereich möglich sind.
      </P>
      <Table
        headers={["", "FDM (0,4 / 0,2 mm Düse)", "MSLA-Harz (14 µm Pixel)"]}
        rows={[
          ["Kleinstes Detail", "ca. 0,4-0,8 mm", "ab 0,2 mm"],
          ["Oberfläche", "Sichtbare Schichtlinien, rau", "Glatt, nahezu Formenqualität"],
          ["Gesichter, Augen, Textur", "Verschwommen, skalenabhängig", "Scharf auch bei 28-mm-Maßstab"],
          ["Am besten für", "Große Teile, funktionale Prototypen", "Miniaturen, Figuren, Schmuck-Gussmodelle"],
        ]}
      />
      <P>
        <Strong>Kurz gesagt:</Strong> je kleiner das Objekt und je mehr Oberflächendetail es trägt, desto mehr lohnt sich der <A href="/glossary/druk-msla">MSLA-Harzdruck</A>. Tabletop-Miniaturen, Sammlerbüsten und Brettspiel-Geländeteile sind das Lehrbuchbeispiel für Harz statt Filament.
      </P>

      <H2 id="hardware">Unsere Hardware: Elegoo Saturn 4 Ultra 16K</H2>
      <P>
        Wir drucken Miniaturen auf dem Elegoo Saturn 4 Ultra 16K, einem Drucker mit 10-Zoll-Mono-LCD-Bildschirm und einer Auflösung von 16384 x 9216 Pixel. Ein einzelner Pixel misst 14 x 19 µm, dünner als ein menschliches Haar. Der Bauraum beträgt 218 x 123 x 250 mm, groß genug für eine ganze Plattform voller Miniaturen auf einmal, nicht nur ein Stück.
      </P>
      <UL>
        <LI><Strong>Beheizte Wanne (30°C)</Strong>, stabilisiert die Harzviskosität, weniger fehlgeschlagene Schichten</LI>
        <LI><Strong>Tilt Release</Strong>, reduziert Scherkräfte bei der Schichtablösung, weniger abgebrochene Stützen bei filigranen Teilen</LI>
        <LI><Strong>Automatische Nivellierung mit KI-Erkennung</Strong>, konsistente Ergebnisse zwischen Aufträgen, weniger menschliche Fehlerquellen</LI>
      </UL>
      <P>
        Zum Waschen und Härten nutzen wir die Elegoo Mercury Plus V3.0, kompatibel mit der Bauplattform des Saturn 4 Ultra, sodass frisch gedruckte Figuren direkt in die IPA-Wäsche (oder Wasser bei wasserwaschbaren Harzen) und UV-Härtung gehen, ohne manuelles Umsetzen.
      </P>

      <H2 id="anwendungen">Was wir drucken: von Tabletop-Trupps bis Brettspiel-Prototypen</H2>
      <P>
        Bei AEJaCA sTuDiO ist der Druck von Miniaturen und Figuren eine natürliche Erweiterung derselben Werkstatt, in der wir auch Schmuck-Gussmodelle drucken, daher ist die 14-µm-Genauigkeit bei uns keine Marketing-Fußnote, sondern Alltagsstandard. Nachfolgend die häufigsten Aufträge, die uns erreichen.
      </P>
      <H3>Tabletop- und RPG-Miniaturen</H3>
      <P>
        28 mm und 32 mm sind die Standardmaßstäbe im Tabletop-Wargaming und bei Rollenspielen. Ein 14-µm-Pixel bildet Stofffalten, Rüstungsschuppen und Mimik ab, Details, die bei einem FDM-Druck schlicht verschwinden würden.
      </P>
      <H3>Sammlerfiguren</H3>
      <P>
        Büsten, Statuetten, Charaktermodelle aus Spielen und Filmen. Wir drucken diese in größerem Maßstab mit glatter Oberfläche, bereit für Grundierung und Bemalung.
      </P>
      <H3>Brettspiel-Prototypen</H3>
      <P>
        Spieleentwickler beauftragen uns mit dem ersten Prototyp von Spielsteinen, Marken und Geländeteilen, bevor sie sich für die Serienproduktion entscheiden.
      </P>
      <H3>Modellbau</H3>
      <P>
        Diorama-Details, Ersatzteile für Maßstabsmodelle, kleine Teile, die man nicht fertig kaufen kann.
      </P>
      <P>
        Wir bieten Standardharze (vielseitig, gutes Preis-Leistungs-Verhältnis) sowie hochpräzise, ABS-ähnliche Harze, die höhere Steifigkeit und schärfere Kanten liefern, empfohlen bei Figuren mit feinen, hervorstehenden Elementen wie Schwertern, Speeren oder Federn.
      </P>

      <H3>Nachbearbeitung: Stützen, Waschen, Primer</H3>
      <P>
        Jeder Harzdruck durchläuft dieselbe Nachbearbeitung, egal ob es sich um eine einzelne Figur oder einen ganzen Trupp handelt. Nach der Entnahme von der Plattform wird das Modell in Isopropanol gewaschen (oder in Wasser, bei wasserwaschbaren Harzen), mit Druckluft getrocknet und UV-gehärtet. Erst danach entfernen wir mit Juwelierzangen die Stützen genau an den Stellen, wo sie das Modell berührten, und glätten die Schnittstellen leicht. Ergebnis: eine Figur, bereit für die Bemalung, ohne langes Schleifen.
      </P>

      <H2 id="batching">Batching: die ganze Plattform für eine Belichtung</H2>
      <P>
        Eine Schlüsseleigenschaft des MSLA-Drucks: Die gesamte Bauplattform (218 x 123 mm) härtet Schicht für Schicht gleichzeitig aus, egal ob darauf eine Figur oder zwanzig stehen. Die Druckzeit hängt von der Modellhöhe ab, nicht von der Stückzahl.
      </P>
      <Callout accent="blue" title="Warum das für Sie wichtig ist">
        Bei einer Sammelbestellung, etwa einem kompletten Tabletop-Trupp oder einem vollständigen Satz Brettspielsteine, verteilen sich Maschinenzeit und Druckkosten auf viele Stück. Ergebnis: <Strong>niedrigerer Stückpreis bei größeren Bestellungen</Strong>, da Sie hauptsächlich für Material und Dateivorbereitung zahlen, nicht für zusätzliche Maschinenzeit.
      </Callout>
      <Table
        headers={["Position", "Richtpreis"]}
        rows={[
          ["Mindestbestellwert", "ab 12 €"],
          ["Figur ca. 8 cm (Standardharz)", "12-16 €"],
          ["Hochpräzisionsharz, feine Details", "ab 16 €"],
          ["Serie ab 10 Stück (Tabletop-Miniaturen, 28-32 mm)", "individuelles Angebot, Stückpreis sinkt"],
        ]}
      />
      <P>
        Der genaue Preis hängt von Modellhöhe, Stützendichte und gewähltem Harz ab. Senden Sie Ihre .STL-Datei für ein Angebot innerhalb von 24h, oder prüfen Sie eine Richtpreis-Schätzung sofort im sTuDiO-Rechner.
      </P>
      <P>
        Praktischer Tipp: Wenn Sie mehr als eine Figur bestellen möchten, senden Sie alle Dateien auf einmal. Wir ordnen sie auf einer einzigen Plattform an und erstellen ein gemeinsames Angebot, statt mehrerer Einzelaufträge über mehrere Tage verteilt.
      </P>

      <H2 id="urheberrecht">Urheberrecht: was wir drucken und was nicht</H2>
      <P>
        Das ist ein Thema, das wir ernst nehmen und lieber direkt ansprechen, bevor Sie eine Datei senden. Die Welt des 3D-Miniaturendrucks lebt zu einem großen Teil von urheberrechtlich geschützten Modellen: Tabletop-Wargame-Systeme, Spiele- und Filmuniversen, sowie die Arbeit unabhängiger digitaler Bildhauer auf Patreon oder MyMiniFactory.
      </P>
      <P>
        <Strong>Wir drucken ausschließlich:</Strong>
      </P>
      <UL>
        <LI>Eigene Dateien des Kunden (Ihr Design, Ihr Scan, Ihre digitale Skulptur)</LI>
        <LI>Modelle mit kommerzieller Lizenz, die Print-on-Demand erlaubt (z. B. Patreon Merchant-Tier, Lizenzen, die Druck und Verkauf des Drucks ausdrücklich gestatten)</LI>
        <LI>Unsere eigenen CAD-Entwürfe</LI>
      </UL>
      <P>
        <Strong>Wir drucken keine</Strong> Modelle, die dem Urheberrecht Dritter unterliegen, ohne entsprechende Lizenz, einschließlich Figuren aus bekannten Tabletop-Wargame-Systemen, die ohne kommerzielle Druckrechte aus dem Internet heruntergeladen wurden. Das ist keine Formalität: Eine Urheberrechtsverletzung gefährdet sowohl uns als auch Sie als Auftraggeber. Wenn Sie beim Status einer Datei unsicher sind, fragen Sie vor der Bestellung nach, wir helfen gerne bei der Klärung.
      </P>

      <H2 id="silber">Exklusive Option: eine in 925-Silber gegossene Figur</H2>
      <P>
        Für Figuren mit besonderer Bedeutung (limitierte Sammlereditionen, Erinnerungsstücke, Premium-Geschenke) bieten wir eine Option, die Sie bei einem üblichen 3D-Druckdienst nicht finden: <Strong>Guss in 925-Silber im Lost-Resin-Verfahren</Strong>. Eine in Gussharz gedruckte Figur wird zum Modell, das wir ausbrennen und in unserer eigenen Schmuckwerkstatt in Edelmetall gießen, genau wie bei unseren Ringen.
      </P>
      <P>
        Dies ist ein Einzelprojekt: Der Preis hängt von Figurengröße, Detailgrad und Silbermasse ab. Wenn Sie statt eines weiteren Harzdrucks ein echtes, metallenes Sammlerstück möchten, schreiben Sie uns mit einer Beschreibung Ihres Projekts.
      </P>
      <P>
        In der Praxis nutzen wir dieselbe Pipeline wie bei Ringen: ein Harzdruck als Modell, Ausbrennen im Ofen, Vakuumguss in Metall, anschließende Oberflächenbearbeitung. Eine Silberfigur durchläuft exakt denselben Produktionsweg wie unser Schmuck, daher ist die Verarbeitungsqualität identisch, inklusive Mikroskopkontrolle, Magnettrommel und chemischer Politur.
      </P>

      <CTABox
        accent="blue"
        title="Angebot für Ihre Figur"
        text="Senden Sie die .STL-Datei Ihrer Miniatur oder Figur und erhalten Sie ein Angebot innerhalb von 24h. Der Figuren-Pfad im sTuDiO-Rechner liefert eine sofortige Schätzung."
        href="/studio/#calculator"
        cta="sTuDiO-Rechner öffnen"
      />
    </>
  );
}

export function Body({ lang }) {
  if (lang === "en") return <BodyEN />;
  if (lang === "de") return <BodyDE />;
  return <BodyPL />;
}
