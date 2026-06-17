"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { parseProposalMessage, formatProposalMessage } from "@/lib/proposal-utils"

const DURATIONS = [10, 15, 20, 30] as const

type Message = {
  id: string
  content: string
  senderId: string
  receiverId: string
  read: boolean
  createdAt: string
}

type ConversationData = {
  currentUserId: string
  currentUserRole: string
  request: { id: string; title: string; status: string; clientId: string; professionalId: string | null }
  otherUser: { id: string; username: string; fullName: string } | null
  messages: Message[]
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.conversationId as string

  const [data, setData] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState("")

  const [option1, setOption1] = useState("")
  const [option2, setOption2] = useState("")
  const [selectedDuration, setSelectedDuration] = useState<number>(20)
  const [proposing, setProposing] = useState(false)
  const [proposalError, setProposalError] = useState("")
  const [proposalSuccess, setProposalSuccess] = useState(false)

  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [acceptError, setAcceptError] = useState("")
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null)

  const [showCounterModal, setShowCounterModal] = useState(false)
  const [counterOption1, setCounterOption1] = useState("")
  const [counterOption2, setCounterOption2] = useState("")
  const [counterDuration, setCounterDuration] = useState<number>(20)
  const [counterSending, setCounterSending] = useState(false)
  const [counterError, setCounterError] = useState("")

  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/messages?requestId=${conversationId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [data?.messages])

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
  }

  function formatDateLong(raw: string) {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    return d.toLocaleDateString("es-CO", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  function goBack() {
    router.push("/messages")
  }

  async function handleSend() {
    setSendError("")

    if (!newMessage.trim()) {
      setSendError("El mensaje no puede estar vacío")
      return
    }

    if (!data?.otherUser) {
      setSendError("No se puede enviar el mensaje: destinatario no disponible")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: data.otherUser.id,
          requestId: conversationId,
          content: newMessage.trim(),
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setSendError(json.error ?? "Error al enviar mensaje")
        return
      }

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: json.data.id,
              content: json.data.content,
              senderId: json.data.senderId,
              receiverId: json.data.receiverId,
              read: json.data.read,
              createdAt: json.data.createdAt,
            },
          ],
        }
      })
      setNewMessage("")
    } catch {
      setSendError("Error de conexión al enviar mensaje")
    } finally {
      setSending(false)
    }
  }

  async function handlePropose() {
    setProposalError("")
    setProposalSuccess(false)

    if (!option1) {
      setProposalError("Seleccione la Opción 1 de fecha y hora")
      return
    }
    if (!option2) {
      setProposalError("Seleccione la Opción 2 de fecha y hora")
      return
    }

    const date1 = new Date(option1)
    const date2 = new Date(option2)

    if (date1 <= new Date()) {
      setProposalError("La Opción 1 debe ser una fecha futura")
      return
    }
    if (date2 <= new Date()) {
      setProposalError("La Opción 2 debe ser una fecha futura")
      return
    }

    if (!data?.otherUser) {
      setProposalError("Destinatario no disponible")
      return
    }

    const content = formatProposalMessage({
      option1: date1.toISOString(),
      option2: date2.toISOString(),
      duration: selectedDuration,
    })

    setProposing(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: data.otherUser.id,
          requestId: conversationId,
          content,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setProposalError(json.error ?? "Error al enviar propuesta")
        return
      }

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: json.data.id,
              content: json.data.content,
              senderId: json.data.senderId,
              receiverId: json.data.receiverId,
              read: json.data.read,
              createdAt: json.data.createdAt,
            },
          ],
        }
      })
      setProposalSuccess(true)
      setOption1("")
      setOption2("")
      setSelectedDuration(20)
    } catch {
      setProposalError("Error de conexión al enviar propuesta")
    } finally {
      setProposing(false)
    }
  }

  async function handleAcceptOption(msgId: string, optionIso: string, duration: number) {
    setAcceptError("")
    setAcceptingId(msgId)

    const professionalId = data?.request.professionalId ?? data?.otherUser?.id

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId,
          requestId: conversationId,
          scheduledAt: optionIso,
          durationMinutes: duration,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setAcceptError(json.error ?? "Error al agendar la cita")
        return
      }

      setCreatedAppointmentId(json.data.id)
    } catch {
      setAcceptError("Error de conexión al agendar la cita")
    } finally {
      setAcceptingId(null)
    }
  }

  async function handleSendCounterProposal() {
    setCounterError("")

    if (!counterOption1) {
      setCounterError("Seleccione la Opción 1 de fecha y hora")
      return
    }
    if (!counterOption2) {
      setCounterError("Seleccione la Opción 2 de fecha y hora")
      return
    }

    const date1 = new Date(counterOption1)
    const date2 = new Date(counterOption2)

    if (date1 <= new Date()) {
      setCounterError("La Opción 1 debe ser una fecha futura")
      return
    }
    if (date2 <= new Date()) {
      setCounterError("La Opción 2 debe ser una fecha futura")
      return
    }

    if (!data?.otherUser) {
      setCounterError("Destinatario no disponible")
      return
    }

    const content = formatProposalMessage({
      option1: date1.toISOString(),
      option2: date2.toISOString(),
      duration: counterDuration,
    })

    setCounterSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: data.otherUser.id,
          requestId: conversationId,
          content,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setCounterError(json.error ?? "Error al enviar propuesta")
        return
      }

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: json.data.id,
              content: json.data.content,
              senderId: json.data.senderId,
              receiverId: json.data.receiverId,
              read: json.data.read,
              createdAt: json.data.createdAt,
            },
          ],
        }
      })
      setShowCounterModal(false)
      setCounterOption1("")
      setCounterOption2("")
      setCounterDuration(20)
    } catch {
      setCounterError("Error de conexión al enviar propuesta")
    } finally {
      setCounterSending(false)
    }
  }

  async function handleCancel() {
    setCancelError("")

    if (!confirm("¿Está seguro de dar por terminada esta consulta?")) return

    setCancelling(true)
    try {
      const res = await fetch(`/api/requests/${conversationId}/cancel`, {
        method: "POST",
      })
      const json = await res.json()
      if (!json.success) {
        setCancelError(json.error ?? "Error al cancelar consulta")
        return
      }

      setData((prev) => {
        if (!prev) return prev
        return { ...prev, request: { ...prev.request, status: "CANCELLED" } }
      })
    } catch {
      setCancelError("Error de conexión al cancelar consulta")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-start justify-center min-h-screen p-5">
        <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
          <p className="text-muted text-sm text-center py-4">Cargando conversación...</p>
        </div>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="flex items-start justify-center min-h-screen p-5">
        <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
          <p className="text-muted text-sm text-center py-4">La conversación solicitada no fue encontrada.</p>
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="w-full bg-brand-700 text-white rounded-lg py-3 font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)]"
          >
            Volver a mensajes
          </button>
        </div>
      </div>
    )
  }

  const isClient = data.currentUserRole === "CLIENT"
  const isResponded = data.request.status === "RESPONDED"
  const isCancelled = data.request.status === "CANCELLED"
  const otherName = data.otherUser?.username ?? "Usuario"

  return (
    <div className="flex items-start justify-center min-h-screen p-5">
      <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden flex flex-col">
        <header className="flex items-center justify-between p-[22px] pb-3 border-b border-line">
          <button
            type="button"
            onClick={goBack}
            className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center cursor-pointer hover:bg-brand-100 transition-colors shrink-0"
            aria-label="Volver"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18312a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="text-center min-w-0 px-2">
            <h1 className="text-ink text-base font-bold truncate">{otherName}</h1>
            <p className="text-muted text-[11px] truncate">{data.request.title}</p>
          </div>

          <div className="w-9 shrink-0" />
        </header>

        <div className="flex-1 overflow-y-auto p-[22px] grid gap-3 content-start">
          {data.messages.length === 0 ? (
            <p className="text-muted text-sm text-center py-10">No hay mensajes en esta conversación.</p>
          ) : (
            data.messages.map((msg, i) => {
              const isMine = msg.senderId === data.currentUserId
              const proposal = parseProposalMessage(msg.content)
              const showDate =
                i === 0 ||
                new Date(msg.createdAt).toDateString() !==
                  new Date(data.messages[i - 1].createdAt).toDateString()

              return (
                <div key={msg.id}>
                  {showDate && (
                    <p className="text-center text-[11px] text-muted py-2">
                      {new Date(msg.createdAt).toLocaleDateString("es-CO", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </p>
                  )}

                  {proposal ? (
                    <div className="grid gap-2">
                      <div className="bg-amber/10 border border-amber/30 rounded-lg p-3 grid gap-2">
                        <p className="text-ink text-sm font-bold">📅 Propuesta de agendamiento</p>
                        <div className="grid gap-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                            <span className="text-muted">Opción 1:</span>
                            <span className="text-ink font-bold">{formatDateLong(proposal.option1)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                            <span className="text-muted">Opción 2:</span>
                            <span className="text-ink font-bold">{formatDateLong(proposal.option2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted">Duración:</span>
                            <span className="text-ink font-bold">{proposal.duration} min</span>
                          </div>
                        </div>

                        {!isMine && !createdAppointmentId && isResponded && (
                          <div className="grid gap-1.5 pt-1">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleAcceptOption(msg.id, proposal.option1, proposal.duration)}
                                disabled={acceptingId === msg.id}
                                className="flex-1 bg-brand-700 text-white rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {acceptingId === msg.id ? "Agendando..." : "Aceptar Opción 1"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAcceptOption(msg.id, proposal.option2, proposal.duration)}
                                disabled={acceptingId === msg.id}
                                className="flex-1 bg-brand-700 text-white rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {acceptingId === msg.id ? "Agendando..." : "Aceptar Opción 2"}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowCounterModal(true)}
                              className="w-full border border-amber text-amber rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-amber/10 transition-colors"
                            >
                              Proponer nuevas fechas
                            </button>
                          </div>
                        )}

                        {createdAppointmentId && (
                          <p className="text-brand-700 text-xs font-bold text-center">
                            Cita agendada exitosamente
                          </p>
                        )}
                      </div>

                      <p className={`text-[10px] ${isMine ? "text-right text-white/70" : "text-left text-muted"}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  ) : (
                    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          isMine
                            ? "bg-brand-700 text-white rounded-br-sm"
                            : "bg-white border border-line text-ink rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? "text-white/70" : "text-muted"
                          } text-right`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {acceptError && (
          <div className="px-[22px] pb-1">
            <p className="text-red-500 text-xs text-center">{acceptError}</p>
          </div>
        )}

        <div className="border-t border-line p-[22px] pt-3 grid gap-3">
          {isCancelled && (
            <p className="text-center text-sm text-red-500 font-bold py-1">
              Consulta cancelada
            </p>
          )}

          {isClient && (data.request.status === "PENDING" || isResponded) && (
            <>
              {isResponded && !createdAppointmentId && (
                <div className="bg-white border border-line rounded-lg p-3 grid gap-2.5">
                  <h3 className="text-ink text-sm font-bold">Programar Videollamada</h3>

                  <div className="grid gap-2">
                    <div>
                      <label className="text-ink text-[12px] font-bold block mb-1">Opción 1 — Fecha y hora</label>
                      <input
                        type="datetime-local"
                        value={option1}
                        onChange={(e) => { setOption1(e.target.value); setProposalError(""); setProposalSuccess(false) }}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full border border-line rounded-lg bg-white text-ink p-2 text-sm outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-ink text-[12px] font-bold block mb-1">Opción 2 — Fecha y hora</label>
                      <input
                        type="datetime-local"
                        value={option2}
                        onChange={(e) => { setOption2(e.target.value); setProposalError(""); setProposalSuccess(false) }}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full border border-line rounded-lg bg-white text-ink p-2 text-sm outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-ink text-[12px] font-bold block mb-1">Duración</label>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="w-full border border-line rounded-lg bg-white text-ink p-2 text-sm outline-none focus:border-brand-500"
                      >
                        {DURATIONS.map((d) => (
                          <option key={d} value={d}>{d} minutos</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {proposalError && <p className="text-red-500 text-xs">{proposalError}</p>}
                  {proposalSuccess && (
                    <p className="text-brand-700 text-xs font-bold">Propuesta enviada correctamente</p>
                  )}

                  <button
                    type="button"
                    onClick={handlePropose}
                    disabled={proposing}
                    className="w-full bg-brand-700 text-white rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {proposing ? "Enviando..." : "Enviar Propuestas"}
                  </button>
                </div>
              )}

              {createdAppointmentId && (
                <div className="bg-white border border-brand-500 rounded-lg p-3 text-center">
                  <p className="text-brand-700 text-sm font-bold">🎉 Cita agendada</p>
                  <p className="text-muted text-xs">La videollamada ha sido programada correctamente.</p>
                </div>
              )}

              {cancelError && <p className="text-red-500 text-xs text-center">{cancelError}</p>}

              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling || !!createdAppointmentId}
                className="w-full border border-red-400 text-red-500 rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? "Cancelando..." : "Dar por terminada la consulta"}
              </button>
            </>
          )}

          {!isClient && !isCancelled && (
            <>
              {sendError && <p className="text-red-500 text-xs text-center">{sendError}</p>}
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); setSendError("") }}
                  placeholder="Escriba su respuesta"
                  rows={2}
                  className="flex-1 border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-brand-700 grid place-items-center cursor-pointer hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-end"
                  aria-label="Enviar mensaje"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {isClient && !isCancelled && (
            <>
              {sendError && <p className="text-red-500 text-xs text-center">{sendError}</p>}
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); setSendError("") }}
                  placeholder="Escriba su respuesta"
                  rows={2}
                  className="flex-1 border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-brand-700 grid place-items-center cursor-pointer hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-end"
                  aria-label="Enviar mensaje"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showCounterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5">
          <div className="w-full max-w-[380px] bg-white rounded-[20px] p-5 grid gap-4 shadow-2xl">
            <h3 className="text-ink text-base font-bold text-center">Proponer nuevas fechas</h3>

            <div className="grid gap-3">
              <div>
                <label className="text-ink text-[12px] font-bold block mb-1">Nueva Opción 1</label>
                <input
                  type="datetime-local"
                  value={counterOption1}
                  onChange={(e) => { setCounterOption1(e.target.value); setCounterError("") }}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-ink text-[12px] font-bold block mb-1">Nueva Opción 2</label>
                <input
                  type="datetime-local"
                  value={counterOption2}
                  onChange={(e) => { setCounterOption2(e.target.value); setCounterError("") }}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-ink text-[12px] font-bold block mb-1">Duración</label>
                <select
                  value={counterDuration}
                  onChange={(e) => setCounterDuration(Number(e.target.value))}
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d} minutos</option>
                  ))}
                </select>
              </div>
            </div>

            {counterError && <p className="text-red-500 text-xs text-center">{counterError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCounterModal(false); setCounterError("") }}
                className="flex-1 border border-line text-muted rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-brand-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendCounterProposal}
                disabled={counterSending}
                className="flex-1 bg-brand-700 text-white rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {counterSending ? "Enviando..." : "Enviar Propuesta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
