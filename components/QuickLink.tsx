import Link from 'next/link'

interface QuickLinkProps {
  title: string
  description: string
  icon: string
  href: string
}

export default function QuickLink({ title, description, icon, href }: QuickLinkProps) {
  return (
    <Link href={href}
      className="block rounded-xl p-5 card-hover"
      style={{
        background: 'linear-gradient(145deg, #252525, #222222)',
        border: '1px solid #333333',
        textDecoration: 'none',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-sm" style={{ color: '#d4d4d4' }}>
          {title}
        </h3>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#5a5a5a' }}>
        {description}
      </p>
      <div className="mt-3 text-xs font-medium" style={{ color: '#800020' }}>
        Öffnen →
      </div>
    </Link>
  )
}
