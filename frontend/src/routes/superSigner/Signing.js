import web3Config from "../../scripts/config"
import { useState } from "react";

export default function Signing() {

    const [rowData, setRowData] = useState([]);
    const [useFallback, setUseFallback] = useState(false);

    const stateText = ["已提交", "初审完成", "复审完成", "已归档"];

    const sign = (index) => {
        web3Config.contract.superSign(index).then(() => {
            alert('确认成功！');
        });
    }

    const commit = (index) => {
        web3Config.contract.commit(index).then(() => {
            alert('上链成功！');
        });
    }

    const tableRows = rowData.map((row, index) => {
        return (
            ((row[0].state === 1 && row[2]) ||
                row[0].state === 2) && (
                <tr key={index}>
                    <td>{index}</td>
                    <td>{row[0].school}</td>
                    <td>{row[0].confirmations}</td>
                    <td>{stateText[row[0].state]}</td>
                    <td>{`${row[1][0]}...`}</td>
                    <td><button onClick={() => { sign(index); }}>确认</button></td>
                    <td><button onClick={() => { commit(index); }}>上链</button></td>
                </tr>
            )
        );
    });

    const fallbackRow = (
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td>已全部确认！</td>
        </tr>
    )

    const initTable = async () => {
        setUseFallback(false);
        const len = await web3Config.contract.totalSubmissions();
        const promises = []
        for (let i = 0; i < len; i++) {
            promises.push(web3Config.contract.submissions(i));
        }
        Promise.all(promises).then(async (submissions) => {
            const commitments = [];
            const signs = [];
            for (let i = 0; i < submissions.length; i++) {
                const tx = await web3Config.contract.queryFilter(web3Config.contract.filters.Submitted(i));
                const signed = await web3Config.contract.indexNotSigned(web3Config.account, i);
                commitments.push(tx[0].args.commitments);
                signs.push(signed);
            }
            let data = [];
            for (let i = 0; i < submissions.length; i++) {
                data.push([submissions[i], commitments[i], signs[i]]);
            }
            setRowData(data);
            setUseFallback(document.querySelector('#table').childElementCount === 0);
        });
    }

    return (
        <main>
            <h3>复审中的学籍提交记录</h3>
            <button onClick={initTable}>刷新列表</button>
            <table>
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>高校编号</th>
                        <th>确认数</th>
                        <th>状态</th>
                        <th>学籍信息</th>
                        <th>确认提交</th>
                    </tr>
                </thead>
                <tbody id="table">
                    {tableRows}
                    {useFallback && fallbackRow}
                </tbody>
            </table>
        </main>
    )
}