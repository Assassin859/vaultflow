# DeFi Lending Protocol on Oasis Sapphire Network

A production-ready DeFi lending and borrowing protocol built on the Oasis Sapphire Network with privacy features and confidential computing capabilities.

## 🌟 Features

### Core Functionality
- **Multi-Asset Support**: Deposit and borrow ETH, USDC, DAI, and other ERC20 tokens
- **Interest-Bearing Tokens**: Receive aTokens that automatically accrue interest
- **Dynamic Interest Rates**: Rates adjust based on utilization and market conditions
- **Collateral Management**: Multi-collateral support with configurable LTV ratios
- **Liquidation Engine**: Automated liquidation of unhealthy positions
- **Flash Loans**: Execute flash loans for arbitrage and other DeFi strategies

### Privacy Features (Sapphire-Specific)
- **Confidential Balances**: User balances are encrypted and private
- **Hidden Collateral Ratios**: Collateral ratios are not publicly visible
- **MEV Protection**: Transactions are protected from front-running
- **Private Health Factors**: Health factors are calculated confidentially
- **Confidential Liquidations**: Liquidation processes maintain privacy

### Security Features
- **Upgradeable Contracts**: UUPS proxy pattern for future upgrades
- **Access Control**: Role-based permissions for admin functions
- **Pause Mechanism**: Emergency pause functionality
- **Reentrancy Protection**: Secure against reentrancy attacks
- **Oracle Integration**: Chainlink price feeds with fallback mechanisms

## 🏗️ Architecture

```
defi-sapphire-lending/
├── contracts/
│   ├── core/
│   │   └── LendingPool.sol          # Main lending pool contract
│   ├── interfaces/
│   │   ├── ILendingPool.sol         # Lending pool interface
│   │   ├── IPriceOracle.sol         # Price oracle interface
│   │   └── IInterestRateModel.sol   # Interest rate model interface
│   ├── libraries/
│   │   ├── DataTypes.sol            # Data structures
│   │   └── Math.sol                 # Mathematical operations
│   ├── oracles/
│   │   └── ChainlinkPriceOracle.sol # Price oracle implementation
│   └── tokens/
│       └── aToken.sol               # Interest-bearing token
├── scripts/
│   └── deploy.js                    # Deployment script
├── test/                            # Test files
├── hardhat.config.ts               # Hardhat configuration
└── package.json                    # Dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hardhat
- Sapphire testnet ETH

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd defi-sapphire-lending
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```bash
   PRIVATE_KEY=your_private_key_here
   SAPPHIRE_API_KEY=your_sapphire_api_key_here
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

### Deployment

#### Local Development
```bash
npm run deploy:local
```

#### Sapphire Testnet
```bash
npm run deploy:sapphire-testnet
```

#### Sapphire Mainnet
```bash
npm run deploy:sapphire-mainnet
```

## 📖 Usage

### Basic Operations

#### 1. Deposit Assets
```javascript
// Deposit USDC
await lendingPool.deposit(
    usdcAddress,
    ethers.parseUnits("1000", 6), // 1000 USDC
    userAddress,
    0 // referral code
);
```

#### 2. Borrow Assets
```javascript
// Borrow DAI against USDC collateral
await lendingPool.borrow(
    daiAddress,
    ethers.parseEther("500"), // 500 DAI
    2, // variable rate mode
    0, // referral code
    userAddress
);
```

#### 3. Repay Debt
```javascript
// Repay borrowed DAI
await lendingPool.repay(
    daiAddress,
    ethers.parseEther("100"), // 100 DAI
    2, // variable rate mode
    userAddress
);
```

#### 4. Withdraw Assets
```javascript
// Withdraw USDC
await lendingPool.withdraw(
    usdcAddress,
    ethers.parseUnits("500", 6), // 500 USDC
    userAddress
);
```

### Advanced Operations

#### Flash Loans
```javascript
// Execute flash loan
await lendingPool.flashLoan(
    receiverAddress,
    [usdcAddress],
    [ethers.parseUnits("10000", 6)],
    [0], // no debt mode
    userAddress,
    "0x", // params
    0 // referral code
);
```

#### Liquidation
```javascript
// Liquidate unhealthy position
await lendingPool.liquidationCall(
    collateralAsset,
    debtAsset,
    userAddress,
    debtToCover,
    false // receive aToken
);
```

## 🔧 Configuration

### Reserve Parameters

Each reserve can be configured with the following parameters:

- **Collateral Factor**: Maximum percentage of collateral value that can be borrowed (e.g., 80%)
- **Liquidation Threshold**: Health factor threshold for liquidation (e.g., 85%)
- **Borrow Factor**: Maximum percentage of available liquidity that can be borrowed
- **Interest Rate Parameters**: Base rate, kink rate, and multiplier for dynamic rates

### Oracle Configuration

- **Heartbeat**: Maximum time between price updates
- **Deviation Threshold**: Maximum allowed price deviation
- **Staleness Threshold**: Maximum age of price data
- **Price Confidence**: Confidence interval for price accuracy

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run coverage
```

### Gas Optimization
```bash
npm run gas-report
```

## 🔒 Security

### Audit Status
- [ ] External audit pending
- [ ] Internal review completed
- [ ] Bug bounty program planned

### Security Features
- Reentrancy protection on all external calls
- Access control with role-based permissions
- Emergency pause functionality
- Oracle manipulation protection
- Flash loan attack prevention

### Best Practices
- Use latest OpenZeppelin contracts
- Follow Solidity security guidelines
- Implement proper access controls
- Use safe math operations
- Validate all inputs

## 📊 Monitoring

### Key Metrics
- Total Value Locked (TVL)
- Utilization rates
- Interest rates
- Liquidation events
- Flash loan volume

### Health Checks
- Reserve health factors
- Oracle price staleness
- Protocol solvency
- Gas usage optimization

## 🚨 Emergency Procedures

### Pause Protocol
```javascript
// Pause all operations
await lendingPool.pause();
```

### Emergency Withdraw
```javascript
// Emergency withdraw (admin only)
await lendingPool.emergencyWithdraw(asset, amount, to);
```

### Oracle Fallback
```javascript
// Switch to fallback oracle
await priceOracle.setFallbackOracle(fallbackOracleAddress);
```

## 🔄 Upgrades

### Upgrade Process
1. Deploy new implementation
2. Verify implementation
3. Upgrade proxy
4. Verify upgrade

```javascript
// Upgrade LendingPool
await upgrades.upgradeProxy(lendingPoolAddress, newLendingPoolImpl);
```

## 📈 Analytics

### Integration
- The Graph for indexing
- Dune Analytics for dashboards
- Custom analytics dashboard

### Key Queries
- User deposit/withdrawal patterns
- Borrowing trends
- Liquidation analysis
- Interest rate evolution

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Standards
- Follow Solidity style guide
- Add comprehensive tests
- Update documentation
- Include gas optimization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Technical Documentation](./docs/)
- [API Reference](./docs/api.md)
- [Integration Guide](./docs/integration.md)

### Community
- [Discord](https://discord.gg/your-discord)
- [Telegram](https://t.me/your-telegram)
- [Twitter](https://twitter.com/your-twitter)

### Bug Reports
- [GitHub Issues](https://github.com/your-repo/issues)
- [Security Issues](mailto:security@your-domain.com)

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Chainlink for price oracle infrastructure
- Oasis Foundation for Sapphire Network
- Hardhat team for development tools

## 📝 Changelog

### v1.0.0 (Current)
- Initial release
- Core lending functionality
- Privacy features
- Sapphire Network integration

### Upcoming
- Governance token
- Yield farming
- Cross-chain bridges
- Advanced analytics

---

**⚠️ Disclaimer**: This software is provided "as is" without warranty. Use at your own risk. This is experimental software and should not be used with real funds without thorough testing.
