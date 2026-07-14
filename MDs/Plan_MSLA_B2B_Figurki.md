# Plan implementacji: MSLA 16K + oferta B2B + figurki
**Data:** lipiec 2026 | **Status:** zatwierdzony przez Artura | **Branch:** claude/fix-api-error-oge1r
**Kontekst sprzętowy:** MDs/AEJaCA_Inwentarz_Sprzet_Procesy.md (Elegoo Saturn 4 Ultra 16K, Mercury Plus V3, BlueCast X-Wax Filigree, X-One V2)

## Cel biznesowy
1. Nowa technologia w ofercie sTuDiO: druk żywiczny MSLA 16K (prototypy, figurki/miniatury, wzorce castable)
2. Dedykowana oferta B2B (5 filarów) na podstronie /b2b/ - dwa profile klienta: "twórca marki" (typ Vadym Bilenko) i "pracownia partnerska" (typ Cyprian Wolski, Abudabi & Co)
3. Wzmocnienie oferty Jewelry komunikatem lost-resin in-house (filigran, detal 0,2 mm)
4. Nowa grupa odbiorców: figurki kolekcjonerskie i do gier (z twardą zasadą licencyjną)

## Decyzje wejściowe (Etap 0)
| # | Decyzja | Wartość (domyślne zatwierdzone, do korekty punktowej) |
|---|---|---|
| 0.1 | CAD B2B | 400-1200 zl netto wg złożoności |
| 0.2 | Wzorzec castable | 90-180 zl, kolejne z tej samej platformy -40% |
| 0.3 | Prototyp w srebrze | 180-300 zl + materiał |
| 0.4 | Cechowanie | DO POTWIERDZENIA: własny numer probierczy czy partner |
| 0.5 | White-label | DO POTWIERDZENIA: opis otwarty czy "wycena indywidualna" |
| 0.6 | Licencja figurek | tylko pliki klienta / licencja komercyjna / nasze projekty |
| 0.7 | Stawki MSLA | patrz sekcja "Silnik wyceny MSLA" (propozycja do akceptacji) |

## Etapy (bramka akceptacyjna po każdym)

### Etap 1. Druk żywiczny MSLA w kalkulatorze sTuDiO (+ figurki)
- 1.1 Projekt silnika wyceny MSLA - sesja główna (Opus)
- 1.2+1.3 Implementacja Print3DCalc + SimpleStudioCalc + i18n pl/en/de - agent dev (Sonnet)
- 1.4 Kafelki graficzne (żywica MSLA, figurka, wzorzec castable) - agent image-gen (Haiku)
- 1.5 Zapis licencyjny figurek w FAQ + formularzu - agent dev (Sonnet)
- 1.6 Weryfikacja walut, build, commit - agent quick (Haiku)

### Etap 2. Jewelry: lost-resin
- 2.1+2.2 Opisy metody "Odlew (lost wax)" + sekcja "Nowa precyzja" na Jewelry.jsx - agent dev (Sonnet)

### Etap 3. Strona /b2b/ (po decyzjach 0.1-0.5)
- 3.1 Architektura, copy strategiczne, schematy SEO - sesja główna (Opus)
- 3.2 Strona + routing (main.jsx ORAZ entry-server.jsx!) + navbar/footer - agent dev (Sonnet)
- 3.3 Formularz B2B (firma, NIP, ilość, termin, upload) - agent dev (Sonnet)
- 3.4 Tłumaczenia en/de - agent dev (Sonnet)
- 3.5 Hero 21:9 + grafiki filarów - agent image-gen (Haiku)

Filary B2B: 1) CAD/projektowanie 3D, 2) wzorce castable 16K, 3) odlew + wykończenie,
4) usługi uzupełniające (laser, foto, galwanika), 5) white-label "marka pod klucz".
Produkcja seryjna: komunikat "we współpracy z partnerami" (komplementarność z Abudabi & Co: formy gumowe, serie).

### Etap 4. Kalkulator kompensacji skurczu (SEO tool)
- 4.1+4.2 Komponent (Au 585 x1,0196 / Ag 925 x1,016 / 9K x1,021 / 18K x1,018) + routing x2 + HowTo schema + sitemap - agent dev (Sonnet)

### Etap 5. Treści (równolegle z 4)
- 5.1 Blog "Lost-resin krok po kroku" pl/en/de - agent dev (Sonnet)
- 5.2 Blog "Druk miniatur i figurek 16K" pl/en/de z sekcją licencyjną - agent dev (Sonnet)
- 5.3 Słowniczek: lost-resin, żywica castable, MSLA, kompensacja skurczu - agent dev (Sonnet)
- 5.4 Okładki blogowe - agent image-gen (Haiku)

### Etap 6. Sync, QA, deploy
- 6.1 Sync: llms.txt, robots, sitemap, chat-api/context.js, seoData - agent dev (Sonnet)
- 6.2 Audyt tras/meta/duplikatów - agent researcher (Haiku)
- 6.3 Przegląd prerenderu, commit, push - sesja główna (Opus)
- 6.4 Po merge: purge Cloudflare + npm run indexnow - Artur

## Silnik wyceny MSLA (wynik zadania 1.1)
Spójny z FDM (calcShared: applyPricing, BASE_MARGIN 0.40, QUANTITY_TIERS, tolerancja -30/+40%).
Kluczowa różnica vs FDM: czas druku MSLA zależy od WYSOKOŚCI modelu, nie objętości,
a pełna platforma drukuje się w tym samym czasie co jedna sztuka (batching obniża koszt/szt).

Koszt bazowy = żywica + maszyna + post-processing + handling:
- Żywica: objętość STL x waste factor (supporty/raft: x1,25; miniatury x1,35) x cena/ml
- Czas [h] = wysokość_mm / prędkość (0,05 mm: ~35 mm/h; 0,03 mm jakość: ~20 mm/h)
- Maszyna: amortyzacja 3,00 PLN/h + energia (CONFIG.ENERGY_COST_PLN x 0,25 kW)
- Post-processing (mycie IPA/woda, UV, zdjęcie supportów): 20 PLN/platformę + 3 PLN/szt
- Castable: premia QC x1,30 na robociznę (kontrola wzorca pod inwestycję)
- Handling: 8 PLN (jak FDM); minimalna wartość zlecenia MSLA: 49 PLN

Ceny żywic (PLN/kg; castable zweryfikowane na 3duv.pl, lipiec 2026, opakowania 0,1 kg po 139,90 zl):
| Żywica | PLN/kg | PLN/ml (~gęstość 1,1) |
|---|---|---|
| Standard (Elegoo WW / ABS-like) | 180 | 0,20 |
| BlueCast X-One V2 | 1399 | 1,54 |
| BlueCast X-Wax Filigree | 1399 | 1,54 |

Uwaga: przy opakowaniach 0,5 kg koszt spada do ~1220-1270 PLN/kg (traktować jako margines, nie powód obniżki cennika).

## Zasady realizacji
- Kolejność 1-2-3-4-5-6; etapy 4 i 5 równolegle
- Po każdym etapie: npm run build 0 błędów, commit, raport, stop do akceptacji
- Każda nowa trasa: main.jsx + entry-server.jsx + sitemap (lekcja z audytu Ahrefs)
- Waluty: pl = PLN, en/de = EUR (reguła CLAUDE.md)
- Rozkład kosztów: Opus ~10-15%, Sonnet ~65-70%, Haiku ~15-20%
