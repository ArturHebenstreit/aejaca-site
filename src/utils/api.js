// ============================================================
// WYWOLANIA API SKLEPU
// ============================================================
// Jedno miejsce, zeby kazde zapytanie zwiazane z zamowieniem mialo
// twardy limit czasu i logowalo swoj przebieg. Zawieszone polaczenie
// bez limitu zostawia przycisk w stanie "przetwarzam" na zawsze,
// a klient nie wie, czy zaplacil, czy nie.

export const API_URL = import.meta.env.VITE_CHAT_API_URL;

export async function postJSON(url, body, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    console.info("[shop] ->", url);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: `Serwer zwrocil odpowiedz, ktorej nie da sie odczytac (${resp.status})`,
        raw: text.slice(0, 200),
      };
    }
    console.info("[shop] <-", url, resp.status, data);
    return { ok: resp.ok, status: resp.status, data };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Wyslanie formularza platnosci do bramki.
 *
 * Bramka wymaga zwyklego POST formularza, nie wywolania fetch, bo klient
 * ma zostac przeniesiony na jej strone. Zwracamy funkcje anulujaca, zeby
 * wywolujacy mogl pokazac komunikat, gdy przegladarka zablokuje wysylke
 * (robi to po cichu, gdy polityka bezpieczenstwa nie zna domeny bramki).
 */
export function submitPaymentForm({ url, params }, onBlocked, blockedAfterMs = 8000) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  for (const [k, v] of Object.entries(params)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = String(v);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  console.info("[shop] wysylam formularz platnosci do", url);
  form.submit();

  const timer = setTimeout(() => {
    console.error("[shop] formularz platnosci nie przeniosl przegladarki, prawdopodobnie blokada CSP");
    onBlocked?.();
  }, blockedAfterMs);
  return () => clearTimeout(timer);
}
