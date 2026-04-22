'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSession, updateSessionJtl } from '@/lib/auth'
import type { JtlAngebot, JtlAuftrag, JtlKunde, JtlRechnung } from '@/src/lib/db-jtl'

export type { JtlAngebot, JtlAuftrag, JtlKunde, JtlRechnung }

interface JtlState<T> {
  data:    T | null
  loading: boolean
  error:   string | null
}

/**
 * Gibt kKunde aus der Session zurück.
 * Falls noch nicht gecacht, löst einen Lookup per /api/jtl/kunde aus.
 */
async function resolveKKunde(): Promise<number | null> {
  const session = getSession()
  if (!session) return null
  if (session.kKunde !== null) return session.kKunde

  try {
    const res = await fetch(`/api/jtl/kunde?email=${encodeURIComponent(session.email)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.found && data.kunde?.kKunde) {
      updateSessionJtl(data.kunde.kKunde, data.kunde.kundennummer)
      return data.kunde.kKunde as number
    }
  } catch { /* Netz-Fehler – still fail */ }

  return null
}

/**
 * Liest den Fehlertext aus einer nicht-ok API-Antwort.
 * Gibt bei 502 zusätzlich einen Hinweis auf fehlerhafte .env-Zugangsdaten aus.
 */
async function extractApiError(res: Response): Promise<string> {
  let body: { error?: string; detail?: string } = {}
  try { body = await res.json() } catch { /* kein JSON */ }

  const detail = body.detail ?? body.error ?? ''

  if (res.status === 502) {
    const hint = detail
      ? `Datenbankverbindung fehlgeschlagen: ${detail}`
      : 'Datenbankverbindung fehlgeschlagen.'
    return `${hint} – Bitte DB_SERVER, DB_USER und DB_PASSWORD in der .env prüfen.`
  }

  if (res.status === 400) {
    return detail || 'Ungültige Anfrage – kKunde fehlt in der Session.'
  }

  return detail || `Serverfehler (HTTP ${res.status}).`
}

// ── Angebote ──────────────────────────────────────────────────────────────────

export function useJtlAngebote(): JtlState<JtlAngebot[]> & { reload: () => void } {
  const [state, setState] = useState<JtlState<JtlAngebot[]>>({
    data: null, loading: true, error: null,
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const kKunde = await resolveKKunde()
      if (!kKunde) { setState({ data: [], loading: false, error: null }); return }
      const res = await fetch(`/api/jtl/angebote?kKunde=${kKunde}`)
      if (!res.ok) throw new Error(await extractApiError(res))
      const json = await res.json()
      setState({ data: json.angebote ?? [], loading: false, error: null })
    } catch (err) {
      setState({ data: null, loading: false, error: String(err instanceof Error ? err.message : err) })
    }
  }, [])

  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

// ── Aufträge ──────────────────────────────────────────────────────────────────

export function useJtlAuftraege(): JtlState<JtlAuftrag[]> & { reload: () => void } {
  const [state, setState] = useState<JtlState<JtlAuftrag[]>>({
    data: null, loading: true, error: null,
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const kKunde = await resolveKKunde()
      if (!kKunde) { setState({ data: [], loading: false, error: null }); return }
      const res = await fetch(`/api/jtl/auftraege?kKunde=${kKunde}`)
      if (!res.ok) throw new Error(await extractApiError(res))
      const json = await res.json()
      setState({ data: json.auftraege ?? [], loading: false, error: null })
    } catch (err) {
      setState({ data: null, loading: false, error: String(err instanceof Error ? err.message : err) })
    }
  }, [])

  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

// ── Stammdaten ────────────────────────────────────────────────────────────────

export function useJtlKunde(): JtlState<JtlKunde> {
  const [state, setState] = useState<JtlState<JtlKunde>>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    async function load() {
      setState((s) => ({ ...s, loading: true }))
      try {
        const session = getSession()
        if (!session?.email) { setState({ data: null, loading: false, error: null }); return }
        const res = await fetch(`/api/jtl/kunde?email=${encodeURIComponent(session.email)}`)
        if (!res.ok) throw new Error(await extractApiError(res))
        const json = await res.json()
        if (json.found && json.kunde) {
          updateSessionJtl(json.kunde.kKunde, json.kunde.kundennummer)
        }
        setState({ data: json.found ? json.kunde : null, loading: false, error: null })
      } catch (err) {
        setState({ data: null, loading: false, error: String(err instanceof Error ? err.message : err) })
      }
    }
    load()
  }, [])

  return state
}

// ── Rechnungen ────────────────────────────────────────────────────────────────

export function useJtlRechnungen(): JtlState<JtlRechnung[]> & { reload: () => void } {
  const [state, setState] = useState<JtlState<JtlRechnung[]>>({
    data: null, loading: true, error: null,
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const kKunde = await resolveKKunde()
      if (!kKunde) { setState({ data: [], loading: false, error: null }); return }
      const res = await fetch(`/api/jtl/rechnungen?kKunde=${kKunde}`)
      if (!res.ok) throw new Error(await extractApiError(res))
      const json = await res.json()
      setState({ data: json.rechnungen ?? [], loading: false, error: null })
    } catch (err) {
      setState({ data: null, loading: false, error: String(err instanceof Error ? err.message : err) })
    }
  }, [])

  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

// ── Sign-Helper ───────────────────────────────────────────────────────────────

/**
 * Sendet Unterschrift-Bestätigung an JTL-Wawi (setzt tAngebot.nStatus = 2).
 * Non-throwing – gibt false zurück bei Fehler.
 */
export async function signAngebotInJtl(kAngebot: number): Promise<boolean> {
  try {
    const res = await fetch('/api/jtl/sign', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ kAngebot }),
    })
    return res.ok
  } catch {
    return false
  }
}
