import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { successResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse, errorResponse, serverErrorResponse } from "@/lib/api-response"
import { z } from "zod"

const respondSchema = z.object({
  message: z.string().min(1, "El mensaje no puede estar vacío"),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const { id } = await params

    const request = await prisma.request.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        category: true,
        createdAt: true,
        client: {
          select: { username: true, fullName: true },
        },
      },
    })

    if (!request) return notFoundResponse("La consulta")

    return successResponse(request)
  } catch (error) {
    console.error("Error fetching request:", error)
    return serverErrorResponse("Error al obtener la consulta")
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    if (session.user.role !== "PROFESSIONAL") {
      return unauthorizedResponse("Solo los profesionales pueden responder consultas")
    }

    const { id } = await params

    const request = await prisma.request.findUnique({
      where: { id },
      select: { id: true, status: true, clientId: true },
    })

    if (!request) return notFoundResponse("La consulta")

    if (request.status !== "PENDING") {
      return errorResponse("La consulta ya no está disponible para responder", 400)
    }

    const body = await _req.json()
    const parsed = respondSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors)
    }

    const { message } = parsed.data

    const [updatedRequest] = await prisma.$transaction([
      prisma.request.update({
        where: { id },
        data: {
          status: "RESPONDED",
          professionalId: session.user.id,
        },
      }),
      prisma.message.create({
        data: {
          requestId: id,
          senderId: session.user.id,
          receiverId: request.clientId,
          content: message,
        },
      }),
    ])

    return successResponse({
      requestId: updatedRequest.id,
      status: updatedRequest.status,
      message: "Su propuesta de asesoría fue enviada correctamente al cliente.",
    }, 201)
  } catch (error) {
    console.error("Error responding to request:", error)
    return serverErrorResponse("Error al responder la consulta")
  }
}
