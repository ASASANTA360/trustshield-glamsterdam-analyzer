const fs = require("node:fs");
const path = require("node:path");
const packageJson = require("../../package.json");

type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type AuditFormat = "markdown" | "html" | "json";
type AuditGrade = "A" | "B" | "C" | "D" | "F";

type ContractResult = {
  address?: string;
  network?: string;
  bytecodeSize?: number;
  bytecodePreview?: string;
};

type Finding = {
  id?: string;
  category?: string;
  severity?: Severity | string;
  title?: string;
  description?: string;
  recommendation?: string;
  evidence?: string;
};

type GlamsterdamReport = {
  readinessScore?: number;
  riskLevel?: string;
  bytecodeSize?: number;
  metrics?: Record<string, number>;
  opcodeSummary?: Record<string, unknown>;
  findings?: Finding[];
  recommendations?: string[];
};

type AuditMetadata = {
  reportId: string;
  reportVersion: string;
  generatedTimestamp: string;
  trustShieldAiVersion: string;
};

type AuditReport = {
  metadata: AuditMetadata;
  executiveSummary: {
    contractAddress: string;
    network: string;
    analysisTimestamp: string;
    overallTrustShieldScore: number;
    overallSecurityGrade: AuditGrade;
    overallRiskLevel: string;
    findingsBySeverity: Record<Severity, number>;
  };
  intelligence: {
    multiChainAnalysis: Record<string, unknown>;
    blockchainIntelligence: Record<string, unknown>;
    glamsterdamReadiness: GlamsterdamReport;
    evmSecurityFindings: Finding[];
    aiSecurityIntelligence: Record<string, unknown>;
    historicalReputation: Record<string, unknown>;
    sourceCodeAbiIntelligence: Record<string, unknown>;
  };
  recommendations: string[];
  conclusion: string;
};

const REPORT_VERSION = "1.0.0";
const SEVERITIES: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
const EXTENSIONS: Record<AuditFormat, string> = {
  markdown: "md",
  html: "html",
  json: "json",
};

function sanitizePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function getAuditGrade(score: number, riskLevel?: string): AuditGrade {
  const normalizedRisk = (riskLevel ?? "").toUpperCase();

  if (normalizedRisk === "CRITICAL" || score < 40) {
    return "F";
  }

  if (normalizedRisk === "HIGH" || score < 60) {
    return "D";
  }

  if (score < 75) {
    return "C";
  }

  if (score < 90) {
    return "B";
  }

  return "A";
}

function countFindingsBySeverity(findings: Finding[] = []) {
  const counts = SEVERITIES.reduce((accumulator, severity) => {
    accumulator[severity] = 0;
    return accumulator;
  }, {} as Record<Severity, number>);

  for (const finding of findings) {
    const severity = String(finding.severity ?? "INFO").toUpperCase() as Severity;
    counts[SEVERITIES.includes(severity) ? severity : "INFO"] += 1;
  }

  return counts;
}

function createReportId(address: string, network: string, timestamp: Date) {
  const shortAddress = address.replace(/^0x/i, "").slice(0, 12).toLowerCase() || "unknown";
  return `tsa-${sanitizePart(network)}-${shortAddress}-${timestamp.getTime()}`;
}

function createAuditReport(result: ContractResult, glamsterdamReport: GlamsterdamReport, timestamp = new Date()): AuditReport {
  const address = result.address ?? "unknown-address";
  const network = result.network ?? "unknown-network";
  const findings = glamsterdamReport.findings ?? [];
  const score = typeof glamsterdamReport.readinessScore === "number" ? glamsterdamReport.readinessScore : 0;
  const riskLevel = glamsterdamReport.riskLevel ?? "UNKNOWN";
  const analysisTimestamp = timestamp.toISOString();
  const grade = getAuditGrade(score, riskLevel);

  return {
    metadata: {
      reportId: createReportId(address, network, timestamp),
      reportVersion: REPORT_VERSION,
      generatedTimestamp: analysisTimestamp,
      trustShieldAiVersion: packageJson.version,
    },
    executiveSummary: {
      contractAddress: address,
      network,
      analysisTimestamp,
      overallTrustShieldScore: score,
      overallSecurityGrade: grade,
      overallRiskLevel: riskLevel,
      findingsBySeverity: countFindingsBySeverity(findings),
    },
    intelligence: {
      multiChainAnalysis: {
        primaryNetwork: network,
        supportedContext: "ethereum, base, polygon, arbitrum",
      },
      blockchainIntelligence: {
        bytecodeSize: result.bytecodeSize ?? glamsterdamReport.bytecodeSize ?? 0,
        bytecodePreview: result.bytecodePreview ?? "unavailable",
      },
      glamsterdamReadiness: glamsterdamReport,
      evmSecurityFindings: findings,
      aiSecurityIntelligence: {
        model: "deterministic-static-analysis",
        confidence: findings.length > 0 ? "medium" : "low",
      },
      historicalReputation: {
        status: "not-available",
        note: "Historical reputation data was not supplied by this analysis run.",
      },
      sourceCodeAbiIntelligence: {
        status: "not-available",
        note: "Source code and ABI data were not supplied by this analysis run.",
      },
    },
    recommendations: glamsterdamReport.recommendations ?? [],
    conclusion: buildConclusion(score, grade, riskLevel),
  };
}

function buildConclusion(score: number, grade: AuditGrade, riskLevel: string) {
  if (grade === "A" || grade === "B") {
    return `The contract received a ${grade} grade with a ${score}/100 TrustShield score and ${riskLevel} risk. Continue monitoring upgrade assumptions and complete source-aware validation before production decisions.`;
  }

  return `The contract received a ${grade} grade with a ${score}/100 TrustShield score and ${riskLevel} risk. Address the highlighted findings before relying on the contract for high-value production activity.`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatFindingRows(findings: Finding[], format: "markdown" | "html") {
  if (findings.length === 0) {
    return format === "markdown" ? "| INFO | No findings | No findings supplied |\n" : "<tr><td>INFO</td><td>No findings</td><td>No findings supplied</td><td></td></tr>";
  }

  if (format === "markdown") {
    return findings
      .map((finding) => `| ${finding.severity ?? "INFO"} | ${finding.title ?? "Untitled finding"} | ${finding.evidence ?? "No evidence supplied"} |`)
      .join("\n");
  }

  return findings
    .map(
      (finding) => `<tr><td><span class="badge ${escapeHtml(finding.severity ?? "INFO")}">${escapeHtml(finding.severity ?? "INFO")}</span></td><td>${escapeHtml(finding.title ?? "Untitled finding")}</td><td>${escapeHtml(finding.evidence ?? "No evidence supplied")}</td><td>${escapeHtml(finding.recommendation ?? "Review manually.")}</td></tr>`
    )
    .join("\n");
}

function formatMarkdownReport(report: AuditReport) {
  const summary = report.executiveSummary;
  const findings = report.intelligence.evmSecurityFindings;
  const counts = summary.findingsBySeverity;
  const recommendations = report.recommendations.length > 0 ? report.recommendations.map((item) => `- ${item}`).join("\n") : "- No recommendations supplied.";

  return `# TrustShield AI Professional Audit Report\n\n**Contract:** ${summary.contractAddress}  \n**Network:** ${summary.network}  \n**Generated:** ${report.metadata.generatedTimestamp}  \n**Report ID:** ${report.metadata.reportId}  \n**Report Version:** ${report.metadata.reportVersion}  \n**TrustShield AI Version:** ${report.metadata.trustShieldAiVersion}\n\n## Executive Summary\n\n- Analysis timestamp: ${summary.analysisTimestamp}\n- Overall TrustShield Score: ${summary.overallTrustShieldScore}/100\n- Overall Security Grade: ${summary.overallSecurityGrade}\n- Overall Risk Level: ${summary.overallRiskLevel}\n- Total Findings: Critical ${counts.CRITICAL}, High ${counts.HIGH}, Medium ${counts.MEDIUM}, Low ${counts.LOW}, Info ${counts.INFO}\n\n## Security Scorecard\n\n| Area | Result |\n| --- | --- |\n| Glamsterdam readiness | ${summary.overallTrustShieldScore}/100 |\n| Security grade | ${summary.overallSecurityGrade} |\n| Risk level | ${summary.overallRiskLevel} |\n| Bytecode size | ${report.intelligence.blockchainIntelligence.bytecodeSize} bytes |\n\n## Findings Table\n\n| Severity | Finding | Evidence |\n| --- | --- | --- |\n${formatFindingRows(findings, "markdown")}\n\n## Risk Analysis\n\nTrustShield reviewed multi-chain context, blockchain bytecode intelligence, Glamsterdam readiness signals, EVM security findings, AI security intelligence, historical reputation placeholders, and source code/ABI availability. Missing enrichment data is explicitly marked as not available in the structured export.\n\n## Recommendations\n\n${recommendations}\n\n## Conclusion\n\n${report.conclusion}\n`;
}

function formatHtmlReport(report: AuditReport) {
  const summary = report.executiveSummary;
  const counts = summary.findingsBySeverity;
  const recommendations = report.recommendations.length > 0 ? report.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n") : "<li>No recommendations supplied.</li>";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TrustShield AI Audit Report</title><style>body{font-family:Inter,Arial,sans-serif;margin:0;background:#f6f8fb;color:#172033}.container{max-width:1100px;margin:0 auto;padding:32px}.hero,.card{background:#fff;border:1px solid #dde5f2;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 8px 24px rgba(23,32,51,.06)}.dashboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}.score{font-size:34px;font-weight:800}.badge{display:inline-block;border-radius:999px;padding:4px 10px;font-weight:700;background:#e8eef8}.LOW,.INFO{background:#def7ec;color:#03543f}.MEDIUM{background:#fef3c7;color:#92400e}.HIGH{background:#fde2e2;color:#991b1b}.CRITICAL{background:#3f0b0b;color:#fff}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #e5edf7;padding:12px}th{background:#f0f4fa}</style></head><body><main class="container"><section class="hero"><h1>TrustShield AI Professional Audit Report</h1><p><strong>Contract:</strong> ${escapeHtml(summary.contractAddress)} · <strong>Network:</strong> ${escapeHtml(summary.network)}</p><p><strong>Report ID:</strong> ${escapeHtml(report.metadata.reportId)} · <strong>Generated:</strong> ${escapeHtml(report.metadata.generatedTimestamp)}</p></section><section class="dashboard"><div class="card"><div>TrustShield Score</div><div class="score">${summary.overallTrustShieldScore}/100</div></div><div class="card"><div>Security Grade</div><div class="score">${summary.overallSecurityGrade}</div></div><div class="card"><div>Risk Level</div><span class="badge ${escapeHtml(summary.overallRiskLevel)}">${escapeHtml(summary.overallRiskLevel)}</span></div><div class="card"><div>Findings</div><p>Critical ${counts.CRITICAL} · High ${counts.HIGH} · Medium ${counts.MEDIUM} · Low ${counts.LOW} · Info ${counts.INFO}</p></div></section><section class="card"><h2>Findings</h2><table><thead><tr><th>Severity</th><th>Finding</th><th>Evidence</th><th>Recommendation</th></tr></thead><tbody>${formatFindingRows(report.intelligence.evmSecurityFindings, "html")}</tbody></table></section><section class="card"><h2>Risk Analysis</h2><p>TrustShield reviewed multi-chain analysis, blockchain intelligence, Glamsterdam readiness, EVM security findings, AI security intelligence, historical reputation, and source code & ABI intelligence.</p></section><section class="card"><h2>Recommendations</h2><ul>${recommendations}</ul></section><section class="card"><h2>Conclusion</h2><p>${escapeHtml(report.conclusion)}</p></section></main></body></html>`;
}

function formatAuditReport(report: AuditReport, format: AuditFormat) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  return format === "html" ? formatHtmlReport(report) : formatMarkdownReport(report);
}

function createReportFilename(address: string, network: string, timestamp = new Date(), format: AuditFormat = "markdown") {
  const date = timestamp.toISOString().slice(0, 10);
  return `${sanitizePart(address)}_${sanitizePart(network)}_${date}_audit.${EXTENSIONS[format]}`;
}

function saveAuditReport(report: AuditReport, format: AuditFormat, outputDir = "audit-reports") {
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = createReportFilename(report.executiveSummary.contractAddress, report.executiveSummary.network, new Date(report.metadata.generatedTimestamp), format);
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, formatAuditReport(report, format), "utf8");
  return filePath;
}

module.exports = {
  createAuditReport,
  createReportFilename,
  formatAuditReport,
  getAuditGrade,
  saveAuditReport,
};
