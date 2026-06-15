"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ClientRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    documentType: "CC",
    documentNumber: "",
    gender: "",
    country: "",
    city: "",
    dateOfBirth: "",
    address: "",
    walletAddress: "",
  })
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: "" }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setLoading(true)

    try {
      const body = {
        ...form,
        role: "CLIENT",
        gender: form.gender || undefined,
        documentNumber: form.documentNumber || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address || undefined,
        walletAddress: form.walletAddress || undefined,
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        if (res.status === 422 && json.data) {
          const flat: Record<string, string> = {}
          for (const [key, msgs] of Object.entries(json.data)) {
            flat[key] = (msgs as string[])[0]
          }
          setFieldErrors(flat)
        } else {
          setError(json.error ?? "Error al registrarse")
        }
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/auth/login"), 2000)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-5">
        <div className="w-full max-w-[420px] min-h-[400px] bg-[#f3fbf6] rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5 items-center justify-center text-center">
          <div className="w-[80px] h-[80px] rounded-full bg-[#11a36a] grid place-items-center">
            <span className="text-white text-4xl">✓</span>
          </div>
          <h1 className="text-[30px] font-bold text-[#18312a]">¡Registro exitoso!</h1>
          <p className="text-[#6a7c76]">Serás redirigido al inicio de sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-5">
      <div className="w-full max-w-[420px] min-h-[860px] bg-[#f3fbf6] rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-[40px] h-[40px] rounded-full border border-[#d7e7de] bg-white grid place-items-center text-[#073b2f] text-2xl no-underline"
          >
            ←
          </Link>
          <h1 className="text-[30px] font-bold text-[#18312a]">Registro usuario</h1>
        </div>

        <p className="text-[13px] text-[#6a7c76] border-l-4 border-[#11a36a] bg-[#dff6ea] rounded-lg p-3">
          Tu información personal no será visible para otros usuarios ni profesionales.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-y-auto">
          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Nombres y apellidos</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              required
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
            {fieldErrors.fullName && <p className="text-red-600 text-xs">{fieldErrors.fullName}</p>}
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Correo electrónico</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
            {fieldErrors.email && <p className="text-red-600 text-xs">{fieldErrors.email}</p>}
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Contraseña</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              required
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
            {fieldErrors.password && <p className="text-red-600 text-xs">{fieldErrors.password}</p>}
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Tipo de documento</label>
            <select
              name="documentType"
              value={form.documentType}
              onChange={handleChange}
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            >
              <option value="CC">Cédula de ciudadanía</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="NIT">NIT</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Número de documento</label>
            <input
              name="documentNumber"
              value={form.documentNumber}
              onChange={handleChange}
              placeholder="Número de identificación"
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Género</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            >
              <option value="">Seleccionar</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
              <option value="Prefiero no decirlo">Prefiero no decirlo</option>
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">País</label>
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="Colombia"
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Ciudad</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Ciudad de residencia"
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Fecha de nacimiento</label>
            <input
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange}
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Dirección</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Dirección de residencia"
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">
              Wallet CELO{" "}
              <span className="font-normal text-[#6a7c76]">(opcional — dirección 0x...)</span>
            </label>
            <input
              name="walletAddress"
              value={form.walletAddress}
              onChange={handleChange}
              placeholder="0x..."
              className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
            />
            {fieldErrors.walletAddress && (
              <p className="text-red-600 text-xs">{fieldErrors.walletAddress}</p>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d6b4f] text-white rounded-lg py-3 font-bold disabled:opacity-50 mt-2"
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-[#6a7c76] text-sm text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-[#0d6b4f] font-bold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
