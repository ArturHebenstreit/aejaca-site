import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "aejaca-theme";

function detectTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" ? "light" : "dark"; // dark = brand default
}

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeRaw] = useState("dark"); // SSR-safe default

  useEffect(() => {
    const t = detectTheme();
    setThemeRaw(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const setTheme = useCallback((t) => {
    setThemeRaw(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
