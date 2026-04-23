import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'AGB – TR Edelzaun & Tor GmbH',
}

export default function AgbPage() {
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
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#c9a84c', letterSpacing: '0.2em' }}>
            Rechtliches
          </p>
          <h1 className="text-3xl font-bold" style={{ color: '#e8e8e8' }}>
            Allgemeine Geschäftsbedingungen
          </h1>
          <p className="text-xs mt-2" style={{ color: '#4a4a4a' }}>Stand: 30.03.2026</p>
        </div>

        <div className="rounded-xl p-8 space-y-8"
          style={{ background: '#242424', border: '1px solid #333333' }}
        >
          <Para num="§ 1" title="Geltungsbereich">
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge, Lieferungen und Leistungen
            der TR Edelzaun &amp; Tor GmbH mit ihren Kunden. Abweichende Bedingungen des Kunden werden nicht
            Bestandteil des Vertrags, außer der Auftragnehmer stimmt diesen ausdrücklich schriftlich zu.
          </Para>

          <Divider />

          <Para num="§ 2" title="Vertragsabschluss und Ausschluss des Widerrufsrechts">
            Angebote sind freibleibend. Ein Vertrag entsteht erst durch schriftliche Auftragsbestätigung
            oder durch Beginn der Leistungsausführung. Das Widerrufsrecht entfällt, da Betonzäune und
            Toranlagen nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder
            Bestimmung durch den Verbraucher maßgeblich ist (§ 312g Abs. 2 Nr. 1 BGB).
          </Para>

          <Divider />

          <Para num="§ 3" title="Beratungs- und Vor-Ort-Termine">
            Für Vor-Ort-Termine zur Beratung, Aufmaßnahme oder Angebotserstellung berechnen wir eine
            pauschale Aufwandsentschädigung in Höhe von 150,00 € (inkl. gesetzl. MwSt.). Bei
            anschließender Auftragserteilung wird diese Pauschale vollständig auf den Auftragswert
            angerechnet. Dem Kunden bleibt der Nachweis vorbehalten, dass ein geringerer Schaden
            entstanden ist.
          </Para>

          <Divider />

          <Para num="§ 4" title="Preise, Abschlagszahlungen und Zahlung">
            Alle Preise verstehen sich in Euro inklusive der jeweils gültigen gesetzlichen Mehrwertsteuer.
            Abschlagszahlungen für Material und Teilleistungen sind zulässig. Zahlungen sind innerhalb von
            10 Tagen nach Rechnungsstellung ohne Abzug fällig. Bei Zahlungsverzug werden Verzugszinsen in
            gesetzlicher Höhe berechnet.
          </Para>

          <Divider />

          <Para num="§ 5" title="Baufreiheit und Mitwirkungspflichten des Kunden">
            Der Auftraggeber hat dafür Sorge zu tragen, dass der Montageort zum vereinbarten Termin frei
            zugänglich, geräumt und baufertig ist. Er ist verpflichtet, den Auftragnehmer vor Beginn der
            Arbeiten unaufgefordert über den Verlauf von unterirdischen Leitungen (Strom, Wasser, Gas,
            Telekommunikation etc.) zu informieren. Für Schäden an unbekannten Leitungen haftet der
            Auftragnehmer nur bei Vorsatz oder grober Fahrlässigkeit.
          </Para>

          <Divider />

          <Para num="§ 6" title="Eigentumsvorbehalt">
            Die gelieferte Ware bleibt bis zur vollständigen Bezahlung sämtlicher Forderungen aus dem
            Vertragsverhältnis Eigentum der TR Edelzaun &amp; Tor GmbH. Der Auftraggeber ist nicht
            berechtigt, die Vorbehaltsware zu verpfänden oder zur Sicherheit zu übereignen.
          </Para>

          <Divider />

          <Para num="§ 7" title="Lagerung und Annahmeverzug">
            Gerät der Auftraggeber in Annahmeverzug, ist der Auftragnehmer berechtigt, das Material auf
            Kosten und Gefahr des Auftraggebers einzulagern. Es wird eine Pauschale in Höhe von 0,5 % des
            Netto-Auftragswertes pro angefangene Woche berechnet, insgesamt jedoch höchstens 5 % des
            Auftragswertes. Dem Auftraggeber bleibt der Nachweis eines geringeren Schadens vorbehalten.
          </Para>

          <Divider />

          <Para num="§ 8" title="Abnahme">
            Der Auftraggeber ist verpflichtet, die Leistung nach Fertigstellung abzunehmen. Die Abnahme
            gilt als erfolgt, wenn der Auftraggeber die Leistung nicht innerhalb von 12 Werktagen nach
            schriftlicher Fertigstellungsanzeige unter Angabe mindestens eines Mangels schriftlich
            zurückweist. Unwesentliche Mängel berechtigen nicht zur Verweigerung der Abnahme.
          </Para>

          <Divider />

          <Para num="§ 9" title="Gewährleistung und Materialbeschaffenheit">
            Es gelten die gesetzlichen Gewährleistungsrechte. Beton ist ein Naturprodukt. Geringfügige
            farbliche Abweichungen, Haarrisse oder Ausblühungen (weiße Flecken) sind technisch nicht
            immer vermeidbar und stellen keinen Mangel dar. Die Gewährleistungsfrist beträgt für
            unternehmerische Kunden (B2B) 12 Monate, für Verbraucher 5 Jahre ab Abnahme der Leistung.
          </Para>

          <Divider />

          <Para num="§ 10" title="Haftung">
            Der Auftragnehmer haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden
            aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Bei leichter Fahrlässigkeit
            haftet der Auftragnehmer nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten)
            und nur in Höhe des vorhersehbaren, vertragstypischen Schadens. Eine weitergehende Haftung
            ist ausgeschlossen.
          </Para>

          <Divider />

          <Para num="§ 11" title="Verbraucherstreitbeilegung">
            Die TR Edelzaun &amp; Tor GmbH ist nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
            vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </Para>

          <Divider />

          <Para num="§ 12" title="Schlussbestimmungen">
            Es gilt das Recht der Bundesrepublik Deutschland. Erfüllungsort und Gerichtsstand für alle
            Streitigkeiten aus dem Vertragsverhältnis ist, soweit gesetzlich zulässig, der Sitz der
            TR Edelzaun &amp; Tor GmbH. Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder
            werden, berührt dies die Wirksamkeit der übrigen Bestimmungen nicht.
          </Para>
        </div>
      </div>
    </div>
  )
}

function Para({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xs font-bold flex-shrink-0" style={{ color: '#c9a84c' }}>{num}</span>
        <h2 className="text-sm font-semibold" style={{ color: '#d4d4d4' }}>{title}</h2>
      </div>
      <p className="text-sm leading-relaxed pl-8" style={{ color: '#8a8a8a' }}>{children}</p>
    </div>
  )
}

function Divider() {
  return <div className="w-full h-px" style={{ background: '#2d2d2d' }} />
}
