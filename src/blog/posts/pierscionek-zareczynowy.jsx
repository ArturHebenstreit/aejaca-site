import { H2, H3, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "pierscionek-zareczynowy-na-zamowienie",
  category: "jewelry",
  accent: "amber",
  publishedAt: "2026-04-17",
  updatedAt: "2026-04-17",
  coverImage: "/hero-jewelry.jpg",
  readingTime: { pl: 7, en: 5, de: 5 },
  title: {
    pl: "Pierścionek zaręczynowy na zamówienie — koszt, proces i 7 rzeczy, które warto wiedzieć",
    en: "Custom Engagement Ring — Cost, Process & 7 Things You Should Know",
    de: "Verlobungsring nach Maß — Kosten, Prozess & 7 wissenswerte Fakten",
  },
  description: {
    pl: "Ile kosztuje pierścionek zaręczynowy na zamówienie? Jak wygląda proces od pomysłu do gotowego pierścionka? Metal, kamienie, czas realizacji — kompletny przewodnik AEJaCA.",
    en: "How much does a custom engagement ring cost? From idea to finished ring — metals, gemstones, timeline. A complete guide by AEJaCA.",
    de: "Was kostet ein individueller Verlobungsring? Vom Entwurf bis zum fertigen Ring — Metalle, Edelsteine, Zeitrahmen. Ein vollständiger Leitfaden von AEJaCA.",
  },
  keywords: {
    pl: "pierścionek zaręczynowy na zamówienie, cena pierścionka zaręczynowego, custom engagement ring Polska, biżuteria na zamówienie Warszawa",
    en: "custom engagement ring cost, bespoke engagement ring process, handmade engagement ring Europe",
    de: "Verlobungsring nach Maß Kosten, individueller Verlobungsring Prozess, handgefertigter Verlobungsring Europa",
  },
  faq: {
    pl: [
      { q: "Ile kosztuje pierścionek zaręczynowy na zamówienie?", a: "Cena zależy od metalu, kamienia i stopnia skomplikowania. W AEJaCA zaczynamy od ok. 800 zł za prosty srebrny pierścionek. Złote pierścionki z kamieniami szlachetnymi to zwykle 3 000–15 000 zł. Wycenę otrzymasz w ciągu 24h po konsultacji." },
      { q: "Ile trwa realizacja pierścionka na zamówienie?", a: "Standardowy czas to 2–4 tygodnie od zatwierdzenia projektu. Dla projektów z odlewem metodą traconego wosku i osadzaniem kamieni — do 6 tygodni. Ekspresowa realizacja (7 dni) jest możliwa za dopłatą." },
      { q: "Czy mogę zobaczyć projekt przed produkcją?", a: "Tak — zawsze przygotowujemy render 3D (CAD) pierścionka z każdego kąta. Zatwierdzasz projekt wizualnie zanim rozpoczniemy produkcję. Zmiany na etapie CAD są bezpłatne." },
      { q: "Jakie metale i kamienie oferujecie?", a: "Pracujemy ze srebrem 925, złotem 585 (14K) i 750 (18K), oraz platyną. Kamienie: diamenty, moissanity, szafiry, szmaragdy, rubiny, ametysty i wiele innych naturalnych kamieni szlachetnych." },
    ],
    en: [
      { q: "How much does a custom engagement ring cost?", a: "It depends on the metal, stone, and complexity. At AEJaCA, simple silver rings start around €180. Gold rings with gemstones typically range €700–3,500. You'll receive a quote within 24h of your consultation." },
      { q: "How long does it take to make a custom ring?", a: "Standard timeline is 2–4 weeks from design approval. For lost-wax casting with stone setting, allow up to 6 weeks. Express production (7 days) is available for a surcharge." },
      { q: "Can I see the design before production?", a: "Yes — we always prepare a 3D CAD render from every angle. You approve the design visually before we begin production. Changes at the CAD stage are free." },
      { q: "What metals and stones do you offer?", a: "We work with 925 silver, 14K and 18K gold, and platinum. Stones include diamonds, moissanites, sapphires, emeralds, rubies, amethysts, and many other natural gemstones." },
    ],
    de: [
      { q: "Was kostet ein individueller Verlobungsring?", a: "Das hängt von Metall, Stein und Komplexität ab. Bei AEJaCA beginnen einfache Silberringe bei ca. 180 €. Goldringe mit Edelsteinen kosten typischerweise 700–3.500 €. Sie erhalten innerhalb von 24 Stunden ein Angebot." },
      { q: "Wie lange dauert die Anfertigung?", a: "Standardmäßig 2–4 Wochen ab Design-Freigabe. Für Wachsausschmelzguss mit Steinbesatz bis zu 6 Wochen. Express-Anfertigung (7 Tage) ist gegen Aufpreis möglich." },
      { q: "Kann ich das Design vor der Produktion sehen?", a: "Ja — wir erstellen immer einen 3D-CAD-Render aus jedem Winkel. Sie geben das Design visuell frei, bevor wir mit der Produktion beginnen. Änderungen im CAD-Stadium sind kostenlos." },
      { q: "Welche Metalle und Steine bieten Sie an?", a: "Wir arbeiten mit 925er Silber, 14K- und 18K-Gold sowie Platin. Edelsteine: Diamanten, Moissanite, Saphire, Smaragde, Rubine, Amethyste und viele andere." },
    ],
  },
  toc: {
    pl: [
      { id: "koszt", label: "Ile kosztuje" },
      { id: "proces", label: "Proces krok po kroku" },
      { id: "metal", label: "Wybór metalu" },
      { id: "kamien", label: "Kamień szlachetny" },
      { id: "czas", label: "Czas realizacji" },
      { id: "faq", label: "FAQ" },
    ],
    en: [
      { id: "cost", label: "How much it costs" },
      { id: "process", label: "Step-by-step process" },
      { id: "metal", label: "Choosing a metal" },
      { id: "stone", label: "Gemstone options" },
      { id: "timeline", label: "Timeline" },
      { id: "faq", label: "FAQ" },
    ],
    de: [
      { id: "kosten", label: "Kosten" },
      { id: "prozess", label: "Prozess Schritt für Schritt" },
      { id: "metall", label: "Metallauswahl" },
      { id: "stein", label: "Edelsteinoptionen" },
      { id: "zeitrahmen", label: "Zeitrahmen" },
      { id: "faq", label: "FAQ" },
    ],
  },
};

// ======================= PL =======================
function BodyPL() {
  return (
    <>
      <Lead>
        Pierścionek zaręczynowy to jeden z najważniejszych przedmiotów, jakie kiedykolwiek kupisz.
        Nie dlatego, że jest drogi — ale dlatego, że ma nosić w sobie historię dwojga ludzi.
        Jeśli szukasz czegoś, czego nie znajdziesz na wystawie w galerii handlowej — ten przewodnik jest dla Ciebie.
      </Lead>

      <H2 id="koszt">Ile kosztuje pierścionek zaręczynowy na zamówienie?</H2>
      <P>
        Pytanie, które zadaje każdy. Szczera odpowiedź: <Strong>od ~800 zł do 20 000 zł+</Strong>, w zależności od trzech zmiennych:
      </P>
      <UL>
        <LI><Strong>Metal</Strong> — srebro 925 jest najtańsze (~800–2 000 zł), złoto 585 (14K) to środek (~2 500–8 000 zł), złoto 750 (18K) i platyna to segment premium (~5 000–20 000 zł).</LI>
        <LI><Strong>Kamień</Strong> — moissanit wygląda jak diament, ale kosztuje 3–5× mniej. Naturalny diament 0.5 ct to ~3 000–6 000 zł. Szafiry i szmaragdy mają własną skalę cenową.</LI>
        <LI><Strong>Robocizna i złożoność</Strong> — prosty solitaire to mniej pracy niż ażurowy vintage z 12 kamieniami bocznymi. Odlew metodą traconego wosku + ręczne osadzenie = najwyższy koszt ręcznej pracy.</LI>
      </UL>
      <Callout accent="amber" title="Wskazówka">
        W AEJaCA wycenę dostajesz w ciągu 24h — bez zobowiązań. Wystarczy opisać pomysł lub przesłać inspirację.
        <br /><A href="/jewelry#calculator">Sprawdź orientacyjną cenę w kalkulatorze biżuterii →</A>
      </Callout>

      <H2 id="proces">Jak wygląda proces od pomysłu do gotowego pierścionka?</H2>
      <P>
        Każdy pierścionek w AEJaCA przechodzi przez 6 etapów. Nie musisz znać się na złotnictwie — przeprowadzimy Cię przez każdy krok.
      </P>
      <OL>
        <LI><Strong>Konsultacja</Strong> — opowiadasz o swojej wizji, stylu życia partnerki/partnera, budżecie. Możesz przesłać szkic, zdjęcie inspiracji albo po prostu opisać słowami.</LI>
        <LI><Strong>Projekt CAD + render 3D</Strong> — tworzymy precyzyjny model komputerowy. Widzisz pierścionek z każdego kąta na fotorealistycznym renderze. Zmiany na tym etapie są bezpłatne.</LI>
        <LI><Strong>Model woskowy lub druk 3D</Strong> — fizyczny prototyp w skali 1:1. Możesz go trzymać w ręce i sprawdzić proporcje.</LI>
        <LI><Strong>Odlew</Strong> — model woskowy jest zamykany w ceramicznej formie, wosk wypala się, a płynny metal (srebro lub złoto) wypełnia pustą przestrzeń. Klasyczna metoda „traconego wosku" używana od 5000 lat.</LI>
        <LI><Strong>Ręczna obróbka</Strong> — odlany pierścionek jest piłowany, szlifowany, polerowany pastami. Opcjonalnie: tekstury, oksydacja, satynowanie.</LI>
        <LI><Strong>Osadzenie kamienia + kontrola jakości</Strong> — kamień osadzany ręcznie (krapna, opaska lub kanał). Inspekcja pod lupą. Pakowanie i wysyłka.</LI>
      </OL>

      <H2 id="metal">Jak dobrać metal — srebro 925, złoto 585 czy 750?</H2>
      <Table
        headers={["Metal", "Karat", "Trwałość", "Kolor", "Cena*"]}
        rows={[
          ["Srebro 925", "—", "Dobra (twardnie z czasem)", "Biały (ciemnieje)", "$$"],
          ["Złoto 585", "14K", "Bardzo dobra", "Żółte / białe / różowe", "$$$"],
          ["Złoto 750", "18K", "Doskonała", "Intensywniejszy kolor", "$$$$"],
          ["Platyna 950", "—", "Najwyższa", "Szary-biały, nie blednie", "$$$$$"],
        ]}
      />
      <P>
        <Strong>Złoto 585 (14K)</Strong> to najpopularniejszy wybór na pierścionki zaręczynowe w Polsce — łączy trwałość z rozsądną ceną. Dla osób z wrażliwą skórą rekomendujemy <Strong>złoto 750</Strong> (mniej stopów, mniejsze ryzyko alergii).
      </P>

      <H2 id="kamien">Naturalny diament, moissanit czy kamień szlachetny?</H2>
      <P>
        Diament to klasyka, ale nie jedyna opcja — i nie zawsze najlepsza:
      </P>
      <UL>
        <LI><Strong>Diament naturalny</Strong> — najtwardszy (10 Mohsa), najwyższy prestiż, najwyższa cena. Wycena wg 4C (carat, cut, color, clarity).</LI>
        <LI><Strong>Moissanit</Strong> — twardość 9.25 Mohsa, więcej ognia (dyspers ja) niż diament, 3–5× tańszy. Wizualnie nieodróżnialny gołym okiem.</LI>
        <LI><Strong>Szafir / szmaragd / rubin</Strong> — kolor dodaje charakteru. Szafiry niebieskie i różowe to hit zaręczynowy (jak pierścionek księżnej Diany / Kate Middleton). Szmaragdy są delikatniejsze (7.5 Mohsa) — wymagają ochronnej oprawy.</LI>
      </UL>
      <P>
        W AEJaCA dobieramy kamienie indywidualnie — widzisz zdjęcia konkretnego egzemplarza, nie stockowe fotki.
      </P>

      <H2 id="czas">Ile trwa realizacja?</H2>
      <UL>
        <LI><Strong>Prosty pierścionek srebrny</Strong> — 1–2 tygodnie</LI>
        <LI><Strong>Złoto z kamieniem, standardowy odlew</Strong> — 2–4 tygodnie</LI>
        <LI><Strong>Kompleksowy projekt z wieloma kamieniami</Strong> — 4–6 tygodni</LI>
        <LI><Strong>Ekspres (za dopłatą)</Strong> — od 7 dni roboczych</LI>
      </UL>
      <P>
        Termin liczymy od momentu zatwierdzenia projektu CAD. Etap projektowania (konsultacja + render) trwa zazwyczaj 2–5 dni.
      </P>

      <CTABox
        accent="amber"
        title="Zaprojektuj swój pierścionek"
        text="Użyj naszego kalkulatora biżuterii, żeby zobaczyć orientacyjną cenę — albo skontaktuj się bezpośrednio."
        href="/jewelry#calculator"
        cta="Otwórz kalkulator biżuterii"
      />
    </>
  );
}

// ======================= EN =======================
function BodyEN() {
  return (
    <>
      <Lead>
        An engagement ring is one of the most meaningful objects you'll ever buy — not because of its price tag, but because it carries the story of two people. If you're looking for something you won't find in a mall display case, this guide is for you.
      </Lead>

      <H2 id="cost">How much does a custom engagement ring cost?</H2>
      <P>
        Honest answer: <Strong>from ~€180 to €5,000+</Strong>, depending on three variables: metal, stone, and complexity. Silver 925 is the most accessible, 14K gold hits the sweet spot, 18K gold and platinum are premium. Moissanite looks like diamond but costs 3–5× less.
      </P>
      <Callout accent="amber" title="Tip">
        At AEJaCA, you'll receive a detailed quote within 24h — no commitment. Just describe your idea or send an inspiration photo.
        <br /><A href="/jewelry#calculator">Check approximate pricing in our jewelry calculator →</A>
      </Callout>

      <H2 id="process">Step-by-step: from idea to finished ring</H2>
      <OL>
        <LI><Strong>Consultation</Strong> — tell us about your vision, your partner's style, and your budget.</LI>
        <LI><Strong>CAD design + 3D render</Strong> — a photorealistic preview from every angle. Changes are free at this stage.</LI>
        <LI><Strong>Wax model or 3D print</Strong> — a 1:1 physical prototype you can hold.</LI>
        <LI><Strong>Lost-wax casting</Strong> — molten metal fills the cavity left by the burned-out wax. A 5,000-year-old technique.</LI>
        <LI><Strong>Hand finishing</Strong> — filing, polishing, texturing. Optional oxidation or satin finish.</LI>
        <LI><Strong>Stone setting + QC</Strong> — hand-set prong, bezel, or channel mount. Loupe inspection. Packaged and shipped.</LI>
      </OL>

      <H2 id="metal">Choosing your metal</H2>
      <Table
        headers={["Metal", "Karat", "Durability", "Color", "Price*"]}
        rows={[
          ["Silver 925", "—", "Good", "White (tarnishes)", "$$"],
          ["Gold 585", "14K", "Very good", "Yellow / white / rose", "$$$"],
          ["Gold 750", "18K", "Excellent", "Richer hue", "$$$$"],
          ["Platinum 950", "—", "Highest", "Gray-white, never fades", "$$$$$"],
        ]}
      />
      <P>
        <Strong>14K gold</Strong> is the most popular choice for engagement rings in Europe — great balance of durability and value. For sensitive skin, we recommend <Strong>18K gold</Strong> (fewer alloys, lower allergy risk).
      </P>

      <H2 id="stone">Diamond, moissanite, or colored gemstone?</H2>
      <UL>
        <LI><Strong>Natural diamond</Strong> — hardest stone (10 Mohs), highest prestige, highest price. Graded by 4C (carat, cut, color, clarity).</LI>
        <LI><Strong>Moissanite</Strong> — 9.25 Mohs, more fire than diamond, 3–5× cheaper. Visually identical to the naked eye.</LI>
        <LI><Strong>Sapphire / emerald / ruby</Strong> — color adds character. Blue and pink sapphires are an engagement hit. Emeralds (7.5 Mohs) need a protective setting.</LI>
      </UL>

      <H2 id="timeline">Timeline</H2>
      <UL>
        <LI><Strong>Simple silver ring</Strong> — 1–2 weeks</LI>
        <LI><Strong>Gold with stone, standard casting</Strong> — 2–4 weeks</LI>
        <LI><Strong>Complex multi-stone design</Strong> — 4–6 weeks</LI>
        <LI><Strong>Express (surcharge)</Strong> — from 7 business days</LI>
      </UL>

      <CTABox
        accent="amber"
        title="Design your ring"
        text="Use our jewelry calculator for an instant estimate — or contact us directly."
        href="/jewelry#calculator"
        cta="Open jewelry calculator"
      />
    </>
  );
}

// ======================= DE =======================
function BodyDE() {
  return (
    <>
      <Lead>
        Ein Verlobungsring ist eines der bedeutsamsten Objekte, die Sie je kaufen werden — nicht wegen des Preises, sondern weil er die Geschichte zweier Menschen trägt. Wenn Sie etwas suchen, das Sie nicht im Kaufhaus finden, ist dieser Leitfaden für Sie.
      </Lead>

      <H2 id="kosten">Was kostet ein individueller Verlobungsring?</H2>
      <P>
        Ehrliche Antwort: <Strong>von ca. 180 € bis 5.000 €+</Strong>, abhängig von Metall, Stein und Komplexität. Silber 925 ist am günstigsten, 14K Gold bietet das beste Preis-Leistungs-Verhältnis, 18K Gold und Platin sind Premium.
      </P>
      <Callout accent="amber" title="Tipp">
        Bei AEJaCA erhalten Sie innerhalb von 24 Stunden ein Angebot — unverbindlich. Beschreiben Sie Ihre Idee oder senden Sie ein Inspirationsfoto.
        <br /><A href="/jewelry#calculator">Preis im Schmuckrechner prüfen →</A>
      </Callout>

      <H2 id="prozess">Schritt für Schritt: von der Idee zum fertigen Ring</H2>
      <OL>
        <LI><Strong>Beratung</Strong> — erzählen Sie uns von Ihrer Vision, dem Stil Ihres Partners und Ihrem Budget.</LI>
        <LI><Strong>CAD-Design + 3D-Render</Strong> — fotorealistische Vorschau aus jedem Winkel. Änderungen sind in dieser Phase kostenlos.</LI>
        <LI><Strong>Wachsmodell oder 3D-Druck</Strong> — ein physischer 1:1-Prototyp zum Anfassen.</LI>
        <LI><Strong>Wachsausschmelzguss</Strong> — flüssiges Metall füllt den Hohlraum. Eine 5.000 Jahre alte Technik.</LI>
        <LI><Strong>Handfinish</Strong> — Feilen, Polieren, Texturieren.</LI>
        <LI><Strong>Steinbesatz + Qualitätskontrolle</Strong> — Handbesatz, Lupen-Inspektion, Verpackung und Versand.</LI>
      </OL>

      <H2 id="metall">Metallauswahl</H2>
      <Table
        headers={["Metall", "Karat", "Haltbarkeit", "Farbe", "Preis*"]}
        rows={[
          ["Silber 925", "—", "Gut", "Weiß (läuft an)", "$$"],
          ["Gold 585", "14K", "Sehr gut", "Gelb / Weiß / Rosé", "$$$"],
          ["Gold 750", "18K", "Ausgezeichnet", "Intensiverer Farbton", "$$$$"],
          ["Platin 950", "—", "Höchste", "Grau-weiß, verblasst nie", "$$$$$"],
        ]}
      />

      <H2 id="stein">Diamant, Moissanit oder farbiger Edelstein?</H2>
      <UL>
        <LI><Strong>Natürlicher Diamant</Strong> — härtester Stein (10 Mohs), höchstes Prestige, höchster Preis.</LI>
        <LI><Strong>Moissanit</Strong> — 9,25 Mohs, mehr Feuer als Diamant, 3–5× günstiger. Mit bloßem Auge nicht unterscheidbar.</LI>
        <LI><Strong>Saphir / Smaragd / Rubin</Strong> — Farbe verleiht Charakter. Smaragde (7,5 Mohs) brauchen eine schützende Fassung.</LI>
      </UL>

      <H2 id="zeitrahmen">Zeitrahmen</H2>
      <UL>
        <LI><Strong>Einfacher Silberring</Strong> — 1–2 Wochen</LI>
        <LI><Strong>Gold mit Stein</Strong> — 2–4 Wochen</LI>
        <LI><Strong>Komplexes Multi-Stein-Design</Strong> — 4–6 Wochen</LI>
        <LI><Strong>Express (Aufpreis)</Strong> — ab 7 Werktagen</LI>
      </UL>

      <CTABox
        accent="amber"
        title="Gestalten Sie Ihren Ring"
        text="Nutzen Sie unseren Schmuckrechner für eine sofortige Schätzung — oder kontaktieren Sie uns direkt."
        href="/jewelry#calculator"
        cta="Schmuckrechner öffnen"
      />
    </>
  );
}

export function Body({ lang }) {
  if (lang === "en") return <BodyEN />;
  if (lang === "de") return <BodyDE />;
  return <BodyPL />;
}
