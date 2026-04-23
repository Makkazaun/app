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
  offen:      '#800020',
  angenommen: '#5bc97a',
  storniert:  '#5a5a5a',
  abgelehnt:  '#c07070',
}

// ── Ablehnen-Button – dezenter Text-Link mit Inline-Bestätigung ───────────────

function AblehnenButton({ angebot, onSuccess }: { angebot: JtlAngebot; onSuccess: () => void }) {
  const [confirm,  setConfirm]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleReject() {
    setLoading(true)
    setErrorMsg(null)
    let succeeded = false

    try {
      const res = await fetch('/api/jtl/reject-angebot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ kAngebot: angebot.kAuftrag, cAngebotNr: angebot.belegnummer }),
      })

      if (res.ok) {
        succeeded = true
      } else {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body.detail ?? body.error ?? 'Ablehnung fehlgeschlagen.')
      }
    } catch {
      setErrorMsg('Verbindungsfehler. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
      if (succeeded) setConfirm(false)
    }

    // onSuccess() außerhalb von finally, damit setState abgeschlossen ist
    if (succeeded) onSuccess()
  }

  if (confirm) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px]" style={{ color: '#c07070' }}>Wirklich ablehnen?</span>
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-2 py-1 rounded text-[10px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(220,50,50,0.15)', color: '#e08080', border: '1px solid rgba(220,50,50,0.25)' }}
          >
            {loading ? '…' : 'Ja, ablehnen'}
          </button>
          <button
            onClick={() => { setConfirm(false); setErrorMsg(null) }}
            disabled={loading}
            className="px-2 py-1 rounded text-[10px] transition-opacity hover:opacity-80"
            style={{ background: '#252525', color: '#6a6a6a', border: '1px solid #333' }}
          >
            Abbrechen
          </button>
        </div>
        {errorMsg && (
          <p className="text-[10px] leading-snug" style={{ color: '#e08080', maxWidth: '180px' }}>
            ⚠ {errorMsg}
          </p>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs transition-opacity hover:opacity-100"
      style={{
        background:          'none',
        border:              'none',
        padding:             '0',
        color:               'rgba(192,112,112,0.6)',
        cursor:              'pointer',
        textDecoration:      'underline',
        textDecorationColor: 'rgba(192,112,112,0.3)',
        textUnderlineOffset: '2px',
      }}
    >
      Ablehnen
    </button>
  )
}

// ── Aktions-Gruppe für offene Angebote ────────────────────────────────────────
// Gestapelte Darstellung: "Annehmen" oben (Gold-Button), "Ablehnen" unten (Text-Link)

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
    <div className="flex flex-col gap-2 items-start">
      <button
        onClick={() => onAnnehmen(angebot)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #5a0016, #800020)',
          color:      '#ffffff',
          boxShadow:  '0 1px 8px rgba(128,0,32,0.25)',
          whiteSpace: 'nowrap',
          minHeight:  '34px',
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

type FilterKey = 'offen' | 'angenommen' | 'inaktiv' | null

// ── Haupt-Seite ───────────────────────────────────────────────────────────────

export default function AngebotePage() {
  const { data, loading, error, reload } = useJtlAngebote()
  const [signAngebot,  setSignAngebot]  = useState<JtlAngebot | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterKey>(null)

  const angebote   = data ?? []
  const offen      = angebote.filter((a) => a.status === 'offen').length
  const angenommen = angebote.filter((a) => a.status === 'angenommen').length
  const inaktiv    = angebote.filter((a) => a.status === 'storniert' || a.status === 'abgelehnt').length

  const displayed = activeFilter === null
    ? angebote
    : activeFilter === 'inaktiv'
      ? angebote.filter((a) => a.status === 'storniert' || a.status === 'abgelehnt')
      : angebote.filter((a) => a.status === activeFilter)

  const filterCards: { label: string; count: number; color: string; sub: string; key: FilterKey }[] = [
    { label: 'Offen',                 count: offen,      color: '#800020', sub: 'Warten auf Unterschrift', key: 'offen' },
    { label: 'Angenommen',            count: angenommen, color: '#5bc97a', sub: 'Aufträge aktiv',          key: 'angenommen' },
    { label: 'Abgelehnt / Storniert', count: inaktiv,    color: '#5a5a5a', sub: 'Nicht mehr gültig',       key: 'inaktiv' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#800020' }}>
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
        <>
          <div className="grid grid-cols-3 gap-3">
            {filterCards.map((item) => {
              const isActive = activeFilter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveFilter(isActive ? null : item.key)}
                  className="rounded-xl p-4 text-center transition-all duration-150 hover:opacity-90"
                  style={{
                    background:  isActive ? `${item.color}14` : '#1e1e1e',
                    border:      isActive ? `1px solid ${item.color}50` : '1px solid #2d2d2d',
                    boxShadow:   isActive ? `0 0 0 1px ${item.color}20` : 'none',
                    cursor:      'pointer',
                  }}
                >
                  <p className="text-2xl font-bold" style={{ color: item.color }}>{item.count}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: isActive ? item.color : '#8a8a8a' }}>
                    {item.label}
                  </p>
                  <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: '#3a3a3a' }}>{item.sub}</p>
                </button>
              )
            })}
          </div>

          {/* Filter-Indikator */}
          {activeFilter !== null && (
            <div className="flex items-center gap-2">
              <p className="text-xs" style={{ color: '#5a5a5a' }}>
                Filter aktiv:
                <span className="ml-1.5 font-medium" style={{ color: '#800020' }}>
                  {filterCards.find(c => c.key === activeFilter)?.label}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter(null)}
                className="text-xs transition-opacity hover:opacity-70"
                style={{ color: '#5a5a5a', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                Alle anzeigen
              </button>
            </div>
          )}
        </>
      )}

      {!loading && displayed.length === 0 && (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: '#1e1e1e', border: '1px dashed #2d2d2d' }}>
          <div className="text-4xl mb-4">📋</div>
          {activeFilter !== null ? (
            <>
              <p className="text-base font-semibold mb-2" style={{ color: '#5a5a5a' }}>
                Keine Angebote in dieser Kategorie
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter(null)}
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: '#800020', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                Alle anzeigen
              </button>
            </>
          ) : (
            <>
              <p className="text-base font-semibold mb-2" style={{ color: '#5a5a5a' }}>
                Aktuell liegen keine Angebote vor
              </p>
              <p className="text-sm" style={{ color: '#3a3a3a' }}>
                Sobald ein Angebot für Ihr Konto erstellt wird, erscheint es hier.
              </p>
            </>
          )}
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d2d2d' }}>

          {/* Tabellenkopf – nur Desktop */}
          <div
            className="hidden sm:grid px-5 py-3 text-xs font-medium uppercase tracking-wider"
            style={{
              background:          '#1e1e1e',
              borderBottom:        '1px solid #2d2d2d',
              color:               '#4a4a4a',
              gridTemplateColumns: '130px 1fr 120px 110px 160px 60px',
              gap:                 '12px',
            }}
          >
            <span>Nummer</span>
            <span>Leistung</span>
            <span>Betrag</span>
            <span>Status</span>
            <span>Aktion</span>
            <span className="text-right">PDF</span>
          </div>

          {displayed.map((a, i) => {
            const color  = STATUS_COLOR[a.status]
            const label  = STATUS_LABEL[a.status]
            const dimmed = a.status === 'storniert' || a.status === 'abgelehnt'
            return (
              <div
                key={a.kAuftrag}
                style={{
                  background:   i % 2 === 0 ? '#191919' : '#161616',
                  borderBottom: i < displayed.length - 1 ? '1px solid #222' : 'none',
                  opacity:      dimmed ? 0.55 : 1,
                }}
              >
                {/* ── Desktop ──────────────────────────────────────────────── */}
                <div
                  className="hidden sm:grid items-start px-5 py-4 gap-3"
                  style={{ gridTemplateColumns: '130px 1fr 120px 110px 160px 60px' }}
                >
                  <div>
                    <p className="font-mono text-xs font-semibold" style={{ color: '#800020' }}>
                      {a.belegnummer}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a4a' }}>{formatDate(a.datum)}</p>
                  </div>
                  <p className="text-xs leading-snug pt-0.5" style={{ color: '#b0b0b0' }}>{a.betreff}</p>
                  <p className="text-sm font-semibold pt-0.5" style={{ color: '#e8e8e8' }}>
                    {formatEur(a.betragBrutto)}
                  </p>
                  <div className="pt-0.5">
                    <span
                      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                    >
                      {label}
                    </span>
                  </div>
                  <div>
                    {a.status === 'offen' && (
                      <AngebotAktionen
                        angebot={a}
                        onAnnehmen={setSignAngebot}
                        onReload={reload}
                      />
                    )}
                  </div>
                  <div className="flex justify-end pt-0.5">
                    <BelegButton type="angebot" belegnummer={a.belegnummer} />
                  </div>
                </div>

                {/* ── Mobile ───────────────────────────────────────────────── */}
                <div className="sm:hidden px-4 py-4 space-y-2.5">
                  {/* Kopfzeile: Nummer + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-semibold" style={{ color: '#800020' }}>
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

                  {/* Betreff */}
                  <p className="text-xs" style={{ color: '#9a9a9a' }}>{a.betreff}</p>

                  {/* Betrag + PDF-Button */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: '#e8e8e8' }}>
                      {formatEur(a.betragBrutto)}
                    </p>
                    <BelegButton type="angebot" belegnummer={a.belegnummer} />
                  </div>

                  {/* Aktionen (nur bei offenen Angeboten) – eigene Zeile */}
                  {a.status === 'offen' && (
                    <div className="pt-2" style={{ borderTop: '1px solid #252525' }}>
                      <AngebotAktionen
                        angebot={a}
                        onAnnehmen={setSignAngebot}
                        onReload={reload}
                      />
                    </div>
                  )}
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
