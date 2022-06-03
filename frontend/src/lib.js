import { utils } from 'ffjavascript';
import { buildBabyjub, buildPedersenHash } from 'circomlibjs';
const crypto = require('crypto');

const rbigint = nbytes => {
    return utils.leBuff2int(crypto.randomBytes(nbytes));
};

const pedersenHash = async (data) => {
    const babyJub = await buildBabyjub();
    const F = babyJub.F;
    const pedersen = await buildPedersenHash();
    return toHex(F.toObject(babyJub.unpackPoint(pedersen.hash(data))[0]));
}

function toHex(number, length = 32) {
    const str = number instanceof Buffer ? number.toString('hex') : BigInt(number).toString(16)
    return '0x' + str.padStart(length * 2, '0')
}

function toBuffer(bigInt, len) {
    return bigInt instanceof BigInt ? utils.leInt2Buff(bigInt, len) : utils.leInt2Buff(BigInt(bigInt), len);
}

const generateSolidityParams = (proof, pub) => {
    return JSON.stringify([
        [toHex(proof.pi_a[0]), toHex(proof.pi_a[1])],
        [[toHex(proof.pi_b[0][1]), toHex(proof.pi_b[0][0])], [toHex(proof.pi_b[1][1]), toHex(proof.pi_b[1][0])]],
        [toHex(proof.pi_c[0]), toHex(proof.pi_c[1])],
        pub.map(e => toHex(e))
    ])
};

export {
    rbigint,
    pedersenHash,
    toBuffer,
    generateSolidityParams
}