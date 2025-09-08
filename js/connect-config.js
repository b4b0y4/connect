export const networkConfigs = {
  ethereum: {
    name: "Ethereum",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    chainId: 1,
    chainIdHex: "0x1",
    icon: "./assets/img/eth.png",
    showInUI: true,
  },
  arbitrum: {
    name: "Arbitrum",
    rpcUrl: "https://1rpc.io/arb",
    chainId: 42161,
    chainIdHex: "0xa4b1",
    icon: "./assets/img/arb.png",
    showInUI: true,
  },
  optimism: {
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    chainId: 10,
    chainIdHex: "0xa",
    icon: "./assets/img/op.png",
    showInUI: true,
  },
  base: {
    name: "Base",
    rpcUrl: "https://base-rpc.publicnode.com",
    chainId: 8453,
    chainIdHex: "0x2105",
    icon: "./assets/img/base.png",
    showInUI: true,
  },
  zksync: {
    name: "ZKsync",
    rpcUrl: "https://mainnet.era.zksync.io",
    chainId: 324,
    chainIdHex: "0x144",
    icon: "./assets/img/zksync.png",
    showInUI: false,
  },
  scroll: {
    name: "Scroll",
    rpcUrl: "https://rpc.scroll.io",
    chainId: 534352,
    chainIdHex: "0x82750",
    icon: "./assets/img/scroll.png",
    showInUI: false,
  },
  zkevm: {
    name: "zkEvm",
    rpcUrl: "https://zkevm-rpc.com",
    chainId: 1101,
    chainIdHex: "0x44d",
    icon: "./assets/img/zkevm.png",
    showInUI: false,
  },
  sepolia: {
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    icon: "./assets/img/sepolia.png",
    showInUI: false,
  },
};

export const chainLookup = {};

Object.values(networkConfigs).forEach((net) => {
  if (net.showInUI) {
    chainLookup[net.chainId] = { ...net };
    chainLookup[net.chainIdHex] = { ...net };
  }
});

// Utility function to get network name from any chain identifier
export function getNetworkName(chainIdentifier) {
  const net = chainLookup[chainIdentifier];
  return net ? net.name : chainIdentifier;
}

// Example usage:
console.log(chainLookup[1].name); // "Ethereum"
console.log(chainLookup["0xa"].name); // "Optimism"
console.log(getNetworkName(10)); // "Optimism"
console.log(getNetworkName("0x2105")); // "Base"
