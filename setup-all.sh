#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

require_script() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    echo "❌ Nerastas skriptas: $f"
    exit 1
  fi
  if [[ ! -x "$f" ]]; then
    echo "ℹ️ Skriptas nėra vykdomas, pridedu chmod +x: $f"
    chmod +x "$f"
  fi
}

pause() {
  echo
  read -r -p "Paspauskite ENTER, kad tęsti, arba Ctrl+C, kad nutraukti..." _ || true
}

require_script "./1back-end.sh" 
require_script "./2migrate_all.sh"
require_script "./3seeder.sh"
require_script "./4front-end.sh"

echo "▶ 1) Backend mikroservisų paruošimas (.env, composer, docker)"
./1back-end.sh

echo
echo "✅ Backend mikroservisai sėkmingai paruošti."
pause

echo
echo "▶ 2) Duomenų bazės migracijos"
./2migrate_all.sh

echo
echo "✅ Migracijos sėkmingai įvykdytos."
pause

echo
echo "▶ 3) Pradiniai duomenys (seed)"
./3seeder.sh

echo
echo "✅ Pradiniai duomenys sėkmingai sukurti."
pause

echo
echo "▶ 4) Front-end aplikacijos paleidimas"

echo
echo "===================="
echo "Prisijungimai:"
echo "Admin:"
echo "  Email: admin@gmail.com"
echo "  Password: admin"
echo "===================="
echo

./4front-end.sh

echo
echo "✅ VISKAS PARUOŠTA"
echo "===================="
echo "Sistema sėkmingai paleista."