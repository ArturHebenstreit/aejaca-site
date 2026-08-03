// ============================================================
// SKLEP: hub oraz listy kategorii
// ============================================================
// Jedna strona obsluguje /shop/, /shop/jewelry/ i /shop/studio/.
// Produkty gotowe i uslugi lezą obok siebie, bo z perspektywy klienta
// to ta sama decyzja zakupowa, tylko z innym czasem realizacji.

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Package, Download, Wrench, MessageCircle, Sparkles, Search, X, LayoutGrid } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { t } from "../pricing/config.js";
import { useMoney } from "../shop/money.js";
import { useAvailability, stockOf, statusOf } from "../shop/availability.js";
import { subcategoriesFor, subcategory as findSub, SERVICE_FACETS, serviceFacet } from "../data/shopFacets.js";
import {
  SHOP_CATEGORIES, productsByCategory, personalizedByCategory, serviceCardsByCategory,
  PRODUCTS, PERSONALIZED, SERVICE_CARDS,
} from "../data/shopCatalog.js";
import PriceReduction from "../components/shop/PriceReduction.jsx";

const UI = {
  pl: {
    title: "Produkty i usługi",
    lead: "Kup gotowe wyroby albo zamów usługę z wyceną w kilka minut. Płatność BLIK-iem lub szybkim przelewem.",
    products: "Gotowe produkty",
    productsLead: "Leżą u nas na półce albo czekają jako plik do pobrania. Płacisz i wysyłamy, bez konfigurowania.",
    noProducts: "Chwilowo brak produktów gotowych",
    noProductsBody: "Uzupełniamy asortyment. W tym czasie wszystko z listy usług poniżej zamówisz z wyceną od ręki.",
    noProductsCta: "Zobacz usługi",
    personalized: "Produkty personalizowane",
    personalizedLead: "Półprodukt czeka u nas na półce, a my dopasowujemy go do Ciebie: grawer, wymiar, wykończenie. Krótki termin, własna treść.",
    noPersonalized: "Chwilowo brak pozycji personalizowanych",
    noPersonalizedBody: "Przygotowujemy podstawki kamienne, szkatułki i deski do personalizacji. Do tego czasu to samo zamówisz jako usługę grawerowania.",
    services: "Usługi / Produkty na zamówienie",
    servicesLead: "Konfigurujesz na karcie usługi, cena wiążąca pojawia się od razu, a przedmiot powstaje pod Twoje zamówienie.",
    inStock: "Dostępny",
    lastOne: "Ostatnia sztuka",
    outOfStock: "Chwilowo niedostępny",
    soldOutBack: "Wyprzedany, będzie ponownie",
    digital: "Plik do pobrania",
    madeToOrder: "Na zamówienie",
    from: "od",
    order: "Zamawiam",
    askQuote: "Wyślij do wyceny",
    details: "Szczegóły",
    ready: "Wysyłka w",
    days: "dni",
    immediate: "natychmiast po opłaceniu",
    quoteBadge: "Wycena indywidualna",
    quoteReply: "odpowiedź w 24 h",
    bothSections: "Wybierz dział",
    navTitle: "Co znajdziesz w sklepie",
    shortProducts: "Gotowe",
    shortPersonalized: "Personalizowane",
    shortServices: "Usługi",
    hintProducts: "Płacisz, wysyłamy. Nic do ustawiania.",
    hintPersonalized: "Nasz produkt, Twój pomysł na grawer lub inną personalizację.",
    hintServices: "Powstaje od zera pod Twoje zamówienie.",
    empty: "w przygotowaniu",
    items: "poz.",
    searchPlaceholder: "Szukaj produktu lub usługi, np. grawer, srebro, druk 3D",
    matches: "pasujących pozycji",
    clear: "Wyczyść",
    all: "Wszystko",
    filterBy: "Zawęź listę",
    noResults: "Nic nie pasuje do tego zapytania",
    noResultsBody: "Spróbuj krótszego słowa albo wyczyść wyszukiwanie. Jeśli szukasz czegoś nietypowego, napisz do nas, wycenimy indywidualnie.",
  },
  en: {
    title: "Products and services",
    lead: "Buy ready-made pieces or order a service with a quote in minutes. Pay by BLIK or instant transfer.",
    products: "Ready-made products",
    productsLead: "On our shelf or ready as a download. You pay, we ship, nothing to configure.",
    noProducts: "No ready-made products at the moment",
    noProductsBody: "We are building the range. In the meantime everything in the services below is quoted and ordered on the spot.",
    noProductsCta: "See the services",
    personalized: "Personalised products",
    personalizedLead: "The blank waits on our shelf and we fit it to you: engraving, size, finish. Short lead time, your own wording.",
    noPersonalized: "No personalised items at the moment",
    noPersonalizedBody: "Stone coasters, boxes and boards for personalisation are on the way. Until then, order the same thing as an engraving service.",
    services: "Services / Made to order",
    servicesLead: "You configure it on the service card, the binding price appears at once, and the piece is made for your order.",
    inStock: "In stock",
    lastOne: "Last one",
    outOfStock: "Currently unavailable",
    soldOutBack: "Sold out, coming back",
    digital: "Downloadable file",
    madeToOrder: "Made to order",
    from: "from",
    order: "Order",
    askQuote: "Request a quote",
    details: "Details",
    ready: "Ships in",
    days: "days",
    immediate: "immediately after payment",
    quoteBadge: "Individual quote",
    quoteReply: "reply within 24 h",
    bothSections: "Choose a section",
    navTitle: "What you will find here",
    shortProducts: "Ready-made",
    shortPersonalized: "Personalised",
    shortServices: "Services",
    hintProducts: "You pay, we ship. Nothing to set up.",
    hintPersonalized: "Our product, your idea for an engraving or another personalisation.",
    hintServices: "Made from scratch for your order.",
    empty: "in preparation",
    items: "items",
    searchPlaceholder: "Search products and services, e.g. engraving, silver, 3D printing",
    matches: "matching items",
    clear: "Clear",
    all: "All",
    filterBy: "Narrow the list",
    noResults: "Nothing matches this search",
    noResultsBody: "Try a shorter word or clear the search. If you are after something unusual, write to us and we will quote it individually.",
  },
  de: {
    title: "Produkte und Leistungen",
    lead: "Fertige Stücke kaufen oder eine Leistung mit Angebot in wenigen Minuten bestellen. Zahlung per BLIK oder Sofortüberweisung.",
    products: "Fertige Produkte",
    productsLead: "Liegen bei uns im Regal oder stehen als Datei bereit. Sie zahlen, wir versenden, nichts zu konfigurieren.",
    noProducts: "Derzeit keine fertigen Produkte",
    noProductsBody: "Wir bauen das Sortiment auf. Bis dahin wird alles aus den Leistungen unten sofort kalkuliert und bestellt.",
    noProductsCta: "Leistungen ansehen",
    personalized: "Personalisierte Produkte",
    personalizedLead: "Der Rohling liegt bei uns im Regal, wir passen ihn an Sie an: Gravur, Maß, Finish. Kurze Frist, Ihr eigener Text.",
    noPersonalized: "Derzeit keine personalisierten Positionen",
    noPersonalizedBody: "Steinuntersetzer, Schatullen und Bretter zur Personalisierung sind in Vorbereitung. Bis dahin bestellen Sie dasselbe als Gravurleistung.",
    services: "Leistungen / Auf Bestellung",
    servicesLead: "Sie konfigurieren auf der Leistungskarte, der verbindliche Preis erscheint sofort, und das Stück entsteht für Ihre Bestellung.",
    inStock: "Verfügbar",
    lastOne: "Letztes Stück",
    outOfStock: "Derzeit nicht verfügbar",
    soldOutBack: "Ausverkauft, kommt wieder",
    digital: "Datei zum Download",
    madeToOrder: "Auf Bestellung",
    from: "ab",
    order: "Bestellen",
    askQuote: "Angebot anfordern",
    details: "Details",
    ready: "Versand in",
    days: "Tagen",
    immediate: "sofort nach Zahlung",
    quoteBadge: "Individuelles Angebot",
    quoteReply: "Antwort in 24 h",
    bothSections: "Bereich wählen",
    navTitle: "Das finden Sie hier",
    shortProducts: "Fertig",
    shortPersonalized: "Personalisiert",
    shortServices: "Leistungen",
    hintProducts: "Sie zahlen, wir versenden. Nichts einzustellen.",
    hintPersonalized: "Unser Produkt, Ihre Idee für Gravur oder andere Personalisierung.",
    hintServices: "Entsteht von Grund auf für Ihre Bestellung.",
    empty: "in Vorbereitung",
    items: "Pos.",
    searchPlaceholder: "Produkte und Leistungen suchen, z. B. Gravur, Silber, 3D-Druck",
    matches: "passende Positionen",
    clear: "Zurücksetzen",
    all: "Alle",
    filterBy: "Liste eingrenzen",
    noResults: "Nichts passt zu dieser Suche",
    noResultsBody: "Versuchen Sie ein kürzeres Wort oder setzen Sie die Suche zurück. Für Ungewöhnliches schreiben Sie uns, wir kalkulieren individuell.",
  },
};

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.03] text-neutral-400",
    good: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    warn: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    info: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Pozycje bez podkategorii nie moga wypasc z listy, wiec maja wlasna grupe. */
const OTHER = { id: "__other", Icon: LayoutGrid, label: { pl: "Pozostałe", en: "Other", de: "Sonstige" } };

/**
 * Szukamy po tytule, zajawce i opisie w jezyku, ktory klient ma wlaczony.
 * Adres pozycji tez, bo bywa najkrotsza nazwa, jakiej ktos uzyje.
 */
function haystack(item, lang) {
  return [
    t(item.title, lang),
    t(item.short || item.lead, lang),
    t(item.description, lang),
    item.slug || item.id || "",
  ].join(" ").toLowerCase();
}

function byQuery(list, q, lang) {
  if (!q) return list;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  // Wszystkie slowa musza wystapic, inaczej "srebrny pierscionek" zwracalby
  // wszystko srebrne i wszystkie pierscionki.
  return list.filter((item) => {
    const hay = haystack(item, lang);
    return words.every((w) => hay.includes(w));
  });
}

/** Filtry pokazuja tylko wartosci obecne na liscie, razem z liczba pozycji. */
function facetsWithCounts(defs, list, keyOf) {
  return defs
    .map((f) => ({ ...f, count: list.filter((item) => keyOf(item) === f.id).length }))
    .filter((f) => f.count > 0);
}

/**
 * Wyszukiwarka nad calym sklepem. Zawezenie dziala na trzy dzialy naraz, bo
 * klient szukajacy "grawer" nie wie z gory, czy odpowiedzia jest gotowa
 * wizytowka, personalizacja czy usluga, i nie powinien szukac trzy razy.
 */
function SearchBar({ value, onChange, u, total }) {
  return (
    <div className="mb-8">
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={u.searchPlaceholder}
          aria-label={u.searchPlaceholder}
          className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white
                     placeholder:text-neutral-500 focus:outline-none focus:border-white/25 transition-colors"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={u.clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {value && (
        <p className="text-neutral-500 text-[11px] mt-2">
          {total} {u.matches}
        </p>
      )}
    </div>
  );
}

/**
 * Filtr nad lista. Pokazujemy tylko te wartosci, ktore w tej liscie wystepuja:
 * filtr prowadzacy do pustej listy jest gorszy niz jego brak, bo wyglada jak
 * awaria. Przy jednej wartosci pasek znika, bo nie ma czego zawezac.
 */
function FacetBar({ facets, value, onChange, lang, u }) {
  if (facets.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label={u.filterBy}>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`facet-chip px-3 py-1.5 rounded-lg border text-xs transition-colors ${
          value === null ? "facet-chip-on" : ""
        }`}
      >
        {u.all}
      </button>
      {facets.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(value === f.id ? null : f.id)}
          className={`facet-chip px-3 py-1.5 rounded-lg border text-xs inline-flex items-center gap-1.5 transition-colors ${
            value === f.id ? "facet-chip-on" : ""
          }`}
        >
          <f.Icon className="w-3.5 h-3.5" />
          {t(f.label, lang)}
          <span className="text-[10px] tabular-nums opacity-60">{f.count}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Lista produktow. Bez wybranego filtru dzielimy ja na polki po podkategorii,
 * bo dwadziescia kafelkow pod rzad czyta sie jak worek. Po wybraniu filtru
 * grupowanie znika: klient sam juz zawezil, wiec naglowki tylko przeszkadzaja.
 */
function ProductList({ items, facetId, facets, lang, u, money, availability }) {
  const grid = (list) => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((p) => (
        <ProductCard key={p.slug} product={p} lang={lang} u={u} money={money} availability={availability} />
      ))}
    </div>
  );

  if (facetId) return grid(items.filter((p) => p.subcategory === facetId));
  if (facets.length < 2) return grid(items);

  const rest = items.filter((p) => !findSub(p.subcategory));
  return (
    <div>
      {facets.map((f) => {
        const group = items.filter((p) => p.subcategory === f.id);
        return (
          <div key={f.id}>
            <GroupHead facet={f} lang={lang} count={group.length} />
            {grid(group)}
          </div>
        );
      })}
      {rest.length > 0 && (
        <div>
          <GroupHead facet={OTHER} lang={lang} count={rest.length} />
          {grid(rest)}
        </div>
      )}
    </div>
  );
}

/** Naglowek grupy wewnatrz dzialu, zeby lista czytala sie jak polka, nie jak worek. */
function GroupHead({ facet, lang, count }) {
  return (
    <div className="flex items-center gap-2 mt-8 first:mt-0 mb-3">
      <facet.Icon className="w-4 h-4 text-neutral-500" />
      <h3 className="text-neutral-300 text-xs font-medium uppercase tracking-wider">{t(facet.label, lang)}</h3>
      <span className="text-neutral-600 text-[10px] tabular-nums">{count}</span>
    </div>
  );
}

/**
 * Naglowek dzialu. Produkt gotowy i usluga to dwie rozne obietnice: jedno
 * lezy na polce, drugie dopiero powstanie. Bez wyraznej granicy klient czyta
 * to jako jedna liste i dziwi sie terminom.
 */
function SectionHead({ icon: Icon, title, lead, count, tone }) {
  const tones = {
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    blue: "border-blue-400/25 bg-blue-400/10 text-blue-300",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  };
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
        <h2 className="text-white font-serif text-xl sm:text-2xl font-bold">{title}</h2>
        <span className="text-neutral-600 text-xs font-medium tabular-nums">{count}</span>
      </div>
      <p className="text-neutral-500 text-xs leading-relaxed max-w-xl">{lead}</p>
      <div className="h-px bg-gradient-to-r from-white/15 to-transparent mt-4" />
    </div>
  );
}

// Tryb jasny w tym projekcie dziala przez nadpisanie znanych klas w index.css,
// wiec uzywamy wylacznie tych, ktore tam istnieja. Klasa dowolna typu
// bg-neutral-950/85 zostalaby czarna na jasnym tle.
const NAV_TONES = {
  emerald: {
    idle: "border-emerald-400/20 bg-emerald-400/[0.03]",
    icon: "text-emerald-400",
    chip: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  },
  amber: {
    idle: "border-amber-400/20 bg-amber-400/[0.03]",
    icon: "text-amber-400",
    chip: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  },
  blue: {
    idle: "border-blue-400/20 bg-blue-400/[0.03]",
    icon: "text-blue-400",
    chip: "border-blue-400/40 bg-blue-400/10 text-blue-400",
  },
};

/**
 * Rozdzielacz nad trescia. Bez niego na telefonie widac tylko pierwsza sekcje,
 * wiec klient nie wie, ze nizej sa jeszcze dwa inne rodzaje oferty. Sekcje
 * zostaja rozwiniete: zwijanie chowaloby towar za kliknieciem i za kazdym
 * razem kosztowaloby jedno wejscie w cel, ktorego nikt nie szukal.
 */
function SectionNav({ items, u, innerRef }) {
  if (items.length < 2) return null;
  return (
    <nav ref={innerRef} aria-label={u.navTitle} className="mb-12">
      <h2 className="text-neutral-500 text-[11px] uppercase tracking-wider font-medium mb-3">{u.navTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((it) => {
          const tone = NAV_TONES[it.tone];
          return (
            <a
              key={it.id}
              href={`#${it.id}`}
              className={`section-card group flex flex-col rounded-xl border px-4 py-3 transition-all duration-300 ${tone.idle}`}
            >
              <span className="flex items-center gap-2 mb-1">
                <it.icon className={`w-4 h-4 shrink-0 ${tone.icon}`} />
                <span className="text-white text-sm font-medium">{it.label}</span>
                <span className="ml-auto text-[10px] text-neutral-500 tabular-nums shrink-0">
                  {it.count > 0 ? `${it.count} ${u.items}` : u.empty}
                </span>
              </span>
              <span className="text-neutral-400 text-xs leading-relaxed">{it.hint}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Pasek dzialow. Lezy poza przeplywem i pokazuje sie dopiero, gdy rozdzielacz
 * zniknie z ekranu: przy samej gorze strony powtarzalby tamte kafelki, a nizej
 * jest jedynym sposobem, zeby przeskoczyc do innego dzialu bez przewijania.
 */
function StickySectionTabs({ items, u, navRef }) {
  const [active, setActive] = useState(items[0]?.id || null);
  const [shown, setShown] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const nav = navRef?.current;
    if (!nav || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Pokazujemy tylko po minieciu rozdzielacza w gore, nie przed nim.
        setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(nav);
    return () => observer.disconnect();
  }, [navRef]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = items
      .map((it) => document.getElementById(it.id))
      .filter(Boolean);
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          // Najwyzej polozona widoczna sekcja jest ta, ktora klient czyta.
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: 0 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [items]);

  // Trzymamy aktywna zakladke w polu widzenia paska na waskich ekranach.
  useEffect(() => {
    const bar = ref.current;
    if (!bar || !active) return;
    const chip = bar.querySelector(`[data-tab="${active}"]`);
    if (chip && bar.scrollWidth > bar.clientWidth) {
      const left = chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2;
      bar.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }, [active]);

  if (items.length < 2) return null;

  return (
    <div
      aria-hidden={!shown}
      className={`fixed top-[4.25rem] left-0 right-0 z-30 px-4 sm:px-6 transition-all duration-300 ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div
        ref={ref}
        className="section-tabs max-w-5xl mx-auto flex gap-2 overflow-x-auto rounded-xl px-2 py-2
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it) => {
          const on = it.id === active;
          return (
            <a
              key={it.id}
              href={`#${it.id}`}
              data-tab={it.id}
              aria-current={on ? "true" : undefined}
              tabIndex={shown ? undefined : -1}
              className={`section-tab shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                on ? NAV_TONES[it.tone].chip : "border-transparent text-neutral-400"
              }`}
            >
              <it.icon className="w-3.5 h-3.5" />
              {it.tab}
              <span className="text-[10px] text-neutral-500 tabular-nums">{it.count > 0 ? it.count : "—"}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({ product, lang, u, money, availability }) {
  const isDigital = product.kind === "digital";
  // Stan z bazy, nie ten zapisany w HTML przy wdrozeniu.
  const stock = stockOf(product, availability);
  const status = statusOf(product, availability);
  const soldOut = stock === 0 || status === "sold_out";

  return (
    <Link
      to={`/shop/${product.slug}/`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden
                 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
    >
      <div className="aspect-square bg-black overflow-hidden">
        <img
          src={product.images[0]}
          alt={t(product.title, lang)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {isDigital ? (
            <Badge tone="info"><Download className="w-3 h-3" />{u.digital}</Badge>
          ) : status === "sold_out" ? (
            <Badge tone="warn">{u.soldOutBack}</Badge>
          ) : soldOut ? (
            <Badge tone="warn">{u.outOfStock}</Badge>
          ) : stock === 1 ? (
            <Badge tone="warn">{u.lastOne}</Badge>
          ) : (
            <Badge tone="good"><Package className="w-3 h-3" />{u.inStock}</Badge>
          )}
        </div>

        <h3 className="text-white font-medium text-sm leading-snug mb-1">{t(product.title, lang)}</h3>
        <p className="text-neutral-400 text-xs leading-relaxed mb-3 flex-1">{t(product.short, lang)}</p>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-white font-bold">{money(product.priceGrosze)}</div>
            <PriceReduction product={product} money={money} lang={lang} />
            <div className="text-neutral-500 text-[10px] mt-0.5">
              {isDigital ? u.immediate : `${u.ready} ${product.leadTimeDays} ${u.days}`}
            </div>
          </div>
          <span className="text-neutral-500 group-hover:text-white text-xs flex items-center gap-1 transition-colors">
            {u.details} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ServiceCard({ card, lang, u, money }) {
  return (
    <Link
      to={`/shop/service/${card.id}/`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden
                 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
    >
      <div className="aspect-square bg-black overflow-hidden">
        <img
          src={card.image}
          alt={t(card.title, lang)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {card.quoteOnly ? (
            <Badge tone="warn"><MessageCircle className="w-3 h-3" />{u.quoteBadge}</Badge>
          ) : (
            <Badge tone="neutral"><Wrench className="w-3 h-3" />{u.madeToOrder}</Badge>
          )}
        </div>

        <h3 className="text-white font-medium text-sm leading-snug mb-1">{t(card.title, lang)}</h3>
        <p className="text-neutral-400 text-xs leading-relaxed mb-3 flex-1">{t(card.lead, lang)}</p>

        <div className="flex items-end justify-between">
          <div>
            {card.priceFromGrosze ? (
              <>
                <div className="text-white font-bold">
                  <span className="text-neutral-500 text-xs font-normal">{u.from} </span>
                  {money(card.priceFromGrosze)}
                </div>
                <div className="text-neutral-500 text-[10px] mt-0.5">
                  {u.ready} {card.leadTimeDays} {u.days}
                </div>
              </>
            ) : (
              <>
                <div className="text-amber-300 font-semibold text-sm">{u.quoteBadge}</div>
                <div className="text-neutral-500 text-[10px] mt-0.5">{u.quoteReply}</div>
              </>
            )}
          </div>
          <span className="text-neutral-500 group-hover:text-white text-xs flex items-center gap-1 transition-colors">
            {u.details} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Shop() {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const { money } = useMoney();
  const availability = useAvailability();
  const [query, setQuery] = useState("");
  const [prodFacet, setProdFacet] = useState(null);
  const [persFacet, setPersFacet] = useState(null);
  const [servFacet, setServFacet] = useState(null);

  // Prerender renderuje sciezki bez koncowego ukosnika, przegladarka z nim,
  // wiec porownujemy na znormalizowanej postaci.
  const here = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const category = SHOP_CATEGORIES.find((c) => here === c.path) || null;
  // Pozycja zdjeta ze sklepu znika z list od razu, bez czekania na wdrozenie.
  // Odsiewamy ja tutaj, a nie w kafelku, zeby liczniki nad sekcjami mowily
  // prawde, zamiast liczyc rzeczy, ktorych nie widac.
  const onShelf = (list) => list.filter((p) => statusOf(p, availability) !== "withdrawn");
  const allProducts = onShelf(category ? productsByCategory(category.id) : PRODUCTS);
  const allPersonalized = onShelf(category ? personalizedByCategory(category.id) : PERSONALIZED);
  // Na hubie pokazujemy wszystkie uslugi. Wczesniej lista byla pusta, wiec
  // klient wchodzacy na /shop/ widzial sklep bez zadnej pozycji, mimo ze
  // kart uslug jest kilkanascie.
  const allServices = category ? serviceCardsByCategory(category.id) : SERVICE_CARDS;

  // Szukanie obejmuje wszystkie trzy dzialy naraz, filtr dziala w obrebie dzialu.
  const products = byQuery(allProducts, query, lang);
  const personalized = byQuery(allPersonalized, query, lang);
  const services = byQuery(allServices, query, lang);
  const found = products.length + personalized.length + services.length;

  const subDefs = subcategoriesFor(category?.id);
  const productFacets = facetsWithCounts(subDefs, products, (p) => p.subcategory);
  const personalizedFacets = facetsWithCounts(subDefs, personalized, (p) => p.subcategory);
  const serviceFacets = facetsWithCounts(SERVICE_FACETS, services, serviceFacet);

  // Wybrany filtr moze zniknac razem z wynikami wyszukiwania. Zostawiony
  // trzymalby liste pusta bez widocznego powodu, wiec go wtedy pomijamy.
  const useFacet = (value, facets) => (facets.some((f) => f.id === value) ? value : null);
  const prodFacetOn = useFacet(prodFacet, productFacets);
  const persFacetOn = useFacet(persFacet, personalizedFacets);
  const servFacetOn = useFacet(servFacet, serviceFacets);
  const shownServices = servFacetOn ? services.filter((s) => serviceFacet(s) === servFacetOn) : services;

  const pageTitle = category ? `${t(category.title, lang)}, ${u.title.toLowerCase()}` : u.title;
  const path = category ? category.path : "/shop/";

  // Nawigacja opisuje tylko te dzialy, ktore faktycznie sa na stronie:
  // na hubie nie ma jeszcze kart uslug, bo te naleza do kategorii.
  // Kafelek dostaje pelna nazwe dzialu, zakladka skrocona: trzy dlugie nazwy
  // nie mieszcza sie w pasku na telefonie i zostawialyby widoczna polowe.
  const navItems = [
    { id: "produkty", icon: Package, label: u.products, tab: u.shortProducts, hint: u.hintProducts, count: products.length, tone: "emerald" },
    { id: "personalizowane", icon: Sparkles, label: u.personalized, tab: u.shortPersonalized, hint: u.hintPersonalized, count: personalized.length, tone: "amber" },
    ...(services.length > 0
      ? [{
          id: "uslugi",
          icon: Wrench,
          label: u.services,
          tab: u.shortServices,
          hint: u.hintServices,
          count: services.length,
          tone: category?.theme === "amber" ? "amber" : "blue",
        }]
      : []),
  ];

  return (
    <>
      <SEOHead
        pageKey={category ? `shop_${category.id}` : "shop"}
        path={path}
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "AEJaCA", url: `${SITE.url}/` },
              { name: u.title, url: `${SITE.url}/shop/` },
              ...(category ? [{ name: t(category.title, lang), url: `${SITE.url}${category.path}` }] : []),
            ]
          ),
        ]}
      />

      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            items={[
              ...(category ? [{ label: u.title, href: "/shop/" }] : []),
              { label: category ? t(category.title, lang) : u.title },
            ]}
          />

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">{pageTitle}</h1>
          <p className="text-neutral-400 text-sm mb-10 max-w-2xl leading-relaxed">
            {category ? t(category.lead, lang) : u.lead}
          </p>

          {/* Hub: wybor dzialu */}
          {!category && (
            <div className="grid sm:grid-cols-2 gap-4 mb-14">
              {SHOP_CATEGORIES.map((c) => (
                <Link
                  key={c.id}
                  to={c.path}
                  className={`group p-6 rounded-2xl border transition-all duration-300 ${
                    c.theme === "amber"
                      ? "border-amber-400/20 bg-amber-400/[0.03] hover:border-amber-400/40 hover:bg-amber-400/[0.07]"
                      : "border-blue-400/20 bg-blue-400/[0.03] hover:border-blue-400/40 hover:bg-blue-400/[0.07]"
                  }`}
                >
                  <h2 className="text-white font-semibold mb-1.5">{t(c.title, lang)}</h2>
                  <p className="text-neutral-400 text-xs leading-relaxed mb-3">{t(c.lead, lang)}</p>
                  <span className={`text-xs flex items-center gap-1.5 ${c.theme === "amber" ? "text-amber-400" : "text-blue-400"}`}>
                    {u.details} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          )}

          <SearchBar value={query} onChange={setQuery} u={u} total={found} />

          <SectionNav items={navItems} u={u} innerRef={navRef} />
          <StickySectionTabs items={navItems} u={u} navRef={navRef} />

          {/* Szukanie obejmuje trzy dzialy, wiec pustka tez musi byc jedna,
              zamiast trzech osobnych komunikatow o braku wynikow. */}
          {query && found === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center mb-16">
              <Search className="w-7 h-7 text-neutral-700 mx-auto mb-3" />
              <h3 className="text-white font-medium text-sm mb-1.5">{u.noResults}</h3>
              <p className="text-neutral-500 text-xs leading-relaxed max-w-md mx-auto mb-4">{u.noResultsBody}</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white text-xs transition-colors"
              >
                {u.clear} <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Produkty gotowe. Sekcja zostaje takze wtedy, gdy nic nie mamy:
              milczenie wygladaloby jak brak dzialu, a nie jak stan przejsciowy. */}
          {!query && products.length === 0 && (
            <section id="produkty" className="mb-16 scroll-mt-36">
              <SectionHead
                icon={Package}
                title={u.products}
                lead={u.productsLead}
                count={0}
                tone="emerald"
              />
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
                <Package className="w-7 h-7 text-neutral-700 mx-auto mb-3" />
                <h3 className="text-white font-medium text-sm mb-1.5">{u.noProducts}</h3>
                <p className="text-neutral-500 text-xs leading-relaxed max-w-md mx-auto mb-4">{u.noProductsBody}</p>
                {/* Na hubie kart uslug nie ma, wiec kotwica prowadzilaby w pustke. */}
                {services.length > 0 && (
                  <a
                    href="#uslugi"
                    className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white text-xs transition-colors"
                  >
                    {u.noProductsCta} <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </section>
          )}

          {products.length > 0 && (
            <section id="produkty" className="mb-16 scroll-mt-36">
              <SectionHead
                icon={Package}
                title={u.products}
                lead={u.productsLead}
                count={products.length}
                tone="emerald"
              />
              <FacetBar facets={productFacets} value={prodFacetOn} onChange={setProdFacet} lang={lang} u={u} />
              <ProductList
                items={products}
                facetId={prodFacetOn}
                facets={productFacets}
                lang={lang}
                u={u}
                money={money}
                availability={availability}
              />
            </section>
          )}

          {/* Uslugi */}
          {/* Kolejnosc sekcji odpowiada rosnacej ilosci naszej pracy:
              gotowe, gotowe z personalizacja, wykonywane od nowa. */}
          {(!query || personalized.length > 0) && (
          <section id="personalizowane" className="mb-16 scroll-mt-36">
            <SectionHead
              icon={Sparkles}
              title={u.personalized}
              lead={u.personalizedLead}
              count={personalized.length}
              tone="amber"
            />
            {personalized.length > 0 ? (
              <>
                <FacetBar facets={personalizedFacets} value={persFacetOn} onChange={setPersFacet} lang={lang} u={u} />
                <ProductList
                  items={personalized}
                  facetId={persFacetOn}
                  facets={personalizedFacets}
                  lang={lang}
                  u={u}
                  money={money}
                  availability={availability}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
                <Sparkles className="w-7 h-7 text-neutral-700 mx-auto mb-3" />
                <h3 className="text-white font-medium text-sm mb-1.5">{u.noPersonalized}</h3>
                <p className="text-neutral-500 text-xs leading-relaxed max-w-md mx-auto">{u.noPersonalizedBody}</p>
              </div>
            )}
          </section>
          )}

          {services.length > 0 && (
            <section id="uslugi" className="scroll-mt-36">
              <SectionHead
                icon={Wrench}
                title={u.services}
                lead={u.servicesLead}
                count={services.length}
                tone={category?.theme === "amber" ? "amber" : "blue"}
              />
              <FacetBar facets={serviceFacets} value={servFacetOn} onChange={setServFacet} lang={lang} u={u} />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {shownServices.map((s) => (
                  <ServiceCard key={s.id} card={s} lang={lang} u={u} money={money} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
