import { ethers } from "./ethers.min.js"

const networkConfigs = {
  ethereum: {
    name: "Ethereum",
    rpcUrl: "https://eth.drpc.org",
    chainId: 1,
  },
  sepolia: {
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    chainId: 11155111,
  },
}

document.getElementById("openModalBtn").addEventListener("click", () => {
  fetch("modal.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("modalContainer").innerHTML = data
      document.getElementById("modalContainer").style.display = "flex"

      document
        .getElementById("disconnectBtn")
        .addEventListener("click", disconnectWallet)

      document.querySelector(".modal-overlay").addEventListener("click", () => {
        document.getElementById("modalContainer").style.display = "none"
      })

      const connectMetamask = document.getElementById("connectMetamask")
      const currentNetwork = networkConfigs.sepolia
      let connected = false

      connectMetamask.addEventListener("click", connectWallet)

      async function connectWallet() {
        if (!connected) {
          connected = true
          try {
            await ethereum.request({ method: "eth_requestAccounts" })
            const accounts = await ethereum.request({ method: "eth_accounts" })
            if (accounts.length > 0) {
              const address = accounts[0]
              getShortAddr(address)
              getENS(address)
              document.getElementById("modalContainer").style.display = "none"
            }
          } catch (error) {
            console.log(error)
          }
        }
      }

      function getShortAddr(address) {
        if (!address) return
        const truncatedAddress = `${address.substring(
          0,
          6
        )}...${address.substring(address.length - 4)}`
        document.getElementById("openModalBtn").innerHTML = truncatedAddress
      }

      async function getENS(account) {
        try {
          const mainnetProvider = new ethers.JsonRpcProvider(
            networkConfigs.ethereum.rpcUrl
          )
          const ensName = await mainnetProvider.lookupAddress(account)

          if (ensName) {
            document.getElementById("openModalBtn").innerHTML = ensName
          }
        } catch (error) {
          console.log("Error getting ENS name:", error)
        }
      }

      function disconnectWallet() {
        connected = false

        document.getElementById("openModalBtn").innerHTML = "Connect"
        document.getElementById("modalContainer").style.display = "none"
        console.log("Wallet disconnected")
      }

      async function switchNetwork() {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${currentNetwork.chainId.toString(16)}` }],
          })
        } catch (error) {
          console.error("Error switching network:", error)
        }
      }

      window.addEventListener("load", async () => {
        try {
          const accounts = await ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            const address = accounts[0]
            getShortAddr(address)
            getENS(address)
          }
        } catch (error) {
          console.log(error)
        }
      })

      ethereum.on("accountsChanged", async function (accounts) {
        if (accounts.length > 0) {
          const address = accounts[0]
          getShortAddr(address)
          getENS(address)
        }
      })
    })
})
