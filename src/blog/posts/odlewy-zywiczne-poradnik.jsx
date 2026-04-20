import { H2, P, Lead, UL, LI, Strong, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "odlewy-zywiczne-poradnik",
  category: "studio",
  accent: "blue",
  publishedAt: "2026-04-20",
  coverImage: "/hero-studio.jpg",
  readingTime: { pl: 6, en: 5, de: 5 },
  title: {
    pl: "Odlewy żywiczne — czym są i co można z nich stworzyć",
    en: "Resin Casting — What It Is & What You Can Create",
    de: "Harzguss — Was es ist & was man damit erschaffen kann",
  },
  description: {
    pl: "Kompletny poradnik o odlewach z żywicy UV i dwukomponentowej. Zastosowania, materiały, ceny i czas realizacji w AEJaCA sTuDiO.",
    en: "Complete guide to UV and 2K epoxy resin casting. Applications, materials, pricing, and turnaround at AEJaCA sTuDiO.",
    de: "Kompletter Ratgeber zu UV- und 2K-Epoxidharzguss. Anwendungen, Materialien, Preise und Lieferzeit im AEJaCA sTuDiO.",
  },
  keywords: {
    pl: "odlewy żywiczne, żywica epoksydowa, żywica UV, odlewy artystyczne, formy silikonowe, AEJaCA sTuDiO",
    en: "resin casting, epoxy resin, UV resin, artistic casting, silicone molds, custom resin parts, AEJaCA sTuDiO",
    de: "Harzguss, Epoxidharz, UV-Harz, Kunstguss, Silikonformen, individuelle Harzteile, AEJaCA sTuDiO",
  },
  toc: {
    pl: [
      { id: "uv-vs-2k", label: "UV vs dwukomponentowa" },
      { id: "materialy", label: "Materiały i pigmenty" },
      { id: "zastosowania", label: "Zastosowania" },
      { id: "proces", label: "Proces realizacji" },
      { id: "ceny", label: "Ceny i terminy" },
    ],
    en: [
      { id: "uv-vs-2k", label: "UV vs 2K resin" },
      { id: "materials", label: "Materials & pigments" },
      { id: "applications", label: "Applications" },
      { id: "process", label: "Our process" },
      { id: "pricing", label: "Pricing & turnaround" },
    ],
    de: [
      { id: "uv-vs-2k", label: "UV vs 2K-Harz" },
      { id: "materialien", label: "Materialien & Pigmente" },
      { id: "anwendungen", label: "Anwendungen" },
      { id: "prozess", label: "Unser Prozess" },
      { id: "preise", label: "Preise & Lieferzeit" },
    ],
  },
  faq: {
    pl: [
      { q: "Jaka jest różnica między żywicą UV a dwukomponentową?", a: "Żywica UV utwardza się w świetle UV w 1–3 minuty, ale nadaje się do cienkich warstw (1–3 mm). Dwukomponentowa utwardza się chemicznie w 12–24h i pozwala na dowolną grubość." },
      { q: "Jak długo twardnie odlew z żywicy?", a: "UV: 1–3 minuty na warstwę. 2K epoksydowa: 12–24 godziny do pełnego utwardzenia, dotykalna po 6h." },
      { q: "Czy można odlewać przezroczyste i kolorowe elementy?", a: "Tak — żywica bazowa jest krystalicznie przezroczysta. Kolory uzyskujemy pigmentami, tuszami alkoholowymi lub pyłami mika." },
      { q: "Jaki jest maksymalny rozmiar odlewu?", a: "Do ok. 30 × 30 × 10 cm w jednym odlewie. Większe obiekty wymagają dzielenia na segmenty lub formy wieloczęściowe." },
    ],
    en: [
      { q: "What's the difference between UV and 2K resin?", a: "UV resin cures under UV light in 1–3 minutes but works best for thin layers (1–3 mm). 2K epoxy cures chemically in 12–24 hours and allows unlimited thickness." },
      { q: "How long does a resin cast take to cure?", a: "UV: 1–3 minutes per layer. 2K epoxy: 12–24 hours to full cure, touch-safe after 6 hours." },
      { q: "Can you cast transparent and colored pieces?", a: "Yes — base resin is crystal clear. Colors are achieved with pigments, alcohol inks, or mica powders." },
      { q: "What's the maximum size for resin casting?", a: "Up to about 30 × 30 × 10 cm in a single pour. Larger objects require segmenting or multi-part molds." },
    ],
    de: [
      { q: "Was ist der Unterschied zwischen UV- und 2K-Harz?", a: "UV-Harz härtet unter UV-Licht in 1–3 Minuten aus, eignet sich aber nur für dünne Schichten (1–3 mm). 2K-Epoxid härtet chemisch in 12–24 Stunden und erlaubt beliebige Dicke." },
      { q: "Wie lange dauert das Aushärten eines Harzgusses?", a: "UV: 1–3 Minuten pro Schicht. 2K-Epoxid: 12–24 Stunden bis zur vollen Aushärtung, berührungsfest nach 6 Stunden." },
      { q: "Kann man transparente und farbige Teile gießen?", a: "Ja — das Basisharz ist kristallklar. Farben werden mit Pigmenten, Alkoholtinten oder Glimmerpulvern erzielt." },
      { q: "Wie groß kann ein Harzguss maximal sein?", a: "Bis ca. 30 × 30 × 10 cm in einem Guss. Größere Objekte erfordern Segmentierung oder mehrteilige Formen." },
    ],
  },
};

export function Body({ lang }) {
  const t = (pl, en, de) => lang === "pl" ? pl : lang === "de" ? de : en;
  const id = t;

  return (
    <>
      <Lead>{t(
        "Odlewy żywiczne zamieniają ciecz w trwałą, przejrzystą jak szkło materię. Od elementów biżuterii po dekoracyjne obiekty — to jedna z najwszechstronniejszych technik w naszym sTuDiO.",
        "Resin casting turns liquid into solid, glass-clear material. From jewelry components to decorative objects — it's one of the most versatile techniques in our sTuDiO.",
        "Harzguss verwandelt Flüssigkeit in festes, glasklares Material. Von Schmuckkomponenten bis zu dekorativen Objekten — eine der vielseitigsten Techniken in unserem sTuDiO."
      )}</Lead>

      <H2 id="uv-vs-2k">{t("Żywica UV vs dwukomponentowa", "UV vs 2K Epoxy Resin", "UV-Harz vs 2K-Epoxid")}</H2>
      <P>{t(
        "Pracujemy z dwoma rodzajami żywic — każda ma swoje mocne strony:",
        "We work with two types of resin — each has its strengths:",
        "Wir arbeiten mit zwei Harztypen — jeder hat seine Stärken:"
      )}</P>
      <Table
        headers={[
          t("Cecha", "Feature", "Merkmal"),
          t("Żywica UV", "UV Resin", "UV-Harz"),
          t("Żywica 2K (epoksydowa)", "2K Epoxy", "2K-Epoxid"),
        ]}
        rows={[
          [t("Utwardzanie", "Curing", "Aushärtung"), t("lampa UV, 1–3 min", "UV light, 1–3 min", "UV-Licht, 1–3 Min."), t("chemiczne, 12–24h", "chemical, 12–24h", "chemisch, 12–24 Std.")],
          [t("Przejrzystość", "Clarity", "Klarheit"), t("krystaliczna", "crystal clear", "kristallklar"), t("przejrzysta do mlecznej", "clear to milky", "klar bis milchig")],
          [t("Grubość warstwy", "Layer thickness", "Schichtdicke"), t("1–3 mm", "1–3 mm", "1–3 mm"), t("bez ograniczeń", "unlimited", "unbegrenzt")],
          [t("Najlepsze do", "Best for", "Am besten für"), t("biżuteria, cienkie elementy", "jewelry, thin pieces", "Schmuck, dünne Teile"), t("duże obiekty, grube odlewy", "large objects, thick pours", "große Objekte, dicke Güsse")],
          [t("Cena za gram", "Price per gram", "Preis pro Gramm"), t("wyższa", "higher", "höher"), t("niższa", "lower", "niedriger")],
        ]}
      />

      <H2 id={id("materialy", "materials", "materialien")}>{t("Materiały i pigmenty", "Materials & Pigments", "Materialien & Pigmente")}</H2>
      <P>{t(
        "Żywica to baza — ale magia zaczyna się, gdy dodasz kolor i wypełnienia:",
        "Resin is the base — but the magic starts when you add color and inclusions:",
        "Harz ist die Basis — aber die Magie beginnt mit Farbe und Einschlüssen:"
      )}</P>
      <UL>
        <LI><Strong>{t("Tusze alkoholowe", "Alcohol inks", "Alkoholtinten")}</Strong> — {t("intensywne, przezroczyste kolory z efektem marmuru", "intense, translucent colors with marble effect", "intensive, durchscheinende Farben mit Marmoreffekt")}</LI>
        <LI><Strong>{t("Pyły mika", "Mica powders", "Glimmerpulver")}</Strong> — {t("metaliczny połysk w złocie, srebrze, miedzi, brązie", "metallic shimmer in gold, silver, copper, bronze", "metallischer Schimmer in Gold, Silber, Kupfer, Bronze")}</LI>
        <LI><Strong>{t("Suszone kwiaty", "Dried flowers", "Trockenblumen")}</Strong> — {t("zakapslowane na zawsze w przejrzystej żywicy", "encapsulated forever in clear resin", "für immer in klarem Harz eingeschlossen")}</LI>
        <LI><Strong>{t("Wkładki metalowe / drewno", "Metal / wood inserts", "Metall-/Holzeinlagen")}</Strong> — {t("hybrydowe obiekty łączące materiały", "hybrid objects combining materials", "hybride Objekte aus verschiedenen Materialien")}</LI>
        <LI><Strong>{t("Pigmenty fosforyzujące", "Glow-in-the-dark pigments", "Nachleuchtpigmente")}</Strong> — {t("świecą w ciemności przez kilka godzin", "glow for hours in the dark", "leuchten stundenlang im Dunkeln")}</LI>
      </UL>
      <Callout accent="blue" title={t("Jakość", "Quality", "Qualität")}>{t(
        "Używamy wyłącznie żywic premium o niskim skurczu i doskonałej przejrzystości — żadnych tanich zamienników.",
        "We use only premium casting resins with low shrinkage and excellent clarity — no cheap alternatives.",
        "Wir verwenden ausschließlich Premium-Gießharze mit geringem Schrumpf und hervorragender Klarheit — keine billigen Alternativen."
      )}</Callout>

      <H2 id={id("zastosowania", "applications", "anwendungen")}>{t("Zastosowania", "Applications", "Anwendungen")}</H2>
      <UL>
        <LI><Strong>{t("Biżuteria", "Jewelry", "Schmuck")}</Strong> — {t("wisiorki, wkładki do pierścionków, kolczyki z żywicy", "pendants, ring inserts, resin earring drops", "Anhänger, Ringeinsätze, Harz-Ohrringe")}</LI>
        <LI><Strong>{t("Obiekty dekoracyjne", "Decorative objects", "Dekorationsobjekte")}</Strong> — {t("podkładki, zakładki, breloki", "coasters, bookmarks, keychains", "Untersetzer, Lesezeichen, Schlüsselanhänger")}</LI>
        <LI><Strong>{t("Sztuka żywiczna", "Resin art", "Harzkunst")}</Strong> — {t("obrazy żywiczne, miniatury river table", "resin paintings, river table miniatures", "Harzgemälde, River-Table-Miniaturen")}</LI>
        <LI><Strong>{t("Prototypowanie", "Prototyping", "Prototyping")}</Strong> — {t("przezroczyste obudowy, modele demonstracyjne", "transparent housings, display models", "transparente Gehäuse, Ausstellungsmodelle")}</LI>
        <LI><Strong>{t("Utrwalanie pamiątek", "Preservation", "Konservierung")}</Strong> — {t("kwiaty, bilety, zdjęcia zakapslowane w żywicy", "flowers, tickets, photos encapsulated in resin", "Blumen, Tickets, Fotos in Harz eingeschlossen")}</LI>
      </UL>

      <H2 id={id("proces", "process", "prozess")}>{t("Proces realizacji", "Our Process", "Unser Prozess")}</H2>
      <P>{t(
        "Każdy odlew przechodzi przez 4 etapy:",
        "Every cast goes through 4 stages:",
        "Jeder Guss durchläuft 4 Phasen:"
      )}</P>
      <UL>
        <LI><Strong>{t("1. Konsultacja", "1. Consultation", "1. Beratung")}</Strong> — {t("omawiamy projekt + przygotowujemy formę (silikonową lub drukowaną 3D)", "we discuss the design + prepare the mold (silicone or 3D-printed)", "wir besprechen das Design + bereiten die Form vor (Silikon oder 3D-gedruckt)")}</LI>
        <LI><Strong>{t("2. Dobór materiałów", "2. Material selection", "2. Materialwahl")}</Strong> — {t("typ żywicy, pigmenty, wkładki, wykończenie", "resin type, pigments, inserts, finish", "Harztyp, Pigmente, Einlagen, Finish")}</LI>
        <LI><Strong>{t("3. Odlew + utwardzanie", "3. Casting + curing", "3. Guss + Aushärtung")}</Strong> — {t("lampa UV lub 24h utwardzanie chemiczne", "UV lamp or 24-hour chemical cure", "UV-Lampe oder 24-stündige chemische Aushärtung")}</LI>
        <LI><Strong>{t("4. Wykończenie", "4. Finishing", "4. Nachbearbeitung")}</Strong> — {t("wyjęcie z formy, szlifowanie, polerowanie, ewentualnie lakierowanie", "demolding, sanding, polishing, optional coating", "Entformen, Schleifen, Polieren, optionale Beschichtung")}</LI>
      </UL>

      <H2 id={id("ceny", "pricing", "preise")}>{t("Ceny i terminy", "Pricing & Turnaround", "Preise & Lieferzeit")}</H2>
      <Table
        headers={[
          t("Typ", "Type", "Typ"),
          t("Cena od", "Price from", "Preis ab"),
          t("Czas realizacji", "Turnaround", "Lieferzeit"),
        ]}
        rows={[
          [t("Prosty wisiorek / brelok", "Simple pendant / charm", "Einfacher Anhänger / Charm"), "€8", t("1–2 dni", "1–2 days", "1–2 Tage")],
          [t("Wkładka do biżuterii", "Custom jewelry insert", "Schmuck-Einsatz"), "€15", t("2–3 dni", "2–3 days", "2–3 Tage")],
          [t("Obiekt dekoracyjny", "Decorative object", "Dekoratives Objekt"), "€25", t("3–5 dni", "3–5 days", "3–5 Tage")],
          [t("Forma + odlew na zamówienie", "Custom mold + casting", "Individuelle Form + Guss"), "€45", t("5–7 dni", "5–7 days", "5–7 Tage")],
        ]}
      />

      <CTABox
        accent="blue"
        title={t("Chcesz wycenić odlew?", "Want a casting quote?", "Guss-Angebot gewünscht?")}
        text={t(
          "Skorzystaj z kalkulatora sTuDiO lub napisz do nas z opisem projektu.",
          "Use our sTuDiO calculator or write to us with your project description.",
          "Nutzen Sie unseren sTuDiO-Kalkulator oder schreiben Sie uns mit Ihrer Projektbeschreibung."
        )}
        href="/studio#calculator"
        cta={t("Kalkulator sTuDiO", "sTuDiO calculator", "sTuDiO-Kalkulator")}
      />
    </>
  );
}
