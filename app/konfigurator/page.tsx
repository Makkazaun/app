'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import StepIndicator from '@/components/konfigurator/StepIndicator'
import NavButtons from '@/components/konfigurator/NavButtons'
import Step1Produkt from '@/components/konfigurator/Step1Produkt'
import Step2Betonzaun from '@/components/konfigurator/Step2Betonzaun'
import Step2Doppelstab from '@/components/konfigurator/Step2Doppelstab'
import Step2Schmiedekunst from '@/components/konfigurator/Step2Schmiedekunst'
import Step3Tore from '@/components/konfigurator/Step3Tore'
import Step4Upload from '@/components/konfigurator/Step4Upload'
import Step5Kontakt from '@/components/konfigurator/Step5Kontakt'
import Step6Summary from '@/components/konfigurator/Step6Summary'
import { INITIAL_FORM_DATA, type FormData } from '@/components/konfigurator/types'
import { getSession } from '@/lib/auth'
import { createAndSaveAnfrage, savePendingAnfrage, type AnfrageRecord } from '@/lib/store'

type SubmitResult =
  | { kind: 'logged_in'; record: AnfrageRecord }
  | { kind: 'guest';     record: AnfrageRecord }

export default function KonfiguratorPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(INITIAL_FORM_DATA)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(false)

  function update(partial: Partial<FormData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  function scroll() { window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function goNext() { scroll(); setStep((s) => s + 1) }
  function goBack() { scroll(); setStep((s) => s - 1) }
  function goToStep(n: number) { scroll(); setStep(n) }

  async function handleSubmit() {
    setLoading(true)

    // ── E-Mail via API Route senden ────────────────────────────────────────
    try {
      const payload = {
        vorname:   data.kontakt.vorname,
        nachname:  data.kontakt.nachname,
        email:     data.kontakt.email,
        telefon:   data.kontakt.telefon,
        plz:       data.kontakt.plz,
        ort:       data.kontakt.ort,
        nachricht: data.kontakt.nachricht,
        produkt:   data.produkt,
        config:    data,
      }
      await fetch('/api/anfrage', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      // Fehler beim E-Mail-Versand werden still ignoriert –
      // die Anfrage wird trotzdem lokal gespeichert
    } catch {
      // Netzwerkfehler – Anfrage wird trotzdem lokal gespeichert
    }

    const session = getSession()

    if (session) {
      // ── Eingeloggt: direkt speichern ──────────────────────────────────
      const record = createAndSaveAnfrage(session.email, data)
      setResult({ kind: 'logged_in', record })
      setLoading(false)
      // Kurz warten, dann Dashboard öffnen (User sieht Erfolgsmeldung)
      setTimeout(() => router.push('/dashboard'), 2200)
    } else {
      // ── Gast: pending speichern, Konto-Option anbieten ────────────────
      const record = savePendingAnfrage(data)
      setResult({ kind: 'guest', record })
      setLoading(false)
    }
  }

  function canProceed(): boolean {
    if (step === 1) return data.produkt !== ''
    if (step === 2) {
      if (data.produkt === 'betonzaun')
        return !!(data.betonzaun.struktur &&
                  data.betonzaun.hoehe &&
                  data.betonzaun.laenge &&
                  data.betonzaun.montage &&
                  data.betonzaun.platten.some((s) => s.modellNr))
      if (data.produkt === 'doppelstabmatte')
        return !!(data.doppelstab.hoehe && data.doppelstab.laenge && data.doppelstab.montage)
      if (data.produkt === 'schmiedekunst')
        return data.schmiedekunst.montage !== ''
    }
    if (step === 3) return data.tor.gewuenscht !== null && data.tuer.gewuenscht !== null
    if (step === 4) return true
    if (step === 5)
      return !!(data.kontakt.vorname && data.kontakt.nachname &&
                data.kontakt.email && data.kontakt.datenschutz)
    return true
  }

  // ── Nach dem Absenden ──────────────────────────────────────────────────────
  if (result?.kind === 'logged_in') {
    return <LoggedInSuccessScreen name={data.kontakt.vorname} />
  }
  if (result?.kind === 'guest') {
    return <GuestSuccessScreen name={data.kontakt.vorname} email={data.kontakt.email} />
  }

  // ── Formular ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#161616' }}>
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0"
        style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}
      >
        <Logo variant="header" />
        <Link href="/" className="text-xs hover:opacity-70 transition-opacity" style={{ color: '#4a4a4a' }}>
          ✕ Schließen
        </Link>
      </header>

      <div className="px-4 sm:px-6 pt-5 pb-3 flex-shrink-0"
        style={{ background: '#1a1a1a', borderBottom: '1px solid #222' }}
      >
        <StepIndicator current={step} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 pb-36">
          {step === 1 && <Step1Produkt data={data} update={update} />}
          {step === 2 && data.produkt === 'betonzaun'       && <Step2Betonzaun    data={data} update={update} />}
          {step === 2 && data.produkt === 'doppelstabmatte' && <Step2Doppelstab   data={data} update={update} />}
          {step === 2 && data.produkt === 'schmiedekunst'   && <Step2Schmiedekunst data={data} update={update} />}
          {step === 3 && <Step3Tore     data={data} update={update} />}
          {step === 4 && <Step4Upload   data={data} update={update} />}
          {step === 5 && <Step5Kontakt  data={data} update={update} />}
          {step === 6 && <Step6Summary  data={data} goToStep={goToStep} />}

          <NavButtons
            onBack={step > 1 ? goBack : undefined}
            onNext={step < 6 ? goNext : handleSubmit}
            nextLabel={step === 5 ? 'Zur Zusammenfassung' : 'Weiter'}
            nextDisabled={!canProceed()}
            isLast={step === 6}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

// ── Erfolgsscreen: eingeloggter Kunde ─────────────────────────────────────────

function LoggedInSuccessScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#161616' }}>
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full text-4xl"
          style={{ background: 'rgba(91,201,122,0.12)', border: '2px solid #5bc97a' }}
        >
          ✓
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#e8e8e8' }}>
            Anfrage gespeichert!{name ? ` Danke, ${name}.` : ''}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6a6a6a' }}>
            Ihre Konfiguration wurde in Ihrem Kundenprofil gesichert.
            Sie werden gleich zu Ihrem Dashboard weitergeleitet …
          </p>
        </div>
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: '#2d2d2d', borderTopColor: '#800020' }}
          />
        </div>
        <Link href="/dashboard"
          className="inline-block text-xs hover:opacity-80 transition-opacity"
          style={{ color: '#4a4a4a' }}
        >
          Jetzt zum Dashboard →
        </Link>
      </div>
    </div>
  )
}

// ── Erfolgsscreen: Gast ────────────────────────────────────────────────────────

function GuestSuccessScreen({ name, email }: { name: string; email: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#161616' }}>
      <div className="max-w-md w-full space-y-6">

        {/* Bestätigung */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full text-3xl"
            style={{ background: 'rgba(91,201,122,0.12)', border: '2px solid #5bc97a' }}
          >
            ✓
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e8e8' }}>
            Anfrage gesendet!{name ? ` Danke, ${name}.` : ''}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6a6a6a' }}>
            Wir melden uns innerhalb von 1–2 Werktagen mit einem persönlichen Angebot.
          </p>
        </div>

        {/* Konto-CTA */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{
            background: 'linear-gradient(145deg, #1e1a0a, #28220e)',
            border: '1px solid #3d3210',
          }}
        >
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: '#a0002a' }}>
              ✨ Anfrage-Status jederzeit verfolgen
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#7a6a3a' }}>
              Erstellen Sie ein kostenloses Kundenkonto und sehen Sie Angebote,
              Termine und Rechnungen direkt in Ihrem persönlichen Dashboard.
            </p>
          </div>

          <Link
            href={`/login?register=1&email=${encodeURIComponent(email)}`}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #5a0016, #800020, #a0002a, #800020, #5a0016)',
              color: '#ffffff',
              letterSpacing: '0.1em',
              boxShadow: '0 4px 16px rgba(128,0,32,0.25)',
            }}
          >
            Jetzt Kundenkonto erstellen →
          </Link>

          <p className="text-xs text-center" style={{ color: '#4a3a1a' }}>
            Ihre Anfrage wird automatisch mit dem Konto verknüpft.
          </p>
        </div>

        {/* Kontakt + weiter ohne Konto */}
        <div className="rounded-xl p-4 space-y-1"
          style={{ background: '#1e1e1e', border: '1px solid #2d2d2d' }}
        >
          <p className="text-xs" style={{ color: '#4a4a4a' }}>📞 Telefonisch erreichbar</p>
          <p className="text-sm font-semibold" style={{ color: '#800020' }}>03496-7005181</p>
          <p className="text-xs" style={{ color: '#4a4a4a' }}>✉ info@edelzaun-tor.de</p>
        </div>

        <Link href="/"
          className="block text-center text-xs hover:opacity-80 transition-opacity py-2"
          style={{ color: '#3a3a3a' }}
        >
          Ohne Konto zur Startseite
        </Link>
      </div>
    </div>
  )
}
