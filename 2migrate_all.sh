#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

SERVICES=(auth catalog chat coach-plans payments planner profiles progress)

echo "== Laravel migracijos visiems servisams =="

for S in "${SERVICES[@]}"; do
  echo
  echo "---- [$S] migrate ----"
  if docker compose ps "$S" >/dev/null 2>&1; then
    docker compose exec -T "$S" php artisan migrate --force || \
      echo "⚠️  '$S' migrate nepavyko (tik įspėjimas)."
  else
    echo "⚠️  konteineris '$S' nerastas / neįsijungęs – praleidžiam."
  fi
done

echo
echo "✅ Migracijos pabandytos visiems servisams."
