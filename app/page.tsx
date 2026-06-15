"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()
  const [helpOpen, setHelpOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"client" | "professional">("client")

  function handleRegister() {
    if (selectedRole === "professional") {
      router.push("/auth/register/professional")
    } else {
      router.push("/auth/register/client")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-5">
      <div className="w-full max-w-[420px] min-h-[860px] bg-mint rounded-[28px] shadow-[0_24px_70px_rgba(7,59,47,0.2)] overflow-hidden p-[22px] flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-[62px] h-[62px] rounded-[20px] bg-brand-500 border-3 border-[#042E16] grid place-items-center overflow-hidden p-0">
            <img
              src="/assets/OrientaProf.png"
              alt="OrientaProf"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-muted text-sm font-bold" style={{ fontFamily: 'Arial' }}>Orientación con Profesionales</p>
            <h1 className="text-[30px] font-bold text-ink" style={{ fontFamily: 'Arial' }}>OrientaProf</h1>
          </div>
        </div>

        <div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-lg overflow-hidden grid gap-3">
          <div className="bg-[rgba(4,43,34,0.92)] text-white text-[15px] font-bold px-[22px] py-3">
            Profesionales a un click, asesoria móvil y cercana
          </div>

          <div className="px-[22px]">
            <button
              type="button"
              onClick={() => setHelpOpen(!helpOpen)}
              className="border-0 rounded-lg bg-brand-100 text-brand-900 px-4 py-2.5 text-[13px] font-extrabold shadow-[0_8px_18px_rgba(0,0,0,0.26)] hover:bg-white hover:text-brand-900 transition-colors"
            >
              Ayuda
            </button>
          </div>

          <div className="px-[22px] pb-[22px] grid gap-3">
            <h2 className="text-white text-2xl font-bold leading-tight">
              Encuentra orientación profesional cuando la necesitas.
            </h2>
            <p className="text-white/80 leading-relaxed">
              Publica tu consulta gratis, recibe respuestas de especialistas y agenda una
              videollamada corta.
            </p>
          </div>

          {helpOpen && (
            <aside className="mx-[22px] mb-[22px] rounded-lg bg-white text-ink p-3 grid gap-2 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-brand-900 text-sm font-bold leading-snug">
                  ¿Tienes una duda específica y necesitas la orientación de un experto?
                </h3>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="w-[34px] h-[34px] min-w-[34px] border-0 rounded-full bg-brand-100 text-brand-900 font-black grid place-items-center shadow-[0_5px_12px_rgba(7,59,47,0.18)]"
                >
                  X
                </button>
              </div>
              <p className="text-muted text-sm leading-relaxed">
                Nuestra app te conecta con profesionales de diferentes áreas, como derecho,
                medicina, contabilidad, ingeniería, arquitectura, finanzas e inversiones, para que
                recibas asesoría personalizada mediante videollamadas de corta duración.
              </p>
              <p className="text-muted text-sm leading-relaxed">
                Publica tu consulta o busca directamente un profesional. Los especialistas
                interesados podrán responderte y explicarte cómo pueden ayudarte. Luego podrás
                elegir al profesional que prefieras y agendar una videollamada de 10, 15, 20 o 30
                minutos para resolver tus inquietudes.
              </p>
              <p className="text-muted text-sm leading-relaxed">
                Por ejemplo, si tu empleador te liquidó definitivamente y tienes dudas sobre el
                valor recibido, podrás consultar con un abogado laboral o un contador especializado
                y obtener orientación profesional de forma rápida, sencilla y a un costo accesible.
              </p>
              <p className="text-muted text-sm leading-relaxed">
                Cada profesional establece su propia tarifa por minuto dentro de los rangos
                autorizados por la plataforma, permitiéndote elegir la opción que mejor se adapte a
                tus necesidades y presupuesto.
              </p>
            </aside>
          )}
        </div>

        <div className="bg-white border border-line rounded-lg p-4 grid gap-4">
          <h3 className="text-ink text-base font-bold">Selecciona tu rol</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <label
              className={`min-h-[70px] border rounded-lg p-3 flex items-center gap-1 cursor-pointer ${
                selectedRole === "client"
                  ? "border-brand-700 bg-brand-100"
                  : "border-line bg-[#f8fcf9]"
              }`}
            >
              <input
                type="radio"
                name="profile-role"
                value="client"
                checked={selectedRole === "client"}
                onChange={() => setSelectedRole("client")}
                className="w-[18px] h-[18px] accent-brand-700 flex-shrink-0"
              />
              <span className="grid gap-0.5">
                <strong className="font-extrabold text-ink">Usuario</strong>
                <small className="text-muted">Busco asesoría profesional</small>
              </span>
            </label>
            <label
              className={`min-h-[70px] border rounded-lg p-3 flex items-center gap-1 cursor-pointer ${
                selectedRole === "professional"
                  ? "border-brand-700 bg-brand-100"
                  : "border-line bg-[#f8fcf9]"
              }`}
            >
              <input
                type="radio"
                name="profile-role"
                value="professional"
                checked={selectedRole === "professional"}
                onChange={() => setSelectedRole("professional")}
                className="w-[18px] h-[18px] accent-brand-700 flex-shrink-0"
              />
              <span className="grid gap-0.5">
                <strong className="font-extrabold text-ink">Profesional</strong>
                <small className="text-muted">Brindo asesoría profesional</small>
              </span>
            </label>
          </div>
          <div className="grid gap-2.5">
            <Link
              href="/auth/login"
              className="min-h-[42px] border border-brand-700 rounded-lg bg-white text-brand-900 font-extrabold grid place-items-center no-underline shadow-[0_4px_6px_rgba(0,0,0,0.15)] active:shadow-[0_1px_2px_rgba(0,0,0,0.15)] active:translate-y-[2px] transition-all"
            >
              Ingresar
            </Link>
            <button
              type="button"
              onClick={handleRegister}
              className="min-h-[42px] border-0 rounded-lg bg-brand-700 text-white font-extrabold cursor-pointer shadow-[0_4px_6px_rgba(0,0,0,0.15)] active:shadow-[0_1px_2px_rgba(0,0,0,0.15)] active:translate-y-[2px] transition-all"
            >
              Registrarse
            </button>
          </div>
        </div>

        <p className="text-xs text-muted text-center mt-auto">
          Al usar OrientaProf aceptas nuestros términos y condiciones.
        </p>
      </div>
    </div>
  )
}
