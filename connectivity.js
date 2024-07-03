import { ethers } from "./ethers.min.js"
import { networkConfigs } from "./constants.js"

const networkBtn = document.getElementById("networkBtn")
const chevron = networkBtn.querySelector("span i")
const chainList = document.getElementById("chainList")
const connectBtn = document.getElementById("connectBtn")
const walletList = document.getElementById("walletList")

const providers = []

async function selectWallet(name) {
  const providerDetail = providers.find((p) => p.info.name === name)
  if (!providerDetail) return

  try {
    const accounts = await providerDetail.provider.request({
      method: "eth_requestAccounts",
    })
    localStorage.setItem("lastWallet", providerDetail.info.name)
    localStorage.setItem("connected", "true")

    shortAddress(accounts[0])
    providerEvent(providerDetail)

    const chainId = await providerDetail.provider.request({
      method: "eth_chainId",
    })
    updateNetworkButton(chainId)
    localStorage.setItem("currentChainId", chainId)

    // switchNetwork(networkConfigs.ethereum)

    console.log(
      `Connected to ${providerDetail.info.name} with account: ${accounts[0]}`
    )
  } catch (error) {
    console.error("Failed to connect:", error)
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

    button.onclick = () => {
      togglewalletList()
      selectWallet(provider.info.name)
    }
    walletContainer.appendChild(button)
  })
}

function shortAddress(address) {
  connectBtn.innerHTML = `${address.substring(0, 6)}...${address.substring(
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
  document.getElementById("wallets").style.display = connected
    ? "none"
    : "block"
  document.getElementById("walletConnect").style.display = connected
    ? "none"
    : "flex"
  document.getElementById("disconnect").style.display = connected
    ? "flex"
    : "none"
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

  document.getElementById("networkIcon").src = network
    ? network.icon
    : "./logo/wrong.png"
}

function disconnect() {
  connectBtn.innerHTML = "Connect Wallet"
  localStorage.removeItem("lastWallet")
  localStorage.removeItem("connected")
  localStorage.removeItem("currentChainId")
  walletList.classList.remove("show")
  chainList.classList.remove("show")
  chevron.classList.remove("rotate")
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
    localStorage.setItem("currentChainId", chainId)
  })

  provider.provider.on("disconnect", () => {
    console.log(`Disconnected from ${provider.info.name}`)
    disconnect()
  })
}

window.addEventListener("eip6963:announceProvider", (event) => {
  const providerDetail = event.detail
  providers.push(providerDetail)

  console.log(`Discovered provider: ${providerDetail.info.name}`)
  renderWallets()

  if (localStorage.getItem("connected") === "true") {
    selectWallet(localStorage.getItem("lastWallet"))
  }
})

window.dispatchEvent(new Event("eip6963:requestProvider"))

window.addEventListener("load", async () => {
  const storedChainId = localStorage.getItem("currentChainId")
  if (storedChainId) updateNetworkButton(storedChainId)

  const selectedProvider = providers.find(
    (provider) => provider.info.name === localStorage.getItem("lastWallet")
  )
  if (selectedProvider) providerEvent(selectedProvider)
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

chainList.addEventListener("click", (event) => {
  event.stopPropagation()
})

walletList.addEventListener("click", (event) => {
  event.stopPropagation()
})

document.getElementById("disconnect").addEventListener("click", disconnect)
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
    switchNetwork(networkConfigs[el])
  })
})

/***************************************************
 *              DARK/LIGHT MODE TOGGLE
 **************************************************/
const root = document.documentElement

function setDarkMode(isDarkMode) {
  root.classList.toggle("dark-mode", isDarkMode)

  document.querySelector(".fa-sun").style.display = isDarkMode
    ? "none"
    : "block"
  document.querySelector(".fa-moon").style.display = isDarkMode
    ? "block"
    : "none"
}

function toggleDarkMode() {
  const updateTheme = !root.classList.contains("dark-mode")
  localStorage.setItem("darkMode", updateTheme)
  setDarkMode(updateTheme)
}

document.getElementById("theme").addEventListener("click", toggleDarkMode)

setDarkMode(JSON.parse(localStorage.getItem("darkMode")))

root.classList.remove("no-flash")
