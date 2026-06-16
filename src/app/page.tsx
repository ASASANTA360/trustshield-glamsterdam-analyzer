"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ScanReport, SecurityFinding, SupportedNetwork } from "../platform/types.js";

const supportedNetworks: Array<{ label: string; value: SupportedNetwork; description: string }> = [
  { label: "Ethereum", value: "ethereum", description: "Mainnet blue-chip token and protocol contracts" },
  { label: "Base", value: "base", description: "L2 consumer and onchain application deployments" },
  { label: "Polygon", value: "polygon", description: "High-throughput PoS contracts and integrations" },
  { label: "Arbitrum", value: "arbitrum", description: "Optimistic rollup DeFi and infrastructure" },
];

const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const exampleContracts = [
  { label: "USDC", address: usdcAddress, network: "ethereum" as const },
  { label: "WETH", address: wethAddress, network: "ethereum" as const },
];

const fallbackReport: ScanReport = {
  id: "demo-usdc-ethereum",
  contractAddress: usdcAddress,
  network: "ethereum",
  timestamp: new Date("2026-06-15T00:00:00.000Z").toISOString(),
  trustScore: 92,
  securityGrade: "A",
  riskLevel: "LOW",
  overview: {
    bytecodeSize: 12048,
    bytecodePreview: "0x608060405234801561001057600080fd5b506004361061...",
  },
  sections: {
    glamsterdamReadiness: { status: "READY", summary: "No blocking Glamsterdam-readiness risks detected." },
    evmFindings: [
      {
        id: "EVM-001",
        category: "Gas Analysis",
        severity: "LOW",
        title: "Runtime bytecode size is within expected range",
        description: "The deployed bytecode size does not indicate elevated deployment or execution risk.",
        recommendation: "Continue monitoring bytecode growth as new releases are deployed.",
        evidence: "Bytecode size: 12,048 bytes",
      },
    ],
    vulnerabilities: [
      {
        id: "SWC-BASELINE",
        category: "Vulnerability Intelligence",
        severity: "INFO",
        title: "No critical heuristic findings in demo report",
        description: "TrustShield did not identify a critical vulnerability signal in this demo baseline.",
        recommendation: "Use the full API scan and human review before production changes.",
        evidence: "Demo dashboard sample",
      },
    ],
    sourceCodeIntelligence: { status: "Available", signals: ["Verified blue-chip contract pattern", "Stable interface surface"] },
    tokenIntelligence: { status: "Available", signals: ["Widely integrated asset", "High liquidity profile"] },
    blockchainReputation: { status: "Available", signals: ["Long-lived Ethereum deployment", "Consistent contract usage"] },
    aiRecommendations: [
      "Prioritize manual review for upgrade, pause, mint, and blacklist controls.",
      "Re-run scans after each compiler, dependency, or proxy implementation change.",
      "Track Glamsterdam gas-readiness findings before high-volume integrations ship.",
    ],
  },
};

function getBadgeClass(value: string) {
  const normalized = value.toLowerCase();
  if (["a", "low", "info"].includes(normalized)) return "badge badgeGood";
  if (["b", "c", "medium"].includes(normalized)) return "badge badgeWarn";
  return "badge badgeDanger";
}

function collectFindings(report: ScanReport): SecurityFinding[] {
  return [...report.sections.evmFindings, ...report.sections.vulnerabilities];
}

export default function HomePage() {
  const [contractAddress, setContractAddress] = useState(usdcAddress);
  const [network, setNetwork] = useState<SupportedNetwork>("ethereum");
  const [report, setReport] = useState<ScanReport>(fallbackReport);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findings = useMemo(() => collectFindings(report), [report]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contractAddress, network }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Scan failed. Please verify the address and network.");
      }
      setReport(payload);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <nav className="nav">
        <strong>TrustShield AI</strong>
        <div>
          <a href="#networks">Networks</a>
          <a className="navCta" href="#scan">Run Scan</a>
        </div>
      </nav>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">Ethereum Glamsterdam readiness · Smart contract security</p>
          <h1>Grant-review ready contract intelligence in one professional dashboard.</h1>
          <p>
            TrustShield AI turns deployed bytecode, vulnerability heuristics, gas-risk analysis, and chain reputation signals into clear decisions for reviewers, builders, and protocol teams.
          </p>
          <div className="heroActions">
            <a className="cta" href="#scan">Scan a contract</a>
            <a className="secondaryCta" href="#results">View sample report</a>
          </div>
        </div>
        <aside className="heroPanel" aria-label="Platform metrics">
          <span>Multi-chain coverage</span>
          <strong>4 networks</strong>
          <span>Reviewer-friendly output</span>
          <strong>Score · Grade · Risk</strong>
        </aside>
      </section>

      <section id="scan" className="panel scannerPanel">
        <div>
          <p className="eyebrow">Contract scanner</p>
          <h2>Start with a known Ethereum contract or paste any supported address.</h2>
          <p className="muted">Example buttons prefill USDC and WETH for a fast grant-judge demo.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Contract address
            <input value={contractAddress} onChange={(event) => setContractAddress(event.target.value)} placeholder="0x... contract address" />
          </label>
          <label>
            Network
            <select value={network} onChange={(event) => setNetwork(event.target.value as SupportedNetwork)}>
              {supportedNetworks.map((chain) => <option key={chain.value} value={chain.value}>{chain.label}</option>)}
            </select>
          </label>
          <button type="submit" disabled={isLoading}>{isLoading ? "Analyzing..." : "Analyze Smart Contract"}</button>
        </form>
        <div className="examples">
          {exampleContracts.map((example) => (
            <button key={example.label} type="button" className="exampleButton" onClick={() => { setContractAddress(example.address); setNetwork(example.network); }}>
              Use {example.label}
            </button>
          ))}
        </div>
        {error ? <p className="error" role="alert">{error}</p> : null}
      </section>

      <section id="results" className="resultsGrid">
        <article className="scoreCard"><span>Trust Score</span><strong>{report.trustScore}</strong><p>Composite confidence based on bytecode, vulnerability, reputation, and readiness signals.</p></article>
        <article className="metricCard"><span>Security Grade</span><strong className={getBadgeClass(report.securityGrade)}>{report.securityGrade}</strong></article>
        <article className="metricCard"><span>Risk Level</span><strong className={getBadgeClass(report.riskLevel)}>{report.riskLevel}</strong></article>
      </section>

      <section className="dashboard" aria-label="Scan result dashboard">
        <article className="card overviewCard">
          <p className="eyebrow">Contract overview</p>
          <h2>{report.contractAddress}</h2>
          <dl>
            <div><dt>Network</dt><dd>{report.network}</dd></div>
            <div><dt>Bytecode size</dt><dd>{report.overview.bytecodeSize.toLocaleString()} bytes</dd></div>
            <div><dt>Report ID</dt><dd>{report.id}</dd></div>
            <div><dt>Timestamp</dt><dd>{new Date(report.timestamp).toLocaleString()}</dd></div>
          </dl>
          <code>{report.overview.bytecodePreview}</code>
        </article>

        <article className="card tableCard">
          <p className="eyebrow">Findings</p>
          <h2>Security findings table</h2>
          <div className="tableWrap">
            <table>
              <thead><tr><th>Severity</th><th>Finding</th><th>Evidence</th><th>Recommendation</th></tr></thead>
              <tbody>{findings.map((finding) => <tr key={finding.id}><td><span className={getBadgeClass(finding.severity)}>{finding.severity}</span></td><td><strong>{finding.title}</strong><small>{finding.category}</small></td><td>{finding.evidence}</td><td>{finding.recommendation}</td></tr>)}</tbody>
            </table>
          </div>
        </article>

        <article className="card recommendations"><p className="eyebrow">Recommendations</p><h2>Next best actions</h2><ul>{report.sections.aiRecommendations.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </section>

      <section id="networks" className="networkGrid">
        {supportedNetworks.map((chain) => <article className="card" key={chain.value}><h3>{chain.label}</h3><p>{chain.description}</p></article>)}
      </section>
    </main>
  );
}
