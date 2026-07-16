import assert from "node:assert/strict";
import test from "node:test";
import { validateQuestionnaireResponses } from "./questionnaire-validation";

const questions = [
  { id: "text-1", inputType: "text" as const },
  { id: "rank-1", inputType: "ranking" as const, rankingItems: ["security", "speed"] },
];

test("accepts valid text and ranking responses from the questionnaire snapshot", () => {
  const details = validateQuestionnaireResponses(questions, [
    { questionId: "text-1", answer: "Reduce manual handoffs" },
    { questionId: "rank-1", answer: "", ranking: { security: 1, speed: 2 } },
  ]);

  assert.deepEqual(details, []);
});

test("rejects unknown, duplicate, empty text, and malformed ranking responses", () => {
  const details = validateQuestionnaireResponses(questions, [
    { questionId: "other", answer: "Injected" },
    { questionId: "text-1", answer: "" },
    { questionId: "text-1", answer: "Duplicate" },
    { questionId: "rank-1", answer: "", ranking: { cost: 0 } },
  ]);

  assert.deepEqual(details, [
    { questionId: "other", error: "Question is not part of this questionnaire." },
    { questionId: "text-1", error: "A non-empty text answer is required." },
    { questionId: "text-1", error: "Question has more than one response." },
    { questionId: "rank-1", error: "Ranking contains an invalid item or rank." },
  ]);
});