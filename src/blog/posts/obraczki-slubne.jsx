import { H2, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./obraczki-slubne.meta.js";

export function Body({ lang }) {
  const t = (pl, en, de) => (lang === "pl" ? pl : lang === "de" ? de : en);

  return (
    <>
      <Lead>{t(
        "Obrączki to jedyna biżuteria, którą nosisz codziennie przez resztę życia. Warto wybrać je mądrze — i z przyjemnością.",
        "Wedding bands are the one piece of jewelry you wear every day for the rest of your life. It's worth choosing them wisely — and with joy.",
        "Eheringe sind das einzige Schmuckstück, das man jeden Tag für den Rest des Lebens trägt. Es lohnt sich, sie klug — und mit Freude — auszuwählen."
      )}</Lead>

      <H2 id={t("metale", "metals", "metalle")}>{t("Wybór metalu", "Choosing the Metal", "Metallwahl")}</H2>
      <P>{t(
        <>Metal obrączki wpływa na trwałość, kolor i cenę. <A href="/glossary/srebro-925">Srebro 925</A> to najprzystępniejsza opcja, złoto 14k i 18k to wybór na całe życie. Oto najczęściej wybierane opcje:</>,
        <>The metal affects durability, color, and price. <A href="/glossary/srebro-925">Silver 925</A> is the most accessible option; 14k and 18k gold are lifelong choices. Here are the most popular options:</>,
        <>Das Metall beeinflusst Haltbarkeit, Farbe und Preis. <A href="/glossary/srebro-925">Silber 925</A> ist die zugänglichste Option; 14k und 18k Gold sind lebenslange Entscheidungen. Hier die beliebtesten Optionen:</>
      )}</P>
      <Table
        headers={t(
          ["Metal", "Kolor", "Trwałość", "Cena za parę od"],
          ["Metal", "Color", "Durability", "Pair price from"],
          ["Metall", "Farbe", "Haltbarkeit", "Paarpreis ab"]
        )}
        rows={[
          [t("Srebro 925", "Silver 925", "Silber 925"), t("Jasny biały", "Bright white", "Helles Weiß"), t("Dobra (wymaga polerowania)", "Good (needs polishing)", "Gut (braucht Politur)"), t("690 zł", "€160", "160 €")],
          [t("Złoto 14k żółte", "14k Yellow Gold", "14k Gelbgold"), t("Ciepły złoty", "Warm gold", "Warmes Gold"), t("Bardzo dobra", "Very good", "Sehr gut"), t("2580 zł", "€600", "600 €")],
          [t("Złoto 14k białe", "14k White Gold", "14k Weißgold"), t("Chłodny biały", "Cool white", "Kühles Weiß"), t("Bardzo dobra", "Very good", "Sehr gut"), t("2800 zł", "€650", "650 €")],
          [t("Złoto 18k", "18k Gold", "18k Gold"), t("Bogaty, intensywny", "Rich, intense", "Satt, intensiv"), t("Dobra", "Good", "Gut"), t("3870 zł", "€900", "900 €")],
          [t("Złoto różowe 14k", "14k Rose Gold", "14k Roségold"), t("Różowo-miedziany", "Pinkish copper", "Rosa-Kupfer"), t("Bardzo dobra", "Very good", "Sehr gut"), t("2670 zł", "€620", "620 €")],
        ]}
      />

      <H2 id={t("profile", "profiles", "profile")}>{t("Profile obrączek", "Ring Profiles", "Ringprofile")}</H2>
      <P>{t(
        "Profil to przekrój obrączki — decyduje o komforcie noszenia i wyglądzie na palcu.",
        "The profile is the ring's cross-section — it determines comfort and how it looks on your finger.",
        "Das Profil ist der Querschnitt des Rings — es bestimmt den Tragekomfort und das Aussehen am Finger."
      )}</P>
      <UL>
        <LI><Strong>{t("Klasyczny (D-shape)", "Classic (D-shape)", "Klassisch (D-Form)")}</Strong> — {t("zaokrąglony wewnątrz i na zewnątrz. Najwygodniejszy, ponadczasowy.", "rounded inside and out. Most comfortable, timeless.", "innen und außen gerundet. Am bequemsten, zeitlos.")}</LI>
        <LI><Strong>{t("Płaski (Flat)", "Flat", "Flach")}</Strong> — {t("nowoczesny, minimalistyczny. Lepiej wygląda w szerszych wariantach.", "modern, minimalist. Looks best in wider variants.", "modern, minimalistisch. Sieht in breiteren Varianten besser aus.")}</LI>
        <LI><Strong>{t("Comfort Fit", "Comfort Fit", "Comfort Fit")}</Strong> — {t("zaokrąglony wewnątrz, płaski na zewnątrz. Łatwo się zakłada i zdejmuje.", "rounded inside, flat outside. Easy to put on and take off.", "innen gerundet, außen flach. Leicht an- und abzuziehen.")}</LI>
        <LI><Strong>{t("Court (beczułka)", "Court (barrel)", "Court (Fass)")}</Strong> — {t("podwójnie zaokrąglony. Najwygodniejszy dla szerokich obrączek.", "double rounded. Most comfortable for wide bands.", "doppelt gerundet. Am bequemsten für breite Ringe.")}</LI>
      </UL>
      <Callout accent="amber" title={t("Wskazówka", "Tip", "Tipp")}>
        {t(
          "Dla obrączek szerokich (>5mm) zalecamy Comfort Fit — różnica w noszeniu jest ogromna.",
          "For wide bands (>5mm) we recommend Comfort Fit — the difference in wearability is dramatic.",
          "Für breite Ringe (>5mm) empfehlen wir Comfort Fit — der Unterschied beim Tragen ist enorm."
        )}
      </Callout>

      <H2 id={t("wykonczenia", "finishes", "oberflaechen")}>{t("Wykończenia", "Finishes", "Oberflächen")}</H2>
      <P>{t(
        "Wykończenie powierzchni zmienia charakter obrączki bez zmiany metalu:",
        "The surface finish changes the ring's character without changing the metal:",
        "Die Oberflächenbearbeitung verändert den Charakter des Rings ohne das Metall zu wechseln:"
      )}</P>
      <UL>
        <LI><Strong>{t("Polerowane (lustrzane)", "Polished (mirror)", "Poliert (Spiegel)")}</Strong> — {t("klasyczny blask, pokazuje każdą rysę", "classic shine, shows every scratch", "klassischer Glanz, zeigt jeden Kratzer")}</LI>
        <LI><Strong>{t("Satynowe (matowe)", "Satin (matte)", "Satiniert (matt)")}</Strong> — {t("delikatne, nowoczesne, ukrywa drobne rysy", "subtle, modern, hides minor scratches", "dezent, modern, verbirgt kleine Kratzer")}</LI>
        <LI><Strong>{t("Szczotkowane", "Brushed", "Gebürstet")}</Strong> — {t("widoczne linie — industrialny, męski charakter", "visible lines — industrial, masculine feel", "sichtbare Linien — industrieller, maskuliner Charakter")}</LI>
        <LI><Strong>{t("Młotkowane (hammered)", "Hammered", "Gehämmert")}</Strong> — {t("ręczna tekstura, każda para unikalna", "hand-textured, every pair unique", "handstrukturiert, jedes Paar ein Unikat")}</LI>
      </UL>

      <H2 id={t("ceny", "pricing", "preise")}>{t("Ceny", "Pricing", "Preise")}</H2>
      <Table
        headers={t(
          ["Konfiguracja", "Cena za parę", "Czas realizacji"],
          ["Configuration", "Pair price", "Turnaround"],
          ["Konfiguration", "Paarpreis", "Lieferzeit"]
        )}
        rows={[
          [t("Srebro 925, klasyczne 4mm", "Silver 925, classic 4mm", "Silber 925, klassisch 4mm"), t("od 690 zł", "from €160", "ab 160 €"), t("2–3 tygodnie", "2–3 weeks", "2–3 Wochen")],
          [t("Złoto 14k, comfort fit 5mm", "14k Gold, comfort fit 5mm", "14k Gold, Comfort Fit 5mm"), t("od 2580 zł", "from €600", "ab 600 €"), t("3–4 tygodnie", "3–4 weeks", "3–4 Wochen")],
          [t("Złoto 18k, z diamentami", "18k Gold, with diamonds", "18k Gold, mit Diamanten"), t("od 5160 zł", "from €1,200", "ab 1.200 €"), t("4–6 tygodni", "4–6 weeks", "4–6 Wochen")],
          [t("Mieszane (złoto + srebro)", "Mixed (gold + silver)", "Gemischt (Gold + Silber)"), t("od 1720 zł", "from €400", "ab 400 €"), t("3–5 tygodni", "3–5 weeks", "3–5 Wochen")],
        ]}
      />

      <H2 id={t("proces", "process", "prozess")}>{t("Proces zamówienia", "Order Process", "Bestellprozess")}</H2>
      <P>{t(
        "Zamawianie obrączek w AEJaCA to 5 kroków:",
        "Ordering wedding bands at AEJaCA is a 5-step process:",
        "Die Bestellung von Eheringen bei AEJaCA umfasst 5 Schritte:"
      )}</P>
      <UL>
        <LI><Strong>1.</Strong> {t("Konsultacja — omawiamy metal, profil, wykończenie i budżet", "Consultation — we discuss metal, profile, finish, and budget", "Beratung — wir besprechen Metall, Profil, Oberfläche und Budget")}</LI>
        <LI><Strong>2.</Strong> {t("Wycena — otrzymujesz dokładną cenę (lub użyj kalkulatora online)", "Quote — you receive an exact price (or use the online calculator)", "Angebot — Sie erhalten einen genauen Preis (oder nutzen den Online-Kalkulator)")}</LI>
        <LI><Strong>3.</Strong> {t(<>Produkcja — ręczne formowanie, lutowanie, wykańczanie. Dla modeli <A href="/glossary/cad">CAD</A> — druk 3D + odlew.</>, <>Production — hand shaping, soldering, finishing. For <A href="/glossary/cad">CAD</A> designs — 3D print + casting.</>, <>Produktion — Handformung, Löten, Endbearbeitung. Für <A href="/glossary/cad">CAD</A>-Modelle — 3D-Druck + Guss.</>)}</LI>
        <LI><Strong>4.</Strong> {t("Kontrola jakości — wymiary, waga, próba metalu", "Quality control — dimensions, weight, metal assay", "Qualitätskontrolle — Maße, Gewicht, Metallprüfung")}</LI>
        <LI><Strong>5.</Strong> {t("Odbiór — w eleganckim pudełku, z certyfikatem", "Delivery — in an elegant box, with certificate", "Lieferung — in eleganter Box, mit Zertifikat")}</LI>
      </UL>

      <CTABox
        accent="amber"
        title={t("Wycena obrączek online", "Wedding Band Quote", "Ehering-Angebot")}
        text={t(
          "Użyj kalkulatora biżuterii, by porównać metale i profile dla Twojej pary obrączek.",
          "Use the jewelry calculator to compare metals and profiles for your wedding band pair.",
          "Nutzen Sie den Schmuckkalkulator, um Metalle und Profile für Ihr Ehering-Paar zu vergleichen."
        )}
        href="/jewelry#calculator"
        cta={t("Otwórz kalkulator", "Open calculator", "Kalkulator öffnen")}
      />
    </>
  );
}
