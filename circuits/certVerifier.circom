pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/pedersen.circom";
include "merkleTree.circom";

// computes Pedersen(profile + secret)
template CommitmentHasher() {
    signal input profile;
    signal input secret;
    signal output commitment;
    signal output profileHash;

    component commitmentHasher = Pedersen(256);
    component profileHasher = Pedersen(128);
    component profileBits = Num2Bits(128);
    component secretBits = Num2Bits(128);
    profileBits.in <== profile;
    secretBits.in <== secret;
    for (var i = 0; i < 128; i++) {
        profileHasher.in[i] <== profileBits.out[i];
        commitmentHasher.in[i] <== profileBits.out[i];
        commitmentHasher.in[i + 128] <== secretBits.out[i];
    }

    commitment <== commitmentHasher.out[0];
    profileHash <== profileHasher.out[0];
}

// Verifies that commitment that corresponds to given secret and profile is included in the merkle tree of certificates
template CertVerifier(levels) {
    
    signal input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal input root;
    signal input profile;
    signal input profileHash;
    signal input timestamp; // not taking part in any computations

    component hasher = CommitmentHasher();
    hasher.profile <== profile;
    hasher.secret <== secret;
    profileHash === hasher.profileHash;

    component tree = MerkleTreeChecker(levels);
    tree.leaf <== hasher.commitment;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    signal timestampSquare;
    timestampSquare <== timestamp * timestamp;
}

component main {public [root, profile, profileHash, timestamp]} = CertVerifier(20);