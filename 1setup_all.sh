#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR" || exit 1

PHP_SERVICES=(auth catalog chat coach-plans payments planner profiles progress)

echo "== -1) Kopijuojame .env failus (jei dar nėra) =="

for S in "${PHP_SERVICES[@]}"; do
  SERVICE_DIR="services/$S"

  if [[ ! -d "$SERVICE_DIR" ]]; then
    echo "⚠️ Serviso '$S' katalogas nerastas: $SERVICE_DIR"
    continue
  fi

  if [[ -f "$SERVICE_DIR/.env" ]]; then
    echo "✔️ $S: .env jau egzistuoja — nekopijuojame."
  else
    if [[ -f "$SERVICE_DIR/.env.example" ]]; then
      cp "$SERVICE_DIR/.env.example" "$SERVICE_DIR/.env"
      echo "📄 $S: nukopijuota .env.example → .env"
    else
      echo "❌ $S: nėra .env.example — praleidžiame."
    fi
  fi
done

echo
echo "== 0) Build'inam PHP servisų image'us =="
docker compose build "${PHP_SERVICES[@]}"

echo
echo "== 1) composer install kiekvienam servise (per docker compose run) =="

for S in "${PHP_SERVICES[@]}"; do
  echo
  echo "---- [$S] composer install ----"
  docker compose run --rm "$S" \
    composer install --no-interaction --prefer-dist || {
      echo "⚠️ composer install nepavyko servise '$S' (skriptas tęsia)."
    }
done

echo
echo "== 2) Keliame VISĄ stack'ą (db, gateway, mailpit, php servisus) =="
docker compose up -d

echo
echo "✅ Baigta. .env failai sukurti, vendor/ sugeneruoti, visi konteineriai pakelti."
