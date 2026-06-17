import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from "@/lib/api-response"

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const body = await req.json()
    const { walletAddress } = body

    if (!walletAddress) return errorResponse("walletAddress requerido", 400)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return errorResponse("Dirección wallet inválida", 400)
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress },
      select: { id: true, walletAddress: true },
    })

    return successResponse(user)
  } catch (error) {
    console.error("Error updating wallet:", error)
    return serverErrorResponse("Error al actualizar wallet")
  }
}
