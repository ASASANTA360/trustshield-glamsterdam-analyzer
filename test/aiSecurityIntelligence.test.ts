const test = require("node:test");
const assert = require("node:assert/strict");

const generateAiSecurityIntelligence = require("../src/security/aiSecurityIntelligence");

test("assigns security grades by score range", () => {
  assert.equal(generateAiSecurityIntelligence.getSecurityGrade(100), "A");
  assert.equal(generateAiSecurityIntelligence.getSecurityGrade(90), "A");
  assert.equal(generateAiSecurityIntelligence.getSecurityGrade(89), "B");
  assert.equal(generateAiSecurityIntelligence.getSecurityGrade(80), "B");
  assert.equal(generateAiSecurityIntelligence.getSecurityGrade(79), "C");
  assert.equal(generateAiSecurityIntelligence.getSecurityGrade(70), "C");
  assert.equal(generateAiSecurityIntelligence.getSecurityGrade(69), "D");
  assert.equal(generateAiSecurityIntelligence.getSecurityGrade(60), "D");
  assert.equal(generateAiSecurityIntelligence.getSecurityGrade(59), "F");
});

test("generates clean AI guidance when no findings exist", () => {
  const result = generateAiSecurityIntelligence({
    securityScore: 100,
    securityRiskLevel: "LOW",
    securityFindings: [],
    securityRecommendations: ["No high-risk low-level EVM patterns were detected."],
  });

  assert.equal(result.securityGrade, "A");
  assert.match(result.aiSecuritySummary, /100\/100/);
  assert.match(result.aiSecuritySummary, /No dangerous low-level EVM patterns/);
  assert.ok(result.aiRecommendations.some((recommendation: string) => recommendation.includes("Re-run TrustShield analysis")));
});

test("generates developer-friendly remediation guidance for findings", () => {
  const result = generateAiSecurityIntelligence({
    securityScore: 52,
    securityRiskLevel: "HIGH",
    securityFindings: [
      {
        id: "delegatecall-usage",
        title: "DELEGATECALL usage detected",
        severity: "HIGH",
        opcode: "DELEGATECALL",
        count: 1,
        description: "The contract executes external code in the current contract context.",
        recommendation: "Restrict delegatecall targets to audited implementations.",
      },
    ],
    securityRecommendations: ["Restrict delegatecall targets to audited implementations."],
  });

  assert.equal(result.securityGrade, "F");
  assert.match(result.aiSecuritySummary, /Overall risk level is HIGH/);
  assert.ok(result.aiRecommendations[0].includes("Developer note"));
  assert.ok(result.aiRecommendations.some((recommendation: string) => recommendation.includes("manual smart contract review")));
});
