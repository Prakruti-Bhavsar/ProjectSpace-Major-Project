import { useState } from "react";
import { FaChevronDown, FaChevronRight, FaEdit, FaCheck, FaTimes, FaDownload, FaBook } from "react-icons/fa";

const ProjectDetailView = ({ project, onClose, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState("Project & Status");
  const [openTask, setOpenTask] = useState(null);
  const [openNotification, setOpenNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [remarks, setRemarks] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [taskDescription, setTaskDescription] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const defaultText = "Completed";

  const tabClasses = (tab) =>
    `px-6 py-3 text-lg font-medium transition border-b-4 ${
      activeTab === tab
        ? isDarkMode
          ? "border-green-400 text-green-300"
          : "border-blue-700 text-blue-700"
        : isDarkMode
        ? "border-gray-600 text-gray-400"
        : "border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-500"
    }`;

    const handleStatusChange = (week, taskIndex, status) => {
      setTaskStatuses((prevStatuses) => ({
        ...prevStatuses,
        [week]: {
          ...prevStatuses[week],
          [taskIndex]: status, // Only store one status per task
        },
      }));
    };
  
  


  const handleSubmit = () => {
    console.log("Submitting:", taskStatuses, remarks);
    setIsModalOpen(false);
    setRemarks("");
  };

  const taskData = [
    { week: "Week 1", tasks: ["To participate in project orientation conducted by department.", "To discuss feasibility of project ideas proposed with guide", "To present at least three topics as per the guidelines given by department"] },
    { week: "Week 2", tasks: ["To finalize project scope related to implementation.", "To ensure clear understanding of project background", "To decide technology stack on the basis of implementation scope."] },
    { week: "Week 3", tasks: ["To finalize and frame project objectives.", "To ensure in-depth literature survey related to topic finalized addressing department guidelines.", "To finalize project schedule of current semester taking into consideration department academic calendar."] }
  ];
  
  // New `taskStatus` array to map statuses to each task.
  const taskStatusesOptions = [
    ["Completed"], // Week 1 statuses
    ["Partially Completed"], // Week 2 statuses
    ["Not Completed"], // Week 3 statuses
  ];
  

  const handleViewSubmission = (week) => {
    setSelectedWeek(week);
    setCompletionPercentage(Math.floor(Math.random() * 101)); // Generate a random percentage
    setIsModalOpen(true);
  };

  return (
    <div className={`p-6 transition duration-300 ${isDarkMode ? "bg-[#121138] text-white" : "bg-white text-black"}`} style={{ maxHeight: "100vh", overflowY: "auto" }}>
      {/* Tabs */}
      <div className="flex border-b mb-9">
        {["Project & Status", "Task", "Notifications"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={tabClasses(tab)}>
            {tab}
          </button>
        ))}
      </div>
      {/* Project & Status Content */}
      {activeTab === "Project & Status" && project ? (
        <div className="space-y-6">
          {/* Project Details */}
          <div className={`relative p-6 border rounded-lg shadow-lg hover:shadow-xl transition-all ${isDarkMode ? "border-green-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
            <h3 className={`absolute -top-4 left-4 px-3 py-1 rounded-md ${isDarkMode ? "bg-[#121138] text-white" : "bg-gray-100 text-black"}`}>Project Details</h3>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-lg font-semibold"><strong>Name:</strong> {project.name || "N/A"}</p>
              <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all">
                Edit
              </button>
            </div>
            <p className="mt-2 text-white-600 dark:text-gray-400"><strong>Abstract:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.</p>
          </div>

          {/* Group Details */}
          <div className={`relative p-6 border rounded-lg shadow-lg hover:shadow-xl transition-all ${isDarkMode ? "border-green-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
            <h3 className={`absolute -top-4 left-4 px-3 py-1 rounded-md ${isDarkMode ? "bg-[#121138] text-white" : "bg-gray-100 text-black"}`}>Group Details</h3>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-lg font-semibold"><strong>Guide:</strong> Dr. Guide Name</p>
              <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all">
                Edit
              </button>
            </div>
            <p className="mt-2 text-white-600 dark:text-gray-400"><strong>Leader:</strong> {project.leader || "N/A"}</p>
            <p className="text-white-600 dark:text-gray-400"><strong>Members:</strong> Member 1, Member 2, Member 3</p>
          </div>

          {/* Status */}
          <div className={`relative p-6 border rounded-lg shadow-lg hover:shadow-xl transition-all ${isDarkMode ? "border-green-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
            <h3 className={`absolute -top-4 left-4 px-3 py-1 rounded-md ${isDarkMode ? "bg-[#121138] text-white" : "bg-gray-100 text-black"}`}>Status</h3>
            <div className="mt-4">
              
            </div>
          </div>
        </div>
      ) : null}

      {/* Task Tab */}
      {activeTab === "Task" && (
        <div className="space-y-4">
          {taskData.map((weekData, index) => (
            <div key={index} className={`p-4 border rounded-lg shadow-md ${isDarkMode ? "border-green-400" : "border-blue-700"}`}>
              <button className="w-full flex justify-between items-center text-lg font-semibold" onClick={() => setOpenTask(openTask === index ? null : index)}>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-500 text-gray-500">
                    {openTask === index ? <FaChevronDown /> : <FaChevronRight />}
                  </div>
                  <span>{weekData.week}</span>
                </div>
              </button>
              {openTask === index && (
                <div className="mt-2 space-y-2">
                  <ul className="list-decimal pl-6">
                    {weekData.tasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                  <div className="flex justify-end space-x-2 mt-2">
                    <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() =>  handleViewSubmission(weekData.week)}>
                      View Submission
                    </button>
                    <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Logbook</button>
                    <button className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Download</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "Notifications" && (
        <div className="space-y-4">
          {[{ subject: "Project Submission Update", content: "Your project submission deadline has been extended to 10 Feb 2025." },
            { subject: "Meeting Scheduled", content: "A meeting with your guide is scheduled for 05 Feb 2025 at 3:00 PM." },
            { subject: "Feedback Received", content: "Your initial submission has been reviewed. Check comments for improvements." }
          ].map((notification, index) => (
            <div key={index} className={`p-4 border rounded-lg shadow-md ${isDarkMode ? "border-green-400" : "border-blue-700"}`}>
              <button className="w-full flex justify-between items-center text-lg font-semibold" onClick={() => setOpenNotification(openNotification === index ? null : index)}>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-500 text-gray-500">
                    {openNotification === index ? <FaChevronDown /> : <FaChevronRight />}
                  </div>
                  <span>Subject: {notification.subject}</span>
                </div>
              </button>
              {openNotification === index && (
                <div className="mt-2">
                  <p>{notification.content}</p>
                  <div className="flex justify-end space-x-2 mt-2">
                    <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Accept</button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Reject</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Popup Modal for Submission */}
      {/* Submission Popup Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 h-[80vh] max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-4">{selectedWeek}</h2>
{/* Task Names with Status */}
{taskData
  .find((week) => week.week === selectedWeek)
  ?.tasks.map((task, i) => (
    <div key={i}>
    <div className="mb-2 flex justify-between items-center">
      <span className="font-medium">{task}</span> {/* Display task name */}
      
      <span
        className={`font-semibold ${
          taskStatusesOptions[i]?.[i] === "Completed"
            ? "text-green-500" : taskStatusesOptions[i]?.[i] === "Partially Completed"
            ? "text-gray-500" : "text-red-500"
        }`}
      >
        {taskStatusesOptions[i]} {/* Display correct status */}
      </span>
    </div>
    {taskStatusesOptions[i] == "Completed" || taskStatusesOptions[i] == "Partially Completed" ? (
                <div className="mt-4 flex items-start space-x-2">
                  <input
                    type="checkbox"
                    className="w-5 h-5 mt-1"
                    checked={isChecked}
                    onChange={() => setIsChecked(!isChecked)}
                  />
                  <textarea
                    className="w-full p-2 border rounded-md"
                    placeholder="Describe what is completed and what is not..."
                    value={taskDescription || defaultText}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    // readOnly // Read-only to make it non-editable
                  />
                </div>
              ) : null}
    </div>
  ))}


      {/* Checkbox & Description */}
      {/* <div className="mt-4 flex items-start space-x-2">
        <input
          type="checkbox"
          className="w-5 h-5 mt-1"
          checked={isChecked}
          onChange={() => setIsChecked(!isChecked)}
        />
        <textarea
          className="w-full p-2 border rounded-md"
          placeholder="Describe what is completed and what is not..."
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          readOnly // Read-only to make it non-editable
        />
      </div> */}

      {/* Remarks */}
      <div className="mb-4 mt-4">
        <p className="text-2xl font-semibold">Remarks:</p>
        <textarea
          className="w-full p-2 border rounded-md resize-none"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add remarks..."
          rows={4} // Adjustable size for the remarks box
        />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <p className="text-lg font-semibold">Completion:</p>
        <div className="w-full bg-gray-300 rounded-full h-5">
          <div
            className="bg-blue-500 h-5 rounded-full text-center text-xs text-white font-bold"
            style={{ width: `${completionPercentage}%` }}
          >
            {completionPercentage}%
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-4 mt-4">
        <button className="px-6 py-2 bg-red-500 text-white rounded-lg" onClick={() => setIsModalOpen(false)}>
          Cancel
        </button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg" onClick={() => setIsModalOpen(false)}>Submit</button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default ProjectDetailView;
