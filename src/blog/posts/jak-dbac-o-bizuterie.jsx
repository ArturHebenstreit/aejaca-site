import { H2, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./jak-dbac-o-bizuterie.meta.js";

export function Body({ lang }) {
  const id = (pl, en, de) => lang === "pl" ? pl : lang === "de" ? de : en;
  const t = id;

  return (
    <>
      <Lead>{t(
        "Biżuteria to inwestycja — emocjonalna i finansowa. Odpowiednia pielęgnacja sprawi, że Twoje pierścionki, kolczyki i wisiorki będą wyglądać pięknie przez pokolenia.",
        "Jewelry is an investment — emotional and financial. Proper care keeps your rings, earrings, and pendants looking beautiful for generations.",
        "Schmuck ist eine Investition — emotional und finanziell. Richtige Pflege hält Ihre Ringe, Ohrringe und Anhänger über Generationen hinweg schön."
      )}</Lead>

      <H2 id={id("srebro", "silver", "silber")}>{t("Pielęgnacja srebra 925", "Silver 925 Care", "Pflege von Silber 925")}</H2>
      <P>{t(
        <><A href="/glossary/srebro-925">Srebro próby 925</A> naturalnie ciemnieje w kontakcie z siarką obecną w powietrzu. To normalne — i w pełni odwracalne. Oto jak o nie dbać:</>,
        <><A href="/glossary/srebro-925">Sterling silver 925</A> naturally tarnishes when exposed to sulfur in the air. This is normal — and fully reversible. Here's how to care for it:</>,
        <><A href="/glossary/srebro-925">Sterling-Silber 925</A> läuft bei Kontakt mit Schwefel in der Luft natürlich an. Das ist normal — und vollständig umkehrbar. So pflegen Sie es:</>
      )}</P>
      <UL>
        <LI><Strong>{t("Codziennie", "Daily", "Täglich")}</Strong> — {t("po noszeniu przetrzyj miękką szmatką z mikrofibry", "wipe with a soft microfiber cloth after wearing", "nach dem Tragen mit einem weichen Mikrofasertuch abwischen")}</LI>
        <LI><Strong>{t("Co miesiąc", "Monthly", "Monatlich")}</Strong> — {t("ciepła woda + łagodne mydło, delikatna szczoteczka", "warm water + mild soap, gentle brush", "warmes Wasser + milde Seife, sanfte Bürste")}</LI>
        <LI><Strong>{t("Głębokie czyszczenie", "Deep cleaning", "Tiefenreinigung")}</Strong> — {t("pasta jubilerska lub kąpiel: soda oczyszczona + folia aluminiowa + gorąca woda", "polishing paste or bath: baking soda + aluminum foil + hot water", "Polierpaste oder Bad: Natron + Alufolie + heißes Wasser")}</LI>
        <LI><Strong>{t(<A href="/glossary/rodowanie">Rodowanie</A>, <A href="/glossary/rodowanie">Rhodium plating</A>, <A href="/glossary/rodowanie">Rhodinierung</A>)}</Strong> — {t("jeśli srebro ma powłokę rodową, unikaj past ściernych — używaj tylko szmatki", "if silver has rhodium coating, avoid abrasive pastes — use cloth only", "bei rhodiniertem Silber keine Scheuermittel — nur Tuch verwenden")}</LI>
      </UL>

      <H2 id={id("zloto", "gold", "gold-de")}>{t("Pielęgnacja złota", "Gold Care", "Goldpflege")}</H2>
      <P>{t(
        "Złoto jest trwalsze od srebra, ale również wymaga uwagi. Im wyższa próba, tym miększy metal — i łatwiej go zarysować.",
        "Gold is more durable than silver, but still needs attention. Higher karat means softer metal — and easier to scratch.",
        "Gold ist haltbarer als Silber, braucht aber ebenfalls Aufmerksamkeit. Höherer Karatgehalt bedeutet weicheres Metall — und leichteres Verkratzen."
      )}</P>
      <UL>
        <LI><Strong>{t("Złoto 14k (585)", "14k gold (585)", "14-Karat-Gold (585)")}</Strong> — {t("najtwardszy stop, najlepszy na codzień, odporny na zarysowania", "hardest alloy, best for daily wear, scratch-resistant", "härteste Legierung, ideal für den Alltag, kratzfest")}</LI>
        <LI><Strong>{t("Złoto 18k (750)", "18k gold (750)", "18-Karat-Gold (750)")}</Strong> — {t("bogatszy kolor, miększy, idealny na wyjątkowe okazje", "richer color, softer, ideal for special pieces", "reichere Farbe, weicher, ideal für besondere Stücke")}</LI>
      </UL>
      <P>{t(
        "Czyść ciepłą wodą z mydłem i miękką szczoteczką. Unikaj chloru (baseny), perfum i środków chemicznych — nakładaj je przed założeniem biżuterii, nie po.",
        "Clean with warm soapy water and a soft brush. Avoid chlorine (pools), perfumes, and chemicals — apply them before putting on jewelry, not after.",
        "Reinigen Sie mit warmem Seifenwasser und einer weichen Bürste. Vermeiden Sie Chlor (Schwimmbäder), Parfüm und Chemikalien — tragen Sie diese vor dem Anlegen des Schmucks auf."
      )}</P>
      <Callout accent="amber" title={t("Porada", "Tip", "Tipp")}>{t(
        "Profesjonalne polerowanie u jubilera raz w roku przywraca złotu fabryczny blask — szczególnie przy pierścionkach noszonych codziennie.",
        "Professional polishing at a jeweler once a year restores gold's original shine — especially for rings worn daily.",
        "Professionelles Polieren beim Juwelier einmal im Jahr stellt den ursprünglichen Glanz des Goldes wieder her — besonders bei täglich getragenen Ringen."
      )}</Callout>

      <H2 id={id("kamienie", "gemstones", "edelsteine")}>{t("Ochrona kamieni szlachetnych", "Gemstone Protection", "Edelsteinschutz")}</H2>
      <P>{t(
        <>Różne <A href="/glossary/kamien-szlachetny">kamienie szlachetne</A> wymagają różnej pielęgnacji. Twardość w skali Mohsa to kluczowy wskaźnik:</>,
        <>Different <A href="/glossary/kamien-szlachetny">gemstones</A> need different care. Mohs hardness is the key indicator:</>,
        <>Verschiedene <A href="/glossary/kamien-szlachetny">Edelsteine</A> brauchen unterschiedliche Pflege. Die Mohs-Härte ist der Schlüsselindikator:</>
      )}</P>
      <Table
        headers={[
          t("Kamień", "Stone", "Stein"),
          t("Twardość", "Hardness", "Härte"),
          t("Czyszczenie", "Cleaning", "Reinigung"),
          t("Unikać", "Avoid", "Vermeiden"),
        ]}
        rows={[
          [t("Diament", "Diamond", "Diamant"), "10", t("mydło + szczoteczka, ultradźwięki OK", "soap + brush, ultrasonic OK", "Seife + Bürste, Ultraschall OK"), t("uderzeń bezpośrednich", "direct impacts", "direkte Stöße")],
          [t("Szafir / Rubin", "Sapphire / Ruby", "Saphir / Rubin"), "9", t("ciepła woda + mydło", "warm water + soap", "warmes Wasser + Seife"), t("nagłych zmian temperatury", "sudden temperature changes", "plötzlicher Temperaturwechsel")],
          [t("Szmaragd", "Emerald", "Smaragd"), "7.5–8", t("tylko wilgotna szmatka", "damp cloth only", "nur feuchtes Tuch"), t("ultradźwięków, chemii, uderzeń", "ultrasonics, chemicals, impacts", "Ultraschall, Chemikalien, Stöße")],
          [t("Opal", "Opal", "Opal"), "5.5–6.5", t("wilgotna szmatka, nawilżanie", "damp cloth, occasional moisture", "feuchtes Tuch, gelegentliche Feuchtigkeit"), t("suchości, ciepła, ultradźwięków", "dryness, heat, ultrasonics", "Trockenheit, Hitze, Ultraschall")],
          [t("Perła", "Pearl", "Perle"), "2.5–4.5", t("wilgotna szmatka po każdym noszeniu", "damp cloth after each wear", "feuchtes Tuch nach jedem Tragen"), t("perfum, kwasów, suchości", "perfumes, acids, dryness", "Parfüm, Säuren, Trockenheit")],
        ]}
      />
      <Callout accent="amber" title={t("Uwaga", "Note", "Hinweis")}>{t(
        "Myjki ultradźwiękowe są bezpieczne dla diamentów i szafirów, ale mogą uszkodzić szmaragdy, opale i perły.",
        "Ultrasonic cleaners are safe for diamonds and sapphires, but can damage emeralds, opals, and pearls.",
        "Ultraschallreiniger sind sicher für Diamanten und Saphire, können aber Smaragde, Opale und Perlen beschädigen."
      )}</Callout>

      <H2 id={id("przechowywanie", "storage", "aufbewahrung")}>{t("Przechowywanie biżuterii", "Jewelry Storage", "Schmuck aufbewahren")}</H2>
      <UL>
        <LI><Strong>{t("Osobne przegródki", "Separate compartments", "Getrennte Fächer")}</Strong> — {t("każdy element osobno, by uniknąć zarysowań", "keep each piece separate to avoid scratches", "jedes Stück einzeln aufbewahren, um Kratzer zu vermeiden")}</LI>
        <LI><Strong>{t("Paski antyoksydacyjne", "Anti-tarnish strips", "Anti-Anlauf-Streifen")}</Strong> — {t("wkładki pochłaniające siarkę dla srebra", "sulfur-absorbing inserts for silver", "schwefelabsorbierende Einlagen für Silber")}</LI>
        <LI><Strong>{t("Z dala od wilgoci", "Away from humidity", "Fern von Feuchtigkeit")}</Strong> — {t("łazienka to najgorsze miejsce na biżuterię", "the bathroom is the worst place for jewelry", "das Badezimmer ist der schlechteste Ort für Schmuck")}</LI>
        <LI><Strong>{t("W podróży", "Traveling", "Auf Reisen")}</Strong> — {t("miękkie woreczki, nigdy plastikowe torebki (gromadzą wilgoć)", "soft pouches, never plastic bags (trap moisture)", "weiche Beutel, nie Plastiktüten (Feuchtigkeit)")}</LI>
      </UL>

      <H2 id={id("bledy", "mistakes", "fehler")}>{t("Najczęstsze błędy", "Common Mistakes", "Häufige Fehler")}</H2>
      <UL>
        <LI><Strong>{t("Noszenie pod prysznicem / na basenie", "Wearing in shower / pool", "Tragen unter der Dusche / im Pool")}</Strong> — {t("chlor i mydło to wrogowie srebra i kamieni", "chlorine and soap are enemies of silver and stones", "Chlor und Seife sind Feinde von Silber und Steinen")}</LI>
        <LI><Strong>{t("Przechowywanie razem", "Storing together", "Gemeinsam aufbewahren")}</Strong> — {t("twardsze kamienie rysują miększe metale", "harder stones scratch softer metals", "härtere Steine verkratzen weichere Metalle")}</LI>
        <LI><Strong>{t("Pasta do zębów", "Toothpaste", "Zahnpasta")}</Strong> — {t("zbyt ścierna! Zostawia mikrozarysowania na złocie i srebrze", "too abrasive! Leaves micro-scratches on gold and silver", "zu abrasiv! Hinterlässt Mikrokratzer auf Gold und Silber")}</LI>
        <LI><Strong>{t("Ignorowanie luźnych opraw", "Ignoring loose settings", "Lockere Fassungen ignorieren")}</Strong> — {t("sprawdzaj raz na kwartał, czy kamienie się nie ruszają", "check quarterly whether stones are loose", "vierteljährlich prüfen, ob Steine locker sitzen")}</LI>
      </UL>

      <CTABox
        accent="amber"
        title={t("Planujesz nowy pierścionek lub kolczyki?", "Planning a new ring or earrings?", "Planen Sie einen neuen Ring oder Ohrringe?")}
        text={t(
          "Skorzystaj z naszego kalkulatora biżuterii — wycena w 30 sekund.",
          "Try our jewelry calculator — get a quote in 30 seconds.",
          "Nutzen Sie unseren Schmuckkalkulator — Angebot in 30 Sekunden."
        )}
        href="/jewelry#calculator"
        cta={t("Kalkulator biżuterii", "Jewelry calculator", "Schmuckkalkulator")}
      />
    </>
  );
}
