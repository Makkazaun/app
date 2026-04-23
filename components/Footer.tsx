import Link from 'next/link'

export default function Footer() {
  return (
    <footer
      className="w-full flex items-center justify-center gap-6 py-4 px-6 text-xs"
      style={{
        borderTop: '1px solid #9A0025',
        color: '#C08898',
      }}
    >
      <span>© {new Date().getFullYear()} Edelzaun & Tor</span>
      <span style={{ color: '#9A0025' }}>·</span>
      <Link href="/impressum" className="transition-colors hover:text-[#F5D0D5]" style={{ color: '#C08898' }}>
        Impressum
      </Link>
      <Link href="/agb" className="transition-colors hover:text-[#F5D0D5]" style={{ color: '#C08898' }}>
        AGB
      </Link>
      <Link href="/datenschutz" className="transition-colors hover:text-[#F5D0D5]" style={{ color: '#C08898' }}>
        Datenschutz
      </Link>
    </footer>
  )
}
