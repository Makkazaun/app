'use client'

import { useState, useEffect } from 'react'
import SectionHeader from './SectionHeader'
import DigitalSign from './DigitalSign'
import { createAuftragFromAngebot } from '@/lib/auftraege'
import { addNotification } from '@/lib/notifications'
import { useJtlAngebote, signAngebotInJtl, type JtlAngebot } from '@/lib/useJtlData'
import BelegButton from './BelegButton'

type AngebotStatus = 'offen' | 'angenommen' | 'abgelaufen' | 'auftrag_bestaetigt'

interface Angebot {
  id:         string
  kAngebot:   number | null   // JTL interner PK – für Status-Update beim Unterschreiben
  datum:      string
  leistung:   string
  betrag:     string
  betragNum:  number
  status:     AngebotStatus
  gueltigBis: string
  // Projekt-Details für Auftrag-Erstellung
  produkt:       string
  modell:        string
  hoehe:         string
  laenge:        string
  farbePlatten:  string
  farbePfeiler:  string
  besonderheiten: string
}

const ANGEBOTE_KEY = 'ez_angebote_status'

// ── JTL → internes Format ────────────────────────────────────────────────────

function mapJtlAngebot(a: JtlAngebot): Angebot {
  const betragFormatted = new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
  }).format(a.betragBrutto)

  const statusMap: Record<JtlAngebot['status'], AngebotStatus> = {
    offen:      'offen',
    angenommen: 'angenommen',
    storniert:  'abgelaufen',
    abgelehnt:  'abgelaufen',
  }

  const datumFormatted = new Date(a.datum).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const hauptpos = a.positionen?.[0]

  return {
    id:          a.belegnummer,
    kAngebot:    a.kAuftrag,
    datum:       datumFormatted,
    leistung:    a.betreff,
    betrag:      betragFormatted,
    betragNum:   a.betragBrutto,
    status:      statusMap[a.status] ?? 'offen',
    gueltigBis:  datumFormatted,  // JTL kennt kein Ablaufdatum – Erstelldatum als Fallback
    produkt:     hauptpos?.artikelnr ?? '',
    modell:      a.betreff,
    hoehe:       '',
    laenge:      '',
    farbePlatten:  '',
    farbePfeiler:  '',
    besonderheiten: a.positionen?.slice(1).map((p) => p.bezeichnung).join(', ') ?? '',
  }
}


const STATUS_STYLES: Record<AngebotStatus, { label: string; color: string }> = {
  offen:              { label: 'Offen – Unterschrift ausstehend', color: '#800020' },
  angenommen:         { label: 'Angenommen',                      color: '#5bc97a' },
  abgelaufen:         { label: 'Abgelaufen',                      color: '#C08898' },
  auftrag_bestaetigt: { label: 'Auftrag bestätigt ✓',             color: '#5bc97a' },
}

export default function AngeboteSection() {
  const [angebote,    setAngebote]    = useState<Angebot[]>([])
  const [signTarget,  setSignTarget]  = useState<Angebot | null>(null)
  const [justSigned,  setJustSigned]  = useState<string | null>(null)  // Angebots-ID
  const [dankModal,   setDankModal]   = useState<string | null>(null)  // Angebots-ID nach Unterschrift
  const [jtlLoaded,   setJtlLoaded]   = useState(false)

  // JTL-Live-Daten laden
  const { data: jtlAngebote, loading: jtlLoading, error: jtlError } = useJtlAngebote()

  // Lokale Status-Overrides (Unterschrift) aus localStorage lesen
  function applyStatusOverrides(list: Angebot[]): Angebot[] {
    if (typeof window === 'undefined') return list
    try {
      const saved = localStorage.getItem(ANGEBOTE_KEY)
      if (!saved) return list
      const statusMap = JSON.parse(saved) as Record<string, AngebotStatus>
      return list.map((a) => ({ ...a, status: statusMap[a.id] ?? a.status }))
    } catch { return list }
  }

  // Sobald JTL-Daten ankommen: echte Daten verwenden
  useEffect(() => {
    if (jtlLoading) return
    if (jtlAngebote && jtlAngebote.length > 0) {
      const mapped = jtlAngebote.map(mapJtlAngebot)
      setAngebote(applyStatusOverrides(mapped))
      setJtlLoaded(true)
    } else {
      setAngebote([])
      if (!jtlLoading) setJtlLoaded(true)
    }
  }, [jtlAngebote, jtlLoading])

  function persistStatus(id: string, status: AngebotStatus) {
    try {
      const saved = localStorage.getItem(ANGEBOTE_KEY)
      const map: Record<string, AngebotStatus> = saved ? JSON.parse(saved) : {}
      map[id] = status
      localStorage.setItem(ANGEBOTE_KEY, JSON.stringify(map))
    } catch { /* ignore */ }
  }

  function handleSign(signaturBase64: string) {
    if (!signTarget) return

    // JTL-Wawi: Angebot als "angenommen" markieren (fire-and-forget, non-blocking)
    if (signTarget.kAngebot !== null) {
      signAngebotInJtl(signTarget.kAngebot).then((ok) => {
        if (!ok) console.warn('[AngeboteSection] JTL-Status-Update fehlgeschlagen für', signTarget.kAngebot)
      })
    }

    // Auftrag erstellen und in localStorage speichern
    createAuftragFromAngebot({
      angebotId:       signTarget.id,
      leistung:        signTarget.leistung,
      betrag:          signTarget.betrag,
      betragNum:       signTarget.betragNum,
      produkt:         signTarget.produkt,
      modell:          signTarget.modell,
      hoehe:           signTarget.hoehe,
      laenge:          signTarget.laenge,
      farbePlatten:    signTarget.farbePlatten,
      farbePfeiler:    signTarget.farbePfeiler,
      besonderheiten:  signTarget.besonderheiten,
      montagetermin:   null,
      signatur:        signaturBase64,
      rechnungsadresse: null,
      lieferadresse:    null,
    })

    // Benachrichtigung auslösen
    addNotification({
      typ:       'auftrag_bestaetigt',
      titel:     'Auftrag bestätigt',
      nachricht: `Ihr Auftrag ${signTarget.id.replace('ANG', 'AUF')} wurde digital unterschrieben und bestätigt.`,
      refId:     signTarget.id.replace('ANG', 'AUF'),
    })

    // Status im lokalen State aktualisieren
    const updated = angebote.map((a) =>
      a.id === signTarget.id ? { ...a, status: 'auftrag_bestaetigt' as AngebotStatus } : a
    )
    setAngebote(updated)
    persistStatus(signTarget.id, 'auftrag_bestaetigt')

    setJustSigned(signTarget.id)
    setDankModal(signTarget.id)
    setSignTarget(null)

    // Flash-Highlight zurücksetzen
    setTimeout(() => setJustSigned(null), 3000)
  }

  const offen     = angebote.filter((a) => a.status === 'offen').length
  const angenomm  = angebote.filter((a) => a.status === 'angenommen' || a.status === 'auftrag_bestaetigt').length
  const abgelauf  = angebote.filter((a) => a.status === 'abgelaufen').length

  return (
    <section>
      <SectionHeader
        number="02"
        title="Meine Angebote"
        subtitle={
          jtlLoading
            ? 'Daten werden geladen …'
            : 'Live-Daten – offen, angenommen oder abgelaufen'
        }
      />

      {/* JTL-Fehlerhinweis */}
      {jtlError && (
        <div className="mb-4 rounded-lg px-4 py-2.5 text-xs flex items-center gap-2"
          style={{ background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.15)', color: '#e08080' }}
        >
          <span>⚠</span>
          <span>System nicht erreichbar – Verbindung wird hergestellt. Daten werden lokal zwischengespeichert.</span>
        </div>
      )}

      {/* Status-Übersicht */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Offen', count: offen,     color: '#800020', sub: 'Warten auf Unterschrift' },
          { label: 'Angenommen', count: angenomm, color: '#5bc97a', sub: 'Aufträge aktiv' },
          { label: 'Abgelaufen', count: abgelauf, color: '#C08898', sub: 'Nicht mehr gültig' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-4 text-center"
            style={{ background: '#33000D', border: '1px solid #440011' }}
          >
            <p className="text-2xl font-bold" style={{ color: item.color }}>{item.count}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#C88090' }}>{item.label}</p>
            <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: '#C08898' }}>{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Leer-Zustand */}
      {!jtlLoading && jtlLoaded && angebote.length === 0 && (
        <div className="rounded-xl p-10 text-center"
          style={{ background: '#33000D', border: '1px dashed #440011' }}
        >
          <p className="text-2xl mb-3">📋</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#C08898' }}>
            Aktuell liegen keine Angebote vor
          </p>
          <p className="text-xs" style={{ color: '#C08898' }}>
            Sobald ein Angebot für Ihr Konto erstellt wird, erscheint es hier.
          </p>
        </div>
      )}

      {/* Angebots-Tabelle */}
      {angebote.length > 0 && (
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #440011' }}>

        {/* Header */}
        <div
          className="hidden sm:grid px-5 py-3 text-xs font-medium uppercase tracking-wider"
          style={{
            background: '#33000D',
            borderBottom: '1px solid #440011',
            color: '#C08898',
            letterSpacing: '0.1em',
            gridTemplateColumns: '140px 1fr 110px 180px 80px',
            gap: '16px',
          }}
        >
          <span>Nummer</span>
          <span>Leistung</span>
          <span>Betrag</span>
          <span>Status</span>
          <span className="text-right">Aktion</span>
        </div>

        {angebote.map((a, i) => {
          const st = STATUS_STYLES[a.status]
          const isJustSigned = justSigned === a.id

          return (
            <div
              key={a.id}
              style={{
                background: isJustSigned
                  ? 'rgba(91,201,122,0.06)'
                  : i % 2 === 0 ? '#33000D' : '#080002',
                borderBottom: i < angebote.length - 1 ? '1px solid #440011' : 'none',
                transition: 'background 0.5s',
              }}
            >
              {/* Desktop-Zeile */}
              <div
                className="hidden sm:grid items-center px-5 py-4 gap-4"
                style={{ gridTemplateColumns: '140px 1fr 110px 180px 80px' }}
              >
                <div>
                  <p className="font-mono text-xs font-semibold" style={{ color: '#800020' }}>{a.id}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#C08898' }}>{a.datum}</p>
                </div>
                <p className="text-xs leading-snug" style={{ color: '#F5D0D5' }}>{a.leistung}</p>
                <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{a.betrag}</p>

                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                    style={{
                      background: `${st.color}18`,
                      color: st.color,
                      border: `1px solid ${st.color}30`,
                    }}
                  >
                    {st.label}
                  </span>
                </div>

                <div className="flex justify-end">
                  {a.status === 'offen' && (
                    <SignButton onClick={() => setSignTarget(a)} />
                  )}
                  {a.status !== 'offen' && (
                    <BelegButton type="angebot" belegnummer={a.id} />
                  )}
                </div>
              </div>

              {/* Mobile-Karte */}
              <div className="sm:hidden px-4 py-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold" style={{ color: '#800020' }}>{a.id}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#C08898' }}>Gültig bis {a.gueltigBis}</p>
                  </div>
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
                    style={{
                      background: `${st.color}18`,
                      color: st.color,
                      border: `1px solid ${st.color}30`,
                    }}
                  >
                    {st.label}
                  </span>
                </div>
                <p className="text-xs leading-snug" style={{ color: '#C88090' }}>{a.leistung}</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold" style={{ color: '#FFFFFF' }}>{a.betrag}</p>
                  {a.status === 'offen' && (
                    <SignButton onClick={() => setSignTarget(a)} small />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {angebote.length > 0 && (
      <p className="mt-3 text-xs" style={{ color: '#C08898' }}>
        Datenquelle: System (Live) · Automatisch synchronisiert
      </p>
      )}

      {/* Digital-Sign Modal */}
      {signTarget && (
        <DigitalSign
          angebotId={signTarget.id}
          leistung={signTarget.leistung}
          betrag={signTarget.betrag}
          onSign={handleSign}
          onClose={() => setSignTarget(null)}
        />
      )}

      {/* Bestätigungs-Modal nach Unterschrift */}
      {dankModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setDankModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 text-center"
            style={{
              background: '#33000D',
              border: '1px solid #440011',
              boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animiertes Häkchen */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, #4a7a1a, #5bc97a)', boxShadow: '0 0 24px rgba(91,201,122,0.3)' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 14L11.5 19.5L22 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 className="text-lg font-bold mb-2" style={{ color: '#FFFFFF' }}>
              Vielen Dank!
            </h2>
            <p className="text-sm leading-relaxed mb-1" style={{ color: '#C88090' }}>
              Ihr Auftrag wird nun bearbeitet.
            </p>
            <p className="text-xs mb-6" style={{ color: '#C08898' }}>
              Wir melden uns schnellstmöglich bei Ihnen.
            </p>

            <div className="text-xs px-3 py-2 rounded-lg mb-6"
              style={{ background: '#080002', border: '1px solid #440011', color: '#C88090' }}>
              Auftrags-Nr.: <span style={{ color: '#800020' }}>{dankModal}</span>
            </div>

            <button
              type="button"
              onClick={() => setDankModal(null)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #400010, #800020)',
                color: '#ffffff',
                boxShadow: '0 4px 16px rgba(128,0,32,0.25)',
              }}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

// ── Hilfskomponenten ─────────────────────────────────────────────────────────

function SignButton({ onClick, small }: { onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
      style={{
        background: 'linear-gradient(135deg, #400010, #800020)',
        color: '#ffffff',
        borderRadius: '8px',
        padding: small ? '6px 12px' : '7px 14px',
        fontSize: small ? '11px' : '12px',
        boxShadow: '0 2px 8px rgba(128,0,32,0.25)',
        whiteSpace: 'nowrap',
      }}
    >
      ✍ Unterschreiben
    </button>
  )
}

