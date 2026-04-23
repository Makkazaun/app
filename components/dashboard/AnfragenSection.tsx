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
          style={{ background: '#FFFFFF', border: '1px dashed #E5E7EB' }}>
          <p className="text-2xl mb-3">📋</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#9CA3AF' }}>
            Noch keine Anfragen vorhanden
          </p>
          <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
            Konfigurieren Sie Ihr Wunschprojekt und reichen Sie eine Anfrage ein.
          </p>
          <Link href="/konfigurator"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #400010, #800020)', color: '#ffffff' }}
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
                background: 'linear-gradient(145deg, #FFFFFF, #FFFFFF)',
                border: '1px solid #333333',
              }}
            >
              {/* ID + Status */}
              <div className="flex items-center justify-between mb-3 gap-2">
                <span className="text-xs font-mono truncate" style={{ color: '#9CA3AF' }}>
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
              <h3 className="font-semibold text-sm mb-3 leading-snug flex-1" style={{ color: '#1F2937' }}>
                {anfrageTitle(a)}
              </h3>

              {/* Details */}
              <div className="space-y-1.5 mb-3">
                {details.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <span style={{ color: '#9CA3AF' }}>{d.label}</span>
                    <span style={{ color: '#6B7280' }}>{d.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#9CA3AF' }}>Eingereicht</span>
                  <span style={{ color: '#6B7280' }}>{formatDate(a.createdAt)}</span>
                </div>
                {a.jtlAngebotId && (
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: '#9CA3AF' }}>Angebots-Nr.</span>
                    <span className="font-mono" style={{ color: '#800020' }}>{a.jtlAngebotId}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 flex items-center justify-between"
                style={{ borderTop: '1px solid #E5E7EB' }}
              >
                <span className="text-xs" style={{ color: '#D1D5DB' }}>Details</span>
                <span className="text-xs" style={{ color: '#800020' }}>→</span>
              </div>
            </div>
          )
        })}

        {/* Neue Anfrage */}
        <Link href="/konfigurator"
          className="rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:opacity-80 hover:border-[#9CA3AF]"
          style={{
            background: 'transparent',
            border: '1px dashed #D1D5DB',
            minHeight: '160px',
            textDecoration: 'none',
          }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
            style={{ background: '#F3F4F6', color: '#800020' }}
          >
            +
          </div>
          <span className="text-xs text-center" style={{ color: '#9CA3AF' }}>
            Neue Anfrage<br />konfigurieren
          </span>
        </Link>
      </div>
    </section>
  )
}
