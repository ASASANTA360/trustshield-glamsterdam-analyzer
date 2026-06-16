export interface CairoSecurityReport {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  issues: string[];
  recommendations: string[];
}

export function analyzeCairoContract(
  sourceCode: string
): CairoSecurityReport {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Access control checks
  if (
    sourceCode.includes("external") &&
    !sourceCode.includes("only_owner")
  ) {
    issues.push(
      "External function detected without obvious ownership protection."
    );

    recommendations.push(
      "Review access control and ensure privileged functions are properly protected."
    );
  }

  // Storage checks
  if (
    sourceCode.includes("storage_write")
  ) {
    issues.push(
      "Storage modification detected. Verify state transition safety."
    );

    recommendations.push(
      "Validate storage updates and apply secure state management practices."
    );
  }

  // Contract interaction checks
  if (
    sourceCode.includes("call_contract")
  ) {
    issues.push(
      "External contract interaction detected."
    );

    recommendations.push(
      "Review external calls and validate assumptions about dependent contracts."
    );
  }

  const riskScore =
    Math.max(0, 100 - issues.length * 25);

  let riskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  if (riskScore >= 80) {
    riskLevel = "LOW";
  } else if (riskScore >= 50) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "HIGH";
  }

  return {
    riskScore,
    riskLevel,
    issues,
    recommendations,
  };
}