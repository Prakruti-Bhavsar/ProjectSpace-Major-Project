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
import { FaEdit } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Bully_detail = () => {
  const weeklyData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
    datasets: [
      {
        label: "Tasks Completed",
        data: [10, 50, 20, 40, 45, 60, 70],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Progress",
      },
    },
  };

  const [tasks, setTasks] = useState([
    { week: "Week 1", task: "Complete project proposal", status: "pending" },
    { week: "Week 2", task: "Prepare PPT", status: "completed" },
    { week: "Week 3", task: "Submit report", status: "pending" },
    { week: "Week 4", task: "Finalize project", status: "completed" },
  ]);

  const toggleStatus = (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].status =
      updatedTasks[index].status === "pending" ? "completed" : "pending";
    setTasks(updatedTasks);
  };

  const sortedTasks = tasks.sort((a, b) =>
    a.status === "pending" ? -1 : 1
  );

  const [showPopup, setShowPopup] = useState(false);
  const [projectDetails, setProjectDetails] = useState({
    name: "Bully Box: \"Stop Bullying, Report It Fully\"",
    abstract: "\"Bully Box\" is a safe and anonymous platform...",
  });
  const [tempDetails, setTempDetails] = useState(projectDetails);

  const handlePopupSubmit = () => {
    setProjectDetails(tempDetails); // Update details
    alert("Your request has been sent to your Guide");
    setShowPopup(false);
  };

  const [showGroupPopup, setShowGroupPopup] = useState(false);
  const [groupDetails, setGroupDetails] = useState({
    guide: "Prof. Sonal Balpande",
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
                Guide Name:
              </label>
              <input
                type="text"
                value={tempGroupDetails.guide}
                onChange={(e) =>
                  setTempGroupDetails({ ...tempGroupDetails, guide: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-800 dark:text-gray-200 mb-2">
                Co-Guide (Optional):
              </label>
              <input
                type="text"
                value={tempGroupDetails.coGuide}
                onChange={(e) =>
                  setTempGroupDetails({ ...tempGroupDetails, coGuide: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
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
      </fieldset>

      {/* Weekly Task */}
      <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700">
        <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
          Weekly Task
        </legend>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2 text-gray-800 dark:text-gray-200">
                  Week
                </th>
                <th className="border px-4 py-2 text-gray-800 dark:text-gray-200">
                  Task
                </th>
                <th className="border px-4 py-2 text-gray-800 dark:text-gray-200">
                  Status
                </th>
                <th className="border px-4 py-2 text-gray-800 dark:text-gray-200">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task, index) => (
                <tr
                  key={index}
                  className={
                    task.status === "pending"
                      ? "bg-yellow-100 dark:bg-yellow-900"
                      : "bg-green-100 dark:bg-green-900"
                  }
                >
                  <td className="border px-4 py-2 text-gray-800 dark:text-gray-200">
                    {task.week}
                  </td>
                  <td className="border px-4 py-2 text-gray-800 dark:text-gray-200">
                    {task.task}
                  </td>
                  <td className="border px-4 py-2 text-gray-800 dark:text-gray-200">
                    {task.status}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <button
                      onClick={() => toggleStatus(index)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                    >
                      Submit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>

      
    </div>
  );
};

export default Bully_detail;
