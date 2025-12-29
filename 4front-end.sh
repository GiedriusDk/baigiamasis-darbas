#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

WEBAPP_DIR="webapp"
REQUIRED_NODE_MAJOR=22
DEV_URL_DEFAULT="http://localhost:5173"

GREEN="\e[32m"
RED="\e[31m"
YELLOW="\e[33m"
BLUE="\e[34m"
RESET="\e[0m"

ok()    { echo -e "${GREEN}$*${RESET}"; }
info()  { echo -e "${BLUE}$*${RESET}"; }
warn()  { echo -e "${YELLOW}$*${RESET}"; }
fail()  { echo -e "${RED}$*${RESET}"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

[[ -d "$WEBAPP_DIR" ]] || fail "Nerastas katalogas '$WEBAPP_DIR/'. Paleisk skriptą iš projekto root'o."

cd "$WEBAPP_DIR"
ok "== Frontend: katalogas '$WEBAPP_DIR/' =="


command -v node >/dev/null 2>&1 || fail "Nerastas 'node'. Reikia Node.js (>= ${REQUIRED_NODE_MAJOR})."
command -v npm  >/dev/null 2>&1 || fail "Nerastas 'npm'. Įdiekite Node.js su npm."

NODE_VERSION_RAW="$(node -v || true)"           
NODE_VERSION="${NODE_VERSION_RAW
NODE_MAJOR="${NODE_VERSION%%.*}"               

if [[ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]]; then
  fail "Node.js per sena: $NODE_VERSION_RAW. Reikia >= ${REQUIRED_NODE_MAJOR}.x"
fi

ok "Node.js OK: $NODE_VERSION_RAW"
ok "npm OK: $(npm -v)"



if [[ ! -d "node_modules" ]]; then
  info "Diegiame priklausomybes: npm install"
  npm install
  ok "Dependencies įdiegtos"
else
  ok "node_modules jau yra — install praleidžiam"
fi


echo
ok "== Paleidžiam frontend dev serverį =="
info "Jei viskas OK, naršyklėje atsidarys:"
info "  ${DEV_URL_DEFAULT}"
warn "Sustabdyti: Ctrl + C"
echo

npm run dev
