import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "aejaca-cart-v1";

const CartContext = createContext();

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCart(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const addItem = useCallback((item) => {
    setItems(prev => {
      const next = [...prev, { ...item, cartItemId: `ci_${Date.now()}_${Math.random().toString(36).slice(2)}` }];
      saveCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((cartItemId) => {
    setItems(prev => {
      const next = prev.filter(i => i.cartItemId !== cartItemId);
      saveCart(next);
      return next;
    });
  }, []);

  const updateQty = useCallback((cartItemId, qty) => {
    setItems(prev => {
      const next = prev.map(i => i.cartItemId === cartItemId ? { ...i, qty: Math.max(1, qty) } : i);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const totalItems = items.reduce((s, i) => s + (i.qty || 1), 0);
  const totalNetto = items.reduce((s, i) => s + (i.unitPriceNetto || 0) * (i.qty || 1), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, totalNetto }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
