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

export function itnAction({ orderStatus, fulfilledAt, paymentStatus, amountOk }) {
  if (orderStatus === "paid" || orderStatus === "payment_review" || fulfilledAt) return "ignore";
  if (paymentStatus === "SUCCESS") {
    if (amountOk && orderStatus === "awaiting_payment") return "fulfill";
    return "review";
  }
  return "record";
}

export function publicPaymentState(order, now = new Date()) {
  return {
    paymentStatus: order?.payment_status || null,
    canRetryPayment: paymentStartProblem(order, now) === null,
  };
}
