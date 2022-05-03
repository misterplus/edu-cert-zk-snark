const { rbigint, pedersenHash, toBuffer } = require("../src/lib.js");
const { MerkleTree } = require('fixed-merkle-tree');
const circomlibjs = require('circomlibjs');
const fs = require('fs');
const snarkjs = require('snarkjs');

const MERKLE_TREE_HEIGHT = 20;
const DEFAULT_ZERO = 17870935602538782692476552055299689589933537678236710878293770434123048853704n

const MultiSignedSubmission = artifacts.require("MultiSignedSubmission");

contract("MultiSignedSubmission", accounts => {

    let mimcSponge;

    before(async () => {
        let mimc = await circomlibjs.buildMimcSponge();
        mimcSponge = (left, right) => mimc.F.toString(mimc.multiHash([left, right]), 10);
    });

    it("Math: zeros are correct", () => {
        let contract;
        let zeros = [
            '0x278297528E0489446FB78B4CF05099A2EF5FFF5B256E0B54D9761D62C75EA0C8',
            '0x2f8ce443cd53ba590ef204d2261b2a431601ae8ad56320aec23465bae156b655',
            '0x0d3d8e0ba091c77cf42d8f7d814fde5cad587c38d864011520fcceff603ba46f',
            '0x040be9499aaf2bb03424e47d0545cb039b7912b5119be4f465149431a0bde177',
            '0x1cdc739b33ce58a1ac8b0564e650ba4b5b34322b4c7c7bfae389d403d06a79a1',
            '0x149e176333a4a369224c26bb2ae9038d8be13590e6328b71725a0b856ca98897',
            '0x008713ee0292fbc4d666f267de42f52007f6a0c82823189771c7c8c5f309798b',
            '0x2d5616aa97de9d0c007236195be914f01b34f04530b5bfcc88a59401003b61c9',
            '0x19bbb4beb9f19185a742e4dea8a07cb83765cb44cad457a55e746db6bd401078',
            '0x1aabc8e35ac7bbdfc10d431b4995611c70f4a0cebac40b33d024746ff899d8ad',
            '0x2a9a68e86edf0778caa3357680277f64d7af27f8df89b6a5c678a8235e387bf9',
            '0x0601524ba16b79f512fd21a5a4666020b4dd793153601927c5a0a506566f3ed7',
            '0x0df2aa9b3b3a081d58ecf3dc482b180546c5c35cfb2f0608fc796307d0ded38c',
            '0x1d217b6b567da3e90b686dac06f02e990455736f994fc7aa894be4bdd1323d6e',
            '0x17cc760ab2b16fd91566eb22a1dd942f9223a4dc6ec6a6f21a915ad04deb98fa',
            '0x141d24459f51bdacec6f6fb9e6a9cbb5f1b6b8f4ccf083d441472d06066049dc',
            '0x2f82ed560771587e0aec8f977c5d31cee540ff43b035e6f3509280a9d56c0db5',
            '0x277c3446cb46d4f9690d16eb5231a8382a85cde3a531724a5ea367237a1d02c1',
            '0x040ef0834739cf226cabbbb7c42541f5928f61ee405b2b47c0f6a53170c8922d',
            '0x1488beca15edfd849195ba9f935595d5caea448f7d981ce39ad149988a379d75',
            '0x2f283d416edb19766b18169703c79b1b40269907b974dbfe6040f1161e423d60',
            '0x267ae64abbe0ed7edaefd1466cac66e7c9a2ff04815d725d5196ca0488ca2829',
            '0x22127c8746f816beac9af099e3de9c83c4342dc26a13d0aaa8885af500cb394f',
            '0x1e9ff002a4fb520782b01eb0d95a1a369704080f37c28a407d9eb5baccb7e906',
            '0x095aee0cca145adcabef1d13d45ab245b0c422b7ab41537ebf54d0edbdd6bf6e',
            '0x271ebb3b699c864a6c95b42e2d0b38f790de0b3115e57e593c6d6fff55ecb05e',
            '0x2c2702681efc2287639a629ea7a2cdb9fe07a1ecda9e2319a4f55b9a35f8d92c',
            '0x19f5bbc673f79a2631e8030520f8c9e687d62f7a866f11e80b265c76ffa7a657',
            '0x00c802da704f209cd0689b0824047e8828fadcd59ac2460b2c0e6e8465d76fd4',
            '0x0589832b99e764c98d2c36cead357f29dab842f6f09d6e56d6e933d1973de498',
            '0x1fa1dc10f62670f71aedf1f987a9903d7358437f22cf723107ce7a82ab9b09ec',
            '0x299e71a8c6785f265f2f741edc67a70cd2e0b7e0fb2215c6fa6935b3958309b1'
        ]

        return MultiSignedSubmission.deployed()
            .then(async instance => {
                contract = instance;
                for (let i = 0; i < 31; i++) {
                    assert.equal(
                        zeros[i + 1],
                        await contract.hashLeftRight.call(zeros[i], zeros[i]),
                        `zeros[${i + 1}] is not correct`
                    )
                }
            });
    });

    it("Logic: add super signer", () => {
        // add accounts[2] as a super signer
        let contract;
        return MultiSignedSubmission.deployed()
            .then(async instance => {
                contract = instance;

                let bool = await contract.superSigners.call(accounts[2]);
                assert.equal(bool, false, "initial super signers incorrect");

                let data = await contract.encodeSuperSigner.call(accounts[2]);
                return contract.startAction(0, data, { from: accounts[0] });
            })
            .then(() => {
                return contract.confirmAction(0, { from: accounts[1] });
            })
            .then(() => {
                return contract.executeAction(0, { from: accounts[2] });
            })
            .then(async () => {
                let bool = await contract.superSigners.call(accounts[2]);
                assert.equal(bool, true, "failed to add super signer");
            });
    });

    it("Logic: remove super signer", () => {
        let contract;
        return MultiSignedSubmission.deployed()
            .then(async instance => {
                contract = instance;

                let bool = await contract.superSigners.call(accounts[2]);
                assert.equal(bool, true, "super signer list incorrect");

                let data = await contract.encodeSuperSigner.call(accounts[2]);
                return contract.startAction(1, data, { from: accounts[0] });
            })
            .then(() => {
                return contract.confirmAction(1, { from: accounts[1] });
            })
            .then(() => {
                return contract.confirmAction(1, { from: accounts[2] });
            })
            .then(() => {
                return contract.executeAction(1, { from: accounts[2] });
            })
            .then(async () => {
                let bool = await contract.superSigners.call(accounts[2]);
                assert.equal(bool, false, "failed to remove super signer");
            });
    });

    it("Logic: init signers", () => {
        let contract;
        return MultiSignedSubmission.deployed()
            .then(async instance => {
                contract = instance;

                let school1 = await contract.signers.call(accounts[2]);
                let school2 = await contract.signers.call(accounts[3]);
                assert.equal(
                    school1, 0, "initial signers incorrect"
                );
                assert.equal(
                    school2, 0, "initial signers incorrect"
                );

                let data = await contract.encodeInitSigners.call(10000, [accounts[2], accounts[3]]);
                return contract.startAction(2, data, { from: accounts[0] });
            })
            .then(() => {
                return contract.confirmAction(2, { from: accounts[1] });
            })
            .then(() => {
                return contract.executeAction(2, { from: accounts[2] });
            })
            .then(async () => {
                let school1 = await contract.signers.call(accounts[2]);
                let school2 = await contract.signers.call(accounts[3]);
                assert.equal(
                    school1, 10000, "failed to init signers"
                );
                assert.equal(
                    school2, 10000, "failed to init signers"
                );
            });
    });

    it("Logic: add signer", () => {
        let contract;
        return MultiSignedSubmission.deployed()
            .then(async instance => {
                contract = instance;

                let school = await contract.signers.call(accounts[4]);
                assert.equal(
                    school, 0, "initial signers incorrect"
                );

                let data = await contract.encodeSigner.call(10000, accounts[4]);
                return contract.startAction(3, data, { from: accounts[2] });
            })
            .then(() => {
                return contract.confirmAction(3, { from: accounts[3] });
            })
            .then(() => {
                return contract.executeAction(3, { from: accounts[4] });
            })
            .then(async () => {
                let school = await contract.signers.call(accounts[4]);
                assert.equal(
                    school, 10000, "failed to add signer"
                );
            });
    });

    it("Logic: remove signer", () => {
        let contract;
        return MultiSignedSubmission.deployed()
            .then(async instance => {
                contract = instance;

                let school = await contract.signers.call(accounts[4]);
                assert.equal(
                    school, 10000, "initial signers incorrect"
                );

                let data = await contract.encodeSigner.call(10000, accounts[4]);
                return contract.startAction(4, data, { from: accounts[2] });
            })
            .then(() => {
                return contract.confirmAction(4, { from: accounts[3] });
            })
            .then(() => {
                return contract.confirmAction(4, { from: accounts[4] });
            })
            .then(() => {
                return contract.executeAction(4, { from: accounts[4] });
            })
            .then(async () => {
                let school = await contract.signers.call(accounts[4]);
                assert.equal(
                    school, 0, "failed to remove signer"
                );
            });
    });

    let logs;
    let p1, p2;
    let s1, s2;

    it("Logic: submit commitments", () => {
        let contract;
        return MultiSignedSubmission.deployed()
            .then(async instance => {
                contract = instance;

                p1 = await contract.encodeCommitment.call(
                    110101199003070492n,
                    10000,
                    36,
                    0,
                    2023
                );
                p2 = await contract.encodeCommitment.call(
                    110101199003074098n,
                    10000,
                    72,
                    1,
                    2023
                );
                s1 = rbigint(16);
                s2 = rbigint(16);
                let c1 = await pedersenHash(Buffer.concat(
                    [toBuffer(p1, 16), toBuffer(s1, 16)]
                ));
                let c2 = await pedersenHash(Buffer.concat(
                    [toBuffer(p2, 16), toBuffer(s2, 16)]
                ));
                return contract.submit([c1, c2], 10000, { from: accounts[2] });
            })
            .then(() => {
                return contract.sign(0, { from: accounts[3] });
            })
            .then(() => {
                return contract.superSign(0, { from: accounts[0] });
            })
            .then(() => {
                return contract.superSign(0, { from: accounts[1] });
            })
            .then(() => {
                return contract.commit(0, { from: accounts[4] });
            })
            .then(data => logs = data.logs);
    });

    it("Logic: verify commitment", () => {
        let contract;
        return MultiSignedSubmission.deployed()
            .then(async instance => {
                contract = instance;
                const leaves = logs
                    .sort((a, b) => a.args.leafIndex - b.args.leafIndex)
                    .map((e) => BigInt(e.args.commitment));
                const tree = new MerkleTree(MERKLE_TREE_HEIGHT, leaves, {
                    hashFunction: mimcSponge,
                    zeroElement: DEFAULT_ZERO
                });

                const path1 = tree.path(0);
                const path2 = tree.path(1);

                const vKey = JSON.parse(fs.readFileSync("./keys/certVerifier/verification_key.json"));

                const prove1 = await snarkjs.groth16.fullProve(
                    {
                        secret: s1,
                        pathElements: path1.pathElements,
                        pathIndices: path1.pathIndices,
                        root: path1.pathRoot,
                        profile: BigInt(p1),
                        timestamp: Date.now()
                    },
                    "./build/circuits/certVerifier_js/certVerifier.wasm",
                    "./keys/certVerifier/certVerifier_final.zkey"
                );
                const prove2 = await snarkjs.groth16.fullProve(
                    {
                        secret: s2,
                        pathElements: path2.pathElements,
                        pathIndices: path2.pathIndices,
                        root: path2.pathRoot,
                        profile: BigInt(p2),
                        timestamp: Date.now()
                    },
                    "./build/circuits/certVerifier_js/certVerifier.wasm",
                    "./keys/certVerifier/certVerifier_final.zkey"
                );

                const res1 = await snarkjs.groth16.verify(vKey, prove1.publicSignals, prove1.proof);
                const res2 = await snarkjs.groth16.verify(vKey, prove2.publicSignals, prove2.proof);
                assert.equal(res1, true, "failed to generate proof");
                assert.equal(res2, true, "failed to generate proof");
            })
    });
});