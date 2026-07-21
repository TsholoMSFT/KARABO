import assert from "node:assert/strict";
import test from "node:test";
import { getOutputTokenLimit } from "./ai-cost-controls";

test("uses lower output budgets for compact tasks", () => {
  assert.equal(getOutputTokenLimit("formatting"), 2000);
  assert.equal(getOutputTokenLimit("engagement-email"), 2000);
  assert.equal(getOutputTokenLimit("cost-optimization"), 3000);
});

test("allows larger bounded outputs for complex tasks", () => {
  assert.equal(getOutputTokenLimit("architecture"), 5000);
  assert.equal(getOutputTokenLimit("executive"), 5000);
  assert.equal(getOutputTokenLimit("use-case-generation"), 6000);
  assert.equal(getOutputTokenLimit("solution-mapping"), 5000);
});

test("falls back to the general budget for missing or unknown tasks", () => {
  assert.equal(getOutputTokenLimit(undefined), 3000);
  assert.equal(getOutputTokenLimit("unknown"), 3000);
});
