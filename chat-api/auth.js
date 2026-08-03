// ============================================================
// ZADANIA WLASCICIELSKIE
// ============================================================
// Zapis `naglowek !== process.env.X` ma cicha wade: gdy zmiennej nie ma, obie
// strony sa `undefined`, warunek wychodzi falszywy i zadanie BEZ naglowka
// przechodzi. Brak konfiguracji zamienia sie wtedy w otwarte drzwi, i to
// najciszej jak sie da, bo nic nie protestuje.
//
// Dlatego kazde sprawdzenie zaczyna sie od pytania, czy sekret w ogole
// istnieje, i odmawia, gdy go nie ma. Odmowa jest wtedy inna niz przy zlym
// zetonie (503, nie 401), bo to nie klient sie pomylil, tylko usluga nie jest
// skonfigurowana, a te dwie sytuacje naprawia sie w zupelnie innych miejscach.
//
// Samo porownanie idzie stalym czasem. Porownanie napisow konczy sie na
// pierwszej roznicy, wiec czas odpowiedzi zdradza, ile poczatkowych znakow
// zgadza sie z prawdziwym zetonem, a to pozwala zgadywac go znak po znaku.

import { timingSafeEqual } from "node:crypto";

export function secretMatches(provided, expected) {
  if (!expected || typeof provided !== "string" || !provided) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  // Rozna dlugosc i tak wyklucza zgodnosc, a timingSafeEqual rzuca wyjatkiem
  // przy roznych rozmiarach buforow. Dlugosc zetonu nie jest tajemnica.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Zwraca true, gdy zadanie wolno obsluzyc. Gdy zwraca false, odpowiedz zostala
 * juz wyslana, wiec trasa ma po prostu wrocic.
 */
export function requireSecret(req, res, headerName, envName, env = process.env) {
  if (!env[envName]) {
    console.error(`[auth] ${envName} nie jest ustawiony, odmawiam ${req.method} ${req.path}`);
    res.status(503).json({ error: "Usluga nie jest skonfigurowana" });
    return false;
  }
  if (!secretMatches(req.headers[headerName], env[envName])) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

/** Wpisywanie kwot, stanow magazynowych i kodow rabatowych */
export function requireAdmin(req, res) {
  return requireSecret(req, res, "x-admin-token", "ADMIN_API_TOKEN");
}

/** Czyszczenie pamieci podrecznej po zmianie w panelu */
export function requireInvalidateToken(req, res) {
  return requireSecret(req, res, "x-invalidate-token", "MATRIX_INVALIDATE_TOKEN");
}
