// ============================================================
// ADRES KLIENTA
// ============================================================
// Wszystkie limity zapytan licza sie po adresie, wiec adres musi pochodzic
// z miejsca, ktorego klient nie kontroluje.
//
// Poprzednia wersja czytala `cf-connecting-ip`, a potem PIERWSZY wpis
// `x-forwarded-for`, oba wprost z zadania. Oba da sie napisac recznie. Pierwszy
// wpis lancucha jest z definicji tym, ktory dopisal klient, wiec braliśmy do
// limitu dokladnie te wartosc, ktora atakujacy sam wybieral, i zmieniajac ja
// co zadanie mial limity za darmo. Do tego `trust proxy` bylo ustawione na
// `true`, czyli "wierz calemu lancuchowi".
//
// Teraz adres bierze sie z `req.ip`. Express liczy go od KONCA lancucha,
// odrzucajac tyle wpisow, ile mamy naprawde warstw posrednich.
//
// Ile ich jest, ustalone pomiarem na zywej usludze 2026-08-03, bo zgadywanie
// myli sie w obie strony: za malo warstw daje adres krawedzi zamiast klienta
// i wsadza wszystkich do wspolnego worka, za duzo daje adres, ktory klient
// moze napisac sam.
//
//   x-forwarded-for:  152.55.185.159, 152.233.12.242
//   x-real-ip:        152.55.185.159
//
// Zapytanie puszczone z konsoli Railway przez adres publiczny uslugi. Kontener
// ma adres wyjsciowy 152.55.185.159 (sprawdzony niezaleznie), czyli KLIENTEM
// jest wpis PIERWSZY, a ostatni nalezy do Railway. To samo widac po tym, ze
// `x-real-ip`, czyli adres polaczenia widziany przez konczacy serwer, rowna sie
// pierwszemu wpisowi w kazdym pomiarze. Stad dwie warstwy, nie jedna.
//
// Podszycie sie odpada niezaleznie od liczby warstw: krawedz Railway kasuje
// `x-forwarded-for` przyslany przez klienta i pisze lancuch od nowa. Sprawdzone
// dwoma zadaniami z podstawionym naglowkiem, spoza sieci i z jej wnetrza:
// podstawiona wartosc nie dotarla ani razu.
//
// `cf-connecting-ip` wroci do laski dopiero wtedy, gdy ruch faktycznie pojdzie
// przez Cloudflare, bo wtedy naglowek dopisuje Cloudflare. Wlacza sie to
// swiadomie, zmienna srodowiskowa, tego samego dnia.

/** Ile wpisow z konca lancucha pochodzi od naszej infrastruktury. */
export const TRUSTED_PROXY_HOPS = Number(process.env.TRUSTED_PROXY_HOPS) || 2;

export const TRUST_CLOUDFLARE_HEADERS = process.env.TRUST_CLOUDFLARE_HEADERS === "true";

export function normalizeIP(raw) {
  return String(raw || "").trim().replace(/^::ffff:/, "");
}

export function extractIP(req, { trustCloudflare = TRUST_CLOUDFLARE_HEADERS } = {}) {
  if (trustCloudflare) {
    const cf = normalizeIP(req.headers["cf-connecting-ip"]);
    if (cf) return cf;
  }
  return normalizeIP(req.ip);
}

export function isPrivateIP(ip) {
  if (!ip) return true;
  if (ip === "::1" || ip === "localhost") return true;
  if (ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
}
