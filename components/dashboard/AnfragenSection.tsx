'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SectionHeader from './SectionHeader'
import { getSession } from '@/lib/auth'
import { listAnfragen, anfrageTitle, STATUS_LABELS, STATUS_COLORS, type AnfrageRecord } from '@/lib/store'


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDetail(r: AnfrageRecord): { label: string; value: string }[] {
  const c = r.config
  if (r.produkt === 'betonzaun') return [
    { label: 'Modell', value: c.betonzaun.muster ? `${c.betonzaun.muster}${c.betonzaun.modellNr ? ` · Nr. ${c.betonzaun.modellNr}` : ''}` : '–' },
    { label: 'Länge', value: c.betonzaun.laenge ? `${c.betonzaun.laenge} m` : '–' },
    { label: 'Höhe', value: c.betonzaun.hoehe || '–' },
  ]
  if (r.produkt === 'doppelstabmatte') return [
    { label: 'Länge', value: c.doppelstab.laenge ? `${c.doppelstab.laenge} m` : '–' },
    { label: 'Höhe', value: c.doppelstab.hoehe ? `${c.doppelstab.hoehe} cm` : '–' },
    { label: 'Farbe', value: c.doppelstab.farbe || '–' },
  ]
  if (r.produkt === 'schmiedekunst') return [
    { label: 'Höhe', value: c.schmiedekunst.hoehe ? `${c.schmiedekunst.hoehe} cm` : '–' },
    { label: 'Länge', value: c.schmiedekunst.laenge ? `${c.schmiedekunst.laenge} m` : '–' },
    { label: 'Tor', value: c.tor.gewuenscht ? `${c.tor.typ || '–'}` : 'Kein Tor' },
  ]
  return []
}

export default function AnfragenSection() {
  const [anfragen, setAnfragen] = useState<AnfrageRecord[]>([])

  useEffect(() => {
    const session = getSession()
    if (session) {
      setAnfragen(listAnfragen(session.email))
    }
  }, [])

  return (
    <section>
      <SectionHeader
        number="01"
        title="Meine Anfragen & Konfigurationen"
        subtitle="Alle gesendeten Anfragen und Konfigurationen im Überblick"
      />

      {anfragen.length === 0 && (
        <div className="rounded-xl p-8 text-center mb-4"
          style={{ background: '#1e1e1e', border: '1px dashed #2d2d2d' }}>
          <p className="text-2xl mb-3">📋</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#5a5a5a' }}>
            Noch keine Anfragen vorhanden
          </p>
          <p className="text-xs mb-4" style={{ color: '#3a3a3a' }}>
            Konfigurieren Sie Ihr Wunschprojekt und reichen Sie eine Anfrage ein.
          </p>
          <Link href="/konfigurator"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6a4a0a, #c9a84c)', color: '#1a1a1a' }}
          >
            Konfigurator starten →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {anfragen.map((a) => {
          const statusColor = STATUS_COLORS[a.status]
          const statusLabel = STATUS_LABELS[a.status]
          const details = getDetail(a)

          return (
            <div key={a.id}
              className="rounded-xl p-5 card-hover cursor-pointer flex flex-col"
              style={{
                background: 'linear-gradient(145deg, #242424, #202020)',
                border: '1px solid #333333',
              }}
            >
              {/* ID + Status */}
              <div className="flex items-center justify-between mb-3 gap-2">
                <span className="text-xs font-mono truncate" style={{ color: '#3a3a3a' }}>
                  {a.id.startsWith('demo') ? `ANF-${a.id.slice(-1).padStart(3, '0')}` : a.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                  style={{
                    background: `${statusColor}18`,
                    color: statusColor,
                    border: `1px solid ${statusColor}33`,
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Titel */}
              <h3 className="font-semibold text-sm mb-3 leading-snug flex-1" style={{ color: '#e0e0e0' }}>
                {anfrageTitle(a)}
              </h3>

              {/* Details */}
              <div className="space-y-1.5 mb-3">
                {details.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <span style={{ color: '#5a5a5a' }}>{d.label}</span>
                    <span style={{ color: '#9a9a9a' }}>{d.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#5a5a5a' }}>Eingereicht</span>
                  <span style={{ color: '#9a9a9a' }}>{formatDate(a.createdAt)}</span>
                </div>
                {a.jtlAngebotId && (
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: '#5a5a5a' }}>Angebots-Nr.</span>
                    <span className="font-mono" style={{ color: '#c9a84c' }}>{a.jtlAngebotId}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 flex items-center justify-between"
                style={{ borderTop: '1px solid #2d2d2d' }}
              >
                <span className="text-xs" style={{ color: '#3d3d3d' }}>Details</span>
                <span className="text-xs" style={{ color: '#c9a84c' }}>→</span>
              </div>
            </div>
          )
        })}

        {/* Neue Anfrage */}
        <Link href="/konfigurator"
          className="rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:opacity-80 hover:border-[#5a5a5a]"
          style={{
            background: 'transparent',
            border: '1px dashed #3d3d3d',
            minHeight: '160px',
            textDecoration: 'none',
          }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
            style={{ background: '#252525', color: '#c9a84c' }}
          >
            +
          </div>
          <span className="text-xs text-center" style={{ color: '#5a5a5a' }}>
            Neue Anfrage<br />konfigurieren
          </span>
        </Link>
      </div>
    </section>
  )
}
