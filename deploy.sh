#!/usr/bin/env bash
set -euo pipefail

# ─── Config ───
SSH_HOST="${SSH_HOST:-root@162.35.184.86}"
PROJECT_DIR="${PROJECT_DIR:-/opt/doctors-desk}"
PM2_NAME="${PM2_NAME:-doctors-desk-api}"

echo "╔════════════════════════════════════════╗
║  Deploying doctor-s-desk to ${SSH_HOST}
║  Project: ${PROJECT_DIR}
║  PM2: ${PM2_NAME}
╚════════════════════════════════════════╝"

# ─── 1. Git pull ───
echo "▸ Pulling latest code…"
ssh "${SSH_HOST}" "cd ${PROJECT_DIR} && git pull --rebase"

# ─── 2. Install server deps ───
echo "▸ Installing server dependencies…"
ssh "${SSH_HOST}" "cd ${PROJECT_DIR}/server && npm ci --omit=dev 2>/dev/null || npm install"

# ─── 3. Install frontend deps + build ───
echo "▸ Building frontend…"
ssh "${SSH_HOST}" "cd ${PROJECT_DIR} && npm ci 2>/dev/null || npm install && npm run build"

# ─── 4. Database migration ───
echo "▸ Running database migration…"
ssh "${SSH_HOST}" "cd ${PROJECT_DIR}/server && npx drizzle-kit push"

# ─── 5. Seed (cashier + services) ───
echo "▸ Seeding database…"
ssh "${SSH_HOST}" "cd ${PROJECT_DIR}/server && npx tsx src/db/seed.ts"

# ─── 6. Restart PM2 ───
echo "▸ Restarting PM2 process…"
ssh "${SSH_HOST}" "cd ${PROJECT_DIR} && pm2 restart ${PM2_NAME} --update-env || pm2 start ecosystem.config.cjs"

echo "✅ Deploy complete!"
ssh "${SSH_HOST}" "pm2 status ${PM2_NAME}"
