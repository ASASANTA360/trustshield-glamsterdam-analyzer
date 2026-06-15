type ContractResult = {
  address: string;
  network: string;
  bytecodeSize: number;
  bytecodePreview: string;
};

type TokenIntelligenceReport = {
  tokenStandard: string;
  tokenRiskScore: number;
  tokenSecurityGrade: string;
  tokenRiskLevel: string;
  tokenCapabilities: string[];
  tokenFindings: Array<Record<string, unknown>>;
  rugPullIndicators: string[];
};

type GlamsterdamReport = {
  readinessScore: number;
  riskLevel: string;
  metrics: Record<string, number>;
  findings: Array<Record<string, unknown>>;
  recommendations: string[];
  tokenIntelligence?: TokenIntelligenceReport;
};

type JsonReport = {
  address: string;
  network: string;
  bytecodeSize: number;
  readinessScore: number;
  riskLevel: string;
  metrics: Record<string, number>;
  findings: Array<Record<string, unknown>>;
  recommendations: string[];
  tokenStandard?: string;
  tokenRiskScore?: number;
  tokenSecurityGrade?: string;
  tokenRiskLevel?: string;
  tokenCapabilities?: string[];
  tokenFindings?: Array<Record<string, unknown>>;
  rugPullIndicators?: string[];
  timestamp: string;
};

function createJsonReport(
  result: ContractResult,
  report: GlamsterdamReport,
  timestamp = new Date()
): JsonReport {
  const tokenIntelligence = report.tokenIntelligence;

  return {
    address: result.address,
    network: result.network,
    bytecodeSize: result.bytecodeSize,
    readinessScore: report.readinessScore,
    riskLevel: report.riskLevel,
    metrics: report.metrics,
    findings: report.findings,
    recommendations: report.recommendations,
    ...(tokenIntelligence
      ? {
          tokenStandard: tokenIntelligence.tokenStandard,
          tokenRiskScore: tokenIntelligence.tokenRiskScore,
          tokenSecurityGrade: tokenIntelligence.tokenSecurityGrade,
          tokenRiskLevel: tokenIntelligence.tokenRiskLevel,
          tokenCapabilities: tokenIntelligence.tokenCapabilities,
          tokenFindings: tokenIntelligence.tokenFindings,
          rugPullIndicators: tokenIntelligence.rugPullIndicators,
        }
      : {}),
    timestamp: timestamp.toISOString(),
  };
}

function formatJsonReport(
  result: ContractResult,
  report: GlamsterdamReport,
  timestamp = new Date()
) {
  return JSON.stringify(createJsonReport(result, report, timestamp), null, 2);
}

function formatHumanReport(result: ContractResult, report: GlamsterdamReport) {
  const findings = report.findings
    .map(
      (finding: any) =>
        `- [${finding.severity}] ${finding.title}\n  Evidence: ${finding.evidence}\n  Recommendation: ${finding.recommendation}`
    )
    .join("\n");
  const recommendations = report.recommendations
    .map((recommendation: string) => `- ${recommendation}`)
    .join("\n");
  const token = report.tokenIntelligence;
  const tokenCapabilities = token?.tokenCapabilities.length
    ? token.tokenCapabilities.map((capability) => `- ${capability}`).join("\n")
    : "- None detected";
  const tokenFindings = token?.tokenFindings.length
    ? token.tokenFindings
        .map(
          (finding: any) =>
            `- [${finding.severity}] ${finding.title}\n  Evidence: ${finding.evidence}\n  Recommendation: ${finding.recommendation}`
        )
        .join("\n")
    : "- None detected";
  const tokenSection = token
    ? `
Token Intelligence

Standard:
${token.tokenStandard}

Token Risk Score:
${token.tokenRiskScore}/100

Security Grade:
${token.tokenSecurityGrade}

Risk Level:
${token.tokenRiskLevel}

Detected Controls:
${tokenCapabilities}

Risk Findings:
${tokenFindings}
`
    : "";

  return `
TrustShield AI - Contract Report

Address:
${result.address}

Network:
${result.network}

Contract Found:
YES

Bytecode Size:
${result.bytecodeSize} bytes

Bytecode Preview:
${result.bytecodePreview}

Glamsterdam Readiness Score:
${report.readinessScore}/100

Risk Level:
${report.riskLevel}

Metrics:
- State/account access ops: ${report.metrics.stateAccessOps}
- External interaction ops: ${report.metrics.externalInteractionOps}
- Log ops: ${report.metrics.logOps}
- Block context ops: ${report.metrics.blockContextOps}
- Deprecated ops: ${report.metrics.deprecatedOps}

Findings:
${findings}

Recommendations:
${recommendations}
${tokenSection}`;
}

module.exports = {
  createJsonReport,
  formatHumanReport,
  formatJsonReport,
};
