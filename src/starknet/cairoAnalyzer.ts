import {
  findCairoVulnerabilities,
} from "./vulnerabilityDatabase.js";

export interface CairoSecurityReport {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  issues: string[];
  recommendations: string[];
}

export function analyzeCairoContract(
  sourceCode: string
): CairoSecurityReport {
  const vulnerabilities =
    findCairoVulnerabilities(sourceCode);

  const issues = vulnerabilities.map(
    (v) =>
      `[${v.severity}] ${v.title}: ${v.description}`
  );

  const recommendations = vulnerabilities.map(
    (v) => v.recommendation
  );

  let riskScore = 100 - vulnerabilities.length * 20;

  if (riskScore < 0) {
    riskScore = 0;
  }

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  if (riskScore >= 80) {
    riskLevel = "LOW";
  } else if (riskScore >= 60) {
    riskLevel = "MEDIUM";
  } else if (riskScore >= 30) {
    riskLevel = "HIGH";
  } else {
    riskLevel = "CRITICAL";
  }

  return {
    riskScore,
    riskLevel,
    issues,
    recommendations,
  };
}