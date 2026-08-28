// ============================================================
// KREATOR PIERSCIONKOW, STRONA
// ============================================================
// Strona istnieje pod adresem, ale NIE jest nigdzie linkowana, nie ma jej
// w sitemapie i niesie `noindex`. To swiadome: geometria dziala, ale
// proporcje lapek i osadzen wymagaja jeszcze dopracowania, a narzedzie
// w takim stanie nie moze trafic do klientow.
//
// Zdjecie flagi to trzy rzeczy naraz: usuniecie `noindex` stad, wpis
// w `public/sitemap.xml` i przypisanie w `src/data/toolLinks.js`. Dopoki
// zadna z nich nie nastapi, adres zna wylacznie ten, komu go podamy.

import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import RingConfigurator from "../components/calculators/RingConfigurator.jsx";

const LABELS = {
  pl: {
    tag: "Wersja robocza",
    title: "Kreator pierścionków",
    desc: "Złóż pierścionek z parametrów i obejrzyj go z każdej strony. Bryła powstaje z tego samego kodu, który zbuduje plik do druku i odlewu.",
    draftTitle: "To jest wersja robocza",
    draftText: "Geometria liczy się poprawnie i masa jest prawdziwa, ale proporcje łapek i osadzeń nie są jeszcze dopracowane. Strona nie jest publikowana ani linkowana.",
  },
  en: {
    tag: "Draft",
    title: "Ring configurator",
    desc: "Build a ring from parameters and look at it from every angle. The solid comes from the same code that will produce the file for printing and casting.",
    draftTitle: "This is a draft",
    draftText: "The geometry is correct and the mass is real, but the proportions of the claws and settings are not finished. This page is neither published nor linked.",
  },
  de: {
    tag: "Entwurf",
    title: "Ring-Konfigurator",
    desc: "Stellen Sie einen Ring aus Parametern zusammen und betrachten Sie ihn von allen Seiten. Der Körper entsteht aus demselben Code, der später die Datei für Druck und Guss liefert.",
    draftTitle: "Dies ist ein Entwurf",
    draftText: "Die Geometrie stimmt und die Masse ist echt, aber die Proportionen von Krappen und Fassungen sind noch nicht ausgearbeitet. Diese Seite wird weder veröffentlicht noch verlinkt.",
  },
};

export default function RingConfiguratorPage() {
  const { lang } = useLanguage();
  const t = LABELS[lang] || LABELS.pl;

  // `useScrollReveal` obserwuje JEDEN element i zwraca do niego ref. Wywolanie
  // go bez podpiecia refa zostawia klasy `.reveal` na `opacity: 0` i cala
  // strona jest pusta, mimo ze dziala. Wpadlem w to przy pierwszym podejsciu.
  const headRef = useScrollReveal();
  const noteRef = useScrollReveal();
  const toolRef = useScrollReveal();

  // Kreator montujemy dopiero po stronie klienta. Strona jest `noindex`, wiec
  // prerender jego drzewa nic nie wnosi, a narzedzie WebGL z formatowaniem
  // liczb wedlug jezyka to gotowa niezgodnosc przy hydratacji. Serwer i
  // pierwszy render klienta pokazuja to samo, wiec nic sie nie rozjezdza.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <SEOHead pageKey="ringConfigurator" path="/toolsjewelry/kreator/" noindex />

      <section className="mx-auto max-w-6xl px-5 pt-28 pb-10">
        <div ref={headRef} className="reveal">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-4">{t.tag}</p>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight mb-4">{t.title}</h1>
          <p className="max-w-2xl text-neutral-400 leading-relaxed">{t.desc}</p>
        </div>

        <div ref={noteRef} className="reveal mt-7 max-w-2xl rounded-xl border border-white/10 border-l-2 border-l-amber-400/70 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-amber-400 mb-2">{t.draftTitle}</p>
          <p className="text-sm text-neutral-400 leading-relaxed">{t.draftText}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div ref={toolRef} className="reveal">
          {mounted
            ? <RingConfigurator lang={lang} />
            : <div className="rounded-2xl border border-white/10 bg-white/[0.02] h-[560px]" />}
        </div>
      </section>
    </div>
  );
}
