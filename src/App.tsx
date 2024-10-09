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
// import dailyRewardIcon from "./images/daily-reward.png";
import doneIcon from "./images/done.png";
import ratLogo from "./images/main-character.png";
import youtubeIcon from "./images/youtube.png";
import inviteFriendsIcon from "./images/gift.png";
import DailyReward from './DailyReward'; // Import the DailyReward component

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
          <div className="font-bold" style={{ fontSize: "0.875rem" }}>{title}</div>
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
  // const [lastClaimedTime, setLastClaimedTime] = useState<number | null>(null);
  const [refertotalStatus, setRefertotalStatus] = useState<string | null>(
    "NULL"
  );
  const [showOverlayPage, setShowOverlayPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("home");
  const [userAdded, setUserAdded] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);

  // New state variable to track if daily reward is available
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(false);

  // State for fetched tasks
  const [fetchedTasks, setFetchedTasks] = useState<any[]>([]);

  const closeModal = () => setModalMessage(null);

  const closeOverlay = () => {
    setShowOverlayPage(false);
    if (dailyRewardAvailable) {
      setShowDailyReward(true);
    }
  };

  const showAlert = (message: string) => {
    setModalMessage(message);
  };

  const [lastSavedPoints, setLastSavedPoints] = useState<number>(points);

  const savePoints = async () => {
    if (!userID) return;
    const initData = window.Telegram.WebApp.initData || '';

    try {
      await fetch("https://api-dapp.gotem.io/update_user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-Telegram-Init-Data': initData,
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
      const initData = window.Telegram.WebApp.initData || '';

      const response = await fetch(
        `https://api-dapp.gotem.io/get_user?UserId=${userid}`,
        {
          headers: {
            'X-Telegram-Init-Data': initData,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        await loadPoints(userid);
        loadTaskStatus(data);
        setShowOverlayPage(false); // User exists, no need to show overlay
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
    const initData = window.Telegram.WebApp.initData || '';

    try {
      await fetch("https://api-dapp.gotem.io/add_user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-Telegram-Init-Data': initData,
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
      console.log("Error adding user:", error);
    }
  };

  const loadPoints = async (userid: string) => {        
    const initData = window.Telegram.WebApp.initData || '';

    try {
      const response = await fetch(
        `https://api-dapp.gotem.io/get_user?UserId=${userid}`,
        {
          headers: {
            'X-Telegram-Init-Data': initData,
          },
        }
      );
      const data = await response.json();
      if (data && data.data && data.data.totalgot !== undefined) {
        setPoints(data.data.totalgot);
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

    setTaskStatus((prevStatus) => ({
      ...prevStatus,
      ...updatedTaskStatus,
    }));
    // setLastClaimedTime(data.data.dailyclaimedtime);
    setRefertotalStatus(data.data.Refertotal || "NULL");
  };

  const saveTaskCompletion = async (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    const initData = window.Telegram.WebApp.initData || '';

    try {
      await fetch("https://api-dapp.gotem.io/update_user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-Telegram-Init-Data': initData,
        },
        body: JSON.stringify({ UserId: userID, [column]: "Done" }),
      });

      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "completed",
      }));

      setPoints((prevPoints) => prevPoints + reward);
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
      const initData = window.Telegram.WebApp.initData || '';

      try {
        const response = await fetch(
          `https://api-dapp.gotem.io/check_telegram_status?user_id=${userId}&chat_id=${chatId}`,
          {
            headers: {
              'X-Telegram-Init-Data': initData,
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
    }, 5000); 
  };

  const handleTaskClaim = (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    saveTaskCompletion(taskKey, column, reward);
  };



  const handleInviteFriendsClick = async () => {
    if (refertotalStatus === "NULL" || !refertotalStatus) {
      showAlert("Not Enough Friends");
    } else if (refertotalStatus === "Approve") {
      const initData = window.Telegram.WebApp.initData || '';

      try {
        await fetch("https://api-dapp.gotem.io/update_user", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'X-Telegram-Init-Data': initData,
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

  // Handle clicks for fetched tasks
  const handleFetchedTaskClick = (task: any) => {
    // Check if task is already completed
    if (taskStatus[task.taskid.toString()] === 'completed') {
      return; // Do nothing if task is completed
    }

    // Use the link provided by the task to open in a new tab or default to "#"
    const taskLink = task.tasklink || "#";
    window.open(taskLink, "_blank");

    // Set task status to "loading"
    setTaskStatus((prevState) => ({
      ...prevState,
      [task.taskid.toString()]: "loading",
    }));

    // Simulate an asynchronous operation to make the task claimable
    setTimeout(() => {
      setTaskStatus((prevState) => ({
        ...prevState,
        [task.taskid.toString()]: "claimable",
      }));
    }, 5000); // Adjust the delay as needed
  };

  // Handle claims for fetched tasks
  const handleFetchedTaskClaim = async (task: any) => {
    try {
      const initData = window.Telegram.WebApp.initData || '';

      // First API call: Mark task as done
      const markDoneResponse = await fetch('https://api-dapp.gotem.io/mark_task_done', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
        },
        body: JSON.stringify({
          userid: userID,
          taskid: task.taskid,
        }),
      });

      const markDoneData = await markDoneResponse.json();

      if (!markDoneResponse.ok) {
        console.log('Warning: Failed to mark task as done. Proceeding with increasing points.');
      } else if (!markDoneData.success && markDoneData.message !== 'Task marked as done for existing user' && markDoneData.message !== 'Task already marked as done') {
        console.log('Warning: Task already marked as done or other non-critical issue.');
      }

      // Second API call: Increase total points (totalgot)
      const increasePointsResponse = await fetch('https://api-dapp.gotem.io/increase_totalgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
        },
        body: JSON.stringify({
          UserId: userID,
          Amount: task.taskreward,
        }),
      });

      const increasePointsData = await increasePointsResponse.json();

      if (!increasePointsResponse.ok || !increasePointsData.totalgot || !increasePointsData.message.includes('Total got updated successfully')) {
        throw new Error('Failed to increase points. Backend response indicates failure.');
      }

      // Update task status to completed if successful
      setTaskStatus((prevStatus) => ({
        ...prevStatus,
        [task.taskid.toString()]: 'completed',
      }));

      // Update user's points
      setPoints(increasePointsData.totalgot);

      // Show success alert
      showAlert(`You have earned ${task.taskreward} gotEM. Your total is now ${increasePointsData.totalgot} gotEM.`);

    } catch (error) {
      // Enhanced error message for debugging
      console.error('Failed to claim task:', error);
      showAlert('An error occurred while claiming the task. Please try again later.');

      // Set task status back to not started only if increasing points failed
      setTaskStatus((prevStatus) => ({
        ...prevStatus,
        [task.taskid.toString()]: 'not_started',
      }));
    }
  };

  // Fetch tasks from the API and mark the completed ones
  useEffect(() => {
    const fetchTasks = async () => {
      const initData = window.Telegram.WebApp.initData || '';

      try {
        const response = await fetch(`https://api-dapp.gotem.io/get_user_tasks?userid=${userID}`, {
          headers: {
            'X-Telegram-Init-Data': initData,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.status}`);
        }

        const data = await response.json();
        if (data) {
          if (data.task_details) {
            setFetchedTasks(data.task_details);
          }

          // Handle completed tasks
          let completedTasks: number[] = [];
          if (data.completed_tasks) {
            if (Array.isArray(data.completed_tasks)) {
              completedTasks = data.completed_tasks.map((id: any) => parseInt(id, 10));
            } else if (typeof data.completed_tasks === 'string') {
              completedTasks = data.completed_tasks
                .split(',')
                .map((id: string) => parseInt(id, 10))
                .filter((id: number) => !isNaN(id));
            } else if (typeof data.completed_tasks === 'number') {
              completedTasks = [data.completed_tasks];
            }
          }

          // Initialize task status for fetched tasks
          const newTaskStatus: { [key: string]: "not_started" | "completed" } = {};
          data.task_details.forEach((task: any) => {
            newTaskStatus[task.taskid.toString()] = completedTasks.includes(task.taskid)
              ? 'completed' : 'not_started';
          });

          setTaskStatus((prevStatus) => ({
            ...prevStatus,
            ...newTaskStatus,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };

    if (userID) {
      fetchTasks();
    }
  }, [userID]);

  // Render tasks, including the fetched ones
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
        {/* Existing Tasks */}
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

      {/* Render Fetched Tasks */}
      {fetchedTasks.length > 0 && (
        <>
          {/* Animated Gradient Separator */}
          <div className="my-5">
            <div className="h-0.5 bg-gradient-to-r from-gray-800 to-gray-200 via-yellow-700 animate-gradient-x" />
          </div>

          <div className="mt-6">
            <div className="flex justify-start mt-6 px-4">
              <h1 className="text-lg font-bold text-gray-700">
                Additional Tasks
              </h1>
            </div>
            {fetchedTasks.map((task) => (
              <TaskItem
                key={task.taskid}
                icon={task.taskimage}
                title={task.tasktitle}
                reward={task.taskreward}
                status={taskStatus[task.taskid.toString()] || 'not_started'}
                onClick={() => handleFetchedTaskClick(task)}
                onClaim={() => handleFetchedTaskClaim(task)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );

  // Move the checkDailyRewardStatus function outside of useEffect
  const checkDailyRewardStatus = async () => {
    try {
      const initData = window.Telegram.WebApp.initData || '';
      const response = await fetch('https://api-dapp.gotem.io/gamer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
        },
        body: JSON.stringify({ GamerId: userID }),
      });
      if (response.ok) {
        const data = await response.json();
        const startime = data.data.startime;
        if (startime === 0 || startime === null) {
          // Show the daily reward page
          setDailyRewardAvailable(true);
        } else {
          const now = Math.floor(Date.now() / 1000); // Unix time in seconds
          const startDate = new Date(startime * 1000);
          const currentDate = new Date(now * 1000);
          if (
            startDate.getFullYear() !== currentDate.getFullYear() ||
            startDate.getMonth() !== currentDate.getMonth() ||
            startDate.getDate() !== currentDate.getDate()
          ) {
            // Different day, show the daily reward page
            setDailyRewardAvailable(true);
          } else {
            // Same day, don't show the daily reward page
            setDailyRewardAvailable(false);
          }
        }
      } else {
        console.error('Failed to fetch gamer data');
        setDailyRewardAvailable(false);
      }
    } catch (error) {
      console.error('Error fetching gamer data:', error);
      setDailyRewardAvailable(false);
    }
  };

  // Adjust the initial useEffect
  useEffect(() => {
    const preloadPages = async () => {
      if (userID) {
        await loadPoints(userID);
        await checkDailyRewardStatus();
        if (!showOverlayPage && dailyRewardAvailable) {
          setShowDailyReward(true);
        }
        setLoading(false);
      }
    };
    preloadPages();
  }, [userID, showOverlayPage, dailyRewardAvailable]);

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
                    <p className="text-5xl mt-4">{points.toLocaleString()}</p>
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
  
          {/* Navbar is rendered before the OverlayPage */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl bg-black flex justify-around items-center z-40 rounded-3xl text-xs">
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
  
          {/* Render OverlayPage first if user is added */}
          {showOverlayPage && (
            <OverlayPage closeOverlay={closeOverlay} userAdded={userAdded} />
          )}
          {/* Render DailyReward after OverlayPage is closed */}
          {showDailyReward && (
            <DailyReward onClose={() => setShowDailyReward(false)} />
          )}
  
          {modalMessage && <Modal message={modalMessage} onClose={closeModal} />}
          <Toaster />
        </>
      )}
    </div>
  );
  
};

export default App;
