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
      <div className="w-full h-0.5 mb-4" style={{ background: '#2a2a2a' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((current - 1) / (STEPS.length - 1)) * 100}%`,
            background: 'linear-gradient(90deg, #8a6914, #c9a84c)',
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
                    ? 'linear-gradient(135deg, #8a6914, #c9a84c)'
                    : active
                      ? 'rgba(201,168,76,0.15)'
                      : '#1e1e1e',
                  border: active ? '2px solid #c9a84c' : done ? 'none' : '1px solid #333',
                  color: done ? '#1a1a1a' : active ? '#c9a84c' : '#444',
                }}
              >
                {done ? '✓' : s.n}
              </div>
              <span
                className="text-xs whitespace-nowrap"
                style={{ color: active ? '#c9a84c' : done ? '#6a6a6a' : '#3a3a3a' }}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile: nur aktueller Schritt */}
      <div className="sm:hidden flex items-center justify-between px-1">
        <span className="text-xs" style={{ color: '#5a5a5a' }}>
          Schritt {current} von {STEPS.length}
        </span>
        <span className="text-xs font-semibold" style={{ color: '#c9a84c' }}>
          {STEPS[current - 1]?.label}
        </span>
      </div>
    </div>
  )
}
