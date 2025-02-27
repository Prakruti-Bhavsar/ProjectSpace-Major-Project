import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AssessmentForm from "./AssessmentForm";

const ContentDetail = ({ isDarkMode }) => {
  const { year, event } = useParams();
  const [activeTab, setActiveTab] = useState("panel");
  const [isFormOpen, setFormOpen] = useState(false); // Track if the form is open
  const [selectedProject, setSelectedProject] = useState(null); // Store the selected project
  const navigate = useNavigate();
  const location = useLocation();
  const responseData = location.state || {};

  const handleNavigateToYearBox = () => {
    navigate("/assessment");
  };
    const handleEditButtonClick = (id) => {
        navigate(`/assessment/edit/${id}`,{state: responseData});
    };

      // Add button click handler
  const handleAddButtonClick = (projectTitle, members) => {
    console.log("Clicked:", projectTitle, members);
    setSelectedProject({ projectTitle, members }); // Set the project title and members
    setFormOpen(true); // Open the form
  };

   // Close the form
   const closeForm = () => {
    setFormOpen(false); // Close the form
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
          <span className="text-gray-600">{event || "Poster Presentation"}</span>
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
          <div>
            <div className="bottom-64 space-x-4">
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
            {responseData.panels && Object.keys(responseData.panels).length > 0 ? (
              Object.keys(responseData.panels).map((panel, index) => (
                <div key={index} className="mb-8">
                  <h3 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
                    Panel {index+1}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Teachers */}
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <h4 className="text-lg font-semibold mb-3">Teachers:</h4>
                      <ul className="space-y-2">
                        {responseData.panels[panel].map((teacher, idx) => (
                          <li key={idx}>{teacher}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Groups */}
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <h4 className="text-lg font-semibold mb-3">Student Groups:</h4>
                      {responseData.groups && responseData.groups[panel] ? (
                        <ul className="space-y-4">
                          {responseData.groups[panel].map((group, idx) => (
                            <li key={idx}>
                              <p className="font-medium">Group: {group.Group}</p>
                              <p>Domain: {group.Domain}</p>
                              <p>Guide: {group.Guide}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No groups assigned.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No panels found.</p>
            )}
          </div>
          ) : (
            // Assessment Tab Content
            <div>
              {responseData.groups && Object.keys(responseData.groups).length > 0 ? (
            Object.keys(responseData.groups).map((panel,index) => (
              <div key={panel} className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Panel {index+1}</h3>
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">Group</th>
                      <th className="border border-gray-300 p-2">Domain</th>
                      {/* <th className="border p-2">Guide</th> */}
                      <th className="border border-gray-300 p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseData.groups[panel].map((group, idx) => (
                      <tr key={idx} className="border">
                        <td className="border border-gray-300 p-2">{group.Group}</td>
                        <td className="border border-gray-300 p-2">{group.Domain}</td>
                        {/* <td className="border p-2">{group.Guide}</td> */}
                        <td className="border border-gray-300 p-2">
                          <button 
                            onClick={() =>
                              handleAddButtonClick(group.Group, group.Domain)
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
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No groups available for assessment.</p>
          )}

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
        <AssessmentForm
          projectTitle={selectedProject.projectTitle}
          members={selectedProject.members}
          onClose={closeForm}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default ContentDetail;
