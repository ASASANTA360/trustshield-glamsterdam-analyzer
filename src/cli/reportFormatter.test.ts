const test = require("node:test");
const assert = require("node:assert/strict");
const { formatHumanReport, formatJsonReport } = require("./reportFormatter");

const contractResult = {
  address: "0x0000000000000000000000000000000000000000",
  network: "base",
  bytecodeSize: 8,
  bytecodePreview: "0x600154...",
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
  assert.equal(parsed.timestamp, "2026-06-15T10:00:00.000Z");
});

test("keeps default report human-readable", () => {
  const output = formatHumanReport(contractResult, glamsterdamReport);

  assert.match(output, /TrustShield AI - Contract Report/);
  assert.match(output, /Network:\nbase/);
  assert.match(output, /Glamsterdam Readiness Score:/);
  assert.throws(() => JSON.parse(output));
});
