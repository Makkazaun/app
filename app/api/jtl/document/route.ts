/**
 * GET /api/jtl/document?type=<rechnung|angebot|auftrag>&id=<Belegnummer>
 *
 * Liefert ein Dokument als PDF-Stream zurück.
 *
 * ── Suchreihenfolge ────────────────────────────────────────────────────────
 * 1. private/documents/<id>.pdf  (via POST /api/jtl/internal/upload-pdf hochgeladen)
 * 2. dbo.tDokument (DB-Fallback – existiert nicht in dieser JTL-Version, silent fail)
 *
 * ── Spaltenname (verifiziert) ──────────────────────────────────────────────
 * Verkauf.tAuftrag.cAuftragsNr  → Belegnummer für Angebote (nType=0) UND Aufträge (nType=1)
 * Verkauf.tRechnung.cRechnungsnummer → für Rechnungen
 *
 * ── Antwort-Codes ─────────────────────────────────────────────────────────
 * 200  Content-Type: application/pdf      → PDF-Bytes
 * 404  JSON { error, belegGefunden }      → nicht gefunden
 * 400  JSON { error }                     → ungültige Parameter
 * 500  JSON { error }                     → Lesefehler
 */

import { NextRequest, NextResponse } from 'next/server'
import fs   from 'fs'
import path from 'path'
import sql  from 'mssql'
import { getPool } from '@/src/lib/db-jtl'

const DOCS_DIR = path.join(process.cwd(), 'private', 'documents')

const VALID_TYPES = new Set(['rechnung', 'angebot', 'auftrag'])

// ── Dateisystem-Suche in private/documents/ ───────────────────────────────────

function findLocalPdf(id: string, type?: string): string | null {
  if (!fs.existsSync(DOCS_DIR)) return null

  const norm = id.replace(/\//g, '-').toLowerCase()

  // For angebote: always prefer the signed version if it exists
  if (type === 'angebot') {
    const signed = path.join(DOCS_DIR, `${id}_unterschrieben.pdf`)
    if (fs.existsSync(signed)) return signed
  }

  // 1. Exakter Treffer: <id>.pdf
  const exact = path.join(DOCS_DIR, `${id}.pdf`)
  if (fs.existsSync(exact)) return exact

  // 2. Scan des Verzeichnisses (case-insensitive, enthält id)
  let entries: fs.Dirent[]
  try { entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true }) } catch { return null }

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const lower = entry.name.toLowerCase()
    if (lower.endsWith('.pdf') && (lower.includes(norm) || lower.includes(id.toLowerCase()))) {
      return path.join(DOCS_DIR, entry.name)
    }
  }
  return null
}

// ── Datenbankfunktionen ───────────────────────────────────────────────────────

/**
 * Prüft ob der Beleg in der Datenbank existiert und ob je eine Ausgabe erfolgte.
 */
async function checkBelegStatus(
  id: string,
  type: string,
): Promise<{ exists: boolean; jemalsPdf: boolean }> {
  try {
    const pool = await getPool()

    if (type === 'rechnung') {
      const r = await pool.request()
        .input('nr', sql.NVarChar(100), id)
        .query<{ n: number }>(`SELECT COUNT(*) AS n FROM Verkauf.tRechnung WHERE cRechnungsnummer = @nr`)
      const exists = (r.recordset[0]?.n ?? 0) > 0
      return { exists, jemalsPdf: exists ? await checkAusgabe(pool, id) : false }
    } else {
      const r = await pool.request()
        .input('nr', sql.NVarChar(100), id)
        .query<{ n: number }>(`SELECT COUNT(*) AS n FROM Verkauf.tAuftrag WHERE cAuftragsNr = @nr`)
      const exists = (r.recordset[0]?.n ?? 0) > 0
      return { exists, jemalsPdf: exists ? await checkAusgabe(pool, id) : false }
    }
  } catch {
    return { exists: false, jemalsPdf: false }
  }
}

/** Prüft tAuftragAusgabeDateien und dbo.tAusgabe auf Ausgabehistorie. */
async function checkAusgabe(
  pool: Awaited<ReturnType<typeof getPool>>,
  id: string,
): Promise<boolean> {
  try {
    const r = await pool.request()
      .input('nr', sql.NVarChar(100), id)
      .query<{ n: number }>(`
        SELECT COUNT(*) AS n
        FROM Verkauf.tAuftragAusgabeDateien af
        JOIN Verkauf.tAuftrag a ON a.kAuftrag = af.kAuftrag
        WHERE a.cAuftragsNr = @nr
      `)
    if ((r.recordset[0]?.n ?? 0) > 0) return true
  } catch { /* Tabelle fehlt */ }

  try {
    const r = await pool.request()
      .input('nr', sql.NVarChar(100), id)
      .query<{ n: number }>(`
        SELECT COUNT(*) AS n FROM dbo.tAusgabe au
        JOIN Verkauf.tAuftrag a ON a.kAuftrag = au.kBeleg
        WHERE a.cAuftragsNr = @nr
      `)
    if ((r.recordset[0]?.n ?? 0) > 0) return true
  } catch { /* tAusgabe fehlt */ }

  return false
}

/** Sucht PDF-Bytes in dbo.tDokument (existiert nicht in dieser JTL-Version → immer null). */
async function findPdfInDatabase(
  id: string,
  type: string,
): Promise<{ data: Buffer; name: string } | null> {
  try {
    const pool = await getPool()
    const res  = await pool.request()
      .input('belegnummer', sql.NVarChar(100), id)
      .query<{ cData: Buffer | null; cName: string | null }>(`
        SELECT TOP 1 cData, cName
        FROM dbo.tDokument
        WHERE (cBelegnummer = @belegnummer OR cName LIKE '%' + @belegnummer + '%')
        ORDER BY kDokument DESC
      `)
    const row = res.recordset[0]
    if (row?.cData && row.cData.length > 0) {
      return { data: row.cData, name: row.cName ?? `${type}_${id}.pdf` }
    }
  } catch { /* tDokument fehlt */ }

  try {
    const pool = await getPool()
    const joinClause = type === 'rechnung'
      ? `Verkauf.tRechnung r ON r.kRechnung = d.kRechnung AND r.cRechnungsnummer = @belegnummer`
      : `Verkauf.tAuftrag a ON a.kAuftrag = d.kAuftrag AND a.cAuftragsNr = @belegnummer`

    const res2 = await pool.request()
      .input('belegnummer', sql.NVarChar(100), id)
      .query<{ cData: Buffer | null; cName: string | null }>(`
        SELECT TOP 1 d.cData, d.cName
        FROM dbo.tDokument d
        JOIN ${joinClause}
        WHERE d.cData IS NOT NULL AND LEN(d.cData) > 0
        ORDER BY d.kDokument DESC
      `)
    const row2 = res2.recordset[0]
    if (row2?.cData && row2.cData.length > 0) {
      return { data: row2.cData, name: row2.cName ?? `${type}_${id}.pdf` }
    }
  } catch { /* Join-Variante fehlgeschlagen */ }

  return null
}

// ── Request-Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const type          = req.nextUrl.searchParams.get('type')?.toLowerCase() ?? ''
  const id            = req.nextUrl.searchParams.get('id') ?? ''
  const forceDownload = req.nextUrl.searchParams.get('download') === '1'

  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: 'Ungültiger Dokumenttyp. Erlaubt: rechnung, angebot, auftrag.' },
      { status: 400 },
    )
  }
  if (!id || !/^[A-Za-z0-9\-_.]+$/.test(id)) {
    return NextResponse.json({ error: 'Ungültige Dokumentnummer.' }, { status: 400 })
  }

  // ── 1. Lokales Verzeichnis private/documents/ ─────────────────────────────
  const localPath = findLocalPdf(id, type)
  if (localPath) {
    try {
      const buf      = fs.readFileSync(localPath)
      const filename = path.basename(localPath)
      return pdfResponse(buf, filename, forceDownload)
    } catch (err) {
      console.error('[document] Lesefehler (lokal):', err instanceof Error ? err.message : err)
    }
  }

  // ── 2. Datenbankfallback: dbo.tDokument ──────────────────────────────────
  const dbDoc = await findPdfInDatabase(id, type)
  if (dbDoc) {
    const filename = dbDoc.name.toLowerCase().endsWith('.pdf')
      ? dbDoc.name
      : `${dbDoc.name}.pdf`
    return pdfResponse(dbDoc.data, filename, forceDownload)
  }

  // ── 3. Kontextbezogene 404-Antwort ───────────────────────────────────────
  const status = await checkBelegStatus(id, type)

  if (!status.exists) {
    return NextResponse.json(
      { error: `Beleg „${id}" nicht gefunden.`, belegGefunden: false },
      { status: 404 },
    )
  }

  const reason = status.jemalsPdf
    ? `PDF für Beleg „${id}" wurde noch nicht archiviert. Bitte kurz warten oder Support kontaktieren.`
    : `Beleg wurde noch nicht als PDF erzeugt. Bitte in der Wawi einmal die Druck-Vorschau öffnen oder das Dokument versenden.`

  return NextResponse.json(
    { error: reason, belegGefunden: true },
    { status: 404 },
  )
}

// ── Hilfsfunktion ─────────────────────────────────────────────────────────────

function pdfResponse(buf: Buffer, filename: string, forceDownload: boolean): NextResponse {
  const safe = filename.replace(/[^\w\-_.]/g, '_')
  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type':           'application/pdf',
      'Content-Disposition':    forceDownload
        ? `attachment; filename="${safe}"`
        : `inline; filename="${safe}"`,
      'Content-Length':         String(buf.length),
      'Cache-Control':          'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
