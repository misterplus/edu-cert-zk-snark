import { Link } from "react-router-dom";
import '../css/Navbar.css';

export default function Navbar(props) {
    return (
        <nav className="navbar">

            {props.signerSchool !== 0 && (
                <div>
                    <Link to="/signer/submission">信息提交</Link>
                    <Link to="/signer/signing">初审管理</Link>
                    <Link to="/signer/management">管理列表</Link>
                </div>
            )}

            {props.isSuperSigner && (
                <div>
                    <Link to="/superSigner/signing">复审管理</Link>
                    <Link to="/superSigner/blacklist">异常管理</Link>
                    <Link to="/superSigner/management">超管列表</Link>
                </div>
            )}

            <Link to="/">证书生成</Link>
            <Link to="/verify">证书鉴定</Link>

            <button className="button connect" onClick={props.connect}>管理登录</button>
        </nav>
    )
}