import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { acceptProposalSchema } from "@/lib/validations"
import { callDeposit } from "@/lib/blockchain"
import { successResponse, unauthorizedResponse, validationErrorResponse, serverErrorResponse, notFoundResponse, errorResponse } from "@/lib/api-response"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const body = await req.json()
    const parsed = acceptProposalSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors)
    }

    const { selectedOption, proposalMessageId } = parsed.data

    const message = await prisma.message.findUnique({
      where: { id: proposalMessageId },
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
    if (message.senderId !== session.user.id && message.receiverId !== session.user.id) {
      return errorResponse("No eres parte de esta conversación", 403)
    }

    const proposalData = message.structuredData as { option1: string; option2: string; duration: number } | null
    if (!proposalData?.option1 || !proposalData?.option2 || !proposalData?.duration) {
      return errorResponse("Datos de propuesta inválidos", 400)
    }

    const acceptedDate = proposalData[selectedOption]
    if (!acceptedDate) {
      return errorResponse("Opción seleccionada inválida", 400)
    }

    const request = message.request
    if (!request) return errorResponse("La consulta ya no existe", 404)
    if (!request.professionalId) return errorResponse("La consulta no tiene profesional asignado", 400)

    const professional = await prisma.user.findUnique({
      where: { id: request.professionalId },
      select: { walletAddress: true, professionalProfile: { select: { ratePerMinute: true } } },
    })
    if (!professional?.walletAddress) {
      return errorResponse("El profesional no tiene wallet configurada", 400)
    }

    const ratePerMinute = professional?.professionalProfile?.ratePerMinute ?? 1200
    const totalCostCOP = ratePerMinute * proposalData.duration
    const CELO_RATE = 0.00001
    const totalCostCELO = (totalCostCOP * CELO_RATE).toFixed(4)

    const { txHash, transactionIndex } = await callDeposit(
      proposalMessageId,
      professional.walletAddress,
      totalCostCELO
    )

    if (transactionIndex === undefined) {
      return errorResponse("No se pudo obtener el índice de la transacción on-chain", 500)
    }

    const client = await prisma.user.findUnique({
      where: { id: request.clientId },
      select: { walletAddress: true },
    })
    if (!client?.walletAddress) {
      console.error("accept-and-pay: cliente sin wallet", { clientId: request.clientId })
      return errorResponse("El cliente no tiene wallet configurada", 400)
    }

    console.log("accept-and-pay: creando cita en BD", { requestId: request.id, acceptedDate, duration: proposalData.duration })

    let appointment
    try {
      appointment = await prisma.appointment.create({
        data: {
          clientId: request.clientId,
          professionalId: request.professionalId!,
          requestId: request.id,
          scheduledAt: new Date(acceptedDate),
          durationMinutes: proposalData.duration,
          totalCost: totalCostCOP,
          status: "SCHEDULED",
        },
      })
      console.log("accept-and-pay: cita creada", { appointmentId: appointment.id })
    } catch (err) {
      console.error("accept-and-pay: error al crear cita", err)
      return serverErrorResponse("Error al crear la cita en BD")
    }

    try {
      await prisma.escrowTransaction.create({
        data: {
          appointmentId: appointment.id,
          transactionIndex,
          clientAddress: client.walletAddress!,
          professionalAddress: professional.walletAddress!,
          amount: totalCostCOP,
          platformFee: totalCostCOP * 0.05,
          status: "PENDIENTE",
          depositTxHash: txHash,
        },
      })
      console.log("accept-and-pay: escrow creado", { appointmentId: appointment.id })
    } catch (err) {
      console.error("accept-and-pay: error al crear escrow", err)
      await prisma.appointment.delete({ where: { id: appointment.id } })
      return serverErrorResponse("Error al crear el escrow en BD")
    }

    try {
      await prisma.request.update({
        where: { id: request.id },
        data: { status: "COMPLETED" },
      })
      console.log("accept-and-pay: request actualizada a COMPLETED")
    } catch (err) {
      console.error("accept-and-pay: error al actualizar request", err)
      await prisma.escrowTransaction.delete({ where: { appointmentId: appointment.id } })
      await prisma.appointment.delete({ where: { id: appointment.id } })
      return serverErrorResponse("Error al actualizar la consulta")
    }

    return successResponse(appointment, 201)
  } catch (error) {
    console.error("Error in accept-and-pay:", error)
    return serverErrorResponse("Error al procesar la aceptación y pago")
  }
}
