import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        walletAddress: true,
      },
    })

    if (!user) return unauthorizedResponse()

    return successResponse(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return serverErrorResponse("Error al obtener perfil")
  }
}
