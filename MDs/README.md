# Mapa dokumentacji AEJaCA

Ten indeks rozroznia aktualne zrodla prawdy od planow i audytow historycznych.
Data przegladu indeksu: 2026-08-23.

## Zasada uzycia

Najpierw przeczytaj `PROJECT_RULES.md`, potem dokument domenowy. Audyt opisuje
stan w dniu badania i moze zawierac problemy juz naprawione. Plan opisuje intencje
i nie jest dowodem, ze funkcja istnieje. Przy watpliwosci sprawdz kod i testy.

## Aktualne zrodla prawdy

| Dokument | Rola | Wlasciciel merytoryczny | Kiedy aktualizowac |
|---|---|---|---|
| `AEJaCA_Brand_Reference.md` | Fakty o marce, ofercie, cenach, narzedziach i SEO | Artur | Przy zmianie publicznego faktu |
| `AEJaCA_Autopay_Integration.md` | Niezmienniki integracji Autopay | Artur + implementator platnosci | Przy zmianie przeplywu lub dokumentacji operatora |
| `AEJaCA_Geometria_Kreatora_Zasady.md` | Reguly geometrii i dziennik pomiarow | Implementator geometrii | Przy kazdej zmianie bryly |
| `AEJaCA_Inwentarz_Sprzet_Procesy.md` | Sprzet, materialy i realne procesy | Artur | Po zmianie sprzetu lub procesu |
| `B2B_Architektura.md` | Zatwierdzona architektura oferty B2B | Artur | Po zmianie oferty B2B |
| `MAPA_CEN.md` | Gdzie stoi ktora kwota, co jest kosztem, a co cena dla klienta, i co zrobic przed zmiana cennika | Implementator wycen | Po dolozeniu tabeli cenowej albo zmianie marzy |
| `MAPA_BRAMEK.md` | Spis wszystkich sprawdzianow z `npm run build` razem z powodem, dla ktorego powstaly. **Generowany**: `npm run mapa:bramki` | nikt recznie | sam, przez bramke `mapa-bramek.mjs --check` |

**Model, ktory widzi to repozytorium pierwszy raz, zaczyna od tych dwoch.**
`MAPA_CEN.md` mowi, gdzie ruszac, a `MAPA_BRAMEK.md`, czego build nie przepusci.
Bez nich obie te rzeczy poznaje sie przez padajacy build, regula po regule.

## Audyty ze stanem wykonania

| Dokument | Jak go czytac |
|---|---|
| `AEJaCA_Security_Audit.md` | Znaleziska historyczne plus plan napraw. Sprawdz sekcje stanu i aktualny kod. |
| `AEJaCA_Legal_Audit.md` | Wymogi prawne i wdrozone etapy. Prawo wymaga ponownej weryfikacji przed zmiana. |
| `AEJaCA_UX_SEO_Audit.md` | Pomiar z daty audytu. Otwarte punkty nie zawsze sa zadaniem kodowym. |
| `AEJaCA_Demand_Diagnosis.md` | Diagnoza biznesowa. Aktualizuj na nowych danych, nie traktuj liczb jako stalych. |

## Zatwierdzone plany i specyfikacje

| Dokument | Status |
|---|---|
| `AEJaCA_Shop_Plan.md` | Fundament architektury sklepu, czesc etapow juz wdrozona. |
| `AEJaCA_Konfigurator_Pierscionka_Plan.md` | Decyzje technologiczne konfiguratora, realizacja rozwijana dalej. |
| `Plan_MSLA_B2B_Figurki.md` | Plan zatwierdzony, wiele etapow wdrozonych. Stan potwierdzaj w kodzie. |
| `Plan_Zywice_Parametry_MSLA.md` | Specyfikacja katalogu zywic. Aktualne wartosci sprawdz w danych i dokumencie marki. |
| `AEJaCA_Production_Capacity_Plan.md` | Decyzje operacyjne. Priorytetem pozostaje popyt, nie rozbudowa podazy. |

## Materialy pomocnicze i historyczne

| Dokument | Rola |
|---|---|
| `AEJaCA_Improvement_Plan_v2.md` | Historyczny plan ulepszen, nie lista aktualnych zadan. |
| `AEJaCA_Photo_Mapping.md` | Mapowanie zdjec i tekstow alternatywnych. |
| `AEJaCA_Pierwotna_Lista_Narzedzi.md` | Historyczne pochodzenie listy narzedzi. |
| `Prompty_Grafiki_MSLA.md` | Prompty produkcyjne dla grafik. |
| `kreator-pierscionkow-plan.html` | Wizualny material planistyczny. |
| `CLAUDE.md` | Historyczna kopia. Aktywna instrukcja Claude Code jest w katalogu glownym. |

## Katalogi

| Katalog | Co w nim lezy |
|---|---|
| `decisions/` | decyzje architektoniczne (ADR), jedna decyzja na plik, numeracja ciagla |
| `handoffs/` | przekazania pracy miedzy modelami, wzor w `HANDOFF_TEMPLATE.md` |
| `zlecenia/` | opisy zadan do wykonania, spisane zanim ktokolwiek zaczal je robic |
| `skill-observations/` | wnioski z sesji zbierane przez skill `task-observer` |

## Dokumenty koordynacyjne

| Dokument | Rola |
|---|---|
| `WORKBOARD.md` | Kto nad czym pracuje i ktore pliki sa zastrzezone. |
| `HANDOFF_TEMPLATE.md` | Obowiazkowy format przekazania pracy drugiemu modelowi. |
| `decisions/README.md` | Reguly decyzji ADR. |

## Metadane nowych dokumentow

Kazdy nowy dokument planistyczny lub domenowy powinien zaczynac sie od:

```yaml
status: draft | accepted | historical | superseded
owner: Artur | Claude Code | Codex | nazwa roli
last_verified: YYYY-MM-DD
superseded_by: sciezka albo null
```

Zmiana `status: accepted` wymaga akceptacji Artura. Agent moze sam ustawic `draft`.
