import { ConnectWallet } from "./connect.js";

// Initialize the wallet connect instance
const walletConnect = new ConnectWallet();

// Set up DOM elements once page loads
document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    connectBtn: document.querySelector("#connect-btn"),
    connectChainList: document.querySelector("#connect-chain-list"),
    connectWalletList: document.querySelector("#connect-wallet-list"),
    connectWallets: document.querySelector("#connect-wallets"),
  };

  walletConnect.setElements(elements);

  // Set up event listeners
  elements.connectBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    walletConnect.toggleWalletList();
  });

  elements.connectWalletList.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  // Close wallet list when clicking outside
  document.addEventListener("click", () => {
    walletConnect.hideWalletList();
  });

  // Set up callbacks for connection events
  walletConnect.onConnect((data) => {
    console.log("Connected:", data);
  });

  walletConnect.onDisconnect(() => {
    console.log("Disconnected");
  });

  walletConnect.onChainChange((chainId) => {
    console.log("Chain changed to:", chainId);
  });
});

// Export for global access if needed
window.walletConnect = walletConnect;
