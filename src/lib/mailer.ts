/**
 * SMTP-Mailer (nodemailer) — SERVER-ONLY
 *
 * Konfiguration via .env.local:
 *   EMAIL_SERVER_HOST      SMTP-Hostname  (z.B. smtp.strato.de)
 *   EMAIL_SERVER_PORT      465 (SSL) oder 587 (STARTTLS)
 *   EMAIL_SERVER_USER      Login-Adresse  (z.B. app@edelzaun-tor.de)
 *   EMAIL_SERVER_PASSWORD  SMTP-Passwort
 *   EMAIL_FROM             Absender       (z.B. TR Edelzaun & Tor GmbH <app@edelzaun-tor.de>)
 */

import nodemailer, { type SendMailOptions } from 'nodemailer'

// ── Transporter-Factory ────────────────────────────────────────────────────────
// Kein Singleton – jedes Senden öffnet eine eigene Verbindung.
// Verhindert Probleme mit abgelaufenen Verbindungen in Long-running-Prozessen.

function createTransporter() {
  const host     = process.env.EMAIL_SERVER_HOST
  const port     = parseInt(process.env.EMAIL_SERVER_PORT ?? '465', 10)
  const user     = process.env.EMAIL_SERVER_USER
  const password = process.env.EMAIL_SERVER_PASSWORD

  if (!host || !user || !password) {
    throw new Error(
      'SMTP nicht konfiguriert – bitte EMAIL_SERVER_HOST, EMAIL_SERVER_USER und EMAIL_SERVER_PASSWORD in .env.local setzen.'
    )
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,   // true = direktes SSL (Port 465), false = STARTTLS (Port 587)
    auth: { user, pass: password },
    tls: { rejectUnauthorized: true },   // Produktions-Standard; auf false setzen bei selbstsignierten Zertifikaten
    connectionTimeout:  15_000,   // 15 s bis TCP-Verbindung steht
    greetingTimeout:    10_000,   // 10 s bis SMTP-Begrüßung
    socketTimeout:      30_000,   // 30 s pro Sende-Operation
  })
}

// ── Verbindungstest (nur für Diagnose-Endpunkt) ────────────────────────────────

export async function testSmtpConnection(): Promise<{
  host: string; port: string; user: string
}> {
  const t = createTransporter()
  await t.verify()
  const host = process.env.EMAIL_SERVER_HOST ?? '?'
  const port = process.env.EMAIL_SERVER_PORT ?? '?'
  const user = process.env.EMAIL_SERVER_USER ?? '?'
  console.log(`[mailer] ✓ SMTP verify OK – ${host}:${port} als ${user}`)
  return { host, port, user }
}

// ── Mail versenden ─────────────────────────────────────────────────────────────

export interface MailOptions {
  to:           string | string[]
  subject:      string
  html:         string
  text?:        string
  attachments?: SendMailOptions['attachments']
}

export async function sendMail(options: MailOptions): Promise<void> {
  const t    = createTransporter()
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SERVER_USER

  const msg: SendMailOptions = {
    from,
    to:          options.to,
    subject:     options.subject,
    html:        options.html,
    text:        options.text,
    attachments: options.attachments,
  }

  const toStr = Array.isArray(options.to) ? options.to.join(', ') : options.to

  console.log(`[mailer] Sende Mail an "${toStr}" | Betreff: "${options.subject}"`)
  const info = await t.sendMail(msg)
  console.log(`[mailer] ✓ Akzeptiert von SMTP-Server | MessageId: ${info.messageId} | Response: ${info.response}`)
}
