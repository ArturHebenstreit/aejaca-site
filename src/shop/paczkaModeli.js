// ============================================================
// PACZKA MODELI: KILKA PLIKOW, KILKA POZYCJI, JEDNE USTAWIENIA
// ============================================================
// Do 2026-09-06 jedno wgranie znaczylo jeden model i jedna pozycje w koszyku.
// Klient z dziesiecioma czesciami do wydrukowania musial przejsc kalkulator
// dziesiec razy, za kazdym razem ustawiajac ten sam material, to samo
// wypelnienie i to samo wykonczenie. Wiekszosc takich zlecen konczyla sie
// mailem "czy moge przeslac paczke plikow", czyli poza sklepem.
//
// KAZDY MODEL ZOSTAJE OSOBNA POZYCJA (decyzja wlasciciela, 2026-09-06). To nie
// jest wybor estetyczny, tylko warunek tego, zeby reszta serwisu nie musiala
// sie zmienic: kwota wiazaca powstaje ze ZMIERZONEJ bryly, a bryla nalezy do
// pliku. Pozycja z dziesiecioma plikami i jedna cena musialaby miec dziesiec
// geometrii naraz, a wtedy zmiana modelu danych siegnelaby kasy, panelu,
// kolejki produkcji i maili. Osobna pozycja na model kosztuje dluzszy koszyk
// i nic wiecej: kazda ma wlasna liczbe sztuk, wlasny prog nakladu i wlasny
// termin.
//
// USTAWIENIA SA WSPOLNE DLA PACZKI, bo tak wyglada typowe zlecenie: dziesiec
// czesci tego samego wyrobu, z tego samego materialu. Zmiana pojedynczego
// modelu jest mozliwa pozniej, na jego pozycji w koszyku.
//
// LIMIT DOTYCZY JEDNEGO WGRANIA, a nie calego zamowienia. Przegladarka liczy
// geometrie kazdej bryly u siebie i przy dwudziestu plikach naraz karta
// przestaje odpowiadac. Klient z dwudziestoma modelami wgrywa dwie paczki do
// TEGO SAMEGO koszyka, zamiast skladac dwa zamowienia i placic dwa razy za
// wysylke.

/**
 * Formaty modelu, ktore przyjmuje wycena.
 *
 * Lista stala dotad w DWOCH kopiach (`Print3DCalc`, `MetalCastCalc`), a od
 * dolozenia paczki bylaby w trzech. Kopia rozjezdza sie przy dolozeniu formatu
 * i objawem jest pole wyboru pliku, ktore nie widzi tego, co serwer przyjmuje.
 */
export const FORMATY_MODELU = ".stl,.obj,.3mf,.step,.stp";

/** Ile modeli przyjmujemy w jednym wgraniu. */
export const LIMIT_PACZKI = 10;

/**
 * Podzial wybranych plikow na te, ktore wchodza, i te, ktore sie nie miescily.
 *
 * ODRZUCONE WRACAJA Z NAZWAMI, a nie jako sama liczba. Klient wybral dwanascie
 * plikow z katalogu i po dwoch minutach nie pamieta, ktore to byly; lista nazw
 * pozwala mu dobrac reszte bez zgadywania.
 */
export function podzielPaczke(pliki, juzWPaczce = 0) {
  const lista = Array.from(pliki || []);
  const wolne = Math.max(0, LIMIT_PACZKI - juzWPaczce);
  return {
    przyjete: lista.slice(0, wolne),
    odrzucone: lista.slice(wolne).map((f) => f.name),
  };
}

/** Zdanie o plikach, ktore sie nie zmiescily. `null`, gdy weszly wszystkie. */
export function komunikatPaczki(odrzucone, lang = "pl") {
  if (!odrzucone?.length) return null;
  const nazwy = odrzucone.join(", ");
  if (lang === "en") {
    return `Ten models per upload. These did not fit: ${nazwy}. Add them as a second batch to the same basket.`;
  }
  if (lang === "de") {
    return `Zehn Modelle pro Upload. Diese haben nicht mehr gepasst: ${nazwy}. Laden Sie sie als zweites Paket in denselben Warenkorb.`;
  }
  return `Dziesięć modeli na jedno wgranie. Te się nie zmieściły: ${nazwy}. Wgraj je drugą paczką do tego samego koszyka.`;
}

/**
 * Wyslanie modelu na serwer. Oddaje token albo powod odmowy.
 *
 * MILCZACE ODRZUCENIE JEST GORSZE OD BLEDU: bez tokenu cena liczy sie
 * z wybranego rozmiaru, a nie z modelu, wiec po cichu przestaje dotyczyc tego,
 * co klient wgral, a on nie ma jak tego zauwazyc.
 */
export async function wgrajModel({ api, file, lang = "pl" }) {
  if (!api || !file) return { token: null, error: "no_api" };
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("lang", lang);
    const r = await fetch(`${api}/api/uploads`, { method: "POST", body: fd });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data?.uploadToken) return { token: data.uploadToken, error: null };
    return { token: null, error: data?.error || "rejected" };
  } catch {
    return { token: null, error: "network" };
  }
}

/**
 * Wycena jednego modelu tymi samymi ustawieniami, co reszta paczki.
 *
 * Idzie przez `/api/price`, czyli przez ten sam kod, ktory wycenia model
 * glowny i ktory wystawia kwote w koszyku. Osobna formula dla modeli
 * dodatkowych rozjechalaby sie z rdzeniem przy pierwszej zmianie stawki.
 */
export async function wycenModel({ api, calculator, lang = "pl", paramsKey, uploadToken, scale }) {
  if (!api || !calculator || !uploadToken) return { ok: false, error: "no_token" };
  try {
    const body = new FormData();
    body.append("calculator", calculator);
    body.append("lang", lang);
    body.append("params", paramsKey);
    body.append("uploadToken", uploadToken);
    if (scale && scale !== 1) body.append("scale", JSON.stringify(scale));
    const resp = await fetch(`${api}/api/price`, { method: "POST", body });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return {
        ok: false,
        error: data?.code || "no_price",
        // Serwer pisze pelnym zdaniem, PO CO ta konfiguracja idzie do
        // czlowieka. Bez tego kazda odmowa wygladala tak samo.
        wiadomosc: typeof data?.error === "string" && data.error.trim() ? data.error.trim() : null,
      };
    }
    return { ok: true, item: data.item, binding: data.binding !== false, missing: data.missing || [] };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** Tozsamosc pliku na liscie. Licznik rozroznia dwa pliki o tej samej nazwie. */
export function idModelu(file, i) {
  return `${file.name}|${file.size}|${Date.now()}|${i}`;
}
