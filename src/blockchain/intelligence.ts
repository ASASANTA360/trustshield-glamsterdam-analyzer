const { getNetworkConfig } = require("./networks");

const DEFAULT_EXPLORER_TIMEOUT_MS = 10000;
const DAY_MS = 24 * 60 * 60 * 1000;

type ExplorerClient = (url: string) => Promise<any>;

type BlockchainIntelligenceOptions = {
  network?: string;
  now?: Date;
  explorerClient?: ExplorerClient;
  timeoutMs?: number;
};

function getExplorerTimeoutMs() {
  const value = Number(process.env.EXPLORER_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_EXPLORER_TIMEOUT_MS;
}

async function defaultExplorerClient(url: string, timeoutMs = getExplorerTimeoutMs()) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Explorer request failed with HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function getExplorerConfig(network = "ethereum") {
  const config = getNetworkConfig(network);
  return config.explorer;
}

function buildExplorerUrl(network: string, params: Record<string, string>) {
  const explorer = getExplorerConfig(network);
  const url = new URL(explorer.apiUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const apiKey = process.env[explorer.apiKeyEnvVar];
  if (apiKey) {
    url.searchParams.set("apikey", apiKey);
  }
  return url.toString();
}

function unwrapExplorerResult(response: any) {
  if (!response || response.status === "0" || response.message === "NOTOK") {
    return undefined;
  }
  return response.result;
}

function parseTimestamp(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? new Date(numeric * 1000).toISOString() : undefined;
}

function parseSourceCodeResponse(response: any) {
  const result = unwrapExplorerResult(response);
  const source = Array.isArray(result) ? result[0] : undefined;
  const sourceCode = source?.SourceCode;
  return {
    blockchainVerification: Boolean(typeof sourceCode === "string" && sourceCode.trim().length > 0),
  };
}

function parseContractCreationResponse(response: any) {
  const result = unwrapExplorerResult(response);
  const creation = Array.isArray(result) ? result[0] : undefined;
  return {
    deploymentBlock: creation?.blockNumber ? Number(creation.blockNumber) : undefined,
    deployerAddress: creation?.contractCreator,
  };
}

function parseTransactionListResponse(response: any) {
  const result = unwrapExplorerResult(response);
  const transactions = Array.isArray(result) ? result : [];
  const sorted = transactions
    .filter((tx: any) => Number.isFinite(Number(tx.timeStamp)))
    .sort((a: any, b: any) => Number(a.timeStamp) - Number(b.timeStamp));
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  return {
    transactionCount: transactions.length,
    firstSeen: first ? parseTimestamp(first.timeStamp) : undefined,
    latestActivity: latest ? parseTimestamp(latest.timeStamp) : undefined,
  };
}

function parseBlockResponse(response: any) {
  const result = response?.result;
  const timestamp = typeof result?.timestamp === "string" ? Number.parseInt(result.timestamp, 16) : Number.NaN;
  return { deploymentTimestamp: Number.isFinite(timestamp) ? new Date(timestamp * 1000).toISOString() : undefined };
}

function calculateContractAgeDays(deploymentTimestamp: string | undefined, now = new Date()) {
  if (!deploymentTimestamp) return undefined;
  const ageMs = now.getTime() - new Date(deploymentTimestamp).getTime();
  return Number.isFinite(ageMs) && ageMs >= 0 ? Math.floor(ageMs / DAY_MS) : undefined;
}

function calculateActivityScore(transactionCount = 0, firstSeen?: string, latestActivity?: string, now = new Date()) {
  const countScore = Math.min(50, transactionCount / 2);
  const spanDays = firstSeen && latestActivity ? Math.max(0, (new Date(latestActivity).getTime() - new Date(firstSeen).getTime()) / DAY_MS) : 0;
  const spanScore = Math.min(25, spanDays / 4);
  const latestDays = latestActivity ? Math.max(0, (now.getTime() - new Date(latestActivity).getTime()) / DAY_MS) : undefined;
  const recencyScore = latestDays === undefined ? 0 : latestDays <= 30 ? 25 : latestDays <= 180 ? 15 : 5;
  return Math.round(countScore + spanScore + recencyScore);
}

function scoreBlockchainReputation(input: any, now = new Date()) {
  const ageDays = input.contractAgeDays ?? calculateContractAgeDays(input.deploymentTimestamp, now) ?? 0;
  const verifiedScore = input.blockchainVerification ? 30 : 0;
  const ageScore = Math.min(25, ageDays >= 365 ? 25 : ageDays >= 90 ? 20 : ageDays >= 30 ? 12 : ageDays >= 7 ? 6 : 0);
  const activityScore = Math.min(25, Math.round((input.activityScore ?? 0) * 0.25));
  const deployerScore = input.deployerAddress ? 10 : 0;
  const confidenceScore = input.transactionCount > 0 && input.deploymentTimestamp ? 10 : 0;
  const score = Math.max(0, Math.min(100, verifiedScore + ageScore + activityScore + deployerScore + confidenceScore));
  const confidenceLevel = score >= 75 ? "HIGH" : score >= 45 ? "MEDIUM" : "LOW";
  return { blockchainReputationScore: score, confidenceLevel };
}

function classifyBlockchainFindings(input: any, now = new Date()) {
  const findings: any[] = [];
  const ageDays = input.contractAgeDays ?? calculateContractAgeDays(input.deploymentTimestamp, now);
  const txCount = input.transactionCount ?? 0;
  if (ageDays !== undefined && ageDays < 7 && txCount >= 100) findings.push({ id: "BC-RECENT-HIGH-ACTIVITY", severity: "HIGH", title: "Recently deployed high-activity contract", evidence: `${txCount} transactions in ${ageDays} days` });
  if (!input.blockchainVerification && txCount >= 50) findings.push({ id: "BC-UNVERIFIED-ACTIVE", severity: "HIGH", title: "Unverified contract with unusual activity", evidence: `${txCount} transactions without verified source code` });
  if (ageDays !== undefined && ageDays > 30 && txCount <= 1) findings.push({ id: "BC-LOW-HISTORY", severity: "MEDIUM", title: "Extremely low historical activity", evidence: `${txCount} transactions over ${ageDays} days` });
  if (!input.deployerAddress || !input.deploymentTimestamp) findings.push({ id: "BC-INCOMPLETE-DEPLOYMENT-DATA", severity: "LOW", title: "Incomplete deployment intelligence", evidence: "Explorer did not return complete deployment metadata" });
  if (ageDays !== undefined && ageDays < 1 && !input.blockchainVerification) findings.push({ id: "BC-SUSPICIOUS-DEPLOYMENT-PATTERN", severity: "HIGH", title: "Suspicious deployment pattern", evidence: "New unverified deployment" });
  return findings;
}

async function fetchBlockchainIntelligence(address: string, options: BlockchainIntelligenceOptions = {}) {
  const network = options.network ?? "ethereum";
  const now = options.now ?? new Date();
  const client = options.explorerClient ?? ((url: string) => defaultExplorerClient(url, options.timeoutMs));
  const safeClient = async (url: string) => {
    try {
      return await client(url);
    } catch (err) {
      return { status: "0", message: "NOTOK", result: [], error: err instanceof Error ? err.message : String(err) };
    }
  };
  const [source, creation, txs] = await Promise.all([
    safeClient(buildExplorerUrl(network, { module: "contract", action: "getsourcecode", address })),
    safeClient(buildExplorerUrl(network, { module: "contract", action: "getcontractcreation", contractaddresses: address })),
    safeClient(buildExplorerUrl(network, { module: "account", action: "txlist", address, startblock: "0", endblock: "99999999", sort: "asc" })),
  ]);
  const parsedSource = parseSourceCodeResponse(source);
  const parsedCreation = parseContractCreationResponse(creation);
  const parsedTxs = parseTransactionListResponse(txs);
  let deploymentTimestamp = parsedTxs.firstSeen;
  if (parsedCreation.deploymentBlock) {
    const block = await safeClient(buildExplorerUrl(network, { module: "proxy", action: "eth_getBlockByNumber", tag: `0x${parsedCreation.deploymentBlock.toString(16)}`, boolean: "false" }));
    deploymentTimestamp = parseBlockResponse(block).deploymentTimestamp ?? deploymentTimestamp;
  }
  const contractAgeDays = calculateContractAgeDays(deploymentTimestamp, now);
  const activityScore = calculateActivityScore(parsedTxs.transactionCount, parsedTxs.firstSeen, parsedTxs.latestActivity, now);
  const base = { ...parsedSource, ...parsedCreation, ...parsedTxs, deploymentTimestamp, contractAgeDays, activityScore };
  const reputation = scoreBlockchainReputation(base, now);
  return { ...base, ...reputation, blockchainFindings: classifyBlockchainFindings({ ...base, ...reputation }, now) };
}

module.exports = {
  calculateActivityScore,
  calculateContractAgeDays,
  classifyBlockchainFindings,
  fetchBlockchainIntelligence,
  parseBlockResponse,
  parseContractCreationResponse,
  parseSourceCodeResponse,
  parseTransactionListResponse,
  scoreBlockchainReputation,
};
