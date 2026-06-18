# DATABASE_SCHEMA — OrientaProf MVP

> Documento de especificación del esquema de base de datos para el MVP.
> **Motor**: PostgreSQL v15+ vía Prisma ORM v5.
> **Convención**: `snake_case` para columnas en DB, `camelCase` en modelos Prisma.

---

## 1. Diagrama de Relaciones

```
                         User
  (Registro unificado: clientes y profesionales)
       │ 1           │ 1              │ 1
       ▼             ▼                ▼
 ┌────────────┐ ┌──────────┐  ┌──────────────┐
 │Professional│ │ BankInfo │  │ AuditLog     │
 │Profile     │ │(solo prof)│  │(auditoría)   │
 │(solo prof) │ └──────────┘  └──────────────┘
 └──────┬─────┘
        │ 1
        ▼
 ┌──────────────┐        ┌───────────┐
 │Professional  │        │  Request  │
 │Category      │        │(Consultas)│
 │(1-N por perf)│        └─────┬─────┘
 └──────────────┘              │ 1
                               ▼
                        ┌───────────┐
                        │  Message  │
                        │(Mensajes) │
                        └───────────┘

 ┌──────────────┐
 │  Appointment  │──1── Request (opcional)
 │ (Citas/Video) │
 └──────┬───────┘
        │ 1
        ▼
 ┌──────────────────┐
 │EscrowTransaction │
 │(Espejo on-chain) │
 └──────────────────┘

 ┌──────────────────┐
 │PaymentTransaction│
 │(Registro pago)   │
 └──────────────────┘
```

---

## 2. Enumeraciones

### `Role`
```prisma
enum Role {
  CLIENT
  PROFESSIONAL
}
```

### `RequestStatus`
```prisma
enum RequestStatus {
  PENDING      // Publicada, esperando respuestas
  RESPONDED    // Al menos un profesional respondió
  CANCELLED    // Cancelada por el cliente
  COMPLETED    // Consulta finalizada (hubo cita)
}
```

### `AppointmentStatus`
```prisma
enum AppointmentStatus {
  SCHEDULED         // Agendada
  CONFIRMED_CLIENT  // Cliente confirmó entrada (vía join)
  CONFIRMED_BOTH    // Ambos confirmaron
  IN_PROGRESS       // Videollamada en curso
  COMPLETED         // Finalizada exitosamente (join de ambos)
  CANCELLED         // Cancelada por alguna parte
}
```

**Nota MVP**: El status se maneja simplificado: join de ambos → COMPLETED directamente (no se usan estados intermedios CONFIRMED_CLIENT/CONFIRMED_BOTH/IN_PROGRESS en la práctica).

### `EscrowStatus` (espejo del contrato)
```prisma
enum EscrowStatus {
  PENDIENTE     // Fondos bloqueados en escrow
  LIBERADA      // Fondos disponibles para retiro del profesional
  REEMBOLSADA   // Fondos devueltos al usuario
}
```

---

## 3. Modelos

### 3.1. `User`

Cuenta unificada para clientes y profesionales.

```prisma
model User {
  id              String    @id @default(cuid())
  username        String    @unique
  email           String    @unique
  passwordHash    String
  role            Role      @default(CLIENT)
  fullName        String
  documentType    String?
  documentNumber  String?
  gender          String?
  country         String?
  city            String?
  dateOfBirth     DateTime?
  address         String?
  walletAddress   String?        // Wallet pública CELO (0x...)
  emailVerified   DateTime?      // Timestamp de verificación (null = no verificado)
  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  professionalProfile          ProfessionalProfile?
  bankInfo                     BankInfo?
  sentMessages                 Message[]              @relation("Sender")
  receivedMessages             Message[]              @relation("Receiver")
  clientRequests               Request[]              @relation("ClientRequests")
  professionalRequests         Request[]              @relation("ProfessionalRequests")
  clientAppointments           Appointment[]          @relation("ClientAppointments")
  professionalAppointments     Appointment[]          @relation("ProfessionalAppointments")
  paymentTransactionsSent      PaymentTransaction[]   @relation("SenderTransactions")
  paymentTransactionsReceived  PaymentTransaction[]   @relation("ReceiverTransactions")
  auditLogs                    AuditLog[]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | Identificador único |
| `username` | String (único) | Nombre de usuario autogenerado |
| `email` | String (único) | Correo electrónico |
| `passwordHash` | String | Hash bcrypt de la contraseña |
| `role` | Role | CLIENT o PROFESSIONAL |
| `fullName` | String | Nombres y apellidos completos |
| `walletAddress` | String? | Dirección pública de wallet CELO (0x...) |
| `emailVerified` | DateTime? | Fecha de verificación de email (null = pendiente) |
| `isActive` | Boolean | Baja lógica del usuario |

### 3.2. `ProfessionalProfile`

Perfil profesional extendido. Solo existe si `User.role = PROFESSIONAL`.

```prisma
model ProfessionalProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  profession      String        // Abogado, Médico, Contador, etc.
  ratePerMinute   Float    @default(1200)  // COP (750-1500)
  rating          Float    @default(0)     // Promedio 1-5
  ratingCount     Int      @default(0)     // Número de calificaciones
  experienceYears Int?
  description     String?
  documentFile    String?       // URL del documento de identidad
  diplomaFile     String?       // URL del diploma o acta de grado
  isVerified      Boolean  @default(false) // Verificación admin
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  categories ProfessionalCategory[]
}
```

### 3.3. `ProfessionalCategory`

Categorías o áreas de especialización (relación 1-N).

```prisma
model ProfessionalCategory {
  id        String             @id @default(cuid())
  profileId String
  profile   ProfessionalProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name      String

  @@unique([profileId, name])
}
```

### 3.4. `BankInfo`

Información bancaria del profesional para retiros fiduciarios (off-ramp).

```prisma
model BankInfo {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  country       String   @default("Colombia")
  bankName      String
  accountType   String   // Ahorros / Corriente
  accountNumber String
  accountHolder String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 3.5. `Request`

Consulta publicada por un cliente.

```prisma
model Request {
  id              String        @id @default(cuid())
  clientId        String
  client          User          @relation("ClientRequests", fields: [clientId], references: [id], onDelete: Cascade)
  professionalId  String?
  professional    User?         @relation("ProfessionalRequests", fields: [professionalId], references: [id])
  category        String
  title           String
  description     String
  status          RequestStatus @default(PENDING)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  messages    Message[]
  appointments Appointment[]
}
```

**Reglas de negocio**:
- Solo el `client` puede crear consultas
- Un profesional responde creando un Message vinculado al Request
- Al responder, Request.status cambia a RESPONDED y se asigna `professionalId`

### 3.6. `Message`

Mensajes dentro del hilo de una consulta.

```prisma
model Message {
  id          String   @id @default(cuid())
  requestId   String?
  request     Request? @relation(fields: [requestId], references: [id], onDelete: Cascade)
  senderId    String
  sender      User     @relation("Sender", fields: [senderId], references: [id])
  receiverId  String
  receiver    User     @relation("Receiver", fields: [receiverId], references: [id])
  content     String
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

**Reglas de negocio**:
- El primer mensaje de un profesional a un Request constituye su "respuesta"
- Al crear el primer mensaje de profesional → Request.status = RESPONDED

### 3.7. `Appointment`

Cita agendada para videollamada.

```prisma
model Appointment {
  id                    String            @id @default(cuid())
  clientId              String
  client                User              @relation("ClientAppointments", fields: [clientId], references: [id], onDelete: Cascade)
  professionalId        String
  professional          User              @relation("ProfessionalAppointments", fields: [professionalId], references: [id])
  requestId             String?
  request               Request?          @relation(fields: [requestId], references: [id])
  scheduledAt           DateTime
  durationMinutes       Int               @default(20)  // 10, 15, 20, 30
  status                AppointmentStatus @default(SCHEDULED)
  videoRoomUrl          String?
  transactionHash       String?
  totalCost             Float?
  clientConfirmed       Boolean           @default(false)
  professionalConfirmed Boolean           @default(false)
  startedAt             DateTime?
  completedAt           DateTime?
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  attendanceConfirmation AttendanceConfirmation?
  paymentTransaction      PaymentTransaction?
  escrowTransaction       EscrowTransaction?
}
```

| Campo | Descripción |
|-------|-------------|
| `scheduledAt` | Fecha y hora programada |
| `durationMinutes` | Duración en minutos (10, 15, 20, 30) |
| `status` | SCHEDULED → COMPLETED / CANCELLED (simplificado en MVP) |
| `clientConfirmed` | true si el cliente llamó a POST /join |
| `professionalConfirmed` | true si el profesional llamó a POST /join |
| `totalCost` | Costo calculado (ratePerMinute × durationMinutes) |

**Flujo de estados (MVP real)**:
```
SCHEDULED
  │
  ├── (cliente llama /join) → clientConfirmed = true
  │
  ├── (profesional llama /join) → professionalConfirmed = true
  │
  ├── (POST /complete) → COMPLETED + completedAt
  │
  ├── (POST /reschedule) → cambia scheduledAt/durationMinutes (misma cita)
  │
  └── (POST /cancel, solo si scheduledAt > now) → CANCELLED
```

> Nota: `/join` solo marca confirmación de entrada. No cambia status.
> `/complete` finaliza manualmente la cita (profesional tras terminar videollamada).
> `/reschedule` modifica fecha/duración de la misma cita (no cancela ni crea nueva).

### 3.8. `AttendanceConfirmation`

Registro de confirmación de asistencia (relación 1:1 con Appointment).

```prisma
model AttendanceConfirmation {
  id               String    @id @default(cuid())
  appointmentId    String    @unique
  appointment      Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  clientConfirmed  Boolean   @default(false)
  proConfirmed     Boolean   @default(false)
  clientConfirmedAt DateTime?
  proConfirmedAt   DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

### 3.9. `PaymentTransaction`

Registro off-chain de transacciones de pago.

```prisma
model PaymentTransaction {
  id              String       @id @default(cuid())
  appointmentId   String?      @unique
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  fromUserId      String
  fromUser        User         @relation("SenderTransactions", fields: [fromUserId], references: [id])
  toUserId        String
  toUser          User         @relation("ReceiverTransactions", fields: [toUserId], references: [id])
  amount          Float
  currency        String       @default("COP")
  method          String       @default("CELO")
  transactionHash String?
  status          String       @default("PENDING") // PENDING, CONFIRMED, FAILED
  description     String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}
```

### 3.10. `EscrowTransaction`

Espejo off-chain del estado del escrow en el smart contract.

```prisma
model EscrowTransaction {
  id                String       @id @default(cuid())
  appointmentId     String       @unique
  appointment       Appointment  @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  transactionIndex  Int          @default(0)  // Índice en el smart contract
  clientAddress     String       // Wallet del cliente (0x...)
  professionalAddress String     // Wallet del profesional (0x...)
  amount            Float        // Monto en CELO depositado
  platformFee       Float        @default(0)  // Comisión de plataforma (5%)
  status            EscrowStatus @default(PENDIENTE)
  depositTxHash     String?      // Hash del depósito inicial
  releaseTxHash     String?      // Hash de la liberación
  refundTxHash      String?      // Hash del reembolso
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
}
```

| Campo | Descripción |
|-------|-------------|
| `transactionIndex` | Índice numérico dentro del mapping del smart contract |
| `clientAddress` | Dirección wallet del cliente (no relacional, viene de la tx) |
| `professionalAddress` | Dirección wallet del profesional |
| `status` | PENDIENTE → LIBERADA / REEMBOLSADA |
| `depositTxHash` | Hash de la tx de depósito en el contrato |
| `releaseTxHash` | Hash cuando se llamó release() |
| `refundTxHash` | Hash cuando se llamó refund() |

### 3.11. `AuditLog`

Registro de auditoría para acciones importantes.

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  action    String   // "LOGIN", "REGISTER", "CREATE_REQUEST", etc.
  entity    String   // "User", "Request", "Appointment", etc.
  entityId  String?
  metadata  Json?
  ipAddress String?
  createdAt DateTime @default(now())
}
```

---

## 4. Resumen de Entidades

| # | Entidad | Propósito | Dependencias |
|---|---------|-----------|--------------|
| 1 | **User** | Cuenta unificada cliente/profesional | — |
| 2 | **ProfessionalProfile** | Extensión del perfil profesional | User (1:1) |
| 3 | **ProfessionalCategory** | Especialidades del profesional | ProfessionalProfile (N:1) |
| 4 | **BankInfo** | Información bancaria para pagos | User (1:1) |
| 5 | **Request** | Consulta publicada por cliente | User (N:1) |
| 6 | **Message** | Mensajes y respuestas a consultas | User, Request (opcional) |
| 7 | **Appointment** | Cita para videollamada | User (N:1), Request (opcional) |
| 8 | **AttendanceConfirmation** | Confirmación de asistencia | Appointment (1:1) |
| 9 | **PaymentTransaction** | Registro off-chain de pagos | Appointment, User |
| 10 | **EscrowTransaction** | Espejo del estado on-chain del escrow | Appointment (1:1) |
| 11 | **AuditLog** | Auditoría de acciones | User (opcional) |

---

## 5. Diagrama de Flujo de Datos (Ciclo Completo)

```
REGISTRO:
  POST /api/auth/register
    → INSERT User
    → (si role=PROFESSIONAL) INSERT ProfessionalProfile + BankInfo + Categories

CREAR CONSULTA:
  POST /api/requests
    → INSERT Request { status: PENDING }

RESPONDER CONSULTA:
  POST /api/requests/:id
    → UPDATE Request { status: RESPONDED, professionalId }
    → INSERT Message { requestId, senderId, receiverId }

AGENDAR CITA:
  POST /api/appointments
    → INSERT Appointment { status: SCHEDULED, totalCost }

DEPOSITAR ESCROW:
  Frontend: wallet firma tx → contract.deposit() on-chain
  → POST /api/payments/deposit
    → Consulta transactionCounter del contrato
    → INSERT EscrowTransaction { status: PENDIENTE }

VIDEOLLAMADA:
  POST /api/appointments/:id/join (cada participante)
    → UPDATE Appointment { clientConfirmed o professionalConfirmed = true }
    → Si ambos true → UPDATE Appointment { status: COMPLETED }

LIBERAR PAGO (profesional):
  POST /api/payments/release
    → Backend llama contract.release(transactionIndex)
    → UPDATE EscrowTransaction { status: LIBERADA, releaseTxHash }

REEMBOLSAR (cliente):
  POST /api/payments/refund
    → Backend llama contract.refund(transactionIndex)
    → UPDATE EscrowTransaction { status: REEMBOLSADA, refundTxHash }

CANCELAR CITA:
  POST /api/appointments/:id/cancel
    → UPDATE Appointment { status: CANCELLED }
    → (el escrow se gestiona aparte vía refund si existe depósito)
```

---

## 6. Constraints y Reglas de Negocio

| Regla | Implementación |
|-------|---------------|
| Tarifa profesional entre 750-1500 COP/min | Validación Zod + check en API |
| Duración de cita: 10, 15, 20 o 30 min | Validación Zod (`appointmentSchema`) |
| Solo el cliente puede crear/cancelar consultas | Middleware de rol + ownership |
| Profesional solo responde consultas PENDING | Validación de estado en API |
| Un mensaje de profesional → status = RESPONDED | Lógica en POST /api/requests/:id |
| Ambos deben llamar /join para confirmar entrada | Marca clientConfirmed/professionalConfirmed en Appointment |
| Finalizar cita manualmente con /complete | POST /api/appointments/:id/complete → status = COMPLETED + completedAt |
| Reagendar modifica misma cita (no cancel+crear) | POST /api/appointments/:id/reschedule → cambia scheduledAt/durationMinutes |
| Cancelación solo si scheduledAt > now | Validación en POST /api/appointments/:id/cancel |
| No se puede depositar dos veces para misma cita | Unique appointmentId en EscrowTransaction |
| Solo el profesional puede llamar release() | Validación session.user.id === professionalId |
| Solo el cliente puede llamar refund() | Validación session.user.id === clientId |

---

## 7. Índices Recomendados

El schema de Prisma ya incluye los siguientes índices:

```prisma
// Rendimiento
@@index([email])                    // User
@@index([role])                     // User
@@index([profession])               // ProfessionalProfile
@@index([ratePerMinute])            // ProfessionalProfile
@@index([rating])                   // ProfessionalProfile
@@index([name])                     // ProfessionalCategory
@@index([userId])                   // BankInfo
@@index([clientId])                 // Request
@@index([professionalId])           // Request
@@index([status])                   // Request
@@index([category])                 // Request
@@index([senderId])                 // Message
@@index([receiverId])               // Message
@@index([requestId])                // Message
@@index([clientId])                 // Appointment
@@index([professionalId])           // Appointment
@@index([status])                   // Appointment
@@index([scheduledAt])              // Appointment
@@index([fromUserId])               // PaymentTransaction
@@index([toUserId])                 // PaymentTransaction
@@index([appointmentId])            // PaymentTransaction
@@index([transactionHash])          // PaymentTransaction
@@index([status])                   // EscrowTransaction
@@index([clientAddress])            // EscrowTransaction
@@index([transactionIndex])         // EscrowTransaction
@@index([userId])                   // AuditLog
@@index([action])                   // AuditLog
@@index([entity])                   // AuditLog
@@index([createdAt])                // AuditLog
```
