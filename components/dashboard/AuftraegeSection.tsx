'use client'

import { useState, useEffect } from 'react'
import SectionHeader from './SectionHeader'
import {
  listAuftraege,
  defaultPhasen,
  AUFTRAG_STATUS_LABELS,
  AUFTRAG_STATUS_COLORS,
  type AuftragRecord,
  type AuftragPhase,
  type Adresse,
} from '@/lib/auftraege'
import { useJtlAuftraege, type JtlAuftrag } from '@/lib/useJtlData'
import BelegButton from './BelegButton'


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

// ── JTL → AuftragRecord ───────────────────────────────────────────────────────

function mapJtlAdresse(a: JtlAuftrag['rechnungsadresse']): Adresse | null {
  if (!a) return null
  return {
    firma:      a.firma ?? undefined,
    vorname:    a.vorname,
    nachname:   a.nachname,
    strasse:    a.strasse,
    hausnummer: '',       // JTL speichert Hausnummer in cStrasse kombiniert
    plz:        a.plz,
    ort:        a.ort,
    land:       a.land,
  }
}

function mapJtlAuftrag(a: JtlAuftrag): AuftragRecord {
  const betragFormatted = new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
  }).format(a.betragBrutto)

  const statusMap: Record<JtlAuftrag['status'], AuftragRecord['status']> = {
    bestaetigt:       'bestaetigt',
    in_vorbereitung:  'in_vorbereitung',
    in_montage:       'in_montage',
    abgeschlossen:    'abgeschlossen',
    storniert:        'abgeschlossen',
  }

  // Positionen als Projekt-Details: erste Position = Hauptleistung, Rest = Besonderheiten
  const positionen = a.positionen ?? []
  const hauptpos   = positionen[0]
  const nebenpos   = positionen.slice(1)

  return {
    id:           a.belegnummer,
    angebotId:    '',
    createdAt:    a.datum,
    updatedAt:    a.datum,
    status:       statusMap[a.status] ?? 'bestaetigt',
    leistung:     a.betreff,
    betrag:       betragFormatted,
    betragNum:    a.betragBrutto,
    produkt:      hauptpos?.artikelnr ?? '',
    modell:       hauptpos?.bezeichnung ?? a.betreff,
    hoehe:        '',
    laenge:       '',
    farbePlatten: '',
    farbePfeiler: '',
    besonderheiten: nebenpos.map((p) => `${p.bezeichnung}${p.menge !== 1 ? ` (${p.menge} ${p.einheit})` : ''}`).join('\n'),
    montagetermin:  a.montagetermin,
    signatur:       '',
    signierAt:      a.datum,
    rechnungsadresse: mapJtlAdresse(a.rechnungsadresse),
    lieferadresse:    mapJtlAdresse(a.lieferadresse),
    jtlAuftragId:   a.belegnummer,
    phasen:         defaultPhasen(a.montagetermin),
  }
}

// ── Phasen-Timeline ───────────────────────────────────────────────────────────

function PhasenTimeline({ phasen }: { phasen: AuftragPhase[] }) {
  const phaseColors = {
    done:    { dot: 'linear-gradient(135deg, #3a7a4a, #5bc97a)', text: '#5bc97a', bg: '#1a1e1a', border: '#2a3a2a' },
    active:  { dot: 'linear-gradient(135deg, #5a0016, #800020)', text: '#800020', bg: '#1e1a0a', border: '#3d3210' },
    pending: { dot: '#700020',                                   text: '#C08898', bg: '#3A000F', border: '#700020' },
  }
  const labels = { done: 'Erledigt', active: 'Aktuell', pending: 'Ausstehend' }

  const activeIdx = phasen.findIndex((p) => p.status === 'active')
  const progress  = activeIdx >= 0 ? Math.round((activeIdx / (phasen.length - 1)) * 100) : 0

  return (
    <div>
      {/* Fortschrittsbalken */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: '#C08898' }}>Gesamtfortschritt</span>
          <span className="text-xs font-bold" style={{ color: '#800020' }}>{progress}%</span>
        </div>
        <div className="w-full h-1 rounded-full" style={{ background: '#700020' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #5a0016, #800020)' }}
          />
        </div>
      </div>

      {/* Schritte */}
      <div className="relative pl-7 space-y-2">
        <div className="absolute left-2.5 top-2 bottom-2 w-px" style={{ background: '#700020' }} />
        {phasen.map((phase) => {
          const s = phaseColors[phase.status]
          return (
            <div key={phase.key} className="relative">
              {/* Punkt */}
              <div
                className="absolute -left-7 top-4 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: s.dot,
                  border: phase.status === 'pending' ? '1px solid #9CA3AF' : 'none',
                  boxShadow: phase.status === 'active' ? '0 0 8px rgba(128,0,32,0.4)' : 'none',
                }}
              >
                {phase.status === 'done' && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.2 7.2L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {phase.status === 'active' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#fff8' }} />
                )}
              </div>

              <div className="rounded-xl p-3.5 mb-2"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-xs font-semibold"
                        style={{ color: phase.status === 'pending' ? '#C08898' : '#F5D0D5' }}>
                        {phase.label}
                      </p>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                        style={{ background: `${s.text}15`, color: s.text, border: `1px solid ${s.text}25` }}>
                        {labels[phase.status]}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: phase.status === 'pending' ? '#C08898' : '#C88090' }}>
                      {phase.beschreibung}
                    </p>
                  </div>
                  <p className="text-xs flex-shrink-0"
                    style={{ color: phase.status === 'pending' ? '#C08898' : '#C88090' }}>
                    {phase.datum}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Adress-Block ─────────────────────────────────────────────────────────────

function AdressBlock({ adresse, label }: { adresse: Adresse | null; label: string }) {
  if (!adresse) return (
    <div className="rounded-xl p-4" style={{ background: '#4D0013', border: '1px solid #9A0025' }}>
      <p className="text-xs font-semibold mb-1" style={{ color: '#C08898' }}>{label}</p>
      <p className="text-xs" style={{ color: '#C08898' }}>Wird noch hinterlegt</p>
    </div>
  )
  return (
    <div className="rounded-xl p-4 space-y-1" style={{ background: '#4D0013', border: '1px solid #9A0025' }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2"
        style={{ color: '#C08898', letterSpacing: '0.1em' }}>
        {label}
      </p>
      {adresse.firma && <p className="text-xs font-medium" style={{ color: '#c0c0c0' }}>{adresse.firma}</p>}
      <p className="text-xs" style={{ color: '#C88090' }}>{adresse.vorname} {adresse.nachname}</p>
      <p className="text-xs" style={{ color: '#C88090' }}>{adresse.strasse} {adresse.hausnummer}</p>
      <p className="text-xs" style={{ color: '#C88090' }}>{adresse.plz} {adresse.ort}</p>
      <p className="text-xs" style={{ color: '#C88090' }}>{adresse.land}</p>
    </div>
  )
}

// ── Projekt-Detail-Card ───────────────────────────────────────────────────────

function ProjektDetail({ auftrag }: { auftrag: AuftragRecord }) {
  const statusColor = AUFTRAG_STATUS_COLORS[auftrag.status]
  const statusLabel = AUFTRAG_STATUS_LABELS[auftrag.status]
  const montageDatum = auftrag.montagetermin
    ? new Date(auftrag.montagetermin).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Wird mitgeteilt'

  const platteHex  = auftrag.farbePlatten
  const pfeilerHex = auftrag.farbePfeiler

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#3A000F', border: '1px solid #9A0025' }}
    >
      {/* Kopfzeile */}
      <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap"
        style={{ background: 'linear-gradient(145deg, #4D0013, #3A000F)', borderBottom: '1px solid #9A0025' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-sm font-bold" style={{ color: '#800020' }}>
              {auftrag.id}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs" style={{ color: '#C08898' }}>
            Unterschrieben am {formatDate(auftrag.signierAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{auftrag.betrag}</p>
            <p className="text-xs mt-0.5" style={{ color: '#C08898' }}>Auftragsvolumen</p>
          </div>
          <BelegButton type="auftrag" belegnummer={auftrag.id} label="Auftragsbestätigung" />
        </div>
      </div>

      <div className="p-5 space-y-6">

        {/* ── Projekt-Übersicht ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Technische Daten */}
          <div className="rounded-xl p-4 space-y-2.5"
            style={{ background: '#4D0013', border: '1px solid #9A0025' }}
          >
            <p className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#C08898', letterSpacing: '0.1em' }}>
              Projekt-Details
            </p>

            {/* Wenn JTL-Daten: Hauptposition als Leistung, dann Nebenleistungen */}
            {auftrag.modell && (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs flex-shrink-0" style={{ color: '#C08898' }}>Leistung</span>
                <span className="text-xs font-medium text-right" style={{ color: '#F5D0D5' }}>{auftrag.modell}</span>
              </div>
            )}

            {/* Höhe / Länge nur anzeigen wenn befüllt */}
            {auftrag.hoehe && (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs flex-shrink-0" style={{ color: '#C08898' }}>Höhe</span>
                <span className="text-xs font-medium text-right" style={{ color: '#F5D0D5' }}>{auftrag.hoehe}</span>
              </div>
            )}
            {auftrag.laenge && (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs flex-shrink-0" style={{ color: '#C08898' }}>Länge</span>
                <span className="text-xs font-medium text-right" style={{ color: '#F5D0D5' }}>{auftrag.laenge}</span>
              </div>
            )}

            {/* Farb-Zeilen nur anzeigen wenn befüllt */}
            {platteHex && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs flex-shrink-0" style={{ color: '#C08898' }}>Farbe Platten</span>
                <p className="text-xs text-right" style={{ color: '#F5D0D5' }}>{platteHex}</p>
              </div>
            )}
            {pfeilerHex && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs flex-shrink-0" style={{ color: '#C08898' }}>Farbe Pfeiler</span>
                <p className="text-xs text-right" style={{ color: '#F5D0D5' }}>{pfeilerHex}</p>
              </div>
            )}

            {/* Nebenleistungen / Besonderheiten */}
            {auftrag.besonderheiten && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#C08898' }}>Weitere Leistungen</p>
                {auftrag.besonderheiten.split('\n').map((zeile, i) => (
                  <p key={i} className="text-xs leading-relaxed" style={{ color: '#C88090' }}>
                    • {zeile}
                  </p>
                ))}
              </div>
            )}

            {/* Fallback wenn gar nichts befüllt */}
            {!auftrag.modell && !auftrag.hoehe && !auftrag.laenge && !auftrag.besonderheiten && (
              <p className="text-xs" style={{ color: '#C08898' }}>Keine Detailangaben verfügbar</p>
            )}
          </div>

          {/* Termin-Card */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: '#4D0013', border: '1px solid #2a3040' }}
          >
            <p className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#4a5a6a', letterSpacing: '0.1em' }}>
              Voraussichtlicher Montagetermin
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#3A000F' }}>
                🗓️
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#d4e0ec' }}>{montageDatum}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a5a6a' }}>
                  {auftrag.montagetermin ? 'Termin bestätigt' : 'Wird noch festgelegt'}
                </p>
              </div>
            </div>
            <div className="pt-2" style={{ borderTop: '1px solid #252e3a' }}>
              <p className="text-xs" style={{ color: '#3a4a5a' }}>
                Angebots-Referenz: <span style={{ color: '#5a7a9a' }}>{auftrag.angebotId}</span>
              </p>
              {auftrag.jtlAuftragId && (
                <p className="text-xs mt-0.5" style={{ color: '#3a4a5a' }}>
                  Auftragsnummer: <span style={{ color: '#5a7a9a' }}>{auftrag.jtlAuftragId}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Adressen ─────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: '#C08898', letterSpacing: '0.12em' }}>
            Adressen
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdressBlock adresse={auftrag.rechnungsadresse} label="Rechnungsadresse" />
            <AdressBlock adresse={auftrag.lieferadresse}    label="Lieferadresse / Montageadresse" />
          </div>
        </div>

        {/* ── Projekt-Timeline ─────────────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ color: '#C08898', letterSpacing: '0.12em' }}>
            Auftragsverlauf
          </p>
          <PhasenTimeline phasen={auftrag.phasen} />
        </div>

      </div>
    </div>
  )
}

// ── Haupt-Sektion ─────────────────────────────────────────────────────────────

export default function AuftraegeSection() {
  const [auftraege, setAuftraege] = useState<AuftragRecord[]>([])
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [jtlLoaded, setJtlLoaded] = useState(false)

  // JTL-Live-Daten
  const { data: jtlAuftraege, loading: jtlLoading, error: jtlError } = useJtlAuftraege()

  // Lokale Aufträge (digital unterschriebene) laden
  useEffect(() => {
    setAuftraege(listAuftraege())
  }, [])

  // Wenn JTL-Daten ankommen: mergen (JTL hat Vorrang, lokale Unterschriften bleiben erhalten)
  useEffect(() => {
    if (jtlLoading) return
    const localAuftraege = listAuftraege()
    if (jtlAuftraege && jtlAuftraege.length > 0) {
      const jtlMapped = jtlAuftraege.map(mapJtlAuftrag)
      // Lokale Aufträge, die nicht in JTL sind (noch nicht synchronisiert), anhängen
      const jtlIds = new Set(jtlMapped.map((a) => a.id))
      const localOnly = localAuftraege.filter((a) => !jtlIds.has(a.id))
      setAuftraege([...jtlMapped, ...localOnly])
      setJtlLoaded(true)
    } else {
      setAuftraege(localAuftraege)
    }
  }, [jtlAuftraege, jtlLoading])

  // Auf neue Aufträge aus AngeboteSection reagieren (Storage-Event)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'ez_auftraege') {
        const local = listAuftraege()
        setAuftraege((prev) => {
          // Neue lokale Aufträge einfügen, die noch nicht in der Liste sind
          const existingIds = new Set(prev.map((a) => a.id))
          const newOnes = local.filter((a) => !existingIds.has(a.id))
          return newOnes.length > 0 ? [...newOnes, ...prev] : prev
        })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const aktiv      = auftraege.filter((a) => a.status !== 'abgeschlossen').length
  const fertig     = auftraege.filter((a) => a.status === 'abgeschlossen').length
  const gesamtVol  = auftraege.reduce((s, a) => s + a.betragNum, 0).toLocaleString('de-DE') + ' €'

  return (
    <section>
      <SectionHeader
        number="03"
        title="Meine Aufträge"
        subtitle={
          jtlLoading
            ? 'Daten werden geladen …'
            : jtlLoaded
              ? 'Live-Daten – digital unterschrieben und in Bearbeitung'
              : 'Bestätigte Aufträge – digital unterschrieben und in Bearbeitung'
        }
      />

      {/* JTL-Fehlerhinweis */}
      {jtlError && (
        <div className="mb-4 rounded-lg px-4 py-2.5 text-xs flex items-center gap-2"
          style={{ background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.15)', color: '#e08080' }}
        >
          <span>⚠</span>
          <span>System nicht erreichbar – lokale Daten werden angezeigt.</span>
        </div>
      )}

      {/* Übersichts-Kacheln */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Aktiv',         value: String(aktiv),   color: '#800020' },
          { label: 'Abgeschlossen', value: String(fertig),  color: '#5bc97a' },
          { label: 'Gesamtvolumen', value: gesamtVol,       color: '#5b9bd5' },
        ].map((kachel) => (
          <div key={kachel.label} className="rounded-xl p-4 text-center"
            style={{ background: '#4D0013', border: '1px solid #9A0025' }}
          >
            <p className="text-base sm:text-2xl font-bold truncate" style={{ color: kachel.color }}>
              {kachel.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#C88090' }}>{kachel.label}</p>
          </div>
        ))}
      </div>

      {/* Auftragsliste */}
      {auftraege.length === 0 ? (
        <div className="rounded-xl p-8 text-center"
          style={{ background: '#4D0013', border: '1px dashed #9A0025' }}
        >
          <p className="text-2xl mb-3">📋</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#C08898' }}>
            Noch keine Aufträge
          </p>
          <p className="text-xs" style={{ color: '#C08898' }}>
            Sobald Sie ein Angebot digital unterschreiben, erscheint es hier als Auftrag.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {auftraege.map((auftrag) => {
            const isOpen  = expanded === auftrag.id
            const stColor = AUFTRAG_STATUS_COLORS[auftrag.status]
            const stLabel = AUFTRAG_STATUS_LABELS[auftrag.status]

            return (
              <div key={auftrag.id}>
                {/* Zusammengefalteter Header */}
                <button
                  type="button"
                  className="w-full text-left rounded-xl p-4 transition-all duration-150 hover:opacity-90"
                  style={{
                    background: isOpen
                      ? 'linear-gradient(145deg, #222218, #1e1e18)'
                      : '#FFFFFF',
                    border: isOpen ? '1px solid #3d3210' : '1px solid #9A0025',
                  }}
                  onClick={() => setExpanded(isOpen ? null : auftrag.id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Status-Dot */}
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: stColor, boxShadow: `0 0 6px ${stColor}80` }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold" style={{ color: '#800020' }}>
                          {auftrag.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: `${stColor}18`, color: stColor, border: `1px solid ${stColor}30` }}>
                          {stLabel}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#C88090' }}>
                        {auftrag.leistung}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                        {auftrag.betrag}
                      </span>
                      <span
                        className="text-xs transition-transform duration-200"
                        style={{
                          color: '#C08898',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          display: 'inline-block',
                        }}
                      >
                        ▾
                      </span>
                    </div>
                  </div>
                </button>

                {/* Ausgeklappte Detail-Ansicht */}
                {isOpen && (
                  <div className="mt-2">
                    <ProjektDetail auftrag={auftrag} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
