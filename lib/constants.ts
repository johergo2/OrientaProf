export const RATE_MIN = 750
export const RATE_MAX = 1500
export const PLATFORM_FEE_PERCENT = 5
export const APPOINTMENT_DURATIONS = [10, 15, 20, 30] as const
export const MAX_MESSAGE_LENGTH = 2000

export const REQUEST_CATEGORIES = [
  "Tributaria",
  "Laboral",
  "Médica",
  "Legal",
  "Emprendimiento",
  "Financiera",
  "Contable",
  "Inmobiliaria",
  "Tecnología",
  "Educación",
] as const

export const DOCUMENT_TYPES = ["CC", "CE", "NIT", "Pasaporte"] as const
export const ACCOUNT_TYPES = ["Ahorros", "Corriente"] as const
export const GENDER_OPTIONS = [
  "Masculino",
  "Femenino",
  "Otro",
  "Prefiero no decirlo",
] as const

export const ROLES = {
  CLIENT: "CLIENT" as const,
  PROFESSIONAL: "PROFESSIONAL" as const,
}

export const APP_NAME = "OrientaProf"
export const APP_DESCRIPTION = "Orientación con Profesionales"

export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    CALLBACK: "/api/auth/callback",
  },
  USERS: {
    ME: "/api/users/me",
  },
  REQUESTS: {
    BASE: "/api/requests",
  },
  MESSAGES: {
    BASE: "/api/messages",
  },
  APPOINTMENTS: {
    BASE: "/api/appointments",
  },
  PROFESSIONALS: {
    BASE: "/api/professionals",
    RATE: "/api/professionals/rate",
  },
  PAYMENTS: {
    WEBHOOK: "/api/payments/webhook",
  },
} as const
