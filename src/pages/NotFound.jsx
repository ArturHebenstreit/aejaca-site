import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const LABELS = {
  pl: { title: "Strona nie znaleziona", text: "Wygląda na to, że ta strona nie istnieje lub została przeniesiona.", btn: "Wróć na stronę główną" },
  en: { title: "Page not found", text: "It looks like this page doesn't exist or has been moved.", btn: "Back to home" },
  de: { title: "Seite nicht gefunden", text: "Diese Seite existiert nicht oder wurde verschoben.", btn: "Zurück zur Startseite" },
};

export default function NotFound() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;

  return (
    <div className="pt-16 min-h-[70vh] flex items-center justify-center px-4 bg-neutral-950">
      <div className="text-center max-w-md">
        <div className="text-8xl font-mono font-bold text-white/10 mb-4">404</div>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-3">{l.title}</h1>
        <p className="text-neutral-400 mb-8">{l.text}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {l.btn}
        </Link>
      </div>
    </div>
  );
}
