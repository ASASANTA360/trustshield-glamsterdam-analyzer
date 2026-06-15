function analyzeGasImpact(bytecodeSize: number) {
  let riskLevel = "LOW";
  let score = 90;
  const warnings: string[] = [];

  if (bytecodeSize > 15000) {
    riskLevel = "HIGH";
    score = 50;
    warnings.push(
      "Large contract size may require additional Glamsterdam compatibility review."
    );
  } else if (bytecodeSize > 8000) {
    riskLevel = "MEDIUM";
    score = 70;
    warnings.push(
      "Moderate contract size could be affected by gas repricing changes."
    );
  }

  return {
    score,
    riskLevel,
    warnings,
  };
}

export = analyzeGasImpact;