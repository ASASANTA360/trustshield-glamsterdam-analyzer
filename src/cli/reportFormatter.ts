type BlockchainIntelligence = {
  blockchainVerification?: boolean | undefined;
  deploymentTimestamp?: string | undefined;
  deploymentBlock?: number | undefined;
  deployerAddress?: string | undefined;
  transactionCount?: number | undefined;
  firstSeen?: string | undefined;
  latestActivity?: string | undefined;
  activityScore?: number | undefined;
  contractAgeDays?: number | undefined;
  blockchainReputationScore?: number | undefined;
  confidenceLevel?: string | undefined;
  blockchainFindings?: Array<Record<string, unknown>> | undefined;
};

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
  blockchainVerification?: boolean | undefined;
  deploymentTimestamp?: string | undefined;
  deploymentBlock?: number | undefined;
  deployerAddress?: string | undefined;
  transactionCount?: number | undefined;
  activityScore?: number | undefined;
  blockchainReputationScore?: number | undefined;
  blockchainFindings?: Array<Record<string, unknown>> | undefined;
};

function createJsonReport(
  result: ContractResult,
  report: GlamsterdamReport,
  timestamp = new Date(),
  blockchainIntelligence?: BlockchainIntelligence
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
    blockchainVerification: blockchainIntelligence?.blockchainVerification,
    deploymentTimestamp: blockchainIntelligence?.deploymentTimestamp,
    deploymentBlock: blockchainIntelligence?.deploymentBlock,
    deployerAddress: blockchainIntelligence?.deployerAddress,
    transactionCount: blockchainIntelligence?.transactionCount,
    activityScore: blockchainIntelligence?.activityScore,
    blockchainReputationScore: blockchainIntelligence?.blockchainReputationScore,
    blockchainFindings: blockchainIntelligence?.blockchainFindings,
  };
}

function formatJsonReport(
  result: ContractResult,
  report: GlamsterdamReport,
  timestamp = new Date(),
  blockchainIntelligence?: BlockchainIntelligence
) {
  return JSON.stringify(createJsonReport(result, report, timestamp, blockchainIntelligence), null, 2);
}

function formatHumanReport(result: ContractResult, report: GlamsterdamReport, blockchainIntelligence?: BlockchainIntelligence) {
  const findings = report.findings
    .map(
      (finding: any) =>
        `- [${finding.severity}] ${finding.title}\n  Evidence: ${finding.evidence}\n  Recommendation: ${finding.recommendation}`
    )
    .join("\n");
  const recommendations = report.recommendations
    .map((recommendation: string) => `- ${recommendation}`)
    .join("\n");

  const blockchainFindings = (blockchainIntelligence?.blockchainFindings ?? [])
    .map((finding: any) => `- [${finding.severity}] ${finding.title}
  Evidence: ${finding.evidence}`)
    .join("\n");
  const verification = blockchainIntelligence?.blockchainVerification === true ? "Verified" : blockchainIntelligence?.blockchainVerification === false ? "Unverified" : "Unknown";

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

Blockchain Intelligence:

Verification:
${verification}

Contract Age:
${blockchainIntelligence?.contractAgeDays ?? "Unknown"} days

Deployer:
${blockchainIntelligence?.deployerAddress ?? "Unknown"}

Activity:
Transaction count: ${blockchainIntelligence?.transactionCount ?? "Unknown"}
First seen: ${blockchainIntelligence?.firstSeen ?? "Unknown"}
Latest activity: ${blockchainIntelligence?.latestActivity ?? "Unknown"}

Reputation:
${blockchainIntelligence?.blockchainReputationScore ?? "Unknown"}/100 (${blockchainIntelligence?.confidenceLevel ?? "UNKNOWN"} confidence)

Blockchain Findings:
${blockchainFindings || "- None"}

Recommendations:
${recommendations}
`;
}

module.exports = {
  createJsonReport,
  formatHumanReport,
  formatJsonReport,
};
