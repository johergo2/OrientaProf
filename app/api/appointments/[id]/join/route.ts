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

    console.log("join: userId=" + session.user.id + " appointmentId=" + id)

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        professionalId: true,
        scheduledAt: true,
        durationMinutes: true,
        status: true,
        clientConfirmed: true,
        professionalConfirmed: true,
      },
    })

    if (!appointment) return notFoundResponse("La cita")

    const isClient = session.user.id === appointment.clientId
    const isProfessional = session.user.id === appointment.professionalId
    console.log("join: isClient=" + isClient + " isProfessional=" + isProfessional + " clientConfirmed=" + appointment.clientConfirmed + " professionalConfirmed=" + appointment.professionalConfirmed)

    if (!isClient && !isProfessional) {
      console.log("join: usuario no es participante")
      return errorResponse("No eres participante de esta cita", 403)
    }

    if (appointment.status === "CANCELLED") {
      return errorResponse("La cita está cancelada", 400)
    }

    if (appointment.status === "COMPLETED") {
      return errorResponse("La cita ya fue completada", 400)
    }

    const now = new Date()
    const start = new Date(appointment.scheduledAt)
    const end = new Date(start.getTime() + appointment.durationMinutes * 60 * 1000)

    if (now < new Date(start.getTime() - 60 * 60 * 1000)) {
      return errorResponse("La videollamada aún no ha iniciado. Vuelve 1 hora antes de la hora agendada.", 400)
    }

    if (now > end) {
      return errorResponse("La videollamada ya finalizó.", 400)
    }

    const updateData: Record<string, unknown> = isClient
      ? { clientConfirmed: true }
      : { professionalConfirmed: true }

    const willBothConfirmed = isClient
      ? appointment.professionalConfirmed
      : appointment.clientConfirmed

    if (willBothConfirmed) {
      updateData.startedAt = new Date()
    }

    console.log("join: updating with", JSON.stringify(updateData))

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      select: { clientConfirmed: true, professionalConfirmed: true, startedAt: true, status: true },
    })

    console.log("join: update result", JSON.stringify(updated))

    return successResponse(updated)
  } catch (error) {
    console.error("Error joining appointment:", error)
    return serverErrorResponse("Error al ingresar a la videollamada")
  }
}
