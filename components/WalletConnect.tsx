"use client"

import { useState, useEffect } from "react"
import { JsonRpcSigner, BrowserProvider, Contract, parseEther } from "ethers"

declare global {
  interface Window {
    ethereum?: any
  }
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CELO_PAYMENTS_CONTRACT_ADDRESS || ""
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CELO_CHAIN_ID || "11142220")

const ABI = [
  "function deposit(string calldata _consultationId, address _professionalWallet) external payable",
  "function getTransaction(uint256 _index) external view returns (tuple(string consultationId, address clientWallet, address professionalWallet, uint256 amount, uint8 status, uint256 createdAt, uint256 resolvedAt))",
  "function transactionCounter() external view returns (uint256)",
  "event TransactionCreated(uint256 indexed transactionIndex, string indexed consultationId, address indexed clientWallet, address professionalWallet, uint256 amount)",
]

type Props = {
  appointmentId?: string
  consultationId: string
  professionalWallet: string
  amountInCelo: string
  onDepositComplete?: (txHash: string, transactionIndex?: number) => void
  onError?: (error: string) => void
}

export default function WalletConnect({
  appointmentId,
  consultationId,
  professionalWallet,
  amountInCelo,
  onDepositComplete,
  onError,
}: Props) {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [address, setAddress] = useState("")
  const [depositing, setDepositing] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (window.ethereum?.selectedAddress) {
      connectWallet()
    }
  }, [])

  async function connectWallet() {
    setError("")
    try {
      if (!window.ethereum) {
        setError("Instala MetaMask o Rabby Wallet")
        return
      }
      const provider = new BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      setSigner(signer)
      setAddress(accounts[0])

      const chainId = await provider.send("eth_chainId", [])
      if (Number(chainId) !== CHAIN_ID) {
        try {
          await provider.send("wallet_switchEthereumChain", [{ chainId: "0x" + CHAIN_ID.toString(16) }])
        } catch {
          await provider.send("wallet_addEthereumChain", [
            {
              chainId: "0x" + CHAIN_ID.toString(16),
              chainName: "Celo Sepolia",
              nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: ["https://celo-sepolia.blockscout.com"],
            },
          ])
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Error al conectar wallet")
    }
  }

  async function handleDeposit() {
    setError("")
    setDepositing(true)
    try {
      if (!signer) { setError("Conecta tu wallet primero"); return }

      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer)
      const tx = await contract.deposit(consultationId, professionalWallet, {
        value: parseEther(amountInCelo),
      })
      const receipt = await tx.wait()
      setTxHash(receipt.hash)

      let transactionIndex: number | undefined
      if (receipt.logs) {
        const contract = new Contract(CONTRACT_ADDRESS, ABI, signer)
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            })
            if (parsed?.name === "TransactionCreated") {
              transactionIndex = Number(parsed.args.transactionIndex)
            }
          } catch { }
        }
      }

      if (appointmentId) {
        await fetch("/api/payments/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            depositTxHash: receipt.hash,
            clientAddress: address,
            professionalAddress: professionalWallet,
            amount: amountInCelo,
          }),
        })
      }

      onDepositComplete?.(receipt.hash, transactionIndex)
    } catch (e: any) {
      const msg = e.message ?? "Error al depositar"
      setError(msg)
      onError?.(msg)
    } finally {
      setDepositing(false)
    }
  }

  return (
    <div className="grid gap-3">
      {!address ? (
        <button
          type="button"
          onClick={connectWallet}
          className="w-full bg-brand-700 text-white rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)]"
        >
          Conectar Wallet
        </button>
      ) : (
        <div className="grid gap-2">
          <p className="text-xs text-muted break-all">
            Wallet: {address.slice(0, 6)}...{address.slice(-4)}
          </p>

          {!txHash && (
            <button
              type="button"
              onClick={handleDeposit}
              disabled={depositing || !CONTRACT_ADDRESS}
              className="w-full bg-brand-700 text-white rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-brand-900 transition-colors disabled:opacity-50"
            >
              {depositing ? "Depositando..." : `Depositar ${amountInCelo} CELO`}
            </button>
          )}

          {txHash && (
            <p className="text-brand-700 text-xs break-all">
              Depósito exitoso! Tx: {txHash.slice(0, 10)}...{txHash.slice(-6)}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}
