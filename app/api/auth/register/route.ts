import { prisma } from "@/lib/prisma"
import { registerClientSchema, registerProfessionalSchema } from "@/lib/validations"
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from "@/lib/api-response"
import bcrypt from "bcryptjs"
import { generateUsername } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { role } = body

    if (!role || !["CLIENT", "PROFESSIONAL"].includes(role)) {
      return errorResponse("Rol inválido. Debe ser CLIENT o PROFESSIONAL")
    }

    const schema = role === "PROFESSIONAL" ? registerProfessionalSchema : registerClientSchema
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors)
    }

    const data = parsed.data

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
        ],
      },
    })

    if (existingUser) {
      return errorResponse("El email ya está registrado", 409)
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    const username = generateUsername(data.email)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        username,
        role,
        fullName: data.fullName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        gender: data.gender,
        country: data.country,
        city: data.city,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        walletAddress: data.walletAddress,
        ...(role === "PROFESSIONAL"
          ? {
              professionalProfile: {
                create: {
                  profession: (data as any).profession,
                  ratePerMinute: (data as any).ratePerMinute,
                  experienceYears: (data as any).experienceYears,
                  description: (data as any).description,
                  categories: {
                    create: (data as any).categories?.map((name: string) => ({ name })),
                  },
                },
              },
              bankInfo: {
                create: {
                  country: (data as any).bankCountry ?? "Colombia",
                  bankName: (data as any).bankName,
                  accountType: (data as any).accountType,
                  accountNumber: (data as any).accountNumber,
                  accountHolder: (data as any).accountHolder,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        walletAddress: true,
        createdAt: true,
      },
    })

    return successResponse(user, 201)
  } catch (error) {
    console.error("Error registering user:", error)
    return serverErrorResponse("Error al registrar usuario")
  }
}
