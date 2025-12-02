"use client";

import { useState } from "react";
import { BrowserProvider, Contract, isAddress } from "ethers";

const RAW_ADDRESS = process.env.NEXT_PUBLIC_SIMPLE_STORE_ADDRESS ?? "";
const CONTRACT_ADDRESS = RAW_ADDRESS.trim().replace(/['"]/g, "");
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

declare global {
  interface Window {
    ethereum?: any;
  }
}

async function getContract(): Promise<Contract> {
  if (!window.ethereum) {
    throw new Error(
      "No se encontró ninguna wallet (Metamask / Rabby) en el navegador."
    );
  }

  if (!CONTRACT_ADDRESS || !isAddress(CONTRACT_ADDRESS)) {
    throw new Error(
      "La address del contrato es inválida. Revisá NEXT_PUBLIC_SIMPLE_STORE_ADDRESS."
    );
  }

  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const chainIdNumber = Number(network.chainId);

  // Sepolia = 11155111
  if (chainIdNumber !== 11155111) {
    throw new Error("No estás en la red Sepolia. Cambiá la red en tu wallet.");
  }

  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, simpleStoreAbi, signer);
}

const simpleStoreAbi = [
  "function getValor() view returns (uint256)",
  "function setValor(uint256 _nuevoValor) external",
];

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [currentValue, setCurrentValue] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function ensureSepoliaNetwork() {
    if (!window.ethereum) {
      throw new Error("No se encontró ninguna wallet (Metamask / Rabby).");
    }

    try {
      // Intentar cambiar a Sepolia
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        if (!SEPOLIA_RPC_URL) {
          throw new Error("Falta NEXT_PUBLIC_SEPOLIA_RPC_URL en .env.");
        }

        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [SEPOLIA_RPC_URL],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch (addError) {
          console.error("Error al agregar la red Sepolia:", addError);
          throw new Error("No se pudo agregar la red Sepolia en tu wallet.");
        }
      } else {
        console.error("Error al cambiar a Sepolia:", switchError);
        throw new Error("No se pudo cambiar a la red Sepolia.");
      }
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Instalá Metamask o Rabby para continuar.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);

      await ensureSepoliaNetwork();

      setMessage("Wallet conectada correctamente ✅");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Error al conectar la wallet.");
    }
  }

  async function loadCurrentValue() {
    try {
      setLoading(true);
      setMessage("");

      const contract = await getContract();
      const valor = await contract.getValor();
      setCurrentValue(valor.toString());
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Error al leer el valor on-chain.");
    } finally {
      setLoading(false);
    }
  }

  async function setValorOnChain() {
    try {
      setLoading(true);
      setMessage("");

      const numero = Number(inputValue);
      if (Number.isNaN(numero)) {
        setMessage("Por favor, ingresa un número válido.");
        setLoading(false);
        return;
      }

      const contract = await getContract();
      const tx = await contract.setValor(numero);

      // guardamos el hash como tx:... para luego linkear a Etherscan
      setMessage(`tx:${tx.hash}`);
      await tx.wait();

      const nuevoValor = await contract.getValor();
      setCurrentValue(nuevoValor.toString());
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Error al guardar el valor en la blockchain.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#050816",
        color: "#f9fafb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        {/* Título y descripción centrados */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            SimpleStore Dapp 🧱
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#d1d5db" }}>
            Esta dapp lee y escribe un número simple en tu contrato{" "}
            <code>SimpleStore</code> en Sepolia. Conectá tu wallet, leé el valor
            actual y guardá uno nuevo on-chain.
          </p>
        </div>

        {/* Card principal */}
        <section
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "1.5rem",
            borderRadius: "1rem",
            background: "#0b1120",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          }}
        >
          {/* Conectar wallet */}
          <button
            onClick={connectWallet}
            style={{
              width: "100%",
              padding: "0.6rem 1rem",
              borderRadius: "999px",
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {account
              ? `Conectado: ${account.slice(0, 6)}...${account.slice(-4)}`
              : "Conectar wallet"}
          </button>

          {/* Leer valor */}
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "0.5rem",
              }}
            >
              <span>Valor actual on-chain:</span>
              <strong>{currentValue || "—"}</strong>
            </div>
            <button
              onClick={loadCurrentValue}
              style={{
                marginTop: "0.75rem",
                width: "100%",
                padding: "0.5rem",
                borderRadius: "999px",
                border: "none",
                background: "#4b5563",
                color: "white",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Leer valor"}
            </button>
          </div>

          {/* Setear valor */}
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              Nuevo valor a guardar en la blockchain:
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ej: 42"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #4b5563",
                background: "#020617",
                color: "white",
                marginBottom: "0.75rem",
              }}
            />
            <button
              onClick={setValorOnChain}
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "999px",
                border: "none",
                background: "#16a34a",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar número"}
            </button>
          </div>

          {/* Mensajes / txid con link */}
          {message && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                color: "#e5e7eb",
                wordBreak: "break-all",
              }}
            >
              {message.startsWith("tx:") ? (
                <a
                  href={`https://sepolia.etherscan.io/tx/${message.slice(3)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#60a5fa", textDecoration: "underline" }}
                >
                  Ver transacción en Etherscan ↗
                </a>
              ) : (
                message
              )}
            </p>
          )}

          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.75rem",
              color: "#9ca3af",
            }}
          >
            Asegurate de que tu wallet esté en la red <strong>Sepolia</strong>.
          </p>
        </section>

        {/* Footer creador */}
        <a
          href="https://www.linkedin.com/in/villarreal-juan"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8rem",
            color: "#9ca3af",
            textDecoration: "none",
            opacity: 0.8,
          }}
        >
          <img
            src="https://github.com/xocelot.png"
            alt="Avatar de Juan (xocelot)"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "999px",
              border: "1px solid #1f2937",
            }}
          />
          <span>Creado por Juan</span>
        </a>
      </div>
    </main>
  );
}
