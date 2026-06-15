const { JsonRpcProvider } = require("ethers");

const RPC_URL = "https://ethereum.publicnode.com";

const provider = new JsonRpcProvider(RPC_URL);

async function fetchContractCode(address: string) {
  try {
    const code = await provider.getCode(address);

    if (code === "0x") {
      return {
        exists: false,
        message: "No contract found at this address",
      };
    }

    return {
      exists: true,
      address: address,
      bytecode: code,
      bytecodeSize: (code.length - 2) / 2,
      bytecodePreview: code.slice(0, 100) + "...",
    };
  } catch (err) {
    return {
      exists: false,
      message: "Failed to fetch contract data",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

module.exports = { fetchContractCode };