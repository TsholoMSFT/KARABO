/**
 * Unit Economics Engine
 * =====================
 * Answers the question a CFO actually cares about:
 *   "What does ONE unit of my business cost to deliver, and how does Azure + AI
 *    change that number — and what does that do to gross margin, EBITDA, cash
 *    flow and the balance sheet?"
 *
 * Read top-down through three lenses:
 *   MACRO  (rates, AI cycle, regulation)  → shapes the firm's strategy
 *   MICRO  (margin & growth pressure)     → the firm's imperative, its margins
 *   UNIT   (cost per transaction)         → the concrete lever, re-priced on Azure
 *
 * The chain: macro forces shape strategy → strategy shows up as margin/growth
 * pressure → that pressure is felt in ONE repeated transaction (unit cost) →
 * which we re-price with Azure (usage, not capacity) and AI (which inverts the
 * marginal cost of the automated step).
 *
 * Pure, deterministic, no AI calls. Every approximation is surfaced in
 * `assumptions` so the numbers can be defended in front of a finance team.
 */

// ─────────────────────────────────────────────────────────────────────────────
// INPUTS
// ─────────────────────────────────────────────────────────────────────────────

/** Where the cloud spend lands in the P&L. This determines WHICH margin it moves. */
export type CostPlacement = 'cogs' | 'opex'

export interface TransactionUnit {
  id: string
  /** What one "unit of business" is: "Mortgage application", "Claim adjudicated", "Invoice processed". */
  name: string
  /** Volume of this transaction per year. */
  annualVolume: number
  /** Current fully-loaded cost components for a SINGLE transaction (USD). */
  laborCostPerTxn: number
  /** On-prem / capacity infrastructure allocated per txn at full utilisation (compute, storage, DC). */
  infraCostPerTxn: number
  softwareCostPerTxn: number
  otherCostPerTxn: number
}

export interface FirmFinancials {
  annualRevenueUSD: number
  /** Current gross margin %, 0–100. */
  grossMarginPct: number
  /** Current EBITDA margin %, 0–100 (used to derive EBITDA when the absolute isn't supplied). */
  ebitdaMarginPct?: number
  ebitdaUSD?: number
  /** Effective tax rate %, default 25. */
  taxRatePct?: number
  /** Invested capital for ROIC (USD). If omitted, approximated from revenue. */
  investedCapitalUSD?: number
  /** Weighted average cost of capital / hurdle rate %, default 10 (the macro "rates" lever). */
  waccPct?: number
}

export interface CloudRepricing {
  /** COGS → moves GROSS margin; OPEX → moves OPERATING margin. */
  costPlacement: CostPlacement
  /** Usage-based cloud cost per transaction (replaces capacity infra; scales with usage, not peak). */
  cloudCostPerTxn: number
  /** On-prem capacity utilisation %, 0–100. Low utilisation inflates the TRUE on-prem unit cost. */
  utilisationPctOnPrem: number
  /** % of the labour/processing in this transaction that AI automates, 0–100. */
  aiAutomationPct: number
  /** Residual AI inference cost per transaction once automated (the "inverted" marginal cost). */
  aiResidualCostPerTxn: number
  /**
   * % of the current on-prem infra cost that is capitalised hardware (CAPEX) vs running
   * OPEX (power, maintenance). Default 60. This is the key to the EBITDA "optical dip":
   * CAPEX is added back in EBITDA, cloud OPEX is not.
   */
  onPremInfraCapexSharePct?: number
  /** Years over which on-prem CAPEX is depreciated (default 4). */
  capexDepreciationYears?: number
  /** One-time implementation / migration cost (USD). */
  implementationCostUSD?: number
}

export type RateEnv = 'low' | 'neutral' | 'high'
export type AiCycle = 'early' | 'scaling' | 'mature'
export type RegPressure = 'low' | 'medium' | 'high'

export interface MacroContext {
  /** Interest-rate environment — high rates make CAPEX (tied-up capital) expensive, favouring OPEX/cloud. */
  interestRateEnv: RateEnv
  /** Where we are in the AI adoption cycle — drives how aggressively automation deflates unit cost. */
  aiCycle: AiCycle
  /** Regulatory pressure — pushes compliance cost into the unit, often as COGS. */
  regulatoryPressure: RegPressure
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUTS
// ─────────────────────────────────────────────────────────────────────────────

export interface UnitCostBreakdown {
  laborUSD: number
  infraUSD: number
  softwareUSD: number
  otherUSD: number
  cloudUSD: number
  aiResidualUSD: number
  totalUSD: number
}

export interface MarginImpact {
  placement: CostPlacement
  /** The P&L margin line this lever moves. */
  marginLine: 'gross' | 'operating'
  marginBeforePct: number
  marginAfterPct: number
  marginDeltaPp: number
  annualSavingsUSD: number
}

export interface EbitdaBridge {
  ebitdaBeforeUSD: number
  /** On-prem running OPEX removed (was in EBITDA → its removal lifts EBITDA). */
  onPremOpexRemovedUSD: number
  /** New cloud OPEX (hits EBITDA in full). */
  cloudOpexAddedUSD: number
  ebitdaAfterUSD: number
  ebitdaDeltaUSD: number
  /** True when EBITDA falls purely because CAPEX (added-back) became OPEX (in-EBITDA), yet cash improves. */
  isOpticalDip: boolean
  /** Magnitude of the optical EBITDA reduction (USD, positive number). */
  opticalDipUSD: number
}

export interface CashFlowImpact {
  /** Lumpy on-prem CAPEX no longer required each refresh cycle (cash preserved). */
  capexAvoidedAnnualUSD: number
  cashCostBeforeUSD: number
  cashCostAfterUSD: number
  /** Steady-state annual free-cash-flow improvement (pre-tax operating cash). */
  annualFcfImprovementUSD: number
  /** Year-1 FCF improvement incl. CAPEX avoided, net of one-time implementation. */
  year1FcfImprovementUSD: number
}

export interface BalanceSheetImpact {
  /** Reduction in capitalised IT assets (net book value of PP&E removed). */
  ppeReductionUSD: number
  investedCapitalBeforeUSD: number
  investedCapitalAfterUSD: number
  roicBeforePct: number
  roicAfterPct: number
  roicDeltaPp: number
}

export interface UnitEconomicsResult {
  unit: TransactionUnit
  /** Per-transaction cost on the on-prem / capacity basis (incl. the capacity penalty). */
  current: UnitCostBreakdown
  /** Per-transaction cost re-priced on Azure usage (no AI yet). */
  cloud: UnitCostBreakdown
  /** Per-transaction cost on Azure usage + AI automation. */
  cloudAi: UnitCostBreakdown
  /** The per-txn "peak-capacity tax" you stop paying by moving to usage-based pricing. */
  capacityPenaltyPerTxnUSD: number
  /** The per-txn labour collapsed by AI automation. */
  aiInversionSavingPerTxnUSD: number
  annualCostCurrentUSD: number
  annualCostCloudAiUSD: number
  annualSavingsUSD: number
  savingsPerTxnUSD: number
  margin: MarginImpact
  ebitda: EbitdaBridge
  cashFlow: CashFlowImpact
  balanceSheet: BalanceSheetImpact
  assumptions: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

const clampPct = (n: number): number => Math.max(0, Math.min(100, n))
const round2 = (n: number): number => Math.round(n * 100) / 100
const round0 = (n: number): number => Math.round(n)

/** Effective on-prem infra cost per txn — peak-capacity provisioning spread over actual usage. */
function effectiveInfraPerTxn(unit: TransactionUnit, utilisationPct: number): number {
  const util = clampPct(utilisationPct)
  if (util <= 0) return unit.infraCostPerTxn
  return unit.infraCostPerTxn / (util / 100)
}

/** Current (on-prem, capacity-priced) cost to deliver one transaction. */
export function currentUnitCost(unit: TransactionUnit, repricing: CloudRepricing): UnitCostBreakdown {
  const infra = effectiveInfraPerTxn(unit, repricing.utilisationPctOnPrem)
  const total = unit.laborCostPerTxn + infra + unit.softwareCostPerTxn + unit.otherCostPerTxn
  return {
    laborUSD: round2(unit.laborCostPerTxn),
    infraUSD: round2(infra),
    softwareUSD: round2(unit.softwareCostPerTxn),
    otherUSD: round2(unit.otherCostPerTxn),
    cloudUSD: 0,
    aiResidualUSD: 0,
    totalUSD: round2(total),
  }
}

/** Re-priced on Azure usage: capacity infra → usage-based cloud, labour unchanged. */
export function cloudUnitCost(unit: TransactionUnit, repricing: CloudRepricing): UnitCostBreakdown {
  const total =
    unit.laborCostPerTxn + repricing.cloudCostPerTxn + unit.softwareCostPerTxn + unit.otherCostPerTxn
  return {
    laborUSD: round2(unit.laborCostPerTxn),
    infraUSD: 0,
    softwareUSD: round2(unit.softwareCostPerTxn),
    otherUSD: round2(unit.otherCostPerTxn),
    cloudUSD: round2(repricing.cloudCostPerTxn),
    aiResidualUSD: 0,
    totalUSD: round2(total),
  }
}

/** Azure usage + AI: AI inverts the labour/processing step to a near-fixed inference cost. */
export function cloudAiUnitCost(unit: TransactionUnit, repricing: CloudRepricing): UnitCostBreakdown {
  const automation = clampPct(repricing.aiAutomationPct) / 100
  const laborAfter = unit.laborCostPerTxn * (1 - automation)
  const total =
    laborAfter +
    repricing.aiResidualCostPerTxn +
    repricing.cloudCostPerTxn +
    unit.softwareCostPerTxn +
    unit.otherCostPerTxn
  return {
    laborUSD: round2(laborAfter),
    infraUSD: 0,
    softwareUSD: round2(unit.softwareCostPerTxn),
    otherUSD: round2(unit.otherCostPerTxn),
    cloudUSD: round2(repricing.cloudCostPerTxn),
    aiResidualUSD: round2(repricing.aiResidualCostPerTxn),
    totalUSD: round2(total),
  }
}

/**
 * Full unit-economics → CFO bridge for one re-priced transaction.
 */
export function computeUnitEconomics(
  unit: TransactionUnit,
  firm: FirmFinancials,
  repricing: CloudRepricing,
  _macro?: MacroContext,
): UnitEconomicsResult {
  const assumptions: string[] = []

  const taxRate = (firm.taxRatePct ?? 25) / 100
  const capexShare = clampPct(repricing.onPremInfraCapexSharePct ?? 60) / 100
  const depYears = repricing.capexDepreciationYears ?? 4
  const wacc = (firm.waccPct ?? 10) / 100

  const current = currentUnitCost(unit, repricing)
  const cloud = cloudUnitCost(unit, repricing)
  const cloudAi = cloudAiUnitCost(unit, repricing)

  const capacityPenaltyPerTxnUSD = round2(current.infraUSD - unit.infraCostPerTxn)
  const aiInversionSavingPerTxnUSD = round2(cloud.totalUSD - cloudAi.totalUSD)

  const volume = Math.max(0, unit.annualVolume)
  const annualCostCurrentUSD = round0(current.totalUSD * volume)
  const annualCostCloudAiUSD = round0(cloudAi.totalUSD * volume)
  const annualSavingsUSD = round0(annualCostCurrentUSD - annualCostCloudAiUSD)
  const savingsPerTxnUSD = round2(current.totalUSD - cloudAi.totalUSD)

  assumptions.push(
    `On-prem infra is priced at PEAK capacity and spread over ${clampPct(repricing.utilisationPctOnPrem)}% utilisation, so the true on-prem unit cost carries a ${formatUSD(capacityPenaltyPerTxnUSD)}/txn capacity penalty that usage-based Azure pricing removes.`,
  )
  assumptions.push(
    `AI automates ${clampPct(repricing.aiAutomationPct)}% of the labour step, collapsing it to a near-fixed inference cost of ${formatUSD(repricing.aiResidualCostPerTxn)}/txn (cost inversion: marginal cost stops scaling with volume).`,
  )

  // ── Margin impact (COGS vs OPEX placement) ───────────────────────────────
  const revenue = Math.max(1, firm.annualRevenueUSD)
  const savingsPp = (annualSavingsUSD / revenue) * 100
  let margin: MarginImpact
  if (repricing.costPlacement === 'cogs') {
    margin = {
      placement: 'cogs',
      marginLine: 'gross',
      marginBeforePct: round2(firm.grossMarginPct),
      marginAfterPct: round2(firm.grossMarginPct + savingsPp),
      marginDeltaPp: round2(savingsPp),
      annualSavingsUSD,
    }
    assumptions.push(
      'Cloud sits in COGS, so the efficiency moves GROSS margin directly (cost of delivering the product/service).',
    )
  } else {
    const opMarginBefore = firm.ebitdaMarginPct ?? deriveEbitdaMarginPct(firm)
    margin = {
      placement: 'opex',
      marginLine: 'operating',
      marginBeforePct: round2(opMarginBefore),
      marginAfterPct: round2(opMarginBefore + savingsPp),
      marginDeltaPp: round2(savingsPp),
      annualSavingsUSD,
    }
    assumptions.push(
      'Cloud sits in general OPEX, so gross margin is unchanged — the efficiency moves OPERATING margin instead.',
    )
  }

  // ── EBITDA bridge — the CAPEX→OPEX "optical dip" ─────────────────────────
  const ebitdaBeforeUSD = round0(firm.ebitdaUSD ?? (deriveEbitdaMarginPct(firm) / 100) * revenue)

  // Annual cash the on-prem capacity costs (the penalty-inflated infra is the real spend).
  const annualOnPremInfraCash = current.infraUSD * volume
  const capexPortion = annualOnPremInfraCash * capexShare // capitalised → added back in EBITDA
  const onPremOpexRemovedUSD = round0(annualOnPremInfraCash * (1 - capexShare)) // running opex, was in EBITDA
  const cloudOpexAddedUSD = round0((cloudAi.cloudUSD + cloudAi.aiResidualUSD) * volume) // all OPEX, in EBITDA

  const ebitdaDeltaUSD = round0(onPremOpexRemovedUSD - cloudOpexAddedUSD)
  const ebitdaAfterUSD = round0(ebitdaBeforeUSD + ebitdaDeltaUSD)

  // Cash story (pre-tax operating cash): all on-prem infra cash vs cloud cash.
  const cashCostBeforeUSD = round0(annualOnPremInfraCash)
  const cashCostAfterUSD = cloudOpexAddedUSD
  const annualFcfImprovementUSD = round0(cashCostBeforeUSD - cashCostAfterUSD)
  const capexAvoidedAnnualUSD = round0(capexPortion)

  const isOpticalDip = ebitdaDeltaUSD < 0 && annualFcfImprovementUSD > 0
  const opticalDipUSD = Math.max(0, -ebitdaDeltaUSD)

  if (isOpticalDip) {
    assumptions.push(
      `CAPEX→OPEX optical dip: reported EBITDA falls ${formatUSD(opticalDipUSD)} because capitalised hardware (added back above EBITDA) is replaced by cloud OPEX (inside EBITDA) — even though cash improves. Steer by free cash flow + ROIC, not EBITDA, on this line.`,
    )
  }

  const ebitda: EbitdaBridge = {
    ebitdaBeforeUSD,
    onPremOpexRemovedUSD,
    cloudOpexAddedUSD,
    ebitdaAfterUSD,
    ebitdaDeltaUSD,
    isOpticalDip,
    opticalDipUSD: round0(opticalDipUSD),
  }

  const implementation = repricing.implementationCostUSD ?? 0
  const cashFlow: CashFlowImpact = {
    capexAvoidedAnnualUSD,
    cashCostBeforeUSD,
    cashCostAfterUSD,
    annualFcfImprovementUSD,
    year1FcfImprovementUSD: round0(annualFcfImprovementUSD + capexAvoidedAnnualUSD - implementation),
  }

  // ── Balance sheet / ROIC ─────────────────────────────────────────────────
  // Net book value of IT assets removed ≈ midpoint of a straight-line schedule.
  const ppeReductionUSD = round0(capexPortion * depYears * 0.5)
  const investedCapitalBeforeUSD = round0(firm.investedCapitalUSD ?? revenue * 0.6)
  const investedCapitalAfterUSD = Math.max(1, round0(investedCapitalBeforeUSD - ppeReductionUSD))
  const nopatBefore = ebitdaBeforeUSD * (1 - taxRate)
  const nopatAfter = ebitdaAfterUSD * (1 - taxRate)
  const roicBeforePct = round2((nopatBefore / Math.max(1, investedCapitalBeforeUSD)) * 100)
  const roicAfterPct = round2((nopatAfter / investedCapitalAfterUSD) * 100)

  assumptions.push(
    `${formatUSD(ppeReductionUSD)} of capitalised IT assets leave the balance sheet, cutting invested capital — so ROIC can rise even when EBITDA dips. (NOPAT ≈ EBITDA × (1−tax); WACC hurdle ${round0(wacc * 100)}%.)`,
  )

  const balanceSheet: BalanceSheetImpact = {
    ppeReductionUSD,
    investedCapitalBeforeUSD,
    investedCapitalAfterUSD,
    roicBeforePct,
    roicAfterPct,
    roicDeltaPp: round2(roicAfterPct - roicBeforePct),
  }

  return {
    unit,
    current,
    cloud,
    cloudAi,
    capacityPenaltyPerTxnUSD,
    aiInversionSavingPerTxnUSD,
    annualCostCurrentUSD,
    annualCostCloudAiUSD,
    annualSavingsUSD,
    savingsPerTxnUSD,
    margin,
    ebitda,
    cashFlow,
    balanceSheet,
    assumptions,
  }
}

function deriveEbitdaMarginPct(firm: FirmFinancials): number {
  if (firm.ebitdaMarginPct != null) return firm.ebitdaMarginPct
  if (firm.ebitdaUSD != null && firm.annualRevenueUSD > 0) {
    return (firm.ebitdaUSD / firm.annualRevenueUSD) * 100
  }
  // Rough proxy: EBITDA margin tends to sit well below gross margin once OPEX is removed.
  return Math.max(5, firm.grossMarginPct * 0.4)
}

// ─────────────────────────────────────────────────────────────────────────────
// "FIND YOUR MOST EXPENSIVE REPEATED TRANSACTION"
// ─────────────────────────────────────────────────────────────────────────────

export interface RankedTransaction {
  unit: TransactionUnit
  currentCostPerTxnUSD: number
  annualCostUSD: number
}

/** Rank transactions by total annual cost (cost/txn × volume) — the re-pricing targets. */
export function rankTransactionsByCost(
  units: TransactionUnit[],
  repricing: CloudRepricing,
): RankedTransaction[] {
  return units
    .map((unit) => {
      const cost = currentUnitCost(unit, repricing).totalUSD
      return {
        unit,
        currentCostPerTxnUSD: round2(cost),
        annualCostUSD: round0(cost * Math.max(0, unit.annualVolume)),
      }
    })
    .sort((a, b) => b.annualCostUSD - a.annualCostUSD)
}

// ─────────────────────────────────────────────────────────────────────────────
// NARRATIVE — macro → micro → unit, in CFO language
// ─────────────────────────────────────────────────────────────────────────────

export interface NarrativeLens {
  lens: 'macro' | 'micro' | 'unit'
  title: string
  points: string[]
}

export function buildMacroMicroUnitNarrative(
  result: UnitEconomicsResult,
  firm: FirmFinancials,
  macro: MacroContext,
): NarrativeLens[] {
  const rate =
    macro.interestRateEnv === 'high'
      ? 'High rates make capital expensive — every dollar tied up in owned hardware now carries a heavier opportunity cost, tilting the calculus toward usage-based OPEX.'
      : macro.interestRateEnv === 'low'
        ? 'Low rates make capital cheap, so the CAPEX vs OPEX choice is driven less by financing cost and more by agility and utilisation.'
        : 'A neutral-rate backdrop puts the CAPEX/OPEX decision on agility and utilisation rather than financing cost.'
  const ai =
    macro.aiCycle === 'scaling'
      ? 'We are in the scaling phase of the AI cycle — automation is deflating the cost of repeated cognitive work fastest right now.'
      : macro.aiCycle === 'mature'
        ? 'In a maturing AI cycle, the easy automation is priced in; differentiation comes from applying it to your most expensive proprietary transactions.'
        : 'Early in the AI cycle, first-movers reset their unit cost before competitors — the advantage compounds.'
  const reg =
    macro.regulatoryPressure === 'high'
      ? 'High regulatory pressure pushes compliance cost directly into the unit (often as COGS), so efficiency here moves gross margin.'
      : macro.regulatoryPressure === 'medium'
        ? 'Moderate regulation adds a compliance overhead to each transaction that automation can absorb.'
        : 'Light regulation keeps the unit lean, so the lever is pure operating efficiency.'

  const marginPressure =
    firm.grossMarginPct < 30
      ? `At a ${round0(firm.grossMarginPct)}% gross margin, this is a thin-margin business — a few points of unit-cost relief is material to survival, not just optics.`
      : firm.grossMarginPct < 55
        ? `A ${round0(firm.grossMarginPct)}% gross margin leaves room, but growth pressure means every point defended funds reinvestment.`
        : `A healthy ${round0(firm.grossMarginPct)}% gross margin means the play is protecting premium margin while scaling volume without scaling cost.`

  return [
    {
      lens: 'macro',
      title: 'Macro forces shape the strategy',
      points: [rate, ai, reg],
    },
    {
      lens: 'micro',
      title: 'The firm feels it as margin & growth pressure',
      points: [
        marginPressure,
        'That pressure has to be answered somewhere concrete — not in a slide, but in the cost of the things the business repeats millions of times.',
      ],
    },
    {
      lens: 'unit',
      title: `Expressed in one transaction: ${result.unit.name || 'this transaction'}`,
      points: [
        `Today: ${formatUSD(result.current.totalUSD)}/txn × ${formatNumber(result.unit.annualVolume)}/yr = ${formatUSD(result.annualCostCurrentUSD)} a year.`,
        `Re-priced on Azure usage + AI: ${formatUSD(result.cloudAi.totalUSD)}/txn — a ${formatUSD(result.savingsPerTxnUSD)}/txn saving (${formatUSD(result.annualSavingsUSD)}/yr), of which ${formatUSD(result.capacityPenaltyPerTxnUSD)} is the peak-capacity tax you stop paying and ${formatUSD(result.aiInversionSavingPerTxnUSD)} is labour AI inverts.`,
      ],
    },
  ]
}

/** CFO talking points — the punchline a finance leader can repeat. */
export function buildCfoNarrative(result: UnitEconomicsResult): string[] {
  const m = result.margin
  const e = result.ebitda
  const b = result.balanceSheet
  const points: string[] = []

  points.push(
    `Find the most expensive repeated transaction and re-price it: ${result.unit.name || 'this transaction'} drops from ${formatUSD(result.current.totalUSD)} to ${formatUSD(result.cloudAi.totalUSD)} per unit — that is ${formatUSD(result.annualSavingsUSD)} a year on this one line.`,
  )
  points.push(
    m.marginLine === 'gross'
      ? `Because the cloud cost sits in COGS, ${m.marginDeltaPp >= 0 ? '+' : ''}${m.marginDeltaPp}pp lands straight on gross margin (${m.marginBeforePct}% → ${m.marginAfterPct}%).`
      : `Because the cloud cost sits in general OPEX, gross margin is untouched and the ${m.marginDeltaPp >= 0 ? '+' : ''}${m.marginDeltaPp}pp lands on operating margin (${m.marginBeforePct}% → ${m.marginAfterPct}%).`,
  )
  if (e.isOpticalDip) {
    points.push(
      `Watch the EBITDA optical illusion: reported EBITDA dips ${formatUSD(e.opticalDipUSD)} because capitalised hardware (added back, above EBITDA) becomes cloud OPEX (inside EBITDA). A naive read says "this hurts"; it doesn't.`,
    )
    points.push(
      `Cash tells the truth: free cash flow improves ${formatUSD(result.cashFlow.annualFcfImprovementUSD)}/yr (plus ${formatUSD(result.cashFlow.capexAvoidedAnnualUSD)} of CAPEX avoided), ${formatUSD(b.ppeReductionUSD)} of IT assets leave the balance sheet, and ROIC rises ${b.roicDeltaPp >= 0 ? '+' : ''}${b.roicDeltaPp}pp (${b.roicBeforePct}% → ${b.roicAfterPct}%). CAPEX→OPEX lowers reported EBITDA even while it improves cash and returns.`,
    )
  } else {
    points.push(
      `EBITDA moves ${e.ebitdaDeltaUSD >= 0 ? '+' : ''}${formatUSD(e.ebitdaDeltaUSD)}; free cash flow improves ${formatUSD(result.cashFlow.annualFcfImprovementUSD)}/yr and ROIC rises ${b.roicDeltaPp >= 0 ? '+' : ''}${b.roicDeltaPp}pp as ${formatUSD(b.ppeReductionUSD)} of IT assets leave the balance sheet.`,
    )
  }
  return points
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

export function formatUSD(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(2)}`
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${Math.round(n)}`
}

/** A blank/neutral starting transaction. */
export function emptyTransactionUnit(): TransactionUnit {
  return {
    id: `txn-${Date.now()}`,
    name: '',
    annualVolume: 0,
    laborCostPerTxn: 0,
    infraCostPerTxn: 0,
    softwareCostPerTxn: 0,
    otherCostPerTxn: 0,
  }
}
