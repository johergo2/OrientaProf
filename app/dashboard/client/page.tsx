"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"

type Professional = {
  id: string
  username: string
  fullName: string
  professionalProfile: {
    profession: string
    ratePerMinute: number
    rating: number
    ratingCount: number
    experienceYears: number | null
    description: string | null
    diplomaFile: string | null
    categories: { name: string }[]
  } | null
}

export default function ClientDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<"publish" | "search">("publish")
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [publishCategory, setPublishCategory] = useState("")
  const [publishTitle, setPublishTitle] = useState("")
  const [publishDescription, setPublishDescription] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState("")

  const [filterCategory, setFilterCategory] = useState("")
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/professionals")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setProfessionals(res.data.professionals)
          setCategories(res.data.categories)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredProfessionals = filterCategory
    ? professionals.filter((p) =>
        p.professionalProfile?.categories.some((c) => c.name === filterCategory)
      )
    : professionals

  return (
    <div className="flex items-start justify-center min-h-screen p-5">
      <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center cursor-pointer hover:bg-brand-100 transition-colors"
            aria-label="Volver"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18312a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <h1 className="text-ink text-lg font-bold">Busca Asesoría Profesional</h1>

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
        </header>

        <div className="bg-white border border-line rounded-lg p-4 grid gap-4">
          <h2 className="text-ink text-base font-bold">¿Qué necesitas resolver?</h2>

          <div className="flex border border-line rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setTab("publish")}
              className={`flex-1 py-2.5 text-sm font-bold text-center cursor-pointer transition-colors ${
                tab === "publish"
                  ? "bg-brand-700 text-white"
                  : "bg-white text-muted hover:bg-brand-100"
              }`}
            >
              Publicar Consulta
            </button>
            <button
              type="button"
              onClick={() => setTab("search")}
              className={`flex-1 py-2.5 text-sm font-bold text-center cursor-pointer transition-colors ${
                tab === "search"
                  ? "bg-brand-700 text-white"
                  : "bg-white text-muted hover:bg-brand-100"
              }`}
            >
              Buscar Profesional
            </button>
          </div>

          {tab === "publish" && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <label className="text-ink text-[13px] font-bold">Categoría o Profesión</label>
                <select
                  value={publishCategory}
                  onChange={(e) => setPublishCategory(e.target.value)}
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-ink text-[13px] font-bold">Título de la consulta</label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder="Ej: Consulta sobre liquidación laboral"
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-ink text-[13px] font-bold">Descripción de la consulta</label>
                <textarea
                  value={publishDescription}
                  onChange={(e) => setPublishDescription(e.target.value)}
                  placeholder="Describe detalladamente tu situación o duda..."
                  rows={4}
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500 resize-none"
                />
              </div>

              {publishError && (
                <p className="text-red-500 text-xs text-center">{publishError}</p>
              )}

              <button
                type="button"
                onClick={async () => {
                  setPublishError("")
                  setPublishing(true)
                  try {
                    const res = await fetch("/api/requests", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        category: publishCategory,
                        title: publishTitle,
                        description: publishDescription,
                      }),
                    })
                    const json = await res.json()
                    if (!json.success) {
                      if (json.data) {
                        const errors = Object.values(json.data as Record<string, string[]>).flat().join(", ")
                        setPublishError(errors)
                      } else {
                        setPublishError(json.error ?? "Error al publicar consulta")
                      }
                      return
                    }
                    setPublishCategory("")
                    setPublishTitle("")
                    setPublishDescription("")
                    router.push("/dashboard/client/my-requests")
                  } catch {
                    setPublishError("Error de conexión al publicar consulta")
                  } finally {
                    setPublishing(false)
                  }
                }}
                disabled={publishing}
                className="w-full bg-brand-700 text-white rounded-lg py-3 font-bold cursor-pointer hover:bg-brand-900 transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.15)] active:shadow-[0_1px_2px_rgba(0,0,0,0.15)] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? "Publicando..." : "Publicar Consulta"}
              </button>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full border border-red-400 text-red-500 rounded-lg py-2.5 text-sm font-bold cursor-pointer hover:bg-red-50 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          )}

          {tab === "search" && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <label className="text-ink text-[13px] font-bold">Categoría o Profesión</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full border border-line rounded-lg bg-white text-ink p-2.5 text-sm outline-none focus:border-brand-500"
                >
                  <option value="">Todas las profesiones</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <p className="text-muted text-sm text-center py-4">Cargando profesionales...</p>
              ) : filteredProfessionals.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">
                  No se encontraron profesionales
                </p>
              ) : (
                <div className="grid gap-2.5 max-h-[400px] overflow-y-auto">
                  {filteredProfessionals.map((p) => {
                    const isExpanded = expandedCard === p.id
                    const profile = p.professionalProfile

                    return (
                      <div
                        key={p.id}
                        className="border border-line rounded-lg p-3 grid gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-ink font-bold text-sm">
                            {p.username}
                          </strong>
                          <span className="text-amber text-sm font-bold flex items-center gap-0.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f5b84b" stroke="#f5b84b" strokeWidth="1">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            {profile
                              ? `${profile.rating.toFixed(1)} (${profile.ratingCount})`
                              : "—"}
                          </span>
                        </div>
                        <p className="text-muted text-xs">{profile?.profession ?? "Profesión no especificada"}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-ink text-sm font-bold">
                            {profile
                              ? `$${profile.ratePerMinute.toLocaleString()} COP/min`
                              : "—"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedCard(isExpanded ? null : p.id)}
                            className="text-xs bg-white border border-line text-muted rounded-lg px-2.5 py-1.5 font-bold cursor-pointer hover:bg-brand-100 transition-colors flex items-center gap-1"
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
                              className={`transition-transform ${isExpanded ? "rotate-45" : ""}`}
                            >
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {isExpanded ? "Cerrar" : "Detalles"}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="grid gap-2 pt-1 border-t border-line mt-1">
                            <div>
                              <span className="text-ink text-[12px] font-bold">Diplomas</span>
                              <p className="text-muted text-xs leading-relaxed">
                                {profile?.diplomaFile
                                  ? "Documento disponible."
                                  : "No registra información académica."}
                              </p>
                            </div>
                            <div>
                              <span className="text-ink text-[12px] font-bold">Experiencia</span>
                              <p className="text-muted text-xs leading-relaxed">
                                {profile?.description
                                  ? `${profile.description}${profile.experienceYears != null ? ` (${profile.experienceYears} años de experiencia)` : ""}`
                                  : "Información de experiencia profesional pendiente."}
                              </p>
                            </div>
                            <div>
                              <span className="text-ink text-[12px] font-bold">Servicios</span>
                              <p className="text-muted text-xs leading-relaxed">
                                {profile?.description
                                  ? profile.description
                                  : "Información de servicios pendiente."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
