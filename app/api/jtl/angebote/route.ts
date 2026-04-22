/**
 * GET /api/jtl/angebote?kKunde=<id>
 *
 * Gibt alle Angebote eines JTL-Kunden zurück.
 *
 * Status-Merge: Angebote die in portal-db als abgelehnt erfasst sind erhalten
 * status='abgelehnt' unabhängig vom JTL-nAuftragStatus.
 * Portal-DB ist autoritativ für Ablehnungen (JTL bekommt nur die Farbe).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAngeboteByKunde } from '@/src/lib/db-jtl'
import { getRejectedAuftragIds } from '@/src/lib/portal-db'

export async function GET(req: NextRequest) {
  const kKundeStr = req.nextUrl.searchParams.get('kKunde')
  const kKunde = kKundeStr ? parseInt(kKundeStr, 10) : NaN

  if (!kKunde || isNaN(kKunde)) {
    return NextResponse.json({ error: 'kKunde (integer) fehlt.' }, { status: 400 })
  }

  try {
    const [angebote, rejected] = await Promise.all([
      getAngeboteByKunde(kKunde),
      Promise.resolve(getRejectedAuftragIds()),
    ])

    const merged = rejected.size === 0
      ? angebote
      : angebote.map((a) =>
          rejected.has(a.kAuftrag) ? { ...a, status: 'abgelehnt' as const } : a,
        )

    return NextResponse.json({ angebote: merged }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[jtl/angebote]', msg)
    return NextResponse.json({ error: 'JTL-Datenbank nicht erreichbar.', detail: msg }, { status: 502 })
  }
}
