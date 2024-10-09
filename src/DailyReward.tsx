import React, { useEffect, useState } from 'react';
import './DailyReward.css';
import starIcon from './images/star.png'; // Make sure this path is correct
import { useUser } from './UserContext';  // Import the user context
import StartStore from './Starstore'; // Import StartStore component

interface DailyRewardProps {
    onClose: () => void;  // Define the type for the onClose prop
}

const DailyReward: React.FC<DailyRewardProps> = ({ onClose }) => {
    const { userID, setPoints } = useUser();
    const [rewardAmount, setRewardAmount] = useState<number>(0);
    const [showStartStore, setShowStartStore] = useState(false); // State to control StartStore visibility

    useEffect(() => {
        const claimDailyReward = async () => {
            try {
                const initData = window.Telegram.WebApp.initData || '';
                // Make a POST request to the endpoint
                const response = await fetch('https://api-dapp.gotem.io/gamer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Telegram-Init-Data': initData, // Add initData to headers
                    },
                    body: JSON.stringify({ GamerId: userID }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch gamer data');
                }

                const data = await response.json();
                const starmultiplier = data.data.starmultiplier || 1;

                const result = 1500 * starmultiplier;
                setRewardAmount(result);

                // Increase totalgot
                const increaseTotalgotResponse = await fetch('https://api-dapp.gotem.io/increase_totalgot', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Telegram-Init-Data': initData,
                    },
                    body: JSON.stringify({ UserId: userID, Amount: result }),
                });

                if (!increaseTotalgotResponse.ok) {
                    throw new Error('Failed to increase total gotEM');
                }

                const increaseTotalgotData = await increaseTotalgotResponse.json();

                // Update gamer
                const now = Math.floor(Date.now() / 1000);
                const updateGamerResponse = await fetch('https://api-dapp.gotem.io/update_gamer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Telegram-Init-Data': initData,
                    },
                    body: JSON.stringify({ GamerId: userID, startime: now }),
                });

                if (!updateGamerResponse.ok) {
                    throw new Error('Failed to update gamer start time');
                }

                // Update points in context
                setPoints(increaseTotalgotData.totalgot || result);

            } catch (error) {
                console.error('Error claiming daily reward:', error);
            }
        };

        claimDailyReward();
    }, [userID, setPoints]);

    return (
        <div className="daily-reward-container">
            <h1 className="title">Here is your star bonus, Captain</h1>
            <p className="subtitle">Rewarded on daily login</p>

            <div className="reward-amount-container">
                <span className="reward-amount">{rewardAmount}</span>
                <img src={starIcon} alt="Star" className="star-icon animate__animated animate__zoomInUp" />
            </div>

            <button className="increase-reward-btn" onClick={() => setShowStartStore(true)}>Increase Reward</button>
            <button className="continue-btn" onClick={onClose}>Continue</button>

            {showStartStore && (
                <StartStore onClose={() => setShowStartStore(false)} /> // Render StartStore when button is clicked
            )}
        </div>
    );
};

export default DailyReward;