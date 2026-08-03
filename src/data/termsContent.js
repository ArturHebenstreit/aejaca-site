// Regulamin serwisu i sprzedaży.
//
// Treść trzyma się tutaj, a nie w src/i18n/*.js, bo jest długa i zmienia się
// z zupełnie innych powodów niż interfejs. Ten sam wzorzec co localPages.js.
//
// Struktura sekcji:
//   { n: "1", title: "...", items: [ "akapit", ["punkt", "punkt"] ] }
// String renderuje się jako numerowany ustęp, tablica jako lista wypunktowana
// przypięta do poprzedniego ustępu.
//
// Wersja polska jest wiążąca (patrz ostatnia sekcja). EN i DE są tłumaczeniami
// informacyjnymi, ale muszą pokrywać KAŻDĄ sekcję, inaczej regulamin czyta się
// jak niekompletny w połowie języków.

export const TERMS_EFFECTIVE_DATE = "2026-07-29";

export const TERMS = {
  pl: {
    tag: "Regulamin",
    title: "Regulamin serwisu i sprzedaży",
    lead: "Zasady korzystania z aejaca.com oraz zawierania umów sprzedaży wyrobów i usług.",
    effectiveLabel: "Obowiązuje od",
    sections: [
      {
        n: "1",
        title: "Postanowienia ogólne",
        items: [
          "Regulamin określa zasady korzystania z serwisu internetowego dostępnego pod adresem aejaca.com oraz zasady zawierania i wykonywania umów sprzedaży wyrobów i umów o świadczenie usług.",
          "Sprzedawcą jest osoba fizyczna prowadząca działalność nierejestrowaną w rozumieniu art. 5 ust. 1 ustawy Prawo przedsiębiorców. Sprzedawca nie posiada numeru NIP ani REGON, co jest stanem zgodnym z prawem, a nie brakiem danych. Nie zwalnia to Sprzedawcy z obowiązków wobec Konsumenta.",
          "Regulamin jest udostępniany nieodpłatnie w formie umożliwiającej jego pobranie, odtworzenie i zapisanie.",
          "Postanowienia Regulaminu mniej korzystne dla Konsumenta niż przepisy prawa bezwzględnie obowiązującego są nieważne, a w ich miejsce stosuje się te przepisy.",
        ],
      },
      {
        n: "2",
        title: "Definicje",
        items: [
          "Użyte w Regulaminie pojęcia oznaczają:",
          [
            "Sprzedawca - podmiot wskazany w sekcji 3.",
            "Serwis - strona internetowa aejaca.com wraz z podstronami i narzędziami.",
            "Klient - osoba korzystająca z Serwisu lub zawierająca umowę ze Sprzedawcą.",
            "Konsument - osoba fizyczna zawierająca umowę niezwiązaną bezpośrednio z jej działalnością gospodarczą lub zawodową.",
            "Przedsiębiorca na prawach konsumenta - osoba fizyczna prowadząca działalność gospodarczą, zawierająca umowę bezpośrednio związaną z tą działalnością, gdy umowa nie ma dla niej charakteru zawodowego. Przysługują jej uprawnienia opisane w sekcjach 10 i 11 na równi z Konsumentem.",
            "Kalkulator - narzędzie w Serwisie szacujące orientacyjny koszt wyrobu lub usługi.",
            "Wycena - wiążąca propozycja Sprzedawcy określająca cenę, zakres i termin realizacji.",
            "Plik - model cyfrowy przekazany przez Klienta, w szczególności w formacie STL, OBJ, 3MF lub STEP.",
            "Towar na zamówienie - rzecz nieprefabrykowana, wykonana według specyfikacji Klienta lub służąca zaspokojeniu jego zindywidualizowanych potrzeb.",
          ],
        ],
      },
      {
        n: "3",
        title: "Sprzedawca i kontakt",
        items: [
          "Sprzedawca: Artur Hebenstreit, działający pod marką AEJaCA. Adres prowadzenia działalności i adres do korespondencji: ul. Nowy Świat 33 lok. 13, 00-029 Warszawa.",
          "Pracownia, w której wykonywane są zamówienia oraz w której możliwy jest odbiór osobisty po wcześniejszym uzgodnieniu, znajduje się w Józefosławiu w gminie Piaseczno. Nie jest to adres do korespondencji.",
          "Adres poczty elektronicznej: contact@aejaca.com. Telefon: +48 780 737 786.",
          "Podstawowym kanałem kontaktu, składania oświadczeń i reklamacji jest poczta elektroniczna. Oświadczenie złożone e-mailem jest skuteczne i wystarczające, w szczególności oświadczenie o odstąpieniu od umowy.",
          "Odbiór osobisty i przekazanie rzeczy odbywają się wyłącznie po wcześniejszym uzgodnieniu terminu i miejsca.",
        ],
      },
      {
        n: "4",
        title: "Wymagania techniczne",
        items: [
          "Do korzystania z Serwisu potrzebne są: urządzenie z dostępem do internetu, aktualna przeglądarka z włączoną obsługą JavaScript oraz aktywny adres poczty elektronicznej.",
          "Do przesłania Pliku wymagany jest format STL, OBJ, 3MF lub STEP, o rozmiarze nieprzekraczającym 50 MB.",
          "Sprzedawca nie ponosi odpowiedzialności za utrudnienia wynikające z parametrów sprzętu lub łącza Klienta.",
        ],
      },
      {
        n: "5",
        title: "Usługi świadczone drogą elektroniczną",
        items: [
          "Sprzedawca świadczy nieodpłatnie następujące usługi: dostęp do treści Serwisu, Kalkulatory, formularz zapytania z możliwością przesłania Pliku, asystent oparty na sztucznej inteligencji oraz newsletter.",
          "Umowa o świadczenie usług nieodpłatnych zawierana jest z chwilą rozpoczęcia korzystania i może być rozwiązana przez Klienta w każdej chwili, bez podania przyczyny. Rezygnacja z newslettera następuje przez link w wiadomości.",
          "Klienta obowiązuje zakaz dostarczania treści bezprawnych.",
          "Wynik Kalkulatora ma charakter wyłącznie orientacyjny i informacyjny. Nie stanowi oferty w rozumieniu Kodeksu cywilnego ani Wyceny. Ceną wiążącą jest wyłącznie cena wskazana w Wycenie.",
          "Odpowiedzi asystenta opartego na sztucznej inteligencji mają charakter informacyjny i nie stanowią oferty ani porady zawodowej.",
        ],
      },
      {
        n: "6",
        title: "Zawarcie umowy",
        items: [
          "Prezentacja wyrobów i usług w Serwisie stanowi zaproszenie do zawarcia umowy, a nie ofertę.",
          "Zawarcie umowy przebiega następująco:",
          [
            "Klient przesyła zapytanie, w razie potrzeby wraz z Plikiem i opisem oczekiwań.",
            "Sprzedawca weryfikuje wykonalność i przedstawia Wycenę, wskazującą cenę, zakres, materiał, sposób wykończenia oraz termin realizacji.",
            "Wycena jest ważna przez okres w niej wskazany, nie krócej niż 7 dni. Dla wyrobów z metali szlachetnych okres ten może być krótszy z uwagi na zmienność cen surowca, o czym Sprzedawca informuje w Wycenie.",
            "Umowa zostaje zawarta z chwilą akceptacji Wyceny przez Klienta i dokonania płatności albo uzgodnionej zaliczki.",
          ],
          "Przed akceptacją Wyceny Klient otrzymuje wyraźną informację, czy zamówienie dotyczy Towaru na zamówienie, oraz o wynikającym z tego braku prawa odstąpienia. Akceptacja Wyceny obejmuje potwierdzenie zapoznania się z tą informacją.",
          "Sprzedawca może odmówić przyjęcia zamówienia, w szczególności gdy Plik jest niewykonalny technologicznie, gdy realizacja naruszałaby prawo lub prawa osób trzecich, albo gdy bieżące obłożenie warsztatu nie pozwala dotrzymać rozsądnego terminu. Wpłacone kwoty podlegają wówczas niezwłocznemu zwrotowi.",
        ],
      },
      {
        n: "7",
        title: "Ceny i płatności",
        items: [
          "Wszystkie ceny podawane są w złotych polskich i są cenami ostatecznymi. Sprzedawca korzysta ze zwolnienia z podatku od towarów i usług, w związku z czym do cen nie dolicza się VAT.",
          "Do każdego zamówienia Sprzedawca wystawia rachunek. Faktura VAT nie jest wystawiana z uwagi na status opisany w sekcji 1 ustęp 2.",
          "Płatności obsługuje Autopay S.A. Dostępne metody płatności to BLIK, szybki przelew online oraz przelew tradycyjny. Płatność kartą płatniczą nie jest obecnie dostępna. Walutą rozliczeniową jest złoty polski.",
          "Dla Klientów przeglądających serwis w języku angielskim lub niemieckim ceny prezentowane są w euro, przeliczone z ceny w złotych po kursie średnim Narodowego Banku Polskiego powiększonym o 8% na pokrycie różnic kursowych powstających między złożeniem zamówienia a zaksięgowaniem wpłaty. Cena w euro jest ceną ostateczną i nie podlega dopłacie.",
          "Zamówienie w euro opłacane jest przelewem bankowym na rachunek Sprzedawcy wskazany po złożeniu zamówienia oraz przesłany Klientowi wiadomością elektroniczną. Kwota w euro oraz rezerwacja zamówionego towaru obowiązują przez 3 dni robocze od złożenia zamówienia. Jeżeli czwartego dnia roboczego wpłata nie zostanie zaksięgowana na wskazanym rachunku, rezerwacja zostaje zdjęta, a towar wraca do sprzedaży; Klient może wówczas złożyć zamówienie ponownie, po cenie obowiązującej w tym dniu. Wpływ środków Sprzedawca potwierdza samodzielnie po zaksięgowaniu na rachunku i niezwłocznie przesyła Klientowi potwierdzenie przyjęcia należności wraz z informacją o rozpoczęciu realizacji.",
          "Przy płatności przelewem termin realizacji liczy się od dnia potwierdzenia wpływu środków, a nie od dnia złożenia zamówienia.",
          "Ceny wyrobów z metali szlachetnych zależą od bieżących notowań surowca. Po upływie okresu ważności Wyceny Sprzedawca może przedstawić Wycenę zaktualizowaną, której Klient nie ma obowiązku przyjąć.",
          "Dla zamówień o znacznej wartości lub wymagających zakupu materiałów na indywidualne życzenie Sprzedawca może uzależnić rozpoczęcie realizacji od wpłaty zaliczki, wskazanej w Wycenie.",
          "Koszt dostawy podawany jest odrębnie w Wycenie i doliczany do ceny. Wysokość kosztu zależy od kraju dostawy według stref wskazanych w zakładce Wysyłka. Paczkomat InPost dostępny jest wyłącznie przy dostawie na terenie Polski.",
          "Przy przesyłkach zagranicznych do kosztu dostawy doliczane jest 10 zł tytułem obsługi nadania i dokumentów przewozowych.",
          "Przy przesyłkach poza obszar celny Unii Europejskiej cło oraz podatek importowy nalicza urząd celny kraju odbiorcy i pobiera je przewoźnik przy doręczeniu. Należności te nie są zawarte w cenie i nie są pobierane przez Sprzedawcę. Do przesyłki dołączana jest deklaracja celna zawierająca opis zawartości i wartość zamówienia.",
          "Przesyłki o wadze powyżej 2 kg wyceniane są indywidualnie.",
        ],
      },
      {
        n: "8",
        title: "Realizacja zamówienia",
        items: [
          "Termin realizacji wskazywany jest w Wycenie i liczony w dniach roboczych od dnia zaksięgowania płatności albo zaliczki.",
          "Sprzedawca prowadzi warsztat o ograniczonej przepustowości. Podawany termin uwzględnia bieżące obłożenie i stan materiałów. Jeżeli realizacja wymaga sprowadzenia materiału, Sprzedawca informuje o tym w Wycenie.",
          "O każdym zagrożeniu terminu Sprzedawca informuje niezwłocznie i wskazuje nowy termin. Jeżeli Klient go nie akceptuje, może odstąpić od umowy, a Sprzedawca zwraca wszystkie otrzymane kwoty w terminie 14 dni.",
          "Sprzedawca może wstrzymać realizację, jeżeli w toku prac ujawni się wada Pliku uniemożliwiająca wykonanie. Klient jest wówczas informowany i może przekazać poprawiony Plik, zlecić poprawę odpłatnie albo odstąpić od umowy za zwrotem wpłaconych kwot.",
        ],
      },
      {
        n: "8a",
        title: "Usługa projektowania 3D (CAD)",
        items: [
          "Przedmiotem usługi jest wykonanie modelu trójwymiarowego zgodnie z opisem przekazanym przez Klienta przy składaniu zamówienia. Cena oraz termin wynikają z wybranego progu złożoności i zakresu plików wskazanych w zamówieniu.",
          "W cenie podstawowej mieszczą się dwie rundy poprawek. Przez rundę rozumie się jeden komplet uwag przekazany przez Klienta po otrzymaniu wersji modelu.",
          "Klient może dokupić kolejne rundy poprawek, przy zamówieniu albo w trakcie realizacji. Każda dodatkowa runda jest płatna z góry, przed jej rozpoczęciem, i przedłuża termin realizacji o jeden dzień roboczy.",
          "Jeżeli Klient nie opłaci dodatkowej rundy, realizacja kończy się na stanie po ostatniej opłaconej poprawce. Sprzedawca przekazuje pliki w opłaconym zakresie, a umowę uważa się za wykonaną.",
          "Zakres usługi nie obejmuje: zmiany koncepcji po zaakceptowaniu wersji roboczej, modelowania z fotografii bez podanych wymiarów oraz przygotowania modelu pod wymagania technologiczne innego wykonawcy. Prace te wyceniane są odrębnie.",
          "Klient otrzymuje pliki w zakresie wskazanym w zamówieniu i może z nich korzystać bez ograniczeń, także zlecając wykonanie innemu podmiotowi.",
          "Jeżeli Klient w terminie 90 dni od opłacenia projektu zamówi u Sprzedawcy jego wykonanie, opłata projektowa zostaje zaliczona na poczet ceny wykonania. Zaliczenie następuje jednorazowo i nie obejmuje kosztów dostawy.",
          "Usługa jest wykonywana według specyfikacji Klienta, w związku z czym prawo odstąpienia nie przysługuje po rozpoczęciu wykonania, zgodnie z sekcją 11.",
        ],
      },
      {
        n: "9",
        title: "Dostawa",
        items: [
          "Dostępne sposoby dostawy: paczkomat InPost, kurier oraz odbiór osobisty po wcześniejszym uzgodnieniu.",
          "Sprzedawca dostarcza rzecz na terytorium Rzeczypospolitej Polskiej. Wysyłka zagraniczna możliwa jest po indywidualnym uzgodnieniu, w tym co do kosztu i ubezpieczenia przesyłki.",
          "Niebezpieczeństwo przypadkowej utraty lub uszkodzenia rzeczy przechodzi na Konsumenta z chwilą jej wydania Konsumentowi, a nie przewoźnikowi.",
          "Zaleca się sprawdzenie stanu przesyłki przy odbiorze. Sporządzenie protokołu szkody ułatwia dochodzenie roszczeń, ale nie jest warunkiem złożenia reklamacji.",
        ],
      },
      {
        n: "10",
        title: "Prawo odstąpienia od umowy",
        items: [
          "Konsument oraz Przedsiębiorca na prawach konsumenta może odstąpić od umowy zawartej na odległość w terminie 14 dni bez podania przyczyny.",
          "Termin liczy się od objęcia rzeczy w posiadanie, a dla umowy o świadczenie usług od dnia jej zawarcia.",
          "Do zachowania terminu wystarczy wysłanie oświadczenia przed jego upływem, w tym pocztą elektroniczną na adres contact@aejaca.com. Oświadczenie nie wymaga szczególnej formy.",
          "Sprzedawca zwraca wszystkie otrzymane płatności, w tym koszt najtańszej oferowanej dostawy, w terminie 14 dni od otrzymania oświadczenia, tą samą metodą płatności, chyba że Klient wyraźnie zgodzi się na inną.",
          "Bezpośredni koszt zwrotu rzeczy ponosi Klient. Klient odpowiada za zmniejszenie wartości rzeczy wynikające z korzystania z niej w sposób wykraczający poza konieczny do stwierdzenia jej charakteru, cech i funkcjonowania.",
          "Prawo odstąpienia nie przysługuje w przypadkach wskazanych w art. 38 ustawy o prawach konsumenta, a w szczególności gdy przedmiotem świadczenia jest Towar na zamówienie. Dotyczy to zwłaszcza:",
          [
            "wydruków wykonanych z Pliku przekazanego przez Klienta,",
            "wyrobów grawerowanych lub znakowanych treścią wskazaną przez Klienta,",
            "biżuterii wykonanej według indywidualnego projektu, w tym z doborem rozmiaru,",
            "wyrobów z użyciem kamieni lub kruszców sprowadzonych na indywidualne życzenie,",
            "usług projektowych wykonanych w całości za wyraźną zgodą Klienta na rozpoczęcie przed upływem terminu odstąpienia.",
          ],
          "Sprzedawca informuje o braku prawa odstąpienia przed złożeniem zamówienia, a nie po jego realizacji. Informacja ta jest częścią Wyceny.",
        ],
      },
      {
        n: "11",
        title: "Reklamacje i niezgodność z umową",
        items: [
          "Sprzedawca odpowiada wobec Konsumenta za brak zgodności towaru z umową istniejący w chwili dostarczenia i ujawniony w ciągu dwóch lat od tej chwili.",
          "Reklamację składa się na adres contact@aejaca.com, wskazując opis niezgodności, datę jej stwierdzenia oraz żądanie.",
          "Sprzedawca rozpatruje reklamację w terminie 14 dni od jej otrzymania. Brak odpowiedzi w tym terminie oznacza uznanie reklamacji.",
          "Klient może żądać naprawy albo wymiany. Jeżeli naprawa lub wymiana są niemożliwe albo wymagałyby nadmiernych kosztów, Klient może żądać obniżenia ceny albo odstąpić od umowy, chyba że brak zgodności jest nieistotny.",
          "Niezależnie od powyższego Sprzedawca udziela odrębnej, dobrowolnej gwarancji, której warunki opisuje strona Gwarancja. Gwarancja nie wyłącza ani nie ogranicza uprawnień wynikających z przepisów.",
          "Treści cyfrowe (pliki do pobrania) mają własny reżim odpowiedzialności, opisany w rozdziale 5b ustawy o prawach konsumenta. Sprzedawca odpowiada za brak zgodności treści cyfrowej z umową, który ujawnił się w ciągu dwóch lat od dostarczenia, a przy dostarczeniu jednorazowym domniemywa się, że brak zgodności istniał w chwili dostarczenia, jeżeli ujawnił się w ciągu roku. Klient może żądać doprowadzenia treści do zgodności, a gdy jest to niemożliwe albo wymagałoby nadmiernych kosztów, obniżenia ceny albo odstąpienia od umowy. Reklamację składa się tak samo, na contact@aejaca.com.",
        ],
      },
      {
        n: "12",
        title: "Pliki, treści i prawa autorskie",
        items: [
          "Przekazując Plik lub treść do wykonania, Klient oświadcza, że przysługują mu prawa pozwalające na jej zwielokrotnienie i wykonanie, albo że korzysta z niej w granicach dozwolonych prawem.",
          "Sprzedawca nie ma obowiązku i nie posiada możliwości weryfikacji praw do Pliku. Odpowiedzialność wobec osób trzecich z tego tytułu ponosi Klient.",
          "Sprzedawca odmawia realizacji zamówień dotyczących w szczególności broni i jej istotnych części, przedmiotów niebezpiecznych, zabezpieczeń i kluczy bez wykazania uprawnienia, a także treści naruszających prawa osób trzecich lub przepisy prawa.",
          "Pliki przekazane przez Klienta przechowywane są przez okres niezbędny do realizacji zamówienia i obsługi ewentualnych reklamacji, nie dłużej niż 24 miesiące. Na żądanie Klienta są usuwane wcześniej, o ile nie stoi temu na przeszkodzie obowiązek prawny.",
          "Jeżeli model powstał w ramach usługi projektowej, Klient wraz z odbiorem otrzymuje plik źródłowy w formacie STL lub STEP oraz prawo do korzystania z niego bez ograniczeń terytorialnych i ilościowych, w tym u innych wykonawców. Autorskie prawa osobiste twórcy pozostają niezbywalne.",
          "Sprzedawca może prezentować zrealizowane prace w portfolio i materiałach marketingowych, chyba że Klient zastrzeże inaczej przed realizacją. Zastrzeżenie nie wpływa na cenę.",
        ],
      },
      {
        n: "13",
        title: "Właściwości technologiczne, które nie są wadą",
        items: [
          "Wyroby powstają technikami wytwarzania przyrostowego, obróbki laserowej i odlewnictwa. Poniższe cechy wynikają z natury tych technologii i nie stanowią braku zgodności z umową, o ile nie uzgodniono inaczej w Wycenie:",
          [
            "odchyłki wymiarowe do 0,5 mm dla druku FDM oraz do 0,2 mm dla druku żywicznego, liczone dla wymiarów gabarytowych,",
            "widoczna struktura warstw, będąca cechą rozpoznawczą druku przestrzennego,",
            "ślady po elementach podporowych na powierzchniach wskazanych w Wycenie jako podpierane,",
            "różnice odcienia materiału pomiędzy partiami produkcyjnymi filamentu lub żywicy,",
            "naturalne różnice powierzchni odlewu przed obróbką wykończeniową,",
            "inkluzje, wtrącenia i różnice barwy naturalnych kamieni, będące ich cechą naturalną.",
          ],
          "Jeżeli zamówienie wymaga tolerancji ściślejszych niż wskazane wyżej, Klient zgłasza to przed Wyceną. Sprzedawca potwierdza wykonalność albo odmawia przyjęcia zamówienia. Tolerancja uzgodniona w Wycenie jest wiążąca.",
          "Sprzedawca nie odpowiada za przydatność wyrobu do zastosowania, o którym nie został poinformowany przed zawarciem umowy, w szczególności do zastosowań konstrukcyjnych, medycznych lub mających kontakt z żywnością.",
        ],
      },
      {
        n: "14",
        title: "Dane osobowe",
        items: [
          "Administratorem danych osobowych jest Sprzedawca wskazany w sekcji 3.",
          "Zasady przetwarzania danych, podstawy prawne, okresy przechowywania oraz prawa osób, których dane dotyczą, opisuje Polityka prywatności.",
        ],
      },
      {
        n: "15",
        title: "Pozasądowe rozwiązywanie sporów",
        items: [
          "Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w szczególności:",
          [
            "zwrócić się do powiatowego lub miejskiego rzecznika konsumentów,",
            "zwrócić się do wojewódzkiego inspektora Inspekcji Handlowej o wszczęcie postępowania mediacyjnego lub o rozpatrzenie sprawy przed stałym sądem polubownym,",
            "skorzystać z bezpłatnej pomocy organizacji społecznych, których zadaniem statutowym jest ochrona konsumentów,",
            "skorzystać z informacji dostępnych pod adresem uokik.gov.pl.",
          ],
          "Skorzystanie z tych trybów jest dobrowolne i wymaga zgody obu stron.",
        ],
      },
      {
        n: "16",
        title: "Zmiany Regulaminu",
        items: [
          "Sprzedawca może zmienić Regulamin z ważnych przyczyn, w szczególności zmiany przepisów, zmiany zakresu oferty, zmiany metod płatności lub dostawy albo zmiany formy prawnej prowadzenia działalności.",
          "Zmiana wchodzi w życie po upływie 7 dni od jej ogłoszenia w Serwisie.",
          "Do zamówień złożonych przed wejściem zmiany w życie stosuje się Regulamin w brzmieniu dotychczasowym.",
        ],
      },
      {
        n: "17",
        title: "Postanowienia końcowe",
        items: [
          "W sprawach nieuregulowanych stosuje się prawo polskie, w szczególności Kodeks cywilny oraz ustawę o prawach konsumenta. Wybór prawa polskiego nie pozbawia Konsumenta ochrony wynikającej z bezwzględnie obowiązujących przepisów państwa jego zwykłego pobytu.",
          "Regulamin udostępniany jest w językach polskim, angielskim i niemieckim. W razie rozbieżności wiążąca jest wersja polska.",
          "Regulamin obowiązuje od dnia wskazanego na początku dokumentu.",
        ],
      },
    ],
  },

  en: {
    tag: "Terms",
    title: "Terms of Service and Sale",
    lead: "Rules for using aejaca.com and for concluding contracts of sale for goods and services.",
    effectiveLabel: "Effective from",
    sections: [
      {
        n: "1",
        title: "General provisions",
        items: [
          "These Terms set out the rules for using the website at aejaca.com and for concluding and performing contracts of sale for goods and contracts for the provision of services.",
          "The Seller is a natural person carrying out unregistered business activity within the meaning of Article 5(1) of the Polish Entrepreneurs' Law. The Seller holds no NIP or REGON number; this is a lawful status, not missing information. It does not release the Seller from any obligation towards Consumers.",
          "These Terms are made available free of charge in a form allowing them to be downloaded, reproduced and stored.",
          "Any provision less favourable to the Consumer than mandatory law is void and is replaced by that law.",
        ],
      },
      {
        n: "2",
        title: "Definitions",
        items: [
          "The terms used have the following meanings:",
          [
            "Seller - the entity identified in section 3.",
            "Website - aejaca.com together with its subpages and tools.",
            "Customer - any person using the Website or entering into a contract with the Seller.",
            "Consumer - a natural person entering into a contract not directly connected with their business or professional activity.",
            "Entrepreneur with consumer rights - a natural person running a business who enters into a contract directly connected with that business where the contract is not of a professional character for them. They enjoy the rights described in sections 10 and 11 on equal terms with Consumers.",
            "Calculator - a tool on the Website estimating the indicative cost of a product or service.",
            "Quotation - a binding proposal by the Seller stating price, scope and lead time.",
            "File - a digital model supplied by the Customer, in particular in STL, OBJ, 3MF or STEP format.",
            "Made-to-order goods - non-prefabricated goods manufactured to the Customer's specification or serving their individualised needs.",
          ],
        ],
      },
      {
        n: "3",
        title: "Seller and contact",
        items: [
          "Seller: Artur Hebenstreit, trading under the AEJaCA brand. Business and correspondence address: ul. Nowy Świat 33 lok. 13, 00-029 Warsaw, Poland.",
          "The workshop where orders are produced, and where personal collection is possible by prior arrangement, is located in Józefosław, Piaseczno municipality. It is not a correspondence address.",
          "Email: contact@aejaca.com. Telephone: +48 780 737 786.",
          "Email is the primary channel for contact, declarations and complaints. A declaration made by email is effective and sufficient, in particular a declaration of withdrawal from a contract.",
          "Personal collection and handover take place only after the time and place have been agreed in advance.",
        ],
      },
      {
        n: "4",
        title: "Technical requirements",
        items: [
          "Using the Website requires a device with internet access, a current browser with JavaScript enabled, and an active email address.",
          "Submitting a File requires STL, OBJ, 3MF or STEP format, up to 50 MB in size.",
          "The Seller is not liable for difficulties arising from the Customer's own hardware or connection.",
        ],
      },
      {
        n: "5",
        title: "Services provided electronically",
        items: [
          "The Seller provides the following services free of charge: access to Website content, Calculators, an enquiry form with File upload, an artificial-intelligence assistant, and a newsletter.",
          "The contract for free services is concluded when use begins and may be terminated by the Customer at any time without giving reasons. The newsletter is cancelled via the link in each message.",
          "The Customer must not supply unlawful content.",
          "A Calculator result is indicative and informational only. It constitutes neither an offer within the meaning of the Polish Civil Code nor a Quotation. Only the price stated in a Quotation is binding.",
          "Responses from the artificial-intelligence assistant are informational and constitute neither an offer nor professional advice.",
        ],
      },
      {
        n: "6",
        title: "Conclusion of contract",
        items: [
          "The presentation of goods and services on the Website is an invitation to conclude a contract, not an offer.",
          "A contract is concluded as follows:",
          [
            "The Customer submits an enquiry, where relevant with a File and a description of requirements.",
            "The Seller verifies feasibility and issues a Quotation stating price, scope, material, finish and lead time.",
            "The Quotation is valid for the period stated in it, and no less than 7 days. For precious-metal items this period may be shorter because of raw-material price volatility; the Seller states this in the Quotation.",
            "The contract is concluded when the Customer accepts the Quotation and makes payment or the agreed deposit.",
          ],
          "Before accepting a Quotation the Customer receives clear information as to whether the order concerns Made-to-order goods and the resulting absence of a right of withdrawal. Acceptance of the Quotation includes confirmation that this information has been read.",
          "The Seller may refuse an order, in particular where the File is not technically feasible, where performance would breach the law or third-party rights, or where current workshop load does not allow a reasonable lead time. Any amounts paid are then refunded without delay.",
        ],
      },
      {
        n: "7",
        title: "Prices and payment",
        items: [
          "All prices are stated in Polish zloty and are final. The Seller benefits from a VAT exemption, so no VAT is added to prices.",
          "The Seller issues a receipt (rachunek) for each order. A VAT invoice is not issued, given the status described in section 1(2).",
          "Payments are handled by Autopay S.A. Available methods are BLIK, online bank transfer (pay-by-link) and traditional bank transfer. Card payment is not currently available. The settlement currency is the Polish zloty.",
          "For Customers browsing the site in English or German, prices are presented in euro, converted from the zloty price at the average rate of the National Bank of Poland increased by 8% to cover exchange rate movements between placing the order and the funds clearing. The price in euro is final and no surcharge is added.",
          "An order priced in euro is paid by bank transfer to the account indicated after the order is placed and sent to the Customer by email. The amount in euro and the reservation of the ordered goods hold for 3 business days from placing the order. If the payment has not cleared on the stated account by the fourth business day, the reservation is released and the goods return to sale; the Customer may then order again at the price applicable on that day. The Seller confirms receipt personally once the funds clear and promptly sends the Customer a confirmation of receipt together with notice that production has started.",
          "Where payment is made by bank transfer, the lead time runs from the day receipt of the funds is confirmed, not from the day the order is placed.",
          "Prices of precious-metal items depend on current raw-material quotations. Once a Quotation expires the Seller may issue an updated Quotation, which the Customer is under no obligation to accept.",
          "For high-value orders, or orders requiring materials purchased to individual specification, the Seller may make commencement conditional on a deposit stated in the Quotation.",
          "Delivery cost is stated separately in the Quotation and added to the price. It depends on the destination country according to the zones listed on the Shipping page. The InPost parcel locker is available only for delivery within Poland.",
          "For international shipments, 10 PLN is added to the delivery cost for handling the dispatch and the transport documents.",
          "For shipments outside the customs territory of the European Union, customs duty and import tax are assessed by the customs authority of the destination country and collected by the carrier on delivery. These charges are not included in the price and are not collected by the Seller. A customs declaration stating the contents and the order value is attached to the parcel.",
          "Shipments over 2 kg are quoted individually.",
        ],
      },
      {
        n: "8",
        title: "Order fulfilment",
        items: [
          "The lead time is stated in the Quotation and counted in business days from the date payment or the deposit is credited.",
          "The Seller operates a workshop of limited capacity. The lead time quoted reflects current load and material availability. Where fulfilment requires material to be ordered in, the Seller states this in the Quotation.",
          "The Seller informs the Customer without delay of any risk to the lead time and states a new date. If the Customer does not accept it, they may withdraw from the contract and the Seller refunds all sums received within 14 days.",
          "The Seller may suspend fulfilment if a File defect preventing manufacture emerges during work. The Customer is then informed and may supply a corrected File, commission the correction for a fee, or withdraw from the contract against a refund of sums paid.",
        ],
      },
      {
        n: "8a",
        title: "3D design service (CAD)",
        items: [
          "The service consists of producing a three-dimensional model according to the brief supplied by the Customer when placing the order. Price and lead time follow from the complexity tier and the set of deliverables selected in the order.",
          "The base price includes two revision rounds. A round means one complete set of comments provided by the Customer after receiving a version of the model.",
          "The Customer may purchase further revision rounds, either with the order or during the work. Every additional round is payable in advance, before it begins, and extends the lead time by one business day.",
          "If the Customer does not pay for an additional round, the work ends at the state following the last paid revision. The Seller delivers the files within the paid scope and the contract is treated as performed.",
          "The service does not cover: changing the concept after a draft has been approved, modelling from photographs without stated dimensions, and preparing the model for another manufacturer's technological requirements. Such work is quoted separately.",
          "The Customer receives the files listed in the order and may use them without restriction, including by commissioning production elsewhere.",
          "If within 90 days of paying for the design the Customer orders its production from the Seller, the design fee is credited against the production price. The credit applies once and does not cover delivery costs.",
          "The service is performed to the Customer's specification, so the right of withdrawal does not apply once performance has begun, in accordance with section 11.",
        ],
      },
      {
        n: "9",
        title: "Delivery",
        items: [
          "Available delivery methods: InPost parcel locker, courier, and personal collection by prior arrangement.",
          "The Seller delivers within the territory of the Republic of Poland. International shipping is possible by individual arrangement, including as to cost and insurance.",
          "The risk of accidental loss or damage passes to the Consumer upon delivery to the Consumer, not to the carrier.",
          "Checking the condition of the parcel on receipt is recommended. A damage report assists a claim but is not a condition of making one.",
        ],
      },
      {
        n: "10",
        title: "Right of withdrawal",
        items: [
          "A Consumer and an Entrepreneur with consumer rights may withdraw from a distance contract within 14 days without giving reasons.",
          "The period runs from taking possession of the goods, or, for a services contract, from the date it was concluded.",
          "Sending the declaration before the deadline expires is sufficient, including by email to contact@aejaca.com. No particular form is required.",
          "The Seller refunds all payments received, including the cost of the cheapest delivery method offered, within 14 days of receiving the declaration, using the same payment method unless the Customer expressly agrees otherwise.",
          "The direct cost of returning the goods is borne by the Customer. The Customer is liable for any diminished value resulting from handling beyond what is necessary to establish the nature, characteristics and functioning of the goods.",
          "The right of withdrawal does not apply in the cases set out in Article 38 of the Polish Consumer Rights Act, in particular where the subject of performance is Made-to-order goods. This covers in particular:",
          [
            "prints produced from a File supplied by the Customer,",
            "items engraved or marked with content specified by the Customer,",
            "jewellery made to an individual design, including sizing,",
            "items using stones or metals sourced to individual request,",
            "design services performed in full with the Customer's express consent to commence before the withdrawal period expires.",
          ],
          "The Seller gives notice of the absence of a right of withdrawal before the order is placed, not after it is fulfilled. This notice forms part of the Quotation.",
        ],
      },
      {
        n: "11",
        title: "Complaints and non-conformity",
        items: [
          "The Seller is liable to the Consumer for any lack of conformity existing at the time of delivery and revealed within two years of that time.",
          "Complaints are submitted to contact@aejaca.com, stating a description of the non-conformity, the date it was noticed, and the remedy sought.",
          "The Seller considers a complaint within 14 days of receiving it. Failure to respond within that period means the complaint is upheld.",
          "The Customer may demand repair or replacement. Where repair or replacement is impossible or would entail excessive cost, the Customer may demand a price reduction or withdraw from the contract, unless the lack of conformity is immaterial.",
          "Independently of the above, the Seller grants a separate voluntary warranty, the terms of which are set out on the Warranty page. The warranty neither excludes nor limits statutory rights.",
          "Digital content (downloadable files) has its own liability regime, set out in Chapter 5b of the Polish Consumer Rights Act. The Seller is liable for a lack of conformity of digital content revealed within two years of delivery, and for a one-off supply it is presumed that the lack of conformity existed at the time of delivery if it appeared within one year. The Customer may demand that the content be brought into conformity and, where that is impossible or would require excessive cost, a price reduction or withdrawal from the contract. Complaints are submitted the same way, to contact@aejaca.com.",
        ],
      },
      {
        n: "12",
        title: "Files, content and copyright",
        items: [
          "By submitting a File or content for manufacture, the Customer declares that they hold the rights permitting its reproduction and manufacture, or that they use it within the limits permitted by law.",
          "The Seller has neither the obligation nor the means to verify rights to a File. Liability towards third parties on this account rests with the Customer.",
          "The Seller refuses orders concerning, in particular, firearms and their essential components, dangerous objects, security devices and keys without proof of entitlement, and content infringing third-party rights or the law.",
          "Files supplied by the Customer are stored for as long as necessary to fulfil the order and handle any complaints, and no longer than 24 months. They are deleted earlier at the Customer's request, unless a legal obligation prevents this.",
          "Where a model is created as part of a design service, on handover the Customer receives the source file in STL or STEP format together with the right to use it without territorial or quantitative limits, including with other manufacturers. The author's moral rights remain inalienable.",
          "The Seller may present completed work in a portfolio and marketing materials unless the Customer stipulates otherwise before fulfilment. Such a stipulation does not affect the price.",
        ],
      },
      {
        n: "13",
        title: "Technological characteristics that are not defects",
        items: [
          "Items are produced using additive manufacturing, laser processing and casting. The following characteristics follow from the nature of these technologies and do not constitute a lack of conformity, unless otherwise agreed in the Quotation:",
          [
            "dimensional deviation of up to 0.5 mm for FDM printing and up to 0.2 mm for resin printing, measured across overall dimensions,",
            "visible layer structure, a distinguishing feature of three-dimensional printing,",
            "marks left by support structures on surfaces identified in the Quotation as supported,",
            "shade differences between production batches of filament or resin,",
            "natural surface variation of a casting before finishing,",
            "inclusions and colour variation in natural stones, being their natural characteristic.",
          ],
          "Where an order requires tighter tolerances than those stated above, the Customer must raise this before the Quotation. The Seller then confirms feasibility or declines the order. A tolerance agreed in the Quotation is binding.",
          "The Seller is not liable for the suitability of an item for a use not disclosed before the contract was concluded, in particular structural, medical or food-contact applications.",
        ],
      },
      {
        n: "14",
        title: "Personal data",
        items: [
          "The controller of personal data is the Seller identified in section 3.",
          "The rules of processing, legal bases, retention periods and data-subject rights are set out in the Privacy Policy.",
        ],
      },
      {
        n: "15",
        title: "Out-of-court dispute resolution",
        items: [
          "A Consumer may use out-of-court means of handling complaints and pursuing claims, in particular by:",
          [
            "approaching a district or municipal consumer ombudsman,",
            "applying to the voivodeship inspector of the Trade Inspection for mediation or for the case to be heard by a permanent arbitration court,",
            "using the free assistance of social organisations whose statutory purpose is consumer protection,",
            "using the information available at uokik.gov.pl.",
          ],
          "Use of these procedures is voluntary and requires the consent of both parties.",
        ],
      },
      {
        n: "16",
        title: "Amendments to the Terms",
        items: [
          "The Seller may amend these Terms for valid reasons, in particular a change in law, a change in the scope of the offering, a change in payment or delivery methods, or a change in the legal form of the business.",
          "An amendment takes effect 7 days after it is published on the Website.",
          "Orders placed before an amendment takes effect are governed by the Terms in their previous wording.",
        ],
      },
      {
        n: "17",
        title: "Final provisions",
        items: [
          "Matters not regulated here are governed by Polish law, in particular the Civil Code and the Consumer Rights Act. The choice of Polish law does not deprive a Consumer of the protection afforded by the mandatory provisions of the country of their habitual residence.",
          "These Terms are made available in Polish, English and German. In the event of any discrepancy, the Polish version prevails.",
          "These Terms are effective from the date stated at the beginning of the document.",
        ],
      },
    ],
  },

  de: {
    tag: "AGB",
    title: "Allgemeine Geschäftsbedingungen",
    lead: "Regeln für die Nutzung von aejaca.com sowie für den Abschluss von Kauf- und Dienstleistungsverträgen.",
    effectiveLabel: "Gültig ab",
    sections: [
      {
        n: "1",
        title: "Allgemeine Bestimmungen",
        items: [
          "Diese AGB regeln die Nutzung der Website aejaca.com sowie den Abschluss und die Durchführung von Kaufverträgen über Waren und von Dienstleistungsverträgen.",
          "Der Verkäufer ist eine natürliche Person, die eine nicht registrierte Erwerbstätigkeit im Sinne von Art. 5 Abs. 1 des polnischen Unternehmerrechts ausübt. Der Verkäufer verfügt über keine NIP- und keine REGON-Nummer. Dies ist ein rechtmäßiger Status und kein Fehlen von Angaben. Es befreit den Verkäufer nicht von seinen Pflichten gegenüber Verbrauchern.",
          "Die AGB werden unentgeltlich in einer Form bereitgestellt, die das Herunterladen, Wiedergeben und Speichern ermöglicht.",
          "Bestimmungen, die für den Verbraucher ungünstiger sind als zwingendes Recht, sind unwirksam und werden durch dieses Recht ersetzt.",
        ],
      },
      {
        n: "2",
        title: "Begriffsbestimmungen",
        items: [
          "Die verwendeten Begriffe bedeuten:",
          [
            "Verkäufer - die in Abschnitt 3 bezeichnete Person.",
            "Website - aejaca.com samt Unterseiten und Werkzeugen.",
            "Kunde - jede Person, die die Website nutzt oder einen Vertrag mit dem Verkäufer schließt.",
            "Verbraucher - eine natürliche Person, die einen Vertrag schließt, der nicht unmittelbar mit ihrer gewerblichen oder beruflichen Tätigkeit zusammenhängt.",
            "Unternehmer mit Verbraucherrechten - eine natürliche Person mit Gewerbe, die einen unmittelbar damit zusammenhängenden Vertrag schließt, der für sie keinen beruflichen Charakter hat. Ihr stehen die Rechte aus den Abschnitten 10 und 11 gleichrangig mit Verbrauchern zu.",
            "Rechner - ein Werkzeug auf der Website zur Schätzung der ungefähren Kosten eines Produkts oder einer Leistung.",
            "Angebot - ein verbindlicher Vorschlag des Verkäufers mit Preis, Umfang und Lieferzeit.",
            "Datei - ein vom Kunden übermitteltes digitales Modell, insbesondere im Format STL, OBJ, 3MF oder STEP.",
            "Ware nach Kundenspezifikation - nicht vorgefertigte Ware, die nach Kundenangaben hergestellt wird oder seinen individualisierten Bedürfnissen dient.",
          ],
        ],
      },
      {
        n: "3",
        title: "Verkäufer und Kontakt",
        items: [
          "Verkäufer: Artur Hebenstreit, tätig unter der Marke AEJaCA. Geschäfts- und Korrespondenzanschrift: ul. Nowy Świat 33 lok. 13, 00-029 Warschau, Polen.",
          "Die Werkstatt, in der die Aufträge gefertigt werden und in der nach vorheriger Absprache eine Selbstabholung möglich ist, befindet sich in Józefosław, Gemeinde Piaseczno. Sie ist keine Korrespondenzanschrift.",
          "E-Mail: contact@aejaca.com. Telefon: +48 780 737 786.",
          "Hauptkanal für Kontakt, Erklärungen und Reklamationen ist die E-Mail. Eine per E-Mail abgegebene Erklärung ist wirksam und ausreichend, insbesondere die Widerrufserklärung.",
          "Selbstabholung und Übergabe erfolgen ausschließlich nach vorheriger Abstimmung von Zeit und Ort.",
        ],
      },
      {
        n: "4",
        title: "Technische Voraussetzungen",
        items: [
          "Für die Nutzung der Website werden ein Gerät mit Internetzugang, ein aktueller Browser mit aktiviertem JavaScript sowie eine aktive E-Mail-Adresse benötigt.",
          "Für die Übermittlung einer Datei sind die Formate STL, OBJ, 3MF oder STEP mit einer Größe von höchstens 50 MB erforderlich.",
          "Der Verkäufer haftet nicht für Beeinträchtigungen, die sich aus Hardware oder Verbindung des Kunden ergeben.",
        ],
      },
      {
        n: "5",
        title: "Elektronisch erbrachte Dienste",
        items: [
          "Der Verkäufer erbringt unentgeltlich folgende Dienste: Zugang zu den Inhalten der Website, Rechner, Anfrageformular mit Dateiupload, einen auf künstlicher Intelligenz beruhenden Assistenten sowie einen Newsletter.",
          "Der Vertrag über unentgeltliche Dienste kommt mit Beginn der Nutzung zustande und kann vom Kunden jederzeit ohne Angabe von Gründen beendet werden. Die Abmeldung vom Newsletter erfolgt über den Link in jeder Nachricht.",
          "Dem Kunden ist die Bereitstellung rechtswidriger Inhalte untersagt.",
          "Das Ergebnis eines Rechners ist ausschließlich unverbindlich und informatorisch. Es stellt weder ein Angebot im Sinne des polnischen Zivilgesetzbuchs noch ein Angebot im Sinne dieser AGB dar. Verbindlich ist allein der im Angebot genannte Preis.",
          "Antworten des KI-Assistenten sind informatorisch und stellen weder ein Angebot noch eine fachliche Beratung dar.",
        ],
      },
      {
        n: "6",
        title: "Vertragsschluss",
        items: [
          "Die Darstellung von Waren und Leistungen auf der Website ist eine Aufforderung zur Abgabe eines Angebots und kein Angebot.",
          "Der Vertragsschluss verläuft wie folgt:",
          [
            "Der Kunde übermittelt eine Anfrage, gegebenenfalls mit Datei und Beschreibung der Anforderungen.",
            "Der Verkäufer prüft die Machbarkeit und übermittelt ein Angebot mit Preis, Umfang, Material, Oberfläche und Lieferzeit.",
            "Das Angebot gilt für den darin genannten Zeitraum, mindestens 7 Tage. Bei Edelmetallerzeugnissen kann dieser Zeitraum wegen der Rohstoffpreisschwankungen kürzer sein; der Verkäufer weist im Angebot darauf hin.",
            "Der Vertrag kommt mit Annahme des Angebots durch den Kunden und Zahlung beziehungsweise der vereinbarten Anzahlung zustande.",
          ],
          "Vor Annahme des Angebots erhält der Kunde einen deutlichen Hinweis, ob die Bestellung Ware nach Kundenspezifikation betrifft und dass daraus das Fehlen eines Widerrufsrechts folgt. Die Annahme des Angebots umfasst die Bestätigung, diesen Hinweis gelesen zu haben.",
          "Der Verkäufer kann eine Bestellung ablehnen, insbesondere wenn die Datei technisch nicht ausführbar ist, wenn die Ausführung gegen Gesetze oder Rechte Dritter verstieße oder wenn die aktuelle Werkstattauslastung keine angemessene Lieferzeit zulässt. Gezahlte Beträge werden dann unverzüglich erstattet.",
        ],
      },
      {
        n: "7",
        title: "Preise und Zahlung",
        items: [
          "Alle Preise werden in polnischen Zloty angegeben und sind Endpreise. Der Verkäufer nimmt eine Umsatzsteuerbefreiung in Anspruch, daher wird keine Umsatzsteuer hinzugerechnet.",
          "Der Verkäufer stellt für jede Bestellung eine Quittung (rachunek) aus. Eine Umsatzsteuerrechnung wird aufgrund des in Abschnitt 1 Absatz 2 beschriebenen Status nicht ausgestellt.",
          "Zahlungen werden über Autopay S.A. abgewickelt. Verfügbar sind BLIK, Online-Überweisung (Pay-by-Link) und klassische Überweisung. Kartenzahlung steht derzeit nicht zur Verfügung. Abrechnungswährung ist der polnische Zloty.",
          "Für Kunden, die die Seite auf Englisch oder Deutsch lesen, werden die Preise in Euro angezeigt, umgerechnet vom Zloty-Preis zum Mittelkurs der Polnischen Nationalbank zuzüglich 8% zur Deckung von Kursschwankungen zwischen Bestellung und Geldeingang. Der Preis in Euro ist ein Endpreis, ein Aufschlag entfällt.",
          "Eine in Euro ausgewiesene Bestellung wird per Banküberweisung auf das nach der Bestellung mitgeteilte und dem Kunden per E-Mail zugesandte Konto bezahlt. Der Betrag in Euro und die Reservierung der bestellten Ware gelten 3 Werktage ab Bestellung. Ist die Zahlung bis zum vierten Werktag nicht auf dem angegebenen Konto eingegangen, wird die Reservierung aufgehoben und die Ware geht zurück in den Verkauf; der Kunde kann dann erneut zum an diesem Tag geltenden Preis bestellen. Den Geldeingang bestätigt der Verkäufer nach Gutschrift persönlich und sendet dem Kunden unverzüglich eine Zahlungsbestätigung samt Hinweis auf den Fertigungsbeginn.",
          "Bei Zahlung per Überweisung läuft die Lieferfrist ab dem Tag der bestätigten Gutschrift, nicht ab dem Bestelldatum.",
          "Preise für Edelmetallerzeugnisse hängen von den aktuellen Rohstoffnotierungen ab. Nach Ablauf der Gültigkeit kann der Verkäufer ein aktualisiertes Angebot vorlegen, zu dessen Annahme der Kunde nicht verpflichtet ist.",
          "Bei Bestellungen von erheblichem Wert oder mit auf individuellen Wunsch beschafften Materialien kann der Verkäufer den Beginn der Ausführung von einer im Angebot genannten Anzahlung abhängig machen.",
          "Die Lieferkosten werden im Angebot gesondert ausgewiesen und dem Preis hinzugerechnet. Ihre Höhe richtet sich nach dem Bestimmungsland gemäß den auf der Seite Versand genannten Zonen. Die InPost-Paketstation steht nur bei Lieferung innerhalb Polens zur Verfügung.",
          "Bei Auslandssendungen werden 10 PLN für die Abwicklung der Aufgabe und der Frachtpapiere hinzugerechnet.",
          "Bei Sendungen außerhalb des Zollgebiets der Europäischen Union setzt die Zollbehörde des Bestimmungslandes Zoll und Einfuhrsteuer fest; der Frachtführer zieht sie bei der Zustellung ein. Diese Beträge sind nicht im Preis enthalten und werden nicht vom Verkäufer erhoben. Der Sendung liegt eine Zollerklärung mit Angabe des Inhalts und des Bestellwerts bei.",
          "Sendungen über 2 kg werden individuell kalkuliert.",
        ],
      },
      {
        n: "8",
        title: "Auftragsabwicklung",
        items: [
          "Die Lieferzeit wird im Angebot genannt und in Werktagen ab Gutschrift der Zahlung oder der Anzahlung gerechnet.",
          "Der Verkäufer betreibt eine Werkstatt mit begrenzter Kapazität. Die genannte Lieferzeit berücksichtigt die aktuelle Auslastung und den Materialbestand. Ist eine Materialbeschaffung erforderlich, weist der Verkäufer im Angebot darauf hin.",
          "Über jede Gefährdung der Lieferzeit informiert der Verkäufer unverzüglich und nennt einen neuen Termin. Akzeptiert der Kunde diesen nicht, kann er vom Vertrag zurücktreten; der Verkäufer erstattet alle erhaltenen Beträge binnen 14 Tagen.",
          "Der Verkäufer kann die Ausführung aussetzen, wenn sich während der Arbeiten ein die Herstellung verhindernder Dateifehler zeigt. Der Kunde wird informiert und kann eine korrigierte Datei übermitteln, die Korrektur kostenpflichtig beauftragen oder gegen Erstattung gezahlter Beträge vom Vertrag zurücktreten.",
        ],
      },
      {
        n: "8a",
        title: "3D-Entwurfsleistung (CAD)",
        items: [
          "Gegenstand der Leistung ist die Erstellung eines dreidimensionalen Modells gemäß der vom Kunden bei der Bestellung übermittelten Beschreibung. Preis und Termin ergeben sich aus der gewählten Komplexitätsstufe und dem bestellten Dateiumfang.",
          "Im Grundpreis sind zwei Korrekturrunden enthalten. Eine Runde ist ein vollständiger Satz von Anmerkungen, den der Kunde nach Erhalt einer Modellversion übermittelt.",
          "Der Kunde kann weitere Korrekturrunden hinzukaufen, bei der Bestellung oder während der Arbeit. Jede zusätzliche Runde ist im Voraus zu zahlen, vor ihrem Beginn, und verlängert die Lieferzeit um einen Werktag.",
          "Zahlt der Kunde eine zusätzliche Runde nicht, endet die Arbeit im Zustand nach der letzten bezahlten Korrektur. Der Verkäufer übergibt die Dateien im bezahlten Umfang, der Vertrag gilt als erfüllt.",
          "Nicht umfasst sind: Konzeptänderungen nach Freigabe eines Entwurfs, Modellieren nach Fotografien ohne angegebene Maße sowie die Aufbereitung des Modells für die technologischen Anforderungen eines anderen Fertigers. Solche Arbeiten werden gesondert kalkuliert.",
          "Der Kunde erhält die in der Bestellung genannten Dateien und darf sie uneingeschränkt nutzen, auch für eine Fertigung bei einem anderen Anbieter.",
          "Bestellt der Kunde innerhalb von 90 Tagen nach Bezahlung des Entwurfs dessen Fertigung beim Verkäufer, wird das Entwurfshonorar auf den Fertigungspreis angerechnet. Die Anrechnung erfolgt einmalig und umfasst keine Versandkosten.",
          "Die Leistung wird nach Kundenspezifikation erbracht, daher besteht nach Beginn der Ausführung kein Widerrufsrecht, gemäß Abschnitt 11.",
        ],
      },
      {
        n: "9",
        title: "Lieferung",
        items: [
          "Verfügbare Lieferarten: InPost-Paketstation, Kurier und Selbstabholung nach vorheriger Absprache.",
          "Der Verkäufer liefert innerhalb der Republik Polen. Auslandsversand ist nach individueller Absprache möglich, auch hinsichtlich Kosten und Versicherung.",
          "Die Gefahr des zufälligen Untergangs oder der Beschädigung geht mit Übergabe an den Verbraucher auf diesen über, nicht mit Übergabe an den Beförderer.",
          "Es wird empfohlen, den Zustand der Sendung bei Erhalt zu prüfen. Ein Schadensprotokoll erleichtert die Geltendmachung, ist aber keine Voraussetzung für eine Reklamation.",
        ],
      },
      {
        n: "10",
        title: "Widerrufsrecht",
        items: [
          "Ein Verbraucher sowie ein Unternehmer mit Verbraucherrechten kann einen Fernabsatzvertrag binnen 14 Tagen ohne Angabe von Gründen widerrufen.",
          "Die Frist beginnt mit Inbesitznahme der Ware, bei Dienstleistungsverträgen mit Vertragsschluss.",
          "Zur Fristwahrung genügt die Absendung der Erklärung vor Fristablauf, auch per E-Mail an contact@aejaca.com. Eine besondere Form ist nicht erforderlich.",
          "Der Verkäufer erstattet alle erhaltenen Zahlungen einschließlich der Kosten der günstigsten angebotenen Lieferart binnen 14 Tagen nach Erhalt der Erklärung, und zwar über dasselbe Zahlungsmittel, sofern der Kunde nicht ausdrücklich etwas anderes vereinbart.",
          "Die unmittelbaren Kosten der Rücksendung trägt der Kunde. Der Kunde haftet für einen Wertverlust, der auf einen Umgang zurückzuführen ist, der über das zur Prüfung von Beschaffenheit, Eigenschaften und Funktionsweise Notwendige hinausgeht.",
          "Das Widerrufsrecht besteht nicht in den in Art. 38 des polnischen Verbraucherrechtsgesetzes genannten Fällen, insbesondere wenn Gegenstand der Leistung Ware nach Kundenspezifikation ist. Dies betrifft insbesondere:",
          [
            "Drucke, die aus einer vom Kunden übermittelten Datei hergestellt wurden,",
            "Erzeugnisse mit vom Kunden vorgegebener Gravur oder Kennzeichnung,",
            "Schmuck nach individuellem Entwurf, einschließlich der Größenanpassung,",
            "Erzeugnisse mit auf individuellen Wunsch beschafften Steinen oder Metallen,",
            "vollständig erbrachte Designleistungen mit ausdrücklicher Zustimmung des Kunden zum Beginn vor Ablauf der Widerrufsfrist.",
          ],
          "Der Verkäufer weist auf das Fehlen des Widerrufsrechts vor der Bestellung hin, nicht nach der Ausführung. Dieser Hinweis ist Bestandteil des Angebots.",
        ],
      },
      {
        n: "11",
        title: "Reklamationen und Vertragswidrigkeit",
        items: [
          "Der Verkäufer haftet dem Verbraucher für eine bei Lieferung bestehende Vertragswidrigkeit, die innerhalb von zwei Jahren ab diesem Zeitpunkt zutage tritt.",
          "Reklamationen sind an contact@aejaca.com zu richten, unter Angabe der Vertragswidrigkeit, des Zeitpunkts ihrer Feststellung und des geltend gemachten Anspruchs.",
          "Der Verkäufer bearbeitet die Reklamation binnen 14 Tagen nach Erhalt. Bleibt eine Antwort innerhalb dieser Frist aus, gilt die Reklamation als anerkannt.",
          "Der Kunde kann Nachbesserung oder Ersatzlieferung verlangen. Sind diese unmöglich oder mit unverhältnismäßigen Kosten verbunden, kann der Kunde eine Preisminderung verlangen oder vom Vertrag zurücktreten, es sei denn, die Vertragswidrigkeit ist unerheblich.",
          "Unabhängig davon gewährt der Verkäufer eine gesonderte freiwillige Garantie, deren Bedingungen die Seite Garantie beschreibt. Die Garantie schließt gesetzliche Rechte weder aus noch schränkt sie diese ein.",
          "Digitale Inhalte (herunterladbare Dateien) unterliegen einem eigenen Haftungsregime nach Kapitel 5b des polnischen Verbraucherrechtsgesetzes. Der Verkäufer haftet für eine Vertragswidrigkeit digitaler Inhalte, die innerhalb von zwei Jahren nach Lieferung zutage tritt; bei einmaliger Bereitstellung wird vermutet, dass die Vertragswidrigkeit bereits bei Lieferung vorlag, wenn sie innerhalb eines Jahres auftritt. Der Kunde kann die Herstellung der Vertragsmäßigkeit verlangen und, wenn dies unmöglich ist oder unverhältnismäßige Kosten verursachen würde, eine Preisminderung oder den Rücktritt vom Vertrag. Reklamationen erfolgen auf demselben Weg, an contact@aejaca.com.",
        ],
      },
      {
        n: "12",
        title: "Dateien, Inhalte und Urheberrecht",
        items: [
          "Mit Übermittlung einer Datei oder eines Inhalts zur Herstellung erklärt der Kunde, dass ihm die Rechte zur Vervielfältigung und Herstellung zustehen oder dass er sie im gesetzlich zulässigen Rahmen nutzt.",
          "Der Verkäufer ist weder verpflichtet noch in der Lage, die Rechte an einer Datei zu prüfen. Die Haftung gegenüber Dritten trägt insoweit der Kunde.",
          "Der Verkäufer lehnt Aufträge ab, die insbesondere Schusswaffen und deren wesentliche Teile, gefährliche Gegenstände, Sicherungseinrichtungen und Schlüssel ohne Nachweis der Berechtigung sowie Inhalte betreffen, die Rechte Dritter oder Gesetze verletzen.",
          "Vom Kunden übermittelte Dateien werden für die zur Auftragsabwicklung und Reklamationsbearbeitung erforderliche Dauer gespeichert, höchstens 24 Monate. Auf Verlangen des Kunden werden sie früher gelöscht, sofern keine gesetzliche Pflicht entgegensteht.",
          "Entsteht ein Modell im Rahmen einer Designleistung, erhält der Kunde mit der Übergabe die Quelldatei im Format STL oder STEP sowie das Recht zur Nutzung ohne räumliche oder mengenmäßige Beschränkung, auch bei anderen Herstellern. Die Urheberpersönlichkeitsrechte bleiben unveräußerlich.",
          "Der Verkäufer darf ausgeführte Arbeiten im Portfolio und in Marketingmaterialien zeigen, sofern der Kunde vor der Ausführung nichts anderes bestimmt. Ein solcher Vorbehalt wirkt sich nicht auf den Preis aus.",
        ],
      },
      {
        n: "13",
        title: "Technologische Eigenschaften, die keine Mängel sind",
        items: [
          "Die Erzeugnisse entstehen durch additive Fertigung, Laserbearbeitung und Guss. Die folgenden Eigenschaften folgen aus der Natur dieser Technologien und stellen keine Vertragswidrigkeit dar, sofern im Angebot nichts anderes vereinbart ist:",
          [
            "Maßabweichungen bis 0,5 mm beim FDM-Druck und bis 0,2 mm beim Harzdruck, bezogen auf die Außenmaße,",
            "sichtbare Schichtstruktur als charakteristisches Merkmal des dreidimensionalen Drucks,",
            "Spuren von Stützstrukturen an Flächen, die im Angebot als gestützt bezeichnet sind,",
            "Farbtonunterschiede zwischen Produktionschargen von Filament oder Harz,",
            "natürliche Oberflächenunterschiede eines Gussteils vor der Endbearbeitung,",
            "Einschlüsse und Farbunterschiede natürlicher Steine als deren natürliche Eigenschaft.",
          ],
          "Erfordert eine Bestellung engere Toleranzen als oben genannt, ist dies vor dem Angebot mitzuteilen. Der Verkäufer bestätigt dann die Machbarkeit oder lehnt die Bestellung ab. Eine im Angebot vereinbarte Toleranz ist verbindlich.",
          "Der Verkäufer haftet nicht für die Eignung eines Erzeugnisses für einen vor Vertragsschluss nicht mitgeteilten Verwendungszweck, insbesondere für konstruktive, medizinische oder lebensmittelberührende Anwendungen.",
        ],
      },
      {
        n: "14",
        title: "Personenbezogene Daten",
        items: [
          "Verantwortlicher für die Verarbeitung personenbezogener Daten ist der in Abschnitt 3 bezeichnete Verkäufer.",
          "Verarbeitungsgrundsätze, Rechtsgrundlagen, Speicherfristen und Betroffenenrechte beschreibt die Datenschutzerklärung.",
        ],
      },
      {
        n: "15",
        title: "Außergerichtliche Streitbeilegung",
        items: [
          "Ein Verbraucher kann außergerichtliche Wege der Reklamationsbearbeitung und Anspruchsverfolgung nutzen, insbesondere:",
          [
            "sich an den Kreis- oder Stadtverbraucherbeauftragten wenden,",
            "beim Woiwodschaftsinspektor der Handelsinspektion ein Mediationsverfahren oder die Verhandlung vor einem ständigen Schiedsgericht beantragen,",
            "die unentgeltliche Hilfe gesellschaftlicher Organisationen in Anspruch nehmen, deren satzungsmäßige Aufgabe der Verbraucherschutz ist,",
            "die unter uokik.gov.pl verfügbaren Informationen nutzen.",
          ],
          "Die Inanspruchnahme dieser Verfahren ist freiwillig und setzt das Einverständnis beider Seiten voraus.",
        ],
      },
      {
        n: "16",
        title: "Änderungen der AGB",
        items: [
          "Der Verkäufer kann diese AGB aus wichtigen Gründen ändern, insbesondere bei Rechtsänderungen, Änderungen des Leistungsangebots, Änderungen der Zahlungs- oder Lieferarten oder Änderung der Rechtsform der Tätigkeit.",
          "Eine Änderung tritt 7 Tage nach ihrer Veröffentlichung auf der Website in Kraft.",
          "Für vor Inkrafttreten einer Änderung aufgegebene Bestellungen gelten die AGB in ihrer bisherigen Fassung.",
        ],
      },
      {
        n: "17",
        title: "Schlussbestimmungen",
        items: [
          "In nicht geregelten Angelegenheiten gilt polnisches Recht, insbesondere das Zivilgesetzbuch und das Verbraucherrechtsgesetz. Die Wahl polnischen Rechts entzieht dem Verbraucher nicht den Schutz zwingender Vorschriften des Staates seines gewöhnlichen Aufenthalts.",
          "Diese AGB werden in polnischer, englischer und deutscher Sprache bereitgestellt. Bei Abweichungen ist die polnische Fassung maßgeblich.",
          "Diese AGB gelten ab dem zu Beginn des Dokuments genannten Datum.",
        ],
      },
    ],
  },
};

export default TERMS;
