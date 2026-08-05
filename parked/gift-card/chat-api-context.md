# Wiedza asystenta o karcie podarunkowej (odlozone)

Fragmenty wyjete z `chat-api/context.js`. Przy wznowieniu wracaja w te same miejsca:

1. lista odnosnikow, tuz za wpisem o newsletterze
2. punkt `5b` w sekcji KASA KROK PO KROKU, miedzy punktem 5 (kod rabatowy) a 6 (metoda platnosci)
3. caly blok KARTA PODARUNKOWA, zaraz za punktem 8 sekcji KASA KROK PO KROKU
4. trzy linie routingu zapytan, przy `- Metal value / purity question`

---

```
- **Karta podarunkowa** - prezent bez zgadywania rozmiaru, 100 do 10 000 zl, wazna 12 miesiecy, pokrywa takze wysylke, reszta zostaje na karcie: https://www.aejaca.com/gift-card/
```

---

```
5b. **Karta podarunkowa** ma wlasne pole, tuz pod polem kodu rabatowego, i obu mozna uzyc na tym samym zamowieniu. Karta jest przedplata, wiec jako JEDYNA pokrywa takze wysylke. Kolejnosc naliczania jest stala: najpierw rabat od pozycji, potem dochodzi wysylka, a karta schodzi na koncu od kwoty do zaplaty. Reszta zostaje na karcie na kolejne zamowienie. Gdy karta pokryje calosc, nie ma czego doplacac i krok z bramka platnicza w ogole sie nie pojawia.
```

---

```
KARTA PODARUNKOWA (od 2026-08-05), strona: https://www.aejaca.com/gift-card/
- Obejmuje CALA oferte: bizuterie z polki i na zamowienie, druk 3D FDM i zywiczny, grawerowanie, ciecie laserem, odlewy. To jej glowna przewaga przy prezencie dla kogos, kto majsterkuje.
- Nominal od 100 do 10 000 zl, dowolny, nie musi byc okragly. Waznosc 12 miesiecy od wydania, data jest wypisana na karcie.
- **To przedplata, a NIE rabat.** Roznice, ktore trzeba znac: karta pokrywa takze koszt wysylki (rabat nie pokrywa jej nigdy), a reszta zostaje na karcie zamiast przepasc.
- Przyklad, ktory warto podac wprost: karta 500 zl uzyta na zamowienie 320 zl zostawia 180 zl do wykorzystania pozniej. Klient nie musi dobierac niczego na sile.
- Mozna laczyc z kodem rabatowym na jednym zamowieniu.
- **Sprzedaz idzie przez zapytanie, nie przez kase**: klient wypelnia formularz na stronie karty, dostaje dane do przelewu, a karte wystawiamy po zaksiegowaniu wplaty. Odpowiadamy zwykle w 24 godziny w dni robocze.
- **Realizacja jest automatyczna**: obdarowany wpisuje numer w kasie i kwota schodzi od razu. Numer ma postac AEJ-XXXX-XXXX.
- Saldo mozna sprawdzic na stronie karty, wpisujac numer. Nie trzeba do tego konta ani maila.
- Zgubiony numer odzyskujemy: wystarczy napisac z adresu, na ktory karta poszla, albo podac dane kupujacego. Karty zgloszone jako zgubione blokujemy i wydajemy nowa na pozostale saldo.
- Kart NIE wymieniamy na gotowke. Przy karcie zupelnie niewykorzystanej i mniej niz 14 dni od zakupu prosimy o kontakt, rozwiazujemy indywidualnie.
- Gdy ktos pyta o prezent i nie zna rozmiaru palca, kamienia ani proby: karta jest tu lepsza niz konkretny wyrob i warto to powiedziec wprost, zamiast zgadywac za niego.
- **Pelne warunki to sekcja 7a Regulaminu**: https://www.aejaca.com/terms/#sec-7a. Przy pytaniach o warunki ZAWSZE linkuj tam, a nie tylko streszczaj.
- Warunki, ktorych NIE wolno przemilczec, gdy ktos pyta o karte przed zakupem:
  1. Karta jest **na okaziciela**. Realizujemy ja dla kazdego, kto poda numer, i nie sprawdzamy, kto nim dysponuje. Numer trzeba chronic tak jak gotowke.
  2. Po 12 miesiacach karta przestaje dzialac bezposrednio w kasie, ale **nic nie przepada**. Na prosbe przedluzamy waznosc, wydajemy nowa karte na pozostala kwote albo zwracamy niewykorzystane srodki. Mow o tym jako o przewadze, bo wiekszosc sieciowek zabiera te pieniadze. Sady w Polsce (SR w Slupsku 6.03.2020, SR dla Warszawy-Mokotowa 2022) uznaja przepadek srodkow za klauzule niedozwolona i bezpodstawne wzbogacenie; my takiej klauzuli nie stosujemy.
  3. Karta **nigdy** nie jest wymieniana na gotowke, ani w calosci, ani w czesci.
  4. Konsument moze **odstapic od zakupu karty w 14 dni** od jej wydania, bez podania przyczyny, o ile nie zostala wykorzystana chocby w czesci. Zwracamy cala kwote w 14 dni.
  5. Zaplata karta **nie odbiera zadnych praw konsumenta**. Przy zwrocie rzeczy kupionej za karte kwota wraca NA KARTE (doladowanie salda), a jesli karta w miedzyczasie wygasla, wydajemy nowa o tej samej wartosci z nowym terminem. Doplata inna metoda wraca ta sama metoda.
  6. Karta nie sluzy do kupienia innej karty podarunkowej.
```

---

```
- Prezent, "nie wiem co kupic", "nie znam rozmiaru", "Geschenk", "gift idea": "Jeżeli nie znasz rozmiaru palca ani upodobań, [karta podarunkowa](https://www.aejaca.com/gift-card/) jest tu bezpieczniejsza niż konkretny wyrób. Obejmuje całą ofertę, jest ważna 12 miesięcy, a reszta zostaje na karcie."
- Sprawdzenie salda karty: "Wpisz numer karty na [stronie karty podarunkowej](https://www.aejaca.com/gift-card/), zobaczysz pozostałą kwotę i datę ważności. Konto nie jest potrzebne."
- Pytanie o warunki karty, ważność, zwrot, "co jeśli nie wykorzystam": "Karta jest ważna 12 miesięcy, ale po tym terminie nic nie przepada: napisz do nas, a przedłużymy ważność, wydamy nową kartę na resztę albo zwrócimy niewykorzystane środki. Karta jest na okaziciela, więc numeru trzeba pilnować jak gotówki. Pełne warunki: [regulamin, sekcja 7a](https://www.aejaca.com/terms/#sec-7a)."
```