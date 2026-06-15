# Glamsterdam Upgrade Research

## Research Goal

Understand how upcoming Glamsterdam protocol changes may affect existing Ethereum smart contracts and infrastructure.

## Areas of Focus

* Gas repricing effects
* New EVM capabilities
* Contract size changes
* Native ETH transfer logs
* Block-Level Access Lists (BALs)
* Enshrined Proposer-Builder Separation (ePBS)

## Expected Challenges

* Increased transaction cost uncertainty
* Compatibility issues in existing contracts
* Developer migration complexity

## TrustShield AI Contribution

TrustShield AI will provide open-source tooling that helps developers evaluate contract readiness before the Glamsterdam upgrade is activated.

## Implemented Static Signals

The current analyzer uses bytecode-level rules for early upgrade readiness:

* Contract size and gas review scope
* Storage/account access density for BAL-style review
* External calls and contract creation opcodes
* Native ETH transfer and log-indexing assumptions
* Block context usage relevant to sequencing, builder, and inclusion-list assumptions
* Deprecated opcode usage such as `SELFDESTRUCT` and `CALLCODE`
