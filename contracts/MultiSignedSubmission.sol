// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MultiSigner.sol";
import "./MerkleTreeWithHistory.sol";

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[4] memory input
    ) external view returns (bool r);
}

contract MultiSignedSubmission is MultiSigner, MerkleTreeWithHistory {
    enum State {
        Submitted,
        Signed,
        SuperSigned,
        Commited
    }

    struct Submission {
        bytes32[] commitments;
        uint24 school;
        uint8 confirmations;
        State state;
    }

    Submission[] public submissions;
    IVerifier verifier;
    mapping(address => mapping(uint256 => bool)) signedSubmissions;
    mapping(uint256 => bool) blacklisted;

    modifier notSigned(uint256 index) {
        require(_notSigned(_msgSender(), index), "Already signed");
        _;
    }

    modifier onlyInState(uint256 index, State state) {
        require(submissions[index].state == state, "State incorrect");
        _;
    }

    event Submitted(uint256 indexed index, bytes32[] commitments, uint24 indexed school);
    event Commited(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);

    constructor(
        address[] memory initialSigners,
        uint32 _levels,
        IHasher _hasher,
        IVerifier _verifier
    ) MultiSigner(initialSigners) MerkleTreeWithHistory(_levels, _hasher) {
        verifier = _verifier;
    }

    function encodeCommitment(
        uint64 id,
        uint24 school,
        uint8 major,
        uint8 degree,
        uint16 year
    ) external pure returns (bytes memory) {
        return abi.encodePacked(uint8(255), id, school, major, degree, year);
    }

    function submit(bytes32[] calldata commitments, uint24 school) external onlySigner(school) {
        submissions.push(Submission(commitments, school, 1, State.Submitted));
        signedSubmissions[_msgSender()][submissions.length - 1] = true;
        emit Submitted(submissions.length - 1, commitments, school);
    }

    function sign(uint256 index)
        external
        onlySigner(submissions[index].school)
        onlyInState(index, State.Submitted)
        notSigned(index)
    {
        signedSubmissions[_msgSender()][index] = true;
        submissions[index].confirmations += 1;
        if (submissions[index].confirmations == signerCount[submissions[index].school]) {
            submissions[index].state = State.Signed;
            submissions[index].confirmations = 0;
        }
    }

    function superSign(uint256 index) external onlySuperSigner onlyInState(index, State.Signed) notSigned(index) {
        signedSubmissions[_msgSender()][index] = true;
        submissions[index].confirmations += 1;
        if (submissions[index].confirmations == superSignerCount) {
            submissions[index].state = State.SuperSigned;
        }
    }

    function commit(uint256 index) external onlyInState(index, State.SuperSigned) {
        for (uint256 i = 0; i < submissions[index].commitments.length; i++) {
            emit Commited(
                submissions[index].commitments[i],
                _insert(submissions[index].commitments[i]),
                block.timestamp
            );
        }
        submissions[index].state = State.Commited;
    }

    function setBlacklist(uint256 profileHash, bool status) external onlySuperSigner {
        blacklisted[profileHash] = status;
    }

    function verify(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[4] memory input
    ) external view returns (bool) {
        require(verifier.verifyProof(a, b, c, input), "Proof invalid");
        return !blacklisted[input[0]];
    }

    function _notSigned(address addr, uint256 index) internal view returns (bool) {
        return !signedSubmissions[addr][index];
    }
}
