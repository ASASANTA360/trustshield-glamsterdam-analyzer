const SUPPORTED_NETWORKS = ["ethereum", "base", "polygon", "arbitrum"] as const;

type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number];

type NetworkConfig = {
  name: SupportedNetwork;
  displayName: string;
  rpcUrl: string;
  envVar: string;
  explorerApiUrl: string;
  explorerApiKeyEnvVar: string;
};

const NETWORK_CONFIGS: Record<SupportedNetwork, NetworkConfig> = {
  ethereum: {
    name: "ethereum",
    displayName: "Ethereum",
    rpcUrl: "https://ethereum.publicnode.com",
    envVar: "ETH_RPC_URL",
    explorerApiUrl: "https://api.etherscan.io/api",
    explorerApiKeyEnvVar: "ETHERSCAN_API_KEY",
  },
  base: {
    name: "base",
    displayName: "Base",
    rpcUrl: "https://base.publicnode.com",
    envVar: "BASE_RPC_URL",
    explorerApiUrl: "https://api.basescan.org/api",
    explorerApiKeyEnvVar: "BASESCAN_API_KEY",
  },
  polygon: {
    name: "polygon",
    displayName: "Polygon",
    rpcUrl: "https://polygon-bor-rpc.publicnode.com",
    envVar: "POLYGON_RPC_URL",
    explorerApiUrl: "https://api.polygonscan.com/api",
    explorerApiKeyEnvVar: "POLYGONSCAN_API_KEY",
  },
  arbitrum: {
    name: "arbitrum",
    displayName: "Arbitrum",
    rpcUrl: "https://arbitrum-one-rpc.publicnode.com",
    envVar: "ARBITRUM_RPC_URL",
    explorerApiUrl: "https://api.arbiscan.io/api",
    explorerApiKeyEnvVar: "ARBISCAN_API_KEY",
  },
};

function isSupportedNetwork(network: string): network is SupportedNetwork {
  return (SUPPORTED_NETWORKS as readonly string[]).includes(network);
}

function getNetworkConfig(network: SupportedNetwork): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

function getSupportedNetworks(): readonly SupportedNetwork[] {
  return SUPPORTED_NETWORKS;
}

module.exports = {
  NETWORK_CONFIGS,
  SUPPORTED_NETWORKS,
  getNetworkConfig,
  getSupportedNetworks,
  isSupportedNetwork,
};
