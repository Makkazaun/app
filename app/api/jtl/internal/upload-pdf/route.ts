/**
 * POST /api/jtl/internal/upload-pdf
 *
 * Nimmt ein PDF als Base64-JSON entgegen und speichert es in private/documents/.
 *
 * ── Authentifizierung ─────────────────────────────────────────────────────
 * Header: Authorization: Bearer <JTL_API_KEY>
 *
 * ── Request (application/json) ────────────────────────────────────────────
 * {
 *   "filename": "A11104",        // Belegnummer ohne .pdf (required)
 *   "fileData": "<base64-string>" // PDF-Inhalt als Base64 (required)
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

const DOCS_DIR = path.join(process.cwd(), 'private', 'documents')

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
  let body: { filename?: unknown; fileData?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body.' }, { status: 400 })
  }

  const rawName  = typeof body.filename === 'string' ? body.filename.trim() : ''
  const fileData = typeof body.fileData === 'string' ? body.fileData.trim()  : ''

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

  return NextResponse.json({ ok: true, filename, size: pdfBuffer.length })
}
