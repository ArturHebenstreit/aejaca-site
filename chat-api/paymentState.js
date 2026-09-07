// Reguly przejsc stanu platnosci sa czyste i testowalne poza serwerem HTTP.
// Najwazniejsze: nieudana pozniejsza proba nie cofa zamowienia juz oplaconego.

export function paymentStartProblem(order, now = new Date()) {
  if (!order) return "not_found";
  if (order.status === "paid" || order.fulfilled_at) return "already_paid";
  if ((order.payment_method || "autopay") !== "autopay") return "wrong_method";
  if (order.status !== "awaiting_payment") return "unavailable";
  if (order.expires_at && new Date(order.expires_at) < now) return "expired";
  return null;
}

/**
 * Czy nieoplacone zamowienie da sie WSKRZESIC zamiast odmawiac zaplaty.
 *
 * Zasada wlasciciela z 2026-09-07: porzucenie platnosci w bramce ma skonczyc
 * sie stanem takim, jakby nigdy nie bylo zaplaty, i ma pozwolic zaplacic
 * nowa transakcja. Klient, ktoremu w banku zabraklo pieniedzy albo ktory po
 * prostu zamknal karte, wraca po godzinie i naciska "Zaplac" jeszcze raz.
 *
 * Do tego dnia dostawal odmowe: `paymentStartProblem` widzial zamowienie po
 * terminie (`expired`) albo w stanie innym niz "czeka na platnosc"
 * (`unavailable`) i konczyl droge. Bylo to karanie jedynej osoby, ktora chce
 * kupic: przy zamowieniu z oferty nikt inny o te pozycje nie konkuruje.
 *
 * Wskrzeszamy WYLACZNIE to, co nigdy nie zostalo zaplacone i czego nikt nie
 * zamknal. Zaplacone, rozliczone, odwolane i czekajace na nasz przeglad
 * zostaja tam, gdzie sa: kazde z nich znaczy, ze ktos juz podjal decyzje.
 */
export function canRevivePayment(order) {
  if (!order) return false;
  if (order.paid_at || order.status === "paid" || order.fulfilled_at) return false;
  if (order.cancelled_at || order.status === "cancelled") return false;
  if (order.status === "payment_review") return false;
  if ((order.payment_method || "autopay") !== "autopay") return false;
  return order.status === "awaiting_payment" || order.status === "expired";
}

/** Powody odmowy, ktore wskrzeszenie potrafi cofnac. */
export const REVIVABLE_PROBLEMS = ["expired", "unavailable"];

export function itnAction({ orderStatus, fulfilledAt, paymentStatus, amountOk }) {
  if (orderStatus === "paid" || orderStatus === "payment_review" || fulfilledAt) return "ignore";
  if (paymentStatus === "SUCCESS") {
    if (amountOk && orderStatus === "awaiting_payment") return "fulfill";
    return "review";
  }
  return "record";
}

export function publicPaymentState(order, now = new Date()) {
  const problem = paymentStartProblem(order, now);
  return {
    paymentStatus: order?.payment_status || null,
    // Przycisk zaplaty pokazujemy takze wtedy, gdy zamowienie trzeba najpierw
    // wskrzesic: dla klienta to jest jedna czynnosc, a nie dwie, i nie ma
    // powodu, zeby najpierw zobaczyl ekran bez wyjscia.
    canRetryPayment: problem === null
      || (REVIVABLE_PROBLEMS.includes(problem) && canRevivePayment(order)),
  };
}
