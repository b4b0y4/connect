import { ethers } from "./ethers.min.js"
import { networkConfigs } from "./constants.js"

// DOM Elements
const networkBtn = document.getElementById("networkBtn")
const chevron = networkBtn.querySelector("span i")
const chainList = document.getElementById("chainList")
const connectBtn = document.getElementById("connectBtn")
const walletList = document.getElementById("walletList")
const walletBox = document.getElementById("wallets")
const whatsBtn = document.getElementById("whats")
const disconnectBtn = document.getElementById("disconnect")
const overlay = document.getElementById("overlay")
const networkIcon = document.getElementById("networkIcon")

const providers = []

// Helper functions
const toggleDisplay = (element, show) => {
  element.style.display = show ? "block" : "none"
}

const createButton = (config, onClick) => {
  const button = document.createElement("button")
  const img = document.createElement("img")
  img.src = config.icon
  button.appendChild(img)
  button.appendChild(document.createTextNode(config.name))

  const indicator = document.createElement("span")
  indicator.className = "indicator"
  indicator.style.display = "none"
  button.appendChild(indicator)

  button.onclick = onClick
  return button
}

/***************************************************
 *                CONNECTIVITY
 **************************************************/
async function selectWallet(name) {
  const selectedProvider = providers.find((p) => p.info.name === name)
  if (!selectedProvider) return

  try {
    const accounts = await selectedProvider.provider.request({
      method: "eth_requestAccounts",
    })
    const chainId = await selectedProvider.provider.request({
      method: "eth_chainId",
    })

    localStorage.setItem("currentChainId", chainId)
    localStorage.setItem("lastWallet", selectedProvider.info.name)
    localStorage.setItem("connected", "true")

    shortAddress(accounts[0])
    providerEvent(selectedProvider)
    updateNetworkButton(chainId)
    updateSettings()
    renderWallets()

    connectBtn.classList.add("connected")

    console.log(
      `Connected to ${selectedProvider.info.name} with account: ${accounts[0]}`
    )
  } catch (error) {
    console.error("Failed to connect:", error)
  }
}

function renderWallets() {
  walletBox.innerHTML = ""
  const connectedWallet = localStorage.getItem("lastWallet")

  providers.sort((a, b) => {
    if (a.info.name === connectedWallet) return -1
    if (b.info.name === connectedWallet) return 1
    return 0
  })

  providers.forEach((provider) => {
    const button = createButton(provider.info, () => {
      togglewalletList()
      selectWallet(provider.info.name)
    })
    const indicator = button.querySelector(".indicator")
    indicator.style.display =
      provider.info.name === connectedWallet ? "inline-block" : "none"

    walletBox.appendChild(button)
  })
}

function shortAddress(address) {
  connectBtn.innerHTML = `${address.substring(0, 5)}...${address.substring(
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
      connectBtn.innerHTML = ""
      const img = document.createElement("img")
      img.src = ensAvatar
      img.style.borderRadius = "50%"

      connectBtn.appendChild(img)
      connectBtn.appendChild(document.createTextNode(ensName))
    } else if (ensName) {
      connectBtn.innerHTML = ensName
    }
  } catch (error) {
    console.log("Error getting ENS name:", error)
  }
}

function togglewalletList() {
  walletList.classList.toggle("show")
  chainList.classList.remove("show")
  chevron.classList.remove("rotate")

  const connected = localStorage.getItem("connected")

  toggleDisplay(whatsBtn, connected ? false : true)
  toggleDisplay(disconnectBtn, connected ? true : false)
}

function updateSettings() {
  const hasProvider = providers.length > 0
  document.getElementById("settings").classList.toggle("nowallet", !hasProvider)
}

function renderChainList() {
  chainList.innerHTML = ""
  const currentChainId = localStorage.getItem("currentChainId")

  Object.entries(networkConfigs).forEach(([networkName, networkConfig]) => {
    if (networkConfig.showInUI) {
      const button = createButton(networkConfig, () =>
        switchNetwork(networkConfig)
      )
      button.id = networkName
      const indicator = button.querySelector(".indicator")
      indicator.style.display =
        networkConfig.chainIdHex === currentChainId ? "inline-block" : "none"

      chainList.appendChild(button)
    }
  })
}

async function switchNetwork(newNetwork) {
  chainList.classList.remove("show")
  chevron.classList.remove("rotate")
  const selectedProvider = providers.find(
    (provider) => provider.info.name === localStorage.getItem("lastWallet")
  )
  try {
    await selectedProvider.provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: newNetwork.chainIdHex }],
    })
    localStorage.setItem("currentChainId", newNetwork.chainIdHex)

    renderChainList()
    updateNetworkButton(newNetwork.chainIdHex)
  } catch (error) {
    console.error("Error switching network:", error)
  }
}

function updateNetworkButton(chainId) {
  const network = Object.values(networkConfigs).find(
    (net) => net.chainId === parseInt(chainId) || net.chainIdHex === chainId
  )
  if (network && network.showInUI) {
    networkIcon.src = network.icon
    toggleDisplay(overlay, false)
  } else {
    networkIcon.src = "./logo/wrong.png"
    toggleDisplay(overlay, true)
  }
  renderChainList()
}

function disconnect() {
  localStorage.removeItem("connected")
  localStorage.removeItem("currentChainId")
  localStorage.removeItem("lastWallet")
  connectBtn.innerHTML = "Connect Wallet"
  walletList.classList.remove("show")
  chainList.classList.remove("show")
  chevron.classList.remove("rotate")
  connectBtn.classList.remove("connected")
  toggleDisplay(overlay, false)
  toggleDisplay(walletBox, true)
  updateSettings()
  renderWallets()
  renderChainList()
}

function providerEvent(provider) {
  provider.provider.on("accountsChanged", async function (accounts) {
    if (accounts.length > 0) {
      shortAddress(accounts[0])
    } else {
      disconnect()
    }
  })
  provider.provider.on("chainChanged", (chainId) => {
    console.log(`Chain changed to ${chainId} for ${provider.info.name}`)
    updateNetworkButton(chainId)
    renderChainList()
    localStorage.setItem("currentChainId", chainId)
  })
  provider.provider.on("disconnect", () => {
    console.log(`Disconnected from ${provider.info.name}`)
    disconnect()
  })
}

/***************************************************
 *              DARK/LIGHT MODE TOGGLE
 **************************************************/
const root = document.documentElement
const themeToggle = document.querySelector(".theme input")
const themeLabel = document.querySelector(".theme")

function setDarkMode(isDarkMode) {
  root.classList.toggle("dark-mode", isDarkMode)
  themeToggle.checked = isDarkMode
  themeLabel.classList.toggle("dark", isDarkMode)
  localStorage.setItem("darkMode", JSON.stringify(isDarkMode))
}

function toggleDarkMode() {
  const isDarkMode = themeToggle.checked
  setDarkMode(isDarkMode)
}

/***************************************************
 *              EVENT LISTENERS
 **************************************************/
window.addEventListener("eip6963:announceProvider", (event) => {
  const providerDetail = event.detail
  providers.push(providerDetail)
  renderWallets()

  if (localStorage.getItem("connected"))
    selectWallet(localStorage.getItem("lastWallet"))

  console.log(`Discovered provider: ${providerDetail.info.name}`)
})

window.addEventListener("load", async () => {
  const storedChainId = localStorage.getItem("currentChainId")
  if (storedChainId) updateNetworkButton(storedChainId)
  updateSettings()
  const selectedProvider = providers.find(
    (provider) => provider.info.name === localStorage.getItem("lastWallet")
  )
  if (selectedProvider) providerEvent(selectedProvider)
  renderChainList()

  const savedDarkMode = JSON.parse(localStorage.getItem("darkMode"))
  setDarkMode(savedDarkMode === true)
  root.classList.remove("no-flash")
})

networkBtn.addEventListener("click", (event) => {
  event.stopPropagation()
  chainList.classList.toggle("show")
  chevron.classList.toggle("rotate")
  walletList.classList.remove("show")
})

connectBtn.addEventListener("click", (event) => {
  event.stopPropagation()
  togglewalletList()
})

document.addEventListener("click", () => {
  chainList.classList.remove("show")
  walletList.classList.remove("show")
  chevron.classList.remove("rotate")
})

chainList.addEventListener("click", (event) => event.stopPropagation())

walletList.addEventListener("click", (event) => event.stopPropagation())

disconnectBtn.addEventListener("click", disconnect)

themeToggle.addEventListener("change", toggleDarkMode)

window.dispatchEvent(new Event("eip6963:requestProvider"))
