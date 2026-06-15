#!/usr/bin/env node

const _contractFetcher: any = require("../blockchain/contractFetcher");
const fetchContractCode: any =
  _contractFetcher.fetchContractCode ?? _contractFetcher.default ?? _contractFetcher;
const _gasAnalyzer: any = require("../gas-analysis/gasAnalyzer");
const analyzeGasImpact: any = _gasAnalyzer.default ?? _gasAnalyzer;

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

  const gasImpact = analyzeGasImpact(result.bytecodeSize);
  const warnings = gasImpact.warnings.length
    ? gasImpact.warnings.map((warning: string) => `- ${warning}`).join("\n")
    : "- No immediate gas-size warnings detected.";

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

Gas Impact Score:
${gasImpact.score}/100

Risk Level:
${gasImpact.riskLevel}

Warnings:
${warnings}

Next Checks:
- EVM opcode compatibility
- Contract optimization recommendations
- AI-assisted explanation layer
`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
