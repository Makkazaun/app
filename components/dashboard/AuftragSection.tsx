import SectionHeader from './SectionHeader'

type Phase = {
  key: string
  label: string
  datum: string
  beschreibung: string
  status: 'done' | 'active' | 'pending'
}

const phasen: Phase[] = [
  {
    key: 'besichtigung',
    label: 'Besichtigung',
    datum: '28.03.2025',
    beschreibung: 'Vor-Ort-Termin zur Aufmaßaufnahme und Beratung – abgeschlossen.',
    status: 'done',
  },
  {
    key: 'auftrag',
    label: 'Auftragsbestätigung',
    datum: '10.04.2025',
    beschreibung: 'Angebot ANG-2025-0028 wurde angenommen. Auftrag in Vorbereitung.',
    status: 'done',
  },
  {
    key: 'material',
    label: 'Materiallieferung',
    datum: '18.04.2025',
    beschreibung: 'Lieferung der Zaunelemente und Pfosten an die Montagestelle.',
    status: 'active',
  },
  {
    key: 'montage',
    label: 'Montage',
    datum: '22.04.2025',
    beschreibung: 'Geplante Montage durch Team Schulz, voraussichtlich 1 Tag.',
    status: 'pending',
  },
  {
    key: 'abnahme',
    label: 'Abnahme & Übergabe',
    datum: 'Nach Montage',
    beschreibung: 'Gemeinsame Abnahme und Übergabe aller Unterlagen.',
    status: 'pending',
  },
]

const statusStyles: Record<Phase['status'], { dot: string; line: string; label: string; labelColor: string }> = {
  done: {
    dot: 'linear-gradient(135deg, #4a9a5c, #5bc97a)',
    line: '#3a5a3a',
    label: 'Abgeschlossen',
    labelColor: '#5bc97a',
  },
  active: {
    dot: 'linear-gradient(135deg, #5a0016, #800020)',
    line: '#4a3a1a',
    label: 'Aktuell',
    labelColor: '#800020',
  },
  pending: {
    dot: '#E5E7EB',
    line: '#F3F4F6',
    label: 'Ausstehend',
    labelColor: '#9CA3AF',
  },
}

export default function AuftragSection() {
  const activeIndex = phasen.findIndex((p) => p.status === 'active')
  const progress = activeIndex >= 0 ? Math.round((activeIndex / (phasen.length - 1)) * 100) : 0

  return (
    <section>
      <SectionHeader
        number="03"
        title="Auftragsstatus & Termine"
        subtitle="Aktueller Fortschritt Ihres laufenden Auftrags"
      />

      {/* Fortschrittsbalken */}
      <div className="mb-8 rounded-xl p-5"
        style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
            Gesamtfortschritt · Auftrag ANG-2025-0028
          </span>
          <span className="text-sm font-bold" style={{ color: '#800020' }}>{progress}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #5a0016, #800020, #a0002a)',
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>Start</span>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>Abnahme</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Vertikale Linie */}
        <div className="absolute left-3 top-2 bottom-2 w-px" style={{ background: '#E5E7EB' }} />

        <div className="space-y-2">
          {phasen.map((phase, i) => {
            const s = statusStyles[phase.status]
            const isLast = i === phasen.length - 1

            return (
              <div key={phase.key} className="relative">
                {/* Dot auf der Linie */}
                <div
                  className="absolute -left-8 top-4 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: s.dot,
                    border: phase.status === 'pending' ? '1px solid #9CA3AF' : 'none',
                    boxShadow: phase.status === 'active' ? '0 0 10px rgba(201,168,76,0.4)' : 'none',
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

                {/* Inhalt */}
                <div
                  className="rounded-xl p-4 mb-3"
                  style={{
                    background: phase.status === 'active'
                      ? 'linear-gradient(135deg, #1e1a0a, #28200e)'
                      : phase.status === 'done'
                        ? '#1a1e1a'
                        : '#F9FAFB',
                    border: `1px solid ${phase.status === 'active' ? '#3d3210' : phase.status === 'done' ? '#2a3a2a' : '#E5E7EB'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold" style={{ color: phase.status === 'pending' ? '#9CA3AF' : '#374151' }}>
                          {phase.label}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: `${s.labelColor}15`,
                            color: s.labelColor,
                            border: `1px solid ${s.labelColor}25`,
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: phase.status === 'pending' ? '#9CA3AF' : '#6B7280' }}>
                        {phase.beschreibung}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium" style={{ color: phase.status === 'pending' ? '#9CA3AF' : '#6B7280' }}>
                        {phase.datum}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Nächster Termin Banner */}
      <div className="mt-4 rounded-xl p-4 flex items-center gap-4"
        style={{ background: '#FFFFFF', border: '1px solid #2a3040' }}
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: '#F9FAFB' }}
        >
          🗓️
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: '#7a9ab8' }}>Nächster Termin</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: '#d4e0ec' }}>
            Materiallieferung · 18. April 2025
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#4a5a6a' }}>
            Musterstraße 12, 12345 Musterstadt
          </p>
        </div>
      </div>
    </section>
  )
}
