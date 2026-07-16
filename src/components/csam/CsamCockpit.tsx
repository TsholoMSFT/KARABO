/**
 * CsamCockpit — shell for the "Customer Value Realisation & Health Cockpit".
 *
 * Mounts as a single top-level view and provides internal navigation across the
 * cockpit pages, a customer selector (backed by the CsamDataProvider seam via
 * use-csam), a data-source indicator, and the Specialist⇄CSAM lens toggle
 * (Section 10).
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  ChartBar, Buildings, CurrencyDollar, Funnel, ChartLineUp, Users, Heartbeat,
  ListChecks, Lightbulb, ChatText, CalendarBlank, Target, ArrowsLeftRight, Export, Info,
} from '@phosphor-icons/react'
import { useCsamSelection } from '@/hooks/use-csam'
import type { CockpitLens, CsamProfileSource } from '@/lib/csam/types'
import { PortfolioOverviewPage, Customer360Page } from './pages/Overview'
import { InvestmentBaselinePage, ValueRealisationMapPage } from './pages/Baseline'
import { FinancialImpactPage } from './pages/Financial'
import { AdoptionBarriersPage, HealthRiskPage } from './pages/Adoption'
import { UseCasePrioritisationPage } from './pages/Prioritise'
import { ValueHypothesisPage, CsdrNarrativePage, NextBestActionPage } from './pages/Generate'
import { SpecialistVsCsamLensPage, ExportPage } from './pages/LensExport'
import { CsdrAgendaPage } from './pages/Agenda'
import { EmptyState } from './shared'

type PageId =
  | 'portfolio' | 'customer360' | 'investment' | 'value-map' | 'financial'
  | 'adoption' | 'health' | 'prioritisation' | 'hypothesis' | 'csdr'
  | 'agenda' | 'actions' | 'lens' | 'export'

interface NavItem {
  id: PageId
  label: string
  icon: ReactNode
  needsProfile: boolean
}

const NAV: NavItem[] = [
  { id: 'portfolio', label: 'Portfolio Overview', icon: <ChartBar size={16} />, needsProfile: false },
  { id: 'customer360', label: 'Customer 360', icon: <Buildings size={16} />, needsProfile: true },
  { id: 'investment', label: 'Investment Baseline', icon: <CurrencyDollar size={16} />, needsProfile: true },
  { id: 'value-map', label: 'Value Realisation Map', icon: <Funnel size={16} />, needsProfile: true },
  { id: 'financial', label: 'Financial Impact', icon: <ChartLineUp size={16} />, needsProfile: true },
  { id: 'adoption', label: 'Adoption & Barriers', icon: <Users size={16} />, needsProfile: true },
  { id: 'health', label: 'Health & Risk', icon: <Heartbeat size={16} />, needsProfile: true },
  { id: 'prioritisation', label: 'Use Case Prioritisation', icon: <ListChecks size={16} />, needsProfile: true },
  { id: 'hypothesis', label: 'Value Hypothesis', icon: <Lightbulb size={16} />, needsProfile: true },
  { id: 'csdr', label: 'CSDR Narrative', icon: <ChatText size={16} />, needsProfile: true },
  { id: 'agenda', label: 'CSDR Agenda Builder', icon: <CalendarBlank size={16} />, needsProfile: true },
  { id: 'actions', label: 'Next Best Action', icon: <Target size={16} />, needsProfile: true },
  { id: 'lens', label: 'Specialist vs CSAM', icon: <ArrowsLeftRight size={16} />, needsProfile: true },
  { id: 'export', label: 'Export / Copy', icon: <Export size={16} />, needsProfile: true },
]

const SOURCE_LABELS: Record<CsamProfileSource, string> = {
  manual: 'Manually entered',
  service: 'Existing services',
  msx: 'MSX (Dataverse)',
}

export function CsamCockpit() {
  const csam = useCsamSelection()
  const { profiles, selectedId, setSelectedId, selected, saveHypothesis } = csam
  const [page, setPage] = useState<PageId>('portfolio')
  const [lens, setLens] = useState<CockpitLens>('csam')

  // Auto-select the first customer so the cockpit is immediately useful.
  useEffect(() => {
    if (!selectedId && profiles.length) setSelectedId(profiles[0].customerId)
  }, [profiles, selectedId, setSelectedId])

  const activeNav = NAV.find((n) => n.id === page) ?? NAV[0]

  const body = useMemo<ReactNode>(() => {
    if (page === 'portfolio') {
      return (
        <PortfolioOverviewPage
          profiles={profiles}
          onSelect={(id) => {
            setSelectedId(id)
            setPage('customer360')
          }}
        />
      )
    }
    if (!selected) {
      return <EmptyState>Select a customer to view this page.</EmptyState>
    }
    switch (page) {
      case 'customer360': return <Customer360Page profile={selected} />
      case 'investment': return <InvestmentBaselinePage profile={selected} />
      case 'value-map': return <ValueRealisationMapPage profile={selected} />
      case 'financial': return <FinancialImpactPage profile={selected} />
      case 'adoption': return <AdoptionBarriersPage profile={selected} />
      case 'health': return <HealthRiskPage profile={selected} />
      case 'prioritisation': return <UseCasePrioritisationPage profile={selected} />
      case 'hypothesis':
        return (
          <ValueHypothesisPage
            profile={selected}
            onSave={selected.source === 'manual' ? (h) => saveHypothesis(selected.customerId, h) : undefined}
          />
        )
      case 'csdr': return <CsdrNarrativePage profile={selected} />
      case 'agenda': return <CsdrAgendaPage profile={selected} />
      case 'actions': return <NextBestActionPage profile={selected} />
      case 'lens': return <SpecialistVsCsamLensPage profile={selected} />
      case 'export': return <ExportPage profile={selected} />
      default: return null
    }
  }, [page, profiles, selected, setSelectedId, saveHypothesis])

  if (!profiles.length) {
    return (
      <EmptyState>
        No customer profiles yet. Add a profile to begin.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header: customer selector + source + lens toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="csam-customer" className="text-sm text-muted-foreground">Customer</label>
          <select
            id="csam-customer"
            title="Select customer"
            aria-label="Select customer"
            className="h-9 rounded-md border bg-background px-3 text-sm min-w-48"
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value || null)}
          >
            {profiles.map((p) => (
              <option key={p.customerId} value={p.customerId}>{p.name}</option>
            ))}
          </select>
          {selected?.source && <Badge variant="secondary">{SOURCE_LABELS[selected.source]}</Badge>}
        </div>

        <div className="inline-flex rounded-md border p-0.5">
          <LensButton active={lens === 'csam'} onClick={() => setLens('csam')}>CSAM lens</LensButton>
          <LensButton active={lens === 'specialist'} onClick={() => setLens('specialist')}>Specialist lens</LensButton>
        </div>
      </div>

      {lens === 'specialist' && (
        <div className="rounded-md border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900 flex items-start gap-2">
          <Info size={18} className="mt-0.5 shrink-0" />
          <span>
            Specialist lens (pre-sale). This cockpit is optimised for the CSAM (post-sale) value-realisation view — the
            pre-sale discovery, qualification and business-case flow lives in the main discovery tool. Switch back to the
            CSAM lens to use the cockpit pages.
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-[230px_1fr] gap-6">
        {/* Sub-nav */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1">
          {NAV.map((item) => {
            const active = item.id === page
            const disabled = item.needsProfile && !selected
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                disabled={disabled}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left whitespace-nowrap transition-colors shrink-0 ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : disabled
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'hover:bg-muted text-foreground'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Body */}
        <div className="min-w-0">
          {lens === 'specialist' ? (
            selected ? <SpecialistVsCsamLensPage profile={selected} /> : <EmptyState>Select a customer.</EmptyState>
          ) : (
            <>
              <div className="sr-only">{activeNav.label}</div>
              {body}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LensButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  )
}
