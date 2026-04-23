interface SelectCardProps {
  label: string
  sublabel?: string
  icon?: string
  selected: boolean
  onClick: () => void
  badge?: string
  fullWidth?: boolean
}

export default function SelectCard({
  label, sublabel, icon, selected, onClick, badge, fullWidth,
}: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-all duration-200 active:scale-[0.97] ${fullWidth ? 'w-full' : ''}`}
      style={{
        background: selected ? 'rgba(128,0,32,0.08)' : '#FFFFFF',
        border: selected ? '2px solid #800020' : '1px solid #E5E7EB',
        boxShadow: selected ? '0 0 20px rgba(128,0,32,0.1)' : 'none',
      }}
    >
      {icon && (
        <span className="text-2xl flex-shrink-0 w-8 text-center">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight"
          style={{ color: selected ? '#800020' : '#374151' }}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: '#9CA3AF' }}>
            {sublabel}
          </p>
        )}
      </div>
      {badge && (
        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(128,0,32,0.15)', color: '#800020' }}
        >
          {badge}
        </span>
      )}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
          style={{ background: '#800020', color: '#ffffff' }}
        >
          ✓
        </div>
      )}
    </button>
  )
}
