// ============================================================
// ANALITYKA: PYTANIA, NA KTORE MA ODPOWIADAC KOKPIT
// ============================================================
// Poprzednia wersja ekranu pochodzila sprzed sklepu: liczyla odslony, kraje
// i wybory w kalkulatorze, a jej "lejek" szukal sciezek /jewelry/ i /studio/,
// ktore od czasu prefiksow jezykowych i sklepu nie sa juz miejscem, gdzie
// cokolwiek sie dzieje. Pokazywala też wylacznie LICZBY, bez porownania,
// wiec nie dalo sie z niej wyczytac ani jednego trendu.
//
// Ten modul odpowiada na piec pytan, w tej kolejnosci:
//
//   1. Czy jest lepiej niz bylo (kazda liczba obok tej samej liczby sprzed
//      okresu, bo bez porownania liczba nie znaczy nic).
//   2. Skad przychodza (kanal ruchu, a pod nim konkretne zrodlo).
//   3. Na co wchodza i co ich zatrzymuje (strona wejscia, tresc, czas).
//   4. Gdzie sie zatrzymuja po drodze do zamowienia (lejek sklepu i wycen).
//   5. Co z tego przynosi pieniadze (kanal, strona wejscia i kraj obok
//      przychodu, a nie obok samych odwiedzin).
//
// KAZDA liczba w kokpicie ma dac sie rozlozyc na wiersze, ktore ja tworza.
// Dlatego obok kazdego zestawienia stoi ten sam filtr sesji: `sesje()` przyjmuje
// wymiar (kanal, wejscie, kraj, urzadzenie, jezyk) i oddaje pojedyncze wizyty,
// a `sciezkaSesji()` oddaje jej zdarzenia po kolei. Wykres bez mozliwosci
// zajrzenia pod spod jest zgadywaniem.

/** Sesja liczona jako "z interakcja": cos wiecej niz obejrzenie strony. */
const INTERAKCJA = `category NOT IN ('page', 'scroll')`;

/** Odslona, czyli wejscie na adres. Zdarzenie `engaged` to czas, nie odslona. */
const ODSLONA = `category = 'page' AND action = 'view'`;

/**
 * Ruch wlasciciela. Oznacza go on sam, wejsciem na adres z `?nolicz=1`, bo
 * adresu IP nie da sie tu uzyc: trzy urzadzenia, trzy sieci i adres zmienny.
 *
 * Zdarzenia zapisujemy mimo oznaczenia i ODSIEWAMY DOPIERO TUTAJ. Wyrzucanie
 * ich przy zapisie byloby prostsze i gorsze: pusta tabela wyglada dokladnie
 * tak samo, gdy znacznik dziala, i gdy licznik jest zepsuty.
 */
function bezWlasnych(zWlasnymi) {
  return zWlasnymi ? "" : "AND NOT COALESCE(internal, FALSE)";
}

/**
 * Okres i okres poprzedni tej samej dlugosci.
 *
 * Porownanie z poprzednim okresem jest jedynym sposobem, zeby liczba cokolwiek
 * znaczyla: "82 odwiedzajacych" nie mowi nic, "82, czyli o 40 procent mniej niz
 * w poprzednim miesiacu" mowi wszystko.
 */
export function okresy(dni) {
  const d = Math.max(1, Math.min(365, Number(dni) || 30));
  const teraz = new Date();
  const od = new Date(teraz.getTime() - d * 86400_000);
  const poprzedniOd = new Date(teraz.getTime() - 2 * d * 86400_000);
  return { dni: d, od, do: teraz, poprzedniOd, poprzedniDo: od };
}

/**
 * Wspolna podstawa: jedna sesja w jednym wierszu, razem z tym, co z niej
 * wynikло biznesowo. Zapytania i zamowienia dolaczamy po `session_id`, ktore
 * serwis dopisuje od 2026-08-31.
 */
function sesjeCTE(alias = "s", zWlasnymi = false) {
  return `
    zdarzenia AS (
      SELECT * FROM events WHERE ts >= $1 AND ts < $2 ${bezWlasnych(zWlasnymi)}
    ),
    ${alias} AS (
      SELECT session,
             MIN(ts)  AS start,
             MAX(ts)  AS koniec,
             COUNT(*) FILTER (WHERE ${ODSLONA})        AS odslony,
             COUNT(*) FILTER (WHERE ${INTERAKCJA})     AS interakcje,
             COALESCE(MAX(channel), 'wprost')          AS kanal,
             COALESCE(MAX(source), '(wprost)')         AS zrodlo,
             MAX(utm_campaign)                         AS kampania,
             MAX(country)                              AS kraj,
             MAX(device)                               AS urzadzenie,
             COALESCE(MAX(lang), 'pl')                 AS jezyk,
             COALESCE(SUM(value) FILTER (WHERE category = 'page' AND action = 'engaged'), 0) AS sekundy
        FROM zdarzenia
       GROUP BY session
    ),
    wejscia AS (
      SELECT DISTINCT ON (session) session, path AS wejscie
        FROM zdarzenia WHERE ${ODSLONA}
       ORDER BY session, ts
    ),
    zapytania AS (
      SELECT session_id, COUNT(*) AS ile
        FROM leads WHERE session_id IS NOT NULL AND created_at >= $1 AND created_at < $2
       GROUP BY session_id
    ),
    zamowienia AS (
      SELECT session_id,
             COUNT(*)                                          AS ile,
             COUNT(*) FILTER (WHERE paid_at IS NOT NULL)        AS oplacone,
             -- Przychod liczymy z kwoty zamowienia, bo tabela nie ma osobnej
             -- kolumny wplaty: pieniadze potwierdza data zaplaty, nie druga suma.
             COALESCE(SUM(total_grosze) FILTER (WHERE paid_at IS NOT NULL), 0) AS przychod
        FROM orders WHERE session_id IS NOT NULL AND created_at >= $1 AND created_at < $2
       GROUP BY session_id
    ),
    pelne AS (
      SELECT ${alias}.*, w.wejscie,
             COALESCE(q.ile, 0)        AS zapytania,
             COALESCE(o.ile, 0)        AS zamowienia,
             COALESCE(o.oplacone, 0)   AS oplacone,
             COALESCE(o.przychod, 0)   AS przychod
        FROM ${alias}
        LEFT JOIN wejscia    w ON w.session = ${alias}.session
        LEFT JOIN zapytania  q ON q.session_id = ${alias}.session
        LEFT JOIN zamowienia o ON o.session_id = ${alias}.session
    )`;
}

/** Zbiorcze liczby okresu. Wolane dwa razy: dla okresu i dla poprzedniego. */
export async function kpi(pool, od, doKiedy, { zWlasnymi = false } = {}) {
  const { rows } = await pool.query(
    `WITH ${sesjeCTE("s", zWlasnymi)}
     SELECT COUNT(*)                                        AS wizyty,
            COUNT(*) FILTER (WHERE interakcje > 0)          AS zaangazowane,
            -- ODBICIE to wyjscie bez zadnego sladu, a nie "nie kliknal w nic,
            -- co mierzymy". Czytanie przez kwadrans jednej strony poradnika NIE
            -- jest odbiciem, a przy poprzedniej definicji bylo, wiec wskaznik
            -- pokazywal 70 procent na serwisie, ktorego polowa to tresc do
            -- czytania. Prog: pietnascie sekund widocznosci.
            COUNT(*) FILTER (WHERE odslony <= 1 AND interakcje = 0 AND sekundy < 15) AS odbicia,
            COALESCE(SUM(odslony), 0)                       AS odslony,
            COALESCE(AVG(NULLIF(sekundy, 0)), 0)            AS sredni_czas,
            COALESCE(SUM(zapytania), 0)                     AS zapytania,
            COALESCE(SUM(oplacone), 0)                      AS zamowienia,
            COALESCE(SUM(przychod), 0)                      AS przychod
       FROM pelne`,
    [od, doKiedy]
  );
  return rows[0];
}

/** Dzien po dniu: wizyty, zapytania, zamowienia. Podstawa wykresu. */
export async function dzienne(pool, od, doKiedy, { zWlasnymi = false } = {}) {
  const { rows } = await pool.query(
    `WITH ${sesjeCTE("s", zWlasnymi)}
     SELECT DATE(start) AS dzien,
            COUNT(*)                          AS wizyty,
            COALESCE(SUM(zapytania), 0)       AS zapytania,
            COALESCE(SUM(oplacone), 0)        AS zamowienia,
            COALESCE(SUM(przychod), 0)        AS przychod
       FROM pelne GROUP BY DATE(start) ORDER BY dzien`,
    [od, doKiedy]
  );
  return rows;
}

/**
 * Zestawienie po dowolnym wymiarze sesji. Jedno zapytanie na piec ekranow,
 * bo wszystkie pytaja o to samo: ile wizyt, ile z nich cos zrobilo i ile
 * przyniosly pieniedzy, tylko pogrupowane inaczej.
 */
const WYMIARY = {
  kanal: "kanal",
  zrodlo: "zrodlo",
  kampania: "kampania",
  wejscie: "wejscie",
  kraj: "kraj",
  urzadzenie: "urzadzenie",
  jezyk: "jezyk",
};

export async function wedlug(pool, wymiar, od, doKiedy, limit = 12, { zWlasnymi = false } = {}) {
  const kolumna = WYMIARY[wymiar];
  if (!kolumna) throw new Error(`nieznany wymiar: ${wymiar}`);
  const { rows } = await pool.query(
    `WITH ${sesjeCTE("s", zWlasnymi)}
     SELECT COALESCE(${kolumna}, '(brak)') AS wartosc,
            COUNT(*)                                          AS wizyty,
            COUNT(*) FILTER (WHERE interakcje > 0)            AS zaangazowane,
            COUNT(*) FILTER (WHERE odslony <= 1 AND interakcje = 0) AS odbicia,
            COALESCE(SUM(zapytania), 0)                       AS zapytania,
            COALESCE(SUM(oplacone), 0)                        AS zamowienia,
            COALESCE(SUM(przychod), 0)                        AS przychod,
            COALESCE(AVG(NULLIF(sekundy, 0)), 0)              AS sredni_czas
       FROM pelne
      GROUP BY 1 ORDER BY wizyty DESC LIMIT ${Number(limit) || 12}`,
    [od, doKiedy]
  );
  return rows;
}

/**
 * Tresc: co ogladaja i jak dlugo. Czas bierzemy ze zdarzenia `engaged`, ktore
 * liczy TYLKO czas widocznej karty, wiec strona otwarta w tle nie udaje
 * najbardziej wciagajacej w serwisie.
 */
export async function tresc(pool, od, doKiedy, limit = 15, { zWlasnymi = false } = {}) {
  const { rows } = await pool.query(
    `SELECT path AS adres,
            COUNT(*) FILTER (WHERE ${ODSLONA})                 AS odslony,
            COUNT(DISTINCT session) FILTER (WHERE ${ODSLONA})  AS wizyty,
            COALESCE(AVG(value) FILTER (WHERE category = 'page' AND action = 'engaged'), 0) AS sredni_czas,
            COALESCE(AVG(value) FILTER (WHERE category = 'scroll'), 0) AS srednie_przewiniecie
       FROM events WHERE ts >= $1 AND ts < $2 ${bezWlasnych(zWlasnymi)}
      GROUP BY path HAVING COUNT(*) FILTER (WHERE ${ODSLONA}) > 0
      ORDER BY wizyty DESC LIMIT ${Number(limit) || 15}`,
    [od, doKiedy]
  );
  return rows;
}

/**
 * Lejek sklepu, krok po kroku, liczony w SESJACH (a nie w kliknięciach):
 * interesuje nas, ilu LUDZI doszlo do kolejnego kroku, a nie ile razy ktos
 * kliknąl w koszyk.
 */
export async function lejekSklepu(pool, od, doKiedy, { zWlasnymi = false } = {}) {
  const { rows } = await pool.query(
    `WITH z AS (SELECT * FROM events WHERE ts >= $1 AND ts < $2 ${bezWlasnych(zWlasnymi)})
     SELECT
       COUNT(DISTINCT session)                                                          AS wizyty,
       COUNT(DISTINCT session) FILTER (WHERE path LIKE '%/shop%')                       AS sklep,
       COUNT(DISTINCT session) FILTER (WHERE category = 'shop' AND action LIKE 'view_%') AS karta,
       COUNT(DISTINCT session) FILTER (WHERE category = 'shop' AND action = 'add_to_cart') AS koszyk,
       COUNT(DISTINCT session) FILTER (WHERE category = 'shop' AND action = 'begin_checkout') AS kasa,
       COUNT(DISTINCT session) FILTER (WHERE category = 'shop' AND action = 'place_order') AS zlozone,
       -- Po obu stronach WIZYTY, a nie raz wizyty i raz zamowienia. Wczesniej
       -- "zlozone" liczylo sesje, a "oplacone" wiersze w tabeli zamowien, wiec
       -- lejek porownywal dwie rozne jednostki i przy kazdym zamowieniu
       -- z oferty (te nie niosa identyfikatora wizyty) wychodzilo zero.
       (SELECT COUNT(DISTINCT session_id) FROM orders
         WHERE session_id IS NOT NULL AND paid_at IS NOT NULL
           AND created_at >= $1 AND created_at < $2)                                    AS oplacone,
       -- Zamowienie w euro czeka na przelew i na nasze reczne potwierdzenie,
       -- czasem dwa dni. Liczenie go jako "nieoplacone" robilo z normalnej
       -- kolejki alarm o zepsutej bramce platniczej.
       (SELECT COUNT(DISTINCT session_id) FROM orders
         WHERE session_id IS NOT NULL AND paid_at IS NULL
           AND status IN ('awaiting_transfer', 'payment_review')
           AND created_at >= $1 AND created_at < $2)                                    AS czekaja
     FROM z`,
    [od, doKiedy]
  );
  return rows[0];
}

/** Lejek wycen: od kalkulatora do zapytania i dalej do oferty i zaplaty. */
export async function lejekWycen(pool, od, doKiedy, { zWlasnymi = false } = {}) {
  const { rows } = await pool.query(
    `WITH z AS (SELECT * FROM events WHERE ts >= $1 AND ts < $2 ${bezWlasnych(zWlasnymi)})
     SELECT
       COUNT(DISTINCT session) FILTER (WHERE category = 'calc')                        AS kalkulator,
       COUNT(DISTINCT session) FILTER (WHERE category = 'funnel' AND action = 'open_inquiry_form') AS formularz,
       COUNT(DISTINCT session) FILTER (WHERE category = 'inquiry')                     AS zapytanie,
       (SELECT COUNT(*) FROM quotes WHERE created_at >= $1 AND created_at < $2)         AS wyceny,
       -- Zamowienie z wyceny poznajemy po quotes.converted_order_id: tabela
       -- zamowien nie wskazuje wyceny, bo droga jest odwrotna.
       (SELECT COUNT(*) FROM orders o
          WHERE o.paid_at IS NOT NULL AND o.created_at >= $1 AND o.created_at < $2
            AND EXISTS (SELECT 1 FROM quotes q WHERE q.converted_order_id = o.id)) AS oplacone
     FROM z`,
    [od, doKiedy]
  );
  return rows[0];
}

/**
 * Darmowe narzedzia: ile osob je otworzylo i ile naprawde czegos policzylo.
 *
 * Te strony sciagaja z wyszukiwarki najwiecej ludzi, a sama odslona nie mowi
 * nic poza tym, ze ktos wszedl. Dopiero stosunek uzyc do wejsc mowi, czy
 * narzedzie odpowiada na pytanie, z ktorym ludzie przychodza.
 */
export async function narzedzia(pool, od, doKiedy, { zWlasnymi = false } = {}) {
  const { rows } = await pool.query(
    `SELECT path AS narzedzie,
            COUNT(DISTINCT session) FILTER (WHERE ${ODSLONA})            AS wizyty,
            COUNT(DISTINCT session) FILTER (WHERE category = 'tool')     AS uzycia,
            COALESCE(AVG(value) FILTER (WHERE category = 'page' AND action = 'engaged'), 0) AS sredni_czas
       FROM events
      WHERE ts >= $1 AND ts < $2 ${bezWlasnych(zWlasnymi)}
        AND path ~ '^/(en/|de/)?(toolsjewelry|toolstudio)/.'
      GROUP BY path HAVING COUNT(DISTINCT session) FILTER (WHERE ${ODSLONA}) > 0
      ORDER BY wizyty DESC LIMIT 20`,
    [od, doKiedy]
  );
  return rows;
}

/** Najczestsze wybory w kalkulatorach, pogrupowane po kalkulatorze. */
export async function wyboryKalkulatora(pool, od, doKiedy, limit = 20, { zWlasnymi = false } = {}) {
  const { rows } = await pool.query(
    `SELECT split_part(action, ':', 1) AS kalkulator,
            split_part(action, ':', 2) AS pole,
            label                      AS wybor,
            COUNT(*)                   AS ile,
            COUNT(DISTINCT session)    AS wizyty
       FROM events
      WHERE category = 'calc' AND ts >= $1 AND ts < $2 ${bezWlasnych(zWlasnymi)}
      GROUP BY 1, 2, 3 ORDER BY wizyty DESC LIMIT ${Number(limit) || 20}`,
    [od, doKiedy]
  );
  return rows;
}

/**
 * Pojedyncze wizyty za dana liczba. To jest to "zajrzenie pod wykres": kazdy
 * slupek i kazdy wiersz zestawienia prowadzi tutaj z wypelnionym filtrem.
 */
export async function sesje(pool, { od, do: doKiedy, wymiar, wartosc, limit = 100, zWlasnymi = false }) {
  const kolumna = WYMIARY[wymiar];
  const warunek = kolumna ? `WHERE COALESCE(${kolumna}, '(brak)') = $3` : "";
  const params = kolumna ? [od, doKiedy, wartosc] : [od, doKiedy];
  const { rows } = await pool.query(
    `WITH ${sesjeCTE("s", zWlasnymi)}
     SELECT session, start, koniec, odslony, interakcje, kanal, zrodlo, kampania,
            kraj, urzadzenie, jezyk, sekundy, wejscie, zapytania, zamowienia, oplacone, przychod
       FROM pelne ${warunek}
      ORDER BY start DESC LIMIT ${Number(limit) || 100}`,
    params
  );
  return rows;
}

/** Cala sciezka jednej wizyty, zdarzenie po zdarzeniu. */
export async function sciezkaSesji(pool, session) {
  const { rows } = await pool.query(
    `SELECT ts, path, category, action, label, value, channel, source, country, device, lang
       FROM events WHERE session = $1 ORDER BY ts LIMIT 500`,
    [session]
  );
  return rows;
}

/** Zapytania i zamowienia tej wizyty, zeby bylo widac, czym sie skonczyla. */
export async function skutkiSesji(pool, session) {
  const [zapytania, zamowienia] = await Promise.all([
    pool.query(
      `SELECT id, created_at, email, calculator, source, status, quote_ref
         FROM leads WHERE session_id = $1 ORDER BY created_at`,
      [session]
    ),
    pool.query(
      `SELECT order_ref, created_at, status, total_grosze, paid_at, lang
         FROM orders WHERE session_id = $1 ORDER BY created_at`,
      [session]
    ),
  ]);
  return { zapytania: zapytania.rows, zamowienia: zamowienia.rows };
}

/**
 * Wnioski, ktore inaczej trzeba by wyczytywac z tabel.
 *
 * Kokpit ma mowic, CO ZROBIC, a nie tylko co sie stalo. Kazdy sygnal ma prog,
 * ktory da sie obronic, i zdanie z zaleceniem. Sygnaly liczymy w JavaScripcie
 * na juz pobranych danych, bo to jest arytmetyka na kilkunastu wierszach, a nie
 * kolejne zapytanie do bazy.
 */
/**
 * Dzien, od ktorego licznik mierzy TO SAMO co dzis: odsiewa roboty, oznacza
 * ruch wlasciciela i wiaze zgloszenia z wizytami. Porownanie z okresem sprzed
 * tej daty jest porownaniem dwoch roznych miar, wiec sygnal o spadku ruchu
 * milczy, zamiast wolac o pomoc z powodu wlasnej poprawki.
 */
export const POMIAR_OD = new Date("2026-08-31T00:00:00Z");

export function sygnaly({ teraz, przedtem, kanaly, wejscia, lejekS, poprzedniOd = null }) {
  const lista = [];
  const spadek = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);

  // Poprzedni okres siega przed zmiane sposobu liczenia: wtedy w tabeli
  // siedzialy jeszcze roboty i wlasny ruch, wiec "spadek" jest w duzej czesci
  // skutkiem odsiania, a nie ubytkiem odwiedzajacych.
  const porownywalne = !poprzedniOd || new Date(poprzedniOd) >= POMIAR_OD;

  const dW = spadek(Number(teraz.wizyty), Number(przedtem.wizyty));
  if (dW !== null && dW <= -25) {
    lista.push(porownywalne
      ? { waga: "alarm", tresc: `Ruch spadl o ${Math.abs(dW)} procent wobec poprzedniego okresu. Sprawdz, ktory kanal ubyl, i czy strony, ktore go przynosily, dalej sa w wyszukiwarce.` }
      : { waga: "uwaga", tresc: `Ruch jest nizszy o ${Math.abs(dW)} procent, ale poprzedni okres siega przed 31 sierpnia 2026, czyli przed odsianiem robotow i wlasnego ruchu. Tej roznicy NIE czytaj jako spadku: porownanie bedzie uczciwe dopiero na dwoch okresach po tej dacie.` });
  }

  if (Number(teraz.wizyty) > 30 && Number(teraz.zapytania) === 0) {
    lista.push({ waga: "alarm", tresc: "Ruch jest, zapytan nie ma ani jednego. Najpierw sprawdz, czy zgloszenia w ogole niosa identyfikator wizyty (kolumna `session_id` w tabeli zgloszen): puste zapytania przy pelnej liscie zgloszen znacza zerwane polaczenie, a nie brak klientow. Dopiero potem patrz na formularz i na teksty." });
  }

  const odbicia = Number(teraz.wizyty) ? Math.round((Number(teraz.odbicia) / Number(teraz.wizyty)) * 100) : 0;
  if (odbicia >= 70 && Number(teraz.wizyty) > 30) {
    lista.push({ waga: "uwaga", tresc: `${odbicia} procent wizyt konczy sie na jednej stronie bez zadnej interakcji. Zajrzyj w strony wejscia: zwykle wina jest niezgodnosc miedzy obietnica z wyszukiwarki a tym, co jest na gorze strony.` });
  }

  for (const w of wejscia.slice(0, 6)) {
    if (Number(w.wizyty) >= 20 && Number(w.zapytania) === 0 && Number(w.zamowienia) === 0) {
      lista.push({ waga: "uwaga", tresc: `${w.wartosc}: ${w.wizyty} wizyt i zero zapytan. Strona przyciaga, ale nie prowadzi dalej. Brakuje na niej wezwania do dzialania albo odnosnika do kalkulatora.` });
    }
  }

  for (const k of kanaly) {
    if (Number(k.wizyty) >= 20 && Number(k.zaangazowane) / Number(k.wizyty) < 0.2) {
      lista.push({ waga: "uwaga", tresc: `Kanal "${k.wartosc}" przynosi ruch, ktory nic nie robi (${Math.round((k.zaangazowane / k.wizyty) * 100)} procent wizyt z interakcja). Albo obietnica w tym miejscu nie zgadza sie z serwisem, albo to ruch maszynowy.` });
    }
  }

  // Prog na liczbie, nie tylko na procencie: przy trzech koszykach "33 procent"
  // to jedna osoba, ktora poszla zaparzyc herbate, a nie wada sklepu.
  if (Number(lejekS.koszyk) >= 10) {
    const doKasy = Number(lejekS.kasa) / Number(lejekS.koszyk);
    if (doKasy < 0.4) {
      lista.push({ waga: "uwaga", tresc: `Z koszyka do kasy przechodzi ${Math.round(doKasy * 100)} procent. Najczestsza przyczyna to koszt dostawy pokazany dopiero w kasie.` });
    }
  }
  // Rozstrzygniete, czyli zlozone MINUS te, ktore wciaz czekaja na przelew.
  // Zamowienie w euro jest nieoplacone z definicji, dopoki nie potwierdzisz
  // wplaty, wiec liczone jako porzucone zamienialo normalna kolejke w alarm.
  const rozstrzygniete = Number(lejekS.zlozone) - Number(lejekS.czekaja || 0);
  if (rozstrzygniete >= 5) {
    const doZaplaty = Number(lejekS.oplacone) / rozstrzygniete;
    if (doZaplaty < 0.6) {
      lista.push({ waga: "alarm", tresc: `${Math.round((1 - doZaplaty) * 100)} procent rozstrzygnietych zamowien nie zostalo oplaconych (bez tych, ktore czekaja na przelew). To sie dzieje juz PO decyzji klienta, wiec sprawdz bramke i wiadomosc z danymi do przelewu.` });
    }
  }

  if (!lista.length) {
    lista.push({ waga: "spokoj", tresc: "Nic nie odstaje od poprzedniego okresu. Zadnego progu nie przekroczono." });
  }
  return lista;
}
