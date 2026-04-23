/**
 * Edelzaun – Auftrags-Store
 * Verwaltet bestätigte Aufträge (digital unterschriebene Angebote).
 * Kompatibel mit JTL-Wawi-Mapping: jtlAuftragId entspricht JTL AUF-Nummer.
 *
 * Ziel-Datenbankschema (PostgreSQL):
 * auftraege(id, angebot_id, created_at, status, leistung, betrag_num,
 *           produkt, modell, hoehe, laenge, farbe_platten, farbe_pfeiler,
 *           besonderheiten, montagetermin, signatur_b64, signiert_at,
 *           rechnungsadresse jsonb, lieferadresse jsonb,
 *           jtl_auftrag_id, phasen jsonb)
 */

export type AuftragStatus =
  | 'bestaetigt'       // unterschrieben, noch nicht terminiert
  | 'in_vorbereitung'  // Material bestellt / geliefert
  | 'in_montage'       // Montage läuft
  | 'abgeschlossen'    // Übergabe erfolgt

export const AUFTRAG_STATUS_LABELS: Record<AuftragStatus, string> = {
  bestaetigt:      'Bestätigt',
  in_vorbereitung: 'In Vorbereitung',
  in_montage:      'In Montage',
  abgeschlossen:   'Abgeschlossen',
}
export const AUFTRAG_STATUS_COLORS: Record<AuftragStatus, string> = {
  bestaetigt:      '#c9a84c',
  in_vorbereitung: '#5b9bd5',
  in_montage:      '#b07bdc',
  abgeschlossen:   '#5bc97a',
}

export interface Adresse {
  firma?:      string
  vorname:     string
  nachname:    string
  strasse:     string
  hausnummer:  string
  plz:         string
  ort:         string
  land:        string
}

export interface AuftragPhase {
  key:          string
  label:        string
  datum:        string
  beschreibung: string
  status:       'done' | 'active' | 'pending'
}

export interface AuftragRecord {
  id:              string    // z.B. 'AUF-2025-0031'
  angebotId:       string    // Ursprungs-ANG-Nummer
  createdAt:       string    // ISO 8601 (Zeitpunkt der Unterschrift)
  updatedAt:       string
  status:          AuftragStatus
  // Leistungs-Zusammenfassung (aus JTL)
  leistung:        string
  betrag:          string    // formatiert, z.B. '4.890,00 €'
  betragNum:       number    // für Berechnungen
  // Projekt-Details
  produkt:         string
  modell:          string
  hoehe:           string
  laenge:          string
  farbePlatten:    string
  farbePfeiler:    string
  besonderheiten:  string
  // Termin (= Lieferdatum in JTL)
  montagetermin:   string | null
  // Digital-Signatur
  signatur:        string    // base64 PNG
  signierAt:       string    // ISO 8601
  // Adressen (getrennt für JTL-Kompatibilität)
  rechnungsadresse: Adresse | null
  lieferadresse:    Adresse | null
  // JTL-Verknüpfung
  jtlAuftragId:    string | null
  // Projekt-Timeline
  phasen:          AuftragPhase[]
}

// ─── Default-Phasen ─────────────────────────────────────────────────────────

export function defaultPhasen(montagetermin: string | null): AuftragPhase[] {
  const montageDatum = montagetermin
    ? new Date(montagetermin).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Wird mitgeteilt'
  return [
    { key: 'auftragsbestaetigung', label: 'Auftragsbestätigung', datum: new Date().toLocaleDateString('de-DE'), beschreibung: 'Angebot digital unterschrieben und von uns bestätigt.', status: 'done' },
    { key: 'planung',              label: 'Planung & Material',  datum: 'Binnen 5 Werktagen',    beschreibung: 'Materialbestellung und Logistikplanung laufen.',    status: 'active' },
    { key: 'lieferung',            label: 'Materiallieferung',   datum: 'Ca. 10–14 Werktage',    beschreibung: 'Lieferung aller Zaunelemente und Pfosten.',         status: 'pending' },
    { key: 'montage',              label: 'Montage',             datum: montageDatum,             beschreibung: 'Fachgerechte Montage durch unser Montageteam.',     status: 'pending' },
    { key: 'abnahme',              label: 'Abnahme & Übergabe',  datum: 'Nach Montage',           beschreibung: 'Gemeinsame Abnahme und Übergabe aller Unterlagen.', status: 'pending' },
  ]
}

// ─── localStorage-Adapter ────────────────────────────────────────────────────

const KEY = 'ez_auftraege'

function loadAll(): AuftragRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AuftragRecord[]) : []
  } catch { return [] }
}

function saveAll(records: AuftragRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(records))
}

function genAuftragsId(angebotId: string): string {
  // ANG-2025-0031 → AUF-2025-0031
  return angebotId.replace(/^ANG-/, 'AUF-')
}

export function listAuftraege(): AuftragRecord[] {
  return loadAll()
}

export function saveAuftrag(record: AuftragRecord): void {
  const existing = loadAll()
  saveAll([record, ...existing.filter((r) => r.id !== record.id)])
}

export function createAuftragFromAngebot(params: {
  angebotId:      string
  leistung:       string
  betrag:         string
  betragNum:      number
  produkt:        string
  modell:         string
  hoehe:          string
  laenge:         string
  farbePlatten:   string
  farbePfeiler:   string
  besonderheiten: string
  montagetermin:  string | null
  signatur:       string
  rechnungsadresse: Adresse | null
  lieferadresse:    Adresse | null
}): AuftragRecord {
  const now = new Date().toISOString()
  const record: AuftragRecord = {
    id:              genAuftragsId(params.angebotId),
    angebotId:       params.angebotId,
    createdAt:       now,
    updatedAt:       now,
    status:          'bestaetigt',
    leistung:        params.leistung,
    betrag:          params.betrag,
    betragNum:       params.betragNum,
    produkt:         params.produkt,
    modell:          params.modell,
    hoehe:           params.hoehe,
    laenge:          params.laenge,
    farbePlatten:    params.farbePlatten,
    farbePfeiler:    params.farbePfeiler,
    besonderheiten:  params.besonderheiten,
    montagetermin:   params.montagetermin,
    signatur:        params.signatur,
    signierAt:       now,
    rechnungsadresse: params.rechnungsadresse,
    lieferadresse:    params.lieferadresse,
    jtlAuftragId:    null,
    phasen:          defaultPhasen(params.montagetermin),
  }
  saveAuftrag(record)
  return record
}

