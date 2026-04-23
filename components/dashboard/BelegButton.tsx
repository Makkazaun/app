'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  belegnummer: string
  type:        'angebot' | 'rechnung' | 'auftrag'
  label?:      string
}

export default function BelegButton({ belegnummer, type, label }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [pdfUrl,  setPdfUrl]  = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  const apiUrl = `/api/jtl/document?type=${type}&id=${encodeURIComponent(belegnummer)}`

  async function handleOpen() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl)
      if (res.ok) {
        const blob = await res.blob()
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        setPdfUrl(url)
      } else {
        const body = await res.json().catch(() => ({}))
        if (res.status === 404) {
          setError(body.error ?? 'Beleg wurde noch nicht als PDF erzeugt. Bitte in der Wawi einmal die Druck-Vorschau öffnen oder das Dokument versenden.')
        } else {
          setError(body.error ?? 'PDF konnte nicht geladen werden.')
        }
      }
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  function closeModal() {
    setPdfUrl(null)
    const prev = objectUrlRef.current
    setTimeout(() => {
      if (prev) URL.revokeObjectURL(prev)
      if (objectUrlRef.current === prev) objectUrlRef.current = null
    }, 1000)
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Hauptbutton */}
        <button
          onClick={handleOpen}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: '#0D0003',
            color: '#7a9ab8',
            border: '1px solid #2a3a4a',
            padding: '10px 12px',
            minHeight: '40px',
          }}
          title="Beleg öffnen"
        >
          {loading ? (
            <Spinner />
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2C3.5 2 1.5 4 1.5 6C1.5 8 3.5 10 6 10C8.5 10 10.5 8 10.5 6C10.5 4 8.5 2 6 2Z"
                stroke="currentColor" strokeWidth="1.1"/>
              <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
            </svg>
          )}
          {loading ? 'Lädt …' : (label ?? 'Beleg öffnen')}
        </button>

        {/* Download-Button */}
        <button
          onClick={async (e) => {
            e.preventDefault()
            const res = await fetch(`${apiUrl}&download=1`)
            if (res.ok) {
              const blob = await res.blob()
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `${type}_${belegnummer}.pdf`
              a.click()
              setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
            } else {
              setError('Download fehlgeschlagen.')
            }
          }}
          className="inline-flex items-center justify-center rounded-lg text-xs transition-all hover:opacity-80"
          style={{
            background: '#080002',
            color: '#C08898',
            border: '1px solid #440011',
            minWidth: '40px',
            minHeight: '40px',
          }}
          title="Herunterladen"
        >
          ↓
        </button>
      </div>

      {/* Fehleranzeige */}
      {error && (
        <p className="mt-1 text-xs leading-snug" style={{ color: '#c07070', maxWidth: '200px' }}>
          {error}
        </p>
      )}

      {/* PDF-Modal */}
      {pdfUrl && (
        <PdfModal
          pdfUrl={pdfUrl}
          belegnummer={belegnummer}
          downloadUrl={`${apiUrl}&download=1`}
          onClose={closeModal}
        />
      )}
    </>
  )
}

// ── Hilfskomponenten ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"
        strokeDasharray="14 8" strokeLinecap="round"/>
    </svg>
  )
}

function PdfModal({
  pdfUrl, belegnummer, downloadUrl, onClose,
}: {
  pdfUrl:      string
  belegnummer: string
  downloadUrl: string
  onClose:     () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      {/* Modal-Header */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          background:   '#080002',
          borderBottom: '1px solid #440011',
          minHeight:    '56px',
        }}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#800020' }}>
            <rect x="1.5" y="0.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="text-sm font-medium" style={{ color: '#F5D0D5' }}>
            Beleg {belegnummer}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={downloadUrl}
            className="inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{
              background: '#0D0003',
              color: '#C88090',
              border: '1px solid #333',
              padding: '10px 12px',
              minHeight: '44px',
            }}
            title="PDF herunterladen"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v6M2.5 7.5l3 2.5 3-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 9h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="hidden sm:inline">Herunterladen</span>
          </a>

          {/* In neuem Tab öffnen – nützlich auf Mobile */}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg text-xs transition-all hover:opacity-80 sm:hidden"
            style={{
              background: '#0D0003',
              color: '#C88090',
              border: '1px solid #333',
              minWidth: '44px',
              minHeight: '44px',
            }}
            title="In neuem Tab öffnen"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M8 1h4v4M12 1L6.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>

          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-all hover:opacity-80"
            style={{
              background: '#0D0003',
              color: '#C88090',
              border: '1px solid #333',
              minWidth: '44px',
              minHeight: '44px',
            }}
            title="Schließen (ESC)"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* PDF-Viewer */}
      <div className="flex-1 relative">
        <iframe
          src={pdfUrl}
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none', background: '#1A0005' }}
          title={`Beleg ${belegnummer}`}
        />
      </div>
    </div>
  )
}
