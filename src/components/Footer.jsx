import React from "react";
import { Link } from "react-router-dom";
import { Store, Instagram, Music2, Facebook, Youtube, Mail, MessageCircleMore } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import NewsletterForm from "./NewsletterForm.jsx";

const API = "https://aejacachatapi-production.up.railway.app";

const RATES_LABELS = {
  pl: { title: "Kursy rynkowe", source: "Źródło", updated: "Odczyt", noData: "Pobieranie kursów..." },
  en: { title: "Market rates", source: "Source", updated: "Updated", noData: "Loading rates..." },
  de: { title: "Marktkurse", source: "Quelle", updated: "Aktualisiert", noData: "Kurse werden geladen..." },
};

const SOURCE_LABEL = { nbp: "NBP", "gold-api": "gold-api.com", metalpriceapi: "metalpriceapi.com" };

function fmt(n, dec = 2) {
  if (n == null) return "—";
  return n.toLocaleString("pl-PL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function MarketRatesBar() {
  const { lang } = useLanguage();
  const L = RATES_LABELS[lang] || RATES_LABELS.pl;
  const [rates, setRates] = React.useState(null);

  React.useEffect(() => {
    fetch(`${API}/api/market-rates`)
      .then(r => r.json())
      .then(setRates)
      .catch(() => {});
  }, []);

  if (!rates) return (
    <div className="mb-8 py-3 px-4 rounded-xl bg-white/3 border border-white/5 text-xs text-neutral-500 text-center">
      {L.noData}
    </div>
  );

  const s = rates.sources || {};
  const auSrc = s.au_pln_per_g;
  const agSrc = s.ag_pln_per_g;
  const ptSrc = s.pt_pln_per_g;

  return (
    <div className="mb-8 py-4 px-4 rounded-xl bg-white/3 border border-white/5">
      <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3">{L.title}</div>
      {/* Metals row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-2">
        <span className="text-neutral-300"><span className="text-amber-400 font-medium">Au</span> {fmt(rates.au_pln_per_g)} <span className="text-neutral-500">PLN/g</span></span>
        <span className="text-neutral-300"><span className="text-slate-300 font-medium">Ag</span> {fmt(rates.ag_pln_per_g)} <span className="text-neutral-500">PLN/g</span></span>
        <span className="text-neutral-300"><span className="text-purple-300 font-medium">Pt</span> {fmt(rates.pt_pln_per_g)} <span className="text-neutral-500">PLN/g</span></span>
        <span className="text-neutral-300"><span className="text-cyan-300 font-medium">Pd</span> {fmt(rates.pd_pln_per_g)} <span className="text-neutral-500">PLN/g</span></span>
        <span className="text-neutral-500">·</span>
        <span className="text-neutral-300"><span className="text-neutral-400 font-medium">PLN/USD</span> {fmt(rates.pln_per_usd, 4)}</span>
        <span className="text-neutral-300"><span className="text-neutral-400 font-medium">PLN/EUR</span> {fmt(rates.pln_per_eur, 4)}</span>
        <span className="text-neutral-300"><span className="text-neutral-400 font-medium">EUR/USD</span> {fmt(rates.eur_per_usd, 4)}</span>
      </div>
      {/* Sources row */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-neutral-600">
        {auSrc && <span>Au+{L.source.toLowerCase()}: <span className="text-neutral-500">{SOURCE_LABEL[auSrc.source]}</span> {fmtTime(auSrc.fetched_at)}</span>}
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
        <MarketRatesBar />
        {/* Lead magnet — email capture before users bounce. Placed above nav for CRO. */}
        <div id="newsletter" className="mb-10 max-w-2xl">
          <NewsletterForm />
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/brand-sign.webp" alt="AEJaCA" width="40" height="40" className="h-10 w-10 brightness-0 invert drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              <span className="font-serif text-lg font-semibold">AEJaCA</span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">{t.footer.tagline}</p>
          </div>

          <nav aria-label="Footer navigation">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4">{t.footer.quickLinks}</h4>
            <div className="space-y-2">
              <Link to="/jewelry/" className="block text-sm text-neutral-300 hover:text-amber-400 transition-colors">{t.nav.jewelry}</Link>
              <Link to="/studio/" className="block text-sm text-neutral-300 hover:text-blue-400 transition-colors">{t.nav.studio}</Link>
              <Link to="/blog/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.nav.blog || "Blog"}</Link>
              <Link to="/glossary/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.nav.glossary}</Link>
              <Link to="/about/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.nav.about}</Link>
              <Link to="/contact/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.nav.contact}</Link>
              <Link to="/warranty/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.warranty}</Link>
              <Link to="/returns/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.returns}</Link>
              <Link to="/shipping/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.shipping}</Link>
              <Link to="/privacy/" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.privacy}</Link>
            </div>
          </nav>

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
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center text-neutral-400 text-xs">
          &copy; {new Date().getFullYear()} AEJaCA &mdash; {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
