"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const CATEGORY_OPTIONS = [
  "Tributaria",
  "Laboral",
  "Médica",
  "Legal",
  "Emprendimiento",
  "Financiera",
  "Contable",
  "Inmobiliaria",
  "Tecnología",
  "Educación",
]

const PROFESSION_OPTIONS = [
  "Abogado",
  "Médico",
  "Contador",
  "Ingeniero",
  "Arquitecto",
  "Economista",
  "Psicólogo",
  "Inversionista",
]

export default function ProfessionalRegisterPage() {
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
    profession: "",
    ratePerMinute: "1200",
    experienceYears: "",
    description: "",
    bankCountry: "Colombia",
    bankName: "",
    accountType: "Ahorros",
    accountNumber: "",
    accountHolder: "",
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: "" }))
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
    setFieldErrors((prev) => ({ ...prev, categories: "" }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setLoading(true)

    try {
      const body = {
        ...form,
        role: "PROFESSIONAL",
        gender: form.gender || undefined,
        documentNumber: form.documentNumber || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address || undefined,
        walletAddress: form.walletAddress || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        ratePerMinute: Number(form.ratePerMinute),
        categories: selectedCategories,
        description: form.description || undefined,
        bankCountry: form.bankCountry,
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
          <h1 className="text-[30px] font-bold text-[#18312a]">Registro profesional</h1>
        </div>

        <p className="text-[13px] text-[#6a7c76] border-l-4 border-[#11a36a] bg-[#dff6ea] rounded-lg p-3">
          El profesional también queda habilitado como usuario normal para buscar asesoría.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-y-auto">
          <div className="grid gap-1">
            <label className="text-[#073b2f] text-[13px] font-bold">Nombres y apellidos</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Ej: Dr. Carlos Mendoza"
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

          <fieldset className="border border-[#d7e7de] rounded-lg bg-[#f3fbf6] p-3 grid gap-3 mt-2">
            <legend className="text-[#073b2f] px-2 text-[14px] font-black">
              Información profesional
            </legend>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">Profesión</label>
              <select
                name="profession"
                value={form.profession}
                onChange={handleChange}
                required
                className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
              >
                <option value="">Seleccionar profesión</option>
                {PROFESSION_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {fieldErrors.profession && <p className="text-red-600 text-xs">{fieldErrors.profession}</p>}
            </div>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">
                Tarifa por minuto{" "}
                <span className="font-normal text-[#6a7c76]">($750 - $1,500 COP)</span>
              </label>
              <input
                name="ratePerMinute"
                type="number"
                min={750}
                max={1500}
                value={form.ratePerMinute}
                onChange={handleChange}
                required
                className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
              />
              {fieldErrors.ratePerMinute && (
                <p className="text-red-600 text-xs">{fieldErrors.ratePerMinute}</p>
              )}
            </div>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">Años de experiencia</label>
              <input
                name="experienceYears"
                type="number"
                min={0}
                value={form.experienceYears}
                onChange={handleChange}
                placeholder="0"
                className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">Descripción</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe tu experiencia y servicios (máx. 500 caracteres)"
                rows={3}
                maxLength={500}
                className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none resize-vertical focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">Categorías</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      selectedCategories.includes(cat)
                        ? "bg-[#0d6b4f] text-white border-[#0d6b4f]"
                        : "bg-white text-[#073b2f] border-[#d7e7de]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {fieldErrors.categories && (
                <p className="text-red-600 text-xs">{fieldErrors.categories}</p>
              )}
            </div>
          </fieldset>

          <fieldset className="border border-[#d7e7de] rounded-lg bg-[#f3fbf6] p-3 grid gap-3">
            <legend className="text-[#073b2f] px-2 text-[14px] font-black">
              Información para recibir pago
            </legend>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">País del banco</label>
              <input
                name="bankCountry"
                value={form.bankCountry}
                onChange={handleChange}
                placeholder="Colombia"
                className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">Banco</label>
              <input
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                placeholder="Nombre del banco"
                required
                className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
              />
              {fieldErrors.bankName && <p className="text-red-600 text-xs">{fieldErrors.bankName}</p>}
            </div>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">Tipo de cuenta</label>
              <select
                name="accountType"
                value={form.accountType}
                onChange={handleChange}
                className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
              >
                <option value="Ahorros">Ahorros</option>
                <option value="Corriente">Corriente</option>
              </select>
              {fieldErrors.accountType && <p className="text-red-600 text-xs">{fieldErrors.accountType}</p>}
            </div>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">Número de cuenta</label>
              <input
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="Número de cuenta"
                required
                className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
              />
              {fieldErrors.accountNumber && (
                <p className="text-red-600 text-xs">{fieldErrors.accountNumber}</p>
              )}
            </div>

            <div className="grid gap-1">
              <label className="text-[#073b2f] text-[13px] font-bold">Titular de la cuenta</label>
              <input
                name="accountHolder"
                value={form.accountHolder}
                onChange={handleChange}
                placeholder="Nombre del titular"
                required
                className="w-full border border-[#d7e7de] rounded-lg bg-[#fbfefc] text-[#18312a] p-3 outline-none focus:border-[#11a36a] focus:shadow-[0_0_0_3px_rgba(17,163,106,0.13)]"
              />
              {fieldErrors.accountHolder && (
                <p className="text-red-600 text-xs">{fieldErrors.accountHolder}</p>
              )}
            </div>
          </fieldset>

          {error && (
            <p className="text-red-600 text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d6b4f] text-white rounded-lg py-3 font-bold disabled:opacity-50 mt-2"
          >
            {loading ? "Registrando..." : "Crear perfil profesional"}
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
