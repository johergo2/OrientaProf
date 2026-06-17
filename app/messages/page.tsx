"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

type Conversation = {
  requestId: string
  requestTitle: string
  otherUser: { id: string; username: string; fullName: string } | null
  lastMessage: { content: string; createdAt: string; senderId: string }
  unreadCount: number
}

export default function MessagesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setConversations(res.data.conversations)
      })
      .finally(() => setLoading(false))
  }, [])

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    }
    if (diffDays === 1) return "Ayer"
    if (diffDays < 7) {
      return d.toLocaleDateString("es-CO", { weekday: "long" })
    }
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function getStatus(conv: Conversation) {
    if (conv.unreadCount > 0) return { label: "Nueva", className: "text-brand-700" }
    return { label: "Leída", className: "text-muted" }
  }

  function goBack() {
    if (session?.user?.role === "PROFESSIONAL") {
      router.push("/dashboard/professional")
    } else {
      router.push("/dashboard/client")
    }
  }

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

          <h1 className="text-ink text-lg font-bold">Mensajes</h1>

          <div className="w-9" />
        </header>

        {loading ? (
          <p className="text-muted text-sm text-center py-10">Cargando conversaciones...</p>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-brand-100 grid place-items-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#11a36a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-muted text-sm text-center">No tienes mensajes disponibles.</p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {conversations.map((conv) => {
              const status = getStatus(conv)
              const preview =
                conv.lastMessage.content.length > 100
                  ? conv.lastMessage.content.slice(0, 100) + "..."
                  : conv.lastMessage.content

              return (
                <button
                  key={conv.requestId}
                  type="button"
                  onClick={() => router.push(`/messages/${conv.requestId}`)}
                  className="w-full bg-white border border-line rounded-lg p-3 grid gap-1.5 text-left cursor-pointer hover:bg-brand-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <span className="text-brand-700 text-xs font-bold">
                          {conv.otherUser?.username?.charAt(0).toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <strong className="text-ink text-sm font-bold block truncate">
                          {conv.otherUser?.username ?? "Usuario"}
                        </strong>
                        <span className="text-muted text-[11px] block truncate">
                          {conv.requestTitle}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-[11px] text-muted">{formatDate(conv.lastMessage.createdAt)}</span>
                      <span className={`text-[10px] font-bold ${status.className}`}>{status.label}</span>
                    </div>
                  </div>
                  <p className="text-muted text-xs leading-relaxed line-clamp-2">
                    {preview}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
