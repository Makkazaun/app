const SESSION_KEY = 'edelzaun_auth'

export interface Session {
  email:        string
  ts:           number
  kKunde:       number | null   // JTL-Wawi interner PK aus tKunde – primärer Schlüssel für alle DB-Abfragen
  kundennummer: string | null   // Anzeigenummer z.B. "K-10042"
}

export function setSession(email: string) {
  if (typeof window === 'undefined') return
  const session: Session = { email, ts: Date.now(), kKunde: null, kundennummer: null }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function updateSessionJtl(kKunde: number, kundennummer: string) {
  if (typeof window === 'undefined') return
  const current = getSession()
  if (!current) return
  const updated: Session = { ...current, kKunde, kundennummer }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Rückwärtskompatibilität: alte Sessions ohne kKunde/kundennummer
    return {
      email:        parsed.email        ?? '',
      ts:           parsed.ts           ?? 0,
      kKunde:       parsed.kKunde       ?? null,
      kundennummer: parsed.kundennummer ?? parsed.jtlKundennummer?.split('|')[0] ?? null,
    } as Session
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return getSession() !== null
}
