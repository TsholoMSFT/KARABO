export type AITask =
  | "extraction"
  | "use-case-generation"
  | "solution-mapping"
  | "formatting"
  | "analysis"
  | "architecture"
  | "journey"
  | "governance"
  | "business-case"
  | "cost-optimization"
  | "executive"
  | "engagement-agenda"
  | "engagement-email"
  | "engagement-timeline"
  | "engagement-closeout"
  | "engagement-diagram"
  | "general";

const OUTPUT_TOKEN_LIMITS: Record<AITask, number> = {
  extraction: 4000,
  "use-case-generation": 6000,
  "solution-mapping": 5000,
  formatting: 2000,
  analysis: 4000,
  architecture: 5000,
  journey: 5000,
  governance: 4000,
  "business-case": 5000,
  "cost-optimization": 3000,
  executive: 5000,
  "engagement-agenda": 3000,
  "engagement-email": 2000,
  "engagement-timeline": 3000,
  "engagement-closeout": 3000,
  "engagement-diagram": 3000,
  general: 3000,
};

const AI_TASKS = new Set<AITask>(Object.keys(OUTPUT_TOKEN_LIMITS) as AITask[]);

export function getOutputTokenLimit(task: unknown): number {
  return typeof task === "string" && AI_TASKS.has(task as AITask)
    ? OUTPUT_TOKEN_LIMITS[task as AITask]
    : OUTPUT_TOKEN_LIMITS.general;
}
