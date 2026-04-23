'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { clearSession, getSession, type Session } from '@/lib/auth'
import Logo from '@/components/Logo'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  HardHat,
  User,
  LogOut,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',   href: '/dashboard',           icon: LayoutDashboard, exact: true  },
  { label: 'Anfragen',    href: '/dashboard/anfragen',  icon: ClipboardList,   exact: false },
  { label: 'Angebote',    href: '/dashboard/angebote',  icon: FileText,        exact: false },
  { label: 'Aufträge',    href: '/dashboard/auftraege', icon: HardHat,         exact: false },
  { label: 'Mein Profil', href: '/dashboard/profil',    icon: User,            exact: false },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [mounted, setMounted]  = useState(false)
  const [session, setSession]  = useState<Session | null>(null)

  useEffect(() => {
    setMounted(true)
    setSession(getSession())
  }, [])

  const initials = session?.email
    ? session.email.slice(0, 2).toUpperCase()
    : '?'

  function handleLogout() {
    clearSession()
    router.push('/')
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          /* mobile: fixed overlay, slides in/out */
          'fixed inset-y-0 left-0 z-50 flex flex-col w-72',
          'transition-transform duration-300 ease-in-out',
          /* desktop: back in the flex flow, always visible */
          'md:relative md:w-64 md:flex-shrink-0 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{
          background:  '#2D000B',
          borderRight: '1px solid #9A0025',
        }}
      >
        {/* Logo + mobile close button */}
        <div
          className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid #9A0025' }}
        >
          <div className="flex flex-col items-start gap-1">
            <Logo variant="sidebar" />
            <p className="text-xs pl-0.5" style={{ color: '#C08898', letterSpacing: '0.12em' }}>
              Edelzaun App
            </p>
          </div>
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: '#2D000B', color: '#C88090', border: '1px solid #700020' }}
            onClick={onClose}
            aria-label="Menü schließen"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p
            className="px-3 py-2 text-xs font-medium tracking-widest uppercase"
            style={{ color: '#C08898', letterSpacing: '0.15em' }}
          >
            Navigation
          </p>

          {navItems.map(({ label, href, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 rounded-lg transition-all duration-150 text-sm"
                style={{
                  background:  isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                  color:       isActive ? '#FFFFFF' : '#C88090',
                  borderLeft:  isActive ? '2px solid #F5D0D5' : '2px solid transparent',
                  fontWeight:  isActive ? '600' : '400',
                  minHeight:   '44px',
                  display:     'flex',
                  alignItems:  'center',
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={{ flexShrink: 0, color: isActive ? '#F5D0D5' : '#C08898' }}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Benutzer-Info */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #9A0025' }}>
          {mounted ? (
            <div
              className="flex items-center gap-3 px-2 py-2 rounded-lg"
              style={{ background: '#3A000F' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #5a0016, #800020)', color: '#ffffff' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#F5D0D5' }}>
                  {session?.email ?? 'Gast'}
                </p>
                <p className="text-xs" style={{ color: '#C08898' }}>Kunde</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ color: '#C08898' }}
                title="Abmelden"
              >
                <LogOut size={14} strokeWidth={1.8} />
              </button>
            </div>
          ) : (
            <div className="h-10 rounded-lg" style={{ background: '#3A000F' }} />
          )}
        </div>
      </aside>
    </>
  )
}
