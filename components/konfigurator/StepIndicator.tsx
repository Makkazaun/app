const STEPS = [
  { n: 1, label: 'Produkt' },
  { n: 2, label: 'Konfiguration' },
  { n: 3, label: 'Tore & Türen' },
  { n: 4, label: 'Fotos' },
  { n: 5, label: 'Kontakt' },
  { n: 6, label: 'Zusammenfassung' },
]

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="w-full">
      {/* Fortschrittsbalken */}
      <div className="w-full h-0.5 mb-4" style={{ background: '#1A0005' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((current - 1) / (STEPS.length - 1)) * 100}%`,
            background: 'linear-gradient(90deg, #5a0016, #800020)',
          }}
        />
      </div>

      {/* Schritt-Labels (nur auf ≥ sm) */}
      <div className="hidden sm:flex items-center justify-between px-1">
        {STEPS.map((s) => {
          const done = s.n < current
          const active = s.n === current
          return (
            <div key={s.n} className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  background: done
                    ? 'linear-gradient(135deg, #5a0016, #800020)'
                    : active
                      ? 'rgba(128,0,32,0.15)'
                      : '#FFFFFF',
                  border: active ? '2px solid #800020' : done ? 'none' : '1px solid #333',
                  color: done ? '#ffffff' : active ? '#800020' : '#444',
                }}
              >
                {done ? '✓' : s.n}
              </div>
              <span
                className="text-xs whitespace-nowrap"
                style={{ color: active ? '#800020' : done ? '#C88090' : '#C08898' }}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile: nur aktueller Schritt */}
      <div className="sm:hidden flex items-center justify-between px-1">
        <span className="text-xs" style={{ color: '#C08898' }}>
          Schritt {current} von {STEPS.length}
        </span>
        <span className="text-xs font-semibold" style={{ color: '#800020' }}>
          {STEPS[current - 1]?.label}
        </span>
      </div>
    </div>
  )
}
