import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { callRelease } from "@/lib/blockchain"
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

    const escrow = appointment.escrowTransaction
    if (!escrow) return errorResponse("No hay depósito para esta cita", 400)
    if (escrow.status !== "PENDIENTE") return errorResponse("El depósito no está pendiente", 400)

    const txHash = await callRelease(escrow.transactionIndex)

    await prisma.escrowTransaction.update({
      where: { appointmentId },
      data: {
        status: "LIBERADA",
        releaseTxHash: txHash,
      },
    })

    return successResponse({ txHash, status: "LIBERADA" })
  } catch (error) {
    console.error("Error releasing payment:", error)
    return serverErrorResponse("Error al liberar pago")
  }
}
