/* eslint no-eval: 0 */
import { useState } from "react";
import web3Config from "../scripts/config";
import Info from "../components/Info";

export default function Verify() {

    const [cert, setCert] = useState(null);
    const [valid, setValid] = useState(false);
    const [showValidity, setShowValidity] = useState(false);
    const [info, setInfo] = useState({
        id: 0,
        school: 0,
        major: 0,
        degree: 0,
        year: 0,
        timestamp: 0
    });

    const onFileUploaded = (event) => {
        const fileReader = new FileReader();
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = e => {
            setCert(eval(e.target.result));
            setShowValidity(false);
        };
    };

    const verify = async () => {
        setShowValidity(true);
        const valid = await web3Config.contract.verify(...cert);
        if (valid) {
            const profile = cert[3][2].replace(/^0x0+ff/, "");
            const info = {
                id: null,
                school: null,
                major: null,
                degree: null,
                year: null,
                timestamp: null
            };
            info.id = parseInt(profile.substring(0, 16), 16);
            info.school = parseInt(profile.substring(16, 22), 16);
            info.major = parseInt(profile.substring(22, 24), 16);
            info.degree = parseInt(profile.substring(24, 26), 16);
            info.year = parseInt(profile.substring(26, 30), 16);
            info.timestamp = new Date(parseInt(cert[3][3], 16)).toUTCString();
            setInfo(info);
        } else {
            setInfo({
                id: 0,
                school: 0,
                major: 0,
                degree: 0,
                year: 0,
                timestamp: 0
            });
        }
        setValid(valid);
    }

    return (
        <main>
            <h3>电子学籍证书鉴定</h3>
            <input
                type="file"
                accept=".cert"
                onChange={onFileUploaded}
            />
            <br />
            <button onClick={verify}>鉴定证书</button>
            {valid && (
                <div>
                    <p>证书有效</p>
                    <Info info={info} />
                </div>
            )}
            {!valid &&
                showValidity && (
                    <p>证书无效</p>
                )}
        </main>
    )
}