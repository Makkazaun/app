'use client'

import { useState } from 'react'
import FieldLabel, { inputStyle } from './FieldLabel'
import type { FormData } from './types'

interface Props { data: FormData; update: (d: Partial<FormData>) => void }

function set<K extends keyof FormData['kontakt']>(
  data: FormData, update: Props['update'], key: K, val: FormData['kontakt'][K],
) { update({ kontakt: { ...data.kontakt, [key]: val } }) }

function Input({ label, required, type = 'text', placeholder, value, onChange, inputMode }: {
  label: string; required?: boolean; type?: string; placeholder?: string
  value: string; onChange: (v: string) => void
  inputMode?: 'email' | 'tel' | 'numeric' | 'text'
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        required={required}
        autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inputStyle(focused)}
      />
    </div>
  )
}

export default function Step5Kontakt({ data, update }: Props) {
  const k = data.kontakt
  const [focusedMsg, setFocusedMsg] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#800020', letterSpacing: '0.2em' }}>
          Schritt 5
        </p>
        <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Ihre Kontaktdaten</h2>
        <p className="text-sm mt-1" style={{ color: '#C08898' }}>
          Damit wir Ihnen ein persönliches Angebot zusenden können.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Vorname" required placeholder="Max"
          value={k.vorname} onChange={(v) => set(data, update, 'vorname', v)} />
        <Input label="Nachname" required placeholder="Mustermann"
          value={k.nachname} onChange={(v) => set(data, update, 'nachname', v)} />
      </div>

      <Input label="E-Mail-Adresse" required type="email" inputMode="email"
        placeholder="max@beispiel.de"
        value={k.email} onChange={(v) => set(data, update, 'email', v)} />

      <Input label="Telefon" type="tel" inputMode="tel"
        placeholder="+49 171 123 4567"
        value={k.telefon} onChange={(v) => set(data, update, 'telefon', v)} />

      <div className="grid grid-cols-2 gap-4">
        <Input label="PLZ" inputMode="numeric" placeholder="06369"
          value={k.plz} onChange={(v) => set(data, update, 'plz', v)} />
        <Input label="Ort" placeholder="Musterstadt"
          value={k.ort} onChange={(v) => set(data, update, 'ort', v)} />
      </div>

      <div>
        <FieldLabel>Nachricht (optional)</FieldLabel>
        <textarea
          rows={4}
          placeholder="Zusätzliche Hinweise, Besonderheiten oder Fragen …"
          value={k.nachricht}
          onChange={(e) => set(data, update, 'nachricht', e.target.value)}
          onFocus={() => setFocusedMsg(true)}
          onBlur={() => setFocusedMsg(false)}
          style={{
            ...inputStyle(focusedMsg),
            resize: 'vertical',
            minHeight: '100px',
            fontFamily: 'inherit',
            lineHeight: '1.6',
          }}
        />
      </div>

      {/* Datenschutz */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={k.datenschutz}
            onChange={(e) => set(data, update, 'datenschutz', e.target.checked)}
            className="sr-only"
          />
          <div
            className="w-5 h-5 rounded flex items-center justify-center transition-all duration-150"
            style={{
              background: k.datenschutz ? '#800020' : '#3A000F',
              border: `2px solid ${k.datenschutz ? '#800020' : '#700020'}`,
            }}
          >
            {k.datenschutz && <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
          </div>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: '#C88090' }}>
          Ich habe die{' '}
          <a href="/datenschutz" target="_blank"
            className="underline hover:opacity-80 transition-opacity"
            style={{ color: '#800020' }}
          >
            Datenschutzerklärung
          </a>{' '}
          gelesen und stimme der Verarbeitung meiner Daten zur Angebotserstellung zu.{' '}
          <span style={{ color: '#800020' }}>*</span>
        </p>
      </label>
    </div>
  )
}
