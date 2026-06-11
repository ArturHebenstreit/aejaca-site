import { H2, H3, P, Lead, OL, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "modelowanie-3d-na-zamowienie",
  category: "studio",
  accent: "blue",
  publishedAt: "2026-06-11",
  updatedAt: "2026-06-11",
  coverImage: "/img/blog/modelowanie-3d-na-zamowienie.webp",
  readingTime: { pl: 8, en: 6, de: 6 },
  title: {
    pl: "Modelowanie 3D na zamówienie — Rhino, Fusion 360 (przewodnik)",
    en: "3D Modeling on Demand — Rhino, Fusion 360 (Guide)",
    de: "3D-Modellierung nach Maß — Rhino, Fusion 360 (Leitfaden)",
  },
  description: {
    pl: "Nie masz pliku 3D? Zaprojektujemy model od szkicu. Modelowanie 3D / CAD w Rhino i Fusion 360 dla biżuterii i części technicznych — proces, formaty, koszt.",
    en: "No 3D file? We design the model from a sketch. 3D modeling / CAD in Rhino and Fusion 360 for jewelry and technical parts — process, formats, cost.",
    de: "Keine 3D-Datei? Wir modellieren ab Skizze. 3D-Modellierung / CAD in Rhino und Fusion 360 für Schmuck und technische Teile — Prozess, Formate, Kosten.",
  },
  keywords: {
    pl: "modelowanie 3D na zamówienie, projektowanie modelu 3D do druku, modelowanie CAD biżuterii, Rhino Fusion 360 Polska, reverse engineering części, model STL na zamówienie",
    en: "3D modeling on demand, custom CAD model for 3D printing, jewelry CAD modeling, Rhino Fusion 360, reverse engineering parts, STL model service",
    de: "3D-Modellierung nach Maß, CAD-Modell für 3D-Druck, Schmuck CAD-Modellierung, Rhino Fusion 360, Reverse Engineering Teile, STL-Modell Service",
  },
  faq: {
    pl: [
      { q: "Czym jest modelowanie 3D na zamówienie?", a: "To usługa stworzenia gotowego modelu 3D (CAD) na podstawie Twojego pomysłu, szkicu, zdjęcia lub fizycznego przedmiotu. W AEJaCA modelujemy w Rhino i Fusion 360 — zarówno organiczne formy biżuteryjne, jak i precyzyjne części techniczne. Otrzymujesz plik gotowy do druku 3D lub odlewu, nawet jeśli zaczynasz od zera." },
      { q: "Czy mogę zamówić model, jeśli nie mam żadnego pliku ani rysunku technicznego?", a: "Tak. Wystarczy szkic na kartce, zdjęcie inspiracji, wymiary albo opis słowny. Na tej podstawie tworzymy model CAD i pokazujemy render do akceptacji przed produkcją. Możemy też odtworzyć geometrię z istniejącego przedmiotu (reverse engineering)." },
      { q: "W jakim formacie otrzymam gotowy model?", a: "Do druku 3D dostarczamy STL lub 3MF, do dalszej edycji parametrycznej STEP, a dla biżuterii pliki gotowe pod odlew. Format dobieramy do celu — powiedz, do czego model ma służyć, a przygotujemy właściwy plik." },
      { q: "Ile kosztuje modelowanie 3D na zamówienie?", a: "Koszt zależy od złożoności — prosty element to mniejszy nakład pracy niż mechanizm z tolerancjami czy ażurowa biżuteria z wieloma kamieniami. Wycenę przygotowujemy indywidualnie po zapoznaniu się ze szkicem lub opisem. Modelowanie można połączyć z drukiem lub odlewem w jednym zleceniu." },
    ],
    en: [
      { q: "What is 3D modeling on demand?", a: "It's a service that turns your idea, sketch, photo, or physical object into a ready-to-use 3D (CAD) model. At AEJaCA we model in Rhino and Fusion 360 — both organic jewelry forms and precise technical parts. You receive a print- or cast-ready file even if you start from nothing." },
      { q: "Can I order a model if I have no file or technical drawing?", a: "Yes. A sketch on paper, an inspiration photo, dimensions, or a written description is enough. From that we build the CAD model and show you a render to approve before production. We can also rebuild geometry from an existing object (reverse engineering)." },
      { q: "In what format will I receive the finished model?", a: "For 3D printing we deliver STL or 3MF, for further parametric editing STEP, and for jewelry, cast-ready files. We match the format to your goal — tell us what the model is for and we prepare the right file." },
      { q: "How much does custom 3D modeling cost?", a: "Cost depends on complexity — a simple part takes far less work than a toleranced mechanism or openwork jewelry with many stones. We quote individually after seeing your sketch or brief. Modeling can be combined with printing or casting in a single order." },
    ],
    de: [
      { q: "Was ist 3D-Modellierung nach Maß?", a: "Es ist ein Service, der Ihre Idee, Skizze, ein Foto oder ein physisches Objekt in ein einsatzbereites 3D-(CAD-)Modell verwandelt. Bei AEJaCA modellieren wir in Rhino und Fusion 360 — sowohl organische Schmuckformen als auch präzise technische Teile. Sie erhalten eine druck- oder gussfertige Datei, auch wenn Sie bei null beginnen." },
      { q: "Kann ich ein Modell bestellen, wenn ich keine Datei oder technische Zeichnung habe?", a: "Ja. Eine Skizze auf Papier, ein Inspirationsfoto, Maße oder eine Beschreibung genügen. Daraus erstellen wir das CAD-Modell und zeigen Ihnen vor der Produktion einen Render zur Freigabe. Wir können die Geometrie auch von einem vorhandenen Objekt rekonstruieren (Reverse Engineering)." },
      { q: "In welchem Format erhalte ich das fertige Modell?", a: "Für den 3D-Druck liefern wir STL oder 3MF, für die weitere parametrische Bearbeitung STEP und für Schmuck gussfertige Dateien. Wir passen das Format an Ihr Ziel an — sagen Sie uns, wofür das Modell ist, und wir bereiten die richtige Datei vor." },
      { q: "Was kostet 3D-Modellierung nach Maß?", a: "Die Kosten hängen von der Komplexität ab — ein einfaches Teil ist deutlich weniger Aufwand als ein toleranzbehafteter Mechanismus oder durchbrochener Schmuck mit vielen Steinen. Wir kalkulieren individuell nach Sichtung Ihrer Skizze oder Ihres Briefings. Die Modellierung lässt sich mit Druck oder Guss in einem Auftrag kombinieren." },
    ],
  },
  toc: {
    pl: [
      { id: "co-to", label: "Co to jest" },
      { id: "kiedy", label: "Kiedy potrzebujesz modelu" },
      { id: "narzedzia", label: "Rhino czy Fusion 360" },
      { id: "bizuteria-techniczne", label: "Biżuteria a części techniczne" },
      { id: "proces", label: "Proces i formaty" },
      { id: "koszt", label: "Koszt i czas" },
      { id: "faq", label: "FAQ" },
    ],
    en: [
      { id: "what", label: "What it is" },
      { id: "when", label: "When you need a model" },
      { id: "tools", label: "Rhino vs Fusion 360" },
      { id: "jewelry-technical", label: "Jewelry vs technical parts" },
      { id: "process", label: "Process and formats" },
      { id: "cost", label: "Cost and timeline" },
      { id: "faq", label: "FAQ" },
    ],
    de: [
      { id: "was", label: "Was es ist" },
      { id: "wann", label: "Wann Sie ein Modell brauchen" },
      { id: "werkzeuge", label: "Rhino oder Fusion 360" },
      { id: "schmuck-technik", label: "Schmuck vs. technische Teile" },
      { id: "prozess", label: "Prozess und Formate" },
      { id: "kosten", label: "Kosten und Zeit" },
      { id: "faq", label: "FAQ" },
    ],
  },
  relatedPosts: ["jak-przygotowac-plik-stl", "druk-3d-krok-po-kroku", "projektowanie-ai"],
  relatedCalculators: [
    { to: "/studio/#calculator", icon: "🖨️", label: { pl: "Kalkulator sTuDiO", en: "sTuDiO Calculator", de: "sTuDiO-Rechner" }, desc: { pl: "Wyceń druk 3D z pliku STL", en: "Quote 3D printing from STL", de: "3D-Druck aus STL kalkulieren" } },
    { to: "/jewelry/#calculator", icon: "💎", label: { pl: "Kalkulator biżuterii", en: "Jewelry Calculator", de: "Schmuckkalkulator" }, desc: { pl: "Wycena biżuterii na zamówienie", en: "Custom jewelry quote", de: "Schmuck nach Maß kalkulieren" } },
  ],
};

// ======================= PL =======================
function BodyPL() {
  return (
    <>
      <Lead>
        Druk 3D i odlew zaczynają się od jednego pliku — modelu 3D. Problem w tym, że większość ludzi
        ma świetny pomysł, ale nie ma pliku. W AEJaCA wypełniamy tę lukę: modelujemy od szkicu, zdjęcia
        albo zwykłego opisu, w Rhino i Fusion 360. Nie tylko drukujemy gotowe pliki — projektujemy je dla Ciebie.
      </Lead>

      <H2 id="co-to">Czym jest modelowanie 3D na zamówienie?</H2>
      <P>
        <Strong>Modelowanie 3D</Strong> (zwane też <A href="/glossary/cad">CAD</A>) to tworzenie cyfrowej, trójwymiarowej
        reprezentacji przedmiotu, którą maszyna potrafi wyprodukować — wydrukować, wyciąć albo odlać. To pierwszy i
        najważniejszy etap całego procesu: bez dobrego modelu nawet najlepsza drukarka wydrukuje błędy.
      </P>
      <P>
        Kluczowa różnica: nie musisz przychodzić z gotowym plikiem. Możesz przyjść z <Strong>pomysłem</Strong>.
        Szkic na serwetce, zdjęcie zepsutej części, wymiary z suwmiarki albo opis „chcę uchwyt, który zmieści się tutaj" —
        to nam wystarczy, żeby zacząć.
      </P>
      <Callout accent="blue" title="W skrócie">
        Modelowanie 3D na zamówienie = zamieniamy Twój pomysł w plik gotowy do produkcji.
        Ty dostarczasz wizję, my dostarczamy precyzyjny model i (opcjonalnie) gotowy wydruk lub odlew.
      </Callout>

      <H2 id="kiedy">Kiedy potrzebujesz modelu na zamówienie?</H2>
      <UL>
        <LI><Strong>Masz pomysł, nie masz pliku</Strong> — biżuteria autorska, figurka, gadżet, element dekoracyjny od zera.</LI>
        <LI><Strong>Potrzebujesz części zamiennej, której nie ma w sprzedaży</Strong> — odtwarzamy geometrię ze zniszczonego oryginału (<Strong>reverse engineering</Strong>) i drukujemy nowy egzemplarz.</LI>
        <LI><Strong>Projektujesz coś funkcjonalnego</Strong> — obudowa elektroniki, mocowanie, adapter, koło zębate. Tu liczą się <Strong>tolerancje</Strong> i pasowania, a model parametryczny pozwala je dopracować.</LI>
        <LI><Strong>Masz plik, ale nie nadaje się do druku</Strong> — naprawiamy siatkę, domykamy bryłę, optymalizujemy ścianki. Więcej w artykule <A href="/blog/jak-przygotowac-plik-stl">Jak przygotować plik STL</A>.</LI>
      </UL>

      <H2 id="narzedzia">Rhino czy Fusion 360 — czym modelujemy i dlaczego</H2>
      <P>
        Używamy dwóch profesjonalnych narzędzi, bo każde jest najlepsze do czego innego:
      </P>
      <Table
        headers={["Narzędzie", "Najlepsze do", "Typ geometrii"]}
        rows={[
          ["Rhino (NURBS)", "Biżuteria, formy organiczne, płynne kształty", "Powierzchnie swobodne, krzywe"],
          ["Fusion 360", "Części techniczne, mechanizmy, tolerancje", "Parametryczna, sterowana wymiarami"],
        ]}
      />
      <P>
        <Strong>Rhino</Strong> świetnie radzi sobie z organicznymi, „rzeźbiarskimi" kształtami — pierścionkami,
        wisiorkami, falującymi formami. <Strong>Fusion 360</Strong> jest parametryczny: zmieniasz jeden wymiar,
        a cały model się przelicza — to bezcenne przy częściach, które muszą do siebie pasować z dokładnością do
        dziesiątych milimetra. Dobieramy narzędzie do zadania, a nie odwrotnie.
      </P>

      <H2 id="bizuteria-techniczne">Biżuteria a części techniczne — dwa światy, jeden warsztat</H2>
      <H3>Modelowanie biżuterii</H3>
      <P>
        Pierścionki, sygnety, wisiorki, kolczyki — modelujemy z myślą o odlewie metodą traconego wosku albo
        bezpośrednim druku w żywicy. Uwzględniamy <Strong>rozmiar palca</Strong>, gniazda pod kamienie, grubości
        ścianek bezpieczne dla odlewu i miejsca pod grawer. Render 3D pokazujemy do akceptacji, zanim cokolwiek powstanie fizycznie.
      </P>
      <H3>Modelowanie części technicznych i funkcjonalnych</H3>
      <P>
        Obudowy, adaptery, mocowania, koła zębate, części zamienne — tu kluczowe są pasowania, tolerancje i
        dobór materiału pod obciążenie. Projektujemy model parametrycznie, więc późniejsze zmiany (np. inny rozmiar
        otworu) są szybkie i tanie. Gotowy model drukujemy w odpowiednim materiale — od PLA po nylony z włóknem węglowym.
      </P>

      <H2 id="proces">Jak wygląda proces i jakie pliki dostajesz</H2>
      <OL>
        <LI><Strong>Brief</Strong> — przesyłasz szkic, zdjęcie, wymiary lub opis. Doprecyzowujemy cel i materiał.</LI>
        <LI><Strong>Model CAD</Strong> — budujemy geometrię w Rhino lub Fusion 360.</LI>
        <LI><Strong>Render / podgląd</Strong> — widzisz model z każdej strony i akceptujesz. Poprawki na tym etapie są najtańsze.</LI>
        <LI><Strong>Plik produkcyjny</Strong> — eksportujemy właściwy format pod Twój cel.</LI>
        <LI><Strong>(Opcjonalnie) produkcja</Strong> — drukujemy 3D, odlewamy lub frezujemy w jednym zleceniu.</LI>
      </OL>
      <Table
        headers={["Format", "Do czego", "Kiedy go wybrać"]}
        rows={[
          ["STL", "Druk 3D (siatka)", "Standard do druku FDM/SLA"],
          ["3MF", "Druk 3D (z metadanymi)", "Gdy ważne są kolory/ustawienia"],
          ["STEP", "Edycja parametryczna / CNC", "Dalsza obróbka, frezowanie"],
          ["Plik pod odlew", "Biżuteria", "Odlew traconego wosku"],
        ]}
      />
      <P>
        Nie wiesz, który format wybrać? Powiedz tylko, do czego model ma posłużyć —
        format to nasza działka. Jeśli masz już gotowy plik STL, możesz od razu
        <A href="/studio#calculator"> wrzucić go do kalkulatora sTuDiO</A> i poznać cenę druku.
      </P>

      <H2 id="koszt">Ile kosztuje i ile trwa modelowanie 3D?</H2>
      <P>
        Koszt modelowania zależy przede wszystkim od <Strong>złożoności</Strong>, a nie od wielkości przedmiotu:
      </P>
      <UL>
        <LI><Strong>Proste bryły</Strong> (adapter, prosty uchwyt, podstawka) — najmniejszy nakład pracy.</LI>
        <LI><Strong>Części funkcjonalne z tolerancjami</Strong> (obudowa, mechanizm, pasowanie) — średni nakład.</LI>
        <LI><Strong>Biżuteria i formy organiczne</Strong> (ażury, osadzenia kamieni, rzeźbiarskie detale) — najwyższy nakład pracy ręcznej.</LI>
      </UL>
      <P>
        Dlatego modelowanie wyceniamy <Strong>indywidualnie</Strong> — po obejrzeniu szkicu lub opisu wiemy, ile pracy
        wymaga projekt, i podajemy konkretną kwotę. Samo modelowanie zwykle zajmuje od kilku dni; często łączymy je
        z drukiem lub odlewem w jednym zleceniu, więc nie płacisz dwa razy za logistykę.
      </P>

      <CTABox
        accent="blue"
        title="Masz pomysł, ale nie masz pliku?"
        text="Prześlij szkic, zdjęcie lub opis — zaprojektujemy model 3D i wycenimy całość. Możemy od razu wydrukować lub odlać gotowy efekt."
        href="/contact"
        cta="Zamów modelowanie 3D"
      />
    </>
  );
}

// ======================= EN =======================
function BodyEN() {
  return (
    <>
      <Lead>
        3D printing and casting all begin with a single file — the 3D model. The catch: most people have a great
        idea but no file. At AEJaCA we close that gap. We model from a sketch, a photo, or a plain description, in
        Rhino and Fusion 360. We don't just print finished files — we design them for you.
      </Lead>

      <H2 id="what">What is 3D modeling on demand?</H2>
      <P>
        <Strong>3D modeling</Strong> (also called <A href="/glossary/cad">CAD</A>) is creating a digital, three-dimensional
        representation of an object that a machine can produce — print, cut, or cast. It's the first and most important
        step of the whole process: without a good model, even the best printer will faithfully print your mistakes.
      </P>
      <P>
        The key difference: you don't need to arrive with a finished file. You can arrive with an <Strong>idea</Strong>.
        A sketch on a napkin, a photo of a broken part, dimensions from a caliper, or "I want a bracket that fits here" —
        that's enough for us to start.
      </P>
      <Callout accent="blue" title="In short">
        Custom 3D modeling = we turn your idea into a production-ready file. You bring the vision, we deliver a precise
        model and (optionally) the finished print or cast.
      </Callout>

      <H2 id="when">When do you need a custom model?</H2>
      <UL>
        <LI><Strong>You have an idea, not a file</Strong> — original jewelry, a figurine, a gadget, a decorative piece from scratch.</LI>
        <LI><Strong>You need a spare part that isn't sold anywhere</Strong> — we rebuild the geometry from the broken original (<Strong>reverse engineering</Strong>) and print a new one.</LI>
        <LI><Strong>You're designing something functional</Strong> — an electronics enclosure, a mount, an adapter, a gear. Here <Strong>tolerances</Strong> and fits matter, and a parametric model lets us dial them in.</LI>
        <LI><Strong>You have a file, but it's not printable</Strong> — we repair the mesh, close the solid, optimize wall thickness. More in <A href="/blog/jak-przygotowac-plik-stl">How to prepare an STL file</A>.</LI>
      </UL>

      <H2 id="tools">Rhino vs Fusion 360 — what we model with and why</H2>
      <P>We use two professional tools, because each is best at something different:</P>
      <Table
        headers={["Tool", "Best for", "Geometry type"]}
        rows={[
          ["Rhino (NURBS)", "Jewelry, organic forms, flowing shapes", "Free-form surfaces, curves"],
          ["Fusion 360", "Technical parts, mechanisms, tolerances", "Parametric, dimension-driven"],
        ]}
      />
      <P>
        <Strong>Rhino</Strong> excels at organic, sculptural shapes — rings, pendants, flowing forms.
        <Strong> Fusion 360</Strong> is parametric: change one dimension and the whole model recalculates — invaluable for
        parts that must fit together to tenths of a millimeter. We match the tool to the task, not the other way around.
      </P>

      <H2 id="jewelry-technical">Jewelry vs technical parts — two worlds, one workshop</H2>
      <H3>Jewelry modeling</H3>
      <P>
        Rings, signets, pendants, earrings — modeled for lost-wax casting or direct resin printing. We account for
        <Strong> finger size</Strong>, stone seats, casting-safe wall thickness, and space for engraving. You approve a 3D
        render before anything is made physically.
      </P>
      <H3>Technical and functional part modeling</H3>
      <P>
        Enclosures, adapters, mounts, gears, spare parts — here fits, tolerances, and material choice for the load are
        critical. We model parametrically, so later changes (e.g. a different hole size) are fast and cheap. We then print
        the model in the right material — from PLA to carbon-fiber nylons.
      </P>

      <H2 id="process">The process and the files you get</H2>
      <OL>
        <LI><Strong>Brief</Strong> — you send a sketch, photo, dimensions, or description. We clarify the goal and material.</LI>
        <LI><Strong>CAD model</Strong> — we build the geometry in Rhino or Fusion 360.</LI>
        <LI><Strong>Render / preview</Strong> — you see the model from every angle and approve. Edits are cheapest here.</LI>
        <LI><Strong>Production file</Strong> — we export the right format for your goal.</LI>
        <LI><Strong>(Optional) production</Strong> — we 3D-print, cast, or mill it in one order.</LI>
      </OL>
      <Table
        headers={["Format", "For", "When to choose"]}
        rows={[
          ["STL", "3D printing (mesh)", "Standard for FDM/SLA"],
          ["3MF", "3D printing (with metadata)", "When colors/settings matter"],
          ["STEP", "Parametric editing / CNC", "Further machining, milling"],
          ["Cast-ready file", "Jewelry", "Lost-wax casting"],
        ]}
      />
      <P>
        Not sure which format to pick? Just tell us what the model is for — format is our job. If you already have an STL,
        you can <A href="/studio#calculator">drop it into the sTuDiO calculator</A> and get an instant print price.
      </P>

      <H2 id="cost">How much does 3D modeling cost and how long does it take?</H2>
      <P>Modeling cost depends mostly on <Strong>complexity</Strong>, not on the object's size:</P>
      <UL>
        <LI><Strong>Simple solids</Strong> (adapter, basic bracket, stand) — least effort.</LI>
        <LI><Strong>Functional parts with tolerances</Strong> (enclosure, mechanism, fit) — medium effort.</LI>
        <LI><Strong>Jewelry and organic forms</Strong> (openwork, stone settings, sculptural detail) — most hand-work.</LI>
      </UL>
      <P>
        That's why we quote modeling <Strong>individually</Strong> — once we see the sketch or brief, we know the workload
        and give you a firm price. Modeling itself usually takes a few days; we often combine it with printing or casting in
        one order, so you don't pay twice for logistics.
      </P>

      <CTABox
        accent="blue"
        title="Have an idea but no file?"
        text="Send a sketch, photo, or description — we'll design the 3D model and quote the whole job. We can print or cast the finished result right away."
        href="/contact"
        cta="Order 3D modeling"
      />
    </>
  );
}

// ======================= DE =======================
function BodyDE() {
  return (
    <>
      <Lead>
        3D-Druck und Guss beginnen mit einer einzigen Datei — dem 3D-Modell. Der Haken: Die meisten Menschen haben eine
        großartige Idee, aber keine Datei. Bei AEJaCA schließen wir diese Lücke. Wir modellieren ab Skizze, Foto oder
        einfacher Beschreibung, in Rhino und Fusion 360. Wir drucken nicht nur fertige Dateien — wir gestalten sie für Sie.
      </Lead>

      <H2 id="was">Was ist 3D-Modellierung nach Maß?</H2>
      <P>
        <Strong>3D-Modellierung</Strong> (auch <A href="/glossary/cad">CAD</A> genannt) ist das Erstellen einer digitalen,
        dreidimensionalen Darstellung eines Objekts, das eine Maschine produzieren kann — drucken, schneiden oder gießen.
        Es ist der erste und wichtigste Schritt des gesamten Prozesses: Ohne ein gutes Modell druckt selbst der beste
        Drucker zuverlässig Ihre Fehler.
      </P>
      <P>
        Der entscheidende Unterschied: Sie müssen nicht mit einer fertigen Datei kommen. Sie können mit einer
        <Strong> Idee</Strong> kommen. Eine Skizze auf einer Serviette, ein Foto eines kaputten Teils, Maße vom Messschieber
        oder „Ich möchte eine Halterung, die hierher passt" — das genügt uns zum Start.
      </P>
      <Callout accent="blue" title="Kurz gesagt">
        3D-Modellierung nach Maß = wir verwandeln Ihre Idee in eine produktionsfertige Datei. Sie bringen die Vision, wir
        liefern ein präzises Modell und (optional) den fertigen Druck oder Guss.
      </Callout>

      <H2 id="wann">Wann brauchen Sie ein Modell nach Maß?</H2>
      <UL>
        <LI><Strong>Sie haben eine Idee, keine Datei</Strong> — eigener Schmuck, eine Figur, ein Gadget, ein Deko-Element von Grund auf.</LI>
        <LI><Strong>Sie brauchen ein Ersatzteil, das es nicht zu kaufen gibt</Strong> — wir rekonstruieren die Geometrie vom kaputten Original (<Strong>Reverse Engineering</Strong>) und drucken ein neues.</LI>
        <LI><Strong>Sie gestalten etwas Funktionales</Strong> — ein Elektronikgehäuse, eine Halterung, einen Adapter, ein Zahnrad. Hier zählen <Strong>Toleranzen</Strong> und Passungen, und ein parametrisches Modell lässt sie feinjustieren.</LI>
        <LI><Strong>Sie haben eine Datei, aber sie ist nicht druckbar</Strong> — wir reparieren das Mesh, schließen den Körper, optimieren Wandstärken. Mehr im Artikel <A href="/blog/jak-przygotowac-plik-stl">Wie man eine STL-Datei vorbereitet</A>.</LI>
      </UL>

      <H2 id="werkzeuge">Rhino oder Fusion 360 — womit wir modellieren und warum</H2>
      <P>Wir nutzen zwei professionelle Werkzeuge, weil jedes für etwas anderes am besten ist:</P>
      <Table
        headers={["Werkzeug", "Am besten für", "Geometrietyp"]}
        rows={[
          ["Rhino (NURBS)", "Schmuck, organische Formen, fließende Formen", "Freiformflächen, Kurven"],
          ["Fusion 360", "Technische Teile, Mechanismen, Toleranzen", "Parametrisch, maßgesteuert"],
        ]}
      />
      <P>
        <Strong>Rhino</Strong> glänzt bei organischen, skulpturalen Formen — Ringen, Anhängern, fließenden Formen.
        <Strong> Fusion 360</Strong> ist parametrisch: Ändern Sie ein Maß, und das ganze Modell rechnet sich neu — unbezahlbar
        bei Teilen, die auf Zehntelmillimeter zusammenpassen müssen. Wir wählen das Werkzeug zur Aufgabe, nicht umgekehrt.
      </P>

      <H2 id="schmuck-technik">Schmuck vs. technische Teile — zwei Welten, eine Werkstatt</H2>
      <H3>Schmuckmodellierung</H3>
      <P>
        Ringe, Siegelringe, Anhänger, Ohrringe — modelliert für Wachsausschmelzguss oder direkten Harzdruck. Wir
        berücksichtigen <Strong>Fingergröße</Strong>, Steinfassungen, gussichere Wandstärken und Platz für Gravur. Sie geben
        einen 3D-Render frei, bevor etwas physisch entsteht.
      </P>
      <H3>Modellierung technischer und funktionaler Teile</H3>
      <P>
        Gehäuse, Adapter, Halterungen, Zahnräder, Ersatzteile — hier sind Passungen, Toleranzen und die Materialwahl für die
        Last entscheidend. Wir modellieren parametrisch, sodass spätere Änderungen (z. B. ein anderer Lochdurchmesser) schnell
        und günstig sind. Anschließend drucken wir das Modell im passenden Material — von PLA bis zu Carbon-Nylons.
      </P>

      <H2 id="prozess">Der Prozess und die Dateien, die Sie erhalten</H2>
      <OL>
        <LI><Strong>Briefing</Strong> — Sie senden Skizze, Foto, Maße oder Beschreibung. Wir klären Ziel und Material.</LI>
        <LI><Strong>CAD-Modell</Strong> — wir bauen die Geometrie in Rhino oder Fusion 360.</LI>
        <LI><Strong>Render / Vorschau</Strong> — Sie sehen das Modell aus jedem Winkel und geben es frei. Änderungen sind hier am günstigsten.</LI>
        <LI><Strong>Produktionsdatei</Strong> — wir exportieren das richtige Format für Ihr Ziel.</LI>
        <LI><Strong>(Optional) Produktion</Strong> — wir drucken, gießen oder fräsen in einem Auftrag.</LI>
      </OL>
      <Table
        headers={["Format", "Wofür", "Wann wählen"]}
        rows={[
          ["STL", "3D-Druck (Mesh)", "Standard für FDM/SLA"],
          ["3MF", "3D-Druck (mit Metadaten)", "Wenn Farben/Einstellungen zählen"],
          ["STEP", "Parametrische Bearbeitung / CNC", "Weitere Bearbeitung, Fräsen"],
          ["Gussfertige Datei", "Schmuck", "Wachsausschmelzguss"],
        ]}
      />
      <P>
        Unsicher, welches Format? Sagen Sie uns einfach, wofür das Modell ist — das Format ist unsere Aufgabe. Wenn Sie
        bereits ein STL haben, können Sie es <A href="/studio#calculator">in den sTuDiO-Rechner laden</A> und den Druckpreis sehen.
      </P>

      <H2 id="kosten">Was kostet 3D-Modellierung und wie lange dauert sie?</H2>
      <P>Die Modellierungskosten hängen vor allem von der <Strong>Komplexität</Strong> ab, nicht von der Objektgröße:</P>
      <UL>
        <LI><Strong>Einfache Körper</Strong> (Adapter, einfache Halterung, Ständer) — geringster Aufwand.</LI>
        <LI><Strong>Funktionale Teile mit Toleranzen</Strong> (Gehäuse, Mechanismus, Passung) — mittlerer Aufwand.</LI>
        <LI><Strong>Schmuck und organische Formen</Strong> (Durchbrüche, Steinfassungen, skulpturale Details) — meiste Handarbeit.</LI>
      </UL>
      <P>
        Deshalb kalkulieren wir die Modellierung <Strong>individuell</Strong> — sobald wir Skizze oder Briefing sehen, kennen
        wir den Aufwand und nennen einen festen Preis. Die Modellierung selbst dauert meist einige Tage; oft kombinieren wir
        sie mit Druck oder Guss in einem Auftrag, sodass Sie die Logistik nicht doppelt zahlen.
      </P>

      <CTABox
        accent="blue"
        title="Eine Idee, aber keine Datei?"
        text="Senden Sie Skizze, Foto oder Beschreibung — wir gestalten das 3D-Modell und kalkulieren das Ganze. Wir können das fertige Ergebnis direkt drucken oder gießen."
        href="/contact"
        cta="3D-Modellierung bestellen"
      />
    </>
  );
}

export function Body({ lang }) {
  if (lang === "en") return <BodyEN />;
  if (lang === "de") return <BodyDE />;
  return <BodyPL />;
}
