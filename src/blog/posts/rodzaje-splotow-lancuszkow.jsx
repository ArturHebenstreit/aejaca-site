import { H2, H3, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "rodzaje-splotow-lancuszkow",
  category: "jewelry",
  accent: "amber",
  publishedAt: "2026-06-12",
  coverImage: "/img/blog/rodzaje-splotow-lancuszkow.png",
  readingTime: { pl: 10, en: 9, de: 9 },
  title: {
    pl: "Rodzaje splotów łańcuszków – 12 wzorów, które warto znać",
    en: "Chain Weave Types – 12 Patterns Every Jewelry Lover Should Know",
    de: "Kettenmuster – 12 Flechtarten, die jeder Schmuckliebhaber kennen sollte",
  },
  description: {
    pl: "Przewodnik po 12 rodzajach splotów łańcuszków: od klasycznego po bizantyjski. Dowiedz się, który splot wybrać i jak powstaje łańcuszek ręczny.",
    en: "Guide to 12 chain weave types: from classic cable to Byzantine. Learn which weave to choose and how handmade chains are crafted.",
    de: "Ratgeber zu 12 Kettenmusterarten: vom klassischen Kabelgeflecht bis zum Byzantiner. Welches Muster wählen und wie Handketten entstehen.",
  },
  keywords: {
    pl: "rodzaje splotów łańcuszków, splot łańcuszka, pancerka, bizmark, ankier, łańcuszek na zamówienie, ręcznie robiony łańcuszek, AEJaCA",
    en: "chain weave types, chain patterns, curb chain, Byzantine chain, anchor chain, custom chain, handmade chain, AEJaCA",
    de: "Kettenmuster, Kettenarten, Panzerkette, Byzantinerkette, Ankerkette, Kette nach Maß, handgemachte Kette, AEJaCA",
  },
  toc: {
    pl: [
      { id: "czym-jest-splot", label: "Czym jest splot?" },
      { id: "tabela", label: "Porównanie splotów" },
      { id: "klasyczne", label: "Sploty klasyczne" },
      { id: "ozdobne", label: "Sploty ozdobne" },
      { id: "masywne", label: "Sploty masywne" },
      { id: "jak-wybrac", label: "Jak wybrać splot?" },
    ],
    en: [
      { id: "what-is-weave", label: "What is a weave?" },
      { id: "table", label: "Weave comparison" },
      { id: "classic", label: "Classic weaves" },
      { id: "decorative", label: "Decorative weaves" },
      { id: "bold", label: "Bold weaves" },
      { id: "how-to-choose", label: "How to choose?" },
    ],
    de: [
      { id: "was-ist-ein-muster", label: "Was ist ein Kettenmuster?" },
      { id: "tabelle", label: "Mustervergleich" },
      { id: "klassisch", label: "Klassische Muster" },
      { id: "dekorativ", label: "Dekorative Muster" },
      { id: "massiv", label: "Massive Muster" },
      { id: "wie-waehlen", label: "Wie wählen?" },
    ],
  },
  faq: {
    pl: [
      {
        q: "Który splot łańcuszka jest najtrwalszy?",
        a: "Pancerka i kostka należą do najodporniejszych — spłaszczone lub kwadratowe ogniwa dobrze rozkładają naprężenia. Sploty okrągłe (ankier, rolo) są nieco bardziej podatne na rozciąganie, ale nadal solidne. Bizmark i bizantyjski, mimo złożoności, są zaskakująco wytrzymałe dzięki gęstemu przeplataniu.",
      },
      {
        q: "Jaki splot wybrać do wisiorka?",
        a: "Do delikatnych wisiorków i medalików idealnie pasuje klasyczny, ankier lub singapur — nie przyciągają uwagi, są dyskretnym tłem dla zawieszki. Do cięższych pendant'ów (powyżej 5g) lepsza będzie pancerka lub rolo. Sploty masywne (lisi ogon, kordel, bizmark) nosi się zazwyczaj solo — bez zawieszki.",
      },
      {
        q: "Czy łańcuszek ręcznie robiony różni się od fabrycznego?",
        a: "Tak, i to znacznie. W ręcznym wykonaniu każde ogniwo jest formowane i lutowane osobno — możemy swobodnie dobrać grubość drutu, szerokość, długość, a nawet mieszać sploty w jednym łańcuszku. Łańcuchy fabryczne wychodzą z walcarki w standardowych rozmiarach; ręczne to biżuteria na wymiar.",
      },
    ],
    en: [
      {
        q: "Which chain weave is the most durable?",
        a: "Curb (pancerka) and box (kostka) chains are among the most resistant — their flat or square links distribute stress well. Round-link chains (anchor, rolo) are slightly more prone to stretching but still solid. Bismark and Byzantine, despite their complexity, are surprisingly strong thanks to dense interlocking.",
      },
      {
        q: "Which weave should I choose for a pendant?",
        a: "For delicate pendants and medallions, classic, anchor, or Singapore chains work best — they are discreet backgrounds for the pendant. For heavier pendants (over 5g), curb or rolo are better choices. Bold weaves (foxtail, rope, Bismark) are usually worn solo — without any pendant.",
      },
      {
        q: "Does a handmade chain differ from a factory one?",
        a: "Yes, significantly. In handmade chains, each link is individually formed and soldered — we can freely adjust wire thickness, width, length, and even mix weave patterns in one chain. Factory chains come off a rolling mill in standard sizes; handmade ones are true custom jewelry.",
      },
    ],
    de: [
      {
        q: "Welches Kettenmuster ist am haltbarsten?",
        a: "Panzer- und Kastenketten gehören zu den widerstandsfähigsten — ihre flachen oder quadratischen Glieder verteilen Belastungen gut. Rundglieder (Anker, Rolo) sind etwas dehnungsanfälliger, aber immer noch solide. Bismark und Byzantiner sind trotz ihrer Komplexität durch die dichte Verflechtung überraschend stabil.",
      },
      {
        q: "Welches Muster wähle ich für einen Anhänger?",
        a: "Für zarte Anhänger und Medaillons eignen sich klassisches, Anker- oder Singapurmuster am besten — sie sind dezente Hintergründe für den Anhänger. Für schwerere Anhänger (über 5g) sind Panzer- oder Roloketten besser geeignet. Massive Muster (Fuchsschwanz, Kordel, Bismark) werden meist solo getragen — ohne Anhänger.",
      },
      {
        q: "Unterscheidet sich eine handgefertigte Kette von einer Fabrikware?",
        a: "Ja, erheblich. Bei handgefertigten Ketten wird jedes Glied einzeln geformt und gelötet — wir können Drahtdicke, Breite, Länge frei anpassen und sogar Muster innerhalb einer Kette kombinieren. Fabriketten kommen in Standardmaßen vom Walzwerk; handgefertigte sind echte Maßschmuckstücke.",
      },
    ],
  },
  relatedPosts: ["jak-dbac-o-bizuterie", "ile-kosztuje-bizuteria-na-zamowienie"],
};

export function Body({ lang }) {
  const t = (pl, en, de) => lang === "pl" ? pl : lang === "de" ? de : en;

  const WeaveImg = ({ id, name }) => (
    <div className="float-right ml-5 mb-3 w-24 sm:w-32 hidden sm:block">
      <img
        src={`/img/calc/weaves/${id}.webp`}
        alt={name}
        className="w-full rounded-xl shadow-lg border border-white/10"
        loading="lazy"
      />
      <p className="text-[10px] text-neutral-500 text-center mt-1">{name}</p>
    </div>
  );

  return (
    <>
      <Lead>{t(
        "Łańcuszek to nie tylko nić metalu łącząca zapięcie z zawieszką. To konstrukcja, która decyduje o tym, jak biżuteria się porusza, jak odbija światło, ile waży i ile kosztuje w wykonaniu. Splot jest w jubilerstwie tym, czym tkanina w krawiectwie — jedna zmiana wzoru zmienia wszystko.",
        "A chain is more than a metal thread connecting clasp to pendant. It's a structure that determines how jewelry moves, reflects light, weighs on the skin, and what it costs to craft. In jewelry making, the weave is what fabric is to tailoring — one pattern change changes everything.",
        "Eine Kette ist mehr als ein Metallfaden zwischen Verschluss und Anhänger. Sie ist eine Konstruktion, die bestimmt, wie sich Schmuck bewegt, wie er Licht reflektiert, wie viel er wiegt und was er in der Herstellung kostet. In der Goldschmiedekunst ist das Flechtmuster, was der Stoff in der Schneiderei ist — eine Musteränderung ändert alles."
      )}</Lead>

      <H2 id={t("czym-jest-splot", "what-is-weave", "was-ist-ein-muster")}>
        {t("Czym jest splot i dlaczego wpływa na cenę?", "What is a weave and why does it affect price?", "Was ist ein Kettenmuster und warum beeinflusst es den Preis?")}
      </H2>
      <P>{t(
        "Splot łańcuszka to sposób, w jaki ogniwa metalowe są ze sobą łączone. Każdy wzór niesie ze sobą konkretną charakterystykę techniczną, którą w jubilerstwie opisuje się tzw. współczynnikiem splotu — ile centymetrów drutu potrzeba, aby uzyskać jeden centymetr gotowego łańcuszka.",
        "A chain weave is the method by which metal links are joined together. Each pattern carries specific technical characteristics, described in jewelry making by the weave factor — how many centimeters of wire are needed to produce one centimeter of finished chain.",
        "Ein Kettenmuster ist die Art, wie Metallglieder miteinander verbunden werden. Jedes Muster trägt spezifische technische Eigenschaften, die in der Goldschmiedekunst durch den Flechtfaktor beschrieben werden — wie viele Zentimeter Draht benötigt werden, um einen Zentimeter fertige Kette zu erzeugen."
      )}</P>
      <P>{t(
        "Przykładowo: splot klasyczny ma współczynnik ×1,0 — 45 cm łańcuszka wymaga około 45 cm drutu. Splot bizantyjski osiąga ×3,2 — te same 45 cm finalnego wyrobu pochłania ponad 144 cm drutu i wielokrotnie więcej czasu pracy. To tłumaczy, dlaczego dwa łańcuszki tej samej długości i z tego samego metalu mogą różnić się ceną kilkukrotnie.",
        "For example: the classic weave has a factor of ×1.0 — a 45 cm chain requires about 45 cm of wire. The Byzantine weave reaches ×3.2 — the same 45 cm of finished piece consumes over 144 cm of wire and many times more labor. This explains why two chains of the same length and metal can differ several times in price.",
        "Zum Beispiel: das klassische Muster hat einen Faktor von ×1,0 — eine 45 cm Kette benötigt etwa 45 cm Draht. Das Byzantinermuster erreicht ×3,2 — dieselben 45 cm fertiges Stück verbraucht über 144 cm Draht und ein Vielfaches mehr Arbeitszeit. Das erklärt, warum zwei Ketten gleicher Länge und Metall im Preis um ein Vielfaches abweichen können."
      )}</P>
      <Callout accent="amber">{t(
        "W AEJaCA wszystkie łańcuszki wykonujemy ręcznie — każde ogniwo formowane i lutowane osobno. Dzięki temu możemy zrealizować dowolną długość, szerokość i splot w każdym metalu: srebro 925, złoto 9k–24k, platyna.",
        "At AEJaCA, all chains are made by hand — each link individually formed and soldered. This allows us to produce any length, width, and weave in any metal: silver 925, gold 9k–24k, platinum.",
        "Bei AEJaCA werden alle Ketten von Hand gefertigt — jedes Glied einzeln geformt und gelötet. Dadurch können wir jede Länge, Breite und Muster in jedem Metall realisieren: Silber 925, Gold 9k–24k, Platin."
      )}</Callout>

      <H2 id={t("tabela", "table", "tabelle")}>
        {t("Porównanie 12 splotów", "Comparison of 12 weaves", "Vergleich von 12 Mustern")}
      </H2>
      <Table
        headers={[
          t("Splot", "Weave", "Muster"),
          t("Styl", "Style", "Stil"),
          t("Materiał (×)", "Material (×)", "Material (×)"),
          t("Złożoność", "Complexity", "Komplexität"),
          t("Dla kogo", "For whom", "Für wen"),
        ]}
        rows={[
          [t("Klasyczny", "Classic", "Klassisch"), t("Minimalistyczny", "Minimalist", "Minimalistisch"), "×1.0", t("Prosta", "Simple", "Einfach"), t("Wszyscy", "Everyone", "Alle")],
          [t("Ankier", "Anchor", "Anker"), t("Klasyczny", "Classic", "Klassisch"), "×1.4", t("Prosta", "Simple", "Einfach"), t("Wszyscy", "Everyone", "Alle")],
          [t("Rolo", "Rolo", "Rolo"), t("Elegancki", "Elegant", "Elegant"), "×1.2", t("Prosta", "Simple", "Einfach"), t("Kobiety, dzieci", "Women, children", "Frauen, Kinder")],
          [t("Figaro", "Figaro", "Figaro"), t("Retro-włoski", "Retro-Italian", "Retro-Italienisch"), "×1.6", t("Umiarkowana", "Moderate", "Moderat"), t("Kobiety, mężczyźni", "Women, men", "Frauen, Männer")],
          [t("Pancerka", "Curb", "Panzer"), t("Solidny", "Solid", "Solide"), "×1.5", t("Umiarkowana", "Moderate", "Moderat"), t("Kobiety, mężczyźni", "Women, men", "Frauen, Männer")],
          [t("Kostka", "Box", "Kasten"), t("Geometryczny", "Geometric", "Geometrisch"), "×1.3", t("Umiarkowana", "Moderate", "Moderat"), t("Kobiety", "Women", "Frauen")],
          [t("Singapur", "Singapore", "Singapur"), t("Połyskliwy", "Sparkling", "Funkelnd"), "×1.8", t("Umiarkowana", "Moderate", "Moderat"), t("Kobiety, dzieci", "Women, children", "Frauen, Kinder")],
          [t("Gucci", "Gucci", "Gucci"), t("Wyrazisty", "Bold", "Ausdrucksstark"), "×1.5", t("Umiarkowana", "Moderate", "Moderat"), t("Kobiety, mężczyźni", "Women, men", "Frauen, Männer")],
          [t("Kordel (lina)", "Rope", "Kordel"), t("Efektowny", "Striking", "Eindrucksvoll"), "×2.5", t("Złożona", "Complex", "Komplex"), t("Kobiety, mężczyźni", "Women, men", "Frauen, Männer")],
          [t("Lisi ogon", "Foxtail", "Fuchsschwanz"), t("Luksusowy", "Luxurious", "Luxuriös"), "×2.8", t("Złożona", "Complex", "Komplex"), t("Kobiety", "Women", "Frauen")],
          [t("Bizmark", "Bismark", "Bismark"), t("Masywny", "Massive", "Massiv"), "×2.2", t("Złożona", "Complex", "Komplex"), t("Mężczyźni", "Men", "Männer")],
          [t("Bizantyjski", "Byzantine", "Byzantinisch"), t("Artystyczny", "Artistic", "Künstlerisch"), "×3.2", t("Luksusowa", "Luxury", "Luxuriös"), t("Kobiety, mężczyźni", "Women, men", "Frauen, Männer")],
        ]}
      />

      <H2 id={t("klasyczne", "classic", "klassisch")}>
        {t("Sploty klasyczne", "Classic weaves", "Klassische Muster")}
      </H2>
      <P>{t(
        "Sploty klasyczne to fundament jubilerstwa łańcuszkowego — proste w konstrukcji, niezawodne i pasujące do każdego stylu. Niski współczynnik materiałowy oznacza też umiarkowaną cenę, co czyni je idealnym wyborem do codziennej biżuterii.",
        "Classic weaves are the foundation of chain jewelry — simple in construction, reliable, and suitable for any style. A low material factor also means moderate pricing, making them ideal for everyday jewelry.",
        "Klassische Muster sind das Fundament der Kettenschmuckherstellung — einfach in der Konstruktion, zuverlässig und zu jedem Stil passend. Ein niedriger Materialfaktor bedeutet auch moderate Preise, was sie ideal für Alltagsschmuck macht."
      )}</P>

      <H3>{t("Klasyczny (kabel)", "Classic (cable)", "Klassisch (Kabel)")}</H3>
      <WeaveImg id="klasyczny" name={t("Klasyczny", "Classic", "Klassisch")} />
      <P>{t(
        "Najprostszy ze wszystkich splotów: jednakowe owalne ogniwa ustawione naprzemiennie w dwóch płaszczyznach. Lekki, płaski, świetnie leży na skórze. Współczynnik splotu ×1,0 oznacza minimalne zużycie materiału — to jednocześnie najlżejszy i najtańszy w wykonaniu łańcuszek przy danej długości.",
        "The simplest of all weaves: uniform oval links alternating in two planes. Light, flat, drapes beautifully on skin. A weave factor of ×1.0 means minimal material use — simultaneously the lightest and most affordable chain to produce for a given length.",
        "Das einfachste aller Muster: gleichförmige ovale Glieder, abwechselnd in zwei Ebenen angeordnet. Leicht, flach, liegt herrlich auf der Haut. Ein Flechtfaktor von ×1,0 bedeutet minimalen Materialverbrauch — gleichzeitig die leichteste und günstigste Kette für eine gegebene Länge."
      )}</P>
      <P>{t(
        "Doskonały jako baza dla każdej zawieszki, od delikatnych dziecięcych medalików po masywne wisiorki. Sprawdza się też solo w wersji wielowarstwowej (kilka łańcuszków naraz). Polecany do pierwszej biżuterii srebrnej lub złotej — niezniszczalny klasyk.",
        "Excellent as a base for any pendant, from delicate children's medallions to bold statement pieces. Works beautifully solo in layered styling (multiple chains at once). Recommended as first silver or gold jewelry — an indestructible classic.",
        "Hervorragend als Basis für jeden Anhänger, von zarten Kindermedaillons bis zu kräftigen Statement-Stücken. Funktioniert auch solo im Layering-Look. Empfohlen als erste Silber- oder Goldkette — ein unzerstörbarer Klassiker."
      )}</P>
      <div className="clear-both" />

      <H3>{t("Ankier", "Anchor", "Anker")}</H3>
      <WeaveImg id="ankier" name={t("Ankier", "Anchor", "Anker")} />
      <P>{t(
        "Splot ankier różni się od klasycznego wydłużonymi ogniwami ustawionymi pionowo względem poziomych łączników — wzór przypomina morski łańcuch kotwiczny. Współczynnik ×1,4 przekłada się na nieco wyższą masę niż klasyczny, co daje przyjemne poczucie obecności na szyi bez nadwagi.",
        "The anchor weave differs from classic by elongated links set vertically against horizontal connectors — the pattern resembles a nautical anchor chain. The ×1.4 factor translates to slightly higher mass than classic, giving a pleasant presence on the neck without bulk.",
        "Das Ankermuster unterscheidet sich vom klassischen durch verlängerte Glieder, die vertikal gegenüber horizontalen Verbindern angeordnet sind — das Muster erinnert an eine maritime Ankerkette. Der Faktor ×1,4 führt zu etwas höherer Masse als klassisch, was ein angenehmes Gewichtsgefühl am Hals ohne Überlast ergibt."
      )}</P>
      <P>{t(
        "Jeden z najpopularniejszych splotów we wszystkich grupach wiekowych i płciach. Szczególnie ceniony jako łańcuszek do dewocjonaliów i medalionów — wystarczająco solidny, by utrzymać wisiorek, a jednocześnie dyskretny.",
        "One of the most popular weaves across all age groups and genders. Particularly valued as a chain for religious medals and medallions — solid enough to hold a pendant while remaining understated.",
        "Eines der beliebtesten Muster in allen Altersgruppen und Geschlechtern. Besonders geschätzt als Kette für Devotionalien und Medaillons — solide genug, um einen Anhänger zu tragen, und dennoch dezent."
      )}</P>
      <div className="clear-both" />

      <H3>{t("Rolo", "Rolo / Belcher", "Rolo / Belcher")}</H3>
      <WeaveImg id="rolo" name="Rolo" />
      <P>{t(
        "Ogniwa rolo są okrągłe i wyraźnie grubsze od klasycznych — każde z nich to niemal idealne kółko. Splot wygląda solidnie, ale dzięki okrągłym przekrojom ogniw odbija światło miękko i równomiernie. Współczynnik ×1,2 sprawia, że jest lżejszy, niż wygląda.",
        "Rolo links are round and noticeably thicker than classic ones — each is almost a perfect circle. The weave looks substantial but thanks to the round link cross-sections, it reflects light softly and evenly. The ×1.2 factor means it's lighter than it looks.",
        "Rolo-Glieder sind rund und deutlich dicker als klassische — jedes ist fast ein perfekter Kreis. Das Muster wirkt massiv, aber dank der runden Querschnitte der Glieder reflektiert es Licht weich und gleichmäßig. Der Faktor ×1,2 bedeutet, dass es leichter ist, als es aussieht."
      )}</P>
      <P>{t(
        "Popularny wśród dzieci ze względu na wygodne, gładkie ogniwa bez ostrych krawędzi. U dorosłych noszony zarówno solo, jak i do zawiszek — grubsze wersje sprawdzają się przy cięższych wisiorach.",
        "Popular among children due to comfortable, smooth links with no sharp edges. Among adults, worn both solo and with pendants — thicker versions work well with heavier pendant pieces.",
        "Beliebt bei Kindern wegen der angenehmen, glatten Glieder ohne scharfe Kanten. Bei Erwachsenen sowohl solo als auch mit Anhängern getragen — dickere Versionen eignen sich gut für schwerere Anhänger."
      )}</P>
      <div className="clear-both" />

      <H3>{t("Figaro", "Figaro", "Figaro")}</H3>
      <WeaveImg id="figaro" name="Figaro" />
      <P>{t(
        "Włoski splot z charakterystycznym rytmem: trzy małe okrągłe ogniwa, jedno duże podłużne. Wzór powtarza się regularnie na całej długości. Współczynnik ×1,6 wynika z konieczności precyzyjnego doboru proporcji każdego rodzaju ogniw.",
        "An Italian weave with a characteristic rhythm: three small round links, one large elongated one. The pattern repeats regularly along the entire length. The ×1.6 factor stems from the need for precise proportioning of each link type.",
        "Ein italienisches Muster mit charakteristischem Rhythmus: drei kleine runde Glieder, ein großes längliches. Das Muster wiederholt sich gleichmäßig über die gesamte Länge. Der Faktor ×1,6 ergibt sich aus der notwendigen präzisen Proportionierung jeder Gliedart."
      )}</P>
      <P>{t(
        "Splot z charakterem — nieco retro, a jednocześnie ponadczasowy. W cienkich wersjach noszony przez kobiety, w grubszych bardzo chętnie przez mężczyzn. Świetny jako łańcuszek do medalika lub krzyżyka — wyrazisty bez bycia nachalnym.",
        "A weave with character — slightly retro, yet timeless. In thin versions worn by women, in thicker versions very popular with men. Excellent as a chain for a medal or cross — distinctive without being overbearing.",
        "Ein Muster mit Charakter — etwas retro und dennoch zeitlos. In dünnen Versionen von Frauen getragen, in dickeren sehr beliebt bei Männern. Hervorragend als Kette für Medaille oder Kreuz — ausdrucksstark ohne aufdringlich zu sein."
      )}</P>
      <div className="clear-both" />

      <H2 id={t("ozdobne", "decorative", "dekorativ")}>
        {t("Sploty ozdobne i dekoracyjne", "Decorative weaves", "Dekorative Muster")}
      </H2>
      <P>{t(
        "Sploty ozdobne oferują silniejszy wyraz wizualny — często poprzez fakturę, połysk lub geometrię ogniw. Sprawdzają się zarówno solo, jak i jako tło dla efektownej zawieszki.",
        "Decorative weaves offer stronger visual expression — often through texture, sparkle, or link geometry. They work equally well solo and as a backdrop for a statement pendant.",
        "Dekorative Muster bieten stärkeren visuellen Ausdruck — oft durch Textur, Glanz oder Gliedgeometrie. Sie funktionieren sowohl solo als auch als Hintergrund für einen auffälligen Anhänger."
      )}</P>

      <H3>{t("Pancerka (Curb)", "Curb (Pancerz)", "Panzer (Curb)")}</H3>
      <WeaveImg id="pancerz" name={t("Pancerka", "Curb", "Panzer")} />
      <P>{t(
        "Pancerka to splot ze spłaszczonymi, skręconymi ogniwami leżącymi płasko na skórze. Charakterystyczne połyskujące, lustrowane krawędzie każdego ogniwa tworzą niemal gładką taśmę metalu. Współczynnik ×1,5 plus odpad ~9% — to łańcuszek wymagający precyzji przy formowaniu każdego ogniwa.",
        "The curb chain features flat, twisted links that lie flush against skin. The characteristic mirror-polished edges of each link create an almost smooth metal ribbon. Factor ×1.5 plus ~9% waste — a chain requiring precision when forming each individual link.",
        "Die Panzerkette hat flache, gedrehte Glieder, die flach auf der Haut aufliegen. Die charakteristischen hochglanzpolierten Kanten jedes Glieds erzeugen ein fast glattes Metallband. Faktor ×1,5 plus ~9% Abfall — eine Kette, die Präzision bei der Formung jedes einzelnen Glieds erfordert."
      )}</P>
      <P>{t(
        "Jeden z najbardziej wytrzymałych splotów — spłaszczone ogniwa są mniej podatne na skręcanie i deformację. Dostępna w szerokościach od 2 mm (damska) do ponad 10 mm (masywna męska). Grube wersje to absolutny must-have męskiej biżuterii.",
        "One of the most durable weaves — flat links are less prone to twisting and deformation. Available in widths from 2mm (feminine) to over 10mm (bold masculine). Thick versions are an absolute must-have in men's jewelry.",
        "Eines der haltbarsten Muster — flache Glieder sind weniger anfällig für Verdrehen und Verformung. Erhältlich in Breiten von 2mm (weiblich) bis über 10mm (massiv männlich). Dicke Versionen sind ein absolutes Must-have in der Herrenschmuck."
      )}</P>
      <div className="clear-both" />

      <H3>{t("Kostka (Box)", "Box chain", "Kastenkette")}</H3>
      <WeaveImg id="kostka" name={t("Kostka", "Box", "Kasten")} />
      <P>{t(
        "Splot kostkowy składa się z kwadratowych lub prostokątnych ogniw połączonych prostopadle — w przekroju wyglądają jak sześcian. Efekt końcowy jest geometryczny i nowoczesny, a łańcuszek leży płasko jak taśma. Współczynnik ×1,3 zapewnia rozsądną wagę.",
        "The box weave consists of square or rectangular links connected perpendicularly — in cross-section they look like a cube. The result is geometric and modern, with the chain lying flat like a ribbon. The ×1.3 factor ensures reasonable weight.",
        "Das Kastenmuster besteht aus quadratischen oder rechteckigen Gliedern, die rechtwinklig verbunden sind — im Querschnitt sehen sie wie ein Würfel aus. Das Ergebnis ist geometrisch und modern, die Kette liegt flach wie ein Band. Der Faktor ×1,3 sorgt für vernünftiges Gewicht."
      )}</P>
      <P>{t(
        "Kostka to splot lubiany przez minimalistów — brak widocznych łączników daje wrażenie jednolitego paska metalu. Szczególnie elegancka w złocie 18k lub platynie. Polecana jako naszyjnik solo lub podstawa pod jeden wyrazisty wisior.",
        "Box chain is favored by minimalists — the absence of visible connectors gives the impression of a uniform metal strip. Particularly elegant in 18k gold or platinum. Recommended as a solo necklace or base for a single statement pendant.",
        "Kastenkette ist bei Minimalisten beliebt — das Fehlen sichtbarer Verbinder erweckt den Eindruck eines einheitlichen Metallstreifens. Besonders elegant in 18k Gold oder Platin. Empfohlen als Solo-Kette oder Basis für einen einzelnen Statement-Anhänger."
      )}</P>
      <div className="clear-both" />

      <H3>{t("Singapur", "Singapore", "Singapur")}</H3>
      <WeaveImg id="singapur" name={t("Singapur", "Singapore", "Singapur")} />
      <P>{t(
        "Splot singapur to przekręcony łańcuch ankierowy — każde ogniwo jest nieznacznie skręcone względem sąsiednich, co powoduje, że łańcuszek mieni się i iskrzy przy każdym ruchu. Współczynnik ×1,8 plus 12% odpadu wynikają ze złożoności wykończenia każdego skrętu.",
        "The Singapore weave is a twisted anchor chain — each link is slightly rotated relative to its neighbors, causing the chain to shimmer and sparkle with every movement. Factor ×1.8 plus 12% waste result from the complexity of finishing each twist.",
        "Das Singapurmuster ist eine gedrehte Ankerkette — jedes Glied ist leicht gegenüber seinen Nachbarn verdreht, wodurch die Kette bei jeder Bewegung schimmert und funkelt. Faktor ×1,8 plus 12% Abfall ergeben sich aus der Komplexität der Veredelung jeder Drehung."
      )}</P>
      <P>{t(
        "Kobiece i zmysłowe — gra świateł na skręconych krawędziach sprawia, że nawet cienki łańcuszek wygląda bogato. Chętnie wybierany dla dzieci ze względu na lekką, miękką strukturę. W srebrze 925 daje wyjątkowy efekt brokatu.",
        "Feminine and sensual — the interplay of light on twisted edges makes even a thin chain look rich. Frequently chosen for children due to its light, flexible structure. In silver 925 it produces an exceptional glitter effect.",
        "Feminin und sinnlich — das Lichtspiel an den gedrehten Kanten lässt selbst eine dünne Kette reichhaltig erscheinen. Häufig für Kinder gewählt wegen der leichten, flexiblen Struktur. In Silber 925 erzeugt es einen außergewöhnlichen Glitzereffekt."
      )}</P>
      <div className="clear-both" />

      <H3>{t("Gucci (marina)", "Gucci link (marina)", "Gucci (Marina)")}</H3>
      <WeaveImg id="gucci" name="Gucci" />
      <P>{t(
        "Splot gucci — znany też jako marina lub kotwica morska — składa się z owalnych ogniw, przez środek każdego z nich przechodzi pozioma poprzeczka. Efekt przypomina litery \"H\" połączone w łańcuch. Współczynnik ×1,5 sprawia, że jest podobnie ekonomiczny co pancerka, ale wizualnie bardziej oryginalny.",
        "The Gucci link — also known as marina or marine anchor — consists of oval links with a horizontal bar through the center of each. The effect resembles \"H\" letters linked together. Factor ×1.5 makes it similarly economical to curb chain, but visually more distinctive.",
        "Das Gucci-Glied — auch bekannt als Marina oder Marineanker — besteht aus ovalen Gliedern, durch deren Mitte jeweils ein horizontaler Steg verläuft. Der Effekt ähnelt miteinander verbundenen \"H\"-Buchstaben. Faktor ×1,5 macht es ähnlich wirtschaftlich wie die Panzerkette, aber optisch eigenständiger."
      )}</P>
      <P>{t(
        "Splot łączący elegancję z morskim charakterem — inspirowany łańcuchami jachtowymi, dziś ikona luksusowej biżuterii streetwear. Noszony solo przez kobiety i mężczyzn, w złocie lub srebrze rodowanym wyglądają równie dobrze. Najefektowniejszy w wersji szerokiej (od 8 mm).",
        "A weave combining elegance with nautical character — inspired by yacht chains, today an icon of luxury streetwear jewelry. Worn solo by women and men alike, looks equally strong in gold or rhodium silver. Most impressive in wider versions (from 8mm).",
        "Ein Muster, das Eleganz mit maritimem Charakter verbindet — von Yachtketten inspiriert, heute ein Ikon des Luxus-Streetwear-Schmucks. Von Frauen und Männern solo getragen, sieht in Gold oder rhodiniertem Silber gleich stark aus. Am eindrucksvollsten in breiten Versionen (ab 8mm)."
      )}</P>
      <div className="clear-both" />

      <H2 id={t("masywne", "bold", "massiv")}>
        {t("Sploty masywne i efektowne", "Bold and statement weaves", "Massive und ausdrucksstarke Muster")}
      </H2>
      <P>{t(
        "Sploty masywne to biżuteria, która mówi sama za siebie. Nosi się je zwykle bez zawieszki — łańcuszek jest ozdobą sam w sobie. Wyższy współczynnik materiałowy oznacza więcej srebra lub złota w finalnym wyrobie, co też przekłada się na wyższą wartość inwestycyjną.",
        "Bold weaves are jewelry that speaks for itself. They are usually worn without a pendant — the chain itself is the ornament. A higher material factor means more silver or gold in the finished piece, which also translates to higher investment value.",
        "Massive Muster sind Schmuck, der für sich selbst spricht. Sie werden meist ohne Anhänger getragen — die Kette selbst ist der Schmuck. Ein höherer Materialfaktor bedeutet mehr Silber oder Gold im fertigen Stück, was auch einen höheren Investitionswert bedeutet."
      )}</P>

      <H3>{t("Kordel (lina)", "Rope chain", "Kordel (Seile)")}</H3>
      <WeaveImg id="kordel" name={t("Kordel", "Rope", "Kordel")} />
      <P>{t(
        "Kordel to splot naśladujący skręcony sznurek lub linę — trzy lub cztery pasma ogniw są oplecione wokół siebie pod kątem. Współczynnik ×2,5 i 18% odpadu odzwierciedlają znaczny nakład pracy: każdy ze splotowych pasm musi być formowany osobno przed finalnym zapleceniem.",
        "The rope chain mimics twisted cord or rope — three or four strands of links are braided around each other at an angle. Factor ×2.5 and 18% waste reflect significant labor: each strand must be individually formed before the final braiding.",
        "Die Kordel ahmt verdrehte Schnur oder Seil nach — drei oder vier Stränge von Gliedern sind in einem Winkel umeinander geflochten. Faktor ×2,5 und 18% Abfall spiegeln erheblichen Arbeitsaufwand wider: jeder Strang muss einzeln geformt werden, bevor das finale Flechten erfolgt."
      )}</P>
      <P>{t(
        "Trójwymiarowy kordel iskrzy inaczej niż płaskie sploty — krawędzie wychodzące pod różnymi kątami łapią światło z każdej strony. Noszony solo jako wyrazisty statement, zestawiany z innymi naszyjnikami w layeringu. Dostępny w wersjach od delikatnych 1,5 mm po masywne ponad 6 mm.",
        "The three-dimensional rope sparkles differently from flat weaves — edges emerging at various angles catch light from every direction. Worn solo as a bold statement, or layered with other necklaces. Available in versions from delicate 1.5mm to massive over 6mm.",
        "Die dreidimensionale Kordel glänzt anders als flache Muster — Kanten, die in verschiedenen Winkeln hervortreten, fangen Licht aus jeder Richtung. Solo als kräftiges Statement oder im Layering mit anderen Ketten getragen. In Versionen von zarten 1,5mm bis massiven über 6mm erhältlich."
      )}</P>
      <div className="clear-both" />

      <H3>{t("Lisi ogon (Foxtail)", "Foxtail", "Fuchsschwanz")}</H3>
      <WeaveImg id="lisi_ogon" name={t("Lisi ogon", "Foxtail", "Fuchsschwanz")} />
      <P>{t(
        "Lisi ogon to jeden z piękniejszych splotów pod względem efektu wizualnego — gęste, ułożone ukośnie ogniwa tworzą miękką, aksamitną taśmę metalu. Wysoki współczynnik ×2,8 wynika z gęstości: ogniwa zachodzą na siebie niemal w połowie. Efekt? Łańcuszek wygląda jak ciągłe pasmo polerowanego metalu.",
        "Foxtail is one of the most visually stunning weaves — dense, diagonally arranged links create a soft, velvet-like metal ribbon. The high ×2.8 factor comes from density: links overlap each other by nearly half. Result? The chain looks like a continuous strand of polished metal.",
        "Fuchsschwanz ist eines der schönsten Muster in Sachen visueller Wirkung — dichte, diagonal angeordnete Glieder erzeugen ein weiches, samtartiges Metallband. Der hohe Faktor ×2,8 ergibt sich aus der Dichte: Glieder überlappen sich fast um die Hälfte. Ergebnis? Die Kette sieht aus wie ein kontinuierlicher Strang polierten Metalls."
      )}</P>
      <P>{t(
        "Noszony głównie przez kobiety, zwłaszcza na eleganckie okazje. Zbyt masywny i ozdobny, by zestawiać go z zawieszkami — sam w sobie jest wystarczającą ozdobą. W złocie lub srebrze rodowanym wypada wyjątkowo luksusowo.",
        "Worn mainly by women, especially for elegant occasions. Too massive and ornate to pair with pendants — it is sufficient ornamentation on its own. In gold or rhodium silver it looks exceptionally luxurious.",
        "Hauptsächlich von Frauen getragen, besonders zu eleganten Anlässen. Zu massiv und aufwendig, um mit Anhängern kombiniert zu werden — es ist selbst genug Schmuck. In Gold oder rhodiniertem Silber wirkt es außergewöhnlich luxuriös."
      )}</P>
      <div className="clear-both" />

      <H3>{t("Bizmark", "Bismark", "Bismark")}</H3>
      <WeaveImg id="bizmark" name="Bizmark" />
      <P>{t(
        "Bizmark to splot o wyjątkowo gęstej, plecionej strukturze — ogniwa przeplatają się tak, że łańcuszek wygląda jak metalowa tkanina. Współczynnik ×2,2 i 15% odpadu wynikają z konieczności precyzyjnego tkania kolejnych rzędów ogniw. Szerokość finalnego łańcuszka rośnie wraz z liczbą rzędów.",
        "Bismark is a weave with an exceptionally dense, woven structure — links interlock so that the chain looks like metal fabric. Factor ×2.2 and 15% waste result from the need to precisely weave successive rows of links. The finished chain width grows with the number of rows.",
        "Bismark ist ein Muster mit außergewöhnlich dichter, gewobener Struktur — Glieder greifen ineinander, sodass die Kette wie Metallgewebe aussieht. Faktor ×2,2 und 15% Abfall ergeben sich aus der Notwendigkeit, aufeinanderfolgende Gliedreihen präzise zu weben. Die Breite der fertigen Kette wächst mit der Anzahl der Reihen."
      )}</P>
      <P>{t(
        "Nieomylny znak rozpoznawczy męskiej biżuterii — szeroki bizmark na nadgarstku lub szyi to statement piece bez kompromisów. Choć kojarzony z biżuterią męską, cienkie wersje (2–3 rzędy) noszą też kobiety jako bransoletki lub delikatne naszyjniki.",
        "An unmistakable signature of men's jewelry — a wide Bismark on the wrist or neck is a no-compromise statement piece. Though associated with men's jewelry, thin versions (2–3 rows) are also worn by women as bracelets or delicate necklaces.",
        "Ein unverkennbares Erkennungszeichen des Herrenschmucks — ein breiter Bismark am Handgelenk oder Hals ist ein Statement-Stück ohne Kompromisse. Obwohl mit Herrenschmuck assoziiert, tragen auch Frauen dünne Versionen (2–3 Reihen) als Armbänder oder zarte Ketten."
      )}</P>
      <div className="clear-both" />

      <H3>{t("Bizantyjski", "Byzantine", "Byzantinisch")}</H3>
      <WeaveImg id="byzantine" name={t("Bizantyjski", "Byzantine", "Byzantinisch")} />
      <P>{t(
        "Najbardziej złożony splot w naszej kolekcji — i jeden z najstarszych w historii jubilerstwa. Wzór wywodzi się z Bizancjum i bazuje na przeplataniu grup czterech ogniw w powtarzający się geometryczny węzeł. Współczynnik ×3,2 i 22% odpadu sprawiają, że 45 cm łańcuszka bismantyjskiego wymaga ponad 160 cm drutu i kilku godzin pracy.",
        "The most complex weave in our collection — and one of the oldest in jewelry history. The pattern originates in Byzantium and is based on interweaving groups of four links into a repeating geometric knot. Factor ×3.2 and 22% waste mean that 45 cm of Byzantine chain requires over 160 cm of wire and several hours of work.",
        "Das komplexeste Muster in unserer Kollektion — und eines der ältesten in der Schmuckgeschichte. Das Muster stammt aus Byzanz und basiert auf dem Verflechten von Gruppen aus vier Gliedern zu einem sich wiederholenden geometrischen Knoten. Faktor ×3,2 und 22% Abfall bedeuten, dass 45 cm Byzantinerkette über 160 cm Draht und mehrere Stunden Arbeit erfordern."
      )}</P>
      <P>{t(
        "Łańcuszek bizantyjski to biżuteria, która opowiada historię. Noszony od wieków przez mężczyzn i kobiety — we współczesnym wydaniu AEJaCA dostępny w srebrze, złocie i z możliwością oksydowania (czernienia) dla podkreślenia głębi wzoru. Nosi się go solo; zawieszka przy takim splecie byłaby przesadą.",
        "The Byzantine chain is jewelry that tells a story. Worn for centuries by men and women alike — in AEJaCA's contemporary interpretation available in silver, gold, and with optional oxidation (blackening) to enhance the depth of the pattern. It is worn solo; a pendant with such a weave would be excess.",
        "Die Byzantinerkette ist Schmuck, der Geschichte erzählt. Seit Jahrhunderten von Männern und Frauen getragen — in AEJaCAs zeitgenössischer Interpretation in Silber, Gold und mit optionaler Oxidation (Schwärzung) zur Hervorhebung der Mustertiefe erhältlich. Sie wird solo getragen; ein Anhänger bei einem solchen Muster wäre zuviel."
      )}</P>
      <div className="clear-both" />

      <H2 id={t("jak-wybrac", "how-to-choose", "wie-waehlen")}>
        {t("Jak wybrać splot łańcuszka?", "How to choose a chain weave?", "Wie wähle ich ein Kettenmuster?")}
      </H2>
      <P>{t(
        "Wybór splotu to decyzja wielowymiarowa — zależy od celu (zawieszka vs. solo), stylu życia (codzienny vs. elegancki), osoby obdarowywanej i budżetu. Poniżej kilka praktycznych wskazówek:",
        "Choosing a weave is a multi-dimensional decision — it depends on purpose (pendant vs. solo), lifestyle (everyday vs. elegant), who it's for, and budget. Here are some practical guidelines:",
        "Die Wahl eines Musters ist eine mehrdimensionale Entscheidung — sie hängt von Zweck (Anhänger vs. solo), Lebensstil (täglich vs. elegant), Zielgruppe und Budget ab. Einige praktische Hinweise:"
      )}</P>
      <UL>
        <LI><Strong>{t("Do zawieszki i wisiorków:", "For pendants:", "Für Anhänger:")}</Strong> {t("klasyczny, ankier, rolo, singapur — dyskretne tło, które nie rywalizuje z ozdobą.", "classic, anchor, rolo, Singapore — discreet backgrounds that don't compete with the pendant.", "klassisch, Anker, Rolo, Singapur — dezente Hintergründe, die nicht mit dem Anhänger konkurrieren.")}</LI>
        <LI><Strong>{t("Na co dzień:", "Everyday:", "Täglich:")}</Strong> {t("klasyczny, ankier, rolo, pancerka w lekkiej wersji — wytrzymałe, nie zahaczają o ubranie.", "classic, anchor, rolo, light curb — durable, don't snag on clothing.", "klassisch, Anker, Rolo, leichte Panzer — langlebig, verhaken sich nicht an Kleidung.")}</LI>
        <LI><Strong>{t("Na wieczór i eleganckie okazje:", "For evenings and elegant occasions:", "Für Abende und elegante Anlässe:")}</Strong> {t("lisi ogon, kordel, bizmark, bizantyjski — łańcuszki, które są ozdobą samą w sobie.", "foxtail, rope, Bismark, Byzantine — chains that are an ornament in themselves.", "Fuchsschwanz, Kordel, Bismark, Byzantinisch — Ketten, die selbst Schmuck sind.")}</LI>
        <LI><Strong>{t("Dla dzieci:", "For children:", "Für Kinder:")}</Strong> {t("ankier, rolo, singapur — miękkie ogniwa, brak ostrych krawędzi, lekka konstrukcja.", "anchor, rolo, Singapore — soft links, no sharp edges, lightweight construction.", "Anker, Rolo, Singapur — weiche Glieder, keine scharfen Kanten, leichte Konstruktion.")}</LI>
        <LI><Strong>{t("Dla mężczyzny:", "For a man:", "Für einen Mann:")}</Strong> {t("pancerka, figaro, kordel, gucci, bizmark — solidne sploty o wyrazistym charakterze.", "curb, figaro, rope, gucci, Bismark — solid weaves with strong character.", "Panzer, Figaro, Kordel, Gucci, Bismark — solide Muster mit starkem Charakter.")}</LI>
        <LI><Strong>{t("Jako prezent, gdy nie znasz gustu:", "As a gift when unsure of taste:", "Als Geschenk bei unbekanntem Geschmack:")}</Strong> {t("ankier lub klasyczny w srebrze 925 — bezpieczny, ponadczasowy wybór.", "anchor or classic in silver 925 — a safe, timeless choice.", "Anker oder klassisch in Silber 925 — eine sichere, zeitlose Wahl.")}</LI>
      </UL>
      <Callout accent="amber">{t(
        "Nie jesteś pewien, który splot wybrać? W AEJaCA oferujemy bezpłatną konsultację — opisz okazję, budżet i styl, a dobierzemy splot, metal i wymiary idealnie pod Twoje potrzeby.",
        "Not sure which weave to choose? At AEJaCA we offer a free consultation — describe the occasion, budget, and style, and we'll match the weave, metal, and dimensions perfectly to your needs.",
        "Nicht sicher, welches Muster Sie wählen sollen? Bei AEJaCA bieten wir eine kostenlose Beratung an — beschreiben Sie den Anlass, das Budget und den Stil, und wir stimmen Muster, Metall und Maße perfekt auf Ihre Bedürfnisse ab."
      )}</Callout>
      <CTABox
        accent="amber"
        title={t(
          "Wycena łańcuszka na zamówienie — 30 sekund",
          "Custom chain quote — 30 seconds",
          "Maßkettenangebot — 30 Sekunden"
        )}
        text={t(
          "Wybierz splot, metal, długość i grubość drutu — kalkulator wyliczy koszt wykonania. Możesz też podać masę posiadanego kruszcu i sprawdzić, jak długi łańcuszek z niego powstanie.",
          "Choose weave, metal, length, and wire diameter — the calculator computes the making cost. You can also enter your available metal mass and see how long a chain it will yield.",
          "Wählen Sie Muster, Metall, Länge und Drahtdurchmesser — der Rechner berechnet den Herstellungspreis. Sie können auch Ihre verfügbare Metallmasse eingeben und sehen, wie lange Kette daraus entsteht."
        )}
        href="/jewelry#calculator"
        cta={t("Otwórz kalkulator łańcuszków", "Open chain calculator", "Kettenrechner öffnen")}
      />
    </>
  );
}
