"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

type RequestDetail = {
  id: string
  title: string
  description: string
  status: string
  category: string
  createdAt: string
  client: { username: string; fullName: string }
}

export default function RespondRequestPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.requestId as string

  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [message, setMessage] = useState("")
  const [messageError, setMessageError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    fetch(`/api/requests/${requestId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setRequest(res.data)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [requestId])

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  async function handleSubmit() {
    setMessageError("")
    setSubmitError("")

    if (!message.trim()) {
      setMessageError("El mensaje no puede estar vacío")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      })
      const json = await res.json()
      if (!json.success) {
        setSubmitError(json.error ?? "Error al enviar la propuesta")
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitError("Error de conexión al enviar la propuesta")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-start justify-center min-h-screen p-5">
        <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
          <p className="text-muted text-sm text-center py-4">Cargando consulta...</p>
        </div>
      </div>
    )
  }

  if (notFound || !request) {
    return (
      <div className="flex items-start justify-center min-h-screen p-5">
        <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
          <p className="text-muted text-sm text-center py-4">La consulta solicitada no fue encontrada.</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/professional")}
            className="w-full bg-brand-700 text-white rounded-lg py-3 font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)]"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-center min-h-screen p-5">
      <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/dashboard/professional")}
            className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center cursor-pointer hover:bg-brand-100 transition-colors"
            aria-label="Volver"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18312a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <h1 className="text-ink text-lg font-bold truncate px-2">Responder Consulta</h1>

          <div className="w-9" />
        </header>

        {submitted ? (
          <div className="bg-white border border-line rounded-lg p-4 grid gap-4 text-center">
            <div className="w-14 h-14 bg-brand-100 rounded-full grid place-items-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a6b4c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-ink text-sm font-bold">
              Su propuesta de asesoría fue enviada correctamente al cliente.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard/professional")}
              className="w-full bg-brand-700 text-white rounded-lg py-3 font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)]"
            >
              Volver al dashboard
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="bg-white border border-line rounded-lg p-4 grid gap-3">
              <h2 className="text-ink text-base font-bold">Información de la Consulta</h2>

              <div className="grid gap-2">
                <div>
                  <span className="text-ink text-[12px] font-bold">Cliente</span>
                  <p className="text-muted text-sm">{request.client.username}</p>
                </div>

                <div>
                  <span className="text-ink text-[12px] font-bold">Categoría</span>
                  <p className="text-muted text-sm">{request.category}</p>
                </div>

                <div>
                  <span className="text-ink text-[12px] font-bold">Título</span>
                  <p className="text-ink text-sm font-bold">{request.title}</p>
                </div>

                <div>
                  <span className="text-ink text-[12px] font-bold">Descripción</span>
                  <p className="text-muted text-sm leading-relaxed">{request.description}</p>
                </div>

                <div>
                  <span className="text-ink text-[12px] font-bold">Fecha de publicación</span>
                  <p className="text-muted text-sm">{formatDate(request.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-line rounded-lg p-4 grid gap-3">
              <h2 className="text-ink text-base font-bold">Mensaje para el cliente</h2>

              <div className="grid gap-1.5">
                <label className="text-ink text-[13px] font-bold">Escriba un mensaje para el cliente</label>
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setMessageError("") }}
                  placeholder="Hola, he revisado su consulta y considero que puedo ayudarle a resolver sus inquietudes. Me gustaría brindarle asesoría profesional y posteriormente coordinar una videollamada para atender su caso."
                  rows={6}
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500 resize-none"
                />
                {messageError && (
                  <p className="text-red-500 text-xs">{messageError}</p>
                )}
              </div>
            </div>

            {submitError && (
              <p className="text-red-500 text-xs text-center">{submitError}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-brand-700 text-white rounded-lg py-3 font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)] active:shadow-[0_1px_2px_rgba(0,0,0,0.15)] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Enviando..." : "Enviar propuesta de asesoría"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
