const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCliOptions } = require("./cliOptions");
const { getNetworkConfig, getSupportedNetworks, isSupportedNetwork } = require("../blockchain/networks");

test("parses default human-readable analyze command", () => {
  assert.deepEqual(parseCliOptions(["analyze", "0x0000000000000000000000000000000000000000"]), {
    command: "analyze",
    address: "0x0000000000000000000000000000000000000000",
    outputJson: false,
    network: "ethereum",
  });
});

test("parses --json after the contract address", () => {
  assert.deepEqual(parseCliOptions(["analyze", "0x0000000000000000000000000000000000000000", "--json"]), {
    command: "analyze",
    address: "0x0000000000000000000000000000000000000000",
    outputJson: true,
    network: "ethereum",
  });
});

test("parses --json before the contract address", () => {
  assert.deepEqual(parseCliOptions(["analyze", "--json", "0x0000000000000000000000000000000000000000"]), {
    command: "analyze",
    address: "0x0000000000000000000000000000000000000000",
    outputJson: true,
    network: "ethereum",
  });
});

test("parses --network after the contract address", () => {
  assert.deepEqual(
    parseCliOptions(["analyze", "0x0000000000000000000000000000000000000000", "--network", "base"]),
    {
      command: "analyze",
      address: "0x0000000000000000000000000000000000000000",
      outputJson: false,
      network: "base",
    }
  );
});

test("parses --network before the contract address", () => {
  assert.deepEqual(
    parseCliOptions(["analyze", "--network", "polygon", "0x0000000000000000000000000000000000000000"]),
    {
      command: "analyze",
      address: "0x0000000000000000000000000000000000000000",
      outputJson: false,
      network: "polygon",
    }
  );
});

test("parses markdown audit report output", () => {
  assert.deepEqual(
    parseCliOptions(["analyze", "0x0000000000000000000000000000000000000000", "--report", "markdown"]),
    {
      command: "analyze",
      address: "0x0000000000000000000000000000000000000000",
      outputJson: false,
      reportFormat: "markdown",
      network: "ethereum",
    }
  );
});

test("reports unsupported audit report formats", () => {
  assert.deepEqual(
    parseCliOptions(["analyze", "0x0000000000000000000000000000000000000000", "--report", "pdf"]),
    {
      command: "analyze",
      address: "0x0000000000000000000000000000000000000000",
      outputJson: false,
      network: "ethereum",
      networkError: "Unsupported report format: pdf",
    }
  );
});

test("reports unsupported networks", () => {
  assert.deepEqual(
    parseCliOptions(["analyze", "0x0000000000000000000000000000000000000000", "--network", "optimism"]),
    {
      command: "analyze",
      address: "0x0000000000000000000000000000000000000000",
      outputJson: false,
      network: "optimism",
      networkError: "Unsupported network: optimism",
    }
  );
});

test("defines supported network RPC defaults", () => {
  assert.deepEqual(getSupportedNetworks(), ["ethereum", "base", "polygon", "arbitrum"]);
  assert.equal(getNetworkConfig("ethereum").rpcUrl, "https://ethereum.publicnode.com");
  assert.equal(getNetworkConfig("base").rpcUrl, "https://base.publicnode.com");
  assert.equal(getNetworkConfig("polygon").rpcUrl, "https://polygon-bor-rpc.publicnode.com");
  assert.equal(getNetworkConfig("arbitrum").rpcUrl, "https://arbitrum-one-rpc.publicnode.com");
});

test("validates supported networks", () => {
  assert.equal(isSupportedNetwork("ethereum"), true);
  assert.equal(isSupportedNetwork("optimism"), false);
});
