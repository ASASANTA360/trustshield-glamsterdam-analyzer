type TokenStandard = "ERC-20" | "ERC-721" | "ERC-1155" | "UNKNOWN";
type TokenSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type TokenRiskLevel = "SAFE" | "CAUTION" | "HIGH RISK" | "CRITICAL";
type TokenSecurityGrade = "A" | "B" | "C" | "D" | "F";

type AbiEntry = {
  type?: string;
  name?: string;
  inputs?: Array<{ type?: string; name?: string }>;
  outputs?: Array<{ type?: string; name?: string }>;
  stateMutability?: string;
};

type TokenFinding = {
  id: string;
  severity: TokenSeverity;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
};

type TokenIntelligenceReport = {
  tokenStandard: TokenStandard;
  tokenRiskScore: number;
  tokenSecurityGrade: TokenSecurityGrade;
  tokenRiskLevel: TokenRiskLevel;
  tokenCapabilities: string[];
  tokenFindings: TokenFinding[];
  rugPullIndicators: string[];
};

type AnalyzeTokenOptions = {
  abi?: AbiEntry[] | string | null;
  sourceCode?: string | null;
  bytecode?: string | null;
};

const ERC20_REQUIRED = ["totalSupply", "balanceOf", "transfer", "allowance", "approve", "transferFrom"];
const ERC721_SIGNALS = ["ownerOf", "safeTransferFrom", "setApprovalForAll", "getApproved"];
const ERC1155_SIGNALS = ["balanceOfBatch", "safeBatchTransferFrom", "setApprovalForAll", "uri"];

function parseAbi(abi?: AbiEntry[] | string | null): AbiEntry[] {
  if (!abi) {
    return [];
  }

  if (Array.isArray(abi)) {
    return abi;
  }

  try {
    const parsed = JSON.parse(abi);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function getFunctionEntries(abi: AbiEntry[]) {
  return abi.filter((entry) => entry.type === "function" && typeof entry.name === "string");
}

function functionNames(abi: AbiEntry[]) {
  return new Set(getFunctionEntries(abi).map((entry) => String(entry.name)));
}

function hasAll(names: Set<string>, required: string[]) {
  return required.every((name) => names.has(name));
}

function hasAny(names: Set<string>, candidates: string[]) {
  return candidates.some((name) => names.has(name));
}

function normalizeSource(sourceCode?: string | null) {
  return (sourceCode ?? "").toLowerCase();
}

function detectTokenStandard(abiInput?: AbiEntry[] | string | null): TokenStandard {
  const abi = parseAbi(abiInput);
  const names = functionNames(abi);

  if (hasAll(names, ERC20_REQUIRED)) {
    return "ERC-20";
  }

  if (hasAll(names, ERC1155_SIGNALS)) {
    return "ERC-1155";
  }

  if (hasAny(names, ERC721_SIGNALS) && names.has("ownerOf")) {
    return "ERC-721";
  }

  return "UNKNOWN";
}

function addFinding(findings: TokenFinding[], finding: TokenFinding) {
  findings.push(finding);
}

function entryMatches(entry: AbiEntry, patterns: RegExp[]) {
  const name = entry.name ?? "";
  return patterns.some((pattern) => pattern.test(name));
}

function findFunctions(abi: AbiEntry[], patterns: RegExp[]) {
  return getFunctionEntries(abi).filter((entry) => entryMatches(entry, patterns));
}

function addCapability(capabilities: Set<string>, label: string, condition: boolean) {
  if (condition) {
    capabilities.add(label);
  }
}

function severityPenalty(severity: TokenSeverity) {
  switch (severity) {
    case "CRITICAL":
      return 28;
    case "HIGH":
      return 18;
    case "MEDIUM":
      return 10;
    case "LOW":
      return 5;
    case "INFO":
      return 0;
    default:
      return 0;
  }
}

function gradeForScore(score: number): TokenSecurityGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function riskLevelForScore(score: number): TokenRiskLevel {
  if (score >= 90) return "SAFE";
  if (score >= 70) return "CAUTION";
  if (score >= 50) return "HIGH RISK";
  return "CRITICAL";
}

function finalizeReport(tokenStandard: TokenStandard, capabilities: Set<string>, findings: TokenFinding[], rugPullIndicators: string[]): TokenIntelligenceReport {
  const rawScore = findings.reduce((score, finding) => score - severityPenalty(finding.severity), 100);
  const tokenRiskScore = Math.max(0, Math.min(100, rawScore));

  return {
    tokenStandard,
    tokenRiskScore,
    tokenSecurityGrade: gradeForScore(tokenRiskScore),
    tokenRiskLevel: riskLevelForScore(tokenRiskScore),
    tokenCapabilities: Array.from(capabilities).sort(),
    tokenFindings: findings,
    rugPullIndicators: Array.from(new Set(rugPullIndicators)),
  };
}

function analyzeTokenIntelligence(options: AnalyzeTokenOptions = {}): TokenIntelligenceReport {
  const abi = parseAbi(options.abi);
  const names = functionNames(abi);
  const source = normalizeSource(options.sourceCode);
  const tokenStandard = detectTokenStandard(abi);
  const capabilities = new Set<string>();
  const findings: TokenFinding[] = [];
  const rugPullIndicators: string[] = [];

  if (abi.length === 0) {
    addFinding(findings, {
      id: "TOKEN-MISSING-ABI",
      severity: "INFO",
      title: "Token intelligence limited without ABI",
      description: "Token standard and privileged controls could not be confirmed because no contract ABI was provided.",
      evidence: "ABI unavailable",
      recommendation: "Provide a verified ABI and source code to enable full token and rug-pull intelligence.",
    });
    return finalizeReport("UNKNOWN", capabilities, findings, rugPullIndicators);
  }

  const mintFunctions = findFunctions(abi, [/^mint$/i, /mint/i]);
  const burnFunctions = findFunctions(abi, [/burn/i]);
  const ownerFunctions = findFunctions(abi, [/owner/i, /ownership/i, /^renounceOwnership$/i]);
  const blacklistFunctions = findFunctions(abi, [/blacklist/i, /blocklist/i, /denylist/i]);
  const whitelistFunctions = findFunctions(abi, [/whitelist/i, /allowlist/i]);
  const restrictionFunctions = findFunctions(abi, [/limit/i, /cooldown/i, /maxwallet/i, /maxtransaction/i, /excludeFrom/i, /trading/i]);
  const feeFunctions = findFunctions(abi, [/fee/i, /tax/i, /royalty/i]);
  const pauseFunctions = findFunctions(abi, [/pause/i, /unpause/i]);
  const upgradeFunctions = findFunctions(abi, [/upgrade/i, /implementation/i, /proxy/i]);
  const emergencyFunctions = findFunctions(abi, [/emergency/i, /withdraw/i, /rescue/i, /sweep/i, /recover/i]);
  const freezeFunctions = findFunctions(abi, [/freeze/i, /lock/i, /blacklist/i, /pause/i]);
  const adminFunctions = findFunctions(abi, [/admin/i, /owner/i, /role/i, /grant/i, /revoke/i, /operator/i]);
  const batchMintFunctions = findFunctions(abi, [/mintBatch/i, /batchMint/i]);
  const supplyFunctions = findFunctions(abi, [/supply/i, /cap/i, /mint/i, /burn/i]);
  const approvalFunctions = findFunctions(abi, [/setApprovalForAll/i, /operator/i, /approval/i]);
  const metadataFunctions = findFunctions(abi, [/set.*uri/i, /baseuri/i, /tokenuri/i, /contracturi/i, /metadata/i]);

  addCapability(capabilities, "Mintable", mintFunctions.length > 0 || source.includes("_mint("));
  addCapability(capabilities, "Burnable", burnFunctions.length > 0);
  addCapability(capabilities, "Ownable", ownerFunctions.length > 0 || source.includes("ownable"));
  addCapability(capabilities, "Blacklist", blacklistFunctions.length > 0);
  addCapability(capabilities, "Whitelist", whitelistFunctions.length > 0);
  addCapability(capabilities, "Transfer Restricted", restrictionFunctions.length > 0 || freezeFunctions.length > 0);
  addCapability(capabilities, "Tax/Fee", feeFunctions.length > 0);
  addCapability(capabilities, "Pausable", pauseFunctions.length > 0 || source.includes("pausable"));
  addCapability(capabilities, "Upgradeable", upgradeFunctions.length > 0 || source.includes("delegatecall") || source.includes("uupsupgradeable"));

  if (mintFunctions.length > 0) {
    const unlimited = !names.has("cap") && !source.includes("erc20capped") && !source.includes("maxsupply");
    addFinding(findings, {
      id: "TOKEN-MINT-AUTHORITY",
      severity: unlimited ? "CRITICAL" : "HIGH",
      title: unlimited ? "Unlimited mint authority detected" : "Privileged mint capability detected",
      description: "Privileged mint functions can inflate supply and dilute holders if governance or access control fails.",
      evidence: mintFunctions.map((entry) => entry.name).join(", "),
      recommendation: "Enforce immutable supply caps, timelocked minting, and transparent role governance.",
    });
    rugPullIndicators.push(unlimited ? "Unlimited token creation" : "Admin mint permissions");
  }

  if (blacklistFunctions.length > 0 || freezeFunctions.length > 0) {
    addFinding(findings, {
      id: "TOKEN-FREEZE-CONTROLS",
      severity: "HIGH",
      title: "Ability to freeze or block user transfers detected",
      description: "Blacklist, freeze, lock, or pause controls may prevent holders from transferring tokens.",
      evidence: [...blacklistFunctions, ...freezeFunctions].map((entry) => entry.name).join(", "),
      recommendation: "Limit transfer-freeze powers with clear policy, multisig authorization, and timelocks.",
    });
    rugPullIndicators.push("Ability to freeze user transfers");
  }

  if (feeFunctions.length > 0 && tokenStandard === "ERC-20") {
    addFinding(findings, {
      id: "TOKEN-TAX-FEE",
      severity: "MEDIUM",
      title: "Transaction tax or fee mechanism detected",
      description: "Mutable transfer taxes or fees can unexpectedly reduce holder proceeds or block exits.",
      evidence: feeFunctions.map((entry) => entry.name).join(", "),
      recommendation: "Cap fees, disclose fee destinations, and require timelocks for fee changes.",
    });
  }

  if (upgradeFunctions.length > 0) {
    addFinding(findings, {
      id: "TOKEN-UPGRADEABILITY",
      severity: "HIGH",
      title: "Upgradeable token pattern detected",
      description: "Upgradeable implementations can introduce backdoors or change token behavior after deployment.",
      evidence: upgradeFunctions.map((entry) => entry.name).join(", "),
      recommendation: "Use audited upgrade paths, multisig ownership, timelocks, and public upgrade notices.",
    });
    rugPullIndicators.push("Upgrade backdoors");
  }

  if (emergencyFunctions.length > 0) {
    addFinding(findings, {
      id: "TOKEN-EMERGENCY-WITHDRAWAL",
      severity: "HIGH",
      title: "Emergency withdrawal or asset recovery function detected",
      description: "Emergency withdrawal functions can extract assets if overly broad or centrally controlled.",
      evidence: emergencyFunctions.map((entry) => entry.name).join(", "),
      recommendation: "Constrain recoverable assets, exclude user balances, and require multisig or timelock execution.",
    });
    rugPullIndicators.push("Emergency withdrawal functions");
  }

  if (adminFunctions.length >= 4) {
    addFinding(findings, {
      id: "TOKEN-EXCESSIVE-ADMIN",
      severity: "MEDIUM",
      title: "Excessive admin powers detected",
      description: "Multiple privileged role, owner, operator, or admin functions increase centralization and rug-pull risk.",
      evidence: adminFunctions.map((entry) => entry.name).join(", "),
      recommendation: "Reduce privileged surface area and publish role assignments, multisig policy, and revocation plans.",
    });
    rugPullIndicators.push("Excessive admin powers");
  }

  if (tokenStandard === "ERC-721") {
    if (metadataFunctions.length > 0) {
      addFinding(findings, { id: "NFT-METADATA-CONTROL", severity: "MEDIUM", title: "Metadata URI control detected", description: "Mutable NFT metadata can alter collection traits or asset references.", evidence: metadataFunctions.map((entry) => entry.name).join(", "), recommendation: "Freeze metadata after reveal or protect URI changes with timelocks and transparent governance." });
    }
    if (feeFunctions.length > 0) {
      addFinding(findings, { id: "NFT-ROYALTY-CONTROL", severity: "LOW", title: "Royalty configuration detected", description: "Royalty controls can affect secondary-market economics.", evidence: feeFunctions.map((entry) => entry.name).join(", "), recommendation: "Disclose royalty basis points and restrict post-mint royalty increases." });
    }
    if (ownerFunctions.length > 0 || adminFunctions.length > 0) {
      rugPullIndicators.push("Ownership concentration");
    }
  }

  if (tokenStandard === "ERC-1155") {
    if (batchMintFunctions.length > 0) {
      addFinding(findings, { id: "ERC1155-BATCH-MINT", severity: "HIGH", title: "Batch mint capability detected", description: "Batch minting can rapidly expand multi-token supply if access control is compromised.", evidence: batchMintFunctions.map((entry) => entry.name).join(", "), recommendation: "Constrain batch minting with supply caps, role separation, and event monitoring." });
      rugPullIndicators.push("Unlimited token creation");
    }
    if (supplyFunctions.length > 2) {
      addFinding(findings, { id: "ERC1155-SUPPLY-MANAGEMENT", severity: "MEDIUM", title: "Supply management controls detected", description: "Dynamic ERC-1155 supply controls can affect scarcity across token IDs.", evidence: supplyFunctions.map((entry) => entry.name).join(", "), recommendation: "Document supply policy per token ID and enforce caps where scarcity is promised." });
    }
    if (approvalFunctions.length > 0) {
      addFinding(findings, { id: "ERC1155-OPERATOR-APPROVAL", severity: "LOW", title: "Operator approval surface detected", description: "Operator approvals can move all of a holder's ERC-1155 balances if abused by a malicious operator.", evidence: approvalFunctions.map((entry) => entry.name).join(", "), recommendation: "Warn users about broad operator approvals and monitor suspicious operator contracts." });
    }
  }

  if (findings.length === 0) {
    addFinding(findings, {
      id: "TOKEN-BASELINE",
      severity: "INFO",
      title: "No high-signal token risks detected",
      description: "The ABI does not expose high-signal privileged token controls in the current deterministic rule set.",
      evidence: `${getFunctionEntries(abi).length} ABI functions reviewed`,
      recommendation: "Continue with verified source review and runtime monitoring for complete assurance.",
    });
  }

  return finalizeReport(tokenStandard, capabilities, findings, rugPullIndicators);
}

module.exports = {
  analyzeTokenIntelligence,
  detectTokenStandard,
};
