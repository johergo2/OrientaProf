import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const userId = session.user.id

    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { clientAddress: userId },
          { professionalAddress: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
          },
        },
      },
    })

    return successResponse(transactions)
  } catch (error) {
    console.error("Error fetching payment transactions:", error)
    return serverErrorResponse("Error al obtener transacciones")
  }
}
