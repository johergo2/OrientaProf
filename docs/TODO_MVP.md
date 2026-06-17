# TODO MVP — OrientaProf

> Proyecto: OrientaProf — Orientación con Profesionales
> Estado actual: MVP funcional con escrow CELO Sepolia + Jitsi Meet + Dashboards + Appointments + Payments
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
- [x] **P0 M** Endpoint perfil propio (`/api/user/profile`)
      GET perfil completo + walletAddress + ProfessionalProfile si aplica
- [x] **P0 M** Endpoint actualizar wallet (`/api/user/wallet`)
      PATCH actualiza walletAddress del usuario autenticado
- [x] **P0 M** CRUD consultas (`/api/requests`)
      GET listar consultas del usuario autenticado (cliente ve sus consultas, profesional ve PENDING)
      POST /api/requests — crear consulta (cliente)
      GET /api/requests/[id] — detalle de consulta individual
      POST /api/requests/[id]/cancel — cancelar consulta (cliente)
- [x] **P0 M** Endpoint responder consulta (`/api/requests/[id]`)
      POST /api/requests/[id] — profesional responde → status RESPONDED + crea Message + asigna professionalId
- [x] **P0 M** CRUD profesionales (`/api/professionals`)
      GET listar profesionales + categorías (categoría, rating, rango tarifa)
      Creado GET /api/professionals — retorna profesionales activos con perfil, rating y categorías
- [x] **P0 M** CRUD citas completo (`/api/appointments`)
      POST /api/appointments — agendar cita (cliente)
      GET /api/appointments — listar citas del usuario (con walletAddress incluidas)
      GET /api/appointments/[id] — detalle individual
      POST /api/appointments/[id]/cancel — cancelar (ambos roles, solo si futuro)
      POST /api/appointments/[id]/join — confirmar entrada a videollamada (ambos roles)
      POST /api/appointments/[id]/reschedule — reagendar (ambos roles)
- [x] **P0 M** API de pagos blockchain (`/api/payments/*`)
      POST /api/payments/deposit — registra depósito, crea EscrowTransaction
      POST /api/payments/release — profesional llama release() en contrato
      POST /api/payments/refund — cliente llama refund() en contrato
      GET /api/payments/transactions — historial de transacciones escrow
- [x] **P0 S** Validación inline con checks en cada endpoint (Zod schemas pendientes como lib)

---

## Lote 3 — Frontend: Auth y Layout (P1)

_Objetivo: Sistema de autenticación completo desde el frontend._

- [x] **P1 M** Crear página `/auth/login`
      Formulario con email + password, redirect según rol
- [x] **P1 M** Crear página `/auth/register/client`
      Migrar formulario del prototipo (14 campos + wallet CELO + username autogenerado)
- [x] **P1 M** Crear página `/auth/register/professional`
      Migrar formulario del prototipo (profession, rate, categorías, bank info, wallet CELO)
- [x] **P1 S** PhoneShell layout global en `layout.tsx` con max-width 420px

---

## Lote 4 — Frontend: Dashboards (P1)

_Objetivo: Dashboards funcionales para cliente y profesional conectados a la API._

- [x] **P1 M** Dashboard cliente (`/dashboard/client`)
      Página completa con header (back, mensajes, calendario, settings), tabs "Publicar Consulta" ↔ "Buscar Profesional", listado de profesionales desde BD, formulario de consulta inline
- [x] **P1 M** Dashboard profesional (`/dashboard/professional`)
      Lista de consultas disponibles con filtro por categoría
      Botón "Responder ofreciendo asesoría" navega a /dashboard/professional/respond/[requestId]
      Input wallet CELO + botón guardar
- [x] **P1 M** Página responder consulta (`/dashboard/professional/respond/[requestId]`)
      Muestra detalle de consulta (cliente, categoría, título, descripción, fecha)
      Textarea + botón "Enviar propuesta de asesoría"
      Crea Message + actualiza Request a RESPONDED
- [x] **P1 M** Página `/dashboard/client/my-requests` (Mis consultas)
      Lista con estado (Pendiente/Resuelta/Cancelada), descripción expandible, acciones editar/cancelar/eliminar, botón Nueva Consulta, estado vacío controlado

---

## Lote 5 — Frontend: Citas y Videollamadas (P1)

_Objetivo: Agendamiento y videollamadas con Jitsi Meet + pagos escrow._

- [x] **P1 M** Página `/appointments`
      Tabs (Próximas/Completadas/Canceladas), acciones Ingresar/Cancelar/Reagendar, modal pago CELO con WalletConnect integrado, botones Solicitar reembolso/Solicitar pago conectados a API blockchain
- [x] **P1 M** Página `/appointments/[id]/room`
      Sala Jitsi Meet embebida con iframe de meet.jit.si, nombre de sala = appointment ID
      Pasos: Verificar conexión → Ingresar a la sala → Listo
      Header con nombre/foto del profesional
      Auto-llama a POST /api/appointments/[id]/join al entrar

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

_Objetivo: Pagos descentralizados con CELO nativo mediante escrow._

- [x] **P2 M** Configurar entorno Hardhat para Celo
      `blockchain/hardhat.config.cjs` con red Celo Sepolia + Mainnet, cuenta de deploy
- [x] **P2 M** Escribir y desplegar `OrientaProfPayments.sol`
      `deposit()`, `release()`, `refund()`, `withdraw()`, `getTransaction()`
      Escrow en CELO nativo (msg.value), comisión 5% (gasFeeBps = 500)
      Desplegado en Celo Sepolia en `0x25eC8EC72aBDB67b9C24E5838B0063AeB264a54b`
- [x] **P2 S** Scripts Hardhat
      `blockchain/scripts/deploy.cjs` — deploy a Sepolia
      `blockchain/scripts/generate-wallet.cjs` — generar wallet
      `blockchain/scripts/check-balance.cjs` — verificar balance
- [x] **P2 M** Integrar WalletConnect en el frontend
      `components/WalletConnect.tsx` — conexión via window.ethereum (Rabby/MetaMask)
      Auto-switch a Celo Sepolia, depósito al contrato
- [x] **P2 L** Integrar pago en flujo de agendamiento
      Modal "Pagar con CELO" en /appointments con WalletConnect
      Botones "Solicitar reembolso" / "Solicitar pago" conectados a API release/refund
      `lib/blockchain.ts` con ethers v6 para llamadas al contrato desde backend

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

- [x] **P3 S** Deploy smart contract a Celo Sepolia (testnet) ✅
- [ ] **P3 S** Verificar contrato en Celo Sepolia block explorer
- [ ] **P3 S** Deploy frontend a Vercel (producción + preview)
- [ ] **P3 S** Configurar dominio personalizado
- [ ] **P3 S** Base de datos PostgreSQL en producción (Neon)
- [ ] **P3 M** Documentación técnica: README.md actualizado
- [ ] **P3 S** Guía de usuario (pantallas y flujos)
- [ ] **P3 S** Configurar CI/CD (GitHub Actions: lint, typecheck, test, build)

---

## Resumen de Progreso

| Lote | Tareas | Prioridad | Estado |
|------|--------|-----------|--------|
| 1 — Fundación | 11 | P0 | `10/11` |
| 2 — Backend API | 10 | P0 | `10/10` |
| 3 — Auth y Layout | 5 | P1 | `5/5` |
| 4 — Dashboards | 5 | P1 | `5/5` |
| 5 — Citas y Videollamadas | 3 | P1 | `3/3` |
| 6 — Settings | 5 | P2 | `0/5` |
| 7 — Blockchain CELO | 5 | P2 | `5/5` |
| 8 — UX | 8 | P2 | `2/8` |
| 9 — Testing | 7 | P3 | `0/7` |
| 10 — Deploy y Docs | 8 | P3 | `1/8` |
| **Total** | **67** | — | **41/67** |

---

## Notas

- Smart contract desplegado en **Celo Sepolia** (no Alfajores, deprecado)
- CELO nativo usado en vez de cUSD (evita aprobaciones ERC20)
- WalletConnect via window.ethereum directo (sin RainbowKit/Wagmi)
- Jitsi via meet.jit.si público (sin self-hosted)
- `blockchain/` es CommonJS para evitar conflicto ESM con Next.js
- Toda tarea marcada como completada debe tener su PR asociado y deploy verificado
