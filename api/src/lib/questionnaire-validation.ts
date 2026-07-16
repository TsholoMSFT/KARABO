export interface QuestionnaireQuestion {
  id: string;
  inputType?: "text" | "ranking";
  rankingItems?: string[];
}

export interface QuestionnaireResponse {
  questionId?: unknown;
  answer?: unknown;
  ranking?: unknown;
  comment?: unknown;
}

export interface QuestionnaireValidationDetail {
  questionId: string;
  error: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateQuestionnaireResponses(
  questions: QuestionnaireQuestion[],
  responses: unknown[],
): QuestionnaireValidationDetail[] {
  const allowedQuestions = new Map(questions.map((question) => [question.id, question]));
  const seen = new Set<string>();
  const details: QuestionnaireValidationDetail[] = [];

  for (const candidate of responses) {
    if (!isPlainObject(candidate)) {
      details.push({ questionId: "unknown", error: "Response must be an object." });
      continue;
    }

    const questionId = typeof candidate.questionId === "string" ? candidate.questionId : "";
    const question = allowedQuestions.get(questionId);
    if (!question) {
      details.push({ questionId: questionId || "unknown", error: "Question is not part of this questionnaire." });
      continue;
    }
    if (seen.has(questionId)) {
      details.push({ questionId, error: "Question has more than one response." });
      continue;
    }
    seen.add(questionId);

    const answer = typeof candidate.answer === "string" ? candidate.answer.trim() : "";
    if (question.inputType !== "ranking") {
      if (!answer) details.push({ questionId, error: "A non-empty text answer is required." });
      continue;
    }

    if (!isPlainObject(candidate.ranking) || Object.keys(candidate.ranking).length === 0) {
      details.push({ questionId, error: "A ranking response is required." });
      continue;
    }

    const allowedItems = new Set(question.rankingItems ?? []);
    const invalidRanking = Object.entries(candidate.ranking).some(
      ([item, rank]) => !allowedItems.has(item) || typeof rank !== "number" || !Number.isInteger(rank) || rank < 1,
    );
    if (invalidRanking) {
      details.push({ questionId, error: "Ranking contains an invalid item or rank." });
    }
  }

  return details;
}