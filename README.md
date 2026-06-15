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

## Project Status

This project is in MVP analyzer stage. The current CLI uses deterministic
bytecode rules and is ready for ABI-aware and source-aware analysis.

## Token Intelligence

TrustShield AI now includes deterministic DeFi and token risk intelligence that can be
combined with bytecode, ABI, and verified source-code review workflows. The analyzer
identifies token standards, privileged token controls, and rug-pull indicators so AI
security reports can explain both Glamsterdam-readiness signals and token-specific
security posture.

### Supported Token Standards

- ERC-20 fungible tokens
- ERC-721 NFTs
- ERC-1155 multi-token contracts

When a verified ABI is unavailable, token intelligence reports `UNKNOWN` for the token
standard and emits an informational finding that the analysis is limited. Supplying ABI
and source code enables higher-confidence detection of minting, ownership, pausing,
upgradeability, metadata, royalty, approval, and supply-management controls.

### Risk Scoring

Token risk scores use a 0-100 scale. Findings subtract weighted penalties based on
severity, and the resulting score maps to a security grade and risk level:

| Score | Grade | Risk level |
| --- | --- | --- |
| 90-100 | A | SAFE |
| 80-89 | B | CAUTION |
| 70-79 | C | CAUTION |
| 60-69 | D | HIGH RISK |
| Below 60 | F | CRITICAL |

### Token Risk Signals

Token intelligence detects high-signal controls and rug-pull indicators, including:

- Mint capabilities and unlimited mint authority
- Burn permissions and supply-management controls
- Owner, admin, role, and operator privileges
- Blacklist, whitelist, transfer-freeze, and pause/unpause controls
- Transaction tax or fee mechanisms
- Upgradeable token patterns and upgrade backdoors
- NFT metadata URI and royalty configuration controls
- ERC-1155 batch mint and broad operator approval concerns
- Emergency withdrawal, rescue, sweep, and asset recovery functions

### Example Token Report

```text
Token Intelligence

Standard:
ERC-20

Token Risk Score:
95/100

Security Grade:
A

Risk Level:
SAFE

Detected Controls:
- Mintable
- Ownable
- Pausable

Risk Findings:
- None detected
```

Machine-readable JSON reports include these additional fields when token intelligence
is available:

- `tokenStandard`
- `tokenRiskScore`
- `tokenSecurityGrade`
- `tokenRiskLevel`
- `tokenCapabilities`
- `tokenFindings`
- `rugPullIndicators`
