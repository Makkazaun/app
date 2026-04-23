import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Impressum – TR Edelzaun & Tor GmbH',
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: '#1a1a1a' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Logo variant="header" className="mb-6" />
          <Link href="/"
            className="inline-flex items-center gap-2 text-xs mb-8 hover:opacity-80 transition-opacity"
            style={{ color: '#5a5a5a' }}
          >
            ← Zurück zur Startseite
          </Link>
        </div>

        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#800020', letterSpacing: '0.2em' }}>
            Rechtliches
          </p>
          <h1 className="text-3xl font-bold" style={{ color: '#e8e8e8' }}>Impressum</h1>
        </div>

        <div className="rounded-xl p-8 space-y-8"
          style={{ background: '#242424', border: '1px solid #333333' }}
        >
          {/* Unternehmensangaben */}
          <Section title="Unternehmensangaben">
            <InfoRow label="Firma" value="TR Edelzaun & Tor GmbH" />
            <InfoRow label="Adresse" value="Kastanienplatz 2, 06369 Großwülknitz" />
            <InfoRow label="Telefon" value="03496-7005181" />
            <InfoRow label="Telefax" value="0340-85809011" />
            <InfoRow label="E-Mail" value="info@edelzaun-tor.de" />
            <InfoRow label="Geschäftsführer" value="Timo Burkhard Raber, Cornelia Tischler" />
          </Section>

          <Divider />

          {/* Registereintrag */}
          <Section title="Registereintrag">
            <InfoRow label="Handelsregister" value="Stendal" />
            <InfoRow label="Registernummer" value="HRB 21592" />
          </Section>

          <Divider />

          {/* USt-ID */}
          <Section title="Umsatzsteuer-ID">
            <p className="text-sm leading-relaxed" style={{ color: '#9a9a9a' }}>
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: '#d4d4d4' }}>DE298694405</p>
          </Section>

          <Divider />

          {/* Haftungsausschluss */}
          <Section title="§ 1 Haftungsbeschränkung">
            <Prose>
              Die Inhalte dieser Website werden mit größtmöglicher Sorgfalt erstellt. Der Anbieter übernimmt
              jedoch keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten
              Inhalte. Die Nutzung der Inhalte der Website erfolgt auf eigene Gefahr des Nutzers. Namentlich
              gekennzeichnete Beiträge geben die Meinung des jeweiligen Autors und nicht immer die Meinung
              des Anbieters wieder. Mit der reinen Nutzung der Website des Anbieters kommt keinerlei
              Vertragsverhältnis zwischen dem Nutzer und dem Anbieter zustande.
            </Prose>
          </Section>

          <Divider />

          {/* Externe Links */}
          <Section title="§ 2 Externe Links">
            <Prose>
              Diese Website enthält Verknüpfungen zu Websites Dritter ("externe Links"). Diese Websites
              unterliegen der Haftung der jeweiligen Betreiber. Der Anbieter hat bei der erstmaligen
              Verknüpfung der externen Links die fremden Inhalte daraufhin überprüft, ob etwaige
              Rechtsverstöße bestehen. Zu dem Zeitpunkt waren keine Rechtsverstöße ersichtlich. Der Anbieter
              hat keinerlei Einfluss auf die aktuelle und zukünftige Gestaltung und auf die Inhalte der
              verknüpften Seiten. Das Setzen von externen Links bedeutet nicht, dass sich der Anbieter die
              hinter dem Verweis oder Link liegenden Inhalte zu Eigen macht. Eine ständige Kontrolle der
              externen Links ist für den Anbieter ohne konkrete Hinweise auf Rechtsverstöße nicht zumutbar.
              Bei Kenntnis von Rechtsverstößen werden jedoch derartige externe Links unverzüglich gelöscht.
            </Prose>
          </Section>

          <Divider />

          {/* Urheberrecht */}
          <Section title="§ 3 Urheber- und Leistungsschutzrechte">
            <Prose>
              Die auf dieser Website veröffentlichten Inhalte unterliegen dem deutschen Urheber- und
              Leistungsschutzrecht. Jede vom deutschen Urheber- und Leistungsschutzrecht nicht zugelassene
              Verwertung bedarf der vorherigen schriftlichen Zustimmung des Anbieters oder jeweiligen
              Rechteinhabers. Dies gilt insbesondere für Vervielfältigung, Bearbeitung, Übersetzung,
              Einspeicherung, Verarbeitung bzw. Wiedergabe von Inhalten in Datenbanken oder anderen
              elektronischen Medien und Systemen. Inhalte und Rechte Dritter sind dabei als solche
              gekennzeichnet. Die unerlaubte Vervielfältigung oder Weitergabe einzelner Inhalte oder
              kompletter Seiten ist nicht gestattet und strafbar. Lediglich die Herstellung von Kopien und
              Downloads für den persönlichen, privaten und nicht kommerziellen Gebrauch ist erlaubt.
            </Prose>
          </Section>

          <Divider />

          {/* Besondere Nutzungsbedingungen */}
          <Section title="§ 4 Besondere Nutzungsbedingungen">
            <Prose>
              Soweit besondere Bedingungen für einzelne Nutzungen dieser Website von den vorgenannten
              Paragraphen abweichen, wird an entsprechender Stelle ausdrücklich darauf hingewiesen. In
              diesem Falle gelten im jeweiligen Einzelfall die besonderen Nutzungsbedingungen.
            </Prose>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: '#800020', letterSpacing: '0.14em' }}
      >
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-36 flex-shrink-0" style={{ color: '#5a5a5a' }}>{label}</span>
      <span style={{ color: '#c8c8c8' }}>{value}</span>
    </div>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed" style={{ color: '#8a8a8a' }}>{children}</p>
  )
}

function Divider() {
  return <div className="w-full h-px" style={{ background: '#2d2d2d' }} />
}
