/**
 * POST /api/auth/reset-password
 *
 * Body: { token: string, password: string }
 *
 * 1. Validiert Token aus Portal-DB.
 * 2. Hasht das neue Passwort mit bcrypt (saltRounds=12).
 * 3. Speichert Hash in users-Tabelle der Portal-DB.
 * 4. Token wird verbraucht (Einmal-Token).
 *
 * 200 { ok: true }          → Passwort gesetzt
 * 400 { error }             → Eingabefehler
 * 422 { error }             → Token ungültig / abgelaufen
 * 500 { error }             → Datenbankfehler
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import {
  validateResetToken,
  consumeResetToken,
  setPasswordHash,
  findUserByEmail,
} from '@/src/lib/portal-db'

const SALT_ROUNDS = 12

export async function POST(req: NextRequest) {
  let token: string, password: string
  try {
    const body = await req.json()
    token    = (body.token    ?? '').trim()
    password = (body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!token) {
    return NextResponse.json({ error: 'Kein Token angegeben.' }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: 'Passwort muss mindestens 8 Zeichen haben.' },
      { status: 400 }
    )
  }

  // ── Token validieren ──────────────────────────────────────────────────────
  let email: string | null
  try {
    email = validateResetToken(token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[reset-password] DB-Fehler bei Token-Prüfung:', msg)
    return NextResponse.json({ error: 'Datenbankfehler.' }, { status: 500 })
  }

  if (!email) {
    return NextResponse.json(
      { error: 'Link abgelaufen oder ungültig. Bitte erneut anfordern.' },
      { status: 422 }
    )
  }

  // ── Passwort hashen + speichern ───────────────────────────────────────────
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    setPasswordHash(email, hash)
    consumeResetToken(token)   // Einmal-Token sofort entwerten – kein zweites Einlösen möglich

    // Nutzerdaten für Auto-Login zurückgeben (kein extra Fetch nötig)
    const user = findUserByEmail(email)
    console.log(`[reset-password] ✓ Passwort gesetzt für "${email}" | kKunde: ${user?.k_kunde ?? '–'}`)

    return NextResponse.json({
      ok:           true,
      email:        user?.email        ?? email,
      kKunde:       user?.k_kunde      ?? null,
      kundennummer: user?.kundennummer ?? null,
    }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[reset-password] Fehler beim Speichern:', msg)
    return NextResponse.json({ error: 'Passwort konnte nicht gespeichert werden.' }, { status: 500 })
  }
}
