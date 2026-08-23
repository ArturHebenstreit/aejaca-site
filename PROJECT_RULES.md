# AEJaCA - wspolne reguly projektu

Ten dokument jest wspolnym zrodlem regul dla Claude Code, Codex i innych agentow.
Instrukcje narzedziowe pozostaja w `CLAUDE.md` i `AGENTS.md`, ale nie moga zmieniac
ponizszych zasad biznesowych bez zaakceptowanej decyzji ADR.

## 1. Hierarchia zrodel prawdy

W razie sprzecznosci obowiazuje kolejnosc:

1. Jawna, najnowsza decyzja wlasciciela projektu.
2. Zaakceptowany ADR w `MDs/decisions/`.
3. Regula domenowa oznaczona jako aktualna w `MDs/README.md`.
4. `MDs/AEJaCA_Brand_Reference.md` dla faktow o marce, ofercie i cenach.
5. Aktualny kod i jego testy dla rzeczywistego zachowania systemu.
6. Plany i audyty historyczne, wylacznie jako kontekst.

Sprzecznosci trzeba nazwac i rozstrzygnac. Nie wolno wybierac wygodniejszej wersji
bez zapisania powodu.

## 2. Zasady pracy rownoleglej

- Kazdy model pracuje w osobnym worktree i na osobnej galezi.
- Jeden aktywny wlasciciel na plik. Wlasnosc zapisuje `MDs/WORKBOARD.md`.
- Wspolny problem dzielimy wedlug odpowiedzialnosci, na przyklad API, interfejs,
  testy, dokumentacja. Nie dzielimy go przypadkowo po kilku liniach tego samego pliku.
- Agent spoza zadania moze czytac i recenzowac zastrzezony plik, ale go nie edytuje.
- Integrator scala dopiero po niezaleznym review i po przejsciu wymaganych kontroli.
- Ustalenia z rozmowy staja sie obowiazujace dopiero po zapisaniu w ADR, handoffie
  albo aktualnym dokumencie domenowym.

## 3. Jak podejmujemy decyzje

Przed implementacja zmiany wysokiego ryzyka trzeba zapisac:

- problem i mierzalny stan obecny;
- wybrana decyzje oraz odrzucone alternatywy;
- konsekwencje dla klienta, biznesu, bezpieczenstwa, SEO i utrzymania;
- wymagane testy, w tym kontrole negatywne;
- dokumenty i kopie kodu wymagajace synchronizacji.

Zmiana wysokiego ryzyka obejmuje platnosci, ceny, zamowienia, dane osobowe,
geometrie wyrobu, prawo konsumenckie, routing i publiczne fakty o ofercie.

## 4. Twarde niezmienniki

- Nie uzywamy dlugiego myslnika w tresciach, komentarzach i commitach.
- Teksty widoczne dla klienta musza miec wersje PL, EN i DE.
- Jezyk PL pokazuje PLN. Jezyki EN i DE pokazuja EUR wedlug kursu serwisu.
- Cena wiążaca jest liczona na serwerze. Dane cenowe z przegladarki nie sa zaufane.
- Status platnosci zmienia tylko poprawnie podpisany komunikat ITN.
- `FAILURE` po `SUCCESS` nie cofa oplaconego zamowienia.
- Nowa trasa musi trafic do routera klienta, SSR i prerenderu.
- Zmiana geometrii zaczyna sie od pomiaru, ktory zawodzi na starym kodzie.
- Test topologiczny nie zastępuje testu warsztatowego wyrobu.
- Nie ujawniamy sekretow w repozytorium, frontendzie ani logach.
- Brak wymaganego sekretu ma zamykac dostep, a nie wlaczac wartosc domyslna.

## 5. Obowiazkowe dokumenty domenowe

| Obszar | Dokument do przeczytania przed zmiana |
|---|---|
| Marka, oferta, ceny, sprzet | `MDs/AEJaCA_Brand_Reference.md` |
| Platnosci Autopay | `MDs/AEJaCA_Autopay_Integration.md` |
| Geometria pierscionkow | `MDs/AEJaCA_Geometria_Kreatora_Zasady.md` |
| Prawo i dane osobowe | `MDs/AEJaCA_Legal_Audit.md` |
| Bezpieczenstwo API i panelu | `MDs/AEJaCA_Security_Audit.md` |
| Sklep i modele produktow | `MDs/AEJaCA_Shop_Plan.md` |
| B2B | `MDs/B2B_Architektura.md` |
| Sprzet i procesy | `MDs/AEJaCA_Inwentarz_Sprzet_Procesy.md` |

## 6. Synchronizacja

Zmiana faktow o ofercie, cenach, trasach, narzedziach albo SEO wymaga sprawdzenia:

- `public/llms.txt`;
- `public/robots.txt`;
- `public/sitemap.xml`;
- `chat-api/context.js`;
- `src/seo/seoData.js` i `src/seo/schemas.js`;
- `MDs/AEJaCA_Brand_Reference.md`.

Zmiana geometrii `src/geometry/ring/` wymaga dodatkowo:

- `npm run sync:pricing`;
- podniesienia `WORKER_VERSION`;
- wpisu w dzienniku `MDs/AEJaCA_Geometria_Kreatora_Zasady.md`;
- testow generatora i wyceny.

## 7. Bramka jakosci przed review

Minimalnie:

1. Test, ktory odtwarza naprawiany blad albo mierzy nowy wymog.
2. Kontrola negatywna dla zmian wysokiego ryzyka.
3. Testy obszaru zmiany.
4. `npm run build` po zmianach strukturalnych lub przed integracja.
5. Przeglad diffu przez model, ktory nie byl autorem implementacji.
6. Handoff z wynikami testow, ryzykami i tym, czego nie sprawdzono.

Przejscie builda nie dowodzi poprawnosci biznesowej. Dokument domenowy i test
musza opisywac ten sam stan docelowy.
