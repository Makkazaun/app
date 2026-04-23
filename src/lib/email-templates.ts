/**
 * Zentrales E-Mail-Template-System
 *
 * SERVER-ONLY – niemals in Client-Komponenten importieren.
 *
 * Alle ausgehenden E-Mails werden durch generateEmailHtml() gerendert:
 *   - Dunkles Branding (Anthrazit #1a1a1a, Silber, Gold #c9a84c)
 *   - Logo als CID-Inline-Attachment (kein externer CDN-Link nötig)
 *   - Rechtssicherer Footer mit Impressum-Pflichtangaben
 *
 * Verwendung:
 *   const { html, text, attachments } = buildPasswordResetEmail({ ... })
 *   await sendMail({ to, subject, html, text, attachments })
 */

import fs   from 'fs'
import path from 'path'

// ── CID-Konstante ─────────────────────────────────────────────────────────────

export const LOGO_CID = 'logo@edelzaun-tor.de'

/** Liest das Logo aus /public und gibt es als nodemailer-Attachment zurück. */
export function getLogoAttachment(): {
  filename: string
  content:  Buffer
  cid:      string
  contentDisposition: 'inline'
} {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png')
  const content  = fs.readFileSync(logoPath)
  return {
    filename:           'logo.png',
    content,
    cid:                LOGO_CID,
    contentDisposition: 'inline',
  }
}

// ── Zentrales HTML-Wrapper-Template ──────────────────────────────────────────

interface WrapperParams {
  /** Wird im <title>-Tag und Preheader verwendet */
  title:      string
  /** Haupt-HTML-Inhalt (zwischen Header und Footer) */
  content:    string
  /** Optionaler unsichtbarer Preheader-Text (Postfach-Vorschau) */
  preheader?: string
}

export function generateEmailHtml({ title, content, preheader = '' }: WrapperParams): string {
  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escHtml(title)}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; display: block; }
    a { color: #800020; }
  </style>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  ${preheader ? `<!-- Preheader (unsichtbar) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;
              color:#0d0d0d;mso-hide:all;">${escHtml(preheader)}&zwnj;
    ${'&nbsp;&zwnj;'.repeat(60)}
  </div>` : ''}

  <!-- Äußerer Hintergrund -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:#0d0d0d;padding:36px 16px;">
  <tr><td align="center">

  <!-- E-Mail-Karte -->
  <table role="presentation" width="580" cellpadding="0" cellspacing="0"
    style="max-width:580px;width:100%;background:#1a1a1a;border-radius:16px;
           overflow:hidden;border:1px solid #2d2d2d;
           box-shadow:0 8px 32px rgba(0,0,0,0.5);">

    <!-- ── Logo-Header ─────────────────────────────────────────────────── -->
    <tr>
      <td align="center"
        style="background:linear-gradient(160deg,#1c0808 0%,#2a0810 50%,#1c0808 100%);
               padding:28px 36px 24px;border-bottom:2px solid #800020;">
        <img
          src="cid:${LOGO_CID}"
          alt="TR Edelzaun &amp; Tor GmbH"
          width="180"
          height="109"
          style="width:180px;max-width:100%;height:auto;display:block;margin:0 auto;"
        />
      </td>
    </tr>

    <!-- ── Inhalt ──────────────────────────────────────────────────────── -->
    <tr>
      <td style="padding:0;">
        ${content}
      </td>
    </tr>

    <!-- ── Trennlinie ─────────────────────────────────────────────────── -->
    <tr>
      <td style="padding:0 36px;">
        <div style="height:1px;background:linear-gradient(90deg,transparent,#2d2d2d,transparent);"></div>
      </td>
    </tr>

    <!-- ── Rechtssicherer Footer ──────────────────────────────────────── -->
    <tr>
      <td style="padding:20px 36px 24px;background:#111111;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <!-- Kontakt-Zeile -->
              <p style="margin:0 0 10px;font-size:12px;color:#5a5a5a;text-align:center;
                         line-height:1.6;">
                <a href="mailto:info@edelzaun-tor.de"
                  style="color:#800020;text-decoration:none;font-weight:600;">
                  info@edelzaun-tor.de
                </a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="tel:034967005181"
                  style="color:#800020;text-decoration:none;font-weight:600;">
                  03496&nbsp;700&nbsp;5181
                </a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="https://www.edelzaun-tor.de"
                  style="color:#7a7a7a;text-decoration:none;">
                  www.edelzaun-tor.de
                </a>
              </p>
              <!-- Pflichtangaben Impressum -->
              <p style="margin:0 0 6px;font-size:10px;color:#3a3a3a;text-align:center;
                         line-height:1.7;">
                TR Edelzaun &amp; Tor GmbH &nbsp;·&nbsp;
                Kastanienplatz 2 &nbsp;·&nbsp;
                06369 Großwülknitz &nbsp;·&nbsp;
                Deutschland
              </p>
              <p style="margin:0;font-size:10px;color:#2a2a2a;text-align:center;">
                <a href="https://www.edelzaun-tor.de/impressum"
                  style="color:#3a3a3a;text-decoration:none;">Impressum</a>
                &nbsp;·&nbsp;
                <a href="https://www.edelzaun-tor.de/datenschutz"
                  style="color:#3a3a3a;text-decoration:none;">Datenschutz</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>
  <!-- /E-Mail-Karte -->

  </td></tr>
  </table>
  <!-- /Äußerer Hintergrund -->

</body>
</html>`
}

// ── Hilfsfunktion ─────────────────────────────────────────────────────────────

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Passwort-Reset-E-Mail ─────────────────────────────────────────────────────

export function buildPasswordResetEmail({
  vorname,
  nachname,
  resetLink,
}: {
  vorname:   string
  nachname:  string
  resetLink: string
}): { html: string; text: string } {
  const name   = [vorname, nachname].filter(Boolean).join(' ')
  const anrede = vorname ? `Hallo ${escHtml(vorname)},` : 'Hallo,'

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:32px 36px 12px;">

          <!-- Titel + Empfänger -->
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#e8e8e8;
                     letter-spacing:-0.01em;">
            Passwort zurücksetzen
          </h1>
          ${name ? `<p style="margin:0 0 22px;font-size:13px;color:#8a7a4a;">${escHtml(name)}</p>` : '<div style="margin-bottom:22px;"></div>'}

          <!-- Anrede + Text -->
          <p style="margin:0 0 22px;font-size:15px;color:#b8b8b8;line-height:1.75;">
            ${anrede}<br><br>
            wir haben eine Anfrage zum Zurücksetzen Ihres Passworts für das
            <strong style="color:#e8e8e8;">Edelzaun Kundenportal</strong> erhalten.
            Klicken Sie auf den Button, um ein neues Passwort zu vergeben.
          </p>

          <!-- Gültigkeits-Hinweis -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="margin-bottom:28px;">
            <tr>
              <td style="background:#1c0810;border:1px solid #3a1020;border-radius:10px;
                         padding:12px 16px;">
                <p style="margin:0;font-size:12px;color:#8a7a4a;line-height:1.6;">
                  ⏱&nbsp; Der Link ist
                  <strong style="color:#800020;">30 Minuten gültig</strong>
                  und kann nur einmal verwendet werden.
                </p>
              </td>
            </tr>
          </table>

          <!-- CTA-Button -->
          <table role="presentation" cellpadding="0" cellspacing="0"
            style="margin:0 auto 28px;">
            <tr>
              <td style="border-radius:10px;
                         background:linear-gradient(135deg,#400010,#800020,#a0002a,#800020,#400010);
                         box-shadow:0 4px 20px rgba(128,0,32,0.3);">
                <a href="${resetLink}"
                  style="display:inline-block;padding:14px 38px;font-size:14px;
                         font-weight:700;color:#ffffff;text-decoration:none;
                         letter-spacing:0.07em;border-radius:10px;white-space:nowrap;">
                  Neues Passwort vergeben
                </a>
              </td>
            </tr>
          </table>

          <!-- Fallback-URL -->
          <p style="margin:0 0 6px;font-size:12px;color:#5a5a5a;">
            Falls der Button nicht funktioniert, kopieren Sie diesen Link:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="margin-bottom:28px;">
            <tr>
              <td style="background:#141414;border:1px solid #2a2a2a;border-radius:8px;
                         padding:10px 14px;word-break:break-all;">
                <a href="${resetLink}"
                  style="font-size:11px;color:#800020;text-decoration:none;
                         line-height:1.5;">${resetLink}</a>
              </td>
            </tr>
          </table>

          <!-- Sicherheitshinweis -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#141414;border:1px solid #242424;border-radius:10px;
                         padding:14px 16px;">
                <p style="margin:0;font-size:12px;color:#5a5a5a;line-height:1.6;">
                  <strong style="color:#7a7a7a;">Nicht von Ihnen angefordert?</strong><br>
                  Ignorieren Sie diese E-Mail. Ihr Passwort bleibt unverändert
                  und der Link verfällt automatisch nach 30 Minuten.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>`

  const html = generateEmailHtml({
    title:    'Passwort zurücksetzen – Edelzaun Kundenportal',
    preheader: 'Klicken Sie auf den Link, um ein neues Passwort zu vergeben (30 Min. gültig).',
    content,
  })

  const text = [
    'PASSWORT ZURÜCKSETZEN – Edelzaun Kundenportal',
    '═'.repeat(52),
    '',
    vorname ? `Hallo ${vorname},` : 'Hallo,',
    '',
    'Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.',
    'Öffnen Sie diesen Link, um ein neues Passwort zu vergeben (gültig 30 Minuten):',
    '',
    resetLink,
    '',
    'Falls Sie kein Passwort zurücksetzen wollten, ignorieren Sie diese E-Mail.',
    '',
    '─'.repeat(52),
    'TR Edelzaun & Tor GmbH · Kastanienplatz 2 · 06369 Großwülknitz',
    'Tel: 03496-7005181 · info@edelzaun-tor.de · www.edelzaun-tor.de',
  ].join('\n')

  return { html, text }
}

// ── Test-Mail ─────────────────────────────────────────────────────────────────

export function buildTestEmail({
  host, port, user, from, appUrl,
}: {
  host: string; port: string; user: string; from: string; appUrl: string
}): { html: string; text: string } {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:32px 36px;">

          <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#e8e8e8;">
            SMTP-Verbindungstest ✓
          </h1>
          <p style="margin:0 0 24px;font-size:14px;color:#9a9a9a;line-height:1.6;">
            Diese E-Mail bestätigt, dass SMTP und Logo-CID-Einbettung
            korrekt konfiguriert sind.
          </p>

          <!-- Konfig-Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="margin-bottom:24px;">
            <tr>
              <td style="background:#141414;border:1px solid #2a2a2a;border-radius:10px;
                         padding:16px 20px;">
                <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.14em;
                           text-transform:uppercase;color:#800020;">Konfiguration</p>
                ${[
                  ['HOST', host],
                  ['PORT', port],
                  ['USER', user],
                  ['FROM', from],
                  ['APP_URL', appUrl],
                  ['LOGO', 'CID-Inline-Embedding (cid:logo@edelzaun-tor.de)'],
                ].map(([k, v]) => `
                <p style="margin:0 0 5px;font-size:12px;line-height:1.5;">
                  <span style="color:#5a5a5a;display:inline-block;width:80px;">${k}</span>
                  <span style="color:#b0b0b0;">${escHtml(v)}</span>
                </p>`).join('')}
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:12px;color:#4a4a4a;">
            Gesendet am ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })} Uhr
          </p>

        </td>
      </tr>
    </table>`

  const html = generateEmailHtml({
    title:    '[TEST] SMTP-Verbindungstest – Edelzaun',
    preheader: 'SMTP und Logo-CID-Einbettung erfolgreich konfiguriert.',
    content,
  })

  const text = `[TEST] SMTP-Verbindungstest – Edelzaun\n\nSMTP OK.\nHOST: ${host}\nPORT: ${port}\nUSER: ${user}\n`

  return { html, text }
}
