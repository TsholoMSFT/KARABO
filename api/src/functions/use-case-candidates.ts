import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { completeAI } from "../lib/ai-completion";
import { AIProviderError, toAIErrorBody } from "../lib/ai-provider";
import { generateUseCaseCandidates } from "../lib/use-case-generation";
import { makeCorsHeaders } from "../lib/xml-utils";

const corsHeaders = makeCorsHeaders("POST, OPTIONS");

async function useCaseCandidatesHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const correlationId = request.headers.get("x-correlation-id")?.trim() || randomUUID();
  if (request.method === "OPTIONS") return { status: 204, headers: corsHeaders };

  try {
    const input = await request.json();
    const result = await generateUseCaseCandidates(input, async (prompt, options) => {
      const completion = await completeAI({
        prompt,
        model: "gpt-4o-mini",
        task: options.task,
        expectJson: options.expectJson,
        systemPrompt: options.systemPrompt,
        correlationId,
      }, context);
      return completion;
    });

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: {
        useCases: result.useCases,
        generation: {
          mode: "ai",
          ...result.metadata,
          generatedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: {
          error: "Discovery context failed validation.",
          code: "INVALID_REQUEST",
          retryable: false,
          correlationId,
          issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      };
    }

    const normalizedError = error instanceof Error && error.message === "INVALID_MODEL_OUTPUT"
      ? new AIProviderError("INVALID_MODEL_OUTPUT", "AI candidate output failed schema validation.", false, 502)
      : error;
    const body = toAIErrorBody(normalizedError, correlationId);
    const status = normalizedError instanceof AIProviderError ? normalizedError.status : 500;
    context.error(`Use-case generation correlationId=${correlationId} code=${body.code}: ${body.error}`);
    return {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: body,
    };
  }
}

app.http("use-case-candidates", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "use-case-candidates",
  handler: useCaseCandidatesHandler,
});