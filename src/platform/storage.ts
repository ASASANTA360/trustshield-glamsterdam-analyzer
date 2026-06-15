const { promises: fs } = require("node:fs");
const path = require("node:path");
import type { AnalyticsReport, RiskLevel, StoredScan } from "./types";

// JSON persistence is the local development fallback; configure MONGODB_URI for production deployments.
const DATA_DIR = path.join(process.cwd(), ".trustshield");
const DATA_FILE = path.join(DATA_DIR, "scans.json");
const EMPTY_RISK_DISTRIBUTION: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 0,
  HIGH: 0,
  CRITICAL: 0,
};

async function readJsonStore(): Promise<StoredScan[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(content) as StoredScan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ENOENT") return [];
    throw error;
  }
}

async function writeJsonStore(scans: StoredScan[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(scans, null, 2));
}

async function saveScan(scan: StoredScan): Promise<StoredScan> {
  const scans = await readJsonStore();
  scans.unshift(scan);
  await writeJsonStore(scans.slice(0, 500));
  return scan;
}

async function listScans(limit = 25): Promise<StoredScan[]> {
  const scans = await readJsonStore();
  return scans.slice(0, limit);
}

async function getScan(id: string): Promise<StoredScan | undefined> {
  const scans = await readJsonStore();
  return scans.find((scan) => scan.id === id);
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

async function getAnalytics(): Promise<AnalyticsReport> {
  const scans = await readJsonStore();
  const networksAnalyzed: Record<string, number> = {};
  const riskDistribution = { ...EMPTY_RISK_DISTRIBUTION };
  const vulnerabilityStatistics: Record<string, number> = {};

  for (const scan of scans) {
    increment(networksAnalyzed, scan.network);
    riskDistribution[scan.riskLevel] += 1;
    for (const finding of scan.sections.vulnerabilities) {
      increment(vulnerabilityStatistics, finding.category);
    }
  }

  return {
    totalScans: scans.length,
    networksAnalyzed,
    riskDistribution,
    vulnerabilityStatistics,
    safeContracts: scans.filter((scan) => scan.riskLevel === "LOW").length,
    highRiskContracts: scans.filter((scan) => scan.riskLevel === "HIGH" || scan.riskLevel === "CRITICAL").length,
    mostAnalyzedChains: Object.entries(networksAnalyzed)
      .map(([network, count]) => ({ network, scans: count }))
      .sort((a, b) => b.scans - a.scans),
    commonVulnerabilityTypes: Object.entries(vulnerabilityStatistics)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
  };
}

module.exports = { getAnalytics, getScan, listScans, saveScan };
