// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./MerkleTreeWithHistory.sol";

interface IVerifier {
  function verifyProof(bytes memory _proof, uint256[7] memory _input) external returns (bool);
}

contract EduCert is MerkleTreeWithHistory {

  struct Commitment {
    uint256 confirmations;
    bool confirmed;
    bool exists;
  }

  IVerifier public immutable verifier;

  mapping(bytes32 => bool) public blacklisted;
  mapping(bytes32 => Commitment) public commitments;
  mapping(address => bool) public signers;
  mapping(bytes32 => mapping(address => bool)) public isConfirmed;

  event Issued(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);

  modifier onlySigner {
    require(signers[msg.sender], "Not signer");
    _;
  }

  modifier notConfirmed(bytes32 _commitment) {
    require(!isConfirmed[_commitment][msg.sender], "Signer already confirmed");
    require(!commitments[_commitment].confirmed, "Commitment already confirmed");
    _;
  }

  modifier commitExists(bytes32 _commitment) {
    require(commitments[_commitment].exists, "Commitment does not exist");
    _;
  }

  /**
    @dev The constructor
    @param _verifier the address of SNARK verifier for this contract
    @param _hasher the address of MiMC hash contract
    @param _merkleTreeHeight the height of the Merkle Tree
  */
  constructor(
    IVerifier _verifier,
    IHasher _hasher,
    uint32 _merkleTreeHeight
  ) MerkleTreeWithHistory(_merkleTreeHeight, _hasher) {
    verifier = _verifier;
  }

  /**
    @dev Start the issuerance of a new certificate.
    @param _commitment the certificate commitment, which is PedersenHash(hashedCert + secret)
  */
  function startIssuerance(bytes32 _commitment) external {
    require(!commitments[_commitment].confirmed, "The commitment has been submitted");

    //uint32 insertedIndex = _insert(_commitment);
    commitments[_commitment].exists = true;

    //emit Issued(_commitment, insertedIndex, block.timestamp);
  }

  function confirmIssuerance(bytes32 _commitment) external onlySigner notConfirmed(_commitment) commitExists(_commitment) {
    commitments[_commitment].confirmations += 1;
    if (commitments[_commitment].confirmations > )
  }

  /**
    @dev Withdraw a deposit from the contract. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs
    `input` array consists of:
      - merkle root of all deposits in the contract
      - hash of unique deposit nullifier to prevent double spends
      - the recipient of funds
      - optional fee that goes to the transaction sender (usually a relay)
  */
  function verify(
    bytes calldata _proof,
    bytes32 _root,
    bytes32 _hashedCert,
    uint64 _id,
    uint16 _school,
    uint16 _major,
    uint8 _degree,
    uint256 _time
  ) external returns (string memory) {
    require(!blacklisted[_hashedCert], "The certificate is blacklisted");
    require(isKnownRoot(_root), "Cannot find your merkle root"); // Make sure to use a recent one
    require(keccak256(abi.encodePacked(_id, _school, _major, _degree, _time)) == _hashedCert, "Certificate does not match its hash");
    require(
      verifier.verifyProof(
        _proof,
        [uint256(_root), uint256(_hashedCert), uint256(_id), uint256(_school), uint256(_major), uint256(_degree), _time]
      ),
      "Invalid proof for certificate"
    );
    // todo: return json certificate
  }

  /** @dev whether a certificate is blacklisted */
  function isBlacklisted(bytes32 _hashedCert) public view returns (bool) {
    return blacklisted[_hashedCert];
  }
}
