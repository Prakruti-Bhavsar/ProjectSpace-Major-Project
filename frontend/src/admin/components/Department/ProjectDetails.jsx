import { useState } from "react";
import { FaFilter, FaDownload, FaPlus, FaUpload, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ProjectDetailView from "./ProjectDetailView"; // Import ProjectDetailView
import AxiosInstance from "../../../AxiosInstance";

const ProjectDetails = ({ selectedCategory, selectedYear, selectedSemester, onBack, isDarkMode, onDeptBack }) => {
  const [activeTab, setActiveTab] = useState("Projects");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentMode, setStudentMode] = useState("bulk");
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherMode, setTeacherMode] = useState("bulk");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [taskDescriptions, setTaskDescriptions] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [selectedYearForStudents, setSelectedYearForStudents] = useState(null); // For students' year selection
  const navigate = useNavigate();

  const [allocationResults, setAllocationResults] = useState([]);

  const handleOpenPDF = async () => {
    try {
      const response = await AxiosInstance.get("pdf/generate-pdf/", {
        responseType: "blob", // This ensures the response is treated as a binary file
      });
  
      // Create a Blob URL from the response data
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
  
      // Open the PDF in a new tab
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Error opening the PDF:", error);
    }
  };
  

  const handleGuideAllocation = () => {
    AxiosInstance
        .get(`guide-allocation/allocate_guides/`)
        .then((response) => {
              if (response && response.data) {
                setAllocationResults(response.data.allocations || []);
                console.log(allocationResults);
              } else {
                  console.error("Unexpected API response:", response);
              }
        })
        .catch((error) => {
            console.error("Error fetching guide allocation:", error);
        });
  };
  
 

  const handleDeptBack = () => {
    onDeptBack();
    navigate("/department");
  };

  const toggleManualAllocationTable = () => {
    const table = document.getElementById("manual-allocation-table");
    table.classList.toggle("hidden");
  };

 // Handle adding weekly tasks
 const handleAddWeeklyTask = () => {
  // const newTasks = [];
  // for (let i = 1; i <= taskCount; i++) {
  //   newTasks.push({
  //     week: i,
  //     task: taskDescriptions[i - 1] || `Task ${i}` // Use the task description or a default
  //   });
  // }
  const newTasks = [
    {week: "1", task:[
      "To participate in project orientation conducted by department.",
      "To discuss feasibility of project ideas proposed with guide.",
      "To present at least three topics as per the guidelines given by department."
    ]},
    { week: "2", task: [
        "To finalize project scope related to implementation.",
        "To ensure clear understanding of project background",
        "To decide technology stack on the basis of implementation scope."]
    },
    {
      week: "3", task: [
        "To finalize and frame project objectives.",
        "To ensure in-depth literature survey related to topic finalized addressing department guidelines.",
        "To finalize project schedule of current semester taking into consideration department academic calendar."]
    },

  ]
  setWeeklyTasks(newTasks);
  // setTaskCount(0); // Reset task count after adding
  // setTaskDescriptions([]);
  setShowTaskForm(false); // Reset task descriptions array
};

 // Handle input changes for task descriptions
 const handleTaskDescriptionChange = (index, value) => {
  const newDescriptions = [...taskDescriptions];
  newDescriptions[index] = value; // Update the task description at the given index
  setTaskDescriptions(newDescriptions);
};
  const handleDownload = async () => {
    try {
      const response = await AxiosInstance.get(
        "pdf/generate-excel/", // Replace with your actual endpoint
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
      link.setAttribute("download", "guide_allocation.xlsx"); // Set the file name

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

 // Save edited task name
 const handleSaveEdit = (index) => {
  const updatedTasks = [...weeklyTasks];
  updatedTasks[index].task = editedTaskName; // Update the task with the edited name
  setWeeklyTasks(updatedTasks);
  setIsEditing(null); // Reset the editing state
  setEditedTaskName(""); // Reset the edited task name
};

  return (
    <div className={`p-6 transition duration-300 ${isDarkMode ? "bg-[#121138] text-white" : "bg-white text-black"}`} style={{ maxHeight: "100vh", overflowY: "auto" }}>
      {/* Breadcrumb Navigation */}
      <p className="text-2xl mb-4 font-medium">
        <span className="text-red-500 cursor-pointer hover:underline" onClick={handleDeptBack}>{selectedCategory}</span> &gt;
        <span className="text-red-500 cursor-pointer hover:underline" onClick={onBack}>{selectedYear}</span> &gt;
        <span className="text-blue-500">{selectedSemester}</span>
      </p>

      {/* Show ProjectDetailView if a project is selected */}
      {selectedProject ? (
        <ProjectDetailView
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          isDarkMode={isDarkMode}
          selectedCategory={selectedCategory}
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b mb-4">
            {["Projects", "Operations", "Status"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-lg font-medium transition border-b-4 ${activeTab === tab ? (isDarkMode ? "border-green-400 text-green-300" : "border-blue-700 text-blue-700") : (isDarkMode ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-500")}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-[#2a2a40] text-white" : "bg-white text-black"}`}>
            {activeTab === "Projects" ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-3xl font-semibold">Projects</h2>
                  <FaFilter className={`cursor-pointer transition ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-black"}`} size={22} title="Filter Projects" />
                </div>

                {/* Division A and B Projects Table */}
                {/* {["A", "B"].map((division) => (
                  <div key={division} className="mb-6">
                    <h2 className="text-xl font-semibold">Division {division} Projects</h2>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className={`${isDarkMode ? (division === "A" ? "bg-green-600" : "bg-blue-600") : (division === "A" ? "bg-green-600" : "bg-blue-600")} text-white`}>
                          <th className="p-3 border border-gray-300">Group No.</th>
                          <th className="p-3 border border-gray-300">Name</th>
                          <th className="p-3 border border-gray-300">Leader</th>
                          <th className="p-3 border border-gray-300">Guide</th>
                          <th className="p-3 border border-gray-300">Co-Guide</th>
                          <th className="p-3 border border-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4].map((num) => (
                          <tr key={num} className={`${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}`}>
                            <td className="p-3 border border-gray-300">{num}</td>
                            <td className="p-3 border border-gray-300 underline cursor-pointer hover:text-blue-500 transition" onClick={() => setSelectedProject({
                              name: `Project ${division}-${num}`,
                              leader: `Leader ${num}`,
                              guide: `Dr. Guide ${num}`,
                              coGuide: `Prof. Co-Guide ${num}`,
                              status: num % 2 === 0 ? "Completed" : "Ongoing"
                            })}>
                              Project {division}-{num}
                            </td>
                            <td className="p-3 border border-gray-300">Leader {num}</td>
                            <td className="p-3 border border-gray-300">Dr. Guide {num}</td>
                            <td className="p-3 border border-gray-300">Prof. Co-Guide {num}</td>
                            <td className="p-3 border border-gray-300">{num % 2 === 0 ? "Completed" : "Ongoing"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))} */}
                <div className="mt-6">
                {allocationResults.length > 0 ? (
                    <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="border px-4 py-2">Group ID</th>
                                <th className="border px-4 py-2">Domain</th>
                                <th className="border px-4 py-2">Assigned Teacher</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allocationResults.map((result, index) => (
                                <tr key={index} className="hover:bg-gray-100">
                                    <td className="border px-4 py-2">{result.group_id}</td>
                                    <td className="border px-4 py-2">{result.domain}</td>
                                    <td className="border px-4 py-2">{result.teacher}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div>
                      {/* <p className="mt-4 text-gray-600">No allocation results yet.</p> */}
                      {["A", "B"].map((division) => (
                  <div key={division} className="mb-6">
                    <h2 className="text-xl font-semibold">Division {division} Projects</h2>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className={`${isDarkMode ? (division === "A" ? "bg-green-600" : "bg-blue-600") : (division === "A" ? "bg-green-600" : "bg-blue-600")} text-white`}>
                          <th className="p-3 border border-gray-300">Group No.</th>
                          <th className="p-3 border border-gray-300">Name</th>
                          <th className="p-3 border border-gray-300">Leader</th>
                          <th className="p-3 border border-gray-300">Guide</th>
                          <th className="p-3 border border-gray-300">Co-Guide</th>
                          <th className="p-3 border border-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4].map((num) => (
                          <tr key={num} className={`${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}`}>
                            <td className="p-3 border border-gray-300">{num}</td>
                            <td className="p-3 border border-gray-300 underline cursor-pointer hover:text-blue-500 transition" onClick={() => setSelectedProject({
                              name: `Project ${division}-${num}`,
                              leader: `Leader ${num}`,
                              guide: `Dr. Guide ${num}`,
                              coGuide: `Prof. Co-Guide ${num}`,
                              status: num % 2 === 0 ? "Completed" : "Ongoing"
                            })}>
                              Project {division}-{num}
                            </td>
                            <td className="p-3 border border-gray-300">Leader {num}</td>
                            <td className="p-3 border border-gray-300">Dr. Guide {num}</td>
                            <td className="p-3 border border-gray-300">Prof. Co-Guide {num}</td>
                            <td className="p-3 border border-gray-300">{num % 2 === 0 ? "Completed" : "Ongoing"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                    </div>
                    
                )}
            </div>
              </>
            ) : activeTab === "Operations" ? (
              <div className="space-y-6 mt-8">
                {/* Students Section */}
                <div className="border-l-4 rounded-lg shadow-md hover:shadow-xl transition-all border-green-500 p-6">
                  <h3 className="font-semibold text-xl">Students</h3>
                  <div className="flex justify-between mt-4">
                    <button className="bg-green-500 text-white py-2 px-2 w-20 rounded-lg" onClick={() => setShowStudentForm(true)}>
                      <FaPlus /> Add
                    </button>
                    <button className="bg-blue-500 text-white py-2 px-4 rounded-lg">
                      <FaUpload /> Upload
                    </button>
                    <button className="bg-gray-500 text-white py-2 px-4 rounded-lg flex items-center gap-2 group">
                      <FaDownload />
                      <span className="hidden group-hover:inline">Download</span>
                    </button>

                    {/* Form Popup for Students */}
                    {showStudentForm && (
                      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center`}>
                        <div className={`bg-white p-8 rounded-lg shadow-lg ${isDarkMode ? "text-white" : "text-black"}`} style={{ width: "600px" }}>
                          <button className="relative top-[-8px] right-[-520px] text-red-500" onClick={() => setShowStudentForm(false)}>
                            <FaTimes size={22} />
                          </button>
                          <h3 className="text-2xl font-semibold mb-4">Students</h3>

                          {/* Tabs for Student Form */}
                          <div className="flex mb-4 border-b-2">
                            <button
                              className={`px-6 py-2 font-medium ${studentMode === "bulk" ? "bg-blue-100 text-blue-500" : "bg-transparent text-black border-b-2 border-gray-300"}`}
                              onClick={() => setStudentMode("bulk")}
                            >
                              Bulk
                            </button>
                            <button
                              className={`px-6 py-2 font-medium ${studentMode === "single" ? "bg-blue-100 text-blue-500" : "bg-transparent text-black border-b-2 border-gray-300"}`}
                              onClick={() => setStudentMode("single")}
                            >
                              Single
                            </button>
                          </div>

                          {/* Bulk Tab Content */}
                          {studentMode === "bulk" && (
                            <div className="flex flex-col gap-6">
                              <div>
                                {["21-25", "22-26", "23-27", "24-28"].map((year) => (
                                  <label key={year} className="block">
                                    <input
                                      type="radio"
                                      name="year"
                                      value={year}
                                      className="mr-2"
                                      onChange={() => setSelectedYearForStudents(year)} // Set selected year for students
                                    />
                                    {year}
                                  </label>
                                ))}
                              </div>
                              {selectedYearForStudents && (
                                <div className="mt-4">
                                  <h4 className="font-semibold">List of Students</h4>
                                  {["Alice", "Bob", "Charlie", "David"].map((name, index) => (
                                    <label key={index} className="block">
                                      <input type="checkbox" defaultChecked className="mr-2" />
                                      {name} - {`ID-${index + 1}`}
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Single Tab Content */}
                          {studentMode === "single" && (
                            <div className="flex flex-col gap-6">
                              <input type="text" placeholder="Search by Moodle ID" className="p-2 border w-full mb-4" />
                              <div>
                                {["John", "Jane", "Mark"].map((name, index) => (
                                  <label key={index} className="block">
                                    <input type="radio" name="student" value={name} className="mr-2" />
                                    {name} - {`Moodle-${index + 1}`}
                                  </label>
                                ))}
                              </div>
                              <button className="bg-blue-500 text-white py-2 px-4 rounded-lg mt-6 w-full">
                                Register
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Teachers Section */}
                <div className="border-l-4 rounded-lg shadow-md hover:shadow-xl transition-all border-blue-500 p-6">
                  <h3 className="font-semibold text-xl">Teachers</h3>
                  <div className="flex justify-between mt-4">
                    <button className="bg-blue-500 text-white py-2 px-2 w-20 rounded-lg" onClick={() => setShowTeacherForm(true)}>
                      <FaPlus /> Add
                    </button>
                    <button className="bg-green-500 text-white py-2 px-4 rounded-lg">
                      <FaUpload /> Upload
                    </button>
                    <button className="bg-gray-500 text-white py-2 px-4 rounded-lg flex items-center gap-2 group">
                      <FaDownload />
                      <span className="hidden group-hover:inline">Download</span>
                    </button>

                    {/* Form Popup for Teachers */}
                    {showTeacherForm && (
                      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center`}>
                        <div className={`bg-white p-8 rounded-lg shadow-lg ${isDarkMode ? "text-white" : "text-black"}`} style={{ width: "600px" }}>
                          <button className="relative top-[-8px] right-[-520px] text-red-500" onClick={() => setShowTeacherForm(false)}>
                            <FaTimes size={22} />
                          </button>
                          <h3 className="text-2xl font-semibold mb-4">Teachers</h3>

                          {/* Tabs for Teacher Form */}
                          <div className="flex mb-4 border-b-2">
                            <button
                              className={`px-6 py-2 font-medium ${teacherMode === "bulk" ? "bg-blue-100 text-blue-500" : "bg-transparent text-black border-b-2 border-gray-300"}`}
                              onClick={() => setTeacherMode("bulk")}
                            >
                              Bulk
                            </button>
                            <button
                              className={`px-6 py-2 font-medium ${teacherMode === "single" ? "bg-blue-100 text-blue-500" : "bg-transparent text-black border-b-2 border-gray-300"}`}
                              onClick={() => setTeacherMode("single")}
                            >
                              Single
                            </button>
                          </div>

                          {/* Bulk Tab Content */}
                          {teacherMode === "bulk" && (
                            <div className="flex flex-col gap-6">
                              <div>
                                {["Dr. Alan", "Prof. Sarah"].map((teacher, index) => (
                                  <label key={index} className="block">
                                    <input type="checkbox" checked className="mr-2" />
                                    {teacher} - {`ID-${index + 1}`}
                                  </label>
                                ))}
                              </div>
                              <button className="bg-blue-500 text-white py-2 px-4 rounded-lg mt-6 w-full">
                                Register
                              </button>
                            </div>
                          )}

                          {/* Single Tab Content */}
                          {teacherMode === "single" && (
                            <div className="flex flex-col gap-6">
                              <input type="text" placeholder="Search by Moodle ID" className="p-2 border w-full mb-4" />
                              <div>
                                {["Dr. Jane", "Prof. Max"].map((teacher, index) => (
                                  <label key={index} className="block">
                                    <input type="radio" name="teacher" value={teacher} className="mr-2" />
                                    {teacher} - {`Moodle-${index + 1}`}
                                  </label>
                                ))}
                              </div>
                              <button className="bg-blue-500 text-white py-2 px-4 rounded-lg mt-6 w-full">
                                Register
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weekly Task Section */}
                <div className="border-l-4 rounded-lg shadow-md hover:shadow-xl transition-all border-yellow-500 p-6">
                  <h3 className="font-semibold text-xl">Weekly Task</h3>
                  <div className="flex justify-between mt-4">
                    <button className="bg-yellow-500 text-white py-2 px-2 w-20 rounded-lg" onClick={() => setShowTaskForm(true)}>
                      <FaPlus /> Add
                    </button>
                  </div>

                  {/* Form Popup for Weekly Task */}
                  {showTaskForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-10">
                      <div className={`bg-white p-8 rounded-lg shadow-lg ${isDarkMode ? "text-white" : "text-black"}`} style={{ width: "600px" }}>
                        <button className="relative top-[-8px] right-[-520px] text-red-500" onClick={() => setShowTaskForm(false)}>
                          <FaTimes size={22} />
                        </button>
                        <h3 className="text-2xl font-semibold mb-4">Task</h3>
                        <input
                          type="number"
                          value={taskCount}
                          onChange={(e) => setTaskCount(e.target.value)}
                          placeholder="Enter number of tasks"
                          className="p-2 border w-full mb-4"
                        />
                        {/* Input Fields for Task Names */}
                        {/* {taskCount > 0 && (
                          <div className="mt-6">
                            <h4 className="text-xl font-semibold mb-4">Task Names</h4>
                            {[...Array(Number(taskCount))].map((_, index) => (
                              <div key={index} className="mb-4">
                                <input
                                  type="text"
                                  placeholder={`Enter Task ${index + 1} Name`}
                                  value={taskDescriptions[index] || ""}
                                  onChange={(e) => handleTaskDescriptionChange(index, e.target.value)}
                                  className="p-2 border w-full"
                                />
                              </div>
                            ))}
                          </div>
                        )} */}
                        <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg" onClick={handleAddWeeklyTask}>
                          Add Tasks
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Display Weekly Tasks Table */}
                  {weeklyTasks.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xl font-semibold mb-4">Weekly Tasks</h4>
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className={`${isDarkMode ? "bg-yellow-600 text-white" : "bg-yellow-500 text-black"}`}>
                            <th className="p-3 border border-gray-300">Week</th>
                            <th className="p-3 border border-gray-300">Task</th>
                            <th className="p-3 border border-gray-300">Edit</th>
                            <th className="p-3 border border-gray-300">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeklyTasks.map((task, index) => (
                            <tr key={index} className={`${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}`}>
                              <td className="p-3 border border-gray-300">{task.week}</td>
                              <td className="p-3 border border-gray-300">
                                {Array.isArray(task.task) ? (
                                  task.task.map((t, index) => (
                                    <div key={index}>{index + 1}. {t}</div>
                                  ))) : task.task}
                              </td>
                              <td className="p-3 border border-gray-300">
                                <button className="bg-blue-500 text-white py-1 px-3 rounded-lg">Edit</button>
                              </td>
                              <td className="p-3 border border-gray-300">
                                <button className="bg-red-500 text-white py-1 px-3 rounded-lg">Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>                   {/* Display Guide allocation*/}
                   <div className="space-y-6 mt-8">
            <div className="border-l-4 rounded-lg shadow-md hover:shadow-xl transition-all border-purple-500 p-6">
              <h3 className="font-semibold text-xl mb-4">Guide Allocation</h3>
              <div className="grid grid-cols-2 gap-4 relative">
                <div className="flex flex-col gap-4">
                  <h4 className="text-lg font-semibold mb-3">Teachers</h4>
                  <button
                className="bg-purple-500 text-white py-2 px-4 rounded-lg w-80 hover:bg-purple-700"
               
              >
                Active Form
              </button>
                  <div className="flex gap-2">
                    <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700" onClick={handleGuideAllocation}>Guide Allocation</button>
                    <button
                  className="bg-yellow-500 text-white py-2 px-4 rounded-lg"
                  onClick={toggleManualAllocationTable}
                >
                  Manual Allocation
                </button>

                {/* Manual Allocation Table */}
                <div id="manual-allocation-table" className="hidden mt-4">
                  <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-3 border">Project Leader</th>
                        <th className="p-3 border">Guide Allocated</th>
                        <th className="p-3 border">Domain</th>
                        <th className="p-3 border"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3">Priyal Sharma</td>
                        <td className="p-3">Prof. Neha Kotak</td>
                        <td className="p-3">IOT</td>
                        <td className="p-3">
                          <button className="bg-green-500 text-white py-1 px-3 rounded-lg">Allocate</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">Minal Nair</td>
                        <td className="p-3">Prof. Sneha Patil</td>
                        <td className="p-3">Networking</td>
                        <td className="p-3">
                          <button className="bg-green-500 text-white py-1 px-3 rounded-lg">Allocate</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">Vinay Agarwal</td>
                        <td className="p-3">Prof. Vinay Bhave</td>
                        <td className="p-3">DevOps</td>
                        <td className="p-3">
                          <button className="bg-green-500 text-white py-1 px-3 rounded-lg">Allocate</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                    
                  </div>
                </div>
                 {/* Show Manual Allocation Form if the button is clicked */}
                 
                <div className="flex flex-col gap-4">
                  <h4 className="text-lg font-semibold mb-3">Students</h4>
                  <button className="bg-purple-500 text-white py-2 px-4 rounded-lg w-80 hover:bg-purple-700">Active Form</button>
                  <div className="flex gap-2">
                    <button className="bg-blue-500 text-white py-2 px-4 rounded-lg w-40 hover:bg-blue-700" onClick={handleOpenPDF}>PDF</button>
                    <button className="bg-yellow-500 text-white py-2 px-4 rounded-lg w-40 hover:bg-yellow-600" onClick={handleDownload}>Excel</button>
                  </div>
                </div>
                
              </div>
              
            </div>
          </div>
              </div>
            
            
            ) : (
              <div>
                {/* Add Status Content Here */}
                <h2 className="text-2xl font-semibold">Status Section</h2>
                <p>Content for Status will be added here.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectDetails;
