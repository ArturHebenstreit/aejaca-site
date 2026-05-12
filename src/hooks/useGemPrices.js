import { useState, useEffect } from "react";

const API = "https://aejacachatapi-production.up.railway.app";
const CACHE_KEY = "gemstone-prices-v1";
const TTL = 24 * 60 * 60 * 1000;

export function useGemPrices() {
  const [gemPrices, setGemPrices] = useState(null); // null = still loading; {} = loaded (empty = API failed)

  useEffect(() => {
    let cancelled = false;
    const fetchFresh = () =>
      fetch(`${API}/api/gemstone-prices`)
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          const map = {};
          for (const gem of data.gems || []) {
            if (gem.base_eur != null) map[gem.gem_id] = parseFloat(gem.base_eur);
          }
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), map })); } catch {}
          setGemPrices(map);
        })
        .catch(() => { if (!cancelled) setGemPrices({}); });

    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.ts < TTL) {
        setGemPrices(cached.map);
        fetchFresh(); // background refresh, don't block UI
        return () => { cancelled = true; };
      }
    } catch {}
    fetchFresh();
    return () => { cancelled = true; };
  }, []);

  return gemPrices; // null=loading, {}=failed/empty, {diamond:3000,...}=ok
}
