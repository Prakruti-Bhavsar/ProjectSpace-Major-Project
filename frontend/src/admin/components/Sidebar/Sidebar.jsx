import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MdDashboard } from "react-icons/md";
import { FaHome, FaUserShield, FaUsers, FaBox, FaReceipt, FaShoppingCart, FaEnvelope, FaBell, FaCog } from "react-icons/fa";

const Sidebar = ({ isDarkMode }) => {
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");

  const menuItems = [
    { label: "Home", icon: FaHome, path: "/home" },
    { label: "Review Assessment", icon: FaUserShield, path: "/assessment" },
    { label: "Department", icon: FaUsers, badgeColor: "#ff1565", path: "/department" },
    { label: "Products", icon: FaBox, badge: "NEW", badgeColor: "#10acd0", path: "/products" },
    { label: "Invoices", icon: FaReceipt, path: "/invoices" },
    { label: "Orders", icon: FaShoppingCart, badge: "5", badgeColor: "#27777a6", path: "/orders" },
    { label: "Messages", icon: FaEnvelope, badge: "3", badgeColor: "#fba02a", path: "/messages" },
    { label: "Notifications", icon: FaBell, badge: "9", badgeColor: "#fc7247", path: "/notifications" },
    { label: "Settings", icon: FaCog, path: "/settings" },
  ];

  return (
    <div className={`h-screen w-64 shadow-lg transition-all duration-300 ${isDarkMode ? 'bg-[#121138]' : 'bg-[#ffffff]'}`}>
      {/* Logo Section */}
      <div className="px-6 py-4 flex items-center space-x-4">
  {/* <MdDashboard className="text-5xl text-[#fba02a]" /> Increase icon size */}
  <h1 className={`${isDarkMode ? 'text-white' : 'text-[#383211]'} font-bold text-3xl mt-1`}>ProjectSpace</h1>
</div>


      {/* Menu Items */}
      <nav className="flex flex-col space-y-2 mt-4">
        {menuItems.map((item) => (
          <Link
            to={item.path}
            key={item.label}
            onClick={() => setActiveMenuItem(item.label)}
            className={`flex items-center px-6 py-3 rounded-md cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              activeMenuItem === item.label
                ? `${isDarkMode ? 'bg-[#5cc800] text-white' : 'bg-[#5cc800] text-white'}`
                : `${isDarkMode ? 'text-white hover:bg-[#011474] hover:text-white' : 'text-[#121138] hover:bg-[#e8e8e8] hover:text-[#121138]'}`
            }`}
          >
            <item.icon className={`${isDarkMode ? 'text-white' : 'text-[#121138]'} text-lg`} />
            <span className={`${isDarkMode ? 'text-white' : 'text-[#121138]'} ml-4 flex-1`}>{item.label}</span>
            {item.badge && (
              <span
                className={`text-sm font-bold px-2 py-1 rounded-lg`}
                style={{ backgroundColor: item.badgeColor }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
