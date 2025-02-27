import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useState } from "react";
import { FaEdit, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Sproject = () => {
  const [reportCompleted, setReportCompleted] = useState(false);
  const [pptCompleted, setPptCompleted] = useState(false);

  const weeklyData = {
    labels: [
      "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", 
      "Week 7", "Week 8", "Week 9", "Week 10", "Week 11", "Week 12"
    ],
    datasets: [
      {
        label: "Tasks Completed",
        data: [10, 50, 20, 40, 45, 60, 70, 90, 100, 25, 55, 75], // Completion %
        backgroundColor: [
          "#5cc800", "#3B82F6", "#5cc800", "#3B82F6", "#5cc800", "#3B82F6",
          "#5cc800", "#3B82F6", "#5cc800", "#3B82F6", "#5cc800", "#3B82F6"
        ], // Alternating colors
        borderColor: "#FFFFFF",
        borderWidth: 1,
      },
    ],
  };
  
  const taskNames = [
    "Research", "Planning", "Design", "Development", "Testing",
    "Deployment", "Marketing", "Feedback", "Optimization",
    "QA Testing", "Final Review", "Launch"
  ]; // Task names for each week
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#4B5563", // Tailwind dark gray
        },
      },
      title: {
        display: true,
        text: "Weekly Progress of Project",
        position: "left",
        color: "#1F2937", // Tailwind darker gray
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => taskNames[tooltipItems[0].dataIndex], // Task name as title on hover
          label: (context) => `Completed: ${context.raw}%`, // Show completion percentage
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `${value}%`,
          color: "#4B5563", // Tailwind dark gray
        },
      },
      x: {
        ticks: {
          color: "#4B5563", // Tailwind dark gray
        },
      },
    },
  };

  const [tasks, setTasks] = useState([
    { id: 1, week: "Week 1", task: "Complete project proposal", submitted: false },
    { id: 2, week: "Week 2", task: "Prepare PPT", submitted: false },
    { id: 3, week: "Week 3", task: "Submit report", submitted: false },
    { id: 4, week: "Week 4", task: "Finalize project", submitted: false },
  ]);

  const handleSubmit = (taskId) => {
    alert("Your work is done. Notifying your guide!");

    // Move completed task to bottom
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, submitted: true } : task
      );
      return [...updatedTasks.filter(task => !task.submitted), ...updatedTasks.filter(task => task.submitted)];
    });
  };

  const [showPopup, setShowPopup] = useState(false);
  const [projectDetails, setProjectDetails] = useState({
    name: "ProjectPro: \"Smart Project Allocation and Management System\"",
    abstract: "\"ProjectPro\" streamlines project allocation by eliminating topic duplication, automating form distribution, and ensuring efficient guide assignment. With built-in progress tracking, it enhances transparency and reduces manual workload, making project management seamless.",
  });
  const [tempDetails, setTempDetails] = useState(projectDetails);

  const handlePopupSubmit = () => {
    alert("Your request has been sent to your Guide. Changes will reflect once approved.");
    setShowPopup(false);
  };



  const [showGroupPopup, setShowGroupPopup] = useState(false);
  const [groupDetails, setGroupDetails] = useState({
    guide: "Prof. Jayshree Jha",
    coGuide: "",
    leader: "Prakruti Bhavsar",
    members: ["Nimisha Idekar", "Akanksha Bhoir", "Payal Gupta"],
  });

  const [tempGroupDetails, setTempGroupDetails] = useState(groupDetails);

  const handleGroupPopupSubmit = () => {
    setGroupDetails(tempGroupDetails); // Update group details
    alert("Your request has been sent to your Guide");
    setShowGroupPopup(false);
  };




  return (
    <div className="ml-64 w-1200 rounded-lg mr-1 space-y-6">
      {/* Project Name */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Project Name
        </h1>
      </div>

      {/* Project Details */}
      <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative">
        <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
          Project Details
        </legend>
        <button
          onClick={() => {
            setTempDetails(projectDetails); // Set current details to temp before opening modal
            setShowPopup(true);
          }}
          className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none"
        >
          <FaEdit className="h-6 w-6" />
        </button>
        <p className="text-gray-700 dark:text-gray-400">
          Name:{" "}
          <span className="font-medium">{projectDetails.name}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-400">
          Abstract:{" "}
          <span className="font-medium">{projectDetails.abstract}</span>
        </p>
      </fieldset>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-1/2">
            <h2 className="text-xl font-semibold mb-4">Edit Project Details</h2>
            <div className="mb-4">
              <label className="block text-gray-800 dark:text-gray-200 mb-2">
                Name:
              </label>
              <input
                type="text"
                value={tempDetails.name}
                onChange={(e) =>
                  setTempDetails({ ...tempDetails, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-800 dark:text-gray-200 mb-2">
                Abstract:
              </label>
              <textarea
                value={tempDetails.abstract}
                onChange={(e) =>
                  setTempDetails({ ...tempDetails, abstract: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
                rows="4"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePopupSubmit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Group Details */}
      <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative">
        <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
          Group Details
        </legend>
        <button
          onClick={() => {
            setTempGroupDetails(groupDetails); // Reset temp details to current group details
            setShowGroupPopup(true);
          }}
          className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none"
        >
          <FaEdit className="h-6 w-6" />
        </button>
        <p className="text-gray-700 dark:text-gray-400">
          Guide: <span className="font-medium">{groupDetails.guide}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-400">
          Co-Guide: <span className="font-medium">{groupDetails.coGuide || "None"}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-400">
          Leader: <span className="font-medium">{groupDetails.leader}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-400">Members:</p>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-400">
          {groupDetails.members.map((member, index) => (
            <li key={index}>{member}</li>
          ))}
        </ul>
      </fieldset>

      {/* Group Edit Popup */}
      {showGroupPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Edit Group Details</h2>
            <div className="mb-4">
              <label className="block text-gray-800 dark:text-gray-200 mb-2">
                Leader Name:
              </label>
              <input
                type="text"
                value={tempGroupDetails.leader}
                onChange={(e) =>
                  setTempGroupDetails({ ...tempGroupDetails, leader: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-800 dark:text-gray-200 mb-2">
                Members (Comma Separated):
              </label>
              <input
                type="text"
                value={tempGroupDetails.members.join(", ")}
                onChange={(e) =>
                  setTempGroupDetails({
                    ...tempGroupDetails,
                    members: e.target.value.split(",").map((m) => m.trim()),
                  })
                }
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowGroupPopup(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleGroupPopupSubmit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Section */}
      <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700">
        <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
          Status
        </legend>
        <div className="flex justify-between items-start space-x-4">
          <div className="w-1/2">
            <Bar data={weeklyData} options={options} />
          </div>
        </div>
        <div className="flex flex-col space-y-4 mt-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="report"
              checked={reportCompleted}
              onChange={() => setReportCompleted(!reportCompleted)}
              className="hidden"
            />
            <label htmlFor="report" className="flex items-center space-x-2 cursor-pointer">
              {reportCompleted ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaTimesCircle className="text-red-500" />
              )}
              <span className="text-gray-800 dark:text-gray-200">Report Completed</span>
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ppt"
              checked={pptCompleted}
              onChange={() => setPptCompleted(!pptCompleted)}
              className="hidden"
            />
            <label htmlFor="ppt" className="flex items-center space-x-2 cursor-pointer">
              {pptCompleted ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaTimesCircle className="text-red-500" />
              )}
              <span className="text-gray-800 dark:text-gray-200">PPT Completed</span>
            </label>
          </div>
        </div>

      </fieldset>

      {/* Weekly Task */}
      <div>
        <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700">
          <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
            Weekly Task
          </legend>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-[#5cc800]">
                  <th className="border border-gray-300 p-2 text-white">Week</th>
                  <th className="border border-gray-300 p-2 text-white">Task</th>
                  <th className="border border-gray-300 p-2 text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border border-gray-300">
                    <td className="border border-gray-300 p-2">{task.week}</td>
                    <td className="border border-gray-300 p-2">{task.task}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <button
                        onClick={() => handleSubmit(task.id)}
                        className={`px-4 py-2 rounded ${task.submitted
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 text-white hover:bg-blue-700"
                          }`}
                      >
                        {task.submitted ? (
                          <>
                            <FaCheckCircle className="inline mr-1" /> Completed
                          </>
                        ) : (
                          "Submit"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>


      </div>
    </div>
  );
};

export default Sproject;
