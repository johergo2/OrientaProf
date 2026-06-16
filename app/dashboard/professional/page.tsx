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
  client: { username: string }
}

export default function ProfessionalDashboard() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/requests")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setRequests(res.data.requests)
          setCategories(res.data.categories)
          setUsername(res.data.professionalUsername ?? "")
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredRequests = filterCategory
    ? requests.filter((r) => r.category === filterCategory)
    : requests

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  return (
    <div className="flex items-start justify-center min-h-screen p-5">
      <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
        <header className="grid gap-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs font-bold text-brand-700 border border-brand-700 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-brand-100 transition-colors whitespace-nowrap"
            >
              Cerrar sesión
            </button>

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
              <Link
                href="/settings"
                className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center hover:bg-brand-100 transition-colors"
                aria-label="Configuración"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18312a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </Link>
            </div>
          </div>

          <h1 className="text-ink text-lg font-bold truncate">
            Profesional {username}
          </h1>
        </header>

        <div className="bg-white border border-line rounded-lg p-4 grid gap-4">
          <h2 className="text-ink text-base font-bold">Consultas Disponibles</h2>

          <div className="grid gap-1.5">
            <label className="text-ink text-[13px] font-bold">Categoría o Profesión</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-muted text-sm text-center py-4">Cargando consultas...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">
              No existen consultas disponibles actualmente.
            </p>
          ) : (
            <div className="grid gap-2.5 max-h-[500px] overflow-y-auto">
              {filteredRequests.map((req) => (
                <div key={req.id} className="border border-line rounded-lg p-3 grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-ink font-bold text-sm">{req.client.username}</strong>
                    <span className="text-muted text-[11px]">{formatDate(req.createdAt)}</span>
                  </div>

                  <span className="inline-block bg-brand-100 text-brand-700 text-[11px] font-bold px-2.5 py-1 rounded-full w-fit">
                    {req.category}
                  </span>

                  <p className="text-ink text-sm font-bold">{req.title}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(req.id)}
                      className="bg-brand-100 text-brand-700 rounded-lg py-1.5 px-3 text-xs font-bold cursor-pointer hover:bg-brand-200 transition-colors"
                    >
                      <span className="flex items-center gap-1">
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
                        {expanded.has(req.id) ? "Ocultar detalles" : "Detalles"}
                      </span>
                    </button>
                  </div>

                  {expanded.has(req.id) && (
                    <p className="text-muted text-sm leading-relaxed bg-mint rounded-lg p-2.5">
                      {req.description}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/professional/respond/${req.id}`)}
                    className="w-full bg-brand-700 text-white rounded-lg py-2 text-xs font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)] active:shadow-[0_1px_2px_rgba(0,0,0,0.15)] active:translate-y-[2px]"
                  >
                    Responder ofreciendo asesoría
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
