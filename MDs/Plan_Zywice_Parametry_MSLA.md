# Plan: rozbudowa żywic w kalkulatorze + strona "Parametry druku 3D MSLA"

Status: ZATWIERDZONY (2026-07-17). Opcja A: statyczny moduł danych `src/data/resins.js` (bez bazy/API).

## Zatwierdzona tabela żywic - 13 typów, 3 segmenty

### Segment 1 - Standardowe (wizualne, hobby)

| # | Żywica | Cena PLN/kg | Warstwa (mm) | Mycie | Charakter | Zastosowanie |
|---|--------|------------:|--------------|-------|-----------|--------------|
| 1 | Standard | 120 | 0.025-0.05 | IPA | 84D, krucha | figurki, prototypy wizualne |
| 2 | Water-washable | 130 | 0.025-0.05 | woda | 82D | jak standard, prostszy post-processing |
| 3 | Plant-based (eco) | 140 | 0.025-0.05 | IPA | niski zapach, skurcz ~3.7% | modele, praca w domu/biurze |
| 4 | Transparentna (Clear) | 130 | 0.025-0.05 | IPA | przezierna | lampy, soczewki, efekty wizualne |

### Segment 2 - Techniczne (funkcjonalne)

| # | Żywica | Cena PLN/kg | Warstwa (mm) | Mycie | Charakter | Zastosowanie |
|---|--------|------------:|--------------|-------|-----------|--------------|
| 5 | ABS-like 3.0+ | 160 | 0.05 | IPA | udarna, jak ABS | obudowy, części mechaniczne |
| 6 | Tough (wytrzymała) | 150 | 0.05 | IPA | zatrzaski, obciążenia | prototypy funkcjonalne |
| 7 | Flexible (elastyczna) | 320 | 0.05 | IPA | 60-70 Shore A | uszczelki, chwyty, elementy giętkie |
| 8 | Heat-resistant | 350* | 0.05 | IPA | HDT 150-200 st. C | formy, elementy przy cieple |
| 9 | Fast (szybka) | 140 | 0.05-0.1 | IPA | krótkie naświetlanie | szybkie iteracje, serie |

### Segment 3 - Precyzyjne i odlewnicze (jubilerskie, premium)

| # | Żywica | Cena PLN/kg | Warstwa (mm) | Mycie | Charakter | Zastosowanie |
|---|--------|------------:|--------------|-------|-----------|--------------|
| 10 | High-precision 14K | 280 | 0.02-0.03 | IPA | mikrodetal | miniatury premium, ażur, mikrograwer |
| 11 | Rigid / Ceramic-filled | 250* | 0.03-0.05 | IPA | sztywna, stabilna wymiarowo | wzorce pomiarowe, oprzyrządowanie |
| 12 | Castable BlueCast X-One V2 | 1399 | 0.03-0.05 | IPA | wypalanie bez popiołu | wzorce odlewnicze, sygnety |
| 13 | Castable BlueCast X-Wax Filigree | 1399 | 0.02-0.03 | IPA | wosko-żywica | filigran, cienkie ścianki |

\* ceny szacowane z klasy materiału; pozostałe zweryfikowane rynkowo (Allegro/Elegoo EU, 2026-07-17).

Kolory (paleta ~20 wariantów Elegoo): atrybut żywic standard/ABS-like, NIE osobne typy. W formularzu zapytania pole "preferowany kolor" bez wpływu na cenę.

## Etapy i przydział agentów

| Etap | Zakres | Agent / model | Uwagi |
|------|--------|---------------|-------|
| 1 | `src/data/resins.js` - 13 typów, pola: id, segment, label/desc pl-en-de, price_kg, density, layer_range, wash, postcure, hardness, difficulty, applications | `quick` (Haiku) | czysta transkrypcja tabeli do danych |
| 2 | Print3DCalc.jsx (MSLA): RESINS -> import z resins.js, wybór segment + żywica jak w FDM, ceny wpięte w silnik (waste, QC castable x3.0 bez zmian), pole koloru w formularzu | `dev` (Sonnet) | równolegle z Etapem 3; weryfikacja pasm: min 49 zł, castable 90-180 zł |
| 3 | Nowa strona `/toolstudio/resin-settings/` (ResinSettingsPage + ResinSettingsCalc): hero, kreator wyboru wg zastosowania, karty parametrów, tabela porównawcza 13 żywic, FAQ + schema, pl/en/de; bez części społecznościowej | `dev` (Sonnet) | wzorowana na PrintSettingsPage/PrintSettings3DCalc, dane z resins.js |
| 4 | ToolsStudio: tytuł karty -> "Parametry druku 3D FDM" + nowy kafelek "Parametry druku 3D MSLA" (ikona Droplet); tytuły/SEO strony FDM z dopiskiem FDM | orchestrator | pliki współdzielone - poza agentami |
| 5 | Rejestracje: main.jsx, entry-server.jsx, prerender STATIC_ROUTES (70 stron), sitemap.xml, seoData/SEO_META; sync llms.txt + chat-api/context.js + robots; build + weryfikacja | orchestrator + `quick` | build musi dać 70 stron, 0 błędów; em-dash scan |

Lekcje z poprzednich etapów (obowiązują):
- pliki współdzielone rejestruje orchestrator PO zakończeniu agentów
- nie edytować drzewa, gdy działa agent z krokami build
- zakaz długich pauz " — " w każdej nowej treści
- ceny: pl=PLN, en/de=EUR (kurs 4.28)
