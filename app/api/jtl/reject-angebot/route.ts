/**
 * POST /api/jtl/reject-angebot
 *
 * Body: { kAngebot: number }
 *
 * Markiert ein Angebot als "abgelehnt" durch den Kunden
 * (setzt nAuftragStatus=99 + schreibt Zeitstempel in cAnmerkung).
 */

import { NextRequest, NextResponse } from 'next/server'
import { markAngebotAbgelehnt } from '@/src/lib/db-jtl'

export async function POST(req: NextRequest) {
  let body: { kAngebot?: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 }) }

  const kAngebot = typeof body.kAngebot === 'number' ? body.kAngebot : NaN
  if (!kAngebot || isNaN(kAngebot) || kAngebot <= 0)
    return NextResponse.json({ error: 'kAngebot fehlt oder ungültig.' }, { status: 400 })

  try {
    await markAngebotAbgelehnt(kAngebot)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[jtl/reject-angebot]', msg)
    return NextResponse.json({ error: 'Ablehnung fehlgeschlagen.', detail: msg }, { status: 502 })
  }
}
