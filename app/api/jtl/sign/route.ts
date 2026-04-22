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
import { PDFDocument } from 'pdf-lib'
import { markAngebotAngenommen, getKundeNameByAuftrag } from '@/src/lib/db-jtl'
import { sendMail } from '@/src/lib/mailer'

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

async function embedSignature(pdfPath: string, signaturePng: Buffer): Promise<Buffer> {
  const pdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc   = await PDFDocument.load(pdfBytes)

  const pages = pdfDoc.getPages()
  const last  = pages[pages.length - 1]
  const { width } = last.getSize()

  const sigImg = await pdfDoc.embedPng(signaturePng)
  const sigW   = Math.min(180, width * 0.35)
  const sigH   = sigW * (sigImg.height / sigImg.width)

  last.drawImage(sigImg, {
    x:      width / 2 - sigW / 2,
    y:      40,
    width:  sigW,
    height: sigH,
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

    // 3. PDF suchen, Unterschrift einbetten, speichern
    let attachmentBuffer: Buffer | null = null
    let savedFilename: string | null = null

    const pdfPath = findPdf(belegnummer)
    if (pdfPath) {
      try {
        attachmentBuffer = await embedSignature(pdfPath, sigBuffer)
        savedFilename    = `${belegnummer}_unterschrieben.pdf`
        fs.mkdirSync(DOCS_DIR, { recursive: true })
        fs.writeFileSync(path.join(DOCS_DIR, savedFilename), attachmentBuffer)
      } catch (pdfErr) {
        console.error('[sign] PDF-Verarbeitung fehlgeschlagen:', pdfErr instanceof Error ? pdfErr.message : pdfErr)
      }
    } else {
      console.warn(`[sign] Kein PDF für "${belegnummer}" in ${DOCS_DIR}`)
    }

    // 4. E-Mail senden
    const subject = `Angebot angenommen: ${belegnummer} - ${kundenName}`
    const when    = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })

    await sendMail({
      to:      'info@edelzaun-tor.de',
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;color:#333">
          <h2 style="color:#8a6914;margin-bottom:16px">Angebot digital angenommen</h2>
          <p>Ein Kunde hat das folgende Angebot digital unterschrieben und angenommen.</p>
          <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px">
            <tr>
              <td style="padding:8px 14px;background:#f8f4e8;font-weight:bold;width:160px;border:1px solid #e8ddb4">Angebotsnummer</td>
              <td style="padding:8px 14px;border:1px solid #e8ddb4">${belegnummer}</td>
            </tr>
            <tr>
              <td style="padding:8px 14px;background:#f8f4e8;font-weight:bold;border:1px solid #e8ddb4">Kundenname</td>
              <td style="padding:8px 14px;border:1px solid #e8ddb4">${kundenName}</td>
            </tr>
            <tr>
              <td style="padding:8px 14px;background:#f8f4e8;font-weight:bold;border:1px solid #e8ddb4">Zeitpunkt</td>
              <td style="padding:8px 14px;border:1px solid #e8ddb4">${when}</td>
            </tr>
          </table>
          ${attachmentBuffer
            ? '<p>Das unterschriebene Angebot ist als PDF-Anhang beigefügt.</p>'
            : '<p style="color:#c04040"><strong>Hinweis:</strong> Kein Original-PDF im System vorhanden. Unterschrift wurde ohne Anhang übermittelt.</p>'
          }
          <p style="color:#999;font-size:11px;margin-top:28px;border-top:1px solid #eee;padding-top:12px">
            Automatisch gesendet von der Edelzaun App
          </p>
        </div>
      `,
      text: `Angebot digital angenommen\n\nAngebotsnummer: ${belegnummer}\nKundenname: ${kundenName}\nZeitpunkt: ${when}\n${attachmentBuffer ? 'Unterschriebenes PDF im Anhang.' : 'Kein Original-PDF vorhanden.'}`,
      ...(attachmentBuffer && {
        attachments: [{
          filename:    savedFilename ?? `${belegnummer}_unterschrieben.pdf`,
          content:     attachmentBuffer,
          contentType: 'application/pdf',
        }],
      }),
    })

    // 5. In JTL markieren
    await markAngebotAngenommen(kAngebot)

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
