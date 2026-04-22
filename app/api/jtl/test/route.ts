/**
 * GET /api/jtl/test
 *
 * Verbindungstest zur JTL-Wawi-Datenbank.
 * Gibt Server-Version und Verbindungsstatus zurück.
 *
 * Nur im Entwicklungsmodus erreichbar – im Produktionsbetrieb deaktiviert.
 */

import { NextResponse } from 'next/server'
import { testConnection } from '@/src/lib/db-jtl'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Nur im Entwicklungsmodus verfügbar.' }, { status: 403 })
  }

  const start = Date.now()

  try {
    const info = await testConnection()

    return NextResponse.json({
      ok:        true,
      server:    info.server,
      version:   info.version,
      latencyMs: Date.now() - start,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[jtl/test]', msg)
    return NextResponse.json({
      ok:        false,
      error:     msg,
      latencyMs: Date.now() - start,
    }, { status: 502 })
  }
}
