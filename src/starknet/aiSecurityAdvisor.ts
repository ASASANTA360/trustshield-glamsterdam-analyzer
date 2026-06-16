export type SecurityAdvice = {
  explanation: string;
  attackScenario: string;
  fixSuggestion: string;
};

const securityKnowledgeBase: Record<string, SecurityAdvice> = {
  "CAIRO-EXT-001": {
    explanation:
      "External functions expose contract logic to users and other contracts. Without proper access restrictions, sensitive operations may be abused.",
    attackScenario:
      "An attacker calls a privileged external function and changes important contract state.",
    fixSuggestion:
      "Protect sensitive functions with ownership or role-based access controls.",
  },

  "CAIRO-STORE-001": {
    explanation:
      "Storage modifications affect permanent contract state. Incorrect state transitions may introduce serious logic vulnerabilities.",
    attackScenario:
      "A malicious user triggers unexpected storage updates that break business rules.",
    fixSuggestion:
      "Validate all state transitions and apply strict authorization checks.",
  },

  "CAIRO-CALL-001": {
    explanation:
      "External contract interactions depend on third-party behavior and should be carefully validated.",
    attackScenario:
      "A malicious or unexpected contract response causes your contract to behave incorrectly.",
    fixSuggestion:
      "Verify external addresses, handle failures safely, and minimize trust assumptions.",
  },

  "CAIRO-VALID-001": {
    explanation:
      "Unvalidated inputs can allow unexpected values into critical contract logic.",
    attackScenario:
      "An attacker submits crafted parameters to manipulate calculations or state updates.",
    fixSuggestion:
      "Use assert checks and validate every external parameter before processing.",
  },

  "CAIRO-ARITH-001": {
    explanation:
      "Unsafe arithmetic can produce incorrect calculations or unexpected behavior.",
    attackScenario:
      "Manipulated numeric values trigger incorrect balances, limits, or calculations.",
    fixSuggestion:
      "Use safe arithmetic practices and check all numeric boundaries.",
  },
};

export function getSecurityAdvice(vulnerabilityId: string): SecurityAdvice | null {
  return securityKnowledgeBase[vulnerabilityId] ?? null;
}