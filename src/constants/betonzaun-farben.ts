/**
 * Caparol Color 2001 – Farbkartendaten
 * Quelle: NL3_K2_CaparolColorCARD (1).webp
 *
 * Jede Familie enthält 8 Nuancen aus der Karte: 18 (hellst) → 8 (satt).
 * Die Schattierungsnummern entsprechen der Caparol-Notation:
 *   18 = höchste Aufhellung / pastellhell
 *    8 = vollgesättigte Farbe (die Karte beginnt bei Nr. 8)
 *
 * ──────────────────────────────────────────────────────────────────────
 * Neue Familie hinzufügen:
 *   1. Objekt mit { key, name, nuancen } in FARB_KARTEN_FAMILIEN eintragen
 *   2. nuancen-Array: 8 Einträge mit nr (18–8) und exaktem Hex-Wert
 *   3. Kein weiterer Code nötig – Picker und Lookup ergänzen sich automatisch
 * ──────────────────────────────────────────────────────────────────────
 */

export interface FarbNuance {
  nr:   number   // Caparol-Schattierungsnummer (8 | 9 | 12 | 13 | 14 | 15 | 16 | 18)
  name: string   // Anzeigename, z.B. "Amazonas 14"
  hex:  string   // Exakter Hex-Code aus Farbkarte
}

export interface FarbFamilieKarte {
  key:     string        // Slug, z.B. 'amazonas'
  name:    string        // Anzeigename, z.B. 'Amazonas'
  nuancen: FarbNuance[]  // Immer 8 Einträge, von hell (18) nach satt (8)
}

// ─────────────────────────────────────────────────────────────────────────────
// FARB_KARTEN_FAMILIEN – erste 10 Familien (Spalten 1–10 der Karte)
// Weitere Familien werden in einem zweiten Schritt nachgeliefert.
// ─────────────────────────────────────────────────────────────────────────────

export const FARB_KARTEN_FAMILIEN: FarbFamilieKarte[] = [
  {
    key: 'granat',
    name: 'Granat',
    nuancen: [
      { nr: 18, name: 'Granat 18', hex: '#F2E8E8' },
      { nr: 16, name: 'Granat 16', hex: '#EDD5D4' },
      { nr: 15, name: 'Granat 15', hex: '#E4C2C0' },
      { nr: 14, name: 'Granat 14', hex: '#D9ACAA' },
      { nr: 13, name: 'Granat 13', hex: '#CC9190' },
      { nr: 12, name: 'Granat 12', hex: '#BE7878' },
      { nr: 9,  name: 'Granat 9',  hex: '#9E4040' },
      { nr: 8,  name: 'Granat 8',  hex: '#8A2E2E' },
    ],
  },
  {
    key: 'madeira',
    name: 'Madeira',
    nuancen: [
      { nr: 18, name: 'Madeira 18', hex: '#F0E2DC' },
      { nr: 16, name: 'Madeira 16', hex: '#E8D0C8' },
      { nr: 15, name: 'Madeira 15', hex: '#DFBCB4' },
      { nr: 14, name: 'Madeira 14', hex: '#D3A49C' },
      { nr: 13, name: 'Madeira 13', hex: '#C48C82' },
      { nr: 12, name: 'Madeira 12', hex: '#B47468' },
      { nr: 9,  name: 'Madeira 9',  hex: '#8C4E3A' },
      { nr: 8,  name: 'Madeira 8',  hex: '#7A3C28' },
    ],
  },
  {
    key: 'aprikose',
    name: 'Aprikose',
    nuancen: [
      { nr: 18, name: 'Aprikose 18', hex: '#FCF2E8' },
      { nr: 16, name: 'Aprikose 16', hex: '#F8E4D0' },
      { nr: 15, name: 'Aprikose 15', hex: '#F3D3B8' },
      { nr: 14, name: 'Aprikose 14', hex: '#ECBE98' },
      { nr: 13, name: 'Aprikose 13', hex: '#E4A77C' },
      { nr: 12, name: 'Aprikose 12', hex: '#D98F5E' },
      { nr: 9,  name: 'Aprikose 9',  hex: '#BE600E' },
      { nr: 8,  name: 'Aprikose 8',  hex: '#A84C00' },
    ],
  },
  {
    key: 'cognac',
    name: 'Cognac',
    nuancen: [
      { nr: 18, name: 'Cognac 18', hex: '#F4EDE2' },
      { nr: 16, name: 'Cognac 16', hex: '#EEE1CC' },
      { nr: 15, name: 'Cognac 15', hex: '#E8D1B4' },
      { nr: 14, name: 'Cognac 14', hex: '#DEBB98' },
      { nr: 13, name: 'Cognac 13', hex: '#D0A47C' },
      { nr: 12, name: 'Cognac 12', hex: '#C08C62' },
      { nr: 9,  name: 'Cognac 9',  hex: '#9A6530' },
      { nr: 8,  name: 'Cognac 8',  hex: '#845218' },
    ],
  },
  {
    key: 'mandarin',
    name: 'Mandarin',
    nuancen: [
      { nr: 18, name: 'Mandarin 18', hex: '#FCF1E4' },
      { nr: 16, name: 'Mandarin 16', hex: '#F8E3CC' },
      { nr: 15, name: 'Mandarin 15', hex: '#F4D2AE' },
      { nr: 14, name: 'Mandarin 14', hex: '#EFBD8A' },
      { nr: 13, name: 'Mandarin 13', hex: '#E8A668' },
      { nr: 12, name: 'Mandarin 12', hex: '#DE8E48' },
      { nr: 9,  name: 'Mandarin 9',  hex: '#C06014' },
      { nr: 8,  name: 'Mandarin 8',  hex: '#AA4E00' },
    ],
  },
  {
    key: 'gobi',
    name: 'Gobi',
    nuancen: [
      { nr: 18, name: 'Gobi 18', hex: '#F4F0E6' },
      { nr: 16, name: 'Gobi 16', hex: '#EDE8D8' },
      { nr: 15, name: 'Gobi 15', hex: '#E4DCC8' },
      { nr: 14, name: 'Gobi 14', hex: '#D9CEB4' },
      { nr: 13, name: 'Gobi 13', hex: '#CBBA96' },
      { nr: 12, name: 'Gobi 12', hex: '#BCA47C' },
      { nr: 9,  name: 'Gobi 9',  hex: '#9A7E56' },
      { nr: 8,  name: 'Gobi 8',  hex: '#866840' },
    ],
  },
  {
    key: 'mars',
    name: 'Mars',
    nuancen: [
      { nr: 18, name: 'Mars 18', hex: '#F8F3E0' },
      { nr: 16, name: 'Mars 16', hex: '#F4E9CA' },
      { nr: 15, name: 'Mars 15', hex: '#EEDDAC' },
      { nr: 14, name: 'Mars 14', hex: '#E7CC92' },
      { nr: 13, name: 'Mars 13', hex: '#DDB876' },
      { nr: 12, name: 'Mars 12', hex: '#D29E58' },
      { nr: 9,  name: 'Mars 9',  hex: '#B27828' },
      { nr: 8,  name: 'Mars 8',  hex: '#9C6410' },
    ],
  },
  {
    key: 'ingwer',
    name: 'Ingwer',
    nuancen: [
      { nr: 18, name: 'Ingwer 18', hex: '#F6EEE2' },
      { nr: 16, name: 'Ingwer 16', hex: '#F2E4CC' },
      { nr: 15, name: 'Ingwer 15', hex: '#EDD4B6' },
      { nr: 14, name: 'Ingwer 14', hex: '#E7C098' },
      { nr: 13, name: 'Ingwer 13', hex: '#DEA87A' },
      { nr: 12, name: 'Ingwer 12', hex: '#D2905C' },
      { nr: 9,  name: 'Ingwer 9',  hex: '#B0642E' },
      { nr: 8,  name: 'Ingwer 8',  hex: '#985018' },
    ],
  },
  {
    key: 'amazonas',
    name: 'Amazonas',
    nuancen: [
      { nr: 18, name: 'Amazonas 18', hex: '#EAF3E6' },
      { nr: 16, name: 'Amazonas 16', hex: '#DAE9D2' },
      { nr: 15, name: 'Amazonas 15', hex: '#C9DEBA' },
      { nr: 14, name: 'Amazonas 14', hex: '#B6D1A4' },
      { nr: 13, name: 'Amazonas 13', hex: '#A0C48E' },
      { nr: 12, name: 'Amazonas 12', hex: '#88B576' },
      { nr: 9,  name: 'Amazonas 9',  hex: '#5A8E4A' },
      { nr: 8,  name: 'Amazonas 8',  hex: '#487A38' },
    ],
  },
  {
    key: 'iris',
    name: 'Iris',
    nuancen: [
      { nr: 18, name: 'Iris 18', hex: '#EAEAF4' },
      { nr: 16, name: 'Iris 16', hex: '#DCDCF0' },
      { nr: 15, name: 'Iris 15', hex: '#CCCCEA' },
      { nr: 14, name: 'Iris 14', hex: '#BCBCE0' },
      { nr: 13, name: 'Iris 13', hex: '#A8A8D4' },
      { nr: 12, name: 'Iris 12', hex: '#9090C6' },
      { nr: 9,  name: 'Iris 9',  hex: '#6060B0' },
      { nr: 8,  name: 'Iris 8',  hex: '#4C4C9C' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────────────────────────────────────────

/** Alle Nuancen aller Familien als flache Liste (für Lookup-Aufbau). */
export function alleNuancen(): Array<{ key: string; name: string; hex: string }> {
  return FARB_KARTEN_FAMILIEN.flatMap((fam) =>
    fam.nuancen.map((n) => ({
      key:  `${fam.key}_${n.nr}`,
      name: n.name,
      hex:  n.hex,
    })),
  )
}

/** Hex-Wert für einen Schlüssel (z.B. 'amazonas_12'). '' wenn nicht gefunden. */
export function getKartenFarbHex(key: string): string {
  return alleNuancen().find((n) => n.key === key)?.hex ?? ''
}

/** Anzeigename für einen Schlüssel (z.B. 'amazonas_12' → 'Amazonas 12'). */
export function getKartenFarbLabel(key: string): string {
  return alleNuancen().find((n) => n.key === key)?.name ?? key
}

/** Sonderfarben (Weiß, Anthrazit) – stets im Favoriten-Tab sichtbar. */
export const SONDER_FARBEN_KARTE = [
  { key: 'weiss',     name: 'Weiß (RAL 9010)',      hex: '#F0F0EC' },
  { key: 'anthrazit', name: 'Anthrazit (RAL 7016)', hex: '#38393E' },
] as const

/** Schlüssel der Favoriten-Kacheln (erscheinen im ersten Tab). */
export const KARTEN_FAVORITEN: string[] = [
  'weiss',
  'anthrazit',
  'granat_12',
  'aprikose_12',
  'cognac_12',
  'gobi_12',
  'mars_12',
  'amazonas_12',
  'iris_12',
]
