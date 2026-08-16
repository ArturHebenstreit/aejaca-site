// ============================================================
// JAK KLIENT DOSTARCZA NAM SWOJ PRZEDMIOT
// ============================================================
// To jest kierunek ODWROTNY do `DELIVERY_METHODS` w `orderCatalog.js`. Tamto
// opisuje, jak paczka jedzie OD NAS DO KLIENTA. To opisuje, jak przedmiot
// klienta trafia DO PRACOWNI: wlasna deska pod grawer, wlasne kamienie,
// pierscionek do naprawy.
//
// DLACZEGO TO MUSI BYC ZADEKLAROWANE PRZED ZAPLATA
//
// Bez tej deklaracji zamowienie jest oplacone, a robota stoi: nie wiadomo,
// czy czekac na paczke, czy na klienta pod drzwiami, ani kiedy. Kazda taka
// pozycja konczy sie wymiana maili, a przy zamowieniu z zagranicy takze
// odkryciem, ze klient wybral sposob, ktory u niego nie istnieje.
//
// REGULA WLASCICIELA, 2026-08-16:
//   Polska      -> paczkomat InPost albo osobiscie
//   zagranica   -> wylacznie kurier
//
// Kurier z Polski jest wylaczony CELOWO, a nie przez przeoczenie: paczkomat
// jest tanszy i nie wymaga, zeby ktos byl na miejscu o okreslonej porze.
// Odbior osobisty z zagranicy nie jest wylaczony z uprzejmosci, tylko dlatego,
// ze nikt nie przyjedzie z Berlina z deska pod pache.

const L = (pl, en, de) => ({ pl, en, de });

export const INBOUND_METHODS = [
  {
    id: "inpost_locker",
    kraje: "PL",
    label: L("Paczkomat InPost", "InPost parcel locker", "InPost-Paketstation"),
    note: L(
      "Nadaj na nasz paczkomat. Numer podamy w potwierdzeniu zamowienia.",
      "Send it to our parcel locker. We give the code in the order confirmation.",
      "An unsere Paketstation senden. Den Code nennen wir in der Bestellbestaetigung.",
    ),
  },
  {
    id: "in_person",
    kraje: "PL",
    label: L("Osobiscie", "In person", "Persoenlich"),
    note: L(
      "Jozefoslaw, gmina Piaseczno, po wczesniejszym uzgodnieniu terminu.",
      "Jozefoslaw near Warsaw, by prior arrangement.",
      "Jozefoslaw bei Warschau, nach Absprache.",
    ),
  },
  {
    id: "courier",
    kraje: "ZAGRANICA",
    label: L("Kurierem", "By courier", "Per Kurier"),
    note: L(
      "Z zagranicy przyjmujemy wylacznie przesylki kurierskie. Adres podamy w potwierdzeniu.",
      "From abroad we accept courier shipments only. We give the address in the confirmation.",
      "Aus dem Ausland nehmen wir ausschliesslich Kuriersendungen an. Die Adresse nennen wir in der Bestaetigung.",
    ),
  },
];

/**
 * Sposoby dostarczenia dozwolone dla danego kraju.
 *
 * Kraj bierzemy z zamowienia, bo tam klient juz go wybral. Pytanie o niego
 * drugi raz w kalkulatorze dawaloby dwie odpowiedzi, ktore moglyby sie roznic,
 * i trzeba by rozstrzygac, ktora jest prawdziwa.
 */
export function inboundOptionsFor(country) {
  const pl = String(country || "PL").toUpperCase() === "PL";
  return INBOUND_METHODS.filter((m) => (pl ? m.kraje === "PL" : m.kraje === "ZAGRANICA"));
}

/** Czy dany sposob wolno wybrac przy tym kraju. Ta sama funkcja liczy po obu stronach. */
export function inboundAllowed(method, country) {
  return inboundOptionsFor(country).some((m) => m.id === method);
}

/**
 * Uslugi, przy ktorych klient ZAWSZE cos przysyla.
 *
 * Naprawa i renowacja nie maja innego wejscia niz wlasna bizuteria klienta:
 * nie ma tu pliku, nie ma katalogu, jest przedmiot, ktory trzeba miec w rece.
 * Przeglad calego katalogu (2026-08-16) nie znalazl trzeciej takiej uslugi.
 */
export const USLUGI_Z_PRZESYLKA = ["jewelry_repair", "jewelry_renovation"];

/**
 * Czy ta pozycja wymaga, zeby klient cos do nas przyslal.
 *
 * Dwa zrodla, bo sa dwa rozne przypadki. Pierwszy wynika z samej uslugi
 * i klient nie ma tu wyboru. Drugi jest wyborem: przy laserze material moze
 * byc nasz albo powierzony, i dopiero powierzony rodzi przesylke.
 *
 * Ta sama funkcja liczy w przegladarce i na serwerze. Dwie kopie tej reguly
 * rozjechalyby sie przy pierwszej nowej usludze, a objawem bylby blad przy
 * platnosci, czyli w najgorszym mozliwym miejscu.
 */
export function wymagaPrzesylki(item) {
  if (!item) return false;
  if (USLUGI_Z_PRZESYLKA.includes(String(item.calculator || ""))) return true;
  // Porownanie jest TOLERANCYJNE celowo. Wybor jedzie przez formularz, koszyk
  // i JSON, a po tej drodze logiczna prawda potrafi zamienic sie w napis.
  // Gdyby zostalo samo `=== true`, napis "true" znaczylby "material nasz"
  // i deklaracja dostarczenia po cichu by sie nie wlaczyla, czyli wrocilaby
  // dokladnie ta wada, ktora tu naprawiamy. Sprawdzian pilnuje osobno, ze
  // katalog trzyma wartosci logiczne, wiec tolerancja lata skutek, a nie
  // przykrywa przyczyne.
  const w = item.params?.ownMaterial;
  return w === true || w === "true";
}
