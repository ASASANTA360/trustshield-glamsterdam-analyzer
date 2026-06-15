import type { ScanRequest, StoredScan } from "./types.js";

import { fetchContractCode } from "../blockchain/contractFetcher.js";
// suppress import error when the analyzer isn't exported as named symbol
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { analyzeGlamsterdamReadiness } from "../glamsterdam/glamsterdamAnalyzer.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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

  const glamsterdamReport = analyzeGlamsterdamReadiness(successfulFetchResult.bytecode);

  const report = buildScanReport({
    contractAddress: request.contractAddress,
    network: request.network,
    fetchResult: successfulFetchResult,
    glamsterdamReport,
  });

  const storedScan: StoredScan = {
    ...report,
    riskScore: 100 - report.trustScore,
  };

  return storedScan;
}

export { runSecurityScan };