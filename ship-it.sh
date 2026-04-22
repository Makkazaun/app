#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ship-it.sh – Lokales Deployment-Skript
#
# Ausführen auf deinem lokalen Rechner:
#   chmod +x ship-it.sh    (einmalig)
#   ./ship-it.sh
#
# Was passiert:
#   1. Produktions-Build (Next.js Standalone)
#   2. Build-Artefakte für den Upload zusammenstellen
#   3. Dateien per scp auf den Server übertragen
#   4. nginx.conf hochladen + Nginx neu laden
#   5. PM2 auf dem Server neu starten
#
# Voraussetzungen:
#   - SSH-Key-Auth für root@87.106.137.253 ist eingerichtet
#     (ssh-copy-id root@87.106.137.253 einmalig ausführen)
#   - setup-server.sh wurde bereits auf dem Server ausgeführt
#   - .env.local liegt auf dem Server unter /var/www/edelzaun-app/.env.local
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Konfiguration ─────────────────────────────────────────────────────────────
SERVER_USER="root"
SERVER_HOST="87.106.137.253"
SERVER_DIR="/var/www/edelzaun-app"
SSH_TARGET="${SERVER_USER}@${SERVER_HOST}"

# ── Farben ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
info() { echo -e "${YELLOW}→ $*${NC}"; }
err()  { echo -e "${RED}  ✗ $*${NC}"; exit 1; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Edelzaun App – Ship It"
echo "  Ziel: ${SSH_TARGET}:${SERVER_DIR}"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 0. Voraussetzungen prüfen ─────────────────────────────────────────────────
command -v scp   &>/dev/null || err "scp nicht gefunden"
command -v ssh   &>/dev/null || err "ssh nicht gefunden"
command -v node  &>/dev/null || err "node nicht gefunden"
command -v npm   &>/dev/null || err "npm nicht gefunden"

info "SSH-Verbindung testen …"
ssh -o ConnectTimeout=8 -o BatchMode=yes "${SSH_TARGET}" "echo ok" &>/dev/null \
  || err "SSH-Verbindung zu ${SSH_TARGET} fehlgeschlagen.\n  Tipp: ssh-copy-id ${SSH_TARGET}"
ok "SSH-Verbindung steht"

# ── 1. Produktions-Build ──────────────────────────────────────────────────────
info "Produktions-Build starten …"
npm run build
ok "Build abgeschlossen (.next/standalone/ ist bereit)"

# ── 2. Statische Assets in Standalone-Verzeichnis kopieren ───────────────────
#    Next.js Standalone enthält KEINE statischen Assets – müssen manuell dazu.
info "Assets in Standalone-Paket einbetten …"
cp -r .next/static  .next/standalone/.next/static
cp -r public        .next/standalone/public
ok "static/ und public/ eingebettet"

# ── 3. Verzeichnisse auf dem Server sicherstellen ─────────────────────────────
info "Server-Verzeichnisse vorbereiten …"
ssh "${SSH_TARGET}" "
  mkdir -p ${SERVER_DIR}/.next
  mkdir -p ${SERVER_DIR}/private/documents
  mkdir -p /var/log/edelzaun
"
ok "Verzeichnisse OK"

# ── 4. Standalone-Paket per scp hochladen ────────────────────────────────────
info "Server-Zielverzeichnis leeren (ohne .env.local und private/) …"
ssh "${SSH_TARGET}" "
  find ${SERVER_DIR} -mindepth 1 -maxdepth 1 \
    ! -name '.env.local' ! -name 'private' \
    -exec rm -rf {} +
"
info "Standalone-Paket per scp hochladen …"
tar -czf - -C .next/standalone . | ssh "${SSH_TARGET}" "tar -xzf - -C ${SERVER_DIR}"
ok "Standalone-Build übertragen"

# ── 5. PM2-Konfiguration hochladen ───────────────────────────────────────────
info "PM2-Konfiguration hochladen …"
scp ecosystem.config.js "${SSH_TARGET}:${SERVER_DIR}/"
ok "ecosystem.config.js"

# ── 6. nginx.conf hochladen + Nginx neu laden ─────────────────────────────────
info "nginx.conf hochladen …"
scp nginx.conf "${SSH_TARGET}:/etc/nginx/sites-available/edelzaun"
ssh "${SSH_TARGET}" "
  ln -sf /etc/nginx/sites-available/edelzaun /etc/nginx/sites-enabled/edelzaun
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
"
ok "Nginx-Konfiguration aktiv"

# ── 7. PM2 neu starten ────────────────────────────────────────────────────────
info "PM2 auf dem Server neu starten …"
ssh "${SSH_TARGET}" "
  cd ${SERVER_DIR}

  if pm2 describe edelzaun-app &>/dev/null; then
    pm2 reload ecosystem.config.js --update-env
    echo '  reload: OK'
  else
    pm2 start ecosystem.config.js
    pm2 save
    echo '  start: OK'
  fi
"
ok "PM2 läuft"

# ── 8. Lokales Staging aufräumen ──────────────────────────────────────────────
info "Lokales Staging aufräumen …"
rm -rf .next/standalone/.next/static
rm -rf .next/standalone/public
ok "Lokales .next/standalone/ wieder sauber"

# ── Abschluss ─────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deployment abgeschlossen."
echo ""
echo "  App:    http://${SERVER_HOST}"
echo "  Logs:   ssh ${SSH_TARGET} 'pm2 logs edelzaun-app'"
echo "  Status: ssh ${SSH_TARGET} 'pm2 status'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
