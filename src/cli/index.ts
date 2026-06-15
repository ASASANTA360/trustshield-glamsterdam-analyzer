#!/usr/bin/env node

const _contractFetcher: any = require("../blockchain/contractFetcher");
const fetchContractCode: any =
  _contractFetcher.fetchContractCode ?? _contractFetcher.default ?? _contractFetcher;
const _glamsterdamAnalyzer: any = require("../glamsterdam/glamsterdamAnalyzer");
const analyzeGlamsterdamReadiness: any =
  _glamsterdamAnalyzer.analyzeGlamsterdamReadiness ??
  _glamsterdamAnalyzer.default ??
  _glamsterdamAnalyzer;
const { fetchContractSource } = require("../blockchain/sourceFetcher");
const { analyzeVerifiedSource } = require("../sourceIntelligence");
const { parseCliOptions } = require("./cliOptions");
const { getSupportedNetworks } = require("../blockchain/networks");
const { formatHumanReport, formatJsonReport } = require("./reportFormatter");

const options = parseCliOptions(process.argv.slice(2));

function isValidEthereumAddress(addr?: string): boolean {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function main() {
  if (options.command !== "analyze") {
    console.log(`
TrustShield AI - Glamsterdam Analyzer

Usage:
  trustshield analyze <contract-address> [--network <network>] [--json]

Environment:
  ETH_RPC_URL        Ethereum JSON-RPC endpoint
  ETHERSCAN_API_KEY  Etherscan-compatible explorer API key (or network-specific keys)
  BASE_RPC_URL       Base JSON-RPC endpoint
  POLYGON_RPC_URL    Polygon JSON-RPC endpoint
  ARBITRUM_RPC_URL   Arbitrum JSON-RPC endpoint
  RPC_TIMEOUT_MS     RPC timeout in milliseconds

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

  const result = await fetchContractCode(options.address, { network: options.network });

  if (!result.exists) {
    console.log(result.message);
    if (result.error) {
      console.error(`Details: ${result.error}`);
    }
    process.exitCode = 1;
    return;
  }

  const report = analyzeGlamsterdamReadiness(result.bytecode);
  const sourceResult = await fetchContractSource(options.address, { network: options.network });
  const sourceReport = analyzeVerifiedSource(sourceResult.source);
  const output = options.outputJson
    ? formatJsonReport(result, report, undefined, sourceReport)
    : formatHumanReport(result, report, sourceReport);

  console.log(output);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
