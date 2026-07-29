// Dane podmiotu w JEDNYM miejscu.
//
// Wymóg z MDs/AEJaCA_Shop_Plan.md 5.3c: po założeniu spółki zmienia się nazwa,
// forma prawna, NIP i adres. Ma to być zmiana tego pliku, a nie polowanie po
// komponentach. Nic poniżej nie może być wpisane na sztywno gdzie indziej.

export const SELLER = {
  // Osoba fizyczna prowadząca działalność nierejestrowaną (art. 5 ust. 1 Prawa
  // przedsiębiorców). Brak NIP i REGON jest stanem zgodnym z prawem, a nie
  // brakiem danych. Identyfikatorem podatkowym jest PESEL, którego się nie
  // publikuje.
  legalForm: "unregistered", // "unregistered" | "sole-trader" | "company"
  legalName: "Artur Hebenstreit",
  brandName: "AEJaCA",
  taxId: null, // NIP, dopiero po rejestracji
  registryId: null, // REGON / KRS, dopiero po rejestracji

  email: "contact@aejaca.com",
  phone: "+48 780 737 786",
  phoneHref: "tel:+48780737786",

  // TODO przed uruchomieniem sprzedaży: pełny adres do korespondencji.
  // Konsument musi mieć dokąd wysłać oświadczenie o odstąpieniu i reklamację
  // drogą pocztową, a adres pracowni jest adresem prywatnym i nie jest
  // publikowany. Rozwiązaniem jest skrytka pocztowa w Piasecznie.
  // Do tego czasu podajemy tylko lokalizację, tak jak w schemacie
  // LocalBusiness, i kanał elektroniczny jako podstawowy.
  addressLines: ["Józefosław", "gmina Piaseczno, woj. mazowieckie"],
  hasFullPostalAddress: false,

  // Bramka płatnicza. Patrz Shop Plan 5.3a. Klucz (hash) NIGDY tutaj,
  // wyłącznie w zmiennych środowiskowych backendu.
  paymentProvider: {
    name: "Autopay S.A.",
    methods: { pl: "BLIK, szybki przelew online (PBL), przelew tradycyjny" },
    currency: "PLN",
    cardsAvailable: false,
  },

  vatPayer: false,
  salesDocument: "rachunek", // faktura dopiero po rejestracji
};

export default SELLER;
