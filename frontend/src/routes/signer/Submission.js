import Papa from 'papaparse';
import { useState } from 'react';
import web3Config from '../../scripts/config';
const { rbigint, pedersenHash, toBuffer, generateSolidityParams } = require('../../lib.js');

export default function Submission() {

    const [fileUploaded, setFileUploaded] = useState(false);
    let csvData;

    const onFileUploaded = (event) => {
        Papa.parse(event.target.files[0], {
            skipEmptyLines: true,
            complete: function (results) {
                csvData = results.data;
                setFileUploaded(true);
            }
        });
    };

    const generateCommitment = async () => {
        for (let i = 0; i < csvData.length; i++) {
            const profile = await web3Config.contract.encodeCommitment(
                csvData[i][0],
                csvData[i][1],
                csvData[i][2],
                csvData[i][3],
                csvData[i][4]
            );
            const secret = rbigint(16);
            const commitment = await pedersenHash(Buffer.concat(
                [toBuffer(profile, 16), toBuffer(secret, 16)]
            ));
            console.log(commitment);
        }

    }

    return (
        <main>
            <h3>上传学籍文件</h3>
            <input
                type="file"
                accept=".csv"
                onChange={onFileUploaded}
            />
            {fileUploaded && (
                <div>
                    <button onClick={generateCommitment}>生成无隐私学籍及密钥信息</button>
                </div>
            )}
        </main>
    )
}
