'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import Footer from '@/components/Footer'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#1a1a1a' }}>
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar onMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto" style={{ background: '#161616' }}>
          <div className="p-4 md:p-6">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
