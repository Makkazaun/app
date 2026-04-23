import SelectCard from './SelectCard'
import FieldLabel, { inputStyle } from './FieldLabel'
import type { FormData } from './types'

interface Props { data: FormData; update: (d: Partial<FormData>) => void }

function set<K extends keyof FormData['schmiedekunst']>(
  data: FormData, update: Props['update'], key: K, val: FormData['schmiedekunst'][K],
) { update({ schmiedekunst: { ...data.schmiedekunst, [key]: val } }) }

export default function Step2Schmiedekunst({ data, update }: Props) {
  const sk = data.schmiedekunst
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#800020', letterSpacing: '0.2em' }}>
          Schritt 2 · Schmiedekunst & Metallzaun
        </p>
        <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Konfiguration</h2>
        <p className="text-sm mt-1" style={{ color: '#C08898' }}>
          Individuelle Schmiedearbeiten werden auf Basis Ihrer Angaben persönlich kalkuliert.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Höhe (ca. cm)</FieldLabel>
          <div className="relative">
            <input type="number" inputMode="numeric" placeholder="z.B. 150"
              value={sk.hoehe}
              onChange={(e) => set(data, update, 'hoehe', e.target.value)}
              style={{ ...inputStyle(), paddingRight: '44px' }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
              style={{ color: '#C08898' }}>cm</span>
          </div>
        </div>
        <div>
          <FieldLabel>Länge (ca. m)</FieldLabel>
          <div className="relative">
            <input type="number" inputMode="decimal" placeholder="z.B. 20"
              value={sk.laenge}
              onChange={(e) => set(data, update, 'laenge', e.target.value)}
              style={{ ...inputStyle(), paddingRight: '36px' }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
              style={{ color: '#C08898' }}>m</span>
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>Design-Wünsche & Beschreibung</FieldLabel>
        <textarea
          rows={5}
          placeholder="Beschreiben Sie Ihren Wunschzaun – z.B. Stil, Motive, Referenzbilder (können Sie im nächsten Schritt hochladen), besondere Anforderungen …"
          value={sk.designWunsch}
          onChange={(e) => set(data, update, 'designWunsch', e.target.value)}
          style={{
            ...inputStyle(),
            resize: 'vertical',
            minHeight: '120px',
            fontFamily: 'inherit',
            lineHeight: '1.6',
          }}
        />
      </div>

      <div>
        <FieldLabel required>Montage</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <SelectCard label="Inkl. Montage" sublabel="Aufbau durch Fachteam"
            icon="🔧" selected={sk.montage === 'mit'}
            onClick={() => set(data, update, 'montage', 'mit')} fullWidth />
          <SelectCard label="Nur Lieferung" sublabel="Eigenaufbau"
            icon="📦" selected={sk.montage === 'ohne'}
            onClick={() => set(data, update, 'montage', 'ohne')} fullWidth />
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: '#1C1200', border: '1px solid #92400E' }}>
        <p className="text-xs" style={{ color: '#FCD34D' }}>
          💡 Im nächsten Schritt können Sie Referenzfotos, Skizzen oder Pläne hochladen –
          das hilft uns, Ihren Wunsch optimal umzusetzen und ein genaues Angebot zu erstellen.
        </p>
      </div>
    </div>
  )
}
