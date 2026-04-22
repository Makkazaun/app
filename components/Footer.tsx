import Link from 'next/link'

export default function Footer() {
  return (
    <footer
      className="w-full flex items-center justify-center gap-6 py-4 px-6 text-xs"
      style={{
        borderTop: '1px solid #2a2a2a',
        color: '#4a4a4a',
      }}
    >
      <span>© {new Date().getFullYear()} Edelzaun & Tor</span>
      <span style={{ color: '#2a2a2a' }}>·</span>
      <Link href="/impressum" className="transition-colors hover:text-[#8a8a8a]" style={{ color: '#4a4a4a' }}>
        Impressum
      </Link>
      <Link href="/agb" className="transition-colors hover:text-[#8a8a8a]" style={{ color: '#4a4a4a' }}>
        AGB
      </Link>
      <Link href="/datenschutz" className="transition-colors hover:text-[#8a8a8a]" style={{ color: '#4a4a4a' }}>
        Datenschutz
      </Link>
    </footer>
  )
}
