// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/shop/customerFields.js
// Regeneracja: npm run sync:pricing

// ============================================================
// KONTROLA DANYCH KLIENTA
// ============================================================
// Te same reguly obowiazuja w przegladarce i na serwerze, dlatego siedza
// w jednym pliku bez widoku (kopia jedzie do chat-api razem z rdzeniem
// cenowym, `npm run sync:pricing`). Kontrola w przegladarce jest uprzejmoscia
// wobec klienta, kontrola na serwerze jest tym, co naprawde obowiazuje.
//
// Kazda funkcja zwraca `null`, gdy jest dobrze, albo kod bledu. Kody, a nie
// zdania, bo strona mowi w trzech jezykach.
//
// Po co az tyle: numer "2342342342342rrrr" i imie "aArtur" przechodzily do
// zamowienia bez slowa sprzeciwu. Kurier dzwoni pod numer, ktorego nie ma,
// a na paczce widnieje imie bez nazwiska, wiec przesylka wraca.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  const v = String(value || "").trim();
  if (!v) return "required";
  if (!EMAIL_RE.test(v)) return "format";
  return null;
}

/**
 * Imie i nazwisko, bo to jedzie na etykiete przesylki. Wymagamy dwoch czlonow:
 * kurier z samym imieniem nie doreczy, a paczkomat nie wyda.
 */
export function validateName(value) {
  const v = String(value || "").trim().replace(/\s+/g, " ");
  if (!v) return "required";
  // Litery dowolnego alfabetu, znaki diakrytyczne, myslnik i apostrof
  // (Anna Nowak-Kowalska, O'Brien, Jean-Luc). Cyfry w nazwisku to pomylka.
  if (!/^[\p{L}\p{M}'’.\- ]+$/u.test(v)) return "format";
  const parts = v.split(" ").filter((p) => p.length > 1);
  if (parts.length < 2) return "full_name";
  return null;
}

/**
 * Numer telefonu. Kurier dzwoni przed doreczeniem, InPost wysyla kod odbioru
 * wiadomoscia, wiec bledny numer to nieodebrana paczka, a nie drobiazg.
 *
 * Krajowy: dziewiec cyfr. Zagraniczny: z plusem, od osmiu do pietnastu cyfr,
 * czyli zgodnie z zakresem numeracji miedzynarodowej.
 */
export function validatePhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "required";
  // Spacje, myslniki i nawiasy sa dla oka, nie dla sieci.
  const cleaned = raw.replace(/[\s\-()]/g, "");
  if (!/^\+?\d+$/.test(cleaned)) return "format";
  const digits = cleaned.replace(/^\+/, "");
  if (cleaned.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? null : "format";
  // Bez plusa przyjmujemy numer polski. Zapis 0048 tez jest w obiegu.
  if (digits.startsWith("0048")) return digits.length === 13 ? null : "format";
  if (digits.startsWith("48") && digits.length === 11) return null;
  return digits.length === 9 ? null : "format";
}

/** Numer w postaci zapisywanej w zamowieniu: bez ozdobnikow. */
export function normalizePhone(value) {
  return String(value || "").trim().replace(/[\s\-()]/g, "");
}

/**
 * Komplet danych klienta. Zwraca mape pole -> kod bledu, pusta gdy wszystko
 * jest w porzadku. Jedno miejsce, wiec formularz i serwer nie moga sie rozejsc.
 */
export function validateCustomer(customer = {}) {
  const errors = {};
  const email = validateEmail(customer.email);
  if (email) errors.email = email;
  const name = validateName(customer.name);
  if (name) errors.name = name;
  const phone = validatePhone(customer.phone);
  if (phone) errors.phone = phone;
  return errors;
}
