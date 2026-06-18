import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ethers } from "ethers"
import { successResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse, errorResponse } from "@/lib/api-response"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const { id } = await params

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        professionalId: true,
        status: true,
        clientConfirmed: true,
        professionalConfirmed: true,
        startedAt: true,
      },
    })

    if (!appointment) return notFoundResponse("La cita")

    const isParticipant =
      session.user.id === appointment.clientId || session.user.id === appointment.professionalId
    if (!isParticipant) {
      return errorResponse("No eres participante de esta cita", 403)
    }

    if (appointment.status === "CANCELLED") {
      return errorResponse("La cita está cancelada", 400)
    }

    if (appointment.status === "COMPLETED") {
      return errorResponse("La cita ya fue completada", 400)
    }

    if (!appointment.clientConfirmed || !appointment.professionalConfirmed) {
      return errorResponse("Ambos deben ingresar a la videollamada antes de finalizar", 400)
    }

    if (appointment.startedAt) {
      const secondsElapsed = (Date.now() - appointment.startedAt.getTime()) / 1000
      if (secondsElapsed < 10) {
        return errorResponse(`Deben permanecer al menos 10 segundos en la videollamada (llevan ${Math.floor(secondsElapsed)}s)`, 400)
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        completedAt: true,
      },
    })

    const escrow = await prisma.escrowTransaction.findUnique({
      where: { appointmentId: id },
      select: { amount: true },
    })

    if (escrow?.amount) {
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
              console.log("complete: transferencia CELO al profesional", { to: professional.walletAddress, amount: celoAmount, txHash: receipt.hash })
            }
          }
        }
      } catch (err) {
        console.error("complete: error en transferencia CELO", err)
      }
    }

    return successResponse(updated)
  } catch (error) {
    console.error("Error completing appointment:", error)
    return serverErrorResponse("Error al finalizar la videollamada")
  }
}
