import { useState, useEffect } from "react";
import { FaChevronDown, FaChevronRight, FaEdit, FaCheck, FaTimes, FaDownload, FaBook } from "react-icons/fa";
import AxiosInstance from "../../../AxiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ProjectDetailView = ({ initialProject, onClose, isDarkMode }) => {
  const { category, year, semester} = useParams();
  const [activeTab, setActiveTab] = useState("Project & Status");
  const [openTask, setOpenTask] = useState(null);
  const [openNotification, setOpenNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [remarks, setRemarks] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [taskDescription, setTaskDescription] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const defaultText = "Completed";
  const [checkedItems, setCheckedItems] = useState({});
  const [savedData, setSavedData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const navigate = useNavigate();

  
  const location = useLocation();
  // Use project from props if available, otherwise use location.state
  const [project, setProject] = useState(location.state || null);
  
  useEffect(() => {
    if (location.state) {
      setProject(location.state);
    }
  }, [location.state]);

  const [projectdata, setProjectData] = useState();
  const fetchProject = async () => {
    try {
      const response = await AxiosInstance.get(`/projects/${project.group}/get_project_pk/`, {
      });
      console.log(response.data);
      setProjectData(response.data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    AxiosInstance.get(`/teacher/visibility/?id=${project.group}`).then(res => {
      setIsChecked(res.data);
      console.log(res.data);
    });
    
  }, [project]);
  // 2. Call the fetch function inside useEffect
  useEffect(() => {
    fetchProject();
  }, []); 

  // useEffect(() => {
  //   if (project) {
  //     AxiosInstance.get(`/projects/get_project/?category=${category}&year=${year}&sem=${semester}&group=${project.group}`)  // Adjust API endpoint accordingly
  //       .then((data) => setProjectData(data.data))
  //       .catch((err) => console.error("Error fetching project details:", err.response.data.error));
  //   }
  // }, [project,category,year,semester]);

  if (!project) {
    return <p className="text-center text-gray-500 dark:text-gray-300">Loading project details...</p>;
  }

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
    "Week1", "Week2", "Week3", "Week4", "Week5",
    "Week6", "Week7", "Week8",
    "Week9", "Week10", "Week11"
  ]; // Task names for each week

  // const options = {
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       position: "top",
  //       labels: {
  //         color: "#4B5563", // Tailwind dark gray
  //       },
  //     },
  //     title: {
  //       display: true,
  //       text: "Weekly Progress of Project",
  //       position: "left",
  //       color: "#1F2937", // Tailwind darker gray
  //       font: {
  //         size: 16,
  //       },
  //     },
  //     tooltip: {
  //       callbacks: {
  //         title: (tooltipItems) => taskNames[tooltipItems[0].dataIndex], // Task name as title on hover
  //         label: (context) => `Completed: ${context.raw}%`, // Show completion percentage
  //       },
  //     },
  //   },
  //   scales: {
  //     y: {
  //       ticks: {
  //         callback: (value) => `${value}%`,
  //         color: "#4B5563", // Tailwind dark gray
  //       },
  //     },
  //     x: {
  //       ticks: {
  //         color: "#4B5563", // Tailwind dark gray
  //       },
  //     },
  //   },
  // };
  const [sem7Data, setSem7Data] = useState(null);
  const [sem8Data, setSem8Data] = useState(null);
  const [currentTab, setCurrentTab] = useState("Sem 7");

  useEffect(() => {
    if (semester === "Major Project") {
      AxiosInstance.get(`/projects/weekly_progress_chart/?sem_new=sem_7&id=${project.group}`).then(res => {
        setSem7Data(formatChartData(res.data));
        console.log(res.data);
      });
      AxiosInstance.get(`/projects/weekly_progress_chart/?sem_new=sem_8&id=${project.group}`).then(res => {
        setSem8Data(formatChartData(res.data));
        console.log(res.data);
      });
    } else {
      AxiosInstance.get(`/projects/weekly_progress_chart/?id=${project.group}`).then(res => {
        setSem7Data(formatChartData(res.data));
        console.log(res.data); // reuse sem7Data for non-major
      });
    }
  }, [semester]);

  const formatChartData = ({ labels, data }) => ({
    labels,
    datasets: [
      {
        label: "Tasks Completed",
        data,
        backgroundColor: data.map((_, i) =>
          i % 2 === 0 ? "#5cc800" : "#3B82F6"
        ),
        borderColor: "#FFFFFF",
        borderWidth: 1,
      },
    ],
  });

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        position: "top",
        labels: { color: "#4B5563" },
      },
      title: {
        display: true,
        text: "Weekly Progress of Project",
        position: "left",
        color: "#1F2937",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context) => `Completed: ${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `${value}%`,
          color: "#4B5563",
        },
      },
      x: {
        ticks: {
          color: "#4B5563",
        },
      },
    },
  };

  const handleDateChange = (date) => {
    const formattedDate = date.toISOString().split("T")[0];
    console.log(formattedDate);
    setSelectedDate(date);
  };

  const handleSliderChange = (event) => {
    setCompletionPercentage(event.target.value); // Update completion percentage when the slider is changed
  };

  const handleCheckboxChange = (index) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index], // Toggle the specific checkbox state
    }));
  };

  const handleTextareaChange = (index, value) => {
    const updatedDescription = [...taskDescription];
    updatedDescription[index] = value; // Update the description for the specific task
    setTaskDescription(updatedDescription); 
  };

  const tabClasses = (tab) =>
    `px-6 py-3 text-lg font-medium transition border-b-4 ${activeTab === tab
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

  const handleDownload = async (weekId, projectId) => {
    try {
      const response = await AxiosInstance.post("pdf/generate-logbook-page-pdf/", { week_id: weekId, project_id: projectId }, {
        responseType: "blob",
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

  const handleLogbookDownload = async () => {
    try {  
      const response = await AxiosInstance.get(`pdf/generate-logbook-pdf/?id=${project.group}&sem_new=${currentSem}`, {
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



  // const handleSubmit = () => {
  //   console.log(taskDescription);
  //   const newData = {
  //     week: selectedWeek,
  //     tasks: taskData.find((week) => week.week === selectedWeek)?.tasks.map((task, i) => ({
  //       taskName: task,
  //       status: taskStatusesOptions[i],
  //       isChecked: checkedItems[i] || false,
  //       description: taskDescription[i] || "",
  //     })),
  //     remarks,
  //     completionPercentage,
  //     selectedDate,
  //   };

  //   setSavedData(newData); // ✅ Store data in useState
  //   console.log("Saved Data:", newData);
  //   setTaskDescription({});
  //   setIsModalOpen(false);
  // };
  const handleSubmit = async () => {
    console.log(selectedDate);
    const selectedWeekData = taskData[currentSem].find((week) => week.week === selectedWeek);
    if (!selectedWeekData) {
      alert("No task data found for the selected week.");
      return;
    }
  
    const taskStatuses = selectedWeekData.tasks.map((task, index) => ({
      task_id: task.task_id, // ensure `task.id` is available
      details: taskDescription[index] || ""
    }));
  
    const payload = {
      project_id: project.group, // Replace with actual project ID
      week_id: selectedWeekData.id, // Ensure you have this from backend
      completion_percentage: parseInt(completionPercentage),
      remarks: remarks,
      date: selectedDate,
      task_statuses: taskStatuses
    };

    console.log(payload);
  
    try {
      const response = await AxiosInstance.post("/task/submit-logbook/", payload);
      console.log("Response:", response.data);
      alert("Task and progress saved successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving data:", error.response?.data || error.message);
      alert("An error occurred while saving. It may have already been submitted.");
    }
  };

  // const taskData = [
  //   { week: "Week 1", tasks: ["To participate in project orientation conducted by department.", "To discuss feasibility of project ideas proposed with guide", "To present at least three topics as per the guidelines given by department"] },
  //   { week: "Week 2", tasks: ["To finalize project scope related to implementation.", "To ensure clear understanding of project background", "To decide technology stack on the basis of implementation scope."] },
  //   { week: "Week 3", tasks: ["To finalize and frame project objectives.", "To ensure in-depth literature survey related to topic finalized addressing department guidelines.", "To finalize project schedule of current semester taking into consideration department academic calendar."] }
  // ];

  

  // const [taskData, setTaskData] =useState({})
  // useEffect(() => {
  //   const fetchTasks = async () => {
  //     try {
  //       const response = await AxiosInstance.get(`/projects/tasks/?id=${project.group}`);
  //       setTaskData(response.data);
  //       console.log(response.data);  // Update state with the fetched tasks
  //     } catch (error) {
  //       console.error('Error fetching tasks:', error);
  //     }
  //   };

  //   if (project.group) {
  //     fetchTasks();  // Fetch tasks when projectId is available
  //   }
  // }, [project.group]);
  const [taskData, setTaskData] = useState({ '7': [], '8': [] });
  const [currentSem, setCurrentSem] = useState('7');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        if (semester === "Major Project") {
          // Fetch both sem 7 and 8 together
          const [sem7Response, sem8Response] = await Promise.all([
            AxiosInstance.get(`/projects/tasks/?id=${project.group}&sem_new=sem_7`),
            AxiosInstance.get(`/projects/tasks/?id=${project.group}&sem_new=sem_8`),
          ]);
          console.log(sem7Response.data);
          console.log(sem8Response.data);
          setTaskData({
            '7': sem7Response.data,
            '8': sem8Response.data,
          });

          setCurrentSem('7'); // default to 7 initially
        } else {
          // Fetch normally
          const normalResponse = await AxiosInstance.get(`/projects/tasks/?id=${project.group}`);
          setTaskData({
            '7': normalResponse.data,
            '8': [],
          });

          setCurrentSem('7');
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (project.group) {
      fetchTasks();
    }
  }, [project.group]);

  useEffect(() => {
    if (isModalOpen && taskData.length > 0) {
      const initialDescriptions = taskData
        .find((week) => week.week === selectedWeek)
        ?.tasks.map((task) => task.details || ''); // Default to empty string if no details
      setTaskDescription(initialDescriptions || []);
    }
  }, [isModalOpen, selectedWeek, taskData]);
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

    const selectedWeekData = taskData[currentSem].find(w => w.week === week);

    if (selectedWeekData) {
      const initialDescriptions = {};
      selectedWeekData.tasks.forEach((task, index) => {
        initialDescriptions[index] = task.details || '';
      });
      setTaskDescription(initialDescriptions);
    }

  };

  return (
    <div className={`p-6 transition duration-300 ${isDarkMode ? "bg-[#121138] text-white" : "bg-white text-black"} pt-16`} style={{overflowY: "auto" }}>
      <p className="text-2xl mb-4 font-medium">
        <span
          className="text-red-500 cursor-pointer hover:underline"
          onClick={() => navigate(`/department`)}
        >
          {category}
        </span>
        &gt;
        <span
          className="text-red-500 cursor-pointer hover:underline"
          onClick={() => navigate(`/department/${category}/${year}/Semester`)}
        >
          {year}
        </span>
        &gt;
        <span
          className="text-red-500 cursor-pointer hover:underline"
          onClick={() => navigate(-1)}
        >
          {semester}
        </span>
        &gt;
        <span
          className="text-blue-500 cursor-pointer hover:underline"
          // onClick={() => navigate(`/department/${category}/${year}/${semester}/projects`)}
        >
          {project?.name || "Project"}
        </span>
      </p>
      {/* Tabs */}
      <div className="flex border-b mb-9">
        {["Project & Status", "Task"].map((tab) => (
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
              <p className="text-lg font-semibold"><strong>Name:</strong> {projectdata?.final_topic || ""}</p>
              {/* <p className="mt-2 text-white-600 dark:text-gray-400"><strong>Leader:</strong> {project.abstract || "N/A"}</p> */}
              {/* <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all">
                Edit
              </button> */}
            </div>
            <p className="mt-2 text-white-600 dark:text-gray-400"><strong>Abstract:</strong> {projectdata?.final_abstract || ""} </p>
          </div>

          {/* Group Details */}
          <div className={`relative p-6 border rounded-lg shadow-lg hover:shadow-xl transition-all ${isDarkMode ? "border-green-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
            <h3 className={`absolute -top-4 left-4 px-3 py-1 rounded-md ${isDarkMode ? "bg-[#121138] text-white" : "bg-gray-100 text-black"}`}>Group Details</h3>
            <div className="mt-4 flex items-center gap-x-16">
              <p className="text-lg font-semibold">Guide: {projectdata?.project_guide_name || ""}</p>
              <p className="text-lg font-semibold">Co-Guide: {projectdata?.project_co_guide_name || ""}</p>
              {/* <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all">
                Edit
              </button> */}
            </div>
            <p className="mt-2 text-white-600 dark:text-gray-400"><strong>Leader:</strong> {projectdata?.leader_name || ""}</p>
            <p className="text-white-600 dark:text-gray-400">
              <strong>Members:</strong> {projectdata?.members?.map(m => m).join(", ") || ""}
            </p>

            {/* {project.members && project.members.length > 0 && (
              <>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Phone Numbers:</strong>
                </p>
                <ul className="text-gray-600 dark:text-gray-400">
                  {project.members.map((member, index) => (
                    <li key={index}>
                      <strong>{member.name}:</strong>
                      <span className="text-blue-600 hover:underline cursor-pointer"> {member.phone}</span>
                    </li>
                  ))}
                </ul>
              </>
            )} */}
          </div>

          {/* Status */}
          <div>
          <fieldset className={`relative p-6 border rounded-lg shadow-lg hover:shadow-xl transition-all ${isDarkMode ? "border-green-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
              <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                Status
              </legend>
              <div className="flex justify-between items-start space-x-4">
                <div className="w-full">
      {semester === "Major Project" ? (
        <>
          <div className="flex space-x-4 mb-4">
            {["Sem 7", "Sem 8"].map((tab) => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-4 py-2 rounded ${
                  currentTab === tab ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {currentTab === "Sem 7" && sem7Data && (
            <div className="w-1/2">
              <Bar data={sem7Data} options={options} />
            </div>
          )}
          {currentTab === "Sem 8" && sem8Data && (
            <div className="w-1/2">
              <Bar data={sem8Data} options={options} />
            </div>
          )}
        </>
      ) : (
        sem7Data && (
          <div className="w-1/2">
            <Bar data={sem7Data} options={options} />
          </div>
        )
      )}
                </div>
              </div>
              {/* <div className="flex flex-col space-y-4 mt-4">
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
              </div> */}
            </fieldset>
          </div>
        </div>
      ) : null}

      {/* Task Tab */}
      {activeTab === "Task" && (
        <div className="space-y-4">
          {/* <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" onClick={() => handleLogbookDownload()}>Logbook</button> */}
          {/* {taskData.map((weekData, index) => (
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
                    <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" >
                      View Submission
                    </button>
                    <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"onClick={() => handleViewSubmission(weekData.week)}>Logbook</button>
                    <button className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"onClick={() => handleDownload()}>Download</button>
                  </div>
                </div>
              )}
            </div>
          ))} */}
          {semester === "Major Project" && (
  <div className="flex space-x-4 mb-4">
    <button
      className={`px-4 py-2 rounded ${currentSem === "7" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
      onClick={() => setCurrentSem("7")}
    >
      Sem 7
    </button>
    <button
      className={`px-4 py-2 rounded ${currentSem === "8" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
      onClick={() => setCurrentSem("8")}
    >
      Sem 8
    </button>
  </div>
)}

{loading ? (
  <div className="text-center text-gray-600">Loading tasks...</div>
) : (
  // taskData[currentSem].map((weekData, index) => (
  //   <div key={index} className={`p-4 border rounded-lg shadow-md ${isDarkMode ? "border-green-400" : "border-blue-700"}`}>
  //     <button className="w-full flex justify-between items-center text-lg font-semibold" onClick={() => setOpenTask(openTask === index ? null : index)}>
  //       <div className="flex items-center space-x-2">
  //         <div className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-500 text-gray-500">
  //           {openTask === index ? <FaChevronDown /> : <FaChevronRight />}
  //         </div>
  //         <span>{weekData.week}</span>
  //       </div>
  //     </button>
  //     {openTask === index && (
  //       <div className="mt-2 space-y-2">
  //         <ul className="list-decimal pl-6">
  //           {weekData.tasks.map((task, i) => (
  //             <li key={i}>{task.task}</li>
  //           ))}
  //         </ul>
  //         <div className="flex justify-end space-x-2 mt-2">
  //           <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" onClick={() => handleViewSubmission(weekData.week)} disabled={weekData.is_final}>
  //             Logbook
  //           </button>
  //           <button className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600" onClick={() => handleDownload(weekData.id, project.group)}>
  //             Download
  //           </button>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // ))
  <>
  <div className="flex justify-end mb-4">
    <button
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      onClick={() => handleLogbookDownload()}
    >
      Logbook
    </button>
  </div>

  {taskData[currentSem]?.map((weekData, index) => (
    <div
      key={index}
      className={`p-4 border rounded-lg shadow-md ${isDarkMode ? "border-green-400" : "border-blue-700"}`}
    >
      <button
        className="w-full flex justify-between items-center text-lg font-semibold"
        onClick={() => setOpenTask(openTask === index ? null : index)}
      >
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
              <li key={i}>{task.task}</li>
            ))}
          </ul>

          <div className="flex justify-end space-x-2 mt-2">
            <button
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => handleViewSubmission(weekData.week)}
              disabled={weekData.is_final || !isChecked}
            >
              Logbook
            </button>
            <button
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => handleDownload(weekData.id, project.group)}
              disabled={!weekData.is_final}
            >
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  ))}
</>
)}
          {/* {taskData.map((weekData, index) => (
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
            <li key={i}>{task.task}</li> 
          ))}
        </ul>
        <div className="flex justify-end space-x-2 mt-2">
          <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" onClick={() => handleViewSubmission(weekData.week)} disabled={weekData.is_final}>
            Logbook
          </button>
          <button className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600" onClick={() => handleDownload(weekData.id, project.group)}>
            Download
          </button>
        </div>
      </div>
    )}
  </div>
))} */}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "Notifications" && (
        <div className="space-y-4">
          {[{ subject: "Project Name Update Request", content: "Project Name : asdfg" },
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
      
      {/* Loop through the tasks for the selected week */}
      {taskData[currentSem]
        .find((week) => week.week === selectedWeek)
        ?.tasks.map((task, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">{task.task}</span> {/* Task name */}

              <span
                className={`font-semibold ${task.status === "Completed" ? "text-green-500" : task.status === "Partially Completed" ? "text-gray-500" : "text-red-500"}`}
              >
                {task.status || "Not Started"}
              </span>
            </div>

            {/* Display description for "Completed" or "Partially Completed" tasks */}
            {(task.status === "Completed" || task.status === "Partially Completed") && (
              <div className="mt-4 flex items-start space-x-2 mb-3">
                {/* <input
                  type="checkbox"
                  className="w-5 h-5 mt-1"
                  checked={checkedItems[i] || false}
                  onChange={() => handleCheckboxChange(i)}
                /> */}
                <textarea
                      className="w-full p-2 border rounded-md"
                      placeholder="Describe what is completed and what is not..."
                      value={taskDescription[i] || ''|| task.details} // Ensure correct task description is shown
                      onChange={(e) => handleTextareaChange(i, e.target.value)} // Update state when user types
                    />
              </div>
            )}
          </div>
        ))}

      {/* Remarks Section */}
      <div className="mb-4 mt-4">
        <p className="text-lg font-semibold">Remarks:</p>
        <textarea
          className="w-full p-2 border rounded-md resize-none"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add remarks..."
          rows={4} // Adjustable size for the remarks box
        />
      </div>

      {/* Completion Progress Bar */}
      <div className="mb-4">
            <p className="text-lg font-semibold">Completion:</p>
            <input
              type="range"
              min="0"
              max="100"
              value={completionPercentage}
              onChange={handleSliderChange} // Update the completion percentage based on slider value
              className="w-full bg-gray-300 rounded-lg h-2"
            />
            <div className="flex justify-between text-xs mt-2">
              <span>0%</span>
              <span>100%</span>
            </div>
            <div className="text-center text-xs font-bold mt-2">
              {completionPercentage}%
            </div>
          </div>


      {/* Date Picker */}
      <div className="mb-4">
        <p className="text-lg font-semibold">Date:</p>
        <DatePicker
          selected={selectedDate}
          dateFormat="yyyy-MM-dd"
          onChange={handleDateChange}
          className="border rounded-lg p-2 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-4 mt-4">
        <button className="px-6 py-2 bg-red-500 text-white rounded-lg" onClick={() => setIsModalOpen(false)}>
          Cancel
        </button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg" onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  </div>
)}



    </div>
  );
};

export default ProjectDetailView;
