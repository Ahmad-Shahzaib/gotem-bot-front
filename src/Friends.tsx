import React, { useEffect, useState } from "react";
import { useUser } from "./UserContext";
import Modal from "./Modal"; // Importing the Modal component
import gift from "./images/gift.png"; // Ensure the logo path is correct

const FriendsPage: React.FC = () => {
  const { userID, setPoints } = useUser(); // Retrieve the userID and setPoints from global context
  const [friends, setFriends] = useState<
    Array<{ Username: string; totalgot: number }>
  >([]);
  const [modalMessage, setModalMessage] = useState<string | null>(null); // Modal state
  const FRIEND_REWARD = 3000; // Points reward per new friend

  // Invitation link
  const invitationLink = `https://t.me/gotEMio_bot/app?startapp=${encodeURIComponent(
    userID
  )}`;

  const handleInvite = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(invitationLink)}`,
      "_blank"
    );
  };

  const setupInvitationLinkCopy = () => {
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = invitationLink; // Set the value to the invitation link
    document.body.appendChild(tempTextArea); // Add it to the document
    tempTextArea.select(); // Select the text inside the text area
    document.execCommand("copy"); // Execute the copy command
    document.body.removeChild(tempTextArea); // Remove the temporary text area from the document
    showModal("Invitation link copied to clipboard!");
  };

  const showModal = (message: string) => {
    setModalMessage(message);
  };

  const closeModal = () => {
    setModalMessage(null);
  };

  // Function to update the `referrewarded` count
  const updateReferrewarded = async (newReferrewardedCount: number) => {
    try {
      await fetch("https://api-dapp.gotem.io/update_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          UserId: userID,
          referrewarded: newReferrewardedCount.toString(),
        }),
      });
      console.log("referrewarded updated to", newReferrewardedCount);
    } catch (error) {
      console.error("Failed to update referrewarded:", error);
    }
  };

  // Logic to fetch friends and handle rewarding
  const fetchFriends = async () => {
    try {
      const response = await fetch(
        `https://api-dapp.gotem.io/get_invitations?UserId=${userID}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );
      const data = await response.json();

      if (data) {
        const invitations = data.invitations || [];
        const totalFriendsCount = invitations.length;
        const referrewardedCount = data.referrewarded
          ? parseInt(data.referrewarded, 10)
          : 0;

        setFriends(invitations); // Update state with friends data

        // Store friends' names in localStorage
        localStorage.setItem(
          `friends_${userID}`,
          JSON.stringify(invitations)
        );

        if (totalFriendsCount > referrewardedCount) {
          const newUnrewardedFriends = totalFriendsCount - referrewardedCount;
          const rewardPoints = newUnrewardedFriends * FRIEND_REWARD;

          setPoints((prevPoints) => prevPoints + rewardPoints);
          showModal(
            `You have earned ${rewardPoints} points for inviting ${newUnrewardedFriends} new friends!`
          );

          // Update the user's referrewarded count
          await updateReferrewarded(totalFriendsCount);
        }
      } else {
        // No data returned
        setFriends([]);
        localStorage.removeItem(`friends_${userID}`); // Clear localStorage if no friends
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  // Fetch friends data on component load
  useEffect(() => {
    if (userID) {
      // Load friends from localStorage
      const localFriends = localStorage.getItem(`friends_${userID}`);
      if (localFriends) {
        setFriends(JSON.parse(localFriends));
      }

      // Fetch friends from the database
      fetchFriends();
    } else {
      console.log("UserID not available");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userID]);

  return (
    <div className="bg-black flex justify-center h-screen">
      <div className="w-full text-white font-bold flex flex-col max-w-xl">
        {/* Header Section */}
        <div className="text-center mt-6">
          <h2 className="text-xl font-extrabold">Invite Friends And Get More</h2>
          <h3 className="text-white-500 text-3xl">gotEM</h3>
        </div>

        {/* Invite Boxes Section */}
        <div className="px-4 mt-6 space-y-4">
          <div className="bg-[#A9A9A9]/20 rounded-lg p-4 flex items-center">
            <img src={gift} alt="Invite a friend" className="w-12 h-12 mr-4" />
            <div>
              <p className="text-sm font-bold">Invite a friend</p>
              <p className="text-xs text-yellow-400">+3,000 for you</p>
            </div>
          </div>
        </div>

        {/* Friends List */}
        <div className="bg-gray-750/70 rounded-lg p-4 mt-4 mx-5 text-white">
          <h3 className="text-center text-white">List of your friends</h3>
          {friends.length > 0 ? (
            friends.map((friend) => (
              <div
                key={friend.Username}
                className="bg-[#1d2025] rounded-full p-3 mt-4 text-center text-gray-300"
              >
                {friend.Username}
              </div>
            ))
          ) : (
            <p>No friends invited yet.</p>
          )}
        </div>

        <div className="h-24"></div>

        {/* Buttons */}
        <div className="fixed bottom-20 w-full px-5 max-w-xl">
          <div className="flex justify-between">
            <button
              onClick={setupInvitationLinkCopy}
              className="bg-white text-black rounded-xl py-3 px-6 flex-1 mr-2"
              style={{ fontSize: "1rem", fontWeight: "bold" }}
            >
              Copy Link
            </button>
            <button
              onClick={handleInvite}
              className="bg-white text-black rounded-xl py-3 px-6 flex-1 ml-2"
              style={{ fontSize: "0.85rem", fontWeight: "bold" }}
            >
              Invite Friends+
            </button>
          </div>
        </div>
      </div>

      {/* Modal Component */}
      {modalMessage && <Modal message={modalMessage} onClose={closeModal} />}
    </div>
  );
};

export default FriendsPage;
