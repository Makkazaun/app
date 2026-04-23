'use client'

/**
 * AngebotAnnehmenModal
 *
 * Modal mit Unterschriften-Canvas (react-signature-canvas).
 * Sendet Unterschrift an POST /api/jtl/sign, das PDF einbettet und E-Mail schickt.
 */

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type SignatureCanvas from 'react-signature-canvas'

// SignaturePadWrapper is a forwardRef wrapper around react-signature-canvas.
// Loaded via dynamic to avoid SSR issues (window access).
const SignaturePad = dynamic(
  () => import('./SignaturePadWrapper'),
  { ssr: false, loading: () => <div style={{ height: 180, background: '#F5F5F5', borderRadius: 8 }} /> }
)

interface Props {
  kAngebot:    number
  belegnummer: string
  betrag:      string   // formatierter Betrag, z.B. "1.450,00 €"
  betreff:     string
  onSuccess:   () => void
  onClose:     () => void
}

type Step = 'sign' | 'submitting' | 'success' | 'error'

export default function AngebotAnnehmenModal({
  kAngebot, belegnummer, betrag, betreff, onSuccess, onClose,
}: Props) {
  const sigRef   = useRef<SignatureCanvas>(null)
  const [step,   setStep]   = useState<Step>('sign')
  const [isEmpty, setIsEmpty] = useState(true)
  const [errMsg, setErrMsg]  = useState('')

  // ESC schließt Modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && step !== 'submitting') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, step])

  function handleClear() {
    sigRef.current?.clear()
    setIsEmpty(true)
  }

  function handleEnd() {
    setIsEmpty(sigRef.current?.isEmpty() ?? true)
  }

  async function handleSubmit() {
    if (!sigRef.current || sigRef.current.isEmpty()) return

    const signatureDataUrl = sigRef.current.toDataURL('image/png')
    setStep('submitting')

    try {
      const res = await fetch('/api/jtl/sign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ kAngebot, belegnummer, signatureDataUrl }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      setStep('success')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 3500)

    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : String(err))
      setStep('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== 'submitting') onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#080002', border: '1px solid #440011', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #440011', background: '#0D0003' }}>
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#800020' }}>
              <path d="M13.5 2.5l-9 9L2 14l2.5-2.5 9-9z" stroke="currentColor" strokeWidth="1.3"
                strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 2.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
              Angebot digital annehmen
            </span>
          </div>
          {step !== 'submitting' && (
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ background: '#0D0003', color: '#C88090', border: '1px solid #333' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* Angebots-Info */}
          <div className="rounded-xl px-4 py-3 space-y-1"
            style={{ background: '#33000D', border: '1px solid #440011' }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold" style={{ color: '#800020' }}>{belegnummer}</span>
              <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{betrag}</span>
            </div>
            <p className="text-xs leading-snug" style={{ color: '#C88090' }}>{betreff}</p>
          </div>

          {/* ── Unterschrifts-Canvas ── */}
          {step === 'sign' && (
            <>
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#C88090' }}>
                  Bitte unterschreiben Sie im Feld unten:
                </p>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #333' }}>
                  <SignaturePad
                    ref={sigRef}
                    canvasProps={{
                      width:  460,
                      height: 180,
                      style:  {
                        width:   '100%',
                        height:  '180px',
                        background: '#F5F5F5',
                        cursor: 'crosshair',
                      },
                    }}
                    penColor="#800020"
                    onEnd={handleEnd}
                  />
                </div>
                {isEmpty && (
                  <p className="text-xs mt-1.5" style={{ color: '#C08898' }}>
                    Zeichnen Sie Ihre Unterschrift mit der Maus oder dem Finger.
                  </p>
                )}
              </div>

              {/* Hinweis */}
              <p className="text-xs leading-relaxed" style={{ color: '#C08898' }}>
                Mit Ihrer Unterschrift bestätigen Sie die Annahme des Angebots.
                Das unterschriebene Dokument wird automatisch an uns übermittelt.
              </p>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleClear}
                  className="flex-shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ background: '#0D0003', color: '#C88090', border: '1px solid #333' }}>
                  Löschen
                </button>

                <button onClick={onClose}
                  className="flex-shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ background: '#0D0003', color: '#C88090', border: '1px solid #333' }}>
                  Abbrechen
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isEmpty}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: isEmpty
                      ? '#2a1018'
                      : 'linear-gradient(135deg, #5a0016, #800020, #a0002a, #800020, #5a0016)',
                    color: '#ffffff',
                    boxShadow: isEmpty ? 'none' : '0 2px 12px rgba(128,0,32,0.30)',
                  }}
                >
                  Angebot verbindlich annehmen
                </button>
              </div>
            </>
          )}

          {/* ── Sendevorgang ── */}
          {step === 'submitting' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"
                style={{ animation: 'spin 0.8s linear infinite', color: '#800020' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5"
                  strokeDasharray="45 25" strokeLinecap="round"/>
              </svg>
              <p className="text-sm" style={{ color: '#C88090' }}>Unterschrift wird übermittelt …</p>
            </div>
          )}

          {/* ── Erfolg ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(91,201,122,0.12)', border: '1px solid rgba(91,201,122,0.25)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#5bc97a' }}>
                  <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                  Vielen Dank!
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#C88090' }}>
                  Ihr unterschriebenes Angebot wurde erfolgreich an uns übermittelt.
                  Wir melden uns zeitnah bei Ihnen.
                </p>
              </div>
            </div>
          )}

          {/* ── Fehler ── */}
          {step === 'error' && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.15)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: '#e08080' }}>Übermittlung fehlgeschlagen</p>
                <p className="text-xs" style={{ color: '#9a6060' }}>{errMsg}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('sign')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: '#0D0003', color: '#C88090', border: '1px solid #333' }}>
                  Zurück
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(128,0,32,0.12)', color: '#800020', border: '1px solid rgba(128,0,32,0.25)' }}>
                  Erneut versuchen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
