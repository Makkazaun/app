/**
 * POST /api/jtl/reject-angebot
 *
 * Body: { kAngebot: number, cAngebotNr: string }
 *
 * Ablehnung eines Angebots durch den Kunden:
 *   1. Autoritativer Eintrag in portal-db (angebot_rejections) → Status "abgelehnt" in der App
 *   2. JTL-Wawi: UPDATE tAuftragText SET cVorgangsstatus='abgelehnt' (non-fatal)
 */

import { NextRequest, NextResponse } from 'next/server'
import { markAngebotAbgelehnt } from '@/src/lib/db-jtl'
import { rejectAngebotInPortal } from '@/src/lib/portal-db'

export async function POST(req: NextRequest) {
  let body: { kAngebot?: unknown; cAngebotNr?: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 }) }

  const kAngebot   = typeof body.kAngebot   === 'number' ? body.kAngebot   : NaN
  const cAngebotNr = typeof body.cAngebotNr === 'string' ? body.cAngebotNr.trim() : ''

  if (!kAngebot || isNaN(kAngebot) || kAngebot <= 0)
    return NextResponse.json({ error: 'kAngebot fehlt oder ungültig.' }, { status: 400 })
  if (!cAngebotNr)
    return NextResponse.json({ error: 'cAngebotNr fehlt.' }, { status: 400 })

  // 1. Portal-DB – autoritativer Ablehnungs-Eintrag (Status "abgelehnt" in der App)
  rejectAngebotInPortal(kAngebot)
  console.log(`[jtl/reject-angebot] portal-db: kAngebot=${kAngebot} (${cAngebotNr}) als abgelehnt markiert`)

  // 2. JTL-Wawi – cVorgangsstatus (non-fatal, markAngebotAbgelehnt wirft nie)
  const jtl = await markAngebotAbgelehnt(cAngebotNr)
  console.log(`[jtl/reject-angebot] JTL-Ergebnis: path=${jtl.path ?? 'keiner'} rowsAffected=${jtl.rowsAffected}${jtl.error ? ` error="${jtl.error}"` : ''}`)

  return NextResponse.json({
    success:   true,
    kAngebot,
    cAngebotNr,
    jtlFarbe: {
      rowsAffected: jtl.rowsAffected,
      path:         jtl.path ?? null,
      ...(jtl.error ? { error: jtl.error } : {}),
    },
  })
}
