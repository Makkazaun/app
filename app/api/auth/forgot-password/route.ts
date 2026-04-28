/**
 * POST /api/auth/forgot-password
 *
 * Body: { email: string }
 *
 * 1. Prüft ob die E-Mail in dbo.tAdresse (JTL-Wawi) existiert.
 * 2. Generiert einen 32-Byte-Hex-Token (30 min TTL, In-Memory).
 * 3. Versendet eine Reset-Mail via SMTP (nodemailer).
 *
 * Antworten:
 *   200 { found: false }             → E-Mail nicht in JTL
 *   200 { found: true, sent: true }  → Mail erfolgreich versendet
 *   400 { error }                    → Ungültige Eingabe
 *   500 { error, detail? }           → SMTP-Fehler
 *   502 { error }                    → JTL-Datenbankfehler
 */

import { NextRequest, NextResponse } from 'next/server'
import { findKundeByEmail } from '@/src/lib/db-jtl'
import { upsertUserJtl, storeResetToken } from '@/src/lib/portal-db'
import { sendMail } from '@/src/lib/mailer'
import { buildPasswordResetEmail, getLogoAttachment } from '@/src/lib/email-templates'
import crypto from 'crypto'

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Parse Body ─────────────────────────────────────────────────────────────
  let email: string
  try {
    const body = await req.json()
    email = (body.email ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 })
  }

  console.log(`[forgot-password] Anfrage für: "${email}"`)

  // ── 1. JTL-Lookup gegen dbo.tAdresse ─────────────────────────────────────
  let kunde: Awaited<ReturnType<typeof findKundeByEmail>>
  try {
    kunde = await findKundeByEmail(email)

    if (kunde) {
      console.log(
        `[forgot-password] ✓ Kunde gefunden | kKunde: ${kunde.kKunde} | Nr.: ${kunde.kundennummer} | Name: ${kunde.rechnungsadresse?.vorname ?? ''} ${kunde.rechnungsadresse?.nachname ?? ''}`
      )
    } else {
      console.log(`[forgot-password] ✗ E-Mail "${email}" nicht in dbo.tAdresse gefunden`)
      return NextResponse.json({ found: false }, { status: 200 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[forgot-password] JTL-Fehler:', msg)
    return NextResponse.json(
      { error: 'Datenbankfehler. Bitte versuchen Sie es später erneut.' },
      { status: 502 }
    )
  }

  // ── 2. Nutzer in Portal-DB anlegen / aktualisieren ────────────────────────
  upsertUserJtl(email, kunde.kKunde, kunde.kundennummer)

  // ── 3. Reset-Token in Portal-DB speichern (30 min TTL) ────────────────────
  const token = crypto.randomBytes(32).toString('hex')
  storeResetToken(token, email)

  const appUrl    = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`
  console.log(`[forgot-password] Reset-Link generiert: ${resetLink}`)

  const vorname  = kunde.rechnungsadresse?.vorname  ?? ''
  const nachname = kunde.rechnungsadresse?.nachname ?? ''

  // ── 3. Mail versenden ─────────────────────────────────────────────────────
  try {
    const { html, text } = buildPasswordResetEmail({ vorname, nachname, resetLink })
    await sendMail({
      to:          email,
      subject:     'Passwort zurücksetzen – TR Edelzaun & Tor',
      html,
      text,
      attachments: [getLogoAttachment()],
    })

    console.log(`[forgot-password] ✓ Abgeschlossen für "${email}"`)
    return NextResponse.json({ found: true, sent: true }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[forgot-password] SMTP-Fehler:', msg)
    return NextResponse.json(
      { error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.', detail: msg },
      { status: 500 }
    )
  }
}

