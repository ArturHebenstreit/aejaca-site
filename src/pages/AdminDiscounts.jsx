// ============================================================
// PANEL: KODY RABATOWE
// ============================================================
// Dwie rodziny kodow, jeden mechanizm:
//
//   osobisty  losowy ciag, jedno uzycie, wreczany konkretnej osobie
//   akcja     ladne haslo (MATKA15), okno czasowe, limit na adres e-mail
//
// Paczka kodow osobistych powstaje jednym kliknieciem, bo wreczenie dwudziestu
// roznych kodow ma byc jedna czynnoscia, a nie dwudziestoma. Wygenerowane kody
// zostaja na ekranie do skopiowania: drugi raz ich nie pokazemy w calosci
// razem, a lista ponizej i tak je ma.
//
// Kodu nie kasujemy, tylko wylaczamy. Historia uzyc ma zostac.

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, AlertTriangle, Inbox, Plus, Copy, Power } from "lucide-react";
import SEOHead from "../seo/SEOHead.jsx";

const API = import.meta.env.VITE_CHAT_API_URL;
const KEY = "aejaca_admin_token";

const APPLIES_TO = [
  { id: "all", label: "Wszystko" },
  { id: "products", label: "Produkty gotowe" },
  { id: "services", label: "Usługi" },
  { id: "jewelry", label: "Biżuteria" },
  { id: "studio", label: "sTuDiO" },
];

const pln = (grosze) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format((grosze || 0) / 100);

const day = (v) => (v ? new Date(v).toLocaleDateString("pl-PL") : "-");

/** Kod osobisty ma limit jednego uzycia, akcja nie ma go wcale. */
function kindLabel(c) {
  if (c.campaign === "newsletter") return "powitalny";
  return c.max_uses === 1 ? "osobisty" : "akcja";
}

function Row({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-neutral-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white " +
  "placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/50";

export default function AdminDiscounts() {
  const [token, setToken] = useState("");
  const [codes, setCodes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [created, setCreated] = useState([]);

  const [form, setForm] = useState({
    mode: "campaign",     // campaign | batch
    code: "",
    prefix: "AEJ",
    count: 10,
    kind: "percent",
    value: 10,
    appliesTo: "all",
    minOrder: "",
    maxUses: "",
    maxUsesPerEmail: 1,
    validFrom: "",
    validTo: "",
    campaign: "",
    note: "",
  });

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved) setToken(saved);
  }, []);

  const load = useCallback(async (t) => {
    if (!t || !API) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/admin/discounts`, { headers: { "X-Admin-Token": t } });
      if (r.status === 401) {
        setError("Nieprawidłowy token");
        setCodes(null);
        return;
      }
      const d = await r.json();
      setCodes(d.codes || []);
      sessionStorage.setItem(KEY, t);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function create() {
    setBusy("create");
    setError(null);
    setCreated([]);
    const batch = form.mode === "batch";
    try {
      const r = await fetch(`${API}/api/admin/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({
          code: batch ? undefined : form.code,
          prefix: batch ? form.prefix : undefined,
          count: batch ? Number(form.count) : 1,
          kind: form.kind,
          // Kwotę podajesz w złotych, baza trzyma grosze.
          value: form.kind === "amount" ? Math.round(Number(form.value) * 100) : Number(form.value),
          appliesTo: form.appliesTo,
          minOrderGrosze: form.minOrder ? Math.round(Number(form.minOrder) * 100) : 0,
          maxUses: form.maxUses ? Number(form.maxUses) : (batch ? 1 : null),
          maxUsesPerEmail: Number(form.maxUsesPerEmail) || 1,
          validFrom: form.validFrom || null,
          validTo: form.validTo || null,
          campaign: form.campaign || null,
          note: form.note || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || `Błąd ${r.status}`);
        return;
      }
      setCreated(d.codes || []);
      setForm((f) => ({ ...f, code: "" }));
      load(token);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function toggle(c) {
    setBusy(c.code);
    try {
      const r = await fetch(`${API}/api/admin/discounts/${encodeURIComponent(c.code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ active: !c.active }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || `Błąd ${r.status}`);
        return;
      }
      setCodes((prev) => prev.map((x) => (x.code === c.code ? { ...x, active: !x.active } : x)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  const batch = form.mode === "batch";
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <SEOHead pageKey="adminDiscounts" path="/admin/discounts" noindex schemas={[]} />
      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">Kody rabatowe</h1>
          <p className="text-neutral-500 text-xs mb-8 leading-relaxed max-w-2xl">
            Kod <strong className="text-neutral-300">osobisty</strong> ma jedno użycie w ogóle, więc rozdany
            indywidualnie zadziała dokładnie raz. Kod <strong className="text-neutral-300">akcji</strong> działa
            w oknie czasowym i ma limit na adres e-mail. Zniżka liczy się tylko od pozycji, które obejmuje,
            i nigdy od wysyłki. Kod rezerwuje się przy zamówieniu, a zużywa dopiero przy zapłacie, więc
            porzucony koszyk go nie spala.
          </p>

          <div className="flex gap-2 mb-6">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(token)}
              placeholder="Token administracyjny"
              className={inputCls + " flex-1"}
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

          {created.length > 0 && (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 mb-6">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-emerald-300 text-xs">Wygenerowane kody ({created.length})</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(created.join("\n"))}
                  className="text-emerald-300 hover:text-emerald-200 text-[11px] inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />Kopiuj wszystkie
                </button>
              </div>
              <p className="text-emerald-200 text-xs font-mono leading-relaxed break-all">{created.join("  ")}</p>
            </div>
          )}

          {/* Tworzenie */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mb-8">
            <div className="flex gap-2 mb-5">
              {[
                { id: "campaign", label: "Akcja, jedno hasło" },
                { id: "batch", label: "Paczka kodów osobistych" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mode: m.id }))}
                  className={`facet-chip px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    form.mode === m.id ? "facet-chip-on" : ""
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              {batch ? (
                <>
                  <Row label="Przedrostek">
                    <input value={form.prefix} onChange={set("prefix")} className={inputCls} placeholder="AEJ" />
                  </Row>
                  <Row label="Ile kodów">
                    <input type="number" min="1" max="200" value={form.count} onChange={set("count")} className={inputCls} />
                  </Row>
                </>
              ) : (
                <Row label="Kod">
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className={inputCls + " uppercase"}
                    placeholder="MATKA15"
                  />
                </Row>
              )}

              <Row label="Rodzaj">
                <select value={form.kind} onChange={set("kind")} className={inputCls}>
                  <option value="percent">Procent</option>
                  <option value="amount">Kwota w złotych</option>
                </select>
              </Row>
              <Row label={form.kind === "percent" ? "Ile procent" : "Ile złotych"}>
                <input type="number" min="1" value={form.value} onChange={set("value")} className={inputCls} />
              </Row>
              <Row label="Obejmuje">
                <select value={form.appliesTo} onChange={set("appliesTo")} className={inputCls}>
                  {APPLIES_TO.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </Row>
              <Row label="Minimalna wartość zamówienia (zł)">
                <input type="number" min="0" value={form.minOrder} onChange={set("minOrder")} className={inputCls} placeholder="0" />
              </Row>
              <Row label={batch ? "Użyć na kod" : "Użyć łącznie (puste = bez limitu)"}>
                <input type="number" min="1" value={form.maxUses} onChange={set("maxUses")} className={inputCls} placeholder={batch ? "1" : "bez limitu"} />
              </Row>
              <Row label="Użyć na adres e-mail">
                <input type="number" min="1" value={form.maxUsesPerEmail} onChange={set("maxUsesPerEmail")} className={inputCls} />
              </Row>
              <Row label="Ważny od">
                <input type="date" value={form.validFrom} onChange={set("validFrom")} className={inputCls} />
              </Row>
              <Row label="Ważny do">
                <input type="date" value={form.validTo} onChange={set("validTo")} className={inputCls} />
              </Row>
              <Row label="Nazwa akcji">
                <input value={form.campaign} onChange={set("campaign")} className={inputCls} placeholder="Dzień Matki 2026" />
              </Row>
              <Row label="Notatka wewnętrzna">
                <input value={form.note} onChange={set("note")} className={inputCls} placeholder="komu i za co" />
              </Row>
            </div>

            <button
              type="button"
              onClick={create}
              disabled={!token || busy === "create" || (!batch && !form.code.trim())}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800
                         disabled:text-neutral-500 text-white text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              {busy === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {batch ? `Wygeneruj ${form.count} kodów` : "Utwórz kod"}
            </button>
          </div>

          {codes && codes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
              <Inbox className="w-7 h-7 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-xs">Nie ma jeszcze żadnego kodu</p>
            </div>
          )}

          {codes && codes.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-neutral-500 border-b border-white/10">
                    <th className="px-3 py-2 font-medium">Kod</th>
                    <th className="px-3 py-2 font-medium">Zniżka</th>
                    <th className="px-3 py-2 font-medium">Obejmuje</th>
                    <th className="px-3 py-2 font-medium">Ważny</th>
                    <th className="px-3 py-2 font-medium text-right">Użyto</th>
                    <th className="px-3 py-2 font-medium text-right">W toku</th>
                    <th className="px-3 py-2 font-medium text-right">Udzielono</th>
                    <th className="px-3 py-2 font-medium">Stan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {codes.map((c) => (
                    <tr key={c.code} className={c.active ? "" : "opacity-50"}>
                      <td className="px-3 py-2">
                        <div className="text-white font-mono text-[13px]">{c.code}</div>
                        <div className="text-neutral-600 text-[10px]">
                          {kindLabel(c)}{c.campaign ? `, ${c.campaign}` : ""}
                          {c.issued_to ? `, ${c.issued_to}` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-neutral-200 whitespace-nowrap">
                        {c.kind === "percent" ? `${c.value}%` : pln(c.value)}
                        {c.min_order_grosze > 0 && (
                          <div className="text-neutral-600 text-[10px]">od {pln(c.min_order_grosze)}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-neutral-400 text-xs">
                        {APPLIES_TO.find((a) => a.id === c.applies_to)?.label || c.applies_to}
                      </td>
                      <td className="px-3 py-2 text-neutral-400 text-xs whitespace-nowrap">
                        {c.valid_from || c.valid_to ? `${day(c.valid_from)} do ${day(c.valid_to)}` : "bez terminu"}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-200 text-xs">
                        {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-500 text-xs">{c.pending || 0}</td>
                      <td className="px-3 py-2 text-right text-neutral-400 text-xs whitespace-nowrap">
                        {pln(c.granted_grosze)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggle(c)}
                          disabled={busy === c.code}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] inline-flex items-center gap-1.5 transition-colors ${
                            c.active
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/50"
                              : "border-white/10 text-neutral-500 hover:border-white/25"
                          }`}
                        >
                          {busy === c.code ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                          {c.active ? "aktywny" : "wyłączony"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
