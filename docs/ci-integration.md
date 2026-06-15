# CI Integration Guide

TrustShield Glamsterdam Analyzer can run inside GitHub Actions and publish a
machine-readable JSON report as a workflow artifact. This is useful for smart
contract teams that want upgrade-readiness checks to run on pull requests,
release branches, or scheduled audits.

## Run This Repository's Analyzer Workflow

This repository includes a reusable workflow at
`.github/workflows/glamsterdam-analyzer.yml`. It installs dependencies, runs the
test suite, builds the analyzer, analyzes a contract address with `--json`, and
uploads `glamsterdam-report.json` as an artifact.

The default sample contract is WETH on Ethereum mainnet:

```text
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```

## Use From Another Smart Contract Repository

Add this workflow to your smart contract project as
`.github/workflows/glamsterdam-readiness.yml`:

```yaml
name: Glamsterdam Readiness

on:
  pull_request:
  workflow_dispatch:

jobs:
  trustshield:
    uses: ASASANTA360/trustshield-glamsterdam-analyzer/.github/workflows/glamsterdam-analyzer.yml@main
    with:
      contract_address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      rpc_timeout_ms: "15000"
    secrets:
      eth_rpc_url: ${{ secrets.ETH_RPC_URL }}
```

Store your RPC endpoint as a repository secret named `ETH_RPC_URL` if you use a
private provider. If no secret is supplied, the workflow uses the public default
RPC endpoint configured in the analyzer workflow.

## Artifact Output

The workflow uploads an artifact named `glamsterdam-analyzer-report`. The JSON
file contains:

```json
{
  "address": "0x...",
  "bytecodeSize": 1234,
  "readinessScore": 82,
  "riskLevel": "LOW",
  "metrics": {},
  "findings": [],
  "recommendations": [],
  "timestamp": "2026-06-15T10:00:00.000Z"
}
```

Downstream projects can download this artifact in later jobs and feed it into
dashboards, release gates, or security review reports.

## Pinning Analyzer Versions

For stable pipelines, replace `@main` with a release tag once the analyzer has
published versions:

```yaml
uses: ASASANTA360/trustshield-glamsterdam-analyzer/.github/workflows/glamsterdam-analyzer.yml@v1
```

During development, you can pass `analyzer_ref` to test a branch of this
analyzer repository:

```yaml
with:
  analyzer_ref: "codex/github-action-integration"
```
