const { isSupportedNetwork } = require("../blockchain/networks");

type CliOptions = {
  command: string | undefined;
  address: string | undefined;
  outputJson: boolean;
  reportFormat?: "markdown" | "html" | "json";
  network: string;
  networkError?: string;
};

function parseCliOptions(args: string[]): CliOptions {
  const outputJson = args.includes("--json");
  const reportFlagIndex = args.indexOf("--report");
  const selectedReportFormat = reportFlagIndex >= 0 ? args[reportFlagIndex + 1] : undefined;
  const networkFlagIndex = args.indexOf("--network");
  const selectedNetwork = networkFlagIndex >= 0 ? args[networkFlagIndex + 1] : "ethereum";
  const positional = args.filter((arg, index) => {
    if (arg === "--json") {
      return false;
    }

    if (reportFlagIndex >= 0 && (arg === "--report" || index === reportFlagIndex + 1)) {
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

  if (reportFlagIndex >= 0 && !selectedReportFormat) {
    options.networkError = "Missing value for --report";
  } else if (selectedReportFormat && !["markdown", "html", "json"].includes(selectedReportFormat)) {
    options.networkError = `Unsupported report format: ${selectedReportFormat}`;
  } else if (selectedReportFormat) {
    options.reportFormat = selectedReportFormat as "markdown" | "html" | "json";
  } else if (networkFlagIndex >= 0 && !selectedNetwork) {
    options.networkError = "Missing value for --network";
  } else if (!isSupportedNetwork(options.network)) {
    options.networkError = `Unsupported network: ${options.network}`;
  }

  return options;
}

module.exports = {
  parseCliOptions,
};
