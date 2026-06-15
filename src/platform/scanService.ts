import type { ScanRequest, StoredScan } from "./types";

const { fetchContractCode } = require("../blockchain/contractFetcher");
const { analyzeGlamsterdamReadiness } = require("../glamsterdam/glamsterdamAnalyzer");
const { buildScanReport } = require("./reportBuilder");
const { saveScan } = require("./storage");

async function runSecurityScan(request: ScanRequest): Promise<StoredScan> {
  const fetchResult = await fetchContractCode(request.contractAddress, { network: request.network });

  if (!fetchResult.exists) {
    throw new Error(fetchResult.error ? `${fetchResult.message}: ${fetchResult.error}` : fetchResult.message);
  }

  const glamsterdamReport = analyzeGlamsterdamReadiness(fetchResult.bytecode);
  const report = buildScanReport({
    contractAddress: request.contractAddress,
    network: request.network,
    fetchResult,
    glamsterdamReport,
  });
  const storedScan: StoredScan = {
    ...report,
    riskScore: 100 - report.trustScore,
  };

  return saveScan(storedScan);
}

module.exports = { runSecurityScan };
