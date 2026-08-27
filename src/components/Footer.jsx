import React from "react";
import { Link } from "../i18n/nav.jsx";
import { Store, Instagram, Music2, Facebook, Youtube, Mail, MessageCircleMore } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import NewsletterForm from "./NewsletterForm.jsx";

const API = "https://aejacachatapi-production.up.railway.app";

const RATES_LABELS = {
  pl: { title: "Kursy rynkowe", source: "Źródło", noData: "Pobieranie kursów..." },
  en: { title: "Market rates", source: "Source", noData: "Loading rates..." },
  de: { title: "Marktkurse", source: "Quelle", noData: "Kurse werden geladen..." },
};

const SOURCE_LABEL = { nbp: "NBP", "gold-api": "gold-api.com", metalpriceapi: "metalpriceapi.com" };

// Rok w stopce jest wpisany, a nie liczony z `new Date().getFullYear()`.
// Liczony daje inna wartosc w chwili prerenderu i inna po Nowym Roku, gdy
// ktos oglada strone, ktorej od grudnia nikt nie wdrazal. React uznaje to za
// rozjazd i przerysowuje CALA strone od nowa, na wszystkich stu adresach.
// Pilnuje tego `scripts/check-czas-w-renderze.mjs`: build pada w styczniu,
// dopoki ktos nie poprawi tej jednej liczby.
const ROK_COPYRIGHT = 2026;

function fmt(n, dec = 2) {
  if (n == null) return " - ";
  return n.toLocaleString("pl-PL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtTime(iso) {
  if (!iso) return " - ";
  const d = new Date(iso);
  return d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ============================================================
// KURSY W STOPCE: POBIERANE DOPIERO, GDY KTOS NA NIE PATRZY
// ============================================================
// Stopka stoi w Layout, wiec jest na kazdej ze stu stron, a pasek kursow
// pytal backend od razu po zamontowaniu. Na stronie regulaminu, w polityce
// prywatnosci i pod wpisem na blogu nie ma czego przeliczac, a zadanie i tak
// szlo, budzac przy okazji usluge na Railway (563 ms na stronie kontaktowej).
//
// Teraz obserwator widocznosci odpala zapytanie dopiero, gdy pasek naprawde
// wejdzie w pole widzenia. Wieksz czesc odwiedzin konczy sie nad stopka i
// wtedy zadania nie ma wcale.
//
// Wynik trzymamy w module, a nie w pamieci przegladarki: to publiczne kursy,
// nie dane osoby, a przy przejsciach wewnatrz serwisu dokument sie nie zmienia,
// wiec jedna kopia wystarcza na cala wizyte. Dzieki temu nie dokladamy klucza
// do `scripts/check-browser-storage.mjs` ani obowiazku zgody.
const RATES_TTL_MS = 15 * 60 * 1000;
let ratesCache = null;   // { data, stamp }
let ratesInFlight = null;

function pobierzKursy() {
  if (ratesCache && Date.now() - ratesCache.stamp < RATES_TTL_MS) {
    return Promise.resolve(ratesCache.data);
  }
  if (!ratesInFlight) {
    ratesInFlight = fetch(`${API}/api/market-rates`)
      .then((r) => r.json())
      .then((data) => {
        ratesCache = { data, stamp: Date.now() };
        return data;
      })
      .finally(() => { ratesInFlight = null; });
  }
  return ratesInFlight;
}

function MarketRatesBar() {
  const { lang } = useLanguage();
  const L = RATES_LABELS[lang] || RATES_LABELS.pl;
  const showEur = lang === "en" || lang === "de";
  const [rates, setRates] = React.useState(null);
  const kotwica = React.useRef(null);

  React.useEffect(() => {
    let zywy = true;
    const start = () => {
      pobierzKursy().then((d) => { if (zywy) setRates(d); }).catch(() => {});
    };

    // Bez IntersectionObserver (stare przegladarki, srodowiska testowe)
    // zachowujemy sie jak wczesniej i pobieramy od razu.
    const el = kotwica.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      start();
      return () => { zywy = false; };
    }

    const obs = new IntersectionObserver((wpisy) => {
      if (wpisy.some((w) => w.isIntersecting)) {
        obs.disconnect();
        start();
      }
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => { zywy = false; obs.disconnect(); };
  }, []);

  if (!rates) return (
    <div ref={kotwica} className="mt-5 pt-4 border-t border-white/5 text-xs text-neutral-500">{L.noData}</div>
  );

  const pln_per_eur = rates.pln_per_eur || 4.25;
  const conv = (pln) => (pln != null ? (showEur ? pln / pln_per_eur : pln) : null);
  const currency = showEur ? "EUR" : "PLN";
  const s = rates.sources || {};
  const auSrc = s.au_pln_per_g;
  const agSrc = s.ag_pln_per_g;
  const ptSrc = s.pt_pln_per_g;

  return (
    <div ref={kotwica} className="mt-5 pt-4 border-t border-white/5">
      <div className="text-xs uppercase tracking-widest text-neutral-400 mb-2">{L.title}</div>
      {/* Metals */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-1.5">
        <span className="text-neutral-300"><span className="text-amber-400 font-medium">Au</span> {fmt(conv(rates.au_pln_per_g))} <span className="text-neutral-500">{currency}/g</span></span>
        <span className="text-neutral-300"><span className="text-slate-300 font-medium">Ag</span> {fmt(conv(rates.ag_pln_per_g))} <span className="text-neutral-500">{currency}/g</span></span>
        <span className="text-neutral-300"><span className="text-purple-300 font-medium">Pt</span> {fmt(conv(rates.pt_pln_per_g))} <span className="text-neutral-500">{currency}/g</span></span>
        <span className="text-neutral-300"><span className="text-cyan-300 font-medium">Pd</span> {fmt(conv(rates.pd_pln_per_g))} <span className="text-neutral-500">{currency}/g</span></span>
      </div>
      {/* Currencies */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs mb-1.5">
        <span className="text-neutral-300"><span className="text-neutral-400 font-medium">PLN/USD</span> {fmt(rates.pln_per_usd, 4)}</span>
        <span className="text-neutral-300"><span className="text-neutral-400 font-medium">PLN/EUR</span> {fmt(rates.pln_per_eur, 4)}</span>
        <span className="text-neutral-300"><span className="text-neutral-400 font-medium">EUR/USD</span> {fmt(rates.eur_per_usd, 4)}</span>
      </div>
      {/* Sources */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
        {auSrc && <span>Au: <span className="text-neutral-500">{SOURCE_LABEL[auSrc.source]}</span> {fmtTime(auSrc.fetched_at)}</span>}
        {agSrc && <span>Ag: <span className="text-neutral-500">{SOURCE_LABEL[agSrc.source]}</span> {fmtTime(agSrc.fetched_at)}</span>}
        {ptSrc && <span>Pt/Pd: <span className="text-neutral-500">{SOURCE_LABEL[ptSrc.source]}</span> {fmtTime(ptSrc.fetched_at)}</span>}
      </div>
    </div>
  );
}

const socials = [
  { icon: Store, href: "https://aejacashop.etsy.com", label: "Etsy Jewelry Shop" },
  { icon: Store, href: "https://aejaca2studio.etsy.com", label: "Etsy Studio Shop" },
  { icon: Instagram, href: "https://www.instagram.com/aejaca_", label: "Instagram" },
  { icon: Music2, href: "https://www.tiktok.com/@aejaca_", label: "TikTok" },
  { icon: Facebook, href: "https://www.facebook.com/people/Artisan-Elegance-Jewelry-and-Crafted-Art/61570057929428/", label: "Facebook" },
  { icon: Youtube, href: "https://www.youtube.com/@aejaca", label: "YouTube" },
  { icon: MessageCircleMore, href: "https://wa.me/48780737786", label: "WhatsApp" },
  { icon: Mail, href: "mailto:contact@aejaca.com", label: "Email" },
];

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-neutral-950 border-t border-white/10" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Lead magnet, email capture before users bounce. Placed above nav for CRO. */}
        <div id="newsletter" className="mb-10 max-w-2xl">
          <NewsletterForm />
        </div>

        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/brand-sign-128.webp" alt="AEJaCA" width="40" height="40" className="h-10 w-10 brightness-0 invert drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              <span className="font-serif text-lg font-semibold">AEJaCA</span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">{t.footer.tagline}</p>
          </div>

          {/* Szybkie linki w dwoch kolumnach: oferta po lewej, informacje
              i dokumenty po prawej. Jedna kolumna czternastu pozycji rozciagala
              stopke i psula proporcje wzgledem pozostalych kolumn. */}
          <nav aria-label="Footer navigation" className="md:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4">{t.footer.quickLinks}</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="space-y-2">
                <Link to="/shop/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.shop}</Link>
                <Link to="/jewelry/" className="block text-sm text-neutral-300 hover:text-amber-400 transition-colors">{t.nav.jewelry}</Link>
                <Link to="/studio/" className="block text-sm text-neutral-300 hover:text-blue-400 transition-colors">{t.nav.studio}</Link>
                <Link to="/b2b/" className="block text-sm text-neutral-300 hover:text-blue-400 transition-colors">{t.footer.b2b}</Link>
                {/* Strony lokalne. W stopce, bo pojawia sie na kazdej stronie,
                    co daje im glebokosc 1 klikniecia zamiast 2 przez /studio/. */}
                <Link to="/druk-3d-warszawa/" className="block text-sm text-neutral-300 hover:text-blue-400 transition-colors">{t.footer.local3dWarsaw}</Link>
                <Link to="/druk-3d-piaseczno/" className="block text-sm text-neutral-300 hover:text-blue-400 transition-colors">{t.footer.local3dPiaseczno}</Link>
                <Link to="/blog/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.nav.blog || "Blog"}</Link>
                <Link to="/glossary/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.nav.glossary}</Link>
              </div>
              <div className="space-y-2">
                <Link to="/about/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.nav.about}</Link>
                <Link to="/contact/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.nav.contact}</Link>
                <Link to="/terms/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.terms}</Link>
                <Link to="/warranty/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.warranty}</Link>
                <Link to="/returns/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.returns}</Link>
                <Link to="/shipping/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.shipping}</Link>
                <Link to="/privacy/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.privacy}</Link>
              </div>
            </div>
          </nav>

          {/* "Obserwuj nas" column, market rates appended below socials */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4">{t.footer.followUs}</h4>
            <div className="flex flex-wrap gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <MarketRatesBar />
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center text-neutral-400 text-xs">
          &copy; {ROK_COPYRIGHT} AEJaCA - {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
