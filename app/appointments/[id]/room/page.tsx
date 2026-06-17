"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si"

type Appointment = {
  id: string
  scheduledAt: string
  durationMinutes: number
  status: string
  clientConfirmed: boolean
  professionalConfirmed: boolean
  client: { id: string; username: string; fullName: string }
  professional: { id: string; username: string; fullName: string }
  request: { id: string; title: string } | null
}

export default function VideoRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"fetching" | "joining" | "ready">("fetching")
  const [completing, setCompleting] = useState(false)

  async function handleComplete() {
    setCompleting(true)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/complete`, { method: "POST" })
      const json = await res.json()
      if (json.success) {
        router.push("/appointments")
      } else {
        setError(json.error ?? "Error al finalizar la videollamada")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setCompleting(false)
    }
  }

  const appointmentId = params.id as string

  useEffect(() => {
    if (!session) return

    fetch(`/api/appointments/${appointmentId}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) {
          setError(res.error ?? "Cita no encontrada")
          return
        }
        setAppointment(res.data)
        setStep("joining")
        return fetch(`/api/appointments/${appointmentId}/join`, { method: "POST" })
      })
      .then((joinRes: Response | undefined) => joinRes?.json())
      .then((joinJson: any) => {
        if (joinJson && !joinJson.success) {
          setError(joinJson.error ?? "Error al ingresar a la videollamada")
          return
        }
        setStep("ready")
      })
      .catch(() => setError("Error de conexión"))
  }, [session, appointmentId])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mint p-5">
        <p className="text-muted text-sm">Inicia sesión para acceder</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mint p-5">
        <div className="w-full max-w-[420px] bg-white rounded-[28px] p-6 grid gap-4 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/appointments")}
            className="bg-brand-700 text-white rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-brand-900 transition-colors"
          >
            Volver a mis citas
          </button>
        </div>
      </div>
    )
  }

  const roomName = `OrientaProf-${appointmentId}`

  return (
    <div className="flex items-start justify-center min-h-screen bg-black p-0">
      <div className="relative w-full max-w-[420px] min-h-[860px] bg-mint flex flex-col">
        <header className="flex items-center justify-between p-[22px] bg-mint z-10">
          <button
            type="button"
            onClick={() => router.push("/appointments")}
            className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center cursor-pointer hover:bg-brand-100 transition-colors"
            aria-label="Salir de la videollamada"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18312a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            {appointment && (
              <>
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-brand-700 text-[10px] font-bold">
                    {appointment.professional.username?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                </div>
                <span className="text-ink text-sm font-bold truncate">
                  {appointment.professional.username}
                </span>
              </>
            )}
          </div>

          <div className="w-9" />
        </header>

        {step === "ready" ? (
          <div className="flex-1 flex flex-col">
            <iframe
              src={`https://${JITSI_DOMAIN}/${roomName}#config.prejoinPageEnabled=false&config.lang=es&config.disableInviteFunctions=true`}
              allow="camera; microphone; display-capture; autoplay"
              className="flex-1 w-full border-0"
              style={{ minHeight: 0 }}
            />
            <div className="p-3 bg-mint border-t border-line">
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className="w-full bg-brand-700 text-white rounded-lg py-3 text-sm font-bold cursor-pointer hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completing ? "Finalizando..." : "Finalizar videollamada"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-brand-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted text-sm">
              {step === "fetching" ? "Verificando cita..." : "Ingresando a la videollamada..."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
