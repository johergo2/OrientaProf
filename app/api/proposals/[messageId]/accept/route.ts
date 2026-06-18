import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { acceptProposalSchema } from "@/lib/validations"
import { successResponse, unauthorizedResponse, validationErrorResponse, serverErrorResponse, notFoundResponse, errorResponse } from "@/lib/api-response"

export async function POST(req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const body = await req.json()
    const parsed = acceptProposalSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors)
    }

    const { selectedOption } = parsed.data
    const { messageId } = await params

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        request: {
          select: { id: true, clientId: true, professionalId: true, status: true },
        },
      },
    })

    if (!message) return notFoundResponse("El mensaje")
    if (message.messageType !== "PROPOSAL" && message.messageType !== "COUNTER_PROPOSAL") {
      return errorResponse("El mensaje no es una propuesta", 400)
    }
    if (message.receiverId !== session.user.id) {
      return errorResponse("No eres el destinatario de esta propuesta", 403)
    }

    const data = message.structuredData as { option1: string; option2: string; duration: number } | null
    if (!data?.option1 || !data?.option2 || !data?.duration) {
      return errorResponse("Datos de propuesta inválidos", 400)
    }

    const acceptedDate = data[selectedOption]
    if (!acceptedDate) {
      return errorResponse("Opción seleccionada inválida", 400)
    }

    const request = message.request
    if (!request) return errorResponse("La consulta ya no existe", 404)

    const clientId = request.clientId
    const professionalId = request.professionalId

    if (!professionalId) {
      return errorResponse("La consulta no tiene profesional asignado", 400)
    }

    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: {
        walletAddress: true,
        professionalProfile: { select: { ratePerMinute: true } },
      },
    })

    const professionalWallet = professional?.walletAddress
    if (!professionalWallet) {
      return errorResponse("El profesional no tiene wallet configurada", 400)
    }

    const ratePerMinute = professional?.professionalProfile?.ratePerMinute ?? 1200
    const totalCostCOP = ratePerMinute * data.duration
    const CELO_RATE = 0.00001
    const totalCostCELO = (totalCostCOP * CELO_RATE).toFixed(4)

    await prisma.$transaction([
      prisma.message.create({
        data: {
          requestId: request.id,
          senderId: session.user.id,
          receiverId: session.user.id === clientId ? professionalId : clientId,
          content: `Aceptación de propuesta - Opción ${selectedOption === "option1" ? "1" : "2"}`,
          messageType: "ACCEPTANCE",
          structuredData: { selectedOption, acceptedDate, duration: data.duration, proposalMessageId: messageId },
        },
      }),
      prisma.request.update({
        where: { id: request.id },
        data: { status: "NEGOTIATING" },
      }),
    ])

    return successResponse({
      acceptedDate,
      duration: data.duration,
      professionalWallet,
      totalCostCOP,
      totalCostCELO,
      professionalRate: ratePerMinute,
      clientId,
      professionalId,
      requestId: request.id,
      proposalMessageId: messageId,
    })
  } catch (error) {
    console.error("Error accepting proposal:", error)
    return serverErrorResponse("Error al aceptar la propuesta")
  }
}
