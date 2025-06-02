import React, { useState, useEffect } from "react";
import { FaSearch, FaBell, FaSun, FaShoppingCart, FaUser } from "react-icons/fa";
import ProfileDropdown from "../../components/ProfileDropdown/ProfileDropdown"; // Import ProfileDropdown
import AxiosInstance from "../../../AxiosInstance";
import userLogo from "../../../student/assets/user01.png"

const Header = ({ onToggleDarkMode, isDarkMode }) => {
  // const [isProfileOpen, setIsProfileOpen] = useState(false);

  // const handleProfileToggle = () => {
  //   setIsProfileOpen(!isProfileOpen);
  // };

  // Sample professor's name
  const [username, setUsername] = useState("");

  useEffect(() => {
    AxiosInstance.get("/user/user-info/")
      .then((response) => {
        setUsername(response.data.username);
      })
      .catch(() => {
        setUsername("Guest");
      });
  }, []);

  // Function to get initials (excluding "Prof.")
  const getInitials = (name) => {
    const words = name.replace("Prof. ", "").split(" ");
    return words.map((word) => word[0]).join("").toUpperCase();
  };

  return (
    <header className={`flex items-center justify-between px-6 py-4 shadow-md ${isDarkMode ? 'bg-[#121138]' : 'bg-[#ffffff]'} fixed w-full top-0 lg:w-[calc(100%-16rem)] z-10 `}>
      {/* Left - Search Bar */}
      <div className="relative w-80">
        <FaSearch className={`absolute top-3 left-4 ${isDarkMode ? 'text-white' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="Quick finding..."
          className={`pl-10 pr-4 py-1 w-full rounded-lg focus:ring focus:ring-[#5cc800] focus:outline-none ${isDarkMode ? 'bg-[#444444] text-white' : 'bg-[#d7e9f2] text-[#121138]'}`}
        />
      </div>

      {/* Right - Icons & Profile */}
      <div className="flex items-center space-x-6">
        {/* Notifications */}
        {/* <button className="relative">
          <FaBell className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#121138]'}`} />
          <span className="absolute top-0 right-0 w-3 h-3 bg-[#fc7247] rounded-full"></span>
        </button> */}

  
        {/* Dark Mode Toggle */}
        {/* <button className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#121138]'}`} onClick={onToggleDarkMode}>
          <FaSun />
        </button> */}

        {/* Profile */}
        <div className="flex items-center space-x-2 relative">
          {/* <img
            src="https://via.placeholder.com/40"
            alt="Profile"
            className="w-10 h-10 rounded-full border-2 border-[#5cc800]"
            // onClick={handleProfileToggle}
          /> */}

          <img src={userLogo} alt="user image" className="w-8 h-8 rounded-full"/>

          {/* Name & Initials */}
          <div>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#121138]'}`}>
              {username}
            </p>
            {/* <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {getInitials(professorName)}
            </p> */}
          </div>
          {/* Profile Dropdown */}
          {/* {isProfileOpen && <ProfileDropdown />} */}
        </div>
      </div>
    </header>
  );
};

export default Header;
