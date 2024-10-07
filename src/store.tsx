import React, { useState } from 'react';
import './store.css'; // Importing store-specific CSS
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useUser } from './UserContext'; // Importing UserContext to get userID

// Importing images to use in the component
import speed1Image from './images/speed1.png';
import speed2Image from './images/speed2.png';
import multiplier1Image from './images/multiplier1.png';
import multiplier2Image from './images/multiplier2.png';

interface StoreProps {
  onBack: () => void;
}

const Store: React.FC<StoreProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('speed'); // State to manage active tab
  const [tonConnectUI] = useTonConnectUI(); // Getting TonConnect UI instance
  const { userID } = useUser(); // Getting user ID from UserContext

  // Function to switch between tabs
  const handleTabSwitch = (tab: string) => {
    setActiveTab(tab);
  };

  // Function to handle buy button click, triggering the TON transaction and API call
  const handleBuyClick = async (amount: string, transactionType: string) => {
    try {
      // Transaction object for TonConnect
      const transaction = {
        validUntil: Date.now() + 5 * 60 * 1000, // Transaction valid for 5 minutes
        messages: [
          {
            address: "UQCaqo5Ftdc8nKxsDGQtmy6DY5isgoQrJYhox0MqCNmN2AJ8", // Replace with the wallet address you want to send TON to
            amount: amount, // Amount in nanoTON (1 TON = 1e9 nanoTON)
          },
        ],
      };

      // Request transaction through TonConnect UI
      await tonConnectUI.sendTransaction(transaction);

      // Prepare API data based on the transaction type
      let apiData;
      switch (transactionType) {
        case 'speed1':
          apiData = { GamerId: userID, hookspeed: 2 }; // Buying speed upgrade 1
          break;
        case 'speed2':
          apiData = { GamerId: userID, hookspeed: 4 }; // Buying speed upgrade 2
          break;
        case 'multiplier1':
          apiData = { GamerId: userID, multiplier: 2 }; // Buying multiplier upgrade 1
          break;
        case 'multiplier2':
          apiData = { GamerId: userID, multiplier: 4 }; // Buying multiplier upgrade 2
          break;
        default:
          return;
      }
      const initData = window.Telegram.WebApp.initData || ''; // Get initData from Telegram WebApp

      // Make API call after successful transaction to update the gamer data
      await fetch('https://api-dapp.gotem.io/update_gamer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData, // Add initData to headers

        },
        body: JSON.stringify(apiData),
      });

      // Show success message
      showFuturisticMessageBox("Transaction successful! Item purchased.");
    } catch (error) {
      // Handle transaction failure
      console.error("Transaction failed: ", error);
      showFuturisticMessageBox("Transaction failed. Please try again.");
    }
  };

  // Function to display a message box on the screen
  const showFuturisticMessageBox = (message: string) => {
    const messageBox = document.createElement('div');
    messageBox.className = 'futuristic-message-box'; // Assigning class for styling
    messageBox.textContent = message; // Setting the message text
    document.body.appendChild(messageBox); // Adding message box to the DOM
    setTimeout(() => {
      messageBox.classList.add('visible'); // Make the message box visible with animation
    }, 10);
    setTimeout(() => {
      messageBox.classList.remove('visible'); // Hide the message box after 3 seconds
      setTimeout(() => {
        document.body.removeChild(messageBox); // Remove message box from the DOM
      }, 500);
    }, 3000);
  };

  return (
    <div className="store-container">
      <div className="navbar">
        {/* Back Button */}
        <button className="back-button" onClick={onBack}>
          ⬅️ Back
        </button>
        {/* Navbar Buttons for switching between Speed and Multiplier tabs */}
        <button className={`nav-button ${activeTab === 'speed' ? 'active' : ''}`} onClick={() => handleTabSwitch('speed')}>
          Speed
        </button>
        <button className={`nav-button ${activeTab === 'multiplier' ? 'active' : ''}`} onClick={() => handleTabSwitch('multiplier')}>
          Multiplier
        </button>
      </div>
      {/* Content Section for displaying items based on the active tab */}
      <div className="content">
        {activeTab === 'speed' && (
          <React.Fragment>
            {/* Speed Cards */}
            <div className="card">
              <img src={speed1Image} alt="Speed Option 1" />
              <p>Slow the hanging by 50%</p>
              <button onClick={() => handleBuyClick("100000000", "speed1")}> {/* Buying speed option 1 */}
                <span className="buy-text">Buy</span> for 0.1 TON only
              </button>
            </div>
            <div className="card">
              <img src={speed2Image} alt="Speed Option 2" />
              <p>Slow the hanging by 70% !</p>
              <button onClick={() => handleBuyClick("200000000", "speed2")}> {/* Buying speed option 2 */}
                <span className="buy-text">Buy</span> for 0.2 TON only
              </button>
            </div>
          </React.Fragment>
        )}
        {activeTab === 'multiplier' && (
          <React.Fragment>
            {/* Multiplier Cards */}
            <div className="card">
              <img src={multiplier1Image} alt="Multiplier Option 1" />
              <p>Get double the emGOT!</p>
              <button onClick={() => handleBuyClick("150000000", "multiplier1")}> {/* Buying multiplier option 1 */}
                <span className="buy-text">Buy</span> for 0.15 TON only
              </button>
            </div>
            <div className="card">
              <img src={multiplier2Image} alt="Multiplier Option 2" />
              <p>Get quadruple the emGOT!</p>
              <button onClick={() => handleBuyClick("300000000", "multiplier2")}> {/* Buying multiplier option 2 */}
                <span className="buy-text">Buy</span> for 0.3 TON only
              </button>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default Store;