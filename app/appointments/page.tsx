"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

const DURATIONS = [10, 15, 20, 30] as const

type Appointment = {
  id: string
  scheduledAt: string
  durationMinutes: number
  totalCost: number | null
  status: string
  createdAt: string
  clientConfirmed: boolean
  professionalConfirmed: boolean
  client: { id: string; username: string; fullName: string; walletAddress: string | null }
  professional: { id: string; username: string; fullName: string; walletAddress: string | null }
  request: { id: string; title: string } | null
  paymentProcessed?: boolean
}

const CELO_RATE = 0.00001

function costToCelo(copAmount: number | null): string {
  if (copAmount == null || copAmount <= 0) return "0.001"
  return (copAmount * CELO_RATE).toFixed(4)
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  CONFIRMED_CLIENT: "Cliente confirmó",
  CONFIRMED_BOTH: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming")

  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState("")

  const [joinError, setJoinError] = useState("")

  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [rsNewDate, setRsNewDate] = useState("")
  const [rsDuration, setRsDuration] = useState(20)
  const [rsSending, setRsSending] = useState(false)
  const [rsError, setRsError] = useState("")

  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState("")

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAppointments(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  function goBack() {
    if (session?.user?.role === "PROFESSIONAL") {
      router.push("/dashboard/professional")
    } else {
      router.push("/dashboard/client")
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("es-CO", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  function getOtherUser(a: Appointment) {
    if (!session?.user) return null
    return session.user.id === a.client.id ? a.professional : a.client
  }

  function formatCost(cost: number | null) {
    if (cost == null) return "—"
    return `$${cost.toLocaleString("es-CO")} COP`
  }

  function isAppActive(a: Appointment) {
    return a.status !== "COMPLETED" && a.status !== "CANCELLED"
  }

  function windowEndMs(a: Appointment) {
    return new Date(a.scheduledAt).getTime() + a.durationMinutes * 60 * 1000
  }

  function canJoin(a: Appointment): boolean {
    if (!isAppActive(a)) return false
    const now = Date.now()
    const start = new Date(a.scheduledAt).getTime()
    const end = windowEndMs(a)
    return now <= end
  }

  function canCancel(a: Appointment): boolean {
    if (!isAppActive(a)) return false
    return new Date(a.scheduledAt).getTime() > Date.now()
  }

  function canReschedule(a: Appointment): boolean {
    return isAppActive(a)
  }

  function getScenario(a: Appointment): 1 | 2 | 3 | 4 | null {
    if (!isAppActive(a)) return null
    if (Date.now() <= windowEndMs(a)) return null

    if (a.clientConfirmed && a.professionalConfirmed) return 3
    if (a.clientConfirmed && !a.professionalConfirmed) return 1
    if (!a.clientConfirmed && a.professionalConfirmed) return 2
    return 4
  }

  async function handleCancel(appointmentId: string) {
    setCancelError("")
    setCancellingId(appointmentId)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/cancel`, { method: "POST" })
      const json = await res.json()
      if (!json.success) {
        setCancelError(json.error ?? "Error al cancelar la cita")
        return
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: "CANCELLED" } : a))
      )
    } catch {
      setCancelError("Error de conexión al cancelar la cita")
    } finally {
      setCancellingId(null)
    }
  }

  async function handleRequestRefund(appointmentId: string) {
    setPaymentError("")
    setProcessingPayment(true)
    try {
      const res = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      })
      const json = await res.json()
      if (!json.success) {
        setPaymentError(json.error ?? "Error al solicitar reembolso")
        return
      }
      alert("Reembolso procesado exitosamente")
    } catch {
      setPaymentError("Error de conexión")
    } finally {
      setProcessingPayment(false)
    }
  }

  async function handleRequestPayment(appointmentId: string) {
    setPaymentError("")
    setProcessingPayment(true)
    try {
      const res = await fetch("/api/payments/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      })
      const json = await res.json()
      if (!json.success) {
        setPaymentError(json.error ?? "Error al solicitar pago")
        return
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: "COMPLETED" } : a))
      )
    } catch {
      setPaymentError("Error de conexión")
    } finally {
      setProcessingPayment(false)
    }
  }

  async function handleReschedule() {
    setRsError("")

    if (!rsNewDate) { setRsError("Seleccione la nueva fecha"); return }

    const newDate = new Date(rsNewDate)
    if (newDate <= new Date()) { setRsError("La nueva fecha debe ser futura"); return }

    if (!rescheduleTarget) return

    setRsSending(true)
    try {
      const res = await fetch(`/api/appointments/${rescheduleTarget.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: newDate.toISOString(),
          durationMinutes: rsDuration,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setRsError(json.error ?? "Error al reagendar la cita")
        return
      }
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === rescheduleTarget.id
            ? { ...a, scheduledAt: newDate.toISOString(), durationMinutes: rsDuration }
            : a
        )
      )
      setRescheduleTarget(null)
      setRsNewDate("")
      setRsDuration(20)
    } catch {
      setRsError("Error de conexión al reagendar")
    } finally {
      setRsSending(false)
    }
  }

  const filtered =
    tab === "upcoming"
      ? appointments.filter((a) => !["COMPLETED", "CANCELLED"].includes(a.status))
      : tab === "completed"
        ? appointments.filter((a) => a.status === "COMPLETED")
        : appointments.filter((a) => a.status === "CANCELLED")

  return (
    <div className="flex items-start justify-center min-h-screen p-5">
      <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center cursor-pointer hover:bg-brand-100 transition-colors"
            aria-label="Volver"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18312a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <h1 className="text-ink text-lg font-bold">Mis Citas</h1>

          <div className="w-9" />
        </header>

        <div className="flex border border-line rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`flex-1 py-2.5 text-sm font-bold text-center cursor-pointer transition-colors ${
              tab === "upcoming" ? "bg-brand-700 text-white" : "bg-white text-muted hover:bg-brand-100"
            }`}
          >
            Próximas
          </button>
          <button
            type="button"
            onClick={() => setTab("completed")}
            className={`flex-1 py-2.5 text-sm font-bold text-center cursor-pointer transition-colors ${
              tab === "completed" ? "bg-brand-700 text-white" : "bg-white text-muted hover:bg-brand-100"
            }`}
          >
            Completadas
          </button>
          <button
            type="button"
            onClick={() => setTab("cancelled")}
            className={`flex-1 py-2.5 text-sm font-bold text-center cursor-pointer transition-colors ${
              tab === "cancelled" ? "bg-brand-700 text-white" : "bg-white text-muted hover:bg-brand-100"
            }`}
          >
            Canceladas
          </button>
        </div>

        {cancelError && <p className="text-red-500 text-xs text-center">{cancelError}</p>}
        {joinError && <p className="text-red-500 text-xs text-center">{joinError}</p>}
        {paymentError && <p className="text-red-500 text-xs text-center">{paymentError}</p>}

        {loading ? (
          <p className="text-muted text-sm text-center py-10">Cargando citas...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-brand-100 grid place-items-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#11a36a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-muted text-sm text-center">
              No tienes citas {tab === "upcoming" ? "programadas" : tab === "completed" ? "completadas" : "canceladas"}.
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {filtered.map((a) => {
              const other = getOtherUser(a)
              const isClient = session?.user?.id === a.client.id
              const hasJoined = isClient ? a.clientConfirmed : a.professionalConfirmed
              const scenario = getScenario(a)

              return (
                <div key={a.id} className="bg-white border border-line rounded-lg p-3 grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <span className="text-brand-700 text-xs font-bold">
                          {other?.username?.charAt(0).toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <strong className="text-ink text-sm font-bold block truncate">
                          {other?.username ?? "Usuario"}
                        </strong>
                        {a.request && (
                          <span className="text-muted text-[11px] block truncate">{a.request.title}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        a.status === "CANCELLED"
                          ? "bg-red-100 text-red-500"
                          : a.status === "COMPLETED"
                            ? "bg-brand-100 text-brand-700"
                            : "bg-amber/20 text-amber"
                      }`}
                    >
                      {statusLabels[a.status] ?? a.status}
                    </span>
                  </div>

                  <div className="grid gap-1 text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{formatDate(a.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{a.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      <span>{formatCost(a.totalCost)} ({costToCelo(a.totalCost)} CELO)</span>
                    </div>
                  </div>

                  {hasJoined && (
                    <p className="text-brand-700 text-xs font-bold">Ya ingresaste a la videollamada</p>
                  )}

                  {scenario === 1 && (
                    <div className="bg-amber/10 border border-amber/30 rounded-lg p-2.5 grid gap-1.5">
                      <p className="text-ink text-[12px] font-bold">Cliente ingresó, profesional no</p>
                      {isClient && (
                        <p className="text-muted text-[11px]">
                          Puedes solicitar un reembolso (se descuenta comisión de OrientaProf) o proponer nuevas fechas.
                        </p>
                      )}
                      {!isClient && (
                        <p className="text-muted text-[11px]">
                          El cliente ingresó pero tú no. Pueden acordar una nueva fecha.
                        </p>
                      )}
                    </div>
                  )}

                  {scenario === 2 && (
                    <div className="bg-amber/10 border border-amber/30 rounded-lg p-2.5 grid gap-1.5">
                      <p className="text-ink text-[12px] font-bold">Profesional ingresó, cliente no</p>
                      {!isClient && (
                        <p className="text-muted text-[11px]">
                          Puedes solicitar el pago de tus servicios (se descuenta comisión de OrientaProf) o proponer nuevas fechas.
                        </p>
                      )}
                      {isClient && (
                        <p className="text-muted text-[11px]">
                          El profesional ingresó pero tú no. Pueden acordar una nueva fecha.
                        </p>
                      )}
                    </div>
                  )}

                  {scenario === 4 && (
                    <div className="bg-amber/10 border border-amber/30 rounded-lg p-2.5 grid gap-1.5">
                      <p className="text-ink text-[12px] font-bold">Ninguno ingresó a la videollamada</p>
                      <p className="text-muted text-[11px]">
                        {isClient
                          ? "Puedes solicitar un reembolso (se descuenta comisión de OrientaProf) o proponer nuevas fechas."
                          : "Puedes proponer nuevas fechas para reagendar. No puedes solicitar pago porque ninguno ingresó."}
                      </p>
                    </div>
                  )}

                  {canJoin(a) && (
                    <button
                      type="button"
                      onClick={() => router.push(`/appointments/${a.id}/room`)}
                      className="w-full bg-brand-700 text-white rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)]"
                    >
                      Ingresar a videollamada
                    </button>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {canCancel(a) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(a.id)}
                        disabled={cancellingId === a.id}
                        className="flex-1 min-w-[100px] border border-red-400 text-red-500 rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === a.id ? "Cancelando..." : "Cancelar cita"}
                      </button>
                    )}

                    {canReschedule(a) && (
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleTarget(a)
                          setRsNewDate("")
                          setRsDuration(a.durationMinutes)
                          setRsError("")
                        }}
                        className="flex-1 min-w-[100px] border border-amber text-amber rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-amber/10 transition-colors"
                      >
                        Reagendar
                      </button>
                    )}

                    {scenario !== null && scenario !== 3 && isClient && (scenario === 1 || scenario === 4) && (
                      <button
                        type="button"
                        onClick={() => handleRequestRefund(a.id)}
                        disabled={processingPayment}
                        className="flex-1 min-w-[100px] border border-brand-700 text-brand-700 rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-brand-100 transition-colors disabled:opacity-50"
                      >
                        {processingPayment ? "Procesando..." : "Solicitar reembolso"}
                      </button>
                    )}

                    {scenario === 2 && !isClient && (
                      <button
                        type="button"
                        onClick={() => handleRequestPayment(a.id)}
                        disabled={processingPayment}
                        className="flex-1 min-w-[100px] border border-brand-700 text-brand-700 rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-brand-100 transition-colors disabled:opacity-50"
                      >
                        {processingPayment ? "Procesando..." : "Solicitar pago"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rescheduleTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5">
          <div className="w-full max-w-[380px] bg-white rounded-[20px] p-5 grid gap-4 shadow-2xl">
            <h3 className="text-ink text-base font-bold text-center">Reagendar cita</h3>

            <div className="grid gap-3">
              <div>
                <label className="text-ink text-[12px] font-bold block mb-1">Nueva fecha</label>
                <input
                  type="datetime-local"
                  value={rsNewDate}
                  onChange={(e) => { setRsNewDate(e.target.value); setRsError("") }}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-ink text-[12px] font-bold block mb-1">Duración</label>
                <select
                  value={rsDuration}
                  onChange={(e) => setRsDuration(Number(e.target.value))}
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d} minutos</option>
                  ))}
                </select>
              </div>
            </div>

            {rsError && <p className="text-red-500 text-xs text-center">{rsError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setRescheduleTarget(null); setRsNewDate(""); setRsError("") }}
                className="flex-1 border border-line text-muted rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-brand-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReschedule}
                disabled={rsSending}
                className="flex-1 bg-brand-700 text-white rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rsSending ? "Reagendando..." : "Reagendar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
