/**
 * GET /api/jtl/rechnungen?kKunde=<n>
 *
 * Gibt alle Rechnungen eines Kunden aus JTL-Wawi zurück.
 * Diese Route ist AUSSCHLIESSLICH lesend (READ-ONLY).
 * Rechnungen werden NIEMALS über die App verändert.
 *
 * 200 { rechnungen: JtlRechnung[] }
 * 400 { error }  → kKunde fehlt
 * 502 { error }  → JTL-DB Fehler
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRechnungenByKunde } from '@/src/lib/db-jtl'

export async function GET(req: NextRequest) {
  const kKunde = parseInt(req.nextUrl.searchParams.get('kKunde') ?? '', 10)
  if (!kKunde || isNaN(kKunde)) {
    return NextResponse.json({ error: 'kKunde fehlt.' }, { status: 400 })
  }

  try {
    const rechnungen = await getRechnungenByKunde(kKunde)
    console.log(`[api/jtl/rechnungen] ${rechnungen.length} Rechnung(en) für kKunde ${kKunde}`)
    return NextResponse.json({ rechnungen }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/jtl/rechnungen] Fehler:', msg)
    return NextResponse.json({ error: 'JTL-Datenbankfehler.' }, { status: 502 })
  }
}
