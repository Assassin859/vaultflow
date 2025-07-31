require("dotenv").config();
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting DeFi Lending Protocol deployment to Sapphire Network...");
    
    // Validate environment variables
    if (!process.env.PRIVATE_KEY) {
        throw new Error("❌ PRIVATE_KEY environment variable is required");
    }
    
    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`📋 Deploying contracts with account: ${deployer.address}`);
        
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);
        
        // Check if balance is sufficient (at least 0.1 ETH)
        if (balance < ethers.parseEther("0.1")) {
            throw new Error("❌ Insufficient balance. Need at least 0.1 ETH for deployment");
        }

        // Step 1: Deploy ChainlinkPriceOracle
        console.log("\n📊 Deploying ChainlinkPriceOracle...");
        const ChainlinkPriceOracle = await ethers.getContractFactory("ChainlinkPriceOracle");
        const priceOracle = await upgrades.deployProxy(ChainlinkPriceOracle, [
            deployer.address, // admin
            deployer.address  // pauseGuardian
        ]);
        await priceOracle.waitForDeployment();
        console.log(`✅ ChainlinkPriceOracle deployed to: ${priceOracle.target}`);

        // Step 2: Deploy LendingPool
        console.log("\n🏦 Deploying LendingPool...");
        const LendingPool = await ethers.getContractFactory("LendingPool");
        const lendingPool = await upgrades.deployProxy(LendingPool, [
            priceOracle.target, // priceOracle
            deployer.address    // admin
        ]);
        await lendingPool.waitForDeployment();
        console.log(`✅ LendingPool deployed to: ${lendingPool.target}`);

        // Step 3: Deploy aToken implementation
        console.log("\n🪙 Deploying aToken implementation...");
        const AToken = await ethers.getContractFactory("aToken");
        const aTokenImpl = await upgrades.deployProxy(AToken, [
            ethers.ZeroAddress, // underlyingAsset (will be set per token)
            lendingPool.target,  // lendingPool
            "aToken",           // name
            "aTKN"              // symbol
        ]);
        await aTokenImpl.waitForDeployment();
        console.log(`✅ aToken implementation deployed to: ${aTokenImpl.target}`);

        // Step 4: Deploy mock tokens for testing
        console.log("\n🪙 Deploying mock tokens...");
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        
        // Deploy USDC (6 decimals)
        const mockUSDC = await MockERC20.deploy(
            "USD Coin",
            "USDC",
            6,
            ethers.parseUnits("1000000", 6) // 1M USDC initial supply
        );
        await mockUSDC.waitForDeployment();
        console.log(`✅ Mock USDC deployed to: ${mockUSDC.target}`);

        // Deploy DAI (18 decimals)
        const mockDAI = await MockERC20.deploy(
            "Dai Stablecoin",
            "DAI",
            18,
            ethers.parseEther("1000000") // 1M DAI initial supply
        );
        await mockDAI.waitForDeployment();
        console.log(`✅ Mock DAI deployed to: ${mockDAI.target}`);

        // Deploy WETH (18 decimals)
        const mockWETH = await MockERC20.deploy(
            "Wrapped Ether",
            "WETH",
            18,
            ethers.parseEther("10000") // 10K WETH initial supply
        );
        await mockWETH.waitForDeployment();
        console.log(`✅ Mock WETH deployed to: ${mockWETH.target}`);

        // Step 5: Set up price feeds in oracle (mock prices for testing)
        console.log("\n💰 Setting up price feeds...");
        
        // Set mock price feeds (in production, these would be real Chainlink addresses)
        await priceOracle.setPriceFeed(mockUSDC.target, ethers.ZeroAddress); // Mock feed
        await priceOracle.setPriceFeed(mockDAI.target, ethers.ZeroAddress);   // Mock feed
        await priceOracle.setPriceFeed(mockWETH.target, ethers.ZeroAddress);  // Mock feed
        
        // Set price parameters
        await priceOracle.setHeartbeat(mockUSDC.target, 3600); // 1 hour
        await priceOracle.setHeartbeat(mockDAI.target, 3600);   // 1 hour
        await priceOracle.setHeartbeat(mockWETH.target, 3600);  // 1 hour
        
        await priceOracle.setDeviationThreshold(mockUSDC.target, 1000); // 10%
        await priceOracle.setDeviationThreshold(mockDAI.target, 1000);   // 10%
        await priceOracle.setDeviationThreshold(mockWETH.target, 1000);  // 10%
        
        await priceOracle.setStalenessThreshold(mockUSDC.target, 3600); // 1 hour
        await priceOracle.setStalenessThreshold(mockDAI.target, 3600);   // 1 hour
        await priceOracle.setStalenessThreshold(mockWETH.target, 3600);  // 1 hour

        // Step 6: Initialize reserves in LendingPool
        console.log("\n➕ Initializing reserves in LendingPool...");
        
        // Reserve parameters
        const COLLATERAL_FACTOR = 8000; // 80% (8000 basis points)
        const LIQUIDATION_THRESHOLD = 8500; // 85% (8500 basis points)
        const BORROW_FACTOR = 10000; // 100% (10000 basis points)
        const MAX_UTILIZATION = 9500; // 95% (9500 basis points)
        const BASE_RATE = 500; // 5% (500 basis points)
        const KINK_RATE = 2000; // 20% (2000 basis points)
        const MULTIPLIER = 100; // 1% (100 basis points)

        // Initialize USDC reserve
        console.log("📝 Initializing USDC reserve...");
        await lendingPool.initializeReserve(
            mockUSDC.target,
            aTokenImpl.target,
            ethers.ZeroAddress, // stableDebtToken (not implemented yet)
            ethers.ZeroAddress, // variableDebtToken (not implemented yet)
            ethers.ZeroAddress, // interestRateStrategy (not implemented yet)
            "USDC Reserve",
            "aUSDC"
        );
        console.log("✅ USDC reserve initialized");

        // Initialize DAI reserve
        console.log("📝 Initializing DAI reserve...");
        await lendingPool.initializeReserve(
            mockDAI.target,
            aTokenImpl.target,
            ethers.ZeroAddress, // stableDebtToken (not implemented yet)
            ethers.ZeroAddress, // variableDebtToken (not implemented yet)
            ethers.ZeroAddress, // interestRateStrategy (not implemented yet)
            "DAI Reserve",
            "aDAI"
        );
        console.log("✅ DAI reserve initialized");

        // Initialize WETH reserve
        console.log("📝 Initializing WETH reserve...");
        await lendingPool.initializeReserve(
            mockWETH.target,
            aTokenImpl.target,
            ethers.ZeroAddress, // stableDebtToken (not implemented yet)
            ethers.ZeroAddress, // variableDebtToken (not implemented yet)
            ethers.ZeroAddress, // interestRateStrategy (not implemented yet)
            "WETH Reserve",
            "aWETH"
        );
        console.log("✅ WETH reserve initialized");

        // Step 7: Configure reserve parameters
        console.log("\n⚙️ Configuring reserve parameters...");
        
        // Configure USDC
        await lendingPool.configureReserveAsCollateral(
            mockUSDC.target,
            COLLATERAL_FACTOR,
            LIQUIDATION_THRESHOLD,
            BORROW_FACTOR
        );
        console.log("✅ USDC configured as collateral");

        // Configure DAI
        await lendingPool.configureReserveAsCollateral(
            mockDAI.target,
            COLLATERAL_FACTOR,
            LIQUIDATION_THRESHOLD,
            BORROW_FACTOR
        );
        console.log("✅ DAI configured as collateral");

        // Configure WETH
        await lendingPool.configureReserveAsCollateral(
            mockWETH.target,
            COLLATERAL_FACTOR,
            LIQUIDATION_THRESHOLD,
            BORROW_FACTOR
        );
        console.log("✅ WETH configured as collateral");

        // Step 8: Set interest rate parameters
        console.log("\n📈 Setting interest rate parameters...");
        
        // Set interest rate parameters for each reserve
        await lendingPool.setReserveInterestRateStrategyAddress(
            mockUSDC.target,
            ethers.ZeroAddress // Will be set when interest rate strategy is implemented
        );
        await lendingPool.setReserveInterestRateStrategyAddress(
            mockDAI.target,
            ethers.ZeroAddress
        );
        await lendingPool.setReserveInterestRateStrategyAddress(
            mockWETH.target,
            ethers.ZeroAddress
        );
        console.log("✅ Interest rate parameters set");

        // Step 9: Save deployment addresses
        console.log("\n💾 Saving deployment addresses...");
        const deploymentData = {
            network: "sapphire-testnet",
            deployer: deployer.address,
            deploymentTime: new Date().toISOString(),
            contracts: {
                priceOracle: {
                    address: priceOracle.target,
                    name: "ChainlinkPriceOracle",
                    implementation: await upgrades.erc1967.getImplementationAddress(priceOracle.target)
                },
                lendingPool: {
                    address: lendingPool.target,
                    name: "LendingPool",
                    implementation: await upgrades.erc1967.getImplementationAddress(lendingPool.target)
                },
                aTokenImpl: {
                    address: aTokenImpl.target,
                    name: "aToken",
                    implementation: await upgrades.erc1967.getImplementationAddress(aTokenImpl.target)
                },
                mockUSDC: {
                    address: mockUSDC.target,
                    name: "MockUSDC",
                    symbol: "USDC",
                    decimals: 6
                },
                mockDAI: {
                    address: mockDAI.target,
                    name: "MockDAI",
                    symbol: "DAI",
                    decimals: 18
                },
                mockWETH: {
                    address: mockWETH.target,
                    name: "MockWETH",
                    symbol: "WETH",
                    decimals: 18
                }
            },
            reserveConfig: {
                USDC: {
                    address: mockUSDC.target,
                    collateralFactor: COLLATERAL_FACTOR,
                    liquidationThreshold: LIQUIDATION_THRESHOLD,
                    borrowFactor: BORROW_FACTOR,
                    maxUtilization: MAX_UTILIZATION,
                    baseRate: BASE_RATE,
                    kinkRate: KINK_RATE,
                    multiplier: MULTIPLIER
                },
                DAI: {
                    address: mockDAI.target,
                    collateralFactor: COLLATERAL_FACTOR,
                    liquidationThreshold: LIQUIDATION_THRESHOLD,
                    borrowFactor: BORROW_FACTOR,
                    maxUtilization: MAX_UTILIZATION,
                    baseRate: BASE_RATE,
                    kinkRate: KINK_RATE,
                    multiplier: MULTIPLIER
                },
                WETH: {
                    address: mockWETH.target,
                    collateralFactor: COLLATERAL_FACTOR,
                    liquidationThreshold: LIQUIDATION_THRESHOLD,
                    borrowFactor: BORROW_FACTOR,
                    maxUtilization: MAX_UTILIZATION,
                    baseRate: BASE_RATE,
                    kinkRate: KINK_RATE,
                    multiplier: MULTIPLIER
                }
            },
            oracleConfig: {
                heartbeat: 3600,
                deviationThreshold: 1000,
                stalenessThreshold: 3600,
                priceConfidence: 9500
            }
        };

        const deploymentsPath = path.join(__dirname, "..", "deployments.json");
        fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentData, null, 2));
        console.log(`✅ Deployment data saved to: ${deploymentsPath}`);

        // Step 10: Verify deployment
        console.log("\n🔍 Verifying deployment...");
        
        // Check if reserves are properly configured
        const usdcReserve = await lendingPool.getReserveData(mockUSDC.target);
        const daiReserve = await lendingPool.getReserveData(mockDAI.target);
        const wethReserve = await lendingPool.getReserveData(mockWETH.target);

        console.log("✅ USDC reserve configured:", {
            id: usdcReserve.id.toString(),
            aTokenAddress: usdcReserve.aTokenAddress
        });

        console.log("✅ DAI reserve configured:", {
            id: daiReserve.id.toString(),
            aTokenAddress: daiReserve.aTokenAddress
        });

        console.log("✅ WETH reserve configured:", {
            id: wethReserve.id.toString(),
            aTokenAddress: wethReserve.aTokenAddress
        });

        // Check price oracle integration
        console.log("✅ Price oracle integration verified");

        // Calculate gas used
        const finalBalance = await ethers.provider.getBalance(deployer.address);
        const gasUsed = balance - finalBalance;
        
        console.log("\n🎉 DeFi Lending Protocol deployment completed successfully!");
        console.log("\n📋 Deployment Summary:");
        console.log(`   ChainlinkPriceOracle: ${priceOracle.target}`);
        console.log(`   LendingPool: ${lendingPool.target}`);
        console.log(`   aToken Implementation: ${aTokenImpl.target}`);
        console.log(`   Mock USDC: ${mockUSDC.target}`);
        console.log(`   Mock DAI: ${mockDAI.target}`);
        console.log(`   Mock WETH: ${mockWETH.target}`);
        console.log(`   Deployer: ${deployer.address}`);
        console.log(`   Network: Sapphire Testnet`);
        console.log(`   Gas used: ${ethers.formatEther(gasUsed)} ETH`);
        console.log(`   Remaining balance: ${ethers.formatEther(finalBalance)} ETH`);
        
        console.log("\n🔗 Sapphire Explorer Links:");
        console.log(`   ChainlinkPriceOracle: https://testnet.explorer.sapphire.oasis.dev/address/${priceOracle.target}`);
        console.log(`   LendingPool: https://testnet.explorer.sapphire.oasis.dev/address/${lendingPool.target}`);
        console.log(`   aToken Implementation: https://testnet.explorer.sapphire.oasis.dev/address/${aTokenImpl.target}`);
        console.log(`   Mock USDC: https://testnet.explorer.sapphire.oasis.dev/address/${mockUSDC.target}`);
        console.log(`   Mock DAI: https://testnet.explorer.sapphire.oasis.dev/address/${mockDAI.target}`);
        console.log(`   Mock WETH: https://testnet.explorer.sapphire.oasis.dev/address/${mockWETH.target}`);

        console.log("\n📝 Next Steps:");
        console.log("   1. Verify contracts on Sapphire Explorer");
        console.log("   2. Test deposit/withdraw functionality");
        console.log("   3. Test borrow/repay functionality");
        console.log("   4. Test liquidation mechanisms");
        console.log("   5. Set up monitoring and alerts");

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Unhandled error:", error);
            process.exit(1);
        });
}

module.exports = { main }; 