import { ethers } from "./ethers.min.js"
import { networkConfigs } from "./constants.js"

const providers = []

// Function to initialize the wallet discovery
function onPageLoad() {
  // Listener for provider announcements
  window.addEventListener("eip6963:announceProvider", (event) => {
    const providerDetail = event.detail
    providers.push(providerDetail)

    // Display the wallet provider in the UI
    console.log(`Discovered provider: ${providerDetail.info.name}`)
    renderWallets()

    // Reconnect to the provider if it was previously selected
    const selectedUuid = localStorage.getItem("selectedWalletUuid")
    if (selectedUuid && providerDetail.info.uuid === selectedUuid) {
      selectWallet(selectedUuid)
    }

    providerDetail.provider.on("disconnect", () => {
      console.log(`Disconnected from ${providerDetail.info.name}`)
      disconnect()
    })

    providerDetail.provider.on("chainChanged", (chainId) => {
      console.log(`Chain changed to ${chainId} for ${providerDetail.info.name}`)
      updateNetworkButton(chainId)
    })
  })

  // Dispatch the request for providers
  window.dispatchEvent(new Event("eip6963:requestProvider"))

  // Check connected address in localStorage
  const connectedAddr = localStorage.getItem("connectedAddr")
  if (connectedAddr) {
    shortAddress(connectedAddr)
    getEns(connectedAddr)
  }
}

// Function to select a wallet provider by UUID
async function selectWallet(uuid) {
  const selectedProvider = providers.find(
    (provider) => provider.info.uuid === uuid
  )

  if (selectedProvider) {
    console.log(`Selected wallet: ${selectedProvider.info.name}`)

    try {
      // Request account access if needed
      const accounts = await selectedProvider.provider.request({
        method: "eth_requestAccounts",
      })
      window.ethereum = selectedProvider.provider // Set selected provider as the active provider
      const address = accounts[0]
      toggleModal()
      shortAddress(address)
      getEns(address)

      localStorage.setItem("connectedAddr", address)
      localStorage.setItem("selectedWalletUuid", uuid)

      console.log(`Connected to ${selectedProvider.info.name}`)
    } catch (error) {
      console.error("User rejected the request:", error)
    }
  } else {
    console.error("Wallet not found")
  }
}

// Function to render the list of wallet providers
function renderWallets() {
  const walletContainer = document.getElementById("wallets")
  walletContainer.innerHTML = ""

  providers.forEach((provider) => {
    const button = document.createElement("button")

    // Create an image element for the wallet icon
    const img = document.createElement("img")
    img.src = provider.info.icon
    img.alt = `${provider.info.name} icon`
    img.style.width = "24px"
    img.style.height = "24px"
    img.style.marginRight = "8px"

    // Add the icon and the name to the button
    button.appendChild(img)
    button.appendChild(document.createTextNode(provider.info.name))

    button.onclick = () => selectWallet(provider.info.uuid)
    walletContainer.appendChild(button)
  })
}

// Call the onPageLoad function when the page loads
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  onPageLoad()
} else {
  window.addEventListener("DOMContentLoaded", onPageLoad)
}

function shortAddress(address) {
  connectBtn.innerHTML = `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`
}

async function getEns(address) {
  try {
    const mainnetProvider = new ethers.JsonRpcProvider(
      networkConfigs.ethereum.rpcUrl
    )
    const ensName = await mainnetProvider.lookupAddress(address)

    if (ensName) connectBtn.innerHTML = ensName
  } catch (error) {
    console.log("Error getting ENS name:", error)
  }
}

function toggleModal() {
  const connectedAddr = localStorage.getItem("connectedAddr")
  const isVisible =
    document.getElementById("modalBox").style.visibility === "visible"

  document.getElementById("modalBox").style.visibility = isVisible
    ? "hidden"
    : "visible"

  document.getElementById("overlay").style.visibility = isVisible
    ? "hidden"
    : "visible"

  document.getElementById("modal").style.visibility = isVisible
    ? "hidden"
    : "visible"

  document.getElementById("wallets").style.display = connectedAddr
    ? "none"
    : "block"

  document.getElementById("walletConnect").style.display = connectedAddr
    ? "none"
    : "flex"

  document.getElementById("disconnectBtn").style.display = connectedAddr
    ? "block"
    : "none"
}

function disconnect() {
  localStorage.removeItem("connectedAddr")
  localStorage.removeItem("selectedWalletUuid")
  connectBtn.innerHTML = "Connect Wallet"
  document.getElementById("modalBox").style.visibility = "hidden"
  document.getElementById("overlay").style.visibility = "hidden"
  document.getElementById("modal").style.visibility = "hidden"
}

document.getElementById("connectBtn").addEventListener("click", toggleModal)

document.getElementById("disconnectBtn").addEventListener("click", disconnect)

document.getElementById("overlay").addEventListener("click", toggleModal)

document.getElementById("network").addEventListener("click", () => {
  const chainList = document.getElementById("chainList")
  const isVisible = chainList.style.visibility === "visible"

  if (isVisible) {
    chainList.style.visibility = "hidden"
  } else {
    chainList.style.visibility = "visible"
  }
})

async function switchNetwork(currentNetwork) {
  chainList.style.visibility = "hidden"
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${currentNetwork.chainId.toString(16)}` }],
    })
  } catch (error) {
    console.error("Error switching network:", error)
  }
}

function updateNetworkButton(chainId) {
  const network = Object.values(networkConfigs).find(
    (config) => config.chainId === parseInt(chainId, 16)
  )

  const networkIcon = document.getElementById("network-icon")
  const networkName = document.getElementById("network-name")

  if (network) {
    networkIcon.src = network.icon
    networkName.innerHTML = network.name
  } else {
    networkIcon.src = "./logo/eth.png"
    networkName.innerHTML = "Wrong Network"
  }
}

document.getElementById("ethereum").addEventListener("click", () => {
  switchNetwork(networkConfigs.ethereum)
})

document.getElementById("arbitrum").addEventListener("click", () => {
  switchNetwork(networkConfigs.arbitrum)
})

document.getElementById("optimism").addEventListener("click", () => {
  switchNetwork(networkConfigs.optimism)
})

document.getElementById("base").addEventListener("click", () => {
  switchNetwork(networkConfigs.base)
})
