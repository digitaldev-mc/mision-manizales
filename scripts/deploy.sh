#!/usr/bin/env bash
set -euo pipefail

cd ~/mision-manizales-src

git pull origin main

npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
npm run build

pm2 reload mision-manizales --update-env

sleep 2
curl -sf http://127.0.0.1:8010/api/health || {
  echo "Healthcheck falló tras el deploy" >&2
  exit 1
}

echo "Deploy OK: $(git log -1 --oneline)"
