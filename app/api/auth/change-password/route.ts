/**
 * POST /api/auth/change-password
 *
 * Body: { email: string, currentPassword: string, newPassword: string }
 *
 * 1. Sucht Nutzer in Portal-DB.
 * 2. Verifiziert das aktuelle Passwort per bcrypt.
 * 3. Hasht das neue Passwort und speichert es.
 *
 * 200 { ok: true }
 * 400 { error }   → Eingabefehler
 * 401 { error }   → Aktuelles Passwort falsch
 * 404 { error }   → Nutzer nicht gefunden
 * 500 { error }   → Datenbankfehler
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { findUserByEmail, setPasswordHash } from '@/src/lib/portal-db'

const SALT_ROUNDS = 12

export async function POST(req: NextRequest) {
  let email: string, currentPassword: string, newPassword: string
  try {
    const body    = await req.json()
    email           = (body.email           ?? '').trim().toLowerCase()
    currentPassword = (body.currentPassword ?? '')
    newPassword     = (body.newPassword     ?? '')
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!email || !currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Neues Passwort muss mindestens 8 Zeichen haben.' },
      { status: 400 }
    )
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: 'Neues Passwort muss sich vom aktuellen unterscheiden.' },
      { status: 400 }
    )
  }

  try {
    const user = findUserByEmail(email)
    if (!user || !user.password_hash) {
      // Timing-Schutz
      await bcrypt.hash('dummy', 10)
      return NextResponse.json(
        { error: 'Nutzer nicht gefunden oder kein Passwort gesetzt.' },
        { status: 404 }
      )
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash)
    if (!match) {
      return NextResponse.json(
        { error: 'Aktuelles Passwort ist falsch.' },
        { status: 401 }
      )
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    setPasswordHash(email, newHash)

    console.log(`[change-password] ✓ Passwort geändert für "${email}"`)
    return NextResponse.json({ ok: true }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[change-password] Fehler:', msg)
    return NextResponse.json({ error: 'Datenbankfehler.' }, { status: 500 })
  }
}
