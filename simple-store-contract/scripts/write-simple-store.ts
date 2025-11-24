// scripts/write-simple-store.ts
import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

// misma address de antes
const CONTRACT_ADDRESS = "0x728C467108FD069dB03e270249298Dc10ca355Dc";

const simpleStore = await ethers.getContractAt("SimpleStore", CONTRACT_ADDRESS);

// cambiá este número si querés
const nuevoValor = 42;

console.log(`Seteando valor = ${nuevoValor} en SimpleStore...`);

const tx = await simpleStore.setValor(nuevoValor);
console.log("Tx enviada:", tx.hash);

await tx.wait();
console.log("Tx confirmada");

const valor = await simpleStore.getValor();
console.log("Nuevo valor en la blockchain:", valor.toString());
