import { Link } from "react-router-dom";
import { Store, Instagram, Music2, Facebook, Youtube, Mail, MessageCircleMore } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

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
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/brand-sign.png" alt="AEJaCA" className="h-10 w-10 brightness-0 invert drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              <span className="font-serif text-lg font-semibold">AEJaCA</span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">{t.footer.tagline}</p>
          </div>

          <nav aria-label="Footer navigation">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4">{t.footer.quickLinks}</h4>
            <div className="space-y-2">
              <Link to="/jewelry" className="block text-sm text-neutral-300 hover:text-amber-400 transition-colors">{t.nav.jewelry}</Link>
              <Link to="/studio" className="block text-sm text-neutral-300 hover:text-blue-400 transition-colors">{t.nav.studio}</Link>
              <Link to="/contact" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.nav.contact}</Link>
              <Link to="/privacy" className="block text-sm text-neutral-300 hover:text-white transition-colors">{t.footer.privacy}</Link>
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

        <div className="mt-10 pt-6 border-t border-white/5 text-center text-neutral-500 text-xs">
          &copy; {new Date().getFullYear()} AEJaCA &mdash; {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
