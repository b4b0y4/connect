import { ethers } from "./ethers.min.js"
import { networkConfigs } from "./constants.js"

const providers = []
const connectBtn = document.getElementById("connectBtn")

window.addEventListener("eip6963:announceProvider", (event) => {
  const providerDetail = event.detail
  providers.push(providerDetail)

  console.log(`Discovered provider: ${providerDetail.info.name}`)
  renderWallets()
})

window.addEventListener("load", async () => {
  const selectedProvider = providers.find((provider) => provider.info.uuid)
  try {
    const accounts = await selectedProvider.provider.request({
      method: "eth_accounts",
    })
    if (accounts.length > 0) {
      const address = accounts[0]
      shortAddress(address)
      getEns(address)
    }
  } catch (error) {
    console.log(error)
  }

  selectedProvider.provider.on("accountsChanged", async function (accounts) {
    if (accounts.length > 0) {
      const address = accounts[0]
      shortAddress(address)
      getEns(address)
    } else {
      connectBtn.innerHTML = "Connect"
    }
  })

  selectedProvider.provider.on("chainChanged", (chainId) => {
    console.log(`Chain changed to ${chainId} for ${selectedProvider.info.name}`)
    updateNetworkButton(chainId)
  })
})

window.dispatchEvent(new Event("eip6963:requestProvider"))

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
      getEns(address)

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
    img.alt = `${provider.info.name} icon`
    img.style.width = "24px"
    img.style.height = "24px"
    img.style.marginRight = "8px"

    button.appendChild(img)
    button.appendChild(document.createTextNode(provider.info.name))

    button.onclick = () => selectWallet(provider.info.uuid)
    walletContainer.appendChild(button)
  })
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
  connectBtn.innerHTML = "Connect Wallet"
  document.getElementById("modalBox").style.visibility = "hidden"
  document.getElementById("overlay").style.visibility = "hidden"
  document.getElementById("modal").style.visibility = "hidden"
}

connectBtn.addEventListener("click", toggleModal)

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

async function switchNetwork(newNetwork, uuid) {
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

document.getElementById("zksync").addEventListener("click", () => {
  switchNetwork(networkConfigs.zksync)
})

document.getElementById("scroll").addEventListener("click", () => {
  switchNetwork(networkConfigs.scroll)
})

document.getElementById("zkevm").addEventListener("click", () => {
  switchNetwork(networkConfigs.zkevm)
})

// import { ethers } from "./ethers-5.6.esm.min.js"
// import { networkConfigs } from "./constants.js"

// const connectBtn = document.getElementById("connectBtn")
// const modal = document.getElementById("warningModal")
// const modalButton = document.getElementById("modalButton")

// connectBtn.onclick = initiateConnectAttempt
// modalButton.onclick = switchNetwork

// // Change as needed
// const currentNetwork = networkConfigs.sepolia

// let initialConnectAttempted = false

// async function initiateConnectAttempt() {
//   if (!initialConnectAttempted) {
//     initialConnectAttempted = true
//     try {
//       await ethereum.request({ method: "eth_requestAccounts" })
//       await checkNetwork()
//       const accounts = await ethereum.request({ method: "eth_accounts" })
//       if (accounts.length > 0) {
//         const address = accounts[0]
//         displayTruncatedAddress(address)
//         displayENSName(address)
//         connectBtn.onclick = null
//       } else {
//         connectBtn.innerHTML = "Connect"
//       }
//     } catch (error) {
//       console.log(error)
//     }
//   } else {
//     connectBtn.innerHTML = "Install a Wallet"
//     setTimeout(() => {
//       connectBtn.innerHTML = "Connect"
//     }, 3000)
//   }
// }

// async function checkNetwork() {
//   const chainId = await ethereum.request({ method: "eth_chainId" })
//   if (chainId !== `0x${currentNetwork.chainId.toString(16)}`) {
//     showModal()
//   } else {
//     modal.style.display = "none"
//   }
// }

// function displayTruncatedAddress(address) {
//   if (!address) return
//   const truncatedAddress = `${address.substring(0, 6)}...${address.substring(
//     address.length - 4
//   )}`
//   connectBtn.innerHTML = truncatedAddress
// }

// async function displayENSName(account) {
//   try {
//     const mainnetProvider = new ethers.providers.JsonRpcProvider(
//       networkConfigs.ethereum.rpcUrl
//     )

//     const ensName = await mainnetProvider.lookupAddress(account)

//     if (ensName) {
//       connectBtn.innerHTML = ensName
//     }
//   } catch (error) {
//     console.log("Error getting ENS name:", error)
//   }
// }

// function showModal() {
//   modal.style.display = "block"
// }

// async function switchNetwork() {
//   try {
//     await ethereum.request({
//       method: "wallet_switchEthereumChain",
//       params: [{ chainId: `0x${currentNetwork.chainId.toString(16)}` }],
//     })
//   } catch (error) {
//     console.error("Error switching network:", error)
//   }
// }

// // Event listener for changes in wallet accounts
// ethereum.on("accountsChanged", async function (accounts) {
//   if (accounts.length > 0) {
//     const address = accounts[0]
//     displayTruncatedAddress(address)
//     displayENSName(address)
//   } else {
//     connectBtn.innerHTML = "Connect"
//   }
// })
// // Event listener for changes in wallet network
// ethereum.on("chainChanged", async function (chainId) {
//   if (chainId !== `0x${currentNetwork.chainId.toString(16)}`) {
//     showModal()
//   } else {
//     modal.style.display = "none"
//   }
// })

// // Event listener to connect on page load if already connected
// window.addEventListener("load", async () => {
//   try {
//     const accounts = await ethereum.request({ method: "eth_accounts" })
//     if (accounts.length > 0) {
//       const address = accounts[0]
//       displayTruncatedAddress(address)
//       displayENSName(address)
//     }
//   } catch (error) {
//     console.log(error)
//   }
// })
