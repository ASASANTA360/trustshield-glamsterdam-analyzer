import type { ScanRequest, StoredScan } from "./types.js";

import { fetchContractCode } from "../blockchain/contractFetcher.js";
import { analyzeGlamsterdamReadiness } from "../glamsterdam/glamsterdamAnalyzer.js";
import { buildScanReport } from "./reportBuilder.js";

async function runSecurityScan(request: ScanRequest): Promise<StoredScan> {
  const fetchResult = await fetchContractCode(request.contractAddress, {
    network: request.network,
  });

  if (!fetchResult.exists) {
    throw new Error(
      fetchResult.error
        ? `${fetchResult.message}: ${fetchResult.error}`
        : fetchResult.message
    );
  }

  const successfulFetchResult = fetchResult as typeof fetchResult & {
    bytecode: string;
    bytecodeSize: number;
  };

  const glamsterdamReport = analyzeGlamsterdamReadiness(
    successfulFetchResult.bytecode
  );

  const report = buildScanReport({
    contractAddress: request.contractAddress,
    network: request.network,
    fetchResult: successfulFetchResult,
    glamsterdamReport,
  });

  return {
    ...report,
    riskScore: 100 - report.trustScore,
  };
}

export { runSecurityScan };