import assert from "node:assert/strict";
import {
  itnAction, paymentStartProblem, publicPaymentState,
} from "./paymentState.js";

const future = "2026-09-01T00:00:00.000Z";
const now = new Date("2026-08-23T12:00:00.000Z");
const awaiting = {
  status: "awaiting_payment",
  fulfilled_at: null,
  payment_method: "autopay",
  payment_status: "FAILURE",
  expires_at: future,
};

assert.equal(paymentStartProblem(awaiting, now), null);
assert.deepEqual(publicPaymentState(awaiting, now), {
  paymentStatus: "FAILURE",
  canRetryPayment: true,
});

assert.deepEqual(publicPaymentState({ ...awaiting, payment_status: "PENDING" }, now), {
  paymentStatus: "PENDING",
  canRetryPayment: true,
});
assert.deepEqual(publicPaymentState({ ...awaiting, payment_status: null }, now), {
  paymentStatus: null,
  canRetryPayment: true,
});

assert.equal(paymentStartProblem({ ...awaiting, status: "cancelled" }, now), "unavailable");
assert.equal(paymentStartProblem({ ...awaiting, payment_method: "bank_transfer" }, now), "wrong_method");
assert.equal(paymentStartProblem({ ...awaiting, expires_at: "2026-08-22T00:00:00.000Z" }, now), "expired");
assert.equal(paymentStartProblem({ ...awaiting, status: "paid", fulfilled_at: future }, now), "already_paid");

assert.equal(itnAction({
  orderStatus: "awaiting_payment", fulfilledAt: null,
  paymentStatus: "SUCCESS", amountOk: true,
}), "fulfill");
assert.equal(itnAction({
  orderStatus: "awaiting_payment", fulfilledAt: null,
  paymentStatus: "FAILURE", amountOk: true,
}), "record");
assert.equal(itnAction({
  orderStatus: "paid", fulfilledAt: future,
  paymentStatus: "FAILURE", amountOk: true,
}), "ignore", "FAILURE po SUCCESS nie moze cofnac oplaconego zamowienia");

assert.equal(itnAction({
  orderStatus: "cancelled", fulfilledAt: null,
  paymentStatus: "SUCCESS", amountOk: true,
}), "review", "SUCCESS po anulowaniu wymaga decyzji czlowieka");
assert.equal(itnAction({
  orderStatus: "expired", fulfilledAt: null,
  paymentStatus: "SUCCESS", amountOk: true,
}), "review", "SUCCESS po wygasnieciu nie moze odtworzyc rezerwacji");
assert.equal(itnAction({
  orderStatus: "awaiting_payment", fulfilledAt: null,
  paymentStatus: "SUCCESS", amountOk: false,
}), "review", "SUCCESS z inna kwota wymaga decyzji czlowieka");
assert.equal(itnAction({
  orderStatus: "payment_review", fulfilledAt: null,
  paymentStatus: "SUCCESS", amountOk: true,
}), "ignore", "powtorzony SUCCESS nie moze wyslac drugiego alertu");
console.log("Stan platnosci: wszystkie sprawdzenia przeszly");
