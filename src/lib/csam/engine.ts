/**
 * CSAM cockpit generation engine (Sections 4, 8, 9).
 *
 * AI-backed generators (value hypothesis, CSDR narrative, behavioural insights)
 * plus a deterministic Next-Best-Action engine. Every AI call is wrapped with
 * the non-blaming CSAM system prompt and a deterministic fallback so the UI
 * never breaks when the model is unavailable.
 */
import { callAIForTask } from '@/lib/openai-service'
import {
  ADOPTION_STAGE_LABELS,
  BEHAVIOURAL_BLOCKER_LABELS,
  type ActionPlan,
  type BehaviouralBlockerId,
  type BehaviouralBlockerInsight,
  type CsamConfidence,
  type CsamCustomerProfile,
  type ValueHypothesisInput,
  type ValueHypothesisOutputs,
} from './types'
import { CSAM_NARRATIVE_SYSTEM_PROMPT } from './guardrails'
import {
  biggestLeakStage,
  computeAllScores,
  computeFinancialImpactConfidence,
  computeHealthScore,
  topValueGaps,
} from './scoring'

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// ----------------------------------------------------------------------------
// SECTION 4 — Value Hypothesis Builder
// ----------------------------------------------------------------------------

export async function generateValueHypothesis(
  input: ValueHypothesisInput,
  ctx: { customerName?: string; industry?: string } = {},
): Promise<ValueHypothesisOutputs> {
  const prompt = `Build a CSAM value hypothesis for ${ctx.customerName ?? 'the customer'}${
    ctx.industry ? ` (${ctx.industry})` : ''
  }.

INPUT:
- Investment: ${input.investment}
- Problem it was meant to solve: ${input.problem}
- Business process that should change: ${input.process}
- Persona/team that must adopt: ${input.persona}
- Metric that should improve: ${input.metric}
- Financial statement line that should move: ${input.financialLine}
- Usage / adoption evidence: ${input.usageEvidence ?? 'none provided'}
- Operational health evidence: ${input.healthEvidence ?? 'none provided'}
- Support/incident pattern: ${input.supportPattern ?? 'none provided'}
- Suspected behavioural blocker: ${
    input.behaviouralBlocker ? BEHAVIOURAL_BLOCKER_LABELS[input.behaviouralBlocker] : 'unknown'
  }
- Estimated value gap (USD): ${input.estimatedValueGapUSD ?? 'unknown'}
- Unlocking action idea: ${input.unlockingAction ?? 'none provided'}
- Sponsor: ${input.sponsor ?? 'unknown'}

Return JSON:
{
  "statement": "<one concise value hypothesis statement>",
  "csdrNarrative": "<2-3 sentence executive, CSDR-ready narrative>",
  "behaviouralHypothesis": "<1-2 sentences on the likely adoption blocker and why>",
  "interventionPlan": "<the recommended intervention to unlock value>",
  "plan306090": { "d30": ["..."], "d60": ["..."], "d90": ["..."] }
}
Remember: financial impact is a hypothesis to validate, never realised value. Use joint, non-blaming language.`

  try {
    const raw = await callAIForTask('analysis', prompt, {
      expectJson: true,
      systemPrompt: CSAM_NARRATIVE_SYSTEM_PROMPT,
    })
    const p = JSON.parse(raw) as Partial<ValueHypothesisOutputs> & {
      plan306090?: { d30?: unknown; d60?: unknown; d90?: unknown }
    }
    const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [])
    return {
      statement: typeof p.statement === 'string' ? p.statement : fallbackHypothesis(input).statement,
      csdrNarrative: typeof p.csdrNarrative === 'string' ? p.csdrNarrative : fallbackHypothesis(input).csdrNarrative,
      behaviouralHypothesis:
        typeof p.behaviouralHypothesis === 'string'
          ? p.behaviouralHypothesis
          : fallbackHypothesis(input).behaviouralHypothesis,
      interventionPlan:
        typeof p.interventionPlan === 'string' ? p.interventionPlan : fallbackHypothesis(input).interventionPlan,
      plan306090: {
        d30: arr(p.plan306090?.d30).length ? arr(p.plan306090?.d30) : fallbackHypothesis(input).plan306090.d30,
        d60: arr(p.plan306090?.d60).length ? arr(p.plan306090?.d60) : fallbackHypothesis(input).plan306090.d60,
        d90: arr(p.plan306090?.d90).length ? arr(p.plan306090?.d90) : fallbackHypothesis(input).plan306090.d90,
      },
    }
  } catch (err) {
    console.error('[CSAM] value hypothesis generation failed; using fallback', err)
    return fallbackHypothesis(input)
  }
}

function fallbackHypothesis(input: ValueHypothesisInput): ValueHypothesisOutputs {
  const blocker = input.behaviouralBlocker ? BEHAVIOURAL_BLOCKER_LABELS[input.behaviouralBlocker] : 'workflow integration'
  return {
    statement: `The customer invested in ${input.investment} to ${input.problem}. Current usage indicates ${
      input.usageEvidence ?? 'adoption is below the investment thesis'
    }. If the gap in ${input.process} is closed, the expected financial impact would likely appear in ${
      input.financialLine
    } via improvements to ${input.metric}.`,
    csdrNarrative: `There appears to be unrealised value in ${input.investment}. The original investment thesis can be strengthened by helping ${input.persona} adopt the new way of working in ${input.process}, with success measured by ${input.metric}.`,
    behaviouralHypothesis: `The likely blocker is ${blocker}; adoption tends to stall when the capability is not embedded where ${input.persona} actually work.`,
    interventionPlan:
      input.unlockingAction ??
      `Validate the blocker with the business owner, then run a role-based adoption plan for ${input.persona} and reinforce it through manager-led routines.`,
    plan306090: {
      d30: [
        `Validate the value hypothesis with ${input.sponsor ?? 'the business + finance owner'}`,
        'Confirm the baseline for ' + input.metric,
      ],
      d60: [`Run a role-based adoption play for ${input.persona}`, 'Embed the capability into ' + input.process],
      d90: [`Review ${input.metric} movement at the next CSDR`, 'Agree the financial validation step with finance'],
    },
  }
}

// ----------------------------------------------------------------------------
// SECTION 8 — CSDR-ready narrative generator
// ----------------------------------------------------------------------------

export async function generateCsdrNarrative(p: CsamCustomerProfile): Promise<string> {
  const scores = computeAllScores(p)
  const scoreLines = scores.map((s) => `- ${s.label}: ${s.score}/100 (${s.colorState}, ${s.confidence})`).join('\n')
  const gaps = topValueGaps(p).map((g) => `- ${g}`).join('\n')
  const leak = biggestLeakStage(p)

  const prompt = `Write a CSDR (Customer Success Delivery Review) ready narrative for ${p.name}${
    p.industry ? ` (${p.industry})` : ''
  }.

SCORES:
${scoreLines}

TOP VALUE GAPS:
${gaps || '- none material'}

BIGGEST VALUE LEAK: ${leak ? `${leak.label} (${leak.dropoffPct}% drop-off)` : 'none'}

EXECUTIVE PRIORITIES: ${(p.executivePriorities ?? []).join('; ') || 'unknown'}

Produce markdown with these sections, each 1-3 sentences, customer-centric and non-accusatory:
1. Executive summary
2. Current state
3. Value realised
4. Value at risk
5. Unrealised value
6. Financial impact hypothesis (clearly labelled as hypothesis to validate)
7. Health / resiliency concerns
8. Behavioural adoption blockers
9. Decisions required
10. Next-step action plan`

  try {
    const md = await callAIForTask('executive', prompt, { systemPrompt: CSAM_NARRATIVE_SYSTEM_PROMPT })
    if (md && md.trim().length > 40) return md
  } catch (err) {
    console.error('[CSAM] CSDR narrative generation failed; using fallback', err)
  }
  return fallbackCsdr(p, scoreLines, gaps, leak?.label)
}

function fallbackCsdr(
  p: CsamCustomerProfile,
  scoreLines: string,
  gaps: string,
  leakLabel?: string,
): string {
  return `## Customer Success Delivery Review \u2014 ${p.name}

### 1. Executive summary
Joint review of value realisation across ${p.investments.length} tracked investments. There appears to be unrealised value we can unlock together.

### 2. Current state
${p.useCases.length} use cases in flight. Scores:
${scoreLines}

### 3. Value realised
${
    p.useCases.filter((u) => u.adoptionStage === 'exec-recognised' || u.adoptionStage === 'financial-validated').length
  } use case(s) show validated or executive-recognised value.

### 4. Value at risk
${gaps || 'No material value at risk identified from current evidence.'}

### 5. Unrealised value
Adoption appears to stall around "${leakLabel ?? 'embedding in workflow'}"; closing this would unlock value already paid for.

### 6. Financial impact hypothesis
Mapped financial impacts are hypotheses to validate with your finance owner \u2014 not yet realised value.

### 7. Health / resiliency concerns
${p.healthSignals.filter((h) => h.status === 'red').map((h) => `- ${h.dimension}`).join('\n') || '- None critical.'}

### 8. Behavioural adoption blockers
${
    [...new Set(p.adoption.flatMap((d) => d.blockers))]
      .map((b) => `- ${BEHAVIOURAL_BLOCKER_LABELS[b]}`)
      .join('\n') || '- None identified.'
  }

### 9. Decisions required
- Confirm the value hypotheses to validate this quarter.
- Agree owners for the top adoption-recovery plays.

### 10. Next-step action plan
${p.actions.slice(0, 5).map((a) => `- ${a.recommendation}`).join('\n') || '- See Next Best Action recommendations.'}`
}

// ----------------------------------------------------------------------------
// SECTION 5 — behavioural blocker insight (deterministic library)
// ----------------------------------------------------------------------------

const BLOCKER_INSIGHTS: Record<BehaviouralBlockerId, Omit<BehaviouralBlockerInsight, 'blocker'>> = {
  'low-awareness': {
    likelyRootCause: 'Users do not know why the capability matters to their role.',
    evidenceToLookFor: 'Low first-run rates; "what is this?" support tickets.',
    customerQuestion: 'Do your teams know which problems this is meant to solve for them?',
    recommendedIntervention: 'Run a role-based awareness campaign tied to real tasks.',
    stakeholderOwner: 'Business owner',
  },
  'poor-training-relevance': {
    likelyRootCause: 'Training is generic, not tied to the user\u2019s actual workflow.',
    evidenceToLookFor: 'High training completion but low sustained usage.',
    customerQuestion: 'Is enablement built around your real day-to-day scenarios?',
    recommendedIntervention: 'Replace generic training with scenario-based, in-flow enablement.',
    stakeholderOwner: 'Enablement lead',
  },
  'weak-manager-reinforcement': {
    likelyRootCause: 'Managers are not reinforcing or modelling the new behaviour.',
    evidenceToLookFor: 'Usage varies sharply by team/manager.',
    customerQuestion: 'Are managers expected to use and reinforce this themselves?',
    recommendedIntervention: 'Add usage to manager routines and team rituals.',
    stakeholderOwner: 'People manager',
  },
  'no-workflow-redesign': {
    likelyRootCause: 'The process was never redesigned around the new capability.',
    evidenceToLookFor: 'Old and new tools used in parallel.',
    customerQuestion: 'Has the underlying process been redesigned, or just augmented?',
    recommendedIntervention: 'Redesign the target process so the new way is the default.',
    stakeholderOwner: 'Process owner',
  },
  'tool-not-embedded': {
    likelyRootCause: 'The capability lives outside where work actually happens.',
    evidenceToLookFor: 'Users switch context to use it; low in-flow usage.',
    customerQuestion: 'Is this available inside the tools your teams already use?',
    recommendedIntervention: 'Embed the capability into the primary workflow surface.',
    stakeholderOwner: 'Technical owner',
  },
  'data-trust-issue': {
    likelyRootCause: 'Users do not trust the data or AI output.',
    evidenceToLookFor: 'Users double-check or ignore outputs.',
    customerQuestion: 'Do your users trust the outputs enough to act on them?',
    recommendedIntervention: 'Improve grounding/citations and run a trust-building pilot.',
    stakeholderOwner: 'Data owner',
  },
  'security-compliance-fear': {
    likelyRootCause: 'Perceived security or compliance risk discourages use.',
    evidenceToLookFor: 'Usage blocked in regulated teams.',
    customerQuestion: 'Are there security or compliance concerns holding teams back?',
    recommendedIntervention: 'Publish clear data-handling guidance and approved patterns.',
    stakeholderOwner: 'Security / compliance',
  },
  'lack-exec-sponsorship': {
    likelyRootCause: 'No visible executive sponsor driving the change.',
    evidenceToLookFor: 'No top-down goals or communication.',
    customerQuestion: 'Who at the executive level owns this outcome?',
    recommendedIntervention: 'Secure a named executive sponsor and a stated outcome.',
    stakeholderOwner: 'Executive sponsor',
  },
  'incentives-reward-old': {
    likelyRootCause: 'Existing incentives reward the old behaviour.',
    evidenceToLookFor: 'KPIs unchanged after rollout.',
    customerQuestion: 'Do current incentives reward the new way of working?',
    recommendedIntervention: 'Align goals/KPIs to the new behaviour.',
    stakeholderOwner: 'Business owner',
  },
  'perceived-productivity-tax': {
    likelyRootCause: 'Users feel the new way is slower in the short term.',
    evidenceToLookFor: 'Early-adopter drop-off after first use.',
    customerQuestion: 'Does this feel faster or slower for your teams today?',
    recommendedIntervention: 'Optimise the first-run experience and surface quick wins.',
    stakeholderOwner: 'Enablement lead',
  },
  'change-fatigue': {
    likelyRootCause: 'Too many concurrent changes are competing for attention.',
    evidenceToLookFor: 'Multiple overlapping initiatives.',
    customerQuestion: 'How much change are your teams absorbing right now?',
    recommendedIntervention: 'Sequence the rollout and reduce competing asks.',
    stakeholderOwner: 'Change lead',
  },
  'unclear-wiifm': {
    likelyRootCause: 'The personal benefit ("what\u2019s in it for me") is unclear.',
    evidenceToLookFor: 'Indifference in user feedback.',
    customerQuestion: 'What would make this clearly worth it for each user?',
    recommendedIntervention: 'Articulate role-specific benefits and celebrate wins.',
    stakeholderOwner: 'Business owner',
  },
}

export function blockerInsight(blocker: BehaviouralBlockerId): BehaviouralBlockerInsight {
  return { blocker, ...BLOCKER_INSIGHTS[blocker] }
}

// ----------------------------------------------------------------------------
// SECTION 9 — deterministic Next-Best-Action engine
// ----------------------------------------------------------------------------

export function recommendNextBestActions(p: CsamCustomerProfile): ActionPlan[] {
  const actions: ActionPlan[] = []
  const push = (a: Omit<ActionPlan, 'id' | 'customerId' | 'status'>) =>
    actions.push({ id: uid('act'), customerId: p.customerId, status: 'proposed', ...a })

  // 1. Critical health → remediation
  for (const h of p.healthSignals.filter((s) => s.riskLevel === 'critical' || s.status === 'red')) {
    push({
      recommendation: h.recommendation ?? `Initiate a review of ${h.dimension}`,
      why: 'A critical health signal is putting realised value and renewal at risk.',
      evidence: h.businessImpact ?? `${h.dimension} is red`,
      expectedImpact: 'Protect realised value and reduce risk to renewal.',
      financialLine: h.financialExposure ?? 'Security / compliance / risk cost',
      stakeholders: [h.customerOwner ?? 'Customer technical owner', h.microsoftOwner ?? 'CSA'],
      talkTrack: `We have spotted a resiliency/security risk in ${h.dimension}; let\u2019s stabilise it together before it affects outcomes.`,
      successMetric: 'Health dimension returns to green',
      timeframe: 'now',
      confidence: 'medium',
      priority: 'high',
      relatedCsdr: h.includeInCsdr ? h.dimension : undefined,
    })
  }

  // 2. Large adoption gaps → adoption recovery
  for (const uc of p.useCases) {
    const usage = p.usageSignals.find((u) => u.investmentId === uc.linkedInvestmentId)
    const gap = usage?.adoptionGapPct ?? 0
    if (gap >= 40) {
      const blocker = uc.behaviouralBarriers?.[0]
      push({
        recommendation: `Trigger a role-based adoption play for ${uc.name}`,
        why: `~${Math.round(gap)}% of the purchased capability is unused (${ADOPTION_STAGE_LABELS[uc.adoptionStage]}).`,
        evidence: `Usage trend: ${usage?.usageTrend ?? 'unknown'}; intensity ${usage?.intensityScore ?? '?'} / 100.`,
        expectedImpact: 'Convert paid-for capacity into active, embedded usage.',
        financialLine: 'G&A productivity (cost-to-serve)',
        stakeholders: ['Business owner', 'CSAM'],
        talkTrack: blocker
          ? `Adoption appears to stall on ${BEHAVIOURAL_BLOCKER_LABELS[blocker]}; let\u2019s tackle that specifically.`
          : 'Let\u2019s close the gap between what is licensed and what is actively used.',
        successMetric: 'Adoption gap reduced by half',
        timeframe: 'next-quarter',
        confidence: usage?.confidence ?? 'low',
        priority: 'high',
        useCaseId: uc.id,
      })
    }
  }

  // 3. Unvalidated financial impact → validate with finance
  if (computeFinancialImpactConfidence(p).score < 60 && p.financialImpacts.length > 0) {
    push({
      recommendation: 'Validate the top value hypotheses with the customer\u2019s finance owner',
      why: 'Most mapped financial impact is still a hypothesis, not customer-validated.',
      evidence: `${p.financialImpacts.filter((f) => f.validationStatus === 'hypothesis').length} of ${p.financialImpacts.length} lines unvalidated.`,
      expectedImpact: 'Move value from hypothesis to customer-validated, strengthening the renewal narrative.',
      financialLine: p.financialImpacts[0]?.lineItem,
      stakeholders: ['Finance owner', 'CSAM'],
      talkTrack: 'We have a hypothesis for where value should show up financially \u2014 can we validate it against your numbers?',
      successMetric: 'At least one financial line customer-validated',
      timeframe: 'next-csdr',
      confidence: 'medium',
      priority: 'medium',
    })
  }

  // 4. Proven value → expansion narrative
  for (const uc of p.useCases.filter((u) => u.adoptionStage === 'financial-validated' || u.adoptionStage === 'exec-recognised')) {
    push({
      recommendation: `Prepare an expansion / replication narrative for ${uc.name}`,
      why: 'Value is proven \u2014 a strong base to expand or replicate to adjacent teams.',
      expectedImpact: 'Grow realised value and consumption on a validated foundation.',
      financialLine: 'Revenue / productivity uplift',
      stakeholders: ['AE', 'CSAM', 'Specialist'],
      talkTrack: 'This is working well \u2014 where else in the business could we replicate the same outcome?',
      successMetric: 'Expansion opportunity identified',
      timeframe: 'renewal-cycle',
      confidence: 'medium',
      priority: 'medium',
      useCaseId: uc.id,
    })
  }

  // 5. Always offer a CSDR checkpoint if nothing urgent
  if (actions.length === 0) {
    push({
      recommendation: 'Schedule a CSDR to align on the value hypotheses and Success Plan',
      why: 'Evidence is thin; a structured review will surface the right signals.',
      expectedImpact: 'Establish baselines and agree the value-realisation plan.',
      stakeholders: ['CSAM', 'Business owner'],
      successMetric: 'Updated Customer Success Plan',
      timeframe: 'next-csdr',
      confidence: 'low',
      priority: 'medium',
    })
  }

  const order = { high: 0, medium: 1, low: 2 }
  return actions.sort((a, b) => order[a.priority ?? 'low'] - order[b.priority ?? 'low'])
}

export function overallConfidence(p: CsamCustomerProfile): CsamConfidence {
  return computeHealthScore(p).confidence
}
