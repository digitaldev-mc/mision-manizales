#!/usr/bin/env bash
# Build + reinicio PM2 en el VPS (cargar NVM antes de npm/pm2).
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi

cd ~/mision-manizales-src

echo "Node: $(node -v) | npm: $(npm -v) | pm2: $(command -v pm2)"

npm install
npx prisma migrate deploy
npm run build
cp .env .next/standalone/.env
cp -r .next/static .next/standalone/.next/static
mkdir -p public/uploads .next/standalone/public/uploads
cp -r public/. .next/standalone/public/

pm2 delete mision-manizales 2>/dev/null || true
pm2 start scripts/ecosystem.config.js
pm2 save

sleep 2
curl -sf http://127.0.0.1:8010/api/health
echo ""
echo "Deploy OK: $(git log -1 --oneline)"
