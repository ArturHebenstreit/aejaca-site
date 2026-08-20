// ============================================================
// STAWKI MATERIALOW DO PRZEGLADARKI
// ============================================================
// Kwota na ekranie i kwota wiazaca musza brac sie z jednego zrodla. Serwer
// czyta `material_stock` wprost z bazy, przegladarka przez ten hook, wiec
// obie strony licza z tych samych liczb.
//
// Gdy odpowiedzi nie ma, ODDAJEMY PUSTA LISTE, a nie null: wycena ma wtedy
// zejsc do stawki domyslnej i pokazac kwote, zamiast czekac w nieskonczonosc.
// Awaria bazy ma wstrzymac aktualizacje cennika, nie sprzedaz.

import { useState, useEffect } from "react";

const API = import.meta.env?.VITE_CHAT_API_URL || "";
const CACHE_KEY = "material-stock-v1";
const TTL = 60 * 60 * 1000;

export function useMaterialStock() {
  const [stock, setStock] = useState(null);

  useEffect(() => {
    if (!API) { setStock([]); return; }
    let cancelled = false;

    const pobierz = () =>
      fetch(`${API}/api/material-stock`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          const lista = Array.isArray(data?.materials) ? data.materials : [];
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), lista })); } catch {}
          setStock(lista);
        })
        .catch(() => { if (!cancelled) setStock([]); });

    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.ts < TTL && Array.isArray(cached.lista)) {
        setStock(cached.lista);
        pobierz();
        return () => { cancelled = true; };
      }
    } catch {}

    pobierz();
    return () => { cancelled = true; };
  }, []);

  return stock;
}
