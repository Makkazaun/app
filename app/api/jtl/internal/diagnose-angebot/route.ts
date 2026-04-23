/**
 * GET /api/jtl/internal/diagnose-angebot?nr=A17807
 *
 * Liest alle Felder aus tAngebot / tAuftrag für eine Angebotsnummer und
 * schreibt sie vollständig in die pm2-Logs.
 *
 * Suche via LIKE '%nr%' (kein exact match) – umgeht Leerzeichen in der JTL-DB.
 * Zusätzlich: Schema-Dump (SELECT TOP 1 * ohne WHERE) damit Spaltenstruktur
 * immer sichtbar ist, auch wenn die Nummer nicht trifft.
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

  const like = `%${nr}%`
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
  report.tAngebotSpalten = schema.error ? { fehler: schema.error } : schema.rows.map(c => `${c.col} (${c.type})`)

  // ── 3. Beliebige Zeile aus tAngebot (kein WHERE) → Spalten immer sichtbar ─────
  const sampleRow = await safeQuery<Record<string, unknown>>(
    pool,
    (r) => r.query(`SELECT TOP 1 * FROM [Verkauf].[tAngebot]`),
    'tAngebot Stichprobe',
  )
  report.tAngebotStichprobeKolumnen = sampleRow.error
    ? { fehler: sampleRow.error }
    : sampleRow.rows[0] ? Object.keys(sampleRow.rows[0]) : '(keine Zeilen in tAngebot)'

  // ── 4. Datensatz via LIKE suchen ──────────────────────────────────────────────
  const angebotLike = await safeQuery<Record<string, unknown>>(
    pool,
    (r) => r.input('like', sql.NVarChar(102), like)
      .query(`SELECT TOP 1 * FROM [Verkauf].[tAngebot] WHERE cAngebotNr LIKE @like`),
    `tAngebot LIKE '${like}'`,
  )
  report.tAngebotRowLike = angebotLike.error
    ? { fehler: angebotLike.error }
    : angebotLike.rows[0] ?? '(kein Treffer)'

  // ── 5. tAuftrag via LIKE (nType=0) ───────────────────────────────────────────
  const auftragLike = await safeQuery<Record<string, unknown>>(
    pool,
    (r) => r.input('like', sql.NVarChar(102), like)
      .query(`SELECT TOP 1 * FROM [Verkauf].[tAuftrag] WHERE cAuftragsNr LIKE @like AND nType = 0`),
    `tAuftrag LIKE '${like}' (nType=0)`,
  )
  report.tAuftragRowLike = auftragLike.error
    ? { fehler: auftragLike.error }
    : auftragLike.rows[0] ?? '(kein Treffer)'

  // ── 6. UPDATE-Berechtigungen ──────────────────────────────────────────────────
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

  // ── 7. Ausgabe in pm2-Logs ────────────────────────────────────────────────────
  const sep = '═'.repeat(50)
  console.log(`\n${sep}`)
  console.log(`[diagnose] nr="${nr}"  like="${like}"`)
  console.log(`[diagnose] User=${report.dbUser}  Server=${report.dbServer}`)
  console.log(`${sep}`)

  console.log('\n[diagnose] TABELLEN mit "ngebot"/"uftrag":')
  for (const t of tables.rows) console.log(`  ${t.schema}.${t.table}`)

  console.log('\n[diagnose] SPALTEN Verkauf.tAngebot (INFORMATION_SCHEMA):')
  if (schema.error) {
    console.log(`  FEHLER: ${schema.error}`)
  } else {
    for (const c of schema.rows) console.log(`  ${c.col.padEnd(36)} ${c.type}${c.len ? `(${c.len})` : ''}`)
  }

  console.log('\n[diagnose] SPALTEN via SELECT TOP 1 * (beliebige Zeile):')
  if (sampleRow.error) {
    console.log(`  FEHLER: ${sampleRow.error}`)
  } else if (sampleRow.rows[0]) {
    console.log('  ' + Object.keys(sampleRow.rows[0]).join(', '))
  } else {
    console.log('  (keine Zeilen in tAngebot)')
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

  console.log('\n[diagnose] UPDATE-BERECHTIGUNGEN:')
  for (const p of perms.rows)
    console.log(`  ${p.obj.padEnd(30)} canUpdate=${p.canUpdate === 1 ? '✓ JA' : '✗ NEIN'}`)

  console.log(`\n${sep}\n`)

  return NextResponse.json(report)
}
