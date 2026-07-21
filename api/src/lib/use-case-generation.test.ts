import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUseCaseCandidatePrompt,
  generateUseCaseCandidates,
  type CandidateCompletion,
} from "./use-case-generation";

const request = {
  customerName: "ABSA",
  industry: "Financial Services",
  jurisdiction: "South Africa",
  businessFunctions: ["Fraud & Financial Crime"],
  targetKpis: ["Time to Resolution"],
  desiredOutcomes: "Reduce fraud investigation time by 30%.",
  responses: [{ question: "What is the main challenge?", answer: "High fraud false positives." }],
  evidence: [{ source: "discovery" as const, content: "Investigators use fragmented systems." }],
};

function candidate(index: number) {
  return {
    title: `Candidate ${index} for fraud operations`,
    description: "Improve investigation quality and turnaround using governed workflow intelligence.",
    rationale: "The discovery identified fragmented systems and high false-positive volumes.",
    businessFunction: "Fraud & Financial Crime",
    expectedOutcomes: ["Faster investigations"],
    kpis: ["Time to Resolution"],
    strategicAlignment: {
      primaryPriority: "Operational resilience",
      alignmentScore: 8,
      rationale: "Supports safer and faster fraud operations.",
    },
    processContext: {
      processName: "Fraud investigation",
      painPoints: ["Fragmented evidence"],
      proposedImprovement: "Unify evidence review and prioritize cases consistently.",
    },
    preliminaryRisk: { level: "high", notes: "Requires explainability and human review." },
    complexity: { level: "medium", rationale: "Requires several governed integrations." },
  };
}

const metadata = {
  provider: "azure-openai",
  model: "gpt-4o-mini",
  deployment: "mini-deployment",
  correlationId: "generation-1",
};

test("builds a pre-ranking prompt that explicitly excludes solution mapping", () => {
  const prompt = buildUseCaseCandidatePrompt(request);
  assert.match(prompt, /candidate-development stage before scoring/);
  assert.match(prompt, /Do not recommend Microsoft products/);
  assert.match(prompt, /ABSA/);
});

test("returns 5 to 8 validated lean candidates with provider metadata", async () => {
  const complete: CandidateCompletion = async () => ({
    content: JSON.stringify({ useCases: Array.from({ length: 5 }, (_, index) => candidate(index + 1)) }),
    ...metadata,
  });
  const result = await generateUseCaseCandidates(request, complete);
  assert.equal(result.useCases.length, 5);
  assert.equal(result.metadata.correlationId, "generation-1");
  assert.equal("microsoftSolutions" in result.useCases[0], false);
});

test("makes one bounded correction attempt for malformed model output", async () => {
  let attempts = 0;
  const complete: CandidateCompletion = async () => {
    attempts += 1;
    return {
      content: attempts === 1
        ? JSON.stringify({ useCases: [candidate(1)] })
        : JSON.stringify({ useCases: Array.from({ length: 5 }, (_, index) => candidate(index + 1)) }),
      ...metadata,
    };
  };
  const result = await generateUseCaseCandidates(request, complete);
  assert.equal(attempts, 2);
  assert.equal(result.useCases.length, 5);
});

test("rejects output that remains invalid after the correction attempt", async () => {
  let attempts = 0;
  const complete: CandidateCompletion = async () => {
    attempts += 1;
    return { content: "not-json", ...metadata };
  };
  await assert.rejects(() => generateUseCaseCandidates(request, complete), /INVALID_MODEL_OUTPUT/);
  assert.equal(attempts, 2);
});