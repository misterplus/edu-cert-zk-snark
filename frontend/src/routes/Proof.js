import web3Config from "../scripts/config";
import MerkleTree from "fixed-merkle-tree";
import { buildMimcSponge } from "circomlibjs";
import { groth16 } from "snarkjs";
import { generateSolidityParams } from "../lib.js";
const { pedersenHash, toBuffer } = require('../lib.js');

export default function Proof() {


    const generateProof = async (event) => {
        event.preventDefault();
        const profile = await web3Config.contract.encodeCommitment(
            event.target[0].value,
            event.target[1].value,
            event.target[2].value,
            event.target[3].value,
            event.target[4].value
        );
        console.log(profile);
        const commitment = await pedersenHash(Buffer.concat(
            [toBuffer(profile, 16), toBuffer(event.target[5].value, 16)]
        ));
        const logs = await web3Config.contract.queryFilter(web3Config.contract.filters.Commited());
        const f = logs.filter((e) => e.args.commitment === commitment);
        if (f.length !== 1) {
            alert('输入的信息有误！');
            return;
        }
        const index = f[0].args.leafIndex;
        const leaves = logs
            .sort((a, b) => a.args.leafIndex - b.args.leafIndex)
            .map((e) => BigInt(e.args.commitment));
        const mimc = await buildMimcSponge();
        const mimcSponge = (left, right) => mimc.F.toString(mimc.multiHash([left, right]), 10);
        const tree = new MerkleTree(20, leaves, {
            hashFunction: mimcSponge,
            zeroElement: 17870935602538782692476552055299689589933537678236710878293770434123048853704n
        });

        const path = tree.path(index);
        const time = BigInt(Date.now());

        const { proof, publicSignals } = await groth16.fullProve(
            {
                secret: event.target[5].value,
                pathElements: path.pathElements,
                pathIndices: path.pathIndices,
                root: path.pathRoot,
                profile: BigInt(profile),
                timestamp: time
            },
            "circuits/certVerifier.wasm",
            "circuits/certVerifier_final.zkey"
        );

        const calldata = generateSolidityParams(proof, publicSignals);
        const data = new Blob([calldata], { type: 'text' });
        const jsonURL = window.URL.createObjectURL(data);
        let tempLink = document.createElement('a');
        tempLink.href = jsonURL;
        tempLink.setAttribute('download', 'Certificate.cert');
        tempLink.click();
    }


    return (
        <main>
            <h3>自助生成电子学籍证书</h3>
            <form onSubmit={generateProof}>
                <label>身份证号：</label>
                <input type="number"></input>
                <br />
                <label>高校代码：</label>
                <input type="number"></input>
                <br />
                <label>专业编号：</label>
                <input type="number"></input>
                <br />
                <label>学历等级：</label>
                <input type="number"></input>
                <br />
                <label type="number">毕业年份：</label>
                <input></input>
                <br />
                <label>证书密钥：</label>
                <input type="password"></input>
                <br />
                <button type="submit">生成电子证书</button>
            </form>
        </main>
    )
}