'use client'

import { useJtlAuftraege } from '@/lib/useJtlData'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateShort(iso: string) {
  const d = new Date(iso)
  return {
    tag:   d.toLocaleDateString('de-DE', { day: '2-digit' }),
    monat: d.toLocaleDateString('de-DE', { month: 'short' }),
    jahr:  d.getFullYear(),
  }
}

export default function TerminePage() {
  const { data, loading, error } = useJtlAuftraege()

  // Nur Aufträge mit Montagetermin, sortiert nach Datum
  const auftraege = (data ?? [])
    .filter((a) => a.montagetermin && a.status !== 'storniert')
    .sort((a, b) => {
      const da = new Date(a.montagetermin!).getTime()
      const db = new Date(b.montagetermin!).getTime()
      return da - db
    })

  const now = Date.now()
  const naechster = auftraege.find((a) => new Date(a.montagetermin!).getTime() >= now)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#c9a84c' }}>
            Termine
          </p>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e8e8' }}>Montagetermine</h1>
          <p className="mt-1 text-sm" style={{ color: '#6a6a6a' }}>
            {loading
              ? 'Termine werden geladen …'
              : 'Voraussichtliche Montagetermine aus Ihren Aufträgen'}
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

      {/* Fehler */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-xs"
          style={{ background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.15)', color: '#e08080' }}>
          ⚠ Verbindungsfehler: {error}
        </div>
      )}

      {/* Lade-Skelett */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl animate-pulse"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', height: '110px' }} />
          ))}
        </div>
      )}

      {/* Nächster Termin Banner */}
      {!loading && naechster && (
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #1a1f2a, #151b26)', border: '1px solid #2a3040' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: '#202535' }}>
            📅
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#7a9ab8' }}>
              Nächster Montagetermin
            </p>
            <p className="text-base font-bold" style={{ color: '#d4e0ec' }}>
              {formatDate(naechster.montagetermin!)}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#4a5a6a' }}>
              Auftrag {naechster.belegnummer} · {naechster.betreff}
            </p>
          </div>
        </div>
      )}

      {/* Leer-Zustand */}
      {!loading && auftraege.length === 0 && (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: '#1e1e1e', border: '1px dashed #2d2d2d' }}>
          <div className="text-4xl mb-4">🔧</div>
          <p className="text-base font-semibold mb-2" style={{ color: '#5a5a5a' }}>
            Keine Dokumente vorhanden
          </p>
          <p className="text-sm" style={{ color: '#3a3a3a' }}>
            Sobald ein Auftrag mit Montagetermin angelegt wird,
            erscheint er hier.
          </p>
        </div>
      )}

      {/* Terminliste */}
      {!loading && auftraege.length > 0 && (
        <div className="space-y-3">
          {auftraege.map((auftrag) => {
            const d         = formatDateShort(auftrag.montagetermin!)
            const istVergangen = new Date(auftrag.montagetermin!).getTime() < now
            const istNaechster = naechster?.kAuftrag === auftrag.kAuftrag

            const statusColor = istVergangen ? '#5bc97a' : istNaechster ? '#c9a84c' : '#5b9bd5'
            const statusLabel = istVergangen ? 'Durchgeführt' : istNaechster ? 'Nächster Termin' : 'Geplant'

            // Lieferadresse für Montageadresse
            const adr = auftrag.lieferadresse ?? auftrag.rechnungsadresse
            const adrStr = adr
              ? `${adr.strasse}, ${adr.plz} ${adr.ort}`
              : 'Adresse in Auftrag hinterlegt'

            return (
              <div key={auftrag.kAuftrag}
                className="rounded-xl p-5"
                style={{
                  background: istNaechster
                    ? 'linear-gradient(145deg, #1e1c0a, #181608)'
                    : 'linear-gradient(145deg, #1e1e1e, #1a1a1a)',
                  border: istNaechster ? '1px solid #3d3210' : '1px solid #2d2d2d',
                  opacity: istVergangen ? 0.6 : 1,
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Datum-Box */}
                  <div
                    className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                    style={{
                      background: istVergangen ? '#1a1e1a' : istNaechster ? '#201e0a' : '#1a1a1a',
                      border: `1px solid ${istNaechster ? '#3d3210' : '#2d2d2d'}`,
                    }}
                  >
                    <span className="text-xs font-medium" style={{ color: statusColor }}>
                      {d.monat}
                    </span>
                    <span className="text-xl font-bold leading-tight" style={{ color: '#e8e8e8' }}>
                      {d.tag}
                    </span>
                    <span className="text-[10px]" style={{ color: '#3a3a3a' }}>{d.jahr}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs" style={{ color: '#c9a84c' }}>
                        {auftrag.belegnummer}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${statusColor}18`,
                          color: statusColor,
                          border: `1px solid ${statusColor}30`,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="font-semibold text-sm mb-1 leading-snug" style={{ color: '#d4d4d4' }}>
                      {auftrag.betreff}
                    </p>
                    <p className="text-xs" style={{ color: '#5a5a5a' }}>
                      📍 {adrStr}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Hinweis */}
      {!loading && (
        <div className="rounded-xl px-4 py-3 text-xs"
          style={{ background: '#141414', border: '1px solid #222', color: '#3a3a3a' }}>
          ℹ Terminänderungen werden von unserem Team kommuniziert. Alle Zeiten sind voraussichtliche Werte.
        </div>
      )}
    </div>
  )
}
