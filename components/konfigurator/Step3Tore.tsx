import SelectCard from './SelectCard'
import FieldLabel, { inputStyle } from './FieldLabel'
import type { FormData } from './types'

interface Props { data: FormData; update: (d: Partial<FormData>) => void }

function setTor<K extends keyof FormData['tor']>(
  data: FormData, update: Props['update'], key: K, val: FormData['tor'][K],
) { update({ tor: { ...data.tor, [key]: val } }) }

function setTuer<K extends keyof FormData['tuer']>(
  data: FormData, update: Props['update'], key: K, val: FormData['tuer'][K],
) { update({ tuer: { ...data.tuer, [key]: val } }) }

const TOR_TYPEN = [
  { value: 'schiebetor' as const, label: 'Schiebetor', sublabel: 'Freitragend oder laufgeführt', icon: '↔️' },
  { value: 'flugeltor' as const, label: 'Flügeltor', sublabel: 'Ein- oder zweiflügelig', icon: '🚪' },
  { value: 'einfahrtstor' as const, label: 'Einfahrtstor', sublabel: 'Groß­flächiges Einfahrtstor', icon: '🏠' },
]

export default function Step3Tore({ data, update }: Props) {
  const { tor, tuer } = data

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#800020', letterSpacing: '0.2em' }}>
          Schritt 3
        </p>
        <h2 className="text-2xl font-bold" style={{ color: '#e8e8e8' }}>Tore &amp; Türen</h2>
        <p className="text-sm mt-1" style={{ color: '#5a5a5a' }}>
          Benötigen Sie zusätzlich ein Tor oder eine Gartentür?
        </p>
      </div>

      {/* ── TOR ── */}
      <div className="space-y-5">
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: '#d4d4d4' }}>
          🚗 Einfahrtstor / Hoftor
        </h3>

        <div>
          <FieldLabel>Tor gewünscht?</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <SelectCard label="Ja, bitte" icon="✅"
              selected={tor.gewuenscht === true}
              onClick={() => setTor(data, update, 'gewuenscht', true)} fullWidth />
            <SelectCard label="Nein, nicht nötig" icon="✖️"
              selected={tor.gewuenscht === false}
              onClick={() => setTor(data, update, 'gewuenscht', false)} fullWidth />
          </div>
        </div>

        {tor.gewuenscht === true && (
          <div className="space-y-5 pl-1">
            <div>
              <FieldLabel>Tor-Typ</FieldLabel>
              <div className="space-y-2">
                {TOR_TYPEN.map((t) => (
                  <SelectCard key={t.value} label={t.label} sublabel={t.sublabel} icon={t.icon}
                    selected={tor.typ === t.value}
                    onClick={() => setTor(data, update, 'typ', t.value)} fullWidth />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Breite (cm)</FieldLabel>
                <div className="relative">
                  <input type="number" inputMode="numeric" placeholder="z.B. 300"
                    value={tor.breite}
                    onChange={(e) => setTor(data, update, 'breite', e.target.value)}
                    style={{ ...inputStyle(), paddingRight: '44px' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                    style={{ color: '#5a5a5a' }}>cm</span>
                </div>
              </div>
              <div>
                <FieldLabel>Höhe (cm)</FieldLabel>
                <div className="relative">
                  <input type="number" inputMode="numeric" placeholder="z.B. 150"
                    value={tor.hoehe}
                    onChange={(e) => setTor(data, update, 'hoehe', e.target.value)}
                    style={{ ...inputStyle(), paddingRight: '44px' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                    style={{ color: '#5a5a5a' }}>cm</span>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Elektrischer Antrieb</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                <SelectCard label="Mit Antrieb" sublabel="Automatische Öffnung/Schließung"
                  icon="⚡" selected={tor.antrieb === true}
                  onClick={() => setTor(data, update, 'antrieb', true)} fullWidth />
                <SelectCard label="Ohne Antrieb" sublabel="Manuelles Öffnen"
                  icon="🖐️" selected={tor.antrieb === false}
                  onClick={() => setTor(data, update, 'antrieb', false)} fullWidth />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full h-px" style={{ background: '#2a2a2a' }} />

      {/* ── GARTENTÜR ── */}
      <div className="space-y-5">
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: '#d4d4d4' }}>
          🚶 Gartentür / Pforte
        </h3>

        <div>
          <FieldLabel>Gartentür gewünscht?</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <SelectCard label="Ja, bitte" icon="✅"
              selected={tuer.gewuenscht === true}
              onClick={() => setTuer(data, update, 'gewuenscht', true)} fullWidth />
            <SelectCard label="Nein, nicht nötig" icon="✖️"
              selected={tuer.gewuenscht === false}
              onClick={() => setTuer(data, update, 'gewuenscht', false)} fullWidth />
          </div>
        </div>

        {tuer.gewuenscht === true && (
          <div className="grid grid-cols-2 gap-4 pl-1">
            <div>
              <FieldLabel>Breite (cm)</FieldLabel>
              <div className="relative">
                <input type="number" inputMode="numeric" placeholder="z.B. 100"
                  value={tuer.breite}
                  onChange={(e) => setTuer(data, update, 'breite', e.target.value)}
                  style={{ ...inputStyle(), paddingRight: '44px' }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                  style={{ color: '#5a5a5a' }}>cm</span>
              </div>
            </div>
            <div>
              <FieldLabel>Höhe (cm)</FieldLabel>
              <div className="relative">
                <input type="number" inputMode="numeric" placeholder="z.B. 150"
                  value={tuer.hoehe}
                  onChange={(e) => setTuer(data, update, 'hoehe', e.target.value)}
                  style={{ ...inputStyle(), paddingRight: '44px' }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                  style={{ color: '#5a5a5a' }}>cm</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
