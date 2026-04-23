'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { setSession, updateSessionJtl, isLoggedIn } from '@/lib/auth'
import { claimPendingAnfrage } from '@/lib/store'
import Logo from '@/components/Logo'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()

  const defaultTab = params.get('register') === '1' ? 'register' : 'login'
  const prefillEmail = params.get('email') ?? ''

  const [tab,      setTab]      = useState<'login' | 'register'>(defaultTab)
  const [email,    setEmail]    = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [vorname,  setVorname]  = useState('')
  const [nachname, setNachname] = useState('')
  const [strasse,  setStrasse]  = useState('')
  const [plz,      setPlz]      = useState('')
  const [ort,      setOrt]      = useState('')
  const [tel,      setTel]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Fix: localStorage is not available during SSR → always start false, read in useEffect
  const [hasPending, setHasPending] = useState(false)
  useEffect(() => {
    setHasPending(!!localStorage.getItem('ez_pending_req'))
  }, [])

  // Passwort-vergessen Zustand
  const [forgotMode,    setForgotMode]    = useState(false)
  const [forgotEmail,   setForgotEmail]   = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotResult,  setForgotResult]  = useState<'success' | 'not_found' | 'error' | null>(null)

  useEffect(() => {
    if (isLoggedIn()) router.replace('/dashboard')
  }, [router])

  // JTL-Wawi Kunden-Lookup – im Hintergrund nach Login
  async function lookupJtlKunde(userEmail: string): Promise<void> {
    try {
      const res = await fetch(`/api/jtl/kunde?email=${encodeURIComponent(userEmail)}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.found && data.kunde?.kKunde) {
        updateSessionJtl(data.kunde.kKunde, data.kunde.kundennummer ?? '')
      }
    } catch { /* Netz-Fehler – kein Abbruch */ }
  }

  const afterAuth = useCallback(async (userEmail: string) => {
    setSession(userEmail)
    claimPendingAnfrage(userEmail)
    lookupJtlKunde(userEmail)
    router.push('/dashboard')
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben.')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (res.ok && data.ok) {
        setSession(data.email)
        claimPendingAnfrage(data.email)
        if (data.kKunde) updateSessionJtl(data.kKunde, data.kundennummer ?? '')
        router.push('/dashboard')
      } else if (res.status === 500) {
        setError('Serverfehler. Bitte versuchen Sie es später erneut.')
        setLoading(false)
      } else {
        // Kein Portal-Eintrag → noch kein Passwort gesetzt
        setError(data.error ?? 'E-Mail oder Passwort falsch.')
        setLoading(false)
      }
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!vorname.trim())         { setError('Bitte Vorname eingeben.');                         return }
    if (!nachname.trim())        { setError('Bitte Nachname eingeben.');                        return }
    if (!email.includes('@'))    { setError('Ungültige E-Mail-Adresse.');                       return }
    if (password.length < 6)    { setError('Passwort muss mindestens 6 Zeichen haben.');       return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          vorname, nachname, email, password,
          strasse: strasse || undefined,
          plz:     plz     || undefined,
          ort:     ort     || undefined,
          tel:     tel     || undefined,
        }),
      })
      const data = await res.json()

      if (res.ok && data.ok) {
        setSession(data.email)
        claimPendingAnfrage(data.email)
        if (data.kKunde) updateSessionJtl(data.kKunde, data.kundennummer ?? '')
        router.push('/dashboard')
      } else if (res.status === 409) {
        setError('Diese E-Mail-Adresse ist bereits registriert. Bitte anmelden.')
        setLoading(false)
      } else {
        setError(data.error ?? 'Registrierung fehlgeschlagen.')
        setLoading(false)
      }
    } catch {
      setError('Verbindungsfehler. Bitte erneut versuchen.')
      setLoading(false)
    }
  }

  // Passwort-vergessen: prüft JTL und versendet echte Reset-Mail (server-side)
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail.includes('@')) return
    setForgotLoading(true)
    setForgotResult(null)
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setForgotResult('error')
      } else {
        setForgotResult(data.found && data.sent ? 'success' : 'not_found')
      }
    } catch {
      setForgotResult('error')
    } finally {
      setForgotLoading(false)
    }
  }

  function openForgot() {
    setForgotEmail(email)   // E-Mail-Feld vorausfüllen falls schon eingegeben
    setForgotResult(null)
    setForgotMode(true)
  }

  function closeForgot() {
    setForgotMode(false)
    setForgotResult(null)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #800020 0px, #800020 1px, transparent 1px, transparent 60px),
                            repeating-linear-gradient(-45deg, #800020 0px, #800020 1px, transparent 1px, transparent 60px)`,
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="login" className="mb-3" />
          <p className="text-xs tracking-widest" style={{ color: '#5a5a5a', letterSpacing: '0.3em' }}>
            KUNDENPORTAL
          </p>
        </div>

        {/* Pending-Hinweis – nur client-side gerendert, kein SSR-Mismatch */}
        {hasPending && (
          <div className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'linear-gradient(135deg, #1e1a0a, #28220e)', border: '1px solid #3d3210' }}
          >
            <span className="text-lg flex-shrink-0">📋</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#a0002a' }}>
                Anfrage gespeichert
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#7a6a3a' }}>
                {tab === 'register'
                  ? 'Nach der Registrierung wird Ihre Anfrage automatisch mit dem Konto verknüpft.'
                  : 'Melden Sie sich an oder registrieren Sie sich, um die Anfrage zu verknüpfen.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab-Toggle – nur im normalen Modus sichtbar */}
        {!forgotMode && (
          <div className="flex rounded-xl p-1 mb-6"
            style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
          >
            {(['login', 'register'] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setTab(t); setError('') }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: tab === t ? '#2d2d2d' : 'transparent',
                  color: tab === t ? '#e8e8e8' : '#5a5a5a',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                {t === 'login' ? 'Anmelden' : 'Registrieren'}
              </button>
            ))}
          </div>
        )}

        {/* Karte */}
        <div className="rounded-2xl p-7 shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #2d2d2d, #252525)',
            border: '1px solid #3d3d3d',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* ── Passwort vergessen ─────────────────────────────────────────── */}
          {forgotMode ? (
            <>
              <button type="button" onClick={closeForgot}
                className="flex items-center gap-1.5 text-xs mb-5 hover:opacity-80 transition-opacity"
                style={{ color: '#7a7a7a' }}
              >
                ← Zurück zur Anmeldung
              </button>

              <h2 className="text-lg font-semibold mb-1" style={{ color: '#e8e8e8' }}>
                Passwort vergessen
              </h2>
              <p className="text-xs mb-6" style={{ color: '#7a7a7a' }}>
                Geben Sie Ihre E-Mail-Adresse ein. Wir prüfen, ob ein Konto in unserem System hinterlegt ist.
              </p>

              {forgotResult === 'success' ? (
                // Erfolgsmeldung
                <div className="rounded-xl p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: 'linear-gradient(135deg, #3a6a1a, #5bc97a)', boxShadow: '0 0 20px rgba(91,201,122,0.25)' }}
                  >
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M4.5 11L9 15.5L17.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#e8e8e8' }}>
                    E-Mail zur Passwort-Aktivierung wurde gesendet
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#7a7a7a' }}>
                    Prüfen Sie Ihren Posteingang unter{' '}
                    <span style={{ color: '#800020' }}>{forgotEmail}</span>.
                    Die E-Mail trifft in wenigen Minuten ein.
                  </p>
                  <button type="button" onClick={closeForgot}
                    className="mt-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: '#2a2a2a', color: '#9a9a9a', border: '1px solid #3a3a3a' }}
                  >
                    Zurück zur Anmeldung
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <Field
                    label="E-Mail-Adresse"
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    placeholder="kunde@beispiel.de"
                    required
                  />

                  {forgotResult === 'not_found' && (
                    <div className="rounded-lg px-3 py-2.5 text-xs"
                      style={{ background: 'rgba(220,50,50,0.08)', color: '#ff8080', border: '1px solid rgba(220,50,50,0.2)' }}
                    >
                      Diese E-Mail-Adresse ist in unserem System nicht hinterlegt.
                      Bitte wenden Sie sich direkt an uns.
                    </div>
                  )}

                  {forgotResult === 'error' && (
                    <div className="rounded-lg px-3 py-2.5 text-xs"
                      style={{ background: 'rgba(220,50,50,0.08)', color: '#ff8080', border: '1px solid rgba(220,50,50,0.2)' }}
                    >
                      Verbindungsfehler. Bitte versuchen Sie es erneut.
                    </div>
                  )}

                  <SubmitBtn loading={forgotLoading}>Aktivierungs-E-Mail senden</SubmitBtn>
                </form>
              )}
            </>

          ) : tab === 'login' ? (
            // ── Anmelden ───────────────────────────────────────────────────
            <>
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#e8e8e8' }}>Willkommen zurück</h2>
              <p className="text-xs mb-6" style={{ color: '#7a7a7a' }}>Melden Sie sich an, um Ihre Dokumente einzusehen.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <Field label="E-Mail" id="email" type="email" value={email}
                  onChange={setEmail} placeholder="kunde@beispiel.de" required />
                <Field label="Passwort" id="password" type="password" value={password}
                  onChange={setPassword} placeholder="••••••••" required />

                {error && <ErrorMsg>{error}</ErrorMsg>}

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" style={{ accentColor: '#800020' }} />
                    <span className="text-xs" style={{ color: '#7a7a7a' }}>Angemeldet bleiben</span>
                  </label>
                  <button type="button" onClick={openForgot}
                    className="text-xs hover:opacity-80 transition-opacity" style={{ color: '#800020' }}
                  >
                    Passwort vergessen?
                  </button>
                </div>

                <SubmitBtn loading={loading}>Anmelden</SubmitBtn>
              </form>

              <p className="text-center text-xs mt-5" style={{ color: '#4a4a4a' }}>
                Noch kein Konto?{' '}
                <button type="button" onClick={() => setTab('register')}
                  className="hover:opacity-80 transition-opacity font-medium" style={{ color: '#800020' }}
                >
                  Jetzt registrieren
                </button>
              </p>
            </>

          ) : (
            // ── Registrieren ───────────────────────────────────────────────
            <>
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#e8e8e8' }}>Konto erstellen</h2>
              <p className="text-xs mb-6" style={{ color: '#7a7a7a' }}>Kostenlos und unverbindlich – Angebote & Status online verfolgen.</p>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Vorname" id="vorname" type="text" value={vorname}
                    onChange={setVorname} placeholder="Max" required />
                  <Field label="Nachname" id="nachname" type="text" value={nachname}
                    onChange={setNachname} placeholder="Mustermann" required />
                </div>

                {/* Zugangsdaten */}
                <Field label="E-Mail" id="reg-email" type="email" value={email}
                  onChange={setEmail} placeholder="max@beispiel.de" required />
                <Field label="Passwort" id="reg-password" type="password" value={password}
                  onChange={setPassword} placeholder="Mindestens 6 Zeichen" required />

                {/* Adressdaten (optional) */}
                <div className="space-y-3 pt-3" style={{ borderTop: '1px solid #2d2d2d' }}>
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: '#4a4a4a' }}>
                    Adressdaten <span style={{ color: '#3a3a3a' }}>(optional)</span>
                  </p>
                  <Field label="Straße & Hausnummer" id="strasse" type="text" value={strasse}
                    onChange={setStrasse} placeholder="Musterstraße 1" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="PLZ" id="plz" type="text" value={plz}
                      onChange={setPlz} placeholder="06369" />
                    <Field label="Ort" id="ort" type="text" value={ort}
                      onChange={setOrt} placeholder="Großwülknitz" />
                  </div>
                  <Field label="Telefon" id="tel" type="tel" value={tel}
                    onChange={setTel} placeholder="+49 3496 …" />
                </div>

                {error && <ErrorMsg>{error}</ErrorMsg>}

                <SubmitBtn loading={loading}>Konto erstellen & anmelden</SubmitBtn>
              </form>

              <p className="text-center text-xs mt-5" style={{ color: '#4a4a4a' }}>
                Bereits registriert?{' '}
                <button type="button" onClick={() => setTab('login')}
                  className="hover:opacity-80 transition-opacity font-medium" style={{ color: '#800020' }}
                >
                  Anmelden
                </button>
              </p>
            </>
          )}
        </div>

        {/* Fix: suppressHydrationWarning verhindert Mismatch beim Jahreswechsel */}
        <p className="text-center mt-6 text-xs" style={{ color: '#4a4a4a' }}>
          <span suppressHydrationWarning>
            © {new Date().getFullYear()} TR Edelzaun &amp; Tor GmbH
          </span>
        </p>
      </div>
    </div>
  )
}

// ── Kleine Hilfskomponenten ────────────────────────────────────────────────────

function Field({ label, id, type, value, onChange, placeholder, required }: {
  label: string; id: string; type: string; value: string
  onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
        style={{ color: '#9a9a9a' }}
      >{label}</label>
      <input id={id} type={type} value={value} placeholder={placeholder} required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-150"
        style={{
          background: '#1a1a1a',
          border: `1px solid ${focused ? '#800020' : '#3d3d3d'}`,
          color: '#e8e8e8',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(128,0,32,0.08)' : 'none',
        }}
      />
    </div>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm px-3 py-2 rounded-lg"
      style={{ background: 'rgba(220,50,50,0.08)', color: '#ff8080', border: '1px solid rgba(220,50,50,0.2)' }}
    >{children}</p>
  )
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-200 disabled:opacity-50"
      style={{
        background: 'linear-gradient(135deg, #5a0016, #800020, #a0002a, #800020, #5a0016)',
        color: '#ffffff',
        boxShadow: '0 4px 15px rgba(128,0,32,0.25)',
        letterSpacing: '0.12em',
      }}
    >
      {loading ? 'Bitte warten …' : children}
    </button>
  )
}

// ── Export mit Suspense (useSearchParams braucht es) ──────────────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
