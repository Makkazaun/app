/**
 * GET /api/jtl/internal/diagnose-angebot?nr=A17807
 *
 * Diagnose-Route: liest alle verfügbaren Felder aus tAngebot + tAuftrag
 * für eine bestimmte Angebotsnummer und gibt sie in den pm2-Logs aus.
 *
 * Zusätzlich:
 *   – Schema-Übersicht: welche Spalten existieren in Verkauf.tAngebot?
 *   – Berechtigungsprüfung: hat der DB-User UPDATE auf tAngebot / tAuftrag?
 *   – Sucht in BEIDEN Tabellen, damit wir sehen, wo der Datensatz wirklich liegt.
 *
 * Geschützt via Bearer JTL_API_KEY (= ecosystem.config.js JTL_API_KEY).
 *
 * Verwendung auf dem Server:
 *   curl -H "Authorization: Bearer <KEY>" \
 *        "https://portal.edelzaun-tor.de/api/jtl/internal/diagnose-angebot?nr=A17807"
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/src/lib/db-jtl'
import sql from 'mssql'

// ── Auth ──────────────────────────────────────────────────────────────────────

function checkAuth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : ''
  return token === (process.env.JTL_API_KEY ?? '')
}

// ── Hilfsfunktion: sichere Abfrage (gibt null bei Fehler zurück) ──────────────

async function safeQuery<T>(
  pool: sql.ConnectionPool,
  queryFn: (req: sql.Request) => Promise<sql.IResult<T>>,
  label: string,
): Promise<{ rows: T[]; error?: string }> {
  try {
    const result = await queryFn(pool.request())
    return { rows: result.recordset }
  } catch (err) {
    const msg = (err as Error).message.split('\n')[0]
    console.warn(`[diagnose] ${label}: ${msg}`)
    return { rows: [], error: msg }
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const nr = req.nextUrl.searchParams.get('nr')?.trim() ?? ''
  if (!nr) {
    return NextResponse.json({ error: 'Query-Parameter ?nr= fehlt (z.B. ?nr=A17807)' }, { status: 400 })
  }

  let pool: sql.ConnectionPool
  try {
    pool = await getPool()
  } catch (err) {
    const msg = (err as Error).message.split('\n')[0]
    console.error('[diagnose] DB-Verbindung fehlgeschlagen:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const report: Record<string, unknown> = {
    nr,
    dbUser:   process.env.DB_USER ?? '(nicht gesetzt)',
    dbServer: process.env.DB_SERVER ?? '(nicht gesetzt)',
    dbName:   process.env.DB_NAME ?? '(nicht gesetzt)',
  }

  // ── 1. Welche Tabellen enthalten "Angebot" im Namen? ─────────────────────────
  const tableSearch = await safeQuery<{ schema: string; table: string }>(
    pool,
    (r) => r.query(`
      SELECT TABLE_SCHEMA AS [schema], TABLE_NAME AS [table]
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME LIKE '%ngebot%'
         OR TABLE_NAME LIKE '%uftrag%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `),
    'Tabellen-Suche',
  )
  report.relevanteTables = tableSearch.rows

  // ── 2. Schema von Verkauf.tAngebot (alle Spalten) ────────────────────────────
  const angebotSchema = await safeQuery<{ column: string; type: string; maxLen: number | null }>(
    pool,
    (r) => r.query(`
      SELECT COLUMN_NAME AS [column], DATA_TYPE AS [type], CHARACTER_MAXIMUM_LENGTH AS maxLen
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'Verkauf' AND TABLE_NAME = 'tAngebot'
      ORDER BY ORDINAL_POSITION
    `),
    'Schema tAngebot',
  )
  report.tAngebotSchema = angebotSchema.error
    ? { fehler: angebotSchema.error }
    : angebotSchema.rows

  // ── 3. Datensatz aus Verkauf.tAngebot für die gesuchte Nummer ────────────────
  const angebotRow = await safeQuery<Record<string, unknown>>(
    pool,
    (r) => r
      .input('nr', sql.NVarChar(100), nr)
      .query(`
        SELECT TOP 1 *
        FROM [Verkauf].[tAngebot]
        WHERE LTRIM(RTRIM(cAngebotNr)) = LTRIM(RTRIM(@nr))
      `),
    'tAngebot Datensatz',
  )
  report.tAngebotRow = angebotRow.error
    ? { fehler: angebotRow.error }
    : angebotRow.rows[0] ?? '(kein Treffer)'

  // ── 4. Datensatz aus Verkauf.tAuftrag (nType=0 = Angebot) ───────────────────
  const auftragRow = await safeQuery<Record<string, unknown>>(
    pool,
    (r) => r
      .input('nr', sql.NVarChar(100), nr)
      .query(`
        SELECT TOP 1 *
        FROM [Verkauf].[tAuftrag]
        WHERE LTRIM(RTRIM(cAuftragsNr)) = LTRIM(RTRIM(@nr))
          AND nType = 0
      `),
    'tAuftrag Datensatz',
  )
  report.tAuftragRow = auftragRow.error
    ? { fehler: auftragRow.error }
    : auftragRow.rows[0] ?? '(kein Treffer)'

  // ── 5. UPDATE-Berechtigungen prüfen ─────────────────────────────────────────
  const permCheck = await safeQuery<{ objekt: string; canUpdate: number }>(
    pool,
    (r) => r.query(`
      SELECT 'Verkauf.tAngebot' AS objekt,
             HAS_PERMS_BY_NAME('Verkauf.tAngebot', 'OBJECT', 'UPDATE') AS canUpdate
      UNION ALL
      SELECT 'Verkauf.tAuftrag',
             HAS_PERMS_BY_NAME('Verkauf.tAuftrag', 'OBJECT', 'UPDATE')
    `),
    'Berechtigungen',
  )
  report.updateBerechtigungen = permCheck.rows

  // ── 6. Alles in pm2-Logs ausgeben ────────────────────────────────────────────
  console.log('\n════════════════════════════════════════')
  console.log(`[diagnose] Analyse für Angebotsnummer: ${nr}`)
  console.log(`[diagnose] DB-User: ${report.dbUser}  Server: ${report.dbServer}`)
  console.log('────────────────────────────────────────')

  console.log('[diagnose] Relevante Tabellen:')
  for (const t of tableSearch.rows) {
    console.log(`  ${t.schema}.${t.table}`)
  }

  console.log('[diagnose] Spalten in Verkauf.tAngebot:')
  if (angebotSchema.error) {
    console.log(`  FEHLER: ${angebotSchema.error}`)
  } else {
    for (const col of angebotSchema.rows) {
      console.log(`  ${col.column.padEnd(35)} ${col.type}${col.maxLen ? `(${col.maxLen})` : ''}`)
    }
  }

  console.log(`[diagnose] Verkauf.tAngebot Zeile für "${nr}":`)
  if (angebotRow.error) {
    console.log(`  FEHLER: ${angebotRow.error}`)
  } else if (!angebotRow.rows[0]) {
    console.log('  → KEIN TREFFER (tAngebot enthält diese Nummer nicht)')
  } else {
    const row = angebotRow.rows[0]
    for (const [key, val] of Object.entries(row)) {
      if (val !== null && val !== undefined && val !== '') {
        console.log(`  ${key.padEnd(35)} = ${JSON.stringify(val)}`)
      }
    }
  }

  console.log(`[diagnose] Verkauf.tAuftrag Zeile für "${nr}" (nType=0):`)
  if (auftragRow.error) {
    console.log(`  FEHLER: ${auftragRow.error}`)
  } else if (!auftragRow.rows[0]) {
    console.log('  → KEIN TREFFER (tAuftrag enthält diese Nummer nicht als nType=0)')
  } else {
    const row = auftragRow.rows[0]
    for (const [key, val] of Object.entries(row)) {
      if (val !== null && val !== undefined && val !== '') {
        console.log(`  ${key.padEnd(35)} = ${JSON.stringify(val)}`)
      }
    }
  }

  console.log('[diagnose] UPDATE-Berechtigungen:')
  for (const p of permCheck.rows) {
    console.log(`  ${p.objekt.padEnd(30)} canUpdate=${p.canUpdate === 1 ? '✓ JA' : '✗ NEIN'}`)
  }

  console.log('════════════════════════════════════════\n')

  return NextResponse.json(report, { status: 200 })
}
