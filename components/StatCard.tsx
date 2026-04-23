import Link from 'next/link'

interface StatCardProps {
  label: string
  value: string
  icon: string
  color: string
  href: string
}

export default function StatCard({ label, value, icon, color, href }: StatCardProps) {
  return (
    <Link href={href}
      className="block rounded-xl p-5 card-hover"
      style={{
        background: 'linear-gradient(145deg, #E5E7EB, #F3F4F6)',
        border: '1px solid #D1D5DB',
        textDecoration: 'none',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#6B7280', letterSpacing: '0.12em' }}>
            {label}
          </p>
          <p className="text-3xl font-bold" style={{ color }}>
            {value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs"
        style={{ color: '#9CA3AF' }}
      >
        <span>→ Ansehen</span>
      </div>
    </Link>
  )
}
