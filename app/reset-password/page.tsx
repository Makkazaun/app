'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/Logo'
import { setSession, updateSessionJtl } from '@/lib/auth'

// ── Hauptformular ─────────────────────────────────────────────────────────────

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token  = params.get('token') ?? ''

  type State = 'loading' | 'invalid' | 'form' | 'saving' | 'success' | 'autologin_failed'

  const [state,      setState]      = useState<State>('loading')
  const [email,      setEmail]      = useState('')
  const [invalidMsg, setInvalidMsg] = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [formError,  setFormError]  = useState('')
  const redirectTimer               = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup-Timer beim Unmount
  useEffect(() => () => { if (redirectTimer.current) clearTimeout(redirectTimer.current) }, [])

  // ── 1. Token-Validierung beim Laden ──────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setInvalidMsg('Kein Reset-Token in der URL gefunden. Bitte erneut anfordern.')
      setState('invalid')
      return
    }

    fetch(`/api/auth/verify-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setEmail(data.email)
          setState('form')
        } else {
          setInvalidMsg(data.reason ?? 'Link ungültig oder bereits verwendet.')
          setState('invalid')
        }
      })
      .catch(() => {
        setInvalidMsg('Verbindungsfehler beim Prüfen des Links. Bitte Seite neu laden.')
        setState('invalid')
      })
  }, [token])

  // ── 2. Formular absenden ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (password.length < 8) {
      setFormError('Passwort muss mindestens 8 Zeichen haben.')
      return
    }
    if (password !== confirm) {
      setFormError('Die Passwörter stimmen nicht überein.')
      return
    }

    setState('saving')

    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        setFormError(data.error ?? 'Unbekannter Fehler. Bitte erneut versuchen.')
        setState('form')
        return
      }

      // ── Auto-Login: Session direkt setzen ─────────────────────────────
      // Token ist serverseitig bereits verbraucht (consumeResetToken)
      setSession(data.email)

      if (data.kKunde) {
        // Normalfall: kKunde aus Portal-DB direkt verfügbar
        updateSessionJtl(data.kKunde, data.kundennummer ?? '')
      } else {
        // Fallback: kKunde noch nicht in Portal-DB → JTL-Lookup nachholen
        try {
          const jtlRes = await fetch(`/api/jtl/kunde?email=${encodeURIComponent(data.email)}`)
          if (jtlRes.ok) {
            const jtl = await jtlRes.json()
            if (jtl.found && jtl.kunde?.kKunde) {
              updateSessionJtl(jtl.kunde.kKunde, jtl.kunde.kundennummer ?? '')
            }
          }
        } catch { /* JTL nicht erreichbar – Dashboard-Hooks holen es nach */ }
      }

      setState('success')

      // Weiterleitung direkt zum Dashboard (kein Login-Umweg)
      redirectTimer.current = setTimeout(() => router.push('/dashboard'), 2000)

    } catch {
      // Netzwerkfehler: Passwort könnte gespeichert sein, aber Session nicht gesetzt
      setState('autologin_failed')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #2D000B 0%, #1A0008 50%, #2D000B 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #800020 0px, #800020 1px, transparent 1px, transparent 60px),
                            repeating-linear-gradient(-45deg, #800020 0px, #800020 1px, transparent 1px, transparent 60px)`,
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo variant="login" className="mb-3" />
          <p className="text-xs tracking-widest" style={{ color: '#C08898', letterSpacing: '0.3em' }}>
            KUNDENPORTAL
          </p>
        </div>

        {/* Karte */}
        <div
          className="rounded-2xl p-7 shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #4D0013, #3A000F)',
            border: '1px solid #700020',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >

          {/* ── Laden ──────────────────────────────────────────────────────── */}
          {state === 'loading' && (
            <div className="text-center py-8 space-y-3">
              <div
                className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: '#800020', borderTopColor: 'transparent' }}
              />
              <p className="text-sm" style={{ color: '#C88090' }}>Link wird geprüft …</p>
            </div>
          )}

          {/* ── Token ungültig / abgelaufen ────────────────────────────────── */}
          {state === 'invalid' && (
            <div className="text-center space-y-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.22)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#ff6060" strokeWidth="1.5" />
                  <path d="M12 8v5M12 16h.01" stroke="#ff6060" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold mb-1.5" style={{ color: '#FFFFFF' }}>
                  Link ungültig
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: '#C88090' }}>{invalidMsg}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #400010, #800020)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(128,0,32,0.22)',
                }}
              >
                Neuen Link anfordern
              </button>
            </div>
          )}

          {/* ── Passwort-Formular ───────────────────────────────────────────── */}
          {(state === 'form' || state === 'saving') && (
            <>
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                Neues Passwort vergeben
              </h2>
              <p className="text-xs mb-1" style={{ color: '#C88090' }}>
                Konto: <span style={{ color: '#800020' }}>{email}</span>
              </p>
              <p className="text-xs mb-6" style={{ color: '#C08898' }}>
                Mindestens 8 Zeichen. Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen empfohlen.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordField
                  label="Neues Passwort"
                  id="new-password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Mindestens 8 Zeichen"
                />
                <PasswordField
                  label="Passwort bestätigen"
                  id="confirm-password"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Passwort wiederholen"
                />

                {password.length > 0 && <StrengthBar password={password} />}

                {formError && (
                  <p
                    className="text-sm px-3 py-2.5 rounded-lg"
                    style={{
                      background: 'rgba(220,50,50,0.08)',
                      color: '#ff8080',
                      border: '1px solid rgba(220,50,50,0.18)',
                    }}
                  >
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state === 'saving'}
                  className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider
                             transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #5a0016, #800020, #a0002a, #800020, #5a0016)',
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(128,0,32,0.25)',
                    letterSpacing: '0.1em',
                  }}
                >
                  {state === 'saving' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: '#5a3a0a', borderTopColor: 'transparent' }}
                      />
                      Wird gespeichert …
                    </span>
                  ) : (
                    'Passwort speichern'
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── Erfolg → Auto-Login → direkt zum Dashboard ─────────────────── */}
          {state === 'success' && (
            <div className="text-center space-y-5 py-1">
              {/* Animiertes Häkchen */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: 'linear-gradient(135deg, #3a6a1a, #5bc97a)',
                  boxShadow: '0 0 32px rgba(91,201,122,0.35)',
                  animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 14L11.5 19.5L22 9" stroke="white" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Hauptnachricht */}
              <div>
                <h2 className="text-lg font-bold mb-2" style={{ color: '#FFFFFF' }}>
                  Passwort gespeichert.
                </h2>
                <p className="text-sm" style={{ color: '#C88090' }}>
                  Die App wird geladen …
                </p>
              </div>

              {/* Status-Zeile */}
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs"
                style={{
                  background: 'rgba(91,201,122,0.06)',
                  border: '1px solid rgba(91,201,122,0.16)',
                  color: '#7aaa7a',
                }}
              >
                <span
                  className="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0"
                  style={{ borderColor: '#5bc97a', borderTopColor: 'transparent' }}
                />
                Sie sind angemeldet – Angebote und Aufträge werden geladen …
              </div>

              {/* Fortschrittsbalken */}
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: '#700020' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #3a6a1a, #5bc97a)',
                    animation: 'progressBar 2s linear forwards',
                  }}
                />
              </div>

              <style>{`
                @keyframes popIn {
                  from { transform: scale(0.5); opacity: 0 }
                  to   { transform: scale(1);   opacity: 1 }
                }
                @keyframes progressBar {
                  from { width: 0% }
                  to   { width: 100% }
                }
              `}</style>
            </div>
          )}

          {/* ── Fallback: Auto-Login fehlgeschlagen ────────────────────────── */}
          {state === 'autologin_failed' && (
            <div className="space-y-5">
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  background: 'rgba(128,0,32,0.06)',
                  border: '1px solid rgba(128,0,32,0.2)',
                }}
              >
                <span className="text-lg flex-shrink-0">⚠</span>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#a0002a' }}>
                    Passwort wurde gespeichert
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#7a6a3a' }}>
                    Die automatische Anmeldung konnte nicht abgeschlossen werden
                    (Verbindungsfehler). Bitte melden Sie sich manuell an.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #400010, #800020)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(128,0,32,0.22)',
                }}
              >
                Zur Anmeldung
              </button>
            </div>
          )}

        </div>

        <p className="text-center mt-6 text-xs" style={{ color: '#C08898' }}>
          <span suppressHydrationWarning>
            © {new Date().getFullYear()} TR Edelzaun &amp; Tor GmbH
          </span>
        </p>
      </div>
    </div>
  )
}

// ── Passwort-Eingabe-Feld ─────────────────────────────────────────────────────

function PasswordField({
  label, id, value, onChange, placeholder,
}: {
  label: string; id: string; value: string
  onChange: (v: string) => void; placeholder?: string
}) {
  const [focused,  setFocused] = useState(false)
  const [visible,  setVisible] = useState(false)

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
        style={{ color: '#C88090' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          required
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full px-4 py-3 pr-11 rounded-lg text-sm transition-all duration-150"
          style={{
            background: '#3A000F',
            border: `1px solid ${focused ? '#800020' : '#700020'}`,
            color: '#FFFFFF',
            outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(128,0,32,0.08)' : 'none',
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
          style={{ color: '#C08898', fontSize: '14px' }}
          aria-label={visible ? 'Passwort verbergen' : 'Passwort anzeigen'}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  )
}

// ── Passwort-Stärke-Balken ────────────────────────────────────────────────────

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length

  const levels = [
    { label: 'Sehr schwach', color: '#ff4040' },
    { label: 'Schwach',      color: '#ff8040' },
    { label: 'Mittel',       color: '#ffc040' },
    { label: 'Stark',        color: '#80c040' },
    { label: 'Sehr stark',   color: '#40c080' },
  ]
  const lvl = levels[Math.min(score, 4)]

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {levels.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? lvl.color : '#700020' }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: lvl.color }}>{lvl.label}</p>
    </div>
  )
}

// ── Export mit Suspense (useSearchParams) ─────────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
