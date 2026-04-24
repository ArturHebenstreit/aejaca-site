import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Store, Instagram, Music2, Facebook, Youtube, MapPin, Mail, MessageCircleMore, Phone, Send, ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildBreadcrumbSchema, buildWebPageSchema, buildOrganizationSchema } from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

const contactLinks = [
  { icon: Mail, label: "contact@aejaca.com", href: "mailto:contact@aejaca.com" },
  { icon: Phone, label: "+48 780 737 786", href: "tel:+48780737786" },
  { icon: MessageCircleMore, label: "WhatsApp", href: "https://wa.me/48780737786" },
  { icon: MapPin, label: "Google Maps", href: "https://maps.app.goo.gl/D9XHVQD4ufjjA5X18" },
];

const socialLinks = [
  { icon: Store, label: "Etsy – Jewelry", href: "https://aejacashop.etsy.com" },
  { icon: Store, label: "Etsy – Studio", href: "https://aejaca2studio.etsy.com" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/aejaca_" },
  { icon: Music2, label: "TikTok (PL)", href: "https://www.tiktok.com/@aejaca_" },
  { icon: Music2, label: "TikTok (US/UK)", href: "https://www.tiktok.com/@aejaca_us" },
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/people/Artisan-Elegance-Jewelry-and-Crafted-Art/61570057929428/" },
  { icon: Youtube, label: "YouTube", href: "https://www.youtube.com/@aejaca" },
];

export default function Contact() {
  const { t, lang } = useLanguage();
  const c = t.contact;
  // Contact page: emit ContactPage + Organization (with phone/email) so Google
  // surfaces "Call" / "Email" action buttons directly in knowledge panel.
  const seo = getSEO("contact", lang);
  const pageUrl = `${SITE.url}/contact`;
  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: "Contact", url: pageUrl },
    ]),
    buildOrganizationSchema(),
  ];
  const [formData, setFormData] = useState({ name: "", email: "", subject: "jewelry", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  const formRef = useScrollReveal();
  const infoRef = useScrollReveal();
  const getContactRef = useStaggerReveal(80);
  const getSocialRef = useStaggerReveal(60);

  // Floating CTA visibility on mobile
  useEffect(() => {
    function onScroll() {
      setShowFloatingCta(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const mailtoBody = `Name: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0ASubject: ${formData.subject}%0D%0A%0D%0A${formData.message}`;
    window.location.href = `mailto:contact@aejaca.com?subject=${encodeURIComponent(
      `[AEJaCA] ${formData.subject === "jewelry" ? "Jewelry" : "Studio"} inquiry from ${formData.name}`
    )}&body=${mailtoBody}`;
    setSubmitted(true);
  }

  return (
    <>
      <SEOHead pageKey="contact" path="/contact" schemas={schemas} />
      <div className="pt-16">
      {/* Hero */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-neutral-950 via-amber-950/20 to-neutral-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-400 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-400 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-16 h-16 rounded-full glass-amber flex items-center justify-center">
              <Phone className="w-7 h-7 text-amber-400" />
            </div>
            <div className="w-12 h-px bg-gradient-to-r from-amber-400/40 to-blue-400/40" />
            <div className="w-16 h-16 rounded-full glass-blue flex items-center justify-center">
              <MessageCircleMore className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <div className="text-neutral-400 text-xs uppercase tracking-[0.25em] mb-3">{c.tag}</div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">{c.title}</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">{c.desc}</p>
        </div>
      </section>

      <div className="gradient-divider" />

      <section className="py-16 px-4 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div ref={formRef} className="reveal-left">
            <h2 className="font-serif text-2xl font-semibold text-white mb-6">{c.formTitle}</h2>
            {submitted ? (
              <div className="p-8 rounded-xl glass border-emerald-500/20 text-center">
                <div className="text-emerald-400 text-lg font-semibold mb-2">{c.thankYou}</div>
                <p className="text-neutral-400 text-sm">{c.thankYouText}</p>
                <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-neutral-400 underline hover:text-white transition-colors">
                  {c.sendAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm text-neutral-400 mb-1.5">{c.labelName}</label>
                  <input id="contact-name" type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all"
                    placeholder={c.placeholderName} />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm text-neutral-400 mb-1.5">{c.labelEmail}</label>
                  <input id="contact-email" type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all"
                    placeholder={c.placeholderEmail} />
                </div>
                <div>
                  <label htmlFor="contact-interest" className="block text-sm text-neutral-400 mb-1.5">{c.labelInterest}</label>
                  <select id="contact-interest" value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-white/10 text-white focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all">
                    <option value="jewelry">{c.optionJewelry}</option>
                    <option value="studio">{c.optionStudio}</option>
                    <option value="both">{c.optionBoth}</option>
                    <option value="other">{c.optionOther}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm text-neutral-400 mb-1.5">{c.labelMessage}</label>
                  <textarea id="contact-message" required rows={5} value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all resize-none"
                    placeholder={c.placeholderMessage} />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-neutral-200 hover:shadow-lg hover:shadow-white/10 transition-all duration-300">
                  <Send className="w-4 h-4" /> {c.sendBtn}
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div ref={infoRef} className="reveal-right space-y-10">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-white mb-6">{c.directTitle}</h2>
              <div className="space-y-4">
                {contactLinks.map(({ icon: Icon, label, href }, i) => (
                  <a key={href} ref={getContactRef(i)} href={href} target="_blank" rel="noopener noreferrer"
                    className="reveal-scale flex items-center gap-4 p-4 rounded-lg glass hover:border-white/20 hover:shadow-md hover:shadow-black/20 transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0 group-hover:bg-amber-400/20 transition-colors">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-neutral-300 text-sm">{label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4">{c.socialTitle}</h3>
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map(({ icon: Icon, label, href }, i) => (
                  <a key={href} ref={getSocialRef(i)} href={href} target="_blank" rel="noopener noreferrer"
                    className="reveal-scale flex items-center gap-3 p-3 rounded-lg glass hover:border-white/15 transition-all duration-300">
                    <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="text-neutral-300 text-xs">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating CTA on mobile */}
      <div className={`floating-cta md:hidden ${showFloatingCta ? "visible" : ""}`}>
        <a href="https://wa.me/48780737786" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white font-medium rounded-full shadow-lg shadow-green-500/30 hover:bg-green-400 transition-colors"
          aria-label="Contact via WhatsApp"
        >
          <MessageCircleMore className="w-5 h-5" />
          WhatsApp
        </a>
      </div>
      </div>
    </>
  );
}
