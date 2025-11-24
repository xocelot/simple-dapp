import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "sepolia",
  chainType: "l1", // igual que en tu config
});

const [signer] = await ethers.getSigners();
const address = signer.address;

console.log("Usando cuenta:", address);

const balance = await ethers.provider.getBalance(address);
console.log("Balance en ETH:", ethers.formatEther(balance));
