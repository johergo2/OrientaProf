# Especificación del Smart Contract — OrientaProf Payments (MVP)

> **Versión**: 1.0.0 — MVP Demostración Funcional
> **Red**: Celo (Alfajores testnet → Celo Mainnet)
> **Token**: CELO nativo (no cUSD — simplifica el MVP al evitar manejo de ERC20 y aprobaciones)

---

## 1. Propósito

El contrato inteligente `OrientaProfPayments` funciona como un sistema de **depósito en garantía (Escrow)** para la gestión segura de pagos entre usuarios y profesionales. Los fondos se bloquean en el contrato hasta que la videollamada se completa satisfactoriamente, momento en el cual el profesional puede retirarlos. En caso de controversia, se contemplan rutas de reembolso o liberación anticipada.

---

## 2. Diagrama de Flujo de Pagos

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO (Cliente)                        │
│                                                                  │
│  1. Conecta wallet (MetaMask / Valora)                          │
│  2. Firma transacción enviando CELO al contrato                 │
│  3. Contrato recibe CELO y crea transacción con estado          │
│     PENDIENTE                                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              OrientaProfPayments (Escrow Contract)                │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐                 │
│  │PENDIENTE │──▶│ LIBERADA │──▶│ Retiro del   │                 │
│  │ (bloquea)│   │(disponible│   │ profesional  │                 │
│  │          │   │ pa' retiro│   │              │                 │
│  └────┬─────┘   └──────────┘   └──────────────┘                 │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐                                                    │
│  │REEMBOLSADA│                                                   │
│  │(devuelto  │                                                   │
│  │ al user)  │                                                   │
│  └──────────┘                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Estados de la Transacción

| Estado | Descripción | Quién puede iniciar | Destino posible |
|--------|-------------|---------------------|-----------------|
| `PENDIENTE` | Fondos bloqueados en el contrato. Ninguna parte puede disponer de ellos | — (estado inicial) | `LIBERADA`, `REEMBOLSADA` |
| `LIBERADA` | Fondos disponibles para que el profesional los retire a su wallet | App (backend autorizado) | — (estado final) |
| `REEMBOLSADA` | Fondos devueltos al usuario (menos comisión por gas) | App (backend autorizado) | — (estado final) |

### Transiciones permitidas

```
                      ┌─────────────┐
                      │  PENDIENTE  │
                      └──────┬──────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐  ┌──────────────┐  ┌──────────┐
       │ LIBERADA │  │ (se mantiene │  │REEMBOLSADA│
       │          │  │  PENDIENTE) │  │          │
       └──────────┘  │ reschedule  │  └──────────┘
                     └──────────────┘
```

---

## 4. Estructura de Datos (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OrientaProfPayments {

    // --- Enums ---
    enum TransactionStatus {
        PENDIENTE,    // 0: Fondos bloqueados en escrow
        LIBERADA,     // 1: Fondos disponibles para retiro del profesional
        REEMBOLSADA   // 2: Fondos devueltos al usuario
    }

    // --- Structs ---
    struct Transaction {
        string  consultationId;     // ID de la consulta en la base de datos (UUID)
        address clientWallet;       // Wallet del usuario/cliente
        address professionalWallet; // Wallet del profesional
        uint256 amount;             // Monto pagado en CELO (wei)
        TransactionStatus status;   // Estado actual
        uint256 createdAt;          // Timestamp de creación del depósito
        uint256 resolvedAt;         // Timestamp de liberación o reembolso
    }

    // --- Storage ---
    // Cada transacción se almacena con un índice numérico
    mapping(uint256 => Transaction) public transactions;
    uint256 public transactionCounter;

    // Wallet de la plataforma (recibe comisiones/gas)
    address public platformWallet;

    // Backend autorizado para cambiar estados
    address public authorizedBackend;
}
```

### Campos almacenados por transacción

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `consultationId` | `string` | Identificador único de la consulta (desde BD off-chain) |
| `clientWallet` | `address` | Wallet del usuario que paga |
| `professionalWallet` | `address` | Wallet del profesional que recibe |
| `amount` | `uint256` | Monto en CELO (wei) depositado en el escrow |
| `status` | `TransactionStatus` | PENDIENTE (0), LIBERADA (1), REEMBOLSADA (2) |
| `createdAt` | `uint256` | Timestamp Unix del depósito inicial |
| `resolvedAt` | `uint256` | Timestamp Unix de liberación o reembolso |

---

## 5. Funciones del Contrato

### 5.1. `deposit(bytes32 _consultationId, address _professionalWallet)`

**Descripción**: El usuario deposita CELO en el contrato para una consulta. Los fondos quedan bloqueados en estado PENDIENTE.

**Quién llama**: Usuario (cliente) desde su wallet vía frontend (RainbowKit + Wagmi).

**Parámetros**:
- `_consultationId`: Identificador único de la consulta
- `_professionalWallet`: Dirección wallet del profesional

**Lógica**:
```solidity
function deposit(
    string calldata _consultationId,
    address _professionalWallet
) external payable {
    require(msg.value > 0, "El monto debe ser mayor a 0");
    require(_professionalWallet != address(0), "Wallet profesional invalida");
    require(_professionalWallet != msg.sender, "No puedes pagarte a ti mismo");

    transactions[transactionCounter] = Transaction({
        consultationId:     _consultationId,
        clientWallet:       msg.sender,
        professionalWallet: _professionalWallet,
        amount:             msg.value,
        status:             TransactionStatus.PENDIENTE,
        createdAt:          block.timestamp,
        resolvedAt:         0
    });

    emit TransactionCreated(
        transactionCounter,
        _consultationId,
        msg.sender,
        _professionalWallet,
        msg.value
    );

    transactionCounter++;
}
```

**Evento**:
```solidity
event TransactionCreated(
    uint256 indexed transactionIndex,
    string  indexed consultationId,
    address indexed clientWallet,
    address professionalWallet,
    uint256 amount
);
```

### 5.2. `release(uint256 _transactionIndex)`

**Descripción**: La aplicación (backend autorizado) cambia el estado de PENDIENTE a LIBERADA, indicando que la videollamada se realizó satisfactoriamente. Los fondos quedan disponibles para que el profesional los retire.

**Quién llama**: Backend de OrientaProf (solo `authorizedBackend`).

**Precondiciones**:
- Transacción debe existir (`_transactionIndex < transactionCounter`)
- Estado debe ser `PENDIENTE`
- Solo el `authorizedBackend` puede ejecutar

**Lógica**:
```solidity
function release(uint256 _transactionIndex) external {
    require(msg.sender == authorizedBackend, "Solo el backend autorizado");
    require(_transactionIndex < transactionCounter, "Transaccion no existe");

    Transaction storage txn = transactions[_transactionIndex];
    require(txn.status == TransactionStatus.PENDIENTE, "No esta pendiente");

    txn.status = TransactionStatus.LIBERADA;
    txn.resolvedAt = block.timestamp;

    emit TransactionReleased(_transactionIndex, txn.consultationId, txn.professionalWallet, txn.amount);
}
```

**Evento**:
```solidity
event TransactionReleased(
    uint256 indexed transactionIndex,
    string  indexed consultationId,
    address indexed professionalWallet,
    uint256 amount
);
```

### 5.3. `refund(uint256 _transactionIndex)`

**Descripción**: La aplicación (backend autorizado) cambia el estado de PENDIENTE a REEMBOLSADA y transfiere los fondos de vuelta al usuario. Aplica en dos escenarios:

1. **Incumplimiento del profesional**: El profesional no se presenta o no cumple. El usuario puede solicitar reembolso (se descuenta el gas de la comisión).
2. **Acuerdo mutuo**: Ambas partes acuerdan cancelar.

**Quién llama**: Backend de OrientaProf (solo `authorizedBackend`).

**Descuento**: Se deduce una tarifa por gas (`gasFee`) que queda en el contrato o se envía a `platformWallet`.

**Lógica**:
```solidity
function refund(uint256 _transactionIndex) external {
    require(msg.sender == authorizedBackend, "Solo el backend autorizado");
    require(_transactionIndex < transactionCounter, "Transaccion no existe");

    Transaction storage txn = transactions[_transactionIndex];
    require(txn.status == TransactionStatus.PENDIENTE, "No esta pendiente");

    txn.status = TransactionStatus.REEMBOLSADA;
    txn.resolvedAt = block.timestamp;

    // Transferir al cliente (menos tarifa de gas)
    uint256 gasFee = txn.amount * gasFeeBps / 10000;
    uint256 refundAmount = txn.amount - gasFee;

    (bool successClient, ) = payable(txn.clientWallet).call{value: refundAmount}("");
    require(successClient, "Reembolso al cliente fallo");

    if (gasFee > 0) {
        (bool successPlatform, ) = payable(platformWallet).call{value: gasFee}("");
        require(successPlatform, "Transferencia de tarifa fallo");
    }

    emit TransactionRefunded(_transactionIndex, txn.consultationId, txn.clientWallet, refundAmount, gasFee);
}
```

**Evento**:
```solidity
event TransactionRefunded(
    uint256 indexed transactionIndex,
    string  indexed consultationId,
    address indexed clientWallet,
    uint256 refundAmount,
    uint256 gasFee
);
```

### 5.4. `withdraw(uint256 _transactionIndex)`

**Descripción**: El profesional retira los fondos de una transacción en estado LIBERADA a su wallet.

**Quién llama**: Profesional (desde su wallet vía frontend).

**Lógica**:
```solidity
function withdraw(uint256 _transactionIndex) external {
    require(_transactionIndex < transactionCounter, "Transaccion no existe");

    Transaction storage txn = transactions[_transactionIndex];
    require(txn.status == TransactionStatus.LIBERADA, "No esta liberada");
    require(txn.professionalWallet == msg.sender, "Solo el profesional puede retirar");

    // Evita reentrancy y doble retiro
    txn.status = TransactionStatus.REEMBOLSADA; // Se reusa como "retirada"
    // Nota: para el MVP usamos REEMBOLSADA para indicar "ya no disponible".
    // En producción se recomienda un estado adicional WITHDRAWN.

    uint256 amount = txn.amount;

    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Retiro fallo");

    emit FundsWithdrawn(_transactionIndex, txn.consultationId, msg.sender, amount);
}
```

**Evento**:
```solidity
event FundsWithdrawn(
    uint256 indexed transactionIndex,
    string  indexed consultationId,
    address indexed professionalWallet,
    uint256 amount
);
```

### 5.5. Funciones administrativas

```solidity
// Establecer wallet de plataforma (solo owner)
function setPlatformWallet(address _platformWallet) external onlyOwner;

// Establecer dirección del backend autorizado (solo owner)
function setAuthorizedBackend(address _authorizedBackend) external onlyOwner;

// Actualizar tarifa de gas en basis points (solo owner)
function setGasFeeBps(uint256 _gasFeeBps) external onlyOwner;
// Ejemplo: 100 = 1%, 500 = 5%, 1000 = 10%
```

---

## 6. Escenarios Completo

### Escenario A: Flujo feliz — Videollamada exitosa

```
1. USUARIO → llama deposit(consultationId, professionalWallet) con CELO
   → Transacción creada con estado PENDIENTE
   → Fondos bloqueados en el contrato

2. (Off-chain) Videollamada se realiza exitosamente

3. BACKEND → llama release(transactionIndex)
   → Estado cambia a LIBERADA
   → Fondos disponibles para el profesional

4. PROFESIONAL → llama withdraw(transactionIndex)
   → Fondos transferidos a su wallet
   → Estado cambia a REEMBOLSADA (reusado como "retirado")
```

### Escenario B: Incumplimiento del profesional

```
1. USUARIO → deposit() → PENDIENTE

2. Profesional no se presenta a la videollamada
   O: Profesional solicita reagendamiento

3. USUARIO acepta reagendamiento
   → Transacción permanece PENDIENTE
   → Se agenda nueva fecha (off-chain)

   O: USUARIO solicita reembolso

4. BACKEND → llama refund(transactionIndex)
   → Se descuenta gasFee (comisión)
   → Resto devuelto a clientWallet
   → Estado → REEMBOLSADA
```

### Escenario C: Incumplimiento del usuario

```
1. USUARIO → deposit() → PENDIENTE

2. Usuario no se presenta a la videollamada
   O: Usuario solicita reagendamiento

3. PROFESIONAL acepta reagendamiento
   → Transacción permanece PENDIENTE
   → Se agenda nueva fecha (off-chain)

   O: PROFESIONAL solicita liberación de pago

4. BACKEND → llama release(transactionIndex)
   → Se descuenta gasFee (comisión)
   → Resto disponible para retiro del profesional
   → Estado → LIBERADA
```

### Escenario D: Fondos olvidados (excluido del MVP)

```
1. Depósito queda PENDIENTE indefinidamente

2. (MVP: No implementado)
   Futuro: Admin puede marcar como OLVIDADO y
   transferir a platformWallet
```

---

## 7. Tarifas y Comisiones

| Concepto | Valor MVP | Notas |
|----------|-----------|-------|
| **Gas fee** (reembolso) | 5% (500 bps) | Se descuenta del monto al reembolsar al usuario |
| **Gas fee** (liberación por inasistencia del usuario) | 5% (500 bps) | Se descuenta del monto al liberar al profesional |
| **Comisión plataforma** | 0% (MVP) | Se implementará en versión posterior |

Las tarifas se expresan en **basis points (bps)**:
- `gasFeeBps = 500` → 5%
- Almacenado como `uint256` configurable por el owner

---

## 8. Seguridad

| Aspecto | Implementación |
|---------|---------------|
| **Reentrancy** | Patrón checks-effects-interactions. El estado se actualiza antes de la transferencia. |
| **Solo backend** | Modifier `onlyBackend` en `release()` y `refund()`. La dirección es configurable. |
| **Solo owner** | Modifier `onlyOwner` (OpenZeppelin Ownable) para funciones administrativas. |
| **Protección de fondos** | Ninguna parte puede retirar mientras esté PENDIENTE. Solo el profesional puede retirar en LIBERADA. |
| **Validación de montos** | `require(msg.value > 0)` en `deposit()`. |
| **Eventos** | Cada acción crítica emite un evento para trazabilidad off-chain. |

---

## 9. Integración con el Backend

### Roles on-chain

| Rol | Dirección | Permisos |
|-----|-----------|----------|
| **Owner** | Despliegue del contrato | `setPlatformWallet()`, `setAuthorizedBackend()`, `setGasFeeBps()` |
| **AuthorizedBackend** | Backend de OrientaProf | `release()`, `refund()` |
| **Usuario (cliente)** | Cualquier wallet | `deposit()` |
| **Profesional** | Wallet registrada en la transacción | `withdraw()` (solo de sus propias transacciones) |

### Flujo de integración

```
Frontend (cliente):
  → Conecta wallet (RainbowKit + Wagmi)
  → Calcula monto (tarifaPorMinuto × duracionMinutos)
  → Llama contract.deposit(consultationId, professionalWallet)
    con el valor en CELO
  → Escucha evento TransactionCreated
  → Actualiza UI con hash de transacción

Frontend (profesional):
  → Conecta wallet
  → Consulta transacciones LIBERADA donde es professionalWallet
  → Llama contract.withdraw(transactionIndex)

Backend (servicio autorizado):
  → Al completar videollamada exitosa:
      → Llama contract.release(transactionIndex)
  → Al aprobar reembolso:
      → Llama contract.refund(transactionIndex)
  → Escucha eventos del contrato vía webhook / polling
  → Actualiza tabla PaymentTransaction en PostgreSQL
```

### API Routes relacionadas

| Ruta | Método | Propósito |
|------|--------|-----------|
| `/api/payments/deposit` | POST | Prepara metadata para la transacción (calcula monto) |
| `/api/payments/release` | POST | Backend → llama `release()` en el contrato |
| `/api/payments/refund` | POST | Backend → llama `refund()` en el contrato |
| `/api/payments/webhook` | POST | Recibe eventos on-chain y actualiza DB |
| `/api/payments/transactions` | GET | Lista transacciones del usuario autenticado |

---

## 10. Código Completo del Contrato (MVP)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OrientaProfPayments is Ownable {

    enum TransactionStatus {
        PENDIENTE,
        LIBERADA,
        REEMBOLSADA
    }

    struct Transaction {
        string  consultationId;
        address clientWallet;
        address professionalWallet;
        uint256 amount;
        TransactionStatus status;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    mapping(uint256 => Transaction) public transactions;
    uint256 public transactionCounter;

    address public platformWallet;
    address public authorizedBackend;
    uint256 public gasFeeBps = 500; // 5% por defecto

    // --- Events ---
    event TransactionCreated(
        uint256 indexed transactionIndex,
        string  indexed consultationId,
        address indexed clientWallet,
        address professionalWallet,
        uint256 amount
    );

    event TransactionReleased(
        uint256 indexed transactionIndex,
        string  indexed consultationId,
        address indexed professionalWallet,
        uint256 amount
    );

    event TransactionRefunded(
        uint256 indexed transactionIndex,
        string  indexed consultationId,
        address indexed clientWallet,
        uint256 refundAmount,
        uint256 gasFee
    );

    event FundsWithdrawn(
        uint256 indexed transactionIndex,
        string  indexed consultationId,
        address indexed professionalWallet,
        uint256 amount
    );

    // --- Modifiers ---
    modifier onlyBackend() {
        require(msg.sender == authorizedBackend, "Solo el backend autorizado");
        _;
    }

    modifier validTransaction(uint256 _index) {
        require(_index < transactionCounter, "Transaccion no existe");
        _;
    }

    // --- Constructor ---
    constructor(address _platformWallet, address _authorizedBackend) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Platform wallet invalida");
        require(_authorizedBackend != address(0), "Backend invalido");
        platformWallet = _platformWallet;
        authorizedBackend = _authorizedBackend;
    }

    // --- Core Functions ---

    /// @notice El usuario deposita CELO para una consulta
    function deposit(
        string calldata _consultationId,
        address _professionalWallet
    ) external payable {
        require(msg.value > 0, "El monto debe ser mayor a 0");
        require(_professionalWallet != address(0), "Wallet profesional invalida");
        require(_professionalWallet != msg.sender, "No puedes pagarte a ti mismo");

        transactions[transactionCounter] = Transaction({
            consultationId:     _consultationId,
            clientWallet:       msg.sender,
            professionalWallet: _professionalWallet,
            amount:             msg.value,
            status:             TransactionStatus.PENDIENTE,
            createdAt:          block.timestamp,
            resolvedAt:         0
        });

        emit TransactionCreated(
            transactionCounter,
            _consultationId,
            msg.sender,
            _professionalWallet,
            msg.value
        );

        transactionCounter++;
    }

    /// @notice Backend autoriza liberacion de fondos (videollamada exitosa)
    function release(uint256 _transactionIndex)
        external
        onlyBackend
        validTransaction(_transactionIndex)
    {
        Transaction storage txn = transactions[_transactionIndex];
        require(txn.status == TransactionStatus.PENDIENTE, "No esta pendiente");

        txn.status = TransactionStatus.LIBERADA;
        txn.resolvedAt = block.timestamp;

        emit TransactionReleased(
            _transactionIndex,
            txn.consultationId,
            txn.professionalWallet,
            txn.amount
        );
    }

    /// @notice Backend autoriza reembolso al usuario
    function refund(uint256 _transactionIndex)
        external
        onlyBackend
        validTransaction(_transactionIndex)
    {
        Transaction storage txn = transactions[_transactionIndex];
        require(txn.status == TransactionStatus.PENDIENTE, "No esta pendiente");

        txn.status = TransactionStatus.REEMBOLSADA;
        txn.resolvedAt = block.timestamp;

        uint256 gasFee = (txn.amount * gasFeeBps) / 10000;
        uint256 refundAmount = txn.amount - gasFee;

        (bool successClient, ) = payable(txn.clientWallet).call{value: refundAmount}("");
        require(successClient, "Reembolso al cliente fallo");

        if (gasFee > 0) {
            (bool successPlatform, ) = payable(platformWallet).call{value: gasFee}("");
            require(successPlatform, "Transferencia de tarifa fallo");
        }

        emit TransactionRefunded(
            _transactionIndex,
            txn.consultationId,
            txn.clientWallet,
            refundAmount,
            gasFee
        );
    }

    /// @notice Profesional retira fondos liberados
    function withdraw(uint256 _transactionIndex)
        external
        validTransaction(_transactionIndex)
    {
        Transaction storage txn = transactions[_transactionIndex];
        require(txn.status == TransactionStatus.LIBERADA, "No esta liberada");
        require(txn.professionalWallet == msg.sender, "Solo el profesional puede retirar");

        txn.status = TransactionStatus.REEMBOLSADA;
        txn.resolvedAt = block.timestamp;

        uint256 amount = txn.amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Retiro fallo");

        emit FundsWithdrawn(
            _transactionIndex,
            txn.consultationId,
            msg.sender,
            amount
        );
    }

    // --- Admin Functions ---

    function setPlatformWallet(address _platformWallet) external onlyOwner {
        require(_platformWallet != address(0), "Wallet invalida");
        platformWallet = _platformWallet;
    }

    function setAuthorizedBackend(address _authorizedBackend) external onlyOwner {
        require(_authorizedBackend != address(0), "Backend invalido");
        authorizedBackend = _authorizedBackend;
    }

    function setGasFeeBps(uint256 _gasFeeBps) external onlyOwner {
        require(_gasFeeBps <= 2000, "Max 20%");
        gasFeeBps = _gasFeeBps;
    }

    // --- View Functions ---

    function getTransaction(uint256 _index)
        external
        view
        returns (Transaction memory)
    {
        require(_index < transactionCounter, "No existe");
        return transactions[_index];
    }

    function getTransactionsByClient(address _client)
        external
        view
        returns (uint256[] memory indices)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < transactionCounter; i++) {
            if (transactions[i].clientWallet == _client) {
                count++;
            }
        }

        indices = new uint256[](count);
        uint256 pos = 0;
        for (uint256 i = 0; i < transactionCounter; i++) {
            if (transactions[i].clientWallet == _client) {
                indices[pos] = i;
                pos++;
            }
        }
    }

    function getTransactionsByProfessional(address _professional)
        external
        view
        returns (uint256[] memory indices)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < transactionCounter; i++) {
            if (transactions[i].professionalWallet == _professional) {
                count++;
            }
        }

        indices = new uint256[](count);
        uint256 pos = 0;
        for (uint256 i = 0; i < transactionCounter; i++) {
            if (transactions[i].professionalWallet == _professional) {
                indices[pos] = i;
                pos++;
            }
        }
    }
}
```

---

## 11. Tests Mínimos Requeridos

```solidity
// Cobertura de tests para el MVP:

describe("OrientaProfPayments", () => {
    describe("Deploy", () => {
        // ✓ Deploy con wallet de plataforma y backend válidos
        // ✓ Revertir deploy con address(0)
        // ✓ Owner asignado correctamente
    })

    describe("deposit()", () => {
        // ✓ Crear depósito con monto válido
        // ✓ Revertir con monto = 0
        // ✓ Revertir si professionalWallet == clientWallet
        // ✓ Revertir si professionalWallet == address(0)
        // ✓ Emitir evento TransactionCreated
        // ✓ Almacenar campos correctamente
    })

    describe("release()", () => {
        // ✓ Liberar transacción PENDIENTE
        // ✓ Revertir si no es el backend autorizado
        // ✓ Revertir si ya está LIBERADA
        // ✓ Revertir si ya está REEMBOLSADA
        // ✓ Emitir evento TransactionReleased
    })

    describe("refund()", () => {
        // ✓ Reembolsar transacción PENDIENTE
        // ✓ Revertir si no es el backend autorizado
        // ✓ Cliente recibe monto - gasFee
        // ✓ PlatformWallet recibe gasFee
        // ✓ gasFee = 0 no rompe la transacción
        // ✓ Emitir evento TransactionRefunded
    })

    describe("withdraw()", () => {
        // ✓ Retirar transacción LIBERADA
        // ✓ Revertir si no es el profesional
        // ✓ Revertir si está PENDIENTE
        // ✓ Revertir si ya está REEMBOLSADA (doble retiro)
        // ✓ Profesional recibe el monto completo
        // ✓ Emitir evento FundsWithdrawn
    })

    describe("Admin", () => {
        // ✓ Solo owner puede setPlatformWallet
        // ✓ Solo owner puede setAuthorizedBackend
        // ✓ Solo owner puede setGasFeeBps
        // ✓ Revertir si no es el owner
    })

    describe("View functions", () => {
        // ✓ getTransaction() retorna datos correctos
        // ✓ getTransactionsByClient() lista transacciones
        // ✓ getTransactionsByProfessional() lista transacciones
    })
})
```

---

## 12. Notas para el MVP

1. **No se usa cUSD**: El MVP usa CELO nativo (`msg.value`) para simplificar. Esto elimina la necesidad de `approve()` y `transferFrom()` de ERC20.

2. **No hay estado OLVIDADO**: Los fondos en PENDIENTE abandonados no se gestionan en el MVP. Se implementará en versión posterior.

3. **No hay comisión de plataforma**: El `gasFee` (5%) cubre el costo operativo. En producción se agregará una comisión plataforma adicional.

4. **Estados reducidos**: `LIBERADA` + `withdraw()` = fondos al profesional. `REEMBOLSADA` se reusa tanto para reembolso como para retiro completado. Para producción se recomienda un enum más granular: `PENDIENTE`, `LIBERADA`, `REEMBOLSADA`, `RETIRADA`, `OLVIDADA`.

5. **Sin reputación on-chain**: El contrato `OrientaProfReputation.sol` queda fuera del MVP. Las calificaciones se manejan solo en base de datos.

6. **Hardhat + Alfajores**: El desarrollo y pruebas se hacen con Hardhat contra Celo Alfajores testnet.

7. **Seguridad**: El contrato usa OpenZeppelin `Ownable` para administración. Se recomienda una auditoría profesional antes de mainnet.
