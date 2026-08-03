// ============================================================
// REZYGNACJA I SPRZATANIE ZAMOWIEN
// ============================================================
// Dwie rozne czynnosci, celowo rozdzielone.
//
// REZYGNACJA to zdarzenie w zyciu zamowienia: klient sie rozmyslil, przelew nie
// przyszedl, pomylilismy sie w wycenie. Towar i kod rabatowy wracaja do puli od
// razu, ale wiersz zostaje, bo zamowienie jest dokumentem, nie wpisem roboczym.
// Po pol roku pytanie "dlaczego ta sztuka wrocila na polke" musi miec odpowiedz.
//
// KASOWANIE to sprzatanie po pomylkach i testach. Wolno je robic wylacznie
// wtedy, gdy z zamowieniem nic sie jeszcze nie wydarzylo. Wiersz zamowienia
// kasuje sie kaskadowo razem z pozycjami, rezerwacjami i uzyciami kodu, wiec
// skasowanie czegos, co juz zylo, wymazuje po cichu dowody: komu przyznalismy
// znizke, co zdjelismy ze stanu, za co przyszly pieniadze. Jednorazowy kod
// rabatowy wrocilby przy tym do zycia.
//
// Stad ta lista. Kazdy warunek to slad po zdarzeniu, ktorego nie wolno wymazac.

/** Stany, z ktorych mozna zrezygnowac. Z reszty juz nie ma z czego. */
export const CANCELLABLE_STATUSES = ["draft", "awaiting_payment", "awaiting_transfer"];

/**
 * Powody, dla ktorych zamowienia NIE wolno skasowac. Pusta lista znaczy zgode.
 * Zwracamy wszystkie naraz, a nie pierwszy z brzegu, zeby panel mogl napisac
 * wprost, co stoi na przeszkodzie, zamiast odsylac z kwitkiem bez wyjasnienia.
 */
export function deletionBlockers(facts = {}) {
  const blockers = [];
  if (facts.paidAt) blockers.push("zostalo oplacone");
  if (facts.fulfilledAt) blockers.push("zostalo rozliczone");
  if (facts.transferConfirmedAt) blockers.push("przelew zostal potwierdzony recznie");
  if (facts.paymentNotifications > 0) blockers.push("bramka platnicza przyslala powiadomienie");
  if (facts.consumedReservations > 0) blockers.push("towar zostal zdjety ze stanu");
  if (facts.consumedRedemptions > 0) blockers.push("kod rabatowy zostal uzyty");
  if (facts.downloads > 0) blockers.push("wydano pliki do pobrania");
  if (facts.childOrders > 0) blockers.push("wisi przy nim doplata");
  if (facts.linkedQuotes > 0) blockers.push("powstalo z wyceny");
  return blockers;
}

export function canDelete(facts) {
  return deletionBlockers(facts).length === 0;
}
