/**
 * POST /api/jtl/reject-angebot
 *
 * Body: { kAngebot: number }
 *
 * Ablehnung eines Angebots durch den Kunden:
 *   1. Autoritativer Eintrag in portal-db (angebot_rejections) → Status "abgelehnt" in der App
 *   2. Visuell: nFarbe=ROT in JTL-Wawi (non-fatal, rein optisch)
 *
 * Es werden KEINE weiteren Spalten in JTL beschrieben (kein cAnmerkung, kein nAuftragStatus).
 */

import { NextRequest, NextResponse } from 'next/server'
import { markAngebotAbgelehnt } from '@/src/lib/db-jtl'
import { rejectAngebotInPortal } from '@/src/lib/portal-db'

export async function POST(req: NextRequest) {
  let body: { kAngebot?: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 }) }

  const kAngebot = typeof body.kAngebot === 'number' ? body.kAngebot : NaN
  if (!kAngebot || isNaN(kAngebot) || kAngebot <= 0)
    return NextResponse.json({ error: 'kAngebot fehlt oder ungültig.' }, { status: 400 })

  // 1. Portal-DB – autoritativer Ablehnungs-Eintrag (synchron, schnell)
  rejectAngebotInPortal(kAngebot)
  console.log(`[jtl/reject-angebot] kAngebot=${kAngebot} in portal-db als abgelehnt markiert`)

  // 2. JTL-Wawi – nur Farbmarkierung (non-fatal, markAngebotAbgelehnt wirft nie)
  await markAngebotAbgelehnt(kAngebot)

  return NextResponse.json({ success: true, kAngebot })
}
