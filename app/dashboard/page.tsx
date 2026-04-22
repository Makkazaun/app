import DashboardHeader  from '@/components/dashboard/DashboardHeader'
import AnfragenSection  from '@/components/dashboard/AnfragenSection'
import AngeboteSection  from '@/components/dashboard/AngeboteSection'
import AuftraegeSection from '@/components/dashboard/AuftraegeSection'

export default function DashboardPage() {
  return (
    <div className="space-y-14 max-w-5xl">

      {/* ── Begrüßung + Summen ───────────────────────────────────────────── */}
      <DashboardHeader />

      {/* 01 · Meine Anfragen & Konfigurationen (Konfigurator-Einreichungen) */}
      <AnfragenSection />

      {/* 02 · Meine Angebote (JTL, digital unterschreibbar) */}
      <AngeboteSection />

      {/* 03 · Meine Aufträge (bestätigte / unterschriebene Aufträge) */}
      <AuftraegeSection />

    </div>
  )
}
