# TrustShield Glamsterdam Analyzer

TrustShield Glamsterdam Analyzer is a TypeScript CLI that checks an Ethereum
contract address, fetches its bytecode, and produces an early upgrade-readiness
report for the Ethereum Glamsterdam roadmap. It also fetches verified Solidity
source code and ABI data from Etherscan-compatible explorers when available.

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

You can configure RPC endpoints, explorer API keys, and timeouts:

```bash
ETH_RPC_URL=https://ethereum.publicnode.com \
ETHERSCAN_API_KEY=<key> \
RPC_TIMEOUT_MS=10000 \
EXPLORER_TIMEOUT_MS=10000 \
npm start -- analyze <contract-address>
```

Supported explorer API key environment variables:

- `ETHERSCAN_API_KEY` for Ethereum and as the default fallback.
- `BASESCAN_API_KEY` for Base.
- `POLYGONSCAN_API_KEY` for Polygon.
- `ARBISCAN_API_KEY` for Arbitrum.

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
- Fetches verified Solidity source code from Etherscan-compatible explorers.
- Detects compiler version and optimizer settings.
- Measures source complexity, including contract, source-size, function, and
  modifier counts.
- Parses ABI data, counts public/external functions, and detects sensitive
  functions such as `owner`, `transferOwnership`, `renounceOwnership`,
  `upgrade`, `upgradeTo`, `pause`, `unpause`, `mint`, `burn`, `withdraw`,
  `emergencyWithdraw`, and `setAdmin`.
- Generates source security findings for administrative controls, unlimited
  mint capabilities, upgradeable proxy patterns, and pause/emergency controls.
- Produces a Source Security Score from `0` to `100` with a source risk level.

## Source Intelligence Report

Human-readable reports include a `Source Code Intelligence` section:

```text
Source Code Intelligence

Verification:
Verified

Compiler:
v0.8.24+commit.e11b9ed9

Optimization:
Enabled

ABI Overview:
- Total functions: 12
- Sensitive functions detected: owner, mint, pause

Source Security:
- Score: 53/100
- Risk level: MEDIUM
- Findings:
- [MEDIUM] Privileged administrative controls detected
  Evidence: Administrative indicators: owner
  Recommendation: Protect privileged roles with multisig governance, timelocks, and clear operational runbooks.
```

## JSON Output Fields

Machine-readable output includes Glamsterdam readiness data plus source
intelligence fields:

```json
{
  "address": "0x0000000000000000000000000000000000000000",
  "network": "ethereum",
  "bytecodeSize": 1024,
  "readinessScore": 82,
  "riskLevel": "LOW",
  "sourceVerified": true,
  "compilerVersion": "v0.8.24+commit.e11b9ed9",
  "optimizationEnabled": true,
  "contractCount": 2,
  "sourceCodeSize": 15234,
  "totalFunctions": 12,
  "sensitiveFunctions": ["mint", "owner", "pause"],
  "sourceSecurityScore": 53,
  "sourceRiskLevel": "MEDIUM",
  "sourceFindings": [
    {
      "id": "SRC-ADMIN-CONTROLS",
      "severity": "MEDIUM",
      "title": "Privileged administrative controls detected",
      "evidence": "Administrative indicators: owner",
      "recommendation": "Protect privileged roles with multisig governance, timelocks, and clear operational runbooks."
    }
  ],
  "timestamp": "2026-06-15T10:00:00.000Z"
}
```

## ABI Analysis Example

Given an explorer ABI containing:

```json
[
  { "type": "function", "name": "owner", "stateMutability": "view" },
  { "type": "function", "name": "mint", "stateMutability": "nonpayable" },
  { "type": "function", "name": "balanceOf", "stateMutability": "view" }
]
```

TrustShield reports `totalFunctions: 3` and flags `owner` and `mint` as
sensitive functions. If the verified source does not show an obvious supply cap,
`mint` contributes to a high-severity source finding for potential unlimited
mint authority.

## Project Status

This project is in MVP analyzer stage. The current CLI uses deterministic
bytecode, ABI, and verified source-code rules to provide early upgrade-readiness
and source-security intelligence.
