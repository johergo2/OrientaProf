"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"

type RequestItem = {
  id: string
  title: string
  description: string
  status: string
  category: string
  createdAt: string
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  RESPONDED: "Resuelta",
  CANCELLED: "Cancelada",
  COMPLETED: "Resuelta",
}

export default function MyRequestsPage() {
  const router = useRouter()
  const [username, setUsername] = useState("usuario")
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/requests").then((r) => r.json()),
    ]).then(([sessionRes, requestsRes]) => {
      if (sessionRes?.user?.name) setUsername(sessionRes.user.name)
      if (requestsRes.success) setRequests(requestsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex items-start justify-center min-h-screen p-5">
      <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/dashboard/client")}
            className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center cursor-pointer hover:bg-brand-100 transition-colors"
            aria-label="Volver"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18312a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <h1 className="text-ink text-base font-bold truncate px-2">
            Mis Consultas - {username}
          </h1>

          <div className="flex items-center gap-1.5">
            <Link
              href="/messages"
              className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center hover:bg-brand-100 transition-colors"
              aria-label="Mensajes"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18312a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </Link>
            <Link
              href="/appointments"
              className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center hover:bg-brand-100 transition-colors"
              aria-label="Calendario"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18312a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-9 h-9 rounded-full bg-white border border-red-300 grid place-items-center hover:bg-red-50 transition-colors"
              aria-label="Cerrar sesión"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 grid gap-3 content-start">
          <h2 className="text-ink text-base font-bold">Mis Consultas</h2>

          {loading ? (
            <p className="text-muted text-sm text-center py-4">Cargando consultas...</p>
          ) : requests.length === 0 ? (
            <div className="grid gap-4 py-8">
              <p className="text-muted text-sm text-center">No tienes consultas registradas.</p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/client")}
                className="w-full bg-brand-700 text-white rounded-lg py-3 font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)]"
              >
                Nueva Consulta
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {requests.map((req) => (
                <div key={req.id} className="border border-line rounded-lg p-3 grid gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-ink text-sm font-bold flex-1">{req.title}</strong>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        req.status === "PENDING"
                          ? "bg-amber/20 text-amber"
                          : req.status === "CANCELLED"
                            ? "bg-red-100 text-red-500"
                            : "bg-brand-100 text-brand-700"
                      }`}
                    >
                      {statusLabels[req.status] ?? req.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(req.id)}
                    className="flex items-center gap-1 text-muted text-xs font-bold cursor-pointer hover:text-ink transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform ${expanded.has(req.id) ? "rotate-45" : ""}`}
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {expanded.has(req.id) ? "Ocultar descripción" : "Ver descripción"}
                  </button>

                  {expanded.has(req.id) && (
                    <p className="text-muted text-sm leading-relaxed bg-mint rounded-lg p-2.5">
                      {req.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => alert("Funcionalidad de modificar pendiente de implementar.")}
                      className="flex-1 border border-brand-700 text-brand-700 rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-brand-100 transition-colors"
                    >
                      Modificar
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Funcionalidad de cancelar pendiente de implementar.")}
                      className="flex-1 border border-amber text-amber rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-amber/10 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Funcionalidad de eliminar pendiente de implementar.")}
                      className="flex-1 border border-red-400 text-red-500 rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => router.push("/dashboard/client")}
                className="w-full bg-brand-700 text-white rounded-lg py-3 font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)] active:shadow-[0_1px_2px_rgba(0,0,0,0.15)] active:translate-y-[2px]"
              >
                Nueva Consulta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
