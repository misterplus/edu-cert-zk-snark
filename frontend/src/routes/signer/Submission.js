import Papa from 'papaparse';
import { useState } from 'react';
import web3Config from '../../scripts/config';
const { rbigint, pedersenHash, toBuffer } = require('../../lib.js');

export default function Submission() {

    const [fileUploaded, setFileUploaded] = useState(false);
    const [csvData, setCsvData] = useState([]);
    const [commitments, setCommitments] = useState([]);

    const onFileUploaded = (event) => {
        Papa.parse(event.target.files[0], {
            skipEmptyLines: true,
            complete: function (results) {
                setCsvData(results.data);
                setFileUploaded(true);
            }
        });
    };

    const generateCommitments = async () => {
        const tuples = await Promise.all(csvData.map(async (row) => {
            const profile = await web3Config.contract.encodeCommitment(
                row[0],
                row[1],
                row[2],
                row[3],
                row[4]
            );
            console.log(profile);
            const secret = rbigint(16);
            return `${secret},${await pedersenHash(Buffer.concat(
                [toBuffer(profile, 16), toBuffer(secret, 16)]
            ))}`;
        }));
        setCommitments(tuples.map(e => e.split(',')[1]));

        const data = new Blob([tuples.map(e => e.split(',')[0])], { type: 'text/csv' });
        const csvURL = window.URL.createObjectURL(data);
        let tempLink = document.createElement('a');
        tempLink.href = csvURL;
        tempLink.setAttribute('download', 'Secrets.csv');
        tempLink.click();
    }

    const commitOnChain = async () => {
        const school = await web3Config.contract.signers(web3Config.account);
        web3Config.contract.submit(commitments, school).then(() => {
            alert("提交成功！");
        });
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
                    <button onClick={generateCommitments}>生成无隐私学籍及密钥信息</button>
                </div>
            )}
            {commitments.length > 0 && (
                <div>
                    <button onClick={commitOnChain}>提交学籍信息到智能合约</button>
                </div>
            )}
        </main>
    )
}
