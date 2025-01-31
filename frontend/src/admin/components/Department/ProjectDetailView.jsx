import { useState } from "react";

const ProjectDetailView = ({ project, onClose, isDarkMode, selectedCategory, selectedYear, selectedSemester }) => {
  const [activeTab, setActiveTab] = useState("Project & Status");

  return (
    <div className={`p-6 transition duration-300 ${isDarkMode ? "bg-[#121138] text-white" : "bg-white text-black"}`} style={{ maxHeight: "100vh", overflowY: "auto" }}>
      {/* Breadcrumb Navigation */}
      {/* <p className="text-2xl mb-4 font-medium">
        <span className="text-red-500 cursor-pointer hover:underline" onClick={onClose}>{selectedCategory}</span> &gt;
        <span className="text-red-500 cursor-pointer hover:underline" onClick={onClose}>{selectedYear}</span> &gt;
        <span className="text-blue-500">{selectedSemester}</span>
      </p> */}

      {/* Tabs */}
      <div className="flex border-b mb-4">
        {["Project & Status", "Task", "Notifications"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-lg font-medium transition border-b-4 ${
              activeTab === tab
                ? `${isDarkMode ? "border-green-400 text-green-300" : "border-blue-700 text-blue-700"}`
                : `${isDarkMode ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-500"}`
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {activeTab === "Project & Status" && project ? (
        <div className="space-y-6">
          {/* Project Details */}
          <div className={`relative p-6 border rounded-lg shadow-md hover:shadow-xl transition-all ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
            <h3 className={`absolute -top-3 left-4 px-2 ${isDarkMode ? "bg-[#121138] text-white" : "bg-white text-black"}`}>Project Details</h3>
            <div className="mt-4">
              <p className="mb-2"><strong>Name:</strong> {project.name || "N/A"} <button className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer">Edit</button></p>
              <p><strong>Abstract:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          </div>

          {/* Group Details */}
          <div className={`relative p-6 border rounded-lg shadow-md hover:shadow-xl transition-all ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
            <h3 className={`absolute -top-3 left-4 px-2 ${isDarkMode ? "bg-[#121138] text-white" : "bg-white text-black"}`}>Group Details</h3>
            <div className="mt-4">
              <p className="mb-2"><strong>Guide:</strong> Dr. Guide Name <button className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer">Edit</button></p>
              <p><strong>Leader:</strong> {project.leader || "N/A"}</p>
              <p><strong>Members:</strong> Member 1, Member 2, Member 3</p>
            </div>
          </div>

          {/* Status */}
          <div className={`relative p-6 border rounded-lg shadow-md hover:shadow-xl transition-all ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
            <h3 className={`absolute -top-3 left-4 px-2 ${isDarkMode ? "bg-[#121138] text-white" : "bg-white text-black"}`}>Status</h3>
            <p className="mt-4">Status content will be added later.</p>
          </div>
        </div>
      ) : (
        <p className="text-lg font-semibold text-gray-400">No project selected.</p>
      )}

      {/* Close Button */}
      <button onClick={onClose} className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition">Close</button>
    </div>
  );
};

export default ProjectDetailView;
