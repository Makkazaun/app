'use client'

import { useState } from 'react'
import SelectCard from './SelectCard'
import FieldLabel from './FieldLabel'
import BetonzaunDesigner from './BetonzaunDesigner'
import { getFarbHex, getFarbLabel } from './betonzaun-modelle'
import {
  CAPAROL_FAMILIEN,
  PALETTE_FAVORITEN,
  PALETTE_SONDER_FARBEN,
  getPaletteHex,
} from '@/src/constants/caparolColorPalette'
import type { FormData } from './types'

const UNTERGRUND = [
  { value: 'mutterboden',   label: 'Mutterboden',         icon: '🌱' },
  { value: 'sand',          label: 'Sand',                 icon: '🏖️' },
  { value: 'lehm',          label: 'Lehm',                 icon: '🟫' },
  { value: 'kies',          label: 'Kies',                 icon: '⚫' },
  { value: 'pflasterstein', label: 'Pflasterstein',        icon: '🔳' },
  { value: 'fundament',     label: 'Fundament / Beton',    icon: '🏗️' },
]

interface Props { data: FormData; update: (d: Partial<FormData>) => void }

function set<K extends keyof FormData['betonzaun']>(
  data: FormData,
  update: Props['update'],
  key: K,
  val: FormData['betonzaun'][K],
) {
  update({ betonzaun: { ...data.betonzaun, [key]: val } })
}

// ── Konstanten ───────────────────────────────────────────────────────────────

/** Fallback-Farbe für Betongrau (natur) in der Vorschau */
const BETON_GRAU_HEX = '#8a8480'

// ── Hilfsfunktionen ─────────────────────────────────────────────────────────

function isLightHex(hex: string): boolean {
  if (!hex || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

/** Leitet den Familienschlüssel aus einem Farbschlüssel ab, z.B. 'kiesel_15' → 'kiesel' */
function familyOf(key: string): string | null {
  const match = key.match(/^(.+)_(\d+)$/)
  return match ? match[1] : null
}

// ── Sticky Farb-Vorschau ──────────────────────────────────────────────────────

function MiniFenceStrip({
  rows, platteHex, pfeilerHex,
}: {
  rows: number; platteHex: string; pfeilerHex: string
}) {
  const rowH   = 13
  const totalH = Math.max(rows, 2) * rowH
  const postW  = 8
  const panelW = 50

  function Post({ cap }: { cap?: boolean }) {
    return (
      <div style={{
        width:      postW,
        height:     totalH + (cap ? 5 : 4),
        background: pfeilerHex,
        borderRadius: '2px 2px 0 0',
        boxShadow: '1px 0 4px rgba(0,0,0,0.45), -1px 0 2px rgba(0,0,0,0.2)',
        alignSelf: 'flex-end',
        flexShrink: 0,
      }} />
    )
  }

  function Panel() {
    return (
      <div style={{
        width:    panelW,
        height:   totalH,
        background: platteHex,
        position: 'relative',
        overflow: 'hidden',
        borderTop:    '1px solid rgba(0,0,0,0.25)',
        borderBottom: '1px solid rgba(0,0,0,0.25)',
      }}>
        {/* Mörtel-Fugen zwischen Reihen */}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0,
            top: (i + 1) * rowH - 1, height: 1,
            background: 'rgba(0,0,0,0.45)',
          }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, flexShrink: 0 }}>
      <Post cap />
      <Panel />
      <Post />
      <Panel />
      <Post cap />
    </div>
  )
}

function FarbChipSmall({ hex, label, prefix }: { hex: string; label: string; prefix: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
      <div style={{
        width: 11, height: 11, borderRadius: '3px', flexShrink: 0,
        background: hex,
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
      <span style={{
        fontSize: '10px', color: '#6a6a6a',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px',
      }}>
        <span style={{ color: '#3a3a3a', marginRight: '2px' }}>{prefix}:</span>
        {label}
      </span>
    </div>
  )
}

function StickyFarbVorschau({ data }: { data: FormData }) {
  const bz = data.betonzaun
  if (!bz.platten.length) return null

  const platteHex = getFarbHex(bz.farbePlatten) || BETON_GRAU_HEX
  const effectivePfeilerKey = (!bz.farbePfeiler || bz.farbePfeiler === 'gleich')
    ? bz.farbePlatten : bz.farbePfeiler
  const pfeilerHex   = getFarbHex(effectivePfeilerKey) || BETON_GRAU_HEX
  const platteLabel  = getFarbLabel(bz.farbePlatten  || 'betongrau')
  const pfeilerLabel = getFarbLabel(effectivePfeilerKey || 'betongrau')
  const hasKontrast  = !!(bz.farbePfeiler && bz.farbePfeiler !== 'gleich')

  return (
    <div
      className="-mx-4 sm:-mx-6"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(18, 18, 18, 0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #262626',
        boxShadow: '0 4px 20px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.03)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      } as React.CSSProperties}
    >
      {/* ── Mini-Zaun-Silhouette ─────────────────────────── */}
      <MiniFenceStrip
        rows={bz.platten.length}
        platteHex={platteHex}
        pfeilerHex={pfeilerHex}
      />

      {/* ── Farb-Labels ─────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '9px', color: '#3a3a3a',
          textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '5px',
        }}>
          Live-Vorschau
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <FarbChipSmall
            hex={platteHex}
            label={platteLabel.replace(' (RAL 9010)', '').replace(' (RAL 7016)', '')}
            prefix="Felder"
          />
          <FarbChipSmall
            hex={pfeilerHex}
            label={hasKontrast
              ? pfeilerLabel.replace(' (RAL 9010)', '').replace(' (RAL 7016)', '')
              : 'gleich wie Felder'}
            prefix="Pfeiler"
          />
        </div>
      </div>

      {/* ── Höhen-Badge ─────────────────────────────────── */}
      {bz.hoehe && (
        <span style={{
          flexShrink: 0, fontSize: '11px', fontWeight: 600,
          color: '#c9a84c',
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.18)',
          borderRadius: '6px',
          padding: '3px 8px',
        }}>
          {bz.hoehe}
        </span>
      )}
    </div>
  )
}

// ── Caparol-Farbwelt ─────────────────────────────────────────────────────────

const FARB_TABS = [
  { key: 'favoriten', label: '⭐ Favoriten' },
  ...CAPAROL_FAMILIEN.map((f) => ({ key: f.key, label: f.name })),
]

function FarbPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (key: string) => void
}) {
  const currentFamily = familyOf(value)
  const familyInTabs = CAPAROL_FAMILIEN.some((f) => f.key === currentFamily)
  const [activeTab, setActiveTab] = useState<string>(
    familyInTabs ? (currentFamily as string) : 'favoriten',
  )
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  // ── Quadratische Farbkachel ───────────────────────────────────────────────
  function renderTile(key: string, hex: string, tileLabel: string) {
    const isSelected = value === key
    const isHovered  = hoveredKey === key
    const light = isLightHex(hex)

    return (
      <button
        key={key}
        type="button"
        title={tileLabel}
        onClick={() => onChange(key)}
        onMouseEnter={() => setHoveredKey(key)}
        onMouseLeave={() => setHoveredKey(null)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
          width: '100%',
        }}
        className="active:scale-90"
      >
        {/* Quadratische Kachel */}
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: '6px',
            position: 'relative',
            background: key === 'individuell'
              ? 'conic-gradient(#c9a84c, #e8c870, #b87840, #d4a850, #c9a84c)'
              : (hex || '#1e1e1e'),
            border: isSelected
              ? '2px solid #ffffff'
              : isHovered
              ? '2px solid rgba(255,255,255,0.35)'
              : '2px solid rgba(255,255,255,0.07)',
            boxShadow: isSelected
              ? '0 0 0 2px rgba(201,168,76,0.55), 0 2px 8px rgba(0,0,0,0.5)'
              : isHovered
              ? '0 2px 8px rgba(0,0,0,0.4)'
              : '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'border-color 0.1s, box-shadow 0.1s',
          }}
        >
          {/* Ausgewählt: Häkchen */}
          {isSelected && (
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 700,
              color: light ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)',
              textShadow: light ? 'none' : '0 1px 3px rgba(0,0,0,0.6)',
            }}>✓</span>
          )}
          {/* Hover: Name als Overlay */}
          {!isSelected && isHovered && (
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              padding: '3px',
              background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.65) 100%)',
              borderRadius: '4px',
              fontSize: '8px', fontWeight: 600, color: '#fff',
              textAlign: 'center', lineHeight: 1.2,
              pointerEvents: 'none',
            }}>
              {tileLabel.replace(' (RAL 9010)', '').replace(' (RAL 7016)', '')}
            </span>
          )}
        </div>
        {/* Label unter der Kachel */}
        <span style={{
          fontSize: '9px', lineHeight: 1.2,
          textAlign: 'center', width: '100%',
          color: isSelected ? '#c9a84c' : '#4a4a4a',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {tileLabel.replace(' (RAL 9010)', '').replace(' (RAL 7016)', '')}
        </span>
      </button>
    )
  }

  // ── 3 Spalten mobil / 6 Spalten Desktop ──────────────────────────────────
  const GRID_CLASS = 'grid grid-cols-3 sm:grid-cols-6 gap-2'

  function renderTabContent() {
    if (activeTab === 'favoriten') {
      return (
        <div className={GRID_CLASS}>
          {PALETTE_FAVORITEN.map((key) => {
            const sonder = PALETTE_SONDER_FARBEN.find((s) => s.key === key)
            const hex = sonder ? sonder.hex : (getPaletteHex(key) || getFarbHex(key) || '#1e1e1e')
            const label = getFarbLabel(key)
            return renderTile(key, hex, label)
          })}
        </div>
      )
    }

    const fam = CAPAROL_FAMILIEN.find((f) => f.key === activeTab)
    if (!fam) return null

    return (
      <div className={GRID_CLASS}>
        {fam.nuancen.map((n) =>
          renderTile(`${fam.key}_${n.nr}`, n.hex, n.name),
        )}
      </div>
    )
  }

  return (
    <div>
      {/* ── Tab-Leiste (horizontal scrollbar auf Mobile) ─────────────── */}
      <div
        style={{
          display: 'flex', gap: '4px',
          overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        {FARB_TABS.map(({ key, label }) => {
          const isActive = activeTab === key
          const hasSelection = key === 'favoriten'
            ? PALETTE_FAVORITEN.includes(value) || PALETTE_SONDER_FARBEN.some((s) => s.key === value)
            : currentFamily === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                flexShrink: 0,
                padding: '7px 13px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: isActive ? '#c9a84c'
                  : hasSelection ? 'rgba(201,168,76,0.12)' : '#1e1e1e',
                border: isActive ? '1px solid #c9a84c'
                  : hasSelection ? '1px solid rgba(201,168,76,0.3)' : '1px solid #2a2a2a',
                color: isActive ? '#1a1a1a' : hasSelection ? '#c9a84c' : '#666',
                transition: 'all 0.1s',
              }}
            >
              {label}
              {hasSelection && !isActive && (
                <span style={{ marginLeft: '4px', fontSize: '7px', color: '#c9a84c' }}>●</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Farbkachel-Raster (anthrazit-dunkler Hintergrund) ────────── */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '10px',
        padding: '12px',
        border: '1px solid #252525',
      }}>
        {renderTabContent()}
      </div>

      {/* ── Individueller Farbwunsch ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
        <div style={{ width: '48px', flexShrink: 0 }}>
          {renderTile('individuell', '', 'Individuell')}
        </div>
        <p style={{ fontSize: '11px', color: '#4a4a4a', maxWidth: '230px', lineHeight: 1.5 }}>
          Jeder Farbton auf Anfrage – geben Sie Ihren Wunsch als NCS-, RAL- oder
          Caparol-Code an.
        </p>
      </div>
    </div>
  )
}

// ── Farb-Auswahl (Sektion A + B) ─────────────────────────────────────────────

function FarbAuswahl({ data, update }: Props) {
  const bz = data.betonzaun
  const [kontrastfarbe, setKontrastfarbe] = useState(
    !!bz.farbePfeiler && bz.farbePfeiler !== 'gleich',
  )

  function setPlatten(key: string) {
    update({ betonzaun: { ...bz, farbePlatten: key } })
  }

  function setPfeiler(key: string) {
    update({ betonzaun: { ...bz, farbePfeiler: key } })
  }

  function setIndividuell(val: string) {
    update({ betonzaun: { ...bz, farbeIndividuell: val } })
  }

  function toggleKontrastfarbe(enable: boolean) {
    setKontrastfarbe(enable)
    if (!enable) update({ betonzaun: { ...bz, farbePfeiler: 'gleich' } })
  }

  const needsIndividuell =
    bz.farbePlatten === 'individuell' || bz.farbePfeiler === 'individuell'

  // Aktuelle Farbe für Display
  const platteHex   = getFarbHex(bz.farbePlatten)
  const platteLabel = getFarbLabel(bz.farbePlatten || 'betongrau')

  return (
    <div className="space-y-7">

      {/* ── Premium-Info-Banner ─────────────────────────────────────────── */}
      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: '#1a1e14', border: '1px solid #3a4a28' }}>
        <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>🎨</span>
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#a8c880' }}>
            Individuelle Farbbeschichtung – Premium Finish
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#5a7a4a' }}>
            Unsere Experten tragen Ihre Wunschfarbe <strong style={{ color: '#7a9a60' }}>
            nach dem Aufbau präzise vor Ort</strong> auf den Betonzaun auf.
            Dies sorgt für optimalen Schutz, gleichmäßige Abdeckung und ein
            homogenes Farbbild. Der Zaun wird in <em>Betongrau</em> geliefert –
            die Beschichtung erfolgt im Rahmen der Montage.
          </p>
        </div>
      </div>

      {/* ── Sektion A: Zaunfelder ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
            A
          </span>
          <FieldLabel>Farbe der Zaunfelder</FieldLabel>
          {platteHex && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="rounded-full" style={{
                width: '14px', height: '14px',
                background: platteHex,
                border: '1px solid rgba(255,255,255,0.1)',
              }} />
              <span className="text-xs" style={{ color: '#7a7a7a' }}>{platteLabel}</span>
            </div>
          )}
        </div>
        <FarbPicker
          value={bz.farbePlatten || ''}
          onChange={setPlatten}
        />
      </div>

      {/* ── Sektion B: Pfeiler & Abdeckkappen ──────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
            B
          </span>
          <FieldLabel>Pfeiler &amp; Abdeckkappen</FieldLabel>
        </div>

        {/* Toggle: Gleich vs Kontrastfarbe */}
        <div className="flex gap-2 mb-4">
          <button type="button"
            onClick={() => toggleKontrastfarbe(false)}
            className="flex-1 rounded-xl py-3 px-4 text-sm font-medium transition-all duration-150"
            style={{
              background: !kontrastfarbe ? 'rgba(201,168,76,0.10)' : '#1a1a1a',
              border: !kontrastfarbe ? '2px solid #c9a84c' : '1px solid #252525',
              color: !kontrastfarbe ? '#c9a84c' : '#5a5a5a',
            }}
          >
            Gleich wie Zaunfelder
          </button>
          <button type="button"
            onClick={() => toggleKontrastfarbe(true)}
            className="flex-1 rounded-xl py-3 px-4 text-sm font-medium transition-all duration-150"
            style={{
              background: kontrastfarbe ? 'rgba(201,168,76,0.10)' : '#1a1a1a',
              border: kontrastfarbe ? '2px solid #c9a84c' : '1px solid #252525',
              color: kontrastfarbe ? '#c9a84c' : '#5a5a5a',
            }}
          >
            Kontrastfarbe wählen
          </button>
        </div>

        {!kontrastfarbe && (
          <p className="text-xs" style={{ color: '#3a3a3a' }}>
            Pfeiler und Abdeckkappen werden in derselben Farbe wie die Zaunfelder beschichtet.
          </p>
        )}

        {kontrastfarbe && (
          <FarbPicker
            value={bz.farbePfeiler !== 'gleich' ? (bz.farbePfeiler || '') : ''}
            onChange={setPfeiler}
          />
        )}
      </div>

      {/* ── Individueller Farbwunsch – Freitext ─────────────────────────── */}
      {needsIndividuell && (
        <div>
          <FieldLabel>Ihr individueller Farbwunsch (Freitext)</FieldLabel>
          <input
            type="text"
            value={bz.farbeIndividuell}
            onChange={(e) => setIndividuell(e.target.value)}
            placeholder="z.B. Caparol 15 10 30, NCS S 3005-Y20R, RAL 6019 Weißgrün …"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#1c1c1c',
              border: '1px solid #2d2d2d',
              borderRadius: '10px',
              color: '#e0e0e0',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <p className="text-xs mt-1.5" style={{ color: '#4a4a4a' }}>
            Caparol Code, RAL, NCS oder freie Beschreibung – unser Team berät Sie gerne.
          </p>
        </div>
      )}

      {/* ── Disclaimer ──────────────────────────────────────────────────── */}
      <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#3a3a3a', lineHeight: 1.6 }}>
        Hinweis: Die Darstellung der Farbtöne auf Ihrem Bildschirm kann technisch bedingt
        leicht vom Originalton abweichen. Für eine exakte Farbwahl empfehlen wir die
        Ansicht eines physischen Farbfächers vor Ort.
      </p>

    </div>
  )
}

// ── Haupt-Schritt ────────────────────────────────────────────────────────────

export default function Step2Betonzaun({ data, update }: Props) {
  const bz = data.betonzaun

  function handleMontage(val: 'mit' | 'ohne') {
    if (val === 'ohne') {
      update({
        betonzaun: {
          ...bz,
          montage: 'ohne',
          farbePlatten: 'betongrau',
          farbePfeiler: 'gleich',
          farbeIndividuell: '',
        },
      })
    } else {
      update({ betonzaun: { ...bz, montage: 'mit' } })
    }
  }

  return (
    <div className="space-y-10">
      {/* Schritt-Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1"
          style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>
          Schritt 2 · Betonzaun
        </p>
        <h2 className="text-2xl font-bold" style={{ color: '#e8e8e8' }}>Konfiguration</h2>
      </div>

      {/* ── Interaktiver Designer ─────────────────────────────────────── */}
      <BetonzaunDesigner data={data} update={update} />

      {/* ── Sichtseite ────────────────────────────────────────────────── */}
      <div>
        <FieldLabel required>Sichtseite</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: 'einseitig'  as const, l: 'Einseitig',  sub: 'Strukturiert auf einer Seite' },
            { v: 'beidseitig' as const, l: 'Beidseitig', sub: 'Strukturiert auf beiden Seiten' },
          ].map((o) => (
            <SelectCard key={o.v} label={o.l} sublabel={o.sub}
              selected={bz.struktur === o.v}
              onClick={() => set(data, update, 'struktur', o.v)} fullWidth />
          ))}
        </div>
      </div>

      {/* ── Untergrundart ─────────────────────────────────────────────── */}
      <div>
        <FieldLabel>Untergrundart</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {UNTERGRUND.map((u) => (
            <SelectCard key={u.value} label={u.label} icon={u.icon}
              selected={bz.untergrund === u.value}
              onClick={() => set(data, update, 'untergrund', u.value)} fullWidth />
          ))}
        </div>
      </div>

      {/* ── Montage ───────────────────────────────────────────────────── */}
      <div>
        <FieldLabel required>Wünschen Sie eine Montage durch unser Fachpersonal?</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <SelectCard
            label="Ja, mit Montage"
            sublabel="Fachgerechter Aufbau + optionale Farbbeschichtung"
            icon="🔧"
            selected={bz.montage === 'mit'}
            onClick={() => handleMontage('mit')}
            fullWidth
          />
          <SelectCard
            label="Nein, Selbstmontage"
            sublabel="Lieferung frei Haus · Betongrau (natur)"
            icon="📦"
            selected={bz.montage === 'ohne'}
            onClick={() => handleMontage('ohne')}
            fullWidth
          />
        </div>
        {bz.montage === 'ohne' && (
          <p className="text-xs mt-2 px-1" style={{ color: '#5a5a5a' }}>
            Der Zaun wird in Betongrau (natur) geliefert. Eine individuelle Farbbeschichtung
            ist ausschließlich bei Montage durch unser Fachteam möglich.
          </p>
        )}
      </div>

      {/* ── Farbgestaltung (nur bei Montage = mit) ───────────────────── */}
      {bz.montage === 'mit' && (
        <>
          {/* Sticky Vorschau – klebt am oberen Rand des Scroll-Containers */}
          <StickyFarbVorschau data={data} />

          <div className="rounded-xl p-5"
            style={{ background: '#161616', border: '1px solid #242424' }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: '#c9a84c', letterSpacing: '0.14em' }}>
              Farbgestaltung
            </p>
            <p className="text-xs mb-5" style={{ color: '#4a4a4a' }}>
              Wählen Sie eine Farbe – die Vorschau oben aktualisiert sich sofort.
            </p>
            <FarbAuswahl data={data} update={update} />
          </div>
        </>
      )}
    </div>
  )
}
