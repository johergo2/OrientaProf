# PROJECT_CONTEXT — OrientaProf MVP

> **OrientaProf**: Plataforma que conecta usuarios que buscan orientación profesional con profesionales verificados (abogados, médicos, contadores, ingenieros, etc.) mediante videollamadas cortas pagadas por minuto, con pagos transparentes en blockchain CELO nativo.

---

## 1. MVP — Descripción General

### Propósito
Permitir que cualquier persona publique una consulta gratuita y reciba respuestas de profesionales calificados. Luego de elegir un profesional, agenda una videollamada pagada por minuto. Los pagos se manejan mediante un smart contract en CELO que actúa como escrow, liberando los fondos al profesional solo cuando la videollamada se completa.

### Usuarios objetivo
- **Clientes**: Personas naturales con dudas legales, contables, médicas, financieras, etc.
- **Profesionales**: Abogados, médicos, contadores, ingenieros, arquitectos, economistas, inversionistas, etc.

### Diferenciador clave
Pagos descentralizados con CELO nativo mediante escrow inteligente, garantizando transparencia y confianza sin intermediarios bancarios.

---

## 2. Flujo de Negocio

### Ciclo completo (7 pasos)

```
1. REGISTRO
   Usuario → Formulario registro (según rol) → API → PostgreSQL
   - Cliente: datos personales básicos
   - Profesional: datos personales + profesión + tarifa + documentos (identificación, diploma) + info bancaria

2. PUBLICAR CONSULTA (Cliente)
   Cliente completa formulario:
   - Categoría (tributaria, laboral, médica, legal, emprendimiento)
   - Título
   - Descripción
   → Consulta queda en estado PENDING

3. RESPONDER CONSULTA (Profesional)
   Profesional ve consultas disponibles (filtradas por categoría)
   → Responde con un mensaje ofreciendo sus servicios
   → Consulta pasa a estado RESPONDED
   → Se crea un hilo de mensajes

4. ACEPTAR Y AGENDAR (Cliente)
   Cliente revisa respuestas en bandeja de mensajes
   → Elige profesional → Agenda cita (selecciona fecha/hora y duración: 10, 15, 20 o 30 min)
   → Se genera sala Jitsi Meet

5. PAGO (Blockchain CELO — Escrow)
   Antes de la videollamada:
   - Cliente conecta wallet (Rabby/MetaMask vía WalletConnect)
   - Deposita CELO nativo directamente al smart contract (sin aprobaciones ERC20)
   - Fondos quedan retenidos en escrow (estado PENDIENTE)
   - Backend registra el depósito via `/api/payments/deposit`

6. VIDEOLLAMADA
   Ambos participantes ingresan a sala Jitsi Meet via `/appointments/[id]/room`
   → Cada uno llama `POST /api/appointments/[id]/join`
   → Cuando ambos confirman → status COMPLETED
   → Profesional llama `/api/payments/release` para liberar fondos (con comisión 5%)
   → O cliente llama `/api/payments/refund` para reembolso

7. CALIFICACIÓN (On-chain)
   Cliente califica al profesional (1-5)
   → Score registrado en blockchain (inmutable)
   → Rating sincronizado en base de datos
```

### Reglas de negocio clave
- Las consultas son **gratuitas** para publicar y responder
- Solo se paga por la **videollamada** (tarifa por minuto)
- Tarifa profesional: rango **750 - 1.500 COP/minuto**
- Duración de cita: **10, 15, 20 o 30 minutos**
- Comisión de plataforma: **5%** del valor de la cita
- Un profesional también puede actuar como cliente (consulta a otras especialidades)

---

## 3. Arquitectura Objetivo

### Stack tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | Next.js 14+ (App Router) + TypeScript | SSR, SPA, enrutamiento, API Routes |
| **Estilos** | Tailwind CSS | Sistema utility-first, responsive mobile-first |
| **Estado** | Zustand | Estado global liviano del lado cliente |
| **Fetching** | TanStack Query (React Query) | Caché, sincronización, mutaciones |
| **Formularios** | React Hook Form + Zod | Validación tipada cliente/servidor |
| **Auth** | NextAuth.js (JWT) | Autenticación con sesiones y roles |
| **Backend** | Next.js API Routes | API RESTful unificada con el frontend |
| **ORM** | Prisma | Tipado seguro de base de datos |
| **Base de datos** | PostgreSQL | Datos relacionales del negocio |
| **Video** | Jitsi Meet API (embebido) | Videollamadas sin infraestructura propia |
| **Smart Contracts** | Solidity + Hardhat | Lógica de pagos on-chain |
| **Blockchain** | Celo (Sepolia → Mainnet) | Pagos con CELO nativo, transparencia |
| **Wallet** | WalletConnect via `window.ethereum` (Rabby/MetaMask) | Conexión directa sin dependencias externas |
| **Ethers** | ethers v6 | Interacción con contratos desde backend (JsonRpcProvider + Wallet) |
| **Testing** | Vitest + Playwright | Tests unitarios y de integración |
| **Deploy** | Vercel (frontend) + Supabase (DB) + Celo (contracts) | Infraestructura cloud |

### Diagrama de capas

```
┌──────────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Next.js  │  │ Tailwind │  │   Zustand  │  │ TanStack      │  │
│  │ (React)  │  │   CSS    │  │  (Estado)  │  │ Query (Cache) │  │
│  └────┬─────┘  └──────────┘  └────────────┘  └───────┬───────┘  │
│       │         WalletConnect (window.ethereum)         │          │
│       │          (Rabby / MetaMask → CELO)             │          │
└──────────────────────┬───────────────────────────────────────────┘
                       │
           ┌───────────┼───────────────┐
           ▼           ▼               ▼
┌─────────────────┐  ┌────────────┐  ┌──────────────────────────┐
│ Next.js API     │  │ NextAuth   │  │  CELO Blockchain         │
│ Routes (REST)   │  │ (JWT)      │  │  ┌──────────────────┐   │
│ /api/auth/*     │  │            │  │  │OrientaProf       │   │
│ /api/users/*    │  │            │  │  │Payments.sol      │   │
│ /api/requests/* │  │            │  │  │(Escrow cUSD)     │   │
│ /api/messages/* │  │            │  │  └──────────────────┘   │
│ /api/payments/* │  │            │  │  ┌──────────────────┐   │
│ /api/...        │  │            │  │  │OrientaProf       │   │
│                 │  │            │  │  │Reputation.sol    │   │
└────────┬────────┘  └────────────┘  │  │(Calificaciones)  │   │
         │                           │  └──────────────────┘   │
         ▼                           └──────────────────────────┘
┌────────────────┐
│    Prisma      │
│    (ORM)       │
└────────┬───────┘
         ▼
┌────────────────┐
│  PostgreSQL    │
│  (Datos app)   │
└────────────────┘

         ┌────────────────┐
         │  Jitsi Meet    │
         │  (Videollamada)│
         └────────────────┘
```

### Estructura de directorios real (MVP)

```
/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx                # Layout raíz (PhoneShell max-width 420px)
│   ├── page.tsx                  # Landing / Welcome
│   ├── globals.css               # Tailwind v4 + colores brand-*
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/
│   │   │   ├── client/page.tsx
│   │   │   └── professional/page.tsx
│   ├── dashboard/
│   │   ├── client/
│   │   │   ├── page.tsx          # Dashboard cliente (publicar + buscar)
│   │   │   └── my-requests/page.tsx
│   │   └── professional/
│   │       ├── page.tsx          # Dashboard profesional (consultas + wallet)
│   │       └── respond/
│   │           └── [requestId]/page.tsx
│   ├── appointments/
│   │   ├── page.tsx              # Lista + modal pago CELO
│   │   └── [id]/room/page.tsx    # Sala Jitsi Meet
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts
│       │   └── register/route.ts
│       ├── user/
│       │   ├── wallet/route.ts
│       │   └── profile/route.ts
│       ├── professionals/route.ts
│       ├── requests/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── cancel/route.ts
│       ├── messages/route.ts
│       ├── appointments/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── join/route.ts
│       │       └── cancel/route.ts
│       └── payments/
│           ├── deposit/route.ts
│           ├── release/route.ts
│           ├── refund/route.ts
│           └── transactions/route.ts
├── components/                   # Componentes React
│   ├── ui/                       # Button, Card, Input, Badge, Modal, Spinner
│   ├── layout/                   # PhoneShell, TopBar, NavIcons
│   ├── auth/                     # LoginForm, RegisterForm (2 roles)
│   ├── client/                   # ProfessionalCard
│   ├── blockchain/               # WalletConnect
│   └── icons/                    # SVG iconos
├── lib/
│   ├── prisma.ts                 # Cliente Prisma singleton
│   ├── auth.ts                   # Configuración NextAuth
│   ├── auth.config.ts            # Auth config de edge/middleware
│   ├── validations.ts            # Schemas Zod
│   ├── constants.ts              # Constantes del negocio
│   ├── api-response.ts           # Helpers de respuesta HTTP
│   └── blockchain.ts             # ethers v6 helpers (callRelease, callRefund, getTransaction)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── contracts/                    # Smart Contract Solidity
│   └── OrientaProfPayments.sol
├── blockchain/                   # Hardhat subproject (CommonJS)
│   ├── hardhat.config.cjs
│   ├── package.json
│   ├── contracts/OrientaProfPayments.sol
│   └── scripts/
│       ├── deploy.cjs
│       ├── deploy-local.cjs
│       ├── generate-wallet.cjs
│       └── check-balance.cjs
├── public/assets/
├── types/                        # next-auth.d.ts
├── middleware.ts                 # Protección de rutas
├── backend/                      # (Legacy) prototipo vanilla
├── frontend/                     # (Legacy) prototipo vanilla
├── .env / .env.example
├── eslint.config.mjs
├── next.config.ts
├── vercel.json
├── tsconfig.json
└── package.json
```

---

## 4. Entidades de Base de Datos (Prisma)

### Resumen de modelos

El schema Prisma actual contiene los siguientes modelos y enums (ver `prisma/schema.prisma` para el modelo completo):

- **User** — Usuario del sistema (cliente o profesional). Campos: id, username, email, passwordHash, role, fullName, walletAddress, datos personales opcionales.
- **ProfessionalProfile** — Extensión del perfil profesional: profession, ratePerMinute, rating, experienceYears, description, documentFile, diplomaFile.
- **ProfessionalCategory** — Categorías/áreas de especialización del profesional.
- **Request** — Consulta publicada por un cliente. Status: PENDING → RESPONDED → CANCELLED/COMPLETED.
- **Message** — Mensajes dentro del hilo de una consulta.
- **Appointment** — Cita agendada para videollamada. Status: SCHEDULED, COMPLETED, CANCELLED. Campos: scheduledAt, durationMinutes, totalCost, clientConfirmed, professionalConfirmed.
- **EscrowTransaction** — Transacción de depósito en escrow. Status: PENDIENTE → LIBERADA/REEMBOLSADA. Relación 1:1 con Appointment. Campos: transactionIndex, clientAddress, professionalAddress, amount, depositTxHash, releaseTxHash, refundTxHash.
- **BankInfo** — Información bancaria del profesional para retiros fiduciarios.

### Descripción de entidades

| Entidad | Propósito |
|---------|-----------|
| **User** | Usuario del sistema (cliente o profesional). Almacena credenciales, datos personales y dirección wallet CELO. |
| **ProfessionalProfile** | Extensión del perfil profesional: profesión, tarifa, rating, documentos de verificación. |
| **ProfessionalCategory** | Categorías/áreas en las que se especializa un profesional (ej: "Derecho laboral", "Contabilidad tributaria"). |
| **Request** | Consulta publicada por un cliente. Puede ser respondida por profesionales. |
| **Message** | Mensajes dentro del hilo de una consulta. El primer mensaje del profesional constituye su "respuesta" a la consulta. |
| **Appointment** | Cita agendada para videollamada. Almacena sala Jitsi, hash de transacción y costo. |
| **PaymentTransaction** | Registro de cada transacción on-chain (escrow, liberación, reembolso). |
| **BankInfo** | Información bancaria del profesional para retiros fiduciarios (off-ramp). |

---

## 5. Diseño de Smart Contracts (Solididad — CELO)

### OrientaProfPayments.sol — Contrato principal de pagos

Propósito: Escrow en cUSD para videollamadas. Retiene fondos del cliente y los libera al profesional al completarse la llamada.

```solidity
// Diseño conceptual del contrato

contract OrientaProfPayments {
    // Tokens aceptados (cUSD en Celo)
    IERC20 public cUSD;

    // Comisión de plataforma (5% = 50 basis points)
    uint256 public platformFee = 50; // en basis points (0.01%)
    address public platformWallet;

    // Estructura de una consulta/escrow
    struct Consultation {
        address client;
        address professional;
        uint256 amount;           // Total depositado en cUSD
        uint256 ratePerMinute;    // Tarifa por minuto
        uint256 durationMinutes;  // Duración acordada
        uint256 startTime;        // Timestamp de inicio
        uint256 endTime;          // Timestamp de finalización
        ConsultationStatus status;
    }

    enum ConsultationStatus { CREATED, IN_PROGRESS, COMPLETED, CANCELLED }

    mapping(uint256 => Consultation) public consultations;
    uint256 public consultationCounter;

    // Eventos
    event ConsultationCreated(uint256 indexed id, address indexed client, address indexed professional, uint256 amount);
    event ConsultationStarted(uint256 indexed id);
    event ConsultationCompleted(uint256 indexed id, uint256 amountReleased);
    event ConsultationCancelled(uint256 indexed id, uint256 amountRefunded);

    // Funciones principales
    function createConsultation(
        address _professional,
        uint256 _ratePerMinute,
        uint256 _durationMinutes
    ) external returns (uint256 consultationId);

    function startConsultation(uint256 _consultationId) external;

    function completeConsultation(uint256 _consultationId) external;

    function cancelConsultation(uint256 _consultationId) external;

    function withdrawFunds() external; // Solo plataforma
}
```

### Flujo de fondos

```
1. DEPOSIT: Cliente envía CELO nativo via msg.value al contrato
   - amount = ratePerMinute × durationMinutes
   - Fondos quedan retenidos en escrow (PENDIENTE)

2. JOIN: Ambos participantes ingresan a la videollamada
   - Cada uno llama POST /api/appointments/[id]/join
   - Cuando ambos confirman → status COMPLETED

3. RELEASE: Profesional llama release(txIndex) via backend API
   - EscrowTransaction cambia a LIBERADA
   - Fondos disponibles para retiro del profesional (withdraw)

4. REFUND: Cliente llama refund(txIndex) via backend API
   - Se descuenta 5% (gasFeeBps = 500)
   - Resto devuelto al cliente
   - EscrowTransaction cambia a REEMBOLSADA
```

### OrientaProfReputation.sol — (deferido fuera del MVP)

El contrato de reputación on-chain queda fuera del MVP. Las calificaciones se manejan solo en base de datos si se implementan.

### Integración con el backend

El backend se comunica con el contrato mediante:
- **WalletConnect (window.ethereum)** (frontend → firma de depósito del cliente)
- **ethers v6** (backend → llamadas release/refund via JsonRpcProvider + Wallet signer)
- **API Routes** (`/api/payments/deposit`, `/api/payments/release`, `/api/payments/refund`) sincronizan el estado off-chain con el contrato

---

## 6. Estado Actual del Proyecto

### Estado actual (MVP funcional)
- **Next.js 16** + **TypeScript** + **Tailwind v4** + **Prisma v5** + **NextAuth v5**
- Registro dual-rol con validación, login con NextAuth (credentials + JWT)
- Middleware de protección de rutas por rol
- Schema Prisma completo con seed de prueba (PostgreSQL)
- **API endpoints** (17 rutas implementadas):
  - Auth: register, login/logout/session (NextAuth)
  - Usuarios: GET /api/user/profile, PATCH /api/user/wallet
  - Profesionales: GET /api/professionals
  - Requests: CRUD completo + responder + cancelar (6 endpoints)
  - Mensajes: GET bandeja por conversación, POST enviar (2 endpoints)
  - Citas: POST agendar, GET listar, GET detalle, POST join, POST cancelar (5 endpoints)
  - Pagos: POST deposit, POST release, POST refund, GET transactions (4 endpoints)
- **Dashboards** completos: cliente (/dashboard/client + my-requests), profesional (/dashboard/professional + respond/[id])
- **Appointments** page (`/appointments`): tabs, join/cancel/reschedule, modal pago CELO, botones refund/release
- **Jitsi Meet** room (`/appointments/[id]/room`): iframe con meet.jit.si, verificación, join automático
- **Smart contract `OrientaProfPayments`** desplegado en Celo Sepolia (`0x25eC8EC72aBDB67b9C24E5838B0063AeB264a54b`)
- **WalletConnect** component: conexión Rabby/MetaMask, switch a Celo Sepolia, depósito al contrato
- **Blockchain helpers** (`lib/blockchain.ts`): ethers v6, JsonRpcProvider + Wallet, callRelease/callRefund/getTransaction
- **Hardhat** subdirectorio (`blockchain/`): CommonJS, scripts deploy/generate-wallet/check-balance
- Prototipo legacy `frontend/` preservado como referencia

### Siguiente paso
Deploy a Vercel + Supabase (PostgreSQL producción). Demo walkthrough. El plan detallado está en `TODO_MVP.md`.

### Convenios del proyecto
- **Estado**: `[ ]` Pendiente, `[x]` Completado, `[~]` En progreso
- **Prioridad**: P0 (bloqueante), P1 (alta), P2 (media), P3 (baja)
- **Esfuerzo**: S (horas), M (días), L (semanas)
- Preservar diseño visual mobile-first (max-width 420px, PhoneShell) del prototipo actual

---

## 7. Variables de Entorno Requeridas

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

# Next.js public envs
NEXT_PUBLIC_CELO_PAYMENTS_CONTRACT_ADDRESS="0x25eC8EC72aBDB67b9C24E5838B0063AeB264a54b"
NEXT_PUBLIC_CELO_RPC_URL="https://forno.celo-sepolia.celo-testnet.org"
NEXT_PUBLIC_CELO_CHAIN_ID="11142220"
```
