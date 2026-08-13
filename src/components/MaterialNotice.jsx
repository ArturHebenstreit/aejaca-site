// ============================================================
// MATERIAL DO GRAWERU I CIECIA: osobna pozycja wyceny
// ============================================================
// Kalkulator laserowy wycenia ROBOCIZNE: czas maszyny, przygotowanie pliku,
// obsluge. Nie wycenia przedmiotu, w ktory ten laser ma wypalic wzor, bo
// tego przedmiotu nie znamy: deska, butelka, skorzany pasek i plyta akrylowa
// to cztery rozne koszty i cztery rozne ustawienia.
//
// Klient tego nie wie i nie ma skad wiedziec. Widzi kwote i przyjmuje, ze
// obejmuje calosc, a potem dowiaduje sie inaczej, i to jest dokladnie ten
// moment, w ktorym traci sie zaufanie. Dlatego mowimy o tym PRZED zakupem,
// przy kwocie, a nie w regulaminie.
//
// Drugi powod istnienia tej informacji jest warsztatowy. Material powierzony
// wymaga proby: ten sam laser na dwoch deskach z tego samego gatunku daje
// inny kontrast, a na nieznanym tworzywie moze uwolnic chlor. Probka nie
// jest formalnoscia, tylko warunkiem wykonania roboty bez ryzyka.

import { Link } from "react-router-dom";
import { Package, Info } from "lucide-react";
import { SELLER } from "../data/sellerInfo.js";

const L = {
  pl: {
    title: "Na czym grawerujemy",
    body: "Powyższa kwota obejmuje wyłącznie wykonanie graweru: czas maszyny, przygotowanie pliku i obsługę. Materiał, na którym powstaje wzór, jest osobną pozycją i ustalamy go na etapie realizacji, bo deska, butelka i pasek to trzy różne koszty.",
    own: "Możesz powierzyć własny materiał.",
    ownWhy: "Potrzebujemy wówczas próbki do testu materiałowego: ten sam laser na dwóch deskach z tego samego gatunku daje inny kontrast, a nieznane tworzywo potrafi przy wypalaniu uwolnić chlor.",
    how: "Jak dostarczyć przedmiot",
    locker: "Paczkomat InPost",
    courier: "Kurierem lub pocztą wyjątkowo, z zagranicy i stamtąd, gdzie InPost nie dowozi",
    contact: "dane kontaktowe",
  },
  en: {
    title: "What we engrave on",
    body: "The amount above covers the engraving alone: machine time, file preparation and handling. The material the design is made on is a separate item, agreed at the production stage, because a board, a bottle and a strap are three different costs.",
    own: "You may supply your own material.",
    ownWhy: "We would then need a sample for a material test: the same laser gives a different contrast on two boards of the same species, and an unknown plastic can release chlorine when burned.",
    how: "How to send us the item",
    locker: "InPost parcel locker",
    courier: "By courier or post as an exception, from abroad and where InPost does not deliver",
    contact: "contact details",
  },
  de: {
    title: "Worauf wir gravieren",
    body: "Der Betrag oben umfasst allein die Gravur: Maschinenzeit, Dateivorbereitung und Handling. Das Material, auf dem das Motiv entsteht, ist eine eigene Position und wird bei der Ausführung festgelegt, denn ein Brett, eine Flasche und ein Riemen sind drei verschiedene Kosten.",
    own: "Sie können eigenes Material beistellen.",
    ownWhy: "Wir bräuchten dann eine Probe für einen Materialtest: derselbe Laser ergibt auf zwei Brettern derselben Holzart einen anderen Kontrast, und ein unbekannter Kunststoff kann beim Brennen Chlor freisetzen.",
    how: "So senden Sie uns das Objekt",
    locker: "InPost-Paketstation",
    courier: "Per Kurier oder Post ausnahmsweise, aus dem Ausland und wo InPost nicht zustellt",
    contact: "Kontaktdaten",
  },
};

export default function MaterialNotice({ lang = "pl", className = "" }) {
  const t = L[lang] || L.pl;

  return (
    <div className={`rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Info size={15} className="text-amber-300 shrink-0" />
        <h4 className="text-[13px] font-medium text-amber-200">{t.title}</h4>
      </div>

      <p className="text-[12.5px] leading-relaxed text-neutral-300">{t.body}</p>

      <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-300">
        <b className="font-medium text-neutral-100">{t.own}</b> {t.ownWhy}
      </p>

      <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Package size={14} className="text-amber-300 shrink-0" />
          <span className="text-[11px] uppercase tracking-[0.1em] text-neutral-400">{t.how}</span>
        </div>
        <p className="text-[12.5px] text-neutral-300">
          {t.locker}{" "}
          <b className="font-mono font-medium text-amber-300">{SELLER.inpostLocker.code}</b>
        </p>
        <p className="mt-1 text-[12.5px] text-neutral-300">
          {t.courier}: {SELLER.shippingName}, {SELLER.addressLines.join(", ")},{" "}
          {SELLER.country[lang] || SELLER.country.pl}.{" "}
          <Link to="/contact" className="text-amber-300/90 underline underline-offset-2">{t.contact}</Link>
        </p>
      </div>
    </div>
  );
}
