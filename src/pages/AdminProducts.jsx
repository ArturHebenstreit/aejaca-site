// ============================================================
// PANEL: PRODUKTY I STANY MAGAZYNOWE
// ============================================================
// Widok na cala tabele `products`, takze na pozycje zdjete ze sprzedazy.
// Bez niego jedynym sposobem sprawdzenia, co i w ilu sztukach jest wystawione,
// bylo zapytanie SQL, a stan magazynowy to rzecz, ktora zmienia sie najczesciej
// i najbardziej boli, gdy sie rozjedzie.
//
// Dwie zmiany robi sie tu od reki, bo sa codzienne: korekta stanu i zdjecie
// pozycji ze sprzedazy. Reszta tresci idzie przez `PUT /api/products/:slug`.
//
// Zmiana stanu dziala od razu w sklepie, bo karty pytaja o dostepnosc na zywo.
// Zmiana tresci albo zdjec wymaga `npm run products:pull` i wdrozenia, bo
// katalog jest budowany statycznie, a zdjecia leza w repozytorium.
//
// Token administracyjny zyje tylko w sessionStorage tej karty, tak samo jak
// w panelu przelewow.

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, AlertTriangle, Inbox, Check, Search, ExternalLink } from "lucide-react";
import SEOHead from "../seo/SEOHead.jsx";
import { subcategory as findSub } from "../data/shopFacets.js";

const API = import.meta.env.VITE_CHAT_API_URL;
const KEY = "aejaca_admin_token";

/**
 * Stany pozycji. Jedno pole zamiast kilku znacznikow: pytanie "czy klient to
 * kupi" ma jedna odpowiedz, a niemozliwe kombinacje nie istnieja.
 *
 * Kolejnosc jest kolejnoscia w panelu, od najczestszej decyzji do najrzadszej.
 */
const STATUSES = [
  { id: "live",     label: "W sprzedaży", hint: "Widoczny, można kupić", tone: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" },
  { id: "sold_out", label: "Wyprzedany",  hint: "Widoczny z plakietką, bez zakupu, wróci na półkę", tone: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  { id: "hidden",   label: "Ukryty",      hint: "Znika ze sklepu, wróci", tone: "border-blue-400/40 bg-blue-400/10 text-blue-300" },
  { id: "draft",    label: "Roboczy",     hint: "Nigdy nie był wystawiony", tone: "border-white/25 bg-white/[0.06] text-neutral-300" },
  { id: "retired",  label: "Wycofany",    hint: "Zdjęty na stałe", tone: "border-red-400/40 bg-red-400/10 text-red-300" },
];

const pln = (grosze) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 2 })
    .format((grosze || 0) / 100);

/** Stan magazynowy jest tu najwazniejsza liczba, wiec ma wlasny kolor. */
function stockTone(p) {
  if (p.stock === null) return "text-blue-300";
  if (p.status !== "live" || p.available === 0) return "text-red-300";
  if (p.available <= 1) return "text-amber-300";
  return "text-emerald-300";
}

/**
 * Wybor stanu. Cala piatka lezy na wierzchu, bez rozwijanej listy: rzecz
 * sprzedana na Etsy ma zejsc ze sprzedazy jednym kliknieciem, a nie dwoma.
 */
function StatusPicker({ product, busy, onPick }) {
  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((st) => {
        const on = product.status === st.id;
        return (
          <button
            key={st.id}
            type="button"
            title={st.hint}
            onClick={() => !on && onPick(st.id)}
            disabled={busy}
            className={`px-2 py-1 rounded-md border text-[10px] transition-colors ${
              on ? st.tone : "border-white/10 text-neutral-500 hover:border-white/25 hover:text-neutral-300"
            }`}
          >
            {busy && on ? <Loader2 className="w-3 h-3 animate-spin" /> : st.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminProducts() {
  const [token, setToken] = useState("");
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [draftStock, setDraftStock] = useState({});
  const [query, setQuery] = useState("");
  const [onlyOff, setOnlyOff] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved) setToken(saved);
  }, []);

  const load = useCallback(async (t) => {
    if (!t || !API) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/admin/products`, { headers: { "X-Admin-Token": t } });
      if (r.status === 401) {
        setError("Nieprawidłowy token");
        setProducts(null);
        return;
      }
      const d = await r.json();
      setProducts(d.products || []);
      sessionStorage.setItem(KEY, t);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function patch(slug, path, body, apply) {
    setBusy(slug + path);
    setError(null);
    try {
      const r = await fetch(`${API}/api/products/${slug}/${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || `Błąd ${r.status}`);
        return;
      }
      setProducts((prev) => prev.map((p) => (p.slug === slug ? apply(p) : p)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  const saveStock = (p) => {
    const stock = Number(draftStock[p.slug]);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stan musi być liczbą całkowitą nie mniejszą od zera");
      return;
    }
    // Rezerwacje zostaja nietkniete, wiec dostepnosc liczymy tak samo jak baza.
    patch(p.slug, "stock", { stock }, (x) => ({
      ...x,
      stock,
      available: Math.max(stock - (x.reserved || 0), 0),
    })).then(() => setDraftStock((d) => ({ ...d, [p.slug]: undefined })));
  };

  const q = query.trim().toLowerCase();
  const rows = (products || []).filter((p) => {
    if (onlyOff && p.status === "live") return false;
    if (!q) return true;
    const title = Object.values(p.title || {}).join(" ").toLowerCase();
    return p.slug.includes(q) || title.includes(q);
  });

  return (
    <>
      <SEOHead pageKey="adminProducts" path="/admin/products" noindex schemas={[]} />
      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">Produkty i stany magazynowe</h1>
          <p className="text-neutral-500 text-xs mb-8 leading-relaxed max-w-2xl">
            Stan magazynowy i stan pozycji działają od razu, bo sklep pyta o dostępność na żywo. Rzecz sprzedana
            na Etsy albo na miejscu przestaje być do kupienia w tej samej sekundzie: <strong className="text-neutral-300">Wyprzedany</strong> zostawia
            kartę z plakietką i obietnicą powrotu, <strong className="text-neutral-300">Ukryty</strong> zdejmuje ją ze sklepu, a <strong className="text-neutral-300">Wycofany</strong> robi
            to na stałe. Zmiana treści, ceny albo zdjęć wymaga jeszcze <code className="text-neutral-400">npm run products:pull</code> i wdrożenia,
            bo katalog jest budowany statycznie, a zdjęcia leżą w repozytorium.
          </p>

          <div className="flex gap-2 mb-6">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(token)}
              placeholder="Token administracyjny"
              className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                         placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/50"
            />
            <button
              type="button"
              onClick={() => load(token)}
              disabled={!token || loading}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-neutral-800
                         disabled:text-neutral-500 text-white text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Wczytaj
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 mb-6 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {products && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Szukaj po nazwie albo adresie"
                  className="w-full bg-transparent border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white
                             placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/50"
                />
              </div>
              <button
                type="button"
                onClick={() => setOnlyOff((v) => !v)}
                className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                  onlyOff
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                    : "border-white/10 text-neutral-400 hover:border-white/25"
                }`}
              >
                Poza sprzedażą
              </button>
              <span className="text-neutral-600 text-[11px]">{rows.length} z {products.length}</span>
            </div>
          )}

          {products && rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
              <Inbox className="w-7 h-7 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-xs">
                {products.length === 0
                  ? "Baza produktów jest pusta. Dane startowe wgrasz komendą npm run products:seed."
                  : "Nic nie pasuje do filtru"}
              </p>
            </div>
          )}

          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-neutral-500 border-b border-white/10">
                    <th className="px-3 py-2 font-medium">Produkt</th>
                    <th className="px-3 py-2 font-medium">Dział</th>
                    <th className="px-3 py-2 font-medium">Oferta</th>
                    <th className="px-3 py-2 font-medium text-right">Cena</th>
                    <th className="px-3 py-2 font-medium text-right">Stan</th>
                    <th className="px-3 py-2 font-medium text-right">Rezerw.</th>
                    <th className="px-3 py-2 font-medium text-right">Dostępne</th>
                    <th className="px-3 py-2 font-medium text-right">Sprzedane</th>
                    <th className="px-3 py-2 font-medium">Stan pozycji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((p) => {
                    const sub = findSub(p.subcategory);
                    const SubIcon = sub?.Icon;
                    const editing = draftStock[p.slug] !== undefined;
                    return (
                      <tr key={p.slug} className={p.status === "live" ? "" : "opacity-60"}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2.5">
                            {p.images?.[0] && (
                              <img src={p.images[0]} alt="" className="w-9 h-9 rounded-md object-cover bg-black flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-white text-[13px] leading-tight truncate max-w-[220px]">
                                {p.title?.pl || p.slug}
                              </div>
                              <a
                                href={`/shop/${p.slug}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-600 text-[10px] font-mono inline-flex items-center gap-1 hover:text-neutral-400"
                              >
                                {p.slug}<ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-neutral-300 text-xs">{p.category || "-"}</div>
                          {sub && (
                            <div className="text-neutral-500 text-[10px] inline-flex items-center gap-1 mt-0.5">
                              {SubIcon && <SubIcon className="w-3 h-3" />}{sub.label.pl}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-neutral-400 text-xs">
                          {p.offer === "personalized" ? "personalizowany" : "gotowy"}
                          <div className="text-neutral-600 text-[10px]">{p.kind === "digital" ? "plik" : "fizyczny"}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-200 whitespace-nowrap">{pln(p.price_grosze)}</td>
                        <td className="px-3 py-2 text-right">
                          {p.stock === null ? (
                            <span className="text-blue-300 text-xs">bez limitu</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="0"
                                value={editing ? draftStock[p.slug] : p.stock}
                                onChange={(e) => setDraftStock((d) => ({ ...d, [p.slug]: e.target.value }))}
                                className="w-16 bg-transparent border border-white/10 rounded-md px-2 py-1 text-right text-xs
                                           text-white focus:outline-none focus:border-blue-400/50"
                              />
                              {editing && (
                                <button
                                  type="button"
                                  onClick={() => saveStock(p)}
                                  disabled={busy === p.slug + "stock"}
                                  className="p-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-white"
                                  aria-label="Zapisz stan"
                                >
                                  {busy === p.slug + "stock"
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Check className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-400 text-xs">{p.reserved || 0}</td>
                        <td className={`px-3 py-2 text-right text-xs font-medium ${stockTone(p)}`}>
                          {p.stock === null
                            ? (p.status === "live" ? "bez limitu" : "-")
                            : (p.status === "live" ? p.available : 0)}
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-500 text-xs">{p.sold_count || 0}</td>
                        <td className="px-3 py-2">
                          <StatusPicker
                            product={p}
                            busy={busy === p.slug + "status"}
                            onPick={(status) => patch(p.slug, "status", { status }, (x) => ({ ...x, status }))}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
