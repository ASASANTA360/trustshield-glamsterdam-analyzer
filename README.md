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
- Leaves room for deeper EVM opcode compatibility and AI-assisted explanations.

## Project Status

This project is in MVP foundation stage. The current CLI is intentionally small
and is ready for additional Glamsterdam-specific analysis rules.
