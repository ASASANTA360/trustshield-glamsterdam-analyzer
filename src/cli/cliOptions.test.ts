const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCliOptions } = require("./cliOptions");

test("parses default human-readable analyze command", () => {
  assert.deepEqual(parseCliOptions(["analyze", "0x0000000000000000000000000000000000000000"]), {
    command: "analyze",
    address: "0x0000000000000000000000000000000000000000",
    outputJson: false,
  });
});

test("parses --json after the contract address", () => {
  assert.deepEqual(parseCliOptions(["analyze", "0x0000000000000000000000000000000000000000", "--json"]), {
    command: "analyze",
    address: "0x0000000000000000000000000000000000000000",
    outputJson: true,
  });
});

test("parses --json before the contract address", () => {
  assert.deepEqual(parseCliOptions(["analyze", "--json", "0x0000000000000000000000000000000000000000"]), {
    command: "analyze",
    address: "0x0000000000000000000000000000000000000000",
    outputJson: true,
  });
});
