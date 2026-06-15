const test = require("node:test");
const assert = require("node:assert/strict");

const analyzeSecurity = require("../src/security/securityScanner");

test("detects DELEGATECALL usage", () => {
  const result = analyzeSecurity("0x60006000f4");

  assert.equal(result.securityRiskLevel, "MEDIUM");
  assert.equal(result.securityFindings[0].id, "delegatecall-usage");
  assert.equal(result.securityFindings[0].count, 1);
  assert.ok(result.securityRecommendations[0].includes("delegatecall"));
});

test("detects SELFDESTRUCT opcode", () => {
  const result = analyzeSecurity("0x6000ff");

  assert.equal(result.securityRiskLevel, "MEDIUM");
  assert.equal(result.securityFindings[0].id, "selfdestruct-opcode");
  assert.equal(result.securityScore, 65);
});

test("detects dangerous external CALL patterns", () => {
  const result = analyzeSecurity("0x60006000f1");

  assert.equal(result.securityRiskLevel, "LOW");
  assert.equal(result.securityFindings[0].id, "dangerous-external-call");
  assert.equal(result.securityFindings[0].opcode, "CALL");
});

test("detects suspicious low-level CALLCODE usage", () => {
  const result = analyzeSecurity("0x60006000f2");

  assert.equal(result.securityRiskLevel, "MEDIUM");
  assert.equal(result.securityFindings[0].id, "callcode-usage");
  assert.equal(result.securityFindings[0].severity, "HIGH");
});

test("detects suspicious low-level STATICCALL usage", () => {
  const result = analyzeSecurity("0x60006000fa");

  assert.equal(result.securityRiskLevel, "LOW");
  assert.equal(result.securityFindings[0].id, "staticcall-low-level");
  assert.equal(result.securityScore, 92);
});

test("ignores opcode bytes inside PUSH data", () => {
  const result = analyzeSecurity("0x61f4ff00");

  assert.equal(result.securityScore, 100);
  assert.equal(result.securityRiskLevel, "LOW");
  assert.deepEqual(result.securityFindings, []);
});

test("aggregates multiple high-risk patterns into high risk score", () => {
  const result = analyzeSecurity("0xf4fff1f2fa");

  assert.equal(result.securityScore, 0);
  assert.equal(result.securityRiskLevel, "HIGH");
  assert.equal(result.securityFindings.length, 5);
});
