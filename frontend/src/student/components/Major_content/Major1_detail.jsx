import { useState } from "react";
import { FaEdit } from "react-icons/fa";
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
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const weeklyData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Tasks Completed",
        data: [3, 5, 2, 4],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",  // Color for Week 1
          "rgba(54, 162, 235, 0.6)",  // Color for Week 2
          "rgba(255, 206, 86, 0.6)",  // Color for Week 3
          "rgba(75, 192, 192, 0.6)",  // Color for Week 4
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",  // Border color for Week 1
          "rgba(54, 162, 235, 1)",  // Border color for Week 2
          "rgba(255, 206, 86, 1)",  // Border color for Week 3
          "rgba(75, 192, 192, 1)",  // Border color for Week 4
        ],
        borderWidth: 1,
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

  const [activeTab, setActiveTab] = useState("sem7");

  return (
    <div className="ml-64 w-1200 mt-2 rounded-lg mr-1">
      {/* Buttons */}
      <div className="flex">
        <button
          onClick={() => setActiveTab("sem7")}
          className={`px-4 py-2 border ${activeTab === "sem7"
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-gray-200 text-gray-800 border-gray-300"
            }`}
        >
          Sem-7
        </button>
        <button
          onClick={() => setActiveTab("sem8")}
          className={`px-4 py-2 border ${activeTab === "sem8"
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-gray-200 text-gray-800 border-gray-300"
            }`}
        >
          Sem-8
        </button>
      </div>

      {/* Content */}
      <div className="mt-6 p-4 bg-white shadow rounded w-full dark:bg-gray-700 dark:text-gray-300">
        {activeTab === "sem7" && (
          <div>
            <div className="space-y-7 mb-2">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Project Name
              </h1>
            </div>
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative mb-2">
              <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                Project Details
              </legend>
              <button className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none">
                <FaEdit className="h-6 w-6" />
              </button>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Name:{" "}
                <span className="font-medium">Project Space: A comprehensive web framework to manage academic projects by using genetic algorithm and machine learning</span>
              </p>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Abstract:{" "}
                <span className="font-medium">An automated web-based system is designed to simplify the process of project group formation, research domain selection, and guide allocation for undergraduate projects. It allows students to submit group details, domain preferences, and guide choices online, reducing dependency on manual forms and spreadsheets. By automating guide assignment based on preferences and expertise, the system minimizes errors, enhances efficiency, and ensures fair and accurate allocation. It also provides project coordinators with an organized platform for managing data, reducing administrative workload, and preventing data loss. Ultimately, the system fosters better collaboration and contributes to improved academic experiences and outcomes for all stakeholders.</span>
              </p>
            </fieldset>
            {/* Group Details */}
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative mb-2">
              <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                Group Details
              </legend>
              <button
                className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none"
              >
                <FaEdit className="h-6 w-6" />
              </button>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Guide: <span className="font-medium">Prof. Vishal Badgujar</span>
              </p>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Co-Guide: <span className="font-medium">Prof. Seema Jadhav</span>
              </p>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Leader: <span className="font-medium">Prakruti Bhavsar</span>
              </p>
              <p className="text-gray-700 dark:text-gray-400 font-bold">Members:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-400">
                <li>Nimisha Idekar</li>
                <li>Akanksha Bhoir</li>
                <li>Payal Gupta</li>
              </ul>
            </fieldset>
            {/* Status Section */}
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 mb-2">
              <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                Status
              </legend>
              <div className="flex justify-between items-start space-x-4">
                <div className="w-1/2">
                  <Bar data={weeklyData} options={options} />
                </div>
                <div className="flex flex-col space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-400">PPT</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-400">Black Report</span>
                  </label>
                </div>
              </div>
            </fieldset>
            {/* task content */}
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 mb-2">
              <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                Tasks
              </legend>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-gray-300 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        Week
                      </th>
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        Task
                      </th>
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.map((task, index) => (
                      <tr
                        key={index}
                        className={`border-t dark:border-gray-700 ${task.status === "pending"
                          ? "bg-red-100 dark:bg-red-900"
                          : "bg-green-100 dark:bg-green-900"
                          }`}
                      >
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400">
                          {task.week}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400">
                          {task.task}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400">
                          <button
                            onClick={() => toggleStatus(index)}
                            className={`px-2 py-1 rounded ${task.status === "pending"
                              ? "bg-red-500 text-white"
                              : "bg-green-500 text-white"
                              }`}
                          >
                            {task.status === "pending" ? "Mark Completed" : "Completed"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </fieldset>
          </div>

        )}
        {activeTab === "sem8" && (
          <div>
            <div className="space-y-7 mb-2">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Project Name
              </h1>
            </div>
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative mb-2">
              <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                Project Details
              </legend>
              <button className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none">
                <FaEdit className="h-6 w-6" />
              </button>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Name:{" "}
                <span className="font-medium">Project Space: A comprehensive web framework to manage academic projects by using genetic algorithm and machine learning</span>
              </p>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Abstract:{" "}
                <span className="font-medium">An automated web-based system is designed to simplify the process of project group formation, research domain selection, and guide allocation for undergraduate projects. It allows students to submit group details, domain preferences, and guide choices online, reducing dependency on manual forms and spreadsheets. By automating guide assignment based on preferences and expertise, the system minimizes errors, enhances efficiency, and ensures fair and accurate allocation. It also provides project coordinators with an organized platform for managing data, reducing administrative workload, and preventing data loss. Ultimately, the system fosters better collaboration and contributes to improved academic experiences and outcomes for all stakeholders.</span>
              </p>
            </fieldset>
            {/* Group Details */}
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative mb-2">
              <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                Group Details
              </legend>
              <button
                className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none"
              >
                <FaEdit className="h-6 w-6" />
              </button>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Guide: <span className="font-medium">Prof. Vishal Badgujar</span>
              </p>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Co-Guide: <span className="font-medium">Prof. Seema Jadhav</span>
              </p>
              <p className="text-gray-700 dark:text-gray-400 font-bold">
                Leader: <span className="font-medium">Prakruti Bhavsar</span>
              </p>
              <p className="text-gray-700 dark:text-gray-400 font-bold">Members:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-400">
                <li>Nimisha Idekar</li>
                <li>Akanksha Bhoir</li>
                <li>Payal Gupta</li>
              </ul>
            </fieldset>
            {/* Status Section */}
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 mb-2">
              <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                Status
              </legend>
              <div className="flex justify-between items-start space-x-4">
                <div className="w-1/2">
                  <Bar data={weeklyData} options={options} />
                </div>
                <div className="flex flex-col space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-400">PPT</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-400">Black Report</span>
                  </label>
                </div>
              </div>
            </fieldset>
            {/* task content */}
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 mb-2">
              <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                Tasks
              </legend>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-gray-300 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        Week
                      </th>
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        Task
                      </th>
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.map((task, index) => (
                      <tr
                        key={index}
                        className={`border-t dark:border-gray-700 ${task.status === "pending"
                          ? "bg-red-100 dark:bg-red-900"
                          : "bg-green-100 dark:bg-green-900"
                          }`}
                      >
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400">
                          {task.week}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400">
                          {task.task}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400">
                          <button
                            onClick={() => toggleStatus(index)}
                            className={`px-2 py-1 rounded ${task.status === "pending"
                              ? "bg-red-500 text-white"
                              : "bg-green-500 text-white"
                              }`}
                          >
                            {task.status === "pending" ? "Mark Completed" : "Completed"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </fieldset>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
