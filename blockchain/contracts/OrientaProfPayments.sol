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
    uint256 public gasFeeBps = 500;

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

    modifier onlyBackend() {
        require(msg.sender == authorizedBackend, "Solo el backend autorizado");
        _;
    }

    modifier validTransaction(uint256 _index) {
        require(_index < transactionCounter, "Transaccion no existe");
        _;
    }

    constructor(address _platformWallet, address _authorizedBackend) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Platform wallet invalida");
        require(_authorizedBackend != address(0), "Backend invalido");
        platformWallet = _platformWallet;
        authorizedBackend = _authorizedBackend;
    }

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

    receive() external payable {
        revert("No aceptamos CELO suelto");
    }
}
