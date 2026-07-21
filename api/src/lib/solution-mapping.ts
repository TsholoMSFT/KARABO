import { z } from "zod";

const productFamilySchema = z.enum([
  "azure-ai",
  "azure-data",
  "azure-infrastructure",
  "power-platform",
  "microsoft-365",
  "dynamics-365",
  "microsoft-fabric",
  "microsoft-security",
]);

const referenceArchitectureSchema = z.enum([
  "conversational-ai",
  "document-processing",
  "predictive-analytics",
  "iot-telemetry",
  "digital-twin",
  "knowledge-mining",
  "process-automation",
  "customer-360",
  "supply-chain-optimization",
  "fraud-detection",
  "content-generation",
  "code-assistant",
  "agentic-ai",
]);

const regulationSchema = z.enum([
  "oecd-ai-principles", "unesco-ai-ethics", "iso-42001", "eu-ai-act", "gdpr",
  "nist-ai-rmf", "white-house-eo", "ccpa", "hipaa", "sox", "ferpa", "glba",
  "au-ai-strategy", "au-data-policy", "smart-africa", "sa-ai-policy-draft", "popia",
  "ecta", "dmre", "sahpra", "dora", "nis2", "fedramp", "finra", "cpra",
  "fda-samd", "soc2", "iso-27001", "msha", "epa", "osha", "nerc-cip",
  "pci-dss", "au-ai-ethics-framework", "brazil-lgpd", "brazil-ai-bill",
  "singapore-ai-governance", "uk-ai-regulation", "canada-aida", "japan-ai-strategy",
  "india-dpdp", "uae-ai-strategy", "kenya-dpa", "nigeria-ndpr",
  "china-ai-regulations", "ms-responsible-ai", "ms-ai-principles",
  "ms-copilot-governance", "other",
]);

const securityRequirementSchema = z.enum([
  "encryption-at-rest", "encryption-in-transit", "access-control", "audit-logging",
  "penetration-testing", "vulnerability-scanning", "data-masking", "mfa-required",
  "soc2-compliance", "iso27001", "zero-trust", "air-gapped", "on-premises-only",
  "scada-protection",
]);

export const solutionMappingRequestSchema = z.object({
  customerName: z.string().trim().min(1).max(160),
  industry: z.string().trim().min(1).max(100),
  jurisdiction: z.string().trim().max(100).optional(),
  rank: z.number().int().min(1).max(100),
  useCase: z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(2_000),
    businessFunction: z.string().trim().max(100).optional(),
    kpis: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
    strategicPriority: z.string().trim().max(240).optional(),
    processName: z.string().trim().max(160).optional(),
    painPoints: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
    impact: z.number().min(1).max(10).optional(),
    feasibility: z.number().min(1).max(10).optional(),
    riceScore: z.number().min(0).optional(),
  }),
});

export const solutionMappingSchema = z.object({
  microsoftSolutions: z.array(z.object({
    productFamily: productFamilySchema,
    services: z.array(z.string().trim().min(1).max(100)).min(1).max(8),
    role: z.enum(["primary", "supporting", "integration"]),
    justification: z.string().trim().min(10).max(500),
  })).min(1).max(5),
  referenceArchitecture: referenceArchitectureSchema,
  solutionPlays: z.array(z.string().trim().min(1).max(120)).max(6).default([]),
  agenticOpportunity: z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(800),
    agentType: z.enum(["task-agent", "orchestrator-agent", "specialist-agent", "assistant-agent"]),
    capabilities: z.array(z.enum([
      "reasoning", "planning", "tool-use", "memory", "multi-step-execution",
      "human-in-loop", "autonomous-decision",
    ])).min(1).max(7),
    humanOversight: z.enum(["none", "approval", "review", "supervision"]),
    automationLevel: z.enum(["assisted", "semi-autonomous", "autonomous"]),
    tools: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
  }).nullable(),
  implementationComplexity: z.object({
    level: z.enum(["low", "medium", "high", "very-high"]),
    factors: z.array(z.string().trim().min(1).max(240)).min(1).max(8),
    estimatedDuration: z.string().trim().min(1).max(100),
    estimatedTeamSize: z.string().trim().min(1).max(100),
    keyRisks: z.array(z.string().trim().min(1).max(240)).max(8),
  }),
  aiRegulations: z.object({
    applicableFrameworks: z.array(regulationSchema).max(12),
    riskClassification: z.enum(["minimal", "limited", "high", "unacceptable"]),
    complianceNotes: z.string().trim().min(5).max(800),
    jurisdictions: z.array(z.string().trim().min(1).max(100)).max(8),
  }),
  cybersecurity: z.object({
    securityRequirements: z.array(securityRequirementSchema).min(1).max(14),
    dataClassification: z.enum([
      "public", "internal", "confidential", "highly-confidential", "pii", "phi",
      "financial", "operational",
    ]),
    securityNotes: z.string().trim().min(5).max(800),
  }),
});

export type SolutionMappingRequest = z.infer<typeof solutionMappingRequestSchema>;
export type SolutionMapping = z.infer<typeof solutionMappingSchema>;

export interface SolutionMappingCompletionResult {
  content: string;
  provider: string;
  model: string;
  deployment?: string;
  correlationId: string;
}

export type SolutionMappingCompletion = (
  prompt: string,
  options: { task: "solution-mapping"; expectJson: true; systemPrompt: string },
) => Promise<SolutionMappingCompletionResult>;

function text(value: unknown, fallback = ""): string {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean).join("; ");
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : fallback;
}

function textArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => text(item)).filter(Boolean);
}

function key(value: unknown): string {
  return text(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeProductFamily(value: unknown): z.infer<typeof productFamilySchema> {
  const normalized = key(value);
  if (normalized.includes("fabric")) return "microsoft-fabric";
  if (normalized.includes("purview") || normalized.includes("security")) return "microsoft-security";
  if (normalized.includes("power")) return "power-platform";
  if (normalized.includes("dynamics")) return "dynamics-365";
  if (normalized.includes("365") || normalized.includes("copilot")) return "microsoft-365";
  if (normalized.includes("data")) return "azure-data";
  if (normalized.includes("infrastructure")) return "azure-infrastructure";
  return "azure-ai";
}

function normalizeArchitecture(value: unknown, raw: Record<string, unknown>): z.infer<typeof referenceArchitectureSchema> {
  const normalized = key(value);
  const exact = referenceArchitectureSchema.safeParse(normalized);
  if (exact.success) return exact.data;
  const context = `${normalized} ${key(raw.agenticOpportunity)}`;
  if (context.includes("fraud")) return "fraud-detection";
  if (context.includes("document")) return "document-processing";
  if (context.includes("predict")) return "predictive-analytics";
  if (context.includes("customer")) return "customer-360";
  if (context.includes("knowledge") || context.includes("search")) return "knowledge-mining";
  if (context.includes("conversation") || context.includes("chat")) return "conversational-ai";
  if (context.includes("agent") || context.includes("copilot") || context.includes("intelligent")) return "agentic-ai";
  return "process-automation";
}

function normalizeCapabilities(value: unknown): string[] {
  const values = textArray(value).map(key);
  const capabilities = new Set<string>();
  for (const item of values) {
    if (item.includes("reason") || item.includes("explain") || item.includes("summar")) capabilities.add("reasoning");
    if (item.includes("plan") || item.includes("recommend") || item.includes("priorit")) capabilities.add("planning");
    if (item.includes("source") || item.includes("api") || item.includes("tool") || item.includes("evidence")) capabilities.add("tool-use");
    if (item.includes("feedback") || item.includes("memory")) capabilities.add("memory");
    if (item.includes("multi") || item.includes("workflow")) capabilities.add("multi-step-execution");
    if (item.includes("human") || item.includes("review") || item.includes("approval")) capabilities.add("human-in-loop");
  }
  if (capabilities.size === 0) capabilities.add("reasoning");
  capabilities.add("human-in-loop");
  return [...capabilities];
}

function normalizeFramework(value: unknown): z.infer<typeof regulationSchema> {
  const normalized = key(value);
  const exact = regulationSchema.safeParse(normalized);
  if (exact.success) return exact.data;
  if (normalized.includes("popia")) return "popia";
  if (normalized.includes("gdpr")) return "gdpr";
  if (normalized.includes("pci")) return "pci-dss";
  if (normalized.includes("responsible-ai")) return "ms-responsible-ai";
  if (normalized.includes("iso-42001")) return "iso-42001";
  if (normalized.includes("iso-27001")) return "iso-27001";
  return "other";
}

function normalizeSecurityRequirement(value: unknown): z.infer<typeof securityRequirementSchema> | null {
  const normalized = key(value);
  const exact = securityRequirementSchema.safeParse(normalized);
  if (exact.success) return exact.data;
  if (normalized.includes("at-rest")) return "encryption-at-rest";
  if (normalized.includes("in-transit")) return "encryption-in-transit";
  if (normalized.includes("role") || normalized.includes("least-privilege") || normalized.includes("access")) return "access-control";
  if (normalized.includes("audit") || normalized.includes("logging")) return "audit-logging";
  if (normalized.includes("mfa") || normalized.includes("multi-factor")) return "mfa-required";
  if (normalized.includes("mask") || normalized.includes("loss-prevention") || normalized.includes("sensitivity")) return "data-masking";
  if (normalized.includes("zero-trust") || normalized.includes("private-endpoint") || normalized.includes("network-segment")) return "zero-trust";
  return null;
}

function normalizeMappingPayload(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const raw = value as Record<string, any>;
  const rawSolutions = Array.isArray(raw.microsoftSolutions) ? raw.microsoftSolutions : [];
  const agent = raw.agenticOpportunity && typeof raw.agenticOpportunity === "object" ? raw.agenticOpportunity : null;
  const complexity = raw.implementationComplexity || {};
  const regulations = raw.aiRegulations || {};
  const cybersecurity = raw.cybersecurity || {};
  const classificationValues = Array.isArray(cybersecurity.dataClassification)
    ? cybersecurity.dataClassification.map(key)
    : [key(cybersecurity.dataClassification)];
  const dataClassification = classificationValues.some((item: string) => item.includes("financial")) ? "financial"
    : classificationValues.some((item: string) => item.includes("personal") || item.includes("pii")) ? "pii"
    : classificationValues.some((item: string) => item.includes("highly")) ? "highly-confidential"
    : classificationValues.some((item: string) => item.includes("confidential")) ? "confidential"
    : "internal";
  const securityRequirements = [...new Set(
    textArray(cybersecurity.securityRequirements)
      .map(normalizeSecurityRequirement)
      .filter((item): item is z.infer<typeof securityRequirementSchema> => Boolean(item)),
  )];
  if (securityRequirements.length === 0) securityRequirements.push("access-control", "audit-logging");

  return {
    ...raw,
    microsoftSolutions: rawSolutions.slice(0, 5).map((solution: Record<string, unknown>, index: number) => ({
      productFamily: normalizeProductFamily(solution.productFamily),
      services: textArray(solution.services, [text(solution.productFamily, "Microsoft service")]),
      role: index === 0 ? "primary" : "supporting",
      justification: text(solution.justification || solution.role, "Supports the ranked use case architecture."),
    })),
    referenceArchitecture: normalizeArchitecture(raw.referenceArchitecture, raw),
    solutionPlays: textArray(raw.solutionPlays),
    agenticOpportunity: agent ? {
      title: text(agent.title, "AI-assisted workflow agent"),
      description: text(agent.description, "Assists users with governed, human-reviewed workflow execution."),
      agentType: key(agent.agentType).includes("orchestrat") ? "orchestrator-agent"
        : key(agent.agentType).includes("special") ? "specialist-agent"
        : key(agent.agentType).includes("task") ? "task-agent" : "assistant-agent",
      capabilities: normalizeCapabilities(agent.capabilities),
      humanOversight: key(agent.humanOversight).includes("supervis") ? "supervision"
        : key(agent.humanOversight).includes("approv") || key(agent.humanOversight).includes("mandatory") ? "approval" : "review",
      automationLevel: ["autonomous", "semi-autonomous", "assisted"].includes(key(agent.automationLevel))
        ? key(agent.automationLevel) : "assisted",
      tools: textArray(agent.tools),
    } : null,
    implementationComplexity: {
      level: ["low", "medium", "high", "very-high"].includes(key(complexity.level)) ? key(complexity.level) : "medium",
      factors: textArray(complexity.factors, ["Enterprise integration and governance"]),
      estimatedDuration: text(complexity.estimatedDuration, "3-6 months"),
      estimatedTeamSize: text(complexity.estimatedTeamSize, "5-8 people").match(/people|person/i)
        ? text(complexity.estimatedTeamSize) : `${text(complexity.estimatedTeamSize, "5-8")} people`,
      keyRisks: textArray(complexity.keyRisks),
    },
    aiRegulations: {
      applicableFrameworks: [...new Set(textArray(regulations.applicableFrameworks).map(normalizeFramework))],
      riskClassification: ["minimal", "limited", "high", "unacceptable"].includes(key(regulations.riskClassification))
        ? key(regulations.riskClassification) : "limited",
      complianceNotes: text(regulations.complianceNotes, "Validate applicable regulatory obligations with legal and compliance stakeholders."),
      jurisdictions: textArray(regulations.jurisdictions),
    },
    cybersecurity: {
      securityRequirements,
      dataClassification,
      securityNotes: text(cybersecurity.securityNotes, "Apply least privilege, encryption, and auditable human oversight."),
    },
  };
}

export function buildSolutionMappingPrompt(input: SolutionMappingRequest): string {
  const useCase = input.useCase;
  return `You are a Microsoft Cloud Solution Architect. Map the ranked use case below to a practical Microsoft solution.

This mapping happens after business prioritization. Preserve the business intent and scores; do not invent a different use case.

CUSTOMER: ${input.customerName}
INDUSTRY: ${input.industry}
JURISDICTION: ${input.jurisdiction || "Not provided"}
RANK: ${input.rank}
USE CASE: ${useCase.title}
DESCRIPTION: ${useCase.description}
BUSINESS FUNCTION: ${useCase.businessFunction || "Not provided"}
KPIS: ${useCase.kpis.join(", ") || "Not provided"}
STRATEGIC PRIORITY: ${useCase.strategicPriority || "Not provided"}
PROCESS: ${useCase.processName || "Not provided"}
PAIN POINTS: ${useCase.painPoints.join("; ") || "Not provided"}
IMPACT: ${useCase.impact ?? "Not scored"}/10
FEASIBILITY: ${useCase.feasibility ?? "Not scored"}/10
RICE SCORE: ${useCase.riceScore ?? "Not scored"}

Return one JSON object with exactly:
- microsoftSolutions: 1-5 entries with productFamily, services, role, justification
- referenceArchitecture: one supported pattern
- solutionPlays: up to 6 concise Microsoft solution plays
- agenticOpportunity: null or title, description, agentType, capabilities, humanOversight, automationLevel, tools
- implementationComplexity: level, factors, estimatedDuration, estimatedTeamSize, keyRisks
- aiRegulations: applicableFrameworks, riskClassification, complianceNotes, jurisdictions
- cybersecurity: securityRequirements, dataClassification, securityNotes

Use valid Microsoft service IDs (for example azure-openai, azure-ai-search, azure-ai-foundry, microsoft-fabric, copilot-studio, power-automate, power-apps, dataverse, dynamics-365, microsoft-purview). Prefer the smallest coherent architecture. Return JSON only.`;
}

function parseMapping(content: string) {
  return solutionMappingSchema.safeParse(normalizeMappingPayload(JSON.parse(content)));
}

export async function generateSolutionMapping(
  rawInput: unknown,
  complete: SolutionMappingCompletion,
): Promise<{ mapping: SolutionMapping; metadata: Omit<SolutionMappingCompletionResult, "content"> }> {
  const input = solutionMappingRequestSchema.parse(rawInput);
  const prompt = buildSolutionMappingPrompt(input);
  const options = {
    task: "solution-mapping" as const,
    expectJson: true as const,
    systemPrompt: "Return only valid JSON matching the requested solution-mapping schema.",
  };

  let completion = await complete(prompt, options);
  let parsed;
  try {
    parsed = parseMapping(completion.content);
  } catch {
    parsed = { success: false as const, error: null };
  }

  if (!parsed.success) {
    completion = await complete(
      `${prompt}\n\nYour previous response failed schema validation. Return one corrected JSON object only.`,
      options,
    );
    try {
      parsed = parseMapping(completion.content);
    } catch {
      parsed = { success: false as const, error: null };
    }
  }

  if (!parsed.success) throw new Error("INVALID_MODEL_OUTPUT");
  const { content: _content, ...metadata } = completion;
  return { mapping: parsed.data, metadata };
}