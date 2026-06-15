const test = require("node:test");
const assert = require("node:assert/strict");
const {
  classifyBlockchainFindings,
  fetchBlockchainIntelligence,
  parseBlockResponse,
  parseContractCreationResponse,
  parseSourceCodeResponse,
  parseTransactionListResponse,
  scoreBlockchainReputation,
} = require("./intelligence");

const NOW = new Date("2026-06-15T00:00:00.000Z");

test("parses explorer API responses", () => {
  assert.deepEqual(
    parseSourceCodeResponse({ status: "1", result: [{ SourceCode: "contract Example {}" }] }),
    { blockchainVerification: true }
  );
  assert.deepEqual(
    parseContractCreationResponse({ status: "1", result: [{ blockNumber: "123", contractCreator: "0x1111111111111111111111111111111111111111" }] }),
    { deploymentBlock: 123, deployerAddress: "0x1111111111111111111111111111111111111111" }
  );
  assert.deepEqual(
    parseTransactionListResponse({ status: "1", result: [{ timeStamp: "1781395200" }, { timeStamp: "1781481600" }] }),
    { transactionCount: 2, firstSeen: "2026-06-14T00:00:00.000Z", latestActivity: "2026-06-15T00:00:00.000Z" }
  );
  assert.deepEqual(parseBlockResponse({ result: { timestamp: "0x6a2f4080" } }), {
    deploymentTimestamp: "2026-06-15T00:00:00.000Z",
  });
});

test("scores blockchain reputation from verification, age, activity, and deployer data", () => {
  const score = scoreBlockchainReputation(
    {
      blockchainVerification: true,
      deploymentTimestamp: "2025-06-15T00:00:00.000Z",
      deployerAddress: "0x1111111111111111111111111111111111111111",
      transactionCount: 200,
      activityScore: 100,
    },
    NOW
  );

  assert.deepEqual(score, { blockchainReputationScore: 100, confidenceLevel: "HIGH" });
});

test("classifies suspicious blockchain activity", () => {
  const findings = classifyBlockchainFindings(
    {
      blockchainVerification: false,
      deploymentTimestamp: "2026-06-14T12:00:00.000Z",
      contractAgeDays: 0,
      transactionCount: 150,
      deployerAddress: "0x1111111111111111111111111111111111111111",
    },
    NOW
  );

  assert.deepEqual(
    findings.map((finding: any) => finding.id),
    ["BC-RECENT-HIGH-ACTIVITY", "BC-UNVERIFIED-ACTIVE", "BC-SUSPICIOUS-DEPLOYMENT-PATTERN"]
  );
});

test("handles missing explorer data without throwing", async () => {
  const client = async (url: string) => {
    if (url.includes("getsourcecode")) return { status: "0", message: "NOTOK", result: "Missing" };
    if (url.includes("getcontractcreation")) return { status: "0", message: "NOTOK", result: "Missing" };
    return { status: "0", message: "NOTOK", result: [] };
  };

  const intelligence = await fetchBlockchainIntelligence("0x0000000000000000000000000000000000000000", {
    network: "ethereum",
    now: NOW,
    explorerClient: client,
  });

  assert.equal(intelligence.blockchainVerification, false);
  assert.equal(intelligence.transactionCount, 0);
  assert.equal(intelligence.activityScore, 0);
  assert.equal(intelligence.blockchainReputationScore, 0);
  assert.equal(intelligence.confidenceLevel, "LOW");
  assert.equal(intelligence.blockchainFindings.some((finding: any) => finding.id === "BC-INCOMPLETE-DEPLOYMENT-DATA"), true);
});
