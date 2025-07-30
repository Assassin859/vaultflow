const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🧪 Testing VaultFlowLending deployment on local network...");
    
    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`📋 Deploying contracts with account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

        // Step 1: Deploy MockPriceOracle
        console.log("\n📊 Deploying MockPriceOracle...");
        const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
        const mockPriceOracle = await MockPriceOracle.deploy();
        await mockPriceOracle.waitForDeployment();
        console.log(`✅ MockPriceOracle deployed to: ${mockPriceOracle.target}`);

        // Step 2: Set realistic prices in the oracle
        console.log("\n💰 Setting token prices in oracle...");
        
        // ETH price: $2000 (address(0))
        await mockPriceOracle.setPrice(ethers.ZeroAddress, ethers.parseEther("2000"));
        console.log("✅ ETH price set to $2000");

        const USDC_PRICE = ethers.parseEther("1"); // $1
        const DAI_PRICE = ethers.parseEther("1");  // $1

        // Step 3: Deploy VaultFlowLending with the oracle address
        console.log("\n🏦 Deploying VaultFlowLending...");
        const VaultFlowLending = await ethers.getContractFactory("VaultFlowLending");
        const vaultFlowLending = await VaultFlowLending.deploy(mockPriceOracle.target);
        await vaultFlowLending.waitForDeployment();
        console.log(`✅ VaultFlowLending deployed to: ${vaultFlowLending.target}`);

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

        // Step 5: Set prices for the deployed mock tokens
        console.log("\n💰 Setting prices for mock tokens...");
        await mockPriceOracle.setPrice(mockUSDC.target, USDC_PRICE);
        await mockPriceOracle.setPrice(mockDAI.target, DAI_PRICE);
        console.log("✅ Mock token prices set");

        // Step 6: Add supported assets to VaultFlowLending
        console.log("\n➕ Adding supported assets to VaultFlowLending...");
        
        // Asset parameters
        const ETH_COLLATERAL_FACTOR = 8000; // 80% (8000 basis points)
        const ETH_LIQUIDATION_THRESHOLD = 8500; // 85% (8500 basis points)
        const STABLECOIN_COLLATERAL_FACTOR = 9000; // 90% (9000 basis points)
        const STABLECOIN_LIQUIDATION_THRESHOLD = 9500; // 95% (9500 basis points)
        
        const BORROW_FACTOR = 10000; // 100% (10000 basis points)
        const MAX_UTILIZATION = 9500; // 95% (9500 basis points)
        const BASE_RATE = 500; // 5% (500 basis points)
        const KINK_RATE = 2000; // 20% (2000 basis points)
        const MULTIPLIER = 100; // 1% (100 basis points)

        // Add ETH (native token)
        console.log("📝 Adding ETH as supported asset...");
        await vaultFlowLending.addAsset(
            ethers.ZeroAddress, // ETH address
            ETH_COLLATERAL_FACTOR,
            BORROW_FACTOR,
            MAX_UTILIZATION,
            BASE_RATE,
            KINK_RATE,
            MULTIPLIER
        );
        console.log("✅ ETH added as supported asset");

        // Add USDC
        console.log("📝 Adding USDC as supported asset...");
        await vaultFlowLending.addAsset(
            mockUSDC.target,
            STABLECOIN_COLLATERAL_FACTOR,
            BORROW_FACTOR,
            MAX_UTILIZATION,
            BASE_RATE,
            KINK_RATE,
            MULTIPLIER
        );
        console.log("✅ USDC added as supported asset");

        // Add DAI
        console.log("📝 Adding DAI as supported asset...");
        await vaultFlowLending.addAsset(
            mockDAI.target,
            STABLECOIN_COLLATERAL_FACTOR,
            BORROW_FACTOR,
            MAX_UTILIZATION,
            BASE_RATE,
            KINK_RATE,
            MULTIPLIER
        );
        console.log("✅ DAI added as supported asset");

        // Step 7: Test basic functionality
        console.log("\n🧪 Testing basic functionality...");
        
        // Test deposit
        const depositAmount = ethers.parseEther("1");
        await vaultFlowLending.deposit(ethers.ZeroAddress, { value: depositAmount });
        console.log("✅ ETH deposit successful");
        
        // Test USDC deposit
        const usdcDepositAmount = ethers.parseUnits("1000", 6);
        await mockUSDC.approve(vaultFlowLending.target, usdcDepositAmount);
        await vaultFlowLending.deposit(mockUSDC.target, usdcDepositAmount);
        console.log("✅ USDC deposit successful");
        
        // Test health factor calculation
        const healthFactor = await vaultFlowLending.getHealthFactor(deployer.address);
        console.log(`✅ Health factor calculated: ${ethers.formatEther(healthFactor)}`);
        
        // Test price oracle integration
        const ethPrice = await mockPriceOracle.getPrice(ethers.ZeroAddress);
        const usdcPrice = await mockPriceOracle.getPrice(mockUSDC.target);
        const daiPrice = await mockPriceOracle.getPrice(mockDAI.target);
        
        console.log("✅ Price oracle prices:", {
            ETH: ethers.formatEther(ethPrice),
            USDC: ethers.formatEther(usdcPrice),
            DAI: ethers.formatEther(daiPrice)
        });

        console.log("\n🎉 Test deployment completed successfully!");
        console.log("\n📋 Test Summary:");
        console.log(`   MockPriceOracle: ${mockPriceOracle.target}`);
        console.log(`   VaultFlowLending: ${vaultFlowLending.target}`);
        console.log(`   Mock USDC: ${mockUSDC.target}`);
        console.log(`   Mock DAI: ${mockDAI.target}`);
        console.log(`   Deployer: ${deployer.address}`);
        console.log(`   Network: Local Hardhat`);
        console.log(`   Basic functionality: ✅ Working`);

    } catch (error) {
        console.error("❌ Test deployment failed:", error);
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