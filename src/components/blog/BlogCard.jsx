import { Link } from "react-router-dom";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const CATEGORY_LABELS = {
  jewelry: { pl: "Biżuteria", en: "Jewelry", de: "Schmuck", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  studio:  { pl: "sTuDiO", en: "sTuDiO", de: "sTuDiO", color: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
};

export default function BlogCard({ post }) {
  const { lang } = useLanguage();
  const cat = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.studio;
  const title = post.title[lang] || post.title.pl;
  const description = post.description[lang] || post.description.pl;
  const readTime = post.readingTime[lang] || post.readingTime.pl;

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-white/20 transition-all duration-300"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={post.coverImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          width="600"
          height="400"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${cat.color}`}>
            <Tag className="w-3 h-3" />
            {cat[lang] || cat.en}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-serif text-lg font-semibold text-white mb-2 group-hover:text-amber-300 transition-colors leading-snug">
          {title}
        </h3>
        <p className="text-neutral-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
          {description}
        </p>
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {readTime} min
          </span>
          <span className="inline-flex items-center gap-1 text-amber-400 group-hover:text-amber-300 transition-colors">
            {{ pl: "Czytaj", en: "Read", de: "Lesen" }[lang] || "Read"}
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
