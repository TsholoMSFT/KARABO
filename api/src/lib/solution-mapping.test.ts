import assert from "node:assert/strict";
import test from "node:test";
import { generateSolutionMapping } from "./solution-mapping";

const input = {
  customerName: "ABSA",
  industry: "Financial Services & Banking",
  jurisdiction: "South Africa",
  rank: 1,
  useCase: {
    title: "Intelligent Fraud Investigation",
    description: "Prioritize suspicious activity and assemble explainable evidence for investigator review.",
    businessFunction: "Fraud & Financial Crime (AML)",
    kpis: ["Accuracy Score", "Time to Resolution"],
    strategicPriority: "Reduce fraud losses",
    processName: "Fraud investigation",
    painPoints: ["High false positives", "Manual evidence gathering"],
    impact: 9,
    feasibility: 7,
    riceScore: 200,
  },
};

const validMapping = {
  microsoftSolutions: [{
    productFamily: "azure-ai",
    services: ["azure-ai-foundry", "azure-openai", "azure-ai-search"],
    role: "primary",
    justification: "Grounds investigator assistance in governed fraud and case evidence.",
  }],
  referenceArchitecture: "agentic-ai",
  solutionPlays: ["AI-assisted fraud investigation"],
  agenticOpportunity: {
    title: "Fraud investigation assistant",
    description: "Collects evidence and proposes explainable investigator next actions.",
    agentType: "assistant-agent",
    capabilities: ["reasoning", "tool-use", "human-in-loop"],
    humanOversight: "approval",
    automationLevel: "assisted",
    tools: ["Case API", "Transaction API"],
  },
  implementationComplexity: {
    level: "high",
    factors: ["Core banking and fraud-system integration"],
    estimatedDuration: "4-6 months",
    estimatedTeamSize: "6-8 people",
    keyRisks: ["False-positive bias"],
  },
  aiRegulations: {
    applicableFrameworks: ["popia", "glba", "ms-responsible-ai"],
    riskClassification: "high",
    complianceNotes: "Keep investigator approval and a complete decision audit trail.",
    jurisdictions: ["South Africa"],
  },
  cybersecurity: {
    securityRequirements: ["encryption-at-rest", "access-control", "audit-logging", "mfa-required"],
    dataClassification: "financial",
    securityNotes: "Apply least privilege and isolate customer transaction evidence.",
  },
};

test("returns a validated post-ranking solution mapping", async () => {
  const result = await generateSolutionMapping(input, async () => ({
    content: JSON.stringify(validMapping),
    provider: "azure-openai",
    model: "gpt-4o-mini",
    deployment: "mini",
    correlationId: "mapping-1",
  }));

  assert.equal(result.mapping.referenceArchitecture, "agentic-ai");
  assert.equal(result.mapping.microsoftSolutions[0].productFamily, "azure-ai");
  assert.equal(result.metadata.correlationId, "mapping-1");
});

test("makes only one correction attempt for malformed mapping output", async () => {
  let attempts = 0;
  const result = await generateSolutionMapping(input, async () => {
    attempts += 1;
    return {
      content: attempts === 1 ? "{}" : JSON.stringify(validMapping),
      provider: "azure-openai",
      model: "gpt-4o-mini",
      correlationId: "mapping-2",
    };
  });

  assert.equal(attempts, 2);
  assert.equal(result.mapping.cybersecurity.dataClassification, "financial");
});

test("rejects mapping output after the bounded correction fails", async () => {
  let attempts = 0;
  await assert.rejects(
    () => generateSolutionMapping(input, async () => {
      attempts += 1;
      return {
        content: "{}",
        provider: "azure-openai",
        model: "gpt-4o-mini",
        correlationId: "mapping-3",
      };
    }),
    /INVALID_MODEL_OUTPUT/,
  );
  assert.equal(attempts, 2);
});

test("normalizes human-readable model labels into canonical mapping values", async () => {
  const humanReadable = {
    ...validMapping,
    microsoftSolutions: [{
      productFamily: "Azure AI Foundry",
      services: ["Azure OpenAI", "Azure AI Search"],
      role: "Generate explainable investigation summaries.",
    }],
    referenceArchitecture: "Intelligent application with Azure AI and human review",
    agenticOpportunity: {
      title: "Investigator Copilot",
      description: "Summarizes evidence and recommends reviewed next actions.",
      agentType: "Copilot-style investigator assistant",
      capabilities: ["Summarize evidence", "Recommend queue ordering", "Human review"],
      humanOversight: "Mandatory investigator approval",
      automationLevel: "Assisted",
      tools: ["Case API"],
    },
    implementationComplexity: {
      ...validMapping.implementationComplexity,
      level: "Medium",
      estimatedTeamSize: 6,
    },
    aiRegulations: {
      applicableFrameworks: ["South Africa Protection of Personal Information Act (POPIA)", "Microsoft Responsible AI Standard"],
      riskClassification: "High",
      complianceNotes: ["Maintain audit trails", "Require human approval"],
      jurisdictions: ["South Africa"],
    },
    cybersecurity: {
      securityRequirements: ["Role-based access control and least privilege", "Encryption in transit and at rest", "Audit logging"],
      dataClassification: ["Confidential", "Financial Data"],
      securityNotes: ["Use private endpoints", "Apply least privilege"],
    },
  };
  const result = await generateSolutionMapping(input, async () => ({
    content: JSON.stringify(humanReadable),
    provider: "azure-openai",
    model: "gpt-4o-mini",
    correlationId: "mapping-readable",
  }));

  assert.equal(result.mapping.microsoftSolutions[0].productFamily, "azure-ai");
  assert.equal(result.mapping.microsoftSolutions[0].role, "primary");
  assert.equal(result.mapping.referenceArchitecture, "agentic-ai");
  assert.equal(result.mapping.agenticOpportunity?.agentType, "assistant-agent");
  assert.equal(result.mapping.implementationComplexity.estimatedTeamSize, "6 people");
  assert.deepEqual(result.mapping.aiRegulations.applicableFrameworks, ["popia", "ms-responsible-ai"]);
  assert.equal(result.mapping.cybersecurity.dataClassification, "financial");
});