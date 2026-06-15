const test = require("node:test");
const assert = require("node:assert/strict");
const { formatHumanReport, formatJsonReport } = require("./reportFormatter");

const contractResult = {
  address: "0x0000000000000000000000000000000000000000",
  network: "base",
  bytecodeSize: 8,
  bytecodePreview: "0x600154...",
};


const intelligenceReport = {
  trustScore: 82,
  trustRiskLevel: "CAUTION",
  contractAge: 45,
  verificationStatus: "not_verified",
  reputationScore: 64,
  reputationRiskLevel: "MEDIUM",
  historicalFindings: [
    {
      id: "HIST-NEW-CONTRACT",
      severity: "MEDIUM",
      title: "Contract is relatively new",
      evidence: "Contract age is 45 days.",
      recommendation: "Perform manual review.",
    },
  ],
  intelligenceRecommendations: ["Manual review recommended for relatively new contracts."],
};

const glamsterdamReport = {
  readinessScore: 82,
  riskLevel: "LOW",
  metrics: {
    stateAccessOps: 2,
    externalInteractionOps: 1,
    logOps: 1,
    blockContextOps: 0,
    deprecatedOps: 0,
  },
  findings: [
    {
      id: "GLAM-BAL-STATE-ACCESS",
      category: "state-access",
      severity: "LOW",
      title: "State access pattern should be reviewed",
      description: "State access description",
      recommendation: "Profile state-heavy functions.",
      evidence: "2 state/account access opcodes",
    },
  ],
  recommendations: ["Profile state-heavy functions."],
};

test("formats machine-readable JSON output with required fields", () => {
  const output = formatJsonReport(
    contractResult,
    glamsterdamReport,
    intelligenceReport,
    new Date("2026-06-15T10:00:00.000Z")
  );
  const parsed = JSON.parse(output);

  assert.deepEqual(Object.keys(parsed), [
    "address",
    "network",
    "bytecodeSize",
    "readinessScore",
    "riskLevel",
    "metrics",
    "findings",
    "recommendations",
    "trustScore",
    "trustRiskLevel",
    "contractAge",
    "verificationStatus",
    "reputationScore",
    "historicalFindings",
    "intelligenceRecommendations",
    "timestamp",
  ]);
  assert.equal(parsed.address, contractResult.address);
  assert.equal(parsed.network, "base");
  assert.equal(parsed.bytecodeSize, 8);
  assert.equal(parsed.readinessScore, 82);
  assert.equal(parsed.riskLevel, "LOW");
  assert.deepEqual(parsed.metrics, glamsterdamReport.metrics);
  assert.deepEqual(parsed.findings, glamsterdamReport.findings);
  assert.deepEqual(parsed.recommendations, glamsterdamReport.recommendations);
  assert.equal(parsed.trustScore, 82);
  assert.equal(parsed.trustRiskLevel, "CAUTION");
  assert.equal(parsed.contractAge, 45);
  assert.equal(parsed.verificationStatus, "not_verified");
  assert.equal(parsed.reputationScore, 64);
  assert.deepEqual(parsed.historicalFindings, intelligenceReport.historicalFindings);
  assert.deepEqual(parsed.intelligenceRecommendations, intelligenceReport.intelligenceRecommendations);
  assert.equal(parsed.timestamp, "2026-06-15T10:00:00.000Z");
});

test("keeps default report human-readable", () => {
  const output = formatHumanReport(contractResult, glamsterdamReport, intelligenceReport);

  assert.match(output, /TrustShield AI - Contract Report/);
  assert.match(output, /Network:\nbase/);
  assert.match(output, /Glamsterdam Readiness Score:/);
  assert.match(output, /TrustShield Risk Intelligence:/);
  assert.match(output, /Overall Trust Score:\n82\/100/);
  assert.match(output, /Contract age: 45 days/);
  assert.throws(() => JSON.parse(output));
});
