/**
 * POST /api/jtl/reject-angebot
 *
 * Body: { kAngebot: number }
 *
 * Ablehnung eines Angebots durch den Kunden:
 *   1. Autoritativer Eintrag in portal-db (angebot_rejections) → Status "abgelehnt" in der App
 *   2. Visuell: nFarbe=ROT in JTL-Wawi (non-fatal, rein optisch)
 *      – Ergebnis (rowsAffected, ggf. Fehler) wird geloggt und in der Response zurückgegeben
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

  console.log(`[jtl/reject-angebot] Ablehnung gestartet – kAngebot=${kAngebot}`)

  // 1. Portal-DB – autoritativer Ablehnungs-Eintrag
  rejectAngebotInPortal(kAngebot)
  console.log(`[jtl/reject-angebot] portal-db: kAngebot=${kAngebot} als abgelehnt markiert`)

  // 2. JTL-Wawi – Farbmarkierung (non-fatal)
  const jtl = await markAngebotAbgelehnt(kAngebot)
  console.log(`[jtl/reject-angebot] JTL nFarbe-Ergebnis: rowsAffected=${jtl.rowsAffected}${jtl.error ? ` Fehler="${jtl.error}"` : ''}`)

  return NextResponse.json({
    success:      true,
    kAngebot,
    jtlFarbe: {
      rowsAffected: jtl.rowsAffected,
      ...(jtl.error ? { error: jtl.error } : {}),
    },
  })
}
