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
import { CalcCard, Chips, HeroCards } from "../calculators/calcShared.jsx";

/** Numery krokow w skorze kalkulatora. Dziesiec wystarcza z zapasem. */
const NUMERY = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

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
    if (!warianty.some((o) => o.id === params[f.key])) zmiany[f.key] = warianty[0].id;
  }
  return Object.keys(zmiany).length ? zmiany : null;
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
function Kontrolka({ f, warianty, params, setParam, lang, accent, wyglad }) {
  if (f.multi) return <WyborWielu {...{ f, warianty, params, setParam, lang, accent }} />;

  // ZDJECIA WYGRYWAJA Z NAPISAMI tam, gdzie wybor dotyczy rzeczy, a nie liczby.
  // "Wzorzec, model 3D albo pomysl" to trzy rozne drogi wspolpracy i klient
  // rozpoznaje je z fotografii szybciej niz z trzech linijek tekstu. Kafelki
  // ze zdjeciem stoja od dawna w kalkulatorze; teraz stoja tez w sklepie,
  // zamiast dwoch roznych obrazow tej samej decyzji.
  if (f.widok === "zdjecia") {
    const karty = warianty.map((o) => ({ id: o.id, label: o.label, desc: o.sub, img: f.obrazy?.[o.id] }));
    return (
      <HeroCards
        options={karty}
        value={params[f.key]}
        onChange={(v) => setParam(f.key, v)}
        lang={lang}
        cols="grid-cols-1 sm:grid-cols-3"
        minH={150}
      />
    );
  }

  if (wyglad === "kalkulator") {
    return <Chips options={warianty} value={params[f.key]} onChange={(v) => setParam(f.key, v)} lang={lang} />;
  }

  if (POLA_SUWAKOWE.has(f.key) && warianty.length >= 3 && warianty.length <= 7) {
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
 */
export default function PolaUslugi({
  service, params, setParam, lang, wyglad = "sklep", accent = "blue",
  uploadToken = null, wstawki = [],
  tierKey = null, qty, onQty, qtyMax, qtyOpen, qtyLabel,
}) {
  const pola = polaWidoczne(service, params, { uploadToken });

  // Ciag krokow: pola z katalogu plus wstawki, kazda za polem, ktore wskazala.
  // Wstawka z `po: null` staje na poczatku.
  const ciag = [];
  const doda = (po) => wstawki.filter((w) => (w.po ?? null) === po).forEach((w) => ciag.push({ typ: "wstawka", w }));
  doda(null);
  for (const f of pola) {
    ciag.push({ typ: "pole", f });
    doda(f.key);
  }

  return (
    <>
      {ciag.map((krok, i) => {
        const numer = wyglad === "kalkulator" ? NUMERY[i] : null;

        if (krok.typ === "wstawka") {
          const { w } = krok;
          const tresc = w.render();
          if (tresc == null) return null;
          return wyglad === "kalkulator"
            ? <CalcCard key={`w-${i}`} stepNum={numer} label={t(w.label, lang)} id={w.id}>{tresc}</CalcCard>
            : <div key={`w-${i}`} className="mb-6" id={w.id}>{w.label && <Etykieta>{t(w.label, lang)}</Etykieta>}{tresc}</div>;
        }

        const { f } = krok;
        const warianty = wariantyPola(f, params);
        const uwaga = f.uwaga ? <p className="text-neutral-400 text-xs leading-relaxed mt-2">{t(f.uwaga, lang)}</p> : null;
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

        const kontrolka = <Kontrolka {...{ f, warianty, params, setParam, lang, accent, wyglad }} />;

        if (wyglad === "kalkulator") {
          return (
            <CalcCard key={f.key} stepNum={numer} label={t(f.label, lang)}>
              {kontrolka}
              {uwaga}
              {licznik}
            </CalcCard>
          );
        }

        // Suwak i lista kafelkow rysuja wlasna etykiete i wlasny odstep;
        // reszta dostaje je tutaj, zeby wszystkie pola wygladaly tak samo.
        const wlasnaEtykieta = !f.multi && f.widok !== "zdjecia";
        return (
          <Fragment key={f.key}>
            {wlasnaEtykieta ? kontrolka : (
              <div className="mb-6">
                <Etykieta>{t(f.label, lang)}</Etykieta>
                {kontrolka}
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
