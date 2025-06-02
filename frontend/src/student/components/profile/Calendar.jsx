import React, { useState } from "react";
import userLogo from "../../assets/user01.png";

const Notification = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  // Full notifications list with more than two people
  const notifications = [
    { id: 1, name: "Meghna Tiwari", message: "Please check the new updates.", time: "2 hr ago", date: "29-03-2024" },
    { id: 2, name: "Ashutosh Mishra", message: "Are the documents uploaded?", time: "3 hr ago", date: "20-08-2024" },
    { id: 3, name: "Anita Yadav", message: "Can you join the meeting?", time: "5 hr ago", date: "11-04-22" },
    { id: 4, name: "Priti Morya", message: "Let’s finalize the project details.", time: "6 hr ago", date: "2024-12-27" },
    { id: 5, name: "Kashish Pal", message: "Please review the design mockup.", time: "1 hr ago", date: "2024-12-29" },
    { id: 6, name: "Aditi Roy", message: "I’ve sent the files for review.", time: "4 hr ago", date: "2024-12-29" },
  ];

  // Only two notifications shown in the main notification list
  const mainNotifications = notifications.slice(0, 2);

  const handleUnreadClick = () => {
    setFilteredNotifications(notifications); // Show all notifications in modal
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSearchTerm(""); // Reset search term when closing modal
  };

  const handleFilter = () => {
    const filtered = notifications.filter((notification) =>
      notification.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNotifications(filtered);
  };

  return (
    <div className="flex items-center justify-between w-full rounded-lg shadow-lg transition-shadow duration-300 bg-white border border-gray-200">
      <div className="rounded-lg shadow-lg p-5 w-full">
        {/* Notifications Header with Filter Button */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Notifications</h2>
          <button
            className="text-sm bg-blue-500 px-2 py-2 rounded-md text-[#ffffff] font-semibold hover:scale-105 transition-shadow"
            onClick={handleUnreadClick}
          >
            View
          </button>
        </div>

        {/* Mark as Read and Clear All */}
        {/* <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span className="text-green-500 hover:underline font-semibold">Today</span>
          <span className="flex gap-2">
            <button className="text-blue-500 hover:underline font-semibold">Mark as read</button>
            <button className="text-red-500 hover:underline font-semibold">Clear all</button>
          </span>
        </div> */}

        {/* Main Notifications List (only two people) */}
        {mainNotifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-center gap-4 mb-4 cursor-pointer hover:bg-gray-100 rounded-md"
          >
            <div>
              <img src={userLogo} alt="user" className="w-10 h-10 rounded-full" />
            </div>
            <div className="flex justify-between w-full">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{notification.name}</p>
                <p className="text-sm text-gray-500">{notification.message}</p>
              </div>
              <div className="flex flex-col items-end ml-4 p-1">
                <span className="text-xs text-gray-400">{notification.date}</span>
                <span className="text-xs text-gray-400">{notification.time}</span>
              </div>
            </div>
          </div>
        ))}

        {/* View Previous Notifications */}
        {/* <button className="text-blue-500 text-sm hover:underline font-semibold">View previous notifications</button> */}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-screen-md mx-auto p-6 rounded-lg shadow-lg relative">
            {/* Cross Icon */}
            <button
              className="absolute top-2 right-4 text-gray-500 hover:text-gray-800 text-4xl"
              onClick={closeModal}
            >
              &times;
            </button>
            <div className="mb-4">
              <h2 className="text-lg font-bold mb-4">Notifications</h2>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-3/4"
                />
                <button
                  className="ml-4 bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-700 text-white font-semibold"
                  onClick={handleFilter}
                >
                  Filter
                </button>
              </div>
            </div>
            <div className="mt-6">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-center gap-4 mb-4 cursor-pointer">
                    <img src={userLogo} alt="user" className="w-10 h-10 rounded-full" />
                    <div className="flex justify-between w-full">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{notification.name}</p>
                        <p className="text-sm text-gray-500">{notification.message}</p>
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        <span className="text-xs text-gray-400">{notification.date}</span>
                        <span className="text-xs text-gray-400">{notification.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No notifications found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
