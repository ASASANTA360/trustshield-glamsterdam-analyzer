// Import using CommonJS require and fallbacks to handle modules that don't export
// fetchContractCode as a named export.
const _contractFetcher: any = require("../blockchain/contractFetcher");
const fetchContractCode: any = _contractFetcher.fetchContractCode ?? _contractFetcher.default ?? _contractFetcher;

const args = process.argv.slice(2);

const command = args[0];
const address = args[1];

function isValidEthereumAddress(addr?: string): boolean {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function main() {
  if (command !== "analyze") {
    console.log(`
🛡️ TrustShield AI — Glamsterdam Analyzer

Usage:
  trustshield analyze <contract-address>
`);
    process.exit(1);
  }

  if (!isValidEthereumAddress(address)) {
    console.error("❌ Invalid Ethereum address");
    process.exit(1);
  }

  console.log("🔍 Connecting to Ethereum...");
  
  const result = await fetchContractCode(address);

  if (!result.exists) {
    console.log("❌", result.message);
    return;
  }

  console.log(`
🛡️ TrustShield AI — Contract Report

Address:
${result.address}

Contract Found:
YES

Bytecode Size:
${result.bytecodeSize} bytes

Bytecode Preview:
${result.bytecodePreview}

Glamsterdam Status:
🟡 Analysis Engine In Development

Next Checks:
- Gas repricing impact
- EVM opcode compatibility
- Contract optimization recommendations
`);
}

main().catch(console.error);