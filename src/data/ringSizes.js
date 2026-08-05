// ============================================================
// TABELA ROZMIAROW PIERSCIONKOW
// ============================================================
// Zrodlo dla dwoch narzedzi naraz: konwertera (RingSizeCalc) i miarki do
// wydruku (RingSizerPrint). Wczesniej tabela siedziala w konwerterze, wiec
// dolozenie drugiego narzedzia oznaczaloby dwie kopie tych samych liczb
// i pewne rozjechanie sie ich przy pierwszej korekcie.
//
// `eu` to obwod palca w milimetrach, i jednoczesnie rozmiar w systemie
// europejskim. `dia` to srednica wewnetrzna pierscionka w milimetrach,
// czyli to, co mierzy sie na gotowym pierscionku.

export const RING_SIZES = [
  { eu: 44, dia: 14.0, us: "3",    uk: "F",   jp: 3  },
  { eu: 45, dia: 14.3, us: "3½",   uk: "G",   jp: 4  },
  { eu: 46, dia: 14.6, us: "3½",   uk: "G½",  jp: 5  },
  { eu: 47, dia: 15.0, us: "4",    uk: "H",   jp: 7  },
  { eu: 48, dia: 15.3, us: "4½",   uk: "H½",  jp: 8  },
  { eu: 49, dia: 15.6, us: "5",    uk: "I½",  jp: 9  },
  { eu: 50, dia: 15.9, us: "5½",   uk: "J½",  jp: 10 },
  { eu: 51, dia: 16.2, us: "6",    uk: "K",   jp: 11 },
  { eu: 52, dia: 16.6, us: "6",    uk: "K½",  jp: 12 },
  { eu: 53, dia: 16.9, us: "6½",   uk: "L½",  jp: 13 },
  { eu: 54, dia: 17.2, us: "7",    uk: "M",   jp: 14 },
  { eu: 55, dia: 17.5, us: "7½",   uk: "N",   jp: 15 },
  { eu: 56, dia: 17.8, us: "7½",   uk: "N½",  jp: 16 },
  { eu: 57, dia: 18.1, us: "8",    uk: "O",   jp: 17 },
  { eu: 58, dia: 18.5, us: "8½",   uk: "P",   jp: 18 },
  { eu: 59, dia: 18.8, us: "8½",   uk: "P½",  jp: 19 },
  { eu: 60, dia: 19.1, us: "9",    uk: "Q",   jp: 20 },
  { eu: 61, dia: 19.4, us: "9½",   uk: "Q½",  jp: 21 },
  { eu: 62, dia: 19.7, us: "10",   uk: "R½",  jp: 22 },
  { eu: 63, dia: 20.1, us: "10",   uk: "S",   jp: 23 },
  { eu: 64, dia: 20.4, us: "10½",  uk: "S½",  jp: 24 },
  { eu: 65, dia: 20.7, us: "11",   uk: "T½",  jp: 25 },
  { eu: 66, dia: 21.0, us: "11½",  uk: "U",   jp: 26 },
  { eu: 67, dia: 21.3, us: "11½",  uk: "U½",  jp: 27 },
  { eu: 68, dia: 21.6, us: "12",   uk: "V",   jp: 28 },
  { eu: 70, dia: 22.3, us: "13",   uk: "W½",  jp: 30 },
];

export const MIN_EU = RING_SIZES[0].eu;
export const MAX_EU = RING_SIZES[RING_SIZES.length - 1].eu;
export const MIN_DIA = RING_SIZES[0].dia;
export const MAX_DIA = RING_SIZES[RING_SIZES.length - 1].dia;
