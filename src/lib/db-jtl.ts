'use server'

/**
 * JTL-Wawi Direkt-Datenbankzugriff (MS SQL Server 2017 / eazybusiness)
 *
 * SERVER-ONLY – Credentials aus Umgebungsvariablen.
 * Niemals direkt in Client-Komponenten importieren.
 * Zugriff ausschließlich über /api/jtl/* API-Routen.
 *
 * ── Echtes Schema (verifiziert 2025-04) ─────────────────────────────────────
 *
 *   dbo.tKunde                  kKunde, cKundenNr
 *   dbo.tAdresse                kAdresse, kKunde, cMail, cFirma, cVorname, cName,
 *                               cStrasse, cPLZ, cOrt, cLand, cTel, cMobil,
 *                               nStandard (1=Hauptadresse), nTyp (1=Rechnung, 0=Lieferung)
 *
 *   Verkauf.tAuftrag            kAuftrag, kKunde, cAuftragsNr,
 *                               nType (0=Angebot, 1=Auftrag),
 *                               nAuftragStatus, nStorno,
 *                               dErstellt, dVoraussichtlichesLieferdatum
 *
 *   Verkauf.tAuftragEckdaten    kAuftrag, fWertNetto, fWertBrutto
 *
 *   Verkauf.tAuftragPosition    kAuftragPosition, kAuftrag, nSort, cArtNr, cName,
 *                               fAnzahl, cEinheit, fVkNetto, nType (0=Normal)
 *
 *   Verkauf.tAuftragAdresse     kAuftrag, nTyp (0=Rechnungsadresse), cFirma, cVorname,
 *                               cName, cStrasse, cPLZ, cOrt, cLand, cTel, cMobil, cMail
 *
 * ── Schreibzugriff ───────────────────────────────────────────────────────────
 *   markAngebotAngenommen() → UPDATE tAuftragText SET cVorgangsstatus='angenommen'
 *   markAngebotAbgelehnt()  → UPDATE tAuftragText SET cVorgangsstatus='abgelehnt'
 *   Alle anderen Ops sind READ-ONLY.
 */

import sql from 'mssql'

// ── Server-String-Parser ──────────────────────────────────────────────────────
// Unterstützt: host\INSTANCE,port  |  host,port  |  host\INSTANCE  |  host

function parseServerString(raw: string): { host: string; port: number } {
  const envPort = parseInt(process.env.DB_PORT ?? '1433', 10) || 1433
  const commaIdx = raw.lastIndexOf(',')
  let hostPart = raw
  let port = envPort

  if (commaIdx !== -1) {
    const p = parseInt(raw.slice(commaIdx + 1).trim(), 10)
    if (!isNaN(p) && p > 0) port = p
    hostPart = raw.slice(0, commaIdx)
  }

  const bsIdx = hostPart.indexOf('\\')
  const host = (bsIdx !== -1 ? hostPart.slice(0, bsIdx) : hostPart).trim()
  return { host, port }
}

// ── Verbindungskonfiguration ──────────────────────────────────────────────────

function getConfig(): sql.config {
  const rawServer = process.env.DB_SERVER
  const database  = process.env.DB_NAME
  const user      = process.env.DB_USER
  const password  = process.env.DB_PASSWORD

  if (!rawServer || !database || !user || !password) {
    throw new Error(
      'JTL-DB: Umgebungsvariablen DB_SERVER, DB_NAME, DB_USER und DB_PASSWORD müssen gesetzt sein.'
    )
  }

  const { host, port } = parseServerString(rawServer)

  return {
    server:   host,
    port,
    database,
    user,
    password,
    options: {
      encrypt:               process.env.DB_ENCRYPT !== 'false',   // true für Remote-Server
      trustServerCertificate: process.env.DB_TRUST_CERT !== 'false', // true für Self-Signed
      enableArithAbort:      true,
      connectTimeout:        20_000,
    },
    pool: { max: 5, min: 0, idleTimeoutMillis: 30_000 },
    connectionTimeout: 20_000,
    requestTimeout:    30_000,
  }
}

// ── Connection-Pool Singleton ─────────────────────────────────────────────────

let _pool: sql.ConnectionPool | null = null

export async function getPool(): Promise<sql.ConnectionPool> {
  if (_pool?.connected) return _pool
  if (_pool) { try { await _pool.close() } catch { /**/ } _pool = null }
  _pool = await new sql.ConnectionPool(getConfig()).connect()
  return _pool
}

export async function testConnection(): Promise<{ server: string; version: string }> {
  const pool = await getPool()
  const res  = await pool.request().query<{ v: string }>('SELECT @@VERSION AS v')
  const { host, port } = parseServerString(process.env.DB_SERVER ?? '')
  return {
    server:  `${host}:${port}`,
    version: res.recordset[0]?.v?.split('\n')[0] ?? 'unbekannt',
  }
}

// ── Typen ─────────────────────────────────────────────────────────────────────

export interface JtlAdresse {
  firma:    string | null
  vorname:  string
  nachname: string          // = tAdresse.cName (JTL-Feldname für Nachname)
  strasse:  string
  plz:      string
  ort:      string
  land:     string
  tel:      string | null
  mobil:    string | null
  email:    string | null
}

export interface JtlKunde {
  kKunde:           number   // Primärschlüssel – Basis für alle weiteren Abfragen
  kundennummer:     string   // cKundenNr, z.B. "242010"
  email:            string
  rechnungsadresse: JtlAdresse
  lieferadresse:    JtlAdresse | null
}

export interface JtlPosition {
  pos:         number
  artikelnr:   string
  bezeichnung: string
  menge:       number
  einheit:     string
  preisNetto:  number
}

export interface JtlAngebot {
  kAuftrag:     number      // PK in tAuftrag – für markAngebotAngenommen()
  belegnummer:  string      // cAuftragsNr, z.B. "A10003"
  kKunde:       number
  datum:        string      // ISO 8601
  betreff:      string      // erste Position als Betreff
  betragNetto:  number
  betragBrutto: number
  status:       'offen' | 'angenommen' | 'storniert' | 'abgelehnt'
  positionen:   JtlPosition[]
}

export interface JtlAuftrag {
  kAuftrag:       number     // PK
  belegnummer:    string     // cAuftragsNr, z.B. "20147"
  kKunde:         number
  datum:          string     // ISO 8601
  montagetermin:  string | null  // dVoraussichtlichesLieferdatum
  betreff:        string
  betragNetto:    number
  betragBrutto:   number
  /** Summe aller nicht-stornierten Rechnungen zu diesem Auftrag (aus tRechnung JOIN tRechnungEckdaten) */
  rechnungssumme: number
  status:         'bestaetigt' | 'in_vorbereitung' | 'in_montage' | 'abgeschlossen' | 'storniert'
  positionen:     JtlPosition[]
  rechnungsadresse: JtlAdresse | null
  lieferadresse:    JtlAdresse | null
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function toIso(d: Date | null | undefined): string {
  return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString()
}

function mapAngebotStatus(nAuftragStatus: number, nStorno: boolean, cVorgangsstatus?: string | null): JtlAngebot['status'] {
  if (nStorno) return 'storniert'
  // cVorgangsstatus aus tAuftragText hat Vorrang (gesetzt via App-Kundeninteraktion)
  if (cVorgangsstatus === 'angenommen') return 'angenommen'
  if (cVorgangsstatus === 'abgelehnt')  return 'abgelehnt'
  if (nAuftragStatus === 0)  return 'offen'
  if (nAuftragStatus === 99) return 'abgelehnt'
  return 'angenommen'
}

function mapAuftragStatus(nAuftragStatus: number, nStorno: boolean, nZahlungStatus: number): JtlAuftrag['status'] {
  if (nStorno) return 'storniert'
  // nZahlungStatus=2 (Rechnung.tRechnungEckdaten) → alle Rechnungen komplett bezahlt
  if (nZahlungStatus === 2) return 'abgeschlossen'
  if (nAuftragStatus === 0) return 'bestaetigt'
  if (nAuftragStatus < 4)   return 'in_vorbereitung'
  return 'in_montage'
}

function mapAdresse(row: {
  cFirma: string | null; cVorname: string | null; cName: string | null
  cStrasse: string | null; cPLZ: string | null; cOrt: string | null
  cLand: string | null; cTel: string | null; cMobil: string | null; cMail: string | null
}): JtlAdresse {
  return {
    firma:    row.cFirma  || null,
    vorname:  row.cVorname ?? '',
    nachname: row.cName   ?? '',
    strasse:  row.cStrasse ?? '',
    plz:      row.cPLZ    ?? '',
    ort:      row.cOrt    ?? '',
    land:     row.cLand   ?? 'Deutschland',
    tel:      row.cTel    || null,
    mobil:    row.cMobil  || null,
    email:    row.cMail   || null,
  }
}

// ── Kunden-Abfragen ───────────────────────────────────────────────────────────

/**
 * Sucht Kunde per E-Mail in dbo.tAdresse JOIN dbo.tKunde.
 *
 * E-Mail steht in tAdresse (nicht tKunde!).
 * tAdresse.cName = Nachname, tAdresse.cVorname = Vorname (JTL-Konvention).
 * Lieferadresse = nTyp=0, Rechnungsadresse = nTyp=1 (oder nStandard=1).
 */
export async function findKundeByEmail(email: string): Promise<JtlKunde | null> {
  const pool   = await getPool()
  const mail   = email.toLowerCase().trim()

  // ── Strategie 1: E-Mail in tAdresse (any row) ────────────────────────────────
  // KEIN nStandard=1 Filter — viele JTL-Setups haben nStandard=0 auf allen Zeilen.
  // ORDER BY priorisiert nStandard=1, dann nTyp=1, dann älteste Zeile.
  const res = await pool.request()
    .input('email', sql.NVarChar(255), mail)
    .query<{
      kKunde: number; cKundenNr: string; kAdresse: number
      rFirma: string|null; rVorname: string|null; rName: string|null
      rStrasse: string|null; rPLZ: string|null; rOrt: string|null
      rLand: string|null; rTel: string|null; rMobil: string|null; rMail: string|null
    }>(`
      SELECT TOP 1
        k.kKunde,
        k.cKundenNr,
        a.kAdresse,
        a.cFirma   AS rFirma,
        a.cVorname AS rVorname,
        a.cName    AS rName,
        a.cStrasse AS rStrasse,
        a.cPLZ     AS rPLZ,
        a.cOrt     AS rOrt,
        ISNULL(a.cLand, 'Deutschland') AS rLand,
        a.cTel     AS rTel,
        a.cMobil   AS rMobil,
        a.cMail    AS rMail
      FROM dbo.tKunde k
      INNER JOIN dbo.tAdresse a ON a.kKunde = k.kKunde
      WHERE LOWER(a.cMail) = @email
      ORDER BY
        CASE WHEN a.nStandard = 1 THEN 0 ELSE 1 END,
        CASE WHEN a.nTyp      = 1 THEN 0 ELSE 1 END,
        a.kAdresse
    `)

  // ── Strategie 2: Fallback – E-Mail direkt in tKunde ──────────────────────────
  // Manche JTL-Versionen speichern die primäre E-Mail in tKunde, nicht in tAdresse.
  let kKundeRow = res.recordset[0]
  if (!kKundeRow) {
    console.warn('[findKundeByEmail] tAdresse-Suche ohne Treffer – versuche tKunde.cMail')
    try {
      const res2 = await pool.request()
        .input('email', sql.NVarChar(255), mail)
        .query<{ kKunde: number; cKundenNr: string }>(`
          SELECT TOP 1 kKunde, cKundenNr
          FROM dbo.tKunde
          WHERE LOWER(cMail) = @email
          ORDER BY kKunde
        `)
      if (res2.recordset.length) {
        // kKunde gefunden via tKunde – Adresse separat laden
        const kk = res2.recordset[0].kKunde
        const addrRes = await pool.request()
          .input('kKunde', sql.Int, kk)
          .query<{
            kKunde: number; cKundenNr: string; kAdresse: number
            rFirma: string|null; rVorname: string|null; rName: string|null
            rStrasse: string|null; rPLZ: string|null; rOrt: string|null
            rLand: string|null; rTel: string|null; rMobil: string|null; rMail: string|null
          }>(`
            SELECT TOP 1
              k.kKunde, k.cKundenNr, a.kAdresse,
              a.cFirma AS rFirma, a.cVorname AS rVorname, a.cName AS rName,
              a.cStrasse AS rStrasse, a.cPLZ AS rPLZ, a.cOrt AS rOrt,
              ISNULL(a.cLand,'Deutschland') AS rLand,
              a.cTel AS rTel, a.cMobil AS rMobil, a.cMail AS rMail
            FROM dbo.tKunde k
            LEFT JOIN dbo.tAdresse a ON a.kKunde = k.kKunde
            WHERE k.kKunde = @kKunde
            ORDER BY
              CASE WHEN a.nStandard = 1 THEN 0 ELSE 1 END,
              CASE WHEN a.nTyp      = 1 THEN 0 ELSE 1 END,
              a.kAdresse
          `)
        kKundeRow = addrRes.recordset[0]
      }
    } catch { /* tKunde.cMail existiert nicht in allen JTL-Versionen */ }
  }

  if (!kKundeRow) return null

  // ── Lieferadresse (nTyp=0) laden ─────────────────────────────────────────────
  const lRes = await pool.request()
    .input('kKunde', sql.Int, kKundeRow.kKunde)
    .query<{
      cFirma: string|null; cVorname: string|null; cName: string|null
      cStrasse: string|null; cPLZ: string|null; cOrt: string|null
      cLand: string|null; cTel: string|null; cMobil: string|null; cMail: string|null
    }>(`
      SELECT TOP 1
        cFirma, cVorname, cName, cStrasse, cPLZ, cOrt,
        ISNULL(cLand, 'Deutschland') AS cLand,
        cTel, cMobil, cMail
      FROM dbo.tAdresse
      WHERE kKunde = @kKunde AND nTyp = 0
      ORDER BY kAdresse
    `)

  return {
    kKunde:       kKundeRow.kKunde,
    kundennummer: kKundeRow.cKundenNr,
    email:        kKundeRow.rMail ?? email,
    rechnungsadresse: mapAdresse({
      cFirma:   kKundeRow.rFirma,   cVorname: kKundeRow.rVorname, cName: kKundeRow.rName,
      cStrasse: kKundeRow.rStrasse, cPLZ:     kKundeRow.rPLZ,    cOrt:  kKundeRow.rOrt,
      cLand:    kKundeRow.rLand,    cTel:     kKundeRow.rTel,    cMobil: kKundeRow.rMobil,
      cMail:    kKundeRow.rMail,
    }),
    lieferadresse: lRes.recordset.length ? mapAdresse(lRes.recordset[0]) : null,
  }
}

// ── Angebots-Abfragen ─────────────────────────────────────────────────────────

/**
 * Lädt alle Angebote eines Kunden.
 *
 * Angebote = Verkauf.tAuftrag WHERE nType = 0
 * Finanzwerte = Verkauf.tAuftragEckdaten
 * Positionen = Verkauf.tAuftragPosition WHERE nType = 0
 */
export async function getAngeboteByKunde(kKunde: number): Promise<JtlAngebot[]> {
  const pool = await getPool()

  const angRes = await pool.request()
    .input('kKunde', sql.Int, kKunde)
    .query<{
      kAuftrag:        number
      cAuftragsNr:     string
      dErstellt:       Date
      nAuftragStatus:  number
      nStorno:         boolean
      fWertNetto:      number
      fWertBrutto:     number
      cVorgangsstatus: string | null
    }>(`
      SELECT
        a.kAuftrag,
        ISNULL(a.cAuftragsNr, CAST(a.kAuftrag AS NVARCHAR)) AS cAuftragsNr,
        a.dErstellt,
        ISNULL(a.nAuftragStatus, 0) AS nAuftragStatus,
        ISNULL(a.nStorno, 0)        AS nStorno,
        ISNULL(e.fWertNetto,  0)    AS fWertNetto,
        ISNULL(e.fWertBrutto, 0)    AS fWertBrutto,
        t.cVorgangsstatus
      FROM [Verkauf].[tAuftrag] a
      JOIN [Verkauf].[tAuftragEckdaten] e ON e.kAuftrag = a.kAuftrag
      LEFT JOIN [Verkauf].[tAuftragText] t ON t.kAuftrag = a.kAuftrag
      WHERE a.kKunde = @kKunde
        AND a.nType  = 0
      ORDER BY a.dErstellt DESC
    `)

  if (!angRes.recordset.length) return []

  const ids = angRes.recordset.map((r) => r.kAuftrag).join(',')
  const posRes = await pool.request()
    .query<{
      kAuftrag: number; nSort: number; cArtNr: string|null
      cName: string; fAnzahl: number; cEinheit: string|null; fVkNetto: number
    }>(`
      SELECT kAuftrag,
             ISNULL(nSort, 0)    AS nSort,
             cArtNr,
             ISNULL(cName, '')   AS cName,
             ISNULL(fAnzahl, 1)  AS fAnzahl,
             cEinheit,
             ISNULL(fVkNetto, 0) AS fVkNetto
      FROM [Verkauf].[tAuftragPosition]
      WHERE kAuftrag IN (${ids})
        AND nType = 0
      ORDER BY kAuftrag, nSort
    `)

  const posByAng = new Map<number, JtlPosition[]>()
  for (const p of posRes.recordset) {
    if (!posByAng.has(p.kAuftrag)) posByAng.set(p.kAuftrag, [])
    posByAng.get(p.kAuftrag)!.push({
      pos: p.nSort, artikelnr: p.cArtNr ?? '', bezeichnung: p.cName,
      menge: p.fAnzahl, einheit: p.cEinheit ?? 'Stk', preisNetto: p.fVkNetto,
    })
  }

  return angRes.recordset.map((row): JtlAngebot => {
    const positionen = posByAng.get(row.kAuftrag) ?? []
    return {
      kAuftrag:     row.kAuftrag,
      belegnummer:  row.cAuftragsNr,
      kKunde,
      datum:        toIso(row.dErstellt),
      betreff:      positionen[0]?.bezeichnung || row.cAuftragsNr,
      betragNetto:  row.fWertNetto,
      betragBrutto: row.fWertBrutto,
      status:       mapAngebotStatus(row.nAuftragStatus, !!row.nStorno, row.cVorgangsstatus),
      positionen,
    }
  })
}

// ── Auftrags-Abfragen ─────────────────────────────────────────────────────────

/**
 * Lädt alle Aufträge eines Kunden.
 *
 * Aufträge = Verkauf.tAuftrag WHERE nType = 1
 * Montagetermin = dVoraussichtlichesLieferdatum (echter JTL-Feldname)
 * Adressen = Verkauf.tAuftragAdresse (nTyp=0 Rechnung, nTyp=1 Lieferung)
 */
export async function getAuftraegeByKunde(kKunde: number): Promise<JtlAuftrag[]> {
  const pool = await getPool()

  const aufRes = await pool.request()
    .input('kKunde', sql.Int, kKunde)
    .query<{
      kAuftrag:        number
      cAuftragsNr:     string
      cLeistung:       string | null
      dErstellt:       Date
      dLieferdatum:    Date | null
      nAuftragStatus:  number
      nStorno:         boolean
      fWertNetto:      number
      fWertBrutto:     number
      fRechnungsSumme: number
      nZahlungStatus:  number
    }>(`
      SELECT
        a.kAuftrag,
        ISNULL(a.cAuftragsNr, CAST(a.kAuftrag AS NVARCHAR)) AS cAuftragsNr,
        -- Erste Normalposition (nType=0) als Leistungsbezeichnung; Versandpositionen (nType≠0) werden übersprungen
        NULLIF(LTRIM(RTRIM(ISNULL(pos1.cName, ''))), '')      AS cLeistung,
        a.dErstellt,
        a.dVoraussichtlichesLieferdatum                       AS dLieferdatum,
        ISNULL(a.nAuftragStatus, 0)                           AS nAuftragStatus,
        ISNULL(a.nStorno, 0)                                  AS nStorno,
        ISNULL(e.fWertNetto,  0)                              AS fWertNetto,
        ISNULL(e.fWertBrutto, 0)                              AS fWertBrutto,
        -- Bruttosumme aller nicht-stornierten Rechnungen (Rechnung-Schema, Link via cAuftragsnummern)
        ISNULL((
          SELECT SUM(ISNULL(re.fVkBruttoGesamt, 0))
          FROM [Rechnung].[tRechnung] r
          JOIN [Rechnung].[tRechnungEckdaten] re ON re.kRechnung = r.kRechnung
          WHERE re.cAuftragsnummern = a.cAuftragsNr
            AND ISNULL(r.nStorno, 0) = 0
        ), 0) AS fRechnungsSumme,
        -- Zahlungsstatus: 0=keine Rechnung, 1=teilweise, 2=komplett bezahlt
        CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM [Rechnung].[tRechnung] r
            JOIN [Rechnung].[tRechnungEckdaten] re ON re.kRechnung = r.kRechnung
            WHERE re.cAuftragsnummern = a.cAuftragsNr AND ISNULL(r.nStorno, 0) = 0
          ) THEN 0
          WHEN NOT EXISTS (
            SELECT 1 FROM [Rechnung].[tRechnung] r
            JOIN [Rechnung].[tRechnungEckdaten] re ON re.kRechnung = r.kRechnung
            WHERE re.cAuftragsnummern = a.cAuftragsNr AND ISNULL(r.nStorno, 0) = 0
              AND re.nZahlungStatus < 2
          ) THEN 2
          ELSE 1
        END AS nZahlungStatus
      FROM [Verkauf].[tAuftrag] a
      JOIN [Verkauf].[tAuftragEckdaten] e ON e.kAuftrag = a.kAuftrag
      OUTER APPLY (
        SELECT TOP 1 p.cName
        FROM [Verkauf].[tAuftragPosition] p
        WHERE p.kAuftrag = a.kAuftrag
          AND p.nType    = 0
        ORDER BY ISNULL(p.nSort, 0)
      ) pos1
      WHERE a.kKunde = @kKunde
        AND a.nType  = 1
      ORDER BY a.dErstellt DESC
    `)

  if (!aufRes.recordset.length) return []

  const ids = aufRes.recordset.map((r) => r.kAuftrag).join(',')

  // Positionen
  const posRes = await pool.request()
    .query<{
      kAuftrag: number; nSort: number; cArtNr: string|null
      cName: string; fAnzahl: number; cEinheit: string|null; fVkNetto: number
    }>(`
      SELECT kAuftrag,
             ISNULL(nSort, 0)    AS nSort,
             cArtNr,
             ISNULL(cName, '')   AS cName,
             ISNULL(fAnzahl, 1)  AS fAnzahl,
             cEinheit,
             ISNULL(fVkNetto, 0) AS fVkNetto
      FROM [Verkauf].[tAuftragPosition]
      WHERE kAuftrag IN (${ids})
        AND nType = 0
      ORDER BY kAuftrag, nSort
    `)

  // Adressen (nTyp=0=Rechnung, nTyp=1=Lieferung)
  const adrRes = await pool.request()
    .query<{
      kAuftrag: number; nTyp: number
      cFirma: string|null; cVorname: string|null; cName: string|null
      cStrasse: string|null; cPLZ: string|null; cOrt: string|null
      cLand: string|null; cTel: string|null; cMobil: string|null; cMail: string|null
    }>(`
      SELECT kAuftrag, nTyp, cFirma, cVorname, cName,
             cStrasse, cPLZ, cOrt, ISNULL(cLand,'Deutschland') AS cLand,
             cTel, cMobil, cMail
      FROM [Verkauf].[tAuftragAdresse]
      WHERE kAuftrag IN (${ids})
    `)

  // Positionen und Adressen gruppieren
  const posByAuf = new Map<number, JtlPosition[]>()
  for (const p of posRes.recordset) {
    if (!posByAuf.has(p.kAuftrag)) posByAuf.set(p.kAuftrag, [])
    posByAuf.get(p.kAuftrag)!.push({
      pos: p.nSort, artikelnr: p.cArtNr ?? '', bezeichnung: p.cName,
      menge: p.fAnzahl, einheit: p.cEinheit ?? 'Stk', preisNetto: p.fVkNetto,
    })
  }

  const rAdrByAuf = new Map<number, JtlAdresse>()
  const lAdrByAuf = new Map<number, JtlAdresse>()
  for (const a of adrRes.recordset) {
    const mapped = mapAdresse(a)
    if (a.nTyp === 0) rAdrByAuf.set(a.kAuftrag, mapped)
    if (a.nTyp === 1) lAdrByAuf.set(a.kAuftrag, mapped)
  }

  return aufRes.recordset.map((row): JtlAuftrag => {
    const positionen = posByAuf.get(row.kAuftrag) ?? []
    return {
      kAuftrag:        row.kAuftrag,
      belegnummer:     row.cAuftragsNr,
      kKunde,
      datum:           toIso(row.dErstellt),
      montagetermin:   row.dLieferdatum ? toIso(row.dLieferdatum) : null,
      betreff:         row.cLeistung || positionen[0]?.bezeichnung || row.cAuftragsNr,
      betragNetto:     row.fWertNetto,
      betragBrutto:    row.fWertBrutto,
      rechnungssumme:  row.fRechnungsSumme,
      status:          mapAuftragStatus(row.nAuftragStatus, !!row.nStorno, row.nZahlungStatus),
      positionen,
      rechnungsadresse: rAdrByAuf.get(row.kAuftrag) ?? null,
      lieferadresse:    lAdrByAuf.get(row.kAuftrag) ?? null,
    }
  })
}

// ── Rechnungs-Abfragen ────────────────────────────────────────────────────────

export interface JtlRechnung {
  kRechnung:    number
  kKunde:       number
  belegnummer:  string    // cRechnungsnr
  datum:        string    // ISO 8601
  betragBrutto: number    // fVkBruttoGesamt aus tRechnungEckdaten
  betragNetto:  number    // fVkNettoGesamt
  bezahlt:      boolean   // nZahlungStatus = 2
  storniert:    boolean
}

/**
 * Lädt alle Rechnungen eines Kunden.
 * Rechnungen WERDEN NIE über die App verändert (Schreibschutz).
 * Diese Funktion ist READ-ONLY.
 *
 * Fehler "Invalid object name 'Verkauf.tRechnung'" → leeres Array (JTL-Version ohne Rechnung-Modul).
 */
export async function getRechnungenByKunde(kKunde: number): Promise<JtlRechnung[]> {
  const pool = await getPool()

  try {
    const res = await pool.request()
      .input('kKunde', sql.Int, kKunde)
      .query<{
        kRechnung:     number
        kKunde:        number
        cRechnungsnr:  string
        dErstellt:     Date
        nZahlungStatus: number
        nStorno:       number
        fVkBruttoGesamt: number
        fVkNettoGesamt:  number
      }>(`
        SELECT
          r.kRechnung,
          r.kKunde,
          ISNULL(r.cRechnungsnr, CAST(r.kRechnung AS NVARCHAR)) AS cRechnungsnr,
          r.dErstellt,
          ISNULL(e.nZahlungStatus, 0)    AS nZahlungStatus,
          ISNULL(r.nStorno, 0)           AS nStorno,
          ISNULL(e.fVkBruttoGesamt, 0)   AS fVkBruttoGesamt,
          ISNULL(e.fVkNettoGesamt,  0)   AS fVkNettoGesamt
        FROM [Rechnung].[tRechnung] r
        LEFT JOIN [Rechnung].[tRechnungEckdaten] e ON e.kRechnung = r.kRechnung
        WHERE r.kKunde = @kKunde
          AND ISNULL(r.nIstEntwurf, 0) = 0
        ORDER BY r.dErstellt DESC
      `)

    return res.recordset.map((row): JtlRechnung => ({
      kRechnung:    row.kRechnung,
      kKunde:       row.kKunde,
      belegnummer:  row.cRechnungsnr,
      datum:        toIso(row.dErstellt),
      betragBrutto: row.fVkBruttoGesamt,
      betragNetto:  row.fVkNettoGesamt,
      bezahlt:      row.nZahlungStatus === 2,
      storniert:    row.nStorno === 1,
    }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Graceful degradation wenn Tabelle nicht existiert
    if (msg.includes('Invalid object name') || msg.includes('tRechnung')) {
      console.warn('[getRechnungenByKunde] Tabelle Rechnung.tRechnung nicht gefunden – leeres Ergebnis')
      return []
    }
    throw err
  }
}

// ── Adress-Schreibzugriff ─────────────────────────────────────────────────────

export interface KundeUpdateData {
  firma?:   string | null
  vorname:  string
  nachname: string
  strasse:  string
  plz:      string
  ort:      string
  land:     string
  tel?:     string | null
  mobil?:   string | null
}

/** Serialisiert ein SQL-Error-Objekt vollständig für die Fehlerdiagnose. */
function serializeSqlError(err: unknown): string {
  if (!err) return 'null'
  const e = err as Record<string, unknown>
  return JSON.stringify({
    message:    e.message,
    code:       e.code,
    number:     e.number,      // SQL Server Fehlernummer (z.B. 207=Invalid column, 229=Permission)
    state:      e.state,
    class:      e.class,       // Fehler-Schweregrad
    serverName: e.serverName,
    procName:   e.procName,
    lineNumber: e.lineNumber,
    stack:      typeof e.stack === 'string' ? e.stack.split('\n').slice(0, 4).join(' | ') : undefined,
  }, null, 2)
}

/** Setzt den Connection-Pool zurück, damit ein Folgefehler nicht durch eine kaputte Verbindung entsteht. */
async function resetPool(): Promise<void> {
  if (_pool) {
    try { await _pool.close() } catch { /**/ }
    _pool = null
    console.warn('[db-jtl] Pool wurde nach Fehler zurückgesetzt.')
  }
}

/**
 * Liest alle tatsächlichen Spaltennamen von dbo.tAdresse aus dem Schema –
 * so sehen wir sofort, ob eine erwartete Spalte fehlt.
 */
export async function inspectTAdresseSchema(): Promise<string[]> {
  const pool = await getPool()
  const res = await pool.request()
    .query<{ COLUMN_NAME: string }>(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'tAdresse'
      ORDER BY ORDINAL_POSITION
    `)
  return res.recordset.map((r) => r.COLUMN_NAME)
}

/**
 * Schreibt die Rechnungsadresse eines Kunden zurück in dbo.tAdresse.
 *
 * @param kAdresse – wenn übergeben, direkt per PK updaten (kein Lookup nötig).
 *                   Sollte immer aus dem vorherigen GET mitgeliefert werden.
 */
export async function updateKundeRechnungsadresse(
  kKunde: number,
  data: KundeUpdateData,
  kAdresse?: number
): Promise<void> {
  const pool = await getPool()
  let targetKAdresse = kAdresse

  if (!targetKAdresse) {
    const addrRes = await pool.request()
      .input('kKunde', sql.Int, kKunde)
      .query<{ kAdresse: number }>(`
        SELECT TOP 1 kAdresse
        FROM dbo.tAdresse
        WHERE kKunde = @kKunde
        ORDER BY
          CASE WHEN nStandard = 1 THEN 0 ELSE 1 END,
          CASE WHEN nTyp      = 1 THEN 0 ELSE 1 END,
          kAdresse
      `)

    if (addrRes.recordset.length === 0) {
      console.error('[db-jtl] updateKundeRechnungsadresse: kKunde=%d → 0 Zeilen in tAdresse', kKunde)
      throw new Error(`Kein Adresseintrag für Kunden-ID ${kKunde}. Bitte neu anmelden.`)
    }

    targetKAdresse = addrRes.recordset[0].kAdresse
  }

  // ── Schritt 3: UPDATE per PK (kAdresse) ──────────────────────────────────────
  const sqlStmt = `SET ARITHABORT ON;
    UPDATE dbo.tAdresse
    SET cFirma   = @firma,
        cVorname = @vorname,
        cName    = @nachname,
        cStrasse = @strasse,
        cPLZ     = @plz,
        cOrt     = @ort,
        cLand    = @land,
        cTel     = @tel,
        cMobil   = @mobil
    WHERE kAdresse = @kAdresse`

  // JTL-Trigger (tgr_tAdresse_INSUP, tgr_tAdresse_INSUPDEL) blocken direkte UPDATEs mit
  // Fehler 3609. Lösung: Trigger temporär deaktivieren (DB-User hat ALTER-Berechtigung).
  try {
    await pool.request().query(`ALTER TABLE dbo.tAdresse DISABLE TRIGGER ALL`)
  } catch (trigErr) {
    console.warn('[db-jtl] DISABLE TRIGGER fehlgeschlagen – versuche Update trotzdem:', (trigErr as Error).message)
  }

  let updateErr: unknown = null
  let rowsAffected = -1
  try {
    const result = await pool.request()
      .input('kAdresse', sql.Int,          targetKAdresse)
      .input('firma',    sql.NVarChar(255), data.firma    ?? null)
      .input('vorname',  sql.NVarChar(255), data.vorname)
      .input('nachname', sql.NVarChar(255), data.nachname)
      .input('strasse',  sql.NVarChar(255), data.strasse)
      .input('plz',      sql.NVarChar(10),  data.plz)
      .input('ort',      sql.NVarChar(255), data.ort)
      .input('land',     sql.NVarChar(255), data.land || 'Deutschland')
      .input('tel',      sql.NVarChar(50),  data.tel   ?? null)
      .input('mobil',    sql.NVarChar(50),  data.mobil ?? null)
      .query(sqlStmt)
    rowsAffected = result.rowsAffected?.[0] ?? -1
  } catch (err) {
    updateErr = err
    console.error('SQL EXECUTION ERROR:', err)
    console.error('[db-jtl] UPDATE kAdresse=%d FEHLER:\n%s',
      targetKAdresse, serializeSqlError(err))
  } finally {
    try {
      await pool.request().query(`ALTER TABLE dbo.tAdresse ENABLE TRIGGER ALL`)
    } catch (trigErr) {
      console.warn('[db-jtl] ENABLE TRIGGER fehlgeschlagen:', (trigErr as Error).message)
    }
  }

  if (updateErr) {
    await resetPool()
    throw updateErr
  }
}

/**
 * Aktualisiert oder erstellt die Lieferadresse (nTyp=0) eines Kunden in dbo.tAdresse.
 * UPDATE erfolgt per kAdresse (PK), nicht per kKunde+nTyp.
 *
 * @param kAdresse – wenn übergeben, direktes UPDATE ohne Lookup.
 */
export async function upsertKundeLieferadresse(
  kKunde: number,
  email: string,
  data: KundeUpdateData,
  kAdresse?: number
): Promise<void> {
  const pool = await getPool()

  // ── Schritt 1: Schema-Erkennung via INFORMATION_SCHEMA ──────────────────────
  // Prüfe welche Verknüpfungsstruktur diese JTL-Version nutzt, bevor wir irgendetwas schreiben.
  const [colCheck, tblCheck] = await Promise.all([
    pool.request().query<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'tKunde'
        AND COLUMN_NAME  = 'kLieferadresse'
    `),
    pool.request().query<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'tLieferadresse'
    `),
  ])
  const hasKLieferadresse = (colCheck.recordset[0]?.cnt ?? 0) > 0
  const hasTLieferadresse = (tblCheck.recordset[0]?.cnt ?? 0) > 0
  console.log('[db-jtl] Schema-Check: tKunde.kLieferadresse=%s | tLieferadresse=%s',
    hasKLieferadresse, hasTLieferadresse)

  // ── Schritt 2: Bestehende Lieferadresse (nTyp=0) ermitteln ──────────────────
  // Wenn kAdresse übergeben wurde, verifizieren wir dass sie wirklich nTyp=0 ist.
  let targetKAdresse: number | null = null

  if (kAdresse) {
    const verifyRes = await pool.request()
      .input('kAdresse', sql.Int, kAdresse)
      .input('kKunde',   sql.Int, kKunde)
      .query<{ kAdresse: number; nTyp: number }>(`
        SELECT kAdresse, nTyp FROM dbo.tAdresse
        WHERE kAdresse = @kAdresse AND kKunde = @kKunde
      `)
    const row = verifyRes.recordset[0]
    if (row?.nTyp === 0) {
      targetKAdresse = row.kAdresse
      console.log('[db-jtl] Übergabe kAdresse=%d verifiziert (nTyp=0)', targetKAdresse)
    } else if (row) {
      console.warn('[db-jtl] kAdresse=%d hat nTyp=%d – suche nTyp=0 für kKunde=%d',
        kAdresse, row.nTyp, kKunde)
    }
  }

  if (targetKAdresse === null) {
    const existRes = await pool.request()
      .input('kKunde', sql.Int, kKunde)
      .query<{ kAdresse: number }>(`
        SELECT TOP 1 kAdresse FROM dbo.tAdresse
        WHERE kKunde = @kKunde AND nTyp = 0
        ORDER BY kAdresse
      `)
    targetKAdresse = existRes.recordset[0]?.kAdresse ?? null
    console.log('[db-jtl] Lookup nTyp=0 für kKunde=%d → kAdresse=%s',
      kKunde, targetKAdresse ?? 'nicht gefunden → INSERT')
  }

  // ── Schritt 3: Trigger deaktivieren ─────────────────────────────────────────
  try {
    await pool.request().query(`ALTER TABLE dbo.tAdresse DISABLE TRIGGER ALL`)
  } catch (trigErr) {
    console.warn('[db-jtl] DISABLE TRIGGER (Lieferadresse):', (trigErr as Error).message)
  }

  let upsertErr: unknown = null
  try {
    if (targetKAdresse !== null) {
      // ── UPDATE bestehende Lieferadresse ────────────────────────────────────
      const upd = await pool.request()
        .input('kAdresse', sql.Int,          targetKAdresse)
        .input('kKunde',   sql.Int,          kKunde)
        .input('firma',    sql.NVarChar(255), data.firma    ?? null)
        .input('vorname',  sql.NVarChar(255), data.vorname)
        .input('nachname', sql.NVarChar(255), data.nachname)
        .input('strasse',  sql.NVarChar(255), data.strasse)
        .input('plz',      sql.NVarChar(10),  data.plz)
        .input('ort',      sql.NVarChar(255), data.ort)
        .input('land',     sql.NVarChar(255), data.land || 'Deutschland')
        .input('tel',      sql.NVarChar(50),  data.tel   ?? null)
        .input('mobil',    sql.NVarChar(50),  data.mobil ?? null)
        .query(`SET ARITHABORT ON;
          UPDATE dbo.tAdresse
          SET nTyp     = 0,
              cFirma   = @firma,
              cVorname = @vorname,
              cName    = @nachname,
              cStrasse = @strasse,
              cPLZ     = @plz,
              cOrt     = @ort,
              cLand    = @land,
              cTel     = @tel,
              cMobil   = @mobil
          WHERE kAdresse = @kAdresse AND kKunde = @kKunde`)
      console.log('[db-jtl] Lieferadresse UPDATE: kAdresse=%d rows=%d',
        targetKAdresse, upd.rowsAffected?.[0] ?? -1)
    } else {
      // ── INSERT neue Lieferadresse ───────────────────────────────────────────
      const ins = await pool.request()
        .input('kKunde',   sql.Int,          kKunde)
        .input('firma',    sql.NVarChar(255), data.firma    ?? null)
        .input('vorname',  sql.NVarChar(255), data.vorname)
        .input('nachname', sql.NVarChar(255), data.nachname)
        .input('strasse',  sql.NVarChar(255), data.strasse)
        .input('plz',      sql.NVarChar(10),  data.plz)
        .input('ort',      sql.NVarChar(255), data.ort)
        .input('land',     sql.NVarChar(255), data.land || 'Deutschland')
        .input('tel',      sql.NVarChar(50),  data.tel   ?? null)
        .input('mobil',    sql.NVarChar(50),  data.mobil ?? null)
        .input('email',    sql.NVarChar(255), email)
        .query<{ kAdresse: number }>(`
          INSERT INTO dbo.tAdresse
            (kKunde, nTyp, nStandard, cFirma, cVorname, cName,
             cStrasse, cPLZ, cOrt, cLand, cTel, cMobil, cMail)
          OUTPUT INSERTED.kAdresse
          VALUES
            (@kKunde, 0, 0, @firma, @vorname, @nachname,
             @strasse, @plz, @ort, @land, @tel, @mobil, @email)
        `)
      targetKAdresse = ins.recordset[0]?.kAdresse ?? null
      console.log('[db-jtl] Lieferadresse INSERT: neue kAdresse=%d nTyp=0', targetKAdresse)
    }
  } catch (err) {
    upsertErr = err
    console.error('[db-jtl] UPSERT Lieferadresse FEHLER:\n%s', serializeSqlError(err))
  } finally {
    try {
      await pool.request().query(`ALTER TABLE dbo.tAdresse ENABLE TRIGGER ALL`)
    } catch (trigErr) {
      console.warn('[db-jtl] ENABLE TRIGGER (Lieferadresse):', (trigErr as Error).message)
    }
  }

  if (upsertErr) { await resetPool(); throw upsertErr }
  if (!targetKAdresse) return

  // ── Schritt 4: Kundenstamm verknüpfen ───────────────────────────────────────
  // Pfad A: tKunde.kLieferadresse (Standard in JTL 1.x)
  if (hasKLieferadresse) {
    try {
      const lr = await pool.request()
        .input('kKunde',   sql.Int, kKunde)
        .input('kAdresse', sql.Int, targetKAdresse)
        .query(`UPDATE dbo.tKunde SET kLieferadresse = @kAdresse WHERE kKunde = @kKunde`)
      console.log('[db-jtl] tKunde.kLieferadresse → %d (rows=%d)',
        targetKAdresse, lr.rowsAffected?.[0] ?? -1)
    } catch (err) {
      console.error('[db-jtl] tKunde.kLieferadresse UPDATE Fehler:', (err as Error).message)
    }
  } else {
    console.log('[db-jtl] tKunde.kLieferadresse nicht vorhanden – Spalte fehlt in dieser JTL-Version')
  }

  // Pfad B: dbo.tLieferadresse (alternative Verknüpfungstabelle)
  if (hasTLieferadresse) {
    try {
      const lColRes = await pool.request().query<{ COLUMN_NAME: string }>(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'tLieferadresse'
      `)
      const lCols = lColRes.recordset.map(r => r.COLUMN_NAME.toLowerCase())
      console.log('[db-jtl] tLieferadresse Spalten:', lCols.join(', '))

      if (lCols.includes('kkunde') && lCols.includes('kadresse')) {
        await pool.request()
          .input('kKunde',   sql.Int, kKunde)
          .input('kAdresse', sql.Int, targetKAdresse)
          .query(`
            MERGE dbo.tLieferadresse AS t
            USING (SELECT @kKunde AS kKunde, @kAdresse AS kAdresse) AS s
              ON t.kKunde = s.kKunde
            WHEN MATCHED     THEN UPDATE SET kAdresse = s.kAdresse
            WHEN NOT MATCHED THEN INSERT (kKunde, kAdresse) VALUES (s.kKunde, s.kAdresse);
          `)
        console.log('[db-jtl] tLieferadresse MERGE: kKunde=%d → kAdresse=%d', kKunde, targetKAdresse)
      } else {
        console.warn('[db-jtl] tLieferadresse: unbekannte Spaltenstruktur %s', lCols.join(', '))
      }
    } catch (err) {
      console.error('[db-jtl] tLieferadresse MERGE Fehler:', (err as Error).message)
    }
  } else {
    console.log('[db-jtl] tLieferadresse nicht vorhanden – JTL nutzt tAdresse.nTyp=0 direkt')
  }
}

// ── Angebots-Statusschreiber ──────────────────────────────────────────────────
//
// Schreibt NUR in [Verkauf].[tAuftragText].cVorgangsstatus.
// Kein nFarbe. Kein cAnmerkung. Keine anderen Tabellen.
//

export interface FarbeResult {
  rowsAffected: number
  path?:        string
  error?:       string
}

async function setVorgangsstatus(
  cAngebotNr: string,
  status: 'angenommen' | 'abgelehnt',
): Promise<FarbeResult> {
  let pool: sql.ConnectionPool
  try { pool = await getPool() }
  catch (err) {
    const msg = (err as Error).message.split('\n')[0]
    console.warn(`[tAuftragText] DB-Verbindung fehlgeschlagen: ${msg}`)
    return { rowsAffected: 0, error: msg }
  }

  const trimNr = cAngebotNr.trim()
  try {
    // Schritt 1: kAuftrag aus tAuftrag ermitteln
    const lookupRes = await pool.request()
      .input('angebotNr', sql.NVarChar(50), trimNr)
      .query<{ kAuftrag: number }>(`
        SELECT TOP 1 kAuftrag
        FROM [Verkauf].[tAuftrag]
        WHERE LTRIM(RTRIM(cAuftragsNr)) = @angebotNr
      `)

    const kAuftrag = lookupRes.recordset[0]?.kAuftrag
    if (!kAuftrag) {
      console.warn(`[tAuftragText] kAuftrag für "${trimNr}" nicht gefunden`)
      return { rowsAffected: 0, error: `kAuftrag für "${trimNr}" nicht gefunden` }
    }

    // Schritt 2: UPDATE – Zeile bereits vorhanden?
    const updRes = await pool.request()
      .input('kAuftrag', sql.Int,          kAuftrag)
      .input('status',   sql.NVarChar(50), status)
      .query(`
        UPDATE [Verkauf].[tAuftragText]
        SET cVorgangsstatus = @status
        WHERE kAuftrag = @kAuftrag
      `)
    const updRows = updRes.rowsAffected?.[0] ?? 0

    if (updRows > 0) {
      console.log(`[tAuftragText] UPDATE kAuftrag=${kAuftrag} (${trimNr}) → "${status}"`)
      return { rowsAffected: updRows, path: 'update' }
    }

    // Schritt 3: Zeile fehlt (neues Angebot) → INSERT
    console.warn(`[tAuftragText] Keine Zeile für kAuftrag=${kAuftrag} – INSERT`)
    const insRes = await pool.request()
      .input('kAuftrag', sql.Int,          kAuftrag)
      .input('status',   sql.NVarChar(50), status)
      .query(`
        INSERT INTO [Verkauf].[tAuftragText] (kAuftrag, cVorgangsstatus)
        VALUES (@kAuftrag, @status)
      `)
    const insRows = insRes.rowsAffected?.[0] ?? 0
    console.log(`[tAuftragText] INSERT kAuftrag=${kAuftrag} (${trimNr}) → "${status}" rowsAffected=${insRows}`)
    return { rowsAffected: insRows, path: 'insert' }

  } catch (err) {
    const msg = (err as Error).message.split('\n')[0]
    console.error(`[tAuftragText] Fehler für ${cAngebotNr}: ${msg}`)
    return { rowsAffected: 0, error: msg }
  }
}

/** Markiert ein Angebot als "angenommen" in der JTL-Wawi. Wirft nie. */
export async function markAngebotAngenommen(cAngebotNr: string): Promise<void> {
  await setVorgangsstatus(cAngebotNr, 'angenommen')
}

/** Markiert ein Angebot als "abgelehnt" in der JTL-Wawi. Wirft nie. */
export async function markAngebotAbgelehnt(cAngebotNr: string): Promise<FarbeResult> {
  return setVorgangsstatus(cAngebotNr, 'abgelehnt')
}

// ── Kunden-Neuanlage ──────────────────────────────────────────────────────────

export interface NewKundeData {
  vorname:  string
  nachname: string
  email:    string
  firma?:   string | null
  strasse?: string | null
  plz?:     string | null
  ort?:     string | null
  land?:    string | null
  tel?:     string | null
}

/**
 * Legt einen neuen Kunden in JTL-Wawi an (dbo.tKunde + dbo.tAdresse).
 *
 * Ablauf:
 * 0. Duplikat-Check: E-Mail in tAdresse → wirft { code: 'EMAIL_EXISTS' } falls gefunden.
 * 1. Nächste cKundenNr (MAX numerisch + 1 + 'A') und nDebitorennr (MAX + 1) ermitteln.
 * 2. INSERT tKunde ohne kKunde → SQL Server IDENTITY vergibt den PK automatisch.
 *    Generierte ID per SCOPE_IDENTITY() lesen.
 * 3. INSERT tAdresse ohne kAdresse → kKunde = generierte ID aus Schritt 2, nTyp = 1.
 * 4. INSERT tKunde_suche: alle Suchbegriffe (Name, Mail, Adresse …) mit nID-Mapping.
 * Alle Schritte laufen in einer Transaktion.
 */
export async function createKundeInJtl(
  data: NewKundeData,
): Promise<{ kKunde: number; kundennummer: string }> {
  const pool  = await getPool()
  const email = data.email.toLowerCase().trim()

  // ── 0. Duplikat-Check ───────────────────────────────────────────────────────
  const dupRes = await pool.request()
    .input('email', sql.NVarChar(255), email)
    .query<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM dbo.tAdresse
      WHERE LOWER(LTRIM(RTRIM(cMail))) = @email
    `)
  if ((dupRes.recordset[0]?.cnt ?? 0) > 0) {
    throw Object.assign(
      new Error('Diese E-Mail-Adresse ist bereits registriert.'),
      { code: 'EMAIL_EXISTS' },
    )
  }

  // ── 1. Werte für cKundenNr und nDebitorennr ermitteln ───────────────────────
  const [nrRes, debiRes] = await Promise.all([
    pool.request().query<{ nextNum: number }>(`
      SELECT ISNULL(MAX(
        TRY_CAST(
          CASE WHEN RIGHT(cKundenNr, 1) = 'A'
               THEN LEFT(cKundenNr, LEN(cKundenNr) - 1)
               ELSE cKundenNr
          END
        AS BIGINT)
      ), 10500) + 1 AS nextNum
      FROM dbo.tKunde
      WHERE TRY_CAST(
        CASE WHEN RIGHT(cKundenNr, 1) = 'A'
             THEN LEFT(cKundenNr, LEN(cKundenNr) - 1)
             ELSE cKundenNr
        END
      AS BIGINT) IS NOT NULL
    `),
    pool.request().query<{ next: number }>(
      `SELECT ISNULL(MAX(nDebitorennr), 0) + 1 AS next FROM dbo.tKunde`,
    ),
  ])

  const kundennummer = String(nrRes.recordset[0]?.nextNum ?? 10501) + 'A'
  const nDebitorennr = debiRes.recordset[0]?.next ?? 1

  console.log('[createKundeInJtl] cKundenNr=%s nDebitorennr=%d', kundennummer, nDebitorennr)

  // ── 2+3. Transaktion: tKunde → SCOPE_IDENTITY → tAdresse ────────────────────
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  let kKunde: number

  try {
    const req = () => new sql.Request(transaction)

    await req().query('ALTER TABLE dbo.tKunde   DISABLE TRIGGER ALL')
    await req().query('ALTER TABLE dbo.tAdresse DISABLE TRIGGER ALL')

    // Schritt 2: tKunde INSERT – kKunde wird vom IDENTITY vergeben
    const insKunde = await req()
      .input('cKundenNr',    sql.NVarChar(50), kundennummer)
      .input('nDebitorennr', sql.Int,          nDebitorennr)
      .query<{ newKundeID: number }>(`
        INSERT INTO dbo.tKunde
          (cKundenNr, dErstellt, nZahlungsziel, kZahlungsart, nDebitorennr)
        VALUES
          (@cKundenNr, GETDATE(), 5, 2, @nDebitorennr);
        SELECT SCOPE_IDENTITY() AS newKundeID;
      `)
    kKunde = insKunde.recordset[0]?.newKundeID
    if (!kKunde) throw new Error('SCOPE_IDENTITY() lieferte keinen Wert – tKunde INSERT fehlgeschlagen.')
    console.log('[createKundeInJtl] tKunde angelegt: kKunde=%d', kKunde)

    // Schritt 3: tAdresse INSERT – kAdresse wird vom IDENTITY vergeben, kKunde verknüpft
    await req()
      .input('kKunde',   sql.Int,           kKunde)
      .input('vorname',  sql.NVarChar(255), data.vorname.trim())
      .input('nachname', sql.NVarChar(255), data.nachname.trim())
      .input('email',    sql.NVarChar(255), email)
      .input('strasse',  sql.NVarChar(255), data.strasse?.trim() ?? '')
      .input('plz',      sql.NVarChar(10),  data.plz?.trim()     ?? '')
      .input('ort',      sql.NVarChar(255), data.ort?.trim()     ?? '')
      .input('land',     sql.NVarChar(255), data.land?.trim()    ?? 'Deutschland')
      .input('tel',      sql.NVarChar(50),  data.tel?.trim()     ?? null)
      .query(`
        INSERT INTO dbo.tAdresse
          (kKunde, nTyp, nStandard, cVorname, cName, cMail,
           cStrasse, cPLZ, cOrt, cLand, cTel)
        VALUES
          (@kKunde, 1, 1, @vorname, @nachname, @email,
           @strasse, @plz, @ort, @land, @tel)
      `)

    // Schritt 4: tKunde_suche – Suchindex befüllen
    const vn = data.vorname.trim()
    const nn = data.nachname.trim()
    const sucheEntries: Array<{ cValue: string; nID: number }> = [
      { cValue: `${vn} ${nn}`, nID: 1 },
      { cValue: `${nn} ${vn}`, nID: 1 },
      { cValue: vn,            nID: 1 },
      { cValue: nn,            nID: 1 },
      { cValue: email,         nID: 4 },
    ]
    if (data.firma?.trim())   sucheEntries.push({ cValue: data.firma.trim(),   nID: 2  })
    if (data.tel?.trim())     sucheEntries.push({ cValue: data.tel.trim(),     nID: 6  })
    if (data.strasse?.trim()) sucheEntries.push({ cValue: data.strasse.trim(), nID: 8  })
    if (data.ort?.trim())     sucheEntries.push({ cValue: data.ort.trim(),     nID: 9  })
    if (data.plz?.trim())     sucheEntries.push({ cValue: data.plz.trim(),     nID: 10 })

    for (const entry of sucheEntries) {
      await req()
        .input('kKunde', sql.Int,          kKunde)
        .input('cValue', sql.NVarChar(255), entry.cValue)
        .input('nID',    sql.Int,           entry.nID)
        .query(`
          INSERT INTO dbo.tKunde_suche (kKunde, cValue, nID)
          VALUES (@kKunde, @cValue, @nID)
        `)
    }
    console.log('[createKundeInJtl] tKunde_suche: %d Einträge angelegt', sucheEntries.length)

    await req().query('ALTER TABLE dbo.tKunde   ENABLE TRIGGER ALL')
    await req().query('ALTER TABLE dbo.tAdresse ENABLE TRIGGER ALL')

    await transaction.commit()
  } catch (err) {
    console.error('[createKundeInJtl] FEHLER – Rollback:\n%s', serializeSqlError(err))
    try { await transaction.rollback() } catch { /* ignore */ }
    await resetPool()
    throw err
  }

  console.log(`[createKundeInJtl] kKunde=${kKunde!} Nr=${kundennummer} angelegt`)
  return { kKunde: kKunde!, kundennummer }
}

/** Lädt den Namen des Kunden für ein Angebot (für E-Mail-Betreff). */
export async function getKundeNameByAuftrag(kAuftrag: number): Promise<string> {
  const pool = await getPool()
  const res  = await pool.request()
    .input('kAuftrag', sql.Int, kAuftrag)
    .query<{ cFirma: string|null; cVorname: string|null; cName: string|null }>(`
      SELECT TOP 1
        aa.cFirma, aa.cVorname, aa.cName
      FROM [Verkauf].[tAuftrag] a
      LEFT JOIN [Verkauf].[tAuftragAdresse] aa
        ON aa.kAuftrag = a.kAuftrag AND aa.nTyp = 0
      WHERE a.kAuftrag = @kAuftrag
    `)
  const row = res.recordset[0]
  if (!row) return 'Unbekannt'
  if (row.cFirma) return row.cFirma
  const parts = [row.cVorname, row.cName].filter(Boolean)
  return parts.join(' ') || 'Unbekannt'
}
