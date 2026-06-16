export interface RiskAssessment {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
}

export function classifyRisk(
  issues: string[]
): RiskAssessment {

  const totalIssues = issues.length;

  if (totalIssues === 0) {
    return {
      score: 95,
      level: "LOW",
      summary:
        "No significant security issues detected.",
    };
  }

  if (totalIssues <= 2) {
    return {
      score: 70,
      level: "MEDIUM",
      summary:
        "Some security concerns require review.",
    };
  }

  if (totalIssues <= 4) {
    return {
      score: 45,
      level: "HIGH",
      summary:
        "Multiple security risks detected.",
    };
  }

  return {
    score: 20,
    level: "CRITICAL",
    summary:
      "Critical security concerns detected. Immediate review recommended.",
  };
}