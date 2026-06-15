const SUPPORTED_NETWORKS = ["ethereum", "base", "polygon", "arbitrum"] as const;

export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number];

export type NetworkConfig = {
  name: SupportedNetwork;
  displayName: string;
  rpcUrl: string;
  envVar: string;
};

export const NETWORK_CONFIGS: Record<SupportedNetwork, NetworkConfig> = {
  ethereum: {
    name: "ethereum",
    displayName: "Ethereum",
    rpcUrl: "https://ethereum.publicnode.com",
    envVar: "ETH_RPC_URL",
  },
  base: {
    name: "base",
    displayName: "Base",
    rpcUrl: "https://base.publicnode.com",
    envVar: "BASE_RPC_URL",
  },
  polygon: {
    name: "polygon",
    displayName: "Polygon",
    rpcUrl: "https://polygon-bor-rpc.publicnode.com",
    envVar: "POLYGON_RPC_URL",
  },
  arbitrum: {
    name: "arbitrum",
    displayName: "Arbitrum",
    rpcUrl: "https://arbitrum-one-rpc.publicnode.com",
    envVar: "ARBITRUM_RPC_URL",
  },
};

export function isSupportedNetwork(network: string): network is SupportedNetwork {
  return (SUPPORTED_NETWORKS as readonly string[]).includes(network);
}

export function getNetworkConfig(network: SupportedNetwork): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

export function getSupportedNetworks(): readonly SupportedNetwork[] {
  return SUPPORTED_NETWORKS;
}