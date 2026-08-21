// ============================================================
// KOREKTY STAWEK, KTORE ZDAZYLY JUZ TRAFIC DO BAZY
// ============================================================
// Tabela `material_stock` zaklada sie RAZ, a zestaw startowy wchodzi z
// `ON CONFLICT DO NOTHING`, zeby wdrozenie nie kasowalo poprawek wlasciciela
// zrobionych w panelu. Skutek uboczny jest taki, ze zla wartosc startowa
// zostaje w bazie na zawsze: poprawiamy ja w repozytorium, build przechodzi na
// zielono, a klient dalej widzi stara cene. Awaria jest cicha w najgorszy
// mozliwy sposob, bo WSZYSTKO wyglada na zrobione.
//
// Zdarzylo sie to przy plycie HDF. Wlasciciel zauwazyl, ze liczymy ja drozej
// od sklejki, choc jest tansza; poprawilismy zestaw startowy z 42 na 22 zl za
// metr i dopiero potem wyszlo, ze do zywej tabeli to nie dojdzie.
//
// Stad ta lista. Kazda pozycja to JEDNA korekta, wykonywana RAZ, zapisywana
// w bazie, zeby sie nie powtorzyla.
//
// DWIE WLASNOSCI, KTORE TRZYMAJA TO PRZY ZYCIU:
//
//   1. `from` NIE JEST OZDOBNIKIEM. Korekta zmienia wiersz tylko wtedy, gdy
//      stoi w nim DOKLADNIE ta stara wartosc. Jesli wlasciciel zdazyl juz
//      poprawic cene z panelu, korekta nie robi nic, zamiast cofac mu reke.
//      Bez tego warunku wdrozenie kasowaloby decyzje wlasciciela, i to po
//      cichu, bo cena po prostu wracalaby do liczby z kodu.
//   2. `to` MUSI ZGADZAC SIE Z ZESTAWEM STARTOWYM. Inaczej nowa baza dostaje
//      jedna liczbe, a stara druga, i mamy dwie prawdy zaleznie od tego, kiedy
//      ktos zalozyl instancje. Pilnuje tego `scripts/test-material-stock.mjs`.
//
// Pozycji NIE USUWAMY po wdrozeniu. Lista jest zapisem tego, co zmienialismy
// w cudzych danych, a instancja zalozona wczesniej moze dopiero teraz wstac.

export const MATERIAL_CORRECTIONS = [
  {
    id: "hdf-2026-08-21",
    material_id: "mdf8",
    from_pln_per_m2: 42,
    to_pln_per_m2: 22,
    reason: "HDF surowe jest tansze od sklejki, a liczylismy je drozej (Castorama, sierpien 2026)",
  },
];
