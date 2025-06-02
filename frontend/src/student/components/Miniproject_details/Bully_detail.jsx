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
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaEdit, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import AxiosInstance from "../../../AxiosInstance";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Bully_detail = ({ isSidebarOpen, isMobile }) => {
  const { id } = useParams();
  const [showInput, setShowInput] = useState({});
  const [project, setProject] = useState(null);
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await AxiosInstance.get(`/projects/${id}/get_project_pk`);
        console.log(response.data);
        setProject(response.data);
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    };
    fetchProject();
  }, [id]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const openModal = (taskId) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const [tasks, setTasks] = useState([]);
  const fetchTasks = async () => {
    try {
      // const response = await AxiosInstance.get(`/projects/tasks/?id=${id}&sem_new=sem_7`);
      // setTasks(response.data); // Update state with the fetched tasks
      const response = await AxiosInstance.get(`/projects/tasks/?id=${id}`)
      console.log(response.data);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  useEffect(() => {
    if (id) {
      fetchTasks();  // Fetch tasks when projectId is available
    }
  }, [id]);
  const [taskData, setTaskData] = useState({});
  const handleStatusChange = (taskId, status) => {
    setTaskData(prevState => ({
      ...prevState,
      [taskId]: {
        ...prevState[taskId],
        status: status,
      },
    }));
    setShowInput(prev => ({
      ...prev,
      [taskId]: status === 'Completed' || status === 'Partially Completed',  // Show input for these statuses
    }));
  };

  const handleDetailsChange = (taskId, details) => {
    setTaskData(prevState => ({
      ...prevState,
      [taskId]: {
        ...prevState[taskId],
        details: details,
      },
    }));
  };

  useEffect(() => {
    if (selectedTaskId) {
      setShowInput({});
      setTaskData({});
    }
  }, [selectedTaskId]); 

  const handleSubmit = async () => {
    const taskStatusesData = Object.keys(taskData).map(taskId => ({
      task_id: taskId,
      status: taskData[taskId]?.status,
      details: taskData[taskId]?.details || '',
    }));
    console.log(taskStatusesData);
    try {
      await AxiosInstance.post('/task/submit-task-status/', {
        project_id: id,
        task_statuses: taskStatusesData,
      });
      closeModal();
      fetchTasks();
    } catch (error) {
      console.error('Error submitting task status:', error);
      // Handle error (e.g., notify user)
    }
  };

  const [activeTab, setActiveTab] = useState("Details");
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        display:false,
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

  const [sem7Data, setSem7Data] = useState(null);

  useEffect(() => {
    if (!project || !project.sem) return;
    AxiosInstance.get(`/projects/weekly_progress_chart/?id=${id}`).then(res => {
      setSem7Data(formatChartData(res.data));
      console.log(res.data);
    });
  }, [project]);

  const [showPopup, setShowPopup] = useState(false);
  const [projectDetails, setProjectDetails] = useState({
    name: "Bully Box: \"Stop Bullying, Report It Fully\"",
    abstract: "\"Bully Box\" is a safe and anonymous platform...",
  });
  const [tempDetails, setTempDetails] = useState(projectDetails);

  const handlePopupSubmit = () => {
    console.log(tempDetails);
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

  const [guideApproved, setGuideApproved] = useState(false);

  const [uploads, setUploads] = useState([]);
    useEffect(() => {
      const fetchUploads = async () => {
        try {
          const response = await AxiosInstance.get(`/materials/?project_id=${id}`);
          setUploads(response.data);
        } catch (error) {
          console.error("Error fetching uploads:", error);
        }
      };
  
      if (id) {
        fetchUploads();
      }
    }, [id]);
  
    const [links, setLinks] = useState([]);
    useEffect(() => {
      const fetchLinks = async () => {
        try {
          const response = await AxiosInstance.get(`/upload_links/?project_id=${id}`);
          setLinks(response.data);
          console.log(response.data);
        } catch (error) {
          console.error("Error fetching uploads:", error);
        }
      };
  
      if (id) {
        fetchLinks();
      }
    }, [id]);

  const [open, setOpen] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const getMimeTypes = (type) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return '.pdf';
    case 'ppt':
    case 'pptx':
      return '.ppt,.pptx';
    case 'word':
    case 'doc':
    case 'docx':
      return '.doc,.docx';
    case 'zip':
      return '.zip,.rar';
    default:
      return '*/*';
  }
};
const [selectedFiles, setSelectedFiles] = useState({});

const handleFileSelect = (linkId, file) => {
  setSelectedFiles((prev) => ({ ...prev, [linkId]: file }));
};

  useEffect(() => {
  const fetchUploads = async () => {
    try {
      const res = await AxiosInstance.get(`/student-uploads/my_uploads/?project_id=${id}`);
      const uploadMap = {};
      res.data.forEach(upload => {
        uploadMap[upload.link] = upload;
      });
      setUploadedFiles(uploadMap);  // link.id -> upload object
    } catch (err) {
      console.error("Failed to fetch uploads", err);
    }
  };
  fetchUploads();
}, [id]);

const handleFileUpload = async (e, link, existingUploadId = null) => {
  e.preventDefault();
  const file = selectedFiles[link.id];
  if (!file) return alert("Please select a file");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("link", link.id);               // matches field name
  formData.append("project", id);          // pass project ID appropriately
  formData.append("title", file.name);  

  try {
    if (existingUploadId) {
      await AxiosInstance.put(`/student-uploads/${existingUploadId}/`, formData);
    } else {
      await AxiosInstance.post("/student-uploads/", formData);
    }
    alert("Upload successful");
    const res = await AxiosInstance.get(`/student-uploads/my_uploads/?project_id=${id}`);
    const uploadMap = {};
    res.data.forEach(upload => {
      uploadMap[upload.link] = upload;
    });
    setUploadedFiles(uploadMap);
  } catch (err) {
    console.error("Upload failed", err);
    alert("Upload failed");
  }
};

  return (
    
    // <div className="ml-64 w-1200 rounded-lg mr-1 space-y-4">
    <div
  className={`p-4 md:p-6 bg-white shadow-lg rounded-lg 
    w-full transition-all duration-300 space-y-6
    dark:bg-gray-800 dark:border-gray-600 dark:text-white
    ${!isMobile ? 'ml-64 w-auto' : isSidebarOpen ? 'ml-64 w-auto' : 'w-full'}`}
>  
    {/* Header with Project Name */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mini Project ({project?.sem ?? ""} {project?.div ?? ""})</h1>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-2">
          {["Details", "Tasks", "Resources"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded ${activeTab === tab ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content based on active tab */}
      <div className="bg-white dark:bg-gray-900 rounded-md shadow-md border border-gray-300 dark:border-gray-700">
        {activeTab === "Details" && (
          <div className="p-4 space-y-4">
            {/* Project Details - Compact Card */}
            {/* <div className="flex gap-4">
              <div className="w-1/2">
                <fieldset className="p-3 bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-300 dark:border-gray-700 relative">
                  <legend className="text-lg font-semibold text-gray-800 dark:text-gray-200 px-2">Project Details</legend>
                  <button
                    onClick={() => {
                      const sanitizedDetails = {
                        ...project,
                        final_topic: project.final_topic ?? "",
                        final_abstract: project.final_abstract ?? "",
                      };
                      setTempDetails(sanitizedDetails);
                      setShowPopup(true);
                    }}
                    className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none"
                  >
                    <FaEdit className="h-5 w-5" />
                  </button>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <p className="text-gray-700 dark:text-gray-400">Domain:</p>
                    <p className="font-medium">{project?.domain ?? ""}</p>
                    <p className="text-gray-700 dark:text-gray-400">Name:</p>
                    <p className="font-medium">{project?.final_topic ?? ""}</p>
                    <p className="text-gray-700 dark:text-gray-400">Abstract:</p>
                    <p className="font-medium">{project?.final_abstract ?? ""}</p>
                  </div>
                </fieldset>
              </div>
     
              <div className="w-1/2">
                <fieldset className="p-3 bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-300 dark:border-gray-700 relative">
                  <legend className="text-lg font-semibold text-gray-800 dark:text-gray-200 px-2">Group Details</legend>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <p className="text-gray-700 dark:text-gray-400">Guide:</p>
                    <p className="font-medium">{project?.project_guide_name ?? ""}</p>
                    <p className="text-gray-700 dark:text-gray-400">Co-Guide:</p>
                    <p className="font-medium">{project?.project_co_guide_name ?? ""}</p>
                    <p className="text-gray-700 dark:text-gray-400">Leader:</p>
                    <p className="font-medium">{project?.leader_name}</p>
                  </div>
                  <p className="text-gray-700 dark:text-gray-400 mt-1">Members:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-400">
                    {project?.members.map((member, index) => (
                      <li key={index}>{member}</li>
                    ))}
                  </ul>
                </fieldset>
              </div>
            </div> */}
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative">
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
             <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
               Project Details
             </legend>
             <button
               onClick={() => {
                 const sanitizedDetails = {
                   ...project,
                   final_topic: project.final_topic ?? "", // Set to empty if null
                   final_abstract: project.final_abstract ?? "",
                   // Add other fields as needed
                 };
                 setTempDetails(sanitizedDetails);
                 // setTempDetails(projectDetails); // Set current details to temp before opening modal
                 setShowPopup(true);
               }}
               className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none"
             >
               <FaEdit className="h-6 w-6" />
             </button>
    
             <p className="text-gray-700 dark:text-gray-400">
               Domain:{" "}
               <span className="font-medium">{project?.domain ?? ""}</span>
             </p>
             <p className="text-gray-700 dark:text-gray-400">
               Name:{" "}
               <span className="font-medium">{project?.final_topic ?? ""}</span>
             </p>
             <p className="text-gray-700 dark:text-gray-400">
               Abstract:{" "}
               <span className="font-medium">{project?.final_abstract ?? ""}</span>
             </p>
           </fieldset>
           <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative">
             <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
               Group Details
             </legend>
             <p className="text-gray-700 dark:text-gray-400">
               Guide: <span className="font-medium">{project?.project_guide_name ?? ""}</span>
             </p>
             <p className="text-gray-700 dark:text-gray-400">
               Co-Guide: <span className="font-medium">{project?.project_co_guide_name ?? ""}</span>
             </p>
             <p className="text-gray-700 dark:text-gray-400">
               Leader: <span className="font-medium">{project?.leader_name}</span>
             </p>
             <p className="text-gray-700 dark:text-gray-400">Members:</p>
             <ul className="list-disc list-inside text-gray-700 dark:text-gray-400">
               {project?.members.map((member, index) => (
                 <li key={index}>{member}</li>
               ))}
             </ul>
           </fieldset>
    
            {/* Status Section */}
            <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700">
            <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
              Status
            </legend>
            <div className="flex justify-between items-start space-x-4">
                      {sem7Data && (
                                            <div className="w-1/2">
                                              <Bar data={sem7Data} options={options} />
                                            </div>
                                          )}
                    </div>
                    
          </fieldset>
          </div>
        )}
        
        {activeTab === "Tasks" && (
          <div className="p-4">
              <div className="overflow-x-auto">
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
                    <td className="border border-gray-300 p-2">
                    {Array.isArray(task.tasks) ? (
                  task.tasks.map((t, index) => (
                    <div key={t.task_id}>
                      {index + 1}. {t.task}
                    </div>
                  ))
                ) : (
                  <div>{task.tasks}</div>
                )}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                    <button
                  onClick={() => openModal(task.id)}
                  className={`px-4 py-2 rounded ${task.submitted
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-700"
                  }`}
                >
                  {task.submitted ? "Edit" : "Submit"}
                </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
              </div>
          </div>
        )}
         {isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
    <div className="bg-white p-6 rounded-md shadow-md max-h-[70vh] overflow-y-auto">
      
      {/* Find tasks according to active semester */}
      {(() => {
        const selectedTask = tasks.find(task => task.id === selectedTaskId);

        return (
          <>
            {/* Week Name */}
            <p className="text-gray-700 font-semibold mb-4">
              {selectedTask?.week}
            </p>

            {/* Render tasks inside the modal */}
            {selectedTask?.tasks.map((t, index) => (
              <div key={t.task_id} className="p-3 bg-gray-100 rounded-md mb-2">
                {/* Task description */}
                <p className="text-gray-700 font-medium">{index + 1}. {t.task}</p>

                {/* Radio buttons */}
                <div className="mt-1 flex space-x-3">
                  <label className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name={`status-${t.task_id}`}
                      value="Completed"
                      className="accent-blue-500"
                      onChange={() => handleStatusChange(t.task_id, 'Completed')}
                    />
                    <span>Completed</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name={`status-${t.task_id}`}
                      value="Partially Completed"
                      className="accent-gray-500"
                      onChange={() => handleStatusChange(t.task_id, 'Partially Completed')}
                    />
                    <span>Partially Completed</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name={`status-${t.task_id}`}
                      value="Not Completed"
                      className="accent-red-500"
                      onChange={() => handleStatusChange(t.task_id, 'Not Completed')}
                    />
                    <span>Not Completed</span>
                  </label>
                </div>

                {/* Input box for details */}
                {showInput[t.task_id] && (
                  <input
                    id={`details-${t.task_id}`}
                    type="text"
                    placeholder="Enter details..."
                    onChange={(e) => handleDetailsChange(t.task_id, e.target.value)}
                    className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </>
        );
      })()}

      {/* Modal buttons */}
      <div className="mt-4 flex justify-end space-x-4">
        <button onClick={closeModal} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">Submit</button>
      </div>
    </div>
  </div>
)}
{activeTab === "Resources" && (
      <div className="p-4 space-y-4">
              <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md border border-gray-300 dark:border-gray-700">
                <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                  Resource Section
                </legend>
      
                <ul className="list-disc pl-6 space-y-2">
                  {uploads.length === 0 ? (
                    <li className="text-gray-500">No uploads available.</li>
                  ) : (
                    uploads.map((upload) => (
                      <li key={upload.id}>
                        {upload.file ? (
                          <a
                            href={upload.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {upload.name}
                          </a>
                        ) : (
                          upload.name
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </fieldset>
            
              <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md border border-gray-300 dark:border-gray-700">
                <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
                  Assignment Section
                </legend>
                {links.map((link) => {
  const existingUpload = uploadedFiles[link.id];

  return (
    <div key={link.id} className="mb-4 border p-3 rounded shadow-sm w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-0">
        <div>
          <p className="font-medium text-gray-800">{link.name}</p>
          <p className="text-sm text-gray-500">Allowed type: {link.link_type.toUpperCase()}</p>
          {existingUpload && (
            <p className="text-sm text-green-600 mt-1">Uploaded: {existingUpload.file.split("/").pop()}</p>
          )}
        </div>

        <form
          onSubmit={(e) => handleFileUpload(e, link, existingUpload?.id)}
          className="flex flex-col sm:flex-row sm:items-center gap-2"
        >
          <input
            type="file"
            accept={getMimeTypes(link.link_type)}
            onChange={(e) => handleFileSelect(link.id, e.target.files[0])}
            required
            className="border px-2 py-1 rounded w-full sm:w-auto"
          />
          <button
            type="submit"
            className={`text-white px-3 py-1 rounded ${
              existingUpload ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {existingUpload ? "Edit" : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
})}


              </fieldset>
            </div>
    )}
       
      </div>
     
    </div>
  );
};

export default Bully_detail;
