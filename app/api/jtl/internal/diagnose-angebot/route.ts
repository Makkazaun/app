/**
 * GET /api/jtl/internal/diagnose-angebot?nr=A17807
 *
 * Liest alle Felder aus tAngebot / tAuftrag für eine Angebotsnummer und
 * schreibt sie vollständig in die pm2-Logs.
 *
 * Schritte:
 *   1. Tabellen-Übersicht (alle mit "ngebot"/"uftrag" im Namen)
 *   2. Schema tAngebot via INFORMATION_SCHEMA
 *   3. SELECT TOP 1 * (kein WHERE) → Spaltenstruktur immer sichtbar
 *   4. Datensatz via TRIM-Exact: LTRIM(RTRIM(cAngebotNr)) = @nr
 *   5. Datensatz via LIKE '%nr%' (Fallback)
 *   6. tAuftrag-Zeile (nType=0) via LIKE
 *   7. STATUS-SPALTEN-SCAN: Welche Spalte enthält 'abgelehnt'?
 *   8. UPDATE-Berechtigungen
 *
 * Geschützt via Bearer JTL_API_KEY.
 *
 * Auf dem Server aufrufen:
 *   curl -H "Authorization: Bearer 234652158934783A5" \
 *        "https://www.edelzaun-tor.de/api/jtl/internal/diagnose-angebot?nr=A17807"
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/src/lib/db-jtl'
import sql from 'mssql'

function checkAuth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : ''
  return !!token && token === (process.env.JTL_API_KEY ?? '')
}

async function safeQuery<T>(
  pool:    sql.ConnectionPool,
  exec:    (r: sql.Request) => Promise<sql.IResult<T>>,
  label:   string,
): Promise<{ rows: T[]; error?: string }> {
  try {
    const res = await exec(pool.request())
    return { rows: res.recordset }
  } catch (err) {
    const msg = (err as Error).message.split('\n')[0]
    console.warn(`[diagnose] ${label}: ${msg}`)
    return { rows: [], error: msg }
  }
}

/** Scannt alle Spaltenwerte einer Zeile nach bekannten Status-Schlüsselwörtern. */
function scanStatusSpalten(
  row: Record<string, unknown>,
  quelle: string,
): { col: string; val: string }[] {
  const keywords = ['abgelehnt', 'angenommen', 'offen', 'rejected', 'accepted', 'ablehnen', 'annehmen']
  const hits: { col: string; val: string }[] = []
  for (const [col, val] of Object.entries(row)) {
    if (typeof val !== 'string') continue
    const lower = val.toLowerCase()
    if (keywords.some((kw) => lower.includes(kw))) {
      hits.push({ col, val })
      console.log(`►► STATUS-SPALTE in ${quelle}: ${col} = "${val}"`)
    }
  }
  return hits
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const nr = req.nextUrl.searchParams.get('nr')?.trim() ?? ''
  if (!nr) {
    return NextResponse.json(
      { error: 'Query-Parameter ?nr= fehlt (z.B. ?nr=A17807)' },
      { status: 400 },
    )
  }

  let pool: sql.ConnectionPool
  try { pool = await getPool() }
  catch (err) {
    const msg = (err as Error).message.split('\n')[0]
    console.error('[diagnose] DB-Verbindung:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const like   = `%${nr}%`
  const trimNr = nr.trim()

  const report: Record<string, unknown> = {
    nr,
    like,
    dbUser:   process.env.DB_USER   ?? '(nicht gesetzt)',
    dbServer: process.env.DB_SERVER ?? '(nicht gesetzt)',
  }

  // ── 1. Tabellen-Übersicht ─────────────────────────────────────────────────────
  const tables = await safeQuery<{ schema: string; table: string }>(
    pool,
    (r) => r.query(`
      SELECT TABLE_SCHEMA AS [schema], TABLE_NAME AS [table]
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME LIKE '%ngebot%' OR TABLE_NAME LIKE '%uftrag%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `),
    'Tabellen-Übersicht',
  )
  report.tabellen = tables.rows

  // ── 2. Schema tAngebot (INFORMATION_SCHEMA) ───────────────────────────────────
  const schema = await safeQuery<{ col: string; type: string; len: number | null }>(
    pool,
    (r) => r.query(`
      SELECT COLUMN_NAME AS col, DATA_TYPE AS type, CHARACTER_MAXIMUM_LENGTH AS len
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'Verkauf' AND TABLE_NAME = 'tAngebot'
      ORDER BY ORDINAL_POSITION
    `),
    'Schema tAngebot',
  )
  report.tAngebotSpalten = schema.error
    ? { fehler: schema.error }
    : schema.rows.map((c) => `${c.col} (${c.type})`)

  // ── 3. Beliebige Zeile (kein WHERE) → Spalten immer sichtbar ─────────────────
  const sampleRow = await safeQuery<Record<string, unknown>>(
    pool,
    (r) => r.query(`SELECT TOP 1 * FROM [Verkauf].[tAngebot]`),
    'tAngebot Stichprobe',
  )
  report.tAngebotStichprobeKolumnen = sampleRow.error
    ? { fehler: sampleRow.error }
    : sampleRow.rows[0] ? Object.keys(sampleRow.rows[0]) : '(keine Zeilen in tAngebot)'

  // ── 4. Datensatz via TRIM-Exact ───────────────────────────────────────────────
  const angebotTrim = await safeQuery<Record<string, unknown>>(
    pool,
    (r) => r.input('nr', sql.NVarChar(50), trimNr)
      .query(`SELECT TOP 1 * FROM [Verkauf].[tAngebot] WHERE LTRIM(RTRIM(cAngebotNr)) = @nr`),
    `tAngebot TRIM='${trimNr}'`,
  )
  report.tAngebotRowTrim = angebotTrim.error
    ? { fehler: angebotTrim.error }
    : angebotTrim.rows[0] ?? '(kein Treffer)'

  // ── 5. Datensatz via LIKE ─────────────────────────────────────────────────────
  const angebotLike = await safeQuery<Record<string, unknown>>(
    pool,
    (r) => r.input('like', sql.NVarChar(102), like)
      .query(`SELECT TOP 1 * FROM [Verkauf].[tAngebot] WHERE cAngebotNr LIKE @like`),
    `tAngebot LIKE '${like}'`,
  )
  report.tAngebotRowLike = angebotLike.error
    ? { fehler: angebotLike.error }
    : angebotLike.rows[0] ?? '(kein Treffer)'

  // ── 6. tAuftrag via LIKE (nType=0) ───────────────────────────────────────────
  const auftragLike = await safeQuery<Record<string, unknown>>(
    pool,
    (r) => r.input('like', sql.NVarChar(102), like)
      .query(`SELECT TOP 1 * FROM [Verkauf].[tAuftrag] WHERE cAuftragsNr LIKE @like AND nType = 0`),
    `tAuftrag LIKE '${like}' (nType=0)`,
  )
  report.tAuftragRowLike = auftragLike.error
    ? { fehler: auftragLike.error }
    : auftragLike.rows[0] ?? '(kein Treffer)'

  // ── 7. STATUS-SPALTEN-SCAN ────────────────────────────────────────────────────
  // Welche Spalte enthält 'abgelehnt' oder andere Statuswerte?
  const statusHits: { tabelle: string; col: string; val: string }[] = []

  const trimRow  = angebotTrim.rows[0]  as Record<string, unknown> | undefined
  const likeRow  = angebotLike.rows[0]  as Record<string, unknown> | undefined
  const aufRow   = auftragLike.rows[0]  as Record<string, unknown> | undefined

  const rowToScan = trimRow ?? likeRow
  if (rowToScan) {
    for (const hit of scanStatusSpalten(rowToScan, 'tAngebot'))
      statusHits.push({ tabelle: 'Verkauf.tAngebot', ...hit })
  }
  if (aufRow) {
    for (const hit of scanStatusSpalten(aufRow, 'tAuftrag'))
      statusHits.push({ tabelle: 'Verkauf.tAuftrag', ...hit })
  }

  if (statusHits.length === 0) {
    console.log('[diagnose] STATUS-SPALTEN-SCAN: kein bekannter Statuswert gefunden')
    console.log('  → Manuell gesetzten Wert in der JTL-Wawi erneut prüfen oder Diagnose wiederholen')
  }
  report.statusSpaltenScan = statusHits.length ? statusHits : '(kein Treffer – kein Statuswert erkannt)'

  // ── 8. UPDATE-Berechtigungen ──────────────────────────────────────────────────
  const perms = await safeQuery<{ obj: string; canUpdate: number }>(
    pool,
    (r) => r.query(`
      SELECT 'Verkauf.tAngebot' AS obj, HAS_PERMS_BY_NAME('Verkauf.tAngebot','OBJECT','UPDATE') AS canUpdate
      UNION ALL
      SELECT 'Verkauf.tAuftrag',        HAS_PERMS_BY_NAME('Verkauf.tAuftrag','OBJECT','UPDATE')
    `),
    'Berechtigungen',
  )
  report.updateBerechtigungen = perms.rows

  // ── pm2-Log-Block ─────────────────────────────────────────────────────────────
  const sep = '═'.repeat(56)
  console.log(`\n${sep}`)
  console.log(`[diagnose] nr="${nr}"  like="${like}"  trim="${trimNr}"`)
  console.log(`[diagnose] User=${report.dbUser}  Server=${report.dbServer}`)
  console.log(sep)

  console.log('\n[diagnose] TABELLEN mit "ngebot"/"uftrag":')
  for (const t of tables.rows) console.log(`  ${t.schema}.${t.table}`)

  console.log('\n[diagnose] SPALTEN Verkauf.tAngebot (INFORMATION_SCHEMA):')
  if (schema.error) {
    console.log(`  FEHLER: ${schema.error}`)
  } else {
    for (const c of schema.rows)
      console.log(`  ${c.col.padEnd(36)} ${c.type}${c.len ? `(${c.len})` : ''}`)
  }

  console.log('\n[diagnose] SPALTEN via SELECT TOP 1 * (beliebige Zeile):')
  if (sampleRow.error) {
    console.log(`  FEHLER: ${sampleRow.error}`)
  } else if (sampleRow.rows[0]) {
    console.log('  ' + Object.keys(sampleRow.rows[0]).join(', '))
  } else {
    console.log('  (keine Zeilen in tAngebot)')
  }

  console.log(`\n[diagnose] tAngebot TRIM-Exact ('${trimNr}'):`)
  if (angebotTrim.error) {
    console.log(`  FEHLER: ${angebotTrim.error}`)
  } else if (!angebotTrim.rows[0]) {
    console.log('  → KEIN TREFFER')
  } else {
    for (const [k, v] of Object.entries(angebotTrim.rows[0]))
      if (v !== null && v !== undefined && v !== '')
        console.log(`  ${k.padEnd(36)} = ${JSON.stringify(v)}`)
  }

  console.log(`\n[diagnose] tAngebot LIKE '${like}':`)
  if (angebotLike.error) {
    console.log(`  FEHLER: ${angebotLike.error}`)
  } else if (!angebotLike.rows[0]) {
    console.log('  → KEIN TREFFER')
  } else {
    for (const [k, v] of Object.entries(angebotLike.rows[0]))
      if (v !== null && v !== undefined && v !== '')
        console.log(`  ${k.padEnd(36)} = ${JSON.stringify(v)}`)
  }

  console.log(`\n[diagnose] tAuftrag LIKE '${like}' (nType=0):`)
  if (auftragLike.error) {
    console.log(`  FEHLER: ${auftragLike.error}`)
  } else if (!auftragLike.rows[0]) {
    console.log('  → KEIN TREFFER')
  } else {
    for (const [k, v] of Object.entries(auftragLike.rows[0]))
      if (v !== null && v !== undefined && v !== '')
        console.log(`  ${k.padEnd(36)} = ${JSON.stringify(v)}`)
  }

  console.log('\n[diagnose] STATUS-SPALTEN-SCAN:')
  if (statusHits.length) {
    for (const h of statusHits)
      console.log(`  ►► ${h.tabelle}.${h.col} = "${h.val}"`)
  } else {
    console.log('  (kein Statuswert erkannt)')
  }

  console.log('\n[diagnose] UPDATE-BERECHTIGUNGEN:')
  for (const p of perms.rows)
    console.log(`  ${p.obj.padEnd(30)} canUpdate=${p.canUpdate === 1 ? '✓ JA' : '✗ NEIN'}`)

  console.log(`\n${sep}\n`)

  return NextResponse.json(report)
}
