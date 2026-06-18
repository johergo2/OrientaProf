import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { successResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse, errorResponse } from "@/lib/api-response"
import { getContractSigner, getTransaction } from "@/lib/blockchain"
import { parseEther } from "ethers"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const body = await req.json()
    const { proposalMessageId, depositTxHash, transactionIndex } = body

    if (!proposalMessageId || !depositTxHash || transactionIndex === undefined) {
      return errorResponse("proposalMessageId, depositTxHash y transactionIndex son requeridos", 400)
    }

    const acceptanceMessage = await prisma.message.findFirst({
      where: {
        requestId: { not: null },
        messageType: "ACCEPTANCE",
        request: {
          clientId: session.user.id,
          messages: { some: { id: proposalMessageId } },
        },
      },
      include: {
        request: {
          select: { id: true, clientId: true, professionalId: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!acceptanceMessage) {
      return errorResponse("No se encontró una aceptación válida", 404)
    }

    const request = acceptanceMessage.request
    if (!request) return notFoundResponse("La consulta")

    const userIsClient = request.clientId === session.user.id
    if (!userIsClient) {
      return errorResponse("Solo el cliente puede crear la cita después del depósito", 403)
    }

    const { structuredData } = acceptanceMessage
    const data = structuredData as { selectedOption: string; acceptedDate: string; duration: number } | null
    if (!data?.acceptedDate || !data?.duration) {
      return errorResponse("Datos de aceptación inválidos", 400)
    }

    const professionalId = request.professionalId
    if (!professionalId) return errorResponse("La consulta no tiene profesional asignado", 400)

    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: {
        walletAddress: true,
        professionalProfile: { select: { ratePerMinute: true } },
      },
    })

    if (!professional?.walletAddress) {
      return errorResponse("El profesional no tiene wallet configurada", 400)
    }

    const ratePerMinute = professional?.professionalProfile?.ratePerMinute ?? 1200
    const totalCost = ratePerMinute * data.duration

    const client = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletAddress: true },
    })
    if (!client?.walletAddress) {
      return errorResponse("Debes configurar tu wallet antes de agendar", 400)
    }

    const existingEscrow = await prisma.escrowTransaction.findFirst({
      where: { depositTxHash },
    })
    if (existingEscrow) {
      return errorResponse("Este depósito ya fue registrado", 409)
    }

    const onChainTx = await getTransaction(Number(transactionIndex))
    if (!onChainTx) {
      return errorResponse("Transacción no encontrada en el contrato", 404)
    }

    const CELO_RATE = 0.00001
    const expectedCelo = (totalCost * CELO_RATE).toFixed(4)
    const expectedWei = parseEther(expectedCelo)

    if (BigInt(onChainTx.amount) < expectedWei) {
      return errorResponse("El monto depositado es menor al requerido", 400)
    }
    if (onChainTx.professionalWallet.toLowerCase() !== professional.walletAddress.toLowerCase()) {
      return errorResponse("La wallet del profesional no coincide con el depósito", 400)
    }
    if (onChainTx.status !== 0) {
      return errorResponse("El depósito no está en estado PENDIENTE", 400)
    }

    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          clientId: request.clientId,
          professionalId,
          requestId: request.id,
          scheduledAt: new Date(data.acceptedDate),
          durationMinutes: data.duration,
          totalCost,
          status: "SCHEDULED",
        },
      })

      await tx.escrowTransaction.create({
        data: {
          appointmentId: appointment.id,
          transactionIndex: Number(transactionIndex),
          clientAddress: client.walletAddress!,
          professionalAddress: professional.walletAddress!,
          amount: totalCost,
          platformFee: totalCost * 0.05,
          status: "PENDIENTE",
          depositTxHash,
        },
      })

      await tx.request.update({
        where: { id: request.id },
        data: { status: "COMPLETED" },
      })

      return appointment
    })

    return successResponse(result, 201)
  } catch (error) {
    console.error("Error creating appointment from proposal:", error)
    return serverErrorResponse("Error al crear la cita")
  }
}
