/**
 * Portal-Datenbank (SQLite via better-sqlite3)
 *
 * SERVER-ONLY – niemals in Client-Komponenten importieren.
 *
 * Datei: data/portal.db  (liegt im Projekt-Root, nicht in src/)
 *
 * Tabellen:
 *   users         – Portal-Nutzer, verknüpft mit JTL-kKunde
 *   reset_tokens  – Passwort-Reset-Tokens (30 min TTL)
 *
 * Passwörter werden AUSSCHLIESSLICH als bcrypt-Hash gespeichert (saltRounds=12).
 * Die JTL-Wawi-Datenbank wird NICHT beschrieben.
 */

import Database from 'better-sqlite3'
import path     from 'path'
import fs       from 'fs'

// ── DB-Singleton ──────────────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), 'data', 'portal.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (_db) return _db

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // ── Schema ──────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      k_kunde       INTEGER,
      kundennummer  TEXT,
      password_hash TEXT,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS reset_tokens (
      token      TEXT    PRIMARY KEY,
      email      TEXT    NOT NULL COLLATE NOCASE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    -- Vom Kunden abgelehnte Angebote – autoritativer Status (JTL bekommt nur Farbe).
    -- kAuftrag = Verkauf.tAuftrag.kAuftrag (JTL-PK)
    CREATE TABLE IF NOT EXISTS angebot_rejections (
      k_auftrag   INTEGER PRIMARY KEY,
      rejected_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_reset_tokens_email ON reset_tokens(email);
  `)

  _db = db
  console.log(`[portal-db] Datenbank geöffnet: ${DB_PATH}`)
  return _db
}

// ── Typen ─────────────────────────────────────────────────────────────────────

export interface PortalUser {
  id:            number
  email:         string
  k_kunde:       number | null
  kundennummer:  string | null
  password_hash: string | null
  created_at:    number
  updated_at:    number
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function findUserByEmail(email: string): PortalUser | null {
  const db = getDb()
  return db.prepare(
    'SELECT * FROM users WHERE email = ? COLLATE NOCASE'
  ).get(email.trim().toLowerCase()) as PortalUser | null
}

/** Legt Nutzer an (wenn nicht vorhanden) oder aktualisiert JTL-Referenz. */
export function upsertUserJtl(
  email:        string,
  kKunde:       number,
  kundennummer: string
): PortalUser {
  const db   = getDb()
  const now  = Date.now()
  const mail = email.trim().toLowerCase()

  db.prepare(`
    INSERT INTO users (email, k_kunde, kundennummer, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      k_kunde      = excluded.k_kunde,
      kundennummer = excluded.kundennummer,
      updated_at   = excluded.updated_at
  `).run(mail, kKunde, kundennummer, now, now)

  return findUserByEmail(mail)!
}

/**
 * Legt einen Portal-Nutzer ohne JTL-Verknüpfung an.
 * Wird bei der Registrierung genutzt wenn JTL gerade nicht erreichbar ist.
 * kKunde kann später via /api/jtl/kunde nachgezogen werden.
 */
export function createPortalUser(email: string): void {
  const db  = getDb()
  const now = Date.now()
  db.prepare(`
    INSERT OR IGNORE INTO users (email, created_at, updated_at)
    VALUES (?, ?, ?)
  `).run(email.trim().toLowerCase(), now, now)
}

/** Setzt den Passwort-Hash für einen Nutzer (der vorher via JTL bekannt sein muss). */
export function setPasswordHash(email: string, hash: string): void {
  const db  = getDb()
  const now = Date.now()
  const rows = db.prepare(`
    UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ? COLLATE NOCASE
  `).run(hash, now, email.trim().toLowerCase())

  if (rows.changes === 0) {
    throw new Error(`Nutzer "${email}" nicht in Portal-DB gefunden – zuerst upsertUserJtl() aufrufen.`)
  }
}

// ── Angebot-Ablehnungen ───────────────────────────────────────────────────────

/** Trägt eine Angebotsablehnung in die lokale DB ein (idempotent). */
export function rejectAngebotInPortal(kAuftrag: number): void {
  getDb().prepare(`
    INSERT OR REPLACE INTO angebot_rejections (k_auftrag, rejected_at)
    VALUES (?, unixepoch() * 1000)
  `).run(kAuftrag)
}

/** Gibt alle abgelehnten kAuftrag-IDs als Set zurück (für Merge in der Angebote-API). */
export function getRejectedAuftragIds(): Set<number> {
  const rows = getDb()
    .prepare('SELECT k_auftrag FROM angebot_rejections')
    .all() as { k_auftrag: number }[]
  return new Set(rows.map((r) => r.k_auftrag))
}

// ── Reset-Tokens ──────────────────────────────────────────────────────────────

export function storeResetToken(token: string, email: string, ttlMs = 30 * 60 * 1000): void {
  const db = getDb()

  // Alle abgelaufenen Tokens für diese E-Mail löschen
  db.prepare('DELETE FROM reset_tokens WHERE email = ? COLLATE NOCASE OR expires_at < ?')
    .run(email.trim().toLowerCase(), Date.now())

  db.prepare('INSERT INTO reset_tokens (token, email, expires_at) VALUES (?, ?, ?)')
    .run(token, email.trim().toLowerCase(), Date.now() + ttlMs)
}

/** Gibt die E-Mail zurück wenn der Token gültig ist, sonst null. */
export function validateResetToken(token: string): string | null {
  if (!token) return null
  const db = getDb()
  const row = db.prepare(
    'SELECT email, expires_at FROM reset_tokens WHERE token = ?'
  ).get(token) as { email: string; expires_at: number } | null

  if (!row)                       return null
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM reset_tokens WHERE token = ?').run(token)
    return null
  }
  return row.email
}

/** Löscht den Token nach Verwendung (Einmal-Token). */
export function consumeResetToken(token: string): void {
  getDb().prepare('DELETE FROM reset_tokens WHERE token = ?').run(token)
}
