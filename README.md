# ConnectWallet

A lightweight, framework-agnostic wallet connection library for Ethereum and EVM-compatible networks. Handles wallet discovery, connection state, network switching, and provides easy access to providers for transactions and contract interactions.

## Features

- 🔗 **EIP-6963 Wallet Discovery** - Automatically detects installed wallets
- 🌐 **Multi-Network Support** - Easy network switching with visual indicators
- 💾 **Persistent State** - Remembers connection across page reloads
- 🎨 **Framework Agnostic** - Works with any web framework or vanilla JS
- 📦 **Minimal Dependencies** - Only requires ethers.js
- 🔒 **Encapsulated State** - Clean API with internal state management
- 👤 **ENS Support** - Resolves ENS names and avatars
- 📱 **Responsive Design** - Mobile-friendly UI components

## Quick Start

### Full UI Integration

Use the complete UI with wallet selection and network switching:

```html
<div class="connect-wrapper">
    <div class="connect-widget">
        <button id="connect-btn" class="connect-btn">Connect</button>
        <div id="connect-wallet-list" class="connect-wallet-list">
            <div class="connect-chain-list" id="connect-chain-list"></div>
            <div id="connect-get-wallet" class="connect-get-wallet">
                <a href="https://ethereum.org/en/wallets/" target="_blank">Get a Wallet!</a>
            </div>
            <div id="connect-wallets" class="connect-wallets"></div>
        </div>
    </div>
</div>

<script type="module">
import { ConnectWallet } from "./connect.js";

// Initialize the wallet connect instance
const walletConnect = new ConnectWallet();

// Set up DOM elements once page loads
document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    connectBtn: document.querySelector("#connect-btn"),
    connectChainList: document.querySelector("#connect-chain-list"),
    connectWalletList: document.querySelector("#connect-wallet-list"),
    connectWallets: document.querySelector("#connect-wallets"),
  };

  walletConnect.setElements(elements);

  // Set up event listeners
  if (elements.connectBtn) {
    elements.connectBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      walletConnect.toggleWalletList();
    });
  }

  if (elements.connectWalletList) {
    elements.connectWalletList.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  // Close wallet list when clicking outside
  document.addEventListener("click", () => {
    walletConnect.hideWalletList();
  });

  // Set up callbacks for connection events
  walletConnect.onConnect((data) => {
    console.log("Connected:", data);
  });

  walletConnect.onDisconnect(() => {
    console.log("Disconnected");
  });

  walletConnect.onChainChange((chainId) => {
    console.log("Chain changed to:", chainId);
  });
});

// Export for global access if needed
window.walletConnect = walletConnect;
</script>
```

## Sending Transactions

### Simple ETH Transfer

```javascript
import { ConnectWallet } from './js/connectWallet.js';
import { ethers } from './js/libs/ethers.min.js';

const wallet = new ConnectWallet();

async function sendETH(toAddress, amount) {
    const provider = wallet.getEthersProvider();
    if (!provider) {
        throw new Error('Wallet not connected');
    }

    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount)
    });

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    return receipt;
}

// Usage
sendETH('0x742d35Cc...', '0.1') // Send 0.1 ETH
    .then(receipt => console.log('Success!', receipt))
    .catch(error => console.error('Failed:', error));
```

### Transaction with Custom Gas

```javascript
async function sendWithCustomGas(toAddress, amount) {
    const provider = wallet.getEthersProvider();
    const signer = await provider.getSigner();

    // Estimate gas first
    const gasEstimate = await signer.estimateGas({
        to: toAddress,
        value: ethers.parseEther(amount)
    });

    // Add 10% buffer to gas estimate
    const gasLimit = gasEstimate * 110n / 100n;

    const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
        gasLimit: gasLimit,
        maxFeePerGas: ethers.parseUnits('20', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
    });

    return tx;
}
```

## Contract Interactions

### Reading from Contracts

```javascript
async function readContract(contractAddress, abi, methodName, ...args) {
    const provider = wallet.getEthersProvider();
    if (!provider) {
        throw new Error('Wallet not connected');
    }

    const contract = new ethers.Contract(contractAddress, abi, provider);
    const result = await contract[methodName](...args);

    return result;
}

// Example: Get ERC-20 token balance
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

async function getTokenBalance(tokenAddress, userAddress) {
    const balance = await readContract(tokenAddress, ERC20_ABI, 'balanceOf', userAddress);
    const decimals = await readContract(tokenAddress, ERC20_ABI, 'decimals');
    const symbol = await readContract(tokenAddress, ERC20_ABI, 'symbol');

    const formattedBalance = ethers.formatUnits(balance, decimals);
    console.log(`Balance: ${formattedBalance} ${symbol}`);

    return { balance, decimals, symbol, formatted: formattedBalance };
}
```

### Writing to Contracts

```javascript
async function writeContract(contractAddress, abi, methodName, args = [], options = {}) {
    const provider = wallet.getEthersProvider();
    if (!provider) {
        throw new Error('Wallet not connected');
    }

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const tx = await contract[methodName](...args, options);
    console.log('Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    return receipt;
}

// Example: ERC-20 token transfer
async function transferTokens(tokenAddress, toAddress, amount, decimals = 18) {
    const ERC20_ABI = [
        "function transfer(address to, uint256 amount) returns (bool)"
    ];

    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    return await writeContract(
        tokenAddress,
        ERC20_ABI,
        'transfer',
        [toAddress, amountWei]
    );
}

// Usage
transferTokens('0xA0b86a33...', '0x742d35Cc...', '100', 18)
    .then(receipt => console.log('Transfer successful!', receipt))
    .catch(error => console.error('Transfer failed:', error));
```

### Contract with Complex Interactions

```javascript
// Example: Uniswap V2 token swap
async function swapTokens(routerAddress, tokenIn, tokenOut, amountIn, minAmountOut, deadline) {
    const UNISWAP_ROUTER_ABI = [
        "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
    ];

    const account = await wallet.getAccount();
    const path = [tokenIn, tokenOut];

    return await writeContract(
        routerAddress,
        UNISWAP_ROUTER_ABI,
        'swapExactTokensForTokens',
        [amountIn, minAmountOut, path, account, deadline]
    );
}

// Multi-step transaction example
async function approveAndSwap(tokenAddress, spenderAddress, amount) {
    const ERC20_ABI = [
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    try {
        // Step 1: Approve tokens
        console.log('Approving tokens...');
        await writeContract(tokenAddress, ERC20_ABI, 'approve', [spenderAddress, amount]);

        // Step 2: Perform swap
        console.log('Swapping tokens...');
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
        await swapTokens(spenderAddress, tokenAddress, '0x...', amount, 0, deadline);

        console.log('Swap completed successfully!');
    } catch (error) {
        console.error('Swap failed:', error);
        throw error;
    }
}
```

## Message Signing

### Simple Message Signing

```javascript
async function signMessage(message) {
    const provider = wallet.getEthersProvider();
    if (!provider) {
        throw new Error('Wallet not connected');
    }

    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);

    console.log('Message:', message);
    console.log('Signature:', signature);

    return signature;
}

// Usage
signMessage('Hello, Web3!')
    .then(sig => console.log('Signed:', sig))
    .catch(err => console.error('Signing failed:', err));
```

### Typed Data Signing (EIP-712)

```javascript
async function signTypedData(domain, types, value) {
    const provider = wallet.getEthersProvider();
    const signer = await provider.getSigner();

    const signature = await signer.signTypedData(domain, types, value);
    return signature;
}

// Example: Sign a permit message
async function signPermit(tokenAddress, spender, value, nonce, deadline) {
    const domain = {
        name: 'Token Name',
        version: '1',
        chainId: await wallet.getChainId(),
        verifyingContract: tokenAddress
    };

    const types = {
        Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
        ]
    };

    const value = {
        owner: await wallet.getAccount(),
        spender,
        value,
        nonce,
        deadline
    };

    return await signTypedData(domain, types, value);
}
```

## Advanced Usage

### Custom Network Configuration

```javascript
const customNetworks = {
    ethereum: {
        name: "Ethereum",
        rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY",
        chainId: 1,
        chainIdHex: "0x1",
        icon: "./assets/img/eth.png",
        showInUI: true,
    },
    polygon: {
        name: "Polygon",
        rpcUrl: "https://polygon-rpc.com",
        chainId: 137,
        chainIdHex: "0x89",
        icon: "./assets/img/polygon.png",
        showInUI: true,
    }
};

const wallet = new ConnectWallet({
    networkConfigs: customNetworks
});
```

### Event Handling

```javascript
const wallet = new ConnectWallet();

// Listen for connection events
wallet.onConnect((data) => {
    console.log('Wallet connected:', data.accounts[0]);
    console.log('Chain ID:', data.chainId);
    updateUI();
});

wallet.onDisconnect(() => {
    console.log('Wallet disconnected');
    resetUI();
});

wallet.onChainChange((chainId) => {
    console.log('Network changed to:', chainId);
    handleNetworkChange(chainId);
});

async function updateUI() {
    const account = await wallet.getAccount();
    const chainId = await wallet.getChainId();
    const balance = await wallet.getEthersProvider()?.getBalance(account);

    document.getElementById('account').textContent =
        `${account.slice(0, 6)}...${account.slice(-4)}`;
    document.getElementById('balance').textContent =
        `${ethers.formatEther(balance || 0)} ETH`;
}
```

### Error Handling Best Practices

```javascript
async function handleTransaction(transactionFunction) {
    try {
        if (!wallet.isConnected()) {
            throw new Error('Please connect your wallet first');
        }

        const result = await transactionFunction();
        return { success: true, result };

    } catch (error) {
        let message = 'Transaction failed';

        if (error.code === 4001) {
            message = 'Transaction rejected by user';
        } else if (error.code === -32603) {
            message = 'Internal error - check your wallet';
        } else if (error.reason) {
            message = error.reason;
        }

        console.error('Transaction error:', error);
        return { success: false, error: message };
    }
}

// Usage with error handling
const result = await handleTransaction(async () => {
    return await sendETH('0x...', '0.1');
});

if (result.success) {
    console.log('Transaction successful:', result.result);
} else {
    alert('Transaction failed: ' + result.error);
}
```

### Custom Storage Implementation

```javascript
// Use session storage instead of localStorage
const sessionStorage = {
    setItem: (key, value) => window.sessionStorage.setItem(key, value),
    getItem: (key) => window.sessionStorage.getItem(key),
    removeItem: (key) => window.sessionStorage.removeItem(key)
};

const wallet = new ConnectWallet({ storage: sessionStorage });

// Or implement your own storage (e.g., encrypted storage)
const customStorage = {
    setItem: (key, value) => {
        const encrypted = encrypt(value);
        localStorage.setItem(key, encrypted);
    },
    getItem: (key) => {
        const encrypted = localStorage.getItem(key);
        return encrypted ? decrypt(encrypted) : null;
    },
    removeItem: (key) => localStorage.removeItem(key)
};
```

## API Reference

### Constructor

```javascript
const wallet = new ConnectWallet({
    networkConfigs: customNetworks, // Optional: custom network configuration
    storage: customStorage          // Optional: custom storage implementation
});
```

### Connection Methods

- `connectWallet(walletName)` - Connect to a specific wallet
- `disconnect()` - Disconnect from current wallet
- `isConnected()` - Check connection status
- `switchNetwork(networkConfig)` - Switch to different network

### Provider Methods

- `getProvider()` - Get raw provider instance
- `getEthersProvider()` - Get ethers.js wrapped provider
- `getAccount()` - Get current account address
- `getChainId()` - Get current chain ID

### UI Methods

- `setElements(elements)` - Bind to DOM elements
- `toggleWalletList()` - Show/hide wallet selection
- `hideWalletList()` - Hide wallet selection

### Event Handlers

- `onConnect(callback)` - Called when wallet connects
- `onDisconnect(callback)` - Called when wallet disconnects
- `onChainChange(callback)` - Called when network changes

## Requirements

- Modern browser with ES6+ support
- Web3 wallet extension (MetaMask, WalletConnect, etc.)
- HTTPS (required by most wallets)

## Dependencies

- **ethers.js** - For blockchain interactions
- **EIP-6963** compatible wallets for automatic discovery

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## License

MIT License - feel free to use in your projects!

## Contributing

Issues and pull requests welcome! Check out the [GitHub repository](https://github.com/b4b0y4/connect) for more details.
