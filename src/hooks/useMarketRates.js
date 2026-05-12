import { useState, useEffect } from "react";

const API = "https://api.aejaca.com";

// Returns { rates, loading } where rates matches METAL_PRICES + EUR_PLN shape
// Falls back to static values if API unavailable
const FALLBACK = {
  au_pln_per_g: 645,
  ag_pln_per_g: 10.15,
  pt_pln_per_g: 268,
  pd_pln_per_g: 120,
  pln_per_usd: 3.98,
  pln_per_eur: 4.25,
  eur_per_usd: 0.937,
  sources: null,
};

export function useMarketRates() {
  const [rates, setRates] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/market-rates`)
      .then(r => r.json())
      .then(data => {
        setRates({
          au_pln_per_g: data.au_pln_per_g ?? FALLBACK.au_pln_per_g,
          ag_pln_per_g: data.ag_pln_per_g ?? FALLBACK.ag_pln_per_g,
          pt_pln_per_g: data.pt_pln_per_g ?? FALLBACK.pt_pln_per_g,
          pd_pln_per_g: data.pd_pln_per_g ?? FALLBACK.pd_pln_per_g,
          pln_per_usd: data.pln_per_usd ?? FALLBACK.pln_per_usd,
          pln_per_eur: data.pln_per_eur ?? FALLBACK.pln_per_eur,
          eur_per_usd: data.eur_per_usd ?? FALLBACK.eur_per_usd,
          sources: data.sources ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { rates, loading };
}
