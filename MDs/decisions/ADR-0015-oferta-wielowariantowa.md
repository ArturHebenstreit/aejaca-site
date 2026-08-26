---
status: draft
owner: Artur
date: 2026-08-26
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0012-zaplata-za-oferte.md
  - chat-api/quotes.js
  - src/pages/Offer.jsx
  - admin/views/quote-edit.ejs
  - scripts/test-quote-edit.mjs
---

# ADR-0015: Oferta wielowariantowa, czyli kilka scenariuszy do wyboru

## Kontekst

Oferta wysylana mailem czesto brzmi "srebro 850, zloto 3200, wybierz jedno".
System nie umial tego powiedziec. Kazda pozycja wyceny byla skladnikiem JEDNEGO
rachunku, wiec trzy scenariusze znaczyly trzy numery wycen, trzy linki w mailu
i nic, co powstrzymaloby klienta przed zaplaceniem dwa razy.

Rozwazane byly trzy drogi:

1. **Osobna wycena na wariant.** Zero zmian w kodzie, ale trzy numery w jednym
   watku, reczne zamykanie pozostalych i realny scenariusz podwojnej zaplaty.
2. **Grupa powiazanych wycen** ze wspolnym kluczem i jednym linkiem.
   Poprawne, ale wprowadza nowe pojecie i nowa tabele.
3. **Warianty wewnatrz jednej wyceny.** Najprostsze dla klienta, ale w wersji
   naiwnej lamie regule "suma naglowka zgadza sie z pozycjami".

## Decyzja

Wybrana zostala **droga trzecia, z jednym twardym rozstrzygnieciem**, ktore
zdejmuje jej wade: **wycena ma albo pozycje, albo warianty, nigdy jedno
i drugie naraz.** Rozstrzyga o tym flaga `quotes.pick_one`.

Przy `pick_one` pozycje wyceny przestaja byc skladnikami rachunku i staja sie
**wzajemnie wykluczajacymi sie propozycjami**. Jeden wariant to jedna kwota,
opisana w tresci oferty. Wariant NIE rozklada sie na podpozycje ani ilosci:
byla to swiadoma decyzja wlasciciela z 2026-08-26, zeby edycja pozostala prosta.

**Wybor nigdy nie jest pusty.** Wycenianie wskazuje pierwszy wariant, a klient
go tylko przestawia. Dzieki temu `total_grosze` zawsze znaczy to samo, co przy
wycenie zwyklej, czyli KWOTE DO ZAPLATY, i zadna z istniejacych bramek nie musi
uczyc sie stanu "jeszcze nie wybrano": ani wysylka oferty, ani kod rabatowy,
ani konwersja, ani panel.

**Wybor nie jest wiazacy az do zaplaty.** Klient moze wrocic i przestawic sie
na inny wariant. Wiazaca staje sie dopiero konwersja, ktora bierze wariant
wskazany w tej chwili i wpisuje do zamowienia WYLACZNIE jego.

## Alternatywy i powody odrzucenia

- **Osobne wyceny na wariant.** Odrzucone: nic nie broni podwojnej zaplaty,
  a watek z trzema numerami myli obie strony.
- **Grupa wycen ze wspolnym kluczem.** Odrzucone jako drozsze bez przewagi:
  daje to samo, co flaga, kosztem nowego pojecia i nowej tabeli.
- **Osobna tabela `quote_variants`.** Odrzucone: wariant zachowuje sie
  dokladnie jak pozycja (ma nazwe, kwote, opis), wiec druga tabela na to samo
  znaczylaby dwie sciezki wyceniania i dwie sciezki konwersji.
- **Warianty rozlozone na podpozycje z iloscia.** Odrzucone przez wlasciciela
  jako przekombinowane. Opis tego, z czego sklada sie wariant, idzie w tresci
  oferty, tam gdzie i tak trafial do tej pory.

## Konsekwencje

- **Rabat liczy sie od wybranego wariantu**, nie od sumy propozycji. Inaczej
  znizka liczylaby sie od kwoty rzeczy, ktorych nigdy wszystkich nie zrobimy.
- **Do zamowienia trafia jedna pozycja**, ta wybrana. Pozostale nie zostawiaja
  po sobie sladu w zamowieniu, bo nigdy nie byly jego czescia.
- **Termin waznosci jest wspolny dla calej oferty.** Nie da sie dac wariantowi
  srebrnemu czternastu dni, a zlotemu pieciu. Przy ofercie mieszajacej kruszce
  calosc dostaje ten krotszy termin. Rozdzielenie terminow na warianty to
  osobna decyzja i osobna kolumna.
- **Zmiana wariantu kasuje podglad znizki.** Kod sprawdzony dla srebra nie jest
  obietnica dla zlota, a pokazanie starej znizki przy nowej kwocie skonczyloby
  sie odmowa przy skladaniu zamowienia.
- Wycena zwykla nie zmienia sie w niczym. `pick_one` domyslnie jest wylaczone.

## Niezmienniki i testy

- Regula wyboru stoi w JEDNYM miejscu (`wybranyWariant`) i jest czysta, wiec
  daje sie sprawdzic bez bazy.
- Wycena zwykla nie ma wybranego wariantu.
- Bez wskazania wybrany jest pierwszy WYCENIONY wariant, a wskazanie na pozycje
  usunieta spada na pierwszy pozostaly. Oferta nigdy nie zostaje bez kwoty.
- Wariant bez kwoty nie da sie wybrac.
- Wybor sprawdza po stronie serwera, ze pozycja nalezy do TEJ oferty. Bez tego
  wybor bylby ustawieniem dowolnej kwoty jako naleznosci.
- Po konwersji wariantu nie da sie juz zmienic.
- Pilnuje tego `scripts/test-quote-edit.mjs`, sekcja 5, wpiety w `npm run build`.
