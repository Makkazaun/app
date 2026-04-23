'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import FieldLabel from './FieldLabel'
import {
  BETONZAUN_MODELLE,
  KATEGORIEN,
  PFEILER_OPTIONEN,
  HOEHE_REIHEN,
  REIHEN_LABELS,
  berechneStueckliste,
  type BetonzaunModell,
} from './betonzaun-modelle'
import type { FormData, EbenenKonfig } from './types'

interface Props {
  data: FormData
  update: (d: Partial<FormData>) => void
}

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function getModell(nr: string): BetonzaunModell | undefined {
  return BETONZAUN_MODELLE.find((m) => m.nr === nr)
}

function updateEbene(data: FormData, update: Props['update'], idx: number, konfig: EbenenKonfig) {
  const neu = [...data.betonzaun.ebenen]
  neu[idx] = konfig
  // Sync primary muster/modellNr from layer 0
  const primär = neu[0] ?? konfig
  update({
    betonzaun: {
      ...data.betonzaun,
      ebenen: neu,
      muster:   primär.modellName,
      modellNr: primär.modellNr,
    },
  })
}

// ── Kompakter Modell-Picker (inline Dropdown für eine Reihe) ─────────────────

function KompaktPicker({
  currentNr,
  onSelect,
  onClose,
}: {
  currentNr: string
  onSelect: (m: BetonzaunModell) => void
  onClose: () => void
}) {
  const [kat, setKat] = useState<string>('Natursteinoptik')
  const modelle = BETONZAUN_MODELLE.filter((m) => m.kategorie === kat)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #3d3d3d', background: '#1c1c1c' }}>
      {/* Kategorie-Tabs */}
      <div className="flex gap-1 p-2 overflow-x-auto" style={{ borderBottom: '1px solid #2a2a2a' }}>
        {KATEGORIEN.map((k) => (
          <button key={k} type="button" onClick={() => setKat(k)}
            className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{
              background: kat === k ? 'rgba(128,0,32,0.15)' : 'transparent',
              border: kat === k ? '1px solid #800020' : '1px solid transparent',
              color: kat === k ? '#800020' : '#5a5a5a',
            }}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Modell-Grid */}
      <div className="grid grid-cols-3 gap-2 p-2">
        {modelle.map((m) => {
          const sel = m.nr === currentNr
          return (
            <button key={m.nr} type="button" onClick={() => { onSelect(m); onClose() }}
              className="rounded-lg overflow-hidden transition-all active:scale-95"
              style={{
                border: sel ? '2px solid #800020' : '1px solid #2d2d2d',
                background: '#141414',
              }}
            >
              <div className="relative w-full" style={{ paddingBottom: '60%', background: '#222' }}>
                <Image src={m.imageUrl} alt={m.name} fill sizes="100px" className="object-cover"
                  onError={() => {}} />
                {sel && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(128,0,32,0.2)' }}
                  >
                    <span className="text-sm font-bold" style={{ color: '#800020' }}>✓</span>
                  </div>
                )}
              </div>
              <p className="text-xs p-1 truncate text-center" style={{ color: sel ? '#800020' : '#7a7a7a' }}>
                {m.name}
              </p>
            </button>
          )
        })}
      </div>

      <div className="px-3 pb-2 flex justify-end">
        <button type="button" onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: '#2a2a2a', color: '#5a5a5a' }}
        >
          Schließen
        </button>
      </div>
    </div>
  )
}

// ── Reihen-Zeile ─────────────────────────────────────────────────────────────

function ReihenZeile({
  label,
  ebene,
  isTop,
  isBottom,
  onChange,
}: {
  label: string
  ebene: EbenenKonfig
  isTop: boolean
  isBottom: boolean
  onChange: (e: EbenenKonfig) => void
}) {
  const [open, setOpen] = useState(false)
  const modell = getModell(ebene.modellNr)

  return (
    <div>
      <div className="flex items-center gap-3 p-3 rounded-xl transition-all"
        style={{
          background: '#1e1e1e',
          border: open ? '1px solid #800020' : '1px solid #2d2d2d',
          borderRadius: open ? '12px 12px 0 0' : '12px',
        }}
      >
        {/* Reihen-Badge */}
        <div className="flex-shrink-0 w-16 text-center">
          <span className="block text-xs font-bold" style={{ color: '#5a5a5a' }}>{label}</span>
          {isTop && <span className="text-xs" style={{ color: '#3a3a3a' }}>↑ Oben</span>}
          {isBottom && <span className="text-xs" style={{ color: '#3a3a3a' }}>↓ Unten</span>}
        </div>

        {/* Modell-Vorschau */}
        {modell ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-12 h-8 rounded-md overflow-hidden flex-shrink-0 relative"
              style={{ background: '#222' }}
            >
              <Image src={modell.imageUrl} alt={modell.name} fill sizes="48px" className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#d0d0d0' }}>{modell.name}</p>
              <p className="text-xs" style={{ color: '#4a4a4a' }}>Nr. {modell.nr}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <div className="w-12 h-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: '#252525', border: '1px dashed #333' }}
            >
              <span style={{ color: '#3a3a3a', fontSize: '10px' }}>?</span>
            </div>
            <p className="text-sm" style={{ color: '#4a4a4a' }}>Kein Modell gewählt</p>
          </div>
        )}

        {/* Aktion */}
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: open ? 'rgba(128,0,32,0.12)' : '#252525',
            border: open ? '1px solid rgba(128,0,32,0.3)' : '1px solid #333',
            color: open ? '#800020' : '#7a7a7a',
          }}
        >
          {open ? 'Schließen' : modell ? 'Ändern' : 'Wählen'}
        </button>
      </div>

      {open && (
        <KompaktPicker
          currentNr={ebene.modellNr}
          onSelect={(m) => onChange({ modellNr: m.nr, modellName: m.name })}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

// ── Live-Vorschau ────────────────────────────────────────────────────────────

function LiveVorschau({ ebenen, pfeiler }: { ebenen: EbenenKonfig[]; pfeiler: string }) {
  // 3 Felder nebeneinander zeigen
  const FELDER = 3
  const layersFromBottom = [...ebenen].reverse() // Unten = index 0 → unterste Reihe

  return (
    <div>
      <FieldLabel>Live-Vorschau</FieldLabel>
      <div className="rounded-xl overflow-hidden p-4"
        style={{ background: '#141414', border: '1px solid #222' }}
      >
        {/* Himmel */}
        <div className="h-3" />

        {/* Zaun */}
        <div className="flex items-end justify-center gap-0">
          {Array.from({ length: FELDER + 1 }).map((_, fi) => (
            <div key={`pfosten-${fi}`} className="flex items-end gap-0">
              {/* Pfosten */}
              <div
                className="flex-shrink-0 rounded-sm"
                style={{
                  width: '14px',
                  height: `${ebenen.length * 44 + 16}px`,
                  background: 'linear-gradient(180deg, #4a4a4a, #2a2a2a)',
                  boxShadow: '1px 0 3px rgba(0,0,0,0.5)',
                }}
              >
                {/* Pfosten-Kappe */}
                <div className="w-full h-2 rounded-t-sm" style={{ background: '#5a5a5a' }} />
              </div>

              {/* Feld (außer nach dem letzten Pfosten) */}
              {fi < FELDER && (
                <div className="flex flex-col-reverse flex-shrink-0" style={{ width: '72px' }}>
                  {layersFromBottom.map((eb, li) => {
                    const m = getModell(eb.modellNr)
                    return (
                      <div key={li}
                        className="relative overflow-hidden"
                        style={{
                          height: '44px',
                          background: '#2a2a2a',
                          borderTop: li > 0 ? '1px solid rgba(0,0,0,0.4)' : 'none',
                        }}
                      >
                        {m ? (
                          <Image
                            src={m.imageUrl}
                            alt={m.name}
                            fill
                            sizes="72px"
                            className="object-cover opacity-80"
                            onError={() => {}}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"
                            style={{ background: 'repeating-linear-gradient(45deg, #222 0px, #222 4px, #262626 4px, #262626 8px)' }}
                          >
                            <span className="text-xs" style={{ color: '#3a3a3a' }}>–</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Boden */}
        <div className="h-2 rounded-b-lg" style={{ background: 'linear-gradient(180deg, #1e1a0a, #141414)' }} />

        {/* Legende */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {layersFromBottom.slice().reverse().map((eb, li) => {
            const label = (REIHEN_LABELS[ebenen.length] ?? [])[ebenen.length - 1 - li] ?? `Reihe ${li + 1}`
            const m = getModell(eb.modellNr)
            return (
              <div key={li} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm overflow-hidden relative flex-shrink-0"
                  style={{ background: '#2a2a2a' }}
                >
                  {m && <Image src={m.imageUrl} alt="" fill sizes="12px" className="object-cover" />}
                </div>
                <span className="text-xs" style={{ color: '#4a4a4a' }}>
                  {label}: {m ? m.name : '–'}
                </span>
              </div>
            )
          })}
          {pfeiler && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ background: 'linear-gradient(180deg, #4a4a4a, #2a2a2a)' }} />
              <span className="text-xs" style={{ color: '#4a4a4a' }}>
                Pfeiler: {PFEILER_OPTIONEN.find((p) => p.value === pfeiler)?.label ?? pfeiler}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Stückliste ───────────────────────────────────────────────────────────────

function StuecklistenAnzeige({
  laenge,
  hoehe,
  ecken,
  ebenen,
}: {
  laenge: string
  hoehe: string
  ecken: number
  ebenen: EbenenKonfig[]
}) {
  const sl = berechneStueckliste(laenge, hoehe, ecken)
  if (!sl) return null

  // Per-Reihe Aufschlüsselung
  const labels = REIHEN_LABELS[sl.reihen] ?? []

  return (
    <div>
      <FieldLabel>Automatische Stückliste</FieldLabel>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d2d2d' }}>
        {/* Kopfzeile */}
        <div className="px-4 py-2.5 flex items-center justify-between"
          style={{ background: '#1e1e1e', borderBottom: '1px solid #2a2a2a' }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7a7a7a' }}>
            Stückliste · {sl.laengeMeter} m Zaun
          </span>
          <span className="text-xs" style={{ color: '#3a3a3a' }}>
            Feldbreite: 2 m
          </span>
        </div>

        <div className="divide-y" style={{ borderColor: '#1e1e1e' }}>
          {/* Pfosten */}
          <SLZeile
            label="Pfosten"
            sub={`${sl.felder} Felder + 1 Abschluss + ${ecken} Eck${ecken === 1 ? 'e' : 'en'}`}
            menge={sl.pfosten}
            einheit="Stück"
            highlight
          />

          {/* Platten pro Reihe */}
          {labels.map((label, li) => {
            const eb = ebenen[li]
            const m = eb ? getModell(eb.modellNr) : undefined
            return (
              <SLZeile
                key={li}
                label={`Platten – ${label}`}
                sub={m ? `${m.name} (Nr. ${m.nr})` : 'Kein Modell gewählt'}
                menge={sl.plattenProReihe}
                einheit="Stück"
                modellBild={m?.imageUrl}
              />
            )
          })}

          {/* Summe */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: '#1a1a1a' }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: '#e0e0e0' }}>Platten gesamt</p>
              <p className="text-xs mt-0.5" style={{ color: '#4a4a4a' }}>{sl.reihen} Reihen × {sl.plattenProReihe} Felder</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold" style={{ color: '#800020' }}>{sl.plattenGesamt}</span>
              <span className="text-xs ml-1" style={{ color: '#5a5a5a' }}>Stück</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs mt-2" style={{ color: '#3a3a3a' }}>
        * Richtmengen, inkl. je {ecken} Eckpfosten. Exakte Mengen nach Aufmaß.
      </p>
    </div>
  )
}

function SLZeile({
  label, sub, menge, einheit, highlight, modellBild,
}: {
  label: string; sub: string; menge: number; einheit: string
  highlight?: boolean; modellBild?: string
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#161616' }}>
      {modellBild ? (
        <div className="w-8 h-6 rounded overflow-hidden relative flex-shrink-0" style={{ background: '#222' }}>
          <Image src={modellBild} alt="" fill sizes="32px" className="object-cover" />
        </div>
      ) : (
        <div className="w-8 h-6 rounded flex-shrink-0"
          style={{ background: highlight ? 'linear-gradient(180deg,#4a4a4a,#2a2a2a)' : '#202020' }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: '#c8c8c8' }}>{label}</p>
        <p className="text-xs truncate" style={{ color: '#4a4a4a' }}>{sub}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-base font-bold" style={{ color: highlight ? '#e0e0e0' : '#9a9a9a' }}>{menge}</span>
        <span className="text-xs ml-1" style={{ color: '#4a4a4a' }}>{einheit}</span>
      </div>
    </div>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function ZaunPlaner({ data, update }: Props) {
  const bz = data.betonzaun
  const reihenAnzahl = HOEHE_REIHEN[bz.hoehe] ?? 0
  const reihenLabels = REIHEN_LABELS[reihenAnzahl] ?? []

  // Ebenen-Array an Reihenanzahl anpassen wenn Höhe sich ändert
  useEffect(() => {
    if (!bz.hoehe || reihenAnzahl === 0) return
    if (bz.ebenen.length === reihenAnzahl) return

    const vorhanden = bz.ebenen
    const template: EbenenKonfig = vorhanden[0] ?? { modellNr: '', modellName: '' }
    const neu: EbenenKonfig[] = Array.from({ length: reihenAnzahl }, (_, i) =>
      vorhanden[i] ?? { ...template }
    )
    update({ betonzaun: { ...bz, ebenen: neu } })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bz.hoehe])

  // Nicht anzeigen wenn Höhe oder Länge fehlen
  if (!bz.hoehe || !bz.laenge) {
    return (
      <div className="rounded-xl p-5 text-center" style={{ background: '#161616', border: '1px dashed #2a2a2a' }}>
        <p className="text-sm" style={{ color: '#4a4a4a' }}>
          Bitte zuerst <strong style={{ color: '#6a6a6a' }}>Höhe</strong> und{' '}
          <strong style={{ color: '#6a6a6a' }}>Gesamtlänge</strong> angeben.
        </p>
      </div>
    )
  }

  if (reihenAnzahl === 0 || bz.ebenen.length !== reihenAnzahl) return null

  return (
    <div className="space-y-6">

      {/* Reihen-Konfiguration */}
      <div>
        <FieldLabel>Modell pro Reihe</FieldLabel>
        <p className="text-xs mb-4" style={{ color: '#4a4a4a' }}>
          {reihenAnzahl} Reihen à 50 cm · Jede Ebene kann ein anderes Modell haben.
        </p>
        <div className="space-y-2">
          {/* Oben → Unten anzeigen (UI-Reihenfolge) */}
          {[...bz.ebenen].reverse().map((eb, rIdx) => {
            const realIdx = reihenAnzahl - 1 - rIdx
            const label = reihenLabels[realIdx] ?? `Reihe ${realIdx + 1}`
            return (
              <ReihenZeile
                key={realIdx}
                label={label}
                ebene={eb}
                isTop={realIdx === reihenAnzahl - 1}
                isBottom={realIdx === 0}
                onChange={(neu) => updateEbene(data, update, realIdx, neu)}
              />
            )
          })}
        </div>
      </div>

      {/* Pfeiler */}
      <div>
        <FieldLabel>Pfeiler</FieldLabel>
        <div className="grid grid-cols-1 gap-2">
          {PFEILER_OPTIONEN.map((p) => (
            <button key={p.value} type="button"
              onClick={() => update({ betonzaun: { ...bz, pfeiler: p.value } })}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{
                background: bz.pfeiler === p.value ? 'rgba(128,0,32,0.08)' : '#1a1a1a',
                border: bz.pfeiler === p.value ? '1px solid rgba(128,0,32,0.35)' : '1px solid #2a2a2a',
              }}
            >
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: bz.pfeiler === p.value ? '#800020' : '#3a3a3a',
                  background: bz.pfeiler === p.value ? '#800020' : 'transparent',
                }}
              >
                {bz.pfeiler === p.value && (
                  <span style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700 }}>✓</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: bz.pfeiler === p.value ? '#800020' : '#c0c0c0' }}>
                  {p.label}
                </p>
                <p className="text-xs" style={{ color: '#4a4a4a' }}>{p.beschreibung}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live-Vorschau */}
      <LiveVorschau ebenen={bz.ebenen} pfeiler={bz.pfeiler} />

      {/* Stückliste */}
      <StuecklistenAnzeige
        laenge={bz.laenge}
        hoehe={bz.hoehe}
        ecken={bz.ecken}
        ebenen={bz.ebenen}
      />

    </div>
  )
}
