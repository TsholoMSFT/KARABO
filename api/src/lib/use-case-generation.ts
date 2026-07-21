import { z } from "zod";

export const discoveryEvidenceSchema = z.object({
  source: z.enum(["discovery", "company-research", "earnings", "financials", "news", "industry-research"]),
  title: z.string().trim().max(160).optional(),
  content: z.string().trim().min(1).max(4_000),
});

export const useCaseGenerationRequestSchema = z.object({
  customerName: z.string().trim().min(1).max(160),
  industry: z.string().trim().min(1).max(100),
  jurisdiction: z.string().trim().max(100).optional(),
  businessFunctions: z.array(z.string().trim().min(1).max(100)).max(12).default([]),
  targetKpis: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  desiredOutcomes: z.string().trim().max(2_000).optional(),
  responses: z.array(z.object({
    question: z.string().trim().min(1).max(1_000),
    answer: z.string().trim().min(1).max(4_000),
  })).max(60),
  evidence: z.array(discoveryEvidenceSchema).max(40).default([]),
}).superRefine((input, context) => {
  if (input.responses.length === 0 && input.evidence.length === 0) {
    context.addIssue({
      code: "custom",
      message: "At least one discovery response or evidence item is required.",
      path: ["responses"],
    });
  }
});

export const generatedUseCaseCandidateSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(20).max(1_000),
  rationale: z.string().trim().min(10).max(800),
  businessFunction: z.string().trim().min(1).max(100),
  expectedOutcomes: z.array(z.string().trim().min(1).max(240)).min(1).max(6),
  kpis: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
  strategicAlignment: z.object({
    primaryPriority: z.string().trim().min(1).max(200),
    alignmentScore: z.number().int().min(1).max(10),
    rationale: z.string().trim().min(10).max(500),
  }),
  processContext: z.object({
    processName: z.string().trim().min(1).max(160),
    painPoints: z.array(z.string().trim().min(1).max(240)).min(1).max(6),
    proposedImprovement: z.string().trim().min(10).max(500),
  }),
  preliminaryRisk: z.object({
    level: z.enum(["low", "medium", "high"]),
    notes: z.string().trim().min(5).max(500),
  }),
  complexity: z.object({
    level: z.enum(["low", "medium", "high", "very-high"]),
    rationale: z.string().trim().min(5).max(500),
  }),
});

export const generatedUseCaseCandidatesSchema = z.object({
  useCases: z.array(generatedUseCaseCandidateSchema).min(5).max(8),
});

export type UseCaseGenerationRequest = z.infer<typeof useCaseGenerationRequestSchema>;
export type GeneratedUseCaseCandidate = z.infer<typeof generatedUseCaseCandidateSchema>;

export interface CandidateCompletionResult {
  content: string;
  provider: string;
  model: string;
  deployment?: string;
  correlationId: string;
}

export type CandidateCompletion = (
  prompt: string,
  options: { task: "use-case-generation"; expectJson: true; systemPrompt: string },
) => Promise<CandidateCompletionResult>;

function formatContext(input: UseCaseGenerationRequest): string {
  const responses = input.responses
    .map((response, index) => `${index + 1}. Q: ${response.question}\n   A: ${response.answer}`)
    .join("\n");
  const evidence = input.evidence.length
    ? input.evidence
        .map((item, index) => `${index + 1}. [${item.source}] ${item.title ? `${item.title}: ` : ""}${item.content}`)
        .join("\n")
    : "No external evidence was available. Ground recommendations in the discovery responses only.";

  return `CUSTOMER: ${input.customerName}
INDUSTRY: ${input.industry}
JURISDICTION: ${input.jurisdiction || "Not provided"}
BUSINESS FUNCTIONS: ${input.businessFunctions.join(", ") || "Enterprise-wide"}
TARGET KPIS: ${input.targetKpis.join(", ") || "Infer from discovery"}
DESIRED OUTCOMES: ${input.desiredOutcomes || "Infer from discovery"}

DISCOVERY RESPONSES:
${responses}

EVIDENCE:
${evidence}`;
}

export function buildUseCaseCandidatePrompt(input: UseCaseGenerationRequest): string {
  return `You are a Microsoft Innovation Hub consultant. Generate 5 to 8 distinct, practical use-case candidates from the structured context below.

This is the candidate-development stage before scoring. Focus on business problem, outcome, evidence, affected process, preliminary risk, and rough complexity.

Do not recommend Microsoft products, services, reference architectures, hosting targets, or agent orchestration yet. Detailed solution mapping happens only after the candidates are ranked.

${formatContext(input)}

Return one JSON object with a useCases array. Every item must contain exactly these fields:
- title
- description
- rationale
- businessFunction
- expectedOutcomes (1-6 strings)
- kpis (1-8 strings)
- strategicAlignment: primaryPriority, alignmentScore (1-10 integer), rationale
- processContext: processName, painPoints (1-6 strings), proposedImprovement
- preliminaryRisk: level (low|medium|high), notes
- complexity: level (low|medium|high|very-high), rationale

Make candidates materially different from each other. Tie each rationale to discovery or named evidence. Return JSON only.`;
}

function parseCandidates(content: string) {
  return generatedUseCaseCandidatesSchema.safeParse(JSON.parse(content));
}

export async function generateUseCaseCandidates(
  rawInput: unknown,
  complete: CandidateCompletion,
): Promise<{ useCases: GeneratedUseCaseCandidate[]; metadata: Omit<CandidateCompletionResult, "content"> }> {
  const input = useCaseGenerationRequestSchema.parse(rawInput);
  const prompt = buildUseCaseCandidatePrompt(input);
  const options = {
    task: "use-case-generation" as const,
    expectJson: true as const,
    systemPrompt: "Return only valid JSON matching the requested schema. Do not include markdown fences or solution mappings.",
  };

  let completion = await complete(prompt, options);
  let parsed;
  try {
    parsed = parseCandidates(completion.content);
  } catch {
    parsed = { success: false as const, error: null };
  }

  if (!parsed.success) {
    const correctionPrompt = `${prompt}\n\nYour previous response failed schema validation. Return a corrected JSON object only. It must contain 5 to 8 complete useCases and no solution-mapping fields.`;
    completion = await complete(correctionPrompt, options);
    try {
      parsed = parseCandidates(completion.content);
    } catch {
      parsed = { success: false as const, error: null };
    }
  }

  if (!parsed.success) {
    throw new Error("INVALID_MODEL_OUTPUT");
  }

  const { content: _content, ...metadata } = completion;
  return { useCases: parsed.data.useCases, metadata };
}