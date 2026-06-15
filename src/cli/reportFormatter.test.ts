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
  vulnerabilities: [
    {
      id: "delegatecall-untrusted-contract",
      name: "Delegatecall to Untrusted Contract",
      swcId: "SWC-112",
      cweId: "CWE-829",
      severity: "HIGH",
      description: "Delegatecall to an untrusted contract may allow arbitrary code execution.",
      attackScenario: "An attacker controls the delegatecall target.",
      remediation: "Restrict delegatecall targets and validate upgrade mechanisms.",
      references: ["https://swcregistry.io/docs/SWC-112/"],
    },
  ],
  vulnerabilityScore: 25,
  vulnerabilityStatus: "REVIEW REQUIRED",
  swcCoverage: ["SWC-112"],
  cweMappings: { "CWE-829": ["SWC-112"] },
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
    "vulnerabilities",
    "vulnerabilityScore",
    "vulnerabilityStatus",
    "swcCoverage",
    "cweMappings",
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
  assert.deepEqual(parsed.vulnerabilities, glamsterdamReport.vulnerabilities);
  assert.equal(parsed.vulnerabilityScore, 25);
  assert.equal(parsed.vulnerabilityStatus, "REVIEW REQUIRED");
  assert.deepEqual(parsed.swcCoverage, ["SWC-112"]);
  assert.deepEqual(parsed.cweMappings, { "CWE-829": ["SWC-112"] });
  assert.equal(parsed.timestamp, "2026-06-15T10:00:00.000Z");
});

test("keeps default report human-readable", () => {
  const output = formatHumanReport(contractResult, glamsterdamReport);

  assert.match(output, /TrustShield AI - Contract Report/);
  assert.match(output, /Network:\nbase/);
  assert.match(output, /Glamsterdam Readiness Score:/);
  assert.match(output, /Vulnerability Intelligence:/);
  assert.match(output, /SWC ID: SWC-112/);
  assert.throws(() => JSON.parse(output));
});
