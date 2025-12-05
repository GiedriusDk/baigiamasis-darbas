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

# Ar prašyta priverstinai perinstaliuoti
REINSTALL=false
if [[ "${1-}" == "--reinstall" ]]; then
  REINSTALL=true
fi

print "== 1) Einam į webapp katalogą =="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR/webapp" || { error "Nepavyko rasti /webapp katalogo."; exit 1; }

echo
print "== 2) .env failas =="

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    warn "Nerasta .env – kopijuoju iš .env.example"
    cp .env.example .env
  else
    warn "Nerasta nei .env, nei .env.example – sukuriu tuščią .env (vėliau susitvarkysi pats)"
    touch .env
  fi
else
  print ".env jau yra – palieku kaip yra"
fi

echo
print "== 3) PostCSS config (apsaugom nuo globalaus Tailwind config) =="

if [ ! -f "postcss.config.cjs" ] && [ ! -f "postcss.config.js" ]; then
  cat > postcss.config.cjs << 'EOF'
/**
 * Vietinis PostCSS config, kad Vite nenaudotų globalaus
 * C:\Users\...\postcss.config.js, kuriame reikalaujamas tailwindcss.
 */
module.exports = {
  plugins: [],
};
EOF
  print "Sukurtas minimalus postcss.config.cjs"
else
  print "postcss.config.* jau yra – nieko nedarau"
fi

echo
print "== 4) Tikrinam Node.js versiją =="

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
  warn "Node.js versija per sena arba nerasta (reikia ≥22.x)."
  echo "Siūloma įdiegti naują Node.js per nvm."
  read -p "Ar norite instaliuoti Node.js 22.x automatiškai? (y/n) " yn
  if [[ "$yn" =~ ^[Yy]$ ]]; then
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
    print "Node.js sėkmingai atnaujintas: $(node -v)"
  else
    error "Node.js per sena. Sustojam."
    exit 1
  fi
fi

echo
print "== 5) Ieškome package managerio (pnpm / yarn / npm) =="

PM=""
if command -v pnpm >/dev/null 2>&1; then
  PM="pnpm"
  print "Naudosime pnpm"
elif command -v yarn >/dev/null 2>&1; then
  PM="yarn"
  print "Naudosime yarn"
elif command -v npm >/dev/null 2>&1; then
  PM="npm"
  print "Naudosime npm"
else
  error "Nerastas pnpm, yarn ar npm!"
  exit 1
fi

echo
print "== 6) Priklausomybės =="

if [ "$REINSTALL" = true ]; then
  warn "Prašei --reinstall → šalinam lock failus ir node_modules"
  rm -rf node_modules package-lock.json pnpm-lock.yaml yarn.lock 2>/dev/null || true
fi

if [ -d node_modules ] && [ "$REINSTALL" = false ]; then
  print "node_modules jau yra – praleidžiam install (paliekam kaip yra)."
else
  print "Įrašome priklausomybes…"

  case "$PM" in
    pnpm) INSTALL_CMD="pnpm install" ;;
    yarn) INSTALL_CMD="yarn install" ;;
    npm)  INSTALL_CMD="npm install" ;;
  esac

  warn "Paleidžiama komanda: $INSTALL_CMD"
  $INSTALL_CMD
  print "Dependencies įdiegtos"
fi

echo
print "== 7) Paleidžiame development serverį =="

case "$PM" in
  pnpm) DEV_CMD="pnpm run dev" ;;
  yarn) DEV_CMD="yarn dev" ;;
  npm)  DEV_CMD="npm run dev" ;;
esac

warn "Paleidžiama komanda: $DEV_CMD"
print "Frontend serveris startuoja..."
echo -e "${BLUE}Po kelių sekundžių bus pasiekiamas adresu:${RESET}"
echo -e "${GREEN}  http://localhost:5173${RESET}"
echo -e "${GREEN}  (arba koks port'as parašytas terminale)${RESET}"

$DEV_CMD
