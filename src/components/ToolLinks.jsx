// ============================================================
// SIATKA ODNOSNIKOW DO NARZEDZI
// ============================================================
// Jeden komponent dla wszystkich miejsc, w ktorych tresc ma prowadzic do
// narzedzia: wpisy blogowe, hasla slownika, sklep, karty uslug, strona B2B
// i sekcje pod kalkulatorami. Dane pochodzą z `src/data/toolLinks.js`.
//
// Osobne implementacje w kazdym z tych miejsc rozjechalyby sie po pierwszej
// zmianie, a przy okazji kazda kolejna strona zaczynalaby od zera.

import { Link } from "../i18n/nav.jsx";
import { ArrowRight, Wrench } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const UI = {
  pl: {
    buyer: "Sprawdź przed zamówieniem",
    pro: "Narzędzia warsztatowe",
    content: "Narzędzia do tego tematu",
  },
  en: {
    buyer: "Check before you order",
    pro: "Workshop tools",
    content: "Tools for this topic",
  },
  de: {
    buyer: "Vor der Bestellung prüfen",
    pro: "Werkstatt-Tools",
    content: "Werkzeuge zu diesem Thema",
  },
};

export default function ToolLinks({
  tools = [],
  variant = "content",
  accent = "amber",
  heading = true,
  className = "",
}) {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  if (!tools.length) return null;

  const tint = accent === "blue" ? "text-blue-400" : "text-amber-400";

  return (
    <section className={`not-prose ${className}`} aria-label={u[variant]}>
      {heading && (
        <div className="flex items-center gap-2 mb-3">
          <Wrench className={`w-4 h-4 ${tint}`} />
          <h3 className={`text-xs uppercase tracking-[0.2em] ${tint}`}>{u[variant]}</h3>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.to}
            className="group rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] p-4 transition-all duration-300"
          >
            <h4 className="text-white text-sm font-medium leading-snug mb-1.5">
              {tool.label[lang] || tool.label.en}
            </h4>
            <p className="text-neutral-500 text-xs leading-relaxed">
              {tool.desc[lang] || tool.desc.en}
            </p>
            <span className={`inline-flex items-center gap-1 ${tint} text-xs mt-2`}>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
