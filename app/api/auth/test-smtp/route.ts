/**
 * GET /api/auth/test-smtp?email=<optional>
 *
 * Diagnose-Endpunkt – nur im Entwicklungsmodus erreichbar.
 *
 * Testet:
 *   1. SMTP-Verbindung (verify)
 *   2. JTL-Lookup wenn ?email= angegeben
 *   3. Optional: Testmail an die angegebene Adresse senden (?send=1)
 *
 * Beispiel: http://localhost:3000/api/auth/test-smtp?email=max@firma.de&send=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { testSmtpConnection, sendMail } from '@/src/lib/mailer'
import { findKundeByEmail } from '@/src/lib/db-jtl'
import { buildTestEmail, getLogoAttachment } from '@/src/lib/email-templates'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Nur im Entwicklungsmodus verfügbar.' }, { status: 403 })
  }

  const email  = req.nextUrl.searchParams.get('email')?.trim() ?? null
  const doSend = req.nextUrl.searchParams.get('send') === '1'
  const result: Record<string, unknown> = {}

  // ── 1. SMTP-Verbindung ────────────────────────────────────────────────────
  try {
    const info = await testSmtpConnection()
    result.smtp = { ok: true, ...info }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[test-smtp] SMTP-Fehler:', msg)
    result.smtp = { ok: false, error: msg }
    // Weitere Tests überspringen wenn SMTP nicht erreichbar
    return NextResponse.json(result, { status: 200 })
  }

  // ── 2. JTL-Lookup (optional) ─────────────────────────────────────────────
  if (email) {
    try {
      const kunde = await findKundeByEmail(email)
      if (kunde) {
        result.jtl = {
          ok:        true,
          found:     true,
          kKunde:    kunde.kKunde,
          nr:        kunde.kundennummer,
          vorname:   kunde.rechnungsadresse?.vorname  ?? '',
          nachname:  kunde.rechnungsadresse?.nachname ?? '',
          email:     kunde.email,
        }
        console.log(`[test-smtp] JTL ✓ Kunde "${email}" gefunden: kKunde=${kunde.kKunde}, Nr.=${kunde.kundennummer}`)
      } else {
        result.jtl = { ok: true, found: false }
        console.log(`[test-smtp] JTL ✗ E-Mail "${email}" nicht in dbo.tAdresse gefunden`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.jtl = { ok: false, error: msg }
      console.error('[test-smtp] JTL-Fehler:', msg)
    }
  }

  // ── 3. Test-Mail senden (optional, ?send=1) ───────────────────────────────
  if (email && doSend) {
    const host   = process.env.EMAIL_SERVER_HOST  ?? '?'
    const port   = process.env.EMAIL_SERVER_PORT  ?? '?'
    const user   = process.env.EMAIL_SERVER_USER  ?? '?'
    const from   = process.env.EMAIL_FROM         ?? process.env.EMAIL_SERVER_USER ?? '?'
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    try {
      const { html, text } = buildTestEmail({ host, port, user, from, appUrl })
      const logoAttachment = getLogoAttachment()
      console.log(`[test-smtp] Logo CID konfiguriert: cid:${logoAttachment.cid} (${logoAttachment.content.length} Bytes)`)
      await sendMail({
        to:          email,
        subject:     '[TEST] SMTP-Verbindungstest – Edelzaun',
        html,
        text,
        attachments: [logoAttachment],
      })
      result.send = { ok: true, to: email, logoCid: logoAttachment.cid }
      console.log(`[test-smtp] ✓ Test-Mail gesendet an "${email}"`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.send = { ok: false, error: msg }
      console.error('[test-smtp] Sende-Fehler:', msg)
    }
  }

  result.config = {
    host:  process.env.EMAIL_SERVER_HOST  ?? '(nicht gesetzt)',
    port:  process.env.EMAIL_SERVER_PORT  ?? '(nicht gesetzt)',
    user:  process.env.EMAIL_SERVER_USER  ?? '(nicht gesetzt)',
    from:  process.env.EMAIL_FROM         ?? '(nicht gesetzt)',
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  }

  return NextResponse.json(result, { status: 200 })
}
