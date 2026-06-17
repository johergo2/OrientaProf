import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { successResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse, errorResponse } from "@/lib/api-response"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const { id } = await params

    const body = await req.json()
    const { scheduledAt, durationMinutes } = body

    if (!scheduledAt) return errorResponse("scheduledAt requerido", 400)

    const newDate = new Date(scheduledAt)
    if (isNaN(newDate.getTime())) return errorResponse("Fecha inválida", 400)
    if (newDate <= new Date()) return errorResponse("La nueva fecha debe ser futura", 400)

    const validDurations = [10, 15, 20, 30]
    const newDuration = durationMinutes ?? 20
    if (!validDurations.includes(newDuration)) {
      return errorResponse("Duración debe ser 10, 15, 20 o 30 minutos", 400)
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        professionalId: true,
        scheduledAt: true,
        durationMinutes: true,
        status: true,
        totalCost: true,
      },
    })

    if (!appointment) return notFoundResponse("La cita")

    const isParticipant =
      session.user.id === appointment.clientId || session.user.id === appointment.professionalId
    if (!isParticipant) {
      return errorResponse("No eres participante de esta cita", 403)
    }

    if (appointment.status === "CANCELLED") {
      return errorResponse("No se puede reagendar una cita cancelada", 400)
    }

    if (appointment.status === "COMPLETED") {
      return errorResponse("No se puede reagendar una cita completada", 400)
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt: newDate,
        durationMinutes: newDuration,
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        status: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RESCHEDULE",
        entity: "Appointment",
        entityId: id,
        metadata: {
          previousScheduledAt: appointment.scheduledAt.toISOString(),
          previousDurationMinutes: appointment.durationMinutes,
          newScheduledAt: newDate.toISOString(),
          newDurationMinutes: newDuration,
        },
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error("Error rescheduling appointment:", error)
    return serverErrorResponse("Error al reagendar la cita")
  }
}
