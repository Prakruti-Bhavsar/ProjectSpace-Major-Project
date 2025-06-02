import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AssessmentForm from "./AssessmentForm";
import AxiosInstance from "../../../AxiosInstance";
const ContentDetail = ({isDarkMode }) => {
  const { year, event } = useParams();
  const [activeTab, setActiveTab] = useState("panel");
  const [isFormOpen, setFormOpen] = useState(false); // Track if the form is open
  const [selectedProject, setSelectedProject] = useState(null); // Store the selected project
  const navigate = useNavigate();
  const [responseData, setResponseData] = useState({});
  const [eventname, setEventName] = useState("");

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await AxiosInstance.get(`/event/${event}/event_detail/`);
        console.log(response.data);
        setEventName(response.data.event);
        setResponseData(response.data.panels);
        console.log(responseData);
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    };
  
    if (event) fetchEventData();
  }, [event]);

  const handleNavigateToYearBox = () => {
    navigate(-1);
  };
    const handleEditButtonClick = (id) => {
        navigate(`/assessment/edit/${id}`,{state: responseData});
    };

      // Add button click handler
  const handleAddButtonClick = (projectTitle, members, groupId) => {
    console.log("Clicked:", projectTitle, members, groupId);
    setSelectedProject({ projectTitle, members, groupId }); // Set the project title and members
    setFormOpen(true); // Open the form
  };

   // Close the form
   const closeForm = () => {
    setFormOpen(false); // Close the form
  };

//   const handleOpenPDF = async () => {
//     try {
//       const response = await AxiosInstance.get(`pdf/panel-excel/?panel=${responseData}`, 
//         { responseType: "blob" } // Ensure binary response
//       );

//       // Create a Blob URL from the response data
//       const pdfBlob = new Blob([response.data], { type: "application/pdf" });
//       const pdfUrl = window.URL.createObjectURL(pdfBlob);

//       // Open the PDF in a new tab
//       window.open(pdfUrl, "_blank");
//     } catch (error) {
//       console.error("Error opening the PDF:", error);
//     }
// };
const handleOpenPDF = async () => {
    try {
      const response = await AxiosInstance.get(
        `pdf/panel-excel/?id=${event}`, // Replace with your actual endpoint
        {
          responseType: "blob", // Important to handle binary data
        }
      );

      // Create a blob from the response
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a link element
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = `${eventname}_panel.xlsx`;
      link.setAttribute("download", filename); // Set the file name

      // Append to the document and trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };
  const handleAssessment = async () => {
    try {
      const response = await AxiosInstance.get(
        `pdf/assessment-report/?event_id=${event}`, // Replace with your actual endpoint
        {
          responseType: "blob", // Important to handle binary data
        }
      );

      // Create a blob from the response
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a link element
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = `${eventname}_assessment_report.xlsx`;
      link.setAttribute("download", filename); // Set the file name

      // Append to the document and trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };
  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode ? "bg-[#333335] text-white" : "bg-[#f9f9f9] text-[#2c3e50]"
      } pt-10`}
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
          <span className="text-gray-600">{eventname || "Poster Presentation"}</span>
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
                    onClick={() => handleEditButtonClick(event)}
                  >
                    Edit
                  </button>
                  <button
                    className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                      isDarkMode
                        ? "bg-[#5cc800] text-white hover:bg-[#78f709]"
                        : "bg-[#5cc800] text-white hover:bg-[#78f709]"
                    }`}
                    onClick={handleOpenPDF}
                  >
                    Download
                  </button>
              </div>
            {responseData && responseData.length > 0 ? (
              responseData.map((panelData, index) => (
                <div key={index} className="mb-8">
                  <h3 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
                    Panel {panelData.panel_number}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <div className="p-4 bg-gray-100 rounded-lg">
                      <h4 className="text-lg font-semibold mb-3">Teachers:</h4>
                      <ul className="space-y-2">
                      {panelData.panels && panelData.panels.length > 0 ? (
              panelData.panels.map((teacher, idx) => (
                <li key={idx}>Prof. {teacher}</li>
              ))
            ) : (
              <p className="text-gray-500">No teachers assigned.</p>
            )}
                      </ul>
                    </div>

                    <div className="p-4 bg-gray-100 rounded-lg">
                      <h4 className="text-lg font-semibold mb-3">Student Groups:</h4>
                      {panelData.groups && panelData.groups.length > 0 ? (
            <ul className="space-y-4">
              {panelData.groups.map((group, idx) => (
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
            <div>
              <div className="flex justify-end">
              <button
                    className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                      isDarkMode
                        ? "bg-[#5cc800] text-white hover:bg-[#78f709]"
                        : "bg-[#5cc800] text-white hover:bg-[#78f709]"
                    }`}
                    onClick={handleAssessment}
                  >
                    Download
                  </button>
                </div>
              {responseData && responseData.length > 0 ? (
            responseData.map((panelData, index) => (
              <div key={panelData.panel_number} className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Panel {panelData.panel_number}</h3>
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">Group</th>
                      <th className="border border-gray-300 p-2">Domain</th>

                      <th className="border border-gray-300 p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panelData.groups && panelData.groups.length > 0 ? (
            panelData.groups.map((group, idx) => (
              <tr key={idx} className="border">
                <td className="border border-gray-300 p-2">{group.Group}</td>
                <td className="border border-gray-300 p-2">{group.Domain}</td>
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() =>
                      handleAddButtonClick(group.Group, group.Domain, group.id)
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
            ))
          ) : (
            <tr>
              <td colSpan="3" className="border border-gray-300 p-2 text-center text-gray-500">
                No groups available for this panel.
              </td>
            </tr>
          )}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No groups available for assessment.</p>
          )}

              {/* <div className="text-center">
                <button
                  className={`py-2 px-6 rounded-lg font-semibold transition-all ${
                    isDarkMode
                      ? "bg-[#5CC800] text-white hover:bg-[#4caf50]"
                      : "bg-[#3498db] text-white hover:bg-[#1f78b4]"
                  }`}
                >
                  Submit
                </button>
              </div> */}
            </div>
          )}
        </div>
      </main>
      {/* Open the Assessment Form if the state is true */}
      {isFormOpen && (
        <AssessmentForm
          projectTitle={selectedProject.projectTitle}
          members={selectedProject.members}
          groupId={selectedProject.groupId}
          eventId={event}
          onClose={closeForm}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default ContentDetail;
