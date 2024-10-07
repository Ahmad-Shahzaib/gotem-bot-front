import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UserProvider } from './UserContext';  // Import the UserProvider from UserContext
import { TonConnectUIProvider } from '@tonconnect/ui-react'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/nio809/Walletconnector/refs/heads/main/manifest.json"
    >

    <UserProvider>
      <App />
    </UserProvider>
    </TonConnectUIProvider>
  </React.StrictMode>,
);
