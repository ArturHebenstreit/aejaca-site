// ============================================================
// PACZKOMATY INPOST
// ============================================================
// Klient wpisywal kod paczkomatu z pamieci, w rodzaju WAW01A. Kto go nie pamieta,
// otwiera wyszukiwarke InPostu w drugiej karcie, przepisuje kod i wraca. Kazdy
// z tych krokow to okazja do porzucenia koszyka albo do literowki, ktora wyjdzie
// dopiero przy nadaniu paczki.
//
// Pytamy wiec InPost sami i oddajemy gotowa liste do wyboru. Zapytanie idzie
// z serwera, nie z przegladarki, z trzech powodow: polityka tresci strony
// zostaje szczelna, odpowiedzi da sie trzymac w pamieci podrecznej, a adres
// klienta nie wychodzi do InPostu przy kazdym nacisnieciu klawisza.

const SHIPX = "https://api-shipx-pl.easypack24.net/v1/points";

/** Odpowiedzi zyja godzine. Paczkomaty nie przenosza sie z dnia na dzien. */
const TTL = 60 * 60_000;
const cache = new Map();

export class LockerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

/** Kod pocztowy w zapisie, ktorego oczekuje InPost: 00-000 */
function asPostCode(q) {
  const digits = String(q).replace(/[^0-9]/g, "");
  return digits.length === 5 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : null;
}

/**
 * Zwraca liste punktow pasujacych do zapytania. Zapytaniem moze byc kod
 * pocztowy albo nazwa miejscowosci, bo klient wpisze jedno albo drugie,
 * a rozroznianie tego za niego jest tania uprzejmoscia.
 */
export async function findLockers(query, { limit = 12, fetchImpl = fetch } = {}) {
  const q = String(query || "").trim();
  if (q.length < 3) throw new LockerError("Wpisz co najmniej trzy znaki", "too_short");

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.points;

  const params = new URLSearchParams({
    // Same paczkomaty, bez punktow obslugiwanych przez czlowieka: klient wybral
    // "Paczkomat InPost", wiec lista ma zawierac to, co wybral.
    type: "parcel_locker",
    status: "Operating",
    per_page: String(Math.min(limit, 25)),
  });

  const postCode = asPostCode(q);
  if (postCode) params.set("relative_post_code", postCode);
  else params.set("city", q);

  let data;
  try {
    const res = await fetchImpl(`${SHIPX}?${params}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new LockerError(`InPost odpowiedzial ${res.status}`, "upstream");
    data = await res.json();
  } catch (e) {
    if (e instanceof LockerError) throw e;
    throw new LockerError("Nie udalo sie polaczyc z InPostem", "unreachable");
  }

  const points = normalizePoints(data);
  cache.set(key, { ts: Date.now(), points });
  return points;
}

/** Z odpowiedzi InPostu bierzemy tylko to, co klient zobaczy na liscie. */
export function normalizePoints(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .map((p) => ({
      code: p.name,
      street: p.address?.line1 || p.address_details?.street || "",
      city: p.address_details?.city || "",
      postCode: p.address_details?.post_code || "",
      // Opis mowi, gdzie ta skrzynka faktycznie stoi ("przy sklepie Zabka").
      // Bez niego dwa paczkomaty na tej samej ulicy sa nie do rozroznienia.
      description: p.location_description || "",
      open247: /24\/7/.test(p.opening_hours || "") || p.location_type === "Outdoor",
    }))
    .filter((p) => p.code);
}
