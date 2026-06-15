type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type SecurityGrade = "A" | "B" | "C" | "D" | "F";
type SupportedNetwork = "ethereum" | "base" | "polygon" | "arbitrum";

type ScanRequest = {
  contractAddress: string;
  network: SupportedNetwork;
};

type SecurityFinding = {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  evidence: string;
};

type ScanReport = {
  id: string;
  contractAddress: string;
  network: SupportedNetwork;
  timestamp: string;
  trustScore: number;
  securityGrade: SecurityGrade;
  riskLevel: RiskLevel;
  overview: {
    bytecodeSize: number;
    bytecodePreview: string;
  };
  sections: {
    glamsterdamReadiness: unknown;
    evmFindings: SecurityFinding[];
    vulnerabilities: SecurityFinding[];
    sourceCodeIntelligence: { status: string; signals: string[] };
    tokenIntelligence: { status: string; signals: string[] };
    blockchainReputation: { status: string; signals: string[] };
    aiRecommendations: string[];
  };
};

type StoredScan = ScanReport & {
  riskScore: number;
};

type AnalyticsReport = {
  totalScans: number;
  networksAnalyzed: Record<string, number>;
  riskDistribution: Record<RiskLevel, number>;
  vulnerabilityStatistics: Record<string, number>;
  safeContracts: number;
  highRiskContracts: number;
  mostAnalyzedChains: Array<{ network: string; scans: number }>;
  commonVulnerabilityTypes: Array<{ type: string; count: number }>;
};

export type {
  AnalyticsReport,
  RiskLevel,
  ScanReport,
  ScanRequest,
  SecurityFinding,
  SecurityGrade,
  StoredScan,
  SupportedNetwork,
};
