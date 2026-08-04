# Odtworzenie przeplywow n8n

Pliki JSON w tym katalogu wgrywa sie w n8n przez Import from File.

Wartosci sekretow zostaly zamienione na `__USTAW_PRZY_ODTWARZANIU__`. Po wgraniu trzeba je
uzupelnic, najlepiej przenoszac do poswiadczen n8n (Credentials) zamiast wpisywac
wprost, bo wpisana wartosc wroci do kopii przy nastepnym eksporcie.

## Miejsca do uzupelnienia

- **AEJaCA: pliki zamowien na Dysk / Oddzwonienie do AEJaCA**: x-upload-token

Zrodlo wartosci: zmienne srodowiskowe uslugi chat-api w Railway.
