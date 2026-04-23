'use client'

import { useEffect, useState } from 'react'
import { getSession } from '@/lib/auth'
import { useJtlAngebote, useJtlAuftraege, useJtlRechnungen } from '@/lib/useJtlData'

const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export default function DashboardHeader() {
  const [vorname, setVorname] = useState<string>('')

  // Vorname aus Profil-API laden
  useEffect(() => {
    const session = getSession()
    if (!session?.kKunde) return
    fetch(`/api/jtl/profil?kKunde=${session.kKunde}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const name = d?.rechnungsadresse?.vorname
        if (name) setVorname(name)
      })
      .catch(() => {/* still works without name */})
  }, [])

  const { data: angebote,  loading: aLoading  } = useJtlAngebote()
  const { data: auftraege, loading: auLoading } = useJtlAuftraege()
  const { data: rechnungen, loading: rLoading } = useJtlRechnungen()

  const offeneAngebote   = angebote?.filter((a) => a.status === 'offen').length ?? 0
  const angebotVolumen   = angebote?.filter((a) => a.status === 'offen')
    .reduce((s, a) => s + (a.betragBrutto ?? 0), 0) ?? 0
  const auftragVolumen   = auftraege?.reduce((s, a) => s + (a.betragBrutto ?? 0), 0) ?? 0
  const rechnungsVolumen = rechnungen?.reduce((s, r) => s + (r.betragBrutto ?? 0), 0) ?? 0

  const loading = aLoading || auLoading || rLoading

  const stats = [
    {
      label: 'Offene Angebote',
      value: loading ? '…' : offeneAngebote > 0 ? EUR.format(angebotVolumen) : '–',
      sub:   loading ? '' : offeneAngebote > 0 ? `${offeneAngebote} Angebot${offeneAngebote !== 1 ? 'e' : ''}` : 'Keine offenen Angebote',
      color: '#800020',
    },
    {
      label: 'Auftragsvolumen',
      value: loading ? '…' : auftragVolumen > 0 ? EUR.format(auftragVolumen) : '–',
      sub:   loading ? '' : `${auftraege?.length ?? 0} Auftrag${(auftraege?.length ?? 0) !== 1 ? 'träge' : ''}`,
      color: '#5bc97a',
    },
    {
      label: 'Rechnungen gesamt',
      value: loading ? '…' : rechnungsVolumen > 0 ? EUR.format(rechnungsVolumen) : '–',
      sub:   loading ? '' : `${rechnungen?.length ?? 0} Rechnung${(rechnungen?.length ?? 0) !== 1 ? 'en' : ''}`,
      color: '#7a9ab8',
    },
  ]

  return (
    <div className="pb-8" style={{ borderBottom: '1px solid #2a2a2a' }}>
      {/* Begrüßung */}
      <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#800020' }}>
        Willkommen zurück
      </p>
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#e8e8e8' }}>
        {vorname ? `Hallo ${vorname},` : 'Mein Kundenbereich'}
      </h1>
      <p className="text-sm mb-8" style={{ color: '#5a5a5a' }}>
        {vorname
          ? 'hier sind Ihre aktuellen Vorgänge bei Edelzaun & Tor.'
          : 'Anfragen · Angebote · Aufträge · Termine – alles auf einen Blick.'}
      </p>

      {/* Summen-Kacheln */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: '#191919', border: '1px solid #252525' }}
          >
            <p className="text-xs mb-2" style={{ color: '#4a4a4a', letterSpacing: '0.08em' }}>
              {s.label}
            </p>
            <p className="text-xl font-bold leading-none mb-1" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs" style={{ color: '#3a3a3a' }}>{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
