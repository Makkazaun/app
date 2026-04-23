'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import Footer from '@/components/Footer'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F9FAFB' }}>
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar onMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto" style={{ background: '#F3F4F6' }}>
          <div className="p-4 md:p-6">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
