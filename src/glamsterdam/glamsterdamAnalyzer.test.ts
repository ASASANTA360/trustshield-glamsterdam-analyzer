const test = require("node:test");
const assert = require("node:assert/strict");
const {
  analyzeGlamsterdamReadiness,
  parseOpcodes,
} = require("./glamsterdamAnalyzer");

test("parses opcodes while skipping PUSH data", () => {
  const summary = parseOpcodes("0x600154600255");

  assert.equal(summary.counts.PUSH1, 2);
  assert.equal(summary.counts.SLOAD, 1);
  assert.equal(summary.counts.SSTORE, 1);
  assert.equal(summary.totalOpcodes, 4);
});

test("detects state access patterns relevant to BAL review", () => {
  const report = analyzeGlamsterdamReadiness("0x600154600255");

  assert.equal(report.metrics.stateAccessOps, 2);
  assert.ok(
    report.findings.some((finding: any) => finding.id === "GLAM-BAL-STATE-ACCESS")
  );
});

test("detects native ETH transfer and log indexing review signals", () => {
  const report = analyzeGlamsterdamReadiness("0x6000600060006000600060006000f1a1");

  assert.equal(report.metrics.externalInteractionOps, 1);
  assert.equal(report.metrics.logOps, 1);
  assert.ok(
    report.findings.some((finding: any) => finding.id === "GLAM-NATIVE-ETH-LOGS")
  );
});

test("flags deprecated opcode usage as high risk", () => {
  const report = analyzeGlamsterdamReadiness("0x6000ff");
  const finding = report.findings.find(
    (candidate: any) => candidate.id === "GLAM-DEPRECATED-OPCODES"
  );

  assert.equal(report.metrics.deprecatedOps, 1);
  assert.equal(finding?.severity, "HIGH");
});
