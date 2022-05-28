import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Submission from './routes/signer/Submission';
import Signing from './routes/signer/Signing';
import { default as SuperSigning } from './routes/superSigner/Signing';
import { default as SuperManagement } from './routes/superSigner/Management';
import Management from './routes/signer/Management';
import Proof from './routes/Proof';
import Blacklist from './routes/superSigner/Blacklist';
import App from './App';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import Verify from './routes/Verify';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Proof />}></Route>
          <Route path="signer">
            <Route path="submission" element={<Submission />}></Route>
            <Route path="signing" element={<Signing />}></Route>
            <Route path='management' element={<Management />}></Route>
          </Route>
          <Route path="superSigner">
            <Route path="signing" element={<SuperSigning />}></Route>
            <Route path="blacklist" element={<Blacklist />}></Route>
            <Route path="management" element={<SuperManagement />}></Route>
          </Route>
          <Route path="verify" element={<Verify />}></Route>
        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
