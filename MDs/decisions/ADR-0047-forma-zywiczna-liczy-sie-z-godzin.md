---
status: draft
owner: Artur
date: 2026-09-10
deciders: Artur
supersedes: null
related:
  - src/pricing/epoxy.js
  - src/pricing/terminy.js
  - src/pricing/config.js
  - src/data/orderCatalog.js
  - src/data/serviceCatalog.js
  - src/components/shop/ConfigControls.jsx
  - scripts/test-forma-zywiczna.mjs
  - MDs/AEJaCA_Odlewnictwo_Procedury.md
---

# ADR-0047: Forma zywiczna liczy sie z godzin, a nie z okraglej kwoty

## Kontekst

Wlasciciel wszedl 10 wrzesnia 2026 na wlasny sklep, na karte odlewu
zywicznego, i zglosil cztery rzeczy naraz. Przystanki suwaka nie trafialy
w kciuk. Pole "Forma" pytalo o rozmiar, chociaz rozmiar wynika z objetosci.
Suwak "Naklad" stal nad licznikiem "Liczba sztuk", czyli dwie kontrolki na
jedna liczbe. I rzecz najwazniejsza: przygotowanie formy bylo w cenniku
drobiazgiem, chociaz jest to najbardziej mozolny etap calej uslugi.

Rachunek pokazal skale. Silnik liczyl `moldCost / pourLife`, czyli przy
"nowej formie malej" 60 zl podzielone przez czterdziesci zalan. Klient
zamawiajacy JEDNA sztuke placil `1,50 zl` za forme robiona wylacznie dla
niego, i dokladnie tyle samo placil klient zamawiajacy czterdziesci.
Tymczasem z naszego wlasnego dokumentu (`MDs/AEJaCA_Odlewnictwo_Procedury.md`,
rozdz. 11-12) wynika, ze taka forma to 20-46 zl silikonu, drukowana ramka,
wylanie w dwoch odslonach i, przy wzorcu drukowanym, wypolerowanie go do
lustra. Razem od dwoch do szesciu godzin pracy.

Tego samego dnia doszlo drugie zrodlo prawdy: mail, ktory pracownia wyslala
klientce zamawiajacej brelok z zatopionymi drutami medycznymi. Mail obiecal
300-500 zl za pierwsza sztuke, jedna trzecia za druga, dwa do trzech tygodni
i napis na srebrnej blaszce albo drukowany w zywicy. Sklep nie umial policzyc
zadnej z tych rzeczy, a klientka moze wejsc i sprawdzic.

## Decyzja

**Pole formy pyta o DROGE POWSTANIA, nie o rozmiar.** Piec drog: nasza gotowa
forma, forma klienta, nowa z przedmiotu klienta, nowa z jego pliku 3D, nowa
z naszego projektu. Gabaryt liczy sie z objetosci, ktora klient i tak podaje.

**Przygotowanie liczy sie z materialu i godzin.** Silikon z bloku o sciance
12 mm wokol odlewu, ramka z PLA, wzorzec MSLA tam, gdzie go drukujemy, plus
godziny. Sprawdzenie wobec dokumentu: dla breloka 30 ml model daje 20,49 zl
silikonu, a rozdz. 12.3 mowi 20-24 zl.

**Przygotowanie dzieli sie przez ZAMOWIONE sztuki, nie przez zywotnosc formy**,
i stoi w rozpisce wlasna pozycja, dwa razy: pelna kwota i to, co spada na
sztuke. Zamowienie ponad zywotnosc formy nalicza druga forme.

**Praca przy formie ma wlasna stawke, 65 zl/h**, tyle co robota reczna
w bizuterii. Zalewanie i szlif odlewu zostaja po 25 zl/h, bo to praca
odtworcza. Prowadzenie linii podzialu i polerowanie wzorca do lustra nia
nie jest.

**Czas na sztuce zalezy od tego, co naprawde robimy.** Zatopienie znaczy
zalewanie warstwami, a zywica przezroczysta znaczy szlifowanie przez kolejne
gradacje do przejrzystosci optycznej, a nie wygladzenie powierzchni.

**Ksztalt bryly jest osobnym pytaniem** przy formie z naszego projektu: prosta
bryla 0,7 h, fasetowany krysztal 1,5 h, ksztalt rzezbiarski do wyceny recznej.
To jest powod, dla ktorego mail podal widelki, a nie jedna kwote.

**Nowa forma dokłada tydzien do terminu.** Silikon musi zwiazac, a kazda
warstwa zywicy utwardza sie dwie doby. 7-14 dni z gotowej formy, 14-21 dni
z nowa.

**Prog nakladu nazywa sie "Rabat ilosciowy"**, bo tym jest. Liczbe sztuk
podaje licznik pod nim, ktory juz wczesniej byl zrodlem prawdy.

**Nie obiecujemy odlewu bez pecherzykow.** Garnka cisnieniowego w pracowni
nie ma (rozdz. 14), a karta uslugi obiecywala "bryle bez pecherzy".

## Konsekwencje

Prototyp z nowa forma jest teraz drogi i taki ma byc: klient widzi pelny koszt
przygotowania i rozumie, dlaczego pierwsza sztuka kosztuje tyle co dziesiec
nastepnych razem. Cena zwyklego odlewu z formy stojacej u nas na polce nie
zmienila sie.

Podniosla sie natomiast cena kazdego odlewu z zatopieniem i z polerowaniem
przezroczystej zywicy, bo tam czas byl zanizony trzykrotnie. To dotyka takze
zlecen, ktore z forma nie maja nic wspolnego.

Koszyki zapisane przed zmiana nios warianty `new_s`, `new_m`, `new_l`.
Podstawienie pierwszej pozycji z listy zamienialoby zamowienie na nowa forme
w zamowienie z formy gotowej, po cichu i za darmo, dlatego `zamiennikFormy`
sprowadza je na "nowa forma z Twojego przedmiotu".

Kafelki trzech nowych drog uzywaja na razie zdjec po wariantach rozmiarowych.
Pokazuja formy silikonowe, wiec nie klamia, ale nie pokazuja tego, czym te
drogi sie roznia. Do wymiany na wlasne zdjecia.

`src/pricing/simpleQuote.js` nadal zaklada, ze przy jednej sztuce cos
pasujacego stoi u nas na polce, wiec nie liczy przygotowania. Przy wyrobie na
zamowienie to zwykle nieprawda, ale zmiana tego zalozenia rusza KAZDA szybka
wycene, wiec czeka na osobna decyzje.
