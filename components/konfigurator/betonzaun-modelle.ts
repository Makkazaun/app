/**
 * Kuratierte Betonzaun-Modelle aus dem Sortiment von TR Edelzaun & Tor GmbH.
 *
 * imageUrl-Platzhalter:
 *   Option A – eigene Bilder: Legen Sie Dateien unter /public/betonzaun/modell-XX.jpg ab
 *              und tragen Sie "/betonzaun/modell-XX.jpg" ein.
 *   Option B – Bilder von edelzaun-tor.com (nur für internen Gebrauch / wenn lizenziert):
 *              "https://www.edelzaun-tor.com/mt-content/uploads/2021/06/XX.jpg"
 *
 * nr: Offizielle Modellnummer aus dem Katalog edelzaun-tor.com/modelle
 */

export interface BetonzaunModell {
  nr: string
  name: string
  kategorie: string
  beschreibung: string
  imageUrl: string
}

export const BETONZAUN_MODELLE: BetonzaunModell[] = [

  // ── Natursteinoptik ──────────────────────────────────────────────────────────
  {
    nr: '12',
    name: 'Naturstein Classic',
    kategorie: 'Natursteinoptik',
    beschreibung: 'Zeitloser Natursteincharakter, beidseitig strukturiert',
    imageUrl: '/betonzaun/modell-12.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/12.jpg',
  },
  {
    nr: '22',
    name: 'Naturstein Rustikal',
    kategorie: 'Natursteinoptik',
    beschreibung: 'Grob-rustikale Natursteinstruktur für natürliche Optik',
    imageUrl: '/betonzaun/modell-22.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/22.jpg',
  },
  {
    nr: '38',
    name: 'Naturstein Elegance',
    kategorie: 'Natursteinoptik',
    beschreibung: 'Feinteilige Natursteinmaserung, hochwertige Anmutung',
    imageUrl: '/betonzaun/modell-38.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/38.jpg',
  },
  {
    nr: '44',
    name: 'Naturstein Massiv',
    kategorie: 'Natursteinoptik',
    beschreibung: 'Markante Quader-Optik, mediterran und massiv wirkend',
    imageUrl: '/betonzaun/modell-44.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/44.jpg',
  },
  {
    nr: '56',
    name: 'Naturstein Bruch',
    kategorie: 'Natursteinoptik',
    beschreibung: 'Unregelmäßiger Bruchstein-Charakter, individuell wirkend',
    imageUrl: '/betonzaun/modell-56.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/56.jpg',
  },

  // ── Schieferoptik ────────────────────────────────────────────────────────────
  {
    nr: '13',
    name: 'Schiefer Dunkel',
    kategorie: 'Schieferoptik',
    beschreibung: 'Dunkle Schieferplatten-Optik, exklusiv und modern',
    imageUrl: '/betonzaun/modell-13.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/13.jpg',
  },
  {
    nr: '18',
    name: 'Schiefer Riefen',
    kategorie: 'Schieferoptik',
    beschreibung: 'Senkrechte Riefen in Schieferoptik, geradlinig und klar',
    imageUrl: '/betonzaun/modell-18.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/18.jpg',
  },
  {
    nr: '45',
    name: 'Schiefer Classic',
    kategorie: 'Schieferoptik',
    beschreibung: 'Klassische Schieferstruktur, vielseitig einsetzbar',
    imageUrl: '/betonzaun/modell-45.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/45.jpg',
  },

  // ── Holzoptik ────────────────────────────────────────────────────────────────
  {
    nr: '77',
    name: 'Holz Brett',
    kategorie: 'Holzoptik',
    beschreibung: 'Senkrechte Brettstruktur in täuschend echter Holzoptik',
    imageUrl: '/betonzaun/modell-77.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/77.jpg',
  },
  {
    nr: '88',
    name: 'Holz Stamm',
    kategorie: 'Holzoptik',
    beschreibung: 'Baumstamm-Maserung, naturnahe und warme Wirkung',
    imageUrl: '/betonzaun/modell-88.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/88.jpg',
  },

  // ── Splittoptik ──────────────────────────────────────────────────────────────
  {
    nr: '1',
    name: 'Splitt Classic',
    kategorie: 'Splittoptik',
    beschreibung: 'Gewaschener Splittbeton, grobkörnige Körnung, robust',
    imageUrl: '/betonzaun/modell-1.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/1.jpg',
  },
  {
    nr: '35',
    name: 'Splitt Fein',
    kategorie: 'Splittoptik',
    beschreibung: 'Feinere Körnung, gleichmäßige Oberfläche mit Tiefe',
    imageUrl: '/betonzaun/modell-35.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/35.jpg',
  },
  {
    nr: '58',
    name: 'Splitt Kies',
    kategorie: 'Splittoptik',
    beschreibung: 'Kieswaschbeton-Optik, natürlich und pflegeleicht',
    imageUrl: '/betonzaun/modell-58.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/58.jpg',
  },

  // ── Antik & Rustiko ──────────────────────────────────────────────────────────
  {
    nr: '25',
    name: 'Antik Bruchstein',
    kategorie: 'Antik & Rustiko',
    beschreibung: 'Alter Bruchstein-Charme, für historisch geprägte Grundstücke',
    imageUrl: '/betonzaun/modell-25.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/25.jpg',
  },
  {
    nr: '31',
    name: 'Rustiko Klinker',
    kategorie: 'Antik & Rustiko',
    beschreibung: 'Klinker-/Ziegelstein-Optik, warm und traditionell',
    imageUrl: '/betonzaun/modell-31.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/31.jpg',
  },

  // ── Sichtbeton & Glatt ───────────────────────────────────────────────────────
  {
    nr: '4',
    name: 'Sichtbeton Glatt',
    kategorie: 'Sichtbeton & Glatt',
    beschreibung: 'Glatte Oberfläche, zeitgemäß und minimalistisch',
    imageUrl: '/betonzaun/modell-4.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/4.jpg',
  },
  {
    nr: '10',
    name: 'Sichtbeton Riefen',
    kategorie: 'Sichtbeton & Glatt',
    beschreibung: 'Horizontale Riefen auf glatter Basis, schlicht modern',
    imageUrl: '/betonzaun/modell-10.jpg',
    // imageUrl: 'https://www.edelzaun-tor.com/mt-content/uploads/2021/06/10.jpg',
  },
]

export const KATEGORIEN = [
  'Natursteinoptik',
  'Schieferoptik',
  'Holzoptik',
  'Splittoptik',
  'Antik & Rustiko',
  'Sichtbeton & Glatt',
] as const

export type Kategorie = (typeof KATEGORIEN)[number]

// ── Pfeiler-Typen (mit CSS-Visualisierungsdaten) ─────────────────────────────

export type CapVariant = 'flat' | 'pyramid' | 'overhang'

export interface PfeilerTyp {
  value: string
  label: string
  beschreibung: string
  capVariant: CapVariant
  /** Solid hex – für CSS-Dreieck (pyramid only) */
  capColor: string
  /** CSS gradient – für Kappe bei flat/overhang */
  capBg: string
  /** CSS gradient – Schaft. '' = Plattenstruktur übernehmen */
  bodyBg: string
  borderColor: string
}

export const PFEILER_TYPEN: PfeilerTyp[] = [
  {
    value: 'glatt',
    label: 'Standard-Glatt',
    beschreibung: 'Glatte Betonoberfläche – zeitlos universell kombinierbar',
    capVariant: 'flat',
    capColor: '#686868',
    capBg: 'linear-gradient(180deg, #686868 0%, #4e4e4e 100%)',
    bodyBg: 'linear-gradient(90deg, #484848 0%, #5c5c5c 35%, #404040 65%, #4c4c4c 100%)',
    borderColor: '#3a3a3a',
  },
  {
    value: 'struktur',
    label: 'Struktur-Pfeiler',
    beschreibung: 'Gleiche Oberfläche wie die gewählten Platten – harmonisches Gesamtbild',
    capVariant: 'flat',
    capColor: '#5a5a5a',
    capBg: 'linear-gradient(180deg, #5a5a5a 0%, #3e3e3e 100%)',
    bodyBg: '',   // wird dynamisch aus der Plattenstruktur abgeleitet
    borderColor: '#2a2a2a',
  },
  {
    value: 'schmuckhaube',
    label: 'Schmuckhaube',
    beschreibung: 'Elegante Pyramidenkappe – hochwertiger Abschluss nach oben',
    capVariant: 'pyramid',
    capColor: '#8c8c8c',
    capBg: 'linear-gradient(180deg, #8c8c8c 0%, #5c5c5c 100%)',
    bodyBg: 'linear-gradient(90deg, #484848 0%, #5c5c5c 35%, #404040 65%, #4c4c4c 100%)',
    borderColor: '#3a3a3a',
  },
  {
    value: 'naturstein',
    label: 'Naturstein-Pfeiler',
    beschreibung: 'Strukturierte Oberfläche in Natursteinoptik mit breiter Abdeckplatte',
    capVariant: 'overhang',
    capColor: '#5a5040',
    capBg: 'linear-gradient(180deg, #5a5040 0%, #3a3228 100%)',
    bodyBg: 'linear-gradient(158deg, #3d3830 0%, #2d2820 40%, #38332a 70%, #2a2420 100%)',
    borderColor: '#4a4038',
  },
  {
    value: 'rustiko',
    label: 'Rustiko-Pfeiler',
    beschreibung: 'Klinker- / Bruchstein-Optik – traditionell und warm',
    capVariant: 'overhang',
    capColor: '#4a3a28',
    capBg: 'linear-gradient(180deg, #4a3a28 0%, #342a1a 100%)',
    bodyBg: 'linear-gradient(158deg, #2e2618 0%, #241e12 50%, #2c2416 100%)',
    borderColor: '#3e3228',
  },
]

/** Legacy-Alias damit ZaunPlaner.tsx nicht bricht */
export type PfeilerOption = { value: string; label: string; beschreibung: string }
export const PFEILER_OPTIONEN: PfeilerOption[] = PFEILER_TYPEN

// ── Höhe → Reihenanzahl ─────────────────────────────────────────────────────

export const HOEHE_REIHEN: Record<string, number> = {
  '100 cm': 2,
  '125 cm': 3,
  '150 cm': 3,
  '175 cm': 4,
  '200 cm': 4,
  '225 cm': 5,
  '250 cm': 5,
}

export const REIHEN_LABELS: Record<number, string[]> = {
  2: ['Unten', 'Oben'],
  3: ['Unten', 'Mitte', 'Oben'],
  4: ['Unten', 'Mitte-unten', 'Mitte-oben', 'Oben'],
  5: ['Unten', 'Mitte-unten', 'Mitte', 'Mitte-oben', 'Oben'],
}

// ── Betonzaun-Designer: Höhe → Plattenslots (unten→oben, cm) ────────────────

export const HOEHE_PLATTEN: Record<string, Array<50 | 25>> = {
  '100 cm': [50, 50],
  '125 cm': [25, 50, 50],
  '150 cm': [50, 50, 50],
  '175 cm': [25, 50, 50, 50],
  '200 cm': [50, 50, 50, 50],
  '225 cm': [25, 50, 50, 50, 50],
  '250 cm': [50, 50, 50, 50, 50],
}

/** Ab dieser Höhe (ÜBER 2,00 m) Baugenehmigung-Hinweis anzeigen */
export const BAUGENEHMIGUNG_AB = ['225 cm', '250 cm'] as const

export const DESIGNER_HOEHEN = [
  { value: '100 cm', label: '1,00 m' },
  { value: '125 cm', label: '1,25 m' },
  { value: '150 cm', label: '1,50 m' },
  { value: '175 cm', label: '1,75 m' },
  { value: '200 cm', label: '2,00 m' },
  { value: '225 cm', label: '2,25 m' },
  { value: '250 cm', label: '2,50 m' },
]

// ── Kategorie-Texturen für CSS-Platzhalter ───────────────────────────────────

export interface KatTextur {
  bg: string
  mortar: string
  textColor: string
  accentColor: string
}

export const KAT_TEXTUREN: Record<string, KatTextur> = {
  'Natursteinoptik': {
    bg: 'linear-gradient(158deg, #3d3830 0%, #2d2820 40%, #38332a 70%, #2a2420 100%)',
    mortar: 'rgba(16,12,8,0.4)',
    textColor: '#9a8870',
    accentColor: '#7a6850',
  },
  'Schieferoptik': {
    bg: 'linear-gradient(158deg, #272828 0%, #1e1e1e 50%, #252626 100%)',
    mortar: 'rgba(0,0,0,0.45)',
    textColor: '#6a6a72',
    accentColor: '#5a5a62',
  },
  'Holzoptik': {
    bg: 'linear-gradient(180deg, #3e2e1c 0%, #2e2214 45%, #382a18 80%, #3a2c1a 100%)',
    mortar: 'rgba(20,10,4,0.35)',
    textColor: '#8a6844',
    accentColor: '#7a5838',
  },
  'Splittoptik': {
    bg: 'linear-gradient(158deg, #353535 0%, #292929 50%, #313131 100%)',
    mortar: 'rgba(0,0,0,0.3)',
    textColor: '#686868',
    accentColor: '#585858',
  },
  'Antik & Rustiko': {
    bg: 'linear-gradient(158deg, #2e2618 0%, #241e12 50%, #2c2416 100%)',
    mortar: 'rgba(16,12,6,0.38)',
    textColor: '#7a6a50',
    accentColor: '#6a5a40',
  },
  'Sichtbeton & Glatt': {
    bg: 'linear-gradient(180deg, #3c3c3c 0%, #2e2e2e 100%)',
    mortar: 'rgba(0,0,0,0.12)',
    textColor: '#787878',
    accentColor: '#686868',
  },
}

export const LEER_TEXTUR: KatTextur = {
  bg: 'linear-gradient(180deg, #232323 0%, #1c1c1c 100%)',
  mortar: 'rgba(0,0,0,0.2)',
  textColor: '#383838',
  accentColor: '#303030',
}

// ── Stücklisten-Berechnung ─────────────────────────────────────────────────

export interface Stueckliste {
  felder: number      // Anzahl Felder (à 2 m)
  pfosten: number     // Pfosten gesamt
  plattenProReihe: number
  reihen: number
  plattenGesamt: number
  laengeMeter: number
}

export function berechneStueckliste(laengeStr: string, hoeheStr: string, ecken: number): Stueckliste | null {
  const laenge = parseFloat(laengeStr)
  if (!laenge || !hoeheStr || laenge <= 0) return null
  const reihen = HOEHE_REIHEN[hoeheStr] ?? 3
  const felder = Math.ceil(laenge / 2)
  const pfosten = felder + 1 + ecken
  const plattenProReihe = felder
  const plattenGesamt = felder * reihen
  return { felder, pfosten, plattenProReihe, reihen, plattenGesamt, laengeMeter: laenge }
}

// ── Farbpalette (Caparol Color 2001 + RAL-Standards) ────────────────────────

/** Lineare Hex-Interpolation (t ∈ [0, 1]) */
function hexLerp(h1: string, h2: string, t: number): string {
  const p = (s: string, o: number) => parseInt(s.slice(o, o + 2), 16)
  const r = Math.round(p(h1, 1) + (p(h2, 1) - p(h1, 1)) * t)
  const g = Math.round(p(h1, 3) + (p(h2, 3) - p(h1, 3)) * t)
  const b = Math.round(p(h1, 5) + (p(h2, 5) - p(h1, 5)) * t)
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export interface FarbTon {
  nr: number    // 0–18
  key: string   // 'kiesel_15', 'graphit_12' etc.
  hex: string
}

export interface FarbFamilie {
  key: string
  name: string
  beschreibung: string
  tones: FarbTon[]
}

export interface SonderFarbe {
  key: string
  label: string
  hex: string
}

// ── Familien-Definitionen: [key, name, beschreibung, hellstes, dunkelstes] ──
//
// Um eine neue Farbgruppe hinzuzufügen, einen weiteren Eintrag in FAMILIEN_DEF
// eintragen: [schlüssel, anzeigename, kurzbeschreibung, hellster-hex, dunkelster-hex]
// Die 19 Zwischentöne (0–18) werden automatisch interpoliert.

const FAMILIEN_DEF: [string, string, string, string, string][] = [
  // ── Grau- & Neutrale Töne ────────────────────────────────────────────────
  ['basalt',     'Basalt',     'Dunkle Basalt- & Schiefergrautöne',                  '#c8c8c0', '#181e18'],
  ['graphit',    'Graphit',    'Klassische neutrale Grautöne',                       '#d8d8d6', '#282828'],
  ['jura',       'Jura',       'Kühle Kalkstein- & Felstöne',                        '#ccd4dc', '#182438'],
  ['kiesel',     'Kiesel',     'Natürliche Steingrautöne – zeitlos & harmonisch',    '#e8e4da', '#524840'],
  ['platin',     'Platin',     'Helle Platin- & Silbergrautöne',                     '#e4e4e0', '#5a5a50'],
  ['schiefer',   'Schiefer',   'Kühle Schiefergrautöne – modern & klar',             '#d2d6dc', '#262e38'],
  ['taupe',      'Taupe',      'Zeitlose Taupetöne – warmes Graubraun',              '#dcd4c4', '#6a5e4a'],

  // ── Weiß-, Beige- & Elfenbeintöne ───────────────────────────────────────
  ['cashmere',   'Cashmere',   'Weiche Warm-Beigetöne – edel & zurückhaltend',       '#f0dcc8', '#8a5e28'],
  ['elfenbein',  'Elfenbein',  'Helle Elfenbein- & Cremetöne',                       '#f8f0dc', '#b08848'],
  ['nougat',     'Nougat',     'Weiche Nougat- & Karamelltöne',                      '#e8d0a8', '#583010'],
  ['sandstein',  'Sandstein',  'Natürliche Sandsteintöne',                           '#f4e0c0', '#987030'],
  ['vanille',    'Vanille',    'Helle Vanille- & Cremegelbttöne',                    '#f8f4d4', '#b09040'],

  // ── Gelb- & Ocker­töne ───────────────────────────────────────────────────
  ['basar',      'Basar',      'Orientalische Ocker- & Goldtöne',                    '#f0d890', '#7a4800'],
  ['ceylon',     'Ceylon',     'Warme Tee- & Goldtöne',                              '#f4e098', '#7a4400'],
  ['lemon',      'Lemon',      'Frische Zitronengelbttöne',                          '#f8f4a0', '#888000'],
  ['ocker',      'Ocker',      'Natürliche Ockergelbtöne',                           '#f0d870', '#785000'],
  ['safran',     'Safran',     'Edle Safran- & Goldgelbtöne',                        '#f8e080', '#9a5000'],
  ['savanne',    'Savanne',    'Warme Savannentöne – Gelbbeige',                     '#ecdcb0', '#786020'],

  // ── Orange- & Aprikose­töne ──────────────────────────────────────────────
  ['aprikose',   'Aprikose',   'Warme Aprikosen- & Orangetöne',                      '#f8d4a8', '#c84808'],
  ['mandarin',   'Mandarin',   'Lebhafte Orangetöne',                                '#f8cca0', '#b84000'],

  // ── Braun- & Erdtöne ─────────────────────────────────────────────────────
  ['barbados',   'Barbados',   'Warme Sandtöne – karibisch & sonnig',                '#eadab0', '#6a4010'],
  ['havanna',    'Havanna',    'Warme Kaffeebrauntöne – mediterran & gemütlich',     '#e4d6c2', '#3c2412'],
  ['mahagoni',   'Mahagoni',   'Edles Mahagoni- & Rotbraun',                         '#dcc0a0', '#481408'],
  ['mocca',      'Mocca',      'Warme Kaffeebrauntöne',                              '#d8c4a8', '#382008'],
  ['sahara',     'Sahara',     'Warme Sandtöne – leicht & einladend',                '#ecdcbe', '#7a5020'],
  ['sienna',     'Sienna',     'Natürliche Siennabrauntöne',                         '#e8c4a0', '#682808'],

  // ── Rot- & Terrakottatöne ────────────────────────────────────────────────
  ['bordeaux',   'Bordeaux',   'Tiefe Wein- & Bordeauxrote',                         '#e0b8bc', '#580a12'],
  ['canyon',     'Canyon',     'Warme Terrakotta- & Lehmtöne',                       '#f0c8a0', '#7a2400'],
  ['chili',      'Chili',      'Intensive Rottöne – feurig',                         '#f4c0b8', '#840808'],
  ['coral',      'Koralle',    'Warme Korallen- & Lachstöne',                        '#f8d0bc', '#c44820'],
  ['granat',     'Granat',     'Kräftige Granatrote – auffallend & edel',            '#e8d0cc', '#5c2418'],
  ['ingwer',     'Ingwer',     'Warme Ingwer- & Terrakottatöne',                     '#ecdec8', '#642e10'],
  ['rubin',      'Rubin',      'Edle Rubinrottöne',                                  '#ecccc8', '#640810'],
  ['terrakotta', 'Terrakotta', 'Klassische Terrakottarottöne',                       '#f0c4a0', '#882808'],
  ['weinrot',    'Weinrot',    'Tiefe Weinrottöne',                                  '#e8c0c8', '#680818'],

  // ── Pink & Rose ──────────────────────────────────────────────────────────
  ['rose',       'Rose',       'Zarte Rosé- & Altrosatöne',                          '#f4c8d4', '#981850'],

  // ── Violett- & Lavendeltöne ──────────────────────────────────────────────
  ['iris',       'Iris',       'Kühle Blauviolett-Töne – ruhig & modern',            '#d4d4ec', '#1e2060'],
  ['lavendel',   'Lavendel',   'Romantische Lavendel­violett­töne',                  '#dcd0ee', '#3a2470'],
  ['veilchen',   'Veilchen',   'Romantische Veilchen­violett­töne',                  '#dcc8ec', '#3c1068'],

  // ── Blau­töne ────────────────────────────────────────────────────────────
  ['azur',       'Azur',       'Helle Himmelsblaue Töne',                            '#c0d8f4', '#0a2860'],
  ['capri',      'Capri',      'Mediterranes Intensivblau',                          '#a8cef0', '#062258'],
  ['denim',      'Denim',      'Klassische Denimblautöne',                           '#c0cce0', '#122040'],
  ['pacific',    'Pazifik',    'Tiefe Ozeanblautöne',                                '#aac8e4', '#061c40'],
  ['petrol',     'Petrol',     'Zeitgemäße Petrolblau-Grüntöne',                     '#b4ccd8', '#0c2c38'],
  ['polo',       'Polo',       'Klassische Navy- & Dunkelblautöne',                  '#b4c0d8', '#0a1638'],

  // ── Blaugrün- & Türkistöne ────────────────────────────────────────────────
  ['aqua',       'Aqua',       'Frische Aqua- & Türkistöne',                         '#b8e8e4', '#0a5060'],
  ['garda',      'Garda',      'Helles See- & Seladonblau',                          '#b4d8e8', '#082840'],
  ['galapagos',  'Galapagos',  'Tiefe Teal- & Meeresgrüntöne',                       '#a8d4c4', '#083028'],
  ['tuerkis',    'Türkis',     'Frische Türkistöne',                                 '#b0e4e0', '#083c48'],

  // ── Grüntöne ─────────────────────────────────────────────────────────────
  ['amazonas',   'Amazonas',   'Tropische Grüntöne – saftig & lebendig',             '#c0d8be', '#184818'],
  ['jade',       'Jade',       'Edle Jadegrüntöne',                                  '#b8dcc8', '#103c28'],
  ['kaktus',     'Kaktus',     'Natürliche Kaktusgrüntöne',                          '#c4d8b4', '#183410'],
  ['mint',       'Mint',       'Frische Grüntöne – lebendig & natürlich',            '#d4e2da', '#1c4028'],
  ['olive',      'Olive',      'Natürliche Olivtöne – naturnah & stilvoll',          '#dcdad0', '#383818'],
]

// ── Exakte Hex-Werte für Caparol Color 2001 Hauptfamilien ────────────────────
// Schattierungen 0 (hellst) bis 18 (dunkelst), angelehnt an die Original-Farbfächer.
// Alle weiteren Familien werden per hexLerp interpoliert.
// Format: FAMILIEN_EXACT[familienKey] = [hex_0, hex_1, ..., hex_18]

const FAMILIEN_EXACT: Partial<Record<string, string[]>> = {
  graphit: [
    '#F4F4F2', '#EAEAE8', '#E0E0DE', '#D5D5D3', '#CACAC8', '#BFBFBD',
    '#B4B4B2', '#A9A9A7', '#9E9E9C', '#939391', '#888886', '#7D7D7B',
    '#727270', '#676765', '#5C5C5A', '#4E4E4C', '#3E3E3C', '#2E2E2C', '#1E1E1C',
  ],
  havanna: [
    '#F8EFE4', '#F0DECC', '#E8CCB4', '#DCB898', '#CFA27E', '#BF8C64',
    '#AD764C', '#9B6236', '#895024', '#773E14', '#653008', '#552404',
    '#461A02', '#381202', '#2C0E00', '#220A00', '#1A0700', '#130500', '#0D0300',
  ],
  kiesel: [
    '#F2EEE7', '#E8E3DA', '#DDD8CE', '#D2CDC3', '#C8C2B8', '#BDB7AC',
    '#B2ACA1', '#A7A196', '#9C968B', '#918B80', '#868075', '#7B756A',
    '#70695F', '#655E54', '#5A5349', '#4E473D', '#3E3830', '#2E2922', '#1E1A14',
  ],
  amazonas: [
    '#ECF3E8', '#D9E8D2', '#C5DCBA', '#B1D0A4', '#9CC48C', '#88B876',
    '#74AB60', '#619E4A', '#4F9136', '#3E8424', '#2F7714', '#226A08',
    '#175D02', '#0F5000', '#094400', '#053800', '#022E00', '#012500', '#001C00',
  ],
  aprikose: [
    '#FDF3E8', '#FAE6D0', '#F7D8B6', '#F3C89A', '#EEB67E', '#E8A162',
    '#E08B48', '#D77532', '#CB5F1E', '#BE4B0C', '#AF3904', '#9F2900',
    '#8E1C00', '#7D1100', '#6C0900', '#5B0400', '#4A0200', '#3A0100', '#2A0000',
  ],
}

export const FARB_FAMILIEN: FarbFamilie[] = FAMILIEN_DEF.map(
  ([key, name, beschreibung, light, dark]) => ({
    key, name, beschreibung,
    tones: Array.from({ length: 19 }, (_, i) => ({
      nr: i,
      key: `${key}_${i}`,
      hex: FAMILIEN_EXACT[key]?.[i] ?? hexLerp(light, dark, i / 18),
    })),
  }),
)

export const SONDER_FARBEN: SonderFarbe[] = [
  { key: 'weiss',     label: 'Weiß (RAL 9010)',      hex: '#f0f0ec' },
  { key: 'anthrazit', label: 'Anthrazit (RAL 7016)', hex: '#38393e' },
]

/** Favoriten – werden im Favoriten-Tab des Farbfächers angezeigt. */
export const FARB_FAVORITEN: string[] = [
  'weiss',
  'anthrazit',
  'graphit_6',
  'graphit_12',
  'graphit_15',
  'kiesel_6',
  'kiesel_12',
  'kiesel_15',
  'havanna_9',
  'amazonas_9',
  'amazonas_12',
  'aprikose_7',
]

/** Die fünf Hauptgruppen, die im Tab-Farbfächer erscheinen. */
export const FARB_TAB_GRUPPEN = ['graphit', 'havanna', 'kiesel', 'amazonas', 'aprikose'] as const
export type FarbTabGruppe = (typeof FARB_TAB_GRUPPEN)[number]

// ── Lookup-Maps (einmalig beim Modulaufruf aufgebaut) ─────────────────────────

import { alleNuancen, SONDER_FARBEN_KARTE } from '@/src/constants/betonzaun-farben'
import { allePaletteNuancen, PALETTE_SONDER_FARBEN } from '@/src/constants/caparolColorPalette'

const _HEX: Record<string, string> = {}
const _LABEL: Record<string, string> = {}

for (const s of SONDER_FARBEN) { _HEX[s.key] = s.hex; _LABEL[s.key] = s.label }
for (const f of FARB_FAMILIEN) {
  for (const t of f.tones) {
    _HEX[t.key]   = t.hex
    _LABEL[t.key] = `${f.name} ${t.nr}`
  }
}
// Ergänze Karten-Familien (Gobi, Mars, Madeira, etc.) die nicht in FAMILIEN_DEF sind
for (const n of alleNuancen()) {
  if (!_HEX[n.key])   _HEX[n.key]   = n.hex
  if (!_LABEL[n.key]) _LABEL[n.key] = n.name
}
for (const s of SONDER_FARBEN_KARTE) {
  if (!_LABEL[s.key]) _LABEL[s.key] = s.name
  if (!_HEX[s.key])   _HEX[s.key]   = s.hex
}
// Ergänze Caparol-Palette (farben.jpg – alle 25 Familien, Töne 0/12-18)
for (const n of allePaletteNuancen()) {
  if (!_HEX[n.key])   _HEX[n.key]   = n.hex
  if (!_LABEL[n.key]) _LABEL[n.key] = n.name
}
for (const s of PALETTE_SONDER_FARBEN) {
  if (!_LABEL[s.key]) _LABEL[s.key] = s.name
  if (!_HEX[s.key])   _HEX[s.key]   = s.hex
}
_LABEL['betongrau']   = 'Betongrau (natur)'
_LABEL['individuell'] = 'Individueller Farbwunsch'
_LABEL['gleich']      = 'Gleich wie Zaunfelder'

/** Gibt den Hex-Wert zurück; '' wenn keine Beschichtung (betongrau/leer). */
export function getFarbHex(key: string): string {
  if (!key || key === 'betongrau' || key === 'gleich') return ''
  if (key === 'individuell') return '#800020'
  return _HEX[key] ?? ''
}

/** Gibt das menschenlesbare Label zurück. */
export function getFarbLabel(key: string): string {
  if (!key || key === 'betongrau') return 'Betongrau (natur)'
  return _LABEL[key] ?? key
}
