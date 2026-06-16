# TrustShield AI — Glamsterdam Smart Contract Security Analyzer

![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![Ethereum](https://img.shields.io/badge/Ethereum-Glamsterdam-627eea?logo=ethereum&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-green)

**Live demo:** https://trustshield-glamsterdam-analyzer.vercel.app

TrustShield AI is a grant-ready TypeScript platform for assessing deployed EVM smart contracts against security, gas-risk, and Ethereum Glamsterdam-readiness signals. It preserves the original CLI analyzer while adding a professional Next.js dashboard, REST API, persistent scan storage, and analytics for Ethereum, Base, Polygon, and Arbitrum.

## Problem statement

Smart contract teams and grant reviewers need fast, repeatable evidence that deployed contracts are safe to integrate and prepared for protocol-level changes. Raw bytecode, scattered vulnerability notes, and JSON-only scan output are difficult to evaluate during a grant review. TrustShield AI converts that data into clear trust scores, grades, findings, and recommendations.

## Solution overview

TrustShield AI fetches deployed contract bytecode, runs the existing Glamsterdam and gas-analysis engines, enriches results with vulnerability and reputation-oriented sections, persists reports, and presents reviewer-friendly dashboards. The web experience highlights the same data exposed through the API and CLI, so teams can move from local automation to grant demos without changing the underlying analyzer.

## Key features

- Professional dashboard with hero messaging, easy scan form, example USDC/WETH buttons, Trust Score, Security Grade, Risk Level, overview cards, findings table, and recommendations.
- Multi-chain deployed-bytecode scans for Ethereum, Base, Polygon, and Arbitrum.
- Glamsterdam-readiness analysis for EVM behavior, gas assumptions, opcode usage, and contract-level upgrade risks.
- Persistent report storage through MongoDB with local JSON fallback for development and tests.
- REST API for scans, historical results, and aggregate analytics.
- CLI workflows for automation, CI usage, and JSON output.

## Architecture

```text
Next.js Dashboard
  ├─ POST /api/scan ─────┐
  ├─ GET /api/scans      │
  └─ GET /api/analytics  │
                         ▼
Platform scan service ── Validation ── Storage (MongoDB or local JSON)
                         │
                         ▼
Blockchain bytecode fetcher ── Glamsterdam analyzer ── Gas analyzer ── Report builder
```

Core source areas:

- `src/app` — Next.js dashboard and API routes.
- `src/platform` — validation, scan orchestration, persistence, and report shaping.
- `src/blockchain` — supported networks and bytecode fetching.
- `src/glamsterdam` — Glamsterdam-readiness analysis.
- `src/gas-analysis` — EVM opcode and gas-risk analysis.
- `src/cli` — command-line interface and report formatting.

## Supported networks

| Network | Identifier | Typical use |
| --- | --- | --- |
| Ethereum | `ethereum` | Mainnet blue-chip contracts and grant-review demos |
| Base | `base` | L2 consumer apps and protocol integrations |
| Polygon | `polygon` | High-throughput PoS deployments |
| Arbitrum | `arbitrum` | Optimistic rollup DeFi and infrastructure |

## API documentation

### `POST /api/scan`

Runs a TrustShield analysis, persists the result, and returns the full report.

```bash
curl -X POST http://localhost:3000/api/scan \
  -H 'content-type: application/json' \
  -d '{"contractAddress":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","network":"ethereum"}'
```

Example response shape:

```json
{
  "id": "scan_...",
  "contractAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "network": "ethereum",
  "trustScore": 92,
  "securityGrade": "A",
  "riskLevel": "LOW",
  "overview": {
    "bytecodeSize": 12048,
    "bytecodePreview": "0x608060405234..."
  },
  "sections": {
    "evmFindings": [],
    "vulnerabilities": [],
    "aiRecommendations": []
  }
}
```

### `GET /api/scans`

Returns recent persisted scan reports.

### `GET /api/scans/:id`

Returns one persisted scan report by ID.

### `GET /api/analytics`

Returns platform statistics including total scans, network distribution, risk distribution, vulnerability counts, safe contracts, high-risk contracts, most analyzed chains, and common vulnerability types.

## Example scan results

The dashboard includes one-click examples for grant reviewers:

| Contract | Network | Address | Reviewer value |
| --- | --- | --- | --- |
| USDC | Ethereum | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | Demonstrates a high-signal stablecoin review flow |
| WETH | Ethereum | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | Demonstrates a canonical wrapped-ETH contract scan |

A report includes Trust Score, Security Grade, Risk Level, bytecode size, bytecode preview, EVM findings, vulnerability findings, token/source/reputation signals, and AI recommendations.

## Screenshots and demo documentation

Screenshot placeholders and capture guidance live in [`docs/screenshots.md`](docs/screenshots.md). A 2-minute video script lives in [`docs/demo.md`](docs/demo.md).

Planned screenshots:

- Homepage hero and value proposition.
- Scan form with USDC and WETH example buttons.
- Result dashboard with score, grade, risk, overview, findings, and recommendations.
- Analytics view showing scan distribution and risk trends.

## Grant relevance: Ethereum Glamsterdam readiness

TrustShield AI is designed for Ethereum ecosystem grant review because it makes protocol-readiness evidence understandable and repeatable. The analyzer surfaces bytecode-level signals, gas-sensitive patterns, deprecated opcode risks, external call assumptions, and block-context usage that matter when evaluating whether contracts are ready for network upgrades such as Glamsterdam.

For Glamsterdam-focused funding, the project demonstrates:

- A practical public-good workflow for safer EVM deployments.
- Repeatable scans across L1 and major L2 ecosystems.
- Clear reviewer output rather than raw engineering logs.
- Extensible architecture for future EIPs, richer source-code intelligence, and benchmark datasets.

## Roadmap

- Add verified-source ingestion from block explorers.
- Add richer proxy/implementation detection and upgrade-admin risk analysis.
- Add PDF and shareable public report exports.
- Add authenticated organization workspaces.
- Add historical trend charts and portfolio monitoring.
- Expand Glamsterdam-specific EIP checks as final upgrade details stabilize.

## Setup instructions

```bash
npm install
npm run check
npm test
npm run dev
```

Open `http://localhost:3000` for the dashboard.

### CLI usage

```bash
npm start -- analyze 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 --network ethereum
npm start -- analyze 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 --network ethereum --json
```

### Production build

```bash
npx next build
```

## Environment variables

Create `.env.local` from these values as needed:

```bash
MONGODB_URI=mongodb://localhost:27017/trustshield
NEXT_PUBLIC_APP_NAME=TrustShield AI
NEXT_PUBLIC_APP_URL=http://localhost:3000
ETH_RPC_URL=https://ethereum.publicnode.com
BASE_RPC_URL=https://base.publicnode.com
POLYGON_RPC_URL=https://polygon-bor-rpc.publicnode.com
ARBITRUM_RPC_URL=https://arbitrum-one-rpc.publicnode.com
RPC_TIMEOUT_MS=10000
```

Notes:

- `MONGODB_URI` is optional in local development because storage falls back to `.trustshield/scans.json`.
- RPC endpoint variables are optional and default to public providers.
- Production deployments should use dedicated RPC providers and a managed MongoDB instance.

## Scripts

```bash
npm run check      # TypeScript validation
npm test           # Type checks plus unit tests
npm run build      # TypeScript compile
npm run next:build # Next.js production build
npx next build     # Required grant verification build command
```

## License

ISC. See [`LICENSE`](LICENSE).
