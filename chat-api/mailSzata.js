// ============================================================
// WSPOLNA SZATA MAILI DO KLIENTA
// ============================================================
// Maile wychodzily w trzech roznych wygladach: potwierdzenie zamowienia mialo
// biala karte i zloty naglowek, powiadomienie o etapie swoj wlasny uklad,
// a wycena szla golym HTML-em bez zadnego stylu. Klient dostaje je jeden po
// drugim od tej samej firmy i widzi trzy rozne firmy.
//
// Tu stoi jedna koperta: znak firmowy na gorze, tresc w srodku, blok "gdzie
// poczytac wiecej" i ZAWSZE ta sama stopka z pelnym podpisem. Kazdy mail
// wklada w nia swoja tresc i swoj zestaw odnosnikow, a nie sklada wygladu
// od nowa.
//
// Podpis jest jeden i nie wolno go pisac w mailu na piechote: nazwa firmy,
// adres, telefon i strona zmieniaja sie w jednym miejscu, a rozjazd miedzy
// mailami widzi klient, nie my.

import { SELLER } from "./pricing/sellerInfo.js";

export const SITE = (process.env.SITE_URL || "https://www.aejaca.com").replace(/\/$/, "");

/**
 * Znak firmowy w wersji do maili: zloty krazek ze splotem wycietym na bialo,
 * robiony przez `npm run img:mail`. Znak z serwisu to cienki kontur rysowany
 * na ciemnym tle filtrem CSS, ktorego w mailu nie ma: przy 36 px zostawala
 * po nim szara plamka albo nic.
 *
 * PNG, a nie WEBP z serwisu: starsze klienty pocztowe WEBP-a nie rysuja
 * i zostaje pusta ramka.
 *
 * `alt` jest PUSTE, bo nazwa firmy stoi obok w tekscie, w naglowku i w
 * podpisie. Klienty pocztowe blokuja obrazy z sieci i wtedy opis wchodzi
 * w ciasna komorke tabeli, ucinajac sie w polowie slowa. Ozdoba, ktora nie
 * niesie tresci, ma zniknac po cichu, a nie zostawic smiec.
 */
const LOGO = `${SITE}/logo-mail.png`;

export function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/**
 * Data dla czlowieka, w postaci 31.08.2026.
 *
 * Sterownik bazy oddaje kolumne DATE jako obiekt `Date`, a nie jako napis.
 * Wczesniejsze `String(data).slice(0, 10)` dawalo na nim "Mon Aug 31", czyli
 * angielska date w polskim mailu, i klient dostal ja naprawde.
 */
export function dzien(wartosc) {
  if (!wartosc) return "";
  if (wartosc instanceof Date) {
    const d = String(wartosc.getDate()).padStart(2, "0");
    const m = String(wartosc.getMonth() + 1).padStart(2, "0");
    return `${d}.${m}.${wartosc.getFullYear()}`;
  }
  const t = String(wartosc).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t.split("-").reverse().join(".") : t;
}

/**
 * Liczba dni z poprawna odmiana. "1 dni" w potwierdzeniu zamowienia wyglada
 * jak usterka, bo nia jest.
 */
export function dni(n, lang) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  if (lang === "en") return `${x} ${x === 1 ? "day" : "days"}`;
  if (lang === "de") return `${x} ${x === 1 ? "Tag" : "Tage"}`;
  // Polski ma tu tylko dwie formy: "1 dzien" i "N dni" dla kazdego innego N.
  return x === 1 ? "1 dzień" : `${x} dni`;
}

const PODPIS = {
  pl: { bye: "Pozdrawiamy serdecznie,", team: "Zespół AEJaCA", tel: "tel/WhatsApp" },
  en: { bye: "Kind regards,", team: "The AEJaCA Team", tel: "phone/WhatsApp" },
  de: { bye: "Mit freundlichen Grüßen,", team: "Ihr AEJaCA-Team", tel: "Tel./WhatsApp" },
};

const PELNA_NAZWA = "AEJaCA - Artisan Elegance Jewelry and Crafted Art";
const ADRES_STRONY = "www.AEJaCA.com";

/** Podpis w HTML, ten sam pod kazdym mailem. */
export function stopkaHtml(lang) {
  const p = PODPIS[lang] || PODPIS.pl;
  return `
    <table role="presentation" style="width:100%;border-collapse:collapse;border-top:1px solid #eee;margin-top:28px">
      <tr>
        <td style="padding:20px 12px 0 0;vertical-align:top;width:56px">
          <img src="${LOGO}" width="48" height="48" alt=""
               style="display:block;width:48px;height:48px;border:0" />
        </td>
        <td style="padding:20px 0 0;vertical-align:top;font-size:13px;line-height:1.65;color:#555">
          <div style="color:#333">${esc(p.bye)}</div>
          <div style="font-weight:700;color:#111;margin-top:6px">${esc(p.team)}</div>
          <div style="color:#777">${esc(PELNA_NAZWA)}</div>
          <div style="margin-top:6px">
            <a href="mailto:${esc(SELLER.email)}" style="color:#b58a3c;text-decoration:none">${esc(SELLER.email)}</a><br />
            <a href="${SITE}/" style="color:#b58a3c;text-decoration:none">${esc(ADRES_STRONY)}</a><br />
            <span style="color:#777">${esc(p.tel)}</span>
            <a href="${esc(SELLER.phoneHref)}" style="color:#b58a3c;text-decoration:none">${esc(SELLER.phone)}</a>
          </div>
        </td>
      </tr>
    </table>`;
}

/** Ten sam podpis w wersji tekstowej. */
export function stopkaText(lang) {
  const p = PODPIS[lang] || PODPIS.pl;
  return [
    p.bye,
    "",
    p.team,
    PELNA_NAZWA,
    SELLER.email,
    ADRES_STRONY,
    `${p.tel} ${SELLER.phone}`,
  ].join("\n");
}

const WIECEJ = { pl: "Gdzie poczytać więcej", en: "Where to read more", de: "Wo Sie mehr erfahren" };

/**
 * Blok odnosnikow "co warto wiedziec przy tym mailu".
 *
 * @param {string} lang jezyk maila
 * @param {Array<{href: string, label: string, opis?: string}>} pozycje
 */
export function odnosnikiHtml(lang, pozycje) {
  const lista = (pozycje || []).filter(Boolean);
  if (!lista.length) return "";
  return `
    <div style="margin-top:24px;background:#faf9f7;border:1px solid #efece6;border-radius:10px;padding:16px 18px">
      <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.6px;text-transform:uppercase;color:#8a7a5c">${esc(WIECEJ[lang] || WIECEJ.pl)}</p>
      ${lista.map((p) => `
        <p style="margin:0 0 10px;font-size:13px;line-height:1.6">
          <a href="${esc(p.href)}" style="color:#b58a3c;font-weight:700;text-decoration:none">${esc(p.label)}</a>
          ${p.opis ? `<br /><span style="color:#777">${esc(p.opis)}</span>` : ""}
        </p>`).join("")}
    </div>`;
}

/** Ten sam blok w wersji tekstowej. */
export function odnosnikiText(lang, pozycje) {
  const lista = (pozycje || []).filter(Boolean);
  if (!lista.length) return "";
  const linie = [`${WIECEJ[lang] || WIECEJ.pl}:`];
  for (const p of lista) {
    linie.push(`- ${p.label}: ${p.href}`);
    if (p.opis) linie.push(`  ${p.opis}`);
  }
  return linie.join("\n");
}

/**
 * Cala koperta: znak firmowy, tresc, odnosniki, podpis.
 *
 * @param {{lang: string, srodek: string, odnosniki?: Array}} arg
 *   `srodek` to gotowy HTML tresci maila, bez naglowka i bez stopki.
 */
export function koperta({ lang, srodek, odnosniki = [] }) {
  return `<!doctype html><html lang="${esc(lang)}"><body style="margin:0;padding:24px;background:#f6f6f6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
    <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:22px">
      <tr>
        <td style="width:44px;padding-right:12px;vertical-align:middle">
          <img src="${LOGO}" width="36" height="36" alt=""
               style="display:block;width:36px;height:36px;border:0" />
        </td>
        <td style="vertical-align:middle;font-size:13px;letter-spacing:3px;color:#b58a3c;font-weight:700">AEJACA</td>
      </tr>
    </table>
${srodek}
${odnosnikiHtml(lang, odnosniki)}
${stopkaHtml(lang)}
  </div>
</body></html>`;
}
