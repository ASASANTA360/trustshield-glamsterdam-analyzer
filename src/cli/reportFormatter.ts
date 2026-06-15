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

type SourceReport = {
  sourceVerified: boolean;
  compilerVersion: string | null;
  optimizationEnabled: boolean;
  contractCount: number;
  sourceCodeSize: number;
  sourceFunctionCount?: number;
  sourceModifierCount?: number;
  totalFunctions: number;
  sensitiveFunctions: string[];
  sourceSecurityScore: number;
  sourceRiskLevel: string;
  sourceFindings: Array<Record<string, unknown>>;
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
  sourceVerified: boolean;
  compilerVersion: string | null;
  optimizationEnabled: boolean;
  contractCount: number;
  sourceCodeSize: number;
  totalFunctions: number;
  sensitiveFunctions: string[];
  sourceSecurityScore: number;
  sourceRiskLevel: string;
  sourceFindings: Array<Record<string, unknown>>;
  timestamp: string;
};

const DEFAULT_SOURCE_REPORT: SourceReport = {
  sourceVerified: false,
  compilerVersion: null,
  optimizationEnabled: false,
  contractCount: 0,
  sourceCodeSize: 0,
  totalFunctions: 0,
  sensitiveFunctions: [],
  sourceSecurityScore: 0,
  sourceRiskLevel: "HIGH",
  sourceFindings: [],
};

function createJsonReport(
  result: ContractResult,
  report: GlamsterdamReport,
  timestamp = new Date(),
  sourceReport: SourceReport = DEFAULT_SOURCE_REPORT
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
    sourceVerified: sourceReport.sourceVerified,
    compilerVersion: sourceReport.compilerVersion,
    optimizationEnabled: sourceReport.optimizationEnabled,
    contractCount: sourceReport.contractCount,
    sourceCodeSize: sourceReport.sourceCodeSize,
    totalFunctions: sourceReport.totalFunctions,
    sensitiveFunctions: sourceReport.sensitiveFunctions,
    sourceSecurityScore: sourceReport.sourceSecurityScore,
    sourceRiskLevel: sourceReport.sourceRiskLevel,
    sourceFindings: sourceReport.sourceFindings,
    timestamp: timestamp.toISOString(),
  };
}

function formatJsonReport(
  result: ContractResult,
  report: GlamsterdamReport,
  timestamp = new Date(),
  sourceReport: SourceReport = DEFAULT_SOURCE_REPORT
) {
  return JSON.stringify(createJsonReport(result, report, timestamp, sourceReport), null, 2);
}

function formatHumanReport(
  result: ContractResult,
  report: GlamsterdamReport,
  sourceReport: SourceReport = DEFAULT_SOURCE_REPORT
) {
  const findings = report.findings
    .map(
      (finding: any) =>
        `- [${finding.severity}] ${finding.title}\n  Evidence: ${finding.evidence}\n  Recommendation: ${finding.recommendation}`
    )
    .join("\n");
  const recommendations = report.recommendations
    .map((recommendation: string) => `- ${recommendation}`)
    .join("\n");
  const sourceFindings = sourceReport.sourceFindings.length > 0
    ? sourceReport.sourceFindings
        .map(
          (finding: any) =>
            `- [${finding.severity}] ${finding.title}\n  Evidence: ${finding.evidence}\n  Recommendation: ${finding.recommendation}`
        )
        .join("\n")
    : "- No source security findings available.";

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

Source Code Intelligence

Verification:
${sourceReport.sourceVerified ? "Verified" : "Unverified"}

Compiler:
${sourceReport.compilerVersion ?? "Unknown"}

Optimization:
${sourceReport.optimizationEnabled ? "Enabled" : "Disabled"}

Complexity:
- Contracts: ${sourceReport.contractCount}
- Source code size: ${sourceReport.sourceCodeSize} bytes
- Functions: ${sourceReport.sourceFunctionCount ?? sourceReport.totalFunctions}
- Modifiers: ${sourceReport.sourceModifierCount ?? 0}

ABI Overview:
- Total functions: ${sourceReport.totalFunctions}
- Sensitive functions detected: ${sourceReport.sensitiveFunctions.length > 0 ? sourceReport.sensitiveFunctions.join(", ") : "None"}

Source Security:
- Score: ${sourceReport.sourceSecurityScore}/100
- Risk level: ${sourceReport.sourceRiskLevel}
- Findings:
${sourceFindings}
`;
}

module.exports = {
  createJsonReport,
  formatHumanReport,
  formatJsonReport,
};
