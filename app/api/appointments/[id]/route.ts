import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { successResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-response"

export async function GET(
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
        scheduledAt: true,
        durationMinutes: true,
        totalCost: true,
        status: true,
        createdAt: true,
        clientConfirmed: true,
        professionalConfirmed: true,
        client: { select: { id: true, username: true, fullName: true, walletAddress: true } },
        professional: { select: { id: true, username: true, fullName: true, walletAddress: true } },
        request: { select: { id: true, title: true } },
      },
    })

    if (!appointment) return notFoundResponse("Cita")

    const userId = session.user.id
    if (appointment.client.id !== userId && appointment.professional.id !== userId) {
      return unauthorizedResponse()
    }

    return successResponse(appointment)
  } catch (error) {
    console.error("Error fetching appointment:", error)
    return serverErrorResponse("Error al obtener la cita")
  }
}
