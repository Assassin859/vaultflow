# VaultFlowLending Deployment Guide

## Prerequisites

1. **Node.js and npm** installed
2. **Hardhat** project setup complete
3. **Sepolia testnet ETH** in your wallet
4. **Private key** from your wallet (MetaMask, etc.)

## Environment Setup

Create a `.env` file in the project root with the following variables:

```bash
# Sepolia Testnet Configuration
PRIVATE_KEY=your_private_key_here
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Getting Required Values

1. **PRIVATE_KEY**: Export your private key from MetaMask or your wallet
2. **SEPOLIA_URL**: Get from Infura, Alchemy, or other RPC providers
3. **ETHERSCAN_API_KEY**: Get from [Etherscan](https://etherscan.io/apis) (optional, for contract verification)

## Installation

```bash
npm install
```

## Available Scripts

```bash
npm run test          # Run all tests
npm run compile       # Compile contracts
npm run deploy:local  # Test deployment on local network
npm run deploy:sepolia # Deploy to Sepolia testnet
npm run node          # Start local Hardhat node
npm run clean         # Clean build artifacts
```

## Compile Contracts

```bash
npx hardhat compile
```

## Deploy to Sepolia

### Test Deployment (Local Network)
First, test the deployment on your local Hardhat network:

```bash
npm run deploy:local
```

### Deploy to Sepolia
Once the local test passes, deploy to Sepolia:

```bash
npm run deploy:sepolia
```

Or use the direct command:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## What the Deployment Script Does

1. **Deploys MockPriceOracle** with realistic prices:
   - ETH: $2000
   - USDC: $1
   - DAI: $1

2. **Deploys VaultFlowLending** with the oracle address

3. **Deploys Mock Tokens**:
   - Mock USDC (6 decimals)
   - Mock DAI (18 decimals)

4. **Configures Assets** with proper parameters:
   - ETH: collateralFactor 80%, liquidationThreshold 85%
   - USDC: collateralFactor 90%, liquidationThreshold 95%
   - DAI: collateralFactor 90%, liquidationThreshold 95%

5. **Saves deployment addresses** to `deployments.json`

## Deployment Output

The script will output:
- Contract addresses
- Asset configurations
- Price oracle settings
- Deployment verification

## Post-Deployment

After successful deployment, you can:

1. **Verify contracts** on Etherscan (if API key provided)
2. **Test the protocol** using the deployed addresses
3. **Interact with the contracts** using the saved addresses in `deployments.json`

## Troubleshooting

### Common Issues

1. **Insufficient ETH**: Ensure you have enough Sepolia ETH for deployment
2. **Invalid Private Key**: Double-check your private key format
3. **RPC Issues**: Verify your Sepolia RPC URL is correct
4. **Gas Issues**: The script includes gas estimation, but you may need to adjust gas limits

### Error Messages

- `"Deployment failed"`: Check your environment variables and network connection
- `"Insufficient funds"`: Add more Sepolia ETH to your wallet
- `"Invalid address"`: Verify your private key and RPC URL

## Security Notes

- Never commit your `.env` file to version control
- Keep your private key secure
- Use testnet for development and testing only
- Consider using a dedicated deployment wallet

## Next Steps

After deployment:
1. Test all contract functions
2. Verify contracts on Etherscan
3. Set up monitoring and alerts
4. Prepare for mainnet deployment 