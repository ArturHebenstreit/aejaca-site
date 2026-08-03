// ============================================================
// OKRESY PRZECHOWYWANIA DANYCH
// ============================================================
// Polityka prywatnosci podaje konkretne terminy. Termin, ktorego nikt nie
// egzekwuje, jest obietnica bez pokrycia, a przy kontroli gorsza niz brak
// terminu, bo dowodzi, ze wiedzielismy i nie zrobilismy.
//
// Dlatego kazdy okres z polityki ma tu swoja regule, a nazwy sa te same,
// zeby dalo sie je zestawic wzrokiem. Zmiana terminu w polityce bez zmiany
// tutaj (albo odwrotnie) to blad, nie drobiazg.
//
// Zamowien i dokumentacji sprzedazy NIE kasujemy tym zadaniem: trzyma je
// obowiazek podatkowy i termin przedawnienia roszczen, liczone w latach.
// Kasowanie pojedynczego zamowienia jest czynnoscia recznta, z panelu,
// i ma wlasne zabezpieczenia (orderCleanup.js).

/** Terminy w dniach, jeden do jednego z sekcja 3 polityki prywatnosci. */
export const RETENTION_DAYS = {
  /** Rozmowy z asystentem: 12 miesiecy. */
  conversations: 365,
  /** Zapytania i wyceny bez zamowienia: 24 miesiace od ostatniego kontaktu. */
  leads: 730,
  /** Zdarzenia statystyczne: 24 miesiace. */
  events: 730,
  /** Pliki wgrane do wyceny, z ktorych nie powstalo zamowienie: 30 dni. */
  uploads: 30,
};

/**
 * Jeden przebieg sprzatania. Zwraca liczbe usunietych wierszy w rozbiciu na
 * kategorie, zeby dalo sie to zobaczyc w logu, a nie zgadywac.
 *
 * Kazde zapytanie jest odporne na brak tabeli albo kolumny: usluga ma dzialac
 * takze na bazie, w ktorej czegos jeszcze nie ma, a nie przewracac sie o to
 * raz na dobe.
 */
export async function runRetention(pool, { days = RETENTION_DAYS, now = "NOW()" } = {}) {
  if (!pool) return {};
  const removed = {};

  const sweep = async (name, sql, params) => {
    try {
      const { rowCount } = await pool.query(sql, params);
      removed[name] = rowCount;
    } catch (e) {
      console.error(`[retencja] ${name}: ${e.message}`);
      removed[name] = null;
    }
  };

  await sweep(
    "conversations",
    `DELETE FROM conversations WHERE created_at < ${now} - ($1 || ' days')::INTERVAL`,
    [String(days.conversations)]
  );

  // Lead zwiazany z zamowieniem zostaje razem z nim: to juz nie jest zapytanie,
  // tylko slad po transakcji, ktora ma wlasny, dluzszy termin.
  await sweep(
    "leads",
    `DELETE FROM leads
      WHERE created_at < ${now} - ($1 || ' days')::INTERVAL
        AND (contacted_at IS NULL OR contacted_at < ${now} - ($1 || ' days')::INTERVAL)
        AND quote_ref IS NULL`,
    [String(days.leads)]
  );

  await sweep(
    "events",
    `DELETE FROM events WHERE ts < ${now} - ($1 || ' days')::INTERVAL`,
    [String(days.events)]
  );

  // Plik przypisany do zamowienia zyje razem z zamowieniem, wiec kasujemy
  // wylacznie te, z ktorych nic nie powstalo. Miniatura idzie razem z wierszem.
  await sweep(
    "uploads",
    `DELETE FROM uploads
      WHERE order_id IS NULL
        AND created_at < ${now} - ($1 || ' days')::INTERVAL`,
    [String(days.uploads)]
  );

  const total = Object.values(removed).reduce((s, n) => s + (n || 0), 0);
  if (total > 0) {
    console.log(`[retencja] usunieto ${total}: ${JSON.stringify(removed)}`);
  }
  return removed;
}
