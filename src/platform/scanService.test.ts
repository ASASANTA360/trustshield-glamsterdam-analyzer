const assert = require("node:assert/strict");
const test = require("node:test");

const { buildScanReport, getSecurityGrade } = require("./reportBuilder");
const { validateScanInput } = require("./validation");

test("validates supported scan input", () => {
  const result = validateScanInput({
    contractAddress: "0x0000000000000000000000000000000000000000",
    network: "ethereum",
  });

  assert.equal(result.ok, true);
});

test("rejects unsupported network scan input", () => {
  const result = validateScanInput({
    contractAddress: "0x0000000000000000000000000000000000000000",
    network: "solana",
  });

  assert.equal(result.ok, false);
});

test("maps TrustShield scores to security grades", () => {
  assert.equal(getSecurityGrade(95), "A");
  assert.equal(getSecurityGrade(82), "B");
  assert.equal(getSecurityGrade(72), "C");
  assert.equal(getSecurityGrade(63), "D");
  assert.equal(getSecurityGrade(41), "F");
});

test("builds a complete platform scan report", () => {
  const report = buildScanReport({
    contractAddress: "0x0000000000000000000000000000000000000000",
    network: "base",
    fetchResult: { bytecodeSize: 128, bytecodePreview: "0x6000" },
    glamsterdamReport: {
      readinessScore: 88,
      riskLevel: "LOW",
      metrics: {},
      findings: [
        {
          id: "GLAM-BASELINE",
          category: "gas-repricing",
          severity: "INFO",
          title: "Baseline",
          description: "No high-signal risk.",
          recommendation: "Continue analysis.",
          evidence: "1 opcode",
        },
      ],
      recommendations: ["Continue analysis."],
    },
  });

  assert.equal(report.securityGrade, "B");
  assert.equal(report.sections.aiRecommendations.length, 1);
  assert.equal(report.sections.vulnerabilities.length, 0);
});
