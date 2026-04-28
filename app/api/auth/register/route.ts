/**
 * POST /api/auth/register
 *
 * Body: {
 *   vorname:   string          – Pflicht
 *   nachname:  string          – Pflicht
 *   email:     string          – Pflicht
 *   password:  string          – Pflicht, min. 6 Zeichen
 *   strasse?:  string          – Optional (für JTL-Adresse)
 *   plz?:      string          – Optional
 *   ort?:      string          – Optional
 *   tel?:      string          – Optional
 * }
 *
 * Ablauf:
 *   1. Eingabe-Validierung
 *   2. Portal-DB: Duplikat prüfen (E-Mail unique → 409)
 *   3. JTL-Wawi: E-Mail vorhanden?
 *      a) Ja  → bestehenden kKunde verknüpfen
 *      b) Nein → neuen Datensatz in tKunde + tAdresse anlegen
 *      (JTL-Fehler ist nicht fatal – Registrierung läuft ohne Wawi-Link)
 *   4. Passwort mit bcrypt (12 Runden) hashen
 *   5. Portal-DB: Nutzer anlegen + Passwort setzen
 *   6. Bestätigungsmail an den Kunden (nicht fatal – Fehler nur geloggt)
 *   7. Gibt email, kKunde, kundennummer zurück (für sofortige Session)
 *
 * 200 { ok: true, email, kKunde, kundennummer }
 * 400 { error }  → Eingabefehler
 * 409 { error }  → E-Mail bereits registriert
 * 500 { error }  → Interner Fehler
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { findUserByEmail, upsertUserJtl, setPasswordHash, createPortalUser } from '@/src/lib/portal-db'
import { findKundeByEmail, createKundeInJtl } from '@/src/lib/db-jtl'
import { sendMail } from '@/src/lib/mailer'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 }) }

  const vorname  = typeof body.vorname  === 'string' ? body.vorname.trim()  : ''
  const nachname = typeof body.nachname === 'string' ? body.nachname.trim() : ''
  const email    = typeof body.email    === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const strasse  = typeof body.strasse  === 'string' ? body.strasse.trim()  || null : null
  const plz      = typeof body.plz      === 'string' ? body.plz.trim()      || null : null
  const ort      = typeof body.ort      === 'string' ? body.ort.trim()      || null : null
  const tel      = typeof body.tel      === 'string' ? body.tel.trim()      || null : null

  if (!vorname)                       return NextResponse.json({ error: 'Vorname erforderlich.'  }, { status: 400 })
  if (!nachname)                      return NextResponse.json({ error: 'Nachname erforderlich.' }, { status: 400 })
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Gültige E-Mail-Adresse erforderlich.' }, { status: 400 })
  if (password.length < 6)           return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen haben.' }, { status: 400 })

  // 1. Portal-Duplikat prüfen (synchron, schnell)
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' }, { status: 409 })
  }

  try {
    let kKunde:       number | null = null
    let kundennummer: string | null = null

    // 2+3. JTL-Wawi: Duplikat prüfen / Neukunde anlegen (nicht fatal)
    try {
      const existingJtl = await findKundeByEmail(email)
      if (existingJtl) {
        kKunde       = existingJtl.kKunde
        kundennummer = existingJtl.kundennummer
        console.log(`[register] E-Mail ${email} bereits in JTL (kKunde=${kKunde}) – verknüpfe Portal-Nutzer`)
      } else {
        const created = await createKundeInJtl({ vorname, nachname, email, strasse, plz, ort, tel })
        kKunde       = created.kKunde
        kundennummer = created.kundennummer
      }
    } catch (jtlErr) {
      if ((jtlErr as { code?: string }).code === 'EMAIL_EXISTS') {
        // Race condition: zwischen findKundeByEmail und createKundeInJtl wurde ein anderer
        // Datensatz angelegt – nochmal suchen und verknüpfen statt still fehlschlagen.
        try {
          const existing = await findKundeByEmail(email)
          if (existing) { kKunde = existing.kKunde; kundennummer = existing.kundennummer }
        } catch { /* JTL immer noch nicht erreichbar – weiter ohne Link */ }
      } else {
        console.warn('[register] JTL nicht erreichbar – Registrierung ohne Wawi-Verlinkung:',
          (jtlErr as Error).message?.split('\n')[0])
      }
    }

    // 4. Passwort hashen (12 Runden)
    const hash = await bcrypt.hash(password, 12)

    // 5. Portal-Nutzer anlegen (mit oder ohne JTL-Link)
    if (kKunde !== null) {
      upsertUserJtl(email, kKunde, kundennummer ?? '')
    } else {
      createPortalUser(email)
    }
    setPasswordHash(email, hash)

    console.log(`[register] ✓ ${email} registriert (kKunde=${kKunde ?? 'kein JTL-Link'})`)

    // 6. Bestätigungsmail – nicht fatal
    sendMail({
      to:      email,
      subject: 'Willkommen bei TR Edelzaun & Tor – Ihre Registrierung war erfolgreich',
      html: `
        <h1>Herzlich Willkommen bei TR Edelzaun &amp; Tor!</h1>
        <p>Sehr geehrte Damen und Herren / Guten Tag,</p>
        <p>vielen Dank für Ihre Registrierung in unserer App. Ihr Kundenkonto wurde erfolgreich erstellt und mit unserem System verknüpft.</p>
        <p>Sie können sich ab sofort mit Ihrer E-Mail-Adresse und Ihrem gewählten Passwort einloggen, um Ihre Angebote einzusehen und digital zu unterschreiben.</p>
        <p>Wir freuen uns auf die erfolgreiche Zusammenarbeit!</p>
        <p>Mit freundlichen Grüßen,</p>
        <p>Ihr Team von TR Edelzaun &amp; Tor</p>
      `,
    }).catch((mailErr: unknown) => {
      console.warn('[register] Bestätigungsmail fehlgeschlagen:', (mailErr as Error).message?.split('\n')[0])
    })

    return NextResponse.json({ ok: true, email, kKunde, kundennummer })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[register] Fehler:', msg)
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.', detail: msg },
      { status: 500 },
    )
  }
}
