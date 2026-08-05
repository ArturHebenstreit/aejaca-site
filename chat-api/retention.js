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
// Zamowien tym zadaniem NIE KASUJEMY, i to jest rozroznienie, na ktorym cala
// rzecz stoi. Dokument sprzedazy ma przetrwac (kwoty, daty, numer), bo wymaga
// tego prawo podatkowe. Dane OSOBY przy nim maja zniknac po uplywie terminu,
// bo ich dluzsze trzymanie nie ma juz podstawy. Dlatego zamowienie po terminie
// jest anonimizowane, a nie usuwane.
//
// Kasowanie pojedynczego zamowienia jest osobna czynnoscia, reczna, z panelu,
// i ma wlasne zabezpieczenia (orderCleanup.js).

/** Terminy w dniach, jeden do jednego z sekcja 3 polityki prywatnosci. */
export const RETENTION_DAYS = {
  /** Rozmowy z asystentem: 12 miesiecy. */
  conversations: 365,
  /** Zapytania i wyceny bez zamowienia: 24 miesiace od ostatniego kontaktu. */
  leads: 730,
  /** Zdarzenia statystyczne: 24 miesiace. */
  events: 730,
  /**
   * Zapytania o wycene reczna, z ktorych nie powstalo zamowienie: 24 miesiace,
   * czyli ten sam termin co dla `leads`, bo to ta sama sprawa widziana z dwoch
   * stron. Wycena przekuta w zamowienie NIE jest kasowana: zyje razem z nim.
   */
  quotes: 730,
  /**
   * Wyceny zapisane przez klienta z kalkulatora: 90 dni.
   *
   * Krocej niz reszta, i celowo. Taka wycena jest wazna 14 dni, a klient
   * potrafi zapisac ja dziesiec razy przy przesuwaniu suwaka. Trzymanie
   * adresu e-mail przez dwa lata przy czyms, co po dwoch tygodniach nie
   * obowiazuje, byloby zbieraniem danych bez celu. Trzy miesiace zostawiaja
   * zapas na powrot po terminie, a potem nie ma po co.
   */
  savedQuotes: 90,
  /** Pliki wgrane do wyceny, z ktorych nie powstalo zamowienie: 30 dni. */
  uploads: 30,
  /**
   * Dane osobowe przy zamowieniu: 6 lat, czyli do uplywu terminu przedawnienia
   * roszczen. Dluzszy z dwoch terminow z polityki (5 lat podatkowe, 6 lat
   * przedawnienie), bo krotszy nie zwalnia z dluzszego.
   *
   * UWAGA: zamowienia NIE kasujemy. Wiersz zostaje jako dokument sprzedazy
   * (kwoty, daty, numer), a znikaja z niego dane osoby. Skasowanie calego
   * wiersza zabraloby dowod na to, ile i kiedy sprzedano, czego wymaga prawo
   * podatkowe, a anonimizacja godzi jedno z drugim.
   */
  orderPersonalData: 2190,
  /**
   * Surowy komunikat od bramki platniczej: 12 miesiecy. Sluzy do wyjasnienia
   * spornej platnosci, a nie do archiwum. Wiersz zostaje razem ze statusem
   * i kwota, znika sam zaladunek.
   */
  paymentPayloads: 365,
};

/** Adres wstawiany w miejsce prawdziwego. `.invalid` jest zarezerwowane i nigdzie nie prowadzi. */
export const ANONYMISED_EMAIL = "dane-usuniete@aejaca.invalid";

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

  // Anonimizacja, nie kasowanie: wiersz zamowienia zostaje jako dokument
  // sprzedazy, wychodza z niego dane osoby. Warunek na adres zastepczy sprawia,
  // ze przebieg jest powtarzalny i nie liczy w kolko tych samych wierszy.
  await sweep(
    "orderPersonalData",
    `UPDATE orders
        SET customer_email = $2,
            customer_name = NULL,
            customer_phone = NULL,
            address_line1 = NULL,
            address_line2 = NULL,
            postal_code = NULL,
            city = NULL,
            ip_hash = NULL
      WHERE COALESCE(paid_at, created_at) < ${now} - ($1 || ' days')::INTERVAL
        AND customer_email <> $2`,
    [String(days.orderPersonalData), ANONYMISED_EMAIL]
  );

  // Wycena, z ktorej powstalo zamowienie, zostaje: to juz nie jest zapytanie,
  // tylko czesc dokumentacji transakcji, ktora ma wlasny, dluzszy termin.
  // Pozycje znikaja same przez ON DELETE CASCADE.
  await sweep(
    "savedQuotes",
    `DELETE FROM quotes
      WHERE source = 'saved'
        AND converted_order_id IS NULL
        AND created_at < ${now} - ($1 || ' days')::INTERVAL`,
    [String(days.savedQuotes)]
  );

  await sweep(
    "quotes",
    `DELETE FROM quotes
      WHERE COALESCE(source, '') <> 'saved'
        AND converted_order_id IS NULL
        AND created_at < ${now} - ($1 || ' days')::INTERVAL`,
    [String(days.quotes)]
  );

  await sweep(
    "paymentPayloads",
    `UPDATE payment_notifications SET raw_xml = NULL
      WHERE received_at < ${now} - ($1 || ' days')::INTERVAL AND raw_xml IS NOT NULL`,
    [String(days.paymentPayloads)]
  );

  const total = Object.values(removed).reduce((s, n) => s + (n || 0), 0);
  if (total > 0) {
    console.log(`[retencja] usunieto ${total}: ${JSON.stringify(removed)}`);
  }
  return removed;
}
