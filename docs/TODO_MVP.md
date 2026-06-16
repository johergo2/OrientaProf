# TODO MVP — OrientaProf

> Proyecto: OrientaProf — Orientación con Profesionales
> Estado actual: Migración a Next.js — Registro funcional + Dashboard Cliente + API Profesionales
> Objetivo: MVP full-stack con pagos en blockchain CELO

---

## Convenciones

- `[ ]` Pendiente
- `[x]` Completado
- `[~]` En progreso

Cada tarea incluye: `[Prioridad] [Esfuerzo] [Dependencias]`

| Prioridad | Esfuerzo | Dependencias |
|-----------|----------|-------------|
| P0 = Bloqueante | S = Small (horas) | `← tarea` |
| P1 = Alta | M = Medium (días) | |
| P2 = Media | L = Large (semanas) | |
| P3 = Baja | | |

---

## Lote 1 — Fundación del Proyecto (P0)

_Objetivo: Tener el proyecto compilando con Next.js + TypeScript + Tailwind + Prisma._

- [x] **P0 S** Inicializar proyecto Next.js 16 con App Router
- [x] **P0 S** Configurar TypeScript estricto (`tsconfig.json`)
      `strict: true`, paths alias `@/*`
- [x] **P0 S** Configurar Tailwind CSS v4 con paleta OrientaProf (verde corporativo)
      `globals.css` con `@theme inline` y colores `brand-*`
- [x] **P0 S** Configurar ESLint + Prettier
      `eslint.config.mjs`, `.prettierrc`
- [x] **P0 M** Configurar Prisma + PostgreSQL
      Schema con 9 modelos + 4 enums, `prisma/seed.ts` con datos de prueba
- [x] **P0 S** Crear `.env.example` con todas las variables de entorno
- [x] **P0 S** Configurar NextAuth.js (`/app/api/auth/[...nextauth]/route.ts`)
      Provider credentials (email+password), JWT strategy
- [x] **P0 S** Implementar middleware de protección de rutas
      `middleware.ts` redirige a `/auth/login` si no hay sesión
- [x] **P0 S** Migrar assets del prototipo (`OrientaProf.png` → `public/assets/`)
- [x] **P0 S** Configurar `vercel.json` para deploy
- [ ] **P0 S** Agregar husky + lint-staged para git hooks

---

## Lote 2 — Backend API (P0)

_Objetivo: API REST funcional con autenticación real, validación y base de datos._

- [x] **P0 M** Implementar registro de usuarios (`/api/auth/register`)
      `POST /api/auth/register` → crea User + ProfessionalProfile si rol es PROFESSIONAL
      Incluye walletAddress (CELO) opcional
- [x] **P0 S** Implementar login con NextAuth
      Validar credentials contra bcrypt, retornar JWT con rol
- [ ] **P0 M** CRUD usuarios (`/api/users/[id]`)
      GET (perfil público), PUT (actualizar propio perfil), DELETE (baja lógica)
- [ ] **P0 M** Endpoint perfil propio (`/api/users/me`)
      GET perfil completo + ProfessionalProfile si aplica
- [x] **P0 M** CRUD consultas (`/api/requests`)
      GET listar consultas del usuario autenticado (cliente ve sus consultas, profesional ve PENDING)
      POST /api/requests — crear consulta (cliente)
      GET /api/requests/[id] — detalle de consulta individual
- [x] **P0 M** Endpoint responder consulta (`/api/requests/[id]`)
      POST /api/requests/[id] — profesional responde → status RESPONDED + crea Message + asigna professionalId
- [x] **P0 M** CRUD profesionales (`/api/professionals`)
      GET listar profesionales + categorías (categoría, rating, rango tarifa)
      Creado GET /api/professionals — retorna profesionales activos con perfil, rating y categorías
- [ ] **P0 M** Endpoint actualizar tarifa profesional (`/api/professionals/rate`)
      PUT valida rango 750-1500 COP
- [ ] **P0 M** CRUD mensajes (`/api/messages`)
      GET bandeja (enviados/recibidos), POST enviar mensaje
- [ ] **P0 M** CRUD citas (`/api/appointments`)
      POST agendar, GET listar próximas, PUT cancelar/completar
- [ ] **P0 M** Validación con Zod para todos los endpoints
      Schemas reutilizables en `lib/validations.ts`
- [ ] **P0 S** Manejo de errores consistente en API
      `apiResponse.ts` helper con formato `{ success, data, error }`

---

## Lote 3 — Frontend: Auth y Layout (P1)

_Objetivo: Sistema de autenticación completo desde el frontend._

- [ ] **P1 S** Crear `AuthProvider.tsx` (cliente NextAuth SessionProvider)
- [x] **P1 M** Crear página `/auth/login`
      Formulario con email + password, redirect según rol
- [x] **P1 M** Crear página `/auth/register/client`
      Migrar formulario del prototipo (14 campos + wallet CELO + username autogenerado)
- [x] **P1 M** Crear página `/auth/register/professional`
      Migrar formulario del prototipo (profession, rate, categorías, bank info, wallet CELO)
- [ ] **P1 S** Crear componente `RoleSelector.tsx`
      Reutilizar diseño del prototipo (radio buttons Usuario/Profesional)
- [ ] **P1 S** Crear `Layout.tsx` con `PhoneShell` global
      Preservar diseño mobile-first (max-width 420px, shell-style)
- [ ] **P1 S** Crear componente `TopBar.tsx` con navegación
      Botón back, título, iconos de estado (mensajes, citas, settings)
- [ ] **P1 S** Crear `NavIcons.tsx` con badges notificaciones
      Contadores de mensajes no leídos y citas próximas

---

## Lote 4 — Frontend: Dashboards (P1)

_Objetivo: Dashboards funcionales para cliente y profesional conectados a la API._

- [x] **P1 M** Dashboard cliente (`/dashboard/client`)
      Página completa con header (back, mensajes, calendario, settings), tabs "Publicar Consulta" ↔ "Buscar Profesional", listado de profesionales desde BD
- [ ] **P1 M** Componente `RequestForm.tsx`
      Categoría (select), título, descripción → POST /api/requests
- [ ] **P1 M** Componente `ProfessionalSearch.tsx`
      Filtro por categoría + lista de `ProfessionalCard`
- [x] **P1 M** Componente `ProfessionalCard.tsx`
      Nombre, profesión, rating, tarifa, botón expandir detalles + "Consultar"
      Implementado directamente en dashboard cliente: tarjeta expandible con Diplomas, Experiencia y Servicios
- [x] **P1 M** Dashboard profesional (`/dashboard/professional`)
      Lista de consultas disponibles con filtro por categoría
      Botón "Responder ofreciendo asesoría" navega a /dashboard/professional/respond/[requestId]
- [x] **P1 M** Página responder consulta (`/dashboard/professional/respond/[requestId]`)
      Muestra detalle de consulta (cliente, categoría, título, descripción, fecha)
      Textarea + botón "Enviar propuesta de asesoría"
      Crea Message + actualiza Request a RESPONDED
- [ ] **P1 M** Componente `AvailableRequests.tsx`
      Cards de consultas con botón "Responder ofreciendo servicios"
- [x] **P1 M** Página `/dashboard/client/my-requests` (Mis consultas)
      Lista con estado (Pendiente/Resuelta/Cancelada), descripción expandible, acciones editar/cancelar/eliminar, botón Nueva Consulta, estado vacío controlado
- [ ] **P1 M** Página de consulta directa a profesional
      Formulario con profesional seleccionado, título + descripción → crea Request
- [ ] **P1 S** Integrar TanStack Query para fetching
      Custom hooks `useRequests()`, `useProfessionals()`, etc.

---

## Lote 5 — Frontend: Mensajes y Citas (P1)

_Objetivo: Mensajería y agendamiento de videollamadas._

- [ ] **P1 M** Página `/messages`
      Lista de conversaciones, última respuesta, botón "Agendar videollamada"
- [ ] **P1 M** Componente `MessageCard.tsx`
      Remitente, preview del mensaje, botón agendar
- [ ] **P1 M** Página `/appointments`
      Lista de citas: fecha, hora, duración, botón "Ingresar a videollamada"
- [ ] **P1 M** Componente `AppointmentCard.tsx`
      Badge con fecha, datos del profesional/cliente, duración, acciones
- [ ] **P1 S** Integrar Jitsi Meet básico
      Generar sala con UUID, enlace嵌入 en `/consultation/[id]`

---

## Lote 6 — Settings y Perfiles (P2)

_Objetivo: Configuración de cuenta y perfiles._

- [ ] **P2 S** Página `/settings`
      Menú con opciones: Datos personales, Contraseña, Pago, Tarifa (pro only)
- [ ] **P2 M** Página `/settings/personal-data`
      Formulario adaptativo según rol (profesional ve campos extra)
- [ ] **P2 S** Página `/settings/password`
      Validar contraseña actual, nueva (min 8 chars), confirmación
- [ ] **P2 S** Página `/settings/payment`
      Info bancaria: país, banco, tipo cuenta, número, titular
- [ ] **P2 S** Página `/settings/rate` (solo profesional)
      Modificar tarifa por minuto (750-1500 COP) con validación

---

## Lote 7 — Blockchain CELO (P2)

_Objetivo: Pagos descentralizados con cUSD en Celo._

- [ ] **P2 M** Configurar entorno Hardhat para Celo
      `hardhat.config.ts` con red Alfajores, cuenta de deploy
- [ ] **P2 M** Escribir `OrientaProfPayments.sol`
      `createConsultation()`, `completeConsultation()`, `cancelConsultation()`
      Escrow en cUSD, comisión de plataforma (5%)
- [ ] **P2 S** Escribir `OrientaProfReputation.sol`
      `rateProfessional()`, `getRating()`, historial de calificaciones
- [ ] **P2 M** Tests del contrato (`test/OrientaProfPayments.test.ts`)
      Cobertura: creación, completion, cancelación, reembolso
- [ ] **P2 S** Script de deploy a Alfajores
- [ ] **P2 M** Integrar RainbowKit + Wagmi en el frontend
      `WalletProvider.tsx`, botón conectar wallet, selector de red (Celo)
- [ ] **P2 M** Componente `PaymentButton.tsx`
      Calcula costo (tarifa × duración), firma transacción, muestra confirmación
- [ ] **P2 L** Integrar pago en flujo de agendamiento
      Al agendar cita → cliente firma tx → escrow retiene fondos
- [ ] **P2 S** Webhook de confirmación de transacción
      `/api/payments/webhook` → actualiza Appointment.transactionHash
- [ ] **P2 S** Componente `TransactionHistory.tsx`
      Historial de pagos del usuario (on-chain + DB)

---

## Lote 8 — Experiencia de Usuario (P2)

_Objetivo: Pulir la UX del MVP._

- [ ] **P2 S** Estados de carga (skeleton loaders)
- [ ] **P2 S** Estados vacíos ("No has publicado consultas todavía")
- [ ] **P2 S** Manejo de errores con toasts
- [ ] **P2 S** Confirmación antes de acciones destructivas (eliminar consulta)
- [ ] **P2 S** Tooltips en iconos de navegación
- [ ] **P2 S** Responsive para pantallas < 360px (mantener diseño actual)
- [ ] **P2 S** Feedback visual al guardar (checkmark animado)
- [ ] **P2 S** Proteger rutas por rol (cliente no ve /dashboard/professional)

---

## Lote 9 — Testing (P3)

_Objetivo: Calidad y prevención de regresiones._

- [ ] **P3 M** Configurar Vitest + React Testing Library
- [ ] **P3 M** Tests unitarios de componentes UI (Button, Card, Input, etc.)
- [ ] **P3 M** Tests de Custom Hooks (useAuth, useRequests)
- [ ] **P3 M** Tests de API Routes (registro, login, CRUD requests)
- [ ] **P3 M** Tests de validación Zod
- [ ] **P3 M** Configurar Playwright
- [ ] **P3 L** Tests E2E: flujo completo registro → login → publicar consulta → responder → agendar

---

## Lote 10 — Deploy y Documentación (P3)

_Objetivo: MVP desplegado y documentado._

- [ ] **P3 S** Deploy smart contract a Celo Alfajores (testnet)
- [ ] **P3 S** Verificar contrato en Alfajores block explorer
- [ ] **P3 S** Deploy frontend a Vercel (producción + preview)
- [ ] **P3 S** Configurar dominio personalizado
- [ ] **P3 S** Base de datos PostgreSQL en producción (Railway / Supabase)
- [ ] **P3 M** Documentación técnica: README.md actualizado
- [ ] **P3 M** Documentación de API (auto-generada con JSDoc + typedoc)
- [ ] **P3 S** Guía de usuario (pantallas y flujos)
- [ ] **P3 S** Configurar CI/CD (GitHub Actions: lint, typecheck, test, build)
- [ ] **P3 S** Despedida del prototipo vanilla (archivar `frontend/` legacy)

---

## Resumen de Progreso

| Lote | Tareas | Prioridad | Estado |
|------|--------|-----------|--------|
| 1 — Fundación | 11 | P0 | `10/11` |
| 2 — Backend API | 12 | P0 | `6/12` |
| 3 — Auth y Layout | 8 | P1 | `4/8` |
| 4 — Dashboards | 8 | P1 | `5/8` |
| 5 — Mensajes y Citas | 5 | P1 | `0/5` |
| 6 — Settings | 5 | P2 | `0/5` |
| 7 — Blockchain CELO | 9 | P2 | `0/9` |
| 8 — UX | 8 | P2 | `0/8` |
| 9 — Testing | 7 | P3 | `0/7` |
| 10 — Deploy y Docs | 10 | P3 | `0/10` |
| **Total** | **82** | — | **24/82** |

---

## Notas

- **No iniciar Lote 7** (blockchain) sin completar Lotes 1-2 (backend funcional)
- Los lotes 3-6 pueden solaparse con el 2 una vez que los endpoints base estén listos
- El diseño visual y mobile-first del prototipo actual debe preservarse en la migración
- Los smart contracts deben desplegarse primero en Alfajores (testnet) antes de mainnet
- Toda tarea marcada como completada debe tener su PR asociado y deploy verificado
