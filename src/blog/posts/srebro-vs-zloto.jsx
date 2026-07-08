import { H2, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./srebro-vs-zloto.meta.js";

export function Body({ lang }) {
  const t = (pl, en, de) => lang === "pl" ? pl : lang === "de" ? de : en;
  const id = t;

  return (
    <>
      <Lead>{t(
        "Srebro czy złoto? To pierwsze pytanie przy tworzeniu biżuterii na zamówienie — i nie ma jednej uniwersalnej odpowiedzi. Właściwy metal zależy od stylu życia, skóry, budżetu i gustu.",
        "Silver or gold? It's the first question in custom jewelry — and there's no universal answer. The right metal depends on your lifestyle, skin, budget, and taste.",
        "Silber oder Gold? Die erste Frage bei individuellem Schmuck — und es gibt keine universelle Antwort. Das richtige Metall hängt von Lebensstil, Haut, Budget und Geschmack ab."
      )}</Lead>

      <H2 id={id("porownanie", "comparison", "vergleich")}>{t("Porównanie właściwości", "Properties Comparison", "Eigenschaftsvergleich")}</H2>
      <Table
        headers={[
          t("Właściwość", "Property", "Eigenschaft"),
          t("Srebro 925", "Silver 925", "Silber 925"),
          t("Złoto 14k (585)", "Gold 14k (585)", "Gold 14k (585)"),
          t("Złoto 18k (750)", "Gold 18k (750)", "Gold 18k (750)"),
        ]}
        rows={[
          [t("Czystość", "Purity", "Reinheit"), "92,5% Ag", "58,5% Au", "75% Au"],
          [t("Kolor", "Color", "Farbe"), t("jasny biały", "bright white", "helles Weiß"), t("ciepły żółty/biały/różowy", "warm yellow/white/rose", "warmes Gelb/Weiß/Rosé"), t("bogaty żółty/biały/różowy", "rich yellow/white/rose", "sattes Gelb/Weiß/Rosé")],
          [t("Twardość (Mohs)", "Hardness (Mohs)", "Härte (Mohs)"), "2,5–3", "3–4", "2,5–3"],
          [t("Gęstość", "Density", "Dichte"), "10,5 g/cm³", "13,1 g/cm³", "15,2 g/cm³"],
          [t("Matowienie", "Tarnish", "Anlaufen"), t("tak (patyna)", "yes (patina)", "ja (Patina)"), t("nie", "no", "nein"), t("nie", "no", "nein")],
          [t("Przedział cenowy", "Price range", "Preisklasse"), "€€", "€€€", "€€€€"],
        ]}
      />

      <H2 id={id("trwalosc", "durability", "haltbarkeit")}>{t("Trwałość w praktyce", "Practical Durability", "Haltbarkeit in der Praxis")}</H2>
      <UL>
        <LI><Strong>{t("Srebro 925", "Silver 925", "Silber 925")}</Strong> — {t("miękkie, łatwiej się rysuje, wymaga polerowania — ale bardzo łatwe w naprawie", "soft, scratches more easily, needs polishing — but very easy to repair", "weich, verkratzt leichter, braucht Politur — aber sehr einfach zu reparieren")}</LI>
        <LI><Strong>{t("Złoto 14k", "14k gold", "14-Karat-Gold")}</Strong> — {t("najtwardszy stop ze wszystkich trzech — najlepszy na codzienne noszenie", "hardest alloy of the three — best for daily wear", "härteste Legierung der drei — am besten für den Alltag")}</LI>
        <LI><Strong>{t("Złoto 18k", "18k gold", "18-Karat-Gold")}</Strong> — {t("miększe od 14k, ale bogatszy kolor — idealne na wyjątkowe elementy", "softer than 14k but richer color — ideal for special pieces", "weicher als 14k, aber sattere Farbe — ideal für besondere Stücke")}</LI>
      </UL>
      <Callout accent="amber" title={t("Rekomendacja", "Recommendation", "Empfehlung")}>{t(
        "Na pierścionki zaręczynowe noszone codziennie polecamy złoto 14k — najlepsza równowaga piękna i wytrzymałości.",
        "For engagement rings worn daily, we recommend 14k gold — the best balance of beauty and durability.",
        "Für täglich getragene Verlobungsringe empfehlen wir 14-Karat-Gold — die beste Balance aus Schönheit und Haltbarkeit."
      )}</Callout>

      <H2 id={id("alergie", "allergies", "allergien")}>{t("Alergie i skóra", "Allergies & Skin", "Allergien & Haut")}</H2>
      <UL>
        <LI>{t("Czyste srebro i złoto o wysokiej próbie są hipoalergiczne", "Pure silver and high-karat gold are hypoallergenic", "Reines Silber und hochkarätiges Gold sind hypoallergen")}</LI>
        <LI>{t("Nikiel w niektórych stopach złota wywołuje reakcje — w AEJaCA używamy wyłącznie stopów bez niklu", "Nickel in some gold alloys causes reactions — at AEJaCA we use nickel-free alloys exclusively", "Nickel in manchen Goldlegierungen verursacht Reaktionen — bei AEJaCA verwenden wir ausschließlich nickelfreie Legierungen")}</LI>
        <LI>{t("pH skóry wpływa na matowienie — niektóre osoby przyciemniają srebro szybciej", "Skin pH affects tarnishing — some people darken silver faster", "Der Haut-pH beeinflusst das Anlaufen — manche Menschen verdunkeln Silber schneller")}</LI>
        <LI>{t(<><A href="/glossary/rodowanie">Rodowanie</A> (na srebrze lub białym złocie) dodaje dodatkową ochronę</>, <><A href="/glossary/rodowanie">Rhodium plating</A> (on silver or white gold) adds extra protection</>, <><A href="/glossary/rodowanie">Rhodinierung</A> (auf Silber oder Weißgold) bietet zusätzlichen Schutz</>)}</LI>
      </UL>

      <H2 id={id("ceny", "prices", "preise")}>{t("Realistyczne porównanie cen", "Realistic Price Comparison", "Realistischer Preisvergleich")}</H2>
      <Table
        headers={[
          t("Element", "Piece", "Stück"),
          t("Srebro 925", "Silver 925", "Silber 925"),
          t("Złoto 14k", "Gold 14k", "Gold 14k"),
          t("Złoto 18k", "Gold 18k", "Gold 18k"),
        ]}
        rows={[
          [t("Prosty pierścionek", "Simple ring", "Einfacher Ring"), t("od 170 zł", "from €40", "ab 40 €"), t("od 780 zł", "from €180", "ab 180 €"), t("od 1200 zł", "from €280", "ab 280 €")],
          [t("Wisiorek", "Pendant", "Anhänger"), t("od 150 zł", "from €35", "ab 35 €"), t("od 650 zł", "from €150", "ab 150 €"), t("od 950 zł", "from €220", "ab 220 €")],
          [t("Kolczyki (para)", "Earrings (pair)", "Ohrringe (Paar)"), t("od 215 zł", "from €50", "ab 50 €"), t("od 860 zł", "from €200", "ab 200 €"), t("od 1380 zł", "from €320", "ab 320 €")],
          [t("Pierścionek zaręczynowy", "Engagement ring", "Verlobungsring"), t("od 350 zł", "from €80", "ab 80 €"), t("od 1505 zł", "from €350", "ab 350 €"), t("od 2365 zł", "from €550", "ab 550 €")],
        ]}
      />
      <P>{t(
        "Ceny nie zawierają kamieni szlachetnych, które dodają od 85 zł do 8600 zł+ w zależności od rodzaju i wielkości.",
        "Prices exclude gemstones, which add €20 to €2,000+ depending on type and size.",
        "Preise ohne Edelsteine, die je nach Art und Größe 20 € bis 2.000 €+ hinzufügen."
      )}</P>

      <H2 id={id("kiedy-co", "when-which", "wann-welches")}>{t("Kiedy który metal?", "When to Choose Which?", "Wann welches Metall?")}</H2>
      <P><Strong>{t("Wybierz srebro, jeśli:", "Choose silver if:", "Wählen Sie Silber, wenn:")}</Strong></P>
      <UL>
        <LI>{t("zależy Ci na budżecie", "you're budget-conscious", "Ihnen das Budget wichtig ist")}</LI>
        <LI>{t("lubisz mieć dużo biżuterii i często zmieniać styl", "you love variety and changing styles often", "Sie Abwechslung lieben und den Stil oft wechseln")}</LI>
        <LI>{t("to Twój pierwszy element na zamówienie", "it's your first custom piece", "es Ihr erstes Maßstück ist")}</LI>
      </UL>
      <P><Strong>{t("Wybierz złoto 14k, jeśli:", "Choose 14k gold if:", "Wählen Sie 14-Karat-Gold, wenn:")}</Strong></P>
      <UL>
        <LI>{t("nosisz biżuterię codziennie", "you wear jewelry daily", "Sie Schmuck täglich tragen")}</LI>
        <LI>{t(<>szukasz <A href="/glossary/pierscionek-zareczynowy">pierścionka zaręczynowego</A> lub obrączki</>, <>you're looking for an <A href="/glossary/pierscionek-zareczynowy">engagement</A> or <A href="/glossary/obraczki-slubne">wedding ring</A></>, <>Sie einen <A href="/glossary/pierscionek-zareczynowy">Verlobungs-</A> oder <A href="/glossary/obraczki-slubne">Ehering</A> suchen</>)}</LI>
        <LI>{t("cenisz trwałość i ciepły kolor", "you value durability and warm color", "Sie Haltbarkeit und warme Farbe schätzen")}</LI>
      </UL>
      <P><Strong>{t("Wybierz złoto 18k, jeśli:", "Choose 18k gold if:", "Wählen Sie 18-Karat-Gold, wenn:")}</Strong></P>
      <UL>
        <LI>{t("to element inwestycyjny lub heirloom", "it's an investment or heirloom piece", "es ein Investitions- oder Erbstück ist")}</LI>
        <LI>{t("zależy Ci na głębokim, bogatym kolorze złota", "you want deep, rich gold color", "Sie eine tiefe, satte Goldfarbe wünschen")}</LI>
        <LI>{t("szukasz luksusu w każdym detalu", "you seek luxury in every detail", "Sie Luxus in jedem Detail suchen")}</LI>
      </UL>
      <Callout accent="amber" title={t("Nie wiesz?", "Not sure?", "Unsicher?")}>{t(
        "Użyj naszego kalkulatora biżuterii, by porównać ceny tego samego projektu w różnych metalach.",
        "Use our jewelry calculator to compare prices for the same design in different metals.",
        "Nutzen Sie unseren Schmuckkalkulator, um Preise für dasselbe Design in verschiedenen Metallen zu vergleichen."
      )}</Callout>

      <CTABox
        accent="amber"
        title={t("Porównaj metale dla swojego projektu", "Compare metals for your design", "Vergleichen Sie Metalle für Ihr Design")}
        text={t(
          "Kalkulator biżuterii AEJaCA pokaże cenę w srebrze, złocie 14k i 18k — w 30 sekund.",
          "AEJaCA's jewelry calculator shows the price in silver, 14k, and 18k gold — in 30 seconds.",
          "Der AEJaCA-Schmuckkalkulator zeigt den Preis in Silber, 14k und 18k Gold — in 30 Sekunden."
        )}
        href="/jewelry#calculator"
        cta={t("Kalkulator biżuterii", "Jewelry calculator", "Schmuckkalkulator")}
      />
    </>
  );
}
