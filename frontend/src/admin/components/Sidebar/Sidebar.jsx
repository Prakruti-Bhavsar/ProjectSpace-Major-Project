import React, { useState } from "react";
import { Link , useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaUserShield, FaUsers, FaBox, FaReceipt, FaShoppingCart, FaEnvelope, FaBell, FaCog, FaSignOutAlt, FaBuilding, FaUniversity} from "react-icons/fa";
import AxiosInstance from "../../../AxiosInstance";

const Sidebar = ({ isDarkMode }) => {
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { label: "Home", icon: FaHome, path: "/home" },
    { label: "Department", icon: FaUniversity, badgeColor: "#ff1565", path: "/department" },
    { label: "Review Assessment", icon: FaUserShield, path: "/assessment" },
    { label: "Management", icon: FaUsers, path: "/management" },
    { label: "Repository", icon: FaEnvelope, badgeColor: "#fba02a", path: "/repository" },
    // { label: "Products", icon: FaBox, badge: "NEW", badgeColor: "#10acd0", path: "/products" },
    // { label: "Invoices", icon: FaReceipt, path: "/invoices" },
    // { label: "Orders", icon: FaShoppingCart, badge: "5", badgeColor: "#27777a6", path: "/orders" },
    // { label: "Messages", icon: FaEnvelope, badge: "3", badgeColor: "#fba02a", path: "/messages" },
    // { label: "Notifications", icon: FaBell, badge: "9", badgeColor: "#fc7247", path: "/notifications" },
    { label: "Settings", icon: FaCog, path: "/settings" },
  ];

  const logoutUser = () =>{
      AxiosInstance.post(`logout/`,{
      })
      .then( () => {
        localStorage.removeItem("Token")
        navigate(`/`)
      }

      )
  }

  return (
    <div className={`h-screen w-64 fixed top-0 left-0 shadow-lg transition-all duration-300 ${isDarkMode ? 'bg-[#121138] text-white' : 'bg-[#ffffff] text-black'} z-8`}>
      {/* Logo Section */}
      <div className="px-6 py-4 flex items-center space-x-4">
  {/* <MdDashboard className="text-5xl text-[#fba02a]" /> Increase icon size */}
  <h1 className={`${isDarkMode ? 'text-white' : 'text-[#383211]'} font-bold text-3xl mt-1`}>ProjectSpace</h1>
</div>


      {/* Menu Items */}
      <nav className="flex flex-col space-y-2 mt-4">
         {menuItems.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <Link
            to={item.path}
            key={item.label}
            className={`flex items-center px-6 py-3 rounded-md cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              isActive
                ? 'bg-[#5cc800] text-white'
                : isDarkMode
                  ? 'text-white hover:bg-[#011474] hover:text-white'
                  : 'text-[#121138] hover:bg-[#e8e8e8] hover:text-[#121138]'
            }`}
          >
            <item.icon className={`${isDarkMode ? 'text-white' : 'text-[#121138]'} text-lg`} />
            <span className={`${isDarkMode ? 'text-white' : 'text-[#121138]'} ml-4 flex-1`}>
              {item.label}
            </span>
            {item.badge && (
              <span
                className="text-sm font-bold px-2 py-1 rounded-lg"
                style={{ backgroundColor: item.badgeColor }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
          <Link
            key = "Logout"
            onClick={logoutUser}
            className={`flex items-center px-6 py-3 rounded-md cursor-pointer transition-all duration-300 transform hover:scale-105`}
          >
            <FaSignOutAlt className={`${isDarkMode ? 'text-white' : 'text-[#121138]'} text-lg`} />
            <span className={`${isDarkMode ? 'text-white' : 'text-[#121138]'} ml-4 flex-1`}>Logout</span>
          </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
