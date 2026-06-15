# PROJECT_CONTEXT — OrientaProf MVP

> **OrientaProf**: Plataforma que conecta usuarios que buscan orientación profesional con profesionales verificados (abogados, médicos, contadores, ingenieros, etc.) mediante videollamadas cortas pagadas por minuto, con pagos transparentes en blockchain CELO (cUSD).

---

## 1. MVP — Descripción General

### Propósito
Permitir que cualquier persona publique una consulta gratuita y reciba respuestas de profesionales calificados. Luego de elegir un profesional, agenda una videollamada pagada por minuto. Los pagos se manejan mediante un smart contract en CELO que actúa como escrow, liberando los fondos al profesional solo cuando la videollamada se completa.

### Usuarios objetivo
- **Clientes**: Personas naturales con dudas legales, contables, médicas, financieras, etc.
- **Profesionales**: Abogados, médicos, contadores, ingenieros, arquitectos, economistas, inversionistas, etc.

### Diferenciador clave
Pagos descentralizados con cUSD (stablecoin en CELO) mediante escrow inteligente, garantizando transparencia y confianza sin intermediarios bancarios.

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
   - Cliente conecta wallet (MetaMask/Valora)
   - Aprueba y deposita cUSD en el smart contract (tarifa × duración)
   - Fondos quedan retenidos en escrow

6. VIDEOLLAMADA
   Ambos participantes ingresan a sala Jitsi Meet
   → Al finalizar, el backend notifica al smart contract
   → Smart contract libera fondos al profesional (menos comisión 5%)

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
| **Blockchain** | Celo (Alfajores → Mainnet) | Pagos con cUSD, transparencia |
| **Wallet** | RainbowKit + Wagmi + Viem | Conexión de wallets (MetaMask, Valora) |
| **SDK Celo** | @celo/contractkit | Interacción con contratos en Celo |
| **Testing** | Vitest + Playwright | Tests unitarios y de integración |
| **Deploy** | Vercel (frontend) + Railway (DB) + Celo (contracts) | Infraestructura cloud |

### Diagrama de capas

```
┌──────────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Next.js  │  │ Tailwind │  │   Zustand  │  │ TanStack      │  │
│  │ (React)  │  │   CSS    │  │  (Estado)  │  │ Query (Cache) │  │
│  └────┬─────┘  └──────────┘  └────────────┘  └───────┬───────┘  │
│       │              RainbowKit + Wagmi + Viem         │          │
│       │              (Conexión Wallet → CELO)          │          │
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

### Estructura de directorios objetivo

```
/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx                # Layout raíz (Providers, Navbar)
│   ├── page.tsx                  # Landing / Welcome
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/
│   │   │   ├── client/page.tsx
│   │   │   └── professional/page.tsx
│   │   └── callback/route.ts
│   ├── dashboard/
│   │   ├── client/
│   │   │   ├── page.tsx                   # Dashboard cliente completo
│   │   │   └── my-requests/page.tsx       # Mis consultas
│   │   └── professional/
│   │       ├── page.tsx
│   │       ├── requests/page.tsx
│   │       └── rate/page.tsx
│   ├── messages/page.tsx
│   ├── appointments/page.tsx
│   ├── settings/
│   │   ├── page.tsx
│   │   ├── personal-data/page.tsx
│   │   ├── password/page.tsx
│   │   └── payment/page.tsx
│   ├── consultation/[id]/page.tsx # Sala de videollamada
│   └── api/                      # Backend API Routes
│       ├── auth/
│       │   ├── [...nextauth]/route.ts
│       │   └── register/route.ts
│       ├── users/
│       │   ├── [id]/route.ts
│       │   └── me/route.ts
│       ├── professionals/
│       │   └── route.ts                   # GET listar profesionales
│       ├── requests/
│       │   ├── route.ts                   # GET listar consultas del usuario
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── respond/route.ts
│       ├── messages/route.ts
│       ├── appointments/route.ts
│       └── payments/
│           ├── route.ts
│           └── webhook/route.ts
├── components/                   # Componentes React reutilizables
│   ├── ui/                       # Design system (Button, Card, Input, etc.)
│   ├── layout/                   # Navbar, Sidebar, PhoneShell
│   ├── auth/                     # LoginForm, RegisterForm, RoleSelector
│   ├── client/                   # RequestForm, ProfessionalCard, etc.
│   ├── professional/             # AvailableRequests, RateEditor, etc.
│   ├── messages/                 # MessageList, MessageThread
│   ├── appointments/             # CalendarView, AppointmentCard
│   ├── video/                    # VideoCallRoom
│   └── blockchain/               # WalletConnect, PaymentButton, TransactionHistory
├── lib/                          # Utilidades compartidas
│   ├── prisma.ts                 # Cliente Prisma singleton
│   ├── auth.ts                   # Configuración NextAuth
│   ├── validations.ts            # Schemas Zod
│   ├── constants.ts              # Constantes del negocio
│   ├── utils.ts                  # Funciones helper
│   └── celo.ts                   # Utilidades CELO
├── prisma/
│   ├── schema.prisma             # Modelo de datos completo
│   └── seed.ts                   # Datos de prueba
├── contracts/                    # Smart Contracts Solidity
│   ├── contracts/
│   │   ├── OrientaProfPayments.sol
│   │   └── OrientaProfReputation.sol
│   ├── scripts/deploy.ts
│   ├── test/OrientaProfPayments.test.ts
│   └── hardhat.config.ts
├── hooks/                        # Custom hooks React
├── providers/                    # Context providers
├── types/                        # Tipos TypeScript compartidos
├── public/assets/                # Activos estáticos
├── styles/globals.css            # Estilos globales Tailwind
├── backend/                      # (Legacy) prototipo vanilla
├── frontend/                     # (Legacy) prototipo vanilla
├── .env.local
├── tailwind.config.ts
├── next.config.ts
├── vercel.json
└── package.json
```

---

## 4. Entidades de Base de Datos (Prisma)

### Modelo completo

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
  walletAddress  String?                    // Wallet CELO del usuario
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  professionalProfile     ProfessionalProfile?
  sentMessages            Message[]        @relation("Sender")
  receivedMessages        Message[]        @relation("Receiver")
  clientRequests          Request[]        @relation("ClientRequests")
  professionalRequests    Request[]        @relation("ProfessionalRequests")
  clientAppointments      Appointment[]    @relation("ClientAppointments")
  professionalAppointments Appointment[]   @relation("ProfessionalAppointments")
}

model ProfessionalProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  profession      String
  ratePerMinute   Float    @default(1200)   // COP
  rating          Float    @default(0)
  experienceYears Int?
  description     String?
  documentFile    String?                   // URL identificación
  diplomaFile     String?                   // URL diploma/acta
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  categories ProfessionalCategory[]
}

model ProfessionalCategory {
  id        String             @id @default(cuid())
  profileId String
  profile   ProfessionalProfile @relation(fields: [profileId], references: [id])
  name      String
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
  id              String            @id @default(cuid())
  clientId        String
  client          User              @relation("ClientAppointments", fields: [clientId], references: [id])
  professionalId  String
  professional    User              @relation("ProfessionalAppointments", fields: [professionalId], references: [id])
  requestId       String?
  scheduledAt     DateTime
  durationMinutes Int               @default(20)
  status          AppointmentStatus @default(SCHEDULED)
  videoRoomUrl    String?
  transactionHash String?            // Hash de la transacción CELO
  totalCost       Float?             // Costo en cUSD
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

model PaymentTransaction {
  id              String       @id @default(cuid())
  appointmentId   String?
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  fromAddress     String       // Wallet del cliente
  toAddress       String       // Wallet del profesional
  amount          Float        // Monto en cUSD
  token           String       @default("cUSD")
  transactionHash String       @unique
  blockNumber     Int?
  status          String       @default("PENDING") // PENDING, CONFIRMED, FAILED
  createdAt       DateTime     @default(now())
}

model BankInfo {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  country       String   @default("Colombia")
  bankName      String
  accountType   String   // Ahorros / Corriente
  accountNumber String
  accountHolder String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

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
1. CREATE: Cliente aprueba cUSD → contrato.transferFrom(cliente, contrato, amount)
   - amount = ratePerMinute × durationMinutes
   - Fondos quedan retenidos en el contrato

2. START: Videollamada inicia (llamado por backend)
   - Marca startTime = block.timestamp

3. COMPLETE: Videollamada finaliza (llamado por backend)
   - Calcula plataformaFee (5%)
   - Transferencia al profesional: amount - fee
   - Transferencia a platformWallet: fee
   - Emite evento ConsultationCompleted

4. CANCEL: Cliente o sistema cancela
   - Reembolso al cliente: amount - fee (penalización)
   - Transferencia a platformWallet: fee
   - Emite evento ConsultationCancelled
```

### OrientaProfReputation.sol — Contrato de reputación

Propósito: Registrar calificaciones de profesionales en blockchain (inmutable y transparente).

```solidity
contract OrientaProfReputation {
    struct Rating {
        address client;
        uint8 score;      // 1-5
        uint256 timestamp;
        string comment;
    }

    struct ProfessionalReputation {
        uint256 totalScore;
        uint256 ratingCount;
        uint256 average;  // Score × 100 para evitar decimales
        Rating[] history;
    }

    mapping(address => ProfessionalReputation) public reputations;

    event Rated(address indexed professional, address indexed client, uint8 score);

    function rateProfessional(address _professional, uint8 _score, string calldata _comment) external;
    function getRating(address _professional) external view returns (uint256 average, uint256 count);
    function getProfessionalHistory(address _professional) external view returns (Rating[] memory);
}
```

### Integración con el backend

El backend se comunica con los contratos mediante:
- **Viem/Wagmi** (frontend → firma de transacciones del cliente)
- **@celo/contractkit** (backend → llamadas administrativas: start, complete)
- **Webhook** `/api/payments/webhook` para escuchar eventos on-chain y actualizar la DB

---

## 6. Estado Actual del Proyecto

### Estado actual (Next.js)
- Migración iniciada a Next.js 16 + TypeScript + Tailwind v4 + Prisma + NextAuth v5
- Registro de clientes y profesionales funcional con validación Zod
- Login funcional con NextAuth (credentials + JWT)
- Middleware de protección de rutas por rol
- Schema Prisma completo con 9 modelos y seed de prueba
- API endpoint `GET /api/professionals` — lista profesionales activos con perfil, rating, categorías y diplomas
- API endpoint `GET /api/requests` — lista consultas del usuario autenticado
- Dashboard cliente (`/dashboard/client`) funcional: header con navegación, pestañas Publicar Consulta / Buscar Profesional, listado de profesionales desde BD con tarjetas expandibles (Diplomas, Experiencia, Servicios)
- Página Mis Consultas (`/dashboard/client/my-requests`) con listado, descripción expandible, acciones Modificar/Cancelar/Eliminar, botón Nueva Consulta y estado vacío controlado
- Prototipo legacy `frontend/` preservado como referencia

### Siguiente paso
Implementar dashboard profesional y flujo de respuesta a consultas (Lote 4). El plan detallado de 82 tareas está en `TODO_MVP.md`.

### Convenios del proyecto
- **Estado**: `[ ]` Pendiente, `[x]` Completado, `[~]` En progreso
- **Prioridad**: P0 (bloqueante), P1 (alta), P2 (media), P3 (baja)
- **Esfuerzo**: S (horas), M (días), L (semanas)
- **No iniciar blockchain** sin completar backend funcional (Lotes 1-2)
- Preservar diseño visual mobile-first (max-width 420px, PhoneShell) del prototipo actual

---

## 7. Variables de Entorno Requeridas

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
