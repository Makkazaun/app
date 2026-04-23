/**
 * POST /api/jtl/sign
 *
 * Body: {
 *   kAngebot:         number   – kAuftrag in Verkauf.tAuftrag
 *   belegnummer:      string   – z.B. "AN20021" (für PDF-Suche + E-Mail-Betreff)
 *   signatureDataUrl: string   – data:image/png;base64,... (vom Signature-Canvas)
 * }
 *
 * Ablauf:
 *   1. Kundennamen aus DB ermitteln
 *   2. Original-PDF aus private/documents/ laden
 *   3. Unterschrift via pdf-lib auf letzte Seite einbetten
 *   4. Signiertes PDF als <belegnummer>_unterschrieben.pdf speichern
 *   5. E-Mail mit PDF-Anhang an info@edelzaun-tor.de
 *   6. Angebot in JTL-Wawi als "angenommen" markieren
 */

import { NextRequest, NextResponse } from 'next/server'
import fs   from 'fs'
import path from 'path'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { markAngebotAngenommen, getKundeNameByAuftrag } from '@/src/lib/db-jtl'
import { sendMail } from '@/src/lib/mailer'
import { generateEmailHtml, getLogoAttachment } from '@/src/lib/email-templates'

const DOCS_DIR = path.join(process.cwd(), 'private', 'documents')

// ── PDF-Suche (case-insensitive, partial match) ───────────────────────────────

function findPdf(id: string): string | null {
  if (!fs.existsSync(DOCS_DIR)) return null

  const exact = path.join(DOCS_DIR, `${id}.pdf`)
  if (fs.existsSync(exact)) return exact

  let entries: fs.Dirent[]
  try { entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true }) } catch { return null }

  const norm = id.toLowerCase()
  for (const e of entries) {
    if (!e.isFile()) continue
    const lower = e.name.toLowerCase()
    if (lower.endsWith('.pdf') && lower.includes(norm)) return path.join(DOCS_DIR, e.name)
  }
  return null
}

// ── Unterschrift in PDF einbetten ─────────────────────────────────────────────

async function embedSignature(pdfPath: string, signaturePng: Buffer, dateStr: string): Promise<Buffer> {
  const pdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc   = await PDFDocument.load(pdfBytes)

  const pages = pdfDoc.getPages()
  const last  = pages[pages.length - 1]
  const { width } = last.getSize()

  // Signature image – centered over the signature line area near the bottom
  const sigImg = await pdfDoc.embedPng(signaturePng)
  const sigW   = Math.min(180, width * 0.35)
  const sigH   = sigW * (sigImg.height / sigImg.width)
  const sigY   = 95  // bottom of image from page bottom (sits just above the "Unterschrift" line)

  const sigX = width / 2 - sigW / 2 - 75

  last.drawImage(sigImg, {
    x:      sigX,
    y:      sigY,
    width:  sigW,
    height: sigH,
  })

  // Date text aligned with signature image
  const font      = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize  = 9
  const textWidth = font.widthOfTextAtSize(dateStr, fontSize)

  last.drawText(dateStr, {
    x:    sigX + sigW / 2 - textWidth / 2,
    y:    sigY - 14,
    size: fontSize,
    font,
    color: rgb(0.35, 0.35, 0.35),
  })

  return Buffer.from(await pdfDoc.save())
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { kAngebot?: unknown; belegnummer?: unknown; signatureDataUrl?: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 }) }

  const kAngebot = typeof body.kAngebot === 'number' ? body.kAngebot : NaN
  if (!kAngebot || isNaN(kAngebot) || kAngebot <= 0)
    return NextResponse.json({ error: 'kAngebot fehlt oder ungültig.' }, { status: 400 })

  const belegnummer = typeof body.belegnummer === 'string' ? body.belegnummer.trim() : ''
  if (!belegnummer)
    return NextResponse.json({ error: 'belegnummer fehlt.' }, { status: 400 })

  const sigDataUrl = typeof body.signatureDataUrl === 'string' ? body.signatureDataUrl.trim() : ''
  if (!sigDataUrl)
    return NextResponse.json({ error: 'signatureDataUrl fehlt.' }, { status: 400 })

  try {
    // 1. Kundennamen aus DB
    const kundenName = await getKundeNameByAuftrag(kAngebot)

    // 2. Signature-PNG dekodieren
    const base64    = sigDataUrl.includes(',') ? sigDataUrl.split(',')[1] : sigDataUrl
    const sigBuffer = Buffer.from(base64, 'base64')

    const when    = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
    const dateStr = `Unterschrieben am ${when} Uhr`

    // 3. PDF suchen, Unterschrift + Datum einbetten, speichern
    let attachmentBuffer: Buffer | null = null
    let savedFilename: string | null = null

    const pdfPath = findPdf(belegnummer)
    if (pdfPath) {
      try {
        attachmentBuffer = await embedSignature(pdfPath, sigBuffer, dateStr)
        savedFilename    = `${belegnummer}_unterschrieben.pdf`
        fs.mkdirSync(DOCS_DIR, { recursive: true })
        fs.writeFileSync(path.join(DOCS_DIR, savedFilename), attachmentBuffer)
      } catch (pdfErr) {
        console.error('[sign] PDF-Verarbeitung fehlgeschlagen:', pdfErr instanceof Error ? pdfErr.message : pdfErr)
      }
    } else {
      console.warn(`[sign] Kein PDF für "${belegnummer}" in ${DOCS_DIR}`)
    }

    // 4. E-Mail mit Branded Template senden
    const subject    = `Angebot angenommen: ${belegnummer} – ${kundenName}`
    const logoAttach = getLogoAttachment()

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const emailContent = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:32px 36px 28px;">
            <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1F2937;letter-spacing:-0.01em;">
              Angebot digital angenommen
            </h1>
            <p style="margin:0 0 24px;font-size:13px;color:#8a7a4a;">${esc(kundenName)}</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#F9FAFB;border:1px solid #440011;border-radius:10px;padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:13px;line-height:1.5;">
                    <span style="color:#9CA3AF;display:inline-block;width:150px;">Angebotsnummer</span>
                    <strong style="color:#800020;font-family:monospace;">${esc(belegnummer)}</strong>
                  </p>
                  <p style="margin:0 0 8px;font-size:13px;line-height:1.5;">
                    <span style="color:#9CA3AF;display:inline-block;width:150px;">Kundenname</span>
                    <strong style="color:#1F2937;">${esc(kundenName)}</strong>
                  </p>
                  <p style="margin:0;font-size:13px;line-height:1.5;">
                    <span style="color:#9CA3AF;display:inline-block;width:150px;">Zeitpunkt</span>
                    <span style="color:#4B5563;">${esc(when)}</span>
                  </p>
                </td>
              </tr>
            </table>

            ${attachmentBuffer
              ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="background:#111c10;border:1px solid #2a3d20;border-radius:10px;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#5bc97a;line-height:1.5;">
                      ✓&nbsp; Das unterschriebene Angebot ist als PDF-Anhang beigefügt.
                    </p>
                  </td>
                </tr></table>`
              : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="background:#1c1010;border:1px solid #3d2020;border-radius:10px;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#e08080;line-height:1.5;">
                      ⚠&nbsp; Kein Original-PDF vorhanden – Unterschrift ohne Anhang übermittelt.
                    </p>
                  </td>
                </tr></table>`
            }
          </td>
        </tr>
      </table>`

    const html = generateEmailHtml({
      title:     `Angebot angenommen: ${belegnummer}`,
      preheader: `${kundenName} hat Angebot ${belegnummer} digital unterschrieben.`,
      content:   emailContent,
    })

    const text = [
      'ANGEBOT DIGITAL ANGENOMMEN',
      '═'.repeat(40),
      '',
      `Angebotsnummer: ${belegnummer}`,
      `Kundenname:     ${kundenName}`,
      `Zeitpunkt:      ${when}`,
      '',
      attachmentBuffer
        ? 'Das unterschriebene Angebot ist als PDF-Anhang beigefügt.'
        : 'Hinweis: Kein Original-PDF vorhanden – Unterschrift ohne Anhang übermittelt.',
      '',
      '─'.repeat(40),
      'TR Edelzaun & Tor GmbH · Kastanienplatz 2 · 06369 Großwülknitz',
    ].join('\n')

    await sendMail({
      to:      'info@edelzaun-tor.de',
      subject,
      html,
      text,
      attachments: [
        logoAttach,
        ...(attachmentBuffer ? [{
          filename:    savedFilename ?? `${belegnummer}_unterschrieben.pdf`,
          content:     attachmentBuffer,
          contentType: 'application/pdf',
        }] : []),
      ],
    })

    // 5. In JTL markieren (non-fatal – Email + PDF wurden bereits gespeichert)
    await markAngebotAngenommen(belegnummer)

    return NextResponse.json({
      success:  true,
      hasPdf:   !!attachmentBuffer,
      savedAs:  savedFilename,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[jtl/sign]', msg)
    return NextResponse.json({ error: 'Unterschrift konnte nicht verarbeitet werden.', detail: msg }, { status: 502 })
  }
}
