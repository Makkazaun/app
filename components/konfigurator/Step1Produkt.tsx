import SelectCard from './SelectCard'
import type { FormData, Produkt } from './types'

interface Props {
  data: FormData
  update: (d: Partial<FormData>) => void
}

const PRODUKTE: { value: Produkt; label: string; sublabel: string; icon: string; badge?: string }[] = [
  {
    value: 'betonzaun',
    label: 'Betonzaun',
    sublabel: 'Sichtbeton, Naturstein-, Holz- und viele weitere Optiken · 104 Modelle',
    icon: '🧱',
    badge: 'Bestseller',
  },
  {
    value: 'doppelstabmatte',
    label: 'Doppelstabmatte',
    sublabel: 'Stabiler Metallzaun in verschiedenen RAL-Farben und Höhen',
    icon: '⬛',
  },
  {
    value: 'schmiedekunst',
    label: 'Schmiedekunst & Metallzaun',
    sublabel: 'Individuelle Schmiedearbeiten, Flügel- und Schiebetore, Designzäune',
    icon: '⚙️',
  },
]

export default function Step1Produkt({ data, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>
          Schritt 1
        </p>
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#e8e8e8' }}>
          Welches Produkt interessiert Sie?
        </h2>
        <p className="text-sm" style={{ color: '#5a5a5a' }}>
          Wählen Sie Ihr Hauptprodukt – die Details konfigurieren wir im nächsten Schritt.
        </p>
      </div>

      <div className="space-y-3">
        {PRODUKTE.map((p) => (
          <SelectCard
            key={p.value}
            label={p.label}
            sublabel={p.sublabel}
            icon={p.icon}
            badge={p.badge}
            selected={data.produkt === p.value}
            onClick={() => update({ produkt: p.value })}
            fullWidth
          />
        ))}
      </div>
    </div>
  )
}
