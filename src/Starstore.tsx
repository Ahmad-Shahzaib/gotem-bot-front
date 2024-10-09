import React, { useState } from 'react';
import './smallstore.css'; // Include your CSS file for custom styling
import { IoArrowBackSharp } from 'react-icons/io5'; // Importing back arrow icon
import rewardImage from './images/multiplier1.png'; // Ensure the image path is correct
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react'; // Import TON UI
import { useUser } from './UserContext'; // Import user context to get userID

interface StartStoreProps {
    onClose: () => void; // Function to close the store
}

const StartStore: React.FC<StartStoreProps> = ({ onClose }) => {
    const [tonConnectUI] = useTonConnectUI(); // Getting TonConnect UI instance
    const tonAddress = useTonAddress(); // Getting TON address
    const { userID } = useUser(); // Getting user ID from UserContext

    // State to manage showing a cute message box
    const [message, setMessage] = useState<string | null>(null);

    // Function to handle the buy button click, trigger TON transaction
    const handleBuyClick = async () => {
        try {
            // Check if wallet is connected
            if (!tonAddress) {
                // If not connected, prompt user to connect wallet
                tonConnectUI.connectWallet(); // Use the connectWallet method from TonConnectUI
                setMessage("Wallet connected. Please proceed with the payment.");
                return;
            }

            // Transaction object for TonConnect
            const transaction = {
                validUntil: Date.now() + 5 * 60 * 1000, // Transaction valid for 5 minutes
                messages: [
                    {
                        address: "UQCaqo5Ftdc8nKxsDGQtmy6DY5isgoQrJYhox0MqCNmN2AJ8", // Replace with the wallet address to send TON to
                        amount: "200000000", // Amount in nanoTON (0.2 TON = 200000000 nanoTON)
                    },
                ],
            };

            // Request transaction through TonConnect UI
            await tonConnectUI.sendTransaction(transaction);

            // Make API call after successful transaction to update the gamer data
            const initData = window.Telegram.WebApp.initData || '';
            await fetch('https://api-dapp.gotem.io/update_gamer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': initData,
                },
                body: JSON.stringify({ GamerId: userID, starmultiplier: 2 }),
            });

            // Close the store and show success message
            onClose();
            setMessage("Please come back tomorrow, we will have your reward ready!");
        } catch (error) {
            // Handle transaction failure
            console.error("Transaction failed: ", error);
            setMessage("Please try again, captain!");
        }
    };

    return (
        <div className="start-store-overlay">
            <div className="start-store-container">
                <div className="start-store-header">
                    <IoArrowBackSharp className="back-arrow" onClick={onClose} />
                    <h2 className="store-title">Increase the star reward with small TON</h2>
                </div>

                <div className="reward-card">
                    <img src={rewardImage} alt="2x Reward" className="reward-image" />
                    <p className="reward-text">2X reward only for 0.2 TON</p>
                    <button className="buy-button" onClick={handleBuyClick}>Buy Now</button>
                </div>

                {message && (
                    <div className="message-box">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StartStore;