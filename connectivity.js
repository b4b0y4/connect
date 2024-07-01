import { ethers } from "./ethers.min.js"
import { networkConfigs } from "./constants.js"

const providers = []
const connectBtn = document.getElementById("connectBtn")
const connectedBtn = document.getElementById("connectedBtn")
const chainList = document.getElementById("chainList")
const chevron = document.getElementById("networkBtn").querySelector("span")
let selectedProvider = null

window.addEventListener("eip6963:announceProvider", (event) => {
  const providerDetail = event.detail
  providers.push(providerDetail)

  console.log(`Discovered provider: ${providerDetail.info.name}`)
  renderWallets()
})

window.dispatchEvent(new Event("eip6963:requestProvider"))

async function selectWallet(uuid) {
  selectedProvider = providers.find((provider) => provider.info.uuid === uuid)

  if (selectedProvider) {
    console.log(`Selected wallet: ${selectedProvider.info.name}`)

    try {
      await selectedProvider.provider.request({
        method: "eth_requestAccounts",
      })
      const accounts = await selectedProvider.provider.request({
        method: "eth_accounts",
      })
      window.ethereum = selectedProvider.provider
      const address = accounts[0]
      toggleModal()
      shortAddress(address)

      setupProviderEventListeners(selectedProvider)

      localStorage.setItem("lastUsedProviderUUID", selectedProvider.info.uuid)

      console.log(`Connected to ${selectedProvider.info.name}`)

      switchNetwork(networkConfigs.ethereum)
    } catch (error) {
      console.error("User rejected the request:", error)
    }
  } else {
    console.error("Wallet not found")
  }
}

function renderWallets() {
  const walletContainer = document.getElementById("wallets")
  walletContainer.innerHTML = ""

  providers.forEach((provider) => {
    const button = document.createElement("button")
    const img = document.createElement("img")
    img.src = provider.info.icon

    button.appendChild(img)
    button.appendChild(document.createTextNode(provider.info.name))

    button.onclick = () => selectWallet(provider.info.uuid)
    walletContainer.appendChild(button)
  })
}

function setupProviderEventListeners(provider) {
  provider.provider.on("accountsChanged", async function (accounts) {
    if (accounts.length > 0) {
      const address = accounts[0]
      shortAddress(address)
    } else {
      disconnect()
    }
  })

  provider.provider.on("chainChanged", (chainId) => {
    console.log(`Chain changed to ${chainId} for ${provider.info.name}`)
    updateNetworkButton(chainId)
    localStorage.setItem("currentChainId", chainId)
  })

  provider.provider.on("disconnect", (error) => {
    console.log(`Disconnected from ${provider.info.name}`)
    console.error(error)
    disconnect()
  })
}

function shortAddress(address) {
  connectBtn.style.display = "none"
  connectedBtn.style.display = "flex"
  connectedBtn.innerHTML = `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`
  getEns(address)
}

async function getEns(address) {
  try {
    const mainnetProvider = new ethers.JsonRpcProvider(
      networkConfigs.ethereum.rpcUrl
    )
    const ensName = await mainnetProvider.lookupAddress(address)
    const ensAvatar = await mainnetProvider.getAvatar(ensName)

    if (ensName && ensAvatar) {
      connectedBtn.innerHTML = ""
      const img = document.createElement("img")
      img.src = ensAvatar
      img.style.borderRadius = "50%"

      connectedBtn.appendChild(img)
      connectedBtn.appendChild(document.createTextNode(ensName))
    } else if (ensName) {
      connectedBtn.innerHTML = ensName
    }
  } catch (error) {
    console.log("Error getting ENS name:", error)
  }
}

function toggleModal() {
  const isVisible =
    document.getElementById("modalBox").style.visibility === "visible"

  const value = isVisible ? "hidden" : "visible"
  ;["modalBox", "overlay", "modal"].forEach(
    (el) => (document.getElementById(el).style.visibility = value)
  )
}

async function switchNetwork(newNetwork) {
  chainList.style.visibility = "hidden"
  chevron.style.transform = "rotate(0deg)"

  if (!selectedProvider) {
    console.log("No wallet selected. Prompting user to connect.")
    toggleModal()
    return
  }

  try {
    await selectedProvider.provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${newNetwork.chainId.toString(16)}` }],
    })
  } catch (error) {
    console.error("Error switching network:", error)
  }
}

function updateNetworkButton(chainId) {
  const network = Object.values(networkConfigs).find(
    (config) => config.chainId === parseInt(chainId, 16)
  )

  document.getElementById("network-icon").src = network
    ? network.icon
    : "./logo/wrong.png"
}

function disconnect() {
  connectBtn.style.display = "flex"
  connectedBtn.style.display = "none"
  connectBtn.innerHTML = "Connect Wallet"
  selectedProvider = null
  localStorage.removeItem("lastUsedProviderUUID")
}

connectBtn.addEventListener("click", toggleModal)

document.getElementById("overlay").addEventListener("click", toggleModal)

document.getElementById("networkBtn").addEventListener("click", () => {
  const isVisible = chainList.style.visibility === "visible"

  chainList.style.visibility = isVisible ? "hidden" : "visible"

  chevron.style.transform = isVisible ? "rotate(0deg)" : "rotate(180deg)"
})
;[
  "ethereum",
  "arbitrum",
  "optimism",
  "base",
  "zksync",
  "scroll",
  "zkevm",
].forEach((el) => {
  document.getElementById(el).addEventListener("click", () => {
    if (!selectedProvider) {
      console.log("No wallet connected. Please connect a wallet first.")
      toggleModal()
    } else {
      switchNetwork(networkConfigs[el])
    }
  })
})

function checkInitialConnectionStatus() {
  if (selectedProvider) {
    selectedProvider.provider
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          const address = accounts[0]
          shortAddress(address)
        }
      })
      .catch(console.error)
  }
}

window.addEventListener("load", async () => {
  const storedChainId = localStorage.getItem("currentChainId")
  if (storedChainId) updateNetworkButton(storedChainId)

  const lastUsedProviderUUID = localStorage.getItem("lastUsedProviderUUID")
  if (lastUsedProviderUUID) {
    selectedProvider = providers.find(
      (provider) => provider.info.uuid === lastUsedProviderUUID
    )
    if (selectedProvider) {
      setupProviderEventListeners(selectedProvider)
      checkInitialConnectionStatus()
    }
  }
})
