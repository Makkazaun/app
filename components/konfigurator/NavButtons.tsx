interface NavButtonsProps {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  isLast?: boolean
  loading?: boolean
}

export default function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Weiter',
  nextDisabled = false,
  isLast = false,
  loading = false,
}: NavButtonsProps) {
  return (
    <div
      className="sticky bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-4 mt-8"
      style={{
        background: 'linear-gradient(to top, #161616 70%, transparent)',
        zIndex: 10,
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-80 active:scale-[0.98]"
          style={{
            background: 'transparent',
            border: '1px solid #3d3d3d',
            color: '#7a7a7a',
          }}
        >
          ← Zurück
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || loading}
        className="flex-[2] py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: isLast
            ? 'linear-gradient(135deg, #5a7a3a, #7ab85a)'
            : 'linear-gradient(135deg, #5a0016, #800020, #a0002a, #800020, #5a0016)',
          color: '#ffffff',
          letterSpacing: '0.1em',
          boxShadow: nextDisabled ? 'none' : '0 4px 16px rgba(128,0,32,0.3)',
        }}
      >
        {loading ? '…' : isLast ? '✓ Anfrage senden' : nextLabel + ' →'}
      </button>
    </div>
  )
}
