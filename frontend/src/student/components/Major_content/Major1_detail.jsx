import { Bar } from "react-chartjs-2";
import { FaChevronDown, FaChevronRight, FaUpload } from "react-icons/fa";
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
import { FaEdit, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useParams } from "react-router-dom";
import AxiosInstance from "../../../AxiosInstance";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Major1_detail = ({isSidebarOpen, isMobile}) => {
  const { id } = useParams();
  const [reportCompleted, setReportCompleted] = useState(false);
  const [pptCompleted, setPptCompleted] = useState(false);
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
  const [tasks, setTasks] = useState([]);
  const [tasksSem7, setTasksSem7] = useState([]);
  const [tasksSem8, setTasksSem8] = useState([]);
  const [activeSemester, setActiveSemester] = useState('sem7');
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // const response = await AxiosInstance.get(`/projects/tasks/?id=${id}&sem_new=sem_7`);
        // setTasks(response.data); // Update state with the fetched tasks
        const [sem7Response, sem8Response] = await Promise.all([
          AxiosInstance.get(`/projects/tasks/?id=${id}&sem_new=sem_7`),
          AxiosInstance.get(`/projects/tasks/?id=${id}&sem_new=sem_8`)
        ]);
        setTasksSem7(sem7Response.data);
        setTasksSem8(sem8Response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    if (id) {
      console.log("entered");
      fetchTasks();  // Fetch tasks when projectId is available
    }
  }, [id]);

  const [publications, setPublications] = useState([]);
  const [copyrights, setCopyrights] = useState([]);
  const [patentData, setPatentData] = useState([]);

  useEffect(() => {
    // Fetch Publications
    AxiosInstance.get(`/publications/?project=${id}`)
      .then((response) => {
        setPublications(response.data);
        console.log(response.data)
      })
      .catch((error) => console.error("Error fetching publications:", error));

    // Fetch Copyrights
    AxiosInstance.get(`/copyrights/?project=${id}`)
      .then((response) => {
        setCopyrights(response.data);
      })
      .catch((error) => console.error("Error fetching copyrights:", error));

    // Fetch Patents
    AxiosInstance.get(`/patents/?project=${id}`)
      .then((response) => {
        setPatentData(response.data);
      })
      .catch((error) => console.error("Error fetching patents:", error));
  }, [id]);

  const [sem7Data, setSem7Data] = useState(null);
  const [sem8Data, setSem8Data] = useState(null);
  const [currentTab, setCurrentTab] = useState("Sem 7");

  useEffect(() => {
    if (!project || !project.sem) return;
    if (project.sem === "Major Project") {
      AxiosInstance.get(`/projects/weekly_progress_chart/?sem_new=sem_7&id=${id}`).then(res => {
        setSem7Data(formatChartData(res.data));
        console.log(res.data);
      });
      AxiosInstance.get(`/projects/weekly_progress_chart/?sem_new=sem_8&id=${id}`).then(res => {
        setSem8Data(formatChartData(res.data));
        console.log(res.data);
      });
    } else {
      AxiosInstance.get(`/projects/weekly_progress_chart/?id=${id}`).then(res => {
        setSem7Data(formatChartData(res.data));
        console.log(res.data); // reuse sem7Data for non-major
      });
    }
  }, [project]);

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

  const taskNames = [
    "Research", "Planning", "Design", "Development", "Testing",
    "Deployment", "Marketing", "Feedback", "Optimization",
    "QA Testing", "Final Review", "Launch"
  ]; // Task names for each week

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

  // const handleSubmit = () => {
  //   if (selectedTaskId !== null) {
  //     setTasks(prevTasks => {
  //       const updatedTasks = prevTasks.map(task =>
  //         task.id === selectedTaskId ? { ...task, submitted: true } : task
  //       );
  //       return [...updatedTasks.filter(task => !task.submitted), ...updatedTasks.filter(task => task.submitted)];
  //     });
  //   }
  //   closeModal();
  // };

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
    // Reset the task statuses and other related states when the week changes
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
      closeModal()
    } catch (error) {
      console.error('Error submitting task status:', error);
      // Handle error (e.g., notify user)
    }
  };

  const [activeTab, setActiveTab] = useState("Details");

  const [showPopup, setShowPopup] = useState(false);
  // const [projectDetails, setProjectDetails] = useState({
  //   name: " ProjectSpace: \"A Comprehensive Framework for Automated Project Guide Allocation in Academic Institutions.\"",
  //   abstract: "\ ProjectSpace is a web-based academic project management system designed to streamline processes such as group formation, guide allocation, and progress tracking. Traditional manual methods often lead to inefficiencies like topic duplication and inconsistent tracking. To optimize these tasks, ProjectSpace employs a Genetic Algorithm for faculty assignment based on expertise and a clustering algorithm for review panel generation. It also integrates Mega for secure document storage and provides a dashboard showcasing departmental achievements. This system enhances efficiency, ensuring structured project management and better guidance for students.",
  // });
  const [tempDetails, setTempDetails] = useState();

  // const handlePopupSubmit = () => {
  //   alert("Your request has been sent to your Guide. Changes will reflect once approved.");
  //   setShowPopup(false);
  // };



  const [showGroupPopup, setShowGroupPopup] = useState(false);
  const [groupDetails, setGroupDetails] = useState({
    guide: "Prof. Vishal Badgujar",
    coGuide: "Prof. Seema Jadhav",
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

  const [selectedRows, setSelectedRows] = useState([]);
  
  
   const [editModalOpen, setEditModalOpen] = useState(false);
     const [editData, setEditData] = useState({
       id: null,
       paper_name: "",
       conference_date: "",
       conference_name: "",
     });
   
     const toggleRowSelection = (id) => {
       setSelectedRows((prev) =>
         prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
       );
     };
   
     const handleAdd = () => {
       const newId = publications.length ? publications[publications.length - 1].id + 1 : 1;
       const newPub = {
         id: newId,
         paperName: "New Publication",
         conferenceDate: new Date().toISOString().split("T")[0],
         conferenceName: "New Conference",
       };
       setPublications([...publications, newPub]);
     };
   
     const handleEdit = () => {
       if (selectedRows.length === 1) {
         const pub = publications.find((p) => p.id === selectedRows[0]);
         setEditData(pub);
         setEditModalOpen(true);
       }
     };
   
     const handleDelete = () => {
       const updated = publications.filter((pub) => !selectedRows.includes(pub.id));
       setPublications(updated);
       setSelectedRows([]);
     };
   
     const handleEditChange = (e) => {
       const { name, value } = e.target;
       setEditData((prev) => ({ ...prev, [name]: value }));
     };
   
     const handleEditSave = async () => {
      try {
        // Ensure you are passing the required project ID with the request
        const updatedPublication = {
          id: editData.id,
          paper_name: editData.paper_name,
          conference_date: editData.conference_date,
          conference_name: editData.conference_name,
        };
    
        // Make the POST request to your backend's create_or_update view
        const response = await AxiosInstance.post(`/publications/create_or_update/?project=${id}`, updatedPublication);
    
        if (response.status === 200 || response.status === 201) {
          // Update the local state to reflect the changes
          const updatedPublicationsResponse = await AxiosInstance.get(`/publications/?project=${id}`);
          setPublications(updatedPublicationsResponse.data);
          
          // Close the modal and reset selections
          setSelectedRows([]);
          setEditModalOpen(false);
        }
      } catch (error) {
        console.error("Error saving publication:", error);
      }
    };
  
   const [selectedCopyrightRows, setSelectedCopyrightRows] = useState([]);
     const [editCopyrightModal, setEditCopyrightModal] = useState(false);
     const [editCopyrightData, setEditCopyrightData] = useState({
       id: null,
       project_title: "",
       filing_date: "",
       status: "",
       registration_number: "",
     });
   
     const toggleCopyrightRow = (id) => {
       setSelectedCopyrightRows((prev) =>
         prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
       );
     };
   
     const handleAddCopyright = () => {
       const newId = copyrights.length ? copyrights[copyrights.length - 1].id + 1 : 1;
       const newEntry = {
         id: newId,
         project_title: "New Copyright",
         filing_date: new Date().toISOString().split("T")[0],
         status: "Pending",
         registration_number: "N/A",
       };
       setCopyrights([...copyrights, newEntry]);
     };
   
     const handleEditCopyright = () => {
       if (selectedCopyrightRows.length === 1) {
         const data = copyrights.find((c) => c.id === selectedCopyrightRows[0]);
         setEditCopyrightData(data);
         setEditCopyrightModal(true);
       }
     };
   
     const handleDeleteCopyright = () => {
       const updated = copyrights.filter((c) => !selectedCopyrightRows.includes(c.id));
       setCopyrights(updated);
       setSelectedCopyrightRows([]);
     };
   
     const handleCopyrightChange = (e) => {
       const { name, value } = e.target;
       setEditCopyrightData((prev) => ({ ...prev, [name]: value }));
     };
   
     const handleSaveCopyright = async () => {
      //  const updated = copyrights.map((c) =>
      //    c.id === editCopyrightData.id ? editCopyrightData : c
      //  );
      //  setCopyrights(updated);
      //  setSelectedCopyrightRows([]);
      //  setEditCopyrightModal(false);
      try {
        // Ensure you are passing the required project ID with the request
        const updatedPublication = {
          id: editCopyrightData.id,
          project_title: editCopyrightData.project_title,
          filing_date: editCopyrightData.filing_date,
          status: editCopyrightData.status,
          registration_number: editCopyrightData.registration_number,
        };
    
        // Make the POST request to your backend's create_or_update view
        const response = await AxiosInstance.post(`/copyrights/create_or_update/?project=${id}`, updatedPublication);
    
        if (response.status === 200 || response.status === 201) {
          // Update the local state to reflect the changes
          const updatedPublicationsResponse = await AxiosInstance.get(`/copyrights/?project=${id}`);
          setCopyrights(updatedPublicationsResponse.data);
          
          // Close the modal and reset selections
          setSelectedCopyrightRows([]);
          setEditCopyrightModal(false);
        }
      } catch (error) {
        console.error("Error saving publication:", error);
      }
     };
   
     const [selectedPatentRows, setSelectedPatentRows] = useState([]);
   
     const [editPatentModal, setEditPatentModal] = useState(false);
     const [editPatentData, setEditPatentData] = useState({
       id: null,
       project_title: "",
       filing_date: "",
       status: "",
       registration_number: "",
     });
   
     const togglePatentRow = (id) => {
       setSelectedPatentRows((prev) =>
         prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
       );
     };
   
     const handleAddPatent = () => {
       const newId = patentData.length ? patentData[patentData.length - 1].id + 1 : 1;
       const newEntry = {
         id: newId,
         project_title: "New Patent",
         filing_tate: new Date().toISOString().split("T")[0],
         status: "Pending",
         registration_number: "N/A",
       };
       setPatentData([...patentData, newEntry]);
     };
   
     const handleEditPatent = () => {
       if (selectedPatentRows.length === 1) {
         const data = patentData.find((p) => p.id === selectedPatentRows[0]);
         setEditPatentData(data);
         setEditPatentModal(true);
       }
     };
   
     const handleDeletePatent = () => {
       const updated = patentData.filter((p) => !selectedPatentRows.includes(p.id));
       setPatentData(updated);
       setSelectedPatentRows([]);
     };
   
     const handlePatentChange = (e) => {
       const { name, value } = e.target;
       setEditPatentData((prev) => ({ ...prev, [name]: value }));
     };
   
     const handleSavePatent = async () => {
      //  const updated = patentData.map((p) =>
      //    p.id === editPatentData.id ? editPatentData : p
      //  );
      //  setPatentData(updated);
      //  setSelectedPatentRows([]);
      //  setEditPatentModal(false);
      try {
        // Ensure you are passing the required project ID with the request
        const updatedPublication = {
          id: editPatentData.id,
          project_title: editPatentData.project_title,
          filing_date: editPatentData.filing_date,
          status: editPatentData.status,
          registration_number: editPatentData.registration_number,
        };
    
        // Make the POST request to your backend's create_or_update view
        const response = await AxiosInstance.post(`/patents/create_or_update/?project=${id}`, updatedPublication);
    
        if (response.status === 200 || response.status === 201) {
          // Update the local state to reflect the changes
          const updatedPublicationsResponse = await AxiosInstance.get(`/patents/?project=${id}`);
          setPatentData(updatedPublicationsResponse.data);
          
          // Close the modal and reset selections
          setSelectedPatentRows([]);
          setEditPatentModal(false);
        }
      } catch (error) {
        console.error("Error saving publication:", error);
      }
     };

     const handlePopupSubmit = async () => {
      try {
        const response = await AxiosInstance.post(`/projects/${id}/update_topic/`, {
          name: tempDetails.name,
          abstract: tempDetails.abstract,
        });
        if (response.status===200){
          alert("Data Updated");
        }else{
          alert(response.data.error);
        }
        // Optional: refresh project data after update
        const result = await AxiosInstance.get(`/projects/${id}/`);
        setProject(result.data);
    
        setShowPopup(false); // Close modal
      } catch (error) {
        console.error("Failed to update project:", error);
      }
    };
  
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
  
  const resources = [
      {
        name: "Project Guidelines",
        documents: [
          { title: "Project Overview Document", file: "project_overview.pdf" },
          { title: "Timeline and Milestones", file: "timeline_milestones.pdf" },
          { title: "Project Format & Submission Instructions", file: "format_submission.pdf" },
        ]
      },
      {
        name: "Guide Allocation",
        documents: [
          { title: "Guide Selection Instructions", file: "guide_selection.pdf" },
          { title: "Guide List with Areas of Expertise", file: "guide_list.pdf" },
          { title: "Guide Allotment Form", file: "allotment_form.pdf" },
        ]
      },
      {
        name: "Review Panel",
        documents: [
          { title: "Review Panel Process Guidelines", file: "panel_process.pdf" },
          { title: "Panel Evaluation Criteria", file: "evaluation_criteria.pdf" },
          { title: "Review Panel Schedule", file: "panel_schedule.pdf" },
        ]
      },
      {
        name: "Progress Tracking",
        documents: [
          { title: "Weekly Progress Report Template", file: "weekly_report.pdf" },
          { title: "Monthly Evaluation Sheet", file: "monthly_evaluation.pdf" },
          { title: "Final Review Checklist", file: "review_checklist.pdf" },
        ]
      },
      {
        name: "Submission Documents",
        documents: [
          { title: "Final Report Template (DOC/PDF)", file: "final_report_template.pdf" },
          { title: "Plagiarism Declaration Form", file: "plagiarism_form.pdf" },
          { title: "Project Completion Certificate Format", file: "certificate_format.pdf" },
        ]
      },
      {
        name: "Support Materials",
        documents: [
          { title: "Sample Projects", file: "sample_projects.pdf" },
          { title: "Research Paper Writing Tips", file: "research_tips.pdf" },
          { title: "PowerPoint Presentation Template", file: "presentation_template.pptx" },
        ]
      }
    ];
  
    const [openSections, setOpenSections] = useState({});
  
    const toggleSection = (index) => {
      setOpenSections((prev) => ({
        ...prev,
        [index]: !prev[index],
      }));
    };
  
    const assignments = [
      {
        title: "SEM VIII Project Progress Review-III ",
        tasks: [
          { id: 1, label: "Assignment 1" },
  
        ]
  
      },
      {
        title: "SEM VIII Project Progress Review-IV",
        tasks: [
          { id: 2, label: "Upload Presentation for Review-IV (Coming Soon)" }
        ]
      },
      {
        title: "SEM VIII Project-II Black Book",
        description: `Dear students,
  
  Kindly check and download Common Copy format for BE project report in LaTeX.
  
  Every member of the project group needs to submit one copy of BE project Individual black book and two common copies with golden embossing.
  
  Also find sample Project Report PDF file for reference. Template for Presentation and Gantt Chart also attached. Submit to co-guide and guide for proof reading.`,
        tasks: [
          { id: 3, label: "Sem VIII Black Book LaTeX Formats" },
          { id: 4, label: "2024–2025 BE Black Book – Index Structure" }
        ]
      }
    ];
  
  
    const [open, setOpen] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState({});
  
    const AssigntoggleSection = (index) => {
      setOpen(open === index ? null : index);
    };
  
    const handleUpload = (id) => {
      setUploadedFiles((prev) => ({ ...prev, [id]: true }));
    };

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
//     <div className="ml-64 w-1200 rounded-lg mr-1 space-y-6">
//       {/* Project Name */}
//       <div className="space-y-3">
//         <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
//           Project Name
//         </h1>
//       </div>
      
//       {/* Project Details */}
//       <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative">
//       {showPopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-1/2">
//             <h2 className="text-xl font-semibold mb-4">Edit Project Details</h2>
//             <div className="mb-4">
//               <label className="block text-gray-800 dark:text-gray-200 mb-2">
//                 Name:
//               </label>
//               <input
//                 type="text"
//                 value={tempDetails.name}
//                 onChange={(e) =>
//                   setTempDetails({ ...tempDetails, name: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-800 dark:text-gray-200 mb-2">
//                 Abstract:
//               </label>
//               <textarea
//                 value={tempDetails.abstract}
//                 onChange={(e) =>
//                   setTempDetails({ ...tempDetails, abstract: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
//                 rows="4"
//               ></textarea>
//             </div>
//             <div className="flex justify-end space-x-4">
//               <button
//                 onClick={() => setShowPopup(false)}
//                 className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handlePopupSubmit}
//                 className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
//               >
//                 Submit
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//         <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
//           Project Details
//         </legend>
//         <button
//           onClick={() => {
//             const sanitizedDetails = {
//               ...project,
//               final_topic: project.final_topic ?? "", // Set to empty if null
//               final_abstract: project.final_abstract ?? "",
//               // Add other fields as needed
//             };
//             setTempDetails(sanitizedDetails);
//             // setTempDetails(projectDetails); // Set current details to temp before opening modal
//             setShowPopup(true);
//           }}
//           className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none"
//         >
//           <FaEdit className="h-6 w-6" />
//         </button>

//         <p className="text-gray-700 dark:text-gray-400">
//           Domain:{" "}
//           <span className="font-medium">{project?.domain ?? ""}</span>
//         </p>
//         <p className="text-gray-700 dark:text-gray-400">
//           Name:{" "}
//           <span className="font-medium">{project?.final_topic ?? ""}</span>
//         </p>
//         <p className="text-gray-700 dark:text-gray-400">
//           Abstract:{" "}
//           <span className="font-medium">{project?.final_abstract ?? ""}</span>
//         </p>
//       </fieldset>

//       {/* Popup Modal */}
      



//       {/* Group Details */}
//       <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700 relative">
//         <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
//           Group Details
//         </legend>
//         {/* <button
//           onClick={() => {
//             setTempGroupDetails(groupDetails); // Reset temp details to current group details
//             setShowGroupPopup(true);
//           }}
//           className="absolute top-0 right-2 bg-transparent text-blue-500 hover:text-blue-600 focus:outline-none"
//         >
//           <FaEdit className="h-6 w-6" />
//         </button> */}
//         <p className="text-gray-700 dark:text-gray-400">
//           Guide: <span className="font-medium">{project?.project_guide_name ?? ""}</span>
//         </p>
//         <p className="text-gray-700 dark:text-gray-400">
//           Co-Guide: <span className="font-medium">{project?.project_co_guide_name ?? ""}</span>
//         </p>
//         <p className="text-gray-700 dark:text-gray-400">
//           Leader: <span className="font-medium">{project?.leader_name}</span>
//         </p>
//         <p className="text-gray-700 dark:text-gray-400">Members:</p>
//         <ul className="list-disc list-inside text-gray-700 dark:text-gray-400">
//           {project?.members.map((member, index) => (
//             <li key={index}>{member}</li>
//           ))}
//         </ul>
//       </fieldset>

//       {/* Group Edit Popup */}
//       {/* {showGroupPopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-2xl">
//             <h2 className="text-xl font-semibold mb-4">Edit Group Details</h2>
//             <div className="mb-4">
//               <label className="block text-gray-800 dark:text-gray-200 mb-2">
//                 Leader Name:
//               </label>
//               <input
//                 type="text"
//                 value={tempGroupDetails.leader}
//                 onChange={(e) =>
//                   setTempGroupDetails({ ...tempGroupDetails, leader: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-gray-800 dark:text-gray-200 mb-2">
//                 Members (Comma Separated):
//               </label>
//               <input
//                 type="text"
//                 value={tempGroupDetails.members.join(", ")}
//                 onChange={(e) =>
//                   setTempGroupDetails({
//                     ...tempGroupDetails,
//                     members: e.target.value.split(",").map((m) => m.trim()),
//                   })
//                 }
//                 className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-200"
//               />
//             </div>
//             <div className="flex justify-end space-x-4">
//               <button
//                 onClick={() => setShowGroupPopup(false)}
//                 className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleGroupPopupSubmit}
//                 className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
//               >
//                 Submit
//               </button>
//             </div>
//           </div>
//         </div>
//       )} */}

//       {/* Status Section */}
      // <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700">
      //   <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
      //     Status
      //   </legend>
      //   <div className="flex justify-between items-start space-x-4">
      //     <div className="w-full">
      //           {project && project.sem === "Major Project" ? (
      //             <>
      //               <div className="flex space-x-4 mb-4">
      //                 {["Sem 7", "Sem 8"].map((tab) => (
      //                   <button
      //                     key={tab}
      //                     onClick={() => setCurrentTab(tab)}
      //                     className={`px-4 py-2 rounded ${
      //                       currentTab === tab ? "bg-blue-500 text-white" : "bg-gray-200"
      //                     }`}
      //                   >
      //                     {tab}
      //                   </button>
      //                 ))}
      //               </div>
      //               {currentTab === "Sem 7" && sem7Data && (
      //                 <div className="w-1/2">
      //                   <Bar data={sem7Data} options={options} />
      //                 </div>
      //               )}
      //               {currentTab === "Sem 8" && sem8Data && (
      //                 <div className="w-1/2">
      //                   <Bar data={sem8Data} options={options} />
      //                 </div>
      //               )}
      //             </>
      //           ) : (
      //             sem7Data && (
      //               <div className="w-1/2">
      //                 <Bar data={sem7Data} options={options} />
      //               </div>
      //             )
      //           )}
      //                     </div>
      //   </div>
      //   {/* <div className="flex flex-col space-y-4 mt-4">
      //     <div className="flex items-center space-x-2">
      //       <input
      //         type="checkbox"
      //         id="report"
      //         checked={reportCompleted}
      //         onChange={() => setReportCompleted(!reportCompleted)}
      //         className="hidden"
      //       />
      //       <label htmlFor="report" className="flex items-center space-x-2 cursor-pointer">
      //         {reportCompleted ? (
      //           <FaCheckCircle className="text-green-500" />
      //         ) : (
      //           <FaTimesCircle className="text-red-500" />
      //         )}
      //         <span className="text-gray-800 dark:text-gray-200">Report Completed</span>
      //       </label>
      //     </div>
      //     <div className="flex items-center space-x-2">
      //       <input
      //         type="checkbox"
      //         id="ppt"
      //         checked={pptCompleted}
      //         onChange={() => setPptCompleted(!pptCompleted)}
      //         className="hidden"
      //       />
      //       <label htmlFor="ppt" className="flex items-center space-x-2 cursor-pointer">
      //         {pptCompleted ? (
      //           <FaCheckCircle className="text-green-500" />
      //         ) : (
      //           <FaTimesCircle className="text-red-500" />
      //         )}
      //         <span className="text-gray-800 dark:text-gray-200">PPT Completed</span>
      //       </label>
      //     </div>
      //   </div> */}

      // </fieldset>

//       {/* Weekly Task */}
//       <div>
//         <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700">
//           <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
//             Weekly Task
//           </legend>
//           <div className="overflow-x-auto">
//           <div className="flex space-x-4 mb-4">
//     <button
//       className={`px-4 py-2 rounded ${activeSemester === 'sem7' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
//       onClick={() => setActiveSemester('sem7')}
//     >
//       Sem 7
//     </button>
//     <button
//       className={`px-4 py-2 rounded ${activeSemester === 'sem8' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
//       onClick={() => setActiveSemester('sem8')}
//     >
//       Sem 8
//     </button>
//   </div>
//   <table className="w-full border-collapse border border-gray-300">
//         <thead>
//           <tr className="bg-[#5cc800]">
//             <th className="border border-gray-300 p-2 text-white">Week</th>
//             <th className="border border-gray-300 p-2 text-white">Task</th>
//             <th className="border border-gray-300 p-2 text-white">Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {(activeSemester === 'sem7' ? tasksSem7 : tasksSem8).map((task) => (
//             <tr key={task.id} className="border border-gray-300">
//               <td className="border border-gray-300 p-2">{task.week}</td>
//               <td className="border border-gray-300 p-2">
//                 {Array.isArray(task.tasks) ? (
//                   task.tasks.map((t, index) => (
//                     <div key={t.task_id}>
//                       {index + 1}. {t.task}
//                     </div>
//                   ))
//                 ) : (
//                   <div>{task.tasks}</div>
//                 )}
//               </td>
//               <td className="border border-gray-300 p-2 text-center">
//                 <button
//                   onClick={() => openModal(task.id)}
//                   className={`px-4 py-2 rounded ${task.submitted
//                     ? "bg-green-500 text-white"
//                     : "bg-blue-500 text-white hover:bg-blue-700"
//                   }`}
//                 >
//                   {task.submitted ? "Edit" : "Submit"}
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//             {/* <table className="w-full border-collapse border border-gray-300">
//               <thead>
//                 <tr className="bg-[#5cc800]">
//                   <th className="border border-gray-300 p-2 text-white">Week</th>
//                   <th className="border border-gray-300 p-2 text-white">Task</th>
//                   <th className="border border-gray-300 p-2 text-white">Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {tasks.map((task) => (
//                   <tr key={task.id} className="border border-gray-300">
//                     <td className="border border-gray-300 p-2">{task.week}</td>
                  
//                     <td className="border border-gray-300 p-2">
//                     {Array.isArray(task.tasks) ? (
//     task.tasks.map((t, index) => (
//       <div key={t.task_id}>{index + 1}. {t.task}</div>
//     ))
//   ) : (
//     task.tasks.map(t => <div key={t.task_id}>{t.task}</div>)  // If tasks is not an array, show it directly
//   )}
//                     </td>
//                     <td className="border border-gray-300 p-2 text-center">
//                       <button
//                         onClick={() => openModal(task.id)}
//                         className={`px-4 py-2 rounded ${task.submitted
//                           ? "bg-green-500 text-white"
//                           : "bg-blue-500 text-white hover:bg-blue-700"
//                           }`}
//                       >
//                         {task.submitted ? (
//                           <>
//                             Edit
//                           </>
//                         ) : (
//                           "Submit"
//                         )}
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table> */}
//           </div>
//         </fieldset>
//         {/* {isModalOpen && (
//           <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
//             <div className="bg-white p-6 rounded-md shadow-md h-[65vh] max-h-[70vh] overflow-y-auto">
//               <p className="text-gray-700 font-semibold">
//                 {tasks.find(task => task.id === selectedTaskId)?.week}
//               </p>


//               {tasks.find(task => task.id === selectedTaskId)?.task.map((t, index) => (
//                 <div key={index} className="p-3 bg-gray-100 rounded-md mb-2">

//                   <p className="text-gray-700 font-medium">{index + 1}. {t}</p>
//                   <div className="mt-1 flex space-x-3">
//                     <label className="flex items-center space-x-1">
//                       <input
//                         type="radio"
//                         name={`status-${index}`}
//                         value="Completed"
//                         className="accent-blue-500"
//                         onChange={() => setShowInput({ ...showInput, [index]: true })}
//                       />
//                       <span>Completed</span>
//                     </label>
//                     <label className="flex items-center space-x-1">
//                       <input
//                         type="radio"
//                         name={`status-${index}`}
//                         value="Partially Completed"
//                         className="accent-gray-500"
//                         onChange={() => setShowInput({ ...showInput, [index]: true })}
//                       />
//                       <span>Partially Completed</span>
//                     </label>
//                     <label className="flex items-center space-x-1">
//                       <input
//                         type="radio"
//                         name={`status-${index}`}
//                         value="Not Completed"
//                         className="accent-red-500"
//                         onChange={() => setShowInput({ ...showInput, [index]: false })}
//                       />
//                       <span>Not Completed</span>
//                     </label>
//                   </div>
//                   {showInput[index] && (
//                     <input
//                       type="text"
//                       placeholder="Enter details..."
//                       className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   )}


//                 </div>
//               ))}

//               <div className="mt-4 flex justify-end space-x-4">
//                 <button onClick={closeModal} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
//                 <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">Submit</button>
//               </div>
//             </div>
//           </div>
//         )} */}
//         {isModalOpen && (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
//     <div className="bg-white p-6 rounded-md shadow-md h-[65vh] max-h-[70vh] overflow-y-auto">
      
//       {/* Find tasks according to active semester */}
//       {(() => {
//         const currentTasks = activeSemester === 'sem7' ? tasksSem7 : tasksSem8;
//         const selectedTask = currentTasks.find(task => task.id === selectedTaskId);

//         return (
//           <>
//             {/* Week Name */}
//             <p className="text-gray-700 font-semibold mb-4">
//               {selectedTask?.week}
//             </p>

//             {/* Render tasks inside the modal */}
//             {selectedTask?.tasks.map((t, index) => (
//               <div key={t.task_id} className="p-3 bg-gray-100 rounded-md mb-2">
//                 {/* Task description */}
//                 <p className="text-gray-700 font-medium">{index + 1}. {t.task}</p>

//                 {/* Radio buttons */}
//                 <div className="mt-1 flex space-x-3">
//                   <label className="flex items-center space-x-1">
//                     <input
//                       type="radio"
//                       name={`status-${t.task_id}`}
//                       value="Completed"
//                       className="accent-blue-500"
//                       onChange={() => handleStatusChange(t.task_id, 'Completed')}
//                     />
//                     <span>Completed</span>
//                   </label>
//                   <label className="flex items-center space-x-1">
//                     <input
//                       type="radio"
//                       name={`status-${t.task_id}`}
//                       value="Partially Completed"
//                       className="accent-gray-500"
//                       onChange={() => handleStatusChange(t.task_id, 'Partially Completed')}
//                     />
//                     <span>Partially Completed</span>
//                   </label>
//                   <label className="flex items-center space-x-1">
//                     <input
//                       type="radio"
//                       name={`status-${t.task_id}`}
//                       value="Not Completed"
//                       className="accent-red-500"
//                       onChange={() => handleStatusChange(t.task_id, 'Not Completed')}
//                     />
//                     <span>Not Completed</span>
//                   </label>
//                 </div>

//                 {/* Input box for details */}
//                 {showInput[t.task_id] && (
//                   <input
//                     id={`details-${t.task_id}`}
//                     type="text"
//                     placeholder="Enter details..."
//                     onChange={(e) => handleDetailsChange(t.task_id, e.target.value)}
//                     className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 )}
//               </div>
//             ))}
//           </>
//         );
//       })()}

//       {/* Modal buttons */}
//       <div className="mt-4 flex justify-end space-x-4">
//         <button onClick={closeModal} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
//         <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">Submit</button>
//       </div>
//     </div>
//   </div>
// )}

//         {/* {isModalOpen && (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
//     <div className="bg-white p-6 rounded-md shadow-md h-[65vh] max-h-[70vh] overflow-y-auto">
//       <p className="text-gray-700 font-semibold">
//         {tasks.find(task => task.id === selectedTaskId)?.week}
//       </p>

//       {tasks.find(task => task.id === selectedTaskId)?.tasks.map((t, index) => (
//         <div key={t.task_id} className="p-3 bg-gray-100 rounded-md mb-2">

//           <p className="text-gray-700 font-medium">{index + 1}. {t.task}</p>

//           <div className="mt-1 flex space-x-3">
//             <label className="flex items-center space-x-1">
//               <input
//                 type="radio"
//                 name={`status-${t.task_id}`}
//                 value="Completed"
//                 className="accent-blue-500"
//                 onChange={() => handleStatusChange(t.task_id, 'Completed')}
//               />
//               <span>Completed</span>
//             </label>
//             <label className="flex items-center space-x-1">
//               <input
//                 type="radio"
//                 name={`status-${t.task_id}`}
//                 value="Partially Completed"
//                 className="accent-gray-500"
//                 onChange={() => handleStatusChange(t.task_id, 'Partially Completed')}
//               />
//               <span>Partially Completed</span>
//             </label>
//             <label className="flex items-center space-x-1">
//               <input
//                 type="radio"
//                 name={`status-${t.task_id}`}
//                 value="Not Completed"
//                 className="accent-red-500"
//                 onChange={() => handleStatusChange(t.task_id, 'Not Completed')}
//               />
//               <span>Not Completed</span>
//             </label>
//           </div>
//  {showInput[t.task_id] && (
//             <input
//               id={`details-${t.task_id}`}  
//               type="text"
//               placeholder="Enter details..."
//               onChange={(e) => handleDetailsChange(t.task_id, e.target.value)}
//               className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           )}
//         </div>
//       ))}

//       <div className="mt-4 flex justify-end space-x-4">
//         <button onClick={closeModal} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
//         <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">Submit</button>
//       </div>
//     </div>
//   </div>
// )} */}
//       </div>
//       <div>
        // <fieldset className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md space-y-4 border border-gray-300 dark:border-gray-700">
        //   <legend className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-2">
        //     Publication & Copyright & Patent
        //   </legend>
        //   <div className="overflow-x-auto">
        //     <div className="flex items-center justify-between border rounded-md p-2">
        //       <span className="font-semibold text-black">Publications</span>
        //       <div className="space-x-2">
        //         <button className="px-2 py-1 bg-green-500 text-white rounded-md" onClick={handleAdd}>
        //           Add
        //         </button>
        //         <button
        //           className={`px-2 py-1 rounded-md ${selectedRows.length === 1
        //               ? "bg-blue-500 text-white"
        //               : "bg-gray-300 text-gray-500 cursor-not-allowed"
        //             }`}
        //           disabled={selectedRows.length !== 1}
        //           onClick={handleEdit}
        //         >
        //           Edit
        //         </button>
        //         <button
        //           className={`px-2 py-1 rounded-md ${selectedRows.length >= 1
        //               ? "bg-red-500 text-white"
        //               : "bg-gray-300 text-gray-500 cursor-not-allowed"
        //             }`}
        //           disabled={selectedRows.length === 0}
        //           onClick={handleDelete}
        //         >
        //           Delete
        //         </button>
        //       </div>
        //     </div>

        //     {/* Table */}
        //     <div className="overflow-x-auto mt-2">
        //       <table className="w-full border border-gray-300 rounded-lg">
        //         <thead className="bg-[#5cc800] text-white">
        //           <tr>
        //             <th className="p-2 border w-10 text-center">✔</th>
        //             <th className="p-2 border">Paper Name</th>
        //             <th className="p-2 border">Conference Date</th>
        //             <th className="p-2 border">Conference Name</th>
        //           </tr>
        //         </thead>
        //         <tbody>
        //           {publications.map((pub) => (
        //             <tr
        //               key={pub.id}
        //               className={`cursor-pointer ${selectedRows.includes(pub.id) ? "bg-blue-100" : "hover:bg-gray-100"
        //                 }`}
        //               onClick={() => toggleRowSelection(pub.id)}
        //             >
        //               <td className="p-2 border text-center">
        //                 <input
        //                   type="checkbox"
        //                   checked={selectedRows.includes(pub.id)}
        //                   onChange={() => toggleRowSelection(pub.id)}
        //                   onClick={(e) => e.stopPropagation()}
        //                 />
        //               </td>
        //               <td className="p-2 border">{pub.paper_name}</td>
        //               <td className="p-2 border">{pub.conference_date}</td>
        //               <td className="p-2 border">{pub.conference_name}</td>
        //             </tr>
        //           ))}
        //         </tbody>
        //       </table>
        //     </div>

        //     {/* Edit Modal */}
        //     {editModalOpen && (
        //       <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        //         <div className="bg-white p-6 rounded-md w-full max-w-md">
        //           <h2 className="text-xl font-bold mb-4">Edit Publication</h2>
        //           <div className="space-y-3">
        //             <div>
        //               <label className="block font-semibold">Paper Name</label>
        //               <input
        //                 type="text"
        //                 name="paper_name"
        //                 value={editData.paper_name}
        //                 onChange={handleEditChange}
        //                 className="w-full border px-2 py-1 rounded-md"
        //                 required
        //               />
        //             </div>
        //             <div>
        //               <label className="block font-semibold">Conference Date</label>
        //               <input
        //                 type="date"
        //                 name="conference_date"
        //                 value={editData.conference_date}
        //                 onChange={handleEditChange}
        //                 className="w-full border px-2 py-1 rounded-md"
        //                 required
        //               />
        //             </div>
        //             <div>
        //               <label className="block font-semibold">Conference Name</label>
        //               <input
        //                 type="text"
        //                 name="conference_name"
        //                 value={editData.conference_name}
        //                 onChange={handleEditChange}
        //                 className="w-full border px-2 py-1 rounded-md"
        //                 required
        //               />
        //             </div>
        //             <div className="flex justify-end mt-4 space-x-2">
        //               <button
        //                 onClick={() => setEditModalOpen(false)}
        //                 className="px-4 py-1 bg-gray-400 text-white rounded-md"
        //               >
        //                 Cancel
        //               </button>
        //               <button
        //                 onClick={handleEditSave}
        //                 className="px-4 py-1 bg-blue-500 text-white rounded-md"
        //               >
        //                 Save
        //               </button>
        //             </div>
        //           </div>
        //         </div>
        //       </div>
        //     )}
        //   </div>
        //   {/* Copyrights Section */}
        //   <div className="overflow-x-auto mt-6">
        //     <div className="flex items-center justify-between border rounded-md p-2">
        //       <span className="font-semibold text-black">Copyrights</span>
        //       <div className="space-x-2">
        //         <button className="px-2 py-1 bg-green-500 text-white rounded-md" onClick={handleAddCopyright}>
        //           Add
        //         </button>
        //         <button
        //           className={`px-2 py-1 rounded-md ${selectedCopyrightRows.length === 1 ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
        //             }`}
        //           disabled={selectedCopyrightRows.length !== 1}
        //           onClick={handleEditCopyright}
        //         >
        //           Edit
        //         </button>
        //         <button
        //           className={`px-2 py-1 rounded-md ${selectedCopyrightRows.length >= 1 ? "bg-red-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
        //             }`}
        //           disabled={selectedCopyrightRows.length === 0}
        //           onClick={handleDeleteCopyright}
        //         >
        //           Delete
        //         </button>
        //       </div>
        //     </div>

        //     {/* Table */}
        //     <table className="min-w-full border-collapse border border-gray-300 mt-2">
        //       <thead className="bg-[#5cc800] text-white">
        //         <tr>
        //           <th className="border p-2">✔</th>
        //           <th className="border p-2">Project Title</th>
        //           <th className="border p-2">Filing Date</th>
        //           <th className="border p-2">Status</th>
        //           <th className="border p-2">Registration Number</th>
        //         </tr>
        //       </thead>
        //       <tbody>
        //         {copyrights.map((c) => (
        //           <tr key={c.id} className={`cursor-pointer ${selectedCopyrightRows.includes(c.id) ? "bg-blue-100" : "hover:bg-gray-100"}`} onClick={() => toggleCopyrightRow(c.id)}>
        //             <td className="p-2 border text-center">
        //               <input
        //                 type="checkbox"
        //                 checked={selectedCopyrightRows.includes(c.id)}
        //                 onChange={() => toggleCopyrightRow(c.id)}
        //                 onClick={(e) => e.stopPropagation()}
        //               />
        //             </td>
        //             <td className="p-2 border">{c.project_title}</td>
        //             <td className="p-2 border">{c.filing_date}</td>
        //             <td className="p-2 border">{c.status}</td>
        //             <td className="p-2 border">{c.registration_number}</td>
        //           </tr>
        //         ))}
        //       </tbody>
        //     </table>

        //     {/* Edit Modal for Copyright */}
        //     {editCopyrightModal && (
        //       <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        //         <div className="bg-white p-6 rounded-md w-full max-w-md">
        //           <h2 className="text-xl font-bold mb-4">Edit Copyright</h2>
        //           <div className="space-y-3">
        //             <div>
        //               <label className="block font-semibold">Project Title</label>
        //               <input type="text" name="project_title" value={editCopyrightData.project_title} onChange={handleCopyrightChange} className="w-full border px-2 py-1 rounded-md" required/>
        //             </div>
        //             <div>
        //               <label className="block font-semibold">Filing Date</label>
        //               <input type="date" name="filing_date" value={editCopyrightData.filing_date} onChange={handleCopyrightChange} className="w-full border px-2 py-1 rounded-md" required/>
        //             </div>
        //             <div>
        //               <label className="block font-semibold">Status</label>
        //               <select
        //                 name="status"
        //                 value={editCopyrightData.status}
        //                 onChange={handleCopyrightChange}
        //                 className="w-full border px-2 py-1 rounded-md"
        //                 required
        //               >
        //                 <option value="Filed">Filed</option>
        //                 <option value="Registered">Registered</option>
        //               </select>
        //             </div>
        //             <div>
        //               <label className="block font-semibold">Registration Number</label>
        //               <input type="text" name="registration_number" value={editCopyrightData.registration_number} onChange={handleCopyrightChange} className="w-full border px-2 py-1 rounded-md" required/>
        //             </div>
        //             <div className="flex justify-end mt-4 space-x-2">
        //               <button onClick={() => setEditCopyrightModal(false)} className="px-4 py-1 bg-gray-400 text-white rounded-md">Cancel</button>
        //               <button onClick={handleSaveCopyright} className="px-4 py-1 bg-blue-500 text-white rounded-md">Save</button>
        //             </div>
        //           </div>
        //         </div>
        //       </div>
        //     )}
        //   </div>
        //   {/* Patents Section */}
        //   <div className="overflow-x-auto mt-6">
        //     <div className="flex items-center justify-between border rounded-md p-2">
        //       <span className="font-semibold text-black">Patents</span>
        //       <div className="space-x-2">
        //         <button className="px-2 py-1 bg-green-500 text-white rounded-md" onClick={handleAddPatent}>Add</button>
        //         <button className={`px-2 py-1 rounded-md ${selectedPatentRows.length === 1 ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`} disabled={selectedPatentRows.length !== 1} onClick={handleEditPatent}>Edit</button>
        //         <button className={`px-2 py-1 rounded-md ${selectedPatentRows.length >= 1 ? "bg-red-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`} disabled={selectedPatentRows.length === 0} onClick={handleDeletePatent}>Delete</button>
        //       </div>
        //     </div>

        //     {/* Table */}
        //     <table className="min-w-full border-collapse border border-gray-300 mt-2">
        //       <thead className="bg-[#5cc800] text-white">
        //         <tr>
        //           <th className="border p-2">✔</th>
        //           <th className="border p-2">Project Title</th>
        //           <th className="border p-2">Filing Date</th>
        //           <th className="border p-2">Status</th>
        //           <th className="border p-2">Registration/Patent Number</th>
        //         </tr>
        //       </thead>
        //       <tbody>
        //         {patentData.map((row) => (
        //           <tr key={row.id} className={`cursor-pointer ${selectedPatentRows.includes(row.id) ? "bg-blue-100" : "hover:bg-gray-100"}`} onClick={() => togglePatentRow(row.id)}>
        //             <td className="border p-2 text-center">
        //               <input type="checkbox" checked={selectedPatentRows.includes(row.id)} onChange={() => togglePatentRow(row.id)} onClick={(e) => e.stopPropagation()} />
        //             </td>
        //             <td className="border p-2">{row.project_title}</td>
        //             <td className="border p-2">{row.filing_date}</td>
        //             <td className="border p-2">{row.status}</td>
        //             <td className="border p-2">{row.registration_number}</td>
        //           </tr>
        //         ))}
        //       </tbody>
        //     </table>

        //     {/* Edit Modal for Patent */}
        //     {editPatentModal && (
        //       <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        //         <div className="bg-white p-6 rounded-md w-full max-w-md">
        //           <h2 className="text-xl font-bold mb-4">Edit Patent</h2>
        //           <div className="space-y-3">
        //             <div>
        //               <label className="block font-semibold">Project Title</label>
        //               <input type="text" name="project_title" value={editPatentData.project_title} onChange={handlePatentChange} className="w-full border px-2 py-1 rounded-md" required/>
        //             </div>
        //             <div>
        //               <label className="block font-semibold">Filing Date</label>
        //               <input type="date" name="filing_date" value={editPatentData.filing_date} onChange={handlePatentChange} className="w-full border px-2 py-1 rounded-md" required/>
        //             </div>
        //             <div>
        //               <label className="block font-semibold">Status</label>
        //               <select
        //                 name="status"
        //                 value={editPatentData.status}
        //                 onChange={handlePatentChange}
        //                 className="w-full border px-2 py-1 rounded-md"
        //                 required
        //               >
        //                 <option value="Filed">Filed</option>
        //                 <option value="Published">Published</option>
        //                 <option value="Granted">Granted</option>
        //               </select>
        //             </div>
        //             <div>
        //               <label className="block font-semibold">Registration Number</label>
        //               <input type="text" name="registration_number" value={editPatentData.registration_number} onChange={handlePatentChange} className="w-full border px-2 py-1 rounded-md" required/>
        //             </div>
        //             <div className="flex justify-end mt-4 space-x-2">
        //               <button onClick={() => setEditPatentModal(false)} className="px-4 py-1 bg-gray-400 text-white rounded-md">Cancel</button>
        //               <button onClick={handleSavePatent} className="px-4 py-1 bg-blue-500 text-white rounded-md">Save</button>
        //             </div>
        //           </div>
        //         </div>
        //       </div>
        //     )}
        //   </div>
        // </fieldset>
//       </div>
//     </div>
<div
  className={`p-4 md:p-6 bg-white shadow-lg rounded-lg 
    w-full transition-all duration-300 space-y-6
    dark:bg-gray-800 dark:border-gray-600 dark:text-white
    ${!isMobile ? 'ml-64 w-auto' : isSidebarOpen ? 'ml-64 w-auto' : 'w-full'}`}
>
  {/* Header with Project Name */}
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Major Project</h1>
    
    {/* Navigation Tabs */}
    <div className="flex space-x-2">
      {["Details", "Tasks", "Publications", "Resources"].map((tab) => (
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
          <div className="w-full">
                {project && project.sem === "Major Project" ? (
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

      </fieldset>
        {/* <fieldset className="p-3 bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-300 dark:border-gray-700">
          <legend className="text-lg font-semibold text-gray-800 dark:text-gray-200 px-2">
            Status
          </legend>
          <div className="flex items-start space-x-4">
            <div className="w-1/2">
              {project && project.sem === "Major Project" ? (
                <>
                  <div className="flex space-x-2 mb-2">
                    {["Sem 7", "Sem 8"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setCurrentTab(tab)}
                        className={`px-3 py-1 rounded ${currentTab === tab ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  {currentTab === "Sem 7" && sem7Data && <Bar data={sem7Data} options={options} />}
                  {currentTab === "Sem 8" && sem8Data && <Bar data={sem8Data} options={options} />}
                </>
              ) : (
                sem7Data && <Bar data={sem7Data} options={options} />
              )}
            </div>
          </div>
        </fieldset> */}
      </div>
    )}
    
    {activeTab === "Tasks" && (
      <div className="p-4">
          <div className="overflow-x-auto">
          <div className="flex space-x-4 mb-4">
    <button
      className={`px-4 py-2 rounded ${activeSemester === 'sem7' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
      onClick={() => setActiveSemester('sem7')}
    >
      Sem 7
    </button>
    <button
      className={`px-4 py-2 rounded ${activeSemester === 'sem8' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
      onClick={() => setActiveSemester('sem8')}
    >
      Sem 8
    </button>
  </div>
  <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-[#5cc800]">
            <th className="border border-gray-300 p-2 text-white">Week</th>
            <th className="border border-gray-300 p-2 text-white">Task</th>
            <th className="border border-gray-300 p-2 text-white">Action</th>
          </tr>
        </thead>
        <tbody>
          {(activeSemester === 'sem7' ? tasksSem7 : tasksSem8).map((task) => (
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
        {isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
    <div className="bg-white p-6 rounded-md shadow-md h-[65vh] max-h-[70vh] overflow-y-auto">
      
      {/* Find tasks according to active semester */}
      {(() => {
        const currentTasks = activeSemester === 'sem7' ? tasksSem7 : tasksSem8;
        const selectedTask = currentTasks.find(task => task.id === selectedTaskId);

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
        {/* Weekly Task - Compact */}
        {/* <div className="flex space-x-2 mb-2">
          <button
            className={`px-3 py-1 rounded text-sm ${activeSemester === 'sem7' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
            onClick={() => setActiveSemester('sem7')}
          >Sem 7</button>
          <button
            className={`px-3 py-1 rounded text-sm ${activeSemester === 'sem8' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
            onClick={() => setActiveSemester('sem8')}
          >Sem 8</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-[#5cc800]">
                <th className="border border-gray-300 p-1 text-white">Week</th>
                <th className="border border-gray-300 p-1 text-white">Task</th>
                <th className="border border-gray-300 p-1 text-white w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {(activeSemester === 'sem7' ? tasksSem7 : tasksSem8).map((task) => (
                <tr key={task.id} className="border border-gray-300">
                  <td className="border border-gray-300 p-1">{task.week}</td>
                  <td className="border border-gray-300 p-1">
                    {Array.isArray(task.tasks) ? (
                      <div className="max-h-16 overflow-y-auto">
                        {task.tasks.map((t, index) => (
                          <div key={t.task_id}>{index + 1}. {t.task}</div>
                        ))}
                      </div>
                    ) : (
                      <div>{task.tasks}</div>
                    )}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    <button
                      onClick={() => openModal(task.id)}
                      className={`px-2 py-1 rounded text-xs ${task.submitted ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-700"}`}
                    >
                      {task.submitted ? "Edit" : "Submit"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */}
      </div>
    )}
    
    {activeTab === "Publications" && (
      <div className="p-4 space-y-4">
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between border rounded-md p-2">
              <span className="font-semibold text-black">Publications</span>
              <div className="space-x-2">
                <button className="px-2 py-1 bg-green-500 text-white rounded-md" onClick={handleAdd}>
                  Add
                </button>
                <button
                  className={`px-2 py-1 rounded-md ${selectedRows.length === 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  disabled={selectedRows.length !== 1}
                  onClick={handleEdit}
                >
                  Edit
                </button>
                <button
                  className={`px-2 py-1 rounded-md ${selectedRows.length >= 1
                      ? "bg-red-500 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  disabled={selectedRows.length === 0}
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full border border-gray-300 rounded-lg">
                <thead className="bg-[#5cc800] text-white">
                  <tr>
                    <th className="p-2 border w-10 text-center">✔</th>
                    <th className="p-2 border">Paper Name</th>
                    <th className="p-2 border">Conference Date</th>
                    <th className="p-2 border">Conference Name</th>
                  </tr>
                </thead>
                <tbody>
                  {publications.map((pub) => (
                    <tr
                      key={pub.id}
                      className={`cursor-pointer ${selectedRows.includes(pub.id) ? "bg-blue-100" : "hover:bg-gray-100"
                        }`}
                      onClick={() => toggleRowSelection(pub.id)}
                    >
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(pub.id)}
                          onChange={() => toggleRowSelection(pub.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="p-2 border">{pub.paper_name}</td>
                      <td className="p-2 border">{pub.conference_date}</td>
                      <td className="p-2 border">{pub.conference_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit Modal */}
            {editModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-md w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">Edit Publication</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold">Paper Name</label>
                      <input
                        type="text"
                        name="paper_name"
                        value={editData.paper_name}
                        onChange={handleEditChange}
                        className="w-full border px-2 py-1 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold">Conference Date</label>
                      <input
                        type="date"
                        name="conference_date"
                        value={editData.conference_date}
                        onChange={handleEditChange}
                        className="w-full border px-2 py-1 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold">Conference Name</label>
                      <input
                        type="text"
                        name="conference_name"
                        value={editData.conference_name}
                        onChange={handleEditChange}
                        className="w-full border px-2 py-1 rounded-md"
                        required
                      />
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <button
                        onClick={() => setEditModalOpen(false)}
                        className="px-4 py-1 bg-gray-400 text-white rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditSave}
                        className="px-4 py-1 bg-blue-500 text-white rounded-md"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Copyrights Section */}
          <div className="overflow-x-auto mt-6">
            <div className="flex items-center justify-between border rounded-md p-2">
              <span className="font-semibold text-black">Copyrights</span>
              <div className="space-x-2">
                <button className="px-2 py-1 bg-green-500 text-white rounded-md" onClick={handleAddCopyright}>
                  Add
                </button>
                <button
                  className={`px-2 py-1 rounded-md ${selectedCopyrightRows.length === 1 ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  disabled={selectedCopyrightRows.length !== 1}
                  onClick={handleEditCopyright}
                >
                  Edit
                </button>
                <button
                  className={`px-2 py-1 rounded-md ${selectedCopyrightRows.length >= 1 ? "bg-red-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  disabled={selectedCopyrightRows.length === 0}
                  onClick={handleDeleteCopyright}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Table */}
            <table className="min-w-full border-collapse border border-gray-300 mt-2">
              <thead className="bg-[#5cc800] text-white">
                <tr>
                  <th className="border p-2">✔</th>
                  <th className="border p-2">Project Title</th>
                  <th className="border p-2">Filing Date</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Registration Number</th>
                </tr>
              </thead>
              <tbody>
                {copyrights.map((c) => (
                  <tr key={c.id} className={`cursor-pointer ${selectedCopyrightRows.includes(c.id) ? "bg-blue-100" : "hover:bg-gray-100"}`} onClick={() => toggleCopyrightRow(c.id)}>
                    <td className="p-2 border text-center">
                      <input
                        type="checkbox"
                        checked={selectedCopyrightRows.includes(c.id)}
                        onChange={() => toggleCopyrightRow(c.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-2 border">{c.project_title}</td>
                    <td className="p-2 border">{c.filing_date}</td>
                    <td className="p-2 border">{c.status}</td>
                    <td className="p-2 border">{c.registration_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Edit Modal for Copyright */}
            {editCopyrightModal && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-md w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">Edit Copyright</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold">Project Title</label>
                      <input type="text" name="project_title" value={editCopyrightData.project_title} onChange={handleCopyrightChange} className="w-full border px-2 py-1 rounded-md" required/>
                    </div>
                    <div>
                      <label className="block font-semibold">Filing Date</label>
                      <input type="date" name="filing_date" value={editCopyrightData.filing_date} onChange={handleCopyrightChange} className="w-full border px-2 py-1 rounded-md" required/>
                    </div>
                    <div>
                      <label className="block font-semibold">Status</label>
                      <select
                        name="status"
                        value={editCopyrightData.status}
                        onChange={handleCopyrightChange}
                        className="w-full border px-2 py-1 rounded-md"
                        required
                      >
                        <option value="Filed">Filed</option>
                        <option value="Registered">Registered</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold">Registration Number</label>
                      <input type="text" name="registration_number" value={editCopyrightData.registration_number} onChange={handleCopyrightChange} className="w-full border px-2 py-1 rounded-md" required/>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <button onClick={() => setEditCopyrightModal(false)} className="px-4 py-1 bg-gray-400 text-white rounded-md">Cancel</button>
                      <button onClick={handleSaveCopyright} className="px-4 py-1 bg-blue-500 text-white rounded-md">Save</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Patents Section */}
          <div className="overflow-x-auto mt-6">
            <div className="flex items-center justify-between border rounded-md p-2">
              <span className="font-semibold text-black">Patents</span>
              <div className="space-x-2">
                <button className="px-2 py-1 bg-green-500 text-white rounded-md" onClick={handleAddPatent}>Add</button>
                <button className={`px-2 py-1 rounded-md ${selectedPatentRows.length === 1 ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`} disabled={selectedPatentRows.length !== 1} onClick={handleEditPatent}>Edit</button>
                <button className={`px-2 py-1 rounded-md ${selectedPatentRows.length >= 1 ? "bg-red-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`} disabled={selectedPatentRows.length === 0} onClick={handleDeletePatent}>Delete</button>
              </div>
            </div>

            {/* Table */}
            <table className="min-w-full border-collapse border border-gray-300 mt-2">
              <thead className="bg-[#5cc800] text-white">
                <tr>
                  <th className="border p-2">✔</th>
                  <th className="border p-2">Project Title</th>
                  <th className="border p-2">Filing Date</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Registration/Patent Number</th>
                </tr>
              </thead>
              <tbody>
                {patentData.map((row) => (
                  <tr key={row.id} className={`cursor-pointer ${selectedPatentRows.includes(row.id) ? "bg-blue-100" : "hover:bg-gray-100"}`} onClick={() => togglePatentRow(row.id)}>
                    <td className="border p-2 text-center">
                      <input type="checkbox" checked={selectedPatentRows.includes(row.id)} onChange={() => togglePatentRow(row.id)} onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td className="border p-2">{row.project_title}</td>
                    <td className="border p-2">{row.filing_date}</td>
                    <td className="border p-2">{row.status}</td>
                    <td className="border p-2">{row.registration_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Edit Modal for Patent */}
            {editPatentModal && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-md w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">Edit Patent</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold">Project Title</label>
                      <input type="text" name="project_title" value={editPatentData.project_title} onChange={handlePatentChange} className="w-full border px-2 py-1 rounded-md" required/>
                    </div>
                    <div>
                      <label className="block font-semibold">Filing Date</label>
                      <input type="date" name="filing_date" value={editPatentData.filing_date} onChange={handlePatentChange} className="w-full border px-2 py-1 rounded-md" required/>
                    </div>
                    <div>
                      <label className="block font-semibold">Status</label>
                      <select
                        name="status"
                        value={editPatentData.status}
                        onChange={handlePatentChange}
                        className="w-full border px-2 py-1 rounded-md"
                        required
                      >
                        <option value="Filed">Filed</option>
                        <option value="Published">Published</option>
                        <option value="Granted">Granted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold">Registration Number</label>
                      <input type="text" name="registration_number" value={editPatentData.registration_number} onChange={handlePatentChange} className="w-full border px-2 py-1 rounded-md" required/>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <button onClick={() => setEditPatentModal(false)} className="px-4 py-1 bg-gray-400 text-white rounded-md">Cancel</button>
                      <button onClick={handleSavePatent} className="px-4 py-1 bg-blue-500 text-white rounded-md">Save</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

export default Major1_detail;
