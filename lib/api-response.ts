import { NextResponse } from "next/server"

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

export function unauthorizedResponse(message = "No autorizado") {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}

export function notFoundResponse(entity = "Recurso") {
  return NextResponse.json(
    { success: false, error: `${entity} no encontrado` },
    { status: 404 }
  )
}

export function validationErrorResponse(errors: unknown) {
  return NextResponse.json(
    { success: false, error: "Error de validación", data: errors },
    { status: 422 }
  )
}

export function serverErrorResponse(error?: string) {
  return NextResponse.json(
    { success: false, error: error ?? "Error interno del servidor" },
    { status: 500 }
  )
}
