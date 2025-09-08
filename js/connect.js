import { ethers } from "./libs/ethers.min.js";
import { networkConfigs } from "./constants.js";

const connectBtn = document.querySelector("#connect-btn");
const connectChainList = document.querySelector("#connect-chain-list");
const connectWalletList = document.querySelector("#connect-wallet-list");
const connectWallets = document.querySelector("#connect-wallets");

const connectProviders = [];

function createConnectButton(config, onClick) {
  const button = document.createElement("button");
  button.innerHTML = `<img src="${config.icon}">${config.name}<span class="connect-indicator" style="display: none"></span>`;
  button.onclick = onClick;
  return button;
}

async function selectConnectWallet(name) {
  const selectedProvider = connectProviders.find((p) => p.info.name === name);
  if (!selectedProvider) return;

  try {
    const [accounts, chainId] = await Promise.all([
      selectedProvider.provider.request({ method: "eth_requestAccounts" }),
      selectedProvider.provider.request({ method: "eth_chainId" }),
    ]);

    Object.assign(localStorage, {
      connectCurrentChainId: chainId,
      connectLastWallet: name,
      connectConnected: "true",
    });

    shortConnectAddress(accounts[0]);
    setupConnectProviderEvents(selectedProvider);
    updateConnectNetworkStatus(chainId);
    updateConnectSettings();
    renderConnectWalletProviders();
    connectBtn.classList.add("connected");
    console.log(`Connected to ${name} with account: ${accounts[0]}`);
  } catch (error) {
    console.error("Failed to connect:", error);
  }
}

function renderConnectWalletProviders() {
  connectWallets.innerHTML = "";
  const connectedWallet = localStorage.getItem("connectLastWallet");

  connectProviders.forEach((provider) => {
    const button = createConnectButton(provider.info, () => {
      toggleConnectWalletList();
      selectConnectWallet(provider.info.name);
    });
    button.querySelector(".connect-indicator").style.display =
      provider.info.name === connectedWallet ? "inline-block" : "none";
    connectWallets.appendChild(button);
  });
}

function shortConnectAddress(address) {
  connectBtn.innerHTML = `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
  getConnectEns(address);
}

async function getConnectEns(address) {
  try {
    const mainnetProvider = new ethers.JsonRpcProvider(
      networkConfigs.ethereum.rpcUrl,
    );
    const ensName = await mainnetProvider.lookupAddress(address);
    if (!ensName) return;

    const ensAvatar = await mainnetProvider.getAvatar(ensName);
    connectBtn.innerHTML = ensAvatar
      ? `<img src="${ensAvatar}" style="border-radius: 50%">${ensName}`
      : ensName;
  } catch (error) {
    console.log("Error getting ENS name:", error);
  }
}

const toggleConnectWalletList = () =>
  connectWalletList.classList.toggle("show");

const updateConnectSettings = () => {
  document.querySelector("#connect-get-wallet").style.display =
    connectProviders.length ? "none" : "block";
};

function renderConnectChainList() {
  connectChainList.innerHTML = "";
  const currentChainId = localStorage.getItem("connectCurrentChainId");
  const isConnected = localStorage.getItem("connectConnected") === "true";

  Object.entries(networkConfigs)
    .filter(([, config]) => config.showInUI)
    .forEach(([networkName, networkConfig]) => {
      const button = document.createElement("button");
      button.id = `connect-${networkName}`;
      button.title = networkConfig.name;
      button.innerHTML = `<img src="${networkConfig.icon}" alt="${networkConfig.name}">`;
      button.onclick = () => switchConnectNetwork(networkConfig);

      const indicator = document.createElement("span");
      indicator.className = "connect-indicator";
      indicator.style.display =
        isConnected && networkConfig.chainIdHex === currentChainId
          ? "inline-block"
          : "none";
      button.appendChild(indicator);
      connectChainList.appendChild(button);
    });
}

async function switchConnectNetwork(newNetwork) {
  const selectedProvider = connectProviders.find(
    (p) => p.info.name === localStorage.getItem("connectLastWallet"),
  );
  try {
    await selectedProvider.provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: newNetwork.chainIdHex }],
    });
    localStorage.setItem("connectCurrentChainId", newNetwork.chainIdHex);
    renderConnectChainList();
    updateConnectNetworkStatus(newNetwork.chainIdHex);
  } catch (error) {
    console.error("Error switching network:", error);
  }
}

function updateConnectNetworkStatus(chainId) {
  const network = Object.values(networkConfigs).find(
    (net) => net.chainId === parseInt(chainId) || net.chainIdHex === chainId,
  );

  if (network?.showInUI) {
    localStorage.setItem("connectCurrentChainId", chainId);
  } else {
    localStorage.removeItem("connectCurrentChainId");
  }
  renderConnectChainList();
}

async function disconnectConnect() {
  const lastWallet = localStorage.getItem("connectLastWallet");
  const selectedProvider = connectProviders.find(
    (p) => p.info.name === lastWallet,
  );

  try {
    await selectedProvider?.provider.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch (error) {
    console.error("Error disconnecting:", error);
  }

  ["connectCurrentChainId", "connectLastWallet", "connectConnected"].forEach(
    (key) => localStorage.removeItem(key),
  );
  connectBtn.innerHTML = "Connect";
  [connectWalletList, connectBtn].forEach((el) =>
    el.classList.remove("show", "connected"),
  );
  updateConnectNetworkStatus(networkConfigs.ethereum.chainIdHex);
  updateConnectSettings();
  renderConnectWalletProviders();
  renderConnectChainList();
}

function setupConnectProviderEvents(provider) {
  provider.provider
    .on("accountsChanged", (accounts) =>
      accounts.length > 0
        ? shortConnectAddress(accounts[0])
        : disconnectConnect(),
    )
    .on("chainChanged", (chainId) => {
      console.log(`Chain changed to ${chainId} for ${provider.info.name}`);
      updateConnectNetworkStatus(chainId);
      renderConnectChainList();
    })
    .on("disconnect", () => {
      console.log(`Disconnected from ${provider.info.name}`);
      disconnectConnect();
    });
}

window.addEventListener("eip6963:announceProvider", (event) => {
  const { detail: providerDetail } = event;
  const providerName = providerDetail.info.name;

  if (!connectProviders.some((p) => p.info.name === providerName)) {
    connectProviders.push(providerDetail);
    renderConnectWalletProviders();
    updateConnectSettings();

    if (localStorage.getItem("connectConnected")) {
      selectConnectWallet(localStorage.getItem("connectLastWallet"));
    }
    console.log(`Discovered provider: ${providerName}`);
  }
});

window.addEventListener("load", async () => {
  const storedChainId =
    localStorage.getItem("connectCurrentChainId") ||
    networkConfigs.ethereum.chainIdHex;
  updateConnectNetworkStatus(storedChainId);
  updateConnectSettings();

  if (localStorage.getItem("connectConnected")) {
    const selectedProvider = connectProviders.find(
      (p) => p.info.name === localStorage.getItem("connectLastWallet"),
    );
    if (selectedProvider) setupConnectProviderEvents(selectedProvider);
  }
  renderConnectChainList();
});

connectBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleConnectWalletList();
});

document.addEventListener("click", () =>
  connectWalletList.classList.remove("show"),
);
connectWalletList.addEventListener("click", (event) => event.stopPropagation());

window.dispatchEvent(new Event("eip6963:requestProvider"));
