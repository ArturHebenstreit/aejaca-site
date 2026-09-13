// ============================================================
// STRONA USLUGI: ODLEW Z PLIKU KLIENTA
// ============================================================
// Powod istnienia (ADR-0048, rozstrzygniecie D): do dzis klient poznawal nasze
// wymagania dopiero w kreatorze, po wgraniu pliku, czyli najpozniej jak sie da.
// Ta strona przesuwa je PRZED modelowanie i konczy sie tam, gdzie ma sie
// skonczyc: na karcie uslugi `precious_metal_casting`.
//
// ZADNA LICZBA NIE JEST TU WPISANA RECZNIE. Grubosci i naddatki przychodza
// z `castingSpec.js`, skurcz i gestosc z `castingAlloys.js`, koperta kolby
// z wyceny odlewu, formaty pliku ze sklepu. Tresc slowna stoi w
// `src/data/odlewZPliku.js`, pytania w `src/data/faq/odlewZPliku.js`.
import { Link } from "../i18n/nav.jsx";
import { Gem, FileUp, Ruler, ShieldCheck, Check, Info } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import {
  buildWebPageSchema,
  buildBreadcrumbSchema,
  buildServiceSchema,
  buildFAQSchema,
} from "../seo/schemas.js";
import { getSEO, adresStrony } from "../seo/seoData.js";
import { ODLEW_Z_PLIKU, ODLEW_TRESC } from "../data/odlewZPliku.js";
import PYTANIA from "../data/faq/odlewZPliku.js";
import {
  MIN_GRUBOSC_MM,
  MIERZONA_CECHA,
  PROG_ROZBIEZNOSCI_OTWORU_MM,
  WYMAGANIA_PLIKU,
} from "../data/castingSpec.js";
import { CASTING_ALLOYS } from "../data/castingAlloys.js";
import { CASTING_ENVELOPE_LABEL } from "../pricing/preciousMetalCasting.js";
import { FORMATY_MODELU } from "../shop/paczkaModeli.js";

// Tolerancja procesu z regulaminu 13, ta sama liczba co prog rozbieznosci
// otworu. Wiecej niz to nie obiecujemy i strona nie ma prawa obiecac.
const TOLERANCJA_MM = PROG_ROZBIEZNOSCI_OTWORU_MM;

const PRZECINEK = { pl: true, en: false, de: true };

/** Milimetry w zapisie danego jezyka, bez koncowego zera i bez `Intl`. */
function mm(wartosc, lang) {
  const tekst = wartosc.toFixed(2).replace(/0$/, "");
  return `${PRZECINEK[lang] ? tekst.replace(".", ",") : tekst} mm`;
}

/** Mnoznik skurczu, cztery miejsca po przecinku, bo taki wchodzi do rachunku. */
function mnoznik(wartosc, lang) {
  const tekst = wartosc.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return `x ${PRZECINEK[lang] ? tekst.replace(".", ",") : tekst}`;
}

function gestosc(wartosc, lang) {
  const tekst = wartosc.toFixed(2);
  return `${PRZECINEK[lang] ? tekst.replace(".", ",") : tekst} g/cm³`;
}

/** ".stl,.obj" -> "STL, OBJ". Lista formatow ma jedno zrodlo, w sklepie. */
function formaty() {
  return FORMATY_MODELU.split(",").map((f) => f.replace(".", "").toUpperCase()).join(", ");
}

// Spojnik w wyliczeniu nalezy do jezyka, a nie do listy formatow.
const SPOJNIK = { pl: " i ", en: " and ", de: " und " };

/** Formaty bez jednostki w pliku, wypisane po ludzku. */
function formatyBezJednostki(lang) {
  return WYMAGANIA_PLIKU.formatyBezJednostki
    .map((f) => f.toUpperCase())
    .join(SPOJNIK[lang] || SPOJNIK.pl);
}

export default function OdlewZPliku() {
  const { lang } = useLanguage();
  const c = ODLEW_TRESC[lang] || ODLEW_TRESC.pl;
  const seo = getSEO(ODLEW_Z_PLIKU.seoKey, lang);
  const pageUrl = adresStrony(ODLEW_Z_PLIKU.path, lang);

  const introRef = useScrollReveal();
  const zasadaRef = useScrollReveal();
  const gruboscRef = useScrollReveal();
  const metaleRef = useScrollReveal();
  const nieMusiszRef = useScrollReveal();
  const plikRef = useScrollReveal();
  const dostajeszRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const pytania = PYTANIA.map((f) => ({
    id: f.id,
    q: f.q[lang] || f.q.pl,
    a: f.a[lang] || f.a.pl,
  }));

  const wierszeGrubosci = Object.entries(MIN_GRUBOSC_MM).map(([klucz, w]) => ({
    klucz,
    label: w.label[lang] || w.label.pl,
    min: mm(w.min, lang),
    pewne: mm(w.pewne, lang),
    mierzona: klucz === MIERZONA_CECHA,
  }));

  const wierszeMetali = Object.entries(CASTING_ALLOYS).map(([klucz, a]) => ({
    klucz,
    label: a.label[lang] || a.label.pl,
    skurcz: mnoznik(a.shrink, lang),
    gestosc: gestosc(a.density, lang),
  }));

  const wierszePliku = [
    c.plik[0].d(formaty(), "60 MB"),
    c.plik[1].d(formatyBezJednostki(lang)),
    c.plik[2].d,
    c.plik[3].d,
    c.plik[4].d(CASTING_ENVELOPE_LABEL),
    c.plik[5].d(mm(PROG_ROZBIEZNOSCI_OTWORU_MM, lang)),
  ];

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: c.breadHome, url: adresStrony("/", lang) },
      { name: c.breadStudio, url: adresStrony("/studio/", lang) },
      { name: c.h1, url: pageUrl },
    ]),
    buildServiceSchema({
      name: c.h1,
      description: seo.description,
      serviceType: "Investment casting service",
      url: pageUrl,
    }),
    buildFAQSchema(pytania.map(({ q, a }) => ({ q, a }))),
  ];

  return (
    <>
      <SEOHead pageKey={ODLEW_Z_PLIKU.seoKey} path={ODLEW_Z_PLIKU.path} schemas={schemas} />

      <div className="bg-neutral-950 text-neutral-200 pt-24 pb-20 px-5">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb
            items={[
              { label: c.breadHome, href: "/" },
              { label: c.breadStudio, href: "/studio/" },
              { label: c.h1 },
            ]}
          />

          {/* Hero */}
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            <Gem className="w-3.5 h-3.5" />
            {c.kicker}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
            {c.h1}
          </h1>
          <p className="text-lg text-neutral-300 leading-relaxed mb-10">{c.lead}</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <Link
              to="/shop/service/precious_metal_casting/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition-colors"
            >
              <FileUp className="w-4 h-4" />
              {c.ctaKalkulator}
            </Link>
            <Link
              to="/contact/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-neutral-700 hover:border-neutral-500 text-neutral-200 font-semibold transition-colors"
            >
              {c.ctaKontakt}
            </Link>
          </div>

          {/* 1. Model do odlewu to nie model do druku */}
          <section ref={introRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-4">{c.introTitle}</h2>
            {c.intro.map((akapit) => (
              <p key={akapit.slice(0, 24)} className="text-neutral-400 leading-relaxed mb-4 last:mb-0">
                {akapit}
              </p>
            ))}
          </section>

          {/* 2. Zasada nadrzedna */}
          <section ref={zasadaRef} className="reveal mb-14">
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white">
                  {c.zasadaTytul}
                </h2>
              </div>
              <p className="text-neutral-300 leading-relaxed mb-3">{c.zasadaTresc}</p>
              <p className="text-neutral-400 leading-relaxed text-sm">
                {c.zasadaTolerancja(mm(TOLERANCJA_MM, lang))}
              </p>
            </div>
          </section>

          {/* 3. Tabela minimalnych gruboci wyrobu */}
          <section ref={gruboscRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-4">{c.gruboscTytul}</h2>
            <p className="text-neutral-400 leading-relaxed mb-6">{c.gruboscWstep}</p>

            <div className="overflow-x-auto rounded-2xl border border-neutral-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-900/60 text-neutral-400">
                    <th scope="col" className="text-left font-semibold px-4 py-3">{c.gruboscCecha}</th>
                    <th scope="col" className="text-right font-semibold px-4 py-3 whitespace-nowrap">{c.gruboscMin}</th>
                    <th scope="col" className="text-right font-semibold px-4 py-3 whitespace-nowrap">{c.gruboscPewne}</th>
                  </tr>
                </thead>
                <tbody>
                  {wierszeGrubosci.map((w) => (
                    <tr key={w.klucz} className="border-t border-neutral-800/80">
                      <th scope="row" className="text-left font-normal text-neutral-300 px-4 py-3">
                        {w.label}
                        {w.mierzona && (
                          <span className="block text-xs text-amber-400/80">{c.gruboscMierzona}</span>
                        )}
                      </th>
                      <td className="text-right text-neutral-400 px-4 py-3 whitespace-nowrap tabular-nums">{w.min}</td>
                      <td className="text-right text-white px-4 py-3 whitespace-nowrap tabular-nums">{w.pewne}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="flex gap-2 text-neutral-500 text-sm leading-relaxed mt-4">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{c.gruboscUwaga}</span>
            </p>
          </section>

          {/* 4. Tabela metali */}
          <section ref={metaleRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-4">{c.metaleTytul}</h2>
            <p className="text-neutral-400 leading-relaxed mb-6">{c.metaleWstep}</p>

            <div className="overflow-x-auto rounded-2xl border border-neutral-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-900/60 text-neutral-400">
                    <th scope="col" className="text-left font-semibold px-4 py-3">{c.metaleStop}</th>
                    <th scope="col" className="text-right font-semibold px-4 py-3 whitespace-nowrap">{c.metaleSkurcz}</th>
                    <th scope="col" className="text-right font-semibold px-4 py-3 whitespace-nowrap">{c.metaleGestosc}</th>
                  </tr>
                </thead>
                <tbody>
                  {wierszeMetali.map((w) => (
                    <tr key={w.klucz} className="border-t border-neutral-800/80">
                      <th scope="row" className="text-left font-normal text-neutral-300 px-4 py-3">{w.label}</th>
                      <td className="text-right text-white px-4 py-3 whitespace-nowrap tabular-nums">{w.skurcz}</td>
                      <td className="text-right text-neutral-400 px-4 py-3 whitespace-nowrap tabular-nums">{w.gestosc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="flex gap-2 text-neutral-500 text-sm leading-relaxed mt-4">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{c.metaleUwaga}</span>
            </p>
          </section>

          {/* 5. Czego nie musisz robic */}
          <section ref={nieMusiszRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-5">{c.nieMusiszTytul}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {c.nieMusisz.map((p) => (
                <div key={p.t} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
                  <div className="flex gap-2 items-start mb-2">
                    <Check className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <h3 className="text-white font-semibold leading-snug">{p.t}</h3>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">{p.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Wymagania pliku */}
          <section ref={plikRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-5">{c.plikTytul}</h2>
            <dl className="space-y-4">
              {c.plik.map((p, i) => (
                <div key={p.t} className="border-b border-neutral-800 pb-4 last:border-b-0 last:pb-0">
                  <dt className="text-white font-semibold mb-1">{p.t}</dt>
                  <dd className="text-neutral-400 text-sm leading-relaxed">{wierszePliku[i]}</dd>
                </div>
              ))}
            </dl>
            <p className="flex gap-2 text-neutral-500 text-sm leading-relaxed mt-5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{c.plikSprawdzamy}</span>
            </p>
          </section>

          {/* 7. Co dostajesz */}
          <section ref={dostajeszRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-5">{c.dostajeszTytul}</h2>
            <ul className="space-y-4">
              {c.dostajesz.map((p) => (
                <li key={p.t} className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold leading-snug mb-1">{p.t}</div>
                    <p className="text-neutral-400 text-sm leading-relaxed">{p.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 8. FAQ */}
          <section ref={faqRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-6">{c.faqTytul}</h2>
            <div className="space-y-5">
              {pytania.map((p) => (
                <div key={p.id} id={p.id} className="border-b border-neutral-800 pb-5">
                  <h3 className="text-white font-semibold mb-2">{p.q}</h3>
                  <p className="text-neutral-400 leading-relaxed text-sm">{p.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Droga do wyceny */}
          <section ref={ctaRef} className="reveal rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-7 text-center">
            <h2 className="font-serif text-2xl font-semibold text-white mb-3">{c.ctaTytul}</h2>
            <p className="text-neutral-400 leading-relaxed mb-6">{c.ctaTresc}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/shop/service/precious_metal_casting/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition-colors"
              >
                <FileUp className="w-4 h-4" />
                {c.ctaKalkulator}
              </Link>
              <Link
                to="/contact/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-neutral-700 hover:border-neutral-500 text-neutral-200 font-semibold transition-colors"
              >
                {c.ctaKontakt}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
