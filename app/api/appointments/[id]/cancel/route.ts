import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
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
      select: { id: true, clientId: true, professionalId: true, scheduledAt: true, status: true },
    })

    if (!appointment) return notFoundResponse("La cita")

    const isParticipant =
      session.user.id === appointment.clientId || session.user.id === appointment.professionalId
    if (!isParticipant) {
      return errorResponse("No eres participante de esta cita", 403)
    }

    if (appointment.status === "CANCELLED") {
      return errorResponse("La cita ya está cancelada", 400)
    }

    if (appointment.status === "COMPLETED") {
      return errorResponse("No se puede cancelar una cita completada", 400)
    }

    if (new Date(appointment.scheduledAt) <= new Date()) {
      return errorResponse("No se puede cancelar una cita cuya fecha ya pasó. Solo puedes reagendar.", 400)
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      select: {
        id: true,
        status: true,
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error("Error cancelling appointment:", error)
    return serverErrorResponse("Error al cancelar la cita")
  }
}
