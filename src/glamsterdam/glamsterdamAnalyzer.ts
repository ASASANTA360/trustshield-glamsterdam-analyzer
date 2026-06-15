const analyzeGasImpact = require("../gas-analysis/gasAnalyzer");
const { mapOpcodesToVulnerabilities, scoreVulnerabilities } = require("../security/vulnerabilityKnowledgeBase");

type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type FindingCategory =
  | "contract-size"
  | "gas-repricing"
  | "state-access"
  | "external-interaction"
  | "native-eth-transfer-logs"
  | "block-context"
  | "deprecated-opcode";

type Finding = {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  evidence: string;
};

type OpcodeSummary = {
  totalOpcodes: number;
  counts: Record<string, number>;
};

type GlamsterdamReport = {
  readinessScore: number;
  riskLevel: RiskLevel;
  bytecodeSize: number;
  vulnerabilities: Array<Record<string, unknown>>;
  vulnerabilityScore: number;
  criticalVulnerabilityCount: number;
  highVulnerabilityCount: number;
  vulnerabilityStatus: "SAFE" | "REVIEW REQUIRED" | "HIGH RISK" | "CRITICAL";
  swcCoverage: string[];
  cweMappings: Record<string, string[]>;
  metrics: {
    stateAccessOps: number;
    externalInteractionOps: number;
    logOps: number;
    blockContextOps: number;
    deprecatedOps: number;
  };
  opcodeSummary: OpcodeSummary;
  findings: Finding[];
  recommendations: string[];
};

const OPCODES: Record<number, string> = {
  0x31: "BALANCE",
  0x3b: "EXTCODESIZE",
  0x3c: "EXTCODECOPY",
  0x3f: "EXTCODEHASH",
  0x41: "COINBASE",
  0x42: "TIMESTAMP",
  0x43: "NUMBER",
  0x44: "PREVRANDAO",
  0x45: "GASLIMIT",
  0x46: "CHAINID",
  0x47: "SELFBALANCE",
  0x48: "BASEFEE",
  0x4a: "BLOBBASEFEE",
  0x54: "SLOAD",
  0x55: "SSTORE",
  0xa0: "LOG0",
  0xa1: "LOG1",
  0xa2: "LOG2",
  0xa3: "LOG3",
  0xa4: "LOG4",
  0xf0: "CREATE",
  0xf1: "CALL",
  0xf2: "CALLCODE",
  0xf4: "DELEGATECALL",
  0xf5: "CREATE2",
  0xfa: "STATICCALL",
  0xff: "SELFDESTRUCT",
};

const STATE_ACCESS_OPCODES = new Set([
  "SLOAD",
  "SSTORE",
  "BALANCE",
  "EXTCODESIZE",
  "EXTCODECOPY",
  "EXTCODEHASH",
  "SELFBALANCE",
]);

const EXTERNAL_INTERACTION_OPCODES = new Set([
  "CALL",
  "CALLCODE",
  "DELEGATECALL",
  "STATICCALL",
  "CREATE",
  "CREATE2",
]);

const LOG_OPCODES = new Set(["LOG0", "LOG1", "LOG2", "LOG3", "LOG4"]);
const BLOCK_CONTEXT_OPCODES = new Set([
  "COINBASE",
  "TIMESTAMP",
  "NUMBER",
  "PREVRANDAO",
  "GASLIMIT",
  "BASEFEE",
  "BLOBBASEFEE",
]);
const DEPRECATED_OPCODES = new Set(["SELFDESTRUCT", "CALLCODE"]);

function normalizeBytecode(bytecode: string) {
  return bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
}

function getBytecodeSize(bytecode: string) {
  return normalizeBytecode(bytecode).length / 2;
}

function increment(counts: Record<string, number>, opcode: string) {
  counts[opcode] = (counts[opcode] ?? 0) + 1;
}

function parseOpcodes(bytecode: string): OpcodeSummary {
  const hex = normalizeBytecode(bytecode).toLowerCase();
  const counts: Record<string, number> = {};
  let totalOpcodes = 0;

  for (let index = 0; index < hex.length; index += 2) {
    const value = Number.parseInt(hex.slice(index, index + 2), 16);

    if (Number.isNaN(value)) {
      continue;
    }

    totalOpcodes += 1;

    if (value >= 0x60 && value <= 0x7f) {
      const pushBytes = value - 0x5f;
      increment(counts, `PUSH${pushBytes}`);
      index += pushBytes * 2;
      continue;
    }

    const opcode = OPCODES[value] ?? `UNKNOWN_0x${value.toString(16).padStart(2, "0")}`;
    increment(counts, opcode);
  }

  return {
    totalOpcodes,
    counts,
  };
}

function countFromSet(counts: Record<string, number>, opcodes: Set<string>) {
  return Array.from(opcodes).reduce((sum, opcode) => sum + (counts[opcode] ?? 0), 0);
}

function getRiskLevel(score: number): RiskLevel {
  if (score < 40) {
    return "CRITICAL";
  }

  if (score < 60) {
    return "HIGH";
  }

  if (score < 80) {
    return "MEDIUM";
  }

  return "LOW";
}

function addFinding(findings: Finding[], finding: Finding) {
  findings.push(finding);
}

function getScorePenalty(severity: Severity) {
  switch (severity) {
    case "HIGH":
      return 20;
    case "MEDIUM":
      return 12;
    case "LOW":
      return 6;
    case "INFO":
      return 2;
    default:
      return 0;
  }
}

function uniqueRecommendations(findings: Finding[]) {
  return Array.from(new Set(findings.map((finding) => finding.recommendation)));
}

function analyzeGlamsterdamReadiness(bytecode: string): GlamsterdamReport {
  const bytecodeSize = getBytecodeSize(bytecode);
  const opcodeSummary = parseOpcodes(bytecode);
  const { counts } = opcodeSummary;
  const gasImpact = analyzeGasImpact(bytecodeSize);
  const findings: Finding[] = [];

  const stateAccessOps = countFromSet(counts, STATE_ACCESS_OPCODES);
  const externalInteractionOps = countFromSet(counts, EXTERNAL_INTERACTION_OPCODES);
  const logOps = countFromSet(counts, LOG_OPCODES);
  const blockContextOps = countFromSet(counts, BLOCK_CONTEXT_OPCODES);
  const deprecatedOps = countFromSet(counts, DEPRECATED_OPCODES);
  const kilobytes = Math.max(bytecodeSize / 1024, 1);
  const stateAccessDensity = stateAccessOps / kilobytes;

  if (gasImpact.riskLevel !== "LOW") {
    addFinding(findings, {
      id: "GLAM-GAS-SIZE",
      category: "contract-size",
      severity: gasImpact.riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
      title: "Large bytecode size increases gas repricing review scope",
      description:
        "Large contracts tend to carry more deployment, warm/cold access, and execution-path uncertainty during protocol upgrades.",
      recommendation:
        "Review the largest execution paths and keep deployment/runtime size under the EIP-170 contract size limit where possible.",
      evidence: `${bytecodeSize} bytes of runtime bytecode`,
    });
  }

  if (stateAccessOps > 0) {
    const severity = stateAccessDensity > 24 || stateAccessOps > 80 ? "HIGH" : stateAccessDensity > 10 ? "MEDIUM" : "LOW";
    addFinding(findings, {
      id: "GLAM-BAL-STATE-ACCESS",
      category: "state-access",
      severity,
      title: "State access pattern should be reviewed for BAL/gas accounting changes",
      description:
        "The bytecode uses storage, balance, or account-inspection opcodes that are relevant to Block-Level Access List and gas accounting proposals.",
      recommendation:
        "Profile state-heavy functions and document storage/account access assumptions before relying on Glamsterdam cost estimates.",
      evidence: `${stateAccessOps} state/account access opcodes, ${stateAccessDensity.toFixed(2)} per KiB`,
    });
  }

  if (externalInteractionOps > 0) {
    const severity = externalInteractionOps > 20 ? "HIGH" : externalInteractionOps > 6 ? "MEDIUM" : "LOW";
    addFinding(findings, {
      id: "GLAM-EXT-CALLS",
      category: "external-interaction",
      severity,
      title: "External calls need upgrade-readiness review",
      description:
        "External calls and contract creation opcodes can make execution cost and failure behavior depend on downstream contracts.",
      recommendation:
        "Run integration tests against representative downstream contracts and review fallback/revert handling around external calls.",
      evidence: `${externalInteractionOps} external interaction opcodes`,
    });
  }

  if ((counts.CALL ?? 0) > 0 || logOps > 0) {
    addFinding(findings, {
      id: "GLAM-NATIVE-ETH-LOGS",
      category: "native-eth-transfer-logs",
      severity: (counts.CALL ?? 0) > 10 ? "MEDIUM" : "LOW",
      title: "Native ETH transfer and log semantics may affect off-chain indexing",
      description:
        "Contracts that perform native ETH transfers or emit logs may need off-chain indexers to account for Glamsterdam native transfer logging proposals.",
      recommendation:
        "Check analytics, alerting, and accounting pipelines for assumptions that ETH movement is invisible unless the contract emits a custom event.",
      evidence: `${counts.CALL ?? 0} CALL opcodes and ${logOps} LOG opcodes`,
    });
  }

  if (blockContextOps > 0) {
    addFinding(findings, {
      id: "GLAM-EPBS-BLOCK-CONTEXT",
      category: "block-context",
      severity: blockContextOps > 10 ? "MEDIUM" : "LOW",
      title: "Block context usage should be reviewed for ePBS/FOCIL assumptions",
      description:
        "Block metadata opcodes can indicate sequencing, builder, time, fee, or randomness assumptions that are worth reviewing around ePBS and inclusion-list proposals.",
      recommendation:
        "Audit business logic that depends on block timestamp, number, fee fields, coinbase, or randomness-like values.",
      evidence: `${blockContextOps} block context opcodes`,
    });
  }

  if (deprecatedOps > 0) {
    addFinding(findings, {
      id: "GLAM-DEPRECATED-OPCODES",
      category: "deprecated-opcode",
      severity: "HIGH",
      title: "Deprecated or discouraged opcodes detected",
      description:
        "SELFDESTRUCT or CALLCODE usage can create migration and compatibility risk as Ethereum continues to narrow legacy behavior.",
      recommendation:
        "Replace legacy control-flow patterns and avoid relying on SELFDESTRUCT or CALLCODE behavior for upgrade readiness.",
      evidence: `${deprecatedOps} deprecated opcode occurrences`,
    });
  }

  if (findings.length === 0) {
    addFinding(findings, {
      id: "GLAM-BASELINE",
      category: "gas-repricing",
      severity: "INFO",
      title: "No high-signal bytecode risks detected",
      description:
        "The bytecode does not show strong upgrade-risk signals in the current static rule set.",
      recommendation:
        "Continue with ABI-aware and source-aware analysis for higher confidence.",
      evidence: `${opcodeSummary.totalOpcodes} parsed opcodes`,
    });
  }

  const vulnerabilities = mapOpcodesToVulnerabilities(counts);
  const vulnerabilityRisk = scoreVulnerabilities(vulnerabilities);

  const rawScore = findings.reduce(
    (score, finding) => score - getScorePenalty(finding.severity),
    100
  );
  const readinessScore = Math.max(0, Math.min(100, rawScore));

  return {
    readinessScore,
    riskLevel: getRiskLevel(readinessScore),
    bytecodeSize,
    metrics: {
      stateAccessOps,
      externalInteractionOps,
      logOps,
      blockContextOps,
      deprecatedOps,
    },
    opcodeSummary,
    vulnerabilities,
    vulnerabilityScore: vulnerabilityRisk.vulnerabilityScore,
    criticalVulnerabilityCount: vulnerabilityRisk.criticalVulnerabilityCount,
    highVulnerabilityCount: vulnerabilityRisk.highVulnerabilityCount,
    vulnerabilityStatus: vulnerabilityRisk.vulnerabilityStatus,
    swcCoverage: vulnerabilityRisk.swcCoverage,
    cweMappings: vulnerabilityRisk.cweMappings,
    findings,
    recommendations: uniqueRecommendations(findings),
  };
}

module.exports = {
  analyzeGlamsterdamReadiness,
  parseOpcodes,
};
