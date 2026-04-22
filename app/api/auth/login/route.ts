/**
 * POST /api/auth/login
 *
 * Body: { email: string, password: string }
 *
 * 1. Sucht Nutzer in Portal-DB.
 * 2. Vergleicht Passwort mit bcrypt-Hash.
 * 3. Gibt JTL-Stammdaten zurück (kKunde, kundennummer).
 *
 * 200 { ok: true,  email, kKunde, kundennummer }
 * 200 { ok: false, error }   → falsches Passwort / unbekannte E-Mail
 * 400 { error }              → Eingabefehler
 * 500 { error }              → Datenbankfehler
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { findUserByEmail } from '@/src/lib/portal-db'

export async function POST(req: NextRequest) {
  let email: string, password: string
  try {
    const body = await req.json()
    email    = (body.email    ?? '').trim().toLowerCase()
    password = (body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'E-Mail und Passwort erforderlich.' }, { status: 400 })
  }

  try {
    const user = findUserByEmail(email)

    // Kein Eintrag oder noch kein Passwort gesetzt
    if (!user || !user.password_hash) {
      // Konstante Verzögerung gegen Timing-Angriffe
      await bcrypt.hash('dummy', 10)
      return NextResponse.json(
        { ok: false, error: 'E-Mail oder Passwort falsch.' },
        { status: 200 }
      )
    }

    const match = await bcrypt.compare(password, user.password_hash)

    if (!match) {
      return NextResponse.json(
        { ok: false, error: 'E-Mail oder Passwort falsch.' },
        { status: 200 }
      )
    }

    console.log(`[login] ✓ Anmeldung erfolgreich: "${email}" (kKunde: ${user.k_kunde})`)
    return NextResponse.json({
      ok:           true,
      email:        user.email,
      kKunde:       user.k_kunde,
      kundennummer: user.kundennummer,
    }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[login] Fehler:', msg)
    return NextResponse.json({ error: 'Datenbankfehler. Bitte versuchen Sie es später erneut.' }, { status: 500 })
  }
}
