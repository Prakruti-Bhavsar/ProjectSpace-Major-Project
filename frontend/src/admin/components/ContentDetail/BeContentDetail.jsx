import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BeassessmentForm from "./Beassessmentform"; // Import the Assessment Form if needed

const BeContentDetail = ({ isDarkMode }) => {
  const { year, eventName } = useParams(); // Get the year and event name from URL
  const [activeTab, setActiveTab] = useState("panel");
  const [isFormOpen, setFormOpen] = useState(false); // Track if the form is open
  const [selectedProject, setSelectedProject] = useState(null); // Store the selected project
  const navigate = useNavigate();

  // Handle back navigation to the assessment page
  const handleNavigateToYearBox = () => {
    navigate("/assessment");
  };
  const handleEditButtonClick = (id) => {
    navigate(`/edit/${id}`);
};

  // Handle form close
  const closeForm = () => {
    setFormOpen(false);
  };

  // Add button click handler
  const handleAddButtonClick = (projectTitle, members) => {
    setSelectedProject({ projectTitle, members });
    setFormOpen(true); // Open the form
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode ? "bg-[#333335] text-white" : "bg-[#f9f9f9] text-[#2c3e50]"
      }`}
    >
      <main className="p-6">
        {/* Title Section */}
        <h2 className="text-3xl font-bold mb-6">Review Assessment</h2>
        <div
          className="text-2xl font-semibold flex items-center space-x-3 cursor-pointer"
          onClick={handleNavigateToYearBox}
        >
          <span>{`Year ${year}`}</span>
          <span className="text-gray-400">{">"}</span>
          <span className="text-gray-600">{eventName || "Final Review"}</span>
        </div>

        {/* Tabs */}
        <div className="flex justify-between items-center mb-6 mt-4">
          <div className="flex space-x-4">
            {["panel", "assessment"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-6 rounded-lg font-semibold shadow-md transition-all ${
                  activeTab === tab
                    ? isDarkMode
                      ? "bg-[#0a74da] text-white"
                      : "bg-[#3498db] text-white"
                    : isDarkMode
                    ? "bg-[#444] text-gray-300 hover:bg-[#0a74da] hover:text-white"
                    : "bg-[#e5e5e5] text-[#2c3e50] hover:bg-[#3498db] hover:text-white"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            isDarkMode ? "bg-[#2c2c2e]" : "bg-white"
          }`}
        >
          {activeTab === "panel" ? (
            <div className="space-y-10">
              {/* Panel 1 */}
              <div className="relative">
                <h3 className="text-2xl font-bold mb-6 border-b-2 border-gray-300 pb-2">
                  Panel 1
                </h3>
                {/* Edit & Download Buttons */}
                <div className="absolute bottom-64 right-0 space-x-4">
                <button
                    className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                      isDarkMode
                        ? "bg-[#fba02a] text-white hover:bg-[#fdb761]"
                        : "bg-[#fba02a] text-black hover:bg-[#fdb761]"
                    }`}
                    onClick={() => handleEditButtonClick(123)}
                  >
                    Edit
                  </button>
                  <button
                    className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                      isDarkMode
                        ? "bg-[#5cc800] text-white hover:bg-[#78f709]"
                        : "bg-[#5cc800] text-white hover:bg-[#78f709]"
                    }`}
                  >
                    Download
                  </button>
                </div>

                {/* Teachers and Student Groups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  {/* Teachers Section */}
                  <div
                    className={`p-4 rounded-lg ${
                      isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"
                    }`}
                  >
                    <h4 className="text-lg font-semibold mb-3">Teachers:</h4>
                    <ul className="space-y-2">
                      <li>Dr. John Smith</li>
                      <li>Prof. Emily Davis</li>
                    </ul>
                  </div>

                  {/* Student Groups Section */}
                  <div
                    className={`p-4 rounded-lg ${
                      isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"
                    }`}
                  >
                    <h4 className="text-lg font-semibold mb-3">Student Groups:</h4>
                    <ul className="space-y-4">
                      <li>
                        <p className="font-medium">Project Title: AI in Healthcare</p>
                        <p>Guide: Dr. John Smith</p>
                        <p>Co-Guide: Dr. Emily Davis</p>
                      </li>
                      <li>
                        <p className="font-medium">Project Title: Sustainable Architecture</p>
                        <p>Guide: Prof. Emily Davis</p>
                        <p>Co-Guide: Dr. John Smith</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Panel 2 */}
              <div>
                <h3 className="text-2xl font-bold mb-6 border-b-2 border-gray-300 pb-2">
                  Panel 2
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Teachers Section */}
                  <div
                    className={`p-4 rounded-lg ${
                      isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"
                    }`}
                  >
                    <h4 className="text-lg font-semibold mb-3">Teachers:</h4>
                    <ul className="space-y-2">
                      <li>Dr. Alan Walker</li>
                      <li>Prof. Sarah Lee</li>
                    </ul>
                  </div>

                  {/* Student Groups Section */}
                  <div
                    className={`p-4 rounded-lg ${
                      isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"
                    }`}
                  >
                    <h4 className="text-lg font-semibold mb-3">Student Groups:</h4>
                    <ul className="space-y-4">
                      <li>
                        <p className="font-medium">Project Title: Renewable Energy Systems</p>
                        <p>Guide: Dr. Alan Walker</p>
                        <p>Co-Guide: Prof. Sarah Lee</p>
                      </li>
                      <li>
                        <p className="font-medium">Project Title: Blockchain in Finance</p>
                        <p>Guide: Prof. Sarah Lee</p>
                        <p>Co-Guide: Dr. Alan Walker</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
              // Assessment Tab Content
              <div>
              {/* Panel 1 Table */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Panel 1</h3>
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">Project</th>
                      <th className="border border-gray-300 p-2">Members</th>
                      <th className="border border-gray-300 p-2">Grades</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">AI in Healthcare</td>
                      <td className="border border-gray-300 p-2">John, Emma</td>
                      <td className="border border-gray-300 p-2">
                        <button
                          onClick={() =>
                            handleAddButtonClick("AI in Healthcare", ["John", "Emma"])
                          }
                          className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                            isDarkMode
                              ? "bg-[#fba02a] text-white hover:bg-[#ffa943]"
                              : "bg-[#fba02a] text-black hover:bg-[#ffbf71]"
                          }`}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Sustainable Architecture</td>
                      <td className="border border-gray-300 p-2">Alice, Bob</td>
                      <td className="border border-gray-300 p-2">
                        <button
                          onClick={() =>
                            handleAddButtonClick("Sustainable Architecture", ["Alice", "Bob"])
                          }
                          className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                            isDarkMode
                              ? "bg-[#fba02a] text-white hover:bg-[#ffa943]"
                              : "bg-[#fba02a] text-black hover:bg-[#ffbf71]"
                          }`}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Panel 2 Table */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Panel 2</h3>
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">Project</th>
                      <th className="border border-gray-300 p-2">Members</th>
                      <th className="border border-gray-300 p-2">Grades</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">Renewable Energy Systems</td>
                      <td className="border border-gray-300 p-2">Dave, Mike</td>
                      <td className="border border-gray-300 p-2">
                        <button
                        onClick={() =>
                          handleAddButtonClick("Renewable Energy Systems", ["Dave", "Mike"])
                        }
                          className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                            isDarkMode
                              ? "bg-[#fba02a] text-white hover:bg-[#ffa943]"
                              : "bg-[#fba02a] text-black hover:bg-[#ffbf71]"
                          }`}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Blockchain in Finance</td>
                      <td className="border border-gray-300 p-2">Sarah, Lee</td>
                      <td className="border border-gray-300 p-2">
                        <button
                        onClick={() =>
                          handleAddButtonClick("Blockchain in Finance", ["sarah", "Lee"])
                        }
                          className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                            isDarkMode
                              ? "bg-[#fba02a] text-white hover:bg-[#ffa943]"
                              : "bg-[#fba02a] text-black hover:bg-[#ffbf71]"
                          }`}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  className={`py-2 px-6 rounded-lg font-semibold transition-all ${
                    isDarkMode
                      ? "bg-[#5CC800] text-white hover:bg-[#4caf50]"
                      : "bg-[#3498db] text-white hover:bg-[#1f78b4]"
                  }`}
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Open the Assessment Form if the state is true */}
      {isFormOpen && (
        <BeassessmentForm
          projectTitle={selectedProject.projectTitle}
          members={selectedProject.members}
          onClose={closeForm}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default BeContentDetail;
