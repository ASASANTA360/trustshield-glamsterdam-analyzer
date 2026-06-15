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

For machine-readable output:

```bash
npm start -- analyze <contract-address> --json
```

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
- Adds live blockchain intelligence with verification, deployment, activity,
  reputation, and suspicious activity signals.


## Blockchain Intelligence

TrustShield AI adds a live blockchain intelligence layer for supported
Etherscan-compatible explorers. The CLI combines bytecode analysis with
verified-source status, deployment metadata, deployer information, activity
statistics, contract age, reputation scoring, and suspicious activity findings.

### Explorer API Configuration

Set explorer API keys through environment variables. RPC endpoints remain
configurable independently for bytecode retrieval.

```bash
ETHERSCAN_API_KEY=your_etherscan_key \
BASESCAN_API_KEY=your_basescan_key \
POLYGONSCAN_API_KEY=your_polygonscan_key \
ARBISCAN_API_KEY=your_arbiscan_key \
EXPLORER_TIMEOUT_MS=10000 \
npm start -- analyze <contract-address> --network ethereum
```

Supported explorers:

- Ethereum via Etherscan (`ETHERSCAN_API_KEY`)
- Base via Basescan (`BASESCAN_API_KEY`)
- Polygon via Polygonscan (`POLYGONSCAN_API_KEY`)
- Arbitrum via Arbiscan (`ARBISCAN_API_KEY`)

### Human-Readable Report Example

```text
Blockchain Intelligence:

Verification:
Verified

Contract Age:
120 days

Deployer:
0x1234...

Activity:
Transaction count: 842
First seen: 2026-02-15T10:00:00.000Z
Latest activity: 2026-06-15T09:30:00.000Z

Reputation:
88/100 (HIGH confidence)
```

### JSON Output Fields

Machine-readable reports include these blockchain intelligence fields when
explorer data is available:

- `blockchainVerification`
- `deploymentTimestamp`
- `deploymentBlock`
- `deployerAddress`
- `transactionCount`
- `activityScore`
- `blockchainReputationScore`
- `blockchainFindings`

## Project Status

This project is in MVP analyzer stage. The current CLI uses deterministic
bytecode rules and is ready for ABI-aware and source-aware analysis.
