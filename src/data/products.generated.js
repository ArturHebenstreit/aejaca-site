// ============================================================
// KATALOG PRODUKTOW, ODCISK BAZY
// ============================================================
// PLIK GENEROWANY. Nie edytuj recznie, zmiany przepadna przy najblizszym
// `npm run products:pull`.
//
// Sklep jest budowany statycznie, a strony produktow musza istniec jako pliki,
// wiec tresc katalogu wchodzi do repozytorium jako odcisk bazy zrobiony przed
// wdrozeniem. Zdjecia i tak leza w repozytorium, wiec nowy produkt zawsze
// oznacza wdrozenie i te dwie rzeczy ida razem.
//
// Stan magazynowy z tego pliku jest tylko punktem wyjscia. Aktualna dostepnosc
// strona dopytuje na zywo pod /api/products, zeby sprzedana sztuka przestala
// zachecac do zakupu, nie czekajac na kolejne wdrozenie.

export const GENERATED_AT = "2026-08-03T04:29:00.711Z";

export const PRODUCTS_FROM_DB = [
  {
    "slug": "pierscionek-granat-zloto-585",
    "category": "jewelry",
    "subcategory": "women",
    "offer": "ready",
    "kind": "physical",
    "status": "live",
    "title": {
      "pl": "Pierścionek z granatem, złoto 585",
      "en": "Garnet ring, 14K gold",
      "de": "Granatring, 585er Gold"
    },
    "short": {
      "pl": "Odlewany ręcznie, naturalny granat w oprawie krapowej.",
      "en": "Hand-cast, natural garnet in a prong setting.",
      "de": "Handgegossen, natürlicher Granat in Krappenfassung."
    },
    "description": {
      "pl": "Pierścionek wykonany metodą odlewu na wosk tracony, z modelu przygotowanego w CAD i wydrukowanego w żywicy odlewniczej. Kamień to naturalny granat almandyn o średnicy 6 mm, osadzony w czterokrapowej oprawie, która pozostawia go widocznym z boku i przepuszcza światło.\n\nPowierzchnia polerowana lustrzanie, wnętrze obrączki wygładzone i zaokrąglone, żeby nie zaczepiało o skórę. Każdy egzemplarz powstaje osobno, więc drobne różnice w rysunku kamienia są naturalne.",
      "en": "Cast using the lost-wax method from a CAD model printed in castable resin. The stone is a natural almandine garnet, 6 mm across, held in a four-prong setting that leaves it visible from the side and lets light through.\n\nMirror-polished surface, with the inside of the band smoothed and rounded so it does not catch on the skin. Each piece is made individually, so slight differences in the stone are natural.",
      "de": "Im Wachsausschmelzverfahren gegossen, aus einem CAD-Modell in Gießharz gedruckt. Der Stein ist ein natürlicher Almandin-Granat mit 6 mm Durchmesser in einer Vierkrappenfassung, die ihn seitlich sichtbar lässt und Licht durchlässt.\n\nSpiegelpolierte Oberfläche, die Ringinnenseite geglättet und gerundet. Jedes Stück entsteht einzeln, kleine Unterschiede im Stein sind natürlich."
    },
    "specs": [
      {
        "label": {
          "pl": "Kruszec",
          "en": "Metal",
          "de": "Metall"
        },
        "value": {
          "pl": "Złoto 585 (14K)",
          "en": "14K gold (585)",
          "de": "585er Gold (14K)"
        }
      },
      {
        "label": {
          "pl": "Kamień",
          "en": "Stone",
          "de": "Stein"
        },
        "value": {
          "pl": "Granat almandyn, 6 mm",
          "en": "Almandine garnet, 6 mm",
          "de": "Almandin-Granat, 6 mm"
        }
      },
      {
        "label": {
          "pl": "Oprawa",
          "en": "Setting",
          "de": "Fassung"
        },
        "value": {
          "pl": "Czterokrapowa",
          "en": "Four-prong",
          "de": "Vierkrappen"
        }
      },
      {
        "label": {
          "pl": "Rozmiar",
          "en": "Size",
          "de": "Größe"
        },
        "value": {
          "pl": "14, możliwa zmiana",
          "en": "14, resizing available",
          "de": "14, Änderung möglich"
        }
      }
    ],
    "note": {
      "pl": "Zmiana rozmiaru w zakresie dwóch numerów jest bezpłatna, napisz przed wysyłką.",
      "en": "Resizing within two sizes is free, write to us before shipping.",
      "de": "Größenänderung um bis zu zwei Nummern ist kostenlos, schreiben Sie uns vor dem Versand."
    },
    "images": [
      "/img/portfolio/jewelry-web/garnet-ring-585-v2.webp"
    ],
    "priceGrosze": 129000,
    "weightG": 25,
    "stock": 1,
    "leadTimeDays": 3
  }
];
