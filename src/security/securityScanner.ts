const generateAiSecurityIntelligence = require("./aiSecurityIntelligence");

type SecurityRiskLevel = "LOW" | "MEDIUM" | "HIGH";

type FindingSeverity = "LOW" | "MEDIUM" | "HIGH";

interface SecurityFinding {
  id: string;
  title: string;
  severity: FindingSeverity;
  opcode: string;
  count: number;
  description: string;
  recommendation: string;
}

interface SecurityAnalysisResult {
  securityScore: number;
  securityRiskLevel: SecurityRiskLevel;
  securityFindings: SecurityFinding[];
  securityRecommendations: string[];
  securityGrade: "A" | "B" | "C" | "D" | "F";
  aiSecuritySummary: string;
  aiRecommendations: string[];
}

interface SecurityRule {
  id: string;
  title: string;
  severity: FindingSeverity;
  opcode: string;
  byte: number;
  penalty: number;
  description: string;
  recommendation: string;
}

const SECURITY_RULES: SecurityRule[] = [
  {
    id: "delegatecall-usage",
    title: "DELEGATECALL usage detected",
    severity: "HIGH",
    opcode: "DELEGATECALL",
    byte: 0xf4,
    penalty: 30,
    description:
      "The contract uses DELEGATECALL, which executes external code in the current contract context and can corrupt storage or bypass authorization when the target is untrusted or upgrade controls are weak.",
    recommendation:
      "Restrict delegatecall targets to audited implementations, protect upgrade paths with strong access control and timelocks, and verify storage layout compatibility before upgrades.",
  },
  {
    id: "selfdestruct-opcode",
    title: "SELFDESTRUCT opcode detected",
    severity: "HIGH",
    opcode: "SELFDESTRUCT",
    byte: 0xff,
    penalty: 35,
    description:
      "The contract contains SELFDESTRUCT, a destructive opcode that can permanently alter contract availability assumptions and has changed semantics across Ethereum upgrades.",
    recommendation:
      "Remove SELFDESTRUCT-dependent flows where possible and replace emergency shutdown behavior with pause controls or guarded withdrawal mechanisms.",
  },
  {
    id: "dangerous-external-call",
    title: "Dangerous external call pattern detected",
    severity: "MEDIUM",
    opcode: "CALL",
    byte: 0xf1,
    penalty: 18,
    description:
      "The contract performs low-level external CALL operations, which can transfer control to untrusted contracts and introduce reentrancy or unchecked-return risks.",
    recommendation:
      "Apply checks-effects-interactions, use reentrancy guards around state-changing external calls, and ensure every low-level call return value is validated.",
  },
  {
    id: "callcode-usage",
    title: "CALLCODE usage detected",
    severity: "HIGH",
    opcode: "CALLCODE",
    byte: 0xf2,
    penalty: 28,
    description:
      "The contract uses CALLCODE, a legacy low-level call opcode with delegate-like context behavior that is error-prone and rarely appropriate in modern contracts.",
    recommendation:
      "Replace CALLCODE with explicit, audited interfaces or a well-reviewed proxy pattern that uses DELEGATECALL only under strict controls.",
  },
  {
    id: "staticcall-low-level",
    title: "Suspicious low-level STATICCALL detected",
    severity: "LOW",
    opcode: "STATICCALL",
    byte: 0xfa,
    penalty: 8,
    description:
      "The contract uses low-level STATICCALL. While read-only, it can still hide brittle dependency assumptions or unchecked response handling.",
    recommendation:
      "Prefer typed interfaces for read-only integrations and validate returned data length and decoding assumptions.",
  },
];

function normalizeBytecode(bytecode?: string): string {
  if (!bytecode || bytecode === "0x") {
    return "";
  }

  const hex = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
  return /^[0-9a-fA-F]*$/.test(hex) && hex.length % 2 === 0 ? hex.toLowerCase() : "";
}

function extractOpcodes(bytecode?: string): number[] {
  const hex = normalizeBytecode(bytecode);
  const opcodes: number[] = [];

  for (let index = 0; index < hex.length; index += 2) {
    const opcode = Number.parseInt(hex.slice(index, index + 2), 16);
    opcodes.push(opcode);

    if (opcode >= 0x60 && opcode <= 0x7f) {
      index += (opcode - 0x5f) * 2;
    }
  }

  return opcodes;
}

function getRiskLevel(score: number): SecurityRiskLevel {
  if (score < 60) {
    return "HIGH";
  }

  if (score < 80) {
    return "MEDIUM";
  }

  return "LOW";
}

function analyzeSecurity(bytecode?: string): SecurityAnalysisResult {
  const opcodes = extractOpcodes(bytecode);
  const findings: SecurityFinding[] = [];
  let totalPenalty = 0;

  for (const rule of SECURITY_RULES) {
    const count = opcodes.filter((opcode) => opcode === rule.byte).length;

    if (count === 0) {
      continue;
    }

    totalPenalty += rule.penalty + Math.max(0, count - 1) * Math.ceil(rule.penalty / 3);
    findings.push({
      id: rule.id,
      title: rule.title,
      severity: rule.severity,
      opcode: rule.opcode,
      count,
      description: rule.description,
      recommendation: rule.recommendation,
    });
  }

  const securityScore = Math.max(0, 100 - totalPenalty);
  const securityRecommendations = findings.length > 0
    ? findings.map((finding) => finding.recommendation)
    : ["No high-risk low-level EVM patterns were detected in the deployed bytecode. Continue using audited dependencies and defense-in-depth reviews."];

  const baseAnalysis = {
    securityScore,
    securityRiskLevel: getRiskLevel(securityScore),
    securityFindings: findings,
    securityRecommendations,
  };
  const aiSecurityIntelligence = generateAiSecurityIntelligence(baseAnalysis);

  return {
    ...baseAnalysis,
    ...aiSecurityIntelligence,
  };
}

export = analyzeSecurity;
