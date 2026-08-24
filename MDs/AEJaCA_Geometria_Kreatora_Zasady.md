# Kreator pierścionków: zasady budowy modeli

Wygenerowano: 2026-08-15

## Po co ten plik

Każda wada w tym generatorze była już raz naprawiana, a potem wracała pod inną
nazwą, bo wiedza siedziała w komentarzach jednej funkcji albo w głowie na jedną
sesję. Ten plik zbiera **reguły, a nie historię**: to, co trzeba wiedzieć,
zanim napisze się nową bryłę, żeby nie odkrywać tego eksperymentem.

Trzy warstwy, w których żyje ta wiedza, i podział między nimi:

| Gdzie | Co tam trzymamy |
|---|---|
| `src/geometry/ring/params.js` | **Liczby** ze uzasadnieniem warsztatowym (`SEAT`, `LIMITS`, `CUTS`, `SETTINGS`) |
| `src/geometry/ring/build.js` | **Dlaczego ta bryła jest zbudowana tak, a nie inaczej**, przy konkretnej funkcji |
| ten plik | **Reguły przekrojowe**: to, co dotyczy każdej nowej bryły, i dziennik wniosków |

Zasada podziału: jeżeli wniosek dotyczy jednej funkcji, idzie do komentarza przy
niej. Jeżeli powtórzyłby się w trzech miejscach, idzie tutaj.

## Procedura przy każdej zmianie geometrii

Kolejność nie jest ozdobna. Punkt 2 przed 3 jest tym, co odróżnia poprawkę od
zgadywania.

1. **Nazwij wadę wielkością fizyczną.** Nie "krapy wyglądają źle", tylko "stopa
   krapy wisi 0,3 mm nad koszem". Wada, której nie da się zmierzyć, nie da się
   też naprawić w sposób sprawdzalny.
2. **Napisz pomiar, zanim napiszesz poprawkę**, i sprawdź, że **na starym kodzie
   pomiar zawodzi**. Test, który przechodzi przed i po, nie mierzy niczego.
   Zdarzyło się to tutaj dwa razy (sprawdzian 22 i 28) i oba razy kosztowało
   rundę u klienta.
3. Popraw przyczynę, nie objaw. Jeżeli poprawka brzmi "dodajmy tu kulkę, żeby
   zakryć", to jest objaw.
4. `node scripts/test-ring-generator.mjs` i `node scripts/test-ring-pricing.mjs`.
5. `npm run sync:pricing`. Bez tego mirror `chat-api/geometry` rozjeżdża się
   z `src/geometry` i sprawdzian 14 zgłasza różnicę objętości.
6. Podnieś `WORKER_VERSION` w `src/workers/ringGenerator.worker.js`, inaczej
   przeglądarka poda ze swojego cache starą bryłę.
7. `npm run build`.
8. **Dopisz wniosek do dziennika na końcu tego pliku.**

## Układ współrzędnych

Wynika z jądra i nie da się go wybrać:

- `Manifold.revolve` obraca przekrój wokół jego osi Y, a ta staje się osią Z bryły.
- Pierścionek **leży płasko**, jego oś to Z, godzina dwunasta jest na osi **+Y**
  w odległości `ro` od środka.
- Koronę budujemy **w osi +Z** i dopiero obracamy w +Y. Halo jedzie tym samym
  przekształceniem co korona, więc buduje się je w układzie korony.
- Zignorowanie tego daje łapki wiszące w powietrzu i bryłę rozsypaną na kawałki.

## Pułapki jądra manifold-3d

| Pułapka | Objaw | Reguła |
|---|---|---|
| Profil nawinięty zgodnie z ruchem wskazówek | `revolve`/`extrude` zwraca bryłę **pustą**, bez błędu i bez ostrzeżenia | Zawsze przez `ccw()`; pole liczymy sami |
| Brak `.delete()` | Pamięć WASM rośnie do zatrzymania procesu | Każda bryła pośrednia zwalniana; `decompose()` alokuje na każdą część |
| Styczne zetknięcie powierzchni | Osobna **skorupa zerowej grubości**, w pliku widoczna jako druga bryła o ujemnej objętości | `bezSmieci()` na końcu, próg 0,002 mm³ |
| `hull` po kilku poziomach | Poziom leżący **wewnątrz** otoczki znika bez śladu | Poziomy muszą leżeć **na zewnątrz** prostej łączącej sąsiadów |
| Boolean cięty dokładnie po licu ściany | Warstwa zerowej grubości **zlepia rozłączne bryłki w jedną** | Ciąć 0,05 mm obok lica, nigdy po nim |

Ostatni wiersz dotyczy też **pomiarów**: sonda postawiona dokładnie na
płaszczyźnie płyty wieńca połączyła wszystkie kulki w jeden kawałek i pomiar
liczby kulek dawał bzdury.

## Klasa awarii cichych

**Najważniejsza rzecz w tym pliku.** Objętość, masa, liczba części i `genus` mogą
być poprawne, a wyrób nie do użycia. Dotąd wyszły:

- **Szyna przecięta na wylot** przez otwór gniazda szerszy od szyny. Bryła nadal
  jedna, `genus` zgodny, a na palcu szczelina na całej szerokości.
- **Zamknięta pustka** w gnieździe pavé: wlot niżej niż słupki kuleczek, dwie
  komory po -0,66 mm³, których żaden slicer nie wydrukuje sensownie.
- **Połknięty wzór faset**: otoczka wypułkna zjadła poziomy załamań, kamień stał
  się dwuostrosłupem, a objętość, masa i topologia dalej się zgadzały.
- **Gniazdo bez stożka**: otwór zwężał się do 0,85 mm i zaraz otwierał do 1,39 mm,
  bo płyta była cieńsza niż gniazdo. Kamień leżał na krawędzi i wpadał.
- **Rozpiska ceny niezgodna z ceną kafelka** o dokładnie `1 + BASE_MARGIN`.

Wniosek ogólny: **sprawdzian topologiczny nie zastępuje sprawdzianu
warsztatowego.** Pytanie brzmi zawsze "czy jubiler to weźmie do ręki i osadzi
kamień", a nie "czy bryła jest zamknięta".

## Gniazdo

Metalurgia gniazda jest w `SEAT` w `params.js` z pełnym uzasadnieniem. Reguły,
które trzeba znać, budując cokolwiek, co ma gniazdo:

1. **Wlot szerszy od kamienia** (`luz = 0.05`), **otwór węższy** o `undercut = 0.06`.
   Odwrotnie i kamień przelatuje.
2. Między wlotem a stożkiem **prosty pas** `ledge = 0.35`. Bez niego kamień siada
   na linii i obraca się w gnieździe przy dociskaniu łapek.
3. **Stożek musi być bardziej stromy niż pawilon**, inaczej kamień się zsuwa.
   Stąd `stozekH = glebokosc * min(1 - throughPart, 0.9 * (1 - wylot))`:
   poszerzenie wylotu **spłaszcza** stożek i o tym się zapomina.
4. `throughPart` (część głębokości) i `throughWidth` (szerokość) to **dwie różne
   liczby**. Jedna wartość w obu rolach dała kamykowi 1,4 mm wylot 0,23 mm.
5. **Płyta musi być grubsza niż gniazdo.** Wlot plus `ledge` plus stożek plus
   prosty wylot: jeżeli metalu jest mniej, stożek kończy się w powietrzu i punkt 3
   przestaje obowiązywać, choć w kodzie dalej wygląda na spełniony.
6. **Otwór przelotowy nie może przeciąć nośnika.** W szynie zostaje
   `minInnerStrip = 0.55` mm metalu po stronie palca; między sąsiednimi kamieniami
   liczy się odstęp **po promieniu wewnętrznym**, bo tam kamienie są najgęściej.

## Łapki i kuleczki

- Łapka wychodzi z odlewu **otwarta**. Zagięta nad rondystą wygląda lepiej i jest
  nie do użycia: nie da się włożyć kamienia. Zagięcie jest ostatnią czynnością
  przy stole, a nie stanem, w którym oddaje się odlew.
- Łapka **musi mieć na czym stać**. Wisząca na samym obramowaniu nie da się
  zakuć, bo narzędzie nie ma oporu. Lepiej otworzyć inne części oprawy i dać
  łapce podstawę.
- Łapka ma być **smukła u podstawy, ale zrośnięta z gniazdem**, nie doklejona.
  Noga schodzi do dna gniazda i tworzy z nim całość.
- Ścianka kosza **0,16 mm**. Przy 0,30 kosz sięgał tam, gdzie stoi łapka, i łapka
  tonęła w nim do połowy, wyglądając jak pręt wbity w klocek.
- Kuleczka to **słupek**, nie kula wtopiona w płytę. Kula jest guzkiem, którego
  nie da się zakuć: narzędzie nie ma jak podejść, metal nie ma dokąd płynąć.
- **Odsunięcie kuleczki się liczy, nie zgaduje.** Kuleczka stoi w połowie odstępu
  między kamieniami, więc zapas wzdłuż obwodu już ma i nie potrzebuje go drugi raz
  prostopadle. Najmniejsze odsunięcie, przy którym stopa mija wlot obu sąsiadów:
  `sqrt(wlot² - polKroku²)`. Podłoga: 1,6 promienia kuleczki, żeby para nie zlała
  się w jeden wałek.
- Liczba krapów kamienia centralnego jest wyborem klienta (4, 6, 8, 8 w parach).
  Kąty liczy **`prongAngles()` w `params.js`**, żeby piktogram i bryła rysowały
  to samo. Rozdzielenie tych dwóch źródeł kończy się ikoną, która kłamie.

## Rury i powierzchnie przeciągane

**Rura nigdy nie jest sumą brylek.** To jest reguła, nie preferencja.

Dwa ścięte stożki na załamanym torze mają na złączu okręgi o tym samym promieniu,
ale leżące w **różnych płaszczyznach**, bo każdy jest prostopadły do swojego
odcinka. Po zewnętrznej stronie zgięcia zostaje klin, którego suma nie wypełnia:
rowek głębokości `r * tan(kąt)`. Zmierzone przy skręcie 2,8° i rurze 1,2 mm daje
to 0,059 mm i ubytek 0,056 mm³ **na jedno złącze**. Trzynastopunktowy łuk to
dwanaście takich rowków jeden za drugim.

Kula w złączu wypełnia klin, ale przy rurze zwężającej się wychodzi spod sąsiadów
i robi paciorek. Próg skrętu usuwa paciorek i przywraca rowek. **Obie te poprawki
są leczeniem objawu** i obie zostały tu wypróbowane, zanim znaleziono przyczynę.

Poprawnie: **jedna powłoka przeciągnięta po torze**. Pierścień wierzchołków
w każdym punkcie, w płaszczyźnie mitry, sąsiednie pierścienie dzielą wierzchołki
co do jednego. Ramka przenoszona równolegle wzdłuż toru, żeby rura się nie
skręcała. Do tego **korekta mitry**: przekrój w zakolu jest elipsą rozciągniętą
o `1/cos(połowy skrętu)`, bez niej rura chudnie dokładnie tam, gdzie wcześniej
się karbowała.

Ograniczenie: przeciągnięcie zawodzi, gdy tor skręca ciaśniej niż promień rury.
Dlatego `tubeAlong` trzyma sumę stożków jako zapas i sprawdza wynik, zamiast ufać.

## Kamienie i fasety

- Fasety muszą odpowiadać piktogramowi szlifu. Jednolity obły kamień to wada
  zgłaszana przez klienta trzy razy.
- Układ brylanta: rondysta jako 16-kąt, załamania korony i pawilonu jako 16-kąty
  **przesunięte o pół sektora po obrysie** (nie obrócone: obrót jest błędny dla
  owalu), tafla i koleta jako 8-kąty.
- **Załamania muszą leżeć na zewnątrz prostej rondysta-tafla.** Wewnątrz zostaną
  połknięte przez otoczkę wypukłą i kamień stanie się dwuostrosłupem, bez żadnego
  sygnału w liczbach.
- Szlify schodkowe i obrysy niewypukłe idą starą drogą (skręcany wieniec), bo
  otoczka wypukła nie jest dla nich poprawnym loftem.

## Odlew

- **Kanał wlewowy wchodzi od dołu szyny**, tam gdzie zaczyna się kanał wewnętrzny.
  Nigdy w koronę i nigdy w tarczę sygnetu: to są miejsca, które się poleruje.
  Dotyczy każdego wzoru, który ma szynę, sygnetów włącznie.
- Sygnet dostaje **grubszy** kanał (2,1 zamiast 1,6 mm), bo dziewięć gramów zasila
  się inaczej niż półtora. To jedyna różnica.
- Kanały wewnętrzne **rozwidlają się przy wlewie** i sięgają na drugą stronę.
  Głowicę karmią one, nie kanał główny.
- Kanał zaczyna się **pod powierzchnią odlewu** i zwęża ku niemu: metal ma
  zastygać najpóźniej najdalej od wyrobu.
- Przejścia przekroju stożkowe. Ostry uskok to miejsce, w którym odlew rwie się
  przy stygnięciu.
- Poniżej 3 mm średnicy kanał krzepnie przed odlewem i cała jego funkcja znika.
- Kanał i stopka **nie wchodzą do masy wyrobu ani do ceny**: metal wraca po
  odcięciu do tygla.

## Wieniec halo

- Liczba kamieni **nie jest parametrem**. Wynika z obwodu przez średnicę, tak jak
  liczy jubiler. Oddanie tego klientowi kończy się dziurą albo zachodzeniem.
- Otwór na kamień centralny **mniejszy od rondysty**, inaczej kamień nie ma na
  czym usiąść, a wieniec wisi na łapkach.
- Wybranie od spodu jest **rzeczowe, nie kosmetyczne**: pełny metal odcina
  kamieniom światło od dołu, a stamtąd bierze się blask halo.
- Okien **nie wierci się między gniazdami**: zostaje tam ćwierć milimetra i wieniec
  rozpada się na kawałki. Wybieramy pierścień od spodu.
- Grubość płyty idzie **za rozmiarem kamienia**, bo gniazdo też za nim idzie.
  Stała 0,55 mm to była wada, nie uproszczenie.

## Szyna i obrączka

- Wnętrze musi być **ciągłe**, bo tam klient dotyka. Sprawdzian 27 obiega wnętrze
  każdego wzoru i mierzy najdłuższą przerwę; próg 1,8 mm.
- Otwory po wiertle są dozwolone, szczelina na całej szerokości nie.
- Zwężenie (`taper`) liczy się od strony głowicy, a promień do postawienia
  czegokolwiek na szynie bierze się **z profilu na wysokości tego czegoś**, a nie
  ze szczytu szyny. Kuleczka postawiona na promieniu szczytu wisi obok metalu.

## Sygnet

- Sygnet **nie jest pierścionkiem z kamieniem**. Korona powstaje z rozszerzenia
  szyny, **bardziej kwadratowo niż obło**.
- Kształt i rozmiar przekroju trzeba mieszać **osobno**. Jedno wspólne mieszanie
  zwęża szyję tarczy i beczka wraca, choć w kodzie wygląda na naprawioną.
- Wielokąty łączy się **po kącie**, nie po indeksie. Po indeksie przekroje
  rozjeżdżają się o kilkadziesiąt stopni po obwodzie i ramię się skręca.

## Render

- `toCreasedNormals` z `three/addons/utils/BufferGeometryUtils.js`: 35° dla metalu,
  18° dla kamieni.
- Pochłanianie objętościowe: `attenuationDistance = ODNIESIENIE / (2.4 * pochlanianie)`
  przy `ODNIESIENIE = 4.5`. Rozmiar wchodzi **wyłącznie przez `thickness`**.
  Wyprowadzenie odległości z drogi promienia dało szmaragd renderowany na czarno.

## Wycena

- `CONFIG.BASE_MARGIN = 0.40`. Rozpiska musi kończyć się na `pricing.unitGrosze / 100`,
  a nie na sumie kosztów: różnica dokładnie `1 + marża` była zgłoszona przez
  klienta na pięciu zrzutach.
- Domyka to `domknij()` w `src/pricing/ringConfigurator.js`, wywoływane ze
  **wszystkich** ścieżek zwrotu.
- Waluta idzie za językiem: `pl` to PLN, `en`/`de` to EUR.

## Dyscyplina pomiaru

Trzy błędy popełnione tutaj, każdy wart zapamiętania:

1. **Sprawdzian, który potwierdzał wadę.** Test kanału wlewowego zapisywał starą,
   błędną regułę i przechodził na wadliwej bryle. Test jest tyle wart, ile wart
   jest opis stanu docelowego w nim zawarty.
2. **Sonda, która mierzyła całą bryłę.** Pierwszy sprawdzian gładkości łuku brał
   plaster w osi Z obejmujący cały pierścionek, więc każda próbka dawała tę samą
   liczbę i test przechodził też wtedy, gdy łuk był karbowany.
3. **Wzorzec z niewłaściwej geometrii.** Porównanie rury z **kołem**, gdy rura
   jest 32-kątem wpisanym, mierzy 0,64% różnicy pola wielokąta, a nie wadę.

Reguła wynikowa: **każdy nowy sprawdzian musi mieć kontrolę negatywną.** Uruchom
go na starym kodzie albo zbuduj obok bryłę z wadą i pokaż, że pomiar ją widzi.
Sprawdzian 29 robi to wprost: liczy ubytek dla powłoki przeciągniętej **i** dla
sklejonych stożków, i zgłasza błąd, jeżeli ta druga też przejdzie.

## Co pilnuje czego

`scripts/test-ring-generator.mjs`, 30 sekcji. Te, o których trzeba wiedzieć,
dodając nową bryłę:

| Nr | Pilnuje |
|---|---|
| 2, 11 | Dwadzieścia wzorów: siatka, topologia, masa |
| 14 | Plik do pobrania zgadza się z wyceną (wymaga `sync:pricing`) |
| 17, 25 | Gniazda nie rozcinają wyrobu, a wylot jest otworem |
| 19, 24 | Kamień siada i nie wypada; łapka ma na czym stać |
| 20 | Kamienie na szynie nie wchodzą w koronę |
| 22 | Układ wlewowy dla **każdego** wzoru z listy |
| 23 | Kamień ma fasety, liczone wobec faset rondysty |
| 26 | Ramię sygnetu jest kanciaste |
| 27 | Wnętrze obrączki jest ciągłe |
| 29 | Rura na zgiętym torze nie ma karbów, z kontrolą negatywną |
| 30 | Halo: gniazdo ma stożek, kulki stoją przy nim |

`scripts/test-ring-pricing.mjs` pilnuje, żeby wiersze rozpiski sumowały się do
"Razem", a "Razem" równało się cenie kafelka.

---

# Dziennik wniosków

Dopisujemy **na górze**, jeden wpis na zmianę geometrii. Format: co było, co jest,
i **czego się z tego dowiedzieliśmy na przyszłość**.

## 2026-08-16 (noc) - kaseta zakuta odsłania kamień, i jedna hipoteza obalona pomiarem

**Zgłoszenie:** "zbyt mocno zakute, zbyt mało światła, musi być widać kamień",
dotyczy wszystkich osadzeń kasetowych.

**Co jest.** Rant w stanie zakutym schodzi z `girdleH + 0,42` na `girdleH + 0,34`
i zbiega do `wall * (-0,05)`, czyli minimalnie ZA obrys kamienia. Chwyt bierze
się teraz z zachodzenia na koronę, a nie z wysokości ściany, więc kamień jest
trzymany tak samo, a widać go więcej. Zmierzone (objętość kamienia ponad licem
metalu): kaseta okrągła 15,6 -> 19,0 %, ośmiokąt 10,8 -> 13,5 %, kaboszon
53,3 -> 58,3 %. Sprawdzian trzymania: 0,43 % przy progu 0,30 %.

**Obalona hipoteza, warta zapisania.** Zobaczyłem ciemny kaboszon na renderze
i uznałem, że to moja wcześniejsza zmiana rantu zakopała kamień w studni.
Wysłałem nawet agenta do poprawiania materiałów kamieni bezbarwnych, który
stracił godzinę bez rezultatu. **Pomiar to obalił**: kaboszon miał wtedy 53 %
objętości ponad licem metalu, czyli był odsłonięty bardziej niż w stanie
otwartym. Ciemny wygląd bierze się z gładkiej kopuły bez fasetek, która na
ciemnym tle nie ma czego odbić, i nie jest to regresja.

**Wniosek:** render jest kiepskim czujnikiem geometrii. Ciemna plama na obrazku
może znaczyć brak metalu, brak światła albo brak fasetek, a rozróżnia to
wyłącznie pomiar bryły. Kolejność jest więc odwrotna niż zwykle: zobacz na
renderze, ŻE coś jest nie tak, ale nigdy nie wnioskuj z renderu, CO.

**Potwierdzone na podglądzie** (co oglądać przy następnej zmianie tych trzech
rzeczy): kaseta z gruszką ma cienki rant obrysowujący kamień, a nie studnię
i symetryczny obrys po obu bokach szpica; eternity z włączonymi kamieniami
pokazuje pary rozdzielonych krap dogniętych na sąsiednie kamienie, a nie proste
słupki; trylogia z bocznymi gruszkami ma oprawki boczne o obrysie gruszki,
wyraźnie nieokrągłe.

## 2026-08-16 (wieczór) - kamień bezbarwny wyglądał jak zaślepka, i trzy poprawki zakucia

**Najważniejsza lekcja tej rundy nie jest geometryczna.** Właściciel czwarty raz
zgłosił "gniazda zakryte" na układach, które pomiarowo były otwarte. Odtworzyłem
jego widoki u siebie i przyczyną okazał się RENDER: kamień bezbarwny (cyrkonia,
brylant) na ciemnym tle rysował się jako szara, nieprzezroczysta bryła nie do
odróżnienia od metalu. Osadzony kamień wyglądał jak metalowy korek, więc każdy
układ z bezbarwnym kamieniem czytał się jako "gniazdo zamknięte". Ametyst
wyglądał dobrze, bo barwę niesie attenuacja. **Zanim szuka się wady w bryle,
trzeba obejrzeć dokładnie ten widok, który widzi zgłaszający, z tym samym
kamieniem i tym samym przełącznikiem.** Pomiar bryły nie widzi materiałów.

**Kaseta po zakuciu odsłania koronę.** Rant miał jedną wysokość w obu stanach,
więc kamień po zakuciu siedział na dnie studni i widać było tylko taflę.
Teraz stan otwarty stoi wysoko (metal do dogięcia), a stan zakuty nisko:
`girdleH + 0.42`, ze zbiegiem do `wall * 0.15` nad obrysem kamienia. Trzyma
(kolizja podniesionego kamienia 0,3+ %), a korona świeci.

**Krapy eternity w stanie zakutym są rozdzielone na dwa.** Tak jak robi to
jubiler: każda połówka krótsza (0,72 długości), cieńsza (0,8 promienia)
i pochylona o 26 stopni ku swojemu kamieniowi. Stan otwarty zostaje prosty
i pełnej długości. Sprawdzian 32 mierzy oba stany: otwarty ma sterczeć,
zakuty ma trzymać (zmierzone 3,2-8,3 % kolizji podniesionego kamienia).

**Oprawka boczna idzie za obrysem kamienia.** Kosz był walcem niezależnie od
szlifu, więc markiza na boku siedziała w okrągłej tulei. Teraz dno i rant to
przeskalowany obrys (`outlineFor`), a łapki stoją na promieniu obrysu pod swoim
kątem (`radiusAt`), tak samo jak przy koronie centralnej.

## 2026-08-16 - oprawka boczna, symetria obrysów, i cofnięcie mojej własnej poprawki

**Zakucie wraca pod przełącznik.** Dzień wcześniej wpisałem `zakute() => false`
na sztywno, uznając, że model odlewniczy ma mieć gniazda otwarte zawsze.
Rozumowanie było poprawne, ale **diagnoza fałszywa**: właściciel zgłaszał zakryte
gniazda przy WYŁĄCZONYCH kamieniach, a ja policzyłem, że skoro przełącznik
domyślnie stoi na TAK, to musiał go mieć włączonego. Nie miał. Obowiązuje
z powrotem: kamień w modelu = wyrób gotowy, łapki dociśnięte; kamień wyłączony =
model odlewniczy, łapki otwarte.

**Wniosek, którego nie chcę powtórzyć:** gdy zgłoszenie nie zgadza się
z ustawieniem domyślnym, to jest powód, żeby SPRAWDZIĆ, a nie żeby poprawić
ustawienie. Poprawka trafiła w objaw wspólny dla pięciu układów i przez to
wyglądała na przyczynę wspólną. Prawdziwe przyczyny były trzy, wszystkie lokalne.

**Oprawka kamieni bocznych była litym stożkiem.** Gniazdo wycinało w niej
kieszeń i kamień naprawdę wchodził, więc każdy pomiar to przepuszczał, a wyrób
czytał się jak zamknięty kubek z łapkami. Kamień centralny miał okna galerii od
początku i właśnie dlatego przy tych samych ustawieniach wyglądał dobrze.
Oprawka ma teraz dwa okna na wylot między łapkami i rant grubszy o 0,14 mm.

**Trzecie z rzędu miejsce z rantem za cienkim.** Kaseta miała 0,13 mm, oprawka
boczna 0,13 mm, krapy eternity stały dokładnie na promieniu wlotu. Za każdym
razem ten sam błąd: element policzony względem obrysu kamienia zamiast względem
promienia wlotu gniazda, który ma `size / 2 + luz` i zjada wszystko, co w niego
wejdzie. To jest reguła, nie zbieg okoliczności.

**Gruszka i brioleta miały obrys niesymetryczny.** We wzorze stało
`Math.max(0, Math.cos(a / 2))`, a kąt biegnie od `-PI/2` do `3PI/2`, więc na
ostatniej ćwiartce cosinus jest ujemny i obcięcie do zera zostawiało tam PEŁNĄ
szerokość, podczas gdy po drugiej stronie kształt zwężał się normalnie. Jeden
bok wychodził grubszy o 0,19 mm przy kamieniu 7 mm. Poprawka to `Math.abs`.

Na samym kamieniu tego nie widać, bo fasetki rozpraszają wzrok. **Widać to na
kasecie**, bo rant powtarza obrys i powiela jego skrzywienie. Stąd zgłoszenie
brzmiało "dziwne wybrzuszenie w oprawie gruszki", czyli wskazywało oprawę,
podczas gdy wada siedziała w kamieniu.

**Brioleta ważyła zero karatów.** W liczeniu masy stało
`p.setting === "drilled" ? 0 : 1`. Briolety się nie osadza, tylko wierci
i wiesza na kabłąku, więc ktoś uznał, że skoro nie ma gniazda, to nie ma
kamienia. Kamień wisi, waży i kosztuje.

**Szlif kamieni bocznych** jest teraz wyborem klienta. Lista jest węższa od
listy szlifów centralnych i to nie kwestia gustu: bagietka rozsypuje wyrób na
dziewięć części, bo jej gniazdo jest długie i wąskie, a łapki stoją po
przekątnych poza obrysem i wycięcie przecina im nogi. Bagietka wróci razem
z oprawą kanałową. Brioleta jako kamień boczny nie ma sensu w ogóle.

**Sprawdzian przechodzący na pustej liście to sprawdzian, który kłamie.** Sekcja
33 raportowała wynik pozytywny, bo `withStones` nie przebijało przełącznika
klienta i dostawała zero kamieni do zmierzenia. Teraz liczy, ile presetów
faktycznie zmierzyła, i wypisuje te, które pominęła.

## 2026-08-16 - kaseta: rant zbiegał do setnej milimetra

**Co było.** Ścianka kasety miała 0,4 mm i zbiegała u góry o `wall * 0,85`,
czyli do promienia `size / 2 + 0,06`. Wlot gniazda ma promień `size / 2 + 0,05`,
więc **z rantu zostawała u góry jedna setna milimetra**: 3,06 wobec 3,05 mm przy
kamieniu 6 mm. Kontrola negatywna zmierzyła średnio 0,148 mm na plastrze 0,1 mm.

**Co jest.** Ścianka idzie za rozmiarem kamienia (`max(0,45; size * 0,1)`),
rant jest wyższy (`crownH * 0,35 + 0,35`) i zbiega tylko do 0,6 swojej grubości.
Po odjęciu wlotu zostaje 0,34-0,40 mm litego metalu na wysokości 0,75-1,44 mm
ponad rondystą.

**Czego się dowiedzieliśmy.**

- **„Kamień wchodzi do gniazda" to za mało.** Sprawdzian 33 przepuszczał kasetę,
  bo kamień faktycznie wchodził. Wada polegała na tym, że WOKÓŁ niego nie było
  ściany: kaseta czytała się jak płaska płyta z dziurą. Gniazdo to otwór **plus**
  metal, który ten otwór obudowuje, i jedno bez drugiego nie jest gniazdem.
- **Każdy element stykający się z wlotem gniazda trzeba policzyć względem
  promienia wlotu**, a nie względem obrysu kamienia. Wlot ma `size / 2 + luz`
  i zjada wszystko, co w niego wchodzi. Ten sam błąd co przy krapach eternity
  (`d * 0,56` wobec wlotu `d / 2 + 0,05`), popełniony w drugim miejscu
  niezależnie.
- **Sprawdzian 33 idzie po WSZYSTKICH presetach.** Poprzedni brał osiem układów
  ułożonych ręcznie i przechodził, gdy właściciel patrzył na presety. Nowy
  preset wchodzi teraz do sprawdzianu sam.
- **Oś kamienia bierzemy z kamienia, nie z jego położenia.** Wieniec halo jest
  równoległy do kamienia centralnego, więc kamyk z boku wieńca ma oś odchyloną
  od własnego promienia. Sonda podnosząca go „na zewnątrz" jechała ukosem
  i meldowała gniazdo zakryte przy poprawnej bryle. Oś liczymy z tafli
  (największe płaskie lice), a jej zwrot z położenia, bo kaboszon tafli nie ma
  i jego największym licem jest spód.
- **Poziom rondysty znajdujemy, a nie liczymy z proporcji szlifu**: to miejsce,
  w którym kamień jest najszerszy. Wzór wzięty z brylanta wypadał przy kaboszonie
  o pół milimetra obok.

## 2026-08-16 - krapy eternity: między kamieniami, wystające, do rozdzielenia

**Co było.** Dwie gładkie kule o promieniu 0,28 mm, na tym samym kącie co
kamień, odsunięte od środkowej o `d * 0,56`. Trzy błędy naraz, każdy sam
w sobie wystarczający:

1. **Stały przy jednym kamieniu**, więc na otwór przypadały dwie krapy zamiast
   czterech.
2. `d * 0,56` **to promień wlotu gniazda co do setnych** (`d / 2 + 0,05`), więc
   wycięcie gniazda zjadało kulę niemal w całości.
3. **Kula nie jest krapą.** Zmierzone kontrolą negatywną: ponad licem szyny nie
   zostawało ANI JEDNEGO osobnego kawałka metalu przy kamieniu. Nie było czego
   wziąć rylcem.

**Co jest.** Krapy stoją **w przerwie między sąsiednimi kamieniami**, więc każda
trzyma dwa kamienie i każdy kamień ma cztery punkty podparcia przy tej samej
liczbie krap. Odsunięcie od środkowej jest **liczone**, nie zgadywane: chcemy
odległości `d / 2 + 0,32 * kula` od osi każdego z sąsiadów, połowa odstępu
obwodowego jest dana, więc zostaje Pitagoras. Przy ciasnym rozstawie wynik
schodzi do zera i podnosimy go do `kula * 1,15`, żeby dwie krapy z jednej
przerwy były osobne. Krapa to stożek ścięty zwieńczony kulką, wystający
`max(0,34; d * 0,42)` ponad lico: jest co rozdzielić i jest co przełożyć nad
rondystę.

**Czego się dowiedzieliśmy.**

- **Krapa musi wystawać.** Element wtopiony w metal wygląda na renderze jak
  zakucie i nie jest zakuciem. To już drugi raz ta sama pomyłka: pierwszy przy
  pavé na ramionach, drugi tutaj. Wzorzec jest wspólny i trzeba go stosować
  wszędzie, gdzie coś ma trzymać kamień.
- **Model odlewniczy nie ma metalu nad rondystą** i tak ma być. Wlot gniazda
  wycina wszystko w promieniu `d / 2 + luz`, więc żadna krapa nie może w nim
  leżeć. Przełożenie nad kamień to robota jubilera, nie geometria pliku.
  Sprawdzać więc liczbę, wysokość i grubość krap, a nie zachodzenie na kamień.
- **Sonda musi trafić w rondystę, a nie w środek bryły kamienia.** Kamień leży
  taflą na zewnątrz, więc środek jego pudełka wypada gdzie indziej niż rondysta.
  Pierwsza wersja sondy myliła się o kilka dziesiątych milimetra i pokazywała
  dwie krapy zamiast czterech, przy poprawnej bryle. Promień rondysty liczymy
  jako `bbox.max[0] - (girdleH + crownH)`.
- **Plaster liczący krapy kładziemy nad LICEM SZYNY**, nie nad rondystą: kamień
  jest zanurzony, więc na wysokości rondysty stoi jeszcze lita szyna i wszystko
  zlewa się w jeden kawałek.

## 2026-08-16 - podgląd kamienia przestaje zamykać gniazda

**Co było.** `zakute(p)` zwracało `p.casting.stones !== false`, a ten przełącznik
domyślnie stoi na TAK. Model z kamieniem dostawał więc wlot w kształcie samego
kamienia plus słupek w szerokości tafli, czyli gniazdo widziane z góry było
zakryte, a łapki leżały na koronie. Wyglądało to jak wyrób gotowy i taki był
zamiar.

**Co jest.** `zakute()` zwraca zawsze `false`. Metal nie zależy od niczego, co
jest tylko podglądem. Parametr `zamkniete` w `seatCutter` zostaje, bo to
poprawna geometria łapki leżącej na koronie, ale nic w wyrobie go nie używa.

**Czego się dowiedzieliśmy.** To, co kreator wydaje, jest **modelem
odlewniczym**. Gniazda mają być otwarte zawsze, bo inaczej nie ma jak włożyć
kamienia. Podgląd jest warstwą rysunku i nie ma prawa ruszać bryły, a już na
pewno nie masy, po której liczymy cenę. Właściciel zgłosił to pięć razy pod rząd
na pięciu różnych układach, zanim znalazłem wspólną przyczynę: szukałem wady
w każdym gnieździe z osobna, a wada siedziała w jednej linijce wspólnej dla
wszystkich.

Sprawdziany też trzeba było odwrócić. Wymagały wcześniej, żeby plik z kamieniem
był LŻEJSZY (docisnięte łapki), więc broniły dokładnie tego zachowania, które
było wadą. Teraz wymagają czegoś mocniejszego i prostszego: **przełącznik
podglądu nie zmienia metalu o więcej niż 0,01 %**, i jest to sprawdzane osobno
na ośmiu układach.

## 2026-08-15 - noga lapki po scianie kosza, i jedna poprawka WYCOFANA

**Było:** noga łapki schodziła na dno kosza po niemal stałym promieniu, a kosz
zwęża się do 0,55 obrysu. Zmierzone sondą wzdłuż promienia: na dnie kosza dwa
osobne kawałki metalu, między nimi **0,62 mm powietrza przy soliterze i 0,70 mm
przy sześciu łapkach**. Łapka zaczepiała się o oprawę dopiero pod rondystą.

**Jest:** noga idzie po ścianie kosza, od `0.55 * obrys + ścianka` na dnie do
pełnego obrysu przy kołnierzu. Sonda widzi jeden kawałek na każdej wysokości.

**Nauka, dwie i obie o metodzie:**

1. **Zobaczyć, zanim się poprawi.** Trzy rundy zgłoszeń przerobiłem, czytając
   kod i licząc, i za każdym razem trafiałem obok. Dopiero wyrenderowanie
   podglądu u siebie (Playwright plus Chromium z `/opt/pw-browsers`, `vite
   preview` na `dist`) pokazało wprost, co wisi i gdzie. **To jest tania
   czynność i ma być pierwsza, a nie ostatnia.**
2. **Poprawka bez pomiaru bywa szkodą.** Przy okazji "naprawiłem" koniec łuku
   galerii, bo wyglądał mi na wystający korek. Pomiar po fakcie pokazał, że
   wystawanie łuku spada gładko do zera na 32 stopniach od głowicy, czyli
   żadnego korka nie było, a poprawka zabrała łukowi 10% metalu i przy pierwszym
   podejściu wepchnęła rurę w otwór na palec (średnica wewnętrzna mniejsza
   o 0,11 mm na każdym rozmiarze). **Zmiana została wycofana.** Okrągły element
   widoczny w szynie przy głowicy to przewiercone gniazdo i ma tam być.

## 2026-08-15 - wieniec halo: gniazdo i kuleczki (`d67d91b`)

**Było:** płyta wieńca wybierana od spodu do sztywnych 0,55 mm. Przy kamyku 1,3 mm
otwór zwężał się do 0,85 mm i natychmiast otwierał do 1,39 mm, bo dalej było już
tylko wybranie. Kamień leżał na krawędzi dwóch dziesiątych zamiast na stożku.
Kuleczki odsunięte o pełny promień kamienia, czyli daleko od obu gniazd.

**Jest:** płyta `max(1.05, d * 0.95)`, gniazdo `max(0.55, d * 0.62)`. Otwór u dna
45-54% średnicy kamienia. Kuleczka na najmniejszym odsunięciu mijającym wlot obu
sąsiadów, z podłogą 1,6 promienia kuleczki.

**Nauka:** grubość nośnika gniazda jest **częścią gniazda**, a nie tłem dla niego.
Stała liczba w milimetrach przy parametrze, który klient skaluje, jest wadą
czekającą na zgłoszenie. Podłoga 1,15 promienia kuleczki nie wystarczyła: przy
kamyku 1,8 mm para zlewała się w jeden wałek, co widać dopiero po policzeniu
kawałków, nie na renderze.

## 2026-08-15 - rury przeciągane zamiast sklejanych stożków (`748b9cf`)

**Było:** rura jako suma ściętych stożków z kulami w złączach, potem z progiem
skrętu 10°. Klient zgłaszał karbowanie trzy razy, za każdym razem w innym miejscu.

**Jest:** jedna powłoka przeciągnięta po torze, z korektą mitry, i suma stożków
tylko jako zapas na ciasny skręt.

**Nauka:** dwie poprawki z rzędu leczyły objaw i obie wyglądały na skuteczne
w kodzie. Przyczyną było samo założenie, że bryłę złożoną z kawałków da się
wygładzić. **Kiedy poprawka polega na dokładaniu materiału w miejscu, gdzie coś
wygląda źle, to jest objaw.** Do tego: pierwszy pomiar tego karbu porównywał rurę
z kołem zamiast z wielokątem wpisanym i mierzył dyskretyzację.

## 2026-08-15 - szyna przecięta przez otwór gniazda (`0f0242b`)

**Było:** wylot gniazda centralnego to połowa szerokości kamienia, czyli ponad
3 mm przy kamieniu 6 mm, przy szynie 2,4 mm. Otwór był szerszy od szyny i ciął ją
na wylot. Liczba części i `genus` niczego nie zgłaszały.

**Jest:** `minInnerStrip = 0.55` mm metalu po stronie palca, wylot zwężany do tego,
co szyna udźwignie. Kamienie na szynie liczą wylot z odstępu sąsiadów po promieniu
wewnętrznym.

**Nauka:** to jest wzorcowy przykład awarii cichej. Sprawdzian musi mierzyć
**powierzchnię, której klient dotyka**, a nie topologię bryły.

## 2026-08-18 - szyna przecięta pod kamieniem podniesionym na łapkach

**Było:** gniazdo kamienia bocznego zawsze kończyło się przelotem o długości
dwóch średnic kamienia, także wtedy, gdy kamień stoi **ponad** szyną we własnym
koszu. Przy trylogii, czyli kamieniu 4 mm na szynie 2,2 mm, otwór 1,94 mm
zostawiał po 0,13 mm metalu z każdej strony. Zmierzone: pasek metalu w warstwie
0,25 mm nad palcem rozpadał się na **dwa kawałki**, najchudszy przekrój 0,082 mm3
w plastrze 0,2 mm. Właściciel zgłosił to jako "przerwana szyna pod kamieniami
bocznymi, przecinanie niedozwolone".

**Jest:** gniazdo kamienia podniesionego jest **ślepe**: kończy się 0,15 mm pod
koletą i nie idzie dalej w szynę. Światło wchodzi oknami w koszu, które kosz ma
od poprzedniej poprawki. Kamień **wpuszczony** w szynę ma przelot nadal, bo tam
jest on jedyną drogą światła i jedyną drogą wypchnięcia kamienia od spodu.
Po poprawce: pasek ciągły, najchudszy przekrój 0,237 mm3, czyli prawie trzy razy
więcej metalu.

**Nauka:** sprawdzian 17 liczył części **całej bryły** i przepuścił to, bo bryła
trzymała się kupy przez koronę, galerię i te dwa włoski metalu. Objętość, masa
i `genus` były poprawne. Strażnikiem jest teraz sprawdzian 37, który mierzy dwie
rzeczy, jakich tamten nie mierzył: **ciągłość paska metalu przy palcu** (warstwa
0,3 mm nad średnicą wewnętrzną) i **najchudszy przekrój po obwodzie** (plaster
0,2 mm co dwa stopnie, próg 0,10 mm3, czyli pół milimetra kwadratowego). Kontrola
negatywna: po cofnięciu poprawki sprawdzian wywala trylogię i cztery układy
z macierzy obciążeniowej.

**Znalezione przy okazji, NIEPOPRAWIONE, czeka na decyzję właściciela:** granica
rozmiaru kamienia wpuszczanego liczy się z **nominalnej** szerokości szyny,
a przy szynie zwężanej kamienie siedzą tam, gdzie szyna ma 70-75% tej szerokości.
Układ 3,2 mm ze zwężeniem i kamieniem kanałowym 2,3 mm zostawia dwa luźne okruchy
po 0,046 mm3. W presetach `pave` i `diana` szynki obok gniazda schodzą do około
0,09 mm. Poprawka albo zmniejsza kamienie w istniejących wzorach, albo zmienia
sylwetkę zwężanej szyny; jedno i drugie widać na wyrobie, więc nie robimy tego
bez decyzji.

## 2026-08-24 - osobne bryly produkcyjne i lokalna granica kamienia

**Było:** jeden parametr `casting.stones` sterował jednocześnie podglądem,
domknięciem łapek i zawartością pliku produkcyjnego. Przełącznik widoczności
kamieni mógł więc zmienić metal, masę i eksport. Granica kamienia wpuszczanego
wynikała z nominalnej szerokości szyny, chociaż przy `tapered` kamień leży na
węższym odcinku. Niewykonalne wartości były po cichu zmniejszane, a znany
przypadek kanału 2,3 mm w zwężanej szynie 3,2 mm nie należał do macierzy testów.

**Jest:** generator ma trzy jawne tryby. `casting` zwraca wyłącznie metal z
otwartymi łapkami, `finishedPreview` pokazuje gotowy wyrób, a
`referenceAssembly` zachowuje metal i kamienie jako osobne obiekty. Wycena i
pliki STL/3MF używają `casting`; dodatkowy 3MF referencyjny służy do kontroli
złożenia. Dopuszczalna średnica kamienia jest liczona z rzeczywistej szerokości
szyny w każdej jego pozycji. Konfiguracja niewykonalna kończy się jawnym błędem,
interfejs ogranicza suwak tą samą regułą i przywraca ostatnią poprawną wartość.
Presety `pave` i `diana` mają prostą szynę, dzięki czemu zachowują przyjęte
wymiary kamieni bez ukrytej korekty.

**Czego się dowiedzieliśmy.** Stan warstwy prezentacji nie może być wejściem do
geometrii produkcyjnej. Ograniczenie elementu osadzonego na zmiennym przekroju
trzeba liczyć lokalnie, a nie z wymiaru nominalnego. Znanej wadliwej kombinacji
nie wolno usuwać z testu: powinna pozostać kontrolą negatywną. Masa wiążąca i
eksport muszą pochodzić z dokładnie tego samego trybu odlewniczego.
