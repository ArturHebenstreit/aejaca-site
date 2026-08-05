import { H2, H3, P, Lead, OL, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./pierscionek-zareczynowy.meta.js";

// ======================= PL =======================
function BodyPL() {
  return (
    <>
      <Lead>
        Pierścionek zaręczynowy to jeden z najważniejszych przedmiotów, jakie kiedykolwiek kupisz.
        Nie dlatego, że jest drogi - ale dlatego, że ma nosić w sobie historię dwojga ludzi.
        Jeśli szukasz czegoś, czego nie znajdziesz na wystawie w galerii handlowej - ten przewodnik jest dla Ciebie.
      </Lead>

      <H2 id="koszt">Ile kosztuje pierścionek zaręczynowy na zamówienie?</H2>
      <P>
        Pytanie, które zadaje każdy. Szczera odpowiedź: <Strong>od ~800 zł do 20 000 zł+</Strong>, w zależności od trzech zmiennych:
      </P>
      <UL>
        <LI><Strong>Metal</Strong> - <A href="/glossary/srebro-925">srebro 925</A> jest najtańsze (~800–2 000 zł), złoto 585 (14K) to środek (~2 500–8 000 zł), złoto 750 (18K) i platyna to segment premium (~5 000–20 000 zł).</LI>
        <LI><Strong>Kamień</Strong> - <A href="/glossary/moissanit">moissanit</A> wygląda jak diament, ale kosztuje 3–5× mniej. Naturalny diament 0.5 ct to ~3 000–6 000 zł. Szafiry i szmaragdy mają własną skalę cenową.</LI>
        <LI><Strong>Robocizna i złożoność</Strong> - prosty solitaire to mniej pracy niż ażurowy vintage z 12 kamieniami bocznymi. Odlew metodą traconego wosku + ręczne osadzenie = najwyższy koszt ręcznej pracy.</LI>
      </UL>
      <Callout accent="amber" title="Wskazówka">
        W AEJaCA wycenę dostajesz w ciągu 24h - bez zobowiązań. Wystarczy opisać pomysł lub przesłać inspirację.
        <br /><A href="/jewelry#calculator">Sprawdź orientacyjną cenę w kalkulatorze biżuterii →</A>
      </Callout>

      <H2 id="proces">Jak wygląda proces od pomysłu do gotowego pierścionka?</H2>
      <P>
        Każdy pierścionek w AEJaCA przechodzi przez 6 etapów. Nie musisz znać się na złotnictwie - przeprowadzimy Cię przez każdy krok.
      </P>
      <OL>
        <LI><Strong>Konsultacja</Strong> - opowiadasz o swojej wizji, stylu życia partnerki/partnera, budżecie. Możesz przesłać szkic, zdjęcie inspiracji albo po prostu opisać słowami.</LI>
        <LI><Strong>Projekt <A href="/glossary/cad">CAD</A> + render 3D</Strong> - tworzymy precyzyjny model komputerowy. Widzisz pierścionek z każdego kąta na fotorealistycznym renderze. Zmiany na tym etapie są bezpłatne.</LI>
        <LI><Strong>Model woskowy lub druk 3D</Strong> - fizyczny prototyp w skali 1:1. Możesz go trzymać w ręce i sprawdzić proporcje.</LI>
        <LI><Strong>Odlew</Strong> - model woskowy jest zamykany w ceramicznej formie, wosk wypala się, a płynny metal (srebro lub złoto) wypełnia pustą przestrzeń. Klasyczna metoda „traconego wosku" używana od 5000 lat.</LI>
        <LI><Strong>Ręczna obróbka</Strong> - odlany pierścionek jest piłowany, szlifowany, polerowany pastami. Opcjonalnie: tekstury, oksydacja, satynowanie.</LI>
        <LI><Strong>Osadzenie kamienia + kontrola jakości</Strong> - kamień osadzany ręcznie (krapna, opaska lub kanał). Inspekcja pod lupą. Pakowanie i wysyłka.</LI>
      </OL>

      <H2 id="metal">Jak dobrać metal - srebro 925, złoto 585 czy 750?</H2>
      <Table
        headers={["Metal", "Karat", "Trwałość", "Kolor", "Cena*"]}
        rows={[
          ["Srebro 925", " - ", "Dobra (twardnie z czasem)", "Biały (ciemnieje)", "$$"],
          ["Złoto 585", "14K", "Bardzo dobra", "Żółte / białe / różowe", "$$$"],
          ["Złoto 750", "18K", "Doskonała", "Intensywniejszy kolor", "$$$$"],
          ["Platyna 950", " - ", "Najwyższa", "Szary-biały, nie blednie", "$$$$$"],
        ]}
      />
      <P>
        <Strong>Złoto 585 (14K)</Strong> to najpopularniejszy wybór na pierścionki zaręczynowe w Polsce - łączy trwałość z rozsądną ceną. Dla osób z wrażliwą skórą rekomendujemy <Strong>złoto 750</Strong> (mniej stopów, mniejsze ryzyko alergii).
      </P>

      <H2 id="kamien">Naturalny diament, moissanit czy kamień szlachetny?</H2>
      <P>
        Diament to klasyka, ale nie jedyna opcja - i nie zawsze najlepsza:
      </P>
      <UL>
        <LI><Strong>Diament naturalny</Strong> - najtwardszy (10 Mohsa), najwyższy prestiż, najwyższa cena. Wycena wg 4C (carat, cut, color, clarity).</LI>
        <LI><Strong>Moissanit</Strong> - twardość 9.25 Mohsa, więcej ognia (dyspers ja) niż diament, 3–5× tańszy. Wizualnie nieodróżnialny gołym okiem.</LI>
        <LI><Strong>Szafir / szmaragd / rubin</Strong> - kolor dodaje charakteru. Szafiry niebieskie i różowe to hit zaręczynowy (jak pierścionek księżnej Diany / Kate Middleton). Szmaragdy są delikatniejsze (7.5 Mohsa) - wymagają ochronnej oprawy.</LI>
      </UL>
      <P>
        W AEJaCA dobieramy kamienie indywidualnie - widzisz zdjęcia konkretnego egzemplarza, nie stockowe fotki.
      </P>

      <H2 id="rozmiar">Jak poznać rozmiar, gdy pierścionek ma być niespodzianką</H2>
      <P>
        Przy zaręczynach to jest realny problem, bo zapytać wprost nie można. Trzy sposoby, które działają: pożycz na jeden wieczór pierścionek, który ona nosi na tym samym palcu, i połóż go na <A href="/toolsjewelry/ring-sizer/">tabeli kółek z naszej miarki do wydruku</A>. Zapytaj kogoś z rodziny albo przyjaciółkę, bo bardzo często ktoś ten rozmiar zna. Albo zamów rozmiar pośredni, czyli 54 lub 56, i zaplanuj korektę po oświadczynach.
      </P>
      <P>
        Ostatni wariant jest mniej ryzykowny, niż się wydaje. Zmiana rozmiaru o jeden lub dwa numery to u nas standardowa robota, pod warunkiem że pierścionek nie ma kamieni osadzonych wokół całego obwodu ani grawera w środku. Dlatego <Strong>grawer wykonujemy po oświadczynach</Strong>, kiedy rozmiar jest już pewny. Jeżeli rozmiar znasz, ale w innym systemie, przelicz go w <A href="/toolsjewelry/ring-size/">konwerterze EU, US, UK i JP</A>.
      </P>

      <H2 id="czas">Ile trwa realizacja?</H2>
      <UL>
        <LI><Strong>Prosty pierścionek srebrny</Strong> - 1–2 tygodnie</LI>
        <LI><Strong>Złoto z kamieniem, standardowy odlew</Strong> - 2–4 tygodnie</LI>
        <LI><Strong>Kompleksowy projekt z wieloma kamieniami</Strong> - 4–6 tygodni</LI>
        <LI><Strong>Ekspres (za dopłatą)</Strong> - od 7 dni roboczych</LI>
      </UL>
      <P>
        Termin liczymy od momentu zatwierdzenia projektu CAD. Etap projektowania (konsultacja + render) trwa zazwyczaj 2–5 dni.
      </P>

      <CTABox
        accent="amber"
        title="Zaprojektuj swój pierścionek"
        text="Użyj naszego kalkulatora biżuterii, żeby zobaczyć orientacyjną cenę - albo skontaktuj się bezpośrednio."
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
        An engagement ring is one of the most meaningful objects you'll ever buy - not because of its price tag, but because it carries the story of two people. If you're looking for something you won't find in a mall display case, this guide is for you.
      </Lead>

      <H2 id="cost">How much does a custom engagement ring cost?</H2>
      <P>
        Honest answer: <Strong>from ~€180 to €5,000+</Strong>, depending on three variables: metal, stone, and complexity. <A href="/glossary/srebro-925">Silver 925</A> is the most accessible, 14K gold hits the sweet spot, 18K gold and platinum are premium. <A href="/glossary/moissanit">Moissanite</A> looks like diamond but costs 3–5× less.
      </P>
      <Callout accent="amber" title="Tip">
        At AEJaCA, you'll receive a detailed quote within 24h - no commitment. Just describe your idea or send an inspiration photo.
        <br /><A href="/jewelry#calculator">Check approximate pricing in our jewelry calculator →</A>
      </Callout>

      <H2 id="process">Step-by-step: from idea to finished ring</H2>
      <OL>
        <LI><Strong>Consultation</Strong> - tell us about your vision, your partner's style, and your budget.</LI>
        <LI><Strong><A href="/glossary/cad">CAD</A> design + 3D render</Strong> - a photorealistic preview from every angle. Changes are free at this stage.</LI>
        <LI><Strong>Wax model or 3D print</Strong> - a 1:1 physical prototype you can hold.</LI>
        <LI><Strong>Lost-wax casting</Strong> - molten metal fills the cavity left by the burned-out wax. A 5,000-year-old technique.</LI>
        <LI><Strong>Hand finishing</Strong> - filing, polishing, texturing. Optional oxidation or satin finish.</LI>
        <LI><Strong>Stone setting + QC</Strong> - hand-set prong, bezel, or channel mount. Loupe inspection. Packaged and shipped.</LI>
      </OL>

      <H2 id="metal">Choosing your metal</H2>
      <Table
        headers={["Metal", "Karat", "Durability", "Color", "Price*"]}
        rows={[
          ["Silver 925", " - ", "Good", "White (tarnishes)", "$$"],
          ["Gold 585", "14K", "Very good", "Yellow / white / rose", "$$$"],
          ["Gold 750", "18K", "Excellent", "Richer hue", "$$$$"],
          ["Platinum 950", " - ", "Highest", "Gray-white, never fades", "$$$$$"],
        ]}
      />
      <P>
        <Strong>14K gold</Strong> is the most popular choice for engagement rings in Europe - great balance of durability and value. For sensitive skin, we recommend <Strong>18K gold</Strong> (fewer alloys, lower allergy risk).
      </P>

      <H2 id="stone">Diamond, moissanite, or colored gemstone?</H2>
      <UL>
        <LI><Strong>Natural diamond</Strong> - hardest stone (10 Mohs), highest prestige, highest price. Graded by 4C (carat, cut, color, clarity).</LI>
        <LI><Strong><A href="/glossary/moissanit">Moissanite</A></Strong> - 9.25 Mohs, more fire than diamond, 3–5× cheaper. Visually identical to the naked eye.</LI>
        <LI><Strong>Sapphire / emerald / ruby</Strong> - color adds character. Blue and pink sapphires are an engagement hit. Emeralds (7.5 Mohs) need a protective setting.</LI>
      </UL>

      <H2 id="sizing">Finding the size when the ring is a surprise</H2>
      <P>
        With a proposal this is a real problem, because you cannot simply ask. Three approaches that work: borrow a ring she wears on the same finger for one evening and lay it on the <A href="/toolsjewelry/ring-sizer/">circle chart from our printable sizer</A>. Ask a relative or a close friend, since someone usually knows. Or order a middle size, 54 or 56, and plan the adjustment after the proposal.
      </P>
      <P>
        That last option is less risky than it sounds. Resizing by one or two sizes is routine work for us, as long as the ring has no stones set all around and no inside engraving. That is why we <Strong>engrave after the proposal</Strong>, once the size is certain. If you know the size but in another system, convert it in the <A href="/toolsjewelry/ring-size/">EU, US, UK and JP converter</A>.
      </P>

      <H2 id="timeline">Timeline</H2>
      <UL>
        <LI><Strong>Simple silver ring</Strong> - 1–2 weeks</LI>
        <LI><Strong>Gold with stone, standard casting</Strong> - 2–4 weeks</LI>
        <LI><Strong>Complex multi-stone design</Strong> - 4–6 weeks</LI>
        <LI><Strong>Express (surcharge)</Strong> - from 7 business days</LI>
      </UL>

      <CTABox
        accent="amber"
        title="Design your ring"
        text="Use our jewelry calculator for an instant estimate - or contact us directly."
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
        Ein Verlobungsring ist eines der bedeutsamsten Objekte, die Sie je kaufen werden - nicht wegen des Preises, sondern weil er die Geschichte zweier Menschen trägt. Wenn Sie etwas suchen, das Sie nicht im Kaufhaus finden, ist dieser Leitfaden für Sie.
      </Lead>

      <H2 id="kosten">Was kostet ein individueller Verlobungsring?</H2>
      <P>
        Ehrliche Antwort: <Strong>von ca. 180 € bis 5.000 €+</Strong>, abhängig von Metall, Stein und Komplexität. <A href="/glossary/srebro-925">Silber 925</A> ist am günstigsten, 14K Gold bietet das beste Preis-Leistungs-Verhältnis, 18K Gold und Platin sind Premium.
      </P>
      <Callout accent="amber" title="Tipp">
        Bei AEJaCA erhalten Sie innerhalb von 24 Stunden ein Angebot - unverbindlich. Beschreiben Sie Ihre Idee oder senden Sie ein Inspirationsfoto.
        <br /><A href="/jewelry#calculator">Preis im Schmuckrechner prüfen →</A>
      </Callout>

      <H2 id="prozess">Schritt für Schritt: von der Idee zum fertigen Ring</H2>
      <OL>
        <LI><Strong>Beratung</Strong> - erzählen Sie uns von Ihrer Vision, dem Stil Ihres Partners und Ihrem Budget.</LI>
        <LI><Strong><A href="/glossary/cad">CAD</A>-Design + 3D-Render</Strong> - fotorealistische Vorschau aus jedem Winkel. Änderungen sind in dieser Phase kostenlos.</LI>
        <LI><Strong>Wachsmodell oder 3D-Druck</Strong> - ein physischer 1:1-Prototyp zum Anfassen.</LI>
        <LI><Strong>Wachsausschmelzguss</Strong> - flüssiges Metall füllt den Hohlraum. Eine 5.000 Jahre alte Technik.</LI>
        <LI><Strong>Handfinish</Strong> - Feilen, Polieren, Texturieren.</LI>
        <LI><Strong>Steinbesatz + Qualitätskontrolle</Strong> - Handbesatz, Lupen-Inspektion, Verpackung und Versand.</LI>
      </OL>

      <H2 id="metall">Metallauswahl</H2>
      <Table
        headers={["Metall", "Karat", "Haltbarkeit", "Farbe", "Preis*"]}
        rows={[
          ["Silber 925", " - ", "Gut", "Weiß (läuft an)", "$$"],
          ["Gold 585", "14K", "Sehr gut", "Gelb / Weiß / Rosé", "$$$"],
          ["Gold 750", "18K", "Ausgezeichnet", "Intensiverer Farbton", "$$$$"],
          ["Platin 950", " - ", "Höchste", "Grau-weiß, verblasst nie", "$$$$$"],
        ]}
      />

      <H2 id="stein">Diamant, Moissanit oder farbiger Edelstein?</H2>
      <UL>
        <LI><Strong>Natürlicher Diamant</Strong> - härtester Stein (10 Mohs), höchstes Prestige, höchster Preis.</LI>
        <LI><Strong><A href="/glossary/moissanit">Moissanit</A></Strong> - 9,25 Mohs, mehr Feuer als Diamant, 3–5× günstiger. Mit bloßem Auge nicht unterscheidbar.</LI>
        <LI><Strong>Saphir / Smaragd / Rubin</Strong> - Farbe verleiht Charakter. Smaragde (7,5 Mohs) brauchen eine schützende Fassung.</LI>
      </UL>

      <H2 id="groesse">Die Größe herausfinden, wenn der Ring eine Überraschung ist</H2>
      <P>
        Bei einem Antrag ist das ein echtes Problem, denn fragen kann man nicht. Drei Wege, die funktionieren: leihen Sie sich für einen Abend einen Ring, den sie am selben Finger trägt, und legen Sie ihn auf die <A href="/toolsjewelry/ring-sizer/">Kreistabelle unseres Ringmaßbands zum Ausdrucken</A>. Fragen Sie jemanden aus der Familie oder eine enge Freundin, meistens weiß es jemand. Oder bestellen Sie eine mittlere Größe, 54 oder 56, und planen Sie die Anpassung nach dem Antrag ein.
      </P>
      <P>
        Die letzte Variante ist weniger riskant, als sie klingt. Eine Änderung um ein bis zwei Größen ist für uns Routine, solange der Ring keine rundum gefassten Steine und keine Innengravur hat. Deshalb <Strong>gravieren wir nach dem Antrag</Strong>, wenn die Größe feststeht. Kennen Sie die Größe, aber in einem anderen System, rechnen Sie sie im <A href="/toolsjewelry/ring-size/">EU-, US-, UK- und JP-Konverter</A> um.
      </P>

      <H2 id="zeitrahmen">Zeitrahmen</H2>
      <UL>
        <LI><Strong>Einfacher Silberring</Strong> - 1–2 Wochen</LI>
        <LI><Strong>Gold mit Stein</Strong> - 2–4 Wochen</LI>
        <LI><Strong>Komplexes Multi-Stein-Design</Strong> - 4–6 Wochen</LI>
        <LI><Strong>Express (Aufpreis)</Strong> - ab 7 Werktagen</LI>
      </UL>

      <CTABox
        accent="amber"
        title="Gestalten Sie Ihren Ring"
        text="Nutzen Sie unseren Schmuckrechner für eine sofortige Schätzung - oder kontaktieren Sie uns direkt."
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
