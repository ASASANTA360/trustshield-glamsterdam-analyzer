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

## Vulnerability Knowledge Base

TrustShield AI now enriches bytecode findings with deterministic vulnerability
intelligence for common smart contract risks. The knowledge base includes SWC
(Smart Contract Weakness Classification) and CWE (Common Weakness Enumeration)
mappings, severity, attack scenarios, remediation guidance, and reference links.

Included starter entries:

| SWC | Vulnerability | CWE | Severity |
| --- | --- | --- | --- |
| SWC-107 | Reentrancy | CWE-841 | CRITICAL |
| SWC-105 | Unprotected Ether Withdrawal | CWE-284 | CRITICAL |
| SWC-112 | Delegatecall to Untrusted Contract | CWE-829 | HIGH |
| SWC-104 | Unchecked Call Return Value | CWE-252 | MEDIUM |
| SWC-106 | Unprotected SELFDESTRUCT | CWE-284 | HIGH |
| SWC-101 | Integer Overflow/Underflow | CWE-190 | HIGH |

### SWC/CWE Detection Coverage

The EVM scanner maps high-signal opcodes to vulnerability intelligence:

- `DELEGATECALL` maps to `SWC-112` / `CWE-829`.
- `SELFDESTRUCT` maps to `SWC-106` / `CWE-284`.
- `CALL` maps to `SWC-104` / `CWE-252` for unchecked low-level call review.

The analyzer reports a 0–100 vulnerability score, critical and high severity
counts, SWC coverage, CWE mappings, and an overall status of `SAFE`,
`REVIEW REQUIRED`, `HIGH RISK`, or `CRITICAL`.

### Example Vulnerability Report

```text
Vulnerability Intelligence:
Status: REVIEW REQUIRED
Vulnerability Score: 25/100
SWC Coverage: SWC-112
CWE Mappings: CWE-829
- Delegatecall to Untrusted Contract
  SWC ID: SWC-112
  CWE: CWE-829
  Severity: HIGH
  Description: Delegatecall to an untrusted contract may allow arbitrary code execution in the caller's storage context.
  Recommendation: Restrict delegatecall targets, validate upgrade mechanisms, and protect implementation changes with strong governance controls.
```

JSON output includes `vulnerabilities`, `vulnerabilityScore`,
`vulnerabilityStatus`, `swcCoverage`, and `cweMappings` fields for downstream
security intelligence workflows.
