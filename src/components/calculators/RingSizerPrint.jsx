// ============================================================
// MIARKA DO PIERSCIONKOW DO WYDRUKU
// ============================================================
// Konwerter rozmiarow, ktory juz mamy, obsluguje kogos, kto ZNA swoj rozmiar
// albo umie zmierzyc palec sznurkiem. Ruch w wyszukiwarce jest tam, gdzie
// ktos rozmiaru NIE zna, i to jest osobne, mocno wyszukiwane zapytanie.
// Kazdy liczacy sie sklep jubilerski ma miarke do druku jako oddzielna strone.
//
// Poza ruchem liczy sie druga rzecz: zle dobrany rozmiar to u nas nie zwrot,
// tylko przerobka gotowego wyrobu, czasem z grawerem, ktorego przy zmianie
// rozmiaru nie da sie uratowac.
//
// CALA rzecz stoi na jednym warunku: wydruk musi wyjsc w skali 1:1. Dlatego
// arkusz zaczyna sie od kontrolki z karta platnicza (ISO/IEC 7810 ID-1,
// 85,6 x 53,98 mm, ten sam rozmiar na calym swiecie) i od linijki. Bez tego
// narzedzie klamie, a klamie cicho, bo wynik i tak wyglada sensownie.
//
// Rysunki sa w SVG z viewBox w milimetrach: jedna jednostka SVG to jeden
// milimetr na papierze. Pozycjonowanie CSS-em w `mm` byloby wrazliwe na
// zaokraglenia przegladarki przy skalowaniu.

import { useState } from "react";
import { Printer, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { RING_SIZES } from "../../data/ringSizes.js";

// Obwod palca w mm objety miarka. Ponizej 40 i powyzej 76 mm robimy
// pierscionki na wymiar, ale to margines, a kazdy dodatkowy milimetr
// paska zabiera miejsce na kartce.
const STRIP_MIN = 40;
const STRIP_MAX = 76;

// Odczyt nastepuje na prawej krawedzi szczeliny. Tick dla obwodu C lezy
// dokladnie C milimetrow od tego punktu, bo tyle wynosi obwod petli.
const SLOT_X = 9.6;
const STRIP_TIP = SLOT_X + STRIP_MAX + 14;

const COLS = 6;
const CELL = 28;

const LABELS = {
  pl: {
    printBtn: "Drukuj miarkę",
    withChart: "Dołącz tabelę kółek (druga strona)",
    warnTitle: "Wydrukuj w skali 100%",
    warnText: "W oknie drukowania ustaw skalę na 100% albo „Rozmiar rzeczywisty”. Opcja „Dopasuj do strony” zmniejsza wydruk o kilka procent, co przekłada się na pomyłkę o jeden do dwóch rozmiarów.",
    sheetTitle: "Miarka do pierścionków AEJaCA",
    sheetSub: "aejaca.com/toolsjewelry/ring-sizer",
    calTitle: "1. Sprawdź skalę wydruku",
    calCard: "Przyłóż kartę płatniczą. Musi zakryć prostokąt co do milimetra.",
    calRuler: "Albo zmierz linijką: ten odcinek ma dokładnie 100 mm.",
    stripTitle: "2. Wytnij pasek i zmierz palec",
    stripSteps: [
      "Wytnij pasek wzdłuż konturu i przetnij szczelinę.",
      "Owiń pasek wokół palca, cyframi na zewnątrz, i przewlecz koniec przez szczelinę.",
      "Zaciśnij tak, żeby dał się zsunąć przez kostkę, ale nie obracał luźno.",
      "Odczytaj liczbę przy krawędzi szczeliny. To Twój rozmiar EU.",
    ],
    stripScale: "Obwód palca w mm (= rozmiar EU)",
    chartTitle: "3. Albo zmierz pierścionek, który pasuje",
    chartLead: "Połóż pierścionek na kółku tak, żeby jego wewnętrzna krawędź pokryła się z linią. Sprawdź kilka sąsiednich kółek, bo różnica między rozmiarami to jedna trzecia milimetra.",
    tipsTitle: "Kiedy mierzyć, żeby się nie pomylić",
    tips: [
      "Mierz wieczorem. Rano palce są węższe nawet o pół rozmiaru.",
      "Nie mierz po wysiłku, w upale ani gdy zmarzniesz. Różnica dochodzi do całego rozmiaru.",
      "Mierz ten palec, na którym ma być noszony pierścionek. Lewa i prawa ręka różnią się zwykle o pół rozmiaru.",
      "Szeroka obrączka (powyżej 6 mm) siedzi ciaśniej. Weź pół rozmiaru więcej.",
      "Duża kostka: zmierz kostkę i nasadę palca, wybierz wartość pośrednią.",
    ],
    footTitle: "Masz swój rozmiar?",
    footText: "Przelicz go na US, UK i JP w konwerterze, albo od razu zamów pierścionek na miarę.",
    footConv: "Konwerter rozmiarów",
  },
  en: {
    printBtn: "Print the sizer",
    withChart: "Include the circle chart (second page)",
    warnTitle: "Print at 100% scale",
    warnText: "Set the scale to 100% or „Actual size” in the print dialog. „Fit to page” shrinks the sheet by a few percent, which is worth one to two ring sizes.",
    sheetTitle: "AEJaCA printable ring sizer",
    sheetSub: "aejaca.com/toolsjewelry/ring-sizer",
    calTitle: "1. Check the print scale",
    calCard: "Lay a payment card on the rectangle. It has to cover it exactly.",
    calRuler: "Or use a ruler: this line is exactly 100 mm long.",
    stripTitle: "2. Cut the strip and measure your finger",
    stripSteps: [
      "Cut along the outline and cut the slot open.",
      "Wrap the strip around your finger, numbers facing out, and thread the tip through the slot.",
      "Tighten so it slides over the knuckle but does not spin loosely.",
      "Read the number at the edge of the slot. That is your EU size.",
    ],
    stripScale: "Finger circumference in mm (= EU size)",
    chartTitle: "3. Or measure a ring that already fits",
    chartLead: "Place the ring over a circle so its inner edge matches the line. Check the neighbouring circles too, since one size is a third of a millimetre.",
    tipsTitle: "When to measure so you get it right",
    tips: [
      "Measure in the evening. Fingers are up to half a size slimmer in the morning.",
      "Do not measure after exercise, in the heat or when cold. The swing reaches a full size.",
      "Measure the finger the ring is for. Left and right hands differ by about half a size.",
      "A wide band (over 6 mm) sits tighter. Go half a size up.",
      "Large knuckle: measure the knuckle and the base, then pick a value in between.",
    ],
    footTitle: "Got your size?",
    footText: "Convert it to US, UK and JP, or order a made to measure ring straight away.",
    footConv: "Size converter",
  },
  de: {
    printBtn: "Ringmaß drucken",
    withChart: "Kreistabelle beilegen (zweite Seite)",
    warnTitle: "In 100% Größe drucken",
    warnText: "Stellen Sie im Druckdialog 100% oder „Originalgröße” ein. „An Seite anpassen” verkleinert den Ausdruck um einige Prozent, das entspricht ein bis zwei Ringgrößen.",
    sheetTitle: "AEJaCA Ringmaßband zum Ausdrucken",
    sheetSub: "aejaca.com/toolsjewelry/ring-sizer",
    calTitle: "1. Druckmaßstab prüfen",
    calCard: "Legen Sie eine Bankkarte auf das Rechteck. Sie muss es genau abdecken.",
    calRuler: "Oder mit dem Lineal: diese Strecke ist genau 100 mm lang.",
    stripTitle: "2. Streifen ausschneiden und Finger messen",
    stripSteps: [
      "Entlang der Kontur ausschneiden und den Schlitz aufschneiden.",
      "Den Streifen um den Finger legen, Zahlen nach außen, und die Spitze durch den Schlitz ziehen.",
      "So festziehen, dass er über den Knöchel gleitet, sich aber nicht lose dreht.",
      "Die Zahl an der Schlitzkante ablesen. Das ist Ihre EU-Größe.",
    ],
    stripScale: "Fingerumfang in mm (= EU-Größe)",
    chartTitle: "3. Oder einen passenden Ring messen",
    chartLead: "Legen Sie den Ring so auf einen Kreis, dass die Innenkante auf der Linie liegt. Prüfen Sie auch die Nachbarkreise, denn eine Größe sind nur ein Drittel Millimeter.",
    tipsTitle: "Wann messen, damit es stimmt",
    tips: [
      "Abends messen. Morgens sind Finger bis zu einer halben Größe schlanker.",
      "Nicht nach dem Sport, bei Hitze oder Kälte messen. Der Unterschied erreicht eine ganze Größe.",
      "Den Finger messen, an dem der Ring getragen wird. Linke und rechte Hand unterscheiden sich um eine halbe Größe.",
      "Ein breiter Ring (über 6 mm) sitzt enger. Eine halbe Größe größer wählen.",
      "Großer Knöchel: Knöchel und Fingeransatz messen, dann den Mittelwert nehmen.",
    ],
    footTitle: "Größe gefunden?",
    footText: "Rechnen Sie sie in US, UK und JP um, oder bestellen Sie den Ring direkt nach Maß.",
    footConv: "Größenkonverter",
  },
};

/** Kontrolka skali: karta platnicza ID-1 i linijka 100 mm. */
function Calibration({ l }) {
  const ticks = [];
  for (let i = 0; i <= 100; i += 1) {
    const long = i % 10 === 0;
    const mid = i % 5 === 0;
    ticks.push(
      <line key={i} x1={2 + i} y1={12} x2={2 + i} y2={long ? 4 : mid ? 7 : 9} className="rs-ink" strokeWidth="0.2" />
    );
  }
  return (
    <div className="rs-scroll">
      <svg width="110mm" height="80mm" viewBox="0 0 110 80" className="rs-svg" role="img" aria-label={l.calTitle}>
        <rect x="2" y="2" width="85.6" height="53.98" className="rs-ink" fill="none" strokeWidth="0.3" strokeDasharray="1.5 1" />
        <text x="6" y="10" className="rs-t rs-t-sm">85,6 x 53,98 mm</text>
        <text x="6" y="15" className="rs-t rs-t-xs">ISO/IEC 7810 ID-1</text>
        <g transform="translate(0,60)">
          <line x1="2" y1="12" x2="102" y2="12" className="rs-ink" strokeWidth="0.3" />
          {ticks}
          <text x="2" y="17" className="rs-t rs-t-xs">0</text>
          <text x="48" y="17" className="rs-t rs-t-xs">50 mm</text>
          <text x="89" y="17" className="rs-t rs-t-xs">100 mm</text>
        </g>
      </svg>
    </div>
  );
}

/** Pasek do wyciecia. Odczyt na prawej krawedzi szczeliny. */
function Strip({ l }) {
  // Etykiety co 2 mm, ulozone naprzemiennie w dwoch rzedach. W jednym rzedzie
  // odstep 2 mm jest wezszy niz sama liczba i cyfry zlewaja sie w smuge,
  // co bylo widac na pierwszym wydruku. Naprzemiennie odstep w rzedzie
  // rosnie do 4 mm i liczby maja miejsce.
  const ticks = [];
  for (let c = STRIP_MIN; c <= STRIP_MAX; c += 1) {
    const x = SLOT_X + c;
    const labelled = c % 2 === 0;
    ticks.push(
      <line key={`t${c}`} x1={x} y1={5} x2={x} y2={labelled ? 9.5 : 7.5} className="rs-ink" strokeWidth="0.2" />
    );
    if (labelled) {
      const secondRow = (c / 2) % 2 === 1;
      ticks.push(
        <text key={`l${c}`} x={x} y={secondRow ? 17.2 : 13} textAnchor="middle" className="rs-t rs-t-sm">{c}</text>
      );
    }
  }
  return (
    <div className="rs-scroll">
      <svg width={`${STRIP_TIP + 4}mm`} height="28mm" viewBox={`0 0 ${STRIP_TIP + 4} 28`} className="rs-svg" role="img" aria-label={l.stripTitle}>
        {/* Kontur do wyciecia: glowa 20 mm wysokosci, ogon 14 mm. Glowa musi
            byc wyzsza, bo szczelina ma przepuscic caly ogon. */}
        <path
          d={`M 2 1 H 22 V 4 H ${STRIP_TIP} V 18 H 22 V 21 H 2 Z`}
          className="rs-ink"
          fill="none"
          strokeWidth="0.3"
        />
        {/* Szczelina. Odczyt na prawej krawedzi. */}
        <rect x={SLOT_X - 1.6} y="3.4" width="1.6" height="15.2" className="rs-ink" fill="none" strokeWidth="0.3" />
        {ticks}
        <text x={SLOT_X + STRIP_MAX + 4} y="8" className="rs-t rs-t-xs">AEJaCA</text>
        <text x={SLOT_X + 2} y="25" className="rs-t rs-t-xs">{l.stripScale}</text>
      </svg>
    </div>
  );
}

/** Tabela kolek o srednicy wewnetrznej rowniej rozmiarowi. */
function CircleChart({ l, decimal }) {
  const rows = Math.ceil(RING_SIZES.length / COLS);
  const w = COLS * CELL;
  const h = rows * (CELL + 4);
  return (
    <div className="rs-scroll">
      <svg width={`${w}mm`} height={`${h}mm`} viewBox={`0 0 ${w} ${h}`} className="rs-svg" role="img" aria-label={l.chartTitle}>
        {RING_SIZES.map((s, i) => {
          const cx = (i % COLS) * CELL + CELL / 2;
          const cy = Math.floor(i / COLS) * (CELL + 4) + CELL / 2 - 1;
          return (
            <g key={s.eu}>
              <circle cx={cx} cy={cy} r={s.dia / 2} className="rs-ink" fill="none" strokeWidth="0.25" />
              <text x={cx} y={cy + CELL / 2 + 2} textAnchor="middle" className="rs-t rs-t-sm">
                EU {s.eu} · US {s.us}
              </text>
              <text x={cx} y={cy + 1} textAnchor="middle" className="rs-t rs-t-xs">{s.dia.toFixed(1).replace(".", decimal)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function RingSizerPrint() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.pl;
  const [withChart, setWithChart] = useState(true);

  return (
    <div>
      {/* Sterowanie, nie trafia na papier */}
      <div className="rs-hide-print flex flex-wrap items-center gap-4 mb-5">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
        >
          <Printer className="w-4 h-4" />
          {l.printBtn}
        </button>
        <label className="inline-flex items-center gap-2 text-neutral-400 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={withChart}
            onChange={(e) => setWithChart(e.target.checked)}
            className="w-4 h-4 accent-amber-500"
          />
          {l.withChart}
        </label>
      </div>

      <div className="rs-hide-print flex gap-3 items-start p-4 mb-6 rounded-xl bg-amber-400/5 border border-amber-400/20">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-amber-300 font-semibold text-sm mb-1">{l.warnTitle}</div>
          <p className="text-neutral-300 text-sm leading-relaxed">{l.warnText}</p>
        </div>
      </div>

      <div className="rs-print">
        <div className="rs-sheet rs-page">
          <div className="rs-head">
            <strong>{l.sheetTitle}</strong>
            <span>{l.sheetSub}</span>
          </div>

          <h3 className="rs-h">{l.calTitle}</h3>
          <p className="rs-p">{l.calCard}</p>
          <p className="rs-p">{l.calRuler}</p>
          <Calibration l={l} />

          <h3 className="rs-h">{l.stripTitle}</h3>
          <ol className="rs-list">
            {l.stripSteps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <Strip l={l} />

          <h3 className="rs-h">{l.tipsTitle}</h3>
          <ul className="rs-list">
            {l.tips.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>

        {withChart && (
          <div className="rs-sheet rs-page">
            <div className="rs-head">
              <strong>{l.chartTitle}</strong>
              <span>{l.sheetSub}</span>
            </div>
            <p className="rs-p">{l.chartLead}</p>
            <CircleChart l={l} decimal={lang === "en" ? "." : ","} />
          </div>
        )}
      </div>
    </div>
  );
}
