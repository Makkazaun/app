/**
 * GET /api/jtl/angebote?kKunde=<id>
 *
 * Gibt alle Angebote eines JTL-Kunden zurück (tAngebot + tAngebotPos).
 *
 * SERVER-ONLY: DB-Credentials verlassen niemals den Server.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAngeboteByKunde } from '@/src/lib/db-jtl'

export async function GET(req: NextRequest) {
  const kKundeStr = req.nextUrl.searchParams.get('kKunde')
  const kKunde = kKundeStr ? parseInt(kKundeStr, 10) : NaN

  if (!kKunde || isNaN(kKunde)) {
    return NextResponse.json({ error: 'kKunde (integer) fehlt.' }, { status: 400 })
  }

  try {
    const angebote = await getAngeboteByKunde(kKunde)
    return NextResponse.json({ angebote }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[jtl/angebote]', msg)
    return NextResponse.json({ error: 'JTL-Datenbank nicht erreichbar.', detail: msg }, { status: 502 })
  }
}
