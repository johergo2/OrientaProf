# Arquitectura de OrientaProf — MVP + Blockchain CELO

## Visión General

OrientaProf conecta **usuarios** que buscan orientación profesional con **profesionales** (abogados, médicos, contadores, ingenieros, etc.) mediante videollamadas cortas pagadas por minuto. Los pagos se manejan mediante un smart contract en CELO que actúa como escrow.

---

## Stack Tecnológico (Actual)

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | Next.js 16 (App Router) + TypeScript | SSR, SPA, enrutamiento, API Routes |
| **Estilos** | Tailwind CSS v4 | Sistema utility-first, responsive mobile-first, `@theme inline` |
| **Auth** | NextAuth.js v5 (JWT, credentials) | Autenticación con sesiones y roles |
| **Backend** | Next.js API Routes | API RESTful unificada con el frontend (17 endpoints) |
| **ORM** | Prisma v5 | Tipado seguro de base de datos (11 modelos) |
| **Base de datos** | PostgreSQL | Datos relacionales del negocio |
| **Video** | Jitsi Meet vía iframe (`meet.jit.si`) | Videollamadas sin infraestructura propia |
| **Smart Contract** | Solidity 0.8.20 + OpenZeppelin Ownable | Escrow en CELO nativo |
| **Blockchain** | Celo Sepolia (testnet) | Pagos con CELO nativo |
| **Wallet** | WalletConnect via `window.ethereum` (Rabby/MetaMask) | Conexión directa sin dependencias externas |
| **Ethers** | ethers v6 | Interacción con contratos desde backend (JsonRpcProvider + Wallet) |
| **Hardhat** | Hardhat (CommonJS) | Deploy y scripts blockchain |
| **Formularios** | Zod | Schemas de validación compartidos |
| **Deploy** | Vercel (frontend) + Supabase (DB) | Infraestructura cloud |

---

## Estructura de Directorios (Actual)

```
/
├── app/                              # Next.js 16 App Router
│   ├── layout.tsx                    # Layout raíz (PhoneShell max-width 420px)
│   ├── page.tsx                      # Landing / Welcome
│   ├── globals.css                   # Tailwind v4 + colores brand-*
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/
│   │       ├── client/page.tsx
│   │       └── professional/page.tsx
│   ├── dashboard/
│   │   ├── client/
│   │   │   ├── page.tsx              # Dashboard cliente
│   │   │   └── my-requests/page.tsx
│   │   └── professional/
│   │       ├── page.tsx              # Dashboard profesional (consultas + wallet)
│   │       └── respond/
│   │           └── [requestId]/page.tsx
│   ├── appointments/
│   │   ├── page.tsx                  # Lista + modal pago CELO
│   │   └── [id]/room/page.tsx        # Sala Jitsi Meet
│   ├── messages/
│   │   ├── page.tsx                  # Bandeja de conversaciones
│   │   └── [conversationId]/page.tsx # Hilo de mensajes
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts
│       │   └── register/route.ts
│       ├── user/
│       │   ├── wallet/route.ts       # PATCH walletAddress
│       │   └── profile/route.ts      # GET perfil propio
│       ├── professionals/route.ts    # GET listar
│       ├── requests/
│       │   ├── route.ts              # GET listar + POST crear
│       │   └── [id]/
│       │       ├── route.ts          # GET detalle + POST responder
│       │       └── cancel/route.ts   # POST cancelar
│       ├── messages/route.ts         # GET bandeja + POST enviar
│       ├── appointments/
│       │   ├── route.ts              # GET listar + POST agendar
│       │   └── [id]/
│       │       ├── route.ts          # GET detalle
│       │       ├── join/route.ts     # POST confirmar entrada
│       │       └── cancel/route.ts   # POST cancelar
│       └── payments/
│           ├── deposit/route.ts      # POST registrar depósito
│           ├── release/route.ts      # POST liberar (profesional)
│           ├── refund/route.ts       # POST reembolsar (cliente)
│           └── transactions/route.ts # GET historial escrow
├── components/
│   ├── blockchain/WalletConnect.tsx  # WalletConnect (único componente extractado)
│   └── (resto de UI va inline en las páginas)
├── lib/
│   ├── prisma.ts                     # Cliente Prisma singleton
│   ├── auth.ts                       # Configuración NextAuth
│   ├── auth.config.ts                # Auth config para edge/middleware
│   ├── validations.ts                # Schemas Zod
│   ├── constants.ts                  # Constantes del negocio
│   ├── api-response.ts               # Helpers HTTP (success, error, etc.)
│   ├── blockchain.ts                 # ethers v6 (callRelease, callRefund, getTransaction)
│   ├── proposal-utils.ts             # Utilidades de propuestas
│   └── utils.ts                      # Funciones helper
├── contracts/
│   └── OrientaProfPayments.sol       # Smart contract (copia en blockchain/)
├── blockchain/                       # Hardhat subproject (CommonJS)
│   ├── hardhat.config.cjs
│   ├── package.json
│   ├── contracts/OrientaProfPayments.sol
│   └── scripts/
│       ├── deploy.cjs                # Deploy a Sepolia/Mainnet
│       ├── deploy-local.cjs          # Test local + validación
│       ├── generate-wallet.cjs       # Generar wallet
│       └── check-balance.cjs         # Verificar balance
├── prisma/
│   ├── schema.prisma                 # 11 modelos + 4 enums
│   └── seed.ts                       # Datos de prueba
├── types/                            # next-auth.d.ts
├── public/assets/                    # OrientaProf.png
├── middleware.ts                     # Protección de rutas por sesión
├── backend/                          # (Legacy) prototipo vanilla
├── frontend/                         # (Legacy) prototipo vanilla
├── .env / .env.example
├── eslint.config.mjs
├── next.config.ts
├── vercel.json
├── tsconfig.json
└── package.json
```

---

## Modelo de Datos (Prisma)

El schema actual tiene **11 modelos** y **4 enums**. Resumen:

| Modelo | Relaciones clave | Propósito |
|--------|-----------------|-----------|
| **User** | 1:1 → ProfessionalProfile, BankInfo; 1:N → Request, Appointment, Message | Cuenta unificada con walletAddress |
| **ProfessionalProfile** | 1:1 ← User; 1:N → ProfessionalCategory | Perfil profesional (tarifa, rating, docs) |
| **ProfessionalCategory** | N:1 ← ProfessionalProfile | Especialidades (ej: "Derecho laboral") |
| **BankInfo** | 1:1 ← User | Info bancaria del profesional |
| **Request** | N:1 ← User (client/professional); 1:N → Message, Appointment | Consulta del cliente |
| **Message** | N:1 ← User, Request | Mensajes en hilo de consulta |
| **Appointment** | N:1 ← User (client/professional); 1:1 → EscrowTransaction | Cita con `clientConfirmed`/`professionalConfirmed` |
| **AttendanceConfirmation** | 1:1 ← Appointment | Confirmación de asistencia |
| **PaymentTransaction** | 1:1 ← Appointment | Registro off-chain de pagos |
| **EscrowTransaction** | 1:1 ← Appointment (unique), almacena `clientAddress`/`professionalAddress` como strings | Espejo del estado on-chain |
| **AuditLog** | N:1 ← User (opcional) | Auditoría de acciones |

El schema completo está en `prisma/schema.prisma` y documentado en `DATABASE_SCHEMA.md`.

---

## Arquitectura por Capas

```
┌──────────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐   │
│  │ Next.js  │  │ Tailwind │  │  fetch() / API Routes        │   │
│  │ (React)  │  │   CSS    │  │  (sin TanStack Query)        │   │
│  └────┬─────┘  └──────────┘  └──────────────┬───────────────┘   │
│       │         WalletConnect (window.ethereum)                  │
│       │          (Rabby / MetaMask → CELO)                      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
           ┌───────────┼────────────────────┐
           ▼           ▼                    ▼
┌─────────────────┐  ┌────────────┐  ┌──────────────────────────┐
│ Next.js API     │  │ NextAuth   │  │  CELO Blockchain         │
│ Routes (REST)   │  │ (JWT)      │  │  ┌──────────────────┐   │
│                 │  │            │  │  │OrientaProf       │   │
│  /api/auth/*    │  │ Login      │  │  │Payments.sol      │   │
│  /api/user/*    │  │ Registro   │  │  │(Escrow CELO)     │   │
│  /api/requests/*│  │ Sesión     │  │  │deposit/release   │   │
│  /api/messages/*│  │ Middleware  │  │  │refund/withdraw   │   │
│  /api/payments/*│  │            │  │  └──────────────────┘   │
│  /api/...       │  │            │  │  deploy: 0x25eC8E...   │
└────────┬────────┘  └────────────┘  └──────────────────────────┘
         │
         ▼
┌────────────────┐
│    Prisma      │
│    (ORM)       │
└────────┬───────┘
         ▼
┌────────────────┐          ┌────────────────┐
│  PostgreSQL    │          │  Jitsi Meet    │
│  (Datos app)   │          │  (Videollamada)│
└────────────────┘          └────────────────┘
```

---

## Flujo de Datos — Ciclo Completo

```
1. REGISTRO
   Usuario → Formulario → /api/auth/register → Prisma → PostgreSQL
   (si PROFESSIONAL: también crea ProfessionalProfile + Categories + BankInfo)

2. PUBLICAR CONSULTA (Cliente)
   Cliente → Formulario inline → POST /api/requests → Request { status: PENDING }

3. RESPONDER CONSULTA (Profesional)
   Profesional → Dashboard ve PENDING → /dashboard/professional/respond/[id]
   → POST /api/requests/:id → Request { status: RESPONDED, professionalId }
   → INSERT Message (primera respuesta)

4. ACEPTAR Y AGENDAR (Cliente)
   Cliente → /messages → ve respuesta → agenda cita
   → POST /api/appointments → Appointment { status: SCHEDULED, totalCost }

5. PAGO (Blockchain CELO)
   Antes de la videollamada:
   ┌─ Wallet Cliente ─┐       ┌─ Smart Contract ─┐
   │ Deposita CELO    │ ───→  │ Escrow: retiene  │
   │ via msg.value    │       │ PENDIENTE        │
   └──────────────────┘       └──────┬───────────┘
                                     │
   POST /api/payments/deposit        │
   → Crea EscrowTransaction          │
     { status: PENDIENTE }          │

6. VIDEOLLAMADA
   Ambos → /appointments/[id]/room → Jitsi Meet iframe
   → Cada uno llama POST /api/appointments/:id/join
   → clientConfirmed/professionalConfirmed = true
   → Cuando ambos confirman → Appointment { status: COMPLETED }

7. LIBERACIÓN / REEMBOLSO
   Si videollamada completada:
   → Profesional llama POST /api/payments/release
     → Backend llama contract.release(transactionIndex)
     → EscrowTransaction { status: LIBERADA }

   Si hay controversia:
   → Cliente llama POST /api/payments/refund
     → Backend llama contract.refund(transactionIndex)
     → EscrowTransaction { status: REEMBOLSADA }
     → Cliente recibe amount - 5% (gas fee)
```

---

## Smart Contract — OrientaProfPayments.sol

### Funciones del contrato (desplegado en Celo Sepolia)

```
Funciones principales:
├── deposit(string _consultationId, address _professionalWallet) external payable
│   → Cliente envía CELO via msg.value
│   → Crea Transaction { PENDIENTE }
│   → Emite TransactionCreated
├── release(uint256 _transactionIndex) external onlyBackend validTransaction
│   → Libera fondos: Transaction.status → LIBERADA
│   → (profesional puede llamar withdraw para retirar)
├── refund(uint256 _transactionIndex) external onlyBackend validTransaction
│   → Reembolsa al cliente: Transaction.status → REEMBOLSADA
│   → Envía amount - gasFee (5%) al cliente
│   → Envía gasFee a platformWallet
├── withdraw(uint256 _transactionIndex) external validTransaction
│   → Profesional retira fondos LIBERADOS a su wallet
│   → Transaction.status → REEMBOLSADA (reusado como "retirado")
├── setPlatformWallet / setAuthorizedBackend / setGasFeeBps
│   → Solo owner (OpenZeppelin Ownable)
└── getTransaction / getTransactionsByClient / getTransactionsByProfessional
    → View functions
```

### Detalles de despliegue

| Parámetro | Valor |
|-----------|-------|
| **Red** | Celo Sepolia (chainId: 11142220) |
| **Dirección** | `0x25eC8EC72aBDB67b9C24E5838B0063AeB264a54b` |
| **Deployer/Owner** | `0xBa68cc2e8858BdaA452d4a7f04cfcD9799958095` |
| **Gas fee** | 5% (500 bps) |
| **Token** | CELO nativo (no cUSD) |

### Integración con el backend

- **WalletConnect** (frontend): firma `deposit()` del cliente via `window.ethereum`
- **`lib/blockchain.ts`** (backend): ethers v6, llama `release()` y `refund()` usando JsonRpcProvider + Wallet signer
- **API Routes**: sincronizan estado off-chain con el contrato

---

## Seguridad

| Aspecto | Implementación |
|---------|---------------|
| **Auth** | NextAuth.js con JWT, httpOnly cookies |
| **Passwords** | bcrypt |
| **API** | Validación Zod, middleware de rol y ownership |
| **Blockchain** | OpenZeppelin Ownable, solo backend autorizado para release/refund, patrón checks-effects-interactions |
| **Video** | Sala Jitsi pública sin autenticación (MVP) |
| **Datos** | Prisma prepared statements, SQL injection prevenido |
| **HTTPS** | Forzado en producción |

---

## API Routes (Resumen)

| Método | Ruta | Autenticación | Propósito |
|--------|------|--------------|-----------|
| POST | `/api/auth/register` | — | Registro dual-rol |
| POST | `/api/auth/login` | — | Inicio de sesión (NextAuth) |
| GET | `/api/auth/session` | Sesión | Sesión actual |
| POST | `/api/auth/logout` | Sesión | Cerrar sesión |
| GET | `/api/user/profile` | Sesión | Perfil propio |
| PATCH | `/api/user/wallet` | Sesión | Actualizar wallet CELO |
| GET | `/api/professionals` | — | Listar profesionales activos |
| POST | `/api/requests` | CLIENT | Crear consulta |
| GET | `/api/requests` | Ambos | Listar consultas |
| GET | `/api/requests/:id` | Ambos | Detalle consulta |
| POST | `/api/requests/:id` | PROFESSIONAL | Responder consulta |
| POST | `/api/requests/:id/cancel` | CLIENT | Cancelar consulta |
| GET | `/api/messages` | Cualquiera | Bandeja de mensajes |
| POST | `/api/messages` | Cualquiera | Enviar mensaje |
| POST | `/api/appointments` | Ambos | Agendar cita |
| GET | `/api/appointments` | Cualquiera | Listar citas |
| GET | `/api/appointments/:id` | Cualquiera | Detalle cita |
| POST | `/api/appointments/:id/join` | Ambos | Confirmar entrada |
| POST | `/api/appointments/:id/cancel` | Ambos | Cancelar cita |
| POST | `/api/payments/deposit` | CLIENT | Registrar depósito escrow |
| POST | `/api/payments/release` | PROFESSIONAL | Liberar fondos |
| POST | `/api/payments/refund` | CLIENT | Reembolsar fondos |
| GET | `/api/payments/transactions` | Cualquiera | Historial escrow |

---

## Estado del Proyecto

| Área | Estado |
|------|--------|
| Fundación (Next.js + TypeScript + Tailwind + Prisma) | ✅ 10/11 |
| Backend API | ✅ 10/10 |
| Auth y Layout | ✅ 5/5 |
| Dashboards | ✅ 5/5 |
| Citas y Videollamadas | ✅ 3/3 |
| Blockchain CELO | ✅ 5/5 |
| Settings | ❌ 0/5 |
| UX | ⚠️ 2/8 |
| Testing | ❌ 0/7 |
| Deploy y Docs | ⚠️ 1/8 |

**Total**: 41/67 tareas completas. Detalle en `TODO_MVP.md`.

---

## Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Jitsi Meet (público)
NEXT_PUBLIC_JITSI_DOMAIN="meet.jit.si"

# CELO Blockchain (Sepolia testnet)
CELO_RPC_URL="https://forno.celo-sepolia.celo-testnet.org"
CELO_PRIVATE_KEY="0x..."
CELO_PAYMENTS_CONTRACT_ADDRESS="0x25eC8EC72aBDB67b9C24E5838B0063AeB264a54b"

# Next.js public envs (cliente)
NEXT_PUBLIC_CELO_PAYMENTS_CONTRACT_ADDRESS="0x25eC8EC72aBDB67b9C24E5838B0063AeB264a54b"
NEXT_PUBLIC_CELO_RPC_URL="https://forno.celo-sepolia.celo-testnet.org"
NEXT_PUBLIC_CELO_CHAIN_ID="11142220"
```
