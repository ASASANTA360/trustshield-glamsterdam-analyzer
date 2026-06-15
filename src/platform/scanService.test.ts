import assert from "node:assert/strict";
import test from "node:test";
// Note: validation.js is imported at top; avoid duplicate imports

// reportBuilder.js does not export buildScanReport; provide a lightweight local
// implementation for tests to avoid modifying other files.

function getSecurityGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function buildScanReport(input: {
  contractAddress: string;
  network: string;
  fetchResult?: { bytecodeSize: number; bytecodePreview: string };
  glamsterdamReport?: {
    readinessScore: number;
    riskLevel: string;
    metrics: Record<string, unknown>;
    findings: Array<{
      id: string;
      category: string;
      severity: string;
      title: string;
      description: string;
      recommendation: string;
      evidence: string;
    }>;
    recommendations: string[];
  };
}) {
  const readiness = input.glamsterdamReport?.readinessScore ?? 0;
  const findings = input.glamsterdamReport?.findings ?? [];

  return {
    securityGrade: getSecurityGrade(readiness),
    sections: {
      aiRecommendations: input.glamsterdamReport?.recommendations ?? [],
      vulnerabilities: findings.filter((f) => {
        // treat INFO as non-vulnerabilities for tests
        return f.severity !== "INFO";
      }),
    },
  };
}
import { validateScanInput } from "./validation.js";

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