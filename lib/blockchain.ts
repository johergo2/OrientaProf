import { ethers } from "ethers"

const CONTRACT_ADDRESS = process.env.CELO_PAYMENTS_CONTRACT_ADDRESS || ""
const PRIVATE_KEY = process.env.CELO_PRIVATE_KEY || ""
const RPC_URL = process.env.CELO_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"
const GAS_FEE_BPS = 500

const ABI = [
  "function deposit(string calldata _consultationId, address _professionalWallet) external payable",
  "function release(uint256 _transactionIndex) external",
  "function refund(uint256 _transactionIndex) external",
  "function withdraw(uint256 _transactionIndex) external",
  "function getTransaction(uint256 _index) external view returns (tuple(string consultationId, address clientWallet, address professionalWallet, uint256 amount, uint8 status, uint256 createdAt, uint256 resolvedAt))",
  "function transactionCounter() external view returns (uint256)",
  "event TransactionCreated(uint256 indexed transactionIndex, string indexed consultationId, address indexed clientWallet, address professionalWallet, uint256 amount)",
  "event TransactionReleased(uint256 indexed transactionIndex, string indexed consultationId, address indexed professionalWallet, uint256 amount)",
  "event TransactionRefunded(uint256 indexed transactionIndex, string indexed consultationId, address indexed clientWallet, uint256 refundAmount, uint256 gasFee)",
]

export function getContractSigner() {
  if (!PRIVATE_KEY) throw new Error("CELO_PRIVATE_KEY no configurada")
  if (!CONTRACT_ADDRESS) throw new Error("CELO_PAYMENTS_CONTRACT_ADDRESS no configurada")

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const signer = new ethers.Wallet(PRIVATE_KEY, provider)
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
}

export function getContractProvider() {
  if (!CONTRACT_ADDRESS) throw new Error("CELO_PAYMENTS_CONTRACT_ADDRESS no configurada")

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
}

export async function callRelease(transactionIndex: number) {
  const contract = getContractSigner()
  const tx = await contract.release(transactionIndex)
  const receipt = await tx.wait()
  return receipt.hash
}

export async function callRefund(transactionIndex: number) {
  const contract = getContractSigner()
  const tx = await contract.refund(transactionIndex)
  const receipt = await tx.wait()
  return receipt.hash
}

export async function getTransaction(index: number) {
  const contract = getContractProvider()
  const txn = await contract.getTransaction(index)
  return {
    consultationId: txn.consultationId,
    clientWallet: txn.clientWallet,
    professionalWallet: txn.professionalWallet,
    amount: txn.amount.toString(),
    status: Number(txn.status),
    createdAt: Number(txn.createdAt),
    resolvedAt: Number(txn.resolvedAt),
  }
}

export async function getTransactionCounter() {
  const contract = getContractProvider()
  const count = await contract.transactionCounter()
  return Number(count)
}

export function formatCeloAmount(weiAmount: string | bigint) {
  return ethers.formatEther(weiAmount)
}

export const EscrowStatus = {
  PENDIENTE: 0,
  LIBERADA: 1,
  REEMBOLSADA: 2,
} as const
