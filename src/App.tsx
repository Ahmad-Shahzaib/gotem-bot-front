import React, { useState, useEffect } from "react";
import { useUser } from "./UserContext";
import "./App.css";
import {
  binanceLogo,
  main,
  dailyCombo,
} from "./images";
import Friends from "./icons/Friends";
import Modal from "./Modal";
import Leaderboard from "./Leaderboard";
import Game from './game';
import LoadingScreen from "./LoadingScreen";
import OverlayPage from "./overlaypage";
import FriendsPage from "./Friends";
import { Toaster } from "react-hot-toast";
import {
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import telegramIcon from "./images/telegram.png";
import xIcon from "./images/x.png";
import dailyRewardIcon from "./images/daily-reward.png";
import doneIcon from "./images/done.png";
import ratLogo from "./images/main-character.png";
import youtubeIcon from "./images/youtube.png";
import inviteFriendsIcon from "./images/gift.png";

declare const Telegram: any;

interface TaskItemProps {
  icon: string;
  title: string;
  reward: number;
  status: "not_started" | "loading" | "claimable" | "completed";
  onClick?: () => void;
  onClaim?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  icon,
  title,
  reward,
  onClick,
  onClaim,
  status,
}) => {
  return (
    <div
      onClick={status === "not_started" ? onClick : undefined}
      className={`flex items-center justify-between bg-[#1b1b1b] rounded-full p-4 mb-2 ${
        status === "not_started" ? "hover:bg-[#242424] cursor-pointer" : ""
      } ${status === "completed" ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-center">
        <img src={icon} alt={title} className="w-8 h-8 mr-3" />
        <div className="text-white">
          {/* Title with smaller and bolder styling */}
          <div className="font-bold" style={{ fontSize: "0.875rem" }}>{title}</div> {/* Smaller than text-base */}
          <div className="flex items-center" style={{ fontSize: "0.75rem" }}>
            <img src={ratLogo} alt="RAT Logo" className="w-6 h-6 mr-0" />
            +{reward} gotEM
          </div>
        </div>
      </div>
      <div className="text-gray-400">
        {status === "completed" && (
          <img src={doneIcon} alt="Done" className="w-6 h-6" />
        )}
        {status === "loading" && (
          <div className="loader"></div>
        )}
        {status === "claimable" && (
          <button
            onClick={onClaim}
            className="bg-green-500 text-white px-4 py-2 rounded-full"
          >
            Claim
          </button>
        )}
        {status === "not_started" && "➤"}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const {
    points,
    setPoints,
    userID,
    setUserID,
    walletid,
    setWalletAddress,
  } = useUser();
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<{
    [key: string]: "not_started" | "loading" | "claimable" | "completed";
  }>({});
  const [lastClaimedTime, setLastClaimedTime] = useState<number | null>(null);
  const [refertotalStatus, setRefertotalStatus] = useState<string | null>(
    "NULL"
  );
  const [showOverlayPage, setShowOverlayPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("home");
  const [userAdded, setUserAdded] = useState(false);


  const closeModal = () => setModalMessage(null);
  const closeOverlay = () => setShowOverlayPage(false);

  const showAlert = (message: string) => {
    setModalMessage(message);
  };

  const [lastSavedPoints, setLastSavedPoints] = useState<number>(points);

  const savePoints = async () => {
    if (!userID) return;
    const initData = window.Telegram.WebApp.initData || ''; // Get initData from Telegram WebApp


    try {
      await fetch("https://api-dapp.gotem.io/update_user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-Telegram-Init-Data': initData, // Add initData to headers
        },
        body: JSON.stringify({ UserId: userID, totalgot: points }),
      });
      console.log("Points saved:", points);
      setLastSavedPoints(points);
    } catch (error) {
      console.error("Failed to save points:", error);
    }
  };

  useEffect(() => {
    if (points !== lastSavedPoints) {
      savePoints();
    }
  }, [points, lastSavedPoints]);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        console.log("wallet info: ", wallet);
      }
    });
    return () => unsubscribe();
  }, [tonConnectUI]);

  useEffect(() => {
    setWalletAddress(address);
  }, [address, setWalletAddress]);

  useEffect(() => {
    Telegram.WebApp.ready();

    const initDataUnsafe = Telegram.WebApp.initDataUnsafe;
    const user = {
      username: initDataUnsafe.user?.username || "Default Username",
      userid: initDataUnsafe.user?.id || "1989734040",
      startparam: initDataUnsafe.start_param || "",
    };

    setUserID(user.userid);
    fetchOrAddUser(user.userid, user.startparam, user.username);
  }, [walletid]);

  const fetchOrAddUser = async (
    userid: string,
    startparam: string,
    username: string
  ) => {
    try {
      const initData = window.Telegram.WebApp.initData || ''; // Get initData from Telegram WebApp

      const response = await fetch(
        
        `https://api-dapp.gotem.io/get_user?UserId=${userid}`,
        {
          headers: {
            'X-Telegram-Init-Data': initData, // Add initData to headers
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        await loadPoints(userid);
        loadTaskStatus(data);
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      // User not found, add the user
      await addUser(userid, startparam, username);
    }
  };

  const addUser = async (
    userid: string,
    startparam: string,
    username: string
  ) => {
    const invitedBy = !startparam || userid === startparam ? null : startparam;
    const initData = window.Telegram.WebApp.initData || ''; // Get initData from Telegram WebApp

    try {
      await fetch("https://api-dapp.gotem.io/add_user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-Telegram-Init-Data': initData, // Add initData to headers
        },
        body: JSON.stringify({
          UserId: userid,
          invitedby: invitedBy || undefined,
          Username: username,
        }),
      });
      console.log("User added");
      setUserAdded(true); // Indicate that the user has been added
      setShowOverlayPage(true);
    } catch (error) {
      console.log("Error:");
    }
  };

  const loadPoints = async (userid: string) => {        
    const initData = window.Telegram.WebApp.initData || ''; // Get initData from Telegram WebApp

    
    try {
      const response = await fetch(
        `https://api-dapp.gotem.io/get_user?UserId=${userid}`,
        {
          headers: {
            'X-Telegram-Init-Data': initData, // Add initData to headers
          },
        }
      );
      const data = await response.json();
      if (data && data.data && data.data.totalgot !== undefined) {
        setPoints(data.data.totalgot);
        localStorage.setItem(`points_${userID}`, data.data.totalgot);
        setLastSavedPoints(data.data.totalgot);
      }
    } catch (error) {
      console.error("Failed to load points:", error);
    }
  };

  const loadTaskStatus = (data: any) => {
    const updatedTaskStatus: { [key: string]: "not_started" | "completed" } = {
      YouTube: data.data.youtube === "Done" ? "completed" : "not_started",
      X: data.data.X === "Done" ? "completed" : "not_started",
      Telegram: data.data.telegram === "Done" ? "completed" : "not_started",
      Web3WagonTelegram:
        data.data.facebook === "Done" ? "completed" : "not_started",
      InviteFriends:
        data.data.Refertotal === "Done" ? "completed" : "not_started",
      DailyReward:
        !!data.data.dailyclaimedtime &&
        Date.now() - data.data.dailyclaimedtime < 24 * 60 * 60 * 1000
          ? "completed"
          : "not_started",
      Transaction:
        data.data.Transaction === "Done" ? "completed" : "not_started",
      Web3WagonX:
        data.data.instagram === "Done" ? "completed" : "not_started",
    };

    setTaskStatus(updatedTaskStatus);
    setLastClaimedTime(data.data.dailyclaimedtime);
    setRefertotalStatus(data.data.Refertotal || "NULL");

    localStorage.setItem(
      `taskStatus_${userID}`,
      JSON.stringify(updatedTaskStatus)
    );
  };

  const saveTaskCompletion = async (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    const initData = window.Telegram.WebApp.initData || ''; // Get initData from Telegram WebApp

    try {
      await fetch("https://api-dapp.gotem.io/update_user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-Telegram-Init-Data': initData, // Add initData to headers
        },
        body: JSON.stringify({ UserId: userID, [column]: "Done" }),
      });

      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "completed",
      }));

      setPoints((prevPoints) => prevPoints + reward);
      localStorage.setItem(
        `taskStatus_${userID}`,
        JSON.stringify({ ...taskStatus, [taskKey]: "completed" })
      );
      showAlert(`Thank you! You have earned ${reward} gotEM.`);
    } catch (error) {
      console.error(`Failed to complete task ${taskKey}:`, error);
      showAlert(
        "An error occurred while completing the task. Please try again later."
      );
    }
  };

  const extractChatId = (link: string): string => {
    const parts = link.split("/");
    const lastPart = parts[parts.length - 1];
    return "@" + lastPart;
  };

  const handleTelegramTaskClick = async (
    taskKey: string,
    link: string
  ) => {
    window.open(link, "_blank");

    const chatId = extractChatId(link);
    const userId = userID;

    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading",
    }));

    setTimeout(async () => {
      const initData = window.Telegram.WebApp.initData || ''; // Get initData from Telegram WebApp

      try {
        const response = await fetch(
          `https://api-dapp.gotem.io/check_telegram_status?user_id=${userId}&chat_id=${chatId}`,
          {
            headers: {
              'X-Telegram-Init-Data': initData, // Add initData to headers
            },
          }
        );
        const data = await response.json();

        if (data.status === "1") {
          setTaskStatus((prevState) => ({
            ...prevState,
            [taskKey]: "claimable",
          }));
        } else {
          setTaskStatus((prevState) => ({
            ...prevState,
            [taskKey]: "not_started",
          }));
          showAlert("Not found, please try again.");
        }
      } catch (error) {
        console.error("Error checking Telegram status:", error);
        setTaskStatus((prevState) => ({
          ...prevState,
          [taskKey]: "not_started",
        }));
        showAlert("An error occurred. Please try again.");
      }
    }, 6000); // 6 seconds delay
  };

  const handleTaskClick = (taskKey: string, link: string) => {
    window.open(link, "_blank");

    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading",
    }));

    setTimeout(() => {
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "claimable",
      }));
    }, 50000); 
  };

  const handleTaskClaim = (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    saveTaskCompletion(taskKey, column, reward);
  };

  const handleDailyRewardClick = async () => {
    const now = Date.now();
    if (
      lastClaimedTime &&
      now - lastClaimedTime < 24 * 60 * 60 * 1000
    ) {
      showAlert(
        "You have already claimed your daily reward. Please come back later."
      );
      return;
    }
    const initData = window.Telegram.WebApp.initData || ''; // Get initData from Telegram WebApp


    try {
      await fetch("https://api-dapp.gotem.io/update_user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-Telegram-Init-Data': initData, // Add initData to headers
        },
        body: JSON.stringify({ UserId: userID, dailyclaimedtime: now }),
      });

      setLastClaimedTime(now);
      setTaskStatus((prevState) => ({
        ...prevState,
        DailyReward: "completed",
      }));

      setPoints((prevPoints) => prevPoints + 120);
      showAlert(
        "Congratulations! You have claimed your daily reward of 120 gotEM."
      );
    } catch (error) {
      console.error("Failed to claim daily reward:", error);
      showAlert(
        "An error occurred while claiming your daily reward. Please try again later."
      );
    }
  };

  const handleInviteFriendsClick = async () => {
    if (refertotalStatus === "NULL" || !refertotalStatus) {
      showAlert("Not Enough Friends");
    } else if (refertotalStatus === "Approve") {
      const initData = window.Telegram.WebApp.initData || ''; // Get initData from Telegram WebApp

      try {
        await fetch("https://api-dapp.gotem.io/update_user", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'X-Telegram-Init-Data': initData, // Add initData to headers
          },
          body: JSON.stringify({ UserId: userID, Refertotal: "Done" }),
        });

        setTaskStatus((prevState) => ({
          ...prevState,
          InviteFriends: "completed",
        }));

        setPoints((prevPoints) => prevPoints + 25000);
        setRefertotalStatus("Done");
        showAlert(
          "Congratulations! You have completed the Invite 5 Friends task and earned 25000 gotEM."
        );
      } catch (error) {
        console.error("Failed to complete Invite Friends task:", error);
        showAlert(
          "An error occurred while completing the task. Please try again later."
        );
      }
    }
  };
  const renderTasks = () => (
    <>
    <div className="flex justify-center mt-6 px-4">
  <button
    className="w-full h-10 bg-blue-500 text-white font-bold rounded-lg"
    onClick={() => setActivePage("game")}
  >
    Play to Earn
  </button>
</div>

      {/* Daily Section */}
      <div className="mt-6">
        <div className="flex justify-start mt-6 px-4">
          <h1 className="text-lg font-bold text-gray-700">
            Daily
          </h1>
        </div>
        {/* Daily Tasks */}
        <TaskItem
          icon={dailyRewardIcon}
          title="Daily reward"
          reward={120}
          status={
            taskStatus["DailyReward"] === "completed"
              ? "completed"
              : "not_started"
          }
          onClick={handleDailyRewardClick}
        />
      </div>
  
      {/* Animated Gradient Separator */}
      <div className="my-5">
      <div className="h-0.5 bg-gradient-to-r from-gray-800 to-gray-200 via-yellow-700 animate-gradient-x" />
    </div>

      {/* Do to Earn Section */}
      <div className="mt-6">
        <div className="flex justify-start mt-6 px-4">
          <h1 className="text-lg font-bold text-gray-700">
            gotEM Tasks
          </h1>
        </div>
        {/* Modified Telegram Tasks */}
        <TaskItem
          icon={telegramIcon}
          title="Join gotEM TG channel"
          reward={3000}
          status={taskStatus["Telegram"] || "not_started"}
          onClick={() =>
            handleTelegramTaskClick(
              "Telegram",
              "https://t.me/gotem_io"
            )
          }
          onClaim={() => handleTaskClaim("Telegram", "telegram", 3000)}
        />
        <TaskItem
          icon={telegramIcon}
          title="Join Announcements!"
          reward={2000}
          status={taskStatus["Web3WagonTelegram"] || "not_started"}
          onClick={() =>
            handleTelegramTaskClick(
              "Web3WagonTelegram",
              "https://t.me/gtxannoucements"
            )
          }
          onClaim={() =>
            handleTaskClaim("Web3WagonTelegram", "facebook", 2000)
          }
        />
        <TaskItem
          icon={xIcon}
          title="Follow gotEM on X"
          reward={3000}
          status={taskStatus["X"] || "not_started"}
          onClick={() =>
            handleTaskClick("X", "https://x.com/gotem_io/")
          }
          onClaim={() => handleTaskClaim("X", "X", 3000)}
        />
        <TaskItem
          icon={xIcon}
          title="Follow the account"
          reward={3000}
          status={taskStatus["Web3WagonX"] || "not_started"}
          onClick={() =>
            handleTaskClick("Web3WagonX", "https://x.com/Imparable_Leaug")
          }
          onClaim={() => handleTaskClaim("Web3WagonX", "instagram", 3000)}
        />
        <TaskItem
          icon={youtubeIcon}
          title="Follow on Medium"
          reward={2000}
          status={taskStatus["YouTube"] || "not_started"}
          onClick={() =>
            handleTaskClick(
              "YouTube",
              "https://medium.com/@GotemGTX"
            )
          }
          onClaim={() => handleTaskClaim("YouTube", "youtube", 2000)}
        />
        <TaskItem
          icon={inviteFriendsIcon}
          title="Invite 5 friends"
          reward={25000}
          status={taskStatus["InviteFriends"] || "not_started"}
          onClick={handleInviteFriendsClick}
        />
      </div>
    </>
  );
  
  useEffect(() => {
    const preloadPages = async () => {
      await Promise.all([
        loadPoints(userID),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
      setLoading(false);
    };
    preloadPages();
  }, [userID]);

  return (
    <div className="relative flex justify-center">
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <div className="absolute inset-0 bg-black"></div>
          <div className="relative pt-2 md:pt-14 w-full text-white h-screen font-bold flex flex-col max-w-xl">
            {activePage === "home" && (
              <>
                <div className="px-4 z-10">
                  <div
                    className="bg-gray-800 bg-opacity-50 rounded-xl p-6 flex flex-col items-center"
                    style={{
                      animation: "gradientBackground 8s ease infinite",
                    }}
                  >
                    <img src={main} alt="Token Logo" className="w-32 h-32" />
                    <p className="text-5xl mt-4">
                      {points.toLocaleString()}
                    </p>
                    <p className="text-lg">gotEM</p>

                    <div className="mt-4">
                      <TonConnectButton />
                    </div>
                  </div>

                  {/* Render Tasks */}
                  {renderTasks()}

                  <div className="h-24"></div>
                </div>
              </>
            )}

            {activePage === "friends" && <FriendsPage />}
            {activePage === "leaderboard" && <Leaderboard />}
            {activePage === "game" && (
  <Game
    onBack={() => {
      setActivePage("home");
      loadPoints(userID); // Refetch the user data and update the points from the DB
    }}
  />
)}

          </div>

          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl bg-black flex justify-around items-center z-50 rounded-3xl text-xs">
            <div
              className={`nav-item text-center text-[#c0c0c0] ${
                activePage === "home"
                  ? "!bg-[#5D5D5D] text-black"
                  : ""
              } w-1/5 m-1 p-2 rounded-2xl`}
              onClick={() => setActivePage("home")}
            >
              <img
                src={binanceLogo}
                alt="Home"
                className="w-8 h-8 mx-auto"
              />
              <p className="mt-1">Home</p>
            </div>

            <div
              className={`nav-item text-center text-[#c0c0c0] ${
                activePage === "friends"
                  ? "!bg-[#5D5D5D] text-black"
                  : ""
              } w-1/5 m-1 p-2 rounded-2xl`}
              onClick={() => setActivePage("friends")}
            >
              <Friends className="w-8 h-8 mx-auto" />
              <p className="mt-1">Friends</p>
            </div>

            <div
              className={`nav-item text-center text-[#c0c0c0] ${
                activePage === "leaderboard"
                  ? "!bg-[#5D5D5D] text-black"
                  : ""
              } w-1/5 m-1 p-2 rounded-2xl`}
              onClick={() => setActivePage("leaderboard")}
            >
              <img
                src={dailyCombo}
                alt="Ranking"
                className="w-8 h-8 mx-auto"
              />
              <p className="mt-1">Ranking</p>
            </div>
          </div>

          {modalMessage && (
            <Modal message={modalMessage} onClose={closeModal} />
          )}
          <Toaster />

          {showOverlayPage && (
            <OverlayPage closeOverlay={closeOverlay} userAdded={userAdded} />
          )}
        </>
      )}
    </div>
  );
};

export default App;
