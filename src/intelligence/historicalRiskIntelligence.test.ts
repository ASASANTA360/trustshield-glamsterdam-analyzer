const test = require("node:test");
const assert = require("node:assert/strict");
const {
  analyzeHistoricalRiskIntelligence,
  getReputationRiskLevel,
  getTrustRiskLevel,
} = require("./historicalRiskIntelligence");

const baseSecurityReport = {
  readinessScore: 90,
  findings: [{ severity: "INFO" }],
};

const now = new Date("2026-06-15T00:00:00.000Z");

test("calculates TrustShield trust score from scanner, AI, and reputation signals", () => {
  const report = analyzeHistoricalRiskIntelligence(
    baseSecurityReport,
    {
      deployedAt: "2026-05-01T00:00:00.000Z",
      verificationStatus: "not_verified",
    },
    now
  );

  assert.equal(report.contractAge, 45);
  assert.equal(report.reputationScore, 64);
  assert.equal(report.trustScore, 84);
  assert.equal(report.trustRiskLevel, "CAUTION");
});

test("scores strong verified older contracts as low reputation risk", () => {
  const report = analyzeHistoricalRiskIntelligence(
    baseSecurityReport,
    {
      deployedAt: "2025-01-01T00:00:00.000Z",
      verificationStatus: "verified",
      deploymentBlock: 123,
      deployerAddress: "0x0000000000000000000000000000000000000001",
    },
    now
  );

  assert.equal(report.reputationScore, 100);
  assert.equal(report.reputationRiskLevel, "LOW");
  assert.deepEqual(report.deploymentHistory, [
    "Contract age: 530 days",
    "Deployment block: 123",
    "Deployer: 0x0000000000000000000000000000000000000001",
  ]);
});

test("classifies reputation and overall risk levels", () => {
  assert.equal(getReputationRiskLevel(80), "LOW");
  assert.equal(getReputationRiskLevel(60), "MEDIUM");
  assert.equal(getReputationRiskLevel(20), "HIGH");
  assert.equal(getTrustRiskLevel(90), "SAFE");
  assert.equal(getTrustRiskLevel(70), "CAUTION");
  assert.equal(getTrustRiskLevel(45), "HIGH RISK");
  assert.equal(getTrustRiskLevel(10), "CRITICAL");
});

test("generates historical warnings for very new, unverified, suspicious contracts", () => {
  const report = analyzeHistoricalRiskIntelligence(
    { readinessScore: 30, findings: [{ severity: "HIGH" }, { severity: "MEDIUM" }] },
    {
      deployedAt: "2026-06-14T00:00:00.000Z",
      verificationStatus: false,
      highRiskDeploymentPattern: true,
      metadata: { hiddenOwner: true },
    },
    now
  );

  const ids = report.historicalFindings.map((finding: { id: string }) => finding.id);
  assert.deepEqual(ids, [
    "HIST-VERY-NEW-CONTRACT",
    "HIST-MISSING-VERIFICATION",
    "HIST-HIGH-RISK-DEPLOYMENT-PATTERN",
    "HIST-SUSPICIOUS-METADATA",
  ]);
  assert.equal(report.reputationScore, 14);
  assert.equal(report.reputationRiskLevel, "HIGH");
  assert.equal(report.trustRiskLevel, "CRITICAL");
  assert.ok(report.intelligenceRecommendations.length >= 4);
});
