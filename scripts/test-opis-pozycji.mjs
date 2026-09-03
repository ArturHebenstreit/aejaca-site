#!/usr/bin/env node
// ============================================================
// CO KLIENT ZAMOWIL, TAK SAMO W KOSZYKU, W MAILU I NA STRONIE
// ============================================================
// Zgloszenie wlasciciela z 2026-09-03, po prawdziwym zamowieniu AE20260903:
// mail do pracowni niosl surowy JSON parametrow, a potwierdzenie dla klientki
// nie nioslo ich wcale. Pozycja, ktora w koszyku miala dziewiec wierszy ustalen,
// po zaplacie kurczyla sie do nazwy uslugi i kwoty, i to samo pokazywala strona
// zamowienia.
//
// Cztery rzeczy, ktore ten sprawdzian trzyma na miejscu:
//
// 1. KAZDY KALKULATOR NALEZY DO JEDNEJ USLUGI. Na tym stoi cale odtwarzanie
//    opisu: `order_items` nie ma kolumny z identyfikatorem uslugi, wiec usluge
//    rozpoznajemy po kalkulatorze. Gdyby dwie uslugi kiedys dzielily kalkulator,
//    opis wskazywalby cudza karte pytan i pokazywalby klientowi wybory, ktorych
//    nie robil.
//
// 2. NIC SIE NIE GUBI. Pole, ktorego katalog jeszcze nie opisuje, ma wyjsc do
//    pracowni jako surowa para, a nie zniknac.
//
// 3. NIC SIE NIE DUBLUJE. Opis zlecenia, plik i grawery maja w mailu do
//    pracowni wlasne, wyroznione wiersze, wiec w liscie ustalen bylyby drugi raz.
//
// 4. TRZY MIEJSCA MOWIA TO SAMO. Lista dla koszyka, dla maila i dla strony
//    zamowienia powstaje z jednej funkcji, wiec nie moga sie rozjechac.
//
// Uruchamiany w `npm run build`.

import { SERVICES, uslugaKalkulatora } from "../src/data/orderCatalog.js";
import { ustaleniaPozycji, ETYKIETY_USTALEN } from "../src/data/describeParams.js";
import { uslugaPozycji, opisParametrow, parametryNieopisane } from "../chat-api/opisPozycji.js";

let bledy = 0;
const ok = (warunek, opis, co) => {
  if (warunek) console.log("  ok  " + opis);
  else { console.log("  ZLE " + opis + (co === undefined ? "" : "  ->  " + JSON.stringify(co))); bledy += 1; }
};

/** Pozycja z prawdziwego zamowienia AE20260903-CAE3C8A6. */
const POZYCJA = {
  title: "Precious metal casting", qty: 2, calculator: "jewelry_casting",
  file_name: "key_antik_exp.stl",
  params: {
    qtyId: "2-5", metalId: "silver", finishId: "clean", platingId: "none",
    variantId: "model_3d", packagingId: "paper", packagingText: null,
    personalization: null, materialSourceId: "aejaca", packagingTextBack: null,
    description: "key pendant: 2 pcs, sprues & stub removal",
  },
};

console.log("1. Kalkulator wskazuje dokladnie jedna usluge");
{
  const ile = new Map();
  for (const s of SERVICES) ile.set(s.calculator, (ile.get(s.calculator) || 0) + 1);
  const dzielone = [...ile.entries()].filter(([, n]) => n > 1).map(([k]) => k);
  ok(dzielone.length === 0, "zaden kalkulator nie nalezy do dwoch uslug", dzielone);
  ok(uslugaKalkulatora("jewelry_casting") === "precious_metal_casting", "odlew rozpoznany po kalkulatorze");
  ok(uslugaKalkulatora("nie_ma_takiego") === null, "nieznany kalkulator oddaje null, a nie przypadkowa usluge");
  ok(uslugaPozycji(POZYCJA) === "precious_metal_casting", "pozycja z bazy rozpoznaje swoja usluge");
}

console.log("2. Wybory klienta wychodza slowami, nie identyfikatorami");
{
  const opis = opisParametrow(POZYCJA, "pl");
  const tekst = opis.map((w) => `${w.label}: ${w.value}`).join("\n");
  ok(opis.length >= 6, "wszystkie pola karty uslugi maja swoj wiersz", opis.length);
  ok(/Kruszec i próba: Srebro 925/.test(tekst), "kruszec nazwany po ludzku");
  ok(/Zakres wykończenia: Odcięte kanały wlewowe/.test(tekst), "wykonczenie nazwane po ludzku");
  ok(!/metalId|finishId|qtyId/.test(tekst), "zaden identyfikator pola nie wychodzi na zewnatrz", tekst);
}

console.log("3. Nic sie nie gubi i nic nie dubluje");
{
  ok(parametryNieopisane(POZYCJA).length === 0, "opisana pozycja nie zostawia reszty",
    parametryNieopisane(POZYCJA));
  const zNowym = { ...POZYCJA, params: { ...POZYCJA.params, nowenPole: "wartosc" } };
  ok(parametryNieopisane(zNowym).includes("noweńPole=wartosc".replace("ń", "n")),
    "pole, ktorego katalog nie zna, wychodzi surowa para", parametryNieopisane(zNowym));
  // Opis, plik i grawery maja w mailu do pracowni wlasne wiersze.
  const opis = opisParametrow(POZYCJA, "pl").map((w) => w.label);
  ok(!opis.includes(ETYKIETY_USTALEN.pl.description), "opis zlecenia nie stoi w liscie parametrow");
  ok(!opis.includes(ETYKIETY_USTALEN.pl.file), "plik nie stoi w liscie parametrow");
}

console.log("4. Pelne ustalenia to koszyk, mail i strona z jednego zrodla");
{
  const pelne = ustaleniaPozycji({ ...POZYCJA, serviceId: uslugaPozycji(POZYCJA) }, "en");
  const tekst = pelne.map((w) => `${w.label}: ${w.value}`).join("\n");
  ok(/Packaging: /.test(tekst), "opakowanie jest ustaleniem, nie ukrytym parametrem");
  ok(/File: key_antik_exp\.stl/.test(tekst), "nazwa pliku dociera do klienta");
  ok(/Job description: key pendant: 2 pcs, sprues & stub removal/.test(tekst),
    "opis od klienta wraca do niego w potwierdzeniu");
  // To jest cala poanta zgloszenia: pozycja ma miec tresc, a nie sama nazwe.
  ok(pelne.length >= 9, "pozycja niesie komplet ustalen", pelne.length);

  // Ksztalt koszykowy (pola na wierzchu) i bazowy (pola w `params`) daja to samo:
  // inaczej klient widzialby w koszyku co innego niz w potwierdzeniu.
  const koszykowa = {
    serviceId: "precious_metal_casting", qty: 2, fileName: "key_antik_exp.stl",
    packagingId: "paper", description: "key pendant: 2 pcs, sprues & stub removal",
    params: { qtyId: "2-5", metalId: "silver", finishId: "clean", platingId: "none",
              variantId: "model_3d", materialSourceId: "aejaca" },
  };
  const zKoszyka = ustaleniaPozycji(koszykowa, "en").map((w) => `${w.label}: ${w.value}`).join("\n");
  ok(zKoszyka === tekst, "koszyk i baza opisuja pozycje identycznie", { zKoszyka, tekst });
}

console.log("5. Pozycja bez karty uslugi nie wywala opisu");
{
  // Pozycja z oferty ma tresc ustalona przez czlowieka i bywa bez kalkulatora.
  const zOferty = { title: "Wzorzec do odlewu", qty: 1, calculator: null, params: { fromQuote: "WY1" } };
  ok(Array.isArray(opisParametrow(zOferty)) && opisParametrow(zOferty).length === 0,
    "brak karty uslugi daje pusta liste, a nie wyjatek");
  ok(parametryNieopisane(zOferty).length === 0, "numer oferty ma wlasny wiersz, wiec tu go nie ma",
    parametryNieopisane(zOferty));
  ok(ustaleniaPozycji({ ...zOferty, params: null }).length === 0, "pozycja bez parametrow tez przechodzi");
}

console.log(bledy ? `\nBLEDY: ${bledy}` : "\nOpis pozycji: wszystko sie zgadza");
process.exit(bledy ? 1 : 0);
