type ReputationRiskLevel = "LOW" | "MEDIUM" | "HIGH";
type TrustRiskLevel = "SAFE" | "CAUTION" | "HIGH RISK" | "CRITICAL";
type VerificationStatus = "verified" | "not_verified" | "unknown";

type FindingLike = {
  severity?: string;
};

type SecurityReportLike = {
  readinessScore?: number;
  findings?: FindingLike[];
};

type ContractHistoryInput = {
  deployedAt?: Date | string | number | null;
  deploymentBlock?: number | null;
  deployerAddress?: string | null;
  verificationStatus?: VerificationStatus | boolean | null;
  metadata?: Record<string, unknown> | null;
  knownDeploymentCount?: number | null;
  highRiskDeploymentPattern?: boolean;
};

type HistoricalFinding = {
  id: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH";
  title: string;
  evidence: string;
  recommendation: string;
};

type HistoricalRiskIntelligence = {
  trustScore: number;
  trustRiskLevel: TrustRiskLevel;
  contractAge: number | null;
  deploymentHistory: string[];
  verificationStatus: VerificationStatus;
  reputationScore: number;
  reputationRiskLevel: ReputationRiskLevel;
  historicalFindings: HistoricalFinding[];
  intelligenceRecommendations: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeVerificationStatus(status: ContractHistoryInput["verificationStatus"]): VerificationStatus {
  if (status === true || status === "verified") {
    return "verified";
  }

  if (status === false || status === "not_verified") {
    return "not_verified";
  }

  return "unknown";
}

function getContractAge(deployedAt: ContractHistoryInput["deployedAt"], now: Date) {
  if (deployedAt === undefined || deployedAt === null) {
    return null;
  }

  const deployedDate = deployedAt instanceof Date ? deployedAt : new Date(deployedAt);
  const time = deployedDate.getTime();

  if (Number.isNaN(time) || time > now.getTime()) {
    return null;
  }

  return Math.floor((now.getTime() - time) / DAY_MS);
}

function getAiSecurityScore(report: SecurityReportLike) {
  const findings = report.findings ?? [];
  const penalty = findings.reduce((total, finding) => {
    switch (finding.severity) {
      case "HIGH":
        return total + 18;
      case "MEDIUM":
        return total + 10;
      case "LOW":
        return total + 4;
      case "INFO":
        return total + 1;
      default:
        return total;
    }
  }, 0);

  return clampScore(100 - penalty);
}

function addUnique(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function hasSuspiciousMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return false;
  }

  return Boolean(
    metadata.suspicious === true ||
      metadata.proxyWithoutImplementation === true ||
      metadata.unusualCompiler === true ||
      metadata.hiddenOwner === true ||
      metadata.hasMutableFees === true
  );
}

function getReputationRiskLevel(score: number): ReputationRiskLevel {
  if (score < 50) {
    return "HIGH";
  }

  if (score < 75) {
    return "MEDIUM";
  }

  return "LOW";
}

function getTrustRiskLevel(score: number): TrustRiskLevel {
  if (score < 40) {
    return "CRITICAL";
  }

  if (score < 60) {
    return "HIGH RISK";
  }

  if (score < 85) {
    return "CAUTION";
  }

  return "SAFE";
}

function analyzeHistoricalRiskIntelligence(
  securityReport: SecurityReportLike,
  history: ContractHistoryInput = {},
  now = new Date()
): HistoricalRiskIntelligence {
  const contractAge = getContractAge(history.deployedAt, now);
  const verificationStatus = normalizeVerificationStatus(history.verificationStatus);
  const findings: HistoricalFinding[] = [];
  const recommendations: string[] = [];
  const deploymentHistory: string[] = [];
  let reputationScore = 100;

  if (contractAge === null) {
    reputationScore -= 20;
    findings.push({
      id: "HIST-UNKNOWN-AGE",
      severity: "MEDIUM",
      title: "Unknown contract age",
      evidence: "No reliable deployment timestamp was available for this contract.",
      recommendation: "Confirm deployment block and deployer history before approving high-value interactions.",
    });
    addUnique(recommendations, "Confirm deployment age and provenance with an explorer or indexed chain data.");
  } else {
    deploymentHistory.push(`Contract age: ${contractAge} days`);

    if (contractAge < 7) {
      reputationScore -= 30;
      findings.push({
        id: "HIST-VERY-NEW-CONTRACT",
        severity: "HIGH",
        title: "Contract is very new",
        evidence: `Contract age is ${contractAge} days.`,
        recommendation: "Avoid large exposure until the contract establishes operational history.",
      });
      addUnique(recommendations, "Treat very new contracts as high risk until they have meaningful operating history.");
    } else if (contractAge < 60) {
      reputationScore -= 14;
      findings.push({
        id: "HIST-NEW-CONTRACT",
        severity: "MEDIUM",
        title: "Contract is relatively new",
        evidence: `Contract age is ${contractAge} days.`,
        recommendation: "Perform manual review and monitor early user reports.",
      });
      addUnique(recommendations, "Manual review recommended for relatively new contracts.");
    }
  }

  if (verificationStatus !== "verified") {
    reputationScore -= verificationStatus === "not_verified" ? 22 : 12;
    findings.push({
      id: "HIST-MISSING-VERIFICATION",
      severity: verificationStatus === "not_verified" ? "HIGH" : "MEDIUM",
      title: verificationStatus === "not_verified" ? "Contract source is not verified" : "Verification status is unknown",
      evidence: `Verification status: ${verificationStatus}.`,
      recommendation: "Request verified source code and compare compiled bytecode before trusting privileged flows.",
    });
    addUnique(recommendations, "Request verified source code before relying on the contract.");
  }

  if (history.highRiskDeploymentPattern || (history.knownDeploymentCount ?? 0) > 20) {
    reputationScore -= 18;
    findings.push({
      id: "HIST-HIGH-RISK-DEPLOYMENT-PATTERN",
      severity: "HIGH",
      title: "High-risk deployment pattern detected",
      evidence: history.highRiskDeploymentPattern
        ? "Deployment metadata was flagged as high risk."
        : `Deployer has ${history.knownDeploymentCount} known deployments.`,
      recommendation: "Review deployer history for clones, abandoned contracts, rug-pull reports, and exploit reuse.",
    });
    addUnique(recommendations, "Review deployer history for high-risk deployment patterns.");
  }

  if (hasSuspiciousMetadata(history.metadata)) {
    reputationScore -= 16;
    findings.push({
      id: "HIST-SUSPICIOUS-METADATA",
      severity: "HIGH",
      title: "Suspicious contract metadata flags detected",
      evidence: "Metadata includes suspicious, privileged, or unusual configuration flags.",
      recommendation: "Inspect owner privileges, proxy targets, compiler settings, and mutable fee controls.",
    });
    addUnique(recommendations, "Inspect suspicious metadata flags before interacting with the contract.");
  }

  if (findings.length === 0) {
    findings.push({
      id: "HIST-BASELINE",
      severity: "INFO",
      title: "No historical reputation warnings generated",
      evidence: "Available age, verification, and deployment metadata did not trigger reputation warnings.",
      recommendation: "Continue monitoring reputation signals as new on-chain history accumulates.",
    });
    addUnique(recommendations, "Continue monitoring historical and reputation signals.");
  }

  const normalizedReputationScore = clampScore(reputationScore);
  const scannerScore = securityReport.readinessScore ?? 75;
  const aiSecurityScore = getAiSecurityScore(securityReport);
  const trustScore = clampScore(scannerScore * 0.5 + aiSecurityScore * 0.2 + normalizedReputationScore * 0.3);

  if (history.deploymentBlock) {
    deploymentHistory.push(`Deployment block: ${history.deploymentBlock}`);
  }
  if (history.deployerAddress) {
    deploymentHistory.push(`Deployer: ${history.deployerAddress}`);
  }

  return {
    trustScore,
    trustRiskLevel: getTrustRiskLevel(trustScore),
    contractAge,
    deploymentHistory,
    verificationStatus,
    reputationScore: normalizedReputationScore,
    reputationRiskLevel: getReputationRiskLevel(normalizedReputationScore),
    historicalFindings: findings,
    intelligenceRecommendations: recommendations,
  };
}

module.exports = {
  analyzeHistoricalRiskIntelligence,
  getReputationRiskLevel,
  getTrustRiskLevel,
};
