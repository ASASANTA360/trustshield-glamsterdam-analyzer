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

## AI Security Intelligence Layer

TrustShield AI now adds an AI Security Intelligence Layer on top of static bytecode scanning. The layer converts raw security findings into an audit-ready narrative, developer explanations, prioritized improvement suggestions, and a letter grade.

### Security grades

- `A`: 90-100
- `B`: 80-89
- `C`: 70-79
- `D`: 60-69
- `F`: below 60

The CLI report includes the security score, risk level, grade, AI audit summary, and improvement suggestions. JSON output includes `securityGrade`, `aiSecuritySummary`, and `aiRecommendations` for downstream automation.

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
- `securityGrade`: letter grade from `A` to `F`
- `aiSecuritySummary`: audit-style summary generated from the score, risk level, findings, and recommendations
- `aiRecommendations`: developer-friendly explanations and improvement suggestions

### CLI report example

```text
Security Score:
70/100 (MEDIUM, Grade C)

Security Findings:
- [HIGH] DELEGATECALL usage detected (1 DELEGATECALL)
  The contract uses DELEGATECALL, which executes external code in the current contract context...

Security Recommendations:
- Restrict delegatecall targets to audited implementations, protect upgrade paths with strong access control and timelocks...

AI Security Summary:
TrustShield AI assigns security grade C with a score of 70/100, indicating a moderate security posture that needs targeted hardening. Overall risk level is MEDIUM. Detected 1 security finding(s): 1 high, 0 medium, and 0 low severity. Primary review areas: DELEGATECALL (HIGH).

AI Improvement Suggestions:
- DELEGATECALL: Restrict delegatecall targets to audited implementations, protect upgrade paths with strong access control and timelocks... Developer note: The contract uses DELEGATECALL, which executes external code in the current contract context...
- Prioritize remediation by severity, then re-run the analyzer to confirm the security score and grade improve.
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
  "securityGrade": "C",
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
  ],
  "aiSecuritySummary": "TrustShield AI assigns security grade C with a score of 70/100, indicating a moderate security posture that needs targeted hardening. Overall risk level is MEDIUM. Detected 1 security finding(s): 1 high, 0 medium, and 0 low severity. Primary review areas: DELEGATECALL (HIGH).",
  "aiRecommendations": [
    "DELEGATECALL: Restrict delegatecall targets to audited implementations, protect upgrade paths with strong access control and timelocks, and verify storage layout compatibility before upgrades. Developer note: The contract uses DELEGATECALL, which executes external code in the current contract context and can corrupt storage or bypass authorization when the target is untrusted or upgrade controls are weak.",
    "Prioritize remediation by severity, then re-run the analyzer to confirm the security score and grade improve.",
    "Schedule a manual smart contract review before production deployment because the automated scan found non-trivial risk indicators."
  ]
}
```
