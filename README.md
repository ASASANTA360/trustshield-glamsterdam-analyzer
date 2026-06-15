# TrustShield AI Web3 Security Platform

TrustShield AI is a TypeScript smart-contract security platform that preserves the original CLI analyzer and adds a Next.js dashboard, REST API surface, persistent scan storage, and analytics for Ethereum, Base, Polygon, and Arbitrum.

## Install

```bash
npm install
```

> The dashboard uses Next.js, React, React DOM, and MongoDB dependencies declared in `package.json`. If your package registry blocks those packages, the CLI and core TypeScript checks still run, but install access must be restored before running the web server.

## Environment

Create `.env.local` from `.env.example`:

```bash
MONGODB_URI=mongodb://localhost:27017/trustshield
NEXT_PUBLIC_APP_NAME=TrustShield AI
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

RPC endpoints are optional and default to public RPC providers:

```bash
ETH_RPC_URL=https://ethereum.publicnode.com
BASE_RPC_URL=https://base.publicnode.com
POLYGON_RPC_URL=https://polygon-bor-rpc.publicnode.com
ARBITRUM_RPC_URL=https://arbitrum-one-rpc.publicnode.com
RPC_TIMEOUT_MS=10000
```

## Web dashboard setup

```bash
npm run dev
```

Open `http://localhost:3000` to view the professional landing page, supported-chain overview, scan form, responsive cards, risk badges, loading/error-ready sections, and dashboard-oriented scan result pages.

## CLI usage

```bash
npm start -- analyze <contract-address>
npm start -- analyze <contract-address> --network base --json
```

The CLI remains fully operational and uses the same multi-chain TrustShield analysis engine as the web API.

## REST API

### `POST /api/scan`

Runs a TrustShield analysis, saves the result, and returns the complete JSON report.

Request body:

```json
{
  "contractAddress": "0x0000000000000000000000000000000000000000",
  "network": "ethereum"
}
```

Response includes contract overview, timestamp, Trust Score, security grade, risk level, Glamsterdam readiness, EVM findings, SWC/CWE-oriented vulnerability findings, source-code intelligence, token intelligence, blockchain reputation, and AI recommendations.

### `GET /api/scans`

Returns recent persisted scans.

### `GET /api/scans/:id`

Returns a single persisted scan report.

### `GET /api/analytics`

Returns platform statistics:

- Total scans
- Networks analyzed
- Risk distribution
- Vulnerability statistics
- Safe contracts
- High-risk contracts
- Most analyzed chains
- Common vulnerability types

## MongoDB configuration and persistence

Set `MONGODB_URI` for production MongoDB deployments. The platform storage module also provides a local JSON fallback at `.trustshield/scans.json` for development and test environments where MongoDB is not available. Scan records include:

- Contract address
- Network
- Complete analysis result
- Risk score
- Timestamp

## Current security intelligence capabilities

- Fetches deployed bytecode for Ethereum, Base, Polygon, and Arbitrum contracts.
- Reports contract bytecode size and bytecode preview.
- Estimates early gas-size risk as `LOW`, `MEDIUM`, or `HIGH`.
- Parses runtime bytecode opcodes while skipping `PUSH` data.
- Reports Glamsterdam readiness findings for state access, external calls, native ETH/log indexing assumptions, block context usage, and deprecated opcodes.
- Produces Trust Score, security grade, risk level, evidence, vulnerabilities, and AI recommendations.
- Stores historical scan intelligence for analytics dashboards.

## Scripts

```bash
npm run check
npm test
npm run build
npm run next:build
```

## Screenshots

Add screenshots here after running the Next.js dashboard locally:

- Landing page
- Contract scanning form
- Scan result dashboard
- Analytics dashboard
