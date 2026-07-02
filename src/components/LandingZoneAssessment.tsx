/**
 * LandingZoneAssessment — Captures Azure AI Landing Zone readiness fields
 * 
 * Rendered in the AIAssessmentWorkflow's current-state section.
 * Toggle switches for boolean fields, selects for enums.
 */

import {
  Cloud,
  ShieldCheck,
  Lock,
  Network,
  TreeStructure,
  GitBranch,
  Lifebuoy,
} from '@phosphor-icons/react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LandingZoneReadiness } from '@/lib/types'

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  value: LandingZoneReadiness
  onChange: (value: LandingZoneReadiness) => void
  readOnly?: boolean
}

// ============================================================================
// DEFAULTS
// ============================================================================

export const EMPTY_LANDING_ZONE: LandingZoneReadiness = {
  hasAILandingZone: false,
  networkModel: 'unknown',
  privateEndpoints: false,
  eslzCompliant: false,
  subscriptionTopology: undefined,
  managementGroups: false,
  policyBaseline: undefined,
  environmentSeparation: false,
  drStrategy: undefined,
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function LandingZoneAssessment({ value, onChange, readOnly = false }: Props) {
  const update = (patch: Partial<LandingZoneReadiness>) => {
    if (!readOnly) onChange({ ...value, ...patch })
  }

  // Calculate completion progress
  const totalFields = 9 // hasAILandingZone, networkModel, privateEndpoints, eslzCompliant, subscriptionTopology, managementGroups, policyBaseline, environmentSeparation, drStrategy
  const completedFields = [
    value.hasAILandingZone,
    value.networkModel,
    value.privateEndpoints,
    value.eslzCompliant,
    value.subscriptionTopology,
    value.managementGroups,
    value.policyBaseline,
    value.environmentSeparation,
    value.drStrategy,
  ].filter(Boolean).length
  const completionPct = Math.round((completedFields / totalFields) * 100)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Cloud weight="duotone" className="h-4 w-4" />
        <span>AI Landing Zone Readiness</span>
      </div>

      {/* Context note */}
      <p className="text-xs text-muted-foreground">
        An AI Landing Zone is a pre-configured Azure environment with networking, identity, and
        governance guardrails for AI workloads. It ensures secure, compliant deployment aligned
        with the Cloud Adoption Framework.
      </p>

      {/* Completion progress */}
      <div className="flex items-center gap-3">
        <Progress value={completionPct} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{completedFields}/{totalFields} configured</span>
      </div>

      {/* Toggle grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* AI Landing Zone */}
        <ToggleRow
          icon={<Cloud className="h-4 w-4" />}
          label="AI Landing Zone Deployed"
          description="Dedicated subscription / resource group for AI workloads"
          checked={value.hasAILandingZone}
          onCheckedChange={v => update({ hasAILandingZone: v })}
          readOnly={readOnly}
        />

        {/* ESLZ Compliant */}
        <ToggleRow
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Enterprise-Scale LZ (ESLZ)"
          description="Aligned to MS Cloud Adoption Framework Landing Zones"
          checked={value.eslzCompliant}
          onCheckedChange={v => update({ eslzCompliant: v })}
          readOnly={readOnly}
        />

        {/* Private Endpoints */}
        <ToggleRow
          icon={<Lock className="h-4 w-4" />}
          label="Private Endpoints"
          description="AI services accessible only via private networking"
          checked={value.privateEndpoints}
          onCheckedChange={v => update({ privateEndpoints: v })}
          readOnly={readOnly}
        />

        {/* Management Groups */}
        <ToggleRow
          icon={<TreeStructure className="h-4 w-4" />}
          label="Management Groups"
          description="Hierarchical governance structure in place"
          checked={value.managementGroups}
          onCheckedChange={v => update({ managementGroups: v })}
          readOnly={readOnly}
        />

        {/* Environment Separation */}
        <ToggleRow
          icon={<GitBranch className="h-4 w-4" />}
          label="Environment Separation"
          description="Dev / Test / Prod environments isolated"
          checked={value.environmentSeparation ?? false}
          onCheckedChange={v => update({ environmentSeparation: v })}
          readOnly={readOnly}
        />
      </div>

      {/* Select fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Network Model */}
        <SelectRow
          icon={<Network className="h-4 w-4" />}
          label="Network Model"
          value={value.networkModel}
          onChange={v => update({ networkModel: v as LandingZoneReadiness['networkModel'] })}
          readOnly={readOnly}
          options={[
            { value: 'hub-spoke', label: 'Hub & Spoke' },
            { value: 'vwan', label: 'Virtual WAN' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'flat', label: 'Flat Network' },
          ]}
        />

        {/* Subscription Topology */}
        <SelectRow
          icon={<TreeStructure className="h-4 w-4" />}
          label="Subscription Topology"
          value={value.subscriptionTopology}
          onChange={v => update({ subscriptionTopology: v as LandingZoneReadiness['subscriptionTopology'] })}
          readOnly={readOnly}
          options={[
            { value: 'single', label: 'Single Subscription' },
            { value: 'dedicated-ai', label: 'Dedicated AI Subscription' },
            { value: 'multi-env', label: 'Multi-Environment' },
          ]}
        />

        {/* Policy Baseline */}
        <SelectRow
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Policy Baseline"
          value={value.policyBaseline}
          onChange={v => update({ policyBaseline: v as LandingZoneReadiness['policyBaseline'] })}
          readOnly={readOnly}
          options={[
            { value: 'none', label: 'No Azure Policy' },
            { value: 'basic', label: 'Basic Policies' },
            { value: 'caf-baseline', label: 'CAF Baseline' },
            { value: 'custom-strict', label: 'Custom / Strict' },
          ]}
        />

        {/* DR Strategy */}
        <SelectRow
          icon={<Lifebuoy className="h-4 w-4" />}
          label="DR Strategy"
          value={value.drStrategy}
          onChange={v => update({ drStrategy: v as LandingZoneReadiness['drStrategy'] })}
          readOnly={readOnly}
          options={[
            { value: 'none', label: 'None' },
            { value: 'backup', label: 'Backup Only' },
            { value: 'warm-standby', label: 'Warm Standby' },
            { value: 'active-active', label: 'Active-Active' },
          ]}
        />
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  readOnly,
}: {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  readOnly: boolean
}) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-md border border-muted hover:bg-muted/30 transition-colors">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium leading-tight">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={readOnly}
        className="shrink-0"
      />
    </div>
  )
}

function SelectRow({
  icon,
  label,
  value,
  onChange,
  readOnly,
  options,
}: {
  icon: React.ReactNode
  label: string
  value: string | undefined
  onChange: (v: string) => void
  readOnly: boolean
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md border border-muted hover:bg-muted/30 transition-colors">
      <div className="text-muted-foreground">{icon}</div>
      <Label className="text-sm font-medium whitespace-nowrap">{label}</Label>
      <Select value={value ?? ''} onValueChange={onChange} disabled={readOnly}>
        <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
          <SelectValue placeholder="Not set" />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
