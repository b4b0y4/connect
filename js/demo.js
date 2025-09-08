import { ConnectWallet } from "./connect.js";

// Initialize the wallet connect instance
const wallet = new ConnectWallet();

document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    connectBtn: document.querySelector("#connect-btn"),
    connectChainList: document.querySelector("#connect-chain-list"),
    connectWalletList: document.querySelector("#connect-wallet-list"),
    connectWallets: document.querySelector("#connect-wallets"),
  };

  // Enforce existence of required elements
  if (!elements) {
    throw new Error("Missing required DOM elements");
  }

  wallet.setElements(elements);

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
  wallet.onConnect((data) => {
    const account = data.accounts[0];
    const shortAccount = `${account.slice(0, 6)}...${account.slice(-4)}`;
    NotificationSystem.show(`Connected to ${shortAccount}`, "success");
  });

  wallet.onDisconnect(() => {
    NotificationSystem.show("Wallet disconnected", "danger");
  });

  wallet.onChainChange((chainId) => {
    NotificationSystem.show(`Switched to network ${chainId}`, "info");
  });
});

// Export for global access if needed
window.walletConnect = wallet;
