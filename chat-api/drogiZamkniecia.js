// ============================================================
// CZTERY DROGI WYJSCIA ZE SPRAWY, KAZDA Z INNA KWOTA
// ============================================================
// "Anulowane" bylo dotad jednym slowem na cztery rozne zdarzenia, ktore
// regulamin rozroznia i ktore roznia sie tym, ILE PIENIEDZY WRACA. Jeden
// przycisk sklejalby je w jedno i za pol roku nie dalo by sie odpowiedziec,
// czemu przy jednej sprawie wrocilo wszystko, a przy drugiej nic.
//
// Rozroznienie nie jest formalnoscia. Przy trzech pierwszych drogach zwrot
// jest OBOWIAZKIEM z regulaminu, przy czwartej jest decyzja handlowa. Zapis
// drogi to jedyna rzecz, ktora po czasie odpowie na pytanie, czy pieniadze
// wrocily, bo tak trzeba bylo, czy dlatego, ze tak chcielismy.
//
// Kwota zwrotu STOI OSOBNO od stanu sprawy. Sprawa zamknieta bez realizacji ma
// jeden stan, `cancelled`, a to, czy i ile pieniedzy wrocilo, mowia
// `refund_grosze` i `refunded_at`. Drugi stan koncowy ("zwrocone") znaczylby,
// ze "anulowane" zaczyna znaczyc "anulowane, ale pieniadze jeszcze wisza",
// czyli dwie nazwy na jedna rzecz i pytanie bez odpowiedzi przy kazdej z nich.

/** Etapy, na ktorych sprawa jeszcze nie wyszla z pracowni. */
const PRZED_WYDANIEM = [
  "awaiting_transfer", "payment_review", "paid", "details", "queued",
  "in_production", "ready",
];

/** Etapy po wydaniu rzeczy klientowi. */
const PO_WYDANIU = ["shipped", "completed"];

export const DROGI_ZAMKNIECIA = [
  {
    id: "odstapienie_14",
    label: "Odstąpienie klienta w 14 dni",
    // Prawo z ustawy o prawach konsumenta, wiec dziala takze PO wydaniu rzeczy:
    // to jest wlasnie ten przypadek, w ktorym klient odsyla paczke.
    opis: "Towar z półki, kupiony na odległość. Wracają pieniądze razem z najtańszą wysyłką.",
    zwrot: "pelny",
    terminDni: 14,
    etapy: [...PRZED_WYDANIEM, ...PO_WYDANIU],
    // Przy rzeczy robionej na miare tego prawa nie ma (regulamin par. 11,
    // art. 38 pkt 3 UPK), a informujemy o tym PRZED zamowieniem. Panel wiec
    // ostrzega, zamiast blokowac: to, czy dana sztuka byla robiona na miare,
    // wie czlowiek, a nie kolumna w tabeli.
    ostrzezenieNaZamowienie:
      "Przy rzeczy robionej na zamówienie to prawo nie przysługuje (regulamin par. 11). Wybierz je tylko dla towaru z półki.",
  },
  {
    id: "nasza_wina",
    label: "Odstąpienie, bo nie dowieźliśmy",
    opis: "Klient nie przyjął nowego terminu albo plik miał wadę uniemożliwiającą pracę. Regulamin obiecuje zwrot wszystkich kwot w 14 dni.",
    zwrot: "pelny",
    terminDni: 14,
    etapy: PRZED_WYDANIEM,
  },
  {
    id: "nasza_decyzja",
    label: "Anulowanie naszą decyzją",
    opis: "Nie podejmujemy się tej roboty. Wraca wszystko, co klient wpłacił.",
    zwrot: "pelny",
    terminDni: 14,
    etapy: PRZED_WYDANIEM,
  },
  {
    id: "rezygnacja_klienta",
    label: "Rezygnacja klienta z rzeczy na zamówienie",
    opis: "Prawa do odstąpienia tu nie ma, więc kwota zwrotu jest Twoją decyzją. Domyślnie zero, bo materiał bywa już kupiony.",
    zwrot: "decyzja",
    terminDni: 14,
    etapy: PRZED_WYDANIEM,
  },
];

export const IDENTYFIKATORY_DROG = DROGI_ZAMKNIECIA.map((d) => d.id);

export function drogaZamkniecia(id) {
  return DROGI_ZAMKNIECIA.find((d) => d.id === id) || null;
}

/** Drogi dostepne na danym etapie sprawy. */
export function drogiNaEtapie(status) {
  return DROGI_ZAMKNIECIA.filter((d) => d.etapy.includes(status));
}

/**
 * Ile pieniedzy nalezy sie z powrotem, zanim czlowiek to poprawi.
 *
 * Przy trzech pierwszych drogach to obowiazek, wiec podpowiadamy cala kwote
 * zaplacona. Przy czwartej podpowiadamy zero, bo nic sie nie nalezy, a kwota
 * jest decyzja. W obie strony da sie ja w panelu zmienic: podpowiedz ma
 * oszczedzic liczenia, a nie zastapic decyzje.
 */
export function domyslnyZwrotGrosze(droga, order) {
  if (!droga || !order?.paid_at) return 0;
  return droga.zwrot === "pelny" ? Number(order.total_grosze || 0) : 0;
}
