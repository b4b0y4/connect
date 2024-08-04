import { ethers } from "./ethers.min.js"
import { networkConfigs } from "./constants.js"

// DOM Elements
const networkBtn = document.querySelector("#networkBtn")
const chevron = networkBtn.querySelector("span i")
const chainList = document.querySelector("#chainList")
const connectBtn = document.querySelector("#connectBtn")
const walletList = document.querySelector("#walletList")
const walletBox = document.querySelector("#wallets")
const whatsBtn = document.querySelector("#whats")
const disconnectBtn = document.querySelector("#disconnect")
const overlay = document.querySelector("#overlay")
const networkIcon = document.querySelector("#networkIcon")

const providers = []

// Helper functions
const toggleDisplay = (element, show) => {
  element.style.display = show ? "block" : "none"
}

function createButton(config, onClick) {
  const button = document.createElement("button")
  button.innerHTML = `
      <img src="${config.icon}">
      ${config.name}
      <span class="indicator" style="display: none"></span>
    `
  button.onclick = onClick
  return button
}

/***********************************************************
 *                     CONNECTIVITY
 **********************************************************/
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
    if (!ensName) return

    const ensAvatar = await mainnetProvider.getAvatar(ensName)

    connectBtn.innerHTML = ensAvatar
      ? `<img src="${ensAvatar}" style="border-radius: 50%">${ensName}`
      : ensName
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
  document.querySelector("#settings").classList.toggle("nowallet", !hasProvider)
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

let networkWarningShown = false

function updateNetworkButton(chainId) {
  const network = Object.values(networkConfigs).find(
    (net) => net.chainId === parseInt(chainId) || net.chainIdHex === chainId
  )
  if (network && network.showInUI) {
    networkIcon.src = network.icon
    toggleDisplay(overlay, false)
    localStorage.setItem("currentChainId", chainId)
    showNotification("")
    networkWarningShown = false
  } else {
    networkIcon.src = "./logo/warning.svg"
    toggleDisplay(overlay, true)
    localStorage.removeItem("currentChainId")
    if (!networkWarningShown) {
      showNotification("Switch Network!", "warning", true)
      networkWarningShown = true
    }
  }
  renderChainList()
}

function showNotification(message, type = "info", isPermanent = false) {
  const notificationBox = document.querySelector("#notificationBox")

  document.querySelectorAll("#notification").forEach((notification) => {
    notification.classList.remove("show")
    setTimeout(() => notificationBox.removeChild(notification), 500)
  })

  if (!message) return

  const notification = document.createElement("div")
  notification.id = "notification"
  notification.classList.add(type)
  notification.innerHTML = `<div class="notif-content">${message}</div>`

  notificationBox.prepend(notification)
  notification.offsetHeight
  notification.classList.add("show")

  if (!isPermanent) {
    setTimeout(() => {
      notification.classList.remove("show")
      setTimeout(() => {
        notificationBox.removeChild(notification)
      }, 500)
    }, 5000)
  }

  return notification
}

async function disconnect() {
  const lastWallet = localStorage.getItem("lastWallet")
  const selectedProvider = providers.find((p) => p.info.name === lastWallet)

  try {
    await selectedProvider?.provider.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }],
    })
  } catch (error) {
    console.error("Error disconnecting:", error)
  }

  localStorage.clear()
  connectBtn.innerHTML = "Connect Wallet"
  ;[(walletList, chainList, chevron, connectBtn)].forEach((el) => {
    el.classList.remove("show", "rotate", "connected")
  })
  toggleDisplay(overlay, false)
  updateSettings()
  renderWallets()
  renderChainList()
}

function providerEvent(provider) {
  provider.provider
    .on("accountsChanged", (accounts) =>
      accounts.length > 0 ? shortAddress(accounts[0]) : disconnect()
    )
    .on("chainChanged", (chainId) => {
      console.log(`Chain changed to ${chainId} for ${provider.info.name}`)
      updateNetworkButton(chainId)
      renderChainList()
    })
    .on("disconnect", () => {
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
}

function toggleDarkMode() {
  const isDarkMode = themeToggle.checked
  setDarkMode(isDarkMode)
  localStorage.setItem("darkMode", JSON.stringify(isDarkMode))
}

function getTheme() {
  let savedDarkMode = JSON.parse(localStorage.getItem("darkMode"))
  if (savedDarkMode === null) {
    savedDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
  }
  setDarkMode(savedDarkMode)
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

  getTheme()
  root.classList.remove("no-flash")
})

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    const savedDarkMode = JSON.parse(localStorage.getItem("darkMode"))
    if (savedDarkMode === null) {
      setDarkMode(event.matches)
    }
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
