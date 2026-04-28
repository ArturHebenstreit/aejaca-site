import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildBreadcrumbSchema, buildWebPageSchema } from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

export default function Privacy() {
  const { t, lang } = useLanguage();
  const p = t.privacy;

  // Privacy pages are still indexed but lower priority — breadcrumb + webpage is sufficient.
  const seo = getSEO("privacy", lang);
  const pageUrl = `${SITE.url}/privacy/`;
  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: "Privacy", url: pageUrl },
    ]),
  ];

  return (
    <>
      <SEOHead pageKey="privacy" path="/privacy" schemas={schemas} />
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">{p.title}</h1>
            <p className="text-neutral-400 mb-10">{p.subtitle}</p>

            <div className="space-y-6 text-neutral-300 text-sm leading-relaxed">
              {p.paragraphs.map((text, i) => <p key={i}>{text}</p>)}
              <p>
                {p.contactLine}{" "}
                <a href="mailto:contact@aejaca.com" className="text-amber-400 hover:underline">contact@aejaca.com</a>.
              </p>
              <p>{p.consent}</p>
            </div>

            <div className="mt-12">
              <Link to="/" className="text-sm text-neutral-400 hover:text-white transition-colors">
                &larr; {p.backHome}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
