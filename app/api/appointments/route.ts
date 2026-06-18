import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { appointmentSchema } from "@/lib/validations"
import { successResponse, unauthorizedResponse, validationErrorResponse, serverErrorResponse, notFoundResponse, errorResponse } from "@/lib/api-response"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const userId = session.user.id
    const role = session.user.role
    const url = new URL(req.url)
    const requestIdFilter = url.searchParams.get("requestId")

    let where: any =
      role === "PROFESSIONAL"
        ? { professionalId: userId }
        : { clientId: userId }
    if (requestIdFilter) where.requestId = requestIdFilter

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
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
        escrowTransaction: { select: { id: true } },
      },
    })

    const result = appointments.map(({ escrowTransaction, ...a }) => ({
      ...a,
      paymentProcessed: escrowTransaction !== null,
    }))

    return successResponse(result)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return serverErrorResponse("Error al obtener citas")
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const isClient = session.user.role === "CLIENT"
    const isProfessional = session.user.role === "PROFESSIONAL"
    if (!isClient && !isProfessional) {
      return errorResponse("Solo clientes y profesionales pueden agendar citas", 403)
    }

    const body = await req.json()
    const parsed = appointmentSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors)
    }

    const { professionalId, requestId, scheduledAt, durationMinutes } = parsed.data

    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        role: true,
        professionalProfile: { select: { ratePerMinute: true } },
      },
    })

    if (!professional || professional.role !== "PROFESSIONAL") {
      return notFoundResponse("El profesional")
    }

    let appointmentClientId = session.user.id
    let appointmentProfessionalId = professionalId

    if (requestId) {
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        select: { id: true, clientId: true, professionalId: true, status: true },
      })

      if (!request) return notFoundResponse("La consulta")

      const isParticipant =
        session.user.id === request.clientId || session.user.id === request.professionalId
      if (!isParticipant) {
        return errorResponse("No eres participante de esta consulta", 403)
      }
      if (request.status !== "RESPONDED") {
        return errorResponse("La consulta no está en estado para agendar", 400)
      }

      appointmentClientId = request.clientId
      appointmentProfessionalId = request.professionalId!
    }

    const ratePerMinute = professional.professionalProfile?.ratePerMinute ?? 1200
    const totalCost = ratePerMinute * durationMinutes

    const appointment = await prisma.appointment.create({
      data: {
        clientId: appointmentClientId,
        professionalId: appointmentProfessionalId,
        requestId: requestId ?? null,
        scheduledAt: new Date(scheduledAt),
        durationMinutes,
        totalCost,
        status: "SCHEDULED",
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        totalCost: true,
        status: true,
        client: { select: { id: true, fullName: true, username: true } },
        professional: { select: { id: true, fullName: true, username: true } },
      },
    })

    return successResponse(appointment, 201)
  } catch (error) {
    console.error("Error creating appointment:", error)
    return serverErrorResponse("Error al agendar la cita")
  }
}
