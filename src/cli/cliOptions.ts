type CliOptions = {
  command: string | undefined;
  address: string | undefined;
  outputJson: boolean;
};

function parseCliOptions(args: string[]): CliOptions {
  const outputJson = args.includes("--json");
  const positional = args.filter((arg) => arg !== "--json");

  return {
    command: positional[0],
    address: positional[1],
    outputJson,
  };
}

module.exports = {
  parseCliOptions,
};
