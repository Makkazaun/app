/**
 * GET  /api/notifications/settings?email=<email>
 *   → { notificationsEnabled: boolean }
 *
 * PATCH /api/notifications/settings
 *   Body: { email: string, enabled: boolean }
 *   → { ok: true }
 */

import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, setNotificationsEnabled } from '@/src/lib/portal-db'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase() ?? ''
  if (!email) {
    return NextResponse.json({ error: 'E-Mail fehlt.' }, { status: 400 })
  }

  const user = findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 })
  }

  return NextResponse.json({ notificationsEnabled: user.notifications_enabled === 1 })
}

export async function PATCH(req: NextRequest) {
  let body: { email?: unknown; enabled?: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 }) }

  const email   = typeof body.email   === 'string'  ? body.email.trim().toLowerCase() : ''
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : null

  if (!email)         return NextResponse.json({ error: 'E-Mail fehlt.'  }, { status: 400 })
  if (enabled === null) return NextResponse.json({ error: 'enabled fehlt.' }, { status: 400 })

  const user = findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 })
  }

  setNotificationsEnabled(email, enabled)
  console.log(`[notifications/settings] ${email} → notificationsEnabled=${enabled}`)

  return NextResponse.json({ ok: true })
}
