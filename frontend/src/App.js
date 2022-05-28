import './App.css';
import Navbar from './components/Navbar';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import web3Config from './scripts/config';
const { abi, address } = require('./scripts/constant');
const ethers = require('ethers');

export default function App() {

  const [signerSchool, setSignerSchool] = useState(0);
  const [isSuperSigner, setIsSuperSigner] = useState(false);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  let signer, account;
  let contract = new ethers.Contract(address, abi, provider);

  const connect = async () => {
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    account = await signer.getAddress();

    contract = contract.connect(signer);
    web3Config.contract = contract;
    web3Config.account = account;
    Object.freeze(web3Config);
    setSignerSchool(await contract.signers(account));
    setIsSuperSigner(await contract.superSigners(account));
  }

  return (
    <div>
      <header>
        <Navbar signerSchool={true} isSuperSigner={true} connect={connect} />
      </header>
      <Outlet />
    </div>
  );
}
