const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  createAuditReport,
  createReportFilename,
  formatAuditReport,
  getAuditGrade,
  saveAuditReport,
} = require("./auditReportGenerator");

const contractResult = {
  address: "0xA0b8000000000000000000000000000000000000",
  network: "eth",
  bytecodeSize: 128,
  bytecodePreview: "0x6001600055...",
};

const glamsterdamReport = {
  readinessScore: 72,
  riskLevel: "MEDIUM",
  bytecodeSize: 128,
  metrics: {
    stateAccessOps: 2,
    externalInteractionOps: 1,
    logOps: 0,
    blockContextOps: 1,
    deprecatedOps: 0,
  },
  findings: [
    {
      id: "GLAM-BAL-STATE-ACCESS",
      category: "state-access",
      severity: "MEDIUM",
      title: "State access pattern should be reviewed",
      description: "The contract uses state access opcodes.",
      recommendation: "Profile state-heavy functions.",
      evidence: "2 state/account access opcodes",
    },
    {
      id: "GLAM-EXT-CALLS",
      category: "external-interaction",
      severity: "LOW",
      title: "External calls need upgrade-readiness review",
      description: "The contract performs external calls.",
      recommendation: "Review fallback handling.",
      evidence: "1 external interaction opcode",
    },
  ],
  recommendations: ["Profile state-heavy functions.", "Review fallback handling."],
};

const timestamp = new Date("2026-06-15T10:00:00.000Z");

test("maps TrustShield scores and risk levels to audit grades", () => {
  assert.equal(getAuditGrade(95, "LOW"), "A");
  assert.equal(getAuditGrade(82, "LOW"), "B");
  assert.equal(getAuditGrade(65, "MEDIUM"), "C");
  assert.equal(getAuditGrade(55, "HIGH"), "D");
  assert.equal(getAuditGrade(39, "CRITICAL"), "F");
});

test("creates a complete audit report with executive summary and intelligence sections", () => {
  const report = createAuditReport(contractResult, glamsterdamReport, timestamp);

  assert.equal(report.metadata.reportVersion, "1.0.0");
  assert.equal(report.metadata.generatedTimestamp, "2026-06-15T10:00:00.000Z");
  assert.equal(report.executiveSummary.contractAddress, contractResult.address);
  assert.equal(report.executiveSummary.network, "eth");
  assert.equal(report.executiveSummary.overallTrustShieldScore, 72);
  assert.equal(report.executiveSummary.overallSecurityGrade, "C");
  assert.equal(report.executiveSummary.findingsBySeverity.MEDIUM, 1);
  assert.equal(report.executiveSummary.findingsBySeverity.LOW, 1);
  assert.deepEqual(report.intelligence.glamsterdamReadiness, glamsterdamReport);
  assert.equal(report.intelligence.blockchainIntelligence.bytecodeSize, 128);
});

test("generates deterministic report filenames with address, network, timestamp, and extension", () => {
  assert.equal(
    createReportFilename(contractResult.address, "eth", timestamp, "markdown"),
    "0xa0b8000000000000000000000000000000000000_eth_2026-06-15_audit.md"
  );
  assert.equal(
    createReportFilename(contractResult.address, "base-mainnet", timestamp, "html"),
    "0xa0b8000000000000000000000000000000000000_base-mainnet_2026-06-15_audit.html"
  );
  assert.equal(
    createReportFilename(contractResult.address, "polygon", timestamp, "json"),
    "0xa0b8000000000000000000000000000000000000_polygon_2026-06-15_audit.json"
  );
});

test("formats markdown, html, and JSON audit exports", () => {
  const report = createAuditReport(contractResult, glamsterdamReport, timestamp);
  const markdown = formatAuditReport(report, "markdown");
  const html = formatAuditReport(report, "html");
  const json = JSON.parse(formatAuditReport(report, "json"));

  assert.match(markdown, /# TrustShield AI Professional Audit Report/);
  assert.match(markdown, /## Executive Summary/);
  assert.match(markdown, /## Findings Table/);
  assert.match(html, /<!doctype html>/);
  assert.match(html, /class="dashboard"/);
  assert.equal(json.executiveSummary.overallSecurityGrade, "C");
  assert.equal(json.intelligence.evmSecurityFindings.length, 2);
});

test("handles missing optional data without throwing", () => {
  const report = createAuditReport({}, {}, timestamp);
  const markdown = formatAuditReport(report, "markdown");

  assert.equal(report.executiveSummary.contractAddress, "unknown-address");
  assert.equal(report.executiveSummary.network, "unknown-network");
  assert.equal(report.executiveSummary.findingsBySeverity.INFO, 0);
  assert.match(markdown, /No findings supplied/);
});

test("saves audit reports to the requested output directory", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "trustshield-audit-"));
  const report = createAuditReport(contractResult, glamsterdamReport, timestamp);
  const filePath = saveAuditReport(report, "json", outputDir);

  assert.equal(path.dirname(filePath), outputDir);
  assert.equal(path.basename(filePath), "0xa0b8000000000000000000000000000000000000_eth_2026-06-15_audit.json");
  assert.equal(JSON.parse(fs.readFileSync(filePath, "utf8")).metadata.reportId, report.metadata.reportId);
});
