'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn } from '@/lib/auth'
import Logo from '@/components/Logo'

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/dashboard')
    } else {
      setChecking(false)
    }
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a1a' }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: '#3d3d3d', borderTopColor: '#800020' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a1a1a' }}>
      {/* Goldener Schimmer oben */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(128,0,32,0.08) 0%, transparent 60%)`,
        }}
      />

      {/* Header */}
      <header className="relative flex items-center justify-between px-8 py-5"
        style={{ borderBottom: '1px solid #2a2a2a' }}
      >
        <Logo variant="header" />
        <Link href="/login"
          className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-80"
          style={{ background: '#2d2d2d', color: '#9a9a9a', border: '1px solid #3d3d3d' }}
        >
          Edelzaun App
        </Link>
      </header>

      {/* Hero */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Logo groß */}
        <div className="mb-8">
          <Logo variant="hero" />
        </div>

        <p className="text-xs font-medium tracking-[0.4em] uppercase mb-4" style={{ color: '#800020' }}>
          Zäune &amp; Tore nach Maß
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight" style={{ color: '#e8e8e8' }}>
          Ihre persönliche <span className="gold-gradient">Edelzaun App</span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed mb-12" style={{ color: '#6a6a6a' }}>
          Premium-Einzäunungen und Toranlagen für anspruchsvolle Kunden.
          Verwalten Sie Angebote, Termine und Rechnungen an einem Ort.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/konfigurator"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-sm uppercase transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #5a0016, #800020, #a0002a, #800020, #5a0016)',
              color: '#ffffff',
              boxShadow: '0 4px 20px rgba(128,0,32,0.35)',
              letterSpacing: '0.12em',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1L9.6 5.3H14.5L10.7 8.2L12.2 13.5L7.5 10.7L2.8 13.5L4.3 8.2L0.5 5.3H5.4L7.5 1Z"
                fill="currentColor" />
            </svg>
            Angebot anfordern
          </Link>

          <Link href="/login"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-sm uppercase transition-all duration-200 hover:opacity-90 hover:border-[#5a5a5a]"
            style={{
              background: 'transparent',
              color: '#9a9a9a',
              border: '1px solid #3d3d3d',
              letterSpacing: '0.12em',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 5L13 7L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kunden-Login
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full">
          {[
            { icon: '🏗️', title: 'Individuelle Planung', text: 'Jede Anlage wird speziell für Ihr Grundstück konzipiert.' },
            { icon: '⚙️', title: 'Präzise Montage', text: 'Erfahrene Fachteams mit jahrelanger Expertise.' },
            { icon: '🛡️', title: 'Langlebige Qualität', text: 'Hochwertige Materialien mit langer Lebensdauer.' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-6 text-left"
              style={{ background: '#212121', border: '1px solid #2d2d2d' }}
            >
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#d4d4d4' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#5a5a5a' }}>{f.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
