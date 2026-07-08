import { H2, P, Lead, UL, LI, Strong, Callout, Table, CTABox, A } from "../../components/blog/Prose.jsx";

export { meta } from "./projektowanie-ai.meta.js";

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
        <LI><Strong>3. {t("Selekcja i modyfikacja", "Selection & modification", "Auswahl & Modifikation")}</Strong> — {t(<>klient wybiera kierunek, jubiler ręcznie dopracowuje projekt w <A href="/glossary/cad">CAD</A></>, <>client picks direction, jeweler hand-refines design in <A href="/glossary/cad">CAD</A></>, <>Kunde wählt Richtung, Juwelier verfeinert Design in <A href="/glossary/cad">CAD</A> von Hand</>)}</LI>
        <LI><Strong>4. {t("Model 3D / woskówka", "3D model / wax print", "3D-Modell / Wachsmodell")}</Strong> — {t(<><A href="/glossary/druk-3d-fdm">druk 3D</A> prototypu do przymiarki (opcjonalnie)</>, <><A href="/glossary/druk-3d-fdm">3D print</A> prototype for fitting (optional)</>, <><A href="/glossary/druk-3d-fdm">3D-Druck</A>-Prototyp zur Anprobe (optional)</>)}</LI>
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
        <>Widzimy AI jako partnera, nie rywala. W najbliższych latach spodziewamy się: generowania modeli 3D (nie tylko obrazów), lepszej symulacji noszenia, i AI-wspieranej <A href="/glossary/personalizacja">personalizacji</A> masowej. Ale ręce jubilera pozostaną niezastąpione — bo to one nadają biżuterii duszę.</>,
        <>We see AI as a partner, not a rival. In coming years we expect: 3D model generation (not just images), better wear simulation, and AI-powered mass <A href="/glossary/personalizacja">personalization</A>. But a jeweler's hands will remain irreplaceable — they give jewelry its soul.</>,
        <>Wir sehen KI als Partner, nicht als Rivalen. In den kommenden Jahren erwarten wir: 3D-Modellgenerierung (nicht nur Bilder), bessere Tragesimulation und KI-gestützte Massen<A href="/glossary/personalizacja">personalisierung</A>. Aber die Hände eines Juweliers bleiben unersetzlich — sie geben Schmuck seine Seele.</>
      )}</P>

      <CTABox
        accent="amber"
        title={t("Zaprojektuj z nami", "Design with Us", "Gestalten Sie mit uns")}
        text={t(
          "Opisz swój pomysł — wygenerujemy koncepty i przygotujemy wycenę. Technologia + rzemiosło = Twoja unikalna biżuteria.",
          "Describe your idea — we'll generate concepts and prepare a quote. Technology + craft = your unique jewelry.",
          "Beschreiben Sie Ihre Idee — wir generieren Konzepte und erstellen ein Angebot. Technologie + Handwerk = Ihr einzigartiger Schmuck."
        )}
        href="/contact/"
        cta={t("Napisz do nas", "Contact us", "Kontaktieren Sie uns")}
      />
    </>
  );
}
