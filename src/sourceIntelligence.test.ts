const test = require("node:test");
const assert = require("node:assert/strict");
const {
  analyzeAbi,
  analyzeSourceCode,
  analyzeSourceSecurity,
  analyzeVerifiedSource,
  parseSourceFiles,
} = require("./sourceIntelligence");

test("parses Solidity source complexity from standard-json explorer payloads", () => {
  const source = JSON.stringify({
    sources: {
      "Token.sol": {
        content: `pragma solidity ^0.8.20;
contract Token {
  modifier onlyOwner() { _; }
  function mint(address to, uint256 amount) external onlyOwner {}
  function burn(uint256 amount) public {}
}
interface IToken { function totalSupply() external view returns (uint256); }`,
      },
    },
  });

  const analysis = analyzeSourceCode(source);

  assert.equal(analysis.contractCount, 2);
  assert.equal(analysis.functionCount, 3);
  assert.equal(analysis.modifierCount, 1);
  assert.ok(analysis.sourceCodeSize > 0);
});

test("unwraps double-braced explorer source payloads", () => {
  const files = parseSourceFiles(`{{"sources":{"A.sol":{"content":"contract A {}"}}}}`);

  assert.deepEqual(files, ["contract A {}"]);
});

test("analyzes ABI functions and sensitive function names", () => {
  const abi = JSON.stringify([
    { type: "function", name: "owner", stateMutability: "view" },
    { type: "function", name: "mint", stateMutability: "nonpayable" },
    { type: "function", name: "balanceOf", stateMutability: "view" },
    { type: "event", name: "Transfer" },
  ]);

  const analysis = analyzeAbi(abi);

  assert.equal(analysis.totalFunctions, 3);
  assert.deepEqual(analysis.sensitiveFunctions, ["mint", "owner"]);
});

test("scores source security risks from admin, mint, proxy, and emergency controls", () => {
  const abiAnalysis = analyzeAbi(JSON.stringify([
    { type: "function", name: "owner" },
    { type: "function", name: "mint" },
    { type: "function", name: "upgradeTo" },
    { type: "function", name: "pause" },
  ]));
  const security = analyzeSourceSecurity("contract Token is Pausable { modifier onlyOwner() { _; } }", abiAnalysis);

  assert.equal(security.sourceRiskLevel, "HIGH");
  assert.equal(security.sourceSecurityScore, 28);
  assert.deepEqual(
    security.sourceFindings.map((finding: any) => finding.id),
    ["SRC-ADMIN-CONTROLS", "SRC-UNLIMITED-MINT", "SRC-UPGRADEABLE-PROXY", "SRC-EMERGENCY-CONTROLS"]
  );
});

test("handles missing and malformed source data safely", () => {
  const unverified = analyzeVerifiedSource(null);
  assert.equal(unverified.sourceVerified, false);
  assert.equal(unverified.sourceSecurityScore, 0);
  assert.equal(unverified.totalFunctions, 0);

  const malformed = analyzeVerifiedSource({
    SourceCode: "contract Broken { function mint() external {}",
    ABI: "not-json",
    CompilerVersion: "v0.8.24+commit.e11b9ed9",
    OptimizationUsed: "0",
  });

  assert.equal(malformed.sourceVerified, true);
  assert.equal(malformed.compilerVersion, "v0.8.24+commit.e11b9ed9");
  assert.equal(malformed.optimizationEnabled, false);
  assert.equal(malformed.contractCount, 1);
  assert.equal(malformed.totalFunctions, 0);
});
