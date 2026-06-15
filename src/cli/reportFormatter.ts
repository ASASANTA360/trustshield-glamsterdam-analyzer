type ContractResult = {
  address: string;
  network: string;
  bytecodeSize: number;
  bytecodePreview: string;
};

type HistoricalIntelligenceReport = {
  trustScore: number;
  trustRiskLevel: string;
  contractAge: number | null;
  verificationStatus: string;
  reputationScore: number;
  reputationRiskLevel: string;
  historicalFindings: Array<Record<string, unknown>>;
  intelligenceRecommendations: string[];
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
  trustScore: number;
  trustRiskLevel: string;
  contractAge: number | null;
  verificationStatus: string;
  reputationScore: number;
  historicalFindings: Array<Record<string, unknown>>;
  intelligenceRecommendations: string[];
  timestamp: string;
};

function createJsonReport(
  result: ContractResult,
  report: GlamsterdamReport,
  intelligence: HistoricalIntelligenceReport,
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
    trustScore: intelligence.trustScore,
    trustRiskLevel: intelligence.trustRiskLevel,
    contractAge: intelligence.contractAge,
    verificationStatus: intelligence.verificationStatus,
    reputationScore: intelligence.reputationScore,
    historicalFindings: intelligence.historicalFindings,
    intelligenceRecommendations: intelligence.intelligenceRecommendations,
    timestamp: timestamp.toISOString(),
  };
}

function formatJsonReport(
  result: ContractResult,
  report: GlamsterdamReport,
  intelligence: HistoricalIntelligenceReport,
  timestamp = new Date()
) {
  return JSON.stringify(createJsonReport(result, report, intelligence, timestamp), null, 2);
}

function formatHumanReport(
  result: ContractResult,
  report: GlamsterdamReport,
  intelligence: HistoricalIntelligenceReport
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
  const historicalFindings = intelligence.historicalFindings
    .map((finding: any) => `- ${finding.title}`)
    .join("\n");
  const intelligenceRecommendations = intelligence.intelligenceRecommendations
    .map((recommendation: string) => `- ${recommendation}`)
    .join("\n");
  const contractAge = intelligence.contractAge === null ? "Unknown" : `${intelligence.contractAge} days`;

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

TrustShield Risk Intelligence:

Overall Trust Score:
${intelligence.trustScore}/100

Risk Level:
${intelligence.trustRiskLevel}

Historical Analysis:
- Contract age: ${contractAge}
- Verification: ${intelligence.verificationStatus}
- Reputation: ${intelligence.reputationRiskLevel} risk (${intelligence.reputationScore}/100)

Risk Insights:
${historicalFindings}

Intelligence Recommendations:
${intelligenceRecommendations}

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
