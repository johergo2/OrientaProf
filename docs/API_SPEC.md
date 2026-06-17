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

### `GET /api/user/profile`

Obtiene el perfil del usuario autenticado.

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
    "walletAddress": "0x..."
  }
}
```

### `PATCH /api/user/wallet`

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
    "id": "clx...",
    "walletAddress": "0x..."
  }
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

Crea una nueva consulta (solo CLIENT). **Implementado.**

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

Lista consultas según el rol del usuario autenticado. **Implementado.**

- **CLIENT**: Ve sus propias consultas
- **PROFESSIONAL**: Ve consultas PENDING disponibles (públicas), además retorna `categories[]` y `professionalUsername`

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

Obtiene una consulta individual con datos del cliente. **Implementado.**

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
    "client": { "username": "Orientap1", "fullName": "Andrea Usuario01" },
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

### `POST /api/requests/:id`

Profesional responde a una consulta (solo PROFESSIONAL, solo si PENDING). **Implementado.**

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
    "requestId": "clx...",
    "status": "RESPONDED",
    "message": "Su propuesta de asesoría fue enviada correctamente al cliente."
  }
}
```

**Efectos secundarios**:
- Request.status cambia a RESPONDED
- Request.professionalId se asigna al profesional que respondió
- Se crea un Message en el hilo (sender = profesional, receiver = cliente)

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

Agenda una nueva videollamada (CLIENT o PROFESSIONAL).

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
- Si `requestId` se provee, solo participantes de la consulta pueden agendar

**Response `201`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "scheduledAt": "2026-06-15T16:00:00Z",
    "durationMinutes": 20,
    "totalCost": 24000,
    "status": "SCHEDULED",
    "client": { "id": "clx...", "fullName": "Andrea Usuario01" },
    "professional": { "id": "clx...", "fullName": "Laura Usuario01" }
  }
}
```

### `GET /api/appointments`

Lista citas del usuario autenticado.

**Response `200`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "scheduledAt": "2026-06-15T16:00:00Z",
      "durationMinutes": 20,
      "totalCost": 24000,
      "status": "SCHEDULED",
      "clientConfirmed": false,
      "professionalConfirmed": false,
      "client": { "id": "clx...", "fullName": "Andrea Usuario01", "walletAddress": "0x..." },
      "professional": { "id": "clx...", "fullName": "Laura Usuario01", "walletAddress": "0x..." },
      "request": { "id": "clx...", "title": "Revisión de liquidación" }
    }
  ]
}
```

### `GET /api/appointments/:id`

Obtiene detalle de una cita.

**Response `200`**: Cita completa con datos de ambas partes (incluyendo walletAddress) y estado de confirmación.

### `POST /api/appointments/:id/join`

Confirma entrada a la videollamada de un participante (ambos roles).

**Reglas**:
- Solo se puede join si la cita no está CANCELLED ni COMPLETED
- Solo se puede join dentro de la ventana: 1h antes de `scheduledAt` hasta el fin de la cita
- Marca `clientConfirmed` o `professionalConfirmed` según quién llama
- Solo marca la confirmación del participante; no cambia el status automáticamente

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "clientConfirmed": true,
    "professionalConfirmed": false,
    "status": "SCHEDULED"
  }
}
```

### `POST /api/appointments/:id/complete`

Finaliza manualmente la videollamada (cualquier participante).

**Reglas**:
- Solo participantes de la cita pueden llamar
- La cita no debe estar CANCELLED ni COMPLETED
- Marca `status = COMPLETED` y establece `completedAt`

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "status": "COMPLETED",
    "completedAt": "2026-06-17T10:00:00Z"
  }
}
```

### `POST /api/appointments/:id/reschedule`

Cambia la fecha y duración de una cita existente (cualquier participante).

**Request body**:
```json
{
  "scheduledAt": "2026-06-20T16:00:00Z",
  "durationMinutes": 20
}
```

**Reglas**:
- Solo participantes de la cita pueden llamar
- La cita no debe estar CANCELLED ni COMPLETED
- La nueva fecha debe ser futura
- `durationMinutes` debe ser 10, 15, 20 o 30
- Crea un registro en `AuditLog` con valores anteriores/nuevos (historial)

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "scheduledAt": "2026-06-20T16:00:00Z",
    "durationMinutes": 20,
    "status": "SCHEDULED"
  }
}
```

### `POST /api/appointments/:id/cancel`

Cancela una cita (cualquier parte, solo si `scheduledAt > now`).

**Response `200`**:
```json
{
  "success": true,
  "data": { "status": "CANCELLED" }
}
```

**Nota**: El escrow no se maneja automáticamente al cancelar — el usuario debe solicitar reembolso via `/api/payments/refund` si hay depósito.

---

## 7. Endpoints de Pagos (Blockchain CELO)

### `POST /api/payments/deposit`

Registra un depósito en escrow para una cita (llamado por el frontend tras firma on-chain exitosa).

**Request body**:
```json
{
  "appointmentId": "string",
  "depositTxHash": "string (0x...)",
  "clientAddress": "string (0x...)",
  "professionalAddress": "string (0x...)",
  "amount": "number (en CELO, ej: 0.001)"
}
```

**Efectos**:
- Consulta `transactionCounter` on-chain
- Crea `EscrowTransaction` con estado PENDIENTE
- Previene depósitos duplicados para la misma cita

**Response `201`**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "appointmentId": "clx...",
    "transactionIndex": 0,
    "clientAddress": "0x...",
    "professionalAddress": "0x...",
    "amount": 0.001,
    "status": "PENDIENTE",
    "depositTxHash": "0x..."
  }
}
```

### `POST /api/payments/release`

**Llamado por el profesional** para liberar fondos del escrow.

**Request body**:
```json
{
  "appointmentId": "string"
}
```

**Efectos**:
- Solo el `professionalId` de la cita puede llamar
- Verifica que exista un EscrowTransaction en estado PENDIENTE
- Llama `OrientaProfPayments.release(transactionIndex)` en el contrato
- Actualiza `EscrowTransaction.status = LIBERADA`

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "status": "LIBERADA"
  }
}
```

### `POST /api/payments/refund`

**Llamado por el cliente** para reembolsar fondos del escrow.

**Request body**:
```json
{
  "appointmentId": "string"
}
```

**Efectos**:
- Solo el `clientId` de la cita puede llamar
- Verifica que exista un EscrowTransaction en estado PENDIENTE
- Llama `OrientaProfPayments.refund(transactionIndex)` en el contrato
- Actualiza `EscrowTransaction.status = REEMBOLSADA`

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "status": "REEMBOLSADA"
  }
}
```

### `GET /api/payments/transactions`

Historial de transacciones escrow del usuario autenticado.

**Response `200`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "appointmentId": "clx...",
      "transactionIndex": 0,
      "amount": 0.001,
      "status": "PENDIENTE",
      "depositTxHash": "0x...",
      "appointment": {
        "id": "clx...",
        "scheduledAt": "...",
        "status": "SCHEDULED"
      },
      "createdAt": "2026-06-14T10:00:00Z"
    }
  ]
}
```

---

## 8. Reschedule

El reagendamiento se maneja mediante el endpoint `POST /api/appointments/[id]/reschedule` que modifica los campos `scheduledAt` y `durationMinutes` de la misma cita. No se cancela ni se crea una nueva cita.

**Flujo**:
1. Cualquier participante selecciona nueva fecha + duración
2. Llama `POST /api/appointments/[id]/reschedule` con `scheduledAt` y `durationMinutes`
3. El endpoint actualiza la cita y registra el cambio en `AuditLog`
4. La otra parte ve la fecha actualizada en su lista

---

## 9. Videollamada (Jitsi Meet)

La sala de videollamada se accede via frontend en `/appointments/[id]/room`. El nombre de sala Jitsi se deriva del ID de la cita (`OrientaProf-{appointmentId}`) y se embebe via iframe apuntando a `meet.jit.si`. El estado de la videollamada se maneja mediante `POST /api/appointments/[id]/join` (marca confirmación de entrada) y `POST /api/appointments/[id]/complete` (finaliza la cita manualmente).

---

## 10. Resumen de Endpoints

| Método | Ruta | Rol | Propósito | Estado |
|--------|------|-----|-----------|--------|
| `POST` | `/api/auth/register` | — | Registro de usuario | ✅ |
| `POST` | `/api/auth/login` | — | Inicio de sesión | ✅ |
| `POST` | `/api/auth/logout` | Cualquiera | Cerrar sesión | ✅ |
| `GET` | `/api/auth/session` | Cualquiera | Sesión actual | ✅ |
| `GET` | `/api/user/profile` | Cualquiera | Perfil propio | ✅ |
| `PATCH` | `/api/user/wallet` | Cualquiera | Actualizar wallet CELO | ✅ |
| `GET` | `/api/professionals` | Cualquiera | Listar profesionales | ✅ |
| `GET` | `/api/professionals/:id` | Cualquiera | Perfil profesional | — |
| `POST` | `/api/requests` | CLIENT | Crear consulta | ✅ |
| `GET` | `/api/requests` | Ambos | Listar consultas | ✅ |
| `GET` | `/api/requests/:id` | Ambos | Detalle consulta | ✅ |
| `POST` | `/api/requests/:id` | PROFESSIONAL | Responder consulta | ✅ |
| `POST` | `/api/requests/:id/cancel` | CLIENT | Cancelar consulta | ✅ |
| `GET` | `/api/messages` | Cualquiera | Bandeja de mensajes | ✅ |
| `POST` | `/api/messages` | Cualquiera | Enviar mensaje | ✅ |
| `POST` | `/api/appointments` | Ambos | Agendar cita | ✅ |
| `GET` | `/api/appointments` | Cualquiera | Listar citas | ✅ |
| `GET` | `/api/appointments/:id` | Cualquiera | Detalle cita | ✅ |
| `POST` | `/api/appointments/:id/join` | Ambos | Confirmar entrada a videollamada | ✅ |
| `POST` | `/api/appointments/:id/complete` | Ambos | Finalizar videollamada | ✅ |
| `POST` | `/api/appointments/:id/reschedule` | Ambos | Reagendar (modificar fecha/duración) | ✅ |
| `POST` | `/api/appointments/:id/cancel` | Ambos | Cancelar cita | ✅ |
| `POST` | `/api/payments/deposit` | CLIENT | Registrar depósito escrow | ✅ |
| `POST` | `/api/payments/release` | PROFESSIONAL | Liberar fondos escrow | ✅ |
| `POST` | `/api/payments/refund` | CLIENT | Reembolsar fondos | ✅ |
| `GET` | `/api/payments/transactions` | Cualquiera | Historial transacciones escrow | ✅ |

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

### Pagos release/refund

Las rutas `/api/payments/release` y `/api/payments/refund` se autentican por sesión de usuario y verifican que el llamante sea el participante correspondiente de la cita (professionalId para release, clientId para refund). No se usan API keys internas.
