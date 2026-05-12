/**
 * Deterministic Azure run-cost engine.
 *
 * Walks a UseCase's selected `microsoftSolutions` + `referenceArchitecture` +
 * `aiEffortEstimate` and produces a UseCaseRunCost (monthly compute / license /
 * data + one-time implementation). Pure function, no AI calls. Pricing is
 * sourced from `azure-pricing.json` (refreshable, versioned).
 */

import pricing from './azure-pricing.json'
import type { UseCase, UseCaseRunCost, UseCaseMicrosoftSolution } from './types'

export interface CostEngineInputs {
  /** Number of active end-users hitting the system per month. */
  activeUsers?: number
  /** Monthly request / transaction volume against AOAI / search / functions. */
  monthlyTransactions?: number
  /** Azure region key (lowercased, no spaces) — e.g. 'southafricanorth'. */
  region?: string
  /** Pre-set effort weeks. Falls back to useCase.aiEffortEstimate.effortWeeks. */
  effortWeeksOverride?: number
}

const DEFAULT_INPUTS: Required<CostEngineInputs> = {
  activeUsers: 100,
  monthlyTransactions: 50_000,
  region: 'eastus',
  effortWeeksOverride: 0,
}

interface Line {
  label: string
  monthlyUSD: number
  bucket: 'compute' | 'license' | 'data'
}

function regionMultiplier(region: string): number {
  const map = pricing.regionMultipliers as Record<string, number>
  const key = region.toLowerCase().replace(/\s+/g, '')
  return map[key] ?? map.default ?? 1
}

/** Sum AOAI token cost for a notional monthly transaction volume. */
function aoaiMonthlyCost(model: keyof typeof pricing.azureOpenAI, monthlyTx: number, avgInTokens = 600, avgOutTokens = 300): number {
  const m = pricing.azureOpenAI[model]
  if (!m) return 0
  const inputMTokens = (monthlyTx * avgInTokens) / 1_000_000
  const outputMTokens = (monthlyTx * avgOutTokens) / 1_000_000
  return inputMTokens * m.inputPer1M + outputMTokens * m.outputPer1M
}

function flattenSolutions(solutions: UseCaseMicrosoftSolution[] | undefined): Set<string> {
  const set = new Set<string>()
  if (!solutions) return set
  for (const s of solutions) {
    set.add(s.productFamily)
    for (const svc of s.services || []) set.add(svc.toLowerCase())
  }
  return set
}

/**
 * Estimate run cost for a single use case. Pure / deterministic.
 */
export function estimateRunCost(useCase: UseCase, inputs: CostEngineInputs = {}): UseCaseRunCost {
  const merged = { ...DEFAULT_INPUTS, ...inputs }
  const mult = regionMultiplier(merged.region)
  const services = flattenSolutions(useCase.microsoftSolutions)
  const lines: Line[] = []

  // ---------- Azure OpenAI ----------
  if (services.has('azure-openai') || services.has('azure-ai-foundry') || services.has('azure-ai-services')) {
    // Cheap routing assumption: 70% mini, 25% phi-4-mini, 5% gpt-4o
    const tx = merged.monthlyTransactions
    const mini = aoaiMonthlyCost('gpt-4o-mini', tx * 0.70)
    const phi = aoaiMonthlyCost('phi-4-mini', tx * 0.25)
    const premium = aoaiMonthlyCost('gpt-4o', tx * 0.05)
    const total = mini + phi + premium
    lines.push({ label: `Azure OpenAI (${tx.toLocaleString()} tx/mo, mixed routing)`, monthlyUSD: total, bucket: 'compute' })
  }

  // ---------- AI Search ----------
  if (services.has('azure-ai-search') || services.has('azure-cognitive-search') || useCase.referenceArchitecture === 'rag-pattern') {
    const tier = merged.activeUsers > 1000 ? 'standard2' : merged.activeUsers > 200 ? 'standard1' : 'basic'
    const sku = pricing.aiSearch[tier as keyof typeof pricing.aiSearch]
    lines.push({ label: `Azure AI Search — ${sku.label}`, monthlyUSD: sku.monthlyUSD, bucket: 'compute' })
  }

  // ---------- Document Intelligence ----------
  if (services.has('azure-document-intelligence') || services.has('document-intelligence')) {
    const pages = Math.max(1000, merged.monthlyTransactions * 0.1)
    const cost = pages * pricing.documentIntelligence.perPagePrebuilt
    lines.push({ label: `Document Intelligence (~${Math.round(pages).toLocaleString()} pages)`, monthlyUSD: cost, bucket: 'compute' })
  }

  // ---------- Compute hosting ----------
  if (services.has('azure-functions') || services.has('functions')) {
    const execMillions = Math.max(0.5, merged.monthlyTransactions / 1_000_000)
    const cost = execMillions * pricing.compute.functionsConsumption.perMillionExecutionsUSD + 25
    lines.push({ label: `Azure Functions (Consumption + GB-s)`, monthlyUSD: cost, bucket: 'compute' })
  } else if (services.has('container-apps') || services.has('azure-container-apps')) {
    lines.push({ label: 'Azure Container Apps (base)', monthlyUSD: pricing.compute.containerAppsBase, bucket: 'compute' })
  } else if (services.has('app-service') || services.has('azure-app-service')) {
    lines.push({ label: 'Azure App Service (P1v3)', monthlyUSD: pricing.compute.appServiceP1v3, bucket: 'compute' })
  } else if (services.has('aks') || services.has('azure-kubernetes-service')) {
    const nodes = merged.activeUsers > 500 ? 4 : 2
    lines.push({ label: `AKS (${nodes} × Standard_D4s_v5)`, monthlyUSD: nodes * pricing.compute.aksNodeStandardD4sV5, bucket: 'compute' })
  }

  // ---------- Storage / data plane ----------
  if (services.has('azure-blob-storage') || services.has('azure-storage') || services.has('storage-account')) {
    const gb = Math.max(50, merged.monthlyTransactions * 0.001)
    lines.push({ label: `Blob Storage (~${Math.round(gb)}GB hot)`, monthlyUSD: gb * pricing.storage.blobHotPerGBMonth, bucket: 'data' })
  }
  if (services.has('cosmos-db') || services.has('azure-cosmos-db')) {
    const ruMillions = Math.max(1, merged.monthlyTransactions / 50_000)
    lines.push({ label: `Cosmos DB Serverless (~${ruMillions.toFixed(1)}M RU/mo)`, monthlyUSD: ruMillions * pricing.data.cosmosDBServerlessPer1MRUUSD, bucket: 'data' })
  }
  if (services.has('microsoft-fabric') || services.has('fabric')) {
    lines.push({ label: 'Fabric Capacity (F2)', monthlyUSD: pricing.data.fabricF2MonthlyUSD, bucket: 'data' })
  }

  // ---------- Licenses ----------
  if (services.has('microsoft-365') || services.has('m365-copilot') || services.has('copilot-for-microsoft-365')) {
    lines.push({
      label: `M365 Copilot (${merged.activeUsers} users × $${pricing.licenses.m365CopilotPerUserMonth})`,
      monthlyUSD: merged.activeUsers * pricing.licenses.m365CopilotPerUserMonth,
      bucket: 'license',
    })
  }
  if (services.has('copilot-studio')) {
    lines.push({
      label: `Copilot Studio (tenant)`,
      monthlyUSD: pricing.licenses.copilotStudioPerTenantMonth,
      bucket: 'license',
    })
  }
  if (services.has('power-platform') || services.has('power-apps')) {
    const seats = Math.max(10, Math.round(merged.activeUsers * 0.2))
    lines.push({
      label: `Power Apps (${seats} maker seats)`,
      monthlyUSD: seats * pricing.licenses.powerAppsPerUserMonth,
      bucket: 'license',
    })
  }
  if (services.has('dynamics-365') || services.has('dynamics-365-copilot')) {
    const seats = Math.max(10, Math.round(merged.activeUsers * 0.15))
    lines.push({
      label: `D365 Copilot (${seats} seats)`,
      monthlyUSD: seats * pricing.licenses.dynamics365CopilotPerUserMonth,
      bucket: 'license',
    })
  }

  // ---------- Region multiplier ----------
  for (const l of lines) l.monthlyUSD = Math.round(l.monthlyUSD * mult * 100) / 100

  // Always-on minimum if nothing matched (so the user sees a baseline).
  if (lines.length === 0) {
    lines.push({ label: 'Baseline (Functions + Storage)', monthlyUSD: 75 * mult, bucket: 'compute' })
  }

  const sumBucket = (b: Line['bucket']) => lines.filter(l => l.bucket === b).reduce((a, l) => a + l.monthlyUSD, 0)
  const monthlyComputeUSD = Math.round(sumBucket('compute') * 100) / 100
  const monthlyLicenseUSD = Math.round(sumBucket('license') * 100) / 100
  const monthlyDataUSD = Math.round(sumBucket('data') * 100) / 100

  // ---------- One-time implementation ----------
  const effortWeeks = inputs.effortWeeksOverride || useCase.aiEffortEstimate?.effortWeeks || 0
  const oneTimeImplementationUSD = Math.round(effortWeeks * pricing.implementation.loadedWeeklyRateUSD * mult)

  const totalMonthlyUSD = Math.round((monthlyComputeUSD + monthlyLicenseUSD + monthlyDataUSD) * 100) / 100
  const totalAnnualUSD = Math.round(totalMonthlyUSD * 12 * 100) / 100

  return {
    currency: 'USD',
    monthlyComputeUSD,
    monthlyLicenseUSD,
    monthlyDataUSD,
    oneTimeImplementationUSD,
    totalMonthlyUSD,
    totalAnnualUSD,
    assumptions: lines.map(l => `${l.label}: $${l.monthlyUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}/mo`)
      .concat(effortWeeks ? [`Implementation: ${effortWeeks} person-weeks × $${pricing.implementation.loadedWeeklyRateUSD}/wk × ${mult.toFixed(2)} region multiplier`] : []),
    inputs: {
      activeUsers: merged.activeUsers,
      monthlyTransactions: merged.monthlyTransactions,
      region: merged.region,
    },
    lastEstimatedAt: Date.now(),
    pricingVersion: pricing.version,
  }
}

/** Sum monthly compute cost across a portfolio of use cases. */
export function portfolioRunCost(useCases: UseCase[]): {
  totalMonthlyUSD: number
  totalAnnualUSD: number
  totalImplementationUSD: number
  withRunCost: number
} {
  let monthly = 0
  let impl = 0
  let withRunCost = 0
  for (const uc of useCases) {
    const rc = uc.runCost
    if (!rc) continue
    monthly += rc.totalMonthlyUSD || 0
    impl += rc.oneTimeImplementationUSD || 0
    withRunCost += 1
  }
  return {
    totalMonthlyUSD: Math.round(monthly * 100) / 100,
    totalAnnualUSD: Math.round(monthly * 12 * 100) / 100,
    totalImplementationUSD: Math.round(impl),
    withRunCost,
  }
}

export const PRICING_VERSION = pricing.version
