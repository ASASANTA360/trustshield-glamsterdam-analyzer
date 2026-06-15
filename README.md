# TrustShield AI — Glamsterdam Analyzer

TrustShield AI is an Ethereum smart contract analysis tool focused on Glamsterdam upgrade readiness, bytecode risk review, and developer-friendly reporting.

## Usage

Analyze a deployed contract by address:

```bash
trustshield analyze <contract-address>
```

Generate machine-readable JSON output:

```bash
trustshield analyze <contract-address> --json
```

## Advanced Security Scanner

The analyzer includes a static bytecode security scanner for high-risk EVM patterns that deserve manual review before upgrades or production deployments.

### Detected patterns

- `DELEGATECALL` usage
- `SELFDESTRUCT` opcode usage
- Dangerous low-level external `CALL` patterns
- Legacy `CALLCODE` usage
- Suspicious low-level `STATICCALL` usage

### Security scoring

Security output includes:

- `securityScore`: score from `0` to `100`
- `securityRiskLevel`: `LOW`, `MEDIUM`, or `HIGH`
- `securityFindings`: human-readable findings with severity, opcode counts, and descriptions
- `securityRecommendations`: actionable remediation guidance

### CLI report example

```text
Security Score:
70/100 (MEDIUM)

Security Findings:
- [HIGH] DELEGATECALL usage detected (1 DELEGATECALL)
  The contract uses DELEGATECALL, which executes external code in the current contract context...

Security Recommendations:
- Restrict delegatecall targets to audited implementations, protect upgrade paths with strong access control and timelocks...
```

### JSON output example

```json
{
  "address": "0x0000000000000000000000000000000000000000",
  "contractFound": true,
  "bytecodeSize": 1024,
  "bytecodePreview": "0x6080604052...",
  "securityScore": 70,
  "securityRiskLevel": "MEDIUM",
  "securityFindings": [
    {
      "id": "delegatecall-usage",
      "title": "DELEGATECALL usage detected",
      "severity": "HIGH",
      "opcode": "DELEGATECALL",
      "count": 1,
      "description": "The contract uses DELEGATECALL, which executes external code in the current contract context and can corrupt storage or bypass authorization when the target is untrusted or upgrade controls are weak.",
      "recommendation": "Restrict delegatecall targets to audited implementations, protect upgrade paths with strong access control and timelocks, and verify storage layout compatibility before upgrades."
    }
  ],
  "securityRecommendations": [
    "Restrict delegatecall targets to audited implementations, protect upgrade paths with strong access control and timelocks, and verify storage layout compatibility before upgrades."
  ]
}
```
