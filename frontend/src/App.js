import './App.css';
import Navbar from './components/Navbar';
import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import web3Config from './scripts/config';
const { abi, address } = require('./scripts/constant');
const ethers = require('ethers');

export default function App() {

  const [signerSchool, setSignerSchool] = useState(0);
  const [isSuperSigner, setIsSuperSigner] = useState(false);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  let signer, account;
  let contract = new ethers.Contract(address, abi, provider);

  useEffect(() => {
    if (web3Config.contract === null) {
      web3Config.contract = contract;
    }
  });

  const connect = async () => {
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    account = await signer.getAddress();

    contract = contract.connect(signer);
    web3Config.contract = contract;
    web3Config.account = account;

    setSignerSchool(await contract.signers(account));
    setIsSuperSigner(await contract.superSigners(account));
    web3Config.school = await contract.signers(account);
  }

  return (
    <div>
      <header>
        <Navbar signerSchool={signerSchool} isSuperSigner={isSuperSigner} connect={connect} />
      </header>
      <Outlet />
    </div>
  );
}
