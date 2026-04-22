import { Resend } from 'resend'
import {
  buildSubject,
  buildAdminHtml,
  buildCustomerHtml,
  buildAdminText,
  type EmailPayload,
} from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  let payload: EmailPayload

  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Ungültige Anfragedaten.' }, { status: 400 })
  }

  // Pflichtfelder prüfen
  if (!payload.email || !payload.vorname || !payload.nachname || !payload.produkt) {
    return Response.json({ error: 'Fehlende Pflichtfelder.' }, { status: 400 })
  }

  const subject = buildSubject(payload)

  try {
    // ── 1. Admin-E-Mail an anfrage@edelzaun-tor.de ────────────────────────
    await resend.emails.send({
      from: 'Edelzaun Konfigurator <noreply@edelzaun-tor.de>',
      to: ['anfrage@edelzaun-tor.de'],
      subject,
      html: buildAdminHtml(payload),
      text: buildAdminText(payload),
    })

    // ── 2. Bestätigungs-E-Mail an den Kunden ─────────────────────────────
    const customerName = [payload.vorname, payload.nachname].filter(Boolean).join(' ')
    await resend.emails.send({
      from: 'TR Edelzaun & Tor GmbH <noreply@edelzaun-tor.de>',
      to: [payload.email],
      subject: `Ihre Anfrage ist eingegangen – ${customerName}`,
      html: buildCustomerHtml(payload),
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[anfrage/route] Resend error:', err)
    return Response.json(
      { error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.' },
      { status: 500 },
    )
  }
}
