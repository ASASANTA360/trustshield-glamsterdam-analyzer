// Import using CommonJS require and fallbacks to handle modules that don't export
// fetchContractCode as a named export.
const _contractFetcher: any = require("../blockchain/contractFetcher");
const fetchContractCode: any = _contractFetcher.fetchContractCode ?? _contractFetcher.default ?? _contractFetcher;
const analyzeSecurity: any = require("../security/securityScanner");

const args = process.argv.slice(2);

const command = args[0];
const address = args[1];
const jsonOutput = args.includes("--json");

function isValidEthereumAddress(addr?: string): boolean {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function formatSecurityFindings(findings: any[]): string {
  if (findings.length === 0) {
    return "✅ No high-risk low-level EVM patterns detected";
  }

  return findings
    .map((finding) => `- [${finding.severity}] ${finding.title} (${finding.count} ${finding.opcode})\n  ${finding.description}`)
    .join("\n");
}

function formatSecurityRecommendations(recommendations: string[]): string {
  return recommendations.map((recommendation) => `- ${recommendation}`).join("\n");
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

  if (!jsonOutput) {
    console.log("🔍 Connecting to Ethereum...");
  }
  
  const result = await fetchContractCode(address);

  if (!result.exists) {
    console.log("❌", result.message);
    return;
  }

  const securityAnalysis = analyzeSecurity(result.bytecode);

  if (jsonOutput) {
    console.log(JSON.stringify({
      address: result.address,
      contractFound: true,
      bytecodeSize: result.bytecodeSize,
      bytecodePreview: result.bytecodePreview,
      securityScore: securityAnalysis.securityScore,
      securityRiskLevel: securityAnalysis.securityRiskLevel,
      securityFindings: securityAnalysis.securityFindings,
      securityRecommendations: securityAnalysis.securityRecommendations,
    }, null, 2));
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

Security Score:
${securityAnalysis.securityScore}/100 (${securityAnalysis.securityRiskLevel})

Security Findings:
${formatSecurityFindings(securityAnalysis.securityFindings)}

Security Recommendations:
${formatSecurityRecommendations(securityAnalysis.securityRecommendations)}

Next Checks:
- Gas repricing impact
- EVM opcode compatibility
- Contract optimization recommendations
`);
}

main().catch(console.error);