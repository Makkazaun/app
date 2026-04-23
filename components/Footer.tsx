import Link from 'next/link'

export default function Footer() {
  return (
    <footer
      className="w-full flex items-center justify-center gap-6 py-4 px-6 text-xs"
      style={{
        borderTop: '1px solid #E5E7EB',
        color: '#9CA3AF',
      }}
    >
      <span>© {new Date().getFullYear()} Edelzaun & Tor</span>
      <span style={{ color: '#E5E7EB' }}>·</span>
      <Link href="/impressum" className="transition-colors hover:text-[#6B7280]" style={{ color: '#9CA3AF' }}>
        Impressum
      </Link>
      <Link href="/agb" className="transition-colors hover:text-[#6B7280]" style={{ color: '#9CA3AF' }}>
        AGB
      </Link>
      <Link href="/datenschutz" className="transition-colors hover:text-[#6B7280]" style={{ color: '#9CA3AF' }}>
        Datenschutz
      </Link>
    </footer>
  )
}
