import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "aejaca-theme";

function detectTheme() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY);
  // light = new brand default; only switch to dark if explicitly saved
  return saved === "dark" ? "dark" : "light";
}

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeRaw] = useState("light"); // SSR-safe default

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
