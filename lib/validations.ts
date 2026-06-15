import { z } from "zod"

export const registerClientSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  fullName: z.string().min(3, "Nombre muy corto"),
  documentType: z.enum(["CC", "CE", "NIT", "Pasaporte"]).optional(),
  documentNumber: z.string().min(5).max(20).optional(),
  gender: z.enum(["Masculino", "Femenino", "Otro", "Prefiero no decirlo"]).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección CELO inválida (0x + 40 caracteres)").optional(),
})

export const registerProfessionalSchema = registerClientSchema.extend({
  profession: z.string().min(3, "Profesión requerida"),
  ratePerMinute: z.coerce.number().min(750).max(1500, "Tarifa debe ser entre 750 y 1500 COP"),
  experienceYears: z.coerce.number().int().min(0).optional(),
  description: z.string().max(500).optional(),
  categories: z.array(z.string()).min(1, "Al menos una categoría"),
  bankName: z.string().min(3, "Nombre del banco requerido"),
  accountType: z.enum(["Ahorros", "Corriente"]),
  accountNumber: z.string().min(5, "Número de cuenta requerido"),
  accountHolder: z.string().min(3, "Titular de cuenta requerido"),
})

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
})

export const requestSchema = z.object({
  category: z.string().min(1, "Categoría requerida"),
  title: z.string().min(10, "Título muy corto (mín 10 caracteres)"),
  description: z.string().min(20, "Descripción muy corta (mín 20 caracteres)"),
  professionalId: z.string().optional(),
})

export const messageSchema = z.object({
  requestId: z.string().optional(),
  receiverId: z.string().min(1, "Destinatario requerido"),
  content: z.string().min(1, "Mensaje vacío").max(2000),
})

export const appointmentSchema = z.object({
  professionalId: z.string().min(1, "Profesional requerido"),
  requestId: z.string().optional(),
  scheduledAt: z.string().min(1, "Fecha y hora requerida"),
  durationMinutes: z.coerce.number().refine(
    (val) => [10, 15, 20, 30].includes(val),
    "Duración debe ser 10, 15, 20 o 30 minutos"
  ),
})

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Contraseñas no coinciden",
  path: ["confirmPassword"],
})

export const professionalRateSchema = z.object({
  ratePerMinute: z.coerce.number().min(750).max(1500, "Tarifa debe ser entre 750 y 1500 COP"),
})

export type RegisterClientInput = z.infer<typeof registerClientSchema>
export type RegisterProfessionalInput = z.infer<typeof registerProfessionalSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RequestInput = z.infer<typeof requestSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type AppointmentInput = z.infer<typeof appointmentSchema>
