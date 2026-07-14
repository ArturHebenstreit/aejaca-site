import { H2, H3, P, Lead, OL, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./lost-resin-krok-po-kroku.meta.js";

// ======================= PL =======================
function BodyPL() {
  return (
    <>
      <Lead>
        Za każdym odlewem biżuterii stoi wzorzec. Kiedyś rzeźbiony ręcznie w wosku, dziś coraz częściej
        drukowany warstwa po warstwie na drukarce żywicznej. Lost-resin to technika, która łączy precyzję
        druku 3D z klasycznym odlewem próżniowym, dając detal niemożliwy do uzyskania ręcznie. Ten przewodnik
        pokazuje cały proces, od pliku CAD po gotowy odlew, wraz z parametrami, których faktycznie używamy.
      </Lead>

      <H2 id="czym-jest">Czym jest lost-resin i czym różni się od lost-wax oraz lost-PLA</H2>
      <P>
        Wszystkie trzy techniki, lost-wax, lost-PLA i lost-resin, opierają się na tej samej zasadzie:
        tworzysz wzorzec, otaczasz go masą inwestycyjną, wypalasz wzorzec w piecu (tak, że &bdquo;znika&rdquo;,
        stąd <Strong>lost</Strong> w nazwie), a na jego miejscu odlewasz metal. Różnica leży w tym, z czego
        powstaje wzorzec.
      </P>
      <Table
        headers={["Technika", "Wzorzec", "Precyzja", "Najlepsze do"]}
        rows={[
          ["Lost-wax", "Rzeźbiony lub wtryskiwany wosk", "Zależna od ręki lub formy", "Serie z jednej matrycy woskowej"],
          ["Lost-PLA", "Wydruk FDM z filamentu PLA", "0,1–0,3 mm (warstwa)", "Prostsze bryły, prototypy większych elementów"],
          ["Lost-resin", "Wydruk MSLA z żywicy castable", "0,025–0,05 mm (warstwa)", "Filigran, detale, ażury, jednostkowe unikaty"],
        ]}
      />
      <P>
        Lost-resin wygrywa tam, gdzie liczy się detal: cienkie splecione druty, mikrograwery, ażurowe
        wzory, organiczne relief. Piksel drukarki i wysokość warstwy są rzędu wielkości mniejsze niż
        w druku FDM, więc odwzorowanie geometrii jest znacznie bliższe cyfrowemu modelowi.
      </P>
      <P>
        W praktyce jubilerskiej ma to konkretne przełożenie na biznes. Projektant biżuterii, który
        chce sprzedawać unikaty albo krótkie serie, nie musi rzeźbić każdego wzorca ręcznie ani
        inwestować w formę wtryskową do wosku, opłacalną dopiero od kilkudziesięciu sztuk. Lost-resin
        pozwala wydrukować pojedynczy wzorzec tego samego dnia, poprawić projekt w CAD i wydrukować
        kolejną wersję bez dodatkowych kosztów narzędziowych. To właśnie ta elastyczność sprawia, że
        technika stała się standardem w małych pracowniach jubilerskich i studiach projektowych.
      </P>
      <P>
        Warto też rozwiać częste nieporozumienie: lost-resin nie zastępuje jubilera, tylko etap
        modelowania wzorca. Odlew, wykończenie, osadzanie kamieni i finalne szlifowanie pozostają
        rzemiosłem wymagającym doświadczenia. Druk żywiczny daje jubilerowi narzędzie, które
        w kilka godzin przenosi projekt cyfrowy w formę gotową do inwestycji, zamiast dni pracy
        ręcznej przy wosku.
      </P>

      <H2 id="sprzet">Sprzęt: drukarka i utwardzarka</H2>
      <P>
        Wzorce jubilerskie drukujemy na <Strong>Elegoo Saturn 4 Ultra 16K</Strong>. Kluczowe parametry
        tej drukarki mają bezpośrednie przełożenie na jakość wzorca:
      </P>
      <UL>
        <LI><Strong>Ekran 16K</Strong> o rozdzielczości 16384×9216 px i wielkości piksela 14×19 µm, co jest podstawą odwzorowania mikrodetalu.</LI>
        <LI><Strong>Grzana wanna (30°C)</Strong> stabilizuje lepkość żywicy, więc kolejne warstwy utwardzają się równomiernie niezależnie od temperatury w pomieszczeniu.</LI>
        <LI><Strong>Tilt Release</Strong> redukuje siły ścinające przy odklejaniu warstwy od folii, co ma znaczenie przy delikatnych, filigranowych geometriach, gdzie łatwo o pęknięcie.</LI>
        <LI><Strong>Obszar roboczy</Strong> 218×123×250 mm, w praktyce dla biżuterii wykorzystujemy niewielki jego wycinek na jednorazowy wydruk kilku wzorców naraz.</LI>
      </UL>
      <P>
        Po wydruku wzorzec trafia do <Strong>Elegoo Mercury Plus V3.0</Strong>, myjki i utwardzarki UV
        z obrotem 360°. Mycie odbywa się w IPA (99,9%) w dwóch etapach, zgrubnym i dokładnym, po czym
        wzorzec jest suszony sprężonym powietrzem i utwardzany UV przez 2–4 minuty. Dopiero po pełnym
        utwardzeniu usuwa się podpory, szczypcami jubilerskimi, żeby nie odkształcić geometrii.
      </P>
      <P>
        Kolejność tych kroków nie jest przypadkowa. Usunięcie podpór przed pełnym utwardzeniem UV to
        jeden z najczęstszych błędów początkujących, żywica po myciu w IPA jest wciąż miękka
        i plastyczna, więc każda ingerencja mechaniczna na tym etapie ryzykuje wygięciem cienkich
        elementów albo urwaniem detalu. Dopiero pełne utwardzenie nadaje wzorcowi sztywność zbliżoną
        do twardego wosku jubilerskiego, wystarczającą, by bezpiecznie przejść przez inwestycję i
        transport do pieca.
      </P>

      <H2 id="zywice">Żywice castable: którą wybrać</H2>
      <P>
        Nie każda żywica nadaje się do odlewu. Standardowe żywice do prototypów czy miniatur zostawiają
        po wypaleniu popiół, który zniszczy formę inwestycyjną. Do wzorców jubilerskich używamy dwóch
        żywic castable od BlueCast:
      </P>
      <Table
        headers={["Żywica", "Zawartość wosku", "Kiedy stosować"]}
        rows={[
          ["BlueCast X-Wax Filigree", "&gt;80% wosku", "Filigran, łodygi, detal od 0,2 mm, elementy ażurowe i delikatne"],
          ["BlueCast X-One V2", "Zero skurczu", "Szyny, korony, elementy masywne, gdzie liczy się stabilna geometria bez odkształceń"],
        ]}
      />
      <P>
        <Strong>W praktyce:</Strong> jeśli projekt to delikatny splot, ażurowy wzór albo bardzo cienkie
        elementy, sięgamy po X-Wax Filigree, jego wysoka zawartość wosku wypala się czyściej i pozwala
        odwzorować detale od 0,2 mm. Jeśli projekt to masywny pierścionek, sygnet albo korona pod kamień,
        lepszym wyborem jest X-One V2 dzięki zerowemu skurczowi, geometria zostaje stabilna od druku aż
        po wypalenie.
      </P>

      <H2 id="workflow">Workflow krok po kroku</H2>
      <OL>
        <LI>
          <Strong>Projekt CAD z kompensacją skurczu.</Strong> Model 3D jest skalowany z góry, tak aby po
          skurczu metalu podczas krzepnięcia finalny wymiar był zgodny z projektem. Współczynniki, których
          używamy: Au 585 (14K) x1,0196, Ag 925 x1,016, Au 9K x1,021, Au 18K x1,018.
        </LI>
        <LI>
          <Strong>Druk na Saturn 4 Ultra 16K.</Strong> Wysokość warstwy 0,05 mm dla większości wzorców,
          0,03 mm przy najdrobniejszych detalach. Ustawienia ekspozycji wg oficjalnych profili BlueCast
          dla Chitubox.
        </LI>
        <LI>
          <Strong>Mycie w IPA.</Strong> Kapanie z platformy 3–5 min, mycie w Mercury Plus 3–5 min
          (dwuetapowe), suszenie sprężonym powietrzem 5–10 min.
        </LI>
        <LI>
          <Strong>Utwardzanie UV.</Strong> 2–4 minuty w Mercury Plus, dopiero potem zdejmowanie
          z platformy i usuwanie podpór.
        </LI>
        <LI>
          <Strong>Sprue i przygotowanie do inwestycji.</Strong> Wzorzec mocujemy do main sprue,
          przy vacuum-assist stosujemy średnicę 2,0–2,5 mm (start: 2,2 mm). Dedykowane wenty są zwykle
          zbędne, bo masa Omni-II odprowadza powietrze przez porowatość.
        </LI>
        <LI>
          <Strong>Inwestycja w masę Omni-II.</Strong> Proporcje 40:100 woda:proszek, wypełnienie kolby
          480–610 g, minimum 15–20 mm masy nad koroną modelu, żeby zapobiec zawaleniu pod próżnią.
        </LI>
        <LI>
          <Strong>Wypalanie.</Strong> Kolba trafia do pieca wypalającego (do 1200°C), gdzie wosk i żywica
          castable wypalają się bez pozostawiania szkodliwego popiołu, zostawiając w masie precyzyjną
          wnękę o kształcie wzorca.
        </LI>
        <LI>
          <Strong>Odlew próżniowy.</Strong> Metal (np. Au 585 w temperaturze ok. 1000°C, kolba ok. 600°C)
          jest wciągany próżnią w wnękę, co daje lepsze wypełnienie cienkich detali i mniejszą porowatość
          niż odlew grawitacyjny.
        </LI>
        <LI>
          <Strong>Wykończenie.</Strong> Rozbicie masy inwestycyjnej, odcięcie sprue, szlifowanie,
          polerowanie i finalna kontrola jakości odlewu.
        </LI>
      </OL>
      <P>
        Warto podkreślić, dlaczego akurat odlew próżniowy, a nie grawitacyjny, jest tu domyślnym
        wyborem. Przy odlewie grawitacyjnym metal spływa do wnęki pod wpływem własnej masy, co przy
        cienkich, ażurowych kanałach po wzorcach lost-resin bywa niewystarczające, roztopiony metal
        krzepnie zanim wypełni najdrobniejsze detale. Vacuum-assist aktywnie zasysa metal w głąb formy,
        więc nawet detale rzędu 0,2–0,3 mm wypełniają się poprawnie, a gotowy odlew ma mniej porów
        i wymaga mniej korekt na etapie wykończenia.
      </P>
      <P>
        Cały cykl, od gotowego pliku CAD po odlew gotowy do wykończenia, mieści się zwykle w jednym
        dniu roboczym. Sam wzorzec drukuje się w 2–4 godziny, mycie i utwardzanie zajmują kolejne
        kilkanaście minut, a inwestycja, wypalanie i odlew próżniowy to zwykle jeden cykl pieca.
        Orientacyjny koszt samego wzorca to 90–180 zł, w zależności od wielkości i złożoności geometrii,
        co dla jednostkowego egzemplarza biżuterii jest ułamkiem kosztu, jaki generowałoby zbudowanie
        formy wtryskowej do wosku.
      </P>

      <H2 id="ograniczenia">Ograniczenia i typowe błędy</H2>
      <UL>
        <LI><Strong>Złe wypalanie</Strong>: zbyt szybkie tempo grzania lub za krótki czas w wysokiej temperaturze zostawia w masie popiół, który blokuje wypełnienie metalem i psuje odlew.</LI>
        <LI><Strong>Zbyt cienkie ścianki</Strong>: poniżej granicy detalu danej żywicy (0,2 mm dla X-Wax Filigree) element może się nie wydrukować albo pęknie przy zdejmowaniu z platformy.</LI>
        <LI><Strong>Brak kompensacji skurczu</Strong>: projekt bez uwzględnienia współczynnika skurczu metalu skończy się odlewem mniejszym niż zakładano, szczególnie odczuwalne przy pierścionkach z dokładnym rozmiarem.</LI>
        <LI><Strong>Zła żywica do zadania</Strong>: użycie X-One V2 do filigranu albo X-Wax Filigree do masywnej sygnetówki daje gorszy rezultat niż dobór właściwej żywicy do geometrii.</LI>
        <LI><Strong>Zbyt krótki main sprue lub zła średnica</Strong>: przy vacuum-assist mniejszej niż 2,0 mm metal nie zdąży wypełnić formy zanim zacznie krzepnąć, a zbyt duża zwiększa ryzyko turbulencji i porowatości w miejscu połączenia z odlewem.</LI>
      </UL>
      <P>
        Część tych błędów ujawnia się dopiero po wypaleniu, kiedy poprawka jest już niemożliwa,
        dlatego kluczowa jest kontrola na wcześniejszych etapach: wizualna ocena wzorca po utwardzeniu
        UV, sprawdzenie grubości najcieńszych elementów w CAD przed drukiem oraz konsekwentne stosowanie
        tego samego profilu wypalania dla danej masy inwestycyjnej.
      </P>
      <P>
        Dobrym nawykiem jest też prowadzenie prostego dziennika druku, notowanie żywicy, wysokości
        warstwy, czasu ekspozycji i wyniku wypalania dla każdego wzorca. Przy pracy z kilkoma
        żywicami castable naraz łatwo pomylić profil ekspozycji, a odtworzenie powtarzalnych,
        udanych ustawień jest dużo szybsze niż każdorazowe kalibrowanie od zera.
      </P>

      <H2 id="kiedy-zlecic">Kiedy zlecić zamiast robić samemu</H2>
      <P>
        Lost-resin wymaga jednocześnie precyzyjnej drukarki żywicznej, wiedzy o kompensacji skurczu metali,
        pieca wypalającego z kontrolą profilu temperaturowego oraz maszyny do odlewu próżniowego. Dla
        pojedynczego wzorca czy testu koncepcji to duża inwestycja sprzętowa. Jeśli projektujesz kolekcję
        biżuterii i potrzebujesz powtarzalnych, precyzyjnych odlewów, zlecenie wzorca i odlewu specjaliście
        zwykle wychodzi taniej i szybciej niż budowanie własnej linii produkcyjnej.
      </P>
      <P>
        W AEJaCA sTuDiO cały ten łańcuch, od pliku CAD, przez druk i inwestycję, po odlew próżniowy
        i wykończenie, mamy pod jednym dachem. Dla projektantów biżuterii i marek B2B oznacza to jeden
        punkt kontaktu zamiast koordynowania osobno modelarni, drukarni i odlewni, a dla twórców
        indywidualnych, jednorazowy wzorzec bez konieczności kupowania sprzętu wartego kilkanaście
        tysięcy złotych.
      </P>
      <Callout accent="blue" title="Wskazówka">
        Zobacz gotowe wzorce castable i możliwości współpracy B2B, albo policz orientacyjną cenę
        w kalkulatorze sTuDiO.
        <br /><A href="/studio#calculator">Sprawdź kalkulator sTuDiO →</A>
      </Callout>

      <CTABox
        accent="blue"
        title="Zamów wzorzec lost-resin"
        text="Prześlij plik CAD lub opisz projekt biżuterii, wycenimy wzorzec i odlew w 24h."
        href="/b2b/"
        cta="Zobacz ofertę B2B"
      />
    </>
  );
}

// ======================= EN =======================
function BodyEN() {
  return (
    <>
      <Lead>
        Behind every jewelry casting stands a pattern. Once hand-carved in wax, today it is increasingly
        printed layer by layer on a resin printer. Lost-resin combines the precision of 3D printing with
        classic vacuum casting, delivering detail that is impossible to achieve by hand. This guide walks
        through the whole process, from CAD file to finished casting, with the actual parameters we use.
      </Lead>

      <H2 id="what-is">What is lost-resin and how it differs from lost-wax and lost-PLA</H2>
      <P>
        All three techniques, lost-wax, lost-PLA, and lost-resin, rely on the same principle: you create
        a pattern, surround it with investment plaster, burn out the pattern in a kiln (so it "disappears",
        hence <Strong>lost</Strong> in the name), and cast metal in its place. The difference lies in what
        the pattern is made from.
      </P>
      <Table
        headers={["Technique", "Pattern", "Precision", "Best for"]}
        rows={[
          ["Lost-wax", "Hand-carved or injected wax", "Depends on skill or mold", "Series from a single wax matrix"],
          ["Lost-PLA", "FDM print in PLA filament", "0.1-0.3 mm (layer)", "Simpler shapes, larger part prototypes"],
          ["Lost-resin", "MSLA print in castable resin", "0.025-0.05 mm (layer)", "Filigree, fine detail, openwork, one-off pieces"],
        ]}
      />
      <P>
        Lost-resin wins wherever detail matters: thin interwoven wires, micro-engravings, openwork
        patterns, organic relief. The printer's pixel size and layer height are an order of magnitude
        smaller than in FDM printing, so the pattern reproduces the digital model far more closely.
      </P>
      <P>
        In jewelry practice, that translates into a concrete business advantage. A designer who wants
        to sell one-off pieces or short runs doesn't need to hand-carve every pattern or invest in an
        injection wax mold, which only pays off from several dozen pieces upward. Lost-resin lets you
        print a single pattern the same day, refine the design in CAD, and print another version
        without extra tooling cost. That flexibility is exactly why the technique has become the
        standard in small jewelry workshops and design studios.
      </P>
      <P>
        One common misunderstanding is worth clearing up: lost-resin doesn't replace the jeweler, only
        the pattern-making stage. Casting, finishing, stone setting, and final polishing remain a craft
        that demands experience. Resin printing simply gives the jeweler a tool that turns a digital
        design into a mold-ready pattern in a few hours, instead of days of hand work in wax.
      </P>

      <H2 id="equipment">Equipment: printer and washer</H2>
      <P>
        We print jewelry patterns on an <Strong>Elegoo Saturn 4 Ultra 16K</Strong>. Its key parameters
        translate directly into pattern quality:
      </P>
      <UL>
        <LI><Strong>16K screen</Strong> at 16384x9216 px resolution with a 14x19 µm pixel size, the foundation of micro-detail reproduction.</LI>
        <LI><Strong>Heated vat (30°C)</Strong> stabilizes resin viscosity so each layer cures evenly regardless of room temperature.</LI>
        <LI><Strong>Tilt Release</Strong> reduces shear forces when peeling a layer off the FEP film, important for delicate filigree geometries that crack easily.</LI>
        <LI><Strong>Build volume</Strong> of 218x123x250 mm, though for jewelry we typically use a small fraction of it for a batch of several patterns at once.</LI>
      </UL>
      <P>
        After printing, the pattern goes into an <Strong>Elegoo Mercury Plus V3.0</Strong>, a wash and cure
        station with 360-degree rotation. Washing happens in 99.9% IPA in two stages, coarse then fine,
        followed by compressed-air drying and 2-4 minutes of UV curing. Only after full curing do we remove
        the supports, using jewelry tweezers so the geometry isn't distorted.
      </P>
      <P>
        This order matters. Removing supports before full UV curing is one of the most common beginner
        mistakes, right after the IPA wash the resin is still soft and pliable, so any mechanical
        handling at this stage risks bending thin elements or snapping off detail. Only full curing
        gives the pattern rigidity close to hard jewelry wax, sufficient to survive investing and
        transport to the kiln safely.
      </P>

      <H2 id="resins">Castable resins: which to choose</H2>
      <P>
        Not every resin is suitable for casting. Standard prototype or miniature resins leave ash after
        burnout that destroys the investment mold. For jewelry patterns we use two castable resins from
        BlueCast:
      </P>
      <Table
        headers={["Resin", "Wax content", "When to use"]}
        rows={[
          ["BlueCast X-Wax Filigree", "&gt;80% wax", "Filigree, stems, detail from 0.2 mm, openwork and delicate elements"],
          ["BlueCast X-One V2", "Zero shrinkage", "Shanks, crowns, massive elements where stable geometry without distortion matters"],
        ]}
      />
      <P>
        <Strong>In practice:</Strong> for a delicate weave, openwork pattern, or very thin elements, we
        reach for X-Wax Filigree, its high wax content burns out cleaner and reproduces details down to
        0.2 mm. For a massive ring, signet, or stone crown, X-One V2 is the better choice thanks to zero
        shrinkage, keeping geometry stable from printing all the way through burnout.
      </P>

      <H2 id="workflow">Step-by-step workflow</H2>
      <OL>
        <LI>
          <Strong>CAD design with shrinkage compensation.</Strong> The 3D model is scaled up in advance so
          that once the metal shrinks during solidification, the final dimension matches the design.
          The coefficients we use: Au 585 (14K) x1.0196, Ag 925 x1.016, Au 9K x1.021, Au 18K x1.018.
        </LI>
        <LI>
          <Strong>Printing on the Saturn 4 Ultra 16K.</Strong> Layer height of 0.05 mm for most patterns,
          0.03 mm for the finest details. Exposure settings follow the official BlueCast profiles for
          Chitubox.
        </LI>
        <LI>
          <Strong>IPA wash.</Strong> Drip-off from the platform 3-5 min, wash in the Mercury Plus 3-5 min
          (two stages), compressed-air drying 5-10 min.
        </LI>
        <LI>
          <Strong>UV curing.</Strong> 2-4 minutes in the Mercury Plus, only then is the pattern removed
          from the platform and supports trimmed.
        </LI>
        <LI>
          <Strong>Sprue and investment prep.</Strong> The pattern is attached to a main sprue; for
          vacuum-assist casting we use a 2.0-2.5 mm diameter (starting at 2.2 mm). Dedicated vents are
          usually unnecessary since Omni-II plaster vents air through its own porosity.
        </LI>
        <LI>
          <Strong>Investing in Omni-II plaster.</Strong> Ratio 40:100 water to powder, flask fill of
          480-610 g, minimum 15-20 mm of plaster above the pattern's crown to prevent collapse under
          vacuum.
        </LI>
        <LI>
          <Strong>Burnout.</Strong> The flask goes into a burnout kiln (up to 1200°C), where the wax and
          castable resin burn out without leaving harmful ash, leaving a precise cavity in the shape of
          the pattern.
        </LI>
        <LI>
          <Strong>Vacuum casting.</Strong> Metal (e.g. Au 585 at around 1000°C, flask around 600°C) is
          pulled by vacuum into the cavity, giving better fill of thin details and lower porosity than
          gravity casting.
        </LI>
        <LI>
          <Strong>Finishing.</Strong> Breaking out the investment plaster, cutting off the sprue, sanding,
          polishing, and final quality control of the casting.
        </LI>
      </OL>
      <P>
        It's worth explaining why vacuum casting, rather than gravity casting, is the default choice
        here. In gravity casting, metal flows into the cavity under its own weight, which is often
        insufficient for the thin, openwork channels left by lost-resin patterns, the molten metal
        solidifies before filling the finest details. Vacuum-assist actively pulls metal deep into the
        mold, so even details in the 0.2-0.3 mm range fill correctly, and the finished casting has fewer
        pores and needs fewer corrections at the finishing stage.
      </P>
      <P>
        The whole cycle, from a finished CAD file to a casting ready for finishing, usually fits into
        one business day. The pattern itself prints in 2-4 hours, washing and curing take another
        fifteen minutes or so, and investing, burnout, and vacuum casting typically form a single kiln
        cycle. A pattern costs roughly PLN 90-180 on its own, depending on size and geometry complexity,
        which for a single piece of jewelry is a fraction of what building an injection wax mold would
        cost.
      </P>

      <H2 id="limitations">Limitations and common mistakes</H2>
      <UL>
        <LI><Strong>Poor burnout</Strong> - too fast a heating ramp or too little time at peak temperature leaves ash in the plaster, blocking metal fill and ruining the casting.</LI>
        <LI><Strong>Walls too thin</Strong> - below a given resin's detail limit (0.2 mm for X-Wax Filigree), an element may fail to print or crack when removed from the platform.</LI>
        <LI><Strong>No shrinkage compensation</Strong> - a design that ignores the metal's shrinkage coefficient results in a casting smaller than intended, especially noticeable on precisely sized rings.</LI>
        <LI><Strong>Wrong resin for the job</Strong> - using X-One V2 for filigree, or X-Wax Filigree for a massive signet ring, gives worse results than matching the resin to the geometry.</LI>
        <LI><Strong>Sprue diameter too small or misjudged</Strong> - under 2.0 mm with vacuum-assist, metal doesn't fill the mold before it starts solidifying, while an oversized sprue increases turbulence and porosity risk at the joint with the casting.</LI>
      </UL>
      <P>
        Some of these mistakes only surface after burnout, when correction is no longer possible, which
        is why control at earlier stages is critical: visually inspecting the pattern after UV curing,
        checking the thinnest elements' wall thickness in CAD before printing, and consistently using
        the same burnout profile for a given investment plaster.
      </P>
      <P>
        It's also good practice to keep a simple print log: resin, layer height, exposure time, and
        burnout result for every pattern. When working with several castable resins at once it's easy
        to mix up an exposure profile, and reproducing settings that already worked is far faster than
        recalibrating from scratch every time.
      </P>

      <H2 id="when-outsource">When to outsource instead of doing it yourself</H2>
      <P>
        Lost-resin requires a precision resin printer, knowledge of metal shrinkage compensation, a
        burnout kiln with temperature profile control, and a vacuum casting machine, all at once. For a
        single pattern or a concept test, that's a large equipment investment. If you're designing a
        jewelry collection and need repeatable, precise castings, commissioning the pattern and casting
        from a specialist is usually cheaper and faster than building your own production line.
      </P>
      <P>
        At AEJaCA sTuDiO, we keep this whole chain, from the CAD file, through printing and investing,
        to vacuum casting and finishing, under one roof. For jewelry designers and B2B brands that means
        a single point of contact instead of coordinating a modeling studio, a print shop, and a foundry
        separately, and for individual makers, a one-off pattern without buying equipment worth several
        thousand euros.
      </P>
      <Callout accent="blue" title="Tip">
        See ready castable pattern examples and B2B collaboration options, or get an approximate price
        in the sTuDiO calculator.
        <br /><A href="/studio#calculator">Check the sTuDiO calculator →</A>
      </Callout>

      <CTABox
        accent="blue"
        title="Order a lost-resin pattern"
        text="Send a CAD file or describe your jewelry project, we'll quote the pattern and casting within 24h."
        href="/b2b/"
        cta="See B2B offer"
      />
    </>
  );
}

// ======================= DE =======================
function BodyDE() {
  return (
    <>
      <Lead>
        Hinter jedem Schmuckguss steht ein Modell. Früher von Hand aus Wachs geschnitzt, heute immer
        häufiger Schicht für Schicht auf einem Harzdrucker gedruckt. Lost-Resin verbindet die Präzision
        des 3D-Drucks mit klassischem Vakuumguss und liefert Details, die von Hand nicht erreichbar sind.
        Dieser Leitfaden zeigt den gesamten Prozess, von der CAD-Datei bis zum fertigen Guss, mit den
        Parametern, die wir tatsächlich verwenden.
      </Lead>

      <H2 id="was-ist">Was ist Lost-Resin und wie unterscheidet es sich von Lost-Wax und Lost-PLA</H2>
      <P>
        Alle drei Techniken, Lost-Wax, Lost-PLA und Lost-Resin, beruhen auf demselben Prinzip: Sie
        erstellen ein Modell, umgeben es mit Einbettmasse, brennen das Modell im Ofen aus (es
        &bdquo;verschwindet&ldquo;, daher <Strong>lost</Strong> im Namen) und gießen an seiner Stelle
        Metall. Der Unterschied liegt darin, woraus das Modell besteht.
      </P>
      <Table
        headers={["Technik", "Modell", "Präzision", "Am besten für"]}
        rows={[
          ["Lost-Wax", "Handgeschnitztes oder gespritztes Wachs", "Abhängig von Können oder Form", "Serien aus einer Wachs-Matrize"],
          ["Lost-PLA", "FDM-Druck aus PLA-Filament", "0,1-0,3 mm (Schicht)", "Einfachere Formen, größere Bauteilprototypen"],
          ["Lost-Resin", "MSLA-Druck aus gießbarem Harz", "0,025-0,05 mm (Schicht)", "Filigran, feine Details, Durchbrucharbeiten, Unikate"],
        ]}
      />
      <P>
        Lost-Resin gewinnt überall dort, wo Detail zählt: dünne verflochtene Drähte, Mikrogravuren,
        durchbrochene Muster, organisches Relief. Pixelgröße und Schichthöhe des Druckers sind eine
        Größenordnung kleiner als beim FDM-Druck, sodass das Modell dem digitalen Entwurf deutlich
        näher kommt.
      </P>
      <P>
        In der Schmuckpraxis hat das einen konkreten geschäftlichen Nutzen. Ein Designer, der Unikate
        oder kleine Serien verkaufen möchte, muss nicht jedes Modell von Hand schnitzen oder in eine
        Wachsspritzform investieren, die sich erst ab mehreren Dutzend Stück rechnet. Lost-Resin erlaubt
        es, noch am selben Tag ein einzelnes Modell zu drucken, den Entwurf im CAD zu verbessern und
        eine weitere Version ohne zusätzliche Werkzeugkosten zu drucken. Genau diese Flexibilität hat
        die Technik zum Standard in kleinen Schmuckwerkstätten und Designstudios gemacht.
      </P>
      <P>
        Ein häufiges Missverständnis sei geklärt: Lost-Resin ersetzt nicht den Goldschmied, sondern nur
        die Modellierungsphase. Guss, Nachbearbeitung, Steinfassung und finales Polieren bleiben ein
        Handwerk, das Erfahrung erfordert. Der Harzdruck gibt dem Goldschmied lediglich ein Werkzeug an
        die Hand, das einen digitalen Entwurf in wenigen Stunden in ein einbettfertiges Modell verwandelt,
        statt tagelanger Handarbeit in Wachs.
      </P>

      <H2 id="ausruestung">Ausrüstung: Drucker und Wäsche</H2>
      <P>
        Schmuckmodelle drucken wir auf einem <Strong>Elegoo Saturn 4 Ultra 16K</Strong>. Die wichtigsten
        Parameter dieses Druckers wirken sich direkt auf die Modellqualität aus:
      </P>
      <UL>
        <LI><Strong>16K-Display</Strong> mit 16384×9216 px Auflösung und 14×19 µm Pixelgröße, die Grundlage für die Wiedergabe von Mikrodetails.</LI>
        <LI><Strong>Beheizte Wanne (30°C)</Strong> stabilisiert die Harzviskosität, sodass jede Schicht unabhängig von der Raumtemperatur gleichmäßig aushärtet.</LI>
        <LI><Strong>Tilt Release</Strong> reduziert Scherkräfte beim Ablösen der Schicht von der Folie, wichtig bei empfindlichen filigranen Geometrien, die leicht reißen.</LI>
        <LI><Strong>Bauraum</Strong> von 218×123×250 mm, für Schmuck nutzen wir davon meist nur einen kleinen Teil für mehrere Modelle in einem Druck.</LI>
      </UL>
      <P>
        Nach dem Druck kommt das Modell in eine <Strong>Elegoo Mercury Plus V3.0</Strong>, eine
        Wasch- und Härtestation mit 360-Grad-Rotation. Gewaschen wird in 99,9%igem IPA in zwei Stufen,
        grob und fein, danach folgen Trocknen mit Druckluft und 2-4 Minuten UV-Härtung. Erst nach
        vollständiger Härtung werden die Stützen entfernt, mit Schmuckpinzetten, damit die Geometrie
        nicht verzogen wird.
      </P>
      <P>
        Diese Reihenfolge ist kein Zufall. Das Entfernen der Stützen vor vollständiger UV-Härtung ist
        einer der häufigsten Anfängerfehler, direkt nach dem IPA-Waschen ist das Harz noch weich und
        formbar, sodass jeder mechanische Eingriff in diesem Stadium riskiert, dünne Elemente zu
        verbiegen oder Details abzureißen. Erst die vollständige Härtung verleiht dem Modell eine
        Steifigkeit ähnlich hartem Schmuckwachs, ausreichend, um Einbetten und Transport zum Ofen sicher
        zu überstehen.
      </P>

      <H2 id="harze">Castable-Harze: welches wählen</H2>
      <P>
        Nicht jedes Harz eignet sich zum Gießen. Standardharze für Prototypen oder Miniaturen hinterlassen
        nach dem Ausbrennen Asche, die die Einbettmasse zerstört. Für Schmuckmodelle verwenden wir zwei
        Castable-Harze von BlueCast:
      </P>
      <Table
        headers={["Harz", "Wachsanteil", "Wann einsetzen"]}
        rows={[
          ["BlueCast X-Wax Filigree", "&gt;80% Wachs", "Filigran, Ranken, Detail ab 0,2 mm, durchbrochene und zarte Elemente"],
          ["BlueCast X-One V2", "Null Schrumpfung", "Schienen, Kronen, massive Elemente, bei denen stabile Geometrie ohne Verformung zählt"],
        ]}
      />
      <P>
        <Strong>In der Praxis:</Strong> Bei einem zarten Geflecht, durchbrochenem Muster oder sehr dünnen
        Elementen greifen wir zu X-Wax Filigree, sein hoher Wachsanteil brennt sauberer aus und bildet
        Details ab 0,2 mm ab. Bei einem massiven Ring, Siegelring oder einer Steinkrone ist X-One V2 dank
        Nullschrumpfung die bessere Wahl, die Geometrie bleibt vom Druck bis zum Ausbrennen stabil.
      </P>

      <H2 id="workflow">Workflow Schritt für Schritt</H2>
      <OL>
        <LI>
          <Strong>CAD-Design mit Schrumpfungskompensation.</Strong> Das 3D-Modell wird vorab hochskaliert,
          damit nach dem Schrumpfen des Metalls während der Erstarrung das Endmaß dem Entwurf entspricht.
          Verwendete Faktoren: Au 585 (14K) x1,0196, Ag 925 x1,016, Au 9K x1,021, Au 18K x1,018.
        </LI>
        <LI>
          <Strong>Druck auf dem Saturn 4 Ultra 16K.</Strong> Schichthöhe 0,05 mm für die meisten Modelle,
          0,03 mm bei feinsten Details. Belichtungseinstellungen nach den offiziellen BlueCast-Profilen
          für Chitubox.
        </LI>
        <LI>
          <Strong>IPA-Wäsche.</Strong> Abtropfen von der Plattform 3-5 Min, Waschen im Mercury Plus 3-5 Min
          (zweistufig), Trocknen mit Druckluft 5-10 Min.
        </LI>
        <LI>
          <Strong>UV-Härtung.</Strong> 2-4 Minuten im Mercury Plus, erst danach werden Plattform-Entnahme
          und Stützenentfernung durchgeführt.
        </LI>
        <LI>
          <Strong>Anguss und Einbettvorbereitung.</Strong> Das Modell wird an einen Hauptanguss montiert;
          beim Vacuum-Assist-Guss verwenden wir 2,0-2,5 mm Durchmesser (Start: 2,2 mm). Separate Entlüftungen
          sind meist überflüssig, da die Omni-II-Masse Luft über ihre eigene Porosität ableitet.
        </LI>
        <LI>
          <Strong>Einbetten in Omni-II-Masse.</Strong> Verhältnis 40:100 Wasser zu Pulver, Kolbenfüllung
          480-610 g, mindestens 15-20 mm Masse über der Modellkrone, um ein Einstürzen unter Vakuum zu
          verhindern.
        </LI>
        <LI>
          <Strong>Ausbrennen.</Strong> Der Muffel kommt in den Ausbrennofen (bis 1200°C), wo Wachs und
          Castable-Harz rückstandsfrei ausbrennen und eine präzise Hohlform in der Gestalt des Modells
          hinterlassen.
        </LI>
        <LI>
          <Strong>Vakuumguss.</Strong> Metall (z.B. Au 585 bei ca. 1000°C, Muffel ca. 600°C) wird per
          Vakuum in die Hohlform gezogen, was eine bessere Füllung feiner Details und geringere Porosität
          als Schwerkraftguss ergibt.
        </LI>
        <LI>
          <Strong>Nachbearbeitung.</Strong> Ausschlagen der Einbettmasse, Abtrennen des Angusses, Schleifen,
          Polieren und finale Qualitätskontrolle des Gusses.
        </LI>
      </OL>
      <P>
        Es lohnt sich zu erklären, warum hier standardmäßig Vakuumguss statt Schwerkraftguss zum
        Einsatz kommt. Beim Schwerkraftguss fließt das Metall allein durch sein Eigengewicht in die
        Hohlform, was bei den dünnen, durchbrochenen Kanälen von Lost-Resin-Modellen oft nicht
        ausreicht, das geschmolzene Metall erstarrt, bevor es die feinsten Details ausfüllt. Vacuum-Assist
        zieht das Metall aktiv tief in die Form, sodass selbst Details im Bereich 0,2-0,3 mm korrekt
        ausgefüllt werden und der fertige Guss weniger Poren aufweist und weniger Nacharbeit erfordert.
      </P>
      <P>
        Der gesamte Zyklus, von der fertigen CAD-Datei bis zum nachbearbeitungsfertigen Guss, passt
        meist in einen Arbeitstag. Das Modell selbst wird in 2-4 Stunden gedruckt, Waschen und Härten
        nehmen weitere gut fünfzehn Minuten in Anspruch, und Einbetten, Ausbrennen und Vakuumguss bilden
        in der Regel einen einzigen Ofenzyklus. Ein Modell kostet für sich genommen etwa 90-180 PLN,
        abhängig von Größe und Geometriekomplexität, was für ein einzelnes Schmuckstück nur einen
        Bruchteil dessen ausmacht, was der Bau einer Wachsspritzform kosten würde.
      </P>

      <H2 id="grenzen">Grenzen und typische Fehler</H2>
      <UL>
        <LI><Strong>Fehlerhaftes Ausbrennen</Strong> - eine zu schnelle Aufheizrate oder zu kurze Zeit bei Höchsttemperatur hinterlässt Asche in der Masse, blockiert die Metallfüllung und ruiniert den Guss.</LI>
        <LI><Strong>Zu dünne Wände</Strong> - unterhalb der Detailgrenze eines Harzes (0,2 mm bei X-Wax Filigree) kann ein Element nicht gedruckt werden oder bricht beim Entnehmen von der Plattform.</LI>
        <LI><Strong>Fehlende Schrumpfungskompensation</Strong> - ein Entwurf ohne Berücksichtigung des Schrumpfungsfaktors des Metalls führt zu einem kleineren Guss als geplant, besonders spürbar bei präzise dimensionierten Ringen.</LI>
        <LI><Strong>Falsches Harz für die Aufgabe</Strong> - X-One V2 für Filigran oder X-Wax Filigree für einen massiven Siegelring liefert schlechtere Ergebnisse als die richtige Harzwahl für die jeweilige Geometrie.</LI>
        <LI><Strong>Zu kleiner oder falsch gewählter Angussdurchmesser</Strong> - unter 2,0 mm bei Vacuum-Assist füllt das Metall die Form nicht rechtzeitig, bevor es erstarrt, während ein zu großer Anguss das Risiko von Turbulenzen und Porosität an der Verbindungsstelle zum Guss erhöht.</LI>
      </UL>
      <P>
        Manche dieser Fehler zeigen sich erst nach dem Ausbrennen, wenn eine Korrektur nicht mehr
        möglich ist, daher ist die Kontrolle in früheren Phasen entscheidend: visuelle Prüfung des
        Modells nach der UV-Härtung, Kontrolle der Wandstärke der dünnsten Elemente im CAD vor dem
        Druck sowie die konsequente Verwendung desselben Ausbrennprofils für eine bestimmte
        Einbettmasse.
      </P>
      <P>
        Es ist auch eine gute Angewohnheit, ein einfaches Druckprotokoll zu führen: Harz, Schichthöhe,
        Belichtungszeit und Ausbrennergebnis für jedes Modell. Bei der Arbeit mit mehreren
        Castable-Harzen gleichzeitig verwechselt man leicht ein Belichtungsprofil, und bereits bewährte
        Einstellungen zu reproduzieren ist deutlich schneller, als jedes Mal von Grund auf neu zu
        kalibrieren.
      </P>

      <H2 id="wann-auslagern">Wann auslagern statt selbst machen</H2>
      <P>
        Lost-Resin erfordert gleichzeitig einen präzisen Harzdrucker, Wissen über die Schrumpfungskompensation
        von Metallen, einen Ausbrennofen mit Temperaturprofilsteuerung und eine Vakuumgussmaschine. Für ein
        einzelnes Modell oder einen Konzepttest ist das eine große Ausrüstungsinvestition. Wenn Sie eine
        Schmuckkollektion entwerfen und wiederholbare, präzise Güsse benötigen, ist die Beauftragung von
        Modell und Guss bei einem Spezialisten meist günstiger und schneller als der Aufbau einer eigenen
        Produktionslinie.
      </P>
      <P>
        Bei AEJaCA sTuDiO haben wir diese gesamte Kette, von der CAD-Datei über Druck und Einbetten bis
        zu Vakuumguss und Nachbearbeitung, unter einem Dach. Für Schmuckdesigner und B2B-Marken bedeutet
        das einen einzigen Ansprechpartner statt der Koordination von Modellwerkstatt, Druckerei und
        Gießerei einzeln, für individuelle Kreative ein einmaliges Modell ohne den Kauf von Ausrüstung
        im Wert mehrerer tausend Euro.
      </P>
      <Callout accent="blue" title="Tipp">
        Sehen Sie sich fertige Castable-Modellbeispiele und B2B-Kooperationsmöglichkeiten an, oder
        berechnen Sie einen ungefähren Preis im sTuDiO-Kalkulator.
        <br /><A href="/studio#calculator">sTuDiO-Kalkulator ansehen →</A>
      </Callout>

      <CTABox
        accent="blue"
        title="Lost-Resin-Modell bestellen"
        text="Senden Sie eine CAD-Datei oder beschreiben Sie Ihr Schmuckprojekt, wir kalkulieren Modell und Guss innerhalb von 24h."
        href="/b2b/"
        cta="B2B-Angebot ansehen"
      />
    </>
  );
}

export function Body({ lang }) {
  if (lang === "en") return <BodyEN />;
  if (lang === "de") return <BodyDE />;
  return <BodyPL />;
}
