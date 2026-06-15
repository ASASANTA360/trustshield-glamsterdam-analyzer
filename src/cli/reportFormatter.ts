type ContractResult = {
  address: string;
  network: string;
  bytecodeSize: number;
  bytecodePreview: string;
};

type GlamsterdamReport = {
  readinessScore: number;
  riskLevel: string;
  metrics: Record<string, number>;
  findings: Array<Record<string, unknown>>;
  recommendations: string[];
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
  timestamp: string;
};

function createJsonReport(
  result: ContractResult,
  report: GlamsterdamReport,
  timestamp = new Date()
): JsonReport {
  return {
    address: result.address,
    network: result.network,
    bytecodeSize: result.bytecodeSize,
    readinessScore: report.readinessScore,
    riskLevel: report.riskLevel,
    metrics: report.metrics,
    findings: report.findings,
    recommendations: report.recommendations,
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
`;
}

module.exports = {
  createJsonReport,
  formatHumanReport,
  formatJsonReport,
};
