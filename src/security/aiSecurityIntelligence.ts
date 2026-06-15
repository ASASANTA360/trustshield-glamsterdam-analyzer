type SecurityRiskLevel = "LOW" | "MEDIUM" | "HIGH";
type SecurityGrade = "A" | "B" | "C" | "D" | "F";
type FindingSeverity = "LOW" | "MEDIUM" | "HIGH";

interface SecurityFinding {
  id: string;
  title: string;
  severity: FindingSeverity;
  opcode: string;
  count: number;
  description: string;
  recommendation: string;
}

interface SecurityAnalysisInput {
  securityScore: number;
  securityRiskLevel: SecurityRiskLevel;
  securityFindings: SecurityFinding[];
  securityRecommendations: string[];
}

interface AiSecurityIntelligenceResult {
  securityGrade: SecurityGrade;
  aiSecuritySummary: string;
  aiRecommendations: string[];
}

function getSecurityGrade(score: number): SecurityGrade {
  if (score >= 90) {
    return "A";
  }

  if (score >= 80) {
    return "B";
  }

  if (score >= 70) {
    return "C";
  }

  if (score >= 60) {
    return "D";
  }

  return "F";
}

function describeGrade(grade: SecurityGrade): string {
  switch (grade) {
    case "A":
      return "strong bytecode security posture";
    case "B":
      return "good security posture with limited review items";
    case "C":
      return "moderate security posture that needs targeted hardening";
    case "D":
      return "weak security posture with important remediation work";
    case "F":
      return "critical security posture that requires immediate review";
  }
}

function summarizeFindings(findings: SecurityFinding[]): string {
  if (findings.length === 0) {
    return "No dangerous low-level EVM patterns were identified by the static bytecode scanner.";
  }

  const highCount = findings.filter((finding) => finding.severity === "HIGH").length;
  const mediumCount = findings.filter((finding) => finding.severity === "MEDIUM").length;
  const lowCount = findings.filter((finding) => finding.severity === "LOW").length;
  const topFindings = findings.slice(0, 3).map((finding) => `${finding.opcode} (${finding.severity})`).join(", ");

  return `Detected ${findings.length} security finding(s): ${highCount} high, ${mediumCount} medium, and ${lowCount} low severity. Primary review areas: ${topFindings}.`;
}

function buildAiRecommendations(input: SecurityAnalysisInput): string[] {
  if (input.securityFindings.length === 0) {
    return [
      "Maintain the current defensive posture with regular dependency updates, bytecode reviews, and regression testing before upgrades.",
      "Continue using defense-in-depth controls such as least-privilege roles, monitoring, and staged deployments.",
      "Re-run TrustShield analysis after each material contract change or compiler upgrade.",
    ];
  }

  const recommendations = input.securityFindings.map((finding) => (
    `${finding.opcode}: ${finding.recommendation} Developer note: ${finding.description}`
  ));

  recommendations.push(
    "Prioritize remediation by severity, then re-run the analyzer to confirm the security score and grade improve.",
  );

  if (input.securityRiskLevel !== "LOW") {
    recommendations.push(
      "Schedule a manual smart contract review before production deployment because the automated scan found non-trivial risk indicators.",
    );
  }

  return recommendations;
}

function generateAiSecurityIntelligence(input: SecurityAnalysisInput): AiSecurityIntelligenceResult {
  const securityGrade = getSecurityGrade(input.securityScore);
  const aiSecuritySummary = [
    `TrustShield AI assigns security grade ${securityGrade} with a score of ${input.securityScore}/100, indicating a ${describeGrade(securityGrade)}.`,
    `Overall risk level is ${input.securityRiskLevel}.`,
    summarizeFindings(input.securityFindings),
  ].join(" ");

  return {
    securityGrade,
    aiSecuritySummary,
    aiRecommendations: buildAiRecommendations(input),
  };
}

generateAiSecurityIntelligence.getSecurityGrade = getSecurityGrade;

export = generateAiSecurityIntelligence;
