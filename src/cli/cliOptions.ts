const { isSupportedNetwork } = require("../blockchain/networks");

type CliOptions = {
  command: string | undefined;
  address: string | undefined;
  outputJson: boolean;
  network: string;
  networkError?: string;
};

function parseCliOptions(args: string[]): CliOptions {
  const outputJson = args.includes("--json");
  const networkFlagIndex = args.indexOf("--network");
  const selectedNetwork = networkFlagIndex >= 0 ? args[networkFlagIndex + 1] : "ethereum";
  const positional = args.filter((arg, index) => {
    if (arg === "--json") {
      return false;
    }

    if (networkFlagIndex >= 0 && (arg === "--network" || index === networkFlagIndex + 1)) {
      return false;
    }

    return true;
  });

  const options: CliOptions = {
    command: positional[0],
    address: positional[1],
    outputJson,
    network: selectedNetwork ?? "ethereum",
  };

  if (networkFlagIndex >= 0 && !selectedNetwork) {
    options.networkError = "Missing value for --network";
  } else if (!isSupportedNetwork(options.network)) {
    options.networkError = `Unsupported network: ${options.network}`;
  }

  return options;
}

module.exports = {
  parseCliOptions,
};
