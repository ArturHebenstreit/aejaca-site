import { createContext, useContext, useState, useEffect } from "react";
import en from "./en.js";
import pl from "./pl.js";
import de from "./de.js";

const translations = { en, pl, de };

const STORAGE_KEY = "aejaca-lang";

function detectLanguage() {
  // Check localStorage first
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && translations[saved]) return saved;

  // Auto-detect from browser
  const langs = navigator.languages || [navigator.language || "en"];
  for (const lang of langs) {
    const code = lang.toLowerCase();
    if (code.startsWith("pl")) return "pl";
    if (code.startsWith("de")) return "de";
  }
  return "en";
}

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(detectLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];
