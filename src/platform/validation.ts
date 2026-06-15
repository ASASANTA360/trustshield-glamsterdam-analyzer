const { isSupportedNetwork } = require("../blockchain/networks");

function isValidContractAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateScanInput(input: unknown) {
  const candidate = input as { contractAddress?: unknown; network?: unknown };
  const contractAddress = typeof candidate.contractAddress === "string" ? candidate.contractAddress.trim() : "";
  const network = typeof candidate.network === "string" ? candidate.network.trim().toLowerCase() : "";

  if (!isValidContractAddress(contractAddress)) {
    return { ok: false as const, error: "A valid EVM contract address is required." };
  }

  if (!isSupportedNetwork(network)) {
    return { ok: false as const, error: "Network must be one of ethereum, base, polygon, or arbitrum." };
  }

  return { ok: true as const, value: { contractAddress, network } };
}

module.exports = { isValidContractAddress, validateScanInput };
