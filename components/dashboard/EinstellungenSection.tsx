'use client'

import { useEffect, useState } from 'react'
import { getSession } from '@/lib/auth'

export default function EinstellungenSection() {
  const [enabled,  setEnabled]  = useState<boolean>(true)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)

  const email = getSession()?.email ?? ''

  useEffect(() => {
    if (!email) { setLoading(false); return }
    fetch(`/api/notifications/settings?email=${encodeURIComponent(email)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setEnabled(d.notificationsEnabled) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [email])

  async function handleToggle(next: boolean) {
    setEnabled(next)
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/notifications/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, enabled: next }),
      })
      setFeedback(res.ok ? 'saved' : 'error')
    } catch {
      setFeedback('error')
    } finally {
      setSaving(false)
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  return (
    <section>
      {/* Abschnitts-Kopf */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2a1c0a, #3d2a10)', border: '1px solid #3a2e10' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="#c9a84c" strokeWidth="1.5"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
              stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#e8e8e8' }}>Einstellungen</h2>
          <p className="text-xs" style={{ color: '#5a5a5a' }}>Konto &amp; Benachrichtigungen</p>
        </div>
      </div>

      {/* Karte */}
      <div className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(145deg, #2d2d2d, #252525)',
          border: '1px solid #3d3d3d',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#5a5a5a', letterSpacing: '0.15em' }}
        >
          Benachrichtigungen
        </p>

        {/* Toggle-Zeile */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: '#e8e8e8' }}>
              E-Mail bei neuen Dokumenten
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6a6a6a' }}>
              Sie erhalten eine Benachrichtigung, sobald ein neues Angebot für Sie bereitgestellt wird.
            </p>
          </div>

          {/* Toggle-Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={loading || saving}
            onClick={() => handleToggle(!enabled)}
            className="flex-shrink-0 relative inline-flex items-center rounded-full transition-all duration-200 disabled:opacity-50 focus:outline-none"
            style={{
              width: '46px',
              height: '26px',
              background: enabled
                ? 'linear-gradient(135deg, #8a6914, #c9a84c)'
                : '#2a2a2a',
              border: `1px solid ${enabled ? '#c9a84c' : '#3d3d3d'}`,
              boxShadow: enabled ? '0 0 10px rgba(201,168,76,0.2)' : 'none',
            }}
          >
            <span
              className="inline-block rounded-full transition-transform duration-200"
              style={{
                width:     '18px',
                height:    '18px',
                background: enabled ? '#1a1a1a' : '#4a4a4a',
                transform:  enabled ? 'translateX(22px)' : 'translateX(3px)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            />
          </button>
        </div>

        {/* Status-Feedback */}
        {feedback === 'saved' && (
          <p className="mt-3 text-xs" style={{ color: '#5bc97a' }}>
            Einstellung gespeichert.
          </p>
        )}
        {feedback === 'error' && (
          <p className="mt-3 text-xs" style={{ color: '#ff8080' }}>
            Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.
          </p>
        )}
      </div>
    </section>
  )
}
