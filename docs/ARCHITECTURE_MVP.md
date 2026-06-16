# Arquitectura de OrientaProf — MVP + Blockchain CELO

## Visión General

OrientaProf conecta **usuarios** que buscan orientación profesional con **profesionales** (abogados, médicos, contadores, ingenieros, etc.) mediante videollamadas cortas pagadas por minuto. El sistema evoluciona de un prototipo frontend vanilla hacia una **arquitectura moderna full-stack** con capa blockchain en CELO para pagos transparentes.

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | Next.js 14+ (App Router) + TypeScript | SSR, SPA, enrutamiento, API Routes |
| **Estilos** | Tailwind CSS | Sistema utility-first, responsive, mobile-first |
| **Estado** | Zustand | Estado global liviano del lado cliente |
| **Fetching** | TanStack Query (React Query) | Caché, sincronización, mutaciones de API |
| **Formularios** | React Hook Form + Zod | Validación cliente/servidor tipada |
| **Auth** | NextAuth.js (JWT) | Autenticación con sesiones y roles |
| **Backend** | Next.js API Routes | API RESTful unificada con el frontend |
| **ORM** | Prisma | Tipado seguro de base de datos |
| **Base de datos** | PostgreSQL | Datos relacionales del negocio |
| **Video** | Jitsi Meet API (embebido) | Videollamadas sin infraestructura propia |
| **Smart Contracts** | Solidity + Hardhat | Lógica de pagos on-chain |
| **Blockchain** | Celo (Alfajores → Mainnet) | Pagos con cUSD, transparencia |
| **Wallet** | RainbowKit + Wagmi + Viem | Conexión de wallets (MetaMask, Valora) |
| **SDK Celo** | @celo/contractkit | Interacción con contratos en Celo |
| **Testing** | Vitest + Playwright | Tests unitarios y de integración |
| **Deploy** | Vercel (frontend) + Railway (DB) + Celo (contracts) | Infraestructura cloud |

---

## Estructura de Directorios

```
/
├── app/                                    # Next.js 14 App Router
│   ├── layout.tsx                          # Layout raíz (Providers, Navbar)
│   ├── page.tsx                            # Landing / Welcome
│   ├── auth/
│   │   ├── login/page.tsx                  # Inicio de sesión
│   │   ├── register/
│   │   │   ├── client/page.tsx             # Registro usuario
│   │   │   └── professional/page.tsx       # Registro profesional
│   │   └── callback/route.ts              # NextAuth callback
│   ├── dashboard/
│   │   ├── client/
│   │   │   ├── page.tsx                    # Dashboard cliente
│   │   │   ├── requests/page.tsx           # Mis consultas
│   │   │   └── professionals/page.tsx      # Buscar profesionales
│   │   └── professional/
│   │       ├── page.tsx                    # Dashboard profesional
│   │       └── respond/
│   │           └── [requestId]/page.tsx    # Responder consulta
│   ├── messages/
│   │   └── page.tsx                        # Bandeja de mensajes
│   ├── appointments/
│   │   └── page.tsx                        # Calendario de citas
│   ├── settings/
│   │   ├── page.tsx                        # Menú configuración
│   │   ├── personal-data/page.tsx          # Datos personales
│   │   ├── password/page.tsx               # Cambiar contraseña
│   │   └── payment/page.tsx               # Información de pago
│   ├── consultation/
│   │   └── [id]/page.tsx                   # Sala de videollamada
│   └── api/                               # API Routes (backend)
│       ├── auth/
│       │   ├── [...nextauth]/route.ts      # NextAuth handler
│       │   └── register/route.ts           # Registro de usuarios
│       ├── users/
│       │   ├── [id]/route.ts               # CRUD usuario
│       │   └── me/route.ts                 # Perfil del usuario autenticado
│       ├── professionals/
│       │   ├── route.ts                    # Listar profesionales
│       │   ├── [id]/route.ts              # Perfil profesional
│       │   └── rate/route.ts              # Actualizar tarifa
│       ├── requests/
│       │   ├── route.ts                    # GET listar + POST crear consultas
│       │   └── [id]/
│       │       └── route.ts                # GET detalle + POST responder
│       ├── messages/
│       │   └── route.ts                    # Mensajes (CRUD)
│       ├── appointments/
│       │   └── route.ts                    # Citas (CRUD)
│       └── payments/
│           ├── route.ts                    # Iniciar pago
│           └── webhook/route.ts           # Webhook CELO
├── components/                            # Componentes React reutilizables
│   ├── ui/                                # Design system
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── TopBar.tsx
│   │   ├── Badge.tsx
│   │   └── Toast.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   └── PhoneShell.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── RoleSelector.tsx
│   ├── client/
│   │   ├── RequestForm.tsx
│   │   ├── RequestCard.tsx
│   │   ├── ProfessionalCard.tsx
│   │   └── ProfessionalSearch.tsx
│   ├── professional/
│   │   ├── AvailableRequests.tsx
│   │   ├── RateEditor.tsx
│   │   └── ProfessionalProfile.tsx
│   ├── messages/
│   │   ├── MessageList.tsx
│   │   └── MessageThread.tsx
│   ├── appointments/
│   │   ├── CalendarView.tsx
│   │   └── AppointmentCard.tsx
│   ├── video/
│   │   └── VideoCallRoom.tsx
│   └── blockchain/
│       ├── WalletConnect.tsx
│       ├── PaymentButton.tsx
│       └── TransactionHistory.tsx
├── lib/                                   # Utilidades y lógica compartida
│   ├── prisma.ts                          # Cliente Prisma singleton
│   ├── auth.ts                            # Configuración NextAuth
│   ├── validations.ts                     # Schemas Zod
│   ├── constants.ts                       # Constantes del negocio
│   ├── utils.ts                           # Funciones helper
│   └── celo.ts                           # Utilidades CELO (conexión, formatos)
├── prisma/                                # Schema y migraciones
│   ├── schema.prisma                      # Modelo de datos completo
│   └── seed.ts                            # Datos de prueba
├── contracts/                             # Smart Contracts Solidity
│   ├── contracts/
│   │   ├── OrientaProfPayments.sol        # Contrato principal de pagos
│   │   └── OrientaProfReputation.sol      # Contrato de reputación
│   ├── scripts/
│   │   ├── deploy.ts                      # Deploy a Celo
│   │   └── interact.ts                    # Interacción con contrato
│   ├── test/
│   │   └── OrientaProfPayments.test.ts    # Tests del contrato
│   ├── hardhat.config.ts                  # Config Hardhat
│   └── .env.example                       # Variables de entorno
├── hooks/                                 # Custom hooks React
│   ├── useAuth.ts
│   ├── useRequests.ts
│   ├── useMessages.ts
│   ├── useAppointments.ts
│   ├── useWallet.ts
│   └── usePayment.ts
├── providers/                             # Context providers
│   ├── AuthProvider.tsx
│   ├── QueryProvider.tsx
│   └── WalletProvider.tsx
├── types/                                 # Tipos TypeScript compartidos
│   ├── index.ts
│   ├── user.ts
│   ├── request.ts
│   ├── message.ts
│   ├── appointment.ts
│   └── blockchain.ts
├── public/                                # Activos estáticos
│   └── assets/
│       └── OrientaProf.png
├── backend/                               # (Legacy) placeholder — migrar a /app/api
├── frontend/                              # (Legacy) prototipo vanilla — migrar a /app
├── styles/                                # Estilos globales
│   └── globals.css                        # Tailwind directives + variables CSS
├── .env.local                             # Variables de entorno (no versionar)
├── .env.example                           # Template de variables
├── tailwind.config.ts                     # Config Tailwind
├── tsconfig.json                          # Config TypeScript
├── next.config.ts                         # Config Next.js
├── vercel.json                            # Config deploy Vercel
├── package.json                           # Dependencias
├── vitest.config.ts                       # Config Vitest
├── playwright.config.ts                   # Config Playwright
└── ARCHITECTURE_MCP.md                    # Este archivo
```

---

## Modelo de Datos (Prisma)

```prisma
enum Role {
  CLIENT
  PROFESSIONAL
}

enum RequestStatus {
  PENDING
  RESPONDED
  CANCELLED
  COMPLETED
}

enum AppointmentStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model User {
  id             String   @id @default(cuid())
  username       String   @unique
  email          String   @unique
  passwordHash   String
  role           Role     @default(CLIENT)
  fullName       String
  documentType   String?
  documentNumber String?
  gender         String?
  country        String?
  city           String?
  dateOfBirth    DateTime?
  address        String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  professionalProfile ProfessionalProfile?
  sentMessages        Message[]        @relation("Sender")
  receivedMessages    Message[]        @relation("Receiver")
  clientRequests      Request[]        @relation("ClientRequests")
  professionalRequests Request[]       @relation("ProfessionalRequests")
  clientAppointments  Appointment[]    @relation("ClientAppointments")
  professionalAppointments Appointment[] @relation("ProfessionalAppointments")
}

model ProfessionalProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  profession      String
  ratePerMinute   Float    @default(1200) // COP
  rating          Float    @default(0)
  experienceYears Int?
  description     String?
  documentFile    String?  // URL
  diplomaFile     String?  // URL
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  categories ProfessionalCategory[]
}

model ProfessionalCategory {
  id             String   @id @default(cuid())
  profileId      String
  profile        ProfessionalProfile @relation(fields: [profileId], references: [id])
  name           String
}

model Request {
  id              String        @id @default(cuid())
  clientId        String
  client          User          @relation("ClientRequests", fields: [clientId], references: [id])
  professionalId  String?
  professional    User?         @relation("ProfessionalRequests", fields: [professionalId], references: [id])
  category        String
  title           String
  description     String
  status          RequestStatus @default(PENDING)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  messages Message[]
}

model Message {
  id          String   @id @default(cuid())
  requestId   String?
  request     Request? @relation(fields: [requestId], references: [id])
  senderId    String
  sender      User     @relation("Sender", fields: [senderId], references: [id])
  receiverId  String
  receiver    User     @relation("Receiver", fields: [receiverId], references: [id])
  content     String
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Appointment {
  id                String            @id @default(cuid())
  clientId          String
  client            User              @relation("ClientAppointments", fields: [clientId], references: [id])
  professionalId    String
  professional      User              @relation("ProfessionalAppointments", fields: [professionalId], references: [id])
  requestId         String?
  scheduledAt       DateTime
  durationMinutes   Int               @default(20)
  status            AppointmentStatus @default(SCHEDULED)
  videoRoomUrl      String?
  transactionHash   String?           // Hash de la transacción CELO
  totalCost         Float?            // Costo en cUSD
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

model PaymentTransaction {
  id              String   @id @default(cuid())
  appointmentId   String?
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  fromAddress     String   // Wallet del cliente
  toAddress       String   // Wallet del profesional
  amount          Float    // Monto en cUSD
  token           String   @default("cUSD")
  transactionHash String   @unique
  blockNumber     Int?
  status          String   @default("PENDING") // PENDING, CONFIRMED, FAILED
  createdAt       DateTime @default(now())
}
```

---

## Arquitectura por Capas

```
┌──────────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Next.js  │  │ Tailwind │  │   Zustand  │  │ TanStack      │  │
│  │ (React)  │  │   CSS    │  │  (Estado)  │  │ Query (Cache) │  │
│  └────┬─────┘  └──────────┘  └────────────┘  └───────┬───────┘  │
│       │                                              │          │
│  ┌────▼─────────────────────────────────────────────────▼────┐   │
│  │                 RainbowKit + Wagmi + Viem                 │   │
│  │              (Conexión Wallet → CELO)                     │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────────┐
          ▼                   ▼                       ▼
┌─────────────────┐  ┌────────────────┐  ┌──────────────────────┐
│ Next.js API     │  │  NextAuth.js   │  │  CELO Blockchain     │
│ Routes (REST)   │  │  (JWT/Session) │  │                      │
│                 │  │                │  │  ┌───────────────┐   │
│  /api/auth/*    │  │  Login/Registro│  │  │OrientaProf    │   │
│  /api/users/*   │  │  Protección    │  │  │Payments.sol   │   │
│  /api/requests/*│  │  Middleware     │  │  │(Escrow cUSD)  │   │
│  /api/messages/*│  │                │  │  └───────────────┘   │
│  /api/payments/*│  │                │  │  ┌───────────────┐   │
│                 │  │                │  │  │OrientaProf    │   │
│                 │  │                │  │  │Reputation.sol │   │
│                 │  │                │  │  │(Calificaciones)│   │
└────────┬────────┘  └────────────────┘  └──────────┬───────────┘
         │                                          │
         ▼                                          │
┌────────────────┐                                  │
│    Prisma      │                                  │
│    (ORM)       │                                  │
└────────┬───────┘                                  │
         │                                          │
         ▼                                          │
┌────────────────┐                                  │
│  PostgreSQL    │                                  │
│  (Datos app)   │                                  │
└────────────────┘                                  │
                                                    │
         ┌──────────────────────────────────────────┘
         ▼
┌────────────────┐
│  Jitsi Meet    │
│  (Videollamada)│
└────────────────┘
```

---

## Flujo de Datos — Ciclo Completo

```
1. REGISTRO
   Usuario → Formulario → /api/auth/register → Prisma → PostgreSQL
                                                    ↕
                                            NextAuth crea sesión JWT

2. PUBLICAR CONSULTA (Cliente)
   Cliente → RequestForm → /api/requests (POST) → Prisma → PostgreSQL
                                                    ↕
                                            TanStack Query actualiza caché

3. RESPONDER CONSULTA (Profesional)
   Profesional → AvailableRequests → /api/requests/[id]/respond (POST)
       → Prisma actualiza Request.status = "RESPONDED"
       → Crea Message en DB

4. ACEPTAR Y AGENDAR (Cliente)
   Cliente → Message → Button "Agendar" → /api/appointments (POST)
       → Prisma crea Appointment
       → Genera sala Jitsi Meet
       → Retorna URL de videollamada

5. PAGO (Blockchain CELO)
   Antes de la llamada:
   ┌─ Wallet Cliente ─┐         ┌─ Smart Contract ─┐       ┌─ Wallet Profesional ─┐
   │ Aprueba cUSD     │ ──────→ │ Escrow: retiene   │ ──→  │ Recibe al finalizar  │
   │ Firma transacción│         │ tokens            │       │                      │
   └──────────────────┘         └───────────────────┘       └──────────────────────┘
                                     │
                            Al completar videollamada:
                            SmartContract.releasePayment()
                            (emitido por backend webhook)

6. VIDEOLLAMADA
   Ambos → /consultation/[id] → Jitsi Meet embebido
       → Al finalizar → webhook → libera pago del escrow

7. CALIFICACIÓN (On-chain)
   Cliente califica → OrientaProfReputation.rateProfessional()
       → Score registrado en blockchain (inmutable)
       → Prisma sincroniza rating en ProfessionalProfile
```

---

## Smart Contracts (CELO)

### OrientaProfPayments.sol

```
Funciones principales:
├── createConsultation(client, professional, ratePerMin, durationMin)
│   → Crea escrow, cliente deposita cUSD (rate × duration)
│   → Emite evento ConsultationCreated
├── startConsultation(consultationId)
│   → Solo llamado por backend cuando comienza la videollamada
├── completeConsultation(consultationId)
│   → Libera fondos al profesional
│   → Emite evento ConsultationCompleted
├── cancelConsultation(consultationId)
│   → Reembolsa al cliente (menos comisión)
│   → Emite evento ConsultationCancelled
└── withdrawFunds()
    → Retiro de comisiones de la plataforma
```

### OrientaProfReputation.sol

```
Funciones principales:
├── rateProfessional(professional, score)    // 1-5
├── getRating(professional) → (average, count)
└── getProfessionalHistory(professional) → Rating[]
```

---

## Seguridad

| Aspecto | Implementación |
|---------|---------------|
| **Auth** | NextAuth.js con JWT, httpOnly cookies, CSRF protection |
| **Passwords** | bcrypt (salt rounds = 12) |
| **API** | Rate limiting, validación Zod, middleware de rol |
| **Blockchain** | Smart contract auditado, escrow con multisig de emergencia |
| **Video** | Salas Jitsi con token JWT, sin persistencia de video |
| **Datos** | Prisma prepared statements, SQL injection prevenido |
| **CORS** | Restringido a dominio Vercel en producción |
| **HTTPS** | Forzado en Vercel + CELO mainnet |

---

## Plan de Migración del Prototipo Actual

### Fase 1 — Infraestructura (Sprint 1)
- Inicializar Next.js + TypeScript + Tailwind + Prisma
- Configurar base de datos PostgreSQL
- Migrar diseño visual (paleta de colores, mobile-first)

### Fase 2 — Backend + Auth (Sprint 1-2)
- Implementar API REST completa
- NextAuth con login/registro real
- Protección de rutas por rol

### Fase 3 — Frontend React (Sprint 2-3)
- Migrar 14 pantallas a componentes React con App Router
- Estado global con Zustand
- Formularios con React Hook Form + Zod

### Fase 4 — Funcionalidades Core (Sprint 3-4)
- Dashboard cliente y profesional
- CRUD de consultas, mensajes, citas
- Búsqueda y filtros de profesionales

### Fase 5 — Blockchain CELO (Sprint 4-5)
- Smart contracts (escrow en cUSD, reputación)
- RainbowKit + Wagmi para wallets
- Integración pago por minuto de videollamada

### Fase 6 — Testing + Deploy (Sprint 5)
- Tests unitarios e integración
- Deploy a Celo Alfajores (testnet)
- Deploy a Vercel + Railway
- Documentación final

---

## Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://..."
NEXTAUTH_SECRET="..."

# Jitsi Meet
JITSI_DOMAIN="meet.jit.si"
JITSI_APP_ID="..."
JITSI_APP_SECRET="..."

# CELO Blockchain
CELO_RPC_URL="https://alfajores-forno.celo-testnet.org"
CELO_PRIVATE_KEY="..."
CELO_PAYMENTS_CONTRACT_ADDRESS="0x..."
CELO_REPUTATION_CONTRACT_ADDRESS="0x..."

# Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="..."

# Vercel
VERCEL_ENV="production|preview|development"
```
