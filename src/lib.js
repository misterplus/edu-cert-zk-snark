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

function toBuffer(bigInt, len) {
    return bigInt instanceof BigInt ? ffjavascript.utils.leInt2Buff(bigInt, len) : ffjavascript.utils.leInt2Buff(BigInt(bigInt), len);
}

module.exports = {
    rbigint,
    pedersenHash,
    toBuffer
};