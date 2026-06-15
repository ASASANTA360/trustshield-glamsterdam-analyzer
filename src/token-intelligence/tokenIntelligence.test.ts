const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeTokenIntelligence, detectTokenStandard } = require("./tokenIntelligence");

function fn(name: string) {
  return { type: "function", name, inputs: [], outputs: [] };
}

const erc20Abi = ["totalSupply", "balanceOf", "transfer", "allowance", "approve", "transferFrom"].map(fn);
const erc721Abi = ["balanceOf", "ownerOf", "safeTransferFrom", "setApprovalForAll", "getApproved", "tokenURI"].map(fn);
const erc1155Abi = ["balanceOf", "balanceOfBatch", "safeTransferFrom", "safeBatchTransferFrom", "setApprovalForAll", "uri"].map(fn);

test("detects supported token standards from ABI functions", () => {
  assert.equal(detectTokenStandard(erc20Abi), "ERC-20");
  assert.equal(detectTokenStandard(erc721Abi), "ERC-721");
  assert.equal(detectTokenStandard(erc1155Abi), "ERC-1155");
  assert.equal(detectTokenStandard([fn("foo")]), "UNKNOWN");
});

test("analyzes ERC-20 mint, fee, pause, owner, blacklist, and upgrade risks", () => {
  const report = analyzeTokenIntelligence({
    abi: [
      ...erc20Abi,
      fn("mint"),
      fn("burn"),
      fn("owner"),
      fn("blacklist"),
      fn("setWhitelist"),
      fn("setMaxTransactionAmount"),
      fn("setTaxFee"),
      fn("pause"),
      fn("upgradeTo"),
      fn("emergencyWithdraw"),
    ],
  });

  assert.equal(report.tokenStandard, "ERC-20");
  assert.equal(report.tokenSecurityGrade, "F");
  assert.equal(report.tokenRiskLevel, "CRITICAL");
  assert.ok(report.tokenRiskScore < 60);
  assert.ok(report.tokenCapabilities.includes("Mintable"));
  assert.ok(report.tokenCapabilities.includes("Tax/Fee"));
  assert.ok(report.tokenCapabilities.includes("Pausable"));
  assert.ok(report.tokenFindings.some((finding: any) => finding.id === "TOKEN-MINT-AUTHORITY"));
  assert.ok(report.rugPullIndicators.includes("Unlimited token creation"));
  assert.ok(report.rugPullIndicators.includes("Emergency withdrawal functions"));
});

test("analyzes ERC-721 NFT admin mint, metadata, royalty, upgradeability, and concentration risks", () => {
  const report = analyzeTokenIntelligence({
    abi: [...erc721Abi, fn("mintTo"), fn("setBaseURI"), fn("setRoyaltyInfo"), fn("upgradeTo"), fn("owner")],
    sourceCode: "contract NFT is Ownable {}",
  });

  assert.equal(report.tokenStandard, "ERC-721");
  assert.ok(report.tokenCapabilities.includes("Mintable"));
  assert.ok(report.tokenCapabilities.includes("Ownable"));
  assert.ok(report.tokenFindings.some((finding: any) => finding.id === "NFT-METADATA-CONTROL"));
  assert.ok(report.tokenFindings.some((finding: any) => finding.id === "NFT-ROYALTY-CONTROL"));
  assert.ok(report.tokenFindings.some((finding: any) => finding.id === "TOKEN-UPGRADEABILITY"));
  assert.ok(report.rugPullIndicators.includes("Ownership concentration"));
});

test("analyzes ERC-1155 batch mint, admin, supply, and operator approval risks", () => {
  const report = analyzeTokenIntelligence({
    abi: [...erc1155Abi, fn("mintBatch"), fn("grantRole"), fn("revokeRole"), fn("admin"), fn("totalSupply"), fn("maxSupply"), fn("burn")],
  });

  assert.equal(report.tokenStandard, "ERC-1155");
  assert.ok(report.tokenFindings.some((finding: any) => finding.id === "ERC1155-BATCH-MINT"));
  assert.ok(report.tokenFindings.some((finding: any) => finding.id === "ERC1155-SUPPLY-MANAGEMENT"));
  assert.ok(report.tokenFindings.some((finding: any) => finding.id === "ERC1155-OPERATOR-APPROVAL"));
  assert.ok(report.rugPullIndicators.includes("Unlimited token creation"));
});

test("scores low-risk token ABI as grade A and SAFE", () => {
  const report = analyzeTokenIntelligence({ abi: erc20Abi });

  assert.equal(report.tokenRiskScore, 100);
  assert.equal(report.tokenSecurityGrade, "A");
  assert.equal(report.tokenRiskLevel, "SAFE");
  assert.equal(report.tokenFindings[0].id, "TOKEN-BASELINE");
});

test("handles missing ABI without throwing", () => {
  const report = analyzeTokenIntelligence();

  assert.equal(report.tokenStandard, "UNKNOWN");
  assert.equal(report.tokenRiskScore, 100);
  assert.equal(report.tokenFindings[0].id, "TOKEN-MISSING-ABI");
});
