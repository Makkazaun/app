import SelectCard from './SelectCard'
import FieldLabel, { inputStyle } from './FieldLabel'
import type { FormData } from './types'

const FARBEN = [
  { value: 'RAL 7016 Anthrazit', label: 'RAL 7016 Anthrazit' },
  { value: 'RAL 6005 Moosgrün', label: 'RAL 6005 Moosgrün' },
  { value: 'RAL 8017 Schokoladenbraun', label: 'RAL 8017 Braun' },
  { value: 'RAL 9005 Tiefschwarz', label: 'RAL 9005 Schwarz' },
  { value: 'RAL 9006 Weißaluminium', label: 'RAL 9006 Silber' },
  { value: 'Auf Anfrage', label: 'Andere RAL-Farbe' },
]

interface Props { data: FormData; update: (d: Partial<FormData>) => void }

function set<K extends keyof FormData['doppelstab']>(
  data: FormData, update: Props['update'], key: K, val: FormData['doppelstab'][K],
) { update({ doppelstab: { ...data.doppelstab, [key]: val } }) }

export default function Step2Doppelstab({ data, update }: Props) {
  const ds = data.doppelstab
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#800020', letterSpacing: '0.2em' }}>
          Schritt 2 · Doppelstabmatte
        </p>
        <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>Konfiguration</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Höhe (cm)</FieldLabel>
          <div className="relative">
            <input type="number" inputMode="numeric" min="60" max="250"
              placeholder="z.B. 143"
              value={ds.hoehe}
              onChange={(e) => set(data, update, 'hoehe', e.target.value)}
              style={{ ...inputStyle(), paddingRight: '44px' }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
              style={{ color: '#9CA3AF' }}>cm</span>
          </div>
        </div>
        <div>
          <FieldLabel required>Länge (m)</FieldLabel>
          <div className="relative">
            <input type="number" inputMode="decimal" min="1"
              placeholder="z.B. 30"
              value={ds.laenge}
              onChange={(e) => set(data, update, 'laenge', e.target.value)}
              style={{ ...inputStyle(), paddingRight: '36px' }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
              style={{ color: '#9CA3AF' }}>m</span>
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>RAL-Farbe</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FARBEN.map((f) => (
            <SelectCard key={f.value} label={f.label}
              selected={ds.farbe === f.value}
              onClick={() => set(data, update, 'farbe', f.value)} fullWidth />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel required>Montage</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <SelectCard label="Inkl. Montage" sublabel="Aufbau durch Fachteam"
            icon="🔧" selected={ds.montage === 'mit'}
            onClick={() => set(data, update, 'montage', 'mit')} fullWidth />
          <SelectCard label="Nur Lieferung" sublabel="Eigenaufbau"
            icon="📦" selected={ds.montage === 'ohne'}
            onClick={() => set(data, update, 'montage', 'ohne')} fullWidth />
        </div>
      </div>
    </div>
  )
}
