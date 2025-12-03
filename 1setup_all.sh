#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR" || exit 1

PHP_SERVICES=(auth catalog chat coach-plans payments planner profiles progress)

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
echo "✅ Baigta. vendor/ sugeneruotas, konteineriai turi startuoti be 'vendor/autoload.php' klaidų."
