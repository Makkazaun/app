/**
 * GET /api/jtl/auftraege?kKunde=<id>
 *
 * Gibt alle Aufträge/Bestellungen eines JTL-Kunden zurück (tBestellung + tBestellPos).
 *
 * SERVER-ONLY: DB-Credentials verlassen niemals den Server.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuftraegeByKunde } from '@/src/lib/db-jtl'

export async function GET(req: NextRequest) {
  const kKundeStr = req.nextUrl.searchParams.get('kKunde')
  const kKunde = kKundeStr ? parseInt(kKundeStr, 10) : NaN

  if (!kKunde || isNaN(kKunde)) {
    return NextResponse.json({ error: 'kKunde (integer) fehlt.' }, { status: 400 })
  }

  try {
    const auftraege = await getAuftraegeByKunde(kKunde)
    return NextResponse.json({ auftraege }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[jtl/auftraege]', msg)
    return NextResponse.json({ error: 'JTL-Datenbank nicht erreichbar.', detail: msg }, { status: 502 })
  }
}
