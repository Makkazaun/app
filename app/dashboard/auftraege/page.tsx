'use client'

import { useState } from 'react'
import { useJtlAuftraege, type JtlAuftrag } from '@/lib/useJtlData'
import BelegButton from '@/components/dashboard/BelegButton'

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

/** Ist der Auftrag abgeschlossen (komplett bezahlt oder storniert)? */
function istAbgeschlossen(a: JtlAuftrag): boolean {
  return a.status === 'abgeschlossen' || a.status === 'storniert'
}

// ── Billing-Status-Badge ──────────────────────────────────────────────────────

function ZahlungsBadge({ a }: { a: JtlAuftrag }) {
  if (a.status === 'storniert') {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: 'rgba(90,90,90,0.15)', color: '#C08898', border: '1px solid #9CA3AF' }}>
        Storniert
      </span>
    )
  }
  if (a.status === 'abgeschlossen') {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: 'rgba(91,201,122,0.12)', color: '#5bc97a', border: '1px solid rgba(91,201,122,0.25)' }}>
        Komplett bezahlt
      </span>
    )
  }
  if (a.rechnungssumme > 0) {
    return (
      <div className="space-y-1">
        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ background: 'rgba(128,0,32,0.12)', color: '#800020', border: '1px solid rgba(128,0,32,0.25)' }}>
          Anzahlung erhalten
        </span>
        <p className="text-[10px] pl-0.5" style={{ color: '#C08898' }}>
          Wartet auf Schlussrechnung
        </p>
      </div>
    )
  }
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: 'rgba(122,154,184,0.12)', color: '#7a9ab8', border: '1px solid rgba(122,154,184,0.25)' }}>
      Auftrag in Bearbeitung
    </span>
  )
}

// ── Tabelle ───────────────────────────────────────────────────────────────────

function AuftraegeTabelle({ rows }: { rows: JtlAuftrag[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center"
        style={{ background: '#33000D', border: '1px dashed #440011' }}>
        <div className="text-3xl mb-3">🔨</div>
        <p className="text-sm font-medium mb-1" style={{ color: '#C08898' }}>
          Keine Aufträge in dieser Kategorie
        </p>
        <p className="text-xs" style={{ color: '#C08898' }}>
          Sobald Aufträge vorliegen, erscheinen sie hier.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #440011' }}>
      {/* Tabellenkopf */}
      <div
        className="hidden sm:grid px-5 py-3 text-xs font-medium uppercase tracking-wider"
        style={{
          background: '#33000D',
          borderBottom: '1px solid #440011',
          color: '#C08898',
          gridTemplateColumns: '130px 90px 1fr 150px 190px 90px',
          gap: '12px',
        }}
      >
        <span>Nummer</span>
        <span>Datum</span>
        <span>Leistung</span>
        <span>Betrag</span>
        <span>Zahlungsstatus</span>
        <span className="text-right">PDF</span>
      </div>

      {rows.map((a, i) => {
        const dimmed = a.status === 'storniert'
        return (
          <div
            key={a.kAuftrag}
            style={{
              background:   i % 2 === 0 ? '#33000D' : '#080002',
              borderBottom: i < rows.length - 1 ? '1px solid #440011' : 'none',
              opacity:      dimmed ? 0.5 : 1,
            }}
          >
            {/* Desktop */}
            <div
              className="hidden sm:grid items-center px-5 py-4 gap-3"
              style={{ gridTemplateColumns: '130px 90px 1fr 150px 190px 90px' }}
            >
              <div>
                <p className="font-mono text-xs font-semibold" style={{ color: '#800020' }}>
                  {a.belegnummer}
                </p>
                {a.montagetermin && (
                  <p className="text-[10px] mt-0.5" style={{ color: '#4a6a4a' }}>
                    Montage {formatDate(a.montagetermin)}
                  </p>
                )}
              </div>
              <p className="text-xs" style={{ color: '#C08898' }}>{formatDate(a.datum)}</p>
              <p className="text-xs leading-snug" style={{ color: '#F5D0D5' }}>{a.betreff}</p>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                  {formatEur(a.betragBrutto)}
                </p>
                {a.rechnungssumme > 0 && a.rechnungssumme < a.betragBrutto && (
                  <p className="text-xs" style={{ color: '#C08898' }}>
                    Anzahlung {formatEur(a.rechnungssumme)}
                  </p>
                )}
              </div>
              <ZahlungsBadge a={a} />
              <div className="flex justify-end">
                {!dimmed && <BelegButton type="auftrag" belegnummer={a.belegnummer} />}
              </div>
            </div>

            {/* Mobile */}
            <div className="sm:hidden px-4 py-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs font-semibold" style={{ color: '#800020' }}>
                    {a.belegnummer}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#C08898' }}>{formatDate(a.datum)}</p>
                </div>
                <ZahlungsBadge a={a} />
              </div>
              <p className="text-xs" style={{ color: '#C88090' }}>{a.betreff}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                    {formatEur(a.betragBrutto)}
                  </p>
                  {a.rechnungssumme > 0 && a.rechnungssumme < a.betragBrutto && (
                    <p className="text-xs" style={{ color: '#C08898' }}>
                      Anzahlung {formatEur(a.rechnungssumme)}
                    </p>
                  )}
                </div>
                {!dimmed && <BelegButton type="auftrag" belegnummer={a.belegnummer} />}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Seite ─────────────────────────────────────────────────────────────────────

type Tab = 'aktuell' | 'abgeschlossen'

export default function AuftraegePage() {
  const { data, loading, error } = useJtlAuftraege()
  const [activeTab, setActiveTab] = useState<Tab>('aktuell')

  const alle          = data ?? []
  const aktuell       = alle.filter((a) => !istAbgeschlossen(a))
  const abgeschlossen = alle.filter((a) =>  istAbgeschlossen(a))
  const tabRows       = activeTab === 'aktuell' ? aktuell : abgeschlossen

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'aktuell',       label: 'Aktuelle Aufträge',       count: aktuell.length },
    { key: 'abgeschlossen', label: 'Abgeschlossene Aufträge', count: abgeschlossen.length },
  ]

  return (
    <div className="space-y-6">

      {/* Seitentitel */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#800020' }}>
            Aufträge
          </p>
          <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Meine Aufträge</h1>
          <p className="mt-1 text-sm" style={{ color: '#C88090' }}>
            {loading ? 'Daten werden geladen …' : 'Fakturierungsstatus in Echtzeit'}
          </p>
        </div>
        {!loading && !error && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: '#33000D', color: '#5bc97a', border: '1px solid #2d3d2d' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#5bc97a' }} />
            System · Live
          </div>
        )}
      </div>

      {/* Fehler */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-xs"
          style={{ background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.15)', color: '#e08080' }}>
          ⚠ Verbindungsfehler: {error}
        </div>
      )}

      {/* Lade-Skelett */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl animate-pulse"
              style={{ background: '#33000D', border: '1px solid #440011', height: '56px' }} />
          ))}
        </div>
      )}

      {/* Tabs + Inhalt */}
      {!loading && (
        <>
          {/* Tab-Leiste */}
          <div style={{ borderBottom: '1px solid #440011' }} className="flex">
            {tabs.map(({ key, label, count }) => {
              const active = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors"
                  style={{
                    color:      active ? '#800020' : '#C08898',
                    background: 'transparent',
                    border:     'none',
                    cursor:     'pointer',
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className="inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 py-0.5 min-w-[18px]"
                      style={{
                        background: active ? 'rgba(128,0,32,0.18)' : 'rgba(90,90,90,0.18)',
                        color:      active ? '#800020' : '#C08898',
                      }}
                    >
                      {count}
                    </span>
                  )}
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                      style={{ background: '#800020' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <AuftraegeTabelle rows={tabRows} />

          {alle.length > 0 && (
            <p className="text-xs text-center" style={{ color: '#440011' }}>
              Live-Daten · Alle Beträge inkl. MwSt.
            </p>
          )}
        </>
      )}
    </div>
  )
}
