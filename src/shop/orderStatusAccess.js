export function orderTokenStorageKey(orderRef) {
  return orderRef ? `aejaca:order-token:${orderRef}` : null;
}

export function sessionStorageFor(browser) {
  try {
    return browser?.sessionStorage || null;
  } catch {
    return null;
  }
}

export function resolveOrderAccessToken({ orderRef, urlToken, storage }) {
  const key = orderTokenStorageKey(orderRef);
  if (!key) return null;

  if (urlToken) {
    try {
      storage?.setItem(key, urlToken);
    } catch {
      // Prywatny tryb lub polityka przegladarki moze blokowac storage.
    }
    return urlToken;
  }

  try {
    return storage?.getItem(key) || null;
  } catch {
    return null;
  }
}

export function forgetOrderAccessToken({ orderRef, storage }) {
  const key = orderTokenStorageKey(orderRef);
  if (!key) return;
  try {
    storage?.removeItem(key);
  } catch {
    // Brak storage nie moze zastapic odpowiedzi API wlasnym bledem.
  }
}

export function orderStatusLocationWithoutToken(href) {
  const clean = new URL(href);
  clean.searchParams.delete("token");
  return `${clean.pathname}${clean.search}${clean.hash}`;
}
