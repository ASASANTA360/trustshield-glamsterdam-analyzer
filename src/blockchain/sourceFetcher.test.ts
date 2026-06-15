const test = require("node:test");
const assert = require("node:assert/strict");
const { fetchContractSource } = require("./sourceFetcher");

test("fetches Etherscan-compatible verified source data", async () => {
  let requestedUrl: URL | undefined;
  const fetchImpl = async (url: URL) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({
        status: "1",
        result: [{ SourceCode: "contract A {}", ABI: "[]", CompilerVersion: "v0.8.24", OptimizationUsed: "1" }],
      }),
    };
  };

  const result = await fetchContractSource("0x0000000000000000000000000000000000000000", {
    network: "ethereum",
    explorerApiUrl: "https://example.test/api",
    apiKey: "test-key",
    fetchImpl,
  });

  assert.equal(result.sourceAvailable, true);
  assert.equal(result.source.CompilerVersion, "v0.8.24");
  assert.ok(requestedUrl);
  assert.equal(requestedUrl!.searchParams.get("module"), "contract");
  assert.equal(requestedUrl!.searchParams.get("action"), "getsourcecode");
  assert.equal(requestedUrl!.searchParams.get("apikey"), "test-key");
});

test("handles explorer errors without throwing", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ status: "0", message: "NOTOK", result: "Missing/Invalid API Key" }),
  });

  const result = await fetchContractSource("0x0000000000000000000000000000000000000000", {
    network: "ethereum",
    fetchImpl,
  });

  assert.equal(result.sourceAvailable, false);
  assert.equal(result.message, "NOTOK");
});
