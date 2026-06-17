import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const passwordHash = await bcrypt.hash("test1234", 12)

  const client = await prisma.user.upsert({
    where: { email: "cliente@test.com" },
    update: {},
    create: {
      email: "cliente@test.com",
      passwordHash,
      username: "cliente_test",
      fullName: "María García",
      role: "CLIENT",
      documentType: "CC",
      documentNumber: "1234567890",
      country: "Colombia",
      city: "Bogotá",
    },
  })

  console.log("Created client:", client.email)

  const pro = await prisma.user.upsert({
    where: { email: "abogado@test.com" },
    update: { walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
    create: {
      email: "abogado@test.com",
      passwordHash,
      username: "abogado_test",
      fullName: "Dr. Carlos Mendoza",
      role: "PROFESSIONAL",
      documentType: "CC",
      documentNumber: "9876543210",
      country: "Colombia",
      city: "Medellín",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      professionalProfile: {
        create: {
          profession: "Abogado",
          ratePerMinute: 1200,
          experienceYears: 8,
          description: "Especialista en derecho laboral y tributario con más de 8 años de experiencia.",
          categories: {
            create: [
              { name: "Laboral" },
              { name: "Tributaria" },
              { name: "Legal" },
            ],
          },
        },
      },
      bankInfo: {
        create: {
          bankName: "Bancolombia",
          accountType: "Ahorros",
          accountNumber: "123-456789-01",
          accountHolder: "Carlos Mendoza",
        },
      },
    },
  })

  console.log("Created professional:", pro.email)

  const doctor = await prisma.user.upsert({
    where: { email: "medico@test.com" },
    update: { walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
    create: {
      email: "medico@test.com",
      passwordHash,
      username: "medico_test",
      fullName: "Dra. Ana Martínez",
      role: "PROFESSIONAL",
      documentType: "CC",
      documentNumber: "5555555555",
      country: "Colombia",
      city: "Cali",
      walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      professionalProfile: {
        create: {
          profession: "Médico",
          ratePerMinute: 1000,
          experienceYears: 12,
          description: "Médica general con experiencia en consulta virtual.",
          categories: {
            create: [
              { name: "Médica" },
            ],
          },
        },
      },
      bankInfo: {
        create: {
          bankName: "Davivienda",
          accountType: "Corriente",
          accountNumber: "987-654321-00",
          accountHolder: "Ana Martínez",
        },
      },
    },
  })

  console.log("Created doctor:", doctor.email)

  const accountant = await prisma.user.upsert({
    where: { email: "contador@test.com" },
    update: { walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
    create: {
      email: "contador@test.com",
      passwordHash,
      username: "contador_test",
      fullName: "Pedro Ramírez",
      role: "PROFESSIONAL",
      documentType: "CC",
      documentNumber: "4444444444",
      country: "Colombia",
      city: "Bogotá",
      walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      professionalProfile: {
        create: {
          profession: "Contador",
          ratePerMinute: 900,
          experienceYears: 6,
          description: "Contador público especializado en declaración de renta y contabilidad para PYMES.",
          categories: {
            create: [
              { name: "Contable" },
              { name: "Tributaria" },
            ],
          },
        },
      },
      bankInfo: {
        create: {
          bankName: "Nequi",
          accountType: "Ahorros",
          accountNumber: "300-1234567",
          accountHolder: "Pedro Ramírez",
        },
      },
    },
  })

  console.log("Created accountant:", accountant.email)

  const request = await prisma.request.create({
    data: {
      clientId: client.id,
      category: "Laboral",
      title: "¿Me pueden despedir estando de incapacidad?",
      description: "Tengo una incapacidad médica de 15 días y mi jefe me amenazó con despedirme. ¿Es legal? ¿Qué puedo hacer?",
      status: "PENDING",
    },
  })

  console.log("Created request:", request.id)

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
