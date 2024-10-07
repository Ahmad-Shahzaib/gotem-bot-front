import React, { useState, useEffect } from 'react';
import './game.css'; // Import the scoped CSS file
import { useUser } from './UserContext'; // Import useUser to access UserContext
import Store from './store';

// Importing images for Play Now and Store buttons
import playNowGif from './images/main-loading.gif';
import storeImage from './images/game.png';

interface GameProps {
  onBack: () => void; // Prop for the back button function
}

const Game: React.FC<GameProps> = ({ onBack }) => {
  const { userID } = useUser(); // Getting userID from UserContext
  const [isGameStarted, setIsGameStarted] = useState(false); // State to track game started
  const [isStoreOpen, setIsStoreOpen] = useState(false); // State to track if store is open
  const [gameData, setGameData] = useState({ hookspeed: 1, multiplier: 1 }); // State to store game data

  // Create the URL by appending the userID as a path parameter
  const gameUrl = `http://game.gotem.io/?userID=${userID}`;

  // UseEffect to make an API call when component mounts
  useEffect(() => {
    // Fetch game data from the API
    const fetchGameData = async () => {
      // Get initData from Telegram WebApp
      const initData = window.Telegram?.WebApp?.initData || ''; 
    
      try {
        // Make a POST request to the endpoint
        const response = await fetch('https://api-dapp.gotem.io/gamer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': initData, // Add initData to headers
          },
          body: JSON.stringify({ GamerId: userID }),
        });
    
        // Check if the response status is okay
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        // Parse the response as JSON
        const result = await response.json();
    
        // Ensure that result.data exists and set game data accordingly
        if (result && result.data) {
          setGameData({
            hookspeed: result.data.hookspeed, // Default values if undefined
            multiplier: result.data.multiplier,
          });
        } else {
          console.warn('No game data found in the response');
        }
      } catch (error) {
        // Log any error that occurs during the fetch
        console.error('Error fetching game data:', error);
      }
    };
    
    fetchGameData();
  }, [userID]); // Dependency array includes userID to refetch if it changes

  // Handle clicking the Play Now button to start the game
  const handleStartGame = () => {
    setIsGameStarted(true);
  };

  // Handle clicking the Store button to open the Store
  const handleOpenStore = () => {
    setIsStoreOpen(true);
  };

  if (isStoreOpen) {
    return <Store onBack={onBack} />;
  }

  if (isGameStarted) {
    return (
      <div className="game-container">
        {/* Back Button */}
        <button className="back-button" onClick={onBack}>
          ⬅️
        </button>

        {/* Embedded Website */}
        <iframe
          src={gameUrl} // Use the URL with the appended userID
          title="Tower Maker Game"
          className="embedded-game"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Back Button */}
      <button className="back-button" onClick={onBack}>
        ⬅️
      </button>

      {/* Hookspeed and Multiplier Information Section */}
      <div className="game-info">
        <h2>You have</h2>
        <div className="info-cells">
          <div className="info-cell">Hookspeed (slower): {gameData.hookspeed}</div>
          <div className="info-cell">Multiplier: {gameData.multiplier}</div>
        </div>
        {gameData.hookspeed === 1 && gameData.multiplier === 1 && (
          <p>Go to store to buy it at the cheapest</p>
        )}
      </div>

      {/* Play Now GIF */}
      <div className="play-now-container" onClick={handleStartGame}>
        <img
          src={playNowGif} // Use imported play now gif
          alt="Play Now"
          className="play-now-gif"
        />
        <p className="play-now-label">Play Now</p>
      </div>

      {/* Store Image */}
      <div className="store-container" onClick={handleOpenStore}>
        <img
          src={storeImage} // Use imported store image
          alt="Store"
          className="store-image"
        />
        <p className="store-label">Store</p>
      </div>
    </div>
  );
};

export default Game;