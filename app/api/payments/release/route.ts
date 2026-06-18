import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { callRefund } from "@/lib/blockchain"
import { ethers } from "ethers"
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from "@/lib/api-response"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const body = await req.json()
    const { appointmentId } = body

    if (!appointmentId) return errorResponse("appointmentId requerido", 400)

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { escrowTransaction: true },
    })

    if (!appointment) return errorResponse("Cita no encontrada", 404)
    if (session.user.id !== appointment.professionalId) {
      return errorResponse("Solo el profesional puede solicitar liberación", 403)
    }
    if (!appointment.professionalConfirmed) {
      return errorResponse("Debes haber ingresado a la videollamada para solicitar pago", 400)
    }

    const escrow = appointment.escrowTransaction
    if (!escrow) return errorResponse("No hay depósito para esta cita", 400)
    if (escrow.status !== "PENDIENTE") return errorResponse("El depósito no está pendiente", 400)

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    })

    const refundTxHash = await callRefund(escrow.transactionIndex)

    await prisma.escrowTransaction.update({
      where: { appointmentId },
      data: {
        status: "REEMBOLSADA",
        releaseTxHash: refundTxHash,
      },
    })

    let transferTxHash: string | null = null
    if (escrow.amount) {
      try {
        const CELO_RATE = 0.00001
        const PROFESSIONAL_FEE = 0.95
        const celoAmount = (escrow.amount * CELO_RATE * PROFESSIONAL_FEE).toFixed(6)
        const pk = process.env.CELO_PRIVATE_KEY
        const rpc = process.env.CELO_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"
        if (pk) {
          const provider = new ethers.JsonRpcProvider(rpc)
          const signer = new ethers.Wallet(pk, provider)
          const professional = await prisma.user.findUnique({
            where: { id: appointment.professionalId },
            select: { walletAddress: true },
          })
          if (professional?.walletAddress) {
            const tx = await signer.sendTransaction({
              to: professional.walletAddress,
              value: ethers.parseEther(celoAmount),
            })
            const receipt = await tx.wait()
            if (receipt) {
              transferTxHash = receipt.hash
            }
          }
        }
      } catch (err) {
        console.error("release: error en transferencia CELO", err)
      }
    }

    return successResponse({ refundTxHash, transferTxHash, status: "REEMBOLSADA" })
  } catch (error) {
    console.error("Error releasing payment:", error)
    return serverErrorResponse("Error al liberar pago")
  }
}
