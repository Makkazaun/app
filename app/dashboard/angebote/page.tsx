'use client'

import { useState } from 'react'
import { useJtlAngebote, type JtlAngebot } from '@/lib/useJtlData'
import BelegButton from '@/components/dashboard/BelegButton'
import AngebotAnnehmenModal from '@/components/dashboard/AngebotAnnehmenModal'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

const STATUS_LABEL: Record<JtlAngebot['status'], string> = {
  offen:      'Offen',
  angenommen: 'Angenommen',
  storniert:  'Storniert',
  abgelehnt:  'Abgelehnt',
}
const STATUS_COLOR: Record<JtlAngebot['status'], string> = {
  offen:      '#c9a84c',
  angenommen: '#5bc97a',
  storniert:  '#5a5a5a',
  abgelehnt:  '#c07070',
}

// ── Ablehnen-Button mit Inline-Bestätigung ────────────────────────────────────

function AblehnenButton({ angebot, onSuccess }: { angebot: JtlAngebot; onSuccess: () => void }) {
  const [confirm, setConfirm]  = useState(false)
  const [loading, setLoading]  = useState(false)

  async function handleReject() {
    setLoading(true)
    try {
      await fetch('/api/jtl/reject-angebot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ kAngebot: angebot.kAuftrag }),
      })
      onSuccess()
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]" style={{ color: '#c07070' }}>Sicher?</span>
        <button onClick={handleReject} disabled={loading}
          className="px-2 py-1 rounded text-[10px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'rgba(220,50,50,0.15)', color: '#e08080', border: '1px solid rgba(220,50,50,0.25)' }}>
          {loading ? '…' : 'Ja'}
        </button>
        <button onClick={() => setConfirm(false)} disabled={loading}
          className="px-2 py-1 rounded text-[10px] transition-opacity hover:opacity-80"
          style={{ background: '#252525', color: '#6a6a6a', border: '1px solid #333' }}>
          Nein
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
      style={{ background: 'rgba(220,50,50,0.08)', color: '#c07070', border: '1px solid rgba(220,50,50,0.20)' }}
      title="Angebot ablehnen"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

// ── Aktionen-Zelle für offene Angebote ────────────────────────────────────────

function AngebotAktionen({
  angebot,
  onAnnehmen,
  onReload,
}: {
  angebot:    JtlAngebot
  onAnnehmen: (a: JtlAngebot) => void
  onReload:   () => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onAnnehmen(angebot)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #7a5c10, #c9a84c)',
          color:      '#1a1a1a',
          boxShadow:  '0 1px 8px rgba(201,168,76,0.25)',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l3 3 4-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Annehmen
      </button>
      <AblehnenButton angebot={angebot} onSuccess={onReload} />
    </div>
  )
}

// ── Haupt-Seite ───────────────────────────────────────────────────────────────

export default function AngebotePage() {
  const { data, loading, error, reload } = useJtlAngebote()
  const [signAngebot, setSignAngebot] = useState<JtlAngebot | null>(null)

  const angebote  = data ?? []
  const offen      = angebote.filter((a) => a.status === 'offen').length
  const angenommen = angebote.filter((a) => a.status === 'angenommen').length
  const storniert  = angebote.filter((a) => a.status === 'storniert' || a.status === 'abgelehnt').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#c9a84c' }}>
            Angebote
          </p>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e8e8' }}>Meine Angebote</h1>
          <p className="mt-1 text-sm" style={{ color: '#6a6a6a' }}>
            {loading ? 'Daten werden geladen …' : 'Aktuelle Daten aus dem System'}
          </p>
        </div>
        {!loading && !error && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: '#1e1e1e', color: '#5bc97a', border: '1px solid #2d3d2d' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#5bc97a' }} />
            System · Live
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-xs"
          style={{ background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.15)', color: '#e08080' }}>
          ⚠ Verbindungsfehler: {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse"
              style={{ background: '#1e1e1e', border: '1px solid #2d2d2d', height: '72px' }} />
          ))}
        </div>
      )}

      {!loading && angebote.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Offen',      count: offen,      color: '#c9a84c', sub: 'Warten auf Unterschrift' },
            { label: 'Angenommen', count: angenommen, color: '#5bc97a', sub: 'Aufträge aktiv' },
            { label: 'Abgelehnt / Storniert', count: storniert, color: '#5a5a5a', sub: 'Nicht mehr gültig' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4 text-center"
              style={{ background: '#1e1e1e', border: '1px solid #2d2d2d' }}>
              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.count}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#8a8a8a' }}>{item.label}</p>
              <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: '#3a3a3a' }}>{item.sub}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && angebote.length === 0 && (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: '#1e1e1e', border: '1px dashed #2d2d2d' }}>
          <div className="text-4xl mb-4">📋</div>
          <p className="text-base font-semibold mb-2" style={{ color: '#5a5a5a' }}>
            Aktuell liegen keine Angebote vor
          </p>
          <p className="text-sm" style={{ color: '#3a3a3a' }}>
            Sobald ein Angebot für Ihr Konto erstellt wird, erscheint es hier.
          </p>
        </div>
      )}

      {!loading && angebote.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d2d2d' }}>

          {/* Tabellenkopf – Desktop */}
          <div
            className="hidden sm:grid px-5 py-3 text-xs font-medium uppercase tracking-wider"
            style={{
              background:    '#1e1e1e',
              borderBottom:  '1px solid #2d2d2d',
              color:         '#4a4a4a',
              gridTemplateColumns: '130px 1fr 120px 110px 150px 70px',
              gap:           '12px',
            }}
          >
            <span>Nummer</span>
            <span>Leistung</span>
            <span>Betrag</span>
            <span>Status</span>
            <span>Aktionen</span>
            <span className="text-right">PDF</span>
          </div>

          {angebote.map((a, i) => {
            const color  = STATUS_COLOR[a.status]
            const label  = STATUS_LABEL[a.status]
            const dimmed = a.status === 'storniert' || a.status === 'abgelehnt'
            return (
              <div
                key={a.kAuftrag}
                style={{
                  background:   i % 2 === 0 ? '#191919' : '#161616',
                  borderBottom: i < angebote.length - 1 ? '1px solid #222' : 'none',
                  opacity:      dimmed ? 0.55 : 1,
                }}
              >
                {/* Desktop */}
                <div
                  className="hidden sm:grid items-center px-5 py-4 gap-3"
                  style={{ gridTemplateColumns: '130px 1fr 120px 110px 150px 70px' }}
                >
                  <div>
                    <p className="font-mono text-xs font-semibold" style={{ color: '#c9a84c' }}>
                      {a.belegnummer}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a4a' }}>{formatDate(a.datum)}</p>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: '#b0b0b0' }}>{a.betreff}</p>
                  <p className="text-sm font-semibold" style={{ color: '#e8e8e8' }}>
                    {formatEur(a.betragBrutto)}
                  </p>
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium w-fit"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                  >
                    {label}
                  </span>
                  <div>
                    {a.status === 'offen' ? (
                      <AngebotAktionen
                        angebot={a}
                        onAnnehmen={setSignAngebot}
                        onReload={reload}
                      />
                    ) : null}
                  </div>
                  <div className="flex justify-end">
                    <BelegButton type="angebot" belegnummer={a.belegnummer} />
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:hidden px-4 py-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-semibold" style={{ color: '#c9a84c' }}>
                        {a.belegnummer}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#4a4a4a' }}>{formatDate(a.datum)}</p>
                    </div>
                    <span
                      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#9a9a9a' }}>{a.betreff}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: '#e8e8e8' }}>
                      {formatEur(a.betragBrutto)}
                    </p>
                    <div className="flex items-center gap-2">
                      {a.status === 'offen' && (
                        <AngebotAktionen
                          angebot={a}
                          onAnnehmen={setSignAngebot}
                          onReload={reload}
                        />
                      )}
                      <BelegButton type="angebot" belegnummer={a.belegnummer} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-center" style={{ color: '#2a2a2a' }}>
          Live-Daten · Alle Beträge inkl. MwSt.
        </p>
      )}

      {/* Unterschriften-Modal */}
      {signAngebot && (
        <AngebotAnnehmenModal
          kAngebot={signAngebot.kAuftrag}
          belegnummer={signAngebot.belegnummer}
          betrag={formatEur(signAngebot.betragBrutto)}
          betreff={signAngebot.betreff}
          onSuccess={reload}
          onClose={() => setSignAngebot(null)}
        />
      )}
    </div>
  )
}
