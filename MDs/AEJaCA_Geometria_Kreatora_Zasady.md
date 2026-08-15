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
