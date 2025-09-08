import { ethers } from "./libs/ethers.min.js";
import { networkConfigs } from "./constants.js";

const connectBtn = document.querySelector("#connectBtn");
const chainList = document.querySelector("#chainList");
const walletList = document.querySelector("#walletList");
const walletBox = document.querySelector("#wallets");

const providers = [];

function createButton(config, onClick) {
  const button = document.createElement("button");
  button.innerHTML = `<img src="${config.icon}">${config.name}<span class="indicator" style="display: none"></span>`;
  button.onclick = onClick;
  return button;
}

async function selectWallet(name) {
  const selectedProvider = providers.find((p) => p.info.name === name);
  if (!selectedProvider) return;

  try {
    const [accounts, chainId] = await Promise.all([
      selectedProvider.provider.request({ method: "eth_requestAccounts" }),
      selectedProvider.provider.request({ method: "eth_chainId" }),
    ]);

    Object.assign(localStorage, {
      currentChainId: chainId,
      lastWallet: name,
      connected: "true",
    });

    shortAddress(accounts[0]);
    providerEvent(selectedProvider);
    updateNetworkStatus(chainId);
    updateSettings();
    renderWallets();
    connectBtn.classList.add("connected");
    console.log(`Connected to ${name} with account: ${accounts[0]}`);
  } catch (error) {
    console.error("Failed to connect:", error);
  }
}

function renderWallets() {
  walletBox.innerHTML = "";
  const connectedWallet = localStorage.getItem("lastWallet");

  providers.forEach((provider) => {
    const button = createButton(provider.info, () => {
      toggleWalletList();
      selectWallet(provider.info.name);
    });
    button.querySelector(".indicator").style.display =
      provider.info.name === connectedWallet ? "inline-block" : "none";
    walletBox.appendChild(button);
  });
}

function shortAddress(address) {
  connectBtn.innerHTML = `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
  getEns(address);
}

async function getEns(address) {
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

const toggleWalletList = () => walletList.classList.toggle("show");

const updateSettings = () => {
  document.querySelector("#getWallet").style.display = providers.length
    ? "none"
    : "block";
};

function renderChainList() {
  chainList.innerHTML = "";
  const currentChainId = localStorage.getItem("currentChainId");
  const isConnected = localStorage.getItem("connected") === "true";

  Object.entries(networkConfigs)
    .filter(([, config]) => config.showInUI)
    .forEach(([networkName, networkConfig]) => {
      const button = document.createElement("button");
      button.id = networkName;
      button.title = networkConfig.name;
      button.innerHTML = `<img src="${networkConfig.icon}" alt="${networkConfig.name}">`;
      button.onclick = () => switchNetwork(networkConfig);

      const indicator = document.createElement("span");
      indicator.className = "indicator";
      indicator.style.display =
        isConnected && networkConfig.chainIdHex === currentChainId
          ? "inline-block"
          : "none";
      button.appendChild(indicator);
      chainList.appendChild(button);
    });
}

async function switchNetwork(newNetwork) {
  const selectedProvider = providers.find(
    (p) => p.info.name === localStorage.getItem("lastWallet"),
  );
  try {
    await selectedProvider.provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: newNetwork.chainIdHex }],
    });
    localStorage.setItem("currentChainId", newNetwork.chainIdHex);
    renderChainList();
    updateNetworkStatus(newNetwork.chainIdHex);
  } catch (error) {
    console.error("Error switching network:", error);
  }
}

function updateNetworkStatus(chainId) {
  const network = Object.values(networkConfigs).find(
    (net) => net.chainId === parseInt(chainId) || net.chainIdHex === chainId,
  );

  if (network?.showInUI) {
    localStorage.setItem("currentChainId", chainId);
  } else {
    localStorage.removeItem("currentChainId");
  }
  renderChainList();
}

async function disconnect() {
  const lastWallet = localStorage.getItem("lastWallet");
  const selectedProvider = providers.find((p) => p.info.name === lastWallet);

  try {
    await selectedProvider?.provider.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch (error) {
    console.error("Error disconnecting:", error);
  }

  localStorage.clear();
  connectBtn.innerHTML = "Connect";
  [walletList, connectBtn].forEach((el) =>
    el.classList.remove("show", "connected"),
  );
  updateNetworkStatus(networkConfigs.ethereum.chainIdHex);
  updateSettings();
  renderWallets();
  renderChainList();
}

function providerEvent(provider) {
  provider.provider
    .on("accountsChanged", (accounts) =>
      accounts.length > 0 ? shortAddress(accounts[0]) : disconnect(),
    )
    .on("chainChanged", (chainId) => {
      console.log(`Chain changed to ${chainId} for ${provider.info.name}`);
      updateNetworkStatus(chainId);
      renderChainList();
    })
    .on("disconnect", () => {
      console.log(`Disconnected from ${provider.info.name}`);
      disconnect();
    });
}

window.addEventListener("eip6963:announceProvider", (event) => {
  const { detail: providerDetail } = event;
  const providerName = providerDetail.info.name;

  if (!providers.some((p) => p.info.name === providerName)) {
    providers.push(providerDetail);
    renderWallets();
    updateSettings();

    if (localStorage.getItem("connected")) {
      selectWallet(localStorage.getItem("lastWallet"));
    }
    console.log(`Discovered provider: ${providerName}`);
  }
});

window.addEventListener("load", async () => {
  const storedChainId =
    localStorage.getItem("currentChainId") ||
    networkConfigs.ethereum.chainIdHex;
  updateNetworkStatus(storedChainId);
  updateSettings();

  if (localStorage.getItem("connected")) {
    const selectedProvider = providers.find(
      (p) => p.info.name === localStorage.getItem("lastWallet"),
    );
    if (selectedProvider) providerEvent(selectedProvider);
  }
  renderChainList();
});

connectBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleWalletList();
});

document.addEventListener("click", () => walletList.classList.remove("show"));
walletList.addEventListener("click", (event) => event.stopPropagation());

window.dispatchEvent(new Event("eip6963:requestProvider"));
