const { getNetworkConfig } = require("./networks");

const DEFAULT_EXPLORER_TIMEOUT_MS = 10000;

type FetchSourceOptions = {
  network?: string;
  explorerApiUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

function getExplorerTimeoutMs() {
  const value = Number(process.env.EXPLORER_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_EXPLORER_TIMEOUT_MS;
}

function getExplorerApiKey(network = "ethereum", explicitApiKey?: string) {
  if (explicitApiKey) return explicitApiKey;
  const config = getNetworkConfig(network);
  return process.env[config.explorerApiKeyEnvVar] || process.env.ETHERSCAN_API_KEY || "";
}

async function fetchContractSource(address: string, options: FetchSourceOptions = {}) {
  const network = options.network ?? "ethereum";
  const config = getNetworkConfig(network);
  const explorerApiUrl = options.explorerApiUrl ?? config.explorerApiUrl;
  const apiKey = getExplorerApiKey(network, options.apiKey);
  const timeoutMs = options.timeoutMs ?? getExplorerTimeoutMs();
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const url = new URL(explorerApiUrl);
  url.searchParams.set("module", "contract");
  url.searchParams.set("action", "getsourcecode");
  url.searchParams.set("address", address);
  if (apiKey) url.searchParams.set("apikey", apiKey);

  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Explorer request failed with HTTP ${response.status}`);
    }

    const payload: any = await response.json();
    const firstResult = Array.isArray(payload.result) ? payload.result[0] : undefined;

    if (!firstResult || payload.status === "0") {
      return {
        sourceAvailable: false,
        network,
        message: payload.message || "No source data returned by explorer",
      };
    }

    return {
      sourceAvailable: true,
      network,
      source: firstResult,
    };
  } catch (err) {
    return {
      sourceAvailable: false,
      network,
      message: "Failed to fetch source data",
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchContractSource };
