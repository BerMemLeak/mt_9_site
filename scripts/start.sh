#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v docker >/dev/null || { echo 'Установите Docker Engine и плагин Docker Compose.' >&2; exit 1; }
docker compose version >/dev/null
if [ ! -f .env ]; then
  umask 077
  docker run --rm python:3.12-slim python -c 'import secrets; print("SITE_PORT=8080\nADMIN_USER=admin\nADMIN_PASSWORD="+secrets.token_hex(16)+"\nSECRET_KEY="+secrets.token_hex(32)+"\nINTERNAL_TOKEN="+secrets.token_hex(32)+"\nCOOKIE_SECURE=false\nMAX_BACKUP_BYTES=107374182400")' > .env.tmp
  mv .env.tmp .env
  chmod 600 .env
  echo 'Создан .env. Логин и пароль администратора находятся в этом файле.'
fi
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 180
echo 'Приложение запущено. Админка: http://<адрес-сервера>:<SITE_PORT>/admin'
echo 'Локальные адреса и состояние: docker compose ps'
