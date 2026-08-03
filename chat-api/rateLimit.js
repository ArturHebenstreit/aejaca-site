// ============================================================
// LIMITY ZAPYTAN
// ============================================================
// Jeden licznik zamiast szesciu kopii tego samego kodu. Okno stale: pierwsze
// zapytanie otwiera okno, kolejne dokladaja sie do licznika, po wyczerpaniu
// puli odmawiamy do konca okna. Prosto i wystarczajaco, bo chodzi o odsianie
// skryptu, a nie o rownomierne dawkowanie ruchu.
//
// Klucz to zwykle adres klienta (patrz clientIp.js), ale bywa nim adres e-mail,
// bo niektore naduzycia nie chodza z jednego adresu sieciowego.
//
// Licznik zyje w pamieci procesu. Przy jednej instancji uslugi to dokladnie
// tyle, ile trzeba. Gdyby kiedys stanely dwie, limity zaczna byc dwa razy
// luzniejsze i wtedy trzeba je przeniesc do bazy albo do Redisa.

/**
 * @param {object} opts
 * @param {number} opts.limit    ile zapytan w oknie
 * @param {number} opts.windowMs dlugosc okna w milisekundach
 * @param {string} opts.name     do logu przy odmowie
 */
export function createLimiter({ limit, windowMs, name = "limit" }) {
  const hits = new Map();

  // Sprzatanie, zeby mapa nie rosla w nieskonczonosc od jednorazowych gosci.
  // `unref` sprawia, ze ten zegar nie trzyma procesu przy zyciu.
  const timer = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, entry] of hits) if (entry.start < cutoff) hits.delete(key);
  }, windowMs);
  timer.unref?.();

  return {
    name,
    limit,
    windowMs,
    /** true, gdy zapytanie miesci sie w limicie */
    check(key) {
      if (!key) return true; // bez klucza nie ma czego liczyc, nie karzemy
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || now - entry.start > windowMs) {
        hits.set(key, { start: now, count: 1 });
        return true;
      }
      if (entry.count >= limit) return false;
      entry.count++;
      return true;
    },
    /** Ile prob zostalo. Do naglowka Retry-After i do testow. */
    remaining(key) {
      const entry = hits.get(key);
      if (!entry || Date.now() - entry.start > windowMs) return limit;
      return Math.max(0, limit - entry.count);
    },
    /** Sekundy do konca okna, do naglowka Retry-After */
    retryAfter(key) {
      const entry = hits.get(key);
      if (!entry) return 0;
      return Math.max(0, Math.ceil((entry.start + windowMs - Date.now()) / 1000));
    },
    /** Doliczenie proby bez pytania o zgode. Do karania za nietrafienia. */
    penalize(key) {
      if (!key) return;
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || now - entry.start > windowMs) hits.set(key, { start: now, count: 1 });
      else entry.count++;
    },
    reset(key) {
      if (key === undefined) hits.clear();
      else hits.delete(key);
    },
    size() {
      return hits.size;
    },
  };
}

/**
 * Warstwa posrednia dla trasy. `keyOf` mowi, po czym liczymy.
 * Odpowiedz 429 zawsze niesie Retry-After, zeby uczciwy klient wiedzial,
 * kiedy wrocic, zamiast probowac w kolko.
 */
export function limitBy(limiter, keyOf, { error = "Za duzo zapytan, sprobuj za chwile", code = "rate_limited" } = {}) {
  return (req, res, next) => {
    const key = keyOf(req);
    if (limiter.check(key)) return next();
    res.set("Retry-After", String(limiter.retryAfter(key)));
    res.status(429).json({ error, code, retryAfterSeconds: limiter.retryAfter(key) });
  };
}
