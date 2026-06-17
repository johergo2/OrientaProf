import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse, serverErrorResponse } from "@/lib/api-response"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    if (session.user.role !== "CLIENT") {
      return errorResponse("Solo los clientes pueden cancelar consultas", 403)
    }

    const { id } = await params

    const request = await prisma.request.findUnique({
      where: { id },
      select: { id: true, clientId: true, status: true },
    })

    if (!request) return notFoundResponse("La consulta")

    if (request.clientId !== session.user.id) {
      return errorResponse("Esta consulta no te pertenece", 403)
    }

    if (request.status !== "PENDING" && request.status !== "RESPONDED") {
      return errorResponse("Solo se pueden cancelar consultas en estado Pendiente o Respondida", 400)
    }

    const updated = await prisma.request.update({
      where: { id },
      data: { status: "CANCELLED" },
      select: { id: true, status: true },
    })

    return successResponse({
      id: updated.id,
      status: updated.status,
      message: "Consulta cancelada exitosamente",
    })
  } catch (error) {
    console.error("Error cancelling request:", error)
    return serverErrorResponse("Error al cancelar la consulta")
  }
}
