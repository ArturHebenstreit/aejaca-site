import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pg from "pg";
import { randomBytes } from "node:crypto";

import { fileURLToPath } from "url";
import { opisWersji } from "./wersja.js";
import { okresy, kpi, dzienne, wedlug, tresc, lejekSklepu, lejekWycen, narzedzia,
         wyboryKalkulatora, sesje, sciezkaSesji, skutkiSesji, sygnaly } from "./analityka.js";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "contact@aejaca.com")
  .split(",").map(e => e.trim().toLowerCase());

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// --- Session ---
// Sekret podpisujacy ciasteczko sesji NIE MOZE miec wartosci zapasowej wpisanej
// w kod. Kto ja zna, podpisuje sobie ciasteczko zalogowanego administratora
// i wchodzi do panelu z pominieciem Google, a w panelu sa leady, subskrybenci,
// kody rabatowe i potwierdzanie przelewow. Gdy zmiennej brakuje, losujemy sekret
// na czas zycia procesu: panel dziala, podrobienie ciasteczka jest niemozliwe,
// a jedyna kara to wylogowanie po kazdym wdrozeniu. Ostrzezenie w logu mowi,
// co ustawic, zeby ta kara znikla.
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
if (!process.env.SESSION_SECRET) {
  console.warn("[auth] SESSION_SECRET nie jest ustawiony. Uzywam sekretu losowanego przy starcie, " +
               "wiec kazde wdrozenie wyloguje wszystkich. Ustaw go w Railway: openssl rand -hex 32");
}
if (!process.env.ADMIN_API_TOKEN) {
  console.warn("[auth] ADMIN_API_TOKEN nie jest ustawiony. Produkty, kody i przelewy nie beda dzialac.");
}

app.set("trust proxy", 1);
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // `lax`, a nie `strict`, i to swiadomie. `strict` nie wysyla ciasteczka przy
  // wejsciu z obcej strony, a powrot z logowania Google jest wlasnie takim
  // wejsciem, wiec grozi zamknieciem sie na zewnatrz wlasnego panelu.
  // Zysk bylby zreszta zaden: `lax` juz teraz nie przepuszcza zadania POST
  // z cudzej strony, a kazda zmiana w panelu idzie przez POST.
  // `httpOnly` odcina ciasteczko od skryptow w przegladarce.
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
  },
}));

// --- Passport Google OAuth ---
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || "/auth/google/callback",
  }, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (ALLOWED_EMAILS.includes(email)) {
      return done(null, { name: profile.displayName, email, photo: profile.photos?.[0]?.value });
    }
    return done(null, false, { message: "Unauthorized email" });
  }));
}

app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

// Pomocniki dostepne w kazdym szablonie EJS. Nazwa uzyta w widoku, a nieobecna
// tutaj, to blad 500 przy pierwszym wierszu z danymi, a nie przy pustej liscie:
// `fmtDateShort` stal w trzech widokach i nie istnial nigdzie indziej, wiec
// panel wywalal sie dopiero po zalozeniu pierwszej wyceny.
// Wersje panelu i backendu sklepu. Obie uslugi wdrazaja sie osobno, wiec nowy
// formularz potrafi przez chwile rozmawiac ze starym API i po cichu gubic pola,
// ktorych tamto nie zna. Naglowek pokazuje wiec obie liczby i stan schematu.
//
// Zapytanie do backendu idzie W TLE i najwyzej raz na minute: strona panelu
// nie moze czekac na cudza usluge ani wywalac sie, gdy ta nie odpowiada.
let wersjaApi = { tekst: null, ostrzezenie: null, kiedy: 0 };

function odswiezWersjeApi() {
  if (wersjaApi.kiedy && Date.now() - wersjaApi.kiedy < 60_000) return;
  wersjaApi.kiedy = Date.now();
  shopApi("/api/version")
    .then((d) => {
      wersjaApi.tekst = d.commit ? `${d.version} (${d.commit})` : String(d.version || "?");
      // Rozne numery obu uslug NIE sa bledem: panel zmienia sie sam z siebie,
      // gdy poprawiamy ekran. Alarmem jest wylacznie stan, w ktorym backend nie
      // umie przyjac tego, co panel wysyla, a to widac po schemacie bazy.
      wersjaApi.ostrzezenie = d.schema && d.schema.quoteItemKinds === false
        ? "baza sklepu nie ma jeszcze kolumn wyboru, warianty i dodatki nie zapiszą się"
        : null;
    })
    .catch((e) => {
      wersjaApi.tekst = null;
      // Trasa wersji weszla razem z tym panelem, wiec jej brak nie jest awaria:
      // to znaczy, ze backend sklepu jest po prostu starszy i nie zna pol,
      // ktore ten panel wysyla. Dokladnie tak wyglada wdrozenie w polowie.
      wersjaApi.ostrzezenie = /404/.test(e.message)
        ? "backend sklepu jest starszy niż panel (nie zna trasy /api/version), więc nowe pola zapisu mogą być ignorowane"
        : `backend sklepu nie odpowiada: ${e.message}`;
    });
}

app.use((req, res, next) => {
  odswiezWersjeApi();
  res.locals.wersjaPanelu = opisWersji();
  res.locals.wersjaApi = wersjaApi.tekst;
  res.locals.ostrzezenieWersji = wersjaApi.ostrzezenie;
  res.locals.fmtDate = (d) => {
    if (!d) return ' - ';
    const dt = new Date(d);
    return dt.toLocaleDateString('pl-PL') + ' ' + dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };
  res.locals.fmtDateShort = (d) => {
    if (!d) return ' - ';
    return new Date(d).toLocaleDateString('pl-PL');
  };
  // Data DO POLA FORMULARZA, czyli "RRRR-MM-DD". To nie to samo co data dla
  // czlowieka: `<input type="date">` z wartoscia "1.09.2026" nie pokazuje
  // niczego, bo nie umie jej odczytac. Wyglada to jak brak zapisu, a przy
  // nastepnym zapisie pole naprawde wraca puste i kasuje date w bazie.
  //
  // Skladamy z pol LOKALNYCH, a nie przez `toISOString()`: data zapisana jako
  // polnoc lokalna cofnelaby sie o dobe w kazdej strefie na wschod od
  // Greenwich, i tego nikt by nie zakwestionowal.
  res.locals.dataPola = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const dzien = String(dt.getDate()).padStart(2, "0");
    return `${dt.getFullYear()}-${m}-${dzien}`;
  };
  next();
});

// --- View engine ---
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

// ------------------------------------------------------------
// IKONY PANELU
// ------------------------------------------------------------
// Jeden zestaw dla calego panelu, bo ten sam znak ma wszedzie znaczyc to samo:
// olowek otwiera wiersz do edycji, fistaszek zatwierdza, zawinieta strzalka
// wycofuje sie bez zmian, krzyzyk usuwa. Krzyzyk NIE sluzy do zamykania
// formularza: gdyby raz zamykal, a raz kasowal, roznica miedzy pomylka a
// utrata danych bylaby kwestia tego, gdzie akurat stoi kursor.
//
// Rysunek stoi w SVG w tym pliku, a nie w foncie ikon ani w bibliotece, bo
// panel nie ciagnie niczego z sieci. `currentColor` bierze kolor z klasy
// przycisku, wiec ten sam znak jest zielony przy zapisie i czerwony przy
// kasowaniu, bez drugiego rysunku.
const ikona = (sciezki, klasa = "w-4 h-4") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" class="${klasa}" aria-hidden="true">${sciezki}</svg>`;

app.locals.IKONY = {
  olowek: ikona('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  fistaszek: ikona('<path d="M20 6 9 17l-5-5"/>'),
  // Strzalka powrotu, ta sama co na klawiszu Enter: leci w prawo, zawija sie
  // i wraca. Znaczy "zostaw, jak bylo", a nie "cofnij ostatnia zmiane".
  cofnij: ikona('<path d="M20 5v6a4 4 0 0 1-4 4H4"/><path d="M9 10l-5 5 5 5"/>'),
  krzyzyk: ikona('<path d="M18 6 6 18"/><path d="M6 6l12 12"/>'),
};

// Arkusz stylow podajemy z wlasnego katalogu. Wczesniej kazda strona ciagnela
// Tailwind ze zdalnego serwera, bez przypietej wersji i bez sumy kontrolnej,
// czyli panel z dostepem do leadow, kodow i potwierdzania przelewow wykonywal
// kod, nad ktorym nie mielismy zadnej kontroli. Plik jest zbudowany i wpisany
// do repozytorium (`npm run build:css`), wiec wdrozenie niczego nie sciaga.
app.use(express.static(join(__dirname, "public"), { maxAge: "1h" }));

// Naglowki bezpieczenstwa. Panel siega do jednego obcego serwera po zdjecie
// profilowe z Google i po miniatury produktow z naszej strony, i na tym koniec.
// Skrypty tylko wlasne, wiec wstrzykniety napis nie ma jak sie wykonac, nawet
// gdyby kiedys ominal filtrowanie szablonu.
//
// `unsafe-inline` przy skryptach zostaje, bo szesc widokow ma male wstawki
// w tresci strony. To ustepstwo, ale nadal domyka cala reszte: zaden kod
// z zewnetrznego adresu sie nie wykona.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://lh3.googleusercontent.com https://www.aejaca.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

app.use((req, res, next) => {
  res.set("Content-Security-Policy", CSP);
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Panel nie ma czego pokazywac wyszukiwarce ani asystentowi.
  res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// --- Auth middleware ---
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// --- Routes: Auth ---
app.get("/", (req, res) => {
  if (req.isAuthenticated()) return res.redirect("/dashboard");
  res.render("login", { error: req.query.error });
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/?error=unauthorized" }),
  (req, res) => res.redirect("/dashboard")
);

app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

// --- Routes: Dashboard ---
app.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const [leadStats, subStats, recentLeads, recentSubs, analyticsKpi, wlasnyRuch, poczta, laserMatrixCount, gemResult, filamentResult, filamentPending] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week FROM leads"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE) as today, COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE - INTERVAL '7 days') as week FROM subscribers WHERE unsubscribed = FALSE"),
      pool.query("SELECT * FROM leads ORDER BY created_at DESC LIMIT 10"),
      pool.query("SELECT * FROM subscribers ORDER BY subscribed_at DESC LIMIT 10"),
      // Skrot analityki na pulpicie liczy TO SAMO co pelna analityka, czyli
      // pomija ruch oznaczony jako wlasny. Dwie liczby pod jedna nazwa, rozne
      // o wejscia wlasciciela, byly by gorsze niz brak skrotu.
      pool.query(`
        SELECT
          COUNT(DISTINCT session) FILTER (WHERE ts >= CURRENT_DATE) AS visitors_today,
          COUNT(DISTINCT session) FILTER (WHERE ts >= CURRENT_DATE - 6) AS visitors_week,
          COUNT(*) FILTER (WHERE category = 'page' AND ts >= CURRENT_DATE) AS pageviews_today,
          COUNT(*) FILTER (WHERE category = 'page' AND ts >= NOW() - INTERVAL '7 days') AS pageviews_week,
          COUNT(DISTINCT session) FILTER (WHERE category = 'inquiry' AND ts >= NOW() - INTERVAL '7 days') AS inquiries_week,
          (SELECT path FROM events WHERE category = 'page' AND ts >= CURRENT_DATE AND NOT COALESCE(internal, FALSE)
             GROUP BY path ORDER BY COUNT(*) DESC LIMIT 1) AS top_page_today
        FROM events WHERE NOT COALESCE(internal, FALSE)
      `).catch(() => ({ rows: [{}] })),
      // Dowod, ze znacznik wlasnego ruchu dziala. Panel stoi pod innym adresem
      // niz serwis, wiec pamieci przegladarki z aejaca.com nie odczyta i stanu
      // znacznika NIE ZNA. Zna natomiast to, co przyszlo do bazy: ile zdarzen
      // z oznaczeniem, z ilu wizyt i kiedy ostatnie. Oznaczone urzadzenie widac
      // wiec po skutku, a nie po deklaracji.
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE ts >= NOW() - INTERVAL '7 days') AS zdarzenia_7d,
          COUNT(DISTINCT session) FILTER (WHERE ts >= NOW() - INTERVAL '7 days') AS wizyty_7d,
          MAX(ts) AS ostatnie,
          (SELECT device FROM events WHERE COALESCE(internal, FALSE) ORDER BY ts DESC LIMIT 1) AS ostatnie_urzadzenie
        FROM events WHERE COALESCE(internal, FALSE)
      `).catch(() => ({ rows: [{}] })),
      // Poczta czekajaca na nas. Dwie rozne rzeczy, obie osobno: watki, o
      // ktorych nikt nie rozstrzygnal, i te, gdzie ktos napisal i czeka na
      // odpowiedz. Skrzynka jest w panelu osobna strona, wiec bez tej liczby
      // na pulpicie nieodpisany mail nie odzywa sie znikad.
      pool.query(`SELECT
        COUNT(*) FILTER (WHERE tag = 'unclassified') AS do_decyzji,
        COUNT(*) FILTER (
          WHERE tag NOT IN ('spam', 'not_lead')
            AND (SELECT em.direction FROM email_messages em
                  WHERE em.thread_id = email_threads.id
                  ORDER BY em.received_at DESC LIMIT 1) = 'inbound'
        ) AS bez_odpowiedzi
        FROM email_threads`).catch(() => ({ rows: [{ do_decyzji: 0, bez_odpowiedzi: 0 }] })),
      pool.query("SELECT COUNT(*) as total FROM laser_matrix").catch(() => ({ rows: [{ total: '?' }] })),
      pool.query("SELECT COUNT(*) as count FROM gemstone_prices").catch(() => ({ rows: [{ count: '0' }] })),
      pool.query("SELECT COUNT(*) FROM filament_types WHERE is_active=TRUE").catch(() => ({ rows: [{ count: '0' }] })),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'").catch(() => ({ rows: [{ count: '0' }] })),
    ]);
    res.render("dashboard", {
      user: req.user,
      leadStats: leadStats.rows[0],
      subStats: subStats.rows[0],
      recentLeads: recentLeads.rows,
      recentSubs: recentSubs.rows,
      analyticsKpi: analyticsKpi.rows[0] || {},
      wlasnyRuch: wlasnyRuch.rows[0] || {},
      poczta: poczta.rows[0] || { do_decyzji: 0, bez_odpowiedzi: 0 },
      SITE_URL,
      laserMatrixCount: laserMatrixCount.rows[0].total,
      gemstoneCount: parseInt(gemResult.rows[0].count),
      filamentCount: parseInt(filamentResult.rows[0].count),
      pendingContributions: parseInt(filamentPending.rows[0].count),
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

app.get("/leads", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  // Filtry z BIALEJ LISTY, a nie sklejane z parametru. Warunek przepisany
  // wprost do zapytania bylby wstrzyknieciem, i to takim, ktore przechodzi
  // przez panel. Kazdy kafelek u gory strony ma tu swoj wiersz i to jest cala
  // jego mechanika: kafelek jest odnosnikiem, nie ozdoba.
  const FILTRY = {
    wszystkie: "TRUE",
    skontaktowane: "l.contacted_at IS NOT NULL",
    nowe: "l.status = 'new'",
    // Zgloszenia, ktore czekaja NA NAS: nikt sie nie odezwal i nie ma jeszcze
    // oferty. To one gina najlatwiej.
    bez_reakcji: "l.contacted_at IS NULL AND NOT EXISTS (SELECT 1 FROM quotes q WHERE q.quote_ref = l.quote_ref)",
    wycenione: "EXISTS (SELECT 1 FROM quotes q WHERE q.quote_ref = l.quote_ref)",
  };
  const filtr = Object.hasOwn(FILTRY, String(req.query.filtr || "")) ? String(req.query.filtr) : "wszystkie";

  // Kalkulator przychodzi jako WARTOSC parametru, nie jako fragment zapytania,
  // wiec nie musi stac na bialej liscie. Pusty znaczy "wszystkie".
  const kalkulator = String(req.query.kalkulator || "").slice(0, 60);

  // Sortowanie tez z bialej listy: ORDER BY nie przyjmuje parametru wiazanego.
  const SORTY = {
    najnowsze: "l.created_at DESC",
    najstarsze: "l.created_at ASC",
    email: "l.email ASC NULLS LAST",
    kalkulator: "l.calculator ASC NULLS LAST, l.created_at DESC",
  };
  const sort = Object.hasOwn(SORTY, String(req.query.sort || "")) ? String(req.query.sort) : "najnowsze";

  const warunki = [FILTRY[filtr]];
  const parametry = [];
  if (kalkulator) {
    parametry.push(kalkulator);
    warunki.push(`l.calculator = $${parametry.length}`);
  }
  const gdzie = `WHERE ${warunki.join(" AND ")}`;

  try {
    const [rows, count, byCalc, statusCounts] = await Promise.all([
      // `ma_wycene` liczy sie z ISTNIENIA oferty, a nie z pola `status`.
      // Skasowanie oferty zostawialo zgloszenie w stanie "quoted", czyli
      // w slepym zaulku: oferty juz nie ma, a przycisku do zrobienia nowej
      // tez nie ma, bo patrzyl na zapamietane pole zamiast na fakt.
      pool.query(`SELECT l.*, EXISTS (
                    SELECT 1 FROM quotes q WHERE q.quote_ref = l.quote_ref
                  ) AS ma_wycene,
                  EXISTS (
                    SELECT 1 FROM email_threads t
                     WHERE t.lead_id = l.id AND t.tag IN ('not_lead', 'spam')
                  ) AS odrzucony,
                  w.id AS watek_id, w.tag AS watek_tag, w.tag_sugestia AS watek_sugestia,
                  w.tresc AS watek_tresc, w.wiadomosci AS watek_wiadomosci
                    FROM leads l
                    -- Watek mailowy, z ktorego zgloszenie powstalo. Bierzemy
                    -- NAJNOWSZY, bo ten sam klient bywa autorem kilku, a decyzja
                    -- "lead czy nie" dotyczy tego, ktory wlasnie czytamy.
                    LEFT JOIN LATERAL (
                      SELECT t.id, t.tag, t.tag_sugestia,
                             -- TRESC pierwszej wiadomosci przychodzacej. Stara
                             -- droga zapisywala w zgloszeniu sam temat, wiec
                             -- w panelu nie dalo sie przeczytac, o co czlowiek
                             -- pytal, mimo ze cala wiadomosc lezala obok,
                             -- w tabeli poczty.
                             (SELECT em.body_text FROM email_messages em
                               WHERE em.thread_id = t.id AND em.direction = 'inbound'
                               ORDER BY em.received_at ASC LIMIT 1) AS tresc,
                             (SELECT COUNT(*) FROM email_messages em WHERE em.thread_id = t.id) AS wiadomosci
                        FROM email_threads t
                       WHERE t.lead_id = l.id ORDER BY t.last_message_at DESC NULLS LAST LIMIT 1
                    ) w ON TRUE
                    ${gdzie}
                   ORDER BY ${SORTY[sort]}
                   LIMIT $${parametry.length + 1} OFFSET $${parametry.length + 2}`,
        [...parametry, limit, offset]),
      pool.query(`SELECT COUNT(*) as total FROM leads l ${gdzie}`, parametry),
      // Liczniki licza CALOSC, a nie przefiltrowana liste: kafelek ma mowic,
      // ile jest wszystkiego danego rodzaju, takze wtedy, gdy patrzysz na co
      // innego. Inaczej po kliknieciu w "Skontaktowano 36" wszystkie pozostale
      // kafelki pokazywalyby zera i nie dalo by sie z nich wrocic.
      pool.query("SELECT calculator, COUNT(*) as count FROM leads GROUP BY calculator ORDER BY count DESC"),
      pool.query(`SELECT
        COUNT(*) as wszystkie,
        COUNT(*) FILTER (WHERE contacted_at IS NOT NULL) as contacted,
        COUNT(*) FILTER (WHERE status = 'new') as new_count,
        COUNT(*) FILTER (WHERE contacted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM quotes q WHERE q.quote_ref = leads.quote_ref)) as bez_reakcji,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM quotes q WHERE q.quote_ref = leads.quote_ref)) as wycenione
        FROM leads`),
    ]);
    res.render("leads", {
      user: req.user,
      msg: req.query.msg || null,
      err: req.query.err || null,
      leads: rows.rows,
      total: parseInt(count.rows[0].total),
      page,
      pages: Math.ceil(count.rows[0].total / limit),
      byCalc: byCalc.rows,
      filtr, kalkulator, sort,
      // Liczniki calosci, do kafelkow.
      wszystkieCount: parseInt(statusCounts.rows[0]?.wszystkie || 0),
      contactedCount: parseInt(statusCounts.rows[0]?.contacted || 0),
      newCount: parseInt(statusCounts.rows[0]?.new_count || 0),
      bezReakcjiCount: parseInt(statusCounts.rows[0]?.bez_reakcji || 0),
      wycenioneCount: parseInt(statusCounts.rows[0]?.wycenione || 0),
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// Wycena ze zgloszenia. Numer nadaje chat-api, wiec panel go tylko wola:
// dwa generatory jednego formatu rozjezdzaja sie przy pierwszej zmianie
// ksztaltu numeru, i to po cichu, bo oba dzialaja.
app.post("/leads/:id/do-wyceny", requireAuth, async (req, res) => {
  try {
    const r = await shopApi("/api/quotes/from-lead", { method: "POST", body: { leadId: Number(req.params.id) } });
    back(res, `/quotes/${r.quoteRef}`, {
      msg: r.reused ? `Wycena ${r.quoteRef} juz istniala` : `Zalozono wycene ${r.quoteRef}`,
    });
  } catch (err) { back(res, req.body.back || "/leads", { otwarte: req.params.id, err: err.message }); }
});

/**
 * Poprawienie zgloszenia z formularza edycyjnego.
 *
 * Tresc, ktora PRZYSZLA OD KLIENTA (adres, opis, parametry zapytania), nie jest
 * edytowalna i nie ma jej w tym zapisie. To jest zapis tego, co powiedzial
 * nam czlowiek, a nie nasza notatka: poprawiona bylaby juz czyms innym niz
 * dowodem, czego dotyczylo zapytanie. Zmieniamy wylacznie to, co nasze:
 * stan sprawy, slad kontaktu i notatke.
 */
app.post("/leads/:id/edit", requireAuth, async (req, res) => {
  const STANY = ["new", "contacted", "quoted", "closed", "spam"];
  const stan = STANY.includes(String(req.body.status || "")) ? String(req.body.status) : null;
  const kiedy = String(req.body.contactedAt || "").trim();
  if (kiedy && !/^\d{4}-\d{2}-\d{2}$/.test(kiedy)) {
    return back(res, req.body.back || "/leads", { otwarte: req.params.id, err: "Datę kontaktu podaj jako RRRR-MM-DD" });
  }
  const notatka = String(req.body.contactNote || "").slice(0, 4000) || null;

  // Stan "skontaktowano" bez daty to dwa pola opisujace jeden fakt, ktore
  // mowia co innego: licznik "bez reakcji" liczy po dacie, wiec zgloszenie
  // oznaczone jako zalatwione dalej wisialoby jako zaniedbane. Pusta date przy
  // tym stanie stemplujemy dniem dzisiejszym.
  const kiedyOstatecznie = kiedy || (["contacted", "quoted", "closed"].includes(stan) ? dzisiajISO() : "");

  try {
    await pool.query(
      `UPDATE leads
          SET status = COALESCE($2, status),
              contacted_at = $3,
              contact_note = $4
        WHERE id = $1`,
      // Poludnie, a nie polnoc: data zapisana jako polnoc UTC wyswietla sie
      // w Polsce jako dzien wczesniejszy przez pol roku, gdy strefa jest +2.
      [req.params.id, stan, kiedyOstatecznie ? `${kiedyOstatecznie}T12:00:00Z` : null, notatka]
    );
    back(res, req.body.back || "/leads", { otwarte: req.params.id, msg: "Zgłoszenie zapisane" });
  } catch (err) {
    back(res, req.body.back || "/leads", { otwarte: req.params.id, err: err.message });
  }
});

// Decyzja "lead czy nie lead" podjeta z listy zgloszen. Ta sama trasa API co
// w skrzynce, bo to ta sama decyzja: dwie kopie rozjechalyby sie po cichu.
app.post("/leads/:id/watek-tag", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/email-threads/${encodeURIComponent(req.body.watekId)}/tag`, {
      method: "POST",
      body: { tag: req.body.tag },
    });
    back(res, req.body.back || "/leads", { otwarte: req.params.id, msg: "Oznaczenie zapisane" });
  } catch (err) {
    back(res, req.body.back || "/leads", { otwarte: req.params.id, err: err.message });
  }
});

app.post("/leads/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM leads WHERE id = $1", [req.params.id]);
  // Wracamy do listy w tym samym ukladzie, z ktorego przyszlo kasowanie:
  // filtr i kolejnosc gubione przy kazdym usunieciu znaczyly szukanie
  // wiersza od nowa.
  back(res, req.body.back || "/leads", { msg: "Zgłoszenie usunięte" });
});

app.post("/subscribers/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM subscribers WHERE id = $1", [req.params.id]);
  res.redirect("/subscribers");
});

app.post("/conversations/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM conversations WHERE id = $1", [req.params.id]);
  res.redirect("/conversations");
});

app.post("/events/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM events WHERE id = $1", [req.params.id]);
  const days = req.query.days || 30;
  res.redirect(`/analytics?days=${days}`);
});

app.post("/events/bulk-delete", requireAuth, async (req, res) => {
  const { older_than_days } = req.body;
  if (older_than_days === "all") {
    await pool.query("DELETE FROM events").catch(() => {});
  } else {
    const days = parseInt(older_than_days) || 30;
    await pool.query("DELETE FROM events WHERE ts < NOW() - INTERVAL '1 day' * $1", [days]).catch(() => {});
  }
  res.redirect(`/analytics?days=30`);
});

app.post("/leads/bulk-delete", requireAuth, async (req, res) => {
  const { older_than_days } = req.body;
  if (older_than_days === "all") {
    await pool.query("DELETE FROM leads").catch(() => {});
  } else {
    const days = parseInt(older_than_days) || 90;
    await pool.query("DELETE FROM leads WHERE created_at < NOW() - INTERVAL '1 day' * $1", [days]).catch(() => {});
  }
  res.redirect("/leads");
});

app.post("/subscribers/bulk-delete", requireAuth, async (req, res) => {
  const { older_than_days } = req.body;
  if (older_than_days === "all") {
    await pool.query("DELETE FROM subscribers WHERE unsubscribed = TRUE").catch(() => {});
  } else {
    const days = parseInt(older_than_days) || 365;
    await pool.query("DELETE FROM subscribers WHERE subscribed_at < NOW() - INTERVAL '1 day' * $1 AND unsubscribed = TRUE", [days]).catch(() => {});
  }
  res.redirect("/subscribers");
});

app.post("/conversations/bulk-delete", requireAuth, async (req, res) => {
  const { older_than_days, include_hot } = req.body;
  if (older_than_days === "all") {
    const sql = include_hot === "1"
      ? "DELETE FROM conversations"
      : "DELETE FROM conversations WHERE hot_lead = FALSE";
    await pool.query(sql).catch(() => {});
  } else {
    const days = parseInt(older_than_days) || 30;
    const sql = include_hot === "1"
      ? "DELETE FROM conversations WHERE created_at < NOW() - INTERVAL '1 day' * $1"
      : "DELETE FROM conversations WHERE created_at < NOW() - INTERVAL '1 day' * $1 AND hot_lead = FALSE";
    await pool.query(sql, [days]).catch(() => {});
  }
  res.redirect("/conversations");
});

// --- Export CSV ---
/**
 * Komorka arkusza, nie napis.
 *
 * Wartosci w eksporcie pochodza od obcych ludzi: imie, tresc zapytania, notatka.
 * Excel i Arkusze Google traktuja komorke zaczynajaca sie od `=`, `+`, `-` lub
 * `@` jak formule i wykonuja ja przy otwarciu pliku, na TWOIM komputerze,
 * z Twoimi uprawnieniami. Apostrof z przodu mowi arkuszowi "to jest tekst".
 */
function csvCell(value) {
  const s = String(value ?? "").replace(/"/g, '""');
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

app.get("/export/:table", requireAuth, async (req, res) => {
  const table = req.params.table === "subscribers" ? "subscribers" : "leads";
  try {
    const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY ${table === "leads" ? "created_at" : "subscribed_at"} DESC`);
    if (!rows.length) return res.status(404).send("No data");
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${csvCell(r[h])}"`).join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${table}_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- Analytics dashboard ---
// ------------------------------------------------------------
// KOKPIT ANALITYCZNY
// ------------------------------------------------------------
// Kazda liczba stoi obok tej samej liczby z poprzedniego okresu, bo bez
// porownania liczba nie znaczy nic. Kazde zestawienie prowadzi do wierszy,
// z ktorych powstalo (`/analytics/szczegoly`), a stamtad do pojedynczej
// wizyty (`/analytics/sesja/...`). Wykres, pod ktory nie da sie zajrzec,
// sluzy do zgadywania, a nie do podejmowania decyzji.
app.get("/analytics", requireAuth, async (req, res) => {
  const o = okresy(req.query.days);
  // Ruch wlasciciela jest oznaczony (znacznik w przegladarce, `?nolicz=1`)
  // i domyslnie nie liczy sie w kokpicie. Przelacznik pokazuje go z powrotem,
  // bo inaczej nie dalo by sie sprawdzic, czy oznaczenie w ogole dziala.
  const zWlasnymi = req.query.wew === "1";
  const opcje = { zWlasnymi };
  // Kazda sekcja osobno: jedno zapytanie, ktore padnie (bo kolumna dojdzie
  // dopiero z nastepnym wdrozeniem chat-api), nie ma prawa zabrac calego ekranu.
  const bezpiecznie = (p, zapas) => p.catch((e) => { console.error("[analityka]", e.message); return zapas; });
  try {
    const [teraz, przedtem, dni, kanaly, zrodla, wejscia, tresci, kraje, urzadzenia, jezyki, lejekS, lejekW, wybory, narzedziaLista] =
      await Promise.all([
        bezpiecznie(kpi(pool, o.od, o.do, opcje), {}),
        bezpiecznie(kpi(pool, o.poprzedniOd, o.poprzedniDo, opcje), {}),
        bezpiecznie(dzienne(pool, o.od, o.do, opcje), []),
        bezpiecznie(wedlug(pool, "kanal", o.od, o.do, 12, opcje), []),
        bezpiecznie(wedlug(pool, "zrodlo", o.od, o.do, 12, opcje), []),
        bezpiecznie(wedlug(pool, "wejscie", o.od, o.do, 12, opcje), []),
        bezpiecznie(tresc(pool, o.od, o.do, 15, opcje), []),
        bezpiecznie(wedlug(pool, "kraj", o.od, o.do, 8, opcje), []),
        bezpiecznie(wedlug(pool, "urzadzenie", o.od, o.do, 5, opcje), []),
        bezpiecznie(wedlug(pool, "jezyk", o.od, o.do, 5, opcje), []),
        bezpiecznie(lejekSklepu(pool, o.od, o.do, opcje), {}),
        bezpiecznie(lejekWycen(pool, o.od, o.do, opcje), {}),
        bezpiecznie(wyboryKalkulatora(pool, o.od, o.do, 20, opcje), []),
        bezpiecznie(narzedzia(pool, o.od, o.do, opcje), []),
      ]);

    res.render("analytics", {
      user: req.user,
      days: o.dni,
      zWlasnymi,
      teraz, przedtem, dni, kanaly, zrodla, wejscia, tresci,
      kraje, urzadzenia, jezyki, lejekS, lejekW, wybory, narzedzia: narzedziaLista,
      // `poprzedniOd` niesie date poczatku okresu porownawczego. Sygnal
      // o spadku ruchu milczy, gdy ten okres siega przed zmiana sposobu
      // liczenia: inaczej wolalby o pomoc z powodu naszej wlasnej poprawki.
      sygnaly: sygnaly({ teraz, przedtem, kanaly, wejscia, lejekS, poprzedniOd: o.poprzedniOd }),
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// Wiersze pod liczba: pojedyncze wizyty w wybranym wymiarze.
app.get("/analytics/szczegoly", requireAuth, async (req, res) => {
  const o = okresy(req.query.days);
  try {
    const wiersze = await sesje(pool, {
      od: o.od, do: o.do,
      wymiar: req.query.wymiar || null,
      wartosc: req.query.wartosc || null,
      limit: 200,
      zWlasnymi: req.query.wew === "1",
    });
    res.render("analytics-szczegoly", {
      user: req.user, days: o.dni,
      wymiar: req.query.wymiar || "", wartosc: req.query.wartosc || "",
      wiersze,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// Jedna wizyta, zdarzenie po zdarzeniu, razem z tym, czym sie skonczyla.
app.get("/analytics/sesja/:session", requireAuth, async (req, res) => {
  try {
    const [kroki, skutki] = await Promise.all([
      sciezkaSesji(pool, req.params.session),
      skutkiSesji(pool, req.params.session),
    ]);
    res.render("analytics-sesja", {
      user: req.user, session: req.params.session, kroki, skutki,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// --- Laser Matrix CRUD ---
const MATRIX_COLS = [
  "laser_type","action_type","kinematics","wavelength_nm","material","thickness_mm",
  "watts","speed","power_pct","passes",
  "dpi","hatch_mm","scan_angle_deg","wobble_mm","frequency_khz","pulse_width_ns",
  "optics_lens","defocus_mm","z_step_mm",
  "gas_type","gas_pressure","galvo_delays",
  "notes","material_en","material_de","action_en","action_de","notes_en","notes_de"
];

async function invalidateMatrixCache() {
  if (!process.env.CHAT_API_URL || !process.env.MATRIX_INVALIDATE_TOKEN) return;
  fetch(`${process.env.CHAT_API_URL}/api/laser-matrix/invalidate`, {
    method: "POST",
    headers: { "x-invalidate-token": process.env.MATRIX_INVALIDATE_TOKEN, "Content-Type": "application/json" },
  }).catch(() => {});
}

async function getMatrixOptions() {
  const [lasers, actions, watts] = await Promise.all([
    pool.query("SELECT DISTINCT laser_type FROM laser_matrix ORDER BY laser_type"),
    pool.query("SELECT DISTINCT action_type FROM laser_matrix ORDER BY action_type"),
    pool.query("SELECT DISTINCT watts FROM laser_matrix ORDER BY watts"),
  ]);
  return {
    lasers: lasers.rows.map(r => r.laser_type),
    actions: actions.rows.map(r => r.action_type),
    watts: watts.rows.map(r => r.watts),
  };
}

// LIST with filters + pagination
app.get("/laser-matrix", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  const { laser, action, material, watts } = req.query;
  const conditions = [], params = [];
  if (laser)    { params.push(laser);    conditions.push(`laser_type = $${params.length}`); }
  if (action)   { params.push(action);   conditions.push(`action_type = $${params.length}`); }
  if (material) { params.push(`%${material}%`); conditions.push(`material ILIKE $${params.length}`); }
  if (watts)    { params.push(watts);    conditions.push(`watts = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  try {
    const [rows, count, total, stats, options] = await Promise.all([
      pool.query(`SELECT id, laser_type, action_type, kinematics, material, watts, speed, power_pct, passes, notes FROM laser_matrix ${where} ORDER BY laser_type, action_type, material, watts LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
      pool.query(`SELECT COUNT(*) as total FROM laser_matrix ${where}`, params),
      pool.query("SELECT COUNT(*) as total FROM laser_matrix"),
      pool.query("SELECT laser_type, COUNT(*) as cnt FROM laser_matrix GROUP BY laser_type ORDER BY cnt DESC"),
      getMatrixOptions(),
    ]);
    res.render("laser-matrix", {
      user: req.user,
      rows: rows.rows,
      total: parseInt(count.rows[0].total),
      grandTotal: parseInt(total.rows[0].total),
      page,
      pages: Math.ceil(count.rows[0].total / limit),
      stats: stats.rows,
      options,
      filters: req.query,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// EXPORT CSV - must be before /:id routes
app.get("/laser-matrix/export", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM laser_matrix ORDER BY id");
    if (!rows.length) return res.status(404).send("No data");
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${csvCell(r[h])}"`).join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=laser-matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// NEW form
app.get("/laser-matrix/new", requireAuth, async (req, res) => {
  const options = await getMatrixOptions().catch(() => ({ lasers: [], actions: [], watts: [] }));
  res.render("laser-matrix-edit", { user: req.user, row: null, options, flash: null });
});

// CREATE
app.post("/laser-matrix/create", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const vals = MATRIX_COLS.map(c => req.body[c]?.trim() || null);
  const placeholders = MATRIX_COLS.map((_, i) => `$${i + 1}`).join(", ");
  try {
    const result = await pool.query(
      `INSERT INTO laser_matrix (${MATRIX_COLS.join(", ")}, updated_by) VALUES (${placeholders}, $${MATRIX_COLS.length + 1}) RETURNING id`,
      [...vals, req.user.email]
    );
    await invalidateMatrixCache();
    res.redirect(`/laser-matrix?flash=created&id=${result.rows[0].id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// EDIT form
app.get("/laser-matrix/:id/edit", requireAuth, async (req, res) => {
  try {
    const [rowRes, options] = await Promise.all([
      pool.query("SELECT * FROM laser_matrix WHERE id = $1", [req.params.id]),
      getMatrixOptions(),
    ]);
    if (!rowRes.rows[0]) return res.status(404).render("error", { message: "Row not found" });
    res.render("laser-matrix-edit", { user: req.user, row: rowRes.rows[0], options, flash: req.query.flash || null });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// UPDATE
app.post("/laser-matrix/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const sets = MATRIX_COLS.map((c, i) => `${c} = $${i + 1}`).join(", ");
  const vals = MATRIX_COLS.map(c => req.body[c]?.trim() || null);
  try {
    await pool.query(
      `UPDATE laser_matrix SET ${sets}, updated_at = NOW(), updated_by = $${MATRIX_COLS.length + 1} WHERE id = $${MATRIX_COLS.length + 2}`,
      [...vals, req.user.email, req.params.id]
    );
    await invalidateMatrixCache();
    res.redirect(`/laser-matrix?flash=updated&id=${req.params.id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// DELETE
app.post("/laser-matrix/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM laser_matrix WHERE id = $1", [req.params.id]);
  await invalidateMatrixCache();
  res.redirect("/laser-matrix?flash=deleted");
});

// --- Gemstone Prices CRUD ---
async function invalidateGemCache() {
  if (!process.env.CHAT_API_URL || !process.env.MATRIX_INVALIDATE_TOKEN) return;
  fetch(`${process.env.CHAT_API_URL}/api/gemstone-prices/invalidate`, {
    method: "POST",
    headers: { "x-invalidate-token": process.env.MATRIX_INVALIDATE_TOKEN },
  }).catch(() => {});
}

app.get("/gemstone-prices", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM gemstone_prices ORDER BY precious DESC, lab, name_pl");
    res.render("gemstone-prices", { user: req.user, gems: rows, flash: req.query.flash || null });
  } catch (err) { res.status(500).render("error", { message: err.message }); }
});

app.get("/gemstone-prices/:id/edit", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM gemstone_prices WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).render("error", { message: "Not found" });
  res.render("gemstone-prices-edit", { user: req.user, gem: rows[0] });
});

app.post("/gemstone-prices/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const { base_eur, notes, name_pl, name_en, name_de } = req.body;
  await pool.query(
    `UPDATE gemstone_prices SET base_eur=$1, notes=$2, name_pl=$3, name_en=$4, name_de=$5, updated_at=NOW(), updated_by=$6 WHERE id=$7`,
    [base_eur || null, notes || null, name_pl, name_en, name_de, req.user.email, req.params.id]
  );
  await invalidateGemCache();
  res.redirect("/gemstone-prices?flash=saved");
});

// USUNIECIE POZYCJI NIE USUWA KAMIENIA Z OFERTY, i to jest cala rzecz, ktora
// trzeba o tej tabeli wiedziec. Lista kamieni, ich nazwy i to, czy sa
// szlachetne, mieszkaja w cenniku (`src/pricing/jewelryConfig.js`); tabela
// dokłada do nich WYLACZNIE cene, po `gem_id`. Skasowany wiersz znaczy wiec
// tyle, ze kalkulator wraca do ceny wpisanej w kodzie, a nie ze kamien znika.
app.post("/gemstone-prices/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM gemstone_prices WHERE id = $1", [req.params.id]);
  await invalidateGemCache();
  res.redirect("/gemstone-prices?flash=deleted");
});

// --- Material z magazynu: dodawanie, edycja, usuwanie ---
// Cena plyty zmienia sie razem z rynkiem, wiec musi dac sie poprawic tutaj,
// a nie wdrozeniem. Kazda zmiana czysci pamiec podreczna po stronie API,
// inaczej nowa stawka doszlaby do przegladarki od razu, a do kwoty wiazacej
// dopiero po godzinie, i przez ta godzine obie strony liczylyby inaczej.
// NARZUT NA MATERIAL, przepisany celowo, a nie zaimportowany z `src/pricing`.
// Panel jest osobna aplikacja i wdraza sie go z wlasnego katalogu, wiec
// import przez `../src/` wywrocilby uruchomienie, gdyby root wdrozenia byl
// ustawiony na `admin/`. Zamiast tego liczbe pilnuje test:
// `scripts/test-material-stock.mjs` wywala build, gdy te dwie sie rozjada.
const MATERIAL_MARKUP = 1.5;

async function invalidateMaterialCache() {
  if (!process.env.CHAT_API_URL || !process.env.MATRIX_INVALIDATE_TOKEN) return;
  fetch(`${process.env.CHAT_API_URL}/api/material-stock/invalidate`, {
    method: "POST",
    headers: { "x-invalidate-token": process.env.MATRIX_INVALIDATE_TOKEN },
  }).catch(() => {});
}

app.get("/materials", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM material_stock ORDER BY name_pl");
    res.render("materials", { user: req.user, materials: rows, markup: MATERIAL_MARKUP, flash: req.query.flash || null });
  } catch (err) { res.status(500).render("error", { message: err.message }); }
});

app.get("/materials/new", requireAuth, (req, res) => {
  res.render("material-edit", { user: req.user, material: null, markup: MATERIAL_MARKUP });
});

app.get("/materials/:id/edit", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM material_stock WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).render("error", { message: "Not found" });
  res.render("material-edit", { user: req.user, material: rows[0], markup: MATERIAL_MARKUP });
});

app.post("/materials/create", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const { material_id, name_pl, name_en, name_de, pln_per_m2, pln_per_piece, thickness_mm, in_stock, notes } = req.body;
  if (!material_id || !name_pl) return res.status(400).render("error", { message: "Identyfikator i nazwa sa wymagane" });
  try {
    await pool.query(
      `INSERT INTO material_stock (material_id,name_pl,name_en,name_de,pln_per_m2,pln_per_piece,thickness_mm,in_stock,notes,updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [material_id.trim(), name_pl, name_en || name_pl, name_de || name_pl,
       Number(pln_per_m2) || 0, pln_per_piece ? Number(pln_per_piece) : null,
       thickness_mm ? Number(thickness_mm) : null,
       in_stock === "on", notes || null, req.user.email]
    );
  } catch (err) { return res.status(400).render("error", { message: err.message }); }
  await invalidateMaterialCache();
  res.redirect("/materials?flash=created");
});

app.post("/materials/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const { name_pl, name_en, name_de, pln_per_m2, pln_per_piece, thickness_mm, in_stock, notes } = req.body;
  await pool.query(
    `UPDATE material_stock SET name_pl=$1, name_en=$2, name_de=$3, pln_per_m2=$4, pln_per_piece=$5,
     thickness_mm=$6, in_stock=$7, notes=$8, updated_at=NOW(), updated_by=$9 WHERE id=$10`,
    [name_pl, name_en || name_pl, name_de || name_pl, Number(pln_per_m2) || 0,
     pln_per_piece ? Number(pln_per_piece) : null,
     thickness_mm ? Number(thickness_mm) : null, in_stock === "on", notes || null,
     req.user.email, req.params.id]
  );
  await invalidateMaterialCache();
  res.redirect("/materials?flash=saved");
});

app.post("/materials/:id/delete", requireAuth, async (req, res) => {
  // Usuniecie pozycji NIE usuwa materialu z oferty: cennik zna go dalej,
  // wycena zjedzie na stawke domyslna. Panel steruje cena, a nie tym, co
  // umiemy przeciac.
  await pool.query("DELETE FROM material_stock WHERE id = $1", [req.params.id]);
  await invalidateMaterialCache();
  res.redirect("/materials?flash=deleted");
});

// --- Filament CRUD ---

async function invalidateFilamentCache() {
  const url = process.env.CHAT_API_URL;
  const token = process.env.MATRIX_INVALIDATE_TOKEN;
  if (!url || !token) return;
  fetch(`${url}/api/filaments/invalidate`, {
    method: "POST",
    headers: { "x-invalidate-token": token },
  }).catch(() => {});
}

// LIST filament types
app.get("/filaments", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  const { search, category } = req.query;
  const conditions = [], params = [];
  if (search)   { params.push(`%${search}%`); conditions.push(`(name ILIKE $${params.length} OR type_id ILIKE $${params.length})`); }
  if (category) { params.push(category);      conditions.push(`category = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  try {
    const [rows, count, catStats, pendingCount] = await Promise.all([
      pool.query(
        `SELECT ft.*, (SELECT COUNT(*) FROM filament_brands fb WHERE fb.filament_type_id = ft.id AND fb.is_active = TRUE) as brand_count
         FROM filament_types ft ${where} ORDER BY ft.sort_order, ft.category, ft.name
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM filament_types ${where}`, params),
      pool.query("SELECT category, COUNT(*) as count FROM filament_types GROUP BY category ORDER BY category"),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    res.render("filaments", {
      user: req.user,
      rows: rows.rows,
      total: parseInt(count.rows[0].count),
      page,
      pages: Math.ceil(parseInt(count.rows[0].count) / limit),
      catStats: catStats.rows,
      pendingContributions: parseInt(pendingCount.rows[0].count),
      filters: req.query,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// CONTRIBUTIONS list - before /:id routes
app.get("/filaments/contributions", requireAuth, async (req, res) => {
  const statusFilter = req.query.status || "pending";
  const where = statusFilter === "all" ? "" : `WHERE fc.status = $1`;
  const params = statusFilter === "all" ? [] : [statusFilter];
  try {
    const [rows, pendingCount] = await Promise.all([
      pool.query(
        `SELECT fc.*, ft.name as type_name,
                (SELECT COUNT(*) FROM filament_contribution_votes fcv WHERE fcv.contribution_id = fc.id AND fcv.vote = 'confirm') as vote_confirm_count,
                (SELECT COUNT(*) FROM filament_contribution_votes fcv WHERE fcv.contribution_id = fc.id AND fcv.vote = 'dispute') as vote_dispute_count
         FROM filament_contributions fc
         LEFT JOIN filament_types ft ON ft.id = fc.filament_type_id
         ${where} ORDER BY fc.vote_confirm DESC, fc.created_at DESC LIMIT 50`,
        params
      ),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    res.render("filament-contributions", {
      user: req.user,
      rows: rows.rows,
      pendingContributions: parseInt(pendingCount.rows[0].count),
      filters: req.query,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// APPROVE contribution
app.post("/filaments/contributions/:id/approve", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM filament_contributions WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).render("error", { message: "Contribution not found" });
    const c = rows[0];
    await pool.query(
      `INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, speed_min, speed_max, notes_pl, notes_en, notes_de, is_verified, is_active, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,TRUE,$13)`,
      [c.filament_type_id, c.brand_name, c.product_name, c.nozzle_min, c.nozzle_max, c.bed_min, c.bed_max, c.speed_min, c.speed_max, c.notes, c.notes, c.notes, req.user.email]
    );
    await pool.query(
      `UPDATE filament_contributions SET status='approved', reviewed_at=NOW(), reviewed_by=$1 WHERE id=$2`,
      [req.user.email, req.params.id]
    );
    await invalidateFilamentCache();
    res.redirect("/filaments/contributions?flash=approved");
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// REJECT contribution
app.post("/filaments/contributions/:id/reject", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  try {
    await pool.query(
      `UPDATE filament_contributions SET status='rejected', admin_note=$1, reviewed_at=NOW(), reviewed_by=$2 WHERE id=$3`,
      [req.body.admin_note || null, req.user.email, req.params.id]
    );
    res.redirect("/filaments/contributions?flash=rejected");
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// NEW type form - before /:id
app.get("/filaments/new", requireAuth, async (req, res) => {
  const pendingCount = await pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'").catch(() => ({ rows: [{ count: 0 }] }));
  res.render("filament-edit", { user: req.user, row: null, flash: null, pendingContributions: parseInt(pendingCount.rows[0].count) });
});

// BRAND edit form - before /:typeId/brands
app.get("/filaments/brands/:id/edit", requireAuth, async (req, res) => {
  try {
    const [brandRes, pendingCount] = await Promise.all([
      pool.query("SELECT fb.*, ft.name as type_name, ft.nozzle_min as t_nozzle_min, ft.nozzle_max as t_nozzle_max, ft.bed_min as t_bed_min, ft.bed_max as t_bed_max, ft.speed_min as t_speed_min, ft.speed_max as t_speed_max FROM filament_brands fb JOIN filament_types ft ON ft.id = fb.filament_type_id WHERE fb.id = $1", [req.params.id]),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    if (!brandRes.rows[0]) return res.status(404).render("error", { message: "Brand not found" });
    res.render("filament-brand-edit", { user: req.user, brand: brandRes.rows[0], typeId: brandRes.rows[0].filament_type_id, flash: req.query.flash || null, pendingContributions: parseInt(pendingCount.rows[0].count) });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// UPDATE brand
app.post("/filaments/brands/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  try {
    const { rows } = await pool.query("SELECT filament_type_id FROM filament_brands WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).render("error", { message: "Brand not found" });
    await pool.query(
      `UPDATE filament_brands SET brand=$1, product_name=$2, nozzle_min=$3, nozzle_max=$4, bed_min=$5, bed_max=$6,
       speed_min=$7, speed_max=$8, notes_pl=$9, notes_en=$10, notes_de=$11, product_url=$12,
       is_verified=$13, is_active=$14, updated_at=NOW(), updated_by=$15 WHERE id=$16`,
      [b.brand||null, b.product_name||null, b.nozzle_min||null, b.nozzle_max||null, b.bed_min||null, b.bed_max||null,
       b.speed_min||null, b.speed_max||null, b.notes_pl||null, b.notes_en||null, b.notes_de||null, b.product_url||null,
       b.is_verified === 'on', b.is_active === 'on', req.user.email, req.params.id]
    );
    await invalidateFilamentCache();
    res.redirect(`/filaments/${rows[0].filament_type_id}/brands?flash=updated&id=${req.params.id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// DELETE brand
app.post("/filaments/brands/:id/delete", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT filament_type_id FROM filament_brands WHERE id = $1", [req.params.id]);
    const typeId = rows[0]?.filament_type_id;
    await pool.query("DELETE FROM filament_brands WHERE id = $1", [req.params.id]);
    await invalidateFilamentCache();
    res.redirect(typeId ? `/filaments/${typeId}/brands?flash=deleted` : "/filaments?flash=deleted");
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// CREATE type
app.post("/filaments/create", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  try {
    const propsArr = b.props ? b.props.split(",").map(s => s.trim()).filter(Boolean) : [];
    const result = await pool.query(
      `INSERT INTO filament_types (type_id, name, category, nozzle_min, nozzle_max, bed_min, bed_max, temp_resistance,
       speed_min, speed_max, layer_min, layer_max, retraction_min, retraction_max, cooling, enclosure, difficulty,
       density, price_per_kg, props, uses_pl, uses_en, uses_de, notes_pl, notes_en, notes_de, is_active, sort_order, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) RETURNING id`,
      [b.type_id||null, b.name||null, b.category||null, b.nozzle_min||null, b.nozzle_max||null, b.bed_min||null, b.bed_max||null,
       b.temp_resistance||null, b.speed_min||null, b.speed_max||null, b.layer_min||null, b.layer_max||null,
       b.retraction_min||null, b.retraction_max||null, b.cooling||null, b.enclosure||null,
       b.difficulty ? parseInt(b.difficulty) : null, b.density||null, b.price_per_kg||null,
       propsArr, b.uses_pl||null, b.uses_en||null, b.uses_de||null, b.notes_pl||null, b.notes_en||null, b.notes_de||null,
       b.is_active === 'on', b.sort_order ? parseInt(b.sort_order) : 0, req.user.email]
    );
    await invalidateFilamentCache();
    res.redirect(`/filaments?flash=created&id=${result.rows[0].id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// EDIT type form
app.get("/filaments/:id/edit", requireAuth, async (req, res) => {
  try {
    const [rowRes, pendingCount] = await Promise.all([
      pool.query("SELECT * FROM filament_types WHERE id = $1", [req.params.id]),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    if (!rowRes.rows[0]) return res.status(404).render("error", { message: "Filament type not found" });
    res.render("filament-edit", { user: req.user, row: rowRes.rows[0], flash: req.query.flash || null, pendingContributions: parseInt(pendingCount.rows[0].count) });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// UPDATE type
app.post("/filaments/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  try {
    const propsArr = b.props ? b.props.split(",").map(s => s.trim()).filter(Boolean) : [];
    await pool.query(
      `UPDATE filament_types SET name=$1, category=$2, nozzle_min=$3, nozzle_max=$4, bed_min=$5, bed_max=$6,
       temp_resistance=$7, speed_min=$8, speed_max=$9, layer_min=$10, layer_max=$11, retraction_min=$12,
       retraction_max=$13, cooling=$14, enclosure=$15, difficulty=$16, density=$17, price_per_kg=$18,
       props=$19, uses_pl=$20, uses_en=$21, uses_de=$22, notes_pl=$23, notes_en=$24, notes_de=$25,
       is_active=$26, sort_order=$27, updated_at=NOW(), updated_by=$28 WHERE id=$29`,
      [b.name||null, b.category||null, b.nozzle_min||null, b.nozzle_max||null, b.bed_min||null, b.bed_max||null,
       b.temp_resistance||null, b.speed_min||null, b.speed_max||null, b.layer_min||null, b.layer_max||null,
       b.retraction_min||null, b.retraction_max||null, b.cooling||null, b.enclosure||null,
       b.difficulty ? parseInt(b.difficulty) : null, b.density||null, b.price_per_kg||null,
       propsArr, b.uses_pl||null, b.uses_en||null, b.uses_de||null, b.notes_pl||null, b.notes_en||null, b.notes_de||null,
       b.is_active === 'on', b.sort_order ? parseInt(b.sort_order) : 0, req.user.email, req.params.id]
    );
    await invalidateFilamentCache();
    res.redirect(`/filaments?flash=updated&id=${req.params.id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// DELETE type
app.post("/filaments/:id/delete", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM filament_types WHERE id = $1", [req.params.id]);
    await invalidateFilamentCache();
    res.redirect("/filaments?flash=deleted");
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// BRANDS list for a type
app.get("/filaments/:typeId/brands", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  try {
    const [typeRes, rows, count, pendingCount] = await Promise.all([
      pool.query("SELECT * FROM filament_types WHERE id = $1", [req.params.typeId]),
      pool.query(
        `SELECT fb.*,
                (SELECT COUNT(*) FROM filament_contribution_votes fcv
                 JOIN filament_contributions fc ON fc.id = fcv.contribution_id
                 WHERE fc.filament_brand_id = fb.id AND fcv.vote = 'confirm') as vote_confirm_count
         FROM filament_brands fb WHERE fb.filament_type_id = $1 ORDER BY fb.brand, fb.product_name LIMIT $2 OFFSET $3`,
        [req.params.typeId, limit, offset]
      ),
      pool.query("SELECT COUNT(*) FROM filament_brands WHERE filament_type_id = $1", [req.params.typeId]),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    if (!typeRes.rows[0]) return res.status(404).render("error", { message: "Filament type not found" });
    res.render("filament-brands", {
      user: req.user,
      type: typeRes.rows[0],
      brands: rows.rows,
      total: parseInt(count.rows[0].count),
      page,
      pages: Math.ceil(parseInt(count.rows[0].count) / limit),
      pendingContributions: parseInt(pendingCount.rows[0].count),
      filters: req.query,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// NEW brand form
app.get("/filaments/:typeId/brands/new", requireAuth, async (req, res) => {
  try {
    const [typeRes, pendingCount] = await Promise.all([
      pool.query("SELECT * FROM filament_types WHERE id = $1", [req.params.typeId]),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    if (!typeRes.rows[0]) return res.status(404).render("error", { message: "Filament type not found" });
    res.render("filament-brand-edit", { user: req.user, brand: null, typeId: req.params.typeId, type: typeRes.rows[0], flash: null, pendingContributions: parseInt(pendingCount.rows[0].count) });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// CREATE brand
app.post("/filaments/:typeId/brands/create", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max,
       speed_min, speed_max, notes_pl, notes_en, notes_de, product_url, is_verified, is_active, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [req.params.typeId, b.brand||null, b.product_name||null, b.nozzle_min||null, b.nozzle_max||null,
       b.bed_min||null, b.bed_max||null, b.speed_min||null, b.speed_max||null,
       b.notes_pl||null, b.notes_en||null, b.notes_de||null, b.product_url||null,
       b.is_verified === 'on', b.is_active === 'on', req.user.email]
    );
    await invalidateFilamentCache();
    res.redirect(`/filaments/${req.params.typeId}/brands?flash=created&id=${result.rows[0].id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// --- Email Threads ---
app.get("/email-threads", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const filter = req.query.filter || "active";
  const limit = 50;
  const offset = (page - 1) * limit;

  const whereClause = filter === "all" ? "" :
    filter === "spam" ? "WHERE et.tag = 'spam'" :
    filter === "lead" ? "WHERE et.tag = 'lead'" :
    filter === "not_lead" ? "WHERE et.tag = 'not_lead'" :
    filter === "unclassified" ? "WHERE et.tag = 'unclassified'" :
    "WHERE et.tag != 'spam'";  // default "active": hide spam

  try {
    const [rows, count, stats] = await Promise.all([
      pool.query(`
        SELECT et.*, l.email as lead_email, l.status as lead_status, l.quote_ref as lead_ref,
          (SELECT COUNT(*) FROM email_messages em WHERE em.thread_id = et.id AND em.direction = 'inbound') as inbound_count,
          (SELECT COUNT(*) FROM email_messages em WHERE em.thread_id = et.id AND em.direction = 'outbound') as outbound_count
        FROM email_threads et
        LEFT JOIN leads l ON l.id = et.lead_id
        ${whereClause}
        ORDER BY et.last_message_at DESC NULLS LAST
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
      pool.query(`SELECT COUNT(*) as total FROM email_threads et ${whereClause}`),
      // "Nieobsluzone" znaczy dwie rozne rzeczy i obie warto widziec osobno.
      // `unclassified` to watki, o ktorych nikt jeszcze nie rozstrzygnal.
      // `bez_odpowiedzi` to te, gdzie OSTATNIA wiadomosc jest przychodzaca,
      // czyli czlowiek napisal i czeka. Spam i "nie lead" sie tu nie licza:
      // nieodpisanie na reklame nie jest zaniedbaniem.
      pool.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE tag = 'lead') as leads,
        COUNT(*) FILTER (WHERE tag = 'spam') as spam,
        COUNT(*) FILTER (WHERE tag = 'not_lead') as not_lead,
        COUNT(*) FILTER (WHERE tag = 'unclassified') as unclassified,
        COUNT(*) FILTER (WHERE tag = 'unclassified' AND tag_sugestia = 'lead') as sugestia_lead,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
        COUNT(*) FILTER (
          WHERE tag NOT IN ('spam', 'not_lead')
            AND (SELECT em.direction FROM email_messages em
                  WHERE em.thread_id = email_threads.id
                  ORDER BY em.received_at DESC LIMIT 1) = 'inbound'
        ) as bez_odpowiedzi
        FROM email_threads`),
    ]);
    res.render("email-threads", {
      user: req.user,
      threads: rows.rows,
      total: parseInt(count.rows[0].total),
      page,
      pages: Math.ceil(parseInt(count.rows[0].total) / limit),
      stats: stats.rows[0],
      filter,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// Oznaczenie watku idzie przez API, a nie prosto do bazy. Uznanie watku za
// zapytanie ZAKLADA sprawe z numerem, a numery nadaje wylacznie chat-api
// (ADR-0032). Panel piszacy tu po swojemu bylby drugim generatorem numerow.
app.post("/email-threads/:id/tag", requireAuth, async (req, res) => {
  try {
    const r = await shopApi(`/api/email-threads/${encodeURIComponent(req.params.id)}/tag`, {
      method: "POST",
      body: { tag: req.body.tag },
    });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/email-threads/:id", requireAuth, async (req, res) => {
  try {
    const [thread, messages] = await Promise.all([
      pool.query(`
        SELECT et.*, l.email as lead_email, l.status as lead_status, l.calculator as lead_calculator
        FROM email_threads et
        LEFT JOIN leads l ON l.id = et.lead_id
        WHERE et.id = $1
      `, [req.params.id]),
      // OD NAJNOWSZEJ. Przegladajacy watek szuka tego, co przyszlo teraz, a nie
      // tego, od czego rozmowa sie zaczela: przy dlugiej korespondencji ostatnia
      // wiadomosc lezala na samym dole i trzeba bylo przewinac cala historie.
      // Widok rysuje miedzy wiadomosciami strzalke w GORE, zeby kierunek czasu
      // zgadzal sie z kolejnoscia. Polecenie wlasciciela, 2026-09-03.
      pool.query("SELECT * FROM email_messages WHERE thread_id = $1 ORDER BY received_at DESC", [req.params.id]),
    ]);
    if (!thread.rows[0]) return res.status(404).render("error", { message: "Thread not found" });
    res.render("email-thread", {
      user: req.user,
      thread: thread.rows[0],
      messages: messages.rows,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// ============================================================
// SKLEP: PRODUKTY, KODY RABATOWE, PRZELEWY
// ============================================================
// Te trzy rzeczy zyja w bazie sklepu, ale zapis ma skutki uboczne: zmiana
// stanu wchodzi w rezerwacje towaru, a potwierdzenie przelewu wysyla maile
// i przenosi pliki klienta. Dlatego panel nie pisze do bazy sam, tylko wola
// backend sklepu, gdzie te reguly juz sa. Jedna implementacja, jedno miejsce
// na blad.
//
// Wymaga dwoch zmiennych w tej usludze: CHAT_API_URL i ADMIN_API_TOKEN.

const CHAT_API = (process.env.CHAT_API_URL || "").replace(/\/$/, "");

// Adres serwisu, na ktorym stoi strona oferty. Ta sama wartosc co w chat-api,
// wiec link z panelu i link z maila prowadza w to samo miejsce.
const SITE_URL = (process.env.SITE_URL || "https://www.aejaca.com").replace(/\/$/, "");

async function shopApi(path, { method = "GET", body } = {}) {
  if (!CHAT_API) throw new Error("Brak zmiennej CHAT_API_URL w tej usludze");
  if (!process.env.ADMIN_API_TOKEN) throw new Error("Brak zmiennej ADMIN_API_TOKEN w tej usludze");
  const res = await fetch(`${CHAT_API}${path}`, {
    method,
    headers: {
      "X-Admin-Token": process.env.ADMIN_API_TOKEN,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Backend sklepu odpowiedzial ${res.status}`);
  return data;
}

/**
 * Wynik akcji wraca w adresie, zeby odswiezenie strony nie powtarzalo zapisu.
 *
 * Adres powrotu CZESTO MA JUZ pytanie: formularze kolejki niosa w nim filtr
 * i sortowanie, zeby po zapisie nie wypasc na domyslna liste. Doklejenie
 * drugiego znaku zapytania dawalo `/queue?status=details?err=...`, czyli jeden
 * parametr `status` o wartosci `details?err=...` i ZADNEGO `err`. Zapis
 * odrzucony przez API wracal wtedy na strone bez slowa: operator widzial
 * niezmieniona wartosc i zadnego bledu. Stad sklejanie przez `URLSearchParams`.
 *
 * Stary komunikat gasnie przy nowej akcji. Zielone "zapisano" z poprzedniego
 * kroku, wiszace nad wynikiem nastepnego, czyta sie jak potwierdzenie czegos,
 * co sie nie stalo.
 */
/** Dzisiaj jako "RRRR-MM-DD", z pol lokalnych. */
const dzisiajISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const back = (res, path, params = {}) => {
  const [sciezka, pytanie = ""] = String(path).split("?");
  const q = new URLSearchParams(pytanie);
  q.delete("msg");
  q.delete("err");
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  res.redirect(s ? `${sciezka}?${s}` : sciezka);
};

// --- Produkty ---
app.get("/products", requireAuth, async (req, res) => {
  try {
    const { products } = await shopApi("/api/admin/products");
    res.render("products", { user: req.user, products, msg: req.query.msg, err: req.query.err });
  } catch (err) {
    res.render("products", { user: req.user, products: [], msg: null, err: err.message });
  }
});

app.post("/products/:slug/stock", requireAuth, async (req, res) => {
  try {
    const stock = parseInt(req.body.stock, 10);
    await shopApi(`/api/products/${encodeURIComponent(req.params.slug)}/stock`, {
      method: "PATCH", body: { stock },
    });
    back(res, "/products", { msg: `${req.params.slug}: stan ustawiony na ${stock}` });
  } catch (err) { back(res, "/products", { err: err.message }); }
});

app.post("/products/:slug/status", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/products/${encodeURIComponent(req.params.slug)}/status`, {
      method: "PATCH", body: { status: req.body.status },
    });
    back(res, "/products", { msg: `${req.params.slug}: ${req.body.status}` });
  } catch (err) { back(res, "/products", { err: err.message }); }
});

// --- Kody rabatowe ---
// Gorna granica zniżki procentowej. Sprawdza ja serwer sklepu (`MAX_PERCENT`
// w `chat-api/discounts.js`) i warunek `discount_percent_range` w bazie, ale
// formularz musi ja znac SAM, zeby powiedziec to przy polu, a nie bledem po
// przeladowaniu strony. Panel wdraza sie osobno i nie importuje z `chat-api`,
// wiec liczba stoi tu drugi raz; ze zrodlem porownuje ja `admin/check-views.mjs`.
const MAX_PERCENT = 80;

app.get("/discounts", requireAuth, async (req, res) => {
  try {
    const { codes } = await shopApi("/api/admin/discounts");
    res.render("discounts", {
      user: req.user, codes, maxPercent: MAX_PERCENT,
      created: req.query.created ? req.query.created.split(",") : [],
      msg: req.query.msg, err: req.query.err,
    });
  } catch (err) {
    res.render("discounts", { user: req.user, codes: [], created: [], msg: null, maxPercent: MAX_PERCENT, err: err.message });
  }
});

app.post("/discounts", requireAuth, async (req, res) => {
  const b = req.body;
  const batch = b.mode === "batch";
  const num = (v) => (v === "" || v === undefined ? null : parseInt(v, 10));
  try {
    const { codes } = await shopApi("/api/admin/discounts", {
      method: "POST",
      body: {
        code: batch ? undefined : b.code,
        prefix: batch ? (b.prefix || "AEJ") : undefined,
        count: batch ? num(b.count) || 1 : 1,
        kind: b.kind === "amount" ? "amount" : "percent",
        // Kwote podajesz w zlotych, backend liczy w groszach.
        value: b.kind === "amount" ? Math.round(Number(b.value) * 100) : num(b.value),
        appliesTo: b.appliesTo,
        minOrderGrosze: b.minOrder ? Math.round(Number(b.minOrder) * 100) : 0,
        maxUses: num(b.maxUses) ?? (batch ? 1 : null),
        maxUsesPerEmail: num(b.maxUsesPerEmail) || 1,
        validFrom: b.validFrom || null,
        validTo: b.validTo || null,
        campaign: b.campaign || null,
        issuedTo: b.issuedTo || null,
        note: b.note || null,
      },
    });
    back(res, "/discounts", { created: codes.join(",") });
  } catch (err) { back(res, "/discounts", { err: err.message }); }
});

app.post("/discounts/:code/delete", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/admin/discounts/${encodeURIComponent(req.params.code)}`, { method: "DELETE" });
    back(res, "/discounts", { msg: `${req.params.code}: skasowany` });
  } catch (err) { back(res, "/discounts", { err: err.message }); }
});

// Poprawianie kodu, ktory juz gdzies poszedl. Nazwy i licznika uzyc nie
// ruszamy: pierwsza stoi przy zamowieniach, drugi jest zapisem tego, co sie
// stalo. Resztę wolno zmienic, bo akcja potrafi sie przeciagnac albo zmienic
// zasady, a alternatywa jest kasowanie kodu, ktory ktos ma juz w skrzynce.
app.get("/discounts/:code/edit", requireAuth, async (req, res) => {
  try {
    const { codes } = await shopApi("/api/admin/discounts");
    const kod = (codes || []).find((c) => c.code === req.params.code);
    if (!kod) return res.status(404).render("error", { message: "Nie znamy takiego kodu" });
    res.render("discount-edit", { user: req.user, kod, maxPercent: MAX_PERCENT, err: req.query.err || null });
  } catch (err) { res.status(500).render("error", { message: err.message }); }
});

app.post("/discounts/:code/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  const num = (v) => (v === "" || v === undefined ? null : parseInt(v, 10));
  try {
    await shopApi(`/api/admin/discounts/${encodeURIComponent(req.params.code)}`, {
      method: "PATCH",
      body: {
        kind: b.kind === "amount" ? "amount" : "percent",
        // Kwote podajesz w zlotych, backend liczy w groszach. Ta sama zamiana
        // co przy tworzeniu kodu i musi zostac taka sama, inaczej poprawiony
        // kod dawalby sto razy wiecej niz zalozony.
        value: b.kind === "amount" ? Math.round(Number(b.value) * 100) : num(b.value),
        appliesTo: b.appliesTo,
        minOrderGrosze: b.minOrder ? Math.round(Number(b.minOrder) * 100) : 0,
        maxUses: num(b.maxUses),
        maxUsesPerEmail: num(b.maxUsesPerEmail) || 1,
        validFrom: b.validFrom || null,
        validTo: b.validTo || null,
        campaign: b.campaign || null,
        issuedTo: b.issuedTo || null,
        note: b.note || null,
      },
    });
    back(res, "/discounts", { msg: `${req.params.code}: zapisany` });
  } catch (err) {
    res.redirect(`/discounts/${encodeURIComponent(req.params.code)}/edit?err=${encodeURIComponent(err.message)}`);
  }
});

app.post("/discounts/:code/toggle", requireAuth, async (req, res) => {
  try {
    const { active } = await shopApi(`/api/admin/discounts/${encodeURIComponent(req.params.code)}`, {
      method: "PATCH", body: { active: req.body.active === "true" },
    });
    back(res, "/discounts", { msg: `${req.params.code}: ${active ? "aktywny" : "wylaczony"}` });
  } catch (err) { back(res, "/discounts", { err: err.message }); }
});

// --- Przelewy czekajace na potwierdzenie ---
// Przelew nie ma powiadomienia z bramki, wiec jedynym dowodem wplywu jest
// wyciag bankowy. Potwierdzenie robi dokladnie to samo, co SUCCESS z Autopay:
// maile do klienta i przeniesienie plikow do Zamowien. Wykonuje sie raz.
// ------------------------------------------------------------
// WYCENY
// ------------------------------------------------------------
// Jedno miejsce na wszystkie zapytania, niezaleznie od tego, czy przyszly
// z formularza, z kalkulatora, mailem czy telefonem. Numer `WY...` nadaje
// sie od razu, jeszcze przed kwota, bo to on nazywa watek w korespondencji
// i pozniej stoi w tytule platnosci.

app.get("/quotes", requireAuth, async (req, res) => {
  const stan = String(req.query.status || "");
  try {
    const { quotes, counts } = await shopApi(`/api/quotes${stan ? `?status=${encodeURIComponent(stan)}` : ""}`);
    res.render("quotes", { user: req.user, quotes, counts, stan, msg: req.query.msg, err: req.query.err });
  } catch (err) {
    res.render("quotes", { user: req.user, quotes: [], counts: {}, stan, msg: null, err: err.message });
  }
});

app.get("/quotes/:ref", requireAuth, async (req, res) => {
  try {
    const { quote, items, orders = [] } = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}/admin`);
    // Link buduje sie tu, a nie w widoku, bo klient przy rozmowie telefonicznej
    // nie dostanie maila i jedynym sposobem przekazania oferty jest skopiowanie
    // tego adresu z ekranu.
    const offerUrl = `${SITE_URL}/oferta/?ref=${encodeURIComponent(quote.quoteRef)}&token=${encodeURIComponent(quote.accessToken)}`;
    // Link do KAZDEGO zamowienia z tej oferty. Powstaje tu, a nie w widoku,
    // z tego samego powodu co link do oferty: to jest adres do wklejenia
    // klientowi, a nie ozdoba ekranu.
    const zamowienia = orders.map((o) => ({
      ...o,
      url: o.token
        ? `${SITE_URL}/order/status/?ref=${encodeURIComponent(o.orderRef)}&token=${encodeURIComponent(o.token)}`
        : null,
    }));
    res.render("quote-edit", { user: req.user, quote, items, offerUrl, zamowienia, msg: req.query.msg, err: req.query.err });
  } catch (err) {
    back(res, "/quotes", { err: err.message });
  }
});

/** Zalozenie wyceny z rozmowy mailowej albo telefonicznej. */
app.post("/quotes/new", requireAuth, async (req, res) => {
  try {
    const tytuly = [].concat(req.body.title || []).filter((s) => String(s).trim());
    const ilosci = [].concat(req.body.qty || []);
    const items = tytuly.map((tytul, i) => ({
      title: String(tytul).slice(0, 255),
      qty: Math.max(1, Math.floor(Number(ilosci[i]) || 1)),
    }));
    if (!items.length) items.push({ title: String(req.body.message || "Zapytanie").slice(0, 255), qty: 1 });
    const r = await shopApi("/api/quotes/manual", {
      method: "POST",
      body: {
        email: (req.body.email || "").trim() || null,
        name: (req.body.name || "").trim() || null,
        phone: (req.body.phone || "").trim() || null,
        lang: ["pl", "en", "de"].includes(req.body.lang) ? req.body.lang : "pl",
        // Puste pole znaczy "wez walute z jezyka". Backend zna te tabelke
        // i jest jednym miejscem, ktore ja stosuje.
        currency: ["PLN", "EUR"].includes(req.body.currency) ? req.body.currency : undefined,
        source: req.body.source === "phone" ? "phone" : "email",
        message: req.body.message || null,
        items,
      },
    });
    back(res, `/quotes/${r.quoteRef}`, { msg: `Zalozono ${r.quoteRef}` });
  } catch (err) { back(res, "/quotes", { err: err.message }); }
});

/**
 * Zapis JEDNEJ POZYCJI oferty. Odpowiada JSON-em, bo wola to strona, nie formularz.
 *
 * Edytor wycen nie ma juz przycisku "zapisz". Zapisujemy na poziomie REKORDU,
 * a nie po kazdym znaku, i to jest swiadomy wybor:
 *
 *   - zapis po kazdym znaku wklada do bazy stany niedokonczone ("Wydruk klu",
 *     cena 4 grosze), a przy ofercie juz wyslanej widzi je klient;
 *   - kazdy zapis to transakcja, ktora przelicza sume, pilnuje reguly "jeden
 *     wariant w grupie" i potrafi zmienic stan oferty. Kilkaset takich
 *     transakcji na jedna sesje edycji to koszt bez pokrycia.
 *
 * Klikniecie w przelacznik, pole zaznaczane albo liste zapisuje sie od razu,
 * bo klikniecie JEST cala decyzja i nie ma stanu posredniego.
 */
app.post("/quotes/:ref/item", requireAuth, express.json({ limit: "64kb" }), async (req, res) => {
  try {
    const poz = req.body || {};
    const grosze = (wartosc) => {
      const t = String(wartosc ?? "").trim().replace(",", ".");
      if (!t) return null;
      const g = Math.round(Number(t) * 100);
      if (!Number.isFinite(g) || g <= 0) throw new Error("Kwota pozycji musi byc dodatnia albo pusta");
      return g;
    };

    // Pola pominiete zostaja nietkniete: zapis jednego przelacznika nie moze
    // skasowac opisu, ktorego to zadanie w ogole nie nioslo.
    const item = {};
    if (poz.id) item.id = Number(poz.id);
    if (poz.remove) item.remove = true;
    if (!poz.remove) {
      if (poz.title !== undefined) item.title = poz.title;
      if (poz.qty !== undefined) item.qty = poz.qty;
      if (poz.description !== undefined) item.description = poz.description;
      if (poz.unitPln !== undefined) item.unitGrosze = grosze(poz.unitPln);
      if (poz.kind !== undefined) item.kind = ["fixed", "variant", "option"].includes(poz.kind) ? poz.kind : "fixed";
      if (poz.groupKey !== undefined) item.groupKey = String(poz.groupKey ?? "").trim() || null;
      if (poz.selected !== undefined) item.selected = Boolean(poz.selected);
      // Termin realizacji i znacznik ustalen. Puste pole terminu znaczy "nie
      // wiem jeszcze" i ma zostac puste: zero czytaloby sie jak "od reki"
      // i po cichu skracaloby termin calej paczki.
      if (poz.leadDays !== undefined) {
        const t = String(poz.leadDays ?? "").trim();
        item.leadDays = t === "" ? null : Number(t);
      }
      // Pole wyboru w formularzu oddaje tekst, a nie wartosc logiczna: "1"
      // znaczy zaznaczone, pusty napis znaczy odznaczone.
      if (poz.requiresDetails !== undefined) {
        item.requiresDetails = poz.requiresDetails === true || String(poz.requiresDetails) === "1";
      }
    }
    if (!item.id && !item.title) return res.status(400).json({ ok: false, error: "Nowa pozycja musi miec nazwe" });

    const r = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}/update`, {
      method: "POST",
      body: { items: [item] },
    });
    // Stan oferty czytamy od nowa, bo zapis jednej pozycji potrafi przestawic
    // cala oferte: sume, zaznaczenie w grupie i stan "nowa albo oferta".
    const swieza = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}/admin`);
    res.json({ ok: true, ...r, quote: swieza.quote, items: swieza.items });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * Zapis NAGLOWKA oferty: dane klienta, jezyk, waluta, tresc zapytania,
 * notatka i termin waznosci. Osobny rekord, wiec osobny zapis i osobny olowek.
 */
app.post("/quotes/:ref/header", requireAuth, express.json({ limit: "64kb" }), async (req, res) => {
  try {
    const b = req.body || {};
    const patch = {};
    for (const pole of ["email", "name", "phone", "message", "note"]) {
      if (b[pole] !== undefined) patch[pole] = b[pole];
    }
    if (b.lang !== undefined) patch.lang = b.lang;
    if (b.currency !== undefined) patch.currency = b.currency;
    // Puste pole daty znaczy "zdejmij termin", brak pola znaczy "nie ruszaj".
    if (b.validUntil !== undefined) patch.validUntil = b.validUntil;
    if (b.validDays !== undefined && String(b.validDays).trim() !== "") patch.validDays = String(b.validDays).trim();

    const r = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}/update`, { method: "POST", body: patch });
    const swieza = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}/admin`);
    res.json({ ok: true, ...r, quote: swieza.quote, items: swieza.items });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * Trwale usuniecie wyceny. Decyzja wlasciciela, ADR-0014.
 *
 * Backend i tak sprawdza przepisany numer, wiec ominiecie formularza nic
 * nie daje. `force` przechodzi dalej wylacznie wtedy, gdy zaznaczono je
 * swiadomie: bez niego wycena, ktora stala sie zamowieniem, nie znika.
 */
app.post("/quotes/:ref/delete", requireAuth, async (req, res) => {
  try {
    const r = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}`, {
      method: "DELETE",
      body: {
        confirmRef: (req.body.confirmRef || "").trim(),
        force: req.body.force === "on",
      },
    });
    const uwaga = r.wasConverted ? " (była zamówieniem, samo zamówienie zostaje)" : "";
    back(res, "/quotes", { msg: `Usunieto ${req.params.ref}${uwaga}` });
  } catch (err) { back(res, `/quotes/${encodeURIComponent(req.params.ref)}`, { err: err.message }); }
});

/** Wyslanie oferty klientowi. */
app.post("/quotes/:ref/send", requireAuth, async (req, res) => {
  try {
    const r = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}/send`, { method: "POST" });
    back(res, `/quotes/${req.params.ref}`, {
      msg: r.mailed ? "Oferta wysłana mailem" : `Oznaczono jako wysłaną. Bez maila, przekaż link: ${r.url}`,
    });
  } catch (err) { back(res, `/quotes/${req.params.ref}`, { err: err.message }); }
});

// ------------------------------------------------------------
// KOLEJKA PRACOWNI
// ------------------------------------------------------------
// Jedna lista wszystkiego, co oplacone i jeszcze nieskonczone, od tego, kto
// czeka najdluzej. Zamowienia ze sklepu i z oferty stoja w niej razem, bo
// z punktu widzenia warsztatu niczym sie nie roznia.

app.get("/queue", requireAuth, async (req, res) => {
  // Domyslnie widac to, co czeka na prace. Filtr wpuszcza zakonczone
  // i anulowane, bo omylkowe "zrobione" inaczej znika z ekranu razem
  // z jedynym miejscem, w ktorym dalo by sie je poprawic.
  const stan = String(req.query.status || "");
  // Sortowanie sprawdza API wedlug bialej listy. Panel przekazuje je dalej
  // i tylko pamieta w adresie, zeby zapis wracal do tak samo ulozonej listy.
  const sort = String(req.query.sort || "");
  const pytanie = [stan ? `status=${encodeURIComponent(stan)}` : "", sort ? `sort=${encodeURIComponent(sort)}` : ""]
    .filter(Boolean).join("&");
  try {
    const dane = await shopApi(`/api/orders/queue${pytanie ? `?${pytanie}` : ""}`);
    // Link do strony zamowienia powstaje TU, a nie w widoku: to ten sam adres,
    // ktory klient dostal mailem po zaplacie, i jedyna droga, zeby wyslac mu
    // go ponownie, gdy zgubil wiadomosc. Bez zetonu strona pyta o adres email.
    const orders = (dane.orders || []).map((o) => ({
      ...o,
      statusUrl: o.accessToken
        ? `${SITE_URL}/order/status/?ref=${encodeURIComponent(o.orderRef)}&token=${encodeURIComponent(o.accessToken)}`
        : null,
    }));
    res.render("queue", {
      user: req.user, orders, counts: dane.counts,
      // Lista przewoznikow jest API, nie panelu. Gdy jej nie ma (starsze API),
      // pole wyboru sie nie rysuje, a mail wraca do podpowiedzi ze strefy.
      przewoznicy: dane.przewoznicy || [],
      // Cztery drogi wyjscia ze sprawy przychodza z API razem z kolejka. Gdy
      // ich nie ma (starsze API), formularz zamkniecia sie nie rysuje, zamiast
      // wysylac zgloszenie, ktorego backend nie zrozumie.
      drogiZamkniecia: dane.drogiZamkniecia || [],
      // Pieniadze do oddania licza sie poza filtrem, bo sprawa zamknieta nie
      // stoi w domyslnym widoku, a dlug nie ma prawa zniknac razem z wierszem.
      doZwrotu: dane.doZwrotu || { ile: 0, grosze: 0 },
      stan, sort: dane.sort || "newest", msg: req.query.msg, err: req.query.err,
    });
  } catch (err) {
    res.render("queue", {
      user: req.user, orders: [], counts: {}, stan, sort: sort || "newest",
      przewoznicy: [], drogiZamkniecia: [], doZwrotu: { ile: 0, grosze: 0 },
      msg: null, err: err.message,
    });
  }
});

/** Poprawienie wiersza: numer przesylki, notatka, korekta etapu. */
app.post("/queue/:ref/edit", requireAuth, async (req, res) => {
  const powrot = req.body.back || "/queue";
  try {
    // Puste pole znaczy "wyczysc", wiec idzie do API jako pusty napis,
    // a nie jako brak pola. Inaczej nie da sie skasowac blednego numeru.
    const r = await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/queue`, {
      method: "POST",
      body: {
        stage: req.body.stage || undefined,
        trackingNumber: req.body.trackingNumber ?? undefined,
        note: req.body.note ?? undefined,
        // Liczba dni i data terminu ida tylko wtedy, gdy formularz je przyslal.
        // `undefined` znaczy "nie ruszaj", pusty napis znaczy "wyczysc", i te
        // dwie rzeczy trzeba rozroznic, bo termin da sie skasowac.
        leadDays: req.body.leadDays ?? undefined,
        deadlineAt: req.body.deadlineAt ?? undefined,
        leadDaysAgreedAt: req.body.leadDaysAgreedAt ?? undefined,
        notify: req.body.notify === "1",
      },
    });
    const wyczyszczone = r.cleared?.length ? `, wyczyszczone: ${r.cleared.join(", ")}` : "";
    back(res, powrot, { msg: `${req.params.ref}: ${r.status}${wyczyszczone}` });
    // Numer w komunikacie o bledzie, bo w kolejce stoi kilkanascie wierszy
    // i "nie da sie zapisac" bez numeru nie mowi, ktorego dotyczy.
  } catch (err) { back(res, powrot, { err: `${req.params.ref}: ${err.message}` }); }
});

/**
 * Trwale usuniecie zamowienia. Decyzja wlasciciela, ADR-0014.
 *
 * Panel wymaga przepisania numeru, a nie samego klikniecia, bo wiersze
 * w kolejce wygladaja identycznie i jest to jedyna akcja bez cofniecia.
 * Potwierdzenie sprawdza takze backend, wiec ominiecie formularza nic nie daje.
 */
app.post("/queue/:ref/delete", requireAuth, async (req, res) => {
  const powrot = req.body.back || "/queue";
  try {
    const r = await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}`, {
      method: "DELETE",
      body: { confirmRef: (req.body.confirmRef || "").trim(), force: true },
    });
    const kody = r.releasedCodes?.length ? `, oddane kody: ${r.releasedCodes.join(", ")}` : "";
    const mimo = r.overridden?.length ? ` mimo tego, ze ${r.overridden.join(", ")}` : "";
    back(res, powrot, { msg: `Usunieto ${req.params.ref}${mimo}${kody}` });
  } catch (err) { back(res, powrot, { err: err.message }); }
});

/** Domkniecie albo cofniecie ustalen jednej pozycji zamowienia. */
app.post("/queue/:ref/item/:id/details", requireAuth, async (req, res) => {
  const powrot = req.body.back || "/queue";
  try {
    const r = await shopApi(
      `/api/orders/${encodeURIComponent(req.params.ref)}/items/${encodeURIComponent(req.params.id)}/details`,
      { method: "POST", body: { settled: req.body.settled === "1", note: req.body.note ?? undefined, notify: req.body.notify === "1" } }
    );
    const ile = r.remaining > 0 ? `, zostało do ustalenia: ${r.remaining}` : ", wszystkie ustalenia domknięte";
    back(res, powrot, { msg: `${req.params.ref}: ${r.status}${ile}` });
  } catch (err) { back(res, powrot, { err: err.message }); }
});

// Etap pracy PRZY POZYCJI. Osobna trasa od `/queue/:ref/stage`, bo tamta
// przestawia cale zamowienie, czyli platnosc i wysylke, a ta samo wykonanie
// jednej sztuki.
app.post("/queue/:ref/item/:id/stage", requireAuth, async (req, res) => {
  const powrot = req.body.back || "/queue";
  try {
    const r = await shopApi(
      `/api/orders/${encodeURIComponent(req.params.ref)}/items/${encodeURIComponent(req.params.id)}/stage`,
      { method: "POST", body: { stage: req.body.stage } }
    );
    back(res, powrot, { msg: `${req.params.ref}: pozycja na etapie ${r.stage}, całość ${r.orderStage}` });
  } catch (err) { back(res, powrot, { err: err.message }); }
});

app.post("/queue/:ref/stage", requireAuth, async (req, res) => {
  try {
    const r = await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/production`, {
      method: "POST",
      body: {
        stage: req.body.stage,
        // Powiadomienie klienta idzie tylko wtedy, gdy pracownia je zaznaczyla.
        notify: req.body.notify === "1",
        trackingNumber: (req.body.trackingNumber || "").trim() || undefined,
        // Przewoznik wybrany przy nadaniu. Puste znaczy "nie podaje", i wtedy
        // mail wraca do podpowiedzi ze strefy wysylkowej.
        carrier: (req.body.carrier || "").trim() || undefined,
        note: (req.body.note || "").trim() || undefined,
        // Puste pole znaczy "dzisiaj". Paczka bywa nadana wczoraj, a zaznaczona
        // dzisiaj, i wtedy termin realizacji wygladalby na przekroczony o dzien.
        shippedOn: (req.body.shippedOn || "").trim() || undefined,
        // Prosba o ocene przy odbiorze. Pole jedzie tylko wtedy, gdy formularz
        // je mial, wiec przy innych etapach nic sie nie zmienia.
        reviewAsk: req.body.reviewAsk === undefined ? undefined : req.body.reviewAsk === "1",
      },
    });
    back(res, req.body.back || "/queue", { otwarte: req.params.ref, msg: `${req.params.ref}: ${r.status}` });
  } catch (err) { back(res, req.body.back || "/queue", { otwarte: req.params.ref, err: err.message }); }
});

// Przelewy NIE maja juz wlasnej strony (decyzja wlasciciela, 2026-08-30).
// Zamowienie w euro stalo tutaj, a w kolejce nie bylo go w ogole, wiec droga
// zlecenia zaczynala sie w jednym miejscu, a toczyla w drugim. Potwierdzenie
// wplaty jest PIERWSZYM KROKIEM kolejki i stoi tam, gdzie reszta etapow.
// Adres zostaje jako przekierowanie: jest w zakladkach i w starych mailach.
app.get("/transfers", requireAuth, (req, res) => {
  res.redirect("/queue?status=awaiting_transfer,payment_review");
});

app.post("/transfers/:ref/confirm", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/confirm-transfer`, {
      method: "POST",
      body: {
        receivedEur: req.body.receivedEur ? Number(req.body.receivedEur) : undefined,
        force: req.body.force === "true",
      },
    });
    back(res, req.body.back || "/queue", { otwarte: req.params.ref, msg: `${req.params.ref}: potwierdzony` });
  } catch (err) { back(res, req.body.back || "/queue", { otwarte: req.params.ref, err: err.message }); }
});

// Wplynelo mniej: piszemy do klienta o doplate i dajemy trzy dni. Zamowienie
// zostaje w kolejce na przystanku "Zapłata", a po terminie wygasa samo.
app.post("/transfers/:ref/shortfall", requireAuth, async (req, res) => {
  try {
    const r = await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/transfer-shortfall`, {
      method: "POST",
      body: {
        receivedEur: req.body.receivedEur ? Number(req.body.receivedEur) : undefined,
        by: req.user.email,
      },
    });
    const mail = r.mailed ? "mail poszedl" : "MAIL NIE POSZEDL";
    back(res, req.body.back || "/queue", { otwarte: req.params.ref, msg: `${req.params.ref}: prosba o doplate ${r.shortfallEur} EUR, ${mail}` });
  } catch (err) { back(res, req.body.back || "/queue", { otwarte: req.params.ref, err: err.message }); }
});

// Rezygnacja: towar i kod wracaja do puli od razu, wiersz zostaje z adnotacja.
app.post("/transfers/:ref/cancel", requireAuth, async (req, res) => {
  try {
    const r = await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/cancel`, {
      method: "POST",
      body: { by: req.user.email, reason: req.body.reason || null },
    });
    const wrocilo = r.releasedReservations
      ? `, towar wrocil do sprzedazy (${r.releasedReservations})`
      : "";
    const kod = r.releasedCodes ? ", kod rabatowy zwolniony" : "";
    back(res, req.body.back || "/queue", { otwarte: req.params.ref, msg: `${req.params.ref}: rezygnacja${wrocilo}${kod}` });
  } catch (err) { back(res, req.body.back || "/queue", { otwarte: req.params.ref, err: err.message }); }
});

// Zamkniecie sprawy bez realizacji, jedna z czterech drog. Kwota zwrotu idzie
// w GROSZACH: panel przyjmuje zlotowki, bo tak sie o pieniadzach mysli, ale
// przelicza je tutaj, zeby dalej w systemie stala jedna jednostka.
app.post("/queue/:ref/close", requireAuth, async (req, res) => {
  try {
    const zlotowki = String(req.body.refund ?? "").replace(",", ".").trim();
    const r = await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/close`, {
      method: "POST",
      body: {
        kind: req.body.kind,
        by: req.user.email,
        reason: req.body.reason || null,
        refundGrosze: zlotowki === "" ? null : Math.round(Number(zlotowki) * 100),
        notify: req.body.notify === "on",
      },
    });
    const zwrot = r.refundGrosze > 0
      ? `, do zwrotu ${(r.refundGrosze / 100).toFixed(2)} PLN`
      : ", bez zwrotu";
    const mail = req.body.notify === "on" ? (r.mailSent ? ", mail poszedl" : ", MAIL NIE POSZEDL") : "";
    back(res, req.body.back || "/queue", { otwarte: req.params.ref, msg: `${req.params.ref}: sprawa zamknieta${zwrot}${mail}` });
  } catch (err) { back(res, req.body.back || "/queue", { otwarte: req.params.ref, err: err.message }); }
});

// Wlaczenie albo wylaczenie prosby o ocene po fakcie. Decyzja przy odbiorze
// zapada, zanim wiadomo, czy klient wystawi opinie sam, a robi to zwykle
// wlasnie w tych trzech dniach.
app.post("/queue/:ref/prosba-o-ocene", requireAuth, async (req, res) => {
  try {
    const r = await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/review-ask`, {
      method: "POST",
      body: { ask: req.body.ask === "1" },
    });
    const stan = r.reviewAsk ? "prosba o ocene wroci na liste" : "nie poprosimy o ocene";
    back(res, req.body.back || "/queue", { otwarte: req.params.ref, msg: `${req.params.ref}: ${stan}` });
  } catch (err) { back(res, req.body.back || "/queue", { otwarte: req.params.ref, err: err.message }); }
});

// Potwierdzenie, ze pieniadze naprawde poszly. Osobno od decyzji, bo przelew
// robi czlowiek i bywa, ze nastepnego dnia.
app.post("/queue/:ref/refunded", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/refunded`, { method: "POST", body: {} });
    back(res, req.body.back || "/queue", { otwarte: req.params.ref, msg: `${req.params.ref}: zwrot odnotowany` });
  } catch (err) { back(res, req.body.back || "/queue", { otwarte: req.params.ref, err: err.message }); }
});

// Kasowanie: tylko pomylki i testy. Backend odmawia, gdy cokolwiek sie wydarzylo,
// i podaje powod, ktory pokazujemy wprost zamiast suchej odmowy.
app.post("/transfers/:ref/delete", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}`, { method: "DELETE" });
    back(res, req.body.back || "/queue", { otwarte: req.params.ref, msg: `${req.params.ref}: skasowane` });
  } catch (err) { back(res, req.body.back || "/queue", { otwarte: req.params.ref, err: err.message }); }
});

app.listen(PORT, () => console.log(`AEJaCA Admin running on :${PORT}`));
