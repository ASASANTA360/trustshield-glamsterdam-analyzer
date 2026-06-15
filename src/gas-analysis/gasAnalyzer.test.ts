const test = require("node:test");
const assert = require("node:assert/strict");
const analyzeGasImpact = require("./gasAnalyzer");

test("marks small contracts as low risk", () => {
  assert.deepEqual(analyzeGasImpact(5000), {
    score: 90,
    riskLevel: "LOW",
    warnings: [],
  });
});

test("marks moderate contracts as medium risk", () => {
  const result = analyzeGasImpact(9000);

  assert.equal(result.score, 70);
  assert.equal(result.riskLevel, "MEDIUM");
  assert.equal(result.warnings.length, 1);
});

test("marks large contracts as high risk", () => {
  const result = analyzeGasImpact(16000);

  assert.equal(result.score, 50);
  assert.equal(result.riskLevel, "HIGH");
  assert.equal(result.warnings.length, 1);
});
