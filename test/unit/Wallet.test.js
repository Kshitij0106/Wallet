const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Wallet", () => {
      let wallet;
      let deployer;
      let mockV3Aggregator;
      const sendEth = ethers.utils.parseEther("1"); // 1 Eth

      beforeEach(async () => {
        // will deploy all the contracts with the tag
        await deployments.fixture(["all"]);

        deployer = (await getNamedAccounts()).deployer;

        wallet = await ethers.getContract("Wallet", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", () => {
        it("sets the price feed address correctly", async () => {
          const address = await wallet.getPriceFeed();
          assert.equal(address, mockV3Aggregator.address);
        });
      });

      describe("fund", () => {
        it("Fails if less eth is send", async () => {
          await expect(wallet.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("updates the balance after getting funds", async () => {
          await wallet.fund({ value: sendEth });
          const balance = await wallet.getBalance();

          assert.equal(balance.toString(), sendEth.toString());
        });

        it("checks the sender's amount", async () => {
          await wallet.fund({ value: sendEth });
          const amt = await wallet.getAmountByAddress(deployer);

          assert.equal(amt.toString(), sendEth.toString());
        });
      });

      describe("withdraw", () => {
        beforeEach(async () => {
          await wallet.fund({ value: sendEth });
        });

        it("checks for owner able to withdraw money", async () => {
          const transactionResponse = await wallet.withdraw(sendEth);
          const transactionReceipt = await transactionResponse.wait(1);

          // calculating gas used in transaction
          // const { gasUsed, gasPrice } = transactionReceipt;
          // const gasCost = gasUsed.mul(gasPrice); // big num multiply

          const balance = await wallet.getBalance();

          assert.equal("0", balance.toString());
        });

        it("checks if amount is greater than the balance", async () => {
          await expect(
            wallet.withdraw(ethers.utils.parseEther("2"))
          ).to.be.revertedWith("Balance is low !!");
        });

        it("checks only if owner can withdraw money", async () => {
          const accounts = await ethers.getSigners();

          const attackerSignedContract = await wallet.connect(accounts[1]);

          await expect(
            attackerSignedContract.withdraw(sendEth)
          ).to.be.revertedWith("Wallet__NotOwner");
        });
      });
    });
