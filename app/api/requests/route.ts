import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const requests = await prisma.request.findMany({
      where: { clientId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        category: true,
        createdAt: true,
      },
    })

    return successResponse(requests)
  } catch (error) {
    console.error("Error fetching requests:", error)
    return serverErrorResponse("Error al obtener consultas")
  }
}
