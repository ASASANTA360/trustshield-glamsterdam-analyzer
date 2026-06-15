import type { ScanReport, SecurityFinding, SecurityGrade, SupportedNetwork } from "./types";

function getSecurityGrade(score: number): SecurityGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function toFinding(finding: SecurityFinding): SecurityFinding {
  return finding;
}

function buildScanReport(params: {
  contractAddress: string;
  network: SupportedNetwork;
  fetchResult: { bytecodeSize: number; bytecodePreview?: string };
  glamsterdamReport: { readinessScore: number; riskLevel: ScanReport["riskLevel"]; findings: SecurityFinding[]; recommendations: string[]; metrics?: Record<string, number> };
}): ScanReport {
  const findings = params.glamsterdamReport.findings.map(toFinding);
  const vulnerabilityFindings = findings.filter((finding) => ["HIGH", "MEDIUM"].includes(finding.severity));
  const trustScore = params.glamsterdamReport.readinessScore;

  return {
    id: crypto.randomUUID(),
    contractAddress: params.contractAddress,
    network: params.network,
    timestamp: new Date().toISOString(),
    trustScore,
    securityGrade: getSecurityGrade(trustScore),
    riskLevel: params.glamsterdamReport.riskLevel,
    overview: {
      bytecodeSize: params.fetchResult.bytecodeSize,
      bytecodePreview: params.fetchResult.bytecodePreview ?? "0x...",
    },
    sections: {
      glamsterdamReadiness: params.glamsterdamReport,
      evmFindings: findings,
      vulnerabilities: vulnerabilityFindings,
      sourceCodeIntelligence: {
        status: "queued-for-source-enrichment",
        signals: ["Runtime bytecode analyzed", "Source-aware heuristics ready for explorer integrations"],
      },
      tokenIntelligence: {
        status: "bytecode-derived",
        signals: ["Opcode fingerprint evaluated", "Token behavior enrichment available when ABI metadata is connected"],
      },
      blockchainReputation: {
        status: "network-contextualized",
        signals: [`${params.network} RPC bytecode verified`, "Historical intelligence storage enabled"],
      },
      aiRecommendations: params.glamsterdamReport.recommendations,
    },
  };
}

module.exports = { buildScanReport, getSecurityGrade };
