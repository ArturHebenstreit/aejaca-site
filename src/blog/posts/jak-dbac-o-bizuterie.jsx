import { H2, P, Lead, UL, LI, Strong, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "jak-dbac-o-bizuterie",
  category: "jewelry",
  accent: "amber",
  publishedAt: "2026-04-20",
  coverImage: "/img/blog/jak-dbac-o-bizuterie.webp",
  readingTime: { pl: 6, en: 5, de: 5 },
  title: {
    pl: "Jak dbać o biżuterię srebrną i złotą — poradnik AEJaCA",
    en: "How to Care for Silver & Gold Jewelry — AEJaCA Guide",
    de: "Wie pflegt man Silber- & Goldschmuck — AEJaCA Ratgeber",
  },
  description: {
    pl: "Praktyczny poradnik pielęgnacji biżuterii ze srebra 925 i złota. Czyszczenie, przechowywanie, ochrona kamieni szlachetnych.",
    en: "Practical guide to caring for silver 925 and gold jewelry. Cleaning, storage, gemstone protection — everything you need to know.",
    de: "Praktischer Ratgeber zur Pflege von Silber-925- und Goldschmuck. Reinigung, Aufbewahrung, Edelsteinschutz — alles Wissenswerte.",
  },
  keywords: {
    pl: "pielęgnacja biżuterii, czyszczenie srebra, jak dbać o złoto, biżuteria srebrna, kamienie szlachetne pielęgnacja, AEJaCA",
    en: "jewelry care, silver cleaning, gold maintenance, gemstone care, silver 925 care, jewelry storage, AEJaCA",
    de: "Schmuckpflege, Silberreinigung, Goldpflege, Edelsteinpflege, Silber 925 Pflege, Schmuck Aufbewahrung, AEJaCA",
  },
  toc: {
    pl: [
      { id: "srebro", label: "Pielęgnacja srebra" },
      { id: "zloto", label: "Pielęgnacja złota" },
      { id: "kamienie", label: "Ochrona kamieni" },
      { id: "przechowywanie", label: "Przechowywanie" },
      { id: "bledy", label: "Najczęstsze błędy" },
    ],
    en: [
      { id: "silver", label: "Silver care" },
      { id: "gold", label: "Gold care" },
      { id: "gemstones", label: "Gemstone protection" },
      { id: "storage", label: "Storage" },
      { id: "mistakes", label: "Common mistakes" },
    ],
    de: [
      { id: "silber", label: "Silberpflege" },
      { id: "gold-de", label: "Goldpflege" },
      { id: "edelsteine", label: "Edelsteinschutz" },
      { id: "aufbewahrung", label: "Aufbewahrung" },
      { id: "fehler", label: "Häufige Fehler" },
    ],
  },
  faq: {
    pl: [
      { q: "Jak często czyścić biżuterię srebrną?", a: "Co 2–4 tygodnie delikatną szmatką z mikrofibry. Głębokie czyszczenie pastą jubilerską — raz na 2–3 miesiące." },
      { q: "Czy mogę nosić biżuterię pod prysznicem?", a: "Nie zalecamy. Woda chlorowana i mydło przyspieszają matowienie srebra i mogą uszkodzić kamienie." },
      { q: "Jak usunąć czernienie ze srebra?", a: "Pasta jubilerska, kąpiel w sodzie oczyszczonej z folią aluminiową lub profesjonalne czyszczenie ultradźwiękowe." },
      { q: "Czy złoto 14k wymaga pielęgnacji?", a: "Tak, choć rzadziej niż srebro. Wystarczy polerowanie miękką szmatką i unikanie kontaktu z chemikaliami." },
    ],
    en: [
      { q: "How often should I clean silver jewelry?", a: "Every 2–4 weeks with a soft microfiber cloth. Deep cleaning with polishing paste — once every 2–3 months." },
      { q: "Can I wear jewelry in the shower?", a: "We don't recommend it. Chlorinated water and soap accelerate silver tarnishing and can damage gemstones." },
      { q: "How to remove tarnish from silver?", a: "Polishing paste, baking soda bath with aluminum foil, or professional ultrasonic cleaning." },
      { q: "Does 14k gold need maintenance?", a: "Yes, though less frequently than silver. Gentle polishing with a soft cloth and avoiding chemicals is sufficient." },
    ],
    de: [
      { q: "Wie oft sollte man Silberschmuck reinigen?", a: "Alle 2–4 Wochen mit einem weichen Mikrofasertuch. Tiefenreinigung mit Polierpaste — alle 2–3 Monate." },
      { q: "Kann ich Schmuck unter der Dusche tragen?", a: "Wir empfehlen es nicht. Chlorwasser und Seife beschleunigen das Anlaufen von Silber und können Edelsteine beschädigen." },
      { q: "Wie entferne ich Anlaufstellen von Silber?", a: "Polierpaste, Natronbad mit Alufolie oder professionelle Ultraschallreinigung." },
      { q: "Braucht 14-Karat-Gold Pflege?", a: "Ja, aber seltener als Silber. Sanftes Polieren mit weichem Tuch und Vermeidung von Chemikalien reicht aus." },
    ],
  },
  relatedPosts: ["srebro-vs-zloto", "obraczki-slubne-na-zamowienie"],
};

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
        "Srebro próby 925 naturalnie ciemnieje w kontakcie z siarką obecną w powietrzu. To normalne — i w pełni odwracalne. Oto jak o nie dbać:",
        "Sterling silver 925 naturally tarnishes when exposed to sulfur in the air. This is normal — and fully reversible. Here's how to care for it:",
        "Sterling-Silber 925 läuft bei Kontakt mit Schwefel in der Luft natürlich an. Das ist normal — und vollständig umkehrbar. So pflegen Sie es:"
      )}</P>
      <UL>
        <LI><Strong>{t("Codziennie", "Daily", "Täglich")}</Strong> — {t("po noszeniu przetrzyj miękką szmatką z mikrofibry", "wipe with a soft microfiber cloth after wearing", "nach dem Tragen mit einem weichen Mikrofasertuch abwischen")}</LI>
        <LI><Strong>{t("Co miesiąc", "Monthly", "Monatlich")}</Strong> — {t("ciepła woda + łagodne mydło, delikatna szczoteczka", "warm water + mild soap, gentle brush", "warmes Wasser + milde Seife, sanfte Bürste")}</LI>
        <LI><Strong>{t("Głębokie czyszczenie", "Deep cleaning", "Tiefenreinigung")}</Strong> — {t("pasta jubilerska lub kąpiel: soda oczyszczona + folia aluminiowa + gorąca woda", "polishing paste or bath: baking soda + aluminum foil + hot water", "Polierpaste oder Bad: Natron + Alufolie + heißes Wasser")}</LI>
        <LI><Strong>{t("Rodowanie", "Rhodium plating", "Rhodinierung")}</Strong> — {t("jeśli srebro ma powłokę rodową, unikaj past ściernych — używaj tylko szmatki", "if silver has rhodium coating, avoid abrasive pastes — use cloth only", "bei rhodiniertem Silber keine Scheuermittel — nur Tuch verwenden")}</LI>
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
        "Różne kamienie wymagają różnej pielęgnacji. Twardość w skali Mohsa to kluczowy wskaźnik:",
        "Different stones need different care. Mohs hardness is the key indicator:",
        "Verschiedene Steine brauchen unterschiedliche Pflege. Die Mohs-Härte ist der Schlüsselindikator:"
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
