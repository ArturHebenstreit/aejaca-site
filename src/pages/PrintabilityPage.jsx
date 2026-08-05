// ============================================================
// SPRAWDZARKA DRUKOWALNOSCI, STRONA
// ============================================================
// Narzedzie odpowiada na pytanie, ktore dzis przychodzi mailem po wgraniu
// pliku do wyceny: "czy to sie wydrukuje". Roznica wzgledem kalkulatora jest
// zasadnicza. Kalkulator mowi ILE TO KOSZTUJE i zaklada, ze model jest
// poprawny. Ta strona sprawdza, czy zalozenie jest prawdziwe, zanim ktos
// zaplaci za wydruk, ktory i tak sie nie uda.
//
// Plik nie opuszcza przegladarki i to jest warunek uzytecznosci, nie ozdoba.
// Konstruktor sprawdzajacy czesc przed zapytaniem ofertowym nie wysle jej na
// cudzy serwer, zeby uslyszec, ze scianka ma 0,3 mm.
//
// Strona lezy w narzedziach sTuDiO, a nie w kalkulatorze, bo przychodzi tu
// tez ktos, kto u nas nie zamawia. To jest w porzadku: darmowe narzedzie,
// ktore realnie pomaga, sprowadza pozniej zamowienia lepiej niz baner.

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import PrintabilityCheck from "../components/calculators/PrintabilityCheck.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import ToolLinks from "../components/ToolLinks.jsx";
import { getToolById } from "../data/toolLinks.js";
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const URL = `${SITE.url}/toolstudio/printability/`;

const LABELS = {
  pl: {
    heroTag: "Narzędzia sTuDiO",
    heroTitle: "Czy ten model się wydrukuje?",
    heroDesc: "Wgraj plik, wybierz technologię i średnicę dyszy. Sprawdzimy szczelność siatki, grubość ścianek, gabaryty i nawisy. Bez wysyłania pliku na serwer.",
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    breadTools: "Narzędzia sTuDiO",
    breadThis: "Sprawdzarka modeli",
    introTitle: "Co dokładnie sprawdzamy",
    checks: [
      { t: "Szczelność siatki", d: "Każda krawędź poprawnej bryły należy do dwóch ścianek. Krawędzie bez pary to dziury, przy których slicer musi zgadywać, gdzie jest wnętrze." },
      { t: "Kierunek normalnych", d: "Siatka wywrócona na lewą stronę wygląda poprawnie na podglądzie, a drukuje się jako pełna bryła zamiast skorupy." },
      { t: "Grubość ścianek", d: "Mierzymy tak, jak mierzy suwmiarka: z punktu na powierzchni prostopadle w głąb, aż do drugiej strony. Próg zależy od dyszy i to jest sedno tego narzędzia." },
      { t: "Gabaryty", d: "Porównujemy z realnym stołem naszych maszyn, uwzględniając obrót. Część za długa w jednej osi często mieści się po obróceniu." },
      { t: "Nawisy i podstawa", d: "Udział powierzchni wymagającej podpór oraz pole styku ze stołem. Nie blokują druku, ale zmieniają cenę, czas i wygląd." },
    ],
    nozzleTitle: "Dlaczego dysza zmienia odpowiedź",
    nozzleText: "Drukarka FDM układa materiał ścieżkami o szerokości mniej więcej równej średnicy dyszy. Ścianka cieńsza niż jedna ścieżka nie ma z czego powstać i w tym miejscu zrobi się dziura. Ścianka o szerokości dokładnie jednej ścieżki powstanie, ale pęknie przy pierwszym nacisku, bo nie ma w niej żadnego wiązania poprzecznego. Dlatego narzędzie rozróżnia dwa progi: minimum, poniżej którego nie ma sensu próbować, i wartość bezpieczną, czyli dwie ścieżki.",
    nozzleTable: ["Dysza", "Minimum", "Bezpiecznie", "Warstwa"],
    nozzleNote: "Na stałe pracujemy dyszami 0,2 i 0,4 mm. Większe zakładamy po uzgodnieniu, przy dużych częściach użytkowych, gdzie czas druku liczy się bardziej niż detal.",
    mslaTitle: "Żywica rządzi się inaczej",
    mslaText: "W MSLA nie ma dyszy ani ścieżek: cała warstwa naświetla się naraz, a rozdzielczość w płaszczyźnie to piksel ekranu, u nas 14 µm. Wydawałoby się więc, że wydrukuje się wszystko. Granicę wyznacza jednak nie rozdzielczość, tylko siła odklejania od folii przy każdej warstwie. Ścianka poniżej 0,4 mm zwykle urywa się w trakcie, a poniżej 0,8 mm przetrwa druk, ale niekoniecznie mycie i doczyszczanie.",
    faqTitle: "Częste pytania",
    ctaTitle: "Model gotowy? Policz koszt wydruku",
    ctaText: "Ten sam plik wgrasz do kalkulatora i dostaniesz wiążącą cenę, bez czekania na odpowiedź mailem.",
    ctaBtn: "Przejdź do kalkulatora",
  },
  en: {
    heroTag: "sTuDiO tools",
    heroTitle: "Will this model print?",
    heroDesc: "Upload a file, pick the technology and the nozzle diameter. We check whether the mesh is watertight, how thin the walls are, whether it fits and how much support it needs. Nothing is uploaded to a server.",
    breadHome: "Home",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO tools",
    breadThis: "Model checker",
    introTitle: "What exactly we check",
    checks: [
      { t: "Watertight mesh", d: "Every edge of a proper solid belongs to two faces. Unpaired edges are holes, and at a hole the slicer has to guess where the inside is." },
      { t: "Normal direction", d: "A mesh turned inside out looks right in the preview and prints as a solid block instead of a shell." },
      { t: "Wall thickness", d: "Measured the way a caliper measures: from a point on the surface straight inwards until the other side. The threshold depends on the nozzle, and that is the point of this tool." },
      { t: "Dimensions", d: "Compared against the real build plates of our machines, allowing for rotation. A part too long in one axis often fits once turned." },
      { t: "Overhangs and base", d: "How much surface needs support and how much of it touches the plate. Neither blocks printing, but both change price, time and finish." },
    ],
    nozzleTitle: "Why the nozzle changes the answer",
    nozzleText: "An FDM printer lays material down in paths roughly as wide as the nozzle. A wall thinner than one path has nothing to be made of and comes out as a hole. A wall exactly one path wide does get made, but it cracks under the first press because nothing binds it across. That is why the tool works with two thresholds: the minimum, below which there is no point trying, and the safe value, which is two paths.",
    nozzleTable: ["Nozzle", "Minimum", "Safe", "Layer"],
    nozzleNote: "We keep 0.2 and 0.4 mm nozzles fitted. Larger ones go on by arrangement, for big functional parts where print time matters more than detail.",
    mslaTitle: "Resin behaves differently",
    mslaText: "MSLA has no nozzle and no paths: a whole layer is exposed at once and the in-plane resolution is the screen pixel, 14 µm on our machine. You would think anything would print. The real limit is not resolution but the peel force as each layer separates from the film. A wall under 0.4 mm usually tears off mid-print, and under 0.8 mm it survives printing but not necessarily washing and cleanup.",
    faqTitle: "Common questions",
    ctaTitle: "Model ready? Work out the print cost",
    ctaText: "Upload the same file to the calculator and get a binding price without waiting for an email reply.",
    ctaBtn: "Go to the calculator",
  },
  de: {
    heroTag: "sTuDiO-Tools",
    heroTitle: "Lässt sich dieses Modell drucken?",
    heroDesc: "Datei hochladen, Technologie und Düsendurchmesser wählen. Wir prüfen, ob das Netz geschlossen ist, wie dünn die Wände sind, ob es passt und wie viel Stützmaterial nötig ist. Nichts wird auf einen Server geladen.",
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO-Tools",
    breadThis: "Modellprüfung",
    introTitle: "Was genau geprüft wird",
    checks: [
      { t: "Geschlossenes Netz", d: "Jede Kante eines korrekten Körpers gehört zu zwei Flächen. Kanten ohne Gegenstück sind Löcher, und dort muss der Slicer raten, wo innen ist." },
      { t: "Richtung der Normalen", d: "Ein auf links gedrehtes Netz sieht in der Vorschau richtig aus und druckt als Vollkörper statt als Schale." },
      { t: "Wandstärke", d: "Gemessen wie mit dem Messschieber: von einem Punkt der Oberfläche senkrecht nach innen bis zur Gegenseite. Die Grenze hängt von der Düse ab, und darum geht es hier." },
      { t: "Abmessungen", d: "Verglichen mit den realen Bauplatten unserer Maschinen, inklusive Drehung. Ein in einer Achse zu langes Teil passt oft nach dem Drehen." },
      { t: "Überhänge und Auflage", d: "Wie viel Fläche Stützen braucht und wie viel die Platte berührt. Beides blockiert den Druck nicht, ändert aber Preis, Zeit und Aussehen." },
    ],
    nozzleTitle: "Warum die Düse die Antwort ändert",
    nozzleText: "Ein FDM-Drucker legt Material in Bahnen ab, die etwa so breit sind wie die Düse. Eine Wand dünner als eine Bahn hat nichts, woraus sie entstehen könnte, und wird zum Loch. Eine Wand von genau einer Bahn entsteht zwar, bricht aber beim ersten Druck, weil ihr die Querbindung fehlt. Deshalb arbeitet das Tool mit zwei Grenzen: dem Minimum, unter dem ein Versuch sinnlos ist, und dem sicheren Wert, also zwei Bahnen.",
    nozzleTable: ["Düse", "Minimum", "Sicher", "Schicht"],
    nozzleNote: "Fest montiert sind bei uns 0,2 und 0,4 mm. Größere Düsen nach Absprache, für große Funktionsteile, bei denen die Druckzeit mehr zählt als das Detail.",
    mslaTitle: "Harz verhält sich anders",
    mslaText: "MSLA kennt weder Düse noch Bahnen: eine ganze Schicht wird auf einmal belichtet, und die Auflösung in der Ebene ist die Bildschirmpixelgröße, bei uns 14 µm. Man könnte meinen, damit ginge alles. Die eigentliche Grenze ist aber nicht die Auflösung, sondern die Abzugskraft beim Ablösen jeder Schicht von der Folie. Eine Wand unter 0,4 mm reißt meist während des Drucks ab, unter 0,8 mm übersteht sie den Druck, aber nicht unbedingt Waschen und Nacharbeit.",
    faqTitle: "Häufige Fragen",
    ctaTitle: "Modell fertig? Druckkosten berechnen",
    ctaText: "Dieselbe Datei in den Rechner laden und einen verbindlichen Preis erhalten, ohne auf eine E-Mail zu warten.",
    ctaBtn: "Zum Rechner",
  },
};

const SEO_META = {
  pl: {
    title: "Czy model się wydrukuje? Sprawdzarka STL online | AEJaCA",
    description: "Darmowa analiza modelu 3D: szczelność siatki, grubość ścianek pod dyszę 0,2 do 0,8 mm i pod żywicę MSLA, gabaryty, nawisy. Plik zostaje w przeglądarce.",
  },
  en: {
    title: "Will my model print? Free STL checker online | AEJaCA",
    description: "Free 3D model analysis: watertight mesh, wall thickness for 0.2 to 0.8 mm nozzles and for MSLA resin, build volume, overhangs. The file stays in your browser.",
  },
  de: {
    title: "Lässt sich mein Modell drucken? STL-Prüfung online | AEJaCA",
    description: "Kostenlose 3D-Modellanalyse: geschlossenes Netz, Wandstärke für Düsen von 0,2 bis 0,8 mm und für MSLA-Harz, Bauraum, Überhänge. Die Datei bleibt im Browser.",
  },
};

const FAQ = {
  pl: [
    { q: "Czy mój plik gdzieś trafia?", a: "Nie. Cała analiza dzieje się w Twojej przeglądarce, w osobnym wątku roboczym. Plik nie jest wysyłany na żaden serwer, nie zapisujemy go i nie mamy do niego dostępu. Możesz sprawdzić: odetnij internet po wczytaniu strony, narzędzie nadal zadziała." },
    { q: "Jaka jest minimalna grubość ścianki przy dyszy 0,4?", a: "Jedna ścieżka to 0,4 mm i tyle da się wydrukować. Ścianka użytkowa powinna mieć dwie ścieżki, czyli około 0,84 mm, bo pojedyncza ścieżka nie ma wiązania poprzecznego i pęka przy nacisku. Poniżej 0,4 mm drukarka nie ma jak niczego ułożyć i w tym miejscu zostanie dziura." },
    { q: "Czy przy dyszy 0,2 wydrukuję cieńsze detale?", a: "Tak, minimum schodzi do 0,2 mm, a bezpieczna ścianka do około 0,42 mm. Cena rośnie, bo ta sama część wymaga więcej ścieżek i więcej warstw, więc druk trwa nawet kilkakrotnie dłużej. Przy detalach poniżej 0,3 mm zwykle sensowniejsza jest żywica." },
    { q: "Co znaczy, że siatka nie jest szczelna?", a: "Że w powierzchni są dziury: krawędzie, przy których brakuje sąsiedniej ścianki. Slicer nie wie wtedy, gdzie jest wnętrze bryły, a wycena liczona z objętości opiera się na czymś, co bryłą nie jest. Naprawia się to automatem w Meshmixerze, w Blenderze (3D Print Toolbox) albo funkcją naprawy w PrusaSlicer i Bambu Studio." },
    { q: "Dlaczego nie mierzycie grubości przy dziurawej siatce?", a: "Bo wynik byłby nieprawdziwy, a to gorsze niż jego brak. Promień pomiarowy wychodzi z powierzchni w głąb materiału i szuka drugiej strony. Przy dziurze wylatuje przez nią i trafia w przypadkową ściankę po drugiej stronie modelu, pokazując grubość kilkanaście razy większą od rzeczywistej." },
    { q: "Model nie mieści się na stole. Co dalej?", a: "Albo skalowanie w dół, albo pocięcie na części i sklejenie po wydruku. Cięcie nie jest porażką, przy dużych obiektach to standard, ale miejsce cięcia warto dobrać tak, żeby szew wypadł w krawędzi, a nie na widocznej płaszczyźnie. Napiszcie, podpowiemy gdzie." },
    { q: "Czy 100% podpór to problem?", a: "Nie, ale kosztuje. Podpory zużywają materiał i czas, a po ich usunięciu zostaje ślad, który trzeba doczyścić. Przy udziale powyżej jednej trzeciej powierzchni warto sprawdzić, czy obrót modelu albo podział na dwie części nie da lepszego efektu taniej." },
    { q: "Czy analiza zastępuje wydruk próbny?", a: "Nie. Opisuje geometrię, a nie zachowanie materiału: skurcz, warping, przyczepność do stołu, sprężystość cienkich elementów. Przy nietypowych kształtach i przy detalach dokładnie na granicy progu odezwij się, sprawdzimy to na maszynie." },
  ],
  en: [
    { q: "Does my file go anywhere?", a: "No. The whole analysis runs in your browser, in a separate worker thread. The file is not uploaded to any server, we do not store it and we have no access to it. You can verify this: disconnect from the internet after the page loads and the tool still works." },
    { q: "What is the minimum wall thickness with a 0.4 nozzle?", a: "One path is 0.4 mm and that much will print. A functional wall wants two paths, about 0.84 mm, because a single path has no cross-binding and cracks under pressure. Below 0.4 mm the printer has nothing to lay down and a hole is left." },
    { q: "Will a 0.2 nozzle print finer detail?", a: "Yes, the minimum drops to 0.2 mm and a safe wall to about 0.42 mm. The price rises, because the same part needs more paths and more layers, so printing takes several times longer. Below roughly 0.3 mm of detail, resin usually makes more sense." },
    { q: "What does a mesh that is not watertight mean?", a: "That the surface has holes: edges where the neighbouring face is missing. The slicer then cannot tell where the inside of the solid is, and a price computed from volume rests on something that is not a solid. Repair it automatically in Meshmixer, in Blender (3D Print Toolbox) or with the repair function in PrusaSlicer and Bambu Studio." },
    { q: "Why do you not measure thickness on a mesh with holes?", a: "Because the answer would be wrong, and that is worse than no answer. The measuring ray leaves the surface, travels into the material and looks for the other side. At a hole it escapes and hits a random wall on the far side of the model, reporting a thickness many times the real one." },
    { q: "The model does not fit on the plate. Now what?", a: "Either scale it down, or split it and bond the parts after printing. Splitting is not a failure, it is standard on large objects, but the cut is worth placing so the seam falls on an edge rather than a visible face. Write to us and we will suggest where." },
    { q: "Is a lot of support a problem?", a: "No, but it costs. Support consumes material and time, and leaves a mark that has to be cleaned up. Above roughly a third of the surface it is worth checking whether rotating the model, or splitting it in two, gives a better result for less." },
    { q: "Does this replace a test print?", a: "No. It describes geometry, not how the material behaves: shrinkage, warping, bed adhesion, the springiness of thin features. For unusual shapes, and for detail sitting exactly on the threshold, get in touch and we will check it on the machine." },
  ],
  de: [
    { q: "Geht meine Datei irgendwohin?", a: "Nein. Die gesamte Analyse läuft in Ihrem Browser, in einem eigenen Worker-Thread. Die Datei wird auf keinen Server geladen, wir speichern sie nicht und haben keinen Zugriff darauf. Sie können es prüfen: Trennen Sie nach dem Laden der Seite die Internetverbindung, das Tool arbeitet weiter." },
    { q: "Wie dünn darf eine Wand bei 0,4 mm Düse sein?", a: "Eine Bahn misst 0,4 mm, so viel lässt sich drucken. Eine Funktionswand sollte zwei Bahnen haben, etwa 0,84 mm, denn einer einzelnen Bahn fehlt die Querbindung und sie bricht unter Druck. Unter 0,4 mm kann der Drucker nichts ablegen, dort bleibt ein Loch." },
    { q: "Druckt eine 0,2er Düse feinere Details?", a: "Ja, das Minimum sinkt auf 0,2 mm, eine sichere Wand auf etwa 0,42 mm. Der Preis steigt, weil dasselbe Teil mehr Bahnen und mehr Schichten braucht und der Druck ein Vielfaches länger dauert. Unterhalb von etwa 0,3 mm Detail ist Harz meist sinnvoller." },
    { q: "Was heißt, das Netz sei nicht geschlossen?", a: "Dass die Oberfläche Löcher hat: Kanten, an denen die Nachbarfläche fehlt. Der Slicer weiß dann nicht, wo das Innere liegt, und ein über das Volumen berechneter Preis stützt sich auf etwas, das kein Körper ist. Reparieren lässt sich das automatisch in Meshmixer, in Blender (3D Print Toolbox) oder mit der Reparaturfunktion in PrusaSlicer und Bambu Studio." },
    { q: "Warum messen Sie die Wandstärke bei offenem Netz nicht?", a: "Weil das Ergebnis falsch wäre, und das ist schlimmer als keines. Der Messstrahl verlässt die Oberfläche nach innen und sucht die Gegenseite. An einem Loch entweicht er und trifft eine beliebige Wand auf der anderen Seite des Modells, was ein Vielfaches der echten Stärke anzeigt." },
    { q: "Das Modell passt nicht auf die Platte. Was nun?", a: "Entweder verkleinern oder teilen und nach dem Druck fügen. Teilen ist kein Scheitern, bei großen Objekten ist es Standard, aber die Trennstelle sollte so liegen, dass die Naht auf eine Kante fällt und nicht auf eine Sichtfläche. Schreiben Sie uns, wir schlagen eine Stelle vor." },
    { q: "Sind viele Stützen ein Problem?", a: "Nein, aber sie kosten. Stützen verbrauchen Material und Zeit und hinterlassen Spuren, die nachgearbeitet werden müssen. Ab etwa einem Drittel der Fläche lohnt die Prüfung, ob Drehen oder Teilen ein besseres Ergebnis für weniger Geld bringt." },
    { q: "Ersetzt die Analyse einen Testdruck?", a: "Nein. Sie beschreibt die Geometrie, nicht das Materialverhalten: Schwund, Verzug, Haftung auf der Platte, Federung dünner Elemente. Bei ungewöhnlichen Formen und bei Details genau an der Grenze melden Sie sich, wir prüfen es auf der Maschine." },
  ],
};

const RELATED_TOOL_IDS = ["print-settings", "resin-settings", "shrinkage"];

export default function PrintabilityPage() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = SEO_META[lang] || SEO_META.pl;
  const faq = FAQ[lang] || FAQ.pl;

  const introRef = useScrollReveal();
  const nozzleRef = useScrollReveal();
  const mslaRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const toolsRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const relatedTools = RELATED_TOOL_IDS.map(getToolById).filter(Boolean);

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: URL, lang }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadStudio, url: `${SITE.url}/studio/` },
      { name: L.breadTools, url: `${SITE.url}/toolstudio/` },
      { name: L.breadThis, url: URL },
    ]),
    buildFAQSchema(faq),
  ];

  // Progi z modulu analizy, zeby tabela na stronie nie rozjechala sie
  // z liczbami, ktorymi narzedzie realnie sie posluguje.
  const nozzles = [
    { id: "0.2", min: 0.2, safe: 0.42, layer: "0,06 do 0,14" },
    { id: "0.4", min: 0.4, safe: 0.84, layer: "0,08 do 0,28" },
    { id: "0.6", min: 0.6, safe: 1.25, layer: "0,15 do 0,42" },
    { id: "0.8", min: 0.8, safe: 1.65, layer: "0,20 do 0,56" },
  ];
  const dec = lang === "en" ? "." : ",";
  const fmt = (v) => v.toFixed(2).replace(".", dec);

  return (
    <>
      <SEOHead
        pageKey="toolstudio"
        path="/toolstudio/printability"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="bg-neutral-950">

        <section className="relative overflow-hidden min-h-[340px]">
          <img
            src="/img/calc/3d_segments/msla_resin.webp"
            alt={L.heroTitle}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1024"
            height="572"
          />
          <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />
          <div className="hero-text relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-6 text-center flex flex-col items-center">
            <div className="text-blue-400 text-xs font-medium uppercase tracking-[0.35em] mb-5">{L.heroTag}</div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-[56px] font-semibold text-white mb-5 leading-[1.05] tracking-tight drop-shadow-2xl">{L.heroTitle}</h1>
            <p className="text-neutral-200 text-base max-w-2xl leading-relaxed">{L.heroDesc}</p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
          <Breadcrumb
            items={[
              { label: L.breadHome, href: "/" },
              { label: L.breadStudio, href: "/studio/" },
              { label: L.breadTools, href: "/toolstudio/" },
              { label: L.breadThis },
            ]}
          />
        </div>

        {/* Narzedzie od razu: czytelnik przyszedl sprawdzic plik, a nie czytac. */}
        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <PrintabilityCheck />
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Co sprawdzamy */}
        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal">
              <h2 className="text-xl font-semibold text-white mb-5">{L.introTitle}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {L.checks.map((c) => (
                  <div key={c.t} className="p-5 rounded-2xl glass">
                    <h3 className="text-white font-medium text-sm mb-1.5">{c.t}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{c.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dysze */}
        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={nozzleRef} className="reveal">
              <h2 className="text-xl font-semibold text-white mb-3">{L.nozzleTitle}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-5">{L.nozzleText}</p>
              <div className="rounded-2xl glass p-5 overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="text-neutral-500 text-xs uppercase tracking-wider">
                      {L.nozzleTable.map((h) => (
                        <th key={h} className="text-left font-medium pb-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nozzles.map((n) => (
                      <tr key={n.id} className="border-t border-neutral-800 text-neutral-300">
                        <td className="py-2 font-mono text-blue-300">{n.id.replace(".", dec)} mm</td>
                        <td className="py-2 font-mono">{fmt(n.min)} mm</td>
                        <td className="py-2 font-mono">{fmt(n.safe)} mm</td>
                        <td className="py-2 font-mono text-neutral-400">{n.layer} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-neutral-500 text-xs leading-relaxed mt-4">{L.nozzleNote}</p>
            </div>
          </div>
        </section>

        {/* MSLA */}
        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={mslaRef} className="reveal p-6 rounded-2xl glass">
              <h2 className="text-xl font-semibold text-white mb-3">{L.mslaTitle}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">{L.mslaText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* FAQ */}
        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={faqRef} className="reveal">
              <h2 className="text-xl font-semibold text-white mb-5">{L.faqTitle}</h2>
              <div className="space-y-4">
                {faq.map((item) => (
                  <div key={item.q} className="p-5 rounded-2xl glass">
                    <h3 className="text-white font-medium text-sm mb-2">{item.q}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={toolsRef} className="reveal">
              <ToolLinks tools={relatedTools} variant="content" accent="blue" />
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        <section className="px-4">
          <ToolReviewCTA />
        </section>

        <section className="py-10 px-4 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.ctaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.ctaText}</p>
            <a
              href="/studio/#calculator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-neutral-950 font-semibold rounded-full hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
            >
              {L.ctaBtn}
            </a>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
