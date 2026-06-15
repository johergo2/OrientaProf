import { prisma } from "@/lib/prisma"
import { successResponse, serverErrorResponse } from "@/lib/api-response"

export async function GET() {
  try {
    const professionals = await prisma.user.findMany({
      where: { role: "PROFESSIONAL", isActive: true },
      select: {
        id: true,
        username: true,
        fullName: true,
        professionalProfile: {
          select: {
            profession: true,
            ratePerMinute: true,
            rating: true,
            ratingCount: true,
            experienceYears: true,
            description: true,
            diplomaFile: true,
            categories: {
              select: { name: true },
            },
          },
        },
      },
    })

    const categories = await prisma.professionalCategory.findMany({
      select: { name: true },
      distinct: ["name"],
      orderBy: { name: "asc" },
    })

    return successResponse({ professionals, categories: categories.map((c) => c.name) })
  } catch (error) {
    console.error("Error fetching professionals:", error)
    return serverErrorResponse("Error al obtener profesionales")
  }
}
