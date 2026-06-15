# API SPEC — OrientaProf MVP

> **Base URL (desarrollo)**: `http://localhost:3000/api`
> **Base URL (producción)**: `https://orientaprof.vercel.app/api`
> **Formato**: JSON siempre. Códigos HTTP estándar (200, 201, 400, 401, 403, 404, 409, 500).
> **Autenticación**: JWT via NextAuth.js (httpOnly cookie) + API Key para webhooks.
> **Rol**: Middleware de autorización protege rutas según `User.role`.

---

## 1. Estándares Generales

### Formato de respuesta

```typescript
// Éxito
{
  "success": true,
  "data": { ... } | [ ... ],
  "meta": {                        // Opcional: paginación
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción del error",
    "details": [                   // Opcional
      { "field": "email", "message": "Email inválido" }
    ]
  }
}
```

### Códigos de estado

| Código | Significado |
|--------|-------------|
| `200` | OK |
| `201` | Creado |
| `400` | Bad Request (validación) |
| `401` | No autenticado |
| `403` | No autorizado (rol incorrecto) |
| `404` | No encontrado |
| `409` | Conflicto (duplicado, estado inválido) |
| `500` | Error interno |

### Headers

```http
Content-Type: application/json
Authorization: Bearer <session_token>  // Opcional (webhooks usan X-API-Key)
```

---

## 2. Endpoints de Autenticación

### `POST /api/auth/register`

Registro de nuevo usuario (cliente o profesional).

**Request body**:
```json
{
  "role": "CLIENT | PROFESSIONAL",
  "fullName": "string",
  "email": "string (email)",
  "password": "string (min 8 chars)",
  "documentType": "string (opcional)",
  "documentNumber": "string (opcional)",
  "gender": "string (opcional)",
  "country": "string (opcional)",
  "city": "string (opcional)",
  "dateOfBirth": "string (date ISO, opcional)",
  "address": "string (opcional)",
  "walletAddress": "string (0x..., opcional)",

  // Solo si role = PROFESSIONAL
  "profession": "string",
  "ratePerMinute": "number (750-1500)",
  "experienceYears": "number (opcional)",
  "description": "string (opcional)",
  "categories": ["string"],
  "bankInfo": {
    "country": "string",
    "bankName": "string",
    "accountType": "AHORROS | CORRIENTE",
    "accountNumber": "string",
    "accountHolder": "string"
  }
}
```

**Response `201`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "username": "Orientap1",
    "email": "user@example.com",
    "role": "CLIENT",
    "fullName": "Andrea Usuario01",
    "walletAddress": null,
    "createdAt": "2026-06-14T10:00:00Z"
  }
}
```

**Errores**:
- `400`: Validación Zod falla (email inválido, password < 8 chars, tarifa fuera de rango)
- `409`: Email ya registrado

### `POST /api/auth/login`

Inicio de sesión con email y contraseña. (Manejado por NextAuth.js)

**Request body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "username": "Orientap1",
      "email": "user@example.com",
      "role": "CLIENT",
      "fullName": "Andrea Usuario01"
    }
  }
}
```

**Nota**: La sesión JWT se establece automáticamente via httpOnly cookie.

### `POST /api/auth/logout`

Cierra la sesión actual.

**Response `200`**:
```json
{
  "success": true,
  "data": { "message": "Sesión cerrada" }
}
```

### `GET /api/auth/session`

Obtiene la sesión actual.

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "role": "CLIENT",
      "username": "Orientap1",
      "fullName": "Andrea Usuario01",
      "walletAddress": "0x..."
    },
    "expires": "2026-06-15T10:00:00Z"
  }
}
```

**Response `401`**: Sesión no existe o expiró.

---

## 3. Endpoints de Usuarios

### `GET /api/users/me`

Obtiene el perfil del usuario autenticado, incluyendo perfil profesional si aplica.

**Headers**: `Authorization: Bearer <session>`

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "username": "Orientap1",
    "email": "user@example.com",
    "role": "PROFESSIONAL",
    "fullName": "Laura Usuario01",
    "documentType": "CC",
    "documentNumber": "1020304050",
    "gender": "Femenino",
    "country": "Colombia",
    "city": "Bogotá",
    "dateOfBirth": "1992-05-18",
    "address": "Calle 10 # 20-30",
    "walletAddress": "0x...",
    "professionalProfile": {
      "id": "clx...",
      "profession": "Abogado",
      "ratePerMinute": 1200,
      "rating": 4.9,
      "experienceYears": 4,
      "description": "Especialista en derecho laboral...",
      "categories": ["Derecho laboral", "Conciliaciones"]
    },
    "bankInfo": {
      "country": "Colombia",
      "bankName": "Banco Ejemplo",
      "accountType": "Ahorros",
      "accountNumber": "1234567890",
      "accountHolder": "Laura Usuario01"
    }
  }
}
```

### `PUT /api/users/me`

Actualiza el perfil del usuario autenticado.

**Request body**: Campos parciales del User + ProfessionalProfile + BankInfo.

**Response `200`**: Perfil actualizado.

### `PUT /api/users/me/wallet`

Actualiza la dirección de wallet CELO del usuario autenticado.

**Request body**:
```json
{
  "walletAddress": "0x..."  // Debe ser una dirección válida en Celo
}
```

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "message": "Wallet actualizada correctamente",
    "walletAddress": "0x..."
  }
}
```

### `PUT /api/users/me/password`

Cambia la contraseña del usuario autenticado.

**Request body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 chars)"
}
```

**Response `200`**:
```json
{
  "success": true,
  "data": { "message": "Contraseña actualizada" }
}
```

### `GET /api/professionals`

Lista profesionales con filtros.

**Query params**:
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `category` | string | Filtrar por categoría |
| `profession` | string | Filtrar por profesión |
| `minRate` | number | Tarifa mínima |
| `maxRate` | number | Tarifa máxima |
| `minRating` | number | Rating mínimo |
| `search` | string | Búsqueda por nombre o descripción |
| `page` | number | Número de página (default: 1) |
| `pageSize` | number | Items por página (default: 20) |

**Response `200`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "userId": "clx...",
      "fullName": "Laura Usuario01",
      "profession": "Abogado",
      "ratePerMinute": 1200,
      "rating": 4.9,
      "experienceYears": 4,
      "description": "Especialista en derecho laboral...",
      "categories": ["Derecho laboral", "Conciliaciones"],
      "walletAddress": "0x..."
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 45 }
}
```

### `GET /api/professionals/:id`

Obtiene el perfil público de un profesional.

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "fullName": "Laura Usuario01",
    "profession": "Abogado",
    "ratePerMinute": 1200,
    "rating": 4.9,
    "experienceYears": 4,
    "description": "...",
    "categories": [...],
    "walletAddress": "0x..."
  }
}
```

### `PUT /api/professionals/rate`

Actualiza la tarifa por minuto del profesional autenticado.

**Request body**:
```json
{
  "ratePerMinute": 1300
}
```

**Response `200`**:
```json
{
  "success": true,
  "data": { "ratePerMinute": 1300 }
}
```

**Validación**: `750 <= ratePerMinute <= 1500`.

---

## 4. Endpoints de Consultas (Requests)

### `POST /api/requests`

Crea una nueva consulta (solo CLIENT).

**Request body**:
```json
{
  "category": "string",
  "title": "string",
  "description": "string",
  "professionalId": "string | null"
}
```

**Nota**: Si `professionalId` es null, la consulta es pública (cualquier profesional puede responder). Si se especifica, solo ese profesional puede responder.

**Response `201`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "category": "Consultas laborales",
    "title": "Revisión de liquidación laboral",
    "description": "Tengo dudas sobre mi liquidación...",
    "status": "PENDING",
    "client": { "id": "clx...", "fullName": "Andrea Usuario01" },
    "createdAt": "2026-06-14T10:00:00Z"
  }
}
```

### `GET /api/requests`

Lista consultas según el rol del usuario autenticado.

- **CLIENT**: Ve sus propias consultas
- **PROFESSIONAL**: Ve consultas PENDING disponibles (públicas)

**Query params**:
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `status` | string | Filtrar por estado |
| `category` | string | Filtrar por categoría |
| `page` | number | Página |
| `pageSize` | number | Items por página |

**Response `200`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "category": "Consultas laborales",
      "title": "Revisión de liquidación laboral",
      "description": "Tengo dudas sobre mi liquidación...",
      "status": "PENDING",
      "client": { "id": "clx...", "fullName": "Andrea Usuario01" },
      "professional": null,
      "messageCount": 0,
      "createdAt": "2026-06-14T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 5 }
}
```

### `GET /api/requests/:id`

Obtiene una consulta individual con sus mensajes.

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "category": "Consultas laborales",
    "title": "Revisión de liquidación laboral",
    "description": "Tengo dudas sobre mi liquidación...",
    "status": "RESPONDED",
    "client": { "id": "clx...", "fullName": "Andrea Usuario01" },
    "professional": { "id": "clx...", "fullName": "Laura Usuario01" },
    "messages": [
      {
        "id": "clx...",
        "sender": { "id": "clx...", "fullName": "Laura Usuario01" },
        "content": "Puedo ayudarte a revisar la liquidación...",
        "read": false,
        "createdAt": "2026-06-14T10:30:00Z"
      }
    ],
    "createdAt": "2026-06-14T10:00:00Z"
  }
}
```

### `PUT /api/requests/:id`

Actualiza una consulta (solo CLIENT, solo si PENDING).

**Request body**: `{ "title"?: string, "description"?: string, "category"?: string }`

**Response `200`**: Consulta actualizada.

### `DELETE /api/requests/:id`

Elimina una consulta (solo CLIENT, solo si PENDING).

**Response `200`**: `{ "success": true, "data": { "message": "Consulta eliminada" } }`

### `POST /api/requests/:id/respond`

Profesional responde a una consulta (solo PROFESSIONAL, solo si PENDING).

**Request body**:
```json
{
  "message": "string"  // Mensaje ofreciendo sus servicios
}
```

**Response `201`**:
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "clx...",
      "sender": { "id": "clx...", "fullName": "Laura Usuario01" },
      "content": "Puedo ayudarte a revisar la liquidación...",
      "createdAt": "2026-06-14T10:30:00Z"
    },
    "requestStatus": "RESPONDED"
  }
}
```

**Efectos secundarios**:
- Request.status cambia a RESPONDED
- Request.professionalId se asigna al profesional que respondió
- Se crea un Message en el hilo

### `POST /api/requests/:id/cancel`

Cancela una consulta (solo CLIENT, solo si PENDING o RESPONDED).

**Response `200`**:
```json
{
  "success": true,
  "data": { "status": "CANCELLED" }
}
```

---

## 5. Endpoints de Mensajes

### `GET /api/messages`

Obtiene la bandeja de mensajes del usuario autenticado.

**Query params**: `?requestId=clx...` (filtrar por consulta)

**Response `200`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "requestId": "clx...",
      "sender": { "id": "clx...", "fullName": "Laura Usuario01" },
      "receiver": { "id": "clx...", "fullName": "Andrea Usuario01" },
      "content": "Puedo ayudarte a revisar la liquidación...",
      "read": false,
      "createdAt": "2026-06-14T10:30:00Z"
    }
  ]
}
```

### `POST /api/messages`

Envía un mensaje.

**Request body**:
```json
{
  "receiverId": "string",
  "requestId": "string | null",   // Null si es mensaje directo
  "content": "string"
}
```

**Response `201`**: Mensaje creado.

---

## 6. Endpoints de Citas (Appointments)

### `POST /api/appointments`

Agenda una nueva videollamada (solo CLIENT).

**Request body**:
```json
{
  "professionalId": "string",
  "requestId": "string | null",
  "scheduledAt": "string (ISO 8601)",
  "durationMinutes": 20
}
```

**Reglas**:
- `durationMinutes` debe ser 10, 15, 20 o 30
- `scheduledAt` debe ser una fecha futura
- Ambos usuarios deben tener `walletAddress` registrada

**Response `201`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "client": { "id": "clx...", "fullName": "Andrea Usuario01" },
    "professional": { "id": "clx...", "fullName": "Laura Usuario01" },
    "scheduledAt": "2026-06-15T16:00:00Z",
    "durationMinutes": 20,
    "totalCost": 24000,
    "status": "SCHEDULED",
    "videoRoomUrl": null
  }
}
```

**Nota**: El `videoRoomUrl` se genera cuando ambos confirman asistencia.

### `GET /api/appointments`

Lista citas del usuario autenticado.

**Query params**: `?status=SCHEDULED&page=1&pageSize=20`

**Response `200`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "professional": { "id": "clx...", "fullName": "Laura Usuario01" },
      "scheduledAt": "2026-06-15T16:00:00Z",
      "durationMinutes": 20,
      "status": "SCHEDULED",
      "videoRoomUrl": null,
      "totalCost": 24000
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 3 }
}
```

### `GET /api/appointments/:id`

Obtiene detalle de una cita.

**Response `200`**: Cita completa con datos de ambas partes, sala, costos y estado.

### `POST /api/appointments/:id/confirm`

Confirma asistencia a una cita (ambos roles).

**Request body**:
```json
{
  "confirmed": true
}
```

**Efectos**:
- Crea/actualiza `AttendanceConfirmation` para el usuario
- Si ambos confirmaron → `Appointment.status = CONFIRMED_BOTH`
- Se genera `videoRoomUrl` (sala Jitsi Meet)

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "status": "CONFIRMED_BOTH",
    "videoRoomUrl": "https://meet.jit.si/OrientaProf-clx..."
  }
}
```

### `POST /api/appointments/:id/start`

Marca la cita como en progreso (llamado al iniciar videollamada).

**Response `200`**:
```json
{
  "success": true,
  "data": { "status": "IN_PROGRESS" }
}
```

### `POST /api/appointments/:id/complete`

Marca la cita como completada (llamado al finalizar videollamada).

**Efectos**:
- `Appointment.status = COMPLETED`
- Backend llama `contract.release(escrowIndex)` para liberar fondos
- `EscrowTransaction.status = LIBERADA`

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "escrowReleased": true,
    "releaseTxHash": "0x..."
  }
}
```

### `POST /api/appointments/:id/cancel`

Cancela una cita (cualquier parte).

**Response `200`**:
```json
{
  "success": true,
  "data": { "status": "CANCELLED" }
}
```

**Efectos sobre escrow**:
- Si había depósito en escrow → Backend llama `contract.refund()` (reembolso al cliente menos gas fee)
- `EscrowTransaction.status = REEMBOLSADA`

### `POST /api/appointments/:id/missed`

Marca una cita como no realizada por inasistencia de una parte.

**Request body**:
```json
{
  "absentParty": "CLIENT | PROFESSIONAL"
}
```

**Efectos**:
- Si el ausente es el profesional → `refund()` (reembolso al cliente)
- Si el ausente es el cliente → `release()` (liberación al profesional con descuento gas fee)

---

## 7. Endpoints de Pagos (Blockchain CELO)

### `POST /api/payments/prepare`

Prepara la información necesaria para que el frontend firme el depósito en el contrato.

**Request body**:
```json
{
  "appointmentId": "string"
}
```

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "appointmentId": "clx...",
    "contractAddress": "0x...",
    "professionalWallet": "0x...",
    "amount": "24000000000000000000000",  // 24 CELO en wei
    "amountDecimal": 24,
    "consultationId": "clx..."
  }
}
```

### `POST /api/payments/confirm`

Confirma que el depósito on-chain se realizó (el frontend envía el hash).

**Request body**:
```json
{
  "appointmentId": "string",
  "transactionHash": "string (0x...)"
}
```

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "status": "PENDING",
    "transactionHash": "0x..."
  }
}
```

**Efectos**:
- Crea `EscrowTransaction` con estado PENDIENTE
- Crea `PaymentTransaction` con el hash de la tx
- Escucha confirmación de la red (1 bloque en Alfajores)

### `GET /api/payments/transactions`

Historial de transacciones del usuario autenticado.

**Query params**: `?role=payer|payee&page=1&pageSize=20`

**Response `200`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "appointmentId": "clx...",
      "amount": 24,
      "token": "CELO",
      "status": "CONFIRMED",
      "transactionHash": "0x...",
      "description": "Depósito escrow",
      "createdAt": "2026-06-14T10:00:00Z"
    }
  ]
}
```

### `POST /api/payments/release`

**Backend interno**. Autoriza la liberación de fondos del escrow al profesional.

**Headers**: `X-API-Key: <backend-api-key>`

**Request body**:
```json
{
  "appointmentId": "string"
}
```

**Efectos**:
- Verifica que la cita esté COMPLETED
- Llama `OrientaProfPayments.release(contractIndex)` en el contrato
- Actualiza `EscrowTransaction.status = LIBERADA`

### `POST /api/payments/refund`

**Backend interno**. Autoriza el reembolso al cliente.

**Headers**: `X-API-Key: <backend-api-key>`

**Request body**:
```json
{
  "appointmentId": "string"
}
```

**Efectos**:
- Verifica que la cita esté CANCELLED o MISSED
- Llama `OrientaProfPayments.refund(contractIndex)` en el contrato
- Actualiza `EscrowTransaction.status = REEMBOLSADA`

### `POST /api/payments/webhook`

**Webhook**. Recibe eventos del contrato inteligente.

**Headers**: `X-Webhook-Secret: <secret>`

**Eventos manejados**:
- `TransactionCreated`: Confirmar que el depósito se registró on-chain
- `TransactionReleased`: Actualizar EscrowTransaction a LIBERADA
- `TransactionRefunded`: Actualizar EscrowTransaction a REEMBOLSADA
- `FundsWithdrawn`: Actualizar EscrowTransaction con withdrawTxHash

**Response `200`**:
```json
{
  "success": true
}
```

---

## 8. Endpoints de Configuración (Settings)

### `GET /api/settings/profile`

Obtiene datos personales completos del usuario autenticado.

**Response `200`**: Datos de User + ProfessionalProfile (si aplica).

### `PUT /api/settings/profile`

Actualiza datos personales.

**Request body**: Campos editables del perfil.

```json
{
  "fullName": "string",
  "documentType": "string",
  "documentNumber": "string",
  "gender": "string",
  "country": "string",
  "city": "string",
  "dateOfBirth": "string",
  "address": "string",
  "profession": "string (solo prof)",
  "description": "string (solo prof)",
  "categories": ["string (solo prof)"]
}
```

### `PUT /api/settings/password`

Cambia la contraseña.

**Request body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 chars)"
}
```

### `GET /api/settings/payment`

Obtiene información bancaria (solo PROFESSIONAL).

**Response `200`**: BankInfo del profesional.

### `PUT /api/settings/payment`

Actualiza información bancaria.

**Request body**:
```json
{
  "country": "string",
  "bankName": "string",
  "accountType": "AHORROS | CORRIENTE",
  "accountNumber": "string",
  "accountHolder": "string"
}
```

### `PUT /api/settings/rate`

Actualiza tarifa profesional (solo PROFESSIONAL). Mismo que `PUT /api/professionals/rate`.

---

## 9. Endpoints de Videollamada

### `GET /api/consultation/:appointmentId/token`

Genera un token JWT para acceder a la sala Jitsi Meet (solo participantes de la cita).

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "roomUrl": "https://meet.jit.si/OrientaProf-clx...",
    "token": "jwt-token..."
  }
}
```

### `POST /api/consultation/:appointmentId/status`

Notifica cambios de estado durante la videollamada.

**Request body**:
```json
{
  "status": "IN_PROGRESS | COMPLETED"
}
```

---

## 10. Resumen de Endpoints

| Método | Ruta | Rol | Propósito |
|--------|------|-----|-----------|
| `POST` | `/api/auth/register` | — | Registro de usuario |
| `POST` | `/api/auth/login` | — | Inicio de sesión |
| `POST` | `/api/auth/logout` | Cualquiera | Cerrar sesión |
| `GET` | `/api/auth/session` | Cualquiera | Sesión actual |
| `GET` | `/api/users/me` | Cualquiera | Perfil propio |
| `PUT` | `/api/users/me` | Cualquiera | Actualizar perfil |
| `PUT` | `/api/users/me/wallet` | Cualquiera | Actualizar wallet CELO |
| `PUT` | `/api/users/me/password` | Cualquiera | Cambiar contraseña |
| `GET` | `/api/professionals` | Cualquiera | Listar profesionales |
| `GET` | `/api/professionals/:id` | Cualquiera | Perfil profesional |
| `PUT` | `/api/professionals/rate` | PROFESSIONAL | Actualizar tarifa |
| `POST` | `/api/requests` | CLIENT | Crear consulta |
| `GET` | `/api/requests` | Ambos | Listar consultas |
| `GET` | `/api/requests/:id` | Ambos | Detalle consulta |
| `PUT` | `/api/requests/:id` | CLIENT | Editar consulta |
| `DELETE` | `/api/requests/:id` | CLIENT | Eliminar consulta |
| `POST` | `/api/requests/:id/respond` | PROFESSIONAL | Responder consulta |
| `POST` | `/api/requests/:id/cancel` | CLIENT | Cancelar consulta |
| `GET` | `/api/messages` | Cualquiera | Bandeja de mensajes |
| `POST` | `/api/messages` | Cualquiera | Enviar mensaje |
| `POST` | `/api/appointments` | CLIENT | Agendar cita |
| `GET` | `/api/appointments` | Cualquiera | Listar citas |
| `GET` | `/api/appointments/:id` | Cualquiera | Detalle cita |
| `POST` | `/api/appointments/:id/confirm` | Ambos | Confirmar asistencia |
| `POST` | `/api/appointments/:id/start` | Ambos | Iniciar videollamada |
| `POST` | `/api/appointments/:id/complete` | Ambos | Finalizar videollamada |
| `POST` | `/api/appointments/:id/cancel` | Ambos | Cancelar cita |
| `POST` | `/api/appointments/:id/missed` | Ambos | Reportar inasistencia |
| `POST` | `/api/payments/prepare` | CLIENT | Preparar depósito escrow |
| `POST` | `/api/payments/confirm` | CLIENT | Confirmar depósito |
| `GET` | `/api/payments/transactions` | Cualquiera | Historial de pagos |
| `POST` | `/api/payments/release` | Backend | Liberar fondos escrow |
| `POST` | `/api/payments/refund` | Backend | Reembolsar fondos |
| `POST` | `/api/payments/webhook` | Contrato | Eventos on-chain |
| `GET` | `/api/settings/profile` | Cualquiera | Datos personales |
| `PUT` | `/api/settings/profile` | Cualquiera | Actualizar datos |
| `PUT` | `/api/settings/password` | Cualquiera | Cambiar contraseña |
| `GET` | `/api/settings/payment` | PROFESSIONAL | Info bancaria |
| `PUT` | `/api/settings/payment` | PROFESSIONAL | Actualizar info bancaria |
| `PUT` | `/api/settings/rate` | PROFESSIONAL | Actualizar tarifa |
| `GET` | `/api/consultation/:id/token` | Ambos | Token sala Jitsi |
| `POST` | `/api/consultation/:id/status` | Ambos | Estado videollamada |

---

## 11. Manejo de Errores

| Código | Código interno | Causa |
|--------|---------------|-------|
| 400 | `VALIDATION_ERROR` | Datos inválidos (Zod) |
| 400 | `INVALID_STATE` | Acción no permitida para el estado actual |
| 401 | `UNAUTHORIZED` | Token no provisto o inválido |
| 403 | `FORBIDDEN` | Rol incorrecto para la acción |
| 403 | `NOT_OWNER` | El recurso no pertenece al usuario |
| 404 | `NOT_FOUND` | Recurso no existe |
| 409 | `DUPLICATE_EMAIL` | Email ya registrado |
| 409 | `DUPLICATE_USERNAME` | Username ya existe |
| 409 | `WALLET_REQUIRED` | Se requiere wallet CELO para esta acción |
| 500 | `INTERNAL_ERROR` | Error del servidor |
| 502 | `CONTRACT_ERROR` | Error al interactuar con el smart contract |

---

## 12. Autenticación y Autorización

```
Request → NextAuth.js Middleware → ¿JWT válido?
  ├── No → 401 Unauthorized
  └── Sí → ¿Rol permitido para la ruta?
       ├── No → 403 Forbidden
       └── Sí → ¿Es el propietario del recurso?
            ├── No → 403 Not Owner
            └── Sí → Pasa al handler
```

### Webhooks

Los webhooks del contrato se autentican mediante `X-Webhook-Secret` (preconfigurado en el backend y en el script de deploy del contrato).

### Backend interno

Las rutas `/api/payments/release` y `/api/payments/refund` se autentican mediante `X-API-Key` (solo el backend conoce esta clave).
