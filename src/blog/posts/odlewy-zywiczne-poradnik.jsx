import { H2, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./odlewy-zywiczne-poradnik.meta.js";

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
        <>Pracujemy z dwoma rodzajami <A href="/glossary/zywica-uv">żywic</A> — każda ma swoje mocne strony:</>,
        <>We work with two types of <A href="/glossary/zywica-uv">resin</A> — each has its strengths:</>,
        <>Wir arbeiten mit zwei <A href="/glossary/zywica-uv">Harz</A>typen — jeder hat seine Stärken:</>
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
        <LI><Strong><A href="/glossary/prototypowanie">{t("Prototypowanie", "Prototyping", "Prototyping")}</A></Strong> — {t("przezroczyste obudowy, modele demonstracyjne", "transparent housings, display models", "transparente Gehäuse, Ausstellungsmodelle")}</LI>
        <LI><Strong>{t("Utrwalanie pamiątek", "Preservation", "Konservierung")}</Strong> — {t("kwiaty, bilety, zdjęcia zakapslowane w żywicy", "flowers, tickets, photos encapsulated in resin", "Blumen, Tickets, Fotos in Harz eingeschlossen")}</LI>
      </UL>

      <H2 id={id("proces", "process", "prozess")}>{t("Proces realizacji", "Our Process", "Unser Prozess")}</H2>
      <P>{t(
        "Każdy odlew przechodzi przez 4 etapy:",
        "Every cast goes through 4 stages:",
        "Jeder Guss durchläuft 4 Phasen:"
      )}</P>
      <UL>
        <LI><Strong>{t("1. Konsultacja", "1. Consultation", "1. Beratung")}</Strong> — {t(
          <>omawiamy projekt + przygotowujemy formę (silikonową lub drukowaną w <A href="/glossary/druk-3d-fdm">druku 3D</A>)</>,
          <>we discuss the design + prepare the mold (silicone or <A href="/glossary/druk-3d-fdm">3D-printed</A>)</>,
          <>wir besprechen das Design + bereiten die Form vor (Silikon oder per <A href="/glossary/druk-3d-fdm">3D-Druck</A> gedruckt)</>
        )}</LI>
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
          [t("Prosty wisiorek / brelok", "Simple pendant / charm", "Einfacher Anhänger / Charm"), t("35 zł", "€8", "8 €"), t("1–2 dni", "1–2 days", "1–2 Tage")],
          [t("Wkładka do biżuterii", "Custom jewelry insert", "Schmuck-Einsatz"), t("65 zł", "€15", "15 €"), t("2–3 dni", "2–3 days", "2–3 Tage")],
          [t("Obiekt dekoracyjny", "Decorative object", "Dekoratives Objekt"), t("110 zł", "€25", "25 €"), t("3–5 dni", "3–5 days", "3–5 Tage")],
          [t("Forma + odlew na zamówienie", "Custom mold + casting", "Individuelle Form + Guss"), t("195 zł", "€45", "45 €"), t("5–7 dni", "5–7 days", "5–7 Tage")],
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
