import { H2, P, Lead, UL, LI, Strong, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "projektowanie-ai",
  category: "jewelry",
  accent: "amber",
  publishedAt: "2026-04-20",
  coverImage: "/img/blog/projektowanie-ai.webp",
  readingTime: { pl: 6, en: 5, de: 5 },
  title: {
    pl: "AI w projektowaniu biżuterii — jak wykorzystujemy sztuczną inteligencję",
    en: "AI in Jewelry Design — How We Use Artificial Intelligence",
    de: "KI im Schmuckdesign — Wie wir künstliche Intelligenz einsetzen",
  },
  description: {
    pl: "Jak AI wspomaga projektowanie biżuterii w AEJaCA? Generowanie konceptów, optymalizacja 3D, kalkulacja kosztów. Technologia w służbie rzemiosła.",
    en: "How does AI assist jewelry design at AEJaCA? Concept generation, 3D optimization, cost calculation. Technology serving craftsmanship.",
    de: "Wie unterstützt KI das Schmuckdesign bei AEJaCA? Konzeptgenerierung, 3D-Optimierung, Kalkulation. Technologie im Dienst der Handwerkskunst.",
  },
  keywords: {
    pl: "AI biżuteria, sztuczna inteligencja projektowanie, druk 3D biżuteria, CAD biżuteria, AEJaCA",
    en: "AI jewelry design, artificial intelligence jewelry, 3D printed jewelry, CAD jewelry, AEJaCA",
    de: "KI Schmuckdesign, künstliche Intelligenz Schmuck, 3D-Druck Schmuck, CAD Schmuck, AEJaCA",
  },
  toc: {
    pl: [
      { id: "gdzie", label: "Gdzie stosujemy AI" },
      { id: "proces", label: "Proces projektowy" },
      { id: "granice", label: "Granice AI" },
      { id: "przyszlosc", label: "Przyszłość" },
    ],
    en: [
      { id: "where", label: "Where we use AI" },
      { id: "process", label: "Design process" },
      { id: "limits", label: "AI's limits" },
      { id: "future", label: "The future" },
    ],
    de: [
      { id: "wo", label: "Wo wir KI einsetzen" },
      { id: "prozess", label: "Designprozess" },
      { id: "grenzen", label: "KI-Grenzen" },
      { id: "zukunft", label: "Die Zukunft" },
    ],
  },
  faq: {
    pl: [
      { q: "Czy AI projektuje biżuterię zamiast jubilera?", a: "Nie — AI generuje koncepty i warianty, ale każdy projekt jest weryfikowany i ręcznie dopracowywany przez jubilera. To narzędzie, nie zastępstwo." },
      { q: "Czy mogę poprosić AI o projekt na podstawie mojego opisu?", a: "Tak — opisujesz styl, motyw lub inspirację, a my generujemy kilka wizualizacji do wyboru. Finalny projekt jest zawsze dopracowywany ręcznie." },
      { q: "Czy biżuteria zaprojektowana z AI jest tańsza?", a: "Faza koncepcyjna jest szybsza, co może obniżyć koszty projektu o 10–20%. Produkcja rzemieślnicza kosztuje tyle samo." },
      { q: "Jakich narzędzi AI używacie?", a: "Generatory obrazów do konceptów, algorytmy optymalizacji siatki 3D, oraz nasz własny kalkulator kosztów oparty na AI." },
    ],
    en: [
      { q: "Does AI design jewelry instead of the jeweler?", a: "No — AI generates concepts and variants, but every design is verified and hand-refined by the jeweler. It's a tool, not a replacement." },
      { q: "Can I ask AI to design based on my description?", a: "Yes — describe your style, motif, or inspiration, and we generate several visualizations to choose from. The final design is always hand-refined." },
      { q: "Is AI-assisted jewelry cheaper?", a: "The concept phase is faster, which can reduce design costs by 10–20%. Handcrafted production costs remain the same." },
      { q: "What AI tools do you use?", a: "Image generators for concepts, 3D mesh optimization algorithms, and our own AI-powered cost calculator." },
    ],
    de: [
      { q: "Entwirft KI Schmuck anstelle des Juweliers?", a: "Nein — KI generiert Konzepte und Varianten, aber jedes Design wird vom Juwelier geprüft und von Hand verfeinert. Es ist ein Werkzeug, kein Ersatz." },
      { q: "Kann ich KI bitten, nach meiner Beschreibung zu gestalten?", a: "Ja — beschreiben Sie Stil, Motiv oder Inspiration, und wir generieren mehrere Visualisierungen. Das endgültige Design wird immer von Hand verfeinert." },
      { q: "Ist KI-unterstützter Schmuck günstiger?", a: "Die Konzeptphase ist schneller, was die Designkosten um 10–20 % senken kann. Handwerkliche Produktion kostet gleich." },
      { q: "Welche KI-Tools nutzen Sie?", a: "Bildgeneratoren für Konzepte, 3D-Netz-Optimierungsalgorithmen und unseren eigenen KI-gestützten Kostenkalkulator." },
    ],
  },
  relatedPosts: ["prezenty-personalizowane", "druk-3d-krok-po-kroku"],
};

export function Body({ lang }) {
  const t = (pl, en, de) => (lang === "pl" ? pl : lang === "de" ? de : en);

  return (
    <>
      <Lead>{t(
        "Sztuczna inteligencja nie zastąpi rąk jubilera — ale może je uwolnić od żmudnej pracy koncepcyjnej. Oto jak łączymy technologię z rzemiosłem.",
        "Artificial intelligence won't replace a jeweler's hands — but it can free them from tedious concept work. Here's how we blend technology with craft.",
        "Künstliche Intelligenz ersetzt nicht die Hände des Juweliers — aber sie kann sie von mühsamer Konzeptarbeit befreien. So verbinden wir Technologie mit Handwerk."
      )}</Lead>

      <H2 id={t("gdzie", "where", "wo")}>{t("Gdzie stosujemy AI", "Where We Use AI", "Wo wir KI einsetzen")}</H2>
      <P>{t(
        "AI w AEJaCA pełni trzy funkcje — żadna z nich nie zastępuje ręcznej roboty:",
        "AI at AEJaCA serves three functions — none of them replace handwork:",
        "KI bei AEJaCA erfüllt drei Funktionen — keine davon ersetzt Handarbeit:"
      )}</P>
      <Table
        headers={t(
          ["Zastosowanie", "Co robi AI", "Co robi jubiler"],
          ["Application", "What AI does", "What the jeweler does"],
          ["Anwendung", "Was KI macht", "Was der Juwelier macht"]
        )}
        rows={[
          [t("Koncepty wizualne", "Visual concepts", "Visuelle Konzepte"), t("Generuje 5–10 wariantów z opisu", "Generates 5–10 variants from description", "Generiert 5–10 Varianten aus Beschreibung"), t("Wybiera, modyfikuje, dopracowuje", "Selects, modifies, refines", "Wählt aus, modifiziert, verfeinert")],
          [t("Optymalizacja 3D", "3D optimization", "3D-Optimierung"), t("Naprawia siatkę, sugeruje wsparcia", "Repairs mesh, suggests supports", "Repariert Netz, schlägt Stützen vor"), t("Weryfikuje drukowalność, ręcznie poprawia", "Verifies printability, hand-fixes", "Prüft Druckbarkeit, korrigiert von Hand")],
          [t("Kalkulacja kosztów", "Cost calculation", "Kostenkalkulation"), t("Wylicza materiał, czas, cenę", "Calculates material, time, price", "Berechnet Material, Zeit, Preis"), t("Weryfikuje złożoność, ustala finał", "Verifies complexity, sets final price", "Prüft Komplexität, legt Endpreis fest")],
        ]}
      />

      <H2 id={t("proces", "process", "prozess")}>{t("Proces projektowy z AI", "AI-Assisted Design Process", "KI-gestützter Designprozess")}</H2>
      <P>{t(
        "Typowy projekt biżuterii z wykorzystaniem AI wygląda tak:",
        "A typical AI-assisted jewelry design looks like this:",
        "Ein typisches KI-gestütztes Schmuckdesign sieht so aus:"
      )}</P>
      <UL>
        <LI><Strong>1. {t("Inspiracja", "Inspiration", "Inspiration")}</Strong> — {t("klient opisuje styl, pokazuje inspiracje, określa budżet", "client describes style, shows references, sets budget", "Kunde beschreibt Stil, zeigt Referenzen, legt Budget fest")}</LI>
        <LI><Strong>2. {t("Generowanie konceptów", "Concept generation", "Konzeptgenerierung")}</Strong> — {t("AI tworzy 5–10 wizualizacji na podstawie opisu (minuty zamiast godzin)", "AI creates 5–10 visualizations from description (minutes instead of hours)", "KI erstellt 5–10 Visualisierungen aus Beschreibung (Minuten statt Stunden)")}</LI>
        <LI><Strong>3. {t("Selekcja i modyfikacja", "Selection & modification", "Auswahl & Modifikation")}</Strong> — {t("klient wybiera kierunek, jubiler ręcznie dopracowuje projekt w CAD", "client picks direction, jeweler hand-refines design in CAD", "Kunde wählt Richtung, Juwelier verfeinert Design in CAD von Hand")}</LI>
        <LI><Strong>4. {t("Model 3D / woskówka", "3D model / wax print", "3D-Modell / Wachsmodell")}</Strong> — {t("druk 3D prototypu do przymiarki (opcjonalnie)", "3D print prototype for fitting (optional)", "3D-Druck-Prototyp zur Anprobe (optional)")}</LI>
        <LI><Strong>5. {t("Realizacja", "Production", "Produktion")}</Strong> — {t("ręczne wykonanie w srebrze/złocie, osadzenie kamieni, polerowanie", "handmade in silver/gold, stone setting, polishing", "Handarbeit in Silber/Gold, Steinfassung, Politur")}</LI>
      </UL>
      <Callout accent="amber" title={t("Efekt", "Result", "Ergebnis")}>
        {t(
          "Faza koncepcyjna, która kiedyś zajmowała 2–3 spotkania, teraz trwa jedno — z lepszym zrozumieniem wizji klienta.",
          "The concept phase that used to take 2–3 meetings now takes one — with better understanding of the client's vision.",
          "Die Konzeptphase, die früher 2–3 Treffen dauerte, braucht jetzt nur eines — mit besserem Verständnis der Kundenvision."
        )}
      </Callout>

      <H2 id={t("granice", "limits", "grenzen")}>{t("Granice AI w jubilerstwie", "AI's Limits in Jewelry", "KI-Grenzen im Schmuckbereich")}</H2>
      <P>{t(
        "Uczciwie — AI ma realne ograniczenia, które ludzie często pomijają:",
        "To be honest — AI has real limitations that people often overlook:",
        "Ehrlich gesagt — KI hat reale Einschränkungen, die oft übersehen werden:"
      )}</P>
      <UL>
        <LI><Strong>{t("Fizyka materiału", "Material physics", "Materialphysik")}</Strong> — {t("AI nie wie, jak metal się zachowuje pod piłką, lutownicą i palnikiem", "AI doesn't know how metal behaves under a saw, iron, and torch", "KI weiß nicht, wie Metall sich unter Säge, Lötkolben und Brenner verhält")}</LI>
        <LI><Strong>{t("Noszalność", "Wearability", "Tragbarkeit")}</Strong> — {t("piękny render może być niewygodny w noszeniu lub zbyt delikatny", "a beautiful render may be uncomfortable to wear or too fragile", "ein schöner Render kann unbequem oder zu zerbrechlich sein")}</LI>
        <LI><Strong>{t("Osadzenie kamieni", "Stone setting", "Steinfassung")}</Strong> — {t("AI generuje wizualnie piękne oprawy, ale nie zawsze wykonalne technicznie", "AI generates visually stunning settings, but not always technically feasible", "KI generiert visuell beeindruckende Fassungen, aber nicht immer technisch machbar")}</LI>
        <LI><Strong>{t("Unikalność", "Uniqueness", "Einzigartigkeit")}</Strong> — {t("AI trenowana na istniejących wzorach — prawdziwa innowacja wymaga ludzkiej kreatywności", "AI trained on existing patterns — true innovation requires human creativity", "KI auf bestehenden Mustern trainiert — echte Innovation braucht menschliche Kreativität")}</LI>
      </UL>

      <H2 id={t("przyszlosc", "future", "zukunft")}>{t("Przyszłość", "The Future", "Die Zukunft")}</H2>
      <P>{t(
        "Widzimy AI jako partnera, nie rywala. W najbliższych latach spodziewamy się: generowania modeli 3D (nie tylko obrazów), lepszej symulacji noszenia, i AI-wspieranej personalizacji masowej. Ale ręce jubilera pozostaną niezastąpione — bo to one nadają biżuterii duszę.",
        "We see AI as a partner, not a rival. In coming years we expect: 3D model generation (not just images), better wear simulation, and AI-powered mass personalization. But a jeweler's hands will remain irreplaceable — they give jewelry its soul.",
        "Wir sehen KI als Partner, nicht als Rivalen. In den kommenden Jahren erwarten wir: 3D-Modellgenerierung (nicht nur Bilder), bessere Tragesimulation und KI-gestützte Massenpersonalisierung. Aber die Hände eines Juweliers bleiben unersetzlich — sie geben Schmuck seine Seele."
      )}</P>

      <CTABox
        accent="amber"
        title={t("Zaprojektuj z nami", "Design with Us", "Gestalten Sie mit uns")}
        text={t(
          "Opisz swój pomysł — wygenerujemy koncepty i przygotujemy wycenę. Technologia + rzemiosło = Twoja unikalna biżuteria.",
          "Describe your idea — we'll generate concepts and prepare a quote. Technology + craft = your unique jewelry.",
          "Beschreiben Sie Ihre Idee — wir generieren Konzepte und erstellen ein Angebot. Technologie + Handwerk = Ihr einzigartiger Schmuck."
        )}
        href="/contact"
        cta={t("Napisz do nas", "Contact us", "Kontaktieren Sie uns")}
      />
    </>
  );
}
