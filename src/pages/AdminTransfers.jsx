// ============================================================
// PANEL: PRZELEWY CZEKAJACE NA POTWIERDZENIE
// ============================================================
// Przelew nie ma powiadomienia z bramki, wiec jedynym dowodem wplywu jest
// wyciag bankowy. Ta strona sluzy do zamkniecia tej luki: pokazuje, na co
// czekamy, a przycisk potwierdzenia robi dokladnie to samo, co SUCCESS z
// Autopay, czyli maile do klienta i przeniesienie plikow do Zamowien.
//
// Token administracyjny zyje tylko w sessionStorage tej karty. Nie ma tu
// logowania, bo jedynym uzytkownikiem jest wlasciciel sklepu, a kazde konto
// to kolejna rzecz do pilnowania.

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Check, AlertTriangle, Inbox } from "lucide-react";
import SEOHead from "../seo/SEOHead.jsx";

const API = import.meta.env.VITE_CHAT_API_URL;
const KEY = "aejaca_admin_token";

function money(v, cur) {
  return v == null ? "-" : `${String(v).replace(".", ",")} ${cur}`;
}

export default function AdminTransfers() {
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyRef, setBusyRef] = useState(null);
  const [received, setReceived] = useState({});
  const [done, setDone] = useState([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved) setToken(saved);
  }, []);

  const load = useCallback(async (t) => {
    if (!t || !API) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/orders/awaiting-transfer`, { headers: { "X-Admin-Token": t } });
      if (r.status === 401) {
        setError("Nieprawidłowy token");
        setOrders(null);
        return;
      }
      const d = await r.json();
      setOrders(d.orders || []);
      sessionStorage.setItem(KEY, t);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function confirm(o, force = false) {
    setBusyRef(o.orderRef);
    setError(null);
    try {
      const r = await fetch(`${API}/api/orders/${o.orderRef}/confirm-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({
          receivedEur: received[o.orderRef] ? Number(received[o.orderRef]) : undefined,
          force,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        // Niedoplata nie jest bledem, tylko decyzja do podjecia. Pokazujemy
        // roznice i pozwalamy potwierdzic swiadomie.
        if (d.code === "underpaid") {
          setError(
            `${o.orderRef}: wpłynęło ${d.receivedEur} EUR zamiast ${d.expectedEur} EUR, brakuje ${d.shortfallEur} EUR. ` +
            `Potwierdź ponownie przyciskiem "mimo to", jeśli akceptujesz różnicę.`
          );
          setOrders((prev) => prev.map((x) => (x.orderRef === o.orderRef ? { ...x, underpaid: true } : x)));
          return;
        }
        setError(d.error || `Błąd ${r.status}`);
        return;
      }
      setDone((prev) => [...prev, o.orderRef]);
      setOrders((prev) => prev.filter((x) => x.orderRef !== o.orderRef));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyRef(null);
    }
  }

  return (
    <>
      <SEOHead pageKey="adminTransfers" path="/admin/transfers" noindex schemas={[]} />
      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">Przelewy do potwierdzenia</h1>
          <p className="text-neutral-500 text-xs mb-8 leading-relaxed max-w-xl">
            Potwierdzenie ustawia zamówienie jako opłacone, wysyła klientowi potwierdzenie przyjęcia należności
            wraz z informacją o rozpoczęciu prac i przenosi pliki do folderu Zamówienia. Wykonuje się raz.
          </p>

          <div className="flex gap-2 mb-8">
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

          {done.length > 0 && (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 mb-6">
              <p className="text-emerald-300 text-xs">Potwierdzone: {done.join(", ")}</p>
            </div>
          )}

          {orders && orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
              <Inbox className="w-7 h-7 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-xs">Żadne zamówienie nie czeka na przelew</p>
            </div>
          )}

          <div className="space-y-3">
            {(orders || []).map((o) => (
              <div key={o.orderRef} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-white font-mono text-sm">{o.orderRef}</div>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      {o.name ? `${o.name}, ` : ""}{o.email} &middot; {o.lang}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{money(o.amountEur, "EUR")}</div>
                    <div className="text-neutral-600 text-[10px]">
                      {money(o.totalPLN, "PLN")}{o.eurRate ? `, kurs ${o.eurRate}` : ""}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={received[o.orderRef] ?? ""}
                    onChange={(e) => setReceived((r) => ({ ...r, [o.orderRef]: e.target.value }))}
                    placeholder={`Wpłynęło (EUR), domyślnie ${o.amountEur}`}
                    className="flex-1 min-w-[180px] bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                               placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => confirm(o, Boolean(o.underpaid))}
                    disabled={busyRef === o.orderRef}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800
                               text-white text-sm font-medium transition-colors inline-flex items-center gap-2"
                  >
                    {busyRef === o.orderRef ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {o.underpaid ? "Potwierdzam mimo to" : "Potwierdzam wpływ"}
                  </button>
                </div>

                <div className="text-neutral-600 text-[10px] mt-2">
                  Złożone {new Date(o.createdAt).toLocaleString("pl-PL")}
                  {o.expiresAt ? `, kwota ważna do ${new Date(o.expiresAt).toLocaleDateString("pl-PL")}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
