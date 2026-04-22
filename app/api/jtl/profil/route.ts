/**
 * GET  /api/jtl/profil?kKunde=<n>
 *   → { ok: true, rechnungsadresse, lieferadresse }
 *
 * POST /api/jtl/profil
 *   Body: { kKunde, email, type: 'rechnung' | 'lieferung', ...KundeUpdateData }
 *   → { ok: true }  |  { error }
 *
 * Pflichtfelder bei POST: vorname, nachname, strasse, plz, ort
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  updateKundeRechnungsadresse,
  upsertKundeLieferadresse,
  getPool,
  inspectTAdresseSchema,
  type KundeUpdateData,
} from '@/src/lib/db-jtl'
import sql from 'mssql'

// ── DEBUG: Schema + Zeilen-Inspektion  GET /api/jtl/profil?debug=1&kKunde=<n> ─

async function handleDebug(kKunde: number) {
  try {
    const pool   = await getPool()
    const cols   = await inspectTAdresseSchema()
    const rowRes = await pool.request()
      .input('kKunde', sql.Int, kKunde)
      .query<Record<string, unknown>>(
        `SELECT TOP 5 kAdresse, kKunde, nStandard, nTyp,
                cVorname, cName, cStrasse, cPLZ, cOrt, cMail
         FROM dbo.tAdresse WHERE kKunde = @kKunde`
      )
    return NextResponse.json({
      ok:          true,
      tAdresseColumns: cols,
      rows:        rowRes.recordset,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/jtl/profil/debug] Fehler:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

// ── GET: Stammdaten laden ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const kKunde = parseInt(req.nextUrl.searchParams.get('kKunde') ?? '', 10)

  // Debug-Modus: /api/jtl/profil?debug=1&kKunde=<n>
  if (req.nextUrl.searchParams.get('debug') === '1') {
    return handleDebug(kKunde)
  }

  if (!kKunde || isNaN(kKunde)) {
    return NextResponse.json({ error: 'kKunde fehlt.' }, { status: 400 })
  }

  try {
    const pool = await getPool()

    // Rechnungsadresse (nStandard=1)
    const rRes = await pool.request()
      .input('kKunde', sql.Int, kKunde)
      .query<{
        kAdresse: number
        cFirma: string|null; cVorname: string|null; cName: string|null
        cStrasse: string|null; cPLZ: string|null; cOrt: string|null
        cLand: string|null; cTel: string|null; cMobil: string|null; cMail: string|null
      }>(`
        SELECT TOP 1 kAdresse,
          cFirma, cVorname, cName, cStrasse, cPLZ, cOrt,
          ISNULL(cLand, 'Deutschland') AS cLand,
          cTel, cMobil, cMail
        FROM dbo.tAdresse
        WHERE kKunde = @kKunde AND nStandard = 1
      `)

    // Lieferadresse (nTyp=2)
    const lRes = await pool.request()
      .input('kKunde', sql.Int, kKunde)
      .query<{
        kAdresse: number
        cFirma: string|null; cVorname: string|null; cName: string|null
        cStrasse: string|null; cPLZ: string|null; cOrt: string|null
        cLand: string|null; cTel: string|null; cMobil: string|null; cMail: string|null
      }>(`
        SELECT TOP 1 kAdresse,
          cFirma, cVorname, cName, cStrasse, cPLZ, cOrt,
          ISNULL(cLand, 'Deutschland') AS cLand,
          cTel, cMobil, cMail
        FROM dbo.tAdresse
        WHERE kKunde = @kKunde AND nTyp = 2
      `)

    const mapRow = (r: typeof rRes.recordset[0]) => ({
      kAdresse: r.kAdresse,
      firma:    r.cFirma    ?? '',
      vorname:  r.cVorname  ?? '',
      nachname: r.cName     ?? '',
      strasse:  r.cStrasse  ?? '',
      plz:      r.cPLZ      ?? '',
      ort:      r.cOrt      ?? '',
      land:     r.cLand     ?? 'Deutschland',
      tel:      r.cTel      ?? '',
      mobil:    r.cMobil    ?? '',
      email:    r.cMail     ?? '',
    })

    return NextResponse.json({
      ok: true,
      rechnungsadresse: rRes.recordset[0] ? mapRow(rRes.recordset[0]) : null,
      lieferadresse:    lRes.recordset[0] ? mapRow(lRes.recordset[0]) : null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // SQL-Fehlernummer und -State für Diagnosezwecke loggen
    const sqlErr = err as Record<string, unknown>
    console.error('[api/jtl/profil] GET Fehler: %s | number=%s state=%s class=%s',
      msg, sqlErr.number ?? '–', sqlErr.state ?? '–', sqlErr.class ?? '–')
    return NextResponse.json({ error: 'Datenbankfehler beim Laden der Stammdaten.' }, { status: 502 })
  }
}

// ── POST: Adresse aktualisieren ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: {
    kKunde:   number
    email:    string
    type:     'rechnung' | 'lieferung'
    kAdresse?: number   // ← PK der Adresszeile aus dem vorherigen GET
    firma?:   string
    vorname:  string
    nachname: string
    strasse:  string
    plz:      string
    ort:      string
    land?:    string
    tel?:     string
    mobil?:   string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const { kKunde, email, type, vorname, nachname, strasse, plz, ort } = body

  // ── Validierung ──────────────────────────────────────────────────────────────
  if (!kKunde || !email) {
    return NextResponse.json({ error: 'kKunde und E-Mail sind erforderlich.' }, { status: 400 })
  }
  if (type !== 'rechnung' && type !== 'lieferung') {
    return NextResponse.json({ error: 'type muss "rechnung" oder "lieferung" sein.' }, { status: 400 })
  }

  const errors: string[] = []
  if (!vorname?.trim())  errors.push('Vorname ist erforderlich.')
  if (!nachname?.trim()) errors.push('Nachname ist erforderlich.')
  if (!strasse?.trim())  errors.push('Straße ist erforderlich.')
  if (!plz?.trim())      errors.push('PLZ ist erforderlich.')
  if (plz && !/^\d{4,10}$/.test(plz.trim())) errors.push('PLZ muss 4–10 Ziffern haben.')
  if (!ort?.trim())      errors.push('Ort ist erforderlich.')

  if (errors.length) {
    return NextResponse.json({ error: errors.join(' ') }, { status: 422 })
  }

  const data: KundeUpdateData = {
    firma:    body.firma    ? body.firma.trim()    : null,
    vorname:  vorname.trim(),
    nachname: nachname.trim(),
    strasse:  strasse.trim(),
    plz:      plz.trim(),
    ort:      ort.trim(),
    land:     (body.land ?? 'Deutschland').trim(),
    tel:      body.tel    ? body.tel.trim()    : null,
    mobil:    body.mobil  ? body.mobil.trim()  : null,
  }

  const kAdresse = body.kAdresse ? Number(body.kAdresse) : undefined

  try {
    console.log('[api/jtl/profil] POST type=%s kKunde=%d kAdresse=%s email=%s',
      type, kKunde, kAdresse ?? '–', email)
    if (type === 'rechnung') {
      await updateKundeRechnungsadresse(kKunde, data, kAdresse)
      console.log('[api/jtl/profil] ✓ Rechnungsadresse aktualisiert | kKunde: %d kAdresse: %s',
        kKunde, kAdresse ?? '–')
    } else {
      await upsertKundeLieferadresse(kKunde, email, data, kAdresse)
      console.log('[api/jtl/profil] ✓ Lieferadresse upsert | kKunde: %d kAdresse: %s',
        kKunde, kAdresse ?? '–')
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const sqlErr = err as Record<string, unknown>
    console.error('[api/jtl/profil] POST Fehler: %s | number=%s state=%s class=%s',
      msg, sqlErr.number ?? '–', sqlErr.state ?? '–', sqlErr.class ?? '–')
    return NextResponse.json(
      { error: 'Fehler beim Abgleich mit der Datenbank. Bitte versuchen Sie es später erneut.' },
      { status: 502 }
    )
  }
}
