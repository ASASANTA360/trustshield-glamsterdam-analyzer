import {
  findCairoVulnerabilities,
} from "./vulnerabilityDatabase.js";

import {
  getSecurityAdvice,
  type SecurityAdvice,
} from "./aiSecurityAdvisor.js";

export interface CairoSecurityInsight {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
  attackScenario: string;
  fixSuggestion: string;
}

export interface CairoSecurityReport {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  findings: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };

  issues: string[];
  recommendations: string[];
  insights: CairoSecurityInsight[];
  summary: string;
}

export function analyzeCairoContract(
  sourceCode: string
): CairoSecurityReport {
  const vulnerabilities =
    findCairoVulnerabilities(sourceCode);

  let deduction = 0;

  const findings = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  vulnerabilities.forEach((v) => {
    switch (v.severity) {
      case "LOW":
        deduction += 5;
        findings.low++;
        break;

      case "MEDIUM":
        deduction += 15;
        findings.medium++;
        break;

      case "HIGH":
        deduction += 30;
        findings.high++;
        break;

      case "CRITICAL":
        deduction += 50;
        findings.critical++;
        break;
    }
  });

  const riskScore = Math.max(0, 100 - deduction);

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

  const issues = vulnerabilities.map(
    (v) => `[${v.severity}] ${v.title}: ${v.description}`
  );

  const recommendations = [
    ...new Set(vulnerabilities.map((v) => v.recommendation)),
  ];

  const insights: CairoSecurityInsight[] = vulnerabilities
    .map((v) => {
      const advice: SecurityAdvice | null = getSecurityAdvice(v.id);

      if (!advice) {
        return null;
      }

      return {
        id: v.id,
        title: v.title,
        severity: v.severity,
        explanation: advice.explanation,
        attackScenario: advice.attackScenario,
        fixSuggestion: advice.fixSuggestion,
      };
    })
    .filter((item): item is CairoSecurityInsight => item !== null);

  let summary = "";

  if (riskLevel === "LOW") {
    summary =
      "The contract appears to follow good security practices with minimal detected risks.";
  } else if (riskLevel === "MEDIUM") {
    summary =
      "The contract contains moderate security concerns that should be reviewed before deployment.";
  } else if (riskLevel === "HIGH") {
    summary =
      "The contract contains significant security issues requiring remediation and additional testing.";
  } else {
    summary =
      "Critical security risks detected. The contract should not be deployed without a full security review.";
  }

  return {
    riskScore,
    riskLevel,
    findings,
    issues,
    recommendations,
    insights,
    summary,
  };
}