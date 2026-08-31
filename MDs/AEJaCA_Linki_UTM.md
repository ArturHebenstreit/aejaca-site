# Linki z oznaczeniem kampanii (UTM)

Do czego to sluzy: analityka rozpoznaje kanal ruchu z adresu strony, z ktorej
ktos kliknal. Dziala to dla wyszukiwarek i dla wiekszosci serwisow, ale MILCZY
tam, gdzie przegladarka nie podaje zrodla: aplikacja mobilna Instagrama, klient
pocztowy, kod QR, wpisanie adresu z wizytowki. Taki ruch wpada do worka
"wprost" i nie da sie powiedziec, ktore z tych miejsc naprawde dziala.

Rozwiazanie jest jedno: **adres, ktory sam niesie informacje, skad pochodzi.**
Doklejamy do niego trzy parametry i to wszystko. Odwiedzajacy niczego nie musi
robic, a w kokpicie pojawia sie osobny wiersz.

## Gotowe adresy do wklejenia

Skopiuj caly adres razem z tym, co stoi za znakiem zapytania.

| Gdzie wklejasz | Adres |
|---|---|
| Instagram, opis profilu (bio) | `https://www.aejaca.com/?utm_source=instagram&utm_medium=bio&utm_campaign=profil` |
| Instagram, odnosnik w relacji albo w poscie | `https://www.aejaca.com/shop/?utm_source=instagram&utm_medium=post&utm_campaign=sklep` |
| Facebook, opis strony | `https://www.aejaca.com/?utm_source=facebook&utm_medium=bio&utm_campaign=profil` |
| Wizytowka Google (Profil Firmy) | `https://www.aejaca.com/?utm_source=google&utm_medium=wizytowka&utm_campaign=mapy` |
| Podpis w poczcie | `https://www.aejaca.com/shop/?utm_source=podpis&utm_medium=poczta&utm_campaign=podpis-mailowy` |
| Kod QR na ulotce albo wizytowce | `https://www.aejaca.com/?utm_source=ulotka&utm_medium=qr&utm_campaign=druk-2026` |
| YouTube, opis pod filmem | `https://www.aejaca.com/toolstudio/?utm_source=youtube&utm_medium=opis&utm_campaign=narzedzia` |
| Forum albo grupa, gdy piszesz sam | `https://www.aejaca.com/?utm_source=forum&utm_medium=wpis&utm_campaign=nazwa-forum` |

Adres docelowy zmieniaj swobodnie: parametry doklejaj do TEJ strony, na ktora
chcesz kogos wpuscic. Do adresu, ktory juz ma znak zapytania, doklejasz przez
`&`, a nie przez drugie `?`.

## Jak to czytac w kokpicie

- **utm_medium** decyduje o nazwie kanalu: `bio`, `post`, `wpis` i podobne
  ladują w "kampania", `poczta` w "poczta", `qr` w "poza siecia", a `cpc`
  i `paid_social` w "platne". Reguly siedza w `chat-api/zrodlaRuchu.js`.
- **utm_source** widac w kolumnie "konkretne zrodla". To po niej rozroznisz
  Instagram od Facebooka.
- **utm_campaign** zbiera pojedyncze dzialania (jedna ulotka, jeden film).

## Zasady, zeby dane sie nie rozjechaly

1. **Male litery, bez polskich znakow, bez spacji.** `instagram`, nie
   `Instagram` ani `insta gram`. Wielka litera robi drugi wiersz w tabeli
   z tego samego zrodla.
2. **Nie oznaczaj wlasnych odnosnikow wewnetrznych.** Przejscie z naszej strony
   na nasza strone nie jest zrodlem ruchu, a oznaczone zaczeloby udawac nowa
   wizyte z zewnatrz.
3. **Nie oznaczaj adresow, ktore trafiaja do wyszukiwarki** (mapa witryny,
   odnosniki na stronach). Google indeksuje wtedy adres z parametrami i psuje
   sobie obraz serwisu.
4. **Trzymaj sie raz wybranych nazw.** `poczta` i `mail` to dla tabeli dwie
   rozne rzeczy, choc dla Ciebie jedna.

## Czego jeszcze nie oznaczamy, i dlaczego

**Odnosnikow w naszych wlasnych mailach do klientow.** Maile pokazuja pelny
adres w tresci, celowo (mail bywa drukowany i czytany bez HTML-a, a odnosnik
schowany pod slowem "tutaj" nie prowadzi wtedy nigdzie). Doklejenie UTM-ow
zrobiloby z czytelnego `www.aejaca.com/shop/` ciag z trzema parametrami. To
jest decyzja do podjecia osobno: czytelnosc maila wobec dokladnosci pomiaru.
Dzis takie wejscia licza sie jako "wprost", gdy klient czyta poczte
w programie, i jako "poczta", gdy czyta ja w przegladarce.
