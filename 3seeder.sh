#!/usr/bin/env bash

set -e

echo "== Auth: roles + pirmas admin user =="
docker compose exec -T auth php artisan db:seed --class=DatabaseSeeder

echo
echo "== Catalog: importuojam ExerciseDB =="
docker compose exec -T catalog php artisan import:exercisedb

echo
echo "== Catalog: seedinam tagus =="
docker compose exec -T catalog php artisan db:seed --class=TagSeeder
docker compose exec -T catalog php artisan db:seed --class=ExerciseTagsSeeder

echo
echo "== Planner: seedinam split'us =="
docker compose exec -T planner php artisan db:seed --class=SplitSeeder

echo
echo "✅ Visi seederiai ir import:exercisedb paleisti."