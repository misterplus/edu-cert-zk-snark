const crypto = require('crypto');
const circomlibjs = require('circomlibjs');
const ffjavascript = require('ffjavascript');

const rbigint = nbytes => ffjavascript.utils.leBuff2int(crypto.randomBytes(nbytes));

const pedersenHash = async (data) => {
    const babyJub = await circomlibjs.buildBabyjub();
    const F = babyJub.F;
    const pedersen = await circomlibjs.buildPedersenHash();
    return toHex(F.toObject(babyJub.unpackPoint(pedersen.hash(data))[0]));
}

function toHex(number, length = 32) {
    const str = number instanceof Buffer ? number.toString('hex') : BigInt(number).toString(16)
    return '0x' + str.padStart(length * 2, '0')
}

function toBuffer(bigInt, len) {
    return bigInt instanceof BigInt ? ffjavascript.utils.leInt2Buff(bigInt, len) : ffjavascript.utils.leInt2Buff(BigInt(bigInt), len);
}

const generateSolidityParams = (proof, pub) => {
    return [
        [toHex(proof.pi_a[0]), toHex(proof.pi_a[1])],
        [[toHex(proof.pi_b[0][1]), toHex(proof.pi_b[0][0])], [toHex(proof.pi_b[1][1]), toHex(proof.pi_b[1][0])]],
        [toHex(proof.pi_c[0]), toHex(proof.pi_c[1])],
        pub.map(e => toHex(e))
    ]
};

module.exports = {
    rbigint,
    pedersenHash,
    toBuffer,
    generateSolidityParams
};