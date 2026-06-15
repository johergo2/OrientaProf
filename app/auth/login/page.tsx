"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email o contraseña incorrectos")
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-5">
      <div className="w-full max-w-[420px] min-h-[600px] bg-[#f3fbf6] rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-[62px] h-[62px] rounded-[20px] bg-[#11a36a] border-3 border-[#042E16] grid place-items-center">
            <span className="text-white text-3xl font-black">OP</span>
          </div>
          <h1 className="text-[30px] font-bold text-[#18312a]">Iniciar sesión</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <label className="text-[#073b2f] text-[13px] font-bold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-[#073b2f] text-[13px] font-bold">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d6b4f] text-white rounded-lg py-3 font-bold disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-[#6a7c76] text-sm text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/register/client" className="text-[#0d6b4f] font-bold">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
