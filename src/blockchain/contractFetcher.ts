import { JsonRpcProvider } from "ethers";
import { getNetworkConfig } from "./networks.js";

declare const process: {
  env: { [key: string]: string | undefined };
};

const DEFAULT_TIMEOUT_MS = 10000;

type Network = "ethereum" | "base" | "polygon" | "arbitrum";

type FetchContractCodeOptions = {
  rpcUrl?: string;
  network?: Network;
  timeoutMs?: number;
  provider?: {
    getCode(address: string): Promise<string>;
    destroy?: () => void;
  };
};

function getRpcUrl(network: Network = "ethereum") {
  const config = getNetworkConfig(network);
  return process.env[config.envVar] || config.rpcUrl;
}

function getTimeoutMs() {
  const value = Number(process.env.RPC_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`RPC request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function fetchContractCode(address: string, options: FetchContractCodeOptions = {}) {
  const network = options.network ?? "ethereum";
  const rpcUrl = options.rpcUrl ?? getRpcUrl(network);
  const timeoutMs = options.timeoutMs ?? getTimeoutMs();
  const provider = options.provider ?? new JsonRpcProvider(rpcUrl);
  const shouldDestroyProvider = !options.provider;

  try {
    const code = await withTimeout<string>(provider.getCode(address), timeoutMs);

    if (code === "0x") {
      return {
        exists: false,
        message: "No contract found at this address",
        network,
      };
    }

    return {
      exists: true,
      address,
      network,
      bytecode: code,
      bytecodeSize: (code.length - 2) / 2,
      bytecodePreview: code.slice(0, 100) + "...",
    };
  } catch (err) {
    return {
      exists: false,
      message: "Failed to fetch contract data",
      network,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    if (shouldDestroyProvider && typeof provider.destroy === "function") {
      provider.destroy();
    }
  }
}

export { fetchContractCode };
