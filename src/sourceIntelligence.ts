type Severity = "LOW" | "MEDIUM" | "HIGH";
type SourceRiskLevel = "LOW" | "MEDIUM" | "HIGH";

type AbiInput = string | Array<Record<string, any>> | undefined | null;

type SourceFinding = {
  id: string;
  severity: Severity;
  title: string;
  evidence: string;
  recommendation: string;
};

type ExplorerSourceResult = {
  SourceCode?: string;
  ABI?: string;
  CompilerVersion?: string;
  OptimizationUsed?: string;
};

const SENSITIVE_FUNCTIONS = new Set([
  "owner",
  "transferOwnership",
  "renounceOwnership",
  "upgrade",
  "upgradeTo",
  "pause",
  "unpause",
  "mint",
  "burn",
  "withdraw",
  "emergencyWithdraw",
  "setAdmin",
]);

function parseAbi(abi: AbiInput): Array<Record<string, any>> {
  if (Array.isArray(abi)) return abi;
  if (!abi || abi === "Contract source code not verified") return [];
  try {
    const parsed = JSON.parse(abi);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function analyzeAbi(abi: AbiInput) {
  const entries = parseAbi(abi);
  const functions = entries.filter(
    (entry) => entry?.type === "function" && (entry.stateMutability || entry.name)
  );
  const publicExternalFunctions = functions.filter(
    (entry) => entry.name && entry.type === "function"
  );
  const sensitiveFunctions = Array.from(
    new Set(
      publicExternalFunctions
        .map((entry) => String(entry.name))
        .filter((name) => SENSITIVE_FUNCTIONS.has(name))
    )
  ).sort();

  return {
    totalFunctions: publicExternalFunctions.length,
    sensitiveFunctions,
    functions: publicExternalFunctions.map((entry) => ({
      name: String(entry.name),
      stateMutability: entry.stateMutability ?? "nonpayable",
    })),
  };
}

function unwrapExplorerSource(sourceCode?: string) {
  if (!sourceCode) return "";
  const trimmed = sourceCode.trim();

  if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseSourceFiles(sourceCode?: string): string[] {
  const unwrapped = unwrapExplorerSource(sourceCode);
  if (!unwrapped || unwrapped === "Contract source code not verified") return [];

  try {
    const parsed = JSON.parse(unwrapped);
    if (typeof parsed === "string") return [parsed];
    if (parsed?.sources && typeof parsed.sources === "object") {
      return Object.values(parsed.sources)
        .map((source: any) => source?.content)
        .filter((content): content is string => typeof content === "string");
    }
  } catch {
    // Plain Solidity source from explorers is not JSON.
  }

  return [unwrapped];
}

function countMatches(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

function analyzeSourceCode(sourceCode?: string) {
  const files = parseSourceFiles(sourceCode);
  const combinedSource = files.join("\n");
  return {
    contractCount: countMatches(combinedSource, /\b(?:contract|library|interface)\s+[A-Za-z_][A-Za-z0-9_]*/g),
    sourceCodeSize: Buffer.byteLength(combinedSource, "utf8"),
    functionCount: countMatches(combinedSource, /\bfunction\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/g),
    modifierCount: countMatches(combinedSource, /\bmodifier\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/g),
    sourceText: combinedSource,
  };
}

function getSourceRiskLevel(score: number): SourceRiskLevel {
  if (score < 50) return "HIGH";
  if (score < 80) return "MEDIUM";
  return "LOW";
}

function addFinding(findings: SourceFinding[], finding: SourceFinding) {
  findings.push(finding);
}

function analyzeSourceSecurity(sourceText: string, abiAnalysis: ReturnType<typeof analyzeAbi>) {
  const findings: SourceFinding[] = [];
  const lowerSource = sourceText.toLowerCase();
  const sensitive = new Set(abiAnalysis.sensitiveFunctions);

  if (["owner", "transferOwnership", "setAdmin"].some((name) => sensitive.has(name)) || /\bonlyowner\b|\bonlyadmin\b/i.test(sourceText)) {
    addFinding(findings, {
      id: "SRC-ADMIN-CONTROLS",
      severity: "MEDIUM",
      title: "Privileged administrative controls detected",
      evidence: `Administrative indicators: ${abiAnalysis.sensitiveFunctions.filter((name) => ["owner", "transferOwnership", "setAdmin"].includes(name)).join(", ") || "source modifiers"}`,
      recommendation: "Protect privileged roles with multisig governance, timelocks, and clear operational runbooks.",
    });
  }

  if (sensitive.has("mint") && !/maxsupply|cap\(|capped/i.test(sourceText)) {
    addFinding(findings, {
      id: "SRC-UNLIMITED-MINT",
      severity: "HIGH",
      title: "Potential unlimited token mint capability",
      evidence: "ABI exposes mint and source does not show an obvious cap or maxSupply guard.",
      recommendation: "Enforce explicit supply caps or role-scoped mint limits and document mint authority.",
    });
  }

  if (["upgrade", "upgradeTo"].some((name) => sensitive.has(name)) || /delegatecall|erc1967|uups|transparentupgradeableproxy|proxyadmin/i.test(sourceText)) {
    addFinding(findings, {
      id: "SRC-UPGRADEABLE-PROXY",
      severity: "HIGH",
      title: "Upgradeable proxy pattern detected",
      evidence: "Upgrade function or proxy-related source pattern detected.",
      recommendation: "Require audited upgrade authorization, timelocks, implementation validation, and emergency rollback plans.",
    });
  }

  if (["pause", "unpause", "emergencyWithdraw"].some((name) => sensitive.has(name)) || lowerSource.includes("pausable")) {
    addFinding(findings, {
      id: "SRC-EMERGENCY-CONTROLS",
      severity: "LOW",
      title: "Pause or emergency control mechanisms detected",
      evidence: `Emergency controls: ${abiAnalysis.sensitiveFunctions.filter((name) => ["pause", "unpause", "emergencyWithdraw"].includes(name)).join(", ") || "Pausable source pattern"}`,
      recommendation: "Define incident-response criteria and ensure emergency powers are monitored and access-controlled.",
    });
  }

  const score = Math.max(0, findings.reduce((current, finding) => {
    if (finding.severity === "HIGH") return current - 25;
    if (finding.severity === "MEDIUM") return current - 15;
    return current - 7;
  }, 100));

  return {
    sourceSecurityScore: score,
    sourceRiskLevel: getSourceRiskLevel(score),
    sourceFindings: findings,
  };
}

function analyzeVerifiedSource(result?: ExplorerSourceResult | null) {
  const sourceVerified = Boolean(result?.SourceCode && result.SourceCode !== "Contract source code not verified");
  const sourceAnalysis = analyzeSourceCode(sourceVerified ? result?.SourceCode : "");
  const abiAnalysis = analyzeAbi(result?.ABI);
  const security = sourceVerified
    ? analyzeSourceSecurity(sourceAnalysis.sourceText, abiAnalysis)
    : { sourceSecurityScore: 0, sourceRiskLevel: "HIGH" as SourceRiskLevel, sourceFindings: [] as SourceFinding[] };

  return {
    sourceVerified,
    compilerVersion: result?.CompilerVersion || null,
    optimizationEnabled: result?.OptimizationUsed === "1",
    contractCount: sourceAnalysis.contractCount,
    sourceCodeSize: sourceAnalysis.sourceCodeSize,
    sourceFunctionCount: sourceAnalysis.functionCount,
    sourceModifierCount: sourceAnalysis.modifierCount,
    totalFunctions: abiAnalysis.totalFunctions,
    sensitiveFunctions: abiAnalysis.sensitiveFunctions,
    ...security,
  };
}

module.exports = {
  SENSITIVE_FUNCTIONS,
  analyzeAbi,
  analyzeSourceCode,
  analyzeSourceSecurity,
  analyzeVerifiedSource,
  parseAbi,
  parseSourceFiles,
};
