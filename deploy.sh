#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh – Edelzaun Kundenportal · Produktions-Deployment
#
# Verwendung:
#   chmod +x deploy.sh    (einmalig)
#   ./deploy.sh
#
# Voraussetzungen auf dem Server:
#   - Node.js 20+ (node, npm)
#   - PM2  (npm install -g pm2)
#   - /var/www/edelzaun-app enthält den ausgecheckten Code
#   - /var/www/edelzaun-app/.env.local enthält DB + SMTP Credentials
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="/var/www/edelzaun-app"
LOG_DIR="/var/log/edelzaun"
DOCS_DIR="$APP_DIR/private/documents"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Edelzaun Kundenportal – Deploy"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$APP_DIR"

# ── 1. Verzeichnisse sicherstellen ────────────────────────────────────────────
echo "→ Verzeichnisse anlegen …"
mkdir -p "$LOG_DIR"
mkdir -p "$DOCS_DIR"
chmod 755 "$DOCS_DIR"
echo "   ✓ $DOCS_DIR (chmod 755)"

# ── 2. .env.local prüfen ─────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo ""
  echo "  FEHLER: $APP_DIR/.env.local fehlt!"
  echo "  Bitte die Datei mit DB- und SMTP-Credentials anlegen."
  echo "  Vorlage: .env.local.example (im Repo-Root)"
  echo ""
  exit 1
fi
echo "   ✓ .env.local vorhanden"

# ── 3. Abhängigkeiten installieren ────────────────────────────────────────────
echo "→ npm ci …"
npm ci --prefer-offline --no-audit 2>&1 | tail -3

# ── 4. Build ─────────────────────────────────────────────────────────────────
echo "→ npm run build …"
npm run build

# ── 5. PM2 – alten Prozess stoppen, neuen starten ────────────────────────────
echo "→ PM2 neu starten …"
if pm2 describe edelzaun-app > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
  echo "   ✓ Prozess neu geladen (reload)"
else
  pm2 start ecosystem.config.js
  pm2 save
  echo "   ✓ Prozess erstmalig gestartet"
fi

# ── 6. Statusübersicht ────────────────────────────────────────────────────────
echo ""
pm2 list
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deploy abgeschlossen."
echo "  Logs: pm2 logs edelzaun-app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
