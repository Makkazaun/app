'use client'

import { useRef, useState } from 'react'
import type { FormData } from './types'

interface Props { data: FormData; update: (d: Partial<FormData>) => void }

const MAX_FILES = 5
const MAX_MB = 10
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

export default function Step4Upload({ data, update }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    setError('')
    const valid: File[] = []
    for (const f of Array.from(newFiles)) {
      if (!ALLOWED.includes(f.type)) {
        setError('Nur JPG, PNG, WEBP, HEIC und PDF erlaubt.')
        continue
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`"${f.name}" ist zu groß (max. ${MAX_MB} MB).`)
        continue
      }
      valid.push(f)
    }
    const combined = [...data.dateien, ...valid].slice(0, MAX_FILES)
    update({ dateien: combined })
  }

  function removeFile(idx: number) {
    update({ dateien: data.dateien.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>
          Schritt 4
        </p>
        <h2 className="text-2xl font-bold" style={{ color: '#e8e8e8' }}>Fotos &amp; Unterlagen</h2>
        <p className="text-sm mt-1" style={{ color: '#5a5a5a' }}>
          Optional – helfen uns bei der genauen Angebotserstellung.
        </p>
      </div>

      {/* Drop-Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-2xl flex flex-col items-center justify-center gap-3 py-12 px-6 text-center transition-all duration-200"
        style={{
          border: `2px dashed ${dragging ? '#c9a84c' : '#3a3a3a'}`,
          background: dragging ? 'rgba(201,168,76,0.05)' : '#1e1e1e',
        }}
      >
        <div className="text-5xl">{dragging ? '📂' : '📎'}</div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#d4d4d4' }}>
            Dateien hier ablegen oder tippen zum Auswählen
          </p>
          <p className="text-xs mt-1" style={{ color: '#5a5a5a' }}>
            JPG, PNG, HEIC, PDF · max. {MAX_MB} MB je Datei · max. {MAX_FILES} Dateien
          </p>
        </div>
        <div className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: '#2d2d2d', color: '#9a9a9a', border: '1px solid #3d3d3d' }}
        >
          Datei auswählen
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm px-4 py-3 rounded-xl"
          style={{ background: 'rgba(220,50,50,0.08)', color: '#ff8080', border: '1px solid rgba(220,50,50,0.2)' }}
        >
          ⚠ {error}
        </p>
      )}

      {/* Dateiliste */}
      {data.dateien.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5a5a' }}>
            {data.dateien.length} / {MAX_FILES} Dateien
          </p>
          {data.dateien.map((f, i) => (
            <div key={i}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: '#212121', border: '1px solid #2d2d2d' }}
            >
              <span className="text-xl flex-shrink-0">
                {f.type === 'application/pdf' ? '📄' : '🖼️'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: '#d4d4d4' }}>{f.name}</p>
                <p className="text-xs" style={{ color: '#4a4a4a' }}>
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button type="button" onClick={() => removeFile(i)}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
                style={{ background: '#2d2d2d', color: '#7a7a7a' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {data.dateien.length === 0 && (
        <p className="text-xs text-center" style={{ color: '#3a3a3a' }}>
          Dieser Schritt ist optional – Sie können auch ohne Fotos fortfahren.
        </p>
      )}
    </div>
  )
}
