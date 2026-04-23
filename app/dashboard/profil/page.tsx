'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSession } from '@/lib/auth'

// ── Typen ─────────────────────────────────────────────────────────────────────

type Tab = 'persoenlich' | 'adressen' | 'sicherheit'

interface AdresseForm {
  firma:    string
  vorname:  string
  nachname: string
  strasse:  string
  plz:      string
  ort:      string
  land:     string
  tel:      string
  mobil:    string
}

const EMPTY: AdresseForm = {
  firma: '', vorname: '', nachname: '', strasse: '', plz: '',
  ort: '', land: 'Deutschland', tel: '', mobil: '',
}

type SaveState = 'idle' | 'saving' | 'ok' | 'error'

// ── Toast-Notification ────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'ok' | 'error' }) {
  const isOk = type === 'ok'
  return (
    <div
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                 px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl
                 animate-[slideDown_0.25s_ease-out]"
      style={{
        background: isOk
          ? 'linear-gradient(135deg, #1a2a1a, #1e2e1e)'
          : 'linear-gradient(135deg, #2a1a1a, #2e1e1e)',
        border: `1px solid ${isOk ? 'rgba(91,201,122,0.35)' : 'rgba(220,80,80,0.35)'}`,
        color:  isOk ? '#5bc97a' : '#e08080',
        boxShadow: `0 8px 32px ${isOk ? 'rgba(91,201,122,0.15)' : 'rgba(220,80,80,0.15)'}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '15px' }}>{isOk ? '✓' : '⚠'}</span>
      {msg}
    </div>
  )
}

// ── Eingabefeld ───────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, required, error, type = 'text', placeholder, readOnly,
}: {
  label:       string
  value:       string
  onChange?:   (v: string) => void
  required?:   boolean
  error?:      string
  type?:       string
  placeholder?: string
  readOnly?:   boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5"
        style={{ color: error ? '#e08080' : readOnly ? '#C08898' : '#C88090' }}>
        {label}
        {required && <span style={{ color: '#800020' }}> *</span>}
        {readOnly && <span className="ml-1.5 text-[10px] uppercase tracking-wider"
          style={{ color: '#C08898' }}>(schreibgeschützt)</span>}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={readOnly ? undefined : (e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
        style={{
          background: readOnly ? '#2D000B' : '#3A000F',
          border:     `1px solid ${error ? '#883333' : '#700020'}`,
          color:      readOnly ? '#C08898' : '#FFFFFF',
          cursor:     readOnly ? 'default' : 'text',
        }}
        onFocus={readOnly ? undefined : (e) => {
          e.currentTarget.style.borderColor = '#800020'
          e.currentTarget.style.boxShadow   = '0 0 0 2px rgba(128,0,32,0.12)'
        }}
        onBlur={readOnly ? undefined : (e) => {
          e.currentTarget.style.borderColor = error ? '#883333' : '#700020'
          e.currentTarget.style.boxShadow   = ''
        }}
      />
      {error && <p className="mt-1 text-xs" style={{ color: '#e08080' }}>{error}</p>}
    </div>
  )
}

// ── Passwort-Eingabe ──────────────────────────────────────────────────────────

function PwField({
  label, value, onChange, show, onToggle, matchErr,
}: {
  label:    string
  value:    string
  onChange: (v: string) => void
  show:     boolean
  onToggle: () => void
  matchErr?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#C88090' }}>
        {label} <span style={{ color: '#800020' }}>*</span>
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm outline-none"
          style={{
            background: '#3A000F',
            border: `1px solid ${matchErr ? '#883333' : '#700020'}`,
            color: '#FFFFFF',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#800020' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = matchErr ? '#883333' : '#700020' }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm leading-none"
          style={{ color: '#C08898' }}
          tabIndex={-1}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  )
}

// ── Speichern-Button ──────────────────────────────────────────────────────────

function SaveBtn({
  state, onClick, label = 'Speichern', labelOk = '✓ Gespeichert',
}: {
  state:    SaveState
  onClick:  () => void
  label?:   string
  labelOk?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'saving'}
      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                 hover:opacity-90 active:scale-95 disabled:opacity-50"
      style={{
        background: state === 'ok'
          ? 'linear-gradient(135deg, #2a5a2a, #5bc97a)'
          : 'linear-gradient(135deg, #400010, #800020)',
        color:     '#ffffff',
        boxShadow: '0 2px 12px rgba(128,0,32,0.2)',
      }}
    >
      {state === 'saving' ? 'Speichern …' : state === 'ok' ? labelOk : label}
    </button>
  )
}

// ── Länder-Select ─────────────────────────────────────────────────────────────

const LAENDER = ['Deutschland', 'Österreich', 'Schweiz', 'Polen', 'Tschechien', 'Ungarn', 'Slowakei']

function LandSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#C88090' }}>Land</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{ background: '#3A000F', border: '1px solid #9A0025', color: '#FFFFFF' }}
      >
        {LAENDER.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>
  )
}

// ── Adress-Validierung ────────────────────────────────────────────────────────

function validateAdresse(f: AdresseForm): Partial<Record<keyof AdresseForm, string>> {
  const e: Partial<Record<keyof AdresseForm, string>> = {}
  if (!f.vorname.trim())  e.vorname  = 'Pflichtfeld'
  if (!f.nachname.trim()) e.nachname = 'Pflichtfeld'
  if (!f.strasse.trim())  e.strasse  = 'Pflichtfeld'
  if (!f.plz.trim())      e.plz      = 'Pflichtfeld'
  else if (!/^\d{4,10}$/.test(f.plz.trim())) e.plz = '4–10 Ziffern'
  if (!f.ort.trim())      e.ort      = 'Pflichtfeld'
  return e
}

// ── Tab 1: Persönliche Daten ──────────────────────────────────────────────────

function TabPersoenlich({
  rechnung, email, kKunde, kAdresse, onSuccess, onChange,
}: {
  rechnung:  AdresseForm
  email:     string
  kKunde:    number
  kAdresse?: number
  onSuccess: (msg: string) => void
  onChange:  (f: AdresseForm) => void
}) {
  const [state,    setState]    = useState<SaveState>('idle')
  const [errMsg,   setErrMsg]   = useState('')
  const [fieldErr, setFieldErr] = useState<Partial<Record<keyof AdresseForm, string>>>({})

  const set = (field: keyof AdresseForm) => (v: string) => {
    onChange({ ...rechnung, [field]: v })
    if (fieldErr[field]) setFieldErr((p) => ({ ...p, [field]: undefined }))
  }

  async function handleSave() {
    const errs: Partial<Record<keyof AdresseForm, string>> = {}
    if (!rechnung.vorname.trim())  errs.vorname  = 'Pflichtfeld'
    if (!rechnung.nachname.trim()) errs.nachname = 'Pflichtfeld'
    setFieldErr(errs)
    if (Object.keys(errs).length) return

    setState('saving')
    setErrMsg('')
    try {
      const res  = await fetch('/api/jtl/profil', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ kKunde, kAdresse, email, type: 'rechnung', ...rechnung }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setErrMsg(json.error ?? 'Fehler beim Abgleich mit der Datenbank. Bitte versuchen Sie es später erneut.')
        setState('error')
        setTimeout(() => setState('idle'), 4000)
      } else {
        setState('ok')
        onSuccess('Daten erfolgreich im System aktualisiert')
        setTimeout(() => setState('idle'), 3000)
      }
    } catch {
      setErrMsg('Verbindungsfehler. Bitte versuchen Sie es später erneut.')
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <div className="space-y-5">
      {/* Name-Zeile */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Vorname" value={rechnung.vorname} onChange={set('vorname')}
          required error={fieldErr.vorname} />
        <Field label="Nachname" value={rechnung.nachname} onChange={set('nachname')}
          required error={fieldErr.nachname} />
      </div>

      {/* Firma */}
      <Field label="Firma (optional)" value={rechnung.firma} onChange={set('firma')} />

      {/* E-Mail (nicht änderbar) */}
      <Field label="E-Mail-Adresse" value={email} readOnly />

      {/* Tel / Mobil */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Telefon" value={rechnung.tel} onChange={set('tel')}
          placeholder="+49 3496 700 5181" />
        <Field label="Mobil" value={rechnung.mobil} onChange={set('mobil')}
          placeholder="+49 151 ..." />
      </div>

      {/* Fehler */}
      {state === 'error' && (
        <p className="text-xs rounded-xl px-4 py-3"
          style={{ background: 'rgba(220,50,50,0.08)', border: '1px solid rgba(220,50,50,0.15)', color: '#e08080' }}>
          {errMsg}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <SaveBtn state={state} onClick={handleSave}
          label="Daten speichern"
          labelOk="✓ Gespeichert" />
      </div>
    </div>
  )
}

// ── Adress-Formular (einzelne Karte) ──────────────────────────────────────────

function AdressKarte({
  typ, form, kKunde, kAdresse, email, onSuccess, onChange, sameAsRechnung, onToggleSame, rechnungRef,
}: {
  typ:             'rechnung' | 'lieferung'
  form:            AdresseForm
  kKunde:          number
  kAdresse?:       number
  email:           string
  onSuccess:       (msg: string) => void
  onChange:        (f: AdresseForm) => void
  sameAsRechnung?: boolean
  onToggleSame?:   () => void
  rechnungRef?:    React.MutableRefObject<AdresseForm>
}) {
  const [state,    setState]    = useState<SaveState>('idle')
  const [errMsg,   setErrMsg]   = useState('')
  const [fieldErr, setFieldErr] = useState<Partial<Record<keyof AdresseForm, string>>>({})

  // Welche Daten werden angezeigt?
  const display = (sameAsRechnung && rechnungRef) ? rechnungRef.current : form

  const set = (field: keyof AdresseForm) => (v: string) => {
    onChange({ ...form, [field]: v })
    if (fieldErr[field]) setFieldErr((p) => ({ ...p, [field]: undefined }))
  }

  async function handleSave() {
    const payload = (sameAsRechnung && rechnungRef) ? rechnungRef.current : form
    const errs = validateAdresse(payload)
    setFieldErr(errs)
    if (Object.keys(errs).length) return

    setState('saving')
    setErrMsg('')
    try {
      const res  = await fetch('/api/jtl/profil', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ kKunde, kAdresse, email, type: typ, ...payload }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setErrMsg(json.error ?? 'Fehler beim Abgleich mit der Datenbank. Bitte versuchen Sie es später erneut.')
        setState('error')
        setTimeout(() => setState('idle'), 4000)
      } else {
        setState('ok')
        onSuccess(
          typ === 'rechnung'
            ? 'Daten erfolgreich im System aktualisiert'
            : 'Daten erfolgreich im System aktualisiert'
        )
        setTimeout(() => setState('idle'), 3000)
      }
    } catch {
      setErrMsg('Verbindungsfehler. Bitte versuchen Sie es später erneut.')
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  const isLieferung = typ === 'lieferung'
  const cardTitle   = isLieferung ? 'Lieferadresse / Montageadresse' : 'Rechnungsadresse'
  const cardIcon    = isLieferung ? '🏗️' : '🧾'

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ border: '1px solid #9A0025', background: '#4D0013' }}>
      {/* Karten-Kopf */}
      <div className="px-5 py-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(145deg, #4D0013, #3A000F)', borderBottom: '1px solid #9A0025' }}>
        <span className="text-lg">{cardIcon}</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#800020', letterSpacing: '0.14em' }}>{cardTitle}</p>
          <p className="text-xs mt-0.5" style={{ color: '#C08898' }}>
            {isLieferung ? 'Für Lieferungen und Montage' : 'Für Rechnungen und Korrespondenz'}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4 flex-1 flex flex-col">

        {/* Checkbox: gleich wie Rechnungsadresse (nur Lieferung) */}
        {isLieferung && onToggleSame && (
          <button
            type="button"
            onClick={onToggleSame}
            className="flex items-center gap-2.5 text-left"
          >
            <div
              className="w-4.5 h-4.5 rounded flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                width: '18px', height: '18px',
                background: sameAsRechnung ? '#800020' : '#3A000F',
                border:     sameAsRechnung ? '2px solid #800020' : '2px solid #9CA3AF',
                boxShadow:  sameAsRechnung ? '0 0 6px rgba(128,0,32,0.3)' : 'none',
              }}
            >
              {sameAsRechnung && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.4 6L8 1" stroke="#ffffff" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-xs" style={{ color: sameAsRechnung ? '#800020' : '#C88090' }}>
              Gleich wie Rechnungsadresse
            </span>
          </button>
        )}

        {/* Formular-Felder */}
        <div className={`space-y-3 flex-1 ${sameAsRechnung ? 'opacity-40 pointer-events-none' : ''}`}>
          <Field label="Firma (optional)" value={display.firma}
            onChange={set('firma')} readOnly={sameAsRechnung} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Vorname" value={display.vorname} onChange={set('vorname')}
              required error={fieldErr.vorname} readOnly={sameAsRechnung} />
            <Field label="Nachname" value={display.nachname} onChange={set('nachname')}
              required error={fieldErr.nachname} readOnly={sameAsRechnung} />
          </div>

          <Field label="Straße + Hausnr." value={display.strasse} onChange={set('strasse')}
            required error={fieldErr.strasse} placeholder="Musterstraße 42"
            readOnly={sameAsRechnung} />

          <div className="grid grid-cols-3 gap-3">
            <Field label="PLZ" value={display.plz} onChange={set('plz')}
              required error={fieldErr.plz} placeholder="12345" readOnly={sameAsRechnung} />
            <div className="col-span-2">
              <Field label="Ort" value={display.ort} onChange={set('ort')}
                required error={fieldErr.ort} readOnly={sameAsRechnung} />
            </div>
          </div>

          {!sameAsRechnung && (
            <LandSelect value={form.land} onChange={set('land')} />
          )}
        </div>

        {/* Fehler */}
        {state === 'error' && (
          <p className="text-xs rounded-xl px-3 py-2.5 mt-2"
            style={{ background: 'rgba(220,50,50,0.08)', border: '1px solid rgba(220,50,50,0.15)', color: '#e08080' }}>
            {errMsg}
          </p>
        )}

        {/* Button */}
        <div className="flex justify-end pt-2 mt-auto">
          <SaveBtn
            state={state}
            onClick={handleSave}
            label={isLieferung ? 'Lieferadresse anpassen' : 'Rechnungsadresse speichern'}
            labelOk="✓ Gespeichert"
          />
        </div>
      </div>
    </div>
  )
}

// ── Tab 3: Sicherheit ─────────────────────────────────────────────────────────

function TabSicherheit({ email, onSuccess }: { email: string; onSuccess: (msg: string) => void }) {
  const [cur,   setCur]   = useState('')
  const [neu,   setNeu]   = useState('')
  const [neu2,  setNeu2]  = useState('')
  const [show,  setShow]  = useState({ cur: false, neu: false, neu2: false })
  const [state, setState] = useState<SaveState>('idle')
  const [err,   setErr]   = useState('')

  function strength(pw: string) {
    if (!pw) return { pct: 0, color: '#9A0025', label: '' }
    let s = 0
    if (pw.length >= 8)  s++
    if (pw.length >= 12) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return [
      { pct: 20,  color: '#cc3333', label: 'Zu schwach' },
      { pct: 40,  color: '#e07b5b', label: 'Schwach'    },
      { pct: 60,  color: '#800020', label: 'Mittel'     },
      { pct: 80,  color: '#8ac95b', label: 'Stark'      },
      { pct: 100, color: '#5bc97a', label: 'Sehr stark' },
    ][Math.min(s, 4)]
  }

  const st = strength(neu)
  const mismatch = neu2.length > 0 && neu !== neu2

  async function handleSave() {
    setErr('')
    if (!cur)           { setErr('Bitte aktuelles Passwort eingeben.'); return }
    if (neu.length < 8) { setErr('Neues Passwort muss mindestens 8 Zeichen haben.'); return }
    if (neu !== neu2)   { setErr('Passwörter stimmen nicht überein.'); return }

    setState('saving')
    try {
      const res  = await fetch('/api/auth/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, currentPassword: cur, newPassword: neu }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setErr(json.error ?? 'Fehler beim Abgleich mit der Datenbank. Bitte versuchen Sie es später erneut.')
        setState('error')
        setTimeout(() => setState('idle'), 5000)
      } else {
        setState('ok')
        setCur(''); setNeu(''); setNeu2('')
        onSuccess('Passwort wurde erfolgreich geändert')
        setTimeout(() => setState('idle'), 4000)
      }
    } catch {
      setErr('Verbindungsfehler. Bitte versuchen Sie es später erneut.')
      setState('error')
      setTimeout(() => setState('idle'), 5000)
    }
  }

  return (
    <div className="max-w-md space-y-5">
      <PwField label="Aktuelles Passwort" value={cur} onChange={setCur}
        show={show.cur} onToggle={() => setShow((p) => ({ ...p, cur: !p.cur }))} />

      <div>
        <PwField label="Neues Passwort" value={neu} onChange={setNeu}
          show={show.neu} onToggle={() => setShow((p) => ({ ...p, neu: !p.neu }))} />
        {neu && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px]" style={{ color: '#C08898' }}>Stärke</span>
              <span className="text-[10px] font-semibold" style={{ color: st.color }}>{st.label}</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: '#700020' }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${st.pct}%`, background: st.color }} />
            </div>
          </div>
        )}
      </div>

      <div>
        <PwField label="Neues Passwort wiederholen" value={neu2} onChange={setNeu2}
          show={show.neu2} onToggle={() => setShow((p) => ({ ...p, neu2: !p.neu2 }))}
          matchErr={mismatch} />
        {mismatch && (
          <p className="mt-1 text-xs" style={{ color: '#e08080' }}>Passwörter stimmen nicht überein.</p>
        )}
        {neu2.length > 0 && !mismatch && (
          <p className="mt-1 text-xs" style={{ color: '#5bc97a' }}>Passwörter stimmen überein ✓</p>
        )}
      </div>

      {state === 'error' && (
        <p className="text-xs rounded-xl px-4 py-3"
          style={{ background: 'rgba(220,50,50,0.08)', border: '1px solid rgba(220,50,50,0.15)', color: '#e08080' }}>
          {err}
        </p>
      )}

      <div className="flex justify-start pt-1">
        <SaveBtn state={state} onClick={handleSave}
          label="Passwort ändern"
          labelOk="✓ Passwort geändert" />
      </div>

      {/* Hinweis */}
      <div className="rounded-xl px-4 py-3 text-xs space-y-1"
        style={{ background: '#3A000F', border: '1px solid #9A0025', color: '#C08898' }}>
        <p className="font-semibold" style={{ color: '#C08898' }}>Passwort-Anforderungen</p>
        <p>Mindestens 8 Zeichen · Groß- und Kleinbuchstaben empfohlen · Sonderzeichen erhöhen die Sicherheit</p>
      </div>
    </div>
  )
}

// ── Haupt-Seite ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'persoenlich', label: 'Persönliche Daten', icon: '👤' },
  { key: 'adressen',    label: 'Adressen',          icon: '📍' },
  { key: 'sicherheit',  label: 'Sicherheit',        icon: '🔐' },
]

export default function ProfilPage() {
  const [activeTab,          setActiveTab]          = useState<Tab>('persoenlich')
  const [loading,            setLoading]            = useState(true)
  const [rechnung,           setRechnung]           = useState<AdresseForm>(EMPTY)
  const [lieferung,          setLieferung]          = useState<AdresseForm>(EMPTY)
  const [sameAddr,           setSameAddr]           = useState(false)
  const [kKunde,             setKKunde]             = useState<number | null>(null)
  // kAdresse = Primärschlüssel der jeweiligen tAdresse-Zeile – wird für gezieltes UPDATE genutzt
  const [kAdresseRechnung,   setKAdresseRechnung]   = useState<number | undefined>(undefined)
  const [kAdresseLieferung,  setKAdresseLieferung]  = useState<number | undefined>(undefined)
  const [email,              setEmail]              = useState('')
  const [kundennr,           setKundennr]           = useState('')
  const [fehler,             setFehler]             = useState('')

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'error' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, type: 'ok' | 'error' = 'ok') {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  // Ref auf rechnung für AdressKarte (damit Lieferung im "same"-Modus aktuell ist)
  const rechnungRef = useRef<AdresseForm>(EMPTY)
  rechnungRef.current = rechnung

  const loadData = useCallback(async () => {
    const session = getSession()
    if (!session) { setFehler('Keine aktive Sitzung.'); setLoading(false); return }
    setEmail(session.email)
    setKundennr(session.kundennummer ?? '')
    const kk = session.kKunde
    if (!kk) { setFehler('Kunden-ID nicht gefunden. Bitte neu anmelden.'); setLoading(false); return }
    setKKunde(kk)

    try {
      const res  = await fetch(`/api/jtl/profil?kKunde=${kk}`)
      const json = await res.json()

      if (json.rechnungsadresse) {
        const r = json.rechnungsadresse
        if (r.kAdresse) setKAdresseRechnung(r.kAdresse)
        setRechnung({
          firma:    r.firma    ?? '',
          vorname:  r.vorname  ?? '',
          nachname: r.nachname ?? '',
          strasse:  r.strasse  ?? '',
          plz:      r.plz      ?? '',
          ort:      r.ort      ?? '',
          land:     r.land     ?? 'Deutschland',
          tel:      r.tel      ?? '',
          mobil:    r.mobil    ?? '',
        })
      }
      if (json.lieferadresse) {
        const l = json.lieferadresse
        if (l.kAdresse) setKAdresseLieferung(l.kAdresse)
        setLieferung({
          firma:    l.firma    ?? '',
          vorname:  l.vorname  ?? '',
          nachname: l.nachname ?? '',
          strasse:  l.strasse  ?? '',
          plz:      l.plz      ?? '',
          ort:      l.ort      ?? '',
          land:     l.land     ?? 'Deutschland',
          tel:      l.tel      ?? '',
          mobil:    l.mobil    ?? '',
        })
      } else {
        setSameAddr(true)
      }
    } catch {
      setFehler('Stammdaten konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Ladeindikator ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto"
            style={{ borderColor: '#800020', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#C08898' }}>Profil wird geladen …</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="max-w-3xl space-y-6">

        {/* ── Seiten-Header ──────────────────────────────────────────────── */}
        <div className="pb-4" style={{ borderBottom: '1px solid #9A0025' }}>
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#800020' }}>
            Mein Konto
          </p>
          <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Profilverwaltung</h1>
          <p className="mt-1 text-sm" style={{ color: '#C08898' }}>
            Änderungen werden direkt im System gespeichert.
          </p>
        </div>

        {/* ── Fehler-Banner ──────────────────────────────────────────────── */}
        {fehler && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(220,50,50,0.08)', border: '1px solid rgba(220,50,50,0.2)', color: '#e08080' }}>
            ⚠ {fehler}
          </div>
        )}

        {/* ── Nutzer-Chip ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: '#3A000F', border: '1px solid #9A0025' }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #800020, #5a0016)', color: '#ffffff' }}>
            {rechnung.vorname ? rechnung.vorname[0].toUpperCase() : email.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#FFFFFF' }}>
              {[rechnung.vorname, rechnung.nachname].filter(Boolean).join(' ') || email}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#C08898' }}>
              {email}
              {kundennr && (
                <> · <span style={{ color: '#800020' }}>KD-{kundennr}</span></>
              )}
            </p>
          </div>
          <div className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: 'rgba(91,201,122,0.1)', color: '#5bc97a', border: '1px solid rgba(91,201,122,0.2)' }}>
            Aktiv
          </div>
        </div>

        {/* ── Tab-Navigation ─────────────────────────────────────────────── */}
        <div className="flex"
          style={{ borderBottom: '1px solid #9A0025' }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap"
                  style={{
                    background:   'transparent',
                    color:        isActive ? '#800020' : '#C08898',
                    borderBottom: isActive ? '2px solid #800020' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {/* Mobile: Kurzbezeichnung */}
                  <span className="sm:hidden text-xs">
                    {tab.key === 'persoenlich' ? 'Daten' : tab.key === 'adressen' ? 'Adressen' : 'Sicherheit'}
                  </span>
                </button>
              )
            })}
        </div>

        {/* ── Tab-Content ────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{ background: '#4D0013', border: '1px solid #9A0025' }}>

          {/* Tab: Persönliche Daten */}
          {activeTab === 'persoenlich' && kKunde && (
            <TabPersoenlich
              rechnung={rechnung}
              email={email}
              kKunde={kKunde}
              kAdresse={kAdresseRechnung}
              onSuccess={showToast}
              onChange={setRechnung}
            />
          )}

          {/* Tab: Adressen */}
          {activeTab === 'adressen' && kKunde && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AdressKarte
                typ="rechnung"
                form={rechnung}
                kKunde={kKunde}
                kAdresse={kAdresseRechnung}
                email={email}
                onSuccess={showToast}
                onChange={setRechnung}
              />
              <AdressKarte
                typ="lieferung"
                form={lieferung}
                kKunde={kKunde}
                kAdresse={kAdresseLieferung}
                email={email}
                onSuccess={showToast}
                onChange={setLieferung}
                sameAsRechnung={sameAddr}
                onToggleSame={() => setSameAddr((p) => !p)}
                rechnungRef={rechnungRef}
              />
            </div>
          )}

          {/* Tab: Sicherheit */}
          {activeTab === 'sicherheit' && (
            <TabSicherheit email={email} onSuccess={showToast} />
          )}

          {/* Nicht eingeloggt */}
          {!kKunde && activeTab !== 'sicherheit' && (
            <p className="text-sm text-center py-8" style={{ color: '#C08898' }}>
              Kunden-ID nicht gefunden. Bitte neu anmelden.
            </p>
          )}
        </div>

        {/* ── Footer-Hinweis ──────────────────────────────────────────────── */}
        <p className="text-xs text-center pb-2" style={{ color: '#9A0025' }}>
          Änderungen wirken sich auf alle zukünftigen Vorgänge aus ·
          Bestehende Rechnungen bleiben unverändert
        </p>

      </div>

    </>
  )
}
