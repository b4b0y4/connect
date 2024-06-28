import { ethers } from "./ethers.min.js"
import { networkConfigs } from "./constants.js"

const providers = []
const connectBtn = document.getElementById("connectBtn")
const connectedBtn = document.getElementById("connectedBtn")

window.addEventListener("eip6963:announceProvider", (event) => {
  const providerDetail = event.detail
  providers.push(providerDetail)

  console.log(`Discovered provider: ${providerDetail.info.name}`)
  renderWallets()
})

window.dispatchEvent(new Event("eip6963:requestProvider"))

window.addEventListener("load", async () => {
  const selectedProvider = providers.find((provider) => provider.info.uuid)
  try {
    const accounts = await selectedProvider.provider.request({
      method: "eth_accounts",
    })
    if (accounts.length > 0) {
      const address = accounts[0]
      shortAddress(address)
    } else {
      disconnect()
    }
  } catch (error) {
    console.log(error)
  }

  selectedProvider.provider.on("accountsChanged", async function (accounts) {
    if (accounts.length > 0) {
      const address = accounts[0]
      shortAddress(address)
    } else {
      connectBtn.innerHTML = "Connect Wallet"
    }
  })

  selectedProvider.provider.on("chainChanged", (chainId) => {
    console.log(`Chain changed to ${chainId} for ${selectedProvider.info.name}`)
    updateNetworkButton(chainId)
  })

  selectedProvider.provider.on("disconnect", (error) => {
    console.log(`Disconnected from ${selectedProvider.info.name}`)
    console.error(error)
    disconnect()
  })
})

async function selectWallet(uuid) {
  const selectedProvider = providers.find(
    (provider) => provider.info.uuid === uuid
  )

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

      localStorage.setItem("walletId", selectedProvider.info.uuid)

      console.log(`Connected to ${selectedProvider.info.name}`)
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

function disconnect() {
  connectBtn.style.display = "flex"
  connectedBtn.style.display = "none"
  connectBtn.innerHTML = "Connect Wallet"
}

connectBtn.addEventListener("click", toggleModal)

document.getElementById("overlay").addEventListener("click", toggleModal)

document.getElementById("networkBtn").addEventListener("click", () => {
  const chainList = document.getElementById("chainList")
  const isVisible = chainList.style.visibility === "visible"

  chainList.style.visibility = isVisible ? "hidden" : "visible"
})

async function switchNetwork(newNetwork) {
  const selectedProvider = providers.find((provider) => provider.info.uuid)
  chainList.style.visibility = "hidden"
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
  const networkIcon = document.getElementById("network-icon")
  const networkName = document.getElementById("network-name")

  if (network) {
    networkIcon.src = network.icon
    networkName.innerHTML = network.name
  } else {
    networkIcon.src = "./logo/wrong.png"
    networkName.innerHTML = "Wrong Network"
  }
}

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
