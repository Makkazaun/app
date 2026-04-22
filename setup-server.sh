#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-server.sh – Einmalige Server-Einrichtung
#
# Ausführen auf dem Strato-Server (87.106.137.253) als root:
#   scp setup-server.sh root@87.106.137.253:~
#   ssh root@87.106.137.253 "bash ~/setup-server.sh"
#
# Was installiert wird:
#   - Node.js 20 (LTS) via NodeSource
#   - PM2 (Prozess-Manager)
#   - Nginx (Reverse-Proxy)
#   - Certbot + nginx-Plugin (Let's Encrypt TLS)
#   - Verzeichnisstruktur für die App
#   - Nginx-Konfiguration (HTTP → HTTPS, Proxy → :3000)
#   - PM2-Autostart beim Server-Neustart
#
# Nach dem Setup:
#   1. .env.local auf den Server legen (DB, SMTP, API-Keys)
#   2. ship-it.sh vom lokalen Rechner ausführen → deployt die App
#   3. certbot --nginx -d edelzaun-tor.de -d www.edelzaun-tor.de  (TLS einrichten)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

DOMAIN="app.edelzaun-tor.de"
APP_DIR="/var/www/edelzaun-app"
LOG_DIR="/var/log/edelzaun"
NGINX_CONF="/etc/nginx/sites-available/edelzaun"
NGINX_ENABLED="/etc/nginx/sites-enabled/edelzaun"

# ── Farben ─────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
info() { echo -e "${YELLOW}→ $*${NC}"; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Edelzaun App – Server-Setup"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. System-Pakete aktualisieren ────────────────────────────────────────────
info "System aktualisieren …"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git unzip ufw
ok "System aktuell"

# ── 2. Node.js 20 (LTS) ──────────────────────────────────────────────────────
info "Node.js 20 installieren …"
if command -v node &>/dev/null && [[ "$(node -v)" == v20* ]]; then
  ok "Node.js $(node -v) bereits vorhanden"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &>/dev/null
  apt-get install -y -qq nodejs
  ok "Node.js $(node -v) installiert"
fi

# ── 3. PM2 ───────────────────────────────────────────────────────────────────
info "PM2 installieren …"
npm install -g pm2 --silent
ok "PM2 $(pm2 -v) installiert"

# ── 4. Nginx ─────────────────────────────────────────────────────────────────
info "Nginx installieren …"
apt-get install -y -qq nginx
systemctl enable nginx
systemctl start nginx
ok "Nginx installiert und gestartet"

# ── 5. Certbot ───────────────────────────────────────────────────────────────
info "Certbot installieren …"
apt-get install -y -qq certbot python3-certbot-nginx
ok "Certbot installiert"

# ── 6. Verzeichnisse anlegen ──────────────────────────────────────────────────
info "Verzeichnisse anlegen …"
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/private/documents"
mkdir -p "$LOG_DIR"
chmod 750 "$APP_DIR/private"
chmod 755 "$APP_DIR/private/documents"
ok "$APP_DIR  (inkl. private/documents)"
ok "$LOG_DIR"

# ── 7. Nginx konfigurieren ────────────────────────────────────────────────────
info "Nginx-Konfiguration schreiben …"
cat > "$NGINX_CONF" <<NGINX_EOF
# Edelzaun App – Nginx Reverse-Proxy
# Certbot ergänzt automatisch den HTTPS-Block (ssl_certificate etc.)

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Let's Encrypt Challenge (Certbot braucht das)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Alle anderen Anfragen → App auf Port 3000
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        'upgrade';
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts für langsame JTL-DB-Abfragen
        proxy_read_timeout    60s;
        proxy_connect_timeout 10s;
        proxy_send_timeout    60s;

        # Datei-Upload bis 25 MB (für PDF-Upload-Endpoint)
        client_max_body_size 25M;
    }

    # Statische Next.js-Assets direkt aus Dateisystem – kein Proxy-Overhead
    location /_next/static/ {
        alias $APP_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Öffentliche Dateien (public/)
    location /public/ {
        alias $APP_DIR/public/;
        expires 7d;
        access_log off;
    }
}
NGINX_EOF

# Default-Site deaktivieren, unsere aktivieren
rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

nginx -t && systemctl reload nginx
ok "Nginx-Konfiguration aktiv (HTTP, ohne TLS)"

# ── 8. Firewall ───────────────────────────────────────────────────────────────
info "UFW-Firewall einrichten …"
ufw --force reset &>/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
ok "Firewall: SSH + HTTP/HTTPS erlaubt, alles andere gesperrt"

# ── 9. PM2 Autostart ─────────────────────────────────────────────────────────
info "PM2-Autostart konfigurieren …"
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
ok "PM2 startet automatisch nach Server-Neustart"

# ── Abschluss ─────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup abgeschlossen."
echo ""
echo "  Nächste Schritte:"
echo ""
echo "  1. .env.local auf den Server kopieren:"
echo "     scp .env.local root@87.106.137.253:$APP_DIR/"
echo ""
echo "  2. App deployen (lokal ausführen):"
echo "     ./ship-it.sh"
echo ""
echo "  3. TLS-Zertifikat einrichten (auf dem Server):"
echo "     certbot --nginx -d $DOMAIN"
echo ""
echo "  4. Zertifikat-Erneuerung testen:"
echo "     certbot renew --dry-run"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
