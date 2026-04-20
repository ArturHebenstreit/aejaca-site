import { H2, P, Lead, UL, LI, Strong, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "obraczki-slubne",
  category: "jewelry",
  accent: "amber",
  publishedAt: "2026-04-20",
  coverImage: "/img/blog/obraczki-slubne.jpg",
  readingTime: { pl: 6, en: 5, de: 5 },
  title: {
    pl: "Obrączki ślubne na zamówienie — metal, profil i cena",
    en: "Custom Wedding Bands — Metal, Profile & Price Guide",
    de: "Eheringe auf Bestellung — Metall, Profil & Preisguide",
  },
  description: {
    pl: "Jak wybrać obrączki ślubne? Porównanie metali, profili i wykończeń. Ceny par od €160. Kalkulator online w AEJaCA.",
    en: "How to choose wedding bands? Comparing metals, profiles, and finishes. Pair pricing from €160. Online calculator at AEJaCA.",
    de: "Wie wählt man Eheringe? Vergleich von Metallen, Profilen und Oberflächen. Paarpreise ab 160 €. Online-Kalkulator bei AEJaCA.",
  },
  keywords: {
    pl: "obrączki ślubne na zamówienie, obrączki złote, obrączki srebrne, profile obrączek, cena obrączek, AEJaCA",
    en: "custom wedding bands, gold wedding rings, silver wedding bands, ring profiles, wedding ring price, AEJaCA",
    de: "Eheringe auf Bestellung, goldene Eheringe, silberne Eheringe, Ringprofile, Ehering Preis, AEJaCA",
  },
  toc: {
    pl: [
      { id: "metale", label: "Wybór metalu" },
      { id: "profile", label: "Profile obrączek" },
      { id: "wykonczenia", label: "Wykończenia" },
      { id: "ceny", label: "Ceny" },
      { id: "proces", label: "Proces zamówienia" },
    ],
    en: [
      { id: "metals", label: "Choosing metal" },
      { id: "profiles", label: "Ring profiles" },
      { id: "finishes", label: "Finishes" },
      { id: "pricing", label: "Pricing" },
      { id: "process", label: "Order process" },
    ],
    de: [
      { id: "metalle", label: "Metallwahl" },
      { id: "profile", label: "Ringprofile" },
      { id: "oberflaechen", label: "Oberflächen" },
      { id: "preise", label: "Preise" },
      { id: "prozess", label: "Bestellprozess" },
    ],
  },
  faq: {
    pl: [
      { q: "Ile kosztują obrączki ślubne na zamówienie?", a: "Para obrączek srebrnych od €160, złotych 14k od €600, złotych 18k od €900. Cena zależy od szerokości, profilu i wykończenia." },
      { q: "Jak długo trwa realizacja obrączek?", a: "Standardowo 3–5 tygodni od zatwierdzenia projektu. Ekspres (2 tygodnie) za dopłatą 30%." },
      { q: "Czy mogę zamówić obrączki z różnych metali?", a: "Tak — popularne połączenie to złoto żółte + białe lub złoto + srebro z rodowaniem." },
      { q: "Czy obrączki można później przeskalować?", a: "Tak, oferujemy jednorazowe bezpłatne przeskalowanie do ±2 rozmiarów w ciągu roku od zakupu." },
    ],
    en: [
      { q: "How much do custom wedding bands cost?", a: "Silver pair from €160, 14k gold from €600, 18k gold from €900. Price depends on width, profile, and finish." },
      { q: "How long does it take to make wedding bands?", a: "Standard turnaround is 3–5 weeks from design approval. Express (2 weeks) available at 30% surcharge." },
      { q: "Can I order bands in different metals?", a: "Yes — popular combos include yellow + white gold, or gold + rhodium-plated silver." },
      { q: "Can wedding bands be resized later?", a: "Yes, we offer one free resize up to ±2 sizes within one year of purchase." },
    ],
    de: [
      { q: "Was kosten individuelle Eheringe?", a: "Silberpaar ab 160 €, 14k Gold ab 600 €, 18k Gold ab 900 €. Preis hängt von Breite, Profil und Oberfläche ab." },
      { q: "Wie lange dauert die Anfertigung?", a: "Standard 3–5 Wochen ab Designfreigabe. Express (2 Wochen) mit 30 % Aufschlag möglich." },
      { q: "Kann ich Ringe aus verschiedenen Metallen bestellen?", a: "Ja — beliebt sind Gelb- + Weißgold oder Gold + rhodiniertes Silber." },
      { q: "Können Eheringe nachträglich angepasst werden?", a: "Ja, wir bieten eine kostenlose Größenanpassung um ±2 Größen innerhalb eines Jahres nach Kauf." },
    ],
  },
};

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
        "Metal obrączki wpływa na trwałość, kolor i cenę. Oto najczęściej wybierane opcje:",
        "The metal affects durability, color, and price. Here are the most popular options:",
        "Das Metall beeinflusst Haltbarkeit, Farbe und Preis. Hier die beliebtesten Optionen:"
      )}</P>
      <Table
        headers={t(
          ["Metal", "Kolor", "Trwałość", "Cena za parę od"],
          ["Metal", "Color", "Durability", "Pair price from"],
          ["Metall", "Farbe", "Haltbarkeit", "Paarpreis ab"]
        )}
        rows={[
          [t("Srebro 925", "Silver 925", "Silber 925"), t("Jasny biały", "Bright white", "Helles Weiß"), t("Dobra (wymaga polerowania)", "Good (needs polishing)", "Gut (braucht Politur)"), "€160"],
          [t("Złoto 14k żółte", "14k Yellow Gold", "14k Gelbgold"), t("Ciepły złoty", "Warm gold", "Warmes Gold"), t("Bardzo dobra", "Very good", "Sehr gut"), "€600"],
          [t("Złoto 14k białe", "14k White Gold", "14k Weißgold"), t("Chłodny biały", "Cool white", "Kühles Weiß"), t("Bardzo dobra", "Very good", "Sehr gut"), "€650"],
          [t("Złoto 18k", "18k Gold", "18k Gold"), t("Bogaty, intensywny", "Rich, intense", "Satt, intensiv"), t("Dobra", "Good", "Gut"), "€900"],
          [t("Złoto różowe 14k", "14k Rose Gold", "14k Roségold"), t("Różowo-miedziany", "Pinkish copper", "Rosa-Kupfer"), t("Bardzo dobra", "Very good", "Sehr gut"), "€620"],
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
          [t("Srebro 925, klasyczne 4mm", "Silver 925, classic 4mm", "Silber 925, klassisch 4mm"), t("od €160", "from €160", "ab 160 €"), t("2–3 tygodnie", "2–3 weeks", "2–3 Wochen")],
          [t("Złoto 14k, comfort fit 5mm", "14k Gold, comfort fit 5mm", "14k Gold, Comfort Fit 5mm"), t("od €600", "from €600", "ab 600 €"), t("3–4 tygodnie", "3–4 weeks", "3–4 Wochen")],
          [t("Złoto 18k, z diamentami", "18k Gold, with diamonds", "18k Gold, mit Diamanten"), t("od €1200", "from €1,200", "ab 1.200 €"), t("4–6 tygodni", "4–6 weeks", "4–6 Wochen")],
          [t("Mieszane (złoto + srebro)", "Mixed (gold + silver)", "Gemischt (Gold + Silber)"), t("od €400", "from €400", "ab 400 €"), t("3–5 tygodni", "3–5 weeks", "3–5 Wochen")],
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
        <LI><Strong>3.</Strong> {t("Produkcja — ręczne formowanie, lutowanie, wykańczanie", "Production — hand shaping, soldering, finishing", "Produktion — Handformung, Löten, Endbearbeitung")}</LI>
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
