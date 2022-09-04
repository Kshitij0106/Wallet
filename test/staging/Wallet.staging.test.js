const { assert } = require("chai");
const { ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Wallet", () => {
      let wallet;
      let deployer;
      const sendEth = ethers.utils.parseEther("1");

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;

        // assuming contract is already deployed
        wallet = await ethers.getContract("Wallet", deployer);
      });

      it("allows to fund and withdraw", async () => {
        await wallet.fund({ value: sendEth });
        await wallet.withdraw(sendEth);

        assert(wallet.getBalance().toString(), "0");
      });
    });
