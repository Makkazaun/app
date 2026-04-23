/**
 * Edelzaun Anfragen-Store
 * ──────────────────────────────────────────────────────────────────────────
 * Aktuell: localStorage-Adapter (kein Backend nötig)
 * Migration zu Supabase / JTL ecombase: nur den `adapter`-Export austauschen.
 *
 * Ziel-Datenbankschema (PostgreSQL / Supabase):
 * ┌────────────────────┬──────────────────────────────────────────────────┐
 * │ Spalte             │ Typ + Beschreibung                               │
 * ├────────────────────┼──────────────────────────────────────────────────┤
 * │ id                 │ UUID PK DEFAULT gen_random_uuid()                │
 * │ user_id            │ TEXT NOT NULL  (→ users.email; später UUID FK)   │
 * │ created_at         │ TIMESTAMPTZ DEFAULT now()                        │
 * │ updated_at         │ TIMESTAMPTZ DEFAULT now()                        │
 * │ status             │ TEXT NOT NULL DEFAULT 'in_pruefung'              │
 * │ produkt            │ TEXT NOT NULL                                    │
 * │ config             │ JSONB NOT NULL  (vollständiger Konfigurator-JSON) │
 * │ dateien            │ JSONB DEFAULT '[]'  (Metadaten; Dateien in S3)   │
 * │ jtl_angebot_id     │ TEXT  (gesetzt wenn JTL Angebot angelegt)        │
 * │ jtl_auftrag_id     │ TEXT  (gesetzt wenn JTL Auftrag angelegt)        │
 * │ admin_note         │ TEXT                                             │
 * │ schema_version     │ INTEGER DEFAULT 1  (für Migrationen)             │
 * │ source             │ TEXT DEFAULT 'web_konfigurator'                  │
 * └────────────────────┴──────────────────────────────────────────────────┘
 */

import type { FormData } from '@/components/konfigurator/types'

// ─── Typen ──────────────────────────────────────────────────────────────────

export type AnfrageStatus =
  | 'in_pruefung'      // frisch eingegangen
  | 'in_bearbeitung'   // wird vom Team bearbeitet
  | 'angebot_erstellt' // Angebot wurde generiert
  | 'angenommen'       // Kunde hat Angebot akzeptiert
  | 'abgelehnt'        // Anfrage abgelehnt / zurückgezogen
  | 'abgeschlossen'    // Auftrag fertig

export const STATUS_LABELS: Record<AnfrageStatus, string> = {
  in_pruefung:      'In Prüfung',
  in_bearbeitung:   'In Bearbeitung',
  angebot_erstellt: 'Angebot erhalten',
  angenommen:       'Angenommen',
  abgelehnt:        'Abgelehnt',
  abgeschlossen:    'Abgeschlossen',
}

export const STATUS_COLORS: Record<AnfrageStatus, string> = {
  in_pruefung:      '#800020',
  in_bearbeitung:   '#5b9bd5',
  angebot_erstellt: '#b07bdc',
  angenommen:       '#5bc97a',
  abgelehnt:        '#e07b5b',
  abgeschlossen:    '#6a6a6a',
}

export interface DateiMetadata {
  name: string
  size: number   // bytes
  type: string   // MIME
  // url?: string  // Supabase Storage URL (nach Migration)
}

/** Serialisierbarer Konfigurations-Snapshot (File → DateiMetadata) */
export type ConfigSnapshot = Omit<FormData, 'dateien'> & {
  dateien: DateiMetadata[]
}

export interface AnfrageRecord {
  // Kern-Felder (1:1 DB-Mapping)
  id: string
  userId: string              // E-Mail des Kunden (später UUID)
  createdAt: string           // ISO 8601
  updatedAt: string           // ISO 8601
  status: AnfrageStatus
  produkt: string             // 'betonzaun' | 'doppelstabmatte' | 'schmiedekunst'
  config: ConfigSnapshot      // vollständiger JSON-Snapshot
  // Integrations-Felder (null bis verknüpft)
  jtlAngebotId: string | null // JTL-Wawi Angebots-ID
  jtlAuftragId: string | null // JTL-Wawi Auftrags-ID
  adminNote: string | null
  // Meta
  schemaVersion: 1
  source: 'web_konfigurator'
}

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Serialisierbaren Snapshot aus FormData erstellen (File → Metadaten) */
export function serializeFormData(form: FormData): ConfigSnapshot {
  return {
    ...form,
    dateien: form.dateien.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    })),
  }
}

/** Lesbare Zusammenfassung für Kartentitel */
export function anfrageTitle(record: AnfrageRecord): string {
  const c = record.config
  if (record.produkt === 'betonzaun') {
    const laenge = c.betonzaun.laenge ? `${c.betonzaun.laenge} m` : ''
    const muster = c.betonzaun.muster || ''
    return ['Betonzaun', muster, laenge].filter(Boolean).join(' · ')
  }
  if (record.produkt === 'doppelstabmatte') {
    const laenge = c.doppelstab.laenge ? `${c.doppelstab.laenge} m` : ''
    return ['Doppelstabmatte', laenge].filter(Boolean).join(' · ')
  }
  if (record.produkt === 'schmiedekunst') {
    return 'Schmiedekunst / Metallzaun'
  }
  return 'Anfrage'
}

// ─── Adapter-Interface ──────────────────────────────────────────────────────
// Tauschen Sie `localAdapter` gegen einen Supabase-Client aus,
// ohne dass sich die aufrufenden Komponenten ändern müssen.

interface AnfrageAdapter {
  save(record: AnfrageRecord): void
  listByUser(userId: string): AnfrageRecord[]
  getById(id: string): AnfrageRecord | null
  updateStatus(id: string, status: AnfrageStatus): void
  savePending(record: AnfrageRecord): void
  popPending(): AnfrageRecord | null
}

// ─── localStorage-Implementierung ──────────────────────────────────────────

const KEYS = {
  userPrefix: 'ez_anfragen_',   // + userId
  pending:    'ez_pending_req',
} as const

const localAdapter: AnfrageAdapter = {
  save(record) {
    if (typeof window === 'undefined') return
    const key = KEYS.userPrefix + record.userId
    const existing = localAdapter.listByUser(record.userId)
    // neueste zuerst
    const updated = [record, ...existing.filter((r) => r.id !== record.id)]
    localStorage.setItem(key, JSON.stringify(updated))
  },

  listByUser(userId) {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(KEYS.userPrefix + userId)
      return raw ? (JSON.parse(raw) as AnfrageRecord[]) : []
    } catch { return [] }
  },

  getById(id) {
    if (typeof window === 'undefined') return null
    // Suche über alle User-Keys
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(KEYS.userPrefix)) continue
      try {
        const records = JSON.parse(localStorage.getItem(key) ?? '[]') as AnfrageRecord[]
        const found = records.find((r) => r.id === id)
        if (found) return found
      } catch { /* ignore */ }
    }
    return null
  },

  updateStatus(id, status) {
    if (typeof window === 'undefined') return
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(KEYS.userPrefix)) continue
      try {
        const records = JSON.parse(localStorage.getItem(key) ?? '[]') as AnfrageRecord[]
        const idx = records.findIndex((r) => r.id === id)
        if (idx >= 0) {
          records[idx] = { ...records[idx], status, updatedAt: new Date().toISOString() }
          localStorage.setItem(key, JSON.stringify(records))
          return
        }
      } catch { /* ignore */ }
    }
  },

  savePending(record) {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEYS.pending, JSON.stringify(record))
  },

  popPending() {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(KEYS.pending)
      if (!raw) return null
      localStorage.removeItem(KEYS.pending)
      return JSON.parse(raw) as AnfrageRecord
    } catch { return null }
  },
}

// ─── Öffentliche API ────────────────────────────────────────────────────────
// Nur diese Funktionen aus Komponenten aufrufen – nie direkt localAdapter.

/** Neue Anfrage aus FormData erstellen und für einen User speichern */
export function createAndSaveAnfrage(userId: string, form: FormData): AnfrageRecord {
  const now = new Date().toISOString()
  const record: AnfrageRecord = {
    id: generateId(),
    userId,
    createdAt: now,
    updatedAt: now,
    status: 'in_pruefung',
    produkt: form.produkt,
    config: serializeFormData(form),
    jtlAngebotId: null,
    jtlAuftragId: null,
    adminNote: null,
    schemaVersion: 1,
    source: 'web_konfigurator',
  }
  localAdapter.save(record)
  return record
}

/** Anfrage als Gast (ohne Account) zwischenspeichern */
export function savePendingAnfrage(form: FormData): AnfrageRecord {
  const now = new Date().toISOString()
  const record: AnfrageRecord = {
    id: generateId(),
    userId: 'guest',
    createdAt: now,
    updatedAt: now,
    status: 'in_pruefung',
    produkt: form.produkt,
    config: serializeFormData(form),
    jtlAngebotId: null,
    jtlAuftragId: null,
    adminNote: null,
    schemaVersion: 1,
    source: 'web_konfigurator',
  }
  localAdapter.savePending(record)
  return record
}

/** Pending-Anfrage nach Registrierung dem neuen User zuweisen */
export function claimPendingAnfrage(userId: string): AnfrageRecord | null {
  const pending = localAdapter.popPending()
  if (!pending) return null
  const claimed = { ...pending, userId, updatedAt: new Date().toISOString() }
  localAdapter.save(claimed)
  return claimed
}

export function listAnfragen(userId: string): AnfrageRecord[] {
  return localAdapter.listByUser(userId)
}

export function updateAnfrageStatus(id: string, status: AnfrageStatus) {
  localAdapter.updateStatus(id, status)
}
