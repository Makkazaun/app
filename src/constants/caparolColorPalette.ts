/**
 * Caparol Color 2001 – vollständige Farbkartendaten
 * Quelle: farben.jpg (Caparol Color Ausgabe 2001)
 *
 * Schattierungssystem dieser Karte:
 *   0  = vollgesättigte Farbe (dunkelst / stärkste Tönung)
 *   18 = höchste Aufhellung (pastellhell / fast weiß)
 *
 * Jede Familie enthält 7 Nuancen: 0, 12, 13, 14, 15, 16, 18
 *
 * ──────────────────────────────────────────────────────────────────────
 * Neue Familie hinzufügen:
 *   1. Objekt mit { key, name, nuancen } in CAPAROL_FAMILIEN eintragen
 *   2. nuancen-Array: 7 Einträge mit nr (0 | 12 | 13 | 14 | 15 | 16 | 18)
 *   3. Kein weiterer Code nötig – Picker und Lookup ergänzen sich automatisch
 * ──────────────────────────────────────────────────────────────────────
 */

export interface KartenNuance {
  nr:   number   // 0 | 12 | 13 | 14 | 15 | 16 | 18
  name: string   // z.B. "Amazonas 12"
  hex:  string   // Hex-Code aus Farbkarte
}

export interface KartenFamilie {
  key:     string         // Slug, z.B. 'amazonas'
  name:    string         // Anzeigename, z.B. 'Amazonas'
  nuancen: KartenNuance[] // 7 Einträge: 0 (dunkelst) → 18 (hellst)
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPAROL_FAMILIEN – alle 25 Familien (alphabetisch sortiert wie in der Karte)
// Erste 10 Familien: Amazonas, Aprikose, Atlantis, Basalt, Cognac,
//                   Cosmos, Gobi, Granat, Graphit, Havanna
// ─────────────────────────────────────────────────────────────────────────────

export const CAPAROL_FAMILIEN: KartenFamilie[] = [
  {
    key: 'amazonas',
    name: 'Amazonas',
    nuancen: [
      { nr:  0, name: 'Amazonas 0',  hex: '#4A6C2E' },
      { nr: 12, name: 'Amazonas 12', hex: '#7CA558' },
      { nr: 13, name: 'Amazonas 13', hex: '#8CB568' },
      { nr: 14, name: 'Amazonas 14', hex: '#9EC47C' },
      { nr: 15, name: 'Amazonas 15', hex: '#B0D090' },
      { nr: 16, name: 'Amazonas 16', hex: '#C4DCA8' },
      { nr: 18, name: 'Amazonas 18', hex: '#D8ECC6' },
    ],
  },
  {
    key: 'aprikose',
    name: 'Aprikose',
    nuancen: [
      { nr:  0, name: 'Aprikose 0',  hex: '#C44E00' },
      { nr: 12, name: 'Aprikose 12', hex: '#E08030' },
      { nr: 13, name: 'Aprikose 13', hex: '#E89048' },
      { nr: 14, name: 'Aprikose 14', hex: '#EEAA64' },
      { nr: 15, name: 'Aprikose 15', hex: '#F3BF82' },
      { nr: 16, name: 'Aprikose 16', hex: '#F7D2A2' },
      { nr: 18, name: 'Aprikose 18', hex: '#FBEACC' },
    ],
  },
  {
    key: 'atlantis',
    name: 'Atlantis',
    nuancen: [
      { nr:  0, name: 'Atlantis 0',  hex: '#1C3E5E' },
      { nr: 12, name: 'Atlantis 12', hex: '#587C9A' },
      { nr: 13, name: 'Atlantis 13', hex: '#6890AA' },
      { nr: 14, name: 'Atlantis 14', hex: '#7EA2BA' },
      { nr: 15, name: 'Atlantis 15', hex: '#94B4CA' },
      { nr: 16, name: 'Atlantis 16', hex: '#AAC6D8' },
      { nr: 18, name: 'Atlantis 18', hex: '#D0E2ED' },
    ],
  },
  {
    key: 'basalt',
    name: 'Basalt',
    nuancen: [
      { nr:  0, name: 'Basalt 0',  hex: '#1E2020' },
      { nr: 12, name: 'Basalt 12', hex: '#606060' },
      { nr: 13, name: 'Basalt 13', hex: '#707070' },
      { nr: 14, name: 'Basalt 14', hex: '#808080' },
      { nr: 15, name: 'Basalt 15', hex: '#909090' },
      { nr: 16, name: 'Basalt 16', hex: '#A4A4A2' },
      { nr: 18, name: 'Basalt 18', hex: '#CCCCC8' },
    ],
  },
  {
    key: 'cognac',
    name: 'Cognac',
    nuancen: [
      { nr:  0, name: 'Cognac 0',  hex: '#6A3C10' },
      { nr: 12, name: 'Cognac 12', hex: '#C09060' },
      { nr: 13, name: 'Cognac 13', hex: '#CAA070' },
      { nr: 14, name: 'Cognac 14', hex: '#D4B082' },
      { nr: 15, name: 'Cognac 15', hex: '#DDBF96' },
      { nr: 16, name: 'Cognac 16', hex: '#E6CEAE' },
      { nr: 18, name: 'Cognac 18', hex: '#F0E2C8' },
    ],
  },
  {
    key: 'cosmos',
    name: 'Cosmos',
    nuancen: [
      { nr:  0, name: 'Cosmos 0',  hex: '#344A66' },
      { nr: 12, name: 'Cosmos 12', hex: '#8EA2C1' },
      { nr: 13, name: 'Cosmos 13', hex: '#9CB0CC' },
      { nr: 14, name: 'Cosmos 14', hex: '#ACC0D8' },
      { nr: 15, name: 'Cosmos 15', hex: '#BCCEE0' },
      { nr: 16, name: 'Cosmos 16', hex: '#CADBEB' },
      { nr: 18, name: 'Cosmos 18', hex: '#DFE9F5' },
    ],
  },
  {
    key: 'gobi',
    name: 'Gobi',
    nuancen: [
      { nr:  0, name: 'Gobi 0',  hex: '#7A6020' },
      { nr: 12, name: 'Gobi 12', hex: '#B8A058' },
      { nr: 13, name: 'Gobi 13', hex: '#C2AE6A' },
      { nr: 14, name: 'Gobi 14', hex: '#CEBC80' },
      { nr: 15, name: 'Gobi 15', hex: '#D8CC96' },
      { nr: 16, name: 'Gobi 16', hex: '#E2D8AE' },
      { nr: 18, name: 'Gobi 18', hex: '#EEEACC' },
    ],
  },
  {
    key: 'granat',
    name: 'Granat',
    nuancen: [
      { nr:  0, name: 'Granat 0',  hex: '#901A1A' },
      { nr: 12, name: 'Granat 12', hex: '#BE7878' },
      { nr: 13, name: 'Granat 13', hex: '#CC9090' },
      { nr: 14, name: 'Granat 14', hex: '#D8ACAA' },
      { nr: 15, name: 'Granat 15', hex: '#E4C2BE' },
      { nr: 16, name: 'Granat 16', hex: '#EDD5D2' },
      { nr: 18, name: 'Granat 18', hex: '#F4E8E8' },
    ],
  },
  {
    key: 'graphit',
    name: 'Graphit',
    nuancen: [
      { nr:  0, name: 'Graphit 0',  hex: '#1E2022' },
      { nr: 12, name: 'Graphit 12', hex: '#6E6E72' },
      { nr: 13, name: 'Graphit 13', hex: '#7E7E82' },
      { nr: 14, name: 'Graphit 14', hex: '#909094' },
      { nr: 15, name: 'Graphit 15', hex: '#A2A2A6' },
      { nr: 16, name: 'Graphit 16', hex: '#B6B6BA' },
      { nr: 18, name: 'Graphit 18', hex: '#D6D6DA' },
    ],
  },
  {
    key: 'havanna',
    name: 'Havanna',
    nuancen: [
      { nr:  0, name: 'Havanna 0',  hex: '#3E2010' },
      { nr: 12, name: 'Havanna 12', hex: '#B07040' },
      { nr: 13, name: 'Havanna 13', hex: '#BC8050' },
      { nr: 14, name: 'Havanna 14', hex: '#C89860' },
      { nr: 15, name: 'Havanna 15', hex: '#D4AE78' },
      { nr: 16, name: 'Havanna 16', hex: '#DFC490' },
      { nr: 18, name: 'Havanna 18', hex: '#ECDDC0' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────────────────────────────────────────

/** Alle Nuancen aller Familien als flache Liste (für Lookup-Aufbau). */
export function allePaletteNuancen(): Array<{ key: string; name: string; hex: string }> {
  return CAPAROL_FAMILIEN.flatMap((fam) =>
    fam.nuancen.map((n) => ({
      key:  `${fam.key}_${n.nr}`,
      name: n.name,
      hex:  n.hex,
    })),
  )
}

/** Hex-Wert für einen Schlüssel (z.B. 'amazonas_12'). '' wenn nicht gefunden. */
export function getPaletteHex(key: string): string {
  return allePaletteNuancen().find((n) => n.key === key)?.hex ?? ''
}

/** Anzeigename für einen Schlüssel (z.B. 'amazonas_12' → 'Amazonas 12'). */
export function getPaletteLabel(key: string): string {
  return allePaletteNuancen().find((n) => n.key === key)?.name ?? key
}

/** Sonderfarben (Weiß, Anthrazit) – stets im Favoriten-Tab sichtbar. */
export const PALETTE_SONDER_FARBEN = [
  { key: 'weiss',     name: 'Weiß (RAL 9010)',      hex: '#F0F0EC' },
  { key: 'anthrazit', name: 'Anthrazit (RAL 7016)', hex: '#38393E' },
] as const

/** Schlüssel der Favoriten-Kacheln (erscheinen im ersten Tab). */
export const PALETTE_FAVORITEN: string[] = [
  'weiss',
  'anthrazit',
  'graphit_0',
  'graphit_12',
  'basalt_12',
  'havanna_12',
  'cognac_14',
  'gobi_14',
  'granat_12',
  'amazonas_12',
  'aprikose_12',
  'cosmos_12',
]
