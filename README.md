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

## GitHub Actions CI

This repository includes a reusable GitHub Actions workflow that installs the
analyzer, runs tests, builds the CLI, analyzes a sample Ethereum contract with
`--json`, and uploads the JSON report as an artifact.

```yaml
jobs:
  trustshield:
    uses: ASASANTA360/trustshield-glamsterdam-analyzer/.github/workflows/glamsterdam-analyzer.yml@main
    with:
      contract_address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    secrets:
      eth_rpc_url: ${{ secrets.ETH_RPC_URL }}
```

See [docs/ci-integration.md](docs/ci-integration.md) for setup guidance in
other smart contract repositories.

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
