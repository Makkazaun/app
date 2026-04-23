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
        background: 'linear-gradient(145deg, #4D0013, #3A000F)',
        border: '1px solid #9A0025',
        textDecoration: 'none',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-sm" style={{ color: '#F5D0D5' }}>
          {title}
        </h3>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#C08898' }}>
        {description}
      </p>
      <div className="mt-3 text-xs font-medium" style={{ color: '#800020' }}>
        Öffnen →
      </div>
    </Link>
  )
}
