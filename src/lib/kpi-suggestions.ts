import { callAIForTask } from './openai-service'
import { AVAILABLE_KPIS } from './kpis'
import { parseJsonLenient } from './lenient-json'

export interface SuggestKPIIdsInput {
  title: string
  description?: string
  expectedBenefits?: string
  existingSelectedKpiIds?: string[]
  maxSuggestions?: number
}

function normalizeIdList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  return []
}

export async function suggestKPIIdsForUseCase(input: SuggestKPIIdsInput): Promise<string[]> {
  const title = input.title?.trim()
  const description = input.description?.trim()
  const expectedBenefits = input.expectedBenefits?.trim()

  if (!title && !description && !expectedBenefits) return []

  const maxSuggestions = Math.max(1, Math.min(input.maxSuggestions ?? 6, 10))
  const existing = new Set((input.existingSelectedKpiIds ?? []).map((s) => s.trim()).filter(Boolean))

  const catalog = AVAILABLE_KPIS.map((k) => ({
    id: k.id,
    name: k.name,
    category: k.category,
    description: k.description,
  }))

  const prompt = `You are helping a user select KPIs from a fixed KPI catalog for a specific business use case.

USE CASE
- Title: ${title || '(none)'}
- Description: ${description || '(none)'}
- Expected benefits: ${expectedBenefits || '(none)'}

KPI CATALOG (choose only from these IDs)
${JSON.stringify(catalog, null, 2)}

ALREADY SELECTED KPI IDS
${JSON.stringify(Array.from(existing), null, 2)}

TASK
Select up to ${maxSuggestions} KPI IDs that best measure impact for this use case.

RULES
- Return ONLY valid KPI IDs from the catalog.
- Prefer KPI IDs that are NOT already selected.
- Do not invent new KPIs.
- If nothing fits, return an empty array.

OUTPUT (strict JSON)
{"kpiIds":["..."],"rationale":"optional short note"}`

  const raw = await callAIForTask('analysis', prompt, {
    expectJson: true,
    systemPrompt: 'Return only strict JSON. No markdown. No prose outside JSON.',
  })

  const parsed = parseJsonLenient<any>(raw)

  const candidateIds = Array.isArray(parsed)
    ? normalizeIdList(parsed)
    : normalizeIdList(parsed?.kpiIds ?? parsed?.kpis ?? parsed?.ids)

  const allowed = new Set(AVAILABLE_KPIS.map((k) => k.id))

  const filtered: string[] = []
  for (const id of candidateIds) {
    const trimmed = id.trim()
    if (!trimmed) continue
    if (!allowed.has(trimmed)) continue
    if (existing.has(trimmed)) continue
    if (filtered.includes(trimmed)) continue
    filtered.push(trimmed)
    if (filtered.length >= maxSuggestions) break
  }

  return filtered
}
