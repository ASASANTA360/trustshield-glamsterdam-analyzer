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
  vulnerabilities?: Array<Record<string, any>>;
  vulnerabilityScore?: number;
  vulnerabilityStatus?: string;
  swcCoverage?: string[];
  cweMappings?: Record<string, string[]>;
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
  vulnerabilities?: Array<Record<string, any>>;
  vulnerabilityScore?: number;
  vulnerabilityStatus?: string;
  swcCoverage?: string[];
  cweMappings?: Record<string, string[]>;
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
    vulnerabilities: report.vulnerabilities ?? [],
    vulnerabilityScore: report.vulnerabilityScore ?? 0,
    vulnerabilityStatus: report.vulnerabilityStatus ?? "SAFE",
    swcCoverage: report.swcCoverage ?? [],
    cweMappings: report.cweMappings ?? {},
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
  const vulnerabilities = (report.vulnerabilities ?? [])
    .map(
      (vulnerability: any) =>
        `- ${vulnerability.name}\n  SWC ID: ${vulnerability.swcId}\n  CWE: ${vulnerability.cweId}\n  Severity: ${vulnerability.severity}\n  Description: ${vulnerability.description}\n  Attack Scenario: ${vulnerability.attackScenario}\n  Recommendation: ${vulnerability.remediation}\n  References: ${(vulnerability.references ?? []).join(", ")}`
    )
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

Vulnerability Intelligence:
Status: ${report.vulnerabilityStatus ?? "SAFE"}
Vulnerability Score: ${report.vulnerabilityScore ?? 0}/100
SWC Coverage: ${(report.swcCoverage ?? []).join(", ") || "None"}
CWE Mappings: ${Object.keys(report.cweMappings ?? {}).join(", ") || "None"}
${vulnerabilities || "No mapped vulnerabilities detected."}

Recommendations:
${recommendations}
`;
}

module.exports = {
  createJsonReport,
  formatHumanReport,
  formatJsonReport,
};
