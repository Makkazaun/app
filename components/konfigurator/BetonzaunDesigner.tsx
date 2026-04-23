'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import FieldLabel, { inputStyle } from './FieldLabel'
import {
  BETONZAUN_MODELLE,
  KATEGORIEN,
  DESIGNER_HOEHEN,
  HOEHE_PLATTEN,
  KAT_TEXTUREN,
  LEER_TEXTUR,
  PFEILER_TYPEN,
  BAUGENEHMIGUNG_AB,
  getFarbHex,
  berechneStueckliste,
  type BetonzaunModell,
  type KatTextur,
  type PfeilerTyp,
} from './betonzaun-modelle'
import type { FormData, PlattenSlot } from './types'

// ── Konstanten ───────────────────────────────────────────────────────────────

/** Sichtbare Pixelhöhe je Platte im Designer */
const PX: Record<50 | 25, number> = { 50: 76, 25: 38 }
const POST_W = 20

// ── Helfer ───────────────────────────────────────────────────────────────────

function initSlots(hoeheValue: string, existing: PlattenSlot[] = []): PlattenSlot[] {
  const config = HOEHE_PLATTEN[hoeheValue]
  if (!config) return []
  return config.map((h, i) => ({
    id: `slot-${i}`,
    hoehe: h,
    modellNr: existing[i]?.modellNr ?? '',
    modellName: existing[i]?.modellName ?? '',
  }))
}

function getReiheLabel(idx: number, total: number): string {
  if (idx === 0) return 'Unten'
  if (idx === total - 1) return 'Oben'
  if (total === 3) return 'Mitte'
  const mid4 = ['Mitte-unten', 'Mitte-oben']
  const mid5 = ['Mitte-unten', 'Mitte', 'Mitte-oben']
  const mid = total === 4 ? mid4 : mid5
  return mid[idx - 1] ?? `Reihe ${idx + 1}`
}

function getTextur(slot: PlattenSlot): KatTextur {
  if (!slot.modellNr) return LEER_TEXTUR
  const m = BETONZAUN_MODELLE.find((x) => x.nr === slot.modellNr)
  return m ? (KAT_TEXTUREN[m.kategorie] ?? LEER_TEXTUR) : LEER_TEXTUR
}

// ── Einzelne Plattenreihe im Designer ────────────────────────────────────────

interface SlotProps {
  slot: PlattenSlot
  idx: number
  total: number
  isActive: boolean
  colorHex: string        // '' = naturgrau
  onActivate: () => void
  onDrop: (nr: string, name: string) => void
  onCopyAll: () => void
}

function PlatteSlot({ slot, idx, total, isActive, colorHex, onActivate, onDrop, onCopyAll }: SlotProps) {
  const [dragOver, setDragOver] = useState(false)
  const tex = getTextur(slot)
  const modell = slot.modellNr ? BETONZAUN_MODELLE.find((m) => m.nr === slot.modellNr) : undefined
  const px = PX[slot.hoehe]
  const label = getReiheLabel(idx, total)

  // Mörtel-Overlay als Background-Pattern
  const mortarOverlay = `
    repeating-linear-gradient(
      180deg,
      transparent 0px, transparent 21px,
      ${tex.mortar} 21px, ${tex.mortar} 22px
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0px, transparent 36px,
      ${tex.mortar} 36px, ${tex.mortar} 37px
    )
  `

  return (
    <div className="relative group">
      {/* Hauptfläche */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          try {
            const d = JSON.parse(e.dataTransfer.getData('text/plain'))
            onDrop(d.nr, d.name)
          } catch {}
        }}
        onClick={onActivate}
        className="relative overflow-hidden cursor-pointer w-full transition-all duration-100 active:brightness-110"
        style={{
          height: `${px}px`,
          background: colorHex || tex.bg,
          borderLeft:  'none',
          borderRight: 'none',
          borderTop:    idx < total - 1 ? `1px solid rgba(0,0,0,0.45)` : 'none',
          borderBottom: idx > 0         ? `1px solid rgba(0,0,0,0.45)` : 'none',
          outline: isActive
            ? '2px solid #800020'
            : dragOver
            ? '2px solid rgba(128,0,32,0.5)'
            : 'none',
          outlineOffset: isActive ? '-2px' : '-2px',
          boxShadow: isActive ? 'inset 0 0 20px rgba(128,0,32,0.08)' : 'none',
        }}
      >
        {/* Echtes Bild, wenn vorhanden */}
        {modell && (
          <Image
            src={modell.imageUrl}
            alt={modell.name}
            fill
            sizes="220px"
            className="object-cover"
            style={{ opacity: 0.55, mixBlendMode: 'overlay' }}
            onError={() => {}}
          />
        )}

        {/* Farbton-Texturüberlagerung: behält Maserung subtil sichtbar */}
        {colorHex && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: tex.bg, opacity: 0.18 }} />
        )}

        {/* Mörtel-Fugen Overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: mortarOverlay }} />

        {/* Inhalt */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {/* Links: Höhen-Badge */}
          <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-mono flex-shrink-0"
            style={{
              background: 'rgba(0,0,0,0.55)',
              color: isActive ? '#800020' : '#C08898',
              fontSize: '10px',
            }}
          >
            {slot.hoehe} cm
          </span>

          {/* Mitte: Modellname / Aufforderung */}
          <div className="flex-1 text-center px-1">
            {slot.modellNr ? (
              <>
                <p className="text-xs font-semibold leading-tight"
                  style={{ color: tex.textColor }}
                >
                  {slot.modellName}
                </p>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)', marginTop: '1px' }}>
                  Nr. {slot.modellNr}
                </p>
              </>
            ) : (
              <p style={{ fontSize: '11px', color: isActive ? '#800020' : '#1A0005' }}>
                {isActive ? '← Modell wählen' : '+ klicken'}
              </p>
            )}
          </div>

          {/* Rechts: Reihen-Label vertikal */}
          <span className="mr-2 flex-shrink-0"
            style={{
              fontSize: '9px',
              color: isActive ? '#800020' : '#1A0005',
              writingMode: 'vertical-rl',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        </div>

        {/* Aktiv-Indikator links */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1"
            style={{ background: '#800020' }} />
        )}

        {/* Drag-Over-Flash */}
        {dragOver && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(128,0,32,0.12)' }} />
        )}
      </div>

      {/* "Auf alle" Tooltip-Button (erscheint on hover wenn Modell gewählt) */}
      {slot.modellNr && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCopyAll() }}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
                     transition-opacity duration-150 px-1.5 py-0.5 rounded text-xs z-10"
          style={{
            background: 'rgba(128,0,32,0.15)',
            border: '1px solid rgba(128,0,32,0.3)',
            color: '#800020',
            fontSize: '9px',
            pointerEvents: 'auto',
          }}
          title="Dieses Modell auf alle Reihen anwenden"
        >
          Alle
        </button>
      )}
    </div>
  )
}

// ── Pfosten-Kappen ────────────────────────────────────────────────────────────

function FlatCap({ bg }: { bg: string }) {
  return (
    <div className="w-full rounded-t"
      style={{ height: '14px', background: bg, boxShadow: '0 -1px 3px rgba(0,0,0,0.4)' }} />
  )
}

function OverhangCap({ bg }: { bg: string }) {
  return (
    <div className="rounded-t" style={{
      width: `${POST_W + 8}px`,
      height: '12px',
      marginLeft: '-4px',
      background: bg,
      boxShadow: '0 -1px 4px rgba(0,0,0,0.4), 2px 0 4px rgba(0,0,0,0.3), -2px 0 4px rgba(0,0,0,0.3)',
    }} />
  )
}

function PyramidCap({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center">
      {/* Dreieck via CSS-Border-Trick */}
      <div style={{
        width: 0,
        height: 0,
        borderLeft:   `${POST_W / 2 + 5}px solid transparent`,
        borderRight:  `${POST_W / 2 + 5}px solid transparent`,
        borderBottom: `14px solid ${color}`,
      }} />
      {/* Flacher Sockel der Pyramide */}
      <div className="w-full" style={{ height: '5px', background: color }} />
    </div>
  )
}

// ── Pfosten ──────────────────────────────────────────────────────────────────

function Pfosten({ totalPx, typ, primaryTex, colorHex }: {
  totalPx: number
  typ: string
  primaryTex: KatTextur
  colorHex: string
}) {
  const pfeilerTyp = PFEILER_TYPEN.find((p) => p.value === typ) ?? PFEILER_TYPEN[0]
  const bodyBg = colorHex
    ? colorHex
    : (typ === 'struktur') ? primaryTex.bg : pfeilerTyp.bodyBg
  const capBg = colorHex ? colorHex : pfeilerTyp.capBg
  const capColor = colorHex ? colorHex : pfeilerTyp.capColor

  return (
    <div className="flex flex-col items-center flex-shrink-0" style={{ width: `${POST_W}px` }}>
      {/* Kappe (je nach Typ) */}
      {pfeilerTyp.capVariant === 'pyramid'  && <PyramidCap color={capColor} />}
      {pfeilerTyp.capVariant === 'overhang' && <OverhangCap bg={capBg} />}
      {pfeilerTyp.capVariant === 'flat'     && <FlatCap bg={capBg} />}

      {/* Schaft */}
      <div className="w-full"
        style={{
          height: `${totalPx}px`,
          background: bodyBg,
          boxShadow: `2px 0 5px rgba(0,0,0,0.5), -1px 0 2px rgba(0,0,0,0.25),
                      inset 0 0 0 1px ${colorHex ? 'rgba(0,0,0,0.2)' : pfeilerTyp.borderColor}`,
        }}
      />
      {/* Sockel */}
      <div className="w-full rounded-b"
        style={{ height: '6px', background: 'linear-gradient(180deg, #9CA3AF 0%, #E5E7EB 100%)' }} />
    </div>
  )
}

// ── Feld-Vorschau (Schablone) ────────────────────────────────────────────────

interface FeldProps {
  platten: PlattenSlot[]
  pfeilerTyp: string
  primaryTex: KatTextur
  platteHex: string
  pfeilerHex: string
  activeId: string | null
  onActivate: (id: string) => void
  onDrop: (id: string, nr: string, name: string) => void
  onCopyAll: (idx: number) => void
}

function FeldVorschau({ platten, pfeilerTyp, primaryTex, platteHex, pfeilerHex, activeId, onActivate, onDrop, onCopyAll }: FeldProps) {
  const totalPx = platten.reduce((s, p) => s + PX[p.hoehe], 0)

  return (
    <div className="flex items-stretch justify-center select-none" style={{ gap: 0 }}>
      <Pfosten totalPx={totalPx} typ={pfeilerTyp} primaryTex={primaryTex} colorHex={pfeilerHex} />

      {/* Plattenstapel */}
      <div className="flex flex-col-reverse overflow-hidden"
        style={{
          width: '200px',
          border: '1px solid #440011',
          borderTop: 'none',
          borderBottom: 'none',
        }}
      >
        {platten.map((slot, i) => (
          <PlatteSlot
            key={slot.id}
            slot={slot}
            idx={i}
            total={platten.length}
            isActive={activeId === slot.id}
            colorHex={platteHex}
            onActivate={() => onActivate(slot.id)}
            onDrop={(nr, name) => onDrop(slot.id, nr, name)}
            onCopyAll={() => onCopyAll(i)}
          />
        ))}
      </div>

      <Pfosten totalPx={totalPx} typ={pfeilerTyp} primaryTex={primaryTex} colorHex={pfeilerHex} />
    </div>
  )
}

// ── Modell-Palette ────────────────────────────────────────────────────────────

function ModelPalette({
  activeId,
  onSelect,
}: {
  activeId: string | null
  onSelect: (m: BetonzaunModell) => void
}) {
  const [kat, setKat] = useState<string>('Natursteinoptik')
  const modelle = BETONZAUN_MODELLE.filter((m) => m.kategorie === kat)

  return (
    <div className="flex flex-col gap-3">
      {/* Hinweis */}
      <p className="text-xs leading-relaxed"
        style={{ color: activeId ? '#800020' : '#C08898' }}
      >
        {activeId
          ? 'Reihe aktiv – Modell klicken oder hierher ziehen:'
          : 'Reihe in der Schablone anklicken, dann Modell wählen oder direkt auf Reihe ziehen.'}
      </p>

      {/* Kategorie-Tabs */}
      <div className="flex flex-wrap gap-1">
        {KATEGORIEN.map((k) => (
          <button key={k} type="button" onClick={() => setKat(k)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: kat === k ? 'rgba(255,255,255,0.10)' : '#33000D',
              border: kat === k ? '1px solid #800020' : '1px solid #1A0005',
              color: kat === k ? '#800020' : '#C08898',
            }}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Modell-Grid */}
      <div className="grid grid-cols-2 gap-2">
        {modelle.map((m) => {
          const tex = KAT_TEXTUREN[m.kategorie] ?? LEER_TEXTUR
          return (
            <div
              key={m.nr}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ nr: m.nr, name: m.name }))
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onClick={() => onSelect(m)}
              className="rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all
                         duration-100 hover:brightness-110 active:scale-95"
              style={{ border: '1px solid #282828', background: '#0D0003' }}
            >
              {/* Textur-Vorschau */}
              <div className="relative overflow-hidden"
                style={{ paddingBottom: '52%', background: tex.bg }}
              >
                <Image
                  src={m.imageUrl}
                  alt={m.name}
                  fill
                  sizes="140px"
                  className="object-cover"
                  style={{ opacity: 0.6, mixBlendMode: 'overlay' }}
                  onError={() => {}}
                />
                {/* Mörtel-Mini-Overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `
                    repeating-linear-gradient(180deg,transparent 0px,transparent 10px,${tex.mortar} 10px,${tex.mortar} 11px),
                    repeating-linear-gradient(90deg,transparent 0px,transparent 18px,${tex.mortar} 18px,${tex.mortar} 19px)
                  `,
                }} />
                {/* Nr-Badge */}
                <span className="absolute bottom-1 right-1.5 text-xs rounded px-1"
                  style={{ background: 'rgba(0,0,0,0.65)', color: '#C08898', fontSize: '9px' }}
                >
                  Nr.{m.nr}
                </span>
                {/* Ziehen-Indikator */}
                <span className="absolute top-1 left-1.5 text-xs opacity-40"
                  style={{ color: tex.textColor, fontSize: '10px' }}
                >
                  ⠿
                </span>
              </div>
              <p className="px-2 py-1.5 text-xs font-medium truncate" style={{ color: '#F5D0D5' }}>
                {m.name}
              </p>
            </div>
          )
        })}
      </div>

      <p className="text-xs" style={{ color: '#440011' }}>
        Alle 100+ Modelle →{' '}
        <a href="https://www.edelzaun-tor.com/modelle" target="_blank" rel="noopener noreferrer"
          style={{ color: '#C08898' }}
        >
          edelzaun-tor.com/modelle
        </a>
      </p>
    </div>
  )
}

// ── Stückliste ───────────────────────────────────────────────────────────────

function Stueckliste({
  platten,
  laenge,
  hoehe,
  ecken,
  pfeilerTyp,
}: {
  platten: PlattenSlot[]
  laenge: string
  hoehe: string
  ecken: number
  pfeilerTyp: string
}) {
  const sl = berechneStueckliste(laenge, hoehe, ecken)
  if (!sl || platten.length === 0) return null

  const plattenVonOben = [...platten].reverse()
  const pfeilerInfo = PFEILER_TYPEN.find((p) => p.value === pfeilerTyp)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #440011' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: '#33000D', borderBottom: '1px solid #440011' }}
      >
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#C88090', letterSpacing: '0.12em' }}>
          Automatische Stückliste
        </p>
        <p className="text-xs" style={{ color: '#C08898' }}>
          {sl.laengeMeter} m · Feld = 2 m
        </p>
      </div>

      {/* Zusammenfassung */}
      <div className="grid grid-cols-3 divide-x" style={{ borderBottom: '1px solid #FFFFFF', borderColor: '#FFFFFF' }}>
        <div className="py-3 text-center" style={{ borderColor: '#FFFFFF' }}>
          <p className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{sl.felder}</p>
          <p className="text-xs" style={{ color: '#C08898' }}>Felder</p>
        </div>
        <div className="py-3 text-center" style={{ borderColor: '#FFFFFF' }}>
          <p className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{sl.pfosten}</p>
          <p className="text-xs" style={{ color: '#C08898' }}>Pfosten</p>
          <p className="text-xs mt-0.5" style={{ color: '#C08898', fontSize: '9px' }}>
            {sl.felder}+1{ecken > 0 ? `+${ecken}` : ''}
          </p>
        </div>
        <div className="py-3 text-center" style={{ borderColor: '#FFFFFF' }}>
          <p className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{sl.plattenGesamt}</p>
          <p className="text-xs" style={{ color: '#C08898' }}>Platten gesamt</p>
        </div>
      </div>

      {/* Pfeiler-Typ-Zeile */}
      {pfeilerInfo && (
        <div className="flex items-center gap-3 px-4 py-2.5"
          style={{ background: '#080002', borderBottom: '1px solid #FFFFFF' }}
        >
          <MiniPfostenChip typ={pfeilerInfo} />
          <div className="flex-1">
            <span className="text-xs font-medium" style={{ color: '#c0c0c0' }}>
              {pfeilerInfo.label}
            </span>
            <span className="text-xs ml-2" style={{ color: '#C08898' }}>
              {sl.pfosten} Stück
            </span>
          </div>
          <span className="text-xs font-mono" style={{ color: '#800020' }}>
            × {sl.pfosten}
          </span>
        </div>
      )}

      {/* Stapelreihenfolge */}
      <div className="px-4 py-3 space-y-1.5" style={{ background: '#0D0003' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: '#C08898', letterSpacing: '0.1em' }}
        >
          Stapelreihenfolge (oben → unten)
        </p>
        {plattenVonOben.map((slot, ri) => {
          const globalIdx = platten.length - 1 - ri
          const reiheLabel = getReiheLabel(globalIdx, platten.length)
          const tex = getTextur(slot)
          return (
            <div key={slot.id} className="flex items-center gap-3">
              {/* Farb-Chip */}
              <div className="w-8 h-5 rounded flex-shrink-0 overflow-hidden relative"
                style={{ background: tex.bg }}
              >
                {slot.modellNr && (() => {
                  const m = BETONZAUN_MODELLE.find((x) => x.nr === slot.modellNr)
                  return m ? (
                    <Image src={m.imageUrl} alt="" fill sizes="32px"
                      className="object-cover" style={{ opacity: 0.55, mixBlendMode: 'overlay' }}
                      onError={() => {}} />
                  ) : null
                })()}
              </div>

              <div className="flex-1 flex items-baseline justify-between gap-2 min-w-0">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-xs flex-shrink-0" style={{ color: '#C08898' }}>
                    {reiheLabel}
                  </span>
                  <span className="text-xs truncate font-medium"
                    style={{ color: slot.modellNr ? '#4B5563' : '#C08898' }}
                  >
                    {slot.modellNr
                      ? `${slot.modellName} (Nr. ${slot.modellNr})`
                      : '– nicht gewählt –'}
                  </span>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: '#C08898' }}>
                  {slot.hoehe} cm
                </span>
              </div>

              <span className="text-xs flex-shrink-0 font-mono"
                style={{ color: '#800020', minWidth: '40px', textAlign: 'right' }}
              >
                × {sl.plattenProReihe}
              </span>
            </div>
          )
        })}
      </div>

      {/* Hinweis */}
      <p className="px-4 pb-3 text-xs" style={{ color: '#F5D0D5', background: '#0D0003' }}>
        * Richtmengen inkl. {ecken} Eckpfosten. Exakter Aufmaß vor Ort.
      </p>
    </div>
  )
}

// ── Mini-Pfosten für Chips ────────────────────────────────────────────────────

function MiniPfostenChip({ typ }: { typ: PfeilerTyp }) {
  const bodyBg = typ.bodyBg || 'linear-gradient(90deg,#484848,#5c5c5c 35%,#404040 65%,#4c4c4c)'
  return (
    <div className="flex flex-col items-center flex-shrink-0" style={{ width: '10px', height: '28px', gap: 0 }}>
      {typ.capVariant === 'pyramid' ? (
        <>
          <div style={{
            width: 0, height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: `8px solid ${typ.capColor}`,
          }} />
          <div style={{ width: '10px', height: '3px', background: typ.capColor }} />
        </>
      ) : typ.capVariant === 'overhang' ? (
        <div style={{
          width: '14px', height: '8px', marginLeft: '-2px',
          background: typ.capBg, borderRadius: '1px 1px 0 0',
        }} />
      ) : (
        <div style={{ width: '10px', height: '8px', background: typ.capBg, borderRadius: '1px 1px 0 0' }} />
      )}
      <div style={{ width: '10px', flex: 1, background: bodyBg }} />
    </div>
  )
}

// ── Pfeiler-Auswahl ───────────────────────────────────────────────────────────

function PfeilerAuswahl({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (v: string) => void
}) {
  return (
    <div>
      <FieldLabel>Pfeiler-Typ</FieldLabel>
      {/* Horizontale Scroll-Leiste mit Karten */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {PFEILER_TYPEN.map((typ) => {
          const isSelected = selected === typ.value
          const bodyBg = typ.bodyBg || 'linear-gradient(90deg,#484848,#5c5c5c 35%,#404040 65%,#4c4c4c)'

          return (
            <button
              key={typ.value}
              type="button"
              onClick={() => onSelect(typ.value)}
              className="flex flex-col items-center gap-2 rounded-xl flex-shrink-0 transition-all
                         duration-150 active:scale-95 hover:brightness-110"
              style={{
                padding: '10px 12px 8px',
                minWidth: '80px',
                background: isSelected ? 'rgba(128,0,32,0.08)' : '#080002',
                border: isSelected ? '2px solid #800020' : '1px solid #440011',
              }}
            >
              {/* Pfosten-Vorschau */}
              <div className="flex flex-col items-center" style={{ width: '14px' }}>
                {typ.capVariant === 'pyramid' && (
                  <>
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: `9px solid transparent`,
                      borderRight: `9px solid transparent`,
                      borderBottom: `12px solid ${typ.capColor}`,
                    }} />
                    <div style={{ width: '14px', height: '4px', background: typ.capColor }} />
                  </>
                )}
                {typ.capVariant === 'overhang' && (
                  <div style={{
                    width: '22px', height: '10px', marginLeft: '-4px',
                    background: typ.capBg, borderRadius: '2px 2px 0 0',
                    boxShadow: '0 -1px 3px rgba(0,0,0,0.4)',
                  }} />
                )}
                {typ.capVariant === 'flat' && (
                  <div style={{
                    width: '14px', height: '10px',
                    background: typ.capBg, borderRadius: '2px 2px 0 0',
                    boxShadow: '0 -1px 3px rgba(0,0,0,0.3)',
                  }} />
                )}
                {/* Schaft */}
                <div style={{
                  width: '14px', height: '52px',
                  background: bodyBg,
                  boxShadow: `inset 0 0 0 1px ${typ.borderColor}`,
                }} />
                {/* Sockel */}
                <div style={{
                  width: '14px', height: '4px',
                  background: '#1A0005', borderRadius: '0 0 2px 2px',
                }} />
              </div>

              {/* Label */}
              <p className="text-xs font-semibold text-center leading-tight"
                style={{ color: isSelected ? '#800020' : '#C88090', maxWidth: '72px' }}
              >
                {typ.label}
              </p>
              {isSelected && (
                <span style={{ fontSize: '10px', color: '#800020' }}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Beschreibung des gewählten Typs */}
      {selected && (
        <p className="text-xs mt-2" style={{ color: '#C08898' }}>
          {PFEILER_TYPEN.find((p) => p.value === selected)?.beschreibung}
        </p>
      )}
    </div>
  )
}

// ── Haupt-Komponente: BetonzaunDesigner ──────────────────────────────────────

interface Props {
  data: FormData
  update: (d: Partial<FormData>) => void
}

export default function BetonzaunDesigner({ data, update }: Props) {
  const bz = data.betonzaun
  const [activeId, setActiveId] = useState<string | null>(null)

  // Slots initialisieren / an neue Höhe anpassen
  const applyHeight = useCallback((newHoehe: string) => {
    const slots = initSlots(newHoehe, bz.platten)
    const primär = slots.find((s) => s.modellNr)
    update({
      betonzaun: {
        ...bz,
        hoehe: newHoehe,
        platten: slots,
        muster:   primär?.modellName ?? bz.muster,
        modellNr: primär?.modellNr   ?? bz.modellNr,
      },
    })
    setActiveId(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bz.hoehe, bz.platten.length])

  // Initialisierung wenn Höhe schon gesetzt aber platten noch leer
  useEffect(() => {
    if (bz.hoehe && bz.platten.length === 0) {
      applyHeight(bz.hoehe)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Modell einem Slot zuweisen
  function assignModell(slotId: string, nr: string, name: string) {
    const neu = bz.platten.map((s) =>
      s.id === slotId ? { ...s, modellNr: nr, modellName: name } : s
    )
    const primär = neu[0]
    update({
      betonzaun: {
        ...bz,
        platten: neu,
        muster:   primär?.modellName ?? '',
        modellNr: primär?.modellNr   ?? '',
      },
    })
    setActiveId(null)
  }

  // Modell auf alle Slots kopieren
  function copyToAll(fromIdx: number) {
    const src = bz.platten[fromIdx]
    if (!src?.modellNr) return
    const neu = bz.platten.map((s) => ({ ...s, modellNr: src.modellNr, modellName: src.modellName }))
    update({
      betonzaun: {
        ...bz,
        platten: neu,
        muster:   src.modellName,
        modellNr: src.modellNr,
      },
    })
  }

  // Palette-Klick: aktiven Slot befüllen oder falls keiner → ersten leeren
  function handlePaletteSelect(m: BetonzaunModell) {
    if (activeId) {
      assignModell(activeId, m.nr, m.name)
      return
    }
    const ersterLeerer = bz.platten.find((s) => !s.modellNr)
    if (ersterLeerer) assignModell(ersterLeerer.id, m.nr, m.name)
  }

  const allFilled = bz.platten.length > 0 && bz.platten.every((s) => s.modellNr)
  const anyFilled = bz.platten.some((s) => s.modellNr)

  // Farb-Hex für Live-Vorschau
  const platteHex  = getFarbHex(bz.farbePlatten)
  const pfeilerHex = getFarbHex(bz.farbePfeiler === 'gleich' ? bz.farbePlatten : bz.farbePfeiler)

  // Primärtextur: Kategorie des ersten belegten Slots → für Struktur-Pfeiler
  const primaryTex: KatTextur = (() => {
    const firstFilled = bz.platten.find((s) => s.modellNr)
    if (!firstFilled) return LEER_TEXTUR
    const m = BETONZAUN_MODELLE.find((x) => x.nr === firstFilled.modellNr)
    return m ? (KAT_TEXTUREN[m.kategorie] ?? LEER_TEXTUR) : LEER_TEXTUR
  })()

  return (
    <div className="space-y-6">

      {/* ── Titel ──────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: '#800020', letterSpacing: '0.2em' }}
        >
          Betonzaun-Designer
        </p>
        <p className="text-sm" style={{ color: '#C08898' }}>
          Gestalten Sie Ihren Zaun Reihe für Reihe. Höhe wählen → Modelle in die Schablone ziehen.
        </p>
      </div>

      {/* ── Höhenwahl ─────────────────────────────────────────────────── */}
      <div>
        <FieldLabel required>Gesamthöhe</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {DESIGNER_HOEHEN.map((h) => (
            <button key={h.value} type="button"
              onClick={() => applyHeight(h.value)}
              className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95"
              style={{
                background: bz.hoehe === h.value ? 'rgba(255,255,255,0.10)' : '#33000D',
                border: bz.hoehe === h.value ? '2px solid #800020' : '1px solid #440011',
                color: bz.hoehe === h.value ? '#800020' : '#C88090',
                minWidth: '78px',
              }}
            >
              <span className="block text-base leading-none">{h.label}</span>
              {HOEHE_PLATTEN[h.value] && (
                <span className="block text-xs mt-0.5" style={{ color: bz.hoehe === h.value ? '#8a7030' : '#C08898' }}>
                  {HOEHE_PLATTEN[h.value].join('+')} cm
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Baugenehmigung-Hinweis ────────────────────────────────────── */}
      {bz.hoehe && (BAUGENEHMIGUNG_AB as readonly string[]).includes(bz.hoehe) && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: '#1e1208', border: '1px solid #5a2e08' }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>⚠️</span>
          <p className="text-sm leading-relaxed" style={{ color: '#d4822a' }}>
            <strong style={{ color: '#e8a050' }}>Hinweis:</strong> Ab einer Zaunhöhe von über 2,00 m ist in der Regel
            eine Baugenehmigung erforderlich. Bitte prüfen Sie die örtlichen Vorschriften
            und holen Sie ggf. die notwendigen Genehmigungen ein.
          </p>
        </div>
      )}

      {/* ── Pfeiler-Auswahl ───────────────────────────────────────────── */}
      <PfeilerAuswahl
        selected={bz.pfeiler}
        onSelect={(v) => update({ betonzaun: { ...bz, pfeiler: v } })}
      />

      {/* ── Designer-Hauptbereich ──────────────────────────────────────── */}
      {bz.hoehe && bz.platten.length > 0 ? (
        <>
          {/* Status-Zeile */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: allFilled ? '#5a8a5a' : '#C08898' }}>
              {allFilled
                ? `✓ Alle ${bz.platten.length} Reihen konfiguriert`
                : `${bz.platten.filter((s) => s.modellNr).length} / ${bz.platten.length} Reihen belegt`}
            </p>
            {anyFilled && (
              <button type="button"
                onClick={() => update({ betonzaun: { ...bz, platten: bz.platten.map((s) => ({ ...s, modellNr: '', modellName: '' })) } })}
                className="text-xs hover:opacity-80 transition-opacity"
                style={{ color: '#C08898' }}
              >
                Zurücksetzen
              </button>
            )}
          </div>

          {/* 2-Spalten: Schablone + Palette */}
          <div className="grid grid-cols-1 sm:grid-cols-[244px_1fr] gap-5 items-start">

            {/* Links: Schablone */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs self-start" style={{ color: '#C08898' }}>
                Schablone · 1 Feld
              </p>
              <FeldVorschau
                platten={bz.platten}
                pfeilerTyp={bz.pfeiler}
                primaryTex={primaryTex}
                platteHex={platteHex}
                pfeilerHex={pfeilerHex}
                activeId={activeId}
                onActivate={(id) => setActiveId((prev) => (prev === id ? null : id))}
                onDrop={(id, nr, name) => assignModell(id, nr, name)}
                onCopyAll={(i) => copyToAll(i)}
              />
              <p className="text-xs text-center" style={{ color: '#F5D0D5' }}>
                Hover auf Reihe → „Alle" um auf alle zu übertragen
              </p>
            </div>

            {/* Rechts: Palette */}
            <ModelPalette
              activeId={activeId}
              onSelect={handlePaletteSelect}
            />
          </div>

          {/* ── Länge + Ecken ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Gesamtlänge (Meter)</FieldLabel>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  placeholder="z.B. 35"
                  value={bz.laenge}
                  onChange={(e) => update({ betonzaun: { ...bz, laenge: e.target.value } })}
                  style={{ ...inputStyle(), paddingRight: '52px' }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
                  style={{ color: '#C08898' }}
                >
                  m
                </span>
              </div>
            </div>

            <div>
              <FieldLabel>Anzahl Ecken (90°)</FieldLabel>
              <div className="flex items-center gap-3 h-[50px]">
                <button type="button"
                  onClick={() => update({ betonzaun: { ...bz, ecken: Math.max(0, bz.ecken - 1) } })}
                  className="w-12 h-12 rounded-xl text-xl font-bold transition-all active:scale-90"
                  style={{ background: '#33000D', border: '1px solid #440011', color: '#C88090' }}
                >
                  −
                </button>
                <span className="text-2xl font-bold w-8 text-center" style={{ color: '#FFFFFF' }}>
                  {bz.ecken}
                </span>
                <button type="button"
                  onClick={() => update({ betonzaun: { ...bz, ecken: Math.min(10, bz.ecken + 1) } })}
                  className="w-12 h-12 rounded-xl text-xl font-bold transition-all active:scale-90"
                  style={{ background: '#33000D', border: '1px solid #440011', color: '#C88090' }}
                >
                  +
                </button>
                <span className="text-sm" style={{ color: '#C08898' }}>
                  {bz.ecken === 0 ? 'Gerade' : `${bz.ecken} Eck${bz.ecken === 1 ? 'e' : 'en'}`}
                </span>
              </div>
            </div>
          </div>

          {/* ── Stückliste ─────────────────────────────────────────── */}
          <Stueckliste
            platten={bz.platten}
            laenge={bz.laenge}
            hoehe={bz.hoehe}
            ecken={bz.ecken}
            pfeilerTyp={bz.pfeiler}
          />
        </>
      ) : (
        <div className="rounded-xl p-6 text-center" style={{ background: '#0D0003', border: '1px dashed #440011' }}>
          <p className="text-sm" style={{ color: '#C08898' }}>
            Bitte zuerst eine <strong style={{ color: '#C08898' }}>Gesamthöhe</strong> wählen.
          </p>
        </div>
      )}

    </div>
  )
}
