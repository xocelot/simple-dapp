// scripts/read-simple-store.ts
import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

// ⬅️ pegá acá la address que te devolvió el deploy
const CONTRACT_ADDRESS = "0x728C467108FD069dB03e270249298Dc10ca355Dc";

const simpleStore = await ethers.getContractAt("SimpleStore", CONTRACT_ADDRESS);

const valor = await simpleStore.getValor();
console.log("Valor actual en la blockchain:", valor.toString());
