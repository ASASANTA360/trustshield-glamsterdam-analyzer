#!/usr/bin/env node

const _contractFetcher: any = require("../blockchain/contractFetcher");
const fetchContractCode: any =
  _contractFetcher.fetchContractCode ?? _contractFetcher.default ?? _contractFetcher;
const _glamsterdamAnalyzer: any = require("../glamsterdam/glamsterdamAnalyzer");
const analyzeGlamsterdamReadiness: any =
  _glamsterdamAnalyzer.analyzeGlamsterdamReadiness ??
  _glamsterdamAnalyzer.default ??
  _glamsterdamAnalyzer;

const args = process.argv.slice(2);

const command = args[0];
const address = args[1];

function isValidEthereumAddress(addr?: string): boolean {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function main() {
  if (command !== "analyze") {
    console.log(`
TrustShield AI - Glamsterdam Analyzer

Usage:
  trustshield analyze <contract-address>

Environment:
  ETH_RPC_URL       Ethereum JSON-RPC endpoint
  RPC_TIMEOUT_MS   RPC timeout in milliseconds
`);
    process.exit(1);
  }

  if (!isValidEthereumAddress(address)) {
    console.error("Invalid Ethereum address");
    process.exit(1);
  }

  console.log("Connecting to Ethereum...");

  const result = await fetchContractCode(address);

  if (!result.exists) {
    console.log(result.message);
    if (result.error) {
      console.error(`Details: ${result.error}`);
    }
    process.exitCode = 1;
    return;
  }

  const report = analyzeGlamsterdamReadiness(result.bytecode);
  const findings = report.findings
    .map(
      (finding: any) =>
        `- [${finding.severity}] ${finding.title}\n  Evidence: ${finding.evidence}\n  Recommendation: ${finding.recommendation}`
    )
    .join("\n");
  const recommendations = report.recommendations
    .map((recommendation: string) => `- ${recommendation}`)
    .join("\n");

  console.log(`
TrustShield AI - Contract Report

Address:
${result.address}

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
`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
