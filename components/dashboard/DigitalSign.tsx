'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  angebotId:  string
  leistung:   string
  betrag:     string
  onSign:     (signaturBase64: string) => void
  onClose:    () => void
}

export default function DigitalSign({ angebotId, leistung, betrag, onSign, onClose }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const wrapRef    = useRef<HTMLDivElement>(null)
  const [drawing, setDrawing]   = useState(false)
  const [isEmpty,  setIsEmpty]  = useState(true)
  const [signed,   setSigned]   = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // ── Canvas auf Container-Breite skalieren ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap   = wrapRef.current
    if (!canvas || !wrap) return

    const dpr = window.devicePixelRatio || 1
    const w   = wrap.clientWidth
    const h   = 130

    canvas.width  = w  * dpr
    canvas.height = h  * dpr
    canvas.style.width  = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
  }, [])

  function getCtx() {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    return ctx
  }

  function relativePos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const t = e.touches[0]
      if (!t) return null
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = relativePos(e)
    if (!pos) return
    setDrawing(true)
    setIsEmpty(false)
    lastPos.current = pos
    const ctx = getCtx()
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing) return
    const pos = relativePos(e)
    if (!pos) return
    const ctx = getCtx()
    if (!ctx) return
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing])

  const endDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDrawing(false)
    lastPos.current = null
  }, [])

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  function handleConfirm() {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return
    const dataUrl = canvas.toDataURL('image/png')
    setSigned(true)
    // Kurzes visuelles Feedback, dann Callback
    setTimeout(() => onSign(dataUrl), 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ padding: '0' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-lg flex flex-col"
        style={{
          background: '#3A000F',
          border:     '1px solid #9A0025',
          borderRadius: '20px 20px 0 0',
          padding: '28px 24px 32px',
        }}
      >
        {/* Handle (mobil) */}
        <div className="sm:hidden flex justify-center mb-5 -mt-2">
          <div className="w-12 h-1 rounded-full" style={{ background: '#C08898' }} />
        </div>

        {/* Schließen (Desktop) */}
        <button
          onClick={onClose}
          className="hidden sm:flex absolute top-5 right-5 w-8 h-8 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
          style={{ background: '#700020', color: '#C88090', fontSize: '14px' }}
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.18em] mb-1" style={{ color: '#800020' }}>
            Digitale Unterschrift
          </p>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
            Angebot annehmen
          </h2>

          {/* Angebots-Info */}
          <div className="rounded-xl p-4 space-y-2.5"
            style={{ background: '#4D0013', border: '1px solid #9A0025' }}
          >
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: '#C08898' }}>Angebots-Nr.</span>
              <span className="font-mono font-semibold" style={{ color: '#800020' }}>{angebotId}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs leading-snug" style={{ color: '#C88090' }}>{leistung}</span>
              <span className="text-sm font-bold flex-shrink-0" style={{ color: '#FFFFFF' }}>{betrag}</span>
            </div>
          </div>
        </div>

        {/* Unterschriftenfeld */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: '#C88090' }}>
              Hier unterschreiben:
            </p>
            {!isEmpty && (
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs hover:opacity-70 transition-opacity"
                style={{ color: '#C08898' }}
              >
                Zurücksetzen
              </button>
            )}
          </div>

          <div
            ref={wrapRef}
            className="w-full rounded-xl overflow-hidden relative"
            style={{
              background: '#3A000F',
              border: isEmpty
                ? '1.5px dashed #9A0025'
                : '1.5px solid #700020',
            }}
          >
            <canvas
              ref={canvasRef}
              className="block w-full touch-none cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {isEmpty && (
              <p
                className="absolute inset-0 flex items-center justify-center text-sm pointer-events-none"
                style={{ color: '#C08898' }}
              >
                ✍ Hier mit dem Finger unterschreiben
              </p>
            )}
          </div>
        </div>

        {/* Rechtlicher Hinweis */}
        <p className="text-xs leading-relaxed mb-6" style={{ color: '#C08898' }}>
          Mit Ihrer Unterschrift akzeptieren Sie das oben genannte Angebot verbindlich.
          Diese elektronische Unterschrift ist rechtsgültig gemäß eIDAS-Verordnung (EU) 910/2014.
        </p>

        {/* Aktions-Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: '#2D000B', color: '#C88090', border: '1px solid #9A0025' }}
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isEmpty || signed}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: signed
                ? 'linear-gradient(135deg, #3a7a3a, #5bc97a)'
                : 'linear-gradient(135deg, #5a0016, #800020, #a0002a, #800020, #5a0016)',
              color: '#ffffff',
              letterSpacing: '0.08em',
              boxShadow: !isEmpty && !signed ? '0 4px 16px rgba(128,0,32,0.3)' : 'none',
            }}
          >
            {signed ? '✓ Angenommen' : 'Verbindlich unterschreiben'}
          </button>
        </div>
      </div>
    </div>
  )
}
