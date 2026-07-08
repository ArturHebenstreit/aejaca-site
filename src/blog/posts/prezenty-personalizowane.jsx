import { H2, P, Lead, UL, LI, Strong, Callout, Table, CTABox, A } from "../../components/blog/Prose.jsx";

export { meta } from "./prezenty-personalizowane.meta.js";

export function Body({ lang }) {
  const t = (pl, en, de) => lang === "pl" ? pl : lang === "de" ? de : en;
  const id = t;

  return (
    <>
      <Lead>{t(
        "Personalizowany prezent mówi: \u201Epomyślałem o Tobie\u201D. Niesie emocje, których żaden gotowy produkt z półki nie zastąpi.",
        "A personalized gift says: 'I thought of you.' It carries emotion no off-the-shelf product can match.",
        "Ein personalisiertes Geschenk sagt: ‚Ich habe an dich gedacht.' Es trägt Emotionen, die kein Produkt von der Stange ersetzen kann."
      )}</Lead>

      <H2 id={id("dlaczego", "why", "warum")}>{t("Dlaczego personalizowane?", "Why Personalized?", "Warum personalisiert?")}</H2>
      <UL>
        <LI><Strong>{t("Unikatowość", "Uniqueness", "Einzigartigkeit")}</Strong> — {t("jedyny taki egzemplarz na świecie", "one-of-a-kind, unique in the world", "ein einzigartiges Stück auf der Welt")}</LI>
        <LI><Strong>{t("Wartość emocjonalna", "Emotional value", "Emotionaler Wert")}</Strong> — {t("wykracza daleko poza wartość materiałową", "goes far beyond material worth", "geht weit über den Materialwert hinaus")}</LI>
        <LI><Strong>{t("Każdy budżet", "Any budget", "Jedes Budget")}</Strong> — {t("od grawerowanego breloka za 65 zł do pierścionka za 2150 zł+", "from an engraved keychain at €15 to a ring at €500+", "vom gravierten Schlüsselanhänger für 15 € bis zum Ring für 500 €+")}</LI>
      </UL>
      <Callout accent="amber" title={t("Ciekawostka", "Fun fact", "Wussten Sie?")}>{t(
        "Ponad 70% naszych zamówień personalizowanych to klienci powracający — bo takie prezenty naprawdę robią wrażenie.",
        "Over 70% of our personalized orders are repeat customers — because these gifts truly make an impact.",
        "Über 70 % unserer personalisierten Bestellungen sind Stammkunden — weil diese Geschenke wirklich Eindruck machen."
      )}</Callout>

      <H2 id={id("dla-niej", "for-her", "fuer-sie")}>{t("Pomysły dla niej", "Gift Ideas for Her", "Geschenkideen für sie")}</H2>
      <UL>
        <LI><Strong>{t("Wisiorek z inicjałami", "Pendant with initials", "Anhänger mit Initialen")}</Strong> — {t(<><A href="/glossary/srebro-925">srebro 925</A>, <A href="/glossary/personalizowany-grawer">grawerowanie laserowe</A>, od 150 zł</>, <><A href="/glossary/srebro-925">silver 925</A>, <A href="/glossary/personalizowany-grawer">laser engraved</A>, from €35</>, <><A href="/glossary/srebro-925">Silber 925</A>, <A href="/glossary/personalizowany-grawer">lasergraviert</A>, ab 35 €</>)}</LI>
        <LI><Strong>{t("Pierścionek z kamieniem urodzinowym", "Birthstone ring", "Ring mit Geburtsstein")}</Strong> — {t("naturalny kamień dobrany do miesiąca urodzenia", "natural gemstone matched to birth month", "natürlicher Edelstein passend zum Geburtsmonat")}</LI>
        <LI><Strong>{t("Wisiorek z żywicy z suszonymi kwiatami", "Resin pendant with dried flowers", "Harz-Anhänger mit Trockenblumen")}</Strong> — {t("zakapslowany bukiecik na zawsze, od 85 zł", "a tiny bouquet encapsulated forever, from €20", "ein kleines Bouquet für immer eingekapselt, ab 20 €")}</LI>
        <LI><Strong>{t("Szkatułka z grawerem", "Engraved jewelry box", "Gravierte Schmuckschatulle")}</Strong> — {t("drewno + laser CO2, od 110 zł", "wood + CO2 laser, from €25", "Holz + CO2-Laser, ab 25 €")}</LI>
      </UL>

      <H2 id={id("dla-niego", "for-him", "fuer-ihn")}>{t("Pomysły dla niego", "Gift Ideas for Him", "Geschenkideen für ihn")}</H2>
      <UL>
        <LI><Strong>{t("Spinka do mankietu z grawerem", "Engraved cufflinks", "Gravierte Manschettenknöpfe")}</Strong> — {t("fiber laser na metalu, od 170 zł", "fiber laser on metal, from €40", "Faserlaser auf Metall, ab 40 €")}</LI>
        <LI><Strong>{t(<>Organizer <A href="/glossary/druk-3d-fdm">3D</A> z imieniem</>, <><A href="/glossary/druk-3d-fdm">3D-printed</A> desk organizer with name</>, <><A href="/glossary/druk-3d-fdm">3D-gedruckter</A> Organizer mit Namen</>)}</Strong> — {t("wydrukowany w wybranym kolorze, od 65 zł", "printed in chosen color, from €15", "in Wunschfarbe gedruckt, ab 15 €")}</LI>
        <LI><Strong>{t("Mapa wycinana laserowo", "Laser-cut wooden map", "Lasergeschnittene Holzkarte")}</Strong> — {t("wyjątkowe miejsce wycięte w drewnie, od 130 zł", "a special place cut in wood, from €30", "ein besonderer Ort in Holz geschnitten, ab 30 €")}</LI>
        <LI><Strong>{t("Sygnet z indywidualnym herbem", "Signet ring with custom seal", "Siegelring mit individuellem Wappen")}</Strong> — {t("srebro 925, ręcznie robiony, od 520 zł", "silver 925, handcrafted, from €120", "Silber 925, handgefertigt, ab 120 €")}</LI>
      </UL>

      <H2 id={id("okazje", "occasions", "anlaesse")}>{t("Poradnik wg okazji", "Occasion Guide", "Anlass-Guide")}</H2>
      <Table
        headers={[
          t("Okazja", "Occasion", "Anlass"),
          t("Najlepsze opcje", "Best options", "Beste Optionen"),
          t("Budżet od", "Budget from", "Budget ab"),
          t("Czas realizacji", "Lead time", "Vorlaufzeit"),
        ]}
        rows={[
          [t("Urodziny", "Birthday", "Geburtstag"), t("wisiorek z grawerem, druk 3D", "engraved pendant, 3D print", "gravierter Anhänger, 3D-Druck"), t("65 zł", "€15", "15 €"), t("3–5 dni", "3–5 days", "3–5 Tage")],
          [t("Rocznica", "Anniversary", "Jubiläum"), t("pierścionek, grawerowany element", "custom ring, engraved piece", "Ring, graviertes Stück"), t("350 zł", "€80", "80 €"), t("2–4 tygodnie", "2–4 weeks", "2–4 Wochen")],
          [t("Ślub", "Wedding", "Hochzeit"), t("obrączki, spinki, biżuteria", "matching bands, cufflinks", "Eheringe, Manschettenknöpfe"), t("860 zł", "€200", "200 €"), t("3–6 tygodni", "3–6 weeks", "3–6 Wochen")],
          [t("Święta", "Holidays", "Feiertage"), t("ozdoby, breloki, szkatułki", "ornaments, keychains, boxes", "Ornamente, Schlüsselanhänger, Boxen"), t("40 zł", "€10", "10 €"), t("1–2 tygodnie", "1–2 weeks", "1–2 Wochen")],
          [t("Zakończenie szkoły", "Graduation", "Abschluss"), t("sygnet, wisiorek, pióro z grawerem", "signet ring, pendant, pen", "Siegelring, Anhänger, Stift"), t("130 zł", "€30", "30 €"), t("1–2 tygodnie", "1–2 weeks", "1–2 Wochen")],
        ]}
      />

      <H2 id={id("zamowienie", "ordering", "bestellen")}>{t("Jak zamówić", "How to Order", "So bestellen Sie")}</H2>
      <UL>
        <LI><Strong>{t("1. Napisz do nas", "1. Contact us", "1. Kontaktieren Sie uns")}</Strong> — {t("opisz okazję i odbiorcę — doradzimy najlepszą opcję", "describe the occasion and recipient — we'll suggest the best option", "beschreiben Sie Anlass und Empfänger — wir empfehlen die beste Option")}</LI>
        <LI><Strong>{t("2. Wybierz materiał i projekt", "2. Choose material & design", "2. Wählen Sie Material & Design")}</Strong> — {t("metal, kamień, tekst grawerunku, budżet", "metal, stone, engraving text, budget", "Metall, Stein, Gravurtext, Budget")}</LI>
        <LI><Strong>{t("3. My tworzymy + wysyłamy", "3. We craft + ship", "3. Wir fertigen + versenden")}</Strong> — {t("lub odbierz osobiście w sTuDiO", "or pick up in person at our sTuDiO", "oder persönliche Abholung im sTuDiO")}</LI>
      </UL>
      <Callout accent="amber" title={t("Ekspres?", "Rush order?", "Eilauftrag?")}>{t(
        "Niektóre personalizacje mogą być gotowe w 24–48 godzin. Napisz do nas — zrobimy, co w naszej mocy!",
        "Some personalizations can be ready in 24–48 hours. Write to us — we'll do our best!",
        "Manche Personalisierungen können in 24–48 Stunden fertig sein. Schreiben Sie uns — wir tun unser Bestes!"
      )}</Callout>

      <CTABox
        accent="amber"
        title={t("Gotowy zamówić prezent?", "Ready to order a gift?", "Bereit, ein Geschenk zu bestellen?")}
        text={t(
          "Skontaktuj się z nami — pomożemy wybrać idealny personalizowany upominek.",
          "Get in touch — we'll help you choose the perfect personalized present.",
          "Kontaktieren Sie uns — wir helfen Ihnen, das perfekte personalisierte Geschenk zu wählen."
        )}
        href="/contact/"
        cta={t("Kontakt", "Contact us", "Kontakt")}
      />
    </>
  );
}
