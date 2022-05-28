// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";

contract MultiSigner is Context {
    enum Action {
        AddSuperSigner,
        RemoveSuperSigner,
        InitSigner,
        AddSigner,
        RemoveSigner
    }

    struct PendingAction {
        Action action;
        bytes data;
        uint8 confirmations;
        bool executed;
    }

    event NewPendingAction(uint256 indexed index, Action indexed action, bytes data);
    event ActionExecuted(uint256 indexed index);
    event SuperSigner(address indexed addr, bool isNew, uint256 timestamp);
    event Signer(address indexed addr, uint24 school, bool isNew, uint256 timestamp);

    uint8 public superSignerCount;
    PendingAction[] public pendingActions;

    mapping(address => bool) public superSigners;

    mapping(address => uint24) public signers;

    mapping(uint24 => uint8) public signerCount;

    mapping(address => mapping(uint256 => bool)) public confirmed;

    modifier onlySuperSigner() {
        require(isSuperSigner(_msgSender()), "Not super signer");
        _;
    }

    modifier onlySigner(uint24 school) {
        require(isSigner(_msgSender(), school), "Not signer");
        _;
    }

    modifier onlyLegalActor(Action action, bytes memory data) {
        require(_isActorLegal(_msgSender(), action, data), "Actor not legal");
        _;
    }

    modifier onlyLegalAction(Action action, bytes calldata data) {
        require(_isActionLegal(action, data), "Action not legal");
        _;
    }

    modifier notConfirmed(uint256 index) {
        require(_notConfirmed(_msgSender(), index), "Already confirmed");
        _;
    }

    modifier notExecuted(uint256 index) {
        require(!pendingActions[index].executed, "Already executed");
        _;
    }

    constructor(address[] memory initialSigners) {
        for (uint256 i = 0; i < initialSigners.length; i++) {
            superSigners[initialSigners[i]] = true;
            emit SuperSigner(initialSigners[i], true, block.timestamp);
        }
        superSignerCount = uint8(initialSigners.length);
    }

    function encodeSuperSigner(address addr) external pure returns (bytes memory) {
        return abi.encode(addr);
    }

    function encodeSigner(uint24 school, address addr) external pure returns (bytes memory) {
        return abi.encode(school, addr);
    }

    function encodeInitSigners(uint24 school, address[] memory addrs) external pure returns (bytes memory) {
        return abi.encode(school, addrs);
    }

    function startAction(Action action, bytes calldata data)
        external
        onlyLegalActor(action, data)
        onlyLegalAction(action, data)
    {
        pendingActions.push(PendingAction(action, data, 1, false));
        confirmed[_msgSender()][pendingActions.length - 1] = true;
        emit NewPendingAction(pendingActions.length - 1, action, data);
    }

    function confirmAction(uint256 index)
        external
        onlyLegalActor(pendingActions[index].action, pendingActions[index].data)
        notConfirmed(index)
    {
        pendingActions[index].confirmations += 1;
        confirmed[_msgSender()][index] = true;
    }

    function executeAction(uint256 index) external notExecuted(index) {
        PendingAction storage pendingAction = pendingActions[index];
        Action action = pendingAction.action;
        uint8 confirmations = pendingAction.confirmations;
        bytes memory data = pendingAction.data;
        if (_isActionSuper(action)) {
            require(confirmations == superSignerCount, "Not enough confirmations");
            if (action == Action.AddSuperSigner) {
                address addr = abi.decode(data, (address));
                superSigners[addr] = true;
                superSignerCount += 1;
                emit SuperSigner(addr, true, block.timestamp);
            } else if (action == Action.RemoveSuperSigner) {
                address addr = abi.decode(data, (address));
                superSigners[addr] = false;
                superSignerCount -= 1;
                emit SuperSigner(addr, false, block.timestamp);
            } else {
                (uint24 school, address[] memory addrs) = abi.decode(data, (uint24, address[]));
                for (uint256 i = 0; i < addrs.length; i++) {
                    signers[addrs[i]] = school;
                    emit Signer(addrs[i], school, true, block.timestamp);
                }
                signerCount[school] = uint8(addrs.length);
            }
        } else {
            (uint24 school, address addr) = abi.decode(data, (uint24, address));
            require(confirmations == signerCount[school], "Not enough confirmations");
            if (action == Action.AddSigner) {
                signers[addr] = school;
                signerCount[school] += 1;
                emit Signer(addr, school, true, block.timestamp);
            } else {
                signers[addr] = uint24(0);
                signerCount[school] -= 1;
                emit Signer(addr, school, false, block.timestamp);
            }
        }
        pendingAction.executed = true;
        emit ActionExecuted(index);
    }

    function isSuperSigner(address addr) public view returns (bool) {
        return superSigners[addr];
    }

    function isSigner(address addr, uint24 school) public view returns (bool) {
        return school != uint24(0) && signers[addr] == school;
    }

    function _isActionSuper(Action action) internal pure returns (bool) {
        return uint256(action) < 3;
    }

    function _isActionLegal(Action action, bytes calldata data) internal view returns (bool) {
        if (action == Action.AddSuperSigner) {
            address addr = abi.decode(data, (address));
            return !isSuperSigner(addr);
        } else if (action == Action.RemoveSuperSigner) {
            address addr = abi.decode(data, (address));
            return isSuperSigner(addr);
        } else if (action == Action.InitSigner) {
            (uint24 school, address[] memory addrs) = abi.decode(data, (uint24, address[]));
            return signerCount[school] == 0 && addrs.length > 0;
        } else if (action == Action.AddSigner) {
            (uint24 school, address addr) = abi.decode(data, (uint24, address));
            return !isSigner(addr, school);
        } else {
            (uint24 school, address addr) = abi.decode(data, (uint24, address));
            return isSigner(addr, school);
        }
    }

    function _isActorLegal(
        address actor,
        Action action,
        bytes memory data
    ) internal view returns (bool) {
        if (_isActionSuper(action)) {
            return isSuperSigner(actor);
        } else {
            (uint24 school, address addr) = abi.decode(data, (uint24, address));
            return isSigner(actor, school) && addr != address(0);
        }
    }

    function _notConfirmed(address addr, uint256 index) internal view returns (bool) {
        return !confirmed[addr][index];
    }
}
