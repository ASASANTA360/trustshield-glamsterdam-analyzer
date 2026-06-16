#!/usr/bin/env node

import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const { fetchContractCode } = require("../blockchain/contractFetcher");
const { analyzeGlamsterdamReadiness } = require("../glamsterdam/glamsterdamAnalyzer");
const { parseCliOptions } = require("./cliOptions");
const { getSupportedNetworks } = require("../blockchain/networks");
const { formatHumanReport, formatJsonReport } = require("./reportFormatter");
const { analyzeCairoContract } = require("../starknet/cairoAnalyzer");

const options = parseCliOptions(process.argv.slice(2));

function isValidEthereumAddress(addr?: string): boolean {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function main() {
  if (options.command === "analyze-cairo") {
    const filePath = options.address;

    if (!filePath || !fs.existsSync(filePath)) {
      console.error("Cairo file not found. Usage: trustshield analyze-cairo <file.cairo>");
      process.exit(1);
    }

    const sourceCode = fs.readFileSync(filePath, "utf8");
    const report = analyzeCairoContract(sourceCode);

    if (options.outputJson) {
  console.log(JSON.stringify(report, null, 2));
  return;
}

    console.log(`
TrustShield AI — Cairo Security Report

Risk Score: ${report.riskScore}
Risk Level: ${report.riskLevel}

Findings:
LOW: ${report.findings.low}
MEDIUM: ${report.findings.medium}
HIGH: ${report.findings.high}
CRITICAL: ${report.findings.critical}

Issues:
${report.issues.length ? report.issues.map((i: string) => `- ${i}`).join("\n") : "- None detected"}

Security Summary:
${report.summary}

AI Security Insights:
${report.insights.length
  ? report.insights
      .map(
        (insight: any) => `
[${insight.severity}] ${insight.title}
Explanation: ${insight.explanation}
Attack Scenario: ${insight.attackScenario}
Fix Suggestion: ${insight.fixSuggestion}`
      )
      .join("\n")
  : "- None"}

Recommendations:
${report.recommendations.length ? report.recommendations.map((r: string) => `- ${r}`).join("\n") : "- None"}
`);

    return;
  }

  if (options.command !== "analyze") {
    console.log(`
TrustShield AI - Glamsterdam Analyzer

Usage:
  trustshield analyze <contract-address> [--network <network>] [--json]
  trustshield analyze-cairo <file.cairo>

Networks:
  ${getSupportedNetworks().join(", ")} (default: ethereum)
`);
    process.exit(1);
  }

  if (options.networkError) {
    console.error(options.networkError);
    process.exit(1);
  }

  if (!isValidEthereumAddress(options.address)) {
    console.error("Invalid Ethereum address");
    process.exit(1);
  }

  if (!options.outputJson) {
    console.log(`Connecting to ${options.network}...`);
  }

  const result = await fetchContractCode(options.address, {
    network: options.network,
  });

  if (!result.exists) {
    console.log(result.message);
    if (result.error) {
      console.error(`Details: ${result.error}`);
    }
    process.exitCode = 1;
    return;
  }

  const report = analyzeGlamsterdamReadiness(result.bytecode);
  const output = options.outputJson
    ? formatJsonReport(result, report)
    : formatHumanReport(result, report);

  console.log(output);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});