import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext'; // Import UserContext

const LeaderboardPage: React.FC = () => {
  const { userID } = useUser(); // Access userID from UserContext

  const [ownRanking, setOwnRanking] = useState({
    username: '',
    totalgot: 0,
    position: 0,
  });

  const [leaderboardData, setLeaderboardData] = useState<Array<{ username: string; totalgot: number; position: number }>>([]);
  const [totalUsers, setTotalUsers] = useState('0');

  // Function to save data to localStorage
  const saveToLocalStorage = (key: string, value: any) => {
    const data = {
      value,
      timestamp: new Date().getTime(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Function to retrieve data from localStorage
  const getFromLocalStorage = (key: string, expiry: number = 5 * 60 * 1000) => {
    const dataString = localStorage.getItem(key);
    if (!dataString) return null;

    const data = JSON.parse(dataString);
    const now = new Date().getTime();

    // Check if data is not expired
    if (now - data.timestamp > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data.value;
  };

  useEffect(() => {
    // Load leaderboard data from localStorage if available
    const storedLeaderboardData = getFromLocalStorage('leaderboardData');
    const storedOwnRanking = getFromLocalStorage('ownRanking');
    const storedTotalUsers = getFromLocalStorage('totalUsers');

    if (storedLeaderboardData) {
      setLeaderboardData(storedLeaderboardData);
    }
    if (storedOwnRanking) {
      setOwnRanking(storedOwnRanking);
    }
    if (storedTotalUsers) {
      setTotalUsers(storedTotalUsers);
    }

    // Fetch latest leaderboard data from the server
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch(`https://api-dapp.gotem.io/get_user_ranking?UserId=${userID}`);
        const data = await response.json();

        if (data.requested_user) {
          const userRanking = {
            username: data.requested_user.username,
            totalgot: data.requested_user.totalgot,
            position: data.requested_user.position,
          };
          setOwnRanking(userRanking);
          saveToLocalStorage('ownRanking', userRanking);
        }

        if (data.top_users) {
          const formattedLeaderboardData = data.top_users.map((user: any) => ({
            username: user.username,
            totalgot: user.totalgot,
            position: user.rank,
          }));
          setLeaderboardData(formattedLeaderboardData);
          saveToLocalStorage('leaderboardData', formattedLeaderboardData);
        }

        if (data.total_users) {
          setTotalUsers(data.total_users);
          saveToLocalStorage('totalUsers', data.total_users);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchLeaderboardData();
  }, [userID]);

  return (
    <div className="relative inset-0 bg-black text-white z-10">
      <div className="flex flex-col items-center pt-[5%] h-[94vh] overflow-y-scroll">
        <h1 className="text-4xl font-bold mb-5">Leaderboard</h1>

        {ownRanking && (
          <div className="shadow-lg shadow-cyan-500/50 bg-gradient-to-r from-cyan-500 to-blue-500 w-11/12 md:w-8/12 lg:w-6/12 h-24 rounded-xl flex items-center justify-between px-6 py-4 mb-5">
            <div className="flex items-center">
              <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center text-black text-lg font-bold">
                {ownRanking.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4">
                <p className="font-bold text-xl">{ownRanking.username}</p>
                <p className="text-white text-base">{ownRanking.totalgot} gotEM</p>
              </div>
            </div>
            <p className="text-white text-base">#{ownRanking.position}</p>
          </div>
        )}

        <div className="w-11/12 md:w-8/12 lg:w-6/12 bg-gray-800 p-4 rounded-xl shadow-lg">
          <p className="text-xl font-bold mb-4">{totalUsers} total holders</p>
          {leaderboardData.map((user, index) => (
            <div key={index} className="flex items-center justify-between mb-3 p-2 bg-gray-700 rounded-full">
              <div className="flex items-center">
                <div className="bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center text-white text-lg font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <p className="font-bold text-sm">{user.username}</p>
                  <p className="text-gray-400 text-sm">{user.totalgot} gotEM</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">#{user.position}</p>
            </div>
          ))}
        </div>
        <div className="h-35"></div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
