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

## Historical & Reputation Risk Intelligence

TrustShield AI now adds a historical intelligence layer on top of the
Glamsterdam bytecode scanner. The layer is designed to combine deterministic
scanner results, AI-style security intelligence from findings severity, and
historical reputation indicators into a single TrustShield Risk Intelligence
score.

The reputation analysis supports:

- Contract age analysis when deployment time is available.
- Deployment history insights such as deployment block, deployer address, and
  high-risk deployment pattern flags.
- Contract verification status (`verified`, `not_verified`, or `unknown`).
- Reputation score from `0` to `100`.
- Reputation risk levels of `LOW`, `MEDIUM`, and `HIGH`.
- Scam and suspicious behavior indicators for very new contracts, missing
  verification, high-risk deployment patterns, and suspicious metadata flags.

Default CLI analysis remains safe when historical data is unavailable: unknown
age and unknown verification are reported as reputation warnings so users know
that the result needs additional provenance review.

### Trust Score Explanation

The TrustShield Risk Intelligence score is a `0` to `100` overall trust score
that combines:

- 50% Glamsterdam/security scanner readiness score.
- 20% AI security intelligence derived from scanner finding severity.
- 30% historical reputation score.

Overall risk levels are classified as:

| Trust Score | Risk Level |
| --- | --- |
| 85–100 | `SAFE` |
| 60–84 | `CAUTION` |
| 40–59 | `HIGH RISK` |
| 0–39 | `CRITICAL` |

### Human-Readable Intelligence Example

```text
TrustShield Risk Intelligence:

Overall Trust Score:
82/100

Risk Level:
CAUTION

Historical Analysis:
- Contract age: 45 days
- Verification: not_verified
- Reputation: MEDIUM risk (64/100)

Risk Insights:
- Contract is relatively new
- Contract source is not verified

Intelligence Recommendations:
- Manual review recommended for relatively new contracts.
- Request verified source code before relying on the contract.
```

### JSON Output Example

The `--json` output includes the original scanner fields plus TrustShield Risk
Intelligence fields:

```json
{
  "address": "0x0000000000000000000000000000000000000000",
  "network": "base",
  "bytecodeSize": 8,
  "readinessScore": 82,
  "riskLevel": "LOW",
  "metrics": {
    "stateAccessOps": 2,
    "externalInteractionOps": 1,
    "logOps": 1,
    "blockContextOps": 0,
    "deprecatedOps": 0
  },
  "findings": [],
  "recommendations": [],
  "trustScore": 82,
  "trustRiskLevel": "CAUTION",
  "contractAge": 45,
  "verificationStatus": "not_verified",
  "reputationScore": 64,
  "historicalFindings": [
    {
      "id": "HIST-NEW-CONTRACT",
      "severity": "MEDIUM",
      "title": "Contract is relatively new",
      "evidence": "Contract age is 45 days.",
      "recommendation": "Perform manual review and monitor early user reports."
    }
  ],
  "intelligenceRecommendations": [
    "Manual review recommended for relatively new contracts."
  ],
  "timestamp": "2026-06-15T10:00:00.000Z"
}
```
