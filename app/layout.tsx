import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import SuperchatWidget from '@/components/SuperchatWidget'
import './globals.css'

export const metadata: Metadata = {
  title: 'Edelzaun App',
  description: 'Edelzaun App – Angebote, Montagetermine und Rechnungen im Überblick',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
        <SuperchatWidget />
      </body>
    </html>
  )
}
