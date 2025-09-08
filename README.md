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

### 1. Setup Files

Include the required files in your project:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="./assets/css/connect.css">
</head>
<body>
    <!-- Your HTML structure (see step 2) -->
    <script src="./js/your-script.js" type="module"></script>
</body>
</html>
```

### 2. HTML Structure

Add the connect widget HTML to your page:

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
```

### 3. Initialize in Your Script

```javascript
import { ConnectWallet } from "./js/connect.js";

// Create wallet instance
const wallet = new ConnectWallet();

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
    // Bind to DOM elements
    const elements = {
        connectBtn: document.querySelector("#connect-btn"),
        connectChainList: document.querySelector("#connect-chain-list"),
        connectWalletList: document.querySelector("#connect-wallet-list"),
        connectWallets: document.querySelector("#connect-wallets"),
    };

    wallet.setElements(elements);

    // Set up click handlers
    elements.connectBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        wallet.toggleWalletList();
    });

    elements.connectWalletList?.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    // Close wallet list when clicking outside
    document.addEventListener("click", () => {
        wallet.hideWalletList();
    });

    // Set up event listeners
    wallet.onConnect((data) => {
        console.log("Wallet connected:", data);
        // Handle connection success
    });

    wallet.onDisconnect(() => {
        console.log("Wallet disconnected");
        // Handle disconnection
    });

    wallet.onChainChange((chainId) => {
        console.log("Network changed:", chainId);
        // Handle network change
    });
});
```

## Sending ETH

### Basic ETH Transfer

```javascript
async function sendETH(toAddress, amount) {
    // Check if wallet is connected
    if (!wallet.isConnected()) {
        throw new Error('Please connect your wallet first');
    }

    const provider = wallet.getEthersProvider();
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount) // Convert ETH to wei
    });

    console.log('Transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    return receipt;
}

// Usage
sendETH('0x742d35Cc...', '0.1') // Send 0.1 ETH
    .then(receipt => console.log('Success!', receipt))
    .catch(error => console.error('Failed:', error));
```

### ETH Transfer with Gas Control

```javascript
async function sendETHWithGas(toAddress, amount, gasOptions = {}) {
    const provider = wallet.getEthersProvider();
    const signer = await provider.getSigner();

    // Get current gas prices
    const feeData = await provider.getFeeData();

    const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
        gasLimit: gasOptions.gasLimit || 21000,
        maxFeePerGas: gasOptions.maxFeePerGas || feeData.maxFeePerGas,
        maxPriorityFeePerGas: gasOptions.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas
    });

    return await tx.wait();
}

// Usage with custom gas
sendETHWithGas('0x742d35Cc...', '0.1', {
    gasLimit: 25000,
    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
});
```

## Contract Interactions

### Reading from Contracts

```javascript
async function readContract(contractAddress, abi, methodName, ...args) {
    const provider = wallet.getEthersProvider();
    const contract = new ethers.Contract(contractAddress, abi, provider);

    return await contract[methodName](...args);
}

// Example: ERC-20 token info
const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)"
];

async function getTokenInfo(tokenAddress) {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
        readContract(tokenAddress, ERC20_ABI, 'name'),
        readContract(tokenAddress, ERC20_ABI, 'symbol'),
        readContract(tokenAddress, ERC20_ABI, 'decimals'),
        readContract(tokenAddress, ERC20_ABI, 'totalSupply')
    ]);

    return { name, symbol, decimals, totalSupply };
}

// Get user's token balance
async function getTokenBalance(tokenAddress, userAddress) {
    const balance = await readContract(tokenAddress, ERC20_ABI, 'balanceOf', userAddress);
    const decimals = await readContract(tokenAddress, ERC20_ABI, 'decimals');

    return {
        raw: balance,
        formatted: ethers.formatUnits(balance, decimals)
    };
}
```

### Writing to Contracts

```javascript
async function writeContract(contractAddress, abi, methodName, args = [], options = {}) {
    const provider = wallet.getEthersProvider();
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const tx = await contract[methodName](...args, options);
    console.log('Transaction sent:', tx.hash);

    return await tx.wait();
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
transferTokens('0xA0b86a33...', '0x742d35Cc...', '100')
    .then(receipt => console.log('Transfer successful!', receipt))
    .catch(error => console.error('Transfer failed:', error));
```

### Approve and Transfer Pattern

```javascript
async function approveTokens(tokenAddress, spenderAddress, amount, decimals = 18) {
    const ERC20_ABI = [
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    return await writeContract(
        tokenAddress,
        ERC20_ABI,
        'approve',
        [spenderAddress, amountWei]
    );
}

async function approveAndTransfer(tokenAddress, spenderAddress, toAddress, amount) {
    try {
        // Step 1: Approve tokens
        console.log('Approving tokens...');
        await approveTokens(tokenAddress, spenderAddress, amount);

        // Step 2: Transfer tokens (this would be called by the spender contract)
        console.log('Transferring tokens...');
        await transferTokens(tokenAddress, toAddress, amount);

        console.log('Approve and transfer completed!');
    } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
    }
}
```

### Complex Contract Interactions

```javascript
// Example: Uniswap V3 token swap
async function swapTokensUniswap(swapRouterAddress, tokenIn, tokenOut, fee, amountIn, minAmountOut) {
    const SWAP_ROUTER_ABI = [
        `function exactInputSingle((
            address tokenIn,
            address tokenOut,
            uint24 fee,
            address recipient,
            uint256 deadline,
            uint256 amountIn,
            uint256 amountOutMinimum,
            uint160 sqrtPriceLimitX96
        )) external returns (uint256 amountOut)`
    ];

    const account = await wallet.getAccount();
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    const params = {
        tokenIn,
        tokenOut,
        fee, // 3000 for 0.3%, 500 for 0.05%
        recipient: account,
        deadline,
        amountIn,
        amountOutMinimum: minAmountOut,
        sqrtPriceLimitX96: 0 // No price limit
    };

    return await writeContract(
        swapRouterAddress,
        SWAP_ROUTER_ABI,
        'exactInputSingle',
        [params]
    );
}

// Multi-step DeFi interaction
async function swapWithApproval(tokenAddress, swapRouterAddress, amountIn, minAmountOut) {
    try {
        // Step 1: Approve router to spend tokens
        await approveTokens(tokenAddress, swapRouterAddress, amountIn);

        // Step 2: Perform swap
        await swapTokensUniswap(
            swapRouterAddress,
            tokenAddress,
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
            3000, // 0.3% fee
            ethers.parseUnits(amountIn, 18),
            ethers.parseUnits(minAmountOut, 18)
        );

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
    const signer = await provider.getSigner();

    const signature = await signer.signMessage(message);

    return signature;
}

// Usage
signMessage('Hello, Web3!')
    .then(signature => console.log('Signature:', signature))
    .catch(error => console.error('Signing failed:', error));
```

### Typed Data Signing (EIP-712)

```javascript
async function signTypedData(domain, types, value) {
    const provider = wallet.getEthersProvider();
    const signer = await provider.getSigner();

    return await signer.signTypedData(domain, types, value);
}

// Example: ERC-20 Permit signature
async function signPermit(tokenAddress, spender, value, nonce, deadline) {
    const domain = {
        name: 'USD Coin', // Token name
        version: '2',
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

    const message = {
        owner: await wallet.getAccount(),
        spender,
        value,
        nonce,
        deadline
    };

    return await signTypedData(domain, types, message);
}
```

## Utility Functions

### Get Account Balance

```javascript
async function getBalance(address = null) {
    const provider = wallet.getEthersProvider();
    const account = address || await wallet.getAccount();

    if (!account) throw new Error('No account available');

    const balance = await provider.getBalance(account);
    return {
        raw: balance,
        formatted: ethers.formatEther(balance)
    };
}
```

### Check Connection Status

```javascript
function checkConnection() {
    const isConnected = wallet.isConnected();
    const account = await wallet.getAccount();
    const chainId = await wallet.getChainId();

    return { isConnected, account, chainId };
}
```

### Error Handling

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

        // Handle common error codes
        if (error.code === 4001) {
            message = 'Transaction rejected by user';
        } else if (error.code === -32603) {
            message = 'Internal error';
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

## Advanced Configuration

### Custom Network Setup

```javascript
const customNetworks = {
    ethereum: {
        name: "Ethereum Mainnet",
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
    },
    arbitrum: {
        name: "Arbitrum One",
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        chainId: 42161,
        chainIdHex: "0xa4b1",
        icon: "./assets/img/arbitrum.png",
        showInUI: true,
    }
};

const wallet = new ConnectWallet({
    networkConfigs: customNetworks
});
```

### Event Handlers

```javascript
// Set up comprehensive event handling
wallet.onConnect((data) => {
    console.log('Wallet connected:', data);
    updateConnectedUI(data);
});

wallet.onDisconnect(() => {
    console.log('Wallet disconnected');
    resetUI();
});

wallet.onChainChange((chainId) => {
    console.log('Network changed to:', chainId);
    updateNetworkUI(chainId);
});

async function updateConnectedUI(data) {
    const account = data.accounts[0];
    const balance = await getBalance(account);

    document.getElementById('account').textContent =
        `${account.slice(0, 6)}...${account.slice(-4)}`;
    document.getElementById('balance').textContent =
        `${parseFloat(balance.formatted).toFixed(4)} ETH`;
}
```

## API Reference

### Constructor Options

```javascript
const wallet = new ConnectWallet({
    networkConfigs: customNetworks, // Custom network configuration
    storage: customStorage          // Custom storage implementation
});
```

### Core Methods

- `connectWallet(walletName)` - Connect to specific wallet
- `disconnect()` - Disconnect from current wallet
- `isConnected()` - Check connection status
- `switchNetwork(networkConfig)` - Switch networks

### Provider Methods

- `getProvider()` - Get raw provider instance
- `getEthersProvider()` - Get ethers.js wrapped provider
- `getAccount()` - Get current account address
- `getChainId()` - Get current chain ID

### UI Methods

- `setElements(elements)` - Bind to DOM elements
- `toggleWalletList()` - Show/hide wallet selection
- `hideWalletList()` - Hide wallet selection

### Event Methods

- `onConnect(callback)` - Connection event handler
- `onDisconnect(callback)` - Disconnection event handler
- `onChainChange(callback)` - Network change event handler

## Requirements

- Modern browser with ES6+ support
- EIP-6963 compatible wallet (MetaMask, Coinbase, etc.)
- HTTPS connection (required by most wallets)

## Dependencies

- **ethers.js** - Ethereum library for blockchain interactions
- EIP-6963 compatible wallets for automatic discovery

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## License

MIT License

## Contributing

Issues and pull requests welcome! Check out the [GitHub repository](https://github.com/b4b0y4/connect).
