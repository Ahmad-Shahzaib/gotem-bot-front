import React, { useState, useEffect } from "react";
import { useUser } from "./UserContext";
import "./App.css";
import {
  binanceLogo,
  main,
  dailyCombo, // For the Ranking page icon
} from "./images";
import Friends from "./icons/Friends";
import Modal from "./Modal"; // Modal component for alerts
import Leaderboard from "./Leaderboard"; // Ranking page
import LoadingScreen from "./LoadingScreen"; // Loading screen
import OverlayPage from "./overlaypage"; // Overlay page component
import FriendsPage from "./Friends"; // Import FriendsPage for navigation
import { Toaster } from "react-hot-toast";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import telegramIcon from "./images/telegram.png"; // Task icons
import xIcon from "./images/x.png";
import dailyRewardIcon from "./images/daily-reward.png";
import doneIcon from "./images/done.png"; // Completed task icon
import ratLogo from "./images/main-character.png"; // Logo for tasks
import youtubeIcon from "./images/youtube.png";
import inviteFriendsIcon from "./images/gift.png";

declare const Telegram: any;

// Define the TaskItemProps interface
interface TaskItemProps {
  icon: string;
  title: string;
  reward: number;
  completed: boolean;
  onClick?: () => void;
}

// TaskItem component to render each task
const TaskItem: React.FC<TaskItemProps> = ({ icon, title, reward, onClick, completed }) => (
  <div
    onClick={!completed ? onClick : undefined}
    className={`flex items-center justify-between bg-[#1b1b1b] rounded-lg p-4 mb-4 ${
      !completed ? "hover:bg-[#242424] cursor-pointer" : "opacity-50 cursor-not-allowed"
    }`}
  >
    <div className="flex items-center">
      <img src={icon} alt={title} className="w-12 h-12 mr-4" />
      <div className="text-white">
        <div className="text-base font-semibold">{title}</div>
        <div className="flex items-center text-white">
          <img src={ratLogo} alt="RAT Logo" className="w-6 h-6 mr-2" />
          +{reward} gotEM
        </div>
      </div>
    </div>
    <div className="text-gray-400">
      {completed ? <img src={doneIcon} alt="Done" className="w-6 h-6" /> : "➤"}
    </div>
  </div>
);

// Main App Component
const App: React.FC = () => {
  const { points, setPoints, userID, setUserID, walletid, setWalletAddress } = useUser();
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [taskComplete, setTaskComplete] = useState<{ [key: string]: boolean }>({});
  const [lastClaimedTime, setLastClaimedTime] = useState<number | null>(null);
  const [refertotalStatus, setRefertotalStatus] = useState<string | null>("NULL");
  const [showOverlayPage, setShowOverlayPage] = useState(false); // Overlay page state
  const [loading, setLoading] = useState(true); // Loading state
  const [activePage, setActivePage] = useState("home");

  const closeModal = () => setModalMessage(null);
  const closeOverlay = () => setShowOverlayPage(false); // Close overlay

  const showAlert = (message: string) => {
    setModalMessage(message); // Show the modal with the message
  };

  // State to track the last saved points
  const [lastSavedPoints, setLastSavedPoints] = useState<number>(points);

  // Function to save points to the backend
  const savePoints = async () => {
    if (!userID) return;

    try {
      await fetch("https://api-dapp.gotem.io/update_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ UserId: userID, totalgot: points }),
      });
      console.log("Points saved:", points);
      setLastSavedPoints(points); // Update lastSavedPoints after saving
    } catch (error) {
      console.error("Failed to save points:", error);
    }
  };

  // Track every point increment and save points
  useEffect(() => {
    if (points !== lastSavedPoints) {
      savePoints(); // Save points to the backend after every point increment
    }
  }, [points, lastSavedPoints]);

  // TonConnect wallet status change listener
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        console.log("wallet info: ", wallet);
      }
    });
    return () => unsubscribe();
  }, [tonConnectUI]);

  // Set wallet address when address changes
  useEffect(() => {
    setWalletAddress(address);
  }, [address, setWalletAddress]);

  // Fetch user data and points
  useEffect(() => {
    Telegram.WebApp.ready();

    const initData = Telegram.WebApp.initDataUnsafe;
    const user = {
      username: initData.user?.username || "Default Username",
      userid: initData.user?.id || "1772",
      startparam: initData.start_param || "",
    };

    setUserID(user.userid); // Set the userID
    fetchOrAddUser(user.userid, user.startparam, user.username);
  }, [walletid]);

  const fetchOrAddUser = (userid: string, startparam: string, username: string) => {
    fetch(`https://api-dapp.gotem.io/get_user?UserId=${userid}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("User not found");
      })
      .then((data) => {
        loadPoints(userid); // Load points after user data is confirmed
        loadTaskStatus(data); // Load task completion statuses from API
      })
      .catch(() => {
        addUser(userid, startparam, username);
      });
  };

  const addUser = (userid: string, startparam: string, username: string) => {
    const invitedBy = !startparam || userid === startparam ? null : startparam;

    fetch("https://api-dapp.gotem.io/add_user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ UserId: userid, invitedby: invitedBy || undefined, Username: username }),
    })
      .then(() => {
        console.log("User added");
        setShowOverlayPage(true); // Show overlay page after adding the user
      })
      .catch((error) => {
        console.log("Error:", error.message);
      });
  };

  const loadPoints = async (userid: string) => {
    try {
      const response = await fetch(`https://api-dapp.gotem.io/get_user?UserId=${userid}`);
      const data = await response.json();
      if (data && data.data && data.data.totalgot !== undefined) {
        setPoints(data.data.totalgot); // Set the points from the backend
        localStorage.setItem(`points_${userID}`, data.data.totalgot); // Store points in localStorage
        setLastSavedPoints(data.data.totalgot); // Initialize lastSavedPoints
      }
    } catch (error) {
      console.error("Failed to load points:", error);
    }
  };

  const loadTaskStatus = (data: any) => {
    // Load task completion from backend
    const updatedTaskStatus = {
      YouTube: data.data.youtube === "Done",
      X: data.data.X === "Done",
      Telegram: data.data.telegram === "Done",
      Web3WagonTelegram: data.data.facebook === "Done",
      InviteFriends: data.data.Refertotal === "Done",
      DailyReward:
        !!data.data.dailyclaimedtime && Date.now() - data.data.dailyclaimedtime < 24 * 60 * 60 * 1000,
      lastClaimedTime: data.data.dailyclaimedtime,
      Refertotal: data.data.Refertotal,
      Transaction: data.data.Transaction === "Done",
      Web3WagonX: data.data.instagram === "Done",
    };

    setTaskComplete(updatedTaskStatus); // Set task status
    setLastClaimedTime(updatedTaskStatus.lastClaimedTime);
    setRefertotalStatus(updatedTaskStatus.Refertotal || "NULL");

    localStorage.setItem(`taskStatus_${userID}`, JSON.stringify(updatedTaskStatus)); // Store task status in local storage
  };

  const saveTaskCompletion = async (taskKey: string, column: string, reward: number) => {
    try {
      await fetch("https://api-dapp.gotem.io/update_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ UserId: userID, [column]: "Done" }),
      });

      setTaskComplete((prevState) => ({
        ...prevState,
        [taskKey]: true,
      }));

      // Update points and save task status
      setPoints((prevPoints) => prevPoints + reward);
      localStorage.setItem(
        `taskStatus_${userID}`,
        JSON.stringify({ ...taskComplete, [taskKey]: true })
      );
      // savePoints(); // Points will be saved via useEffect
      showAlert(`Thank you! You have earned ${reward} gotEM.`);
    } catch (error) {
      console.error(`Failed to complete task ${taskKey}:`, error);
      showAlert("An error occurred while completing the task. Please try again later.");
    }
  };

  const handleTaskClick = (taskKey: string, link: string, column: string, reward: number) => {
    window.open(link, "_blank");
    saveTaskCompletion(taskKey, column, reward);
  };

  const handleDailyRewardClick = async () => {
    const now = Date.now();
    if (lastClaimedTime && now - lastClaimedTime < 24 * 60 * 60 * 1000) {
      showAlert("You have already claimed your daily reward. Please come back later.");
      return;
    }

    try {
      await fetch("https://api-dapp.gotem.io/update_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ UserId: userID, dailyclaimedtime: now }),
      });

      setLastClaimedTime(now);
      setTaskComplete((prevState) => ({
        ...prevState,
        DailyReward: true,
      }));

      setPoints((prevPoints) => prevPoints + 120); // Reward for daily claim
      // savePoints(); // Points will be saved via useEffect
      showAlert("Congratulations! You have claimed your daily reward of 120 gotEM.");
    } catch (error) {
      console.error("Failed to claim daily reward:", error);
      showAlert("An error occurred while claiming your daily reward. Please try again later.");
    }
  };

  const handleInviteFriendsClick = async () => {
    if (refertotalStatus === "NULL" || !refertotalStatus) {
      showAlert("Not Enough Friends");
    } else if (refertotalStatus === "Approve") {
      try {
        await fetch("https://api-dapp.gotem.io/update_user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ UserId: userID, Refertotal: "Done" }),
        });

        setTaskComplete((prevState) => ({
          ...prevState,
          InviteFriends: true,
        }));

        setPoints((prevPoints) => prevPoints + 25000); // Reward points for inviting friends
        setRefertotalStatus("Done");
        // savePoints(); // Points will be saved via useEffect
        showAlert("Congratulations! You have completed the Invite 5 Friends task and earned 25000 gotEM.");
      } catch (error) {
        console.error("Failed to complete Invite Friends task:", error);
        showAlert("An error occurred while completing the task. Please try again later.");
      }
    }
  };

  // Task list rendering
  const renderTasks = () => (
    <>
      <TaskItem
        icon={telegramIcon}
        title="Join gotEM TG channel"
        reward={3000}
        completed={!!taskComplete["Telegram"]}
        onClick={() => handleTaskClick("Telegram", "https://t.me/gotEMXTon", "telegram", 3000)}
      />
      <TaskItem
        icon={telegramIcon}
        title="Join Web3Wagon Telegram Channel"
        reward={2000}
        completed={!!taskComplete["Web3WagonTelegram"]}
        onClick={() => handleTaskClick("Web3WagonTelegram", "https://t.me/Web3Wagon", "facebook", 2000)}
      />
      <TaskItem
        icon={dailyRewardIcon}
        title="Daily reward"
        reward={120}
        completed={!!taskComplete["DailyReward"]}
        onClick={handleDailyRewardClick}
      />
      <TaskItem
        icon={xIcon}
        title="Follow BEAR on X"
        reward={3000}
        completed={!!taskComplete["X"]}
        onClick={() => handleTaskClick("X", "https://x.com/gotEMXTon", "X", 3000)}
      />
      <TaskItem
        icon={xIcon}
        title="Follow Web3Wagon X account"
        reward={3000}
        completed={!!taskComplete["Web3WagonX"]}
        onClick={() => handleTaskClick("Web3WagonX", "https://x.com/Web3Wagon", "instagram", 3000)}
      />
      <TaskItem
        icon={youtubeIcon}
        title="Subscribe To gotEM YT"
        reward={2000}
        completed={!!taskComplete["YouTube"]}
        onClick={() => handleTaskClick("YouTube", "https://www.youtube.com/@gotEM_Ton", "youtube", 2000)}
      />
      <TaskItem
        icon={inviteFriendsIcon}
        title="Invite 5 friends"
        reward={25000}
        completed={!!taskComplete["InviteFriends"]}
        onClick={handleInviteFriendsClick}
      />
    </>
  );

  // Preload pages and show loading screen
  useEffect(() => {
    const preloadPages = async () => {
      await Promise.all([
        loadPoints(userID),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
      setLoading(false); // Hide loading screen after 5 seconds
    };
    preloadPages();
  }, [userID]);

  return (
    <div className="relative flex justify-center">
      {loading ? (
        <LoadingScreen /> // Show loading screen while fetching data
      ) : (
        <>
          <div className="absolute inset-0 bg-black"></div>
          <div className="relative pt-2 md:pt-14 w-full text-white h-screen font-bold flex flex-col max-w-xl">
            {activePage === "home" && (
              <>
                <div className="px-4 z-10">
                  {/* Gray box containing logo and points */}
                  <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 flex flex-col items-center">
                    <img src={main} alt="Token Logo" className="w-32 h-32" />
                    <p className="text-5xl mt-4">{points.toLocaleString()}</p>
                    <p className="text-lg">gotEM</p>

                    {/* Connect Wallet Button */}
                    <button
                      className="mt-4 bg-[#333333] bg-opacity-80 text-white px-8 py-3 text-lg rounded-full"
                      onClick={() => console.log("Connect Wallet")}
                    >
                      {walletid ? "Connected" : "Connect Wallet"}
                    </button>
                  </div>

                  {/* gotEM Tasks Heading */}
                  <div className="flex justify-start mt-6 px-4">
                    <div className="bg-[#2a2a2a] text-white px-4 py-2 rounded-full">
                      <h1 className="font-bold" style={{ fontSize: "17px" }}>
                        gotEM TASKS
                      </h1>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  <div className="mt-6">{renderTasks()}</div>

                  {/* Spacer to avoid cropping */}
                  <div className="h-24"></div>
                </div>
              </>
            )}

            {activePage === "friends" && <FriendsPage />} {/* Navigation to Friends Page */}
            {activePage === "leaderboard" && <Leaderboard />} {/* Navigation to Leaderboard Page */}
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl bg-black flex justify-around items-center z-50 rounded-3xl text-xs">
            <div
              className={`nav-item text-center text-[#c0c0c0] ${
                activePage === "home" ? "!bg-[#5D5D5D] text-black" : ""
              } w-1/5 m-1 p-2 rounded-2xl`}
              onClick={() => setActivePage("home")}
            >
              <img src={binanceLogo} alt="Home" className="w-8 h-8 mx-auto" />
              <p className="mt-1">Home</p>
            </div>

            <div
              className={`nav-item text-center text-[#c0c0c0] ${
                activePage === "friends" ? "!bg-[#5D5D5D] text-black" : ""
              } w-1/5 m-1 p-2 rounded-2xl`}
              onClick={() => setActivePage("friends")}
            >
              <Friends className="w-8 h-8 mx-auto" />
              <p className="mt-1">Friends</p>
            </div>

            <div
              className={`nav-item text-center text-[#c0c0c0] ${
                activePage === "leaderboard" ? "!bg-[#5D5D5D] text-black" : ""
              } w-1/5 m-1 p-2 rounded-2xl`}
              onClick={() => setActivePage("leaderboard")}
            >
              <img src={dailyCombo} alt="Ranking" className="w-8 h-8 mx-auto" />
              <p className="mt-1">Ranking</p>
            </div>
          </div>

          {/* Modal Component */}
          {modalMessage && <Modal message={modalMessage} onClose={closeModal} />}
          <Toaster />

          {/* OverlayPage Component */}
          {showOverlayPage && <OverlayPage closeOverlay={closeOverlay} />}
        </>
      )}
    </div>
  );
};

export default App;
