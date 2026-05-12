/**
 * POST /api/jtl/internal/upload-pdf
 *
 * Nimmt ein PDF als Base64-JSON entgegen und speichert es in private/documents/.
 * Sendet optional eine Benachrichtigungs-E-Mail an den Kunden.
 *
 * ── Authentifizierung ─────────────────────────────────────────────────────
 * Header: Authorization: Bearer <JTL_API_KEY>
 *
 * ── Request (application/json) ────────────────────────────────────────────
 * {
 *   "filename": "A11104",        // Belegnummer ohne .pdf (required)
 *   "fileData": "<base64-string>", // PDF-Inhalt als Base64 (required)
 *   "kKunde":  12345              // JTL-Kunden-ID für Benachrichtigung (optional)
 * }
 *
 * ── Antwort ───────────────────────────────────────────────────────────────
 * 200  { "ok": true, "filename": "A11104.pdf", "size": 48392 }
 * 400  { "error": "..." }   → Pflichtfeld fehlt / kein gültiges Base64
 * 401  { "error": "..." }   → ungültiger API-Key
 * 500  { "error": "..." }   → Schreibfehler
 */

import { NextRequest, NextResponse } from 'next/server'
import fs   from 'fs'
import path from 'path'
import { findUserByKKunde }              from '@/src/lib/portal-db'
import { getKundeVornameNachname }       from '@/src/lib/db-jtl'
import { buildDocumentNotificationEmail, getLogoAttachment } from '@/src/lib/email-templates'
import { sendMail }                      from '@/src/lib/mailer'

const DOCS_DIR = path.join(process.cwd(), 'private', 'documents')

async function dispatchNotification(kKunde: number, dokumentNummer: string): Promise<void> {
  const user = findUserByKKunde(kKunde)
  if (!user || user.notifications_enabled === 0) return

  const appUrl      = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const loginUrl    = `${appUrl}/login`
  const settingsUrl = `${appUrl}/dashboard`

  const { vorname, nachname } = await getKundeVornameNachname(kKunde)
  const { html, text }        = buildDocumentNotificationEmail({
    vorname, nachname, dokumentNummer, loginUrl, settingsUrl,
  })

  await sendMail({
    to:          user.email,
    subject:     `Neues Dokument verfügbar: ${dokumentNummer} – TR Edelzaun & Tor`,
    html,
    text,
    attachments: [getLogoAttachment()],
  })
  console.log(`[upload-pdf] Benachrichtigung gesendet an ${user.email} für Dokument ${dokumentNummer}`)
}

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/\.pdf$/i, '').replace(/[^A-Za-z0-9\-_.]/g, '_')
}

export async function POST(req: NextRequest) {
  // ── API-Key prüfen ────────────────────────────────────────────────────────
  const expectedKey = process.env.JTL_API_KEY
  if (!expectedKey) {
    return NextResponse.json({ error: 'JTL_API_KEY nicht konfiguriert.' }, { status: 500 })
  }
  // Kulant parsen: "Bearer <key>", "<key>" direkt, oder mit falschem Spacing
  const auth  = req.headers.get('authorization') ?? ''
  const token = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : auth.trim()
  if (!token || token !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // ── JSON-Body lesen ───────────────────────────────────────────────────────
  let body: { filename?: unknown; fileData?: unknown; kKunde?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body.' }, { status: 400 })
  }

  const rawName  = typeof body.filename === 'string' ? body.filename.trim() : ''
  const fileData = typeof body.fileData === 'string' ? body.fileData.trim()  : ''
  const kKunde   = typeof body.kKunde   === 'number' && Number.isInteger(body.kKunde)
    ? body.kKunde as number
    : null

  if (!rawName) {
    return NextResponse.json({ error: 'Pflichtfeld "filename" fehlt.' }, { status: 400 })
  }
  if (!fileData) {
    return NextResponse.json({ error: 'Pflichtfeld "fileData" fehlt.' }, { status: 400 })
  }

  // ── Base64 → Buffer ───────────────────────────────────────────────────────
  let pdfBuffer: Buffer
  try {
    // Optionalen Data-URL-Prefix entfernen: "data:application/pdf;base64,..."
    const base64 = fileData.includes(',') ? fileData.split(',')[1] : fileData
    pdfBuffer = Buffer.from(base64, 'base64')
    if (pdfBuffer.length === 0) throw new Error('Leerer Buffer nach Base64-Dekodierung')
  } catch (err) {
    return NextResponse.json(
      { error: `Ungültiger Base64-Inhalt: ${err instanceof Error ? err.message : err}` },
      { status: 400 },
    )
  }

  // ── Speichern ─────────────────────────────────────────────────────────────
  const safeName  = sanitizeFilename(rawName)
  if (!safeName) {
    return NextResponse.json({ error: 'Ungültiger Dateiname.' }, { status: 400 })
  }
  const filename   = `${safeName}.pdf`
  const targetPath = path.join(DOCS_DIR, filename)

  try {
    fs.mkdirSync(DOCS_DIR, { recursive: true })
    fs.writeFileSync(targetPath, pdfBuffer)
  } catch (err) {
    console.error('[upload-pdf] Schreibfehler:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'PDF konnte nicht gespeichert werden.' }, { status: 500 })
  }

  console.log(`[upload-pdf] Gespeichert: ${filename} (${pdfBuffer.length} Bytes)`)

  // ── E-Mail-Benachrichtigung (nicht fatal) ─────────────────────────────────
  if (kKunde !== null) {
    dispatchNotification(kKunde, safeName).catch((err: unknown) => {
      console.warn('[upload-pdf] Benachrichtigung fehlgeschlagen:',
        err instanceof Error ? err.message.split('\n')[0] : err)
    })
  }

  return NextResponse.json({ ok: true, filename, size: pdfBuffer.length })
}
