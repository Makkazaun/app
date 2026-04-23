import type { FormData } from './types'
import { PFEILER_OPTIONEN, berechneStueckliste, getFarbLabel } from './betonzaun-modelle'

interface Props {
  data: FormData
  goToStep: (n: number) => void
}

export default function Step6Summary({ data, goToStep }: Props) {
  const { produkt, betonzaun: bz, doppelstab: ds, schmiedekunst: sk, tor, tuer, dateien, kontakt: k } = data

  const produktLabel = {
    betonzaun: 'Betonzaun',
    doppelstabmatte: 'Doppelstabmattenzaun',
    schmiedekunst: 'Schmiedekunst & Metallzaun',
    '': '-',
  }[produkt]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#800020', letterSpacing: '0.2em' }}>
          Schritt 6 · Fast fertig!
        </p>
        <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Zusammenfassung</h2>
        <p className="text-sm mt-1" style={{ color: '#C08898' }}>
          Bitte prüfen Sie Ihre Angaben – nach dem Absenden melden wir uns bei Ihnen.
        </p>
      </div>

      {/* Block 1: Produkt & Konfiguration */}
      <SummaryBlock title="Produkt & Konfiguration" onEdit={() => goToStep(1)}>
        <Row label="Produkt" value={produktLabel} highlight />

        {produkt === 'betonzaun' && (() => {
          const sl = berechneStueckliste(bz.laenge, bz.hoehe, bz.ecken)
          const vonOben = bz.platten.length > 0 ? [...bz.platten].reverse() : []
          const total   = bz.platten.length
          return <>
            <Row label="Höhe"      value={bz.hoehe || '–'} />
            <Row label="Länge"     value={bz.laenge ? `${bz.laenge} m` : '–'} />
            <Row label="Sichtseite" value={bz.struktur === 'einseitig' ? 'Einseitig' : bz.struktur === 'beidseitig' ? 'Beidseitig' : '–'} />

            {/* Stapelreihenfolge */}
            {vonOben.length > 0 && vonOben.map((slot, ri) => {
              const idx   = total - 1 - ri
              const label = idx === 0 ? 'Unten' : idx === total - 1 ? 'Oben' : `Reihe ${idx + 1}`
              return <Row key={slot.id}
                label={`${label} · ${slot.hoehe} cm`}
                value={slot.modellNr ? `${slot.modellName} (Nr. ${slot.modellNr})` : '–'}
                highlight={idx === total - 1} />
            })}

            {/* Stückliste */}
            {sl && <>
              <Row label="Felder"         value={`${sl.felder} Stück`} />
              <Row label="Pfosten"        value={`${sl.pfosten} Stück`} />
              <Row label="Platten gesamt" value={`${sl.plattenGesamt} Stück`} highlight />
            </>}

            <Row label="Pfeiler" value={{
              glatt:        'Standard-Glatt',
              struktur:     'Struktur-Pfeiler',
              schmuckhaube: 'Pfeiler mit Schmuckhaube',
              naturstein:   'Naturstein-Pfeiler',
              rustiko:      'Rustiko-Pfeiler',
            }[bz.pfeiler] ?? (bz.pfeiler || '–')} />
            <Row label="Montage"    value={bz.montage === 'mit' ? 'Ja – Montage durch Fachteam' : bz.montage === 'ohne' ? 'Nein – Selbstmontage' : '–'} />
            <Row label="Farbe Platten" value={getFarbLabel(bz.farbePlatten || 'betongrau')} />
            <Row label="Farbe Pfeiler"
              value={(!bz.farbePfeiler || bz.farbePfeiler === 'gleich')
                ? `Gleich wie Platten`
                : getFarbLabel(bz.farbePfeiler)} />
            {bz.farbeIndividuell && <Row label="Farbwunsch" value={bz.farbeIndividuell} multiline />}
            <Row label="Untergrund" value={bz.untergrund || '–'} />
          </>
        })()}

        {produkt === 'doppelstabmatte' && <>
          <Row label="Höhe" value={ds.hoehe ? `${ds.hoehe} cm` : '–'} />
          <Row label="Länge" value={ds.laenge ? `${ds.laenge} m` : '–'} />
          <Row label="Farbe" value={ds.farbe || '–'} />
          <Row label="Montage" value={ds.montage === 'mit' ? 'Inkl. Montage' : ds.montage === 'ohne' ? 'Nur Lieferung' : '–'} />
        </>}

        {produkt === 'schmiedekunst' && <>
          <Row label="Höhe (ca.)" value={sk.hoehe ? `${sk.hoehe} cm` : '–'} />
          <Row label="Länge (ca.)" value={sk.laenge ? `${sk.laenge} m` : '–'} />
          <Row label="Design-Wunsch" value={sk.designWunsch || '–'} multiline />
          <Row label="Montage" value={sk.montage === 'mit' ? 'Inkl. Montage' : sk.montage === 'ohne' ? 'Nur Lieferung' : '–'} />
        </>}
      </SummaryBlock>

      {/* Block 2: Tore & Türen */}
      <SummaryBlock title="Tore & Türen" onEdit={() => goToStep(3)}>
        <Row label="Hoftor" value={tor.gewuenscht === null ? '–' : tor.gewuenscht ? 'Ja' : 'Nein'} />
        {tor.gewuenscht && <>
          <Row label="Tor-Typ" value={
            tor.typ === 'schiebetor' ? 'Schiebetor' :
            tor.typ === 'flugeltor' ? 'Flügeltor' :
            tor.typ === 'einfahrtstor' ? 'Einfahrtstor' : '–'
          } />
          <Row label="Maße" value={tor.breite && tor.hoehe ? `${tor.breite} × ${tor.hoehe} cm` : '–'} />
          <Row label="Antrieb" value={tor.antrieb === null ? '–' : tor.antrieb ? 'Mit Antrieb' : 'Ohne Antrieb'} />
        </>}
        <Row label="Gartentür" value={tuer.gewuenscht === null ? '–' : tuer.gewuenscht ? 'Ja' : 'Nein'} />
        {tuer.gewuenscht && (
          <Row label="Maße Tür" value={tuer.breite && tuer.hoehe ? `${tuer.breite} × ${tuer.hoehe} cm` : '–'} />
        )}
      </SummaryBlock>

      {/* Block 3: Dateien */}
      <SummaryBlock title="Fotos & Unterlagen" onEdit={() => goToStep(4)}>
        <Row label="Dateien" value={dateien.length === 0 ? 'Keine Dateien' : `${dateien.length} Datei${dateien.length !== 1 ? 'en' : ''}`} />
        {dateien.map((f, i) => (
          <Row key={i} label="" value={`📎 ${f.name}`} />
        ))}
      </SummaryBlock>

      {/* Block 4: Kontakt */}
      <SummaryBlock title="Kontaktdaten" onEdit={() => goToStep(5)}>
        <Row label="Name" value={`${k.vorname} ${k.nachname}`.trim() || '–'} />
        <Row label="E-Mail" value={k.email || '–'} />
        <Row label="Telefon" value={k.telefon || '–'} />
        <Row label="PLZ / Ort" value={k.plz && k.ort ? `${k.plz} ${k.ort}` : k.plz || k.ort || '–'} />
        {k.nachricht && <Row label="Nachricht" value={k.nachricht} multiline />}
      </SummaryBlock>

      {/* Hinweis */}
      <div className="rounded-xl p-4" style={{ background: '#1A0D04', border: '1px solid #2D4A20' }}>
        <p className="text-xs leading-relaxed" style={{ color: '#86EFAC' }}>
          ✓ Nach dem Absenden prüfen wir Ihre Anfrage und melden uns innerhalb von 1–2 Werktagen
          mit einem individuellen Angebot bei Ihnen. Vor-Ort-Besichtigung auf Wunsch möglich
          (150 € Aufwandsentschädigung, bei Auftragserteilung angerechnet).
        </p>
      </div>
    </div>
  )
}

function SummaryBlock({ title, children, onEdit }: {
  title: string; children: React.ReactNode; onEdit: () => void
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #9A0025' }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: '#4D0013', borderBottom: '1px solid #9A0025' }}
      >
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#C88090', letterSpacing: '0.12em' }}>
          {title}
        </h3>
        <button type="button" onClick={onEdit}
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: '#800020' }}
        >
          ✎ Bearbeiten
        </button>
      </div>
      <div className="px-4 py-3 space-y-2" style={{ background: '#3A000F' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, highlight, multiline }: {
  label: string; value: string; highlight?: boolean; multiline?: boolean
}) {
  if (!value || value === '–' && !label) return null
  return (
    <div className={`flex ${multiline ? 'flex-col gap-1' : 'items-baseline justify-between gap-4'}`}>
      {label && (
        <span className="text-xs flex-shrink-0" style={{ color: '#C08898', minWidth: '100px' }}>{label}</span>
      )}
      <span
        className={`text-sm ${multiline ? '' : 'text-right'} leading-relaxed`}
        style={{ color: highlight ? '#800020' : value === '–' ? '#C08898' : '#c8c8c8', fontWeight: highlight ? 600 : 400 }}
      >
        {value}
      </span>
    </div>
  )
}
