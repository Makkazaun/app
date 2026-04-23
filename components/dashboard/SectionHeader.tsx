interface SectionHeaderProps {
  number: string
  title: string
  subtitle: string
}

export default function SectionHeader({ number, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <span className="text-3xl font-black leading-none mt-0.5"
        style={{
          color: '#9A0025',
          WebkitTextStroke: 'none',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {number}
      </span>
      <div>
        <h2 className="text-base font-bold" style={{ color: '#F5D0D5' }}>{title}</h2>
        <p className="text-xs mt-0.5" style={{ color: '#C08898' }}>{subtitle}</p>
      </div>
    </div>
  )
}
