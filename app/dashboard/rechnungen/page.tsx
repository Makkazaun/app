'use client'

import { useJtlRechnungen, type JtlRechnung } from '@/lib/useJtlData'
import BelegButton from '@/components/dashboard/BelegButton'

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function StatusBadge({ bezahlt, storniert }: { bezahlt: boolean; storniert: boolean }) {
  if (storniert) return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: 'rgba(90,90,90,0.15)', color: '#C08898', border: '1px solid #9CA3AF' }}>
      Storniert
    </span>
  )
  if (bezahlt) return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: 'rgba(91,201,122,0.12)', color: '#5bc97a', border: '1px solid rgba(91,201,122,0.25)' }}>
      Bezahlt
    </span>
  )
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: 'rgba(224,123,91,0.12)', color: '#e07b5b', border: '1px solid rgba(224,123,91,0.25)' }}>
      Offen
    </span>
  )
}

export default function RechnungenPage() {
  const { data, loading, error } = useJtlRechnungen()
  const rechnungen = data ?? []

  const aktiv      = rechnungen.filter((r) => !r.storniert)
  const offen      = aktiv.filter((r) => !r.bezahlt)
  const bezahlt    = aktiv.filter((r) => r.bezahlt)
  const offenSum   = offen.reduce((s, r) => s + r.betragBrutto, 0)

  return (
    <div className="space-y-6">
      {/* Seitentitel */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#800020' }}>
            Rechnungen
          </p>
          <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Meine Rechnungen</h1>
          <p className="mt-1 text-sm" style={{ color: '#C88090' }}>
            {loading
              ? 'Daten werden geladen …'
              : 'Aktuelle Daten aus dem System · Nur lesend – Rechnungen sind unveränderlich'}
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

      {/* Übersichtskacheln */}
      {!loading && aktiv.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-5"
            style={{ background: 'linear-gradient(135deg, #2d1f1f, #281818)', border: '1px solid #4d2020' }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#9a5a5a', letterSpacing: '0.12em' }}>
              Offener Betrag
            </p>
            <p className="text-2xl font-bold" style={{ color: offen.length > 0 ? '#e07b5b' : '#5bc97a' }}>
              {formatEur(offenSum)}
            </p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#33000D', border: '1px solid #440011' }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#C88090', letterSpacing: '0.12em' }}>
              Offene Rechnungen
            </p>
            <p className="text-2xl font-bold" style={{ color: offen.length > 0 ? '#e07b5b' : '#5bc97a' }}>
              {offen.length}
            </p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#33000D', border: '1px solid #440011' }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#C88090', letterSpacing: '0.12em' }}>
              Bezahlt (gesamt)
            </p>
            <p className="text-2xl font-bold" style={{ color: '#5bc97a' }}>{bezahlt.length}</p>
          </div>
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

      {/* Leer-Zustand */}
      {!loading && rechnungen.length === 0 && (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: '#33000D', border: '1px dashed #440011' }}>
          <div className="text-4xl mb-4">🧾</div>
          <p className="text-base font-semibold mb-2" style={{ color: '#C08898' }}>
            Keine Dokumente vorhanden
          </p>
          <p className="text-sm" style={{ color: '#C08898' }}>
            Sobald Rechnungen für Ihr Konto erstellt wurden,
            erscheinen sie hier.
          </p>
        </div>
      )}

      {/* Tabelle */}
      {!loading && rechnungen.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #440011' }}>

          {/* Tabellenkopf */}
          <div
            className="hidden md:grid px-5 py-3 text-xs font-medium uppercase tracking-wider"
            style={{
              background: '#33000D',
              borderBottom: '1px solid #440011',
              color: '#C08898',
              gridTemplateColumns: '140px 90px 1fr 130px 110px 100px',
              gap: '12px',
            }}
          >
            <span>Rechnungs-Nr.</span>
            <span>Datum</span>
            <span>Betrag</span>
            <span>Status</span>
            <span className="text-right">PDF</span>
          </div>

          {rechnungen.map((r, i) => (
            <div
              key={r.kRechnung}
              style={{
                background: r.storniert
                  ? '#0D0003'
                  : i % 2 === 0 ? '#33000D' : '#080002',
                borderBottom: i < rechnungen.length - 1 ? '1px solid #440011' : 'none',
                opacity: r.storniert ? 0.5 : 1,
              }}
            >
              {/* Desktop */}
              <div
                className="hidden md:grid items-center px-5 py-3.5 gap-3"
                style={{ gridTemplateColumns: '140px 90px 1fr 130px 110px 100px' }}
              >
                <p className="font-mono text-xs font-semibold" style={{ color: '#800020' }}>
                  {r.belegnummer}
                </p>
                <p className="text-xs" style={{ color: '#C08898' }}>{formatDate(r.datum)}</p>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                    {formatEur(r.betragBrutto)}
                  </p>
                  <p className="text-xs" style={{ color: '#C08898' }}>
                    netto {formatEur(r.betragNetto)}
                  </p>
                </div>
                <StatusBadge bezahlt={r.bezahlt} storniert={r.storniert} />
                <div className="flex justify-end">
                  {!r.storniert && (
                    <BelegButton type="rechnung" belegnummer={r.belegnummer} />
                  )}
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden px-4 py-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold" style={{ color: '#800020' }}>
                      {r.belegnummer}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#C08898' }}>{formatDate(r.datum)}</p>
                  </div>
                  <StatusBadge bezahlt={r.bezahlt} storniert={r.storniert} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold" style={{ color: '#FFFFFF' }}>
                      {formatEur(r.betragBrutto)}
                    </p>
                    <p className="text-xs" style={{ color: '#C08898' }}>netto {formatEur(r.betragNetto)}</p>
                  </div>
                  {!r.storniert && (
                    <BelegButton type="rechnung" belegnummer={r.belegnummer} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hinweis */}
      {!loading && (
        <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2.5"
          style={{ background: '#080002', border: '1px solid #440011', color: '#C08898' }}>
          <span style={{ color: '#C08898' }}>🔒</span>
          <span>
            Rechnungen sind unveränderlich. Für Fragen wenden Sie sich bitte an uns.
          </span>
        </div>
      )}
    </div>
  )
}
