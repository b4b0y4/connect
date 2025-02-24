# Connectivity Component

A simple and customizable web3 connectivity component that allows users to connect their Ethereum wallets and switch between different networks.

## Features

- Connect multiple wallet providers (supports EIP-6963)
- Switch between different Ethereum networks
- Dark/Light mode toggle
- ENS name resolution and avatar display
- Network status notifications
- Responsive design

## Usage

1. Include the required files in your HTML:
```html
<link rel="stylesheet" href="./css/styles.css" />
<script src="./js/script.js" type="module"></script>
```

2. Add the component HTML structure to your page:
```html
<div class="box">
  <div class="wrapper">
    <!-- Network selector -->
    <div class="network">...</div>
    <!-- Wallet connectivity -->
    <div class="connectivity">...</div>
  </div>
</div>
```

3. Configure supported networks in `constants.js`

## Dependencies

- Font Awesome 6.5.2
- ethers.js
- EIP-6963 compatible wallet

## Requirements

- Modern web browser with JavaScript enabled
- Web3 wallet extension (e.g., MetaMask)

## License

MIT
