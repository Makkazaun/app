/**
 * PM2-Konfiguration – Edelzaun App
 *
 * Deployment-Pfad: /var/www/edelzaun-app
 *
 * Dieser Prozess startet den Next.js Standalone-Server (server.js).
 * Das Standalone-Build liegt in /var/www/edelzaun-app/ (inkl. minimaler node_modules).
 *
 * Befehle:
 *   pm2 start ecosystem.config.js    # erstmalig starten
 *   pm2 reload edelzaun-app          # zero-downtime Neustart
 *   pm2 logs edelzaun-app            # Live-Logs
 *   pm2 status                       # Prozessübersicht
 *
 * Sensible Credentials (DB_PASSWORD, SMTP etc.) gehören NICHT hierher –
 * nur in /var/www/edelzaun-app/.env.local auf dem Server.
 * Next.js lädt .env.local automatisch beim Start.
 */

module.exports = {
  apps: [
    {
      name:        'edelzaun-app',

      // Standalone-Modus: server.js statt "next start"
      script:      'server.js',
      cwd:         '/var/www/edelzaun-app',

      instances:   1,
      exec_mode:   'fork',
      autorestart: true,
      watch:       false,
      max_memory_restart: '512M',

      env: {
        NODE_ENV:    'production',
        PORT:        3000,
        HOSTNAME:    '0.0.0.0',     // Server lauscht auf allen Interfaces (Nginx-Proxy)
        JTL_API_KEY: '234652158934783A5',
      },

      out_file:        '/var/log/edelzaun/out.log',
      error_file:      '/var/log/edelzaun/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs:      true,
    },
  ],
}
