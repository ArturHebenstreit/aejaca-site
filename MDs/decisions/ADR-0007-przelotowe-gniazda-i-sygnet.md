# ADR-0007: Przelotowe gniazda i zintegrowana bryla sygnetu

Status: zaakceptowany przez wlasciciela

Data: 2026-08-24

## Kontekst

Po TASK-004 centralne i podniesione boczne gniazda konczyly frez w gornej
czesci szyny. Chronilo to gladkie wnetrze pierscionka, ale w pustej oprawie
pozostawalo metalowe dno widoczne jako szara zaslepka. Sygnety mialy spojna
bryle, lecz ramiona byly zbyt waskie wzgledem tarczy i nadal przypominaly
pierscionek z osobna korona.

## Decyzja

1. Gniazdo centralne ma pelny wlot, loze i stozek zgodne z obrysem szlifu oraz
   kontrolowany przelot od strony palca.
2. Podniesione gniazda boczne takze sa przelotowe. Sam dolny wylot ma 0,30 mm,
   aby nie rozcinac ramienia, natomiast loze i stozek zachowuja obrys kamienia.
3. Plaskie kaboszony i rozety dostaja wylot o 38 procentach obrysu. Jest
   czytelnie otwarty, ale nie tworzy nadmiernej szczeliny na powierzchni palca.
4. Zamkniety rant kasety ma minimalne zachodzenie 0,07-0,085 mm po uwzglednieniu
   luzu frezu 0,05 mm. Szerokosc sciany skaluje sie od 0,55 do 0,75 mm.
5. Ramiona sygnetu dochodza do okolo 82 procent krotszej osi tarczy, a zmiana
   szerokosci jest rozlozona na 86 procent polowy obwodu.
6. Podglad rozroznia srebro, biale zloto oraz zolte zloto 9K, 14K i 18K przez
   osobne tony i mikroszorstkosc, bez zmiany danych gestosci.
7. Kreator pokazuje build `1.001`, wersje geometrii 33, skroty sekcji,
   przyklejony podglad oraz cele sterujace o wysokosci co najmniej 44 px.

ADR-0007 zastepuje punkt 2 ADR-0006 w zakresie zakazu przebijania szyny.
Pozostale decyzje ADR-0006 nadal obowiazuja.

## Konsekwencje

- puste gniazdo nie udaje pelnej plyty pod kamieniem;
- dolny wylot jest mniejszy od loza i nie sluzy do wsuwania kamienia;
- kamien nadal wchodzi od gory i opiera sie na wezszym lozu;
- kazdy wariant musi pozostac jedna bryla i przejsc test minimalnego przekroju;
- wygoda powierzchni od strony palca wymaga oceny prototypu fizycznego.

## Wymagane kontrole

- kaseta i kaboszon z kamieniem oraz bez kamienia;
- kontakt zamknietego rantu z kamieniem;
- centralny i boczne wyloty od strony palca;
- jedna bryla i minimalny przekroj szyny po wykonaniu wylotow;
- trzy ksztalty tarczy sygnetu i szerokosc ramion;
- piec rozroznialnych wygladow stopow;
- build aplikacji, test geometrii, test wyceny i brak dryfu mirrorow.
