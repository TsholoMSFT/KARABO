/**
 * Cost-optimization service
 * ----------------------------------------------------------------------------
 * Sends a portfolio of use cases + run-cost line items to the AI router
 * (gpt-4o-mini) and parses back a structured list of optimisation
 * recommendations: SKU swaps, capacity rightsizing, reservation /
 * commitment opportunities, and architecture-level efficiency wins.
 *
 * The AI is asked to produce JSON we can render directly.
 */

import type { UseCase } from '@/lib/types'
import { callAIForTask } from '@/lib/openai-service'

export interface CostOptimization {
  id: string
  category:
    | 'sku-swap'
    | 'rightsize'
    | 'reservation'
    | 'serverless-shift'
    | 'caching'
    | 'storage-tier'
    | 'consolidation'
    | 'other'
  title: string
  rationale: string
  affectedUseCases?: string[]
  monthlySavingUSD?: number
  annualSavingUSD?: number
  effort: 'low' | 'medium' | 'high'
  confidence: 'low' | 'medium' | 'high'
  riskNotes?: string
}

export interface CostOptimizationReport {
  summary: string
  totalAnnualSavingUSD: number
  recommendations: CostOptimization[]
  generatedAt: number
}

/**
 * Build a compact JSON snapshot the model can reason over.
 * Strips noisy fields (KPIs, descriptions etc.) and keeps cost-relevant data.
 */
function snapshot(useCases: UseCase[]) {
  return useCases
    .filter((u) => u.runCost?.totalMonthlyUSD)
    .map((u) => ({
      id: u.id,
      title: u.title,
      monthlyUSD: u.runCost!.totalMonthlyUSD,
      annualUSD: u.runCost!.totalAnnualUSD,
      implUSD: u.runCost!.oneTimeImplementationUSD,
      assumptions: u.runCost!.assumptions?.slice(0, 6),
      activeUsers: u.runCost!.inputs?.activeUsers,
      txns: u.runCost!.inputs?.monthlyTransactions,
      region: u.runCost!.inputs?.region,
      stack: (u as any).microsoftSolutions?.slice(0, 8),
    }))
}

const SYSTEM_PROMPT = `
You are a senior Azure FinOps + cost-optimization architect. Your job is to
review a portfolio of AI/data/app workloads and recommend cost reductions
without sacrificing functional fit. Be concrete: name specific SKUs, capacity
units, or commitments. Quantify savings in USD/year using realistic ratios
(typical reservation savings 30–55%; typical rightsize 20–40%; typical
serverless shift 30–60% for spiky workloads). Only suggest things that are
true to the supplied data — do not invent workloads.
`.trim()

const USER_TEMPLATE = (data: object) => `
Workload portfolio:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

Return STRICT JSON matching this TypeScript type:
{
  "summary": string,
  "totalAnnualSavingUSD": number,
  "recommendations": Array<{
    "id": string,
    "category": "sku-swap" | "rightsize" | "reservation" | "serverless-shift" | "caching" | "storage-tier" | "consolidation" | "other",
    "title": string,
    "rationale": string,
    "affectedUseCases": string[],
    "monthlySavingUSD": number,
    "annualSavingUSD": number,
    "effort": "low" | "medium" | "high",
    "confidence": "low" | "medium" | "high",
    "riskNotes": string
  }>
}

Rules:
- 3–7 recommendations max, ordered by annualSavingUSD desc.
- "affectedUseCases" must contain ids that appear in the input.
- Sum of annualSavingUSD across recommendations must equal totalAnnualSavingUSD.
- Output ONLY the JSON object, no markdown.
`.trim()

export async function analyzeCostOptimizations(
  useCases: UseCase[],
): Promise<CostOptimizationReport> {
  const data = snapshot(useCases)
  if (!data.length) {
    return {
      summary: 'No use cases have run-cost estimates yet. Estimate run cost on at least one use case to enable optimisation analysis.',
      totalAnnualSavingUSD: 0,
      recommendations: [],
      generatedAt: Date.now(),
    }
  }

  const raw = await callAIForTask('cost-optimization', USER_TEMPLATE(data), {
    expectJson: true,
    systemPrompt: SYSTEM_PROMPT,
  })

  let parsed: any
  try {
    // Tolerate accidental ```json fences
    const cleaned = raw.replace(/^\s*```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    parsed = JSON.parse(cleaned)
  } catch (err) {
    throw new Error(`Cost optimisation AI returned invalid JSON: ${(err as Error).message}`)
  }

  const recs: CostOptimization[] = Array.isArray(parsed?.recommendations)
    ? parsed.recommendations.map((r: any, i: number) => ({
        id: String(r.id || `rec-${i + 1}`),
        category: (r.category || 'other') as CostOptimization['category'],
        title: String(r.title || 'Optimisation'),
        rationale: String(r.rationale || ''),
        affectedUseCases: Array.isArray(r.affectedUseCases) ? r.affectedUseCases.map(String) : [],
        monthlySavingUSD: Number(r.monthlySavingUSD) || undefined,
        annualSavingUSD: Number(r.annualSavingUSD) || 0,
        effort: (['low', 'medium', 'high'] as const).includes(r.effort) ? r.effort : 'medium',
        confidence: (['low', 'medium', 'high'] as const).includes(r.confidence) ? r.confidence : 'medium',
        riskNotes: r.riskNotes ? String(r.riskNotes) : undefined,
      }))
    : []

  const total = recs.reduce((s, r) => s + (r.annualSavingUSD || 0), 0)

  return {
    summary: String(parsed?.summary || ''),
    totalAnnualSavingUSD: Number(parsed?.totalAnnualSavingUSD) || total,
    recommendations: recs,
    generatedAt: Date.now(),
  }
}
