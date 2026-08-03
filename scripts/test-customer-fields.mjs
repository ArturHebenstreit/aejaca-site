// Kontrola danych klienta. Ta sama funkcja pilnuje formularza i zamowienia
// na serwerze, wiec bledny przypadek tutaj to bledna paczka w realu.

import assert from "node:assert/strict";
import {
  validateEmail, validateName, validatePhone, validateCustomer, normalizePhone,
} from "../src/shop/customerFields.js";

// --- Adres e-mail ---
assert.equal(validateEmail("artur.hebenstreit@gmail.com"), null);
assert.equal(validateEmail("  a@b.pl  "), null, "spacje po bokach nie sa bledem");
assert.equal(validateEmail("wweee"), "format", "to wlasnie przechodzilo wczesniej");
assert.equal(validateEmail("a@b"), "format");
assert.equal(validateEmail("a b@c.pl"), "format");
assert.equal(validateEmail(""), "required");
assert.equal(validateEmail(null), "required");

// --- Imie i nazwisko ---
assert.equal(validateName("Artur Hebenstreit"), null);
assert.equal(validateName("Anna Nowak-Kowalska"), null);
assert.equal(validateName("Jean-Luc Picard"), null);
assert.equal(validateName("Zoë Müller"), null, "znaki diakrytyczne to nie blad");
assert.equal(validateName("  Jan   Kowalski "), null, "nadmiar spacji sam sie prostuje");
assert.equal(validateName("aArtur"), "full_name", "samo imie nie wystarczy na etykiete");
assert.equal(validateName("Artur"), "full_name");
assert.equal(validateName("A B"), "full_name", "jednoliterowe czlony to nie nazwisko");
assert.equal(validateName("Jan Kowalski 2"), "format", "cyfry w nazwisku to pomylka");
assert.equal(validateName(""), "required");

// --- Telefon ---
assert.equal(validatePhone("601234567"), null, "dziewiec cyfr, numer krajowy");
assert.equal(validatePhone("601 234 567"), null, "spacje sa dla oka");
assert.equal(validatePhone("601-234-567"), null);
assert.equal(validatePhone("+48601234567"), null);
assert.equal(validatePhone("48601234567"), null);
assert.equal(validatePhone("0048601234567"), null);
assert.equal(validatePhone("+49 170 1234567"), null, "numer zagraniczny tez ma dzialac");
assert.equal(validatePhone("2342342342342rrrr"), "format", "to wlasnie przechodzilo wczesniej");
assert.equal(validatePhone("2342342342342"), "format", "trzynascie cyfr bez plusa to nie numer");
assert.equal(validatePhone("60123456"), "format", "osiem cyfr to za malo");
assert.equal(validatePhone("+1234567"), "format", "siedem cyfr z plusem to za malo");
assert.equal(validatePhone("+1234567890123456"), "format", "szesnascie cyfr to za duzo");
assert.equal(validatePhone(""), "required");

assert.equal(normalizePhone(" 601-234 567 "), "601234567");
assert.equal(normalizePhone("+48 (601) 234 567"), "+48601234567");

// --- Komplet ---
assert.deepEqual(
  validateCustomer({ email: "a@b.pl", name: "Jan Kowalski", phone: "601234567" }),
  {},
  "poprawny komplet nie zglasza nic"
);
assert.deepEqual(
  validateCustomer({ email: "wweee", name: "aArtur", phone: "2342342342342rrrr" }),
  { email: "format", name: "full_name", phone: "format" },
  "wszystkie bledy naraz, zeby klient poprawil je za jednym razem"
);
assert.deepEqual(validateCustomer({}), { email: "required", name: "required", phone: "required" });
assert.deepEqual(validateCustomer(), { email: "required", name: "required", phone: "required" });

console.log("Dane klienta: wszystkie sprawdzenia przeszly");
