/**
 * GET /api/jtl/kunde?email=<email>
 *
 * Sucht einen Kunden in der JTL-Wawi-Datenbank anhand der E-Mail.
 * Gibt Stammdaten + Adressen zurück.
 *
 * SERVER-ONLY: DB-Credentials verlassen niemals den Server.
 */

import { NextRequest, NextResponse } from 'next/server'
import { findKundeByEmail } from '@/src/lib/db-jtl'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 })
  }

  try {
    const kunde = await findKundeByEmail(email)

    if (!kunde) {
      return NextResponse.json({ found: false, kunde: null }, { status: 200 })
    }

    return NextResponse.json({ found: true, kunde }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[jtl/kunde]', msg)

    // Konfigurationsfehler vs. Verbindungsfehler unterscheiden
    if (msg.includes('Umgebungsvariablen')) {
      return NextResponse.json({ error: 'DB nicht konfiguriert.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'JTL-Datenbank nicht erreichbar.', detail: msg }, { status: 502 })
  }
}
