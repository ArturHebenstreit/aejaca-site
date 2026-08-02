// ============================================================
// DOSTEPNOSC NA ZYWO
// ============================================================
// Strony sklepu sa budowane statycznie, wiec stan magazynowy zapisany w HTML
// pochodzi z chwili wdrozenia. Sprzedana sztuka zachecalaby do zakupu az do
// nastepnego wdrozenia, a klient dowiadywalby sie o braku dopiero przy
// probie zaplaty.
//
// Jedno zapytanie na wejscie do sklepu wystarcza: pobieramy caly katalog,
// bo pozycji jest kilkanascie, a nie kilka tysiecy. Do czasu odpowiedzi
// pokazujemy stan z budowania, wiec strona nigdy nie miga pustka.
//
// `available` to stan pomniejszony o aktywne rezerwacje, czyli to, co naprawde
// mozna wlozyc do koszyka.

import { useEffect, useState } from "react";

const API = import.meta.env.VITE_CHAT_API_URL;

/** Mapa slug -> liczba dostepnych sztuk. `null` znaczy bez limitu (plik). */
export function useAvailability() {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!API) return;
    let alive = true;
    fetch(`${API}/api/products`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!alive) return;
        const next = {};
        for (const p of d.products || []) next[p.slug] = p.available;
        setMap(next);
      })
      // Cisza jest tu celowa: bez odpowiedzi zostaje stan z budowania, co jest
      // gorsze od aktualnego, ale lepsze od bledu na karcie produktu.
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return map;
}

/**
 * Stan do pokazania: liczba z bazy, jesli zdazyla przyjsc, inaczej ta
 * z budowania. Produkt zdjety ze sprzedazy znika z listy w API, wiec brak
 * wpisu przy wczytanej mapie oznacza zero sztuk.
 */
export function stockOf(product, map) {
  if (product.stock === null || product.stock === undefined) return null;
  if (!map) return product.stock;
  return map[product.slug] ?? 0;
}
