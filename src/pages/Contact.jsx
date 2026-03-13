import { useState } from "react";
import { Store, Instagram, Music2, Facebook, Youtube, MapPin, Mail, MessageCircleMore, Phone, Send } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

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
  const { t } = useLanguage();
  const c = t.contact;
  const [formData, setFormData] = useState({ name: "", email: "", subject: "jewelry", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const mailtoBody = `Name: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0ASubject: ${formData.subject}%0D%0A%0D%0A${formData.message}`;
    window.location.href = `mailto:contact@aejaca.com?subject=${encodeURIComponent(
      `[AEJaCA] ${formData.subject === "jewelry" ? "Jewelry" : "Studio"} inquiry from ${formData.name}`
    )}&body=${mailtoBody}`;
    setSubmitted(true);
  }

  return (
    <div className="pt-16">
      <section className="py-20 px-4 bg-neutral-950 text-center">
        <div className="text-neutral-400 text-xs uppercase tracking-[0.25em] mb-3">{c.tag}</div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">{c.title}</h1>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">{c.desc}</p>
      </section>

      <section className="py-16 px-4 bg-neutral-900">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            <h2 className="font-serif text-2xl font-semibold text-white mb-6">{c.formTitle}</h2>
            {submitted ? (
              <div className="p-8 rounded-xl bg-neutral-950 border border-emerald-800/30 text-center">
                <div className="text-emerald-400 text-lg font-semibold mb-2">{c.thankYou}</div>
                <p className="text-neutral-400 text-sm">{c.thankYouText}</p>
                <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-neutral-500 underline hover:text-white">
                  {c.sendAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">{c.labelName}</label>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:border-amber-400/50 focus:outline-none transition-colors"
                    placeholder={c.placeholderName} />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">{c.labelEmail}</label>
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:border-amber-400/50 focus:outline-none transition-colors"
                    placeholder={c.placeholderEmail} />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">{c.labelInterest}</label>
                  <select value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-white/10 text-white focus:border-amber-400/50 focus:outline-none transition-colors">
                    <option value="jewelry">{c.optionJewelry}</option>
                    <option value="studio">{c.optionStudio}</option>
                    <option value="both">{c.optionBoth}</option>
                    <option value="other">{c.optionOther}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">{c.labelMessage}</label>
                  <textarea required rows={5} value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
                    placeholder={c.placeholderMessage} />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-colors">
                  <Send className="w-4 h-4" /> {c.sendBtn}
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-10">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-white mb-6">{c.directTitle}</h2>
              <div className="space-y-4">
                {contactLinks.map(({ icon: Icon, label, href }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-lg bg-neutral-950 border border-white/5 hover:border-white/15 transition-colors">
                    <Icon className="w-5 h-5 text-amber-400 shrink-0" />
                    <span className="text-neutral-300 text-sm">{label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4">{c.socialTitle}</h3>
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-neutral-950 border border-white/5 hover:border-white/15 transition-colors">
                    <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="text-neutral-300 text-xs">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
