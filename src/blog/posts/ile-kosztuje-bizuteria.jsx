import { H2, H3, P, Lead, OL, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./ile-kosztuje-bizuteria.meta.js";

export function Body({ lang }) {
  const t = (pl, en, de) => lang === "pl" ? pl : lang === "de" ? de : en;
  const id = t;

  return (
    <>
      <Lead>{t(
        "Biżuteria na zamówienie kosztuje tyle, ile warty jest Twój pomysł — od prostego srebrnego wisiorka za kilkaset złotych po platynowy pierścionek z diamentami. W tym przewodniku rozkładamy cenę na czynniki pierwsze, podajemy realne widełki dla każdej kategorii i wyjaśniamy, za co dokładnie płacisz.",
        "Custom jewelry costs as much as your idea is worth — from a simple silver pendant for under €40 to a platinum diamond ring. In this guide we break down the price into its components, give real ranges for every jewelry category, and explain exactly what you're paying for.",
        "Individueller Schmuck kostet so viel, wie Ihre Idee wert ist — von einem einfachen Silberanhänger für unter 40 € bis hin zu einem Platin-Diamantring. In diesem Leitfaden schlüsseln wir den Preis auf, geben reale Spannen für jede Schmuckkategorie an und erklären, wofür Sie genau zahlen."
      )}</Lead>

      <H2 id={id("co-wplywa-na-cene", "pricing-factors", "preisfaktoren")}>{t("Co wpływa na cenę biżuterii?", "What affects the price of custom jewelry?", "Was beeinflusst den Preis von individuellem Schmuck?")}</H2>
      <P>{t(
        "Cena biżuterii na zamówienie nie bierze się z powietrza — to suma pięciu konkretnych czynników:",
        "The price of custom jewelry isn't arbitrary — it's the sum of five concrete factors:",
        "Der Preis für individuellen Schmuck ist nicht willkürlich — er setzt sich aus fünf konkreten Faktoren zusammen:"
      )}</P>
      <Table
        headers={[
          t("Czynnik", "Factor", "Faktor"),
          t("Wpływ na cenę", "Impact on price", "Einfluss auf den Preis"),
          t("Przykład", "Example", "Beispiel"),
        ]}
        rows={[
          [
            t("Metal i próba", "Metal & purity", "Metall & Feingehalt"),
            "30–50%",
            t("Srebro 925 vs złoto 750: 3–5× różnica", "Silver 925 vs gold 750: 3–5× difference", "Silber 925 vs. Gold 750: 3–5× Unterschied"),
          ],
          [
            t("Kamienie szlachetne", "Gemstones", "Edelsteine"),
            "0–60%",
            t("Moissanit 0.5 ct ~300 zł vs diament 0.5 ct ~3000 zł", "Moissanite 0.5 ct ~€70 vs diamond 0.5 ct ~€700", "Moissanit 0,5 ct ~70 € vs. Diamant 0,5 ct ~700 €"),
          ],
          [
            t("Złożoność projektu", "Design complexity", "Designkomplexität"),
            "10–25%",
            t("Prosta obrączka vs ażurowy pierścionek z 12 kamieniami", "Plain band vs filigree ring with 12 stones", "Glatter Ring vs. Filigranring mit 12 Steinen"),
          ],
          [
            t("Technika wykonania", "Production technique", "Fertigungstechnik"),
            "5–15%",
            t("Odlew z modelu 3D vs ręczne kucie", "Casting from 3D model vs hand-forging", "Guss aus 3D-Modell vs. Handschmieden"),
          ],
          [
            t("Wykończenie", "Finish", "Veredelung"),
            "2–10%",
            t("Polerowanie, rodowanie, grawer", "Polishing, rhodium plating, engraving", "Polieren, Rhodinierung, Gravur"),
          ],
        ]}
      />
      <Callout accent="amber" title={t("Wskazówka", "Tip", "Tipp")}>{t(
        "Największą różnicę robi metal — nie robocizna. Jeśli budżet jest ograniczony, zacznij od srebra 925 i nadaj mu unikalny kształt, zamiast wybierać tanie złoto z prostym designem.",
        "The biggest price driver is the metal — not the labor. If budget is tight, start with silver 925 and give it a unique shape, rather than choosing cheap gold with a plain design.",
        "Der größte Preistreiber ist das Metall — nicht die Arbeit. Bei begrenztem Budget beginnen Sie mit Silber 925 und geben ihm eine einzigartige Form, statt billiges Gold mit schlichtem Design zu wählen."
      )}</Callout>

      <H2 id={id("metale", "metals", "metalle")}>{t("Metal i próba — fundament ceny", "Metal & purity — the price foundation", "Metall & Feingehalt — das Preisfundament")}</H2>
      <P>{t(
        "Każdy gram metalu szlachetnego kosztuje inaczej. Poniżej orientacyjne ceny surowca (zmieniają się z kursem złota) i zastosowanie:",
        "Every gram of precious metal has a different cost. Below are indicative raw material prices (they change with gold rates) and best use cases:",
        "Jedes Gramm Edelmetall kostet unterschiedlich. Unten finden Sie Richtwerte für Rohstoffpreise (sie ändern sich mit dem Goldkurs) und die besten Anwendungen:"
      )}</P>
      <Table
        headers={[
          t("Metal", "Metal", "Metall"),
          t("Próba", "Purity", "Feingehalt"),
          t("Koszt surowca*", "Raw material cost*", "Rohstoffkosten*"),
          t("Najlepiej do", "Best for", "Am besten für"),
        ]}
        rows={[
          [
            <A href="/glossary/srebro-925">{t("Srebro 925", "Silver 925", "Silber 925")}</A>,
            "92,5% Ag",
            t("~4 zł/g", "~€0,95/g", "~0,95 €/g"),
            t("Wisiorki, kolczyki, pierwsze zamówienie", "Pendants, earrings, first custom piece", "Anhänger, Ohrringe, erstes Maßstück"),
          ],
          [
            <A href="/glossary/zloto-probowane">{t("Złoto 585 (14K)", "Gold 585 (14K)", "Gold 585 (14K)")}</A>,
            "58,5% Au",
            t("~180 zł/g", "~€42/g", "~42 €/g"),
            t("Pierścionki zaręczynowe, obrączki", "Engagement rings, wedding bands", "Verlobungsringe, Eheringe"),
          ],
          [
            t("Złoto 750 (18K)", "Gold 750 (18K)", "Gold 750 (18K)"),
            "75% Au",
            t("~250 zł/g", "~€58/g", "~58 €/g"),
            t("Biżuteria premium, heirloom", "Premium jewelry, heirloom pieces", "Premium-Schmuck, Erbstücke"),
          ],
          [
            t("Platyna 950", "Platinum 950", "Platin 950"),
            "95% Pt",
            t("~200 zł/g", "~€47/g", "~47 €/g"),
            t("Alergicy, maksymalna trwałość", "Allergy sufferers, maximum durability", "Allergiker, maximale Haltbarkeit"),
          ],
        ]}
      />
      <P>{t(
        "* Ceny surowca orientacyjne, zmienne wg kursu NBP. Ostateczna cena uwzględnia też robociznę, narzędzia i wykończenie.",
        "* Raw material prices indicative, fluctuate with exchange rates. Final price also includes labor, tooling, and finishing.",
        "* Rohstoffpreise sind Richtwerte, variieren mit dem Wechselkurs. Der Endpreis beinhaltet auch Arbeit, Werkzeug und Veredelung."
      )}</P>
      <Callout accent="amber" title={t("Chcesz porównać metale?", "Want to compare metals?", "Metalle vergleichen?")}>{t(
        <>"Przeczytaj nasz szczegółowy przewodnik: <A href="/blog/srebro-vs-zloto">Srebro vs Złoto — jaki metal wybrać na biżuterię?</A>"</>,
        <>"Read our detailed guide: <A href="/blog/srebro-vs-zloto">Silver vs Gold — Which Metal to Choose for Jewelry?</A>"</>,
        <>"Lesen Sie unseren ausführlichen Leitfaden: <A href="/blog/srebro-vs-zloto">Silber vs Gold — Welches Metall für Schmuck wählen?</A>"</>,
      )}</Callout>

      <H2 id={id("kamienie", "gemstones", "edelsteine")}>{t("Kamienie szlachetne — największa zmienność ceny", "Gemstones — the biggest price variable", "Edelsteine — die größte Preisvariable")}</H2>
      <P>{t(
        "Kamień może być bezpłatny (brak) lub kosztować więcej niż sam metal. Oto orientacyjne ceny dla najczęstszych wyborów:",
        "A gemstone can cost nothing (no stone) or more than the metal itself. Here are indicative prices for the most common choices:",
        "Ein Edelstein kann nichts kosten (kein Stein) oder mehr als das Metall selbst. Hier sind Richtwerte für die häufigsten Optionen:"
      )}</P>
      <Table
        headers={[
          t("Kamień", "Stone", "Stein"),
          t("0,5 ct", "0.5 ct", "0,5 ct"),
          t("1 ct", "1 ct", "1 ct"),
          t("Twardość (Mohs)", "Hardness (Mohs)", "Härte (Mohs)"),
        ]}
        rows={[
          [<A href="/glossary/moissanit">{t("Moissanit", "Moissanite", "Moissanit")}</A>, t("od 250 zł", "from €60", "ab 60 €"), t("od 450 zł", "from €105", "ab 105 €"), "9,25"],
          [t("Szafir (naturalny)", "Sapphire (natural)", "Saphir (natürlich)"), t("od 800 zł", "from €190", "ab 190 €"), t("od 2500 zł", "from €580", "ab 580 €"), "9"],
          [t("Diament (naturalny)", "Diamond (natural)", "Diamant (natürlich)"), t("od 3000 zł", "from €700", "ab 700 €"), t("od 8000 zł", "from €1860", "ab 1.860 €"), "10"],
          [t("Szmaragd", "Emerald", "Smaragd"), t("od 600 zł", "from €140", "ab 140 €"), t("od 2000 zł", "from €465", "ab 465 €"), "7,5"],
          [t("Rubin", "Ruby", "Rubin"), t("od 1200 zł", "from €280", "ab 280 €"), t("od 4000 zł", "from €930", "ab 930 €"), "9"],
        ]}
      />
      <P>{t(
        "W AEJaCA dobieramy kamienie indywidualnie — przed zamówieniem widzisz zdjęcia konkretnego egzemplarza, nie zdjęcia stockowe.",
        "At AEJaCA we source stones individually — before ordering you see photos of the exact specimen, not stock photography.",
        "Bei AEJaCA wählen wir Steine individuell aus — vor der Bestellung sehen Sie Fotos des genauen Exemplars, keine Stockfotos."
      )}</P>

      <H2 id={id("kategorie", "categories", "kategorien")}>{t("Cennik wg kategorii biżuterii", "Prices by jewelry category", "Preise nach Schmuckkategorie")}</H2>
      <P>{t(
        "Poniżej realne widełki cenowe dla każdej kategorii — bez kamieni szlachetnych (patrz tabela powyżej):",
        "Below are real price ranges for each category — excluding gemstones (see table above):",
        "Unten finden Sie reale Preisspannen für jede Kategorie — ohne Edelsteine (siehe Tabelle oben):"
      )}</P>
      <Table
        headers={[
          t("Kategoria", "Category", "Kategorie"),
          t("Srebro 925", "Silver 925", "Silber 925"),
          t("Złoto 14K", "Gold 14K", "Gold 14K"),
          t("Złoto 18K", "Gold 18K", "Gold 18K"),
        ]}
        rows={[
          [t("Pierścionek prosty", "Simple ring", "Einfacher Ring"), t("od 170 zł", "from €40", "ab 40 €"), t("od 780 zł", "from €180", "ab 180 €"), t("od 1200 zł", "from €280", "ab 280 €")],
          [t("Pierścionek zaręczynowy", "Engagement ring", "Verlobungsring"), t("od 350 zł", "from €80", "ab 80 €"), t("od 1500 zł", "from €350", "ab 350 €"), t("od 2400 zł", "from €560", "ab 560 €")],
          [t("Obrączki (para)", "Wedding bands (pair)", "Eheringe (Paar)"), t("od 400 zł", "from €95", "ab 95 €"), t("od 1600 zł", "from €375", "ab 375 €"), t("od 2600 zł", "from €605", "ab 605 €")],
          [t("Naszyjnik / wisiorek", "Necklace / pendant", "Halskette / Anhänger"), t("od 150 zł", "from €35", "ab 35 €"), t("od 650 zł", "from €150", "ab 150 €"), t("od 950 zł", "from €220", "ab 220 €")],
          [t("Bransoletka", "Bracelet", "Armband"), t("od 250 zł", "from €60", "ab 60 €"), t("od 900 zł", "from €210", "ab 210 €"), t("od 1500 zł", "from €350", "ab 350 €")],
          [t("Kolczyki (para)", "Earrings (pair)", "Ohrringe (Paar)"), t("od 215 zł", "from €50", "ab 50 €"), t("od 860 zł", "from €200", "ab 200 €"), t("od 1380 zł", "from €320", "ab 320 €")],
        ]}
      />
      <P>{t(
        "Ceny orientacyjne, bez kamieni szlachetnych. Finalna cena zależy od wagi, złożoności i wykończenia. Dokładna wycena zawsze bezpłatna.",
        "Indicative prices, without gemstones. Final price depends on weight, complexity, and finish. Exact quotes are always free.",
        "Richtwerte, ohne Edelsteine. Der Endpreis hängt von Gewicht, Komplexität und Veredelung ab. Genaue Angebote sind immer kostenlos."
      )}</P>
      <Callout accent="amber" title={t("Szukasz pierścionka zaręczynowego?", "Looking for an engagement ring?", "Suchen Sie einen Verlobungsring?")}>
        {t(
          <><A href="/blog/pierscionek-zareczynowy-na-zamowienie">Przeczytaj nasz szczegółowy poradnik: Pierścionek zaręczynowy na zamówienie — koszt, proces i wybór kamienia →</A></>,
          <><A href="/blog/pierscionek-zareczynowy-na-zamowienie">Read our in-depth guide: Custom Engagement Ring — Cost, Process & Gemstone Selection →</A></>,
          <><A href="/blog/pierscionek-zareczynowy-na-zamowienie">Lesen Sie unseren ausführlichen Leitfaden: Verlobungsring nach Maß — Kosten, Prozess & Steinauswahl →</A></>,
        )}
      </Callout>

      <H2 id={id("proces-wyceny", "quoting-process", "angebotsprozess")}>{t("Jak wygląda proces wyceny?", "How does the quoting process work?", "Wie läuft der Angebotsprozess ab?")}</H2>
      <P>{t(
        "W AEJaCA wycena to nie formularz — to rozmowa. Oto jak to działa:",
        "At AEJaCA a quote isn't a form — it's a conversation. Here's how it works:",
        "Bei AEJaCA ist ein Angebot kein Formular — es ist ein Gespräch. So funktioniert es:"
      )}</P>
      <OL>
        <LI>
          <Strong>{t("Konsultacja", "Consultation", "Beratung")}</Strong> — {t(
            "opisujesz pomysł, styl życia, budżet. Możesz przesłać szkic, zdjęcie inspiracji lub po prostu napisać kilka słów.",
            "you describe the idea, lifestyle, and budget. You can send a sketch, inspiration photo, or just a few words.",
            "Sie beschreiben die Idee, den Lebensstil und das Budget. Sie können eine Skizze, ein Inspirationsfoto oder einfach ein paar Worte senden."
          )}
        </LI>
        <LI>
          <Strong>{t("Projekt CAD + render 3D", "CAD design + 3D render", "CAD-Design + 3D-Render")}</Strong> — {t(
            "przygotowujemy fotorealistyczny render z każdego kąta. Widzisz pierścionek (lub inny element) zanim rozpoczniemy produkcję. Zmiany na tym etapie są bezpłatne.",
            "we prepare a photorealistic render from every angle. You see the ring (or other piece) before production begins. Changes at this stage are free.",
            "wir erstellen einen fotorealistischen Render aus jedem Winkel. Sie sehen den Ring (oder das andere Stück) bevor die Produktion beginnt. Änderungen in dieser Phase sind kostenlos."
          )}
        </LI>
        <LI>
          <Strong>{t("Szczegółowa wycena", "Detailed quote", "Detailliertes Angebot")}</Strong> — {t(
            "otrzymujesz rozbicie: surowiec (masa × cena/g), kamienie (konkretne egzemplarze ze zdjęciami), robocizna, wykończenie. Bez ukrytych kosztów.",
            "you receive a breakdown: raw material (weight × price/g), gemstones (specific specimens with photos), labor, finishing. No hidden costs.",
            "Sie erhalten eine Aufschlüsselung: Rohstoff (Gewicht × Preis/g), Edelsteine (spezifische Exemplare mit Fotos), Arbeit, Veredelung. Keine versteckten Kosten."
          )}
        </LI>
        <LI>
          <Strong>{t("Zatwierdzenie i produkcja", "Approval and production", "Freigabe und Produktion")}</Strong> — {t(
            "płacisz po akceptacji wyceny. Realizacja: 1–6 tygodni w zależności od złożoności.",
            "you pay after accepting the quote. Production: 1–6 weeks depending on complexity.",
            "Sie zahlen nach Annahme des Angebots. Produktion: 1–6 Wochen je nach Komplexität."
          )}
        </LI>
      </OL>
      <P>{t(
        "Cały proces wyceny (od pierwszej wiadomości do szczegółowej oferty) zajmuje max 24h.",
        "The entire quoting process (from first message to detailed offer) takes max 24h.",
        "Der gesamte Angebotsprozess (von der ersten Nachricht bis zum detaillierten Angebot) dauert max. 24h."
      )}</P>

      <H2 id={id("kiedy-warto", "when-worth-it", "wann-lohnt-es-sich")}>{t("Kiedy warto zamawiać biżuterię na zamówienie?", "When is custom jewelry worth it?", "Wann lohnt sich individueller Schmuck?")}</H2>
      <UL>
        <LI><Strong>{t("Chcesz unikalny design", "You want a unique design", "Sie wollen ein einzigartiges Design")}</Strong> — {t("czegoś, czego nie znajdziesz w żadnym sklepie. Własny wzór, symbol, inicjały.", "something you won't find in any store. Your own pattern, symbol, initials.", "etwas, das Sie in keinem Geschäft finden. Eigenes Muster, Symbol, Initialen.")}</LI>
        <LI><Strong>{t("Niestandardowy rozmiar", "Non-standard size", "Nicht-Standardgröße")}</Strong> — {t("gotowe pierścionki są dostępne w ograniczonym zakresie; custom = dokładnie Twój rozmiar.", "off-the-shelf rings come in limited sizes; custom = your exact size.", "Fertigware ist in begrenzten Größen erhältlich; custom = Ihre genaue Größe.")}</LI>
        <LI><Strong>{t("Alergia na nikiel", "Nickel allergy", "Nickel-Allergie")}</Strong> — {t("zamawiając custom, kontrolujesz stop. W AEJaCA używamy wyłącznie stopów wolnych od niklu.", "ordering custom means you control the alloy. At AEJaCA we use only nickel-free alloys.", "Bei einer Bestellung kontrollieren Sie die Legierung. Bei AEJaCA verwenden wir ausschließlich nickelfreie Legierungen.")}</LI>
        <LI><Strong>{t("Przeróbka rodzinnej biżuterii", "Reworking heirloom jewelry", "Umbau von Erbschmuck")}</Strong> — {t("stary pierścionek w nowej oprawie, przetopienie złota babci w nowy wisiorek.", "an old ring in a new setting, melting down grandmother's gold into a new pendant.", "ein alter Ring in neuer Fassung, Einschmelzen von Omas Gold in einen neuen Anhänger.")}</LI>
        <LI><Strong>{t("Prezent z osobistym znaczeniem", "A gift with personal meaning", "Ein Geschenk mit persönlicher Bedeutung")}</Strong> — {t("grawer z datą, kamień urodzeniowy, symbol ważny tylko dla was dwojga.", "engraving with a date, birthstone, a symbol meaningful only to the two of you.", "Gravur mit einem Datum, Geburtsstein, ein Symbol, das nur für Sie beide bedeutsam ist.")}</LI>
      </UL>
      <Callout accent="amber" title={t("Wycena zawsze bezpłatna", "Quote always free", "Angebot immer kostenlos")}>{t(
        "Użyj kalkulatora biżuterii, żeby zobaczyć orientacyjną cenę — albo napisz do nas bezpośrednio. Wycena jest zawsze bezpłatna i niezobowiązująca.",
        "Use the jewelry calculator for an instant estimate — or write to us directly. A quote is always free and non-binding.",
        "Nutzen Sie den Schmuckkalkulator für eine sofortige Schätzung — oder schreiben Sie uns direkt. Ein Angebot ist immer kostenlos und unverbindlich."
      )}</Callout>

      <CTABox
        accent="amber"
        title={t("Sprawdź cenę swojego projektu", "Check the price of your design", "Preis Ihres Designs prüfen")}
        text={t(
          "Kalkulator biżuterii AEJaCA poda orientacyjną cenę w 30 sekund. Chcesz dokładną wycenę z renderem 3D? Napisz — odpowiemy w 24h.",
          "AEJaCA's jewelry calculator gives an instant estimate in 30 seconds. Want a detailed quote with a 3D render? Write to us — we'll reply within 24h.",
          "Der AEJaCA-Schmuckkalkulator gibt in 30 Sekunden eine Sofortschätzung. Möchten Sie ein detailliertes Angebot mit 3D-Render? Schreiben Sie uns — wir antworten innerhalb von 24h."
        )}
        href="/jewelry#calculator"
        cta={t("Kalkulator biżuterii", "Jewelry calculator", "Schmuckkalkulator")}
      />
    </>
  );
}
