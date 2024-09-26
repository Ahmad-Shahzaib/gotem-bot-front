import React from "react";
import main from "./images/main.png"; // Ensure the correct path to your image

const LoadingScreen: React.FC = () => {
  return (
    <div className="w-full bg-black text-white h-screen font-bold flex flex-col max-w-xl justify-center items-center">
{/* Loading Image */}
<img
  src={main}
  alt="Loading Character"
  className="w-32 h-32 mb-4 animate-bounce"
/>


      {/* Loading Text */}
      <h1 className="text-2xl font-extrabold text-center animate-pulse">
        Loading...
      </h1>
    </div>
  );
};

export default LoadingScreen;