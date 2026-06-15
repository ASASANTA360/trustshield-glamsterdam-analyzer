# TrustShield Glamsterdam Analyzer

TrustShield Glamsterdam Analyzer is a TypeScript CLI that checks an Ethereum
contract address, fetches its bytecode, and produces an early upgrade-readiness
report for the Ethereum Glamsterdam roadmap.

## Install

```bash
npm install
```

## Usage

```bash
npm start -- analyze <contract-address>
```

For machine-readable console output:

```bash
npm start -- analyze <contract-address> --json
```

## Professional Audit Reports

TrustShield AI can generate professional audit reports from the same Glamsterdam
readiness and bytecode intelligence used by the CLI. Reports are saved to the
`audit-reports` directory with filenames that include the contract address,
network, report date, and export type.

```bash
npm start -- analyze 0x0000000000000000000000000000000000000000 --report markdown
npm start -- analyze 0x0000000000000000000000000000000000000000 --report html
npm start -- analyze 0x0000000000000000000000000000000000000000 --report json
```

Example output path:

```text
audit-reports/0xa0b8_eth_2026-06-15_audit.md
```

Report exports include:

- **Markdown (`.md`)**: title page, executive summary, security scorecard,
  findings table, risk analysis, recommendations, and conclusion.
- **HTML (`.html`)**: clean professional layout with risk badges, score cards,
  findings sections, and a summary dashboard.
- **JSON (`.json`)**: structured audit metadata, executive summary, findings,
  recommendations, and all available audit intelligence data.

Each report includes a report ID, report version, generated timestamp,
TrustShield AI version, overall TrustShield score, security grade (`A` through
`F`), risk level, and finding totals by severity.

You can also configure the RPC endpoint and timeout:

```bash
ETH_RPC_URL=https://ethereum.publicnode.com RPC_TIMEOUT_MS=10000 npm start -- analyze <contract-address>
```

## Scripts

```bash
npm run check
npm test
npm run build
```

## Current Capabilities

- Fetches deployed bytecode for an Ethereum contract address.
- Reports contract bytecode size.
- Estimates early gas-size risk as `LOW`, `MEDIUM`, or `HIGH`.
- Parses runtime bytecode opcodes while skipping `PUSH` data.
- Reports Glamsterdam readiness findings for state access, external calls,
  native ETH/log indexing assumptions, block context usage, and deprecated
  opcodes.
- Produces a readiness score, risk level, evidence, and recommendations.
- Generates Markdown, HTML, and JSON professional audit reports in
  `audit-reports/`.

## Project Status

This project is in MVP analyzer stage. The current CLI uses deterministic
bytecode rules and is ready for ABI-aware and source-aware analysis.
