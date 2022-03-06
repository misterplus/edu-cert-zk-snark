pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/pedersen.circom";

// computes Pedersen(profile + secret)
template ProfileVerifier() {
    signal input profile;
    signal input secret;
    signal output commitment;

    component commitmentHasher = Pedersen(256);
    component profileBits = Num2Bits(128);
    component secretBits = Num2Bits(128);
    profileBits.in <== profile;
    secretBits.in <== secret;
    for (var i = 0; i < 128; i++) {
        commitmentHasher.in[i] <== profileBits.out[i];
        commitmentHasher.in[i + 128] <== secretBits.out[i];
    }

    commitment <== commitmentHasher.out[0];
}

component main {public [profile]} = ProfileVerifier();