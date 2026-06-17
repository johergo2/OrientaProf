import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getTransactionCounter } from "@/lib/blockchain"
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from "@/lib/api-response"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const body = await req.json()
    const { appointmentId, depositTxHash, clientAddress, professionalAddress, amount } = body

    if (!appointmentId) return errorResponse("appointmentId requerido", 400)
    if (!depositTxHash) return errorResponse("depositTxHash requerido", 400)
    if (!clientAddress) return errorResponse("clientAddress requerido", 400)
    if (!professionalAddress) return errorResponse("professionalAddress requerido", 400)

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment) return errorResponse("Cita no encontrada", 404)
    if (session.user.id !== appointment.clientId) {
      return errorResponse("Solo el cliente puede depositar", 403)
    }

    const existingEscrow = await prisma.escrowTransaction.findUnique({
      where: { appointmentId },
    })

    if (existingEscrow) {
      return errorResponse("Ya existe un depósito para esta cita", 400)
    }

    const transactionIndex = await getTransactionCounter()

    const escrow = await prisma.escrowTransaction.create({
      data: {
        appointmentId,
        transactionIndex,
        clientAddress,
        professionalAddress,
        amount: Number(amount),
        status: "PENDIENTE",
        depositTxHash,
      },
    })

    return successResponse(escrow, 201)
  } catch (error) {
    console.error("Error recording deposit:", error)
    return serverErrorResponse("Error al registrar depósito")
  }
}
