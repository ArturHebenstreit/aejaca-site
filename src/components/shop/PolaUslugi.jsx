// ============================================================
// POLA USLUGI, jedna warstwa dla sklepu i dla kalkulatora
// ============================================================
// Do tej pory te same siedem pytan o odlew stalo w dwoch miejscach: raz jako
// opisy w `orderCatalog.js`, raz jako recznie napisany JSX w kalkulatorze.
// Regule powlok galwanicznych napisalismy przez to dwa razy, w dwoch
// slownikach, w trzech jezykach kazdy. Nastepna rozjechalaby sie po cichu,
// bo nic nie porownuje tych dwoch list.
//
// Tu stoi jedna lista pytan i jedno miejsce, w ktorym decyduje sie, czym
// pytanie jest rysowane. Rozni sie tylko SKORA:
//   `sklep`      pola jedno pod drugim, etykieta nad kontrolka,
//   `kalkulator` kazde pole w ponumerowanej kartce.
// Kolejnosc, widocznosc, tresc i zaleznosci miedzy polami sa wspolne, wiec
// zmiana w katalogu dociera na oba ekrany naraz.

import { Fragment } from "react";
import { Check } from "lucide-react";
import { t } from "../../pricing/config.js";
import { TileGroup, StepSlider, QuantityStepper } from "./ConfigControls.jsx";
import { CalcCard, Chips, HeroCards, MaterialCards, CONFIG } from "../calculators/calcShared.jsx";

/**
 * Numery krokow w skorze kalkulatora.
 *
 * Kalkulator jubilerski ma jedenascie krokow razem z wyborem uslugi, wiec
 * dziesiec nie wystarczylo: jedenasty wracal do ① i ekran mial dwie jedynki.
 */
const NUMERY = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩",
  "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳"];

/** Pola, ktore w sklepie rysuje suwak, bo ich wartosci sa uporzadkowane. */
export const POLA_SUWAKOWE = new Set(["sizeId", "infillId", "precisionId", "layerId", "areaId", "pathId", "volumeId", "quantityId"]);

/**
 * Pola widoczne przy obecnym stanie konfiguracji.
 *
 * Dwa powody znikniecia pola: wgrany plik odpowiada na nie lepiej niz lista
 * (`hiddenWithFile`), albo inne pole odbiera mu sens (`ukryjGdy`), jak
 * powloka galwaniczna przy wykonczeniu, ktore nie jest polerowane.
 */
export function polaWidoczne(service, params, { uploadToken = null } = {}) {
  return service.fields.filter(
    (f) => !(f.hiddenWithFile && uploadToken) && !(f.ukryjGdy && f.ukryjGdy(params)),
  );
}

/** Warianty pola przy obecnym stanie: lista stala albo wyliczona z parametrow. */
export function wariantyPola(f, params) {
  return f.optionsFrom ? f.optionsFrom(params) : f.options;
}

/**
 * Wybor spoza listy przystawiony do najblizszej dostepnej wartosci.
 *
 * Lista wariantow bywa zalezna od innego pola (poziomy wykonczenia zaleza od
 * zrodla kruszcu). Po przelaczeniu tamtego pola wybor moze zostac na wartosci,
 * ktorej juz nie oferujemy, a wycena oddaje wtedy `null` albo cene za cos
 * innego. Przystawiamy w RENDERZE, nie efektem: efekt rysuje ekran drugi raz
 * i przez moment pokazuje stan, ktorego nie ma w ofercie.
 *
 * @returns {object|null} poprawki do `params`, albo null gdy nic nie trzeba zmieniac
 */
export function poprawkiWyboru(service, params, opcje = {}) {
  const zmiany = {};
  for (const f of polaWidoczne(service, params, opcje)) {
    if (f.multi) continue;
    const warianty = wariantyPola(f, params);
    if (!warianty?.length) continue;
    if (warianty.some((o) => o.id === params[f.key])) continue;
    // WYBOR, KTOREGO JUZ NIE MA, MA SWOJEGO NASTEPCE, jesli pole go zna.
    // Bez tego kosz zapisany przed zmianą cennika cicho traci platny dodatek:
    // "Tekst + wzor" wypadl z listy graweru, a `warianty[0]` to "Brak
    // grawerowania", wiec klient dostawalby zamowienie bez tego, za co
    // wczesniej zaplacil, i nikt by tego nie zobaczyl.
    const zastepczy = f.zamiennik?.(params[f.key]);
    zmiany[f.key] = zastepczy && warianty.some((o) => o.id === zastepczy)
      ? zastepczy : warianty[0].id;
  }
  return Object.keys(zmiany).length ? zmiany : null;
}

/**
 * Podpowiedz ceny materialu, w walucie jezyka.
 *
 * Regula walutowa serwisu: polski czyta zlotowki, reszta euro. Kurs stoi
 * w jednym miejscu (`CONFIG.EUR_PLN_RATE`), zeby dwie drogi do zamowienia
 * nie podawaly dwoch roznych przelicznikow.
 */
function podpowiedzCeny(pricePerKg, lang) {
  if (lang === "pl") return `od ${Math.round(pricePerKg)} zł/kg`;
  const wEuro = Math.round(pricePerKg / CONFIG.EUR_PLN_RATE);
  return lang === "de" ? `ab ${wEuro} EUR/kg` : `from ${wEuro} EUR/kg`;
}

/** Etykieta pola w skorze sklepu; w kalkulatorze rysuje ja kartka. */
function Etykieta({ children }) {
  return <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{children}</div>;
}

/** Wybor wielokrotny: jedyne pole, ktorego nie da sie oddac lista kafelkow. */
function WyborWielu({ f, warianty, params, setParam, lang, accent }) {
  const lista = params[f.key] || [];
  return (
    <div className="grid grid-cols-2 gap-2">
      {warianty.map((o) => {
        const on = lista.includes(o.id);
        return (
          <button
            key={String(o.id)}
            type="button"
            onClick={() => setParam(f.key, on ? lista.filter((x) => x !== o.id) : [...lista, o.id])}
            className={`relative text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
              on
                ? accent === "amber"
                  ? "border-amber-400 bg-amber-400/10 text-amber-200"
                  : "border-blue-400 bg-blue-400/10 text-blue-200"
                : "border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/25"
            }`}
          >
            {on && <Check className="w-3.5 h-3.5 absolute top-2 right-2" />}
            <span className="pr-4 block leading-snug">{t(o.label, lang)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Sama kontrolka pola, bez etykiety i bez kartki. */
function Kontrolka({ f, warianty: surowe, params, setParam, lang, accent, wyglad }) {
  // PODPIS POD WARIANTEM LICZY SIE Z JEZYKIEM, wiec nie moze powstac w
  // `optionsFrom`, ktore jezyka nie widzi. Stad osobne `podpis(wariant, lang)`:
  // dopisek o doplacie ma byc w zlotowkach po polsku i w euro poza Polska,
  // tak jak reszta kwot w serwisie.
  const warianty = f.podpis
    ? surowe.map((o) => ({ ...o, sub: f.podpis(o, lang) ?? o.sub }))
    : surowe;
  if (f.multi) return <WyborWielu {...{ f, warianty, params, setParam, lang, accent }} />;

  // ZDJECIA WYGRYWAJA Z NAPISAMI tam, gdzie wybor dotyczy rzeczy, a nie liczby.
  // "Wzorzec, model 3D albo pomysl" to trzy rozne drogi wspolpracy i klient
  // rozpoznaje je z fotografii szybciej niz z trzech linijek tekstu. Kafelki
  // ze zdjeciem stoja od dawna w kalkulatorze; teraz stoja tez w sklepie,
  // zamiast dwoch roznych obrazow tej samej decyzji.
  //
  // Zdjecie moze nalezec do WARIANTU (`o.img`, tak sa opisane zywice i formy
  // w rdzeniu cenowym) albo do POLA (`f.obrazy`, gdy rdzen cen nie zna zdjec,
  // jak przy wariantach odlewu). Pierwsze ma pierwszenstwo.
  if (f.widok === "zdjecia") {
    const karty = warianty.map((o) => ({ ...o, desc: o.desc || o.sub, img: o.img || f.obrazy?.[o.id] }));
    return (
      <HeroCards
        options={karty}
        value={params[f.key]}
        onChange={(v) => setParam(f.key, v)}
        lang={lang}
        cols={f.kolumny || "grid-cols-1 sm:grid-cols-3"}
        minH={f.wysokosc || 172}
        accent={accent}
      />
    );
  }

  // Karty opisowe: nazwa, zdanie opisu i podpowiedz cenowa. Uzywamy ich tam,
  // gdzie wariant rozni sie wlasciwosciami, a nie wygladem: zywica twarda i
  // zywica elastyczna wygladaja na zdjeciu tak samo.
  if (f.widok === "opisowe") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {warianty.map((o) => {
          const on = params[f.key] === o.id;
          return (
            <button
              key={String(o.id)}
              type="button"
              onClick={() => setParam(f.key, o.id)}
              className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                on
                  ? accent === "amber"
                    ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[0_0_0_5px_rgba(251,191,36,0.14)]"
                    : "border-blue-400 bg-blue-400/10 ring-2 ring-blue-400/60 shadow-[0_0_0_5px_rgba(96,165,250,0.14)]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className={`text-xs sm:text-sm font-semibold mb-0.5 ${on ? (accent === "amber" ? "text-amber-300" : "text-blue-300") : "text-white"}`}>{t(o.label, lang)}</div>
              {o.desc && <div className="text-xs text-neutral-400 mb-1.5 leading-snug">{t(o.desc, lang)}</div>}
              {o.price_kg != null && (
                <div className={`text-xs font-medium ${on ? (accent === "amber" ? "text-amber-300" : "text-blue-300") : "text-neutral-500"}`}>
                  {podpowiedzCeny(o.price_kg, lang)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Male kafelki ze zdjeciem kwadratowym: uzywamy ich tam, gdzie wariantow
  // jest duzo i rozpoznaje sie je po fakturze, a nie po opisie (formy,
  // wtracenia, materialy lasera).
  if (f.widok === "kafelki") {
    const karty = warianty.map((o) => ({ ...o, img: o.img || f.obrazy?.[o.id] }));
    return (
      <MaterialCards
        options={karty}
        value={params[f.key]}
        onChange={(v) => setParam(f.key, v)}
        lang={lang}
        cols={f.kolumny || "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"}
        accent={accent}
      />
    );
  }

  if (wyglad === "kalkulator") {
    return <Chips options={warianty} value={params[f.key]} onChange={(v) => setParam(f.key, v)} lang={lang} accent={accent} />;
  }

  // SUWAK NIE UMIE WYLACZYC PRZYSTANKU. Kiedy inne pole odbiera czesc
  // wariantow (obiektyw ogranicza pole znakowania), suwak i tak przesuwa sie
  // na kazdy z nich, wiec klient ustawia wartosc, ktorej maszyna nie wykona,
  // i widzi za nia cene. Przy ograniczonym zestawie schodzimy na kafelki,
  // ktore potrafia byc nieklikalne i podac powod.
  const ograniczone = warianty.some((o) => o.disabled);
  if (!ograniczone && POLA_SUWAKOWE.has(f.key) && warianty.length >= 3 && warianty.length <= 7) {
    return (
      <StepSlider
        label={t(f.label, lang)}
        options={warianty}
        value={params[f.key]}
        onChange={(v) => setParam(f.key, v)}
        lang={lang}
        accent={accent}
      />
    );
  }

  return (
    <TileGroup
      label={t(f.label, lang)}
      options={warianty}
      value={params[f.key]}
      onChange={(v) => setParam(f.key, v)}
      lang={lang}
      accent={accent}
      columns={warianty.length > 8 ? 4 : 3}
    />
  );
}

/**
 * Lista pol uslugi w jednej z dwoch skor.
 *
 * @param {object}   props.service    opis uslugi z `orderCatalog.js`
 * @param {object}   props.params     obecny stan konfiguracji
 * @param {Function} props.setParam   (klucz, wartosc) => void
 * @param {"sklep"|"kalkulator"} props.wyglad
 * @param {Array}    props.wstawki    kartki spoza katalogu, np. pole pliku:
 *        `{ po: "metalId", label, id, render: () => JSX }`. Numeracja krokow
 *        obejmuje je razem z polami, bo dla klienta to jeden ciag pytan.
 * @param {object}   props.dodatki    narzedzia doklejone DO POLA, po kluczu:
 *        `{ przed, po, etykieta, ukryjWarianty, id }`. Pole zbierania rysunku
 *        nie jest osobnym pytaniem, tylko innym sposobem odpowiedzenia na to
 *        samo: wgrany rysunek zastepuje wybor pola z listy, wiec stoi w tej
 *        samej kartce i przejmuje jej etykiete.
 */
export default function PolaUslugi({
  service, params, setParam, lang, wyglad = "sklep", accent = "blue",
  uploadToken = null, wstawki = [], dodatki = {}, pierwszyNumer = 1,
  tierKey = null, qty, onQty, qtyMax, qtyOpen, qtyLabel,
}) {
  const pola = polaWidoczne(service, params, { uploadToken });

  // Ciag krokow: pola z katalogu plus wstawki, kazda za polem, ktore wskazala.
  // Wstawka z `po: null` staje na poczatku.
  //
  // TRESC WSTAWKI RYSUJEMY OD RAZU, zeby wyrzucic te, ktore nic nie zwracaja.
  // Wstawka warunkowa (ostrzezenie licencyjne przy figurkach) zajmowala numer
  // takze wtedy, gdy nie miala co pokazac, wiec ekran szedl od ④ do ⑥.
  // WSTAWKA ZACZEPIONA O UKRYTE POLE NIE MOZE ZNIKNAC RAZEM Z NIM. Karta
  // dlugosci lancuszka stoi za masywnoscia, a przy lancuchu masywnosci nie ma,
  // bo nic nie znaczy. Zaczepienie liczymy wiec po KOLEJNOSCI w katalogu:
  // wstawka ladzie za najblizszym widocznym polem przed swoja kotwica.
  const kolejnosc = service.fields.map((f) => f.key);
  const widoczne = new Set(pola.map((f) => f.key));
  const kotwica = (po) => {
    if (po == null || widoczne.has(po)) return po ?? null;
    // KOTWICA, KTOREJ TA USLUGA W OGOLE NIE MA, znaczy, ze wstawka nie nalezy
    // do tego ekranu. Bez tego karta wymiarow wyrobu z galezi "nowa bizuteria"
    // wskakiwala na poczatek renowacji, gdzie nie ma czego wymierzac.
    if (!kolejnosc.includes(po)) return false;
    for (let i = kolejnosc.indexOf(po) - 1; i >= 0; i -= 1) {
      if (widoczne.has(kolejnosc[i])) return kolejnosc[i];
    }
    return null;
  };
  const przypisane = wstawki
    .map((w) => ({ w, gdzie: kotwica(w.po ?? null) }))
    .filter((x) => x.gdzie !== false);

  const ciag = [];
  const doda = (po) => przypisane
    .filter((x) => x.gdzie === po)
    .forEach(({ w }) => {
      const tresc = w.render();
      if (tresc != null) ciag.push({ typ: "wstawka", w, tresc });
    });
  doda(null);
  for (const f of pola) {
    ciag.push({ typ: "pole", f });
    doda(f.key);
  }

  return (
    <>
      {ciag.map((krok, i) => {
        // Numeracja moze zaczac sie dalej niz od jedynki: kalkulator CO2 ma
        // przed lista pol wlasna kartke z wyborem miedzy grawerem a cieciem,
        // czyli miedzy dwiema uslugami, a nie miedzy wariantami jednej.
        const numer = wyglad === "kalkulator" ? NUMERY[i + pierwszyNumer - 1] : null;

        if (krok.typ === "wstawka") {
          const { w, tresc } = krok;
          return wyglad === "kalkulator"
            ? <CalcCard key={`w-${i}`} stepNum={numer} label={t(w.label, lang)} id={w.id} accent={accent}>{tresc}</CalcCard>
            : <div key={`w-${i}`} className="mb-6" id={w.id}>{w.label && <Etykieta>{t(w.label, lang)}</Etykieta>}{tresc}</div>;
        }

        const { f } = krok;
        const d = dodatki[f.key] || {};
        const warianty = wariantyPola(f, params);
        const uwaga = f.uwaga ? <p className="text-neutral-400 text-xs leading-relaxed mt-2">{t(f.uwaga, lang)}</p> : null;
        const etykieta = d.etykieta ? t(d.etykieta, lang) : t(f.label, lang);
        // Licznik sztuk stoi TUZ POD progiem nakladu, bo to jedna decyzja
        // pokazana dwoma kontrolkami. Rozdzielone przez pol formularza
        // wygladaly jak dwa niezalezne pola o tym samym znaczeniu.
        const licznik = tierKey && f.key === tierKey ? (
          <QuantityStepper
            label={qtyLabel}
            value={qty}
            onChange={onQty}
            min={1}
            max={qtyMax}
            openValue={qtyOpen}
            lang={lang}
            accent={accent}
          />
        ) : null;

        const kontrolka = d.ukryjWarianty ? null : <Kontrolka {...{ f, warianty, params, setParam, lang, accent, wyglad }} />;
        const przed = d.przed ? d.przed() : null;
        const po = d.po ? d.po() : null;

        if (wyglad === "kalkulator") {
          return (
            <CalcCard key={f.key} stepNum={numer} label={etykieta} id={d.id} accent={accent}>
              {przed}
              {kontrolka}
              {uwaga}
              {po}
              {licznik}
            </CalcCard>
          );
        }

        // Suwak i lista kafelkow rysuja wlasna etykiete i wlasny odstep;
        // reszta dostaje je tutaj, zeby wszystkie pola wygladaly tak samo.
        // Kontrolka rysujaca wlasna etykiete i wlasny odstep dostaje je od
        // siebie, ale tylko wtedy, gdy nic do niej nie doklejono: przystawka
        // musi stac wewnatrz tego samego bloku, pod ta sama etykieta.
        const wlasnaEtykieta = !f.multi && !f.widok && !przed && !po && !d.etykieta && kontrolka;
        return (
          <Fragment key={f.key}>
            {wlasnaEtykieta ? kontrolka : (
              <div className="mb-6" id={d.id}>
                <Etykieta>{etykieta}</Etykieta>
                {przed}
                {kontrolka}
                {po}
              </div>
            )}
            {uwaga && <div className="-mt-4 mb-6">{uwaga}</div>}
            {licznik}
          </Fragment>
        );
      })}
    </>
  );
}
