import type { ConfigSnapshot } from './store'
import { getFarbLabel } from '@/components/konfigurator/betonzaun-modelle'

export interface EmailPayload {
  vorname: string
  nachname: string
  email: string
  telefon: string
  plz: string
  ort: string
  nachricht: string
  produkt: string
  config: ConfigSnapshot
}

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

export function buildSubject(p: EmailPayload): string {
  const typLabel: Record<string, string> = {
    betonzaun:       'Betonzaun',
    doppelstabmatte: 'Doppelstabmatte',
    schmiedekunst:   'Schmiedekunst / Metallzaun',
  }
  const typ = typLabel[p.produkt] ?? p.produkt
  const name = [p.vorname, p.nachname].filter(Boolean).join(' ')
  return `Neue Zaun-Anfrage: ${typ} – ${name}`
}

function row(label: string, value: string | null | undefined) {
  if (!value || value === '–' || value === '') return ''
  return `
    <tr>
      <td style="padding:6px 16px 6px 0;color:#8a8a8a;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#e0e0e0;font-size:13px;">${value}</td>
    </tr>`
}

function section(title: string, rows: string) {
  if (!rows.trim()) return ''
  return `
    <div style="margin-bottom:28px;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.14em;
                text-transform:uppercase;color:#c9a84c;border-bottom:1px solid #2d2d2d;padding-bottom:6px;">
        ${title}
      </p>
      <table style="border-collapse:collapse;width:100%;">
        <tbody>${rows}</tbody>
      </table>
    </div>`
}

// ── Admin-E-Mail an anfrage@edelzaun-tor.de ──────────────────────────────────

export function buildAdminHtml(p: EmailPayload): string {
  const c = p.config

  // Produkt-spezifische Zeilen
  const PFEILER_LABEL: Record<string, string> = {
    glatt:       'Standard-Glatt',
    struktur:    'Struktur-Pfeiler (passend zum Modell)',
    schmuckhaube:'Pfeiler mit Schmuckhaube',
    naturstein:  'Naturstein-Pfeiler',
    rustiko:     'Rustiko-Pfeiler',
  }

  function farbeText(key: string, individuell: string): string {
    if (!key) return 'Betongrau (natur)'
    const label = getFarbLabel(key)
    return key === 'individuell' && individuell ? `${label}: ${individuell}` : label
  }

  let produktRows = ''
  if (p.produkt === 'betonzaun') {
    const bz = c.betonzaun
    const montageLabel = bz.montage === 'mit' ? 'Ja – Montage durch Fachteam' : 'Nein – Selbstmontage / Lieferung'
    const farbe_p = farbeText(bz.farbePlatten || 'betongrau', bz.farbeIndividuell || '')
    const farbe_pf = bz.farbePfeiler === 'gleich' || !bz.farbePfeiler
      ? `Gleich wie Platten (${farbe_p})`
      : farbeText(bz.farbePfeiler, bz.farbeIndividuell || '')

    produktRows =
      row('Sichtseite',        bz.struktur === 'einseitig' ? 'Einseitig' : bz.struktur === 'beidseitig' ? 'Beidseitig' : '') +
      row('Höhe',              bz.hoehe) +
      row('Pfeiler-Typ',       bz.pfeiler ? (PFEILER_LABEL[bz.pfeiler] ?? bz.pfeiler) : '') +
      row('Montage',           montageLabel) +
      row('Farbe Platten',     farbe_p) +
      row('Farbe Pfeiler/Kappen', farbe_pf) +
      (bz.farbeIndividuell ? row('Farbwunsch (Freitext)', bz.farbeIndividuell) : '') +
      row('Untergrund',        bz.untergrund)
  } else if (p.produkt === 'doppelstabmatte') {
    produktRows =
      row('Höhe',    c.doppelstab.hoehe ? `${c.doppelstab.hoehe} cm` : '') +
      row('Länge',   c.doppelstab.laenge ? `${c.doppelstab.laenge} m` : '') +
      row('Farbe',   c.doppelstab.farbe) +
      row('Montage', c.doppelstab.montage === 'mit' ? 'Inkl. Montage' : 'Nur Lieferung')
  } else if (p.produkt === 'schmiedekunst') {
    produktRows =
      row('Höhe ca.',        c.schmiedekunst.hoehe ? `${c.schmiedekunst.hoehe} cm` : '') +
      row('Länge ca.',       c.schmiedekunst.laenge ? `${c.schmiedekunst.laenge} m` : '') +
      row('Design-Wunsch',   c.schmiedekunst.designWunsch) +
      row('Montage',         c.schmiedekunst.montage === 'mit' ? 'Inkl. Montage' : 'Nur Lieferung')
  }

  const produktLabel: Record<string, string> = {
    betonzaun: 'Betonzaun', doppelstabmatte: 'Doppelstabmatte', schmiedekunst: 'Schmiedekunst / Metallzaun',
  }

  // Tor & Tür
  let torRows = ''
  if (c.tor.gewuenscht) {
    const torTyp: Record<string, string> = { schiebetor: 'Schiebetor', flugeltor: 'Flügeltor', einfahrtstor: 'Einfahrtstor' }
    torRows +=
      row('Tor-Typ',  c.tor.typ ? torTyp[c.tor.typ] ?? c.tor.typ : '') +
      row('Maße Tor', c.tor.breite && c.tor.hoehe ? `${c.tor.breite} × ${c.tor.hoehe} cm` : '') +
      row('Antrieb',  c.tor.antrieb ? 'Mit elektrischem Antrieb' : 'Ohne Antrieb')
  } else {
    torRows += row('Hoftor', 'Nicht gewünscht')
  }
  if (c.tuer.gewuenscht) {
    torRows += row('Gartentür', c.tuer.breite && c.tuer.hoehe ? `${c.tuer.breite} × ${c.tuer.hoehe} cm` : 'Ja')
  } else {
    torRows += row('Gartentür', 'Nicht gewünscht')
  }

  // Dateien
  const dateiRows = c.dateien.length > 0
    ? c.dateien.map((f) => row('Datei', `${f.name} (${(f.size / 1024).toFixed(0)} KB)`)).join('')
    : row('Dateien', 'Keine hochgeladen')

  // ── Betonzaun: Stapelreihenfolge + Stückliste ──────────────────────────────
  let stapelSection = ''
  let stueckSection = ''
  if (p.produkt === 'betonzaun' && c.betonzaun.platten?.length > 0) {
    const bz = c.betonzaun
    const laengeM  = parseFloat(bz.laenge) || 0
    const felder   = laengeM > 0 ? Math.ceil(laengeM / 2) : 0
    const pfosten  = felder  > 0 ? felder + 1 + bz.ecken  : 0
    const total    = bz.platten.length
    const vonOben  = [...bz.platten].reverse()

    stapelSection = section('Stapelreihenfolge (oben → unten)',
      vonOben.map((slot, ri) => {
        const idx   = total - 1 - ri
        const label = idx === 0 ? 'Unten' : idx === total - 1 ? 'Oben' : `Reihe ${idx + 1}`
        const wert  = slot.modellNr
          ? `${slot.modellName} (Nr. ${slot.modellNr})${felder > 0 ? ` · ${felder}× je Feld` : ''}`
          : '– kein Modell gewählt –'
        return row(`${label} · ${slot.hoehe} cm`, wert)
      }).join('')
    )

    stueckSection = section('Stückliste',
      row('Gesamtlänge',    bz.laenge ? `${bz.laenge} m` : '') +
      row('Felder (à 2 m)', felder  > 0 ? `${felder} Stück` : '') +
      row('Pfosten gesamt', pfosten > 0 ? `${pfosten} Stück (inkl. ${bz.ecken} Eckpfosten)` : '') +
      row('Pfeiler-Typ',    bz.pfeiler ? (PFEILER_LABEL[bz.pfeiler] ?? bz.pfeiler) : '') +
      vonOben.map((slot) =>
        row(
          `Platten ${slot.modellName || '–'} (${slot.hoehe} cm)`,
          felder > 0 ? `${felder} Stück` : '–'
        )
      ).join('') +
      row('PLATTEN GESAMT', felder > 0 ? `${felder * total} Stück` : '–')
    )
  }

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2d2d2d;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1e1a0a,#2d250d);padding:28px 32px;border-bottom:1px solid #3d3210;">
          <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a84c;">
            TR Edelzaun &amp; Tor GmbH
          </p>
          <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#e8e8e8;">
            Neue Anfrage eingegangen
          </h1>
          <p style="margin:4px 0 0;font-size:13px;color:#7a6a3a;">
            ${produktLabel[p.produkt] ?? p.produkt} &nbsp;·&nbsp;
            ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr
          </p>
        </td>
      </tr>

      <!-- Body -->
      <tr><td style="padding:28px 32px;">

        ${section('Kontaktdaten',
          row('Name',    [p.vorname, p.nachname].filter(Boolean).join(' ')) +
          row('E-Mail',  p.email) +
          row('Telefon', p.telefon || 'Nicht angegeben') +
          row('PLZ/Ort', [p.plz, p.ort].filter(Boolean).join(' ') || 'Nicht angegeben')
        )}

        ${section(`Produkt: ${produktLabel[p.produkt] ?? p.produkt}`, produktRows)}

        ${stapelSection}

        ${stueckSection}

        ${section('Tore &amp; Türen', torRows)}

        ${section('Hochgeladene Dateien', dateiRows)}

        ${p.nachricht ? section('Nachricht des Kunden',
          `<tr><td colspan="2" style="padding:6px 0;color:#c8c8c8;font-size:13px;white-space:pre-wrap;">${p.nachricht}</td></tr>`
        ) : ''}

      </td></tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #2d2d2d;background:#141414;">
          <p style="margin:0;font-size:11px;color:#4a4a4a;">
            Diese E-Mail wurde automatisch durch den Online-Konfigurator generiert.<br>
            TR Edelzaun &amp; Tor GmbH · Kastanienplatz 2 · 06369 Großwülknitz · 03496-7005181
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Bestätigungs-E-Mail an den Kunden ────────────────────────────────────────

export function buildCustomerHtml(p: EmailPayload): string {
  const produktLabel: Record<string, string> = {
    betonzaun: 'Betonzaun', doppelstabmatte: 'Doppelstabmattenzaun', schmiedekunst: 'Schmiedekunst / Metallzaun',
  }

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2d2d2d;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1e1a0a,#2d250d);padding:28px 32px;border-bottom:1px solid #3d3210;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a84c;">
            TR Edelzaun &amp; Tor GmbH
          </p>
          <div style="margin:12px 0 8px;font-size:36px;">✓</div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#e8e8e8;">
            Ihre Anfrage ist eingegangen!
          </h1>
        </td>
      </tr>

      <!-- Body -->
      <tr><td style="padding:32px 32px 24px;">

        <p style="margin:0 0 20px;font-size:15px;color:#c0c0c0;line-height:1.7;">
          Hallo ${p.vorname || 'liebe/r Kunde/in'},<br><br>
          vielen Dank für Ihre Anfrage. Wir haben Ihre Konfiguration erhalten und
          werden uns <strong style="color:#e8e8e8;">innerhalb von 1–2 Werktagen</strong>
          mit einem persönlichen Angebot bei Ihnen melden.
        </p>

        <!-- Zusammenfassung -->
        <div style="background:#242424;border-radius:12px;padding:20px 24px;margin-bottom:24px;border:1px solid #333;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c9a84c;">
            Ihre Anfrage im Überblick
          </p>
          <table style="border-collapse:collapse;width:100%;">
            <tbody>
              ${row('Produkt',  produktLabel[p.produkt] ?? p.produkt)}
              ${p.produkt === 'betonzaun' ? (
                row('Modell', p.config.betonzaun.muster
                  ? `${p.config.betonzaun.muster}${p.config.betonzaun.modellNr ? ` (Nr. ${p.config.betonzaun.modellNr})` : ''}`
                  : '') +
                row('Höhe',   p.config.betonzaun.hoehe) +
                row('Länge',  p.config.betonzaun.laenge ? `${p.config.betonzaun.laenge} m` : '')
              ) : p.produkt === 'doppelstabmatte' ? (
                row('Höhe',  p.config.doppelstab.hoehe ? `${p.config.doppelstab.hoehe} cm` : '') +
                row('Länge', p.config.doppelstab.laenge ? `${p.config.doppelstab.laenge} m` : '')
              ) : (
                row('Länge', p.config.schmiedekunst.laenge ? `${p.config.schmiedekunst.laenge} m` : '')
              )}
              ${p.config.tor.gewuenscht ? row('Hoftor', 'Ja – wird berücksichtigt') : ''}
              ${p.config.tuer.gewuenscht ? row('Gartentür', 'Ja – wird berücksichtigt') : ''}
            </tbody>
          </table>
        </div>

        <!-- Nächste Schritte -->
        <div style="background:#1e1a0a;border-radius:12px;padding:20px 24px;border:1px solid #3d3210;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#e0c068;">Was passiert als nächstes?</p>
          ${[
            ['1', 'Wir prüfen Ihre Anfrage und kalkulieren das individuelle Angebot.'],
            ['2', 'Sie erhalten das Angebot per E-Mail (1–2 Werktage).'],
            ['3', 'Auf Wunsch vereinbaren wir einen Vor-Ort-Termin zur Aufmaßnahme.'],
          ].map(([n, t]) => `
          <div style="display:flex;gap:12px;margin-bottom:8px;">
            <span style="width:22px;height:22px;border-radius:50%;background:rgba(201,168,76,0.15);
                         border:1px solid rgba(201,168,76,0.3);flex-shrink:0;text-align:center;
                         line-height:22px;font-size:11px;font-weight:700;color:#c9a84c;">${n}</span>
            <span style="font-size:13px;color:#7a6a3a;line-height:1.5;">${t}</span>
          </div>`).join('')}
        </div>

      </td></tr>

      <!-- Kontakt -->
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #2d2d2d;">
          <p style="margin:0 0 8px;font-size:12px;color:#5a5a5a;">Fragen? Wir sind für Sie erreichbar:</p>
          <p style="margin:0;font-size:14px;color:#c9a84c;font-weight:600;">
            📞 03496-7005181 &nbsp;&nbsp; ✉ info@edelzaun-tor.de
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:16px 32px;border-top:1px solid #2a2a2a;background:#141414;">
          <p style="margin:0;font-size:11px;color:#3a3a3a;text-align:center;">
            TR Edelzaun &amp; Tor GmbH · Kastanienplatz 2 · 06369 Großwülknitz<br>
            <a href="https://www.edelzaun-tor.com" style="color:#4a4a4a;">edelzaun-tor.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Plain-Text-Fallback ────────────────────────────────────────────────────────

export function buildAdminText(p: EmailPayload): string {
  const c = p.config
  const lines = [
    `NEUE ZAUN-ANFRAGE – ${new Date().toLocaleDateString('de-DE')}`,
    '═'.repeat(50),
    '',
    'KONTAKT',
    `Name:     ${[p.vorname, p.nachname].filter(Boolean).join(' ')}`,
    `E-Mail:   ${p.email}`,
    `Telefon:  ${p.telefon || '–'}`,
    `PLZ/Ort:  ${[p.plz, p.ort].filter(Boolean).join(' ') || '–'}`,
    '',
  ]

  if (p.produkt === 'betonzaun') {
    const bz = c.betonzaun
    const PFEILER_LABEL_TXT: Record<string, string> = {
      glatt: 'Standard-Glatt', struktur: 'Struktur-Pfeiler', schmuckhaube: 'Pfeiler mit Schmuckhaube',
      naturstein: 'Naturstein-Pfeiler', rustiko: 'Rustiko-Pfeiler',
    }
    const FARBE_LABEL_TXT: Record<string, string> = {
      betongrau: 'Betongrau (natur)', weiss: 'Weiß (RAL 9010)', anthrazit: 'Anthrazit (RAL 7016)',
      cap_perlweiss: 'Perlweiß', cap_cremweiss: 'Cremeweiß', cap_sandbeige: 'Sandbeige',
      cap_sandstein: 'Sandstein', cap_terrakotta: 'Terrakotta', cap_hellgrau: 'Hellgrau',
      cap_warmgrau: 'Warmgrau', cap_basaltgrau: 'Basaltgrau', cap_graugruen: 'Graugrün',
      cap_moosgruen: 'Moosgrün', individuell: 'Individueller Farbwunsch', gleich: 'Gleich wie Platten',
    }
    const farbeTxt = (key: string) => (FARBE_LABEL_TXT[key] ?? key) || 'Betongrau (natur)'
    const farbe_p_txt  = farbeTxt(bz.farbePlatten || 'betongrau')
    const farbe_pf_txt = (bz.farbePfeiler === 'gleich' || !bz.farbePfeiler)
      ? `Gleich wie Platten (${farbe_p_txt})`
      : farbeTxt(bz.farbePfeiler)
    lines.push('BETONZAUN', '─'.repeat(30),
      `Sichtseite:          ${bz.struktur}`, `Höhe:                ${bz.hoehe}`,
      `Länge:               ${bz.laenge} m`, `Ecken:               ${bz.ecken}`,
      `Pfeiler-Typ:         ${bz.pfeiler ? (PFEILER_LABEL_TXT[bz.pfeiler] ?? bz.pfeiler) : '–'}`,
      `Montage:             ${bz.montage === 'mit' ? 'Ja – Montage durch Fachteam' : 'Nein – Selbstmontage'}`,
      `Farbe Platten:       ${farbe_p_txt}`,
      `Farbe Pfeiler/Kappen: ${farbe_pf_txt}`,
      ...(bz.farbeIndividuell ? [`Farbwunsch (Freitext): ${bz.farbeIndividuell}`] : []),
      `Untergrund:          ${bz.untergrund}`,
      '')
    if (bz.platten?.length > 0) {
      const laengeM = parseFloat(bz.laenge) || 0
      const felder  = laengeM > 0 ? Math.ceil(laengeM / 2) : 0
      const pfosten = felder  > 0 ? felder + 1 + bz.ecken  : 0
      lines.push('STAPELREIHENFOLGE (oben → unten)', '─'.repeat(30))
      const total = bz.platten.length
      ;[...bz.platten].reverse().forEach((slot, ri) => {
        const idx   = total - 1 - ri
        const label = idx === 0 ? 'Unten' : idx === total - 1 ? 'Oben' : `Reihe ${idx + 1}`
        lines.push(`  ${label} (${slot.hoehe} cm): ${slot.modellNr ? `${slot.modellName} · Nr. ${slot.modellNr}` : '–'}`)
      })
      lines.push('')
      lines.push('STÜCKLISTE', '─'.repeat(30),
        `Felder (à 2 m): ${felder}`,
        `Pfosten:        ${pfosten} (inkl. ${bz.ecken} Eckpfosten)`,
        `Pfeiler-Typ:    ${bz.pfeiler ? (PFEILER_LABEL_TXT[bz.pfeiler] ?? bz.pfeiler) : '–'}`,
        ...([...bz.platten].reverse().map((slot) =>
          `Platten ${slot.modellName || '–'} (${slot.hoehe} cm): ${felder} Stück`
        )),
        `GESAMT Platten: ${felder * total}`,
        '')
    }
  } else if (p.produkt === 'doppelstabmatte') {
    lines.push('DOPPELSTABMATTE', '─'.repeat(30),
      `Höhe:    ${c.doppelstab.hoehe} cm`, `Länge:   ${c.doppelstab.laenge} m`,
      `Farbe:   ${c.doppelstab.farbe}`, `Montage: ${c.doppelstab.montage}`, '')
  } else {
    lines.push('SCHMIEDEKUNST / METALLZAUN', '─'.repeat(30),
      `Höhe ca.:       ${c.schmiedekunst.hoehe} cm`,
      `Länge ca.:      ${c.schmiedekunst.laenge} m`,
      `Design-Wunsch:  ${c.schmiedekunst.designWunsch}`,
      `Montage:        ${c.schmiedekunst.montage}`, '')
  }

  lines.push('TOR & TÜR', '─'.repeat(30),
    `Hoftor:     ${c.tor.gewuenscht ? `Ja – ${c.tor.typ}, ${c.tor.breite}×${c.tor.hoehe} cm, ${c.tor.antrieb ? 'mit' : 'ohne'} Antrieb` : 'Nein'}`,
    `Gartentür:  ${c.tuer.gewuenscht ? `Ja – ${c.tuer.breite}×${c.tuer.hoehe} cm` : 'Nein'}`, '')

  if (c.dateien.length > 0) {
    lines.push('DATEIEN', '─'.repeat(30),
      ...c.dateien.map((f) => `  ${f.name} (${(f.size / 1024).toFixed(0)} KB)`), '')
  }

  if (p.nachricht) {
    lines.push('NACHRICHT', '─'.repeat(30), p.nachricht, '')
  }

  return lines.join('\n')
}
