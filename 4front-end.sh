#!/usr/bin/env bash

set -e

echo "== 1) Einam į webapp =="
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR/webapp"


echo "== 3) Tikrinam ar instaliuotas pnpm =="

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm nerastas – instaliuoju..."
  npm install -g pnpm
fi

echo
echo "== 4) Išvalom seną npm install šiukšlyną =="
rm -rf node_modules package-lock.json 2>/dev/null || true

echo
echo "== 5) pnpm install =="
pnpm install

echo
echo "== 6) Paleidžiam dev serverį =="
pnpm run dev