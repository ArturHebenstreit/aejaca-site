// ============================================================
// KOSZYK
// ============================================================
// Koszyk trzyma WYLACZNIE to, co opisuje zamowienie: co, ile, z jakimi
// parametrami. Kwoty przechowujemy tylko po to, zeby pokazac je klientowi
// miedzy wizytami. Przy skladaniu zamowienia backend liczy cene od nowa,
// wiec podmiana kwoty w localStorage niczego nie daje.
//
// Plik klienta nie miesci sie w localStorage (dziesiatki megabajtow),
// dlatego trzymamy tylko jego geometrie policzona przez serwer oraz nazwe.
// Sam plik dosylamy przy skladaniu zamowienia. Do czasu przeniesienia
// plikow do R2 pozycja z plikiem zyje tylko w biezacej sesji przegladarki.

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { trackCart } from "../utils/analytics.js";

const STORAGE_KEY = "aejaca_cart_v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // wycena jest wazna 7 dni, koszyk tak samo

const CartContext = createContext(null);

function load() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) return [];
    if (Date.now() - (parsed.savedAt || 0) > TTL_MS) return [];
    return parsed.items;
  } catch {
    return [];
  }
}

function save(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, savedAt: Date.now(), items })
    );
  } catch {
    // Prywatny tryb przegladarki potrafi zablokowac zapis. Koszyk dziala
    // wtedy w pamieci, co jest lepsze niz wywalenie sie strony.
  }
}

let seq = 0;
function nextId() {
  seq += 1;
  return `it_${Date.now().toString(36)}_${seq}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  // Czytamy dopiero po zamontowaniu, bo prerender nie ma localStorage,
  // a rozjazd miedzy HTML-em z serwera a pierwszym renderem daje ostrzezenie.
  useEffect(() => {
    setItems(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(items);
  }, [items, ready]);

  // Dodanie i usuniecie liczymy TUTAJ, a nie na kazdym przycisku w serwisie.
  // Do koszyka wklada sie z karty produktu, z uslugi, z kalkulatora i z kreatora
  // pierscionka, wiec licznik postawiony przy przyciskach mialby cztery kopie
  // i rozjechalby sie przy piatym miejscu.
  const add = useCallback((item) => {
    const withId = { ...item, id: nextId(), addedAt: Date.now() };
    setItems((prev) => [...prev, withId]);
    trackCart("add_to_cart", item.title || item.slug || item.kind || "?",
      (item.unitGrosze || 0) * (item.qty || 1));
    return withId.id;
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => {
      const poz = prev.find((i) => i.id === id);
      if (poz) trackCart("remove_from_cart", poz.title || poz.slug || poz.kind || "?",
        (poz.unitGrosze || 0) * (poz.qty || 1));
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const setQty = useCallback((id, qty) => {
    const n = Math.max(1, Math.min(999, Math.round(Number(qty) || 1)));
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: n } : i)));
  }, []);

  const update = useCallback((id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + (i.qty || 1), 0);
    const subtotalGrosze = items.reduce(
      (sum, i) => sum + (i.unitGrosze || 0) * (i.qty || 1) + (i.packagingGrosze || 0) * (i.qty || 1),
      0
    );
    // Pozycje z plikiem klienta gina po odswiezeniu, dopoki pliki nie trafia
    // do R2. Strona koszyka musi o tym uprzedzic, zamiast udawac, ze wszystko gra.
    const hasVolatile = items.some((i) => i.needsFile && !i.fileRetained);
    return {
      items, count, subtotalGrosze, ready, hasVolatile,
      add, remove, setQty, update, clear,
    };
  }, [items, ready, add, remove, setQty, update, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // Poza providerem oddajemy pusty koszyk zamiast rzucac wyjatkiem,
    // zeby prerender pojedynczej strony nie wywracal calego builda.
    return {
      items: [], count: 0, subtotalGrosze: 0, ready: false, hasVolatile: false,
      add: () => null, remove: () => {}, setQty: () => {}, update: () => {}, clear: () => {},
    };
  }
  return ctx;
}
