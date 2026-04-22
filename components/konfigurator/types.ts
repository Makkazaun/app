export type Produkt = 'betonzaun' | 'doppelstabmatte' | 'schmiedekunst' | ''
export type Montage = 'mit' | 'ohne' | ''

export interface EbenenKonfig {
  modellNr: string
  modellName: string
}

export interface PlattenSlot {
  id: string
  hoehe: 50 | 25        // cm – Plattenhöhe
  modellNr: string
  modellName: string
}

export interface BetonzaunConfig {
  struktur: 'einseitig' | 'beidseitig' | ''
  muster: string         // Primärmodell-Name (aus Slot 0)
  modellNr: string       // Primärmodell-Nr  (aus Slot 0)
  ebenen: EbenenKonfig[] // Legacy – ZaunPlaner
  pfeiler: string
  platten: PlattenSlot[] // Designer – Schablonen-Slots (unten→oben)
  farbgebung: string     // Legacy – nicht mehr primär genutzt
  farbePlatten: string   // Schlüssel aus FARB_OPTIONEN ('' = betongrau/natur)
  farbePfeiler: string   // Schlüssel aus FARB_OPTIONEN oder 'gleich'
  farbeIndividuell: string  // Freitext wenn farbePlatten/farbePfeiler = 'individuell'
  hoehe: string
  laenge: string
  ecken: number
  untergrund: string
  montage: Montage
}

export interface DoppelstabConfig {
  hoehe: string
  laenge: string
  farbe: string
  montage: Montage
}

export interface SchmiedekunstConfig {
  hoehe: string
  laenge: string
  designWunsch: string
  montage: Montage
}

export interface TorConfig {
  gewuenscht: boolean | null
  typ: 'schiebetor' | 'flugeltor' | 'einfahrtstor' | ''
  breite: string
  hoehe: string
  antrieb: boolean | null
}

export interface TuerConfig {
  gewuenscht: boolean | null
  breite: string
  hoehe: string
}

export interface KontaktData {
  vorname: string
  nachname: string
  email: string
  telefon: string
  plz: string
  ort: string
  nachricht: string
  datenschutz: boolean
}

export interface FormData {
  produkt: Produkt
  betonzaun: BetonzaunConfig
  doppelstab: DoppelstabConfig
  schmiedekunst: SchmiedekunstConfig
  tor: TorConfig
  tuer: TuerConfig
  dateien: File[]
  kontakt: KontaktData
}

export const INITIAL_FORM_DATA: FormData = {
  produkt: '',
  betonzaun: {
    struktur: '', muster: '', modellNr: '', ebenen: [], pfeiler: '', platten: [],
    farbgebung: '', farbePlatten: '', farbePfeiler: 'gleich', farbeIndividuell: '',
    hoehe: '', laenge: '', ecken: 0, untergrund: '', montage: '',
  },
  doppelstab: { hoehe: '', laenge: '', farbe: '', montage: '' },
  schmiedekunst: { hoehe: '', laenge: '', designWunsch: '', montage: '' },
  tor: { gewuenscht: null, typ: '', breite: '', hoehe: '', antrieb: null },
  tuer: { gewuenscht: null, breite: '', hoehe: '' },
  dateien: [],
  kontakt: {
    vorname: '', nachname: '', email: '', telefon: '',
    plz: '', ort: '', nachricht: '', datenschutz: false,
  },
}
