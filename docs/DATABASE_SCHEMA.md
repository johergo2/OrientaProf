# DATABASE_SCHEMA — OrientaProf MVP

> Documento de especificación del esquema de base de datos para el MVP.
> **Motor**: PostgreSQL v15+ vía Prisma ORM.
> **Convención**: `snake_case` para columnas en DB, `camelCase` en modelos Prisma.

---

## 1. Diagrama de Relaciones

```
┌──────────────────────────────────────────────────────────────────────┐
│                              User                                    │
│  (Registro unificado: clientes y profesionales)                      │
└───────┬──────────────────────┬───────────────────────┬───────────────┘
        │ 1                    │ 1                     │ 1
        ▼                      ▼                       ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
│Professional   │   │   BankInfo       │   │  WalletCELO      │
│Profile        │   │  (Info pago)     │   │  (campo en User) │
│(solo prof)    │   │  (solo prof)     │   │                  │
└───────┬───────┘   └──────────────────┘   └──────────────────┘
        │ 1
        ▼
┌──────────────────┐        ┌──────────────────┐
│Professional      │        │   Request        │
│Category          │        │  (Consultas)     │
│(1-N por perfil)  │        └───────┬──────────┘
└──────────────────┘                │ 1
                                    ▼
                           ┌──────────────────┐
                           │    Message       │
                           │  (Mensajes/resp)│
                           └──────────────────┘

┌──────────────────┐
│   Appointment    │
│  (Citas/Video)   ├─── 1 ─── Request (opcional)
└───────┬──────────┘
        │ 1
        ▼
┌──────────────────┐
│PaymentTransaction│
│  (Registro pago) │
└──────────────────┘

┌──────────────────┐
│EscrowTransaction │
│(Espejo on-chain) │
└──────────────────┘
```

---

## 2. Enumeraciones

### `Role`
```prisma
enum Role {
  CLIENT        // Usuario normal que busca orientación
  PROFESSIONAL  // Profesional que brinda asesoría
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
  SCHEDULED         // Agendada, esperando confirmación de asistencia
  CONFIRMED_CLIENT  // Cliente confirmó asistencia
  CONFIRMED_BOTH    // Ambos confirmaron asistencia
  IN_PROGRESS       // Videollamada en curso
  COMPLETED         // Videollamada finalizada exitosamente
  CANCELLED         // Cancelada por alguna de las partes
  MISSED            // Inasistencia (no se presentó alguna parte)
}
```

### `TransactionStatus` (espejo del contrato)
```prisma
enum TransactionStatus {
  PENDIENTE     // Fondos bloqueados en escrow
  LIBERADA      // Fondos disponibles para retiro del profesional
  REEMBOLSADA   // Fondos devueltos al usuario
}
```

### `ConfirmationParty`
```prisma
enum ConfirmationParty {
  CLIENT
  PROFESSIONAL
}
```

---

## 3. Modelos

### 3.1. `User`

Cuenta unificada para clientes y profesionales. Un profesional también puede actuar como cliente.

```prisma
model User {
  id              String    @id @default(cuid())
  username        String    @unique
  email           String    @unique
  passwordHash    String
  role            Role      @default(CLIENT)
  fullName        String
  documentType    String?   // CC, CE, Pasaporte, TI
  documentNumber  String?
  gender          String?
  country         String?
  city            String?
  dateOfBirth     DateTime?
  address         String?
  walletAddress   String?   // Wallet pública CELO (0x...)
  emailVerified   Boolean   @default(false)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relaciones
  professionalProfile         ProfessionalProfile?
  bankInfo                    BankInfo?
  sentMessages                Message[]              @relation("Sender")
  receivedMessages            Message[]              @relation("Receiver")
  clientRequests              Request[]              @relation("ClientRequests")
  professionalRequests        Request[]              @relation("ProfessionalRequests")
  clientAppointments          Appointment[]          @relation("ClientAppointments")
  professionalAppointments    Appointment[]          @relation("ProfessionalAppointments")
  attendanceConfirmations     AttendanceConfirmation[]
  paymentTransactionsSent     PaymentTransaction[]   @relation("Payer")
  paymentTransactionsReceived PaymentTransaction[]   @relation("Payee")
  escrowTransactionsAsClient  EscrowTransaction[]    @relation("EscrowClient")
  escrowTransactionsAsProf    EscrowTransaction[]    @relation("EscrowProfessional")
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
| `documentType` | String? | Tipo de documento de identidad |
| `documentNumber` | String? | Número de documento |
| `gender` | String? | Género |
| `country` | String? | País de residencia |
| `city` | String? | Ciudad de residencia |
| `dateOfBirth` | DateTime? | Fecha de nacimiento |
| `address` | String? | Dirección de residencia |
| `walletAddress` | String? | Dirección pública de wallet CELO (0x...) |
| `emailVerified` | Boolean | Indica si el email fue verificado |
| `isActive` | Boolean | Baja lógica del usuario |

### 3.2. `ProfessionalProfile`

Perfil profesional extendido. Solo existe si `User.role = PROFESSIONAL`.

```prisma
model ProfessionalProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  profession      String   // Abogado, Médico, Contador, etc.
  ratePerMinute   Float    @default(1200)  // COP (750-1500)
  rating          Float    @default(0)     // Promedio 1-5
  experienceYears Int?
  description     String?
  documentFile    String?  // URL del documento de identidad
  diplomaFile     String?  // URL del diploma o acta de grado
  isVerified      Boolean  @default(false) // Verificación admin
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  categories ProfessionalCategory[]
}
```

| Campo | Descripción |
|-------|-------------|
| `profession` | Profesión o área de conocimiento |
| `ratePerMinute` | Tarifa por minuto en COP (750-1500) |
| `rating` | Calificación promedio (0 = aún sin calificar) |
| `experienceYears` | Años de experiencia profesional |
| `description` | Descripción del perfil / servicios |
| `documentFile` | URL del archivo de identificación |
| `diplomaFile` | URL del diploma o acta de grado |
| `isVerified` | Marca de verificación por administrador |

### 3.3. `ProfessionalCategory`

Categorías o áreas de especialización de un profesional (relación 1-N).

```prisma
model ProfessionalCategory {
  id        String             @id @default(cuid())
  profileId String
  profile   ProfessionalProfile @relation(fields: [profileId], references: [id])
  name      String             // Ej: "Derecho laboral", "Contabilidad tributaria"

  @@unique([profileId, name])  // Evita duplicados por perfil
}
```

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre de la categoría/especialidad |

### 3.4. `BankInfo`

Información bancaria del profesional para retiros fiduciarios (off-ramp).

```prisma
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

### 3.5. `Request`

Consulta publicada por un cliente.

```prisma
model Request {
  id              String        @id @default(cuid())
  clientId        String
  client          User          @relation("ClientRequests", fields: [clientId], references: [id])
  professionalId  String?       // Profesional seleccionado (se llena al responder/aceptar)
  professional    User?         @relation("ProfessionalRequests", fields: [professionalId], references: [id])
  category        String        // Categoría de la consulta
  title           String        // Título corto
  description     String        // Descripción detallada
  status          RequestStatus @default(PENDING)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  messages  Message[]
  appointments Appointment[]
}
```

| Campo | Descripción |
|-------|-------------|
| `category` | Categoría (tributaria, laboral, médica, legal, emprendimiento) |
| `title` | Título de la consulta |
| `description` | Descripción detallada del problema |
| `status` | PENDING → RESPONDED → COMPLETED / CANCELLED |

**Reglas de negocio**:
- Solo el `client` puede crear, editar o cancelar una consulta (si está PENDING)
- Cualquier profesional puede ver las consultas PENDING
- Un profesional responde creando un Message vinculado al Request
- Al responder, el Request.status cambia a RESPONDED y se asigna `professionalId`

### 3.6. `Message`

Mensajes dentro del hilo de una consulta.

```prisma
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

  // Para mensajes directos (sin request asociado)
  // O para respuestas a consultas
}
```

| Campo | Descripción |
|-------|-------------|
| `requestId` | Consulta asociada (null si es mensaje directo) |
| `senderId` | Quién envía el mensaje |
| `receiverId` | Quién recibe el mensaje |
| `content` | Contenido del mensaje |
| `read` | Indica si fue leído |

**Reglas de negocio**:
- El primer mensaje de un profesional a un Request constituye su "respuesta"
- Al crear el primer mensaje de profesional → Request.status = RESPONDED
- El mensaje puede existir sin Request (mensajería directa)

### 3.7. `Appointment`

Cita agendada para videollamada entre cliente y profesional.

```prisma
model Appointment {
  id                String            @id @default(cuid())
  clientId          String
  client            User              @relation("ClientAppointments", fields: [clientId], references: [id])
  professionalId    String
  professional      User              @relation("ProfessionalAppointments", fields: [professionalId], references: [id])
  requestId         String?           // Consulta origen (opcional)
  request           Request?          @relation(fields: [requestId], references: [id])
  scheduledAt       DateTime          // Fecha y hora agendada
  durationMinutes   Int               @default(20)  // 10, 15, 20, 30
  status            AppointmentStatus @default(SCHEDULED)
  videoRoomUrl      String?           // URL de sala Jitsi Meet
  videoRoomToken    String?           // Token JWT para la sala
  totalCost         Float?            // Costo calculado en CELO (antes del pago)
  notes             String?           // Notas adicionales
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  // Relaciones
  attendances       AttendanceConfirmation[]
  paymentTransaction PaymentTransaction?
  escrowTransaction  EscrowTransaction?
}
```

| Campo | Descripción |
|-------|-------------|
| `scheduledAt` | Fecha y hora programada para la videollamada |
| `durationMinutes` | Duración en minutos (10, 15, 20, 30) |
| `status` | SCHEDULED → CONFIRMED_CLIENT → CONFIRMED_BOTH → IN_PROGRESS → COMPLETED / CANCELLED / MISSED |
| `videoRoomUrl` | URL generada de la sala Jitsi Meet |
| `videoRoomToken` | Token JWT de autenticación para la sala |
| `totalCost` | Costo total calculado (ratePerMinute × durationMinutes) |

**Máquina de estados de Appointment**:
```
SCHEDULED
  │
  ├── (cliente confirma) → CONFIRMED_CLIENT
  │                           │
  │                           ├── (profesional confirma) → CONFIRMED_BOTH
  │                                                         │
  │                                                         ├── (inicia videollamada) → IN_PROGRESS
  │                                                         │                            │
  │                                                         │                            ├── (finaliza bien) → COMPLETED
  │                                                         │                            └── (abandona) → MISSED
  │                                                         │
  │                                                         ├── (alguien cancela) → CANCELLED
  │                                                         └── (no se presenta) → MISSED
  │
  ├── (profesional confirma) → CONFIRMED_CLIENT (mismo estado, se distingue por AttendanceConfirmation)
  │
  ├── (alguien cancela) → CANCELLED
  │
  └── (no se presenta fecha) → MISSED
```

### 3.8. `AttendanceConfirmation`

Registro de confirmación de asistencia a una cita (auditoría).

```prisma
model AttendanceConfirmation {
  id              String             @id @default(cuid())
  appointmentId   String
  appointment     Appointment        @relation(fields: [appointmentId], references: [id])
  userId          String
  user            User               @relation(fields: [userId], references: [id])
  party           ConfirmationParty  // CLIENT o PROFESSIONAL
  confirmed       Boolean            @default(false)
  confirmedAt     DateTime?
  createdAt       DateTime           @default(now())

  @@unique([appointmentId, userId])  // Un registro por usuario por cita
}
```

| Campo | Descripción |
|-------|-------------|
| `party` | Indica si la confirmación es del cliente o del profesional |
| `confirmed` | true si confirmó asistencia |
| `confirmedAt` | Timestamp de la confirmación |

**Reglas de negocio**:
- Ambos deben confirmar para que Appointment pase a CONFIRMED_BOTH
- Si alguien no confirma dentro del tiempo límite, la cita pasa a MISSED
- La confirmación puede tener un límite de tiempo (ej: 30 min antes de la cita)

### 3.9. `PaymentTransaction`

Registro off-chain de transacciones de pago en CELO.

```prisma
model PaymentTransaction {
  id              String             @id @default(cuid())
  appointmentId   String             @unique
  appointment     Appointment        @relation(fields: [appointmentId], references: [id])
  payerId         String
  payer           User               @relation("Payer", fields: [payerId], references: [id])
  payeeId         String
  payee           User               @relation("Payee", fields: [payeeId], references: [id])
  amount          Float              // Monto en CELO (decimal)
  token           String             @default("CELO")
  transactionHash String?            @unique  // Hash de la tx on-chain (null antes del depósito)
  blockNumber     Int?
  status          String             @default("PENDING") // PENDING, CONFIRMED, FAILED
  description     String?            // "Depósito escrow", "Liberación", "Reembolso"
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}
```

| Campo | Descripción |
|-------|-------------|
| `payerId` | Usuario que paga (cliente) |
| `payeeId` | Usuario que recibe (profesional) |
| `amount` | Monto en CELO |
| `transactionHash` | Hash de la transacción en CELO (se llena al depositar) |
| `status` | PENDING (antes de firmar), CONFIRMED (minería confirmada), FAILED |
| `description` | Contexto: "Depósito escrow", "Liberación de fondos", "Reembolso" |

### 3.10. `EscrowTransaction`

Espejo off-chain del estado del escrow en el smart contract. Permite al backend conocer el estado on-chain sin consultar constantemente la blockchain.

```prisma
model EscrowTransaction {
  id                String            @id @default(cuid())
  appointmentId     String            @unique
  appointment       Appointment       @relation(fields: [appointmentId], references: [id])
  clientId          String
  client            User              @relation("EscrowClient", fields: [clientId], references: [id])
  professionalId    String
  professional      User              @relation("EscrowProfessional", fields: [professionalId], references: [id])
  amount            Float             // Monto en CELO depositado
  status            TransactionStatus @default(PENDIENTE)
  contractIndex     Int?              // Índice de la transacción en el smart contract
  transactionHash   String?           // Hash del depósito inicial
  depositTxHash     String?           // Hash de la tx de depósito
  releaseTxHash     String?           // Hash de la tx de liberación (si aplica)
  refundTxHash      String?           // Hash de la tx de reembolso (si aplica)
  withdrawTxHash    String?           // Hash de la tx de retiro del profesional (si aplica)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}
```

| Campo | Descripción |
|-------|-------------|
| `status` | PENDIENTE → LIBERADA o REEMBOLSADA (espejo del contrato) |
| `contractIndex` | Índice numérico dentro del mapping del smart contract |
| `transactionHash` | Hash de la transacción de depósito en el contrato |
| `depositTxHash` | Hash de la tx de depósito inicial |
| `releaseTxHash` | Hash cuando el backend llamó release() |
| `refundTxHash` | Hash cuando el backend llamó refund() |
| `withdrawTxHash` | Hash cuando el profesional retiró |

### 3.11. `AuditLog` (opcional para MVP)

Registro de auditoría para acciones importantes.

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String   // "LOGIN", "REGISTER", "CREATE_REQUEST", "RESPOND_REQUEST", etc.
  entityType  String?  // "User", "Request", "Appointment", etc.
  entityId    String?  // ID de la entidad afectada
  metadata    Json?    // Datos adicionales (cambios, contexto)
  ipAddress   String?
  createdAt   DateTime @default(now())
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
| 8 | **AttendanceConfirmation** | Confirmación de asistencia | Appointment, User |
| 9 | **PaymentTransaction** | Registro off-chain de pagos CELO | Appointment, User |
| 10 | **EscrowTransaction** | Espejo del estado on-chain del contrato | Appointment, User |
| 11 | **AuditLog** | Auditoría de acciones (opcional) | User |

---

## 5. Diagrama de Flujo de Datos (Ciclo Completo)

```
REGISTRO:
  POST /api/auth/register
    → INSERT User
    → (si role=PROFESSIONAL) INSERT ProfessionalProfile + BankInfo

CREAR CONSULTA:
  POST /api/requests
    → INSERT Request { status: PENDING }

RESPONDER CONSULTA:
  POST /api/requests/:id
    → UPDATE Request { status: RESPONDED, professionalId }
    → INSERT Message { requestId, senderId, receiverId }

AGENDAR CITA:
  POST /api/appointments
    → INSERT Appointment { status: SCHEDULED }

CONFIRMAR ASISTENCIA:
  POST /api/appointments/:id/confirm
    → UPSERT AttendanceConfirmation { confirmed: true }
    → Si ambos confirmaron → UPDATE Appointment { status: CONFIRMED_BOTH }

DEPOSITAR ESCROW:
  POST /api/payments/deposit
    → INSERT EscrowTransaction { status: PENDIENTE }
    → INSERT PaymentTransaction { status: PENDING }
    → Frontend firma tx en wallet → llama contract.deposit()

VIDEOLLAMADA:
  GET /consultation/:id
    → UPDATE Appointment { status: IN_PROGRESS }

FINALIZAR:
  POST /api/appointments/:id/complete
    → UPDATE Appointment { status: COMPLETED }
    → Backend llama contract.release()
    → UPDATE EscrowTransaction { status: LIBERADA }
    → INSERT PaymentTransaction { status: CONFIRMED }

RETIRAR:
  Frontend (profesional) llama contract.withdraw()
    → Webhook escucha evento → UPDATE EscrowTransaction
```

---

## 6. Constraints y Reglas de Negocio

| Regla | Implementación |
|-------|---------------|
| Tarifa profesional entre 750-1500 COP/min | Validación Zod + check en API |
| Duración de cita: 10, 15, 20 o 30 min | Enum de valores permitidos en validación |
| Solo el cliente puede cancelar su consulta | Middleware de autorización por rol + ownership |
| Profesional solo responde consultas PENDING | Validación de estado en API |
| Un mensaje de profesional a Request → status = RESPONDED | Trigger en lógica de negocio (API) |
| Ambos deben confirmar asistencia para iniciar | Verificación en AttendanceConfirmation |
| Escrow: fondos bloqueados hasta COMPLETED o CANCELLED | Estado en EscrowTransaction + contrato |
| No se puede agendar sin wallet registrada | Validación `walletAddress != null` en ambas partes |
| Profesional puede tener máximo 10 categorías | Validación count < 10 |

---

## 7. Índices Recomendados

```sql
-- Rendimiento de búsqueda de profesionales por categoría
CREATE INDEX idx_professional_category_name ON "ProfessionalCategory"(name);

-- Búsqueda de consultas por estado y categoría
CREATE INDEX idx_request_status_category ON "Request"(status, category);

-- Consultas del cliente
CREATE INDEX idx_request_client ON "Request"(clientId);

-- Mensajes por usuario (bandeja)
CREATE INDEX idx_message_receiver ON "Message"(receiverId, read);

-- Citas próximas por usuario
CREATE INDEX idx_appointment_scheduled ON "Appointment"(professionalId, scheduledAt);
CREATE INDEX idx_appointment_client_scheduled ON "Appointment"(clientId, scheduledAt);

-- Transacciones de pago por usuario
CREATE INDEX idx_payment_payer ON "PaymentTransaction"(payerId);
CREATE INDEX idx_payment_payee ON "PaymentTransaction"(payeeId);

-- Escrow por estado
CREATE INDEX idx_escrow_status ON "EscrowTransaction"(status);
```
