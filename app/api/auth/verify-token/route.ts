/**
 * GET /api/auth/verify-token?token=<token>
 *
 * Validiert einen Passwort-Reset-Token aus der Portal-DB.
 *
 * 200 { valid: true,  email }   → Token gültig
 * 200 { valid: false, reason }  → abgelaufen, unbekannt oder fehlt
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateResetToken } from '@/src/lib/portal-db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim() ?? ''

  if (!token) {
    return NextResponse.json({ valid: false, reason: 'Kein Token angegeben.' }, { status: 200 })
  }

  try {
    const email = validateResetToken(token)

    if (!email) {
      return NextResponse.json(
        { valid: false, reason: 'Link abgelaufen oder ungültig. Bitte erneut anfordern.' },
        { status: 200 }
      )
    }

    return NextResponse.json({ valid: true, email }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[verify-token]', msg)
    return NextResponse.json({ valid: false, reason: 'Datenbankfehler.' }, { status: 500 })
  }
}
