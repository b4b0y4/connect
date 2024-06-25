import {ethers} from "./ethers.min.js"

const networkConfigs = {
  ethereum: {
    name: "Ethereum",
    rpcUrl: "https://eth.drpc.org",
    chainId: 1,
    icon: "./logo/eth.svg",
  },
  arbitrum: {
    name: "Arbitrum",
    rpcUrl: "https://1rpc.io/arb",
    chainId: 42161,
    icon: "./logo/arb.svg",
  },
  optimism: {
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    chainId: 10,
    icon: "./logo/op.svg",
  },
  base: {
    name: "Base",
    rpcUrl: "https://base-rpc.publicnode.com",
    chainId: 8453,
    icon: "./logo/base.svg",
  },
  sepolia: {
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    chainId: 11155111,
    icon: "./logo/sepolia.svg",
  },
}

const modalBox = document.getElementById("modalBox")
const overlay = document.getElementById("overlay")
const modal = document.getElementById("modal")
const connectBtn = document.getElementById("connectBtn")

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

    providerDetail.provider.on("chainChanged", (chainId) => {
      updateNetworkButton(chainId)
    })
  })

  // Dispatch the request for providers
  window.dispatchEvent(new Event("eip6963:requestProvider"))

  // Check if there's a connected address in localStorage
  const connectedAddress = localStorage.getItem("connectedAddress")
  if (connectedAddress) {
    displayTruncatedAddress(connectedAddress)
    displayENSName(connectedAddress)
  }
}

// Function to select a specific wallet provider by UUID
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
      window.ethereum = selectedProvider.provider // Set the selected provider as the active provider
      const address = accounts[0]
      toggleModalVisibility()
      displayTruncatedAddress(address)
      displayENSName(address)

      localStorage.setItem("connectedAddress", address)

      console.log(`Connected to ${selectedProvider.info.name}`)
    } catch (error) {
      console.error("User rejected the request:", error)
    }
  } else {
    console.error("Wallet not found")
  }
}

// Function to render the list of discovered wallet providers
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

function displayTruncatedAddress(address) {
  if (!address) return
  const truncatedAddress = `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`
  connectBtn.innerHTML = truncatedAddress
}

async function displayENSName(address) {
  try {
    const mainnetProvider = new ethers.JsonRpcProvider(
      networkConfigs.ethereum.rpcUrl
    )

    const ensName = await mainnetProvider.lookupAddress(address)

    if (ensName) {
      connectBtn.innerHTML = ensName
    }
  } catch (error) {
    console.log("Error getting ENS name:", error)
  }
}

function toggleModalVisibility() {
  const isVisible = modalBox.style.visibility === "visible"

  modalBox.style.visibility = isVisible ? "hidden" : "visible"
  overlay.style.visibility = isVisible ? "hidden" : "visible"
  modal.style.visibility = isVisible ? "hidden" : "visible"
}

connectBtn.addEventListener("click", toggleModalVisibility)

overlay.addEventListener("click", toggleModalVisibility)

document.getElementById("network").addEventListener("click", () => {
  const dropdownMenu = document.getElementById("dropdownMenu")
  const isVisible = dropdownMenu.style.visibility === "visible"

  if (isVisible) {
    dropdownMenu.style.visibility = "hidden"
  } else {
    dropdownMenu.style.visibility = "visible"
  }
})

async function switchNetwork(currentNetwork) {
  dropdownMenu.style.visibility = "hidden"
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{chainId: `0x${currentNetwork.chainId.toString(16)}`}],
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
    networkIcon.src = ""
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
