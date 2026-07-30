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

  // Adres prowadzenia działalności i do korespondencji: wirtualne biuro
  // wynajęte od NOWY ŚWIAT 33 Sp. z o.o., umowa z 30.07.2026, obowiązuje od
  // 01.08.2026. Umowa (§ 1 ust. 1) wprost dopuszcza rejestrację siedziby i
  // adres do korespondencji, więc spełnia obowiązek z art. 12 ust. 1 pkt 2
  // ustawy o prawach konsumenta.
  //
  // UWAGA, dwie rzeczy, których nie wolno pomylić:
  //  1. To NIE jest lokalizacja pracowni. Pracownia i odbiór osobisty
  //     pozostają w Józefosławiu i tak też ma zostać w schemacie
  //     LocalBusiness, na stronach lokalnych i w Shipping.jsx.
  //  2. Tego adresu NIE wpisujemy do wizytówki Google. Google zakazuje
  //     wirtualnych biur w profilu firmy, grozi to zawieszeniem.
  addressLines: ["ul. Nowy Świat 33 lok. 13", "00-029 Warszawa"],
  hasFullPostalAddress: true,

  // Miejsce wykonywania prac i odbioru osobistego, celowo osobne pole.
  workshopLocality: "Józefosław, gmina Piaseczno",

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
