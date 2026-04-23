'use client'

import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/dashboard/NotificationBell'
import { Menu } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/dashboard':            'Übersicht',
  '/dashboard/angebote':   'Aktuelle Angebote',
  '/dashboard/termine':    'Montagetermine',
  '/dashboard/rechnungen': 'Rechnungen',
}

interface TopBarProps {
  onMenuOpen?: () => void
}

export default function TopBar({ onMenuOpen }: TopBarProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'Dashboard'

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 py-4 flex-shrink-0"
      style={{
        background: '#33000D',
        borderBottom: '1px solid #440011',
        height: '64px',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger – mobile only */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: '#0D0003', color: '#C88090', border: '1px solid #440011' }}
          onClick={onMenuOpen}
          aria-label="Navigation öffnen"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>

        <div className="w-px h-4 hidden sm:block" style={{ background: '#1A0005' }} />
        <h2 className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Live-Benachrichtigungs-Glocke */}
        <NotificationBell />

        {/* Hilfe */}
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
          style={{ background: '#0D0003', color: '#C88090', border: '1px solid #440011' }}
          aria-label="Hilfe"
        >
          ?
        </button>
      </div>
    </header>
  )
}
