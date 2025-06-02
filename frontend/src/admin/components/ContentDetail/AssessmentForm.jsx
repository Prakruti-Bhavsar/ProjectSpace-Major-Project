import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa"; // Import the close icon
import AxiosInstance from "../../../AxiosInstance";

const AssessmentForm = ({ projectTitle, members, groupId, eventId, onClose, isDarkMode }) => {
  // const [marks, setMarks] = useState({
  //   problemStatement: 0,
  //   objective: 0,
  //   methodology: 0,
  //   techStack: 0,
  //   presentation: 0,
  // });
  // const [remarks, setRemarks] = useState(""); // Store remarks

  const [rubrics, setRubrics] = useState([]);
  const [marks, setMarks] = useState({});
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    AxiosInstance.get(`/assessment/rubrics/?id=${eventId}`).then((res) => {
      setRubrics(res.data);
      // Initialize marks with 0 for each rubric
      const initialMarks = {};
      res.data.forEach((rubric) => {
        initialMarks[rubric.id] = 0;
      });
      setMarks(initialMarks);
    });
  }, []);

  const [readOnly, setReadOnly] = useState(false);

  const convertToMarksObject = (marksArray) => {
    return marksArray.reduce((acc, { rubric, marks }) => {
      acc[rubric] = marks;  // Create a key-value pair for rubric ID and marks
      return acc;
    }, {});
  };

  useEffect(() => {
    if (groupId && eventId) {
      AxiosInstance(`/project-assessment/get-assessment/?project=${groupId}&event=${eventId}`)
        .then((res) => {
          const data = res.data; 
          console.log(data); // Axios automatically parses JSON
          if (data.id) {
            setMarks(data.marks.reduce((acc, mark) => {
              acc[mark.rubric_id] = mark.marks;  // Reshaping the marks data to be used in the form
              return acc;
            }, {}));  // Reshape marks as needed
            setRemarks(data.remarks);
            setReadOnly(true);  // Disable editing when data is fetched
          } else {
            setReadOnly(false);
          }
        })
        .catch((error) => {
          console.error('Error fetching assessment data:', error);
          // You can set some error state or handle it as needed
        });
    }
  }, [groupId, eventId]);
  

  const handleMarksChange = (e, rubricId, maxMarks) => {
    const value = Math.max(0, Math.min(maxMarks, parseInt(e.target.value) || 0));
    setMarks((prev) => ({ ...prev, [rubricId]: value }));
  };

  const handleRemarksChange = (e) => {
    setRemarks(e.target.value);
  };

  const calculateTotal = () => {
    return Object.values(marks).reduce((sum, mark) => sum + parseInt(mark || 0), 0);
  };

  const calculateMaxTotal = () => {
    return rubrics.reduce((sum, rubric) => sum + rubric.max_marks, 0);
  };

  const handleSubmit = async () => {
    const payload = {
      project: groupId,      // ID of the project being assessed
      event: eventId,          // ID of the assessment event
      remarks: remarks,
      marks: Object.entries(marks).map(([rubricId, mark]) => ({
        rubric: parseInt(rubricId),
        marks: parseInt(mark),
      })),
    };
    console.log(payload);
    try {
      const response = await AxiosInstance.post("/project-assessment/", payload); // Adjust URL if needed
      console.log("Assessment saved:", response.data);
      onClose(); // optionally close modal after submission
    } catch (error) {
      console.error("Error submitting assessment:", error);
    }
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

        <h3 className="text-lg font-medium">{`Domain: ${members}`}</h3>

        <div className="space-y-6">
          {/* {[ 
            { label: "Problem Statement and Project Scope", name: "problemStatement" },
            { label: "Objective Well Defined", name: "objective" },
            { label: "Clarity of Methodology", name: "methodology" },
            { label: "Technology Stack Well Defined", name: "techStack" },
            { label: "Quality of Presentation (Poster) and Teamwork", name: "presentation" },
          ].map(({ label, name }) => (
            <div key={name} className="flex items-center space-x-4">
              <label className="w-3/4 text-lg font-medium">{label}:</label>
              <input
                type="number"
                name={name}
                value={marks[name]}
                onChange={handleMarksChange}
                onWheel={(e) => e.target.blur()}
                max="5"
                min="0"
                className={`w-16 p-3 text-lg border rounded-md focus:outline-none ${isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"}`}
              />
              <span className="text-lg">/5</span>
            </div>
          ))} */}
          {rubrics.map((rubric) => (
            <div key={rubric.id} className="flex items-center space-x-4">
              <label className="w-3/4 text-lg font-medium">{rubric.name}:</label>
              <input
                type="number"
                value={marks[rubric.id]}
                onChange={(e) => handleMarksChange(e, rubric.id, rubric.max_marks)}
                max={rubric.max_marks}
                onWheel={(e) => e.target.blur()}
                min={0}
                readOnly={readOnly}
                className={`w-16 p-3 text-lg border rounded-md ${isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"}`}
              />
              <span className="text-lg">/ {rubric.max_marks}</span>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center space-x-4 font-semibold text-lg">
            <span>Total:</span>
            <input
              type="text"
              value={`${calculateTotal()}/${calculateMaxTotal()}`}
              readOnly
              className={`w-20 p-3 border rounded-md text-lg font-semibold focus:outline-none ${isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]"}`}
            />
          </div>

          {/* Remarks Section */}
          <div className="flex items-center space-x-4 font-medium text-lg">
            <span>Remarks:</span>
            <textarea
              value={remarks}
              readOnly={readOnly}
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
              onClick={handleSubmit} // Handle form submission logic here
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentForm;
