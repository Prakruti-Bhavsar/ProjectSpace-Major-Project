import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInbox, faTags, faUserCircle, faUserFriends, faBell, faFilter, faSearch } from "@fortawesome/free-solid-svg-icons";

export default function EmailTabs() {
  const [activeTab, setActiveTab] = useState("Primary");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const notifications = {
    Primary: [
      { sender: "Admin", message: "Submission deadline for AI-ML project extended to Feb 10.", date: "Feb 1, 2025", time: "10:30 AM" },
      { sender: "Co-ordinator", message: "Project guide allocated for your academic project.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Co-ordinator", message: "Meeting scheduled with your guide on Feb 3 at 10 AM.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Admin", message: "Final year project presentations start next week.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Guide", message: "Reminder: Submit project synopsis by Feb 5.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Guide", message: "Your peer-review feedback for group project is due.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Coordinator", message: "Library resources updated for research projects.", date: "Feb 1, 2025", time: "11:00 AM" },

    ],
    Promotions: [
      { sender: "Coordinator", message: "Join the workshop on 'Advanced Python for ML' on Feb 8.", date: "Feb 1, 2025", time: "02:00 PM" },
      { sender: "Coordinator", message: "Early bird offer for the 'AI Summit 2025' ends soon!", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Coordinator", message: "Discounts on academic writing tools for students.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Guide", message: "Free access to IEEE papers for the next 30 days.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Admin", message: "Participate in the Data Science Hackathon this weekend.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Coordinator", message: "Your guide has approved the changes to your proposal.", date: "Feb 1, 2025", time: "11:00 AM" },

    ],
    Social: [
      { sender: "Guide", message: "Your classmate Akanksha has shared the project report template.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Guide", message: "NImisha has uploaded her project idea for brainstorming.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Guide", message: "Student community event: 'Discuss your projects' this Friday.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Coordinator", message: "Connect with your peers on the 'AI Projects Forum'.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Guide", message: "Payal added you to the group: 'Final Year Presentations'.", date: "Feb 1, 2025", time: "11:00 AM" },

    ],
    Updates: [
      { sender: "Admin", message: "System maintenance scheduled for Feb 7 - 10 AM to 1 PM.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Coordinator", message: "New project guidelines uploaded to the portal.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Guide", message: "Your uploaded project report has been reviewed.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Guide", message: "Reminder: Update your project logbook by Feb 6.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Coordinator", message: "Your guide has approved the changes to your proposal.", date: "Feb 1, 2025", time: "11:00 AM" },
      { sender: "Guide", message: "Exam schedule updated for project defense presentations.", date: "Feb 1, 2025", time: "11:00 AM" },

    ]
  };

  return (
    <div className="p-4 w-1200 ml-64 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-md">
      <div className="flex items-center relative mb-6">
        <FontAwesomeIcon icon={faSearch} className="absolute left-4 text-blue-500 text-lg cursor-pointer hover:text-blue-500 hover:scale-90 transition" />
        <input type="text" placeholder="Search Notification" className="flex-1 pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
        <FontAwesomeIcon icon={faFilter} className="absolute right-4 text-blue-500 cursor-pointer hover:text-blue-500 dark:text-blue-400" onClick={() => setFilterOpen(true)} />
      </div>

      <div className="flex space-x-6 border-b">
        {["Primary", "Promotions", "Social", "Updates"].map((tab) => (
          <button
            key={tab}
            className={`flex flex-col items-center text-blue-500 pb-2 font-semibold dark:text-blue-400 ${activeTab === tab ? "text-blue-500 border-b-4 border-blue-500" : "hover:text-blue-600"}`}
            onClick={() => setActiveTab(tab)}
          >
            <FontAwesomeIcon icon={tab === "Primary" ? faInbox : tab === "Promotions" ? faTags : tab === "Social" ? faUserFriends : faBell} className="w-5 h-5" />
            <span className="text-sm">{tab}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 border">
        {notifications[activeTab].map((notification, index) => (
          <div key={index}>
            <div className="px-4 py-2 border-b bg-gray-50 hover:bg-gray-100 cursor-pointer dark:bg-black dark:text-white flex justify-between" onClick={() => setSelectedMessage(selectedMessage === index ? null : index)}>
              <span>{notification.message}</span>
              <span className="text-sm text-gray-500">{notification.date} | {notification.time}</span>
            </div>
            {selectedMessage === index && (
              <div className="px-4 py-4 bg-white border dark:bg-gray-800 flex justify-between items-center">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faUserCircle} className="w-10 h-10 text-blue-500" />
                    <div>
                      <p className="font-semibold text-lg">{notification.sender}</p>
                      <p className="text-gray-500 text-sm">to me</p>
                    </div>
                  </div>
                  <p className="text-gray-700">{notification.message}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm">{notification.date}</p>
                  <p className="text-gray-500 text-sm">{notification.time}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full dark:bg-black">
            <h2 className="text-lg font-semibold mb-4">Notification</h2>
            <div className="space-y-4">
              <input type="text" placeholder="From" className="w-full border p-2 rounded" />
              <input type="text" placeholder="To" className="w-full border p-2 rounded" />
              <input type="text" placeholder="Subject" className="w-full border p-2 rounded" />
              <input type="text" placeholder="Includes the words" className="w-full border p-2 rounded" />
              <input type="text" placeholder="Doesn't have" className="w-full border p-2 rounded" />
              <div className="flex space-x-2">
                <input type="number" placeholder="Size greater than" className="w-1/2 border p-2 rounded" />
                <span>MB</span>
              </div>
              <input type="text" placeholder="Date within" className="w-full border p-2 rounded" />
              <div className="flex space-x-2">
                <label><input type="checkbox" className="mr-2" /> Has attachment</label>
                <label><input type="checkbox" className="mr-2" /> Don't include chats</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button onClick={() => setFilterOpen(false)} className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 text-white">Cancel</button>
              <button onClick={() => setFilterOpen(false)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Search</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
