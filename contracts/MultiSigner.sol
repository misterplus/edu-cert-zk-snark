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

    event NewPendingAction(uint256 indexed index, Action indexed action, bytes indexed data);
    event ActionExecuted(uint256 indexed index);

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

    constructor(address[] memory initialSigners) {
        for (uint256 i = 0; i < initialSigners.length; i++) {
            superSigners[initialSigners[i]] = true;
        }
        superSignerCount = uint8(initialSigners.length);
    }

    function startAction(Action action, bytes calldata data) external {
        if (_isActionSuper(action)) {
            require(isSuperSigner(_msgSender()), "Not super signer");
        } else {
            require(isSigner(_msgSender(), abi.decode(data[0:3], (uint24))), "Not signer");
        }
        require(_isActionLegal(action, data), "Action not legal");
        pendingActions.push(PendingAction(action, data, 1, false));
        confirmed[_msgSender()][pendingActions.length - 1] = true;
        emit NewPendingAction(pendingActions.length - 1, action, data);
    }

    function confirmAction(uint256 index) external {
        PendingAction storage pendingAction = pendingActions[index];
        if (_isActionSuper(pendingAction.action)) {
            require(isSuperSigner(_msgSender()), "Not super signer");
        } else {
            bytes memory data = pendingAction.data;
            (uint24 school, address addr) = abi.decode(data, (uint24, address));
            require(isSigner(_msgSender(), school), "Not signer");
        }
        require(_notConfirmed(_msgSender(), index), "Already confirmed");
        pendingAction.confirmations += 1;
        confirmed[_msgSender()][index] = true;
    }

    function executeAction(uint256 index) external {
        PendingAction storage pendingAction = pendingActions[index];
        require(!pendingAction.executed, "Already executed");
        Action action = pendingAction.action;
        uint8 confirmations = pendingAction.confirmations;
        bytes memory data = pendingAction.data;
        if (_isActionSuper(action)) {
            require(confirmations == superSignerCount, "Not enough confirmations");
            if (action == Action.AddSuperSigner) {
                address addr = abi.decode(data, (address));
                superSigners[addr] = true;
                superSignerCount += 1;
            } else if (action == Action.RemoveSuperSigner) {
                address addr = abi.decode(data, (address));
                superSigners[addr] = false;
                superSignerCount -= 1;
            } else {
                (uint24 school, address[] memory addrs) = abi.decode(data, (uint24, address[]));
                for (uint256 i = 0; i < addrs.length; i++) {
                    signers[addrs[i]] = school;
                }
                signerCount[school] = uint8(addrs.length);
            }
        } else {
            (uint24 school, address addr) = abi.decode(data, (uint24, address));
            require(confirmations == signerCount[school], "Not enough confirmations");
            if (action == Action.AddSigner) {
                signers[addr] = school;
                signerCount[school] += 1;
            } else {
                signers[addr] = uint24(0);
                signerCount[school] -= 1;
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
            uint24 school = abi.decode(data[0:3], (uint24));
            return signerCount[school] == 0;
        } else if (action == Action.AddSigner) {
            (uint24 school, address addr) = abi.decode(data, (uint24, address));
            return !isSigner(addr, school);
        } else {
            (uint24 school, address addr) = abi.decode(data, (uint24, address));
            return isSigner(addr, school);
        }
    }

    function _notConfirmed(address addr, uint256 index) internal view returns (bool) {
        return !confirmed[addr][index];
    }
}
