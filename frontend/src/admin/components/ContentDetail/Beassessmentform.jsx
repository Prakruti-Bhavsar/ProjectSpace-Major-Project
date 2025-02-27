import React, { useState } from "react";
import { FaTimes } from "react-icons/fa"; // Import the close icon

const BeassessmentForm = ({ projectTitle, members, onClose, isDarkMode }) => {
  const [marks, setMarks] = useState({
    PresentationSkill: 0,
    Implementation: 0,
    Report: 0,
    scope: 0,
    teamwork: 0,
  });
  const [remarks, setRemarks] = useState(""); // Store remarks

  const handleMarksChange = (e) => {
    const { name, value } = e.target;
    // Ensure value is a number and between 0 and 5
    const numericValue = Math.max(0, Math.min(5, parseInt(value) || 0)); 
    setMarks((prev) => ({ ...prev, [name]: numericValue }));
  };

  const handleRemarksChange = (e) => {
    setRemarks(e.target.value);
  };

  const calculateTotal = () => {
    return Object.values(marks).reduce((sum, mark) => sum + parseInt(mark || 0), 0);
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 ${isDarkMode ? "bg-opacity-80" : "bg-opacity-50"}`}
    >
      <div
        className={`bg-white rounded-lg p-8 shadow-lg max-w-xl w-full ${
          isDarkMode ? "bg-[#02022b] text-white border-2 border-[#5cc800]" : "bg-white text-[#2c3e50] border-2 border-[#5cc800]"
        }`}
        style={{ maxHeight: "90vh", overflowY: "auto", position: "relative" }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 text-2xl text-gray-400 hover:text-red-500 ${isDarkMode ? 'hover:text-white' : ''} z-10`}
        >
          <FaTimes />
        </button>

        <h2 className="text-3xl font-bold mb-6">{`Group: ${projectTitle}`}</h2>

        {/* Display Members */}
        <div className="mb-6">
          <h3 className="text-lg font-medium">Group Members:</h3>
          <ul className="list-disc pl-5">
            {members.map((member, index) => (
              <li key={index} className="text-lg">{member}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          {[ 
            { label: "Presentation Skill", name: "PresentationSkill" },
            { label: "Implementation", name: "Implementation" },
            { label: "Quality of Report", name: "Report" },
            { label: "Coverage of objective & Scope", name: "scope" },
            { label: "Team Work", name: "teamwork" },
          ].map(({ label, name }) => (
            <div key={name} className="flex items-center space-x-4">
              <label className="w-3/4 text-lg font-medium">{label}:</label>
              <input
                type="number"
                name={name}
                value={marks[name]}
                onChange={handleMarksChange}
                max="5"
                min="0"
                className={`w-16 p-3 text-lg border rounded-md focus:outline-none ${isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"}`}
              />
              <span className="text-lg">/5</span>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center space-x-4 font-semibold text-lg">
            <span>Total:</span>
            <input
              type="text"
              value={`${calculateTotal()}/25`}
              readOnly
              className={`w-20 p-3 border rounded-md text-lg font-semibold focus:outline-none ${isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"}`}
            />
          </div>

          {/* Remarks Section */}
          <div className="flex items-center space-x-4 font-medium text-lg">
            <span>Remarks:</span>
            <textarea
              value={remarks}
              onChange={handleRemarksChange}
              placeholder="Enter remarks here..."
              className={`w-full p-4 text-lg border rounded-md focus:outline-none ${isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"}`}
              rows="4"
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              className={`px-6 py-3 rounded-md font-semibold text-lg ${
                isDarkMode ? "bg-[#707070] text-white hover:bg-[#333]" : "bg-[#707070] text-white hover:bg-[#333]"
              }`}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={`px-6 py-3 rounded-md font-semibold text-lg ${
                isDarkMode ? "bg-[#5cc800] text-white hover:bg-[#78f709]" : "bg-[#5cc800] text-white hover:bg-[#78f709]"
              }`}
              onClick={onClose} // Handle form submission logic here
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeassessmentForm;
