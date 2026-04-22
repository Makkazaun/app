import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /**
   * Standalone-Modus: Next.js bündelt alle serverseitigen Abhängigkeiten
   * in .next/standalone/. Kein npm install auf dem Produktions-Server nötig.
   *
   * Deployment-Artefakte nach dem Build:
   *   .next/standalone/   → kompletter Server (server.js + minimale node_modules)
   *   .next/static/       → statische Client-Assets  (→ muss nach .next/standalone/.next/static/ kopiert werden)
   *   public/             → öffentliche Dateien       (→ muss nach .next/standalone/public/ kopiert werden)
   *
   * Standalone-Start: node server.js  (nicht mehr „next start")
   * PM2 übernimmt das über ecosystem.config.js
   */
  output: 'standalone',

  /**
   * outputFileTracingRoot: Verhindert, dass Next.js den übergeordneten
   * Ordner als Workspace-Root erkennt und das Standalone-Ergebnis in einem
   * Unterordner (z.B. standalone/edelzaun/) ablegt.
   * server.js liegt damit direkt unter .next/standalone/server.js.
   */
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
