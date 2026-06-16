import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requestSchema } from "@/lib/validations"
import { successResponse, unauthorizedResponse, validationErrorResponse, serverErrorResponse } from "@/lib/api-response"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    if (session.user.role !== "CLIENT") {
      return unauthorizedResponse("Solo los clientes pueden crear consultas")
    }

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors)
    }

    const { category, title, description, professionalId } = parsed.data

    const request = await prisma.request.create({
      data: {
        clientId: session.user.id,
        category,
        title,
        description,
        professionalId: professionalId ?? null,
      },
      select: {
        id: true,
        category: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
      },
    })

    return successResponse(request, 201)
  } catch (error) {
    console.error("Error creating request:", error)
    return serverErrorResponse("Error al crear consulta")
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const role = session.user.role

    if (role === "PROFESSIONAL") {
      const requests = await prisma.request.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          category: true,
          createdAt: true,
          client: {
            select: { username: true },
          },
        },
      })

      const professionalUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true },
      })

      const categories = await prisma.request.findMany({
        where: { status: "PENDING" },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      })

      return successResponse({
        requests,
        categories: categories.map((c) => c.category),
        professionalUsername: professionalUser?.username ?? "",
      })
    }

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
