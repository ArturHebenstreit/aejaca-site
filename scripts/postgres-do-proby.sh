#!/usr/bin/env bash
# Lokalny Postgres wylacznie do proby zapytan (scripts/proba-sql-na-zywej-bazie.mjs).
# Osobny katalog danych i osobny port, zeby nie dotknac niczego, co juz stoi
# na maszynie. Nie ma tu zadnych danych z produkcji i nie ma po co ich wnosic.
set -euo pipefail

KATALOG="${PROBA_PGDATA:-/tmp/pg}"
PORT="${PROBA_PGPORT:-55432}"
BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)"

if [ -z "$BIN" ]; then
  echo "Nie znalazlem Postgresa. Zainstaluj go albo podaj PROBA_DATABASE_URL." >&2
  exit 1
fi

# Postgres nie startuje z konta roota, wiec przekazujemy go uzytkownikowi
# `postgres`, ktory istnieje razem z pakietem.
jako_postgres() { if [ "$(id -u)" = "0" ]; then su postgres -c "$1"; else sh -c "$1"; fi; }

case "${1:-start}" in
  start)
    if [ ! -d "$KATALOG/data" ]; then
      mkdir -p "$KATALOG"
      [ "$(id -u)" = "0" ] && chown postgres:postgres "$KATALOG"
      jako_postgres "$BIN/initdb -D $KATALOG/data -U postgres --auth=trust" >/dev/null
    fi
    jako_postgres "$BIN/pg_ctl -D $KATALOG/data -o '-p $PORT -k $KATALOG' -l $KATALOG/log start" >/dev/null
    sleep 1
    echo "Postgres do proby stoi: gniazdo $KATALOG, port $PORT"
    ;;
  stop)
    jako_postgres "$BIN/pg_ctl -D $KATALOG/data stop" >/dev/null 2>&1 || true
    echo "Postgres do proby zatrzymany"
    ;;
  *)
    echo "Uzycie: $0 [start|stop]" >&2
    exit 1
    ;;
esac
