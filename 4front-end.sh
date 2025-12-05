#!/usr/bin/env bash
set -euo pipefail

# --- Spalvos ---
GREEN="\e[32m"
RED="\e[31m"
YELLOW="\e[33m"
BLUE="\e[34m"
RESET="\e[0m"

print() { echo -e "${GREEN}$1${RESET}"; }
warn()  { echo -e "${YELLOW}$1${RESET}"; }
error() { echo -e "${RED}$1${RESET}"; }

print "== 1) Einam į webapp katalogą =="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR/webapp" || { error "❌ Nepavyko rasti /webapp katalogo."; exit 1; }

echo
print "== 2) Tikrinam Node.js versiją =="

NODE_OK=false
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v | tr -d 'v')
  MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  warn "Node.js versija: $NODE_VERSION"

  if [ "$MAJOR" -ge 22 ]; then
    NODE_OK=true
  fi
fi

if [ "$NODE_OK" = false ]; then
  warn "❌ Node.js versija per sena arba nerasta (reikia ≥22.x)."
  echo "👉 Siūloma įdiegti naują Node.js per nvm (Node Version Manager)."
  read -p "Ar norite instaliuoti Node.js 22.x automatiškai? (y/n) " yn
  if [[ "$yn" =~ ^[Yy]$ ]]; then
    # Įdiegti nvm jei dar nėra
    if ! command -v nvm >/dev/null 2>&1; then
      warn "Įdiegiame nvm..."
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
      export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
      [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    nvm install 22
    nvm use 22
    nvm alias default 22
    NODE_OK=true
    print "✔ Node.js sėkmingai atnaujintas: $(node -v)"
  else
    error "❌ Node.js per sena. Sustojam."
    exit 1
  fi
fi

echo
print "== 3) Ieškome package managerio (pnpm / yarn / npm) =="

PM=""
if command -v pnpm >/dev/null 2>&1; then
  PM="pnpm"
  print "✔ Naudosime pnpm"
elif command -v yarn >/dev/null 2>&1; then
  PM="yarn"
  print "✔ Naudosime yarn"
elif command -v npm >/dev/null 2>&1; then
  PM="npm"
  print "✔ Naudosime npm"
else
  error "❌ Nerastas pnpm, yarn ar npm!"
  exit 1
fi

echo
print "== 4) Išvalome senus build failus =="

rm -rf node_modules package-lock.json pnpm-lock.yaml yarn.lock 2>/dev/null || true
print "✔ Išvalyta"

echo
print "== 5) Įrašome priklausomybes =="

case "$PM" in
  pnpm) INSTALL_CMD="pnpm install" ;;
  yarn) INSTALL_CMD="yarn install" ;;
  npm)  INSTALL_CMD="npm install" ;;
esac

warn "➡ Paleidžiama komanda: $INSTALL_CMD"
$INSTALL_CMD
print "✔ Dependencies įdiegtos"

echo
print "== 6) Paleidžiame development serverį =="

case "$PM" in
  pnpm) DEV_CMD="pnpm run dev" ;;
  yarn) DEV_CMD="yarn dev" ;;
  npm)  DEV_CMD="npm run dev" ;;
esac

warn "➡ Paleidžiama komanda: $DEV_CMD"
print "🚀 Frontend serveris startuoja..."
echo -e "${BLUE}👉 Po kelių sekundžių bus pasiekiamas adresu:${RESET}"
echo -e "${GREEN}   http://localhost:5173${RESET}"
echo -e "${GREEN}   arba http://localhost:3000${RESET}"

$DEV_CMD
