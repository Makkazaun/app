import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Datenschutzerklärung – TR Edelzaun & Tor GmbH',
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: '#F9FAFB' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Logo variant="header" className="mb-6" />
          <Link href="/"
            className="inline-flex items-center gap-2 text-xs mb-8 hover:opacity-80 transition-opacity"
            style={{ color: '#9CA3AF' }}
          >
            ← Zurück zur Startseite
          </Link>
        </div>

        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#800020', letterSpacing: '0.2em' }}>
            Rechtliches
          </p>
          <h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>Datenschutzerklärung</h1>
        </div>

        <div className="rounded-xl p-8 space-y-8"
          style={{ background: '#FFFFFF', border: '1px solid #333333' }}
        >
          <Section title="Personenbezogene Daten">
            <Prose>
              Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können.
              Die TR Edelzaun &amp; Tor GmbH erhebt personenbezogene Daten nur in dem Umfang, wie Sie
              diese uns mitgeteilt haben. Eine Weitergabe Ihrer persönlichen Daten an Dritte erfolgt
              ohne Ihre ausdrückliche Einwilligung grundsätzlich nicht. Wir weisen darauf hin, dass die
              Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken
              aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht
              möglich.
            </Prose>
            <Prose>
              Wir speichern Ihre Daten nur so lange, wie es für den genannten Zweck erforderlich ist
              oder solange gesetzliche Aufbewahrungspflichten bestehen. Die Nutzung unserer Website
              ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren Seiten
              personenbezogene Daten erhoben werden, erfolgt dies, soweit möglich, stets auf
              freiwilliger Basis.
            </Prose>
          </Section>

          <Divider />

          <Section title="Google Analytics">
            <Prose>
              Diese Website nutzt Google Analytics, einen Webanalysedienst der Google Inc. Google
              Analytics verwendet sog. „Cookies", Textdateien, die auf Ihrem Computer gespeichert
              werden und die eine Analyse der Benutzung der Website ermöglichen. Die durch den Cookie
              erzeugten Informationen über Ihre Benutzung dieser Website werden in der Regel an einen
              Server von Google in den USA übertragen und dort gespeichert.
            </Prose>
            <Prose>
              Im Falle der Aktivierung der IP-Anonymisierung auf dieser Website wird Ihre IP-Adresse
              von Google jedoch innerhalb von Mitgliedstaaten der Europäischen Union oder in anderen
              Vertragsstaaten des Abkommens über den Europäischen Wirtschaftsraum zuvor gekürzt. Nur
              in Ausnahmefällen wird die volle IP-Adresse an einen Server von Google in den USA
              übertragen und dort gekürzt. Die im Rahmen von Google Analytics von Ihrem Browser
              übermittelte IP-Adresse wird nicht mit anderen Daten von Google zusammengeführt.
            </Prose>
            <Prose>
              Sie können die Speicherung der Cookies durch eine entsprechende Einstellung Ihrer
              Browser-Software verhindern; wir weisen Sie jedoch darauf hin, dass Sie in diesem Fall
              gegebenenfalls nicht sämtliche Funktionen dieser Website vollumfänglich werden nutzen
              können. Sie können darüber hinaus die Erfassung der durch das Cookie erzeugten und auf
              Ihre Nutzung der Website bezogenen Daten (inkl. Ihrer IP-Adresse) an Google sowie die
              Verarbeitung dieser Daten durch Google verhindern, indem Sie das unter dem folgenden
              Link verfügbare Browser-Plugin herunterladen und installieren:
              tools.google.com/dlpage/gaoptout.
            </Prose>
          </Section>

          <Divider />

          <Section title="Google Adsense">
            <Prose>
              Diese Website verwendet Google Adsense, einen Webanzeigendienst der Google Inc. Google
              Adsense verwendet sog. „Cookies", Textdateien, die auf Ihrem Computer gespeichert werden
              und die eine Analyse der Benutzung der Website ermöglichen. Google Adsense verwendet
              auch sog. „Web Beacons" (kleine unsichtbare Grafiken) zur Sammlung von Informationen.
              Durch die Verwendung des Web Beacons können einfache Aktionen wie der Besucherverkehr
              auf der Webseite aufgezeichnet und gesammelt werden. Die durch den Cookie und/oder Web
              Beacon erzeugten Informationen über Ihre Benutzung dieser Website werden in der Regel
              an einen Server von Google in den USA übertragen und dort gespeichert.
            </Prose>
            <Prose>
              Google wird diese Informationen benutzen, um Ihre Nutzung der Website auszuwerten, um
              Reports über die Websiteaktivitäten für die Websitebetreiber zusammenzustellen und um
              weitere mit der Websitenutzung und der Internetnutzung verbundene Dienstleistungen zu
              erbringen. Auch wird Google diese Informationen gegebenenfalls an Dritte übertragen,
              sofern dies gesetzlich vorgeschrieben oder soweit Dritte diese Daten im Auftrag von
              Google verarbeiten. Sie können die Installation der Cookies durch eine entsprechende
              Einstellung Ihrer Browser-Software verhindern; wir weisen Sie jedoch darauf hin, dass
              Sie in diesem Fall gegebenenfalls nicht sämtliche Funktionen dieser Website
              vollumfänglich nutzen können.
            </Prose>
          </Section>

          <Divider />

          <Section title="Google AdWords Conversion-Tracking">
            <Prose>
              Diese Website nutzt das Online-Werbeprogramm „Google AdWords" und im Rahmen von Google
              AdWords das Conversion-Tracking. Das Google Conversion Tracking ist ein Analysedienst
              der Google Inc. Wenn Sie auf eine von Google geschaltete Anzeige klicken, wird ein
              Cookie für das Conversion-Tracking auf Ihrem Rechner abgelegt. Diese Cookies verlieren
              nach 30 Tagen ihre Gültigkeit und dienen nicht der persönlichen Identifizierung. Besucht
              der Nutzer bestimmte Seiten dieser Website und das Cookie ist noch nicht abgelaufen,
              können Google und wir erkennen, dass der Nutzer auf die Anzeige geklickt hat und zu
              dieser Seite weitergeleitet wurde.
            </Prose>
            <Prose>
              Jeder Google AdWords-Kunde erhält ein anderes Cookie. Cookies können somit nicht über
              die Websites von AdWords-Kunden nachverfolgt werden. Die Informationen, die mithilfe
              des Conversion-Cookies eingeholt werden, dienen dazu, Conversion-Statistiken für
              AdWords-Kunden zu erstellen, die sich für Conversion-Tracking entschieden haben. Die
              Kunden erfahren die Gesamtanzahl der Nutzer, die auf ihre Anzeige geklickt haben und
              zu einer mit einem Conversion-Tracking-Tag versehenen Seite weitergeleitet wurden.
              Sie erhalten jedoch keine Informationen, mit denen sich Nutzer persönlich identifizieren
              lassen. Wenn Sie nicht am Tracking teilnehmen möchten, können Sie das hierfür
              erforderliche Setzen eines Cookies ablehnen – etwa per Browser-Einstellung, die das
              automatische Setzen von Cookies generell deaktiviert.
            </Prose>
          </Section>

          <Divider />

          <Section title="Facebook-Plugin">
            <Prose>
              Auf unserer Website sind Plugins des sozialen Netzwerks Facebook der Facebook Inc.,
              1 Hacker Way, Menlo Park, California 94025, USA integriert. Die Facebook-Plugins
              erkennen Sie an dem Facebook-Logo oder dem „Like-Button" auf unserer Seite. Eine
              Übersicht über die Facebook-Plugins finden Sie unter:
              developers.facebook.com/docs/plugins.
            </Prose>
            <Prose>
              Wenn Sie unsere Seiten besuchen, wird über das Plugin eine direkte Verbindung zwischen
              Ihrem Browser und dem Facebook-Server hergestellt. Facebook erhält dadurch die
              Information, dass Sie mit Ihrer IP-Adresse unsere Seite besucht haben. Wenn Sie den
              Facebook „Like-Button" anklicken, während Sie in Ihrem Facebook-Account eingeloggt
              sind, können Sie die Inhalte unserer Seiten auf Ihrem Facebook-Profil verlinken.
              Dadurch kann Facebook den Besuch unserer Seiten Ihrem Benutzerkonto zuordnen. Wir
              weisen darauf hin, dass wir als Anbieter der Seiten keine Kenntnis vom Inhalt der
              übermittelten Daten sowie deren Nutzung durch Facebook erhalten. Weitere Informationen
              hierzu finden Sie in der Datenschutzerklärung von Facebook unter:
              de-de.facebook.com/policy.php.
            </Prose>
            <Prose>
              Wenn Sie nicht wünschen, dass Facebook den Besuch unserer Seiten Ihrem
              Facebook-Nutzerkonto zuordnen kann, loggen Sie sich bitte aus Ihrem
              Facebook-Benutzerkonto aus.
            </Prose>
          </Section>

          <Divider />

          <Section title="Auskunftsrecht">
            <Prose>
              Sie haben jederzeit das Recht, sich unentgeltlich und unverzüglich über die zu Ihrer
              Person erhobenen Daten zu erkundigen. Sie haben das Recht auf Berichtigung falscher
              Daten und auf die Sperrung und Löschung Ihrer personenbezogenen Daten, soweit dem keine
              gesetzliche Aufbewahrungspflicht entgegensteht. Bitte wenden Sie sich für Auskunfts-,
              Berichtigungs- oder Löschanfragen an:
            </Prose>
            <div className="mt-3 pl-4 py-3 rounded-lg text-sm space-y-1"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
            >
              <p style={{ color: '#c8c8c8' }}>TR Edelzaun &amp; Tor GmbH</p>
              <p style={{ color: '#6B7280' }}>Kastanienplatz 2, 06369 Großwülknitz</p>
              <p style={{ color: '#6B7280' }}>Tel: 03496-7005181</p>
              <p style={{ color: '#800020' }}>info@edelzaun-tor.de</p>
            </div>
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
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{children}</p>
  )
}

function Divider() {
  return <div className="w-full h-px" style={{ background: '#E5E7EB' }} />
}
