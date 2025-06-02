import { useState, useEffect } from "react";
import { FaFilter, FaDownload, FaPlus, FaUpload, FaTimes } from "react-icons/fa";
import { useNavigate , useParams} from "react-router-dom";// Import ProjectDetailView
import AxiosInstance from "../../../AxiosInstance";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import Resources from "../Resources/Resources";
import AllocationSummaryModal from "./Allocation_summary";
const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28"];
const ProjectDetails = ({ selectedCategory, selectedYear, selectedSemester, onBack, isDarkMode, onDeptBack }) => {
  const { category, year, semester , div} = useParams(); 
  const [activeTab, setActiveTab] = useState("Projects");
  //const [selectedProject, setSelectedProject] = useState(null);
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

  const [showTasksTable, setShowTasksTable] = useState(false);
  const [selectedSem, setSelectedSem] = useState("Sem 7");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupLabel, setSelectedGroupLabel] = useState(null);
  const [selectedCopyright, setSelectedCopyright] = useState(null);
  const [selectedCopyrightLabel, setSelectedCopyrightLabel] = useState(null);

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const getSemKey = (semLabel) => {
    return semLabel === "Sem 7" ? "sem_7" : "sem_8";
  };


  const [allWeeks, setAllWeeks] = useState({ sem_7: [], sem_8: [] });

  const selectedWeeks = allWeeks[getSemKey(selectedSem)] || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [taskText, setTaskText] = useState("");
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  // Fetch batches on component mount
  useEffect(() => {
    AxiosInstance.get(`/batches/by-department/?category=${category}`)
      .then((response) => setBatches(response.data))
      .catch((error) => console.error("Error fetching batches:", error));
  }, [category]);

  // Fetch students when a batch is selected
  useEffect(() => {
    if (selectedBatch) {
      AxiosInstance.get(`/studentslist/by-batch/?category=${category}&year=${year}&sem=${semester}&div=${div}&batch=${selectedBatch}`)
        .then((response) => setStudents(response.data))
        .catch((error) => console.error("Error fetching students:", error));
    }
  }, [category, year,semester,div, selectedBatch]);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = (event) => {
    setSelectedFile(event.target.files[0]); // Store the uploaded file
  };
  const [uploadResult, setUploadResult] = useState(null);
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("category", category); 
    formData.append("year", year);          
    formData.append("sem", semester); 
    formData.append("div", div);

    try {
      const response = await AxiosInstance.post(
        "/student/upload-student-file/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Response:", response.data);
      alert("Upload Successful!", response.data);

      setSelectedFile(null);
      setUploadResult(response.data); 

    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
      alert("Upload Failed. Check console for error details.");
    }
    
  };

  const [isStudentActive, setIsStudentActive] = useState(false);
  const [isTeacherActive, setIsTeacherActive] = useState(false);

  useEffect(() => {
    const checkFormStatus = async () => {
      try {
        const response = await AxiosInstance.get(`/semesters/form-status/?category=${category}&year=${year}&sem=${semester}&div=${div}`);
        setIsStudentActive(response.data.isStudentActive);
        setIsTeacherActive(response.data.isTeacherActive);
      } catch (error) {
        console.error("Error fetching form status:", error.response?.data || error.message);
      }
    };
  
    checkFormStatus();
  }, [category, year, semester, div]);

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.moodleid.includes(searchTerm)
  );

  const [selectedStudents, setSelectedStudents] = useState([]);

const handleStudentSelection = (studentId) => {
  setSelectedStudents((prev) => 
    prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
  );
};

const handleRegister = () => {
  if (!selectedBatch || selectedStudents.length === 0) {
    alert("Please select a batch and students.");
    return;
  }

  AxiosInstance.post("/student/register-sem-wise/", {
    category: category,
    year: year,
    sem : semester,
    div : div,
    batch: selectedBatch,
    students: selectedStudents,
  })
    .then((response) => {
      console.log("Success:", response.data);
      setSelectedStudents([]);
      setShowStudentForm(false);
      fetchStudents();
      alert("Students registered successfully!");

    })
    .catch((error) => {
      console.error("Error:", error.response?.data || error.message);
    });
};
  
  const [teachers, setTeachers] = useState([]);
  const [excelFile, setExcelFile] = useState(null);

  useEffect(() => {
    AxiosInstance.get(`/teacher/teachers-pending/?category=${category}&year=${year}&sem=${semester}&div=${div}`)
      .then(response => setTeachers(response.data))
      .catch(error => console.error("Error fetching teachers:", error));
  }, [category,year,semester,div]);

  const [selectedTeachers, setSelectedTeachers] = useState([]);

// const handleSelectionChange = (teacherId) => {
//   setSelectedTeachers((prevSelected) =>
//     prevSelected.includes(teacherId)
//       ? prevSelected.filter((id) => id !== teacherId) // Remove if already selected
//       : [...prevSelected, teacherId] // Add if not selected
//   );
// };
const handleSelectionChange = (teacherId) => {
  setSelectedTeachers((prevSelected) => {
    console.log("Previous Selected BEFORE Fix:", prevSelected);
    
    if (!prevSelected) {
      console.log("Fixing prevSelected to an empty array.");
      prevSelected = []; // Ensure it's never undefined
    }

    console.log("Previous Selected AFTER Fix:", prevSelected);

    return prevSelected.includes(teacherId)
      ? prevSelected.filter((id) => id !== teacherId)
      : [...prevSelected, teacherId];
  });
};


  const handleExcelUpload = (event) => {
    setExcelFile(event.target.files[0]);
  };

  const [domain, setDomain] = useState(""); // Store selected domain
  const [filteredGuides, setFilteredGuides] = useState([]); // Store guides based on selected domain

  const handleGroupClick = (e) => {
      setSelectedGroup(e.name);
      setSelectedGroupLabel(e.name);
  };

  const handleCopyrightClick = (e) => {
    setSelectedCopyright(e.name);
    setSelectedCopyrightLabel(e.name);
  };

  const [allocationResults, setAllocationResults] = useState([]);

  const handleOpenPDF = async () => {
    try {
      const response = await AxiosInstance.get(`pdf/generate-pdf/?category=${category}&year=${year}&sem=${semester}&div=${div}`, 
        { responseType: "blob" } // Ensure binary response
      );

      // Create a Blob URL from the response data
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);

      // Open the PDF in a new tab
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Error opening the PDF:", error);
    }
};

const [groupsData, setGroupsData] = useState([]);

useEffect(() => {
  const fetchGroupsData = async () => {
    try {
      const response = await AxiosInstance.get(`/semesters/group-status/?category=${category}&year=${year}&sem=${semester}&div=${div}`);
      setGroupsData(response.data);
    } catch (error) {
      alert("Error fetching groups data:", error.response.data.error);
    }
  };

  if (category && year && semester && div) {
    fetchGroupsData();
  }
}, [category,year,semester,div]);
  // const groupsBreakdown = {
  //   "Students Allocated": [
  //     { name: "Div A", value: 18 },
  //     { name: "Div B", value: 18 },
  //   ],
  //   "Students Remaining": [
  //     { name: "Div A", value: 2 },
  //     { name: "Div B", value: 0 },
  //   ],
  // };
  
  // const publicationData = [
  //   { name: "A", value: 2 },
  //   { name: "B", value: 1 },
  // ];

  const [publicationData, setPublicationData] = useState([]);

useEffect(() => {
  const fetchPublicationData = async () => {
    try {
      const response = await AxiosInstance.get(`/semesters/publication-status/?category=${category}&year=${year}&sem=${semester}&div=${div}`);
      setPublicationData(response.data);
      console.log(response.data)
    } catch (error) {
      alert("Error fetching groups data:", error.response.data.error);
    }
  };

  if (category && year && semester && div) {
    fetchPublicationData();
  }
}, [category,year,semester,div]);
  
  // const copyrightData = [
  //   { name: "Patent", value: 0 },
  //   { name: "Copyright", value: 4 },
  // ];
  // const copyrightBreakdown = {
  //   Patent: [
  //     { name: "Div A", value: 0 },
  //     { name: "Div B", value: 0 },
  //   ],
  //   Copyright: [
  //     { name: "Div A", value: 2 },
  //     { name: "Div B", value: 2 },
  //   ],
  // };
  const [copyrightData, setCopyrightData] = useState([]);
  const [copyrightBreakdown, setCopyrightBreakdown] = useState([]);

useEffect(() => {
  const fetchCopyrightData = async () => {
    try {
      const response = await AxiosInstance.get(`/semesters/copyright-patent-status/?category=${category}&year=${year}&sem=${semester}&div=${div}`);
      setCopyrightData(response.data.overall);
      setCopyrightBreakdown(response.data.breakdown);
    } catch (error) {
      alert("Error fetching groups data:", error.response.data.error);
    }
  };

  if (category && year && semester && div) {
    fetchCopyrightData();
  }
}, [category,year,semester,div]);

  const weeklyTasksData = [
    { week: "Week 1", groups: 10 },
    { week: "Week 2", groups: 0 },
    { week: "Week 3", groups: 0 },

  ];
  
  const [chartData, setChartData] = useState({ sem_7: [], sem_8: [], default: [] });
  const [semActive, setSemActive] = useState("sem_7");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await AxiosInstance.get(`/week/weekly-chart-data/?category=${category}&year=${year}&sem=${semester}&div=${div}`, {
        });
        setChartData(res.data);
        console.log(res.data);
        if (semester !== "Major Project") {
          setSemActive("default");
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, [category, year, semester, div]);

  const handleBarClick = async (barData) => {
    const weekNumber = barData.week.split(" ")[1];
    console.log(semActive);
    try {
      const response = await AxiosInstance.get(
        `/pdf/week-progress/?category=${category}&year=${year}&sem=${semester}&div=${div}&week_number=${weekNumber}&sem_new=${semActive}`, // Replace with your actual endpoint
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
      const filename = `week_${weekNumber}_${category}_${year}_${semester}_${div}.xlsx`;
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

  const renderChart = (data) => (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="week" interval={0}/>
        <YAxis ticks={ticks}/>
        <Tooltip cursor={{ fill: "transparent" }}/>
        <Bar dataKey="groups" fill="#0088FE" onClick={(data, index) => handleBarClick(data, index)}/>
      </BarChart>
    </ResponsiveContainer>
  );
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleGuideAllocation = () => {
    AxiosInstance
        .get(`guide-allocation/allocate_guides/?category=${category}&year=${year}&sem=${semester}&div=${div}`)
        .then((response) => {
              if (response && response.data) {
                // setAllocationResults(response.data.allocations);
                console.log(response.data.automatic_allocations);
                console.log(response.data.manual_allocations)
                setSummary(response.data.summary);
                setShowModal(true);
                fetchProjects(category, year, semester, div);
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

const fetchWeeklyTasks = async () => {
  try {
    const response = await AxiosInstance.get(`/week/formatted/?category=${category}&year=${year}&sem=${semester}&div=${div}`);
    console.log(response.data);
    if(semester=="Major Project"){
      setAllWeeks(response.data)
    } else{
      setWeeklyTasks(response.data); 
    }
  } catch (error) {
    console.error('Failed to fetch weekly tasks:', error);
    alert('Could not load tasks. Please try again.');
  }
};

useEffect(() => {
  if (category, year, semester, div) {
    fetchWeeklyTasks();
  }
}, [category, year, semester, div]);

const handleAddWeeklyTask = async () => {
  try {
    const data = {};

    if (semester === "Major Project") {
      data.sem = selectedSem;  
    }
    const response = await AxiosInstance.post(`/week/add-weekly-tasks/?category=${category}&year=${year}&sem=${semester}&div=${div}`,data);
    alert('Weekly tasks added successfully!');
    fetchWeeklyTasks();
    setShowTaskForm(false);  
  } catch (error) {
    if (error.response) {
      alert(error.response.data.message || 'Failed to add weekly tasks.');
    } else {
      alert('Server error. Please try again later.');
    }
    console.error('Error adding weekly tasks:', error);
  }
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
        `pdf/guide_allocation_excel/?category=${category}&year=${year}&sem=${semester}&div=${div}`, // Replace with your actual endpoint
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

const [roles, setRoles] = useState({ academic_role: "", project_roles: [] });

  useEffect(() => {
    AxiosInstance.get(`/teacher/roles/?category=${category}&year=${year}&sem=${semester}&div=${div}`)
      .then((response) => {
        setRoles(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error.response.data.error);
      });
  }, [category, year,semester,div]);

  const { academic_role, project_roles } = roles;

  const isProjectCoordinator = project_roles.includes("Project Coordinator");
  const isProjectCoCoordinator = project_roles.includes("Project Co-Coordinator");
  const isHOD = academic_role === "Head of Department";

  let visibleTabs = [];

  if ((isHOD && (isProjectCoordinator || isProjectCoCoordinator)) || isProjectCoordinator || isProjectCoCoordinator) {
    visibleTabs = ["Projects", "Operations", "Status", "Resources"]; // Show all tabs
  } else if (isHOD) {
    visibleTabs = ["Projects", "Status", "Resources"]; // Show only the "Projects" tab
  } else {
    visibleTabs = ["Projects"]; // No projects assigned, hide all tabs
  }

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [query, setQuery] = useState("");
  const [selectedDiv, setSelectedDiv] = useState("");
  const [projects, setProjects] = useState([]);

  const handleRowSelection = (groupId) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(groupId)
        ? prevSelected.filter((id) => id !== groupId)
        : [...prevSelected, groupId]
    );
  };
  const [ticks, setTicks] = useState([]);
  // useEffect(() => {
  //   AxiosInstance.get(`/projects/filtered-projects/?category=${category}&year=${year}&sem=${semester}&div=${div}`)
  //     .then((response) => {
  //       setProjects(response.data);
  //       const maxGroups = projects.length;

  //       // Set interval based on the number of projects
  //       const interval = maxGroups > 10 ? 5 : 2;

  //       const calculatedTicks = Array.from(
  //         { length: Math.ceil(maxGroups / interval) + 1 },
  //         (_, i) => i * interval
  //       );

  //       setTicks(calculatedTicks);
  //       console.log("Projects:", response.data);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching projects:", error.response.data.error);
  //     });
  // }, [category, year, semester,div]);

  const fetchProjects = async (category, year, semester, div) => {
    try {
      const response = await AxiosInstance.get(`/projects/filtered-projects/?category=${category}&year=${year}&sem=${semester}&div=${div}`);
      
      setProjects(response.data);
      const maxGroups = response.data.length;
  
      // Set interval based on the number of projects
      const interval = maxGroups > 10 ? 5 : 2;
  
      const calculatedTicks = Array.from(
        { length: Math.ceil(maxGroups / interval) + 1 },
        (_, i) => i * interval
      );
  
      setTicks(calculatedTicks);
      console.log("Projects:", response.data);
    } catch (error) {
      console.error("Error fetching projects:", error.response?.data?.error || error.message);
    }
  };

  useEffect(() => {
    fetchProjects(category, year, semester, div);
  }, [category, year, semester, div]);

  const filteredGroups = projects.filter((group) => {
    const matchesDomain = selectedDomain ? group.domain === selectedDomain : true;
    const matchesDiv = selectedDiv ? group.div === selectedDiv : true; 
    const matchesSearch =
    (group.leader_name || "").toLowerCase().includes(query.toLowerCase()) ||
    (group.project_guide_name || "").toLowerCase().includes(query.toLowerCase()) ||
    (group.project_coguide_name || "").toLowerCase().includes(query.toLowerCase());
  
    return matchesDomain && matchesDiv && matchesSearch;
  });

  const copyrightDownload = async (segment) => {
    try {
      const response = await AxiosInstance.get(
        `pdf/copyright-excel/?category=${category}&year=${year}&sem=${semester}&div=${div}&type=${selectedCopyright}&segment=${segment}`, // Replace with your actual endpoint
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
      const filename = `${selectedCopyright}_${category}_${year}_${semester}_Div_${segment}.xlsx`;
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
  

  const publicationDownload = async (chartSegment) => {
    try {
      const response = await AxiosInstance.get(
        `pdf/publication-excel/?category=${category}&year=${year}&sem=${semester}&div=${div}&segment=${chartSegment}`, // Replace with your actual endpoint
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
      const filename = `Publication_${category}_${year}_${semester}_Div_${chartSegment}.xlsx`;
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

  const groupDownload = async (chartSegment) => {
    try {
      const response = await AxiosInstance.get(
        `pdf/group-excel/?category=${category}&year=${year}&sem=${semester}&div=${div}&segment=${chartSegment}`, // Replace with your actual endpoint
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
      const filename = `student_${chartSegment}_${category}_${year}_${semester}_${div}.xlsx`;
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
  
  const [experienceFilterType, setExperienceFilterType] = useState(""); // Filter type (greater/lesser)
const [experienceThreshold, setExperienceThreshold] = useState(""); 
const [searchQuery, setSearchQuery] = useState(""); 

const filteredTeachers = teachers.filter((teacher) => {
  const matchesSearch =
    searchQuery === "" ||
    teacher.first_name.toLowerCase().includes(searchQuery) ||
    teacher.last_name.toLowerCase().includes(searchQuery);

  const matchesExperience =
    experienceFilterType === "" ||
    (experienceFilterType === "greater" && teacher.experience >= experienceThreshold) ||
    (experienceFilterType === "lesser" && teacher.experience <= experienceThreshold);

  return matchesSearch && matchesExperience;
});

const [defaultAvailability, setDefaultAvailability] = useState(""); // Default availability
const [teacherAvailability, setTeacherAvailability] = useState({}); // Custom availability
const updateAvailability = (teacherId, value) => {
  setTeacherAvailability((prev) => ({
    ...prev,
    [teacherId]: Number(value), // Only allow numbers
  }));
};

const handleSubmit = async () => {
  AxiosInstance.post("/teacher/sem-register/", {
    category: category,
    year: year,
    sem: semester,
    div: div,
    teachers: selectedTeachers.map((teacherId) => ({
      id: teacherId,
      availability: Number(teacherAvailability[teacherId])||Number(defaultAvailability),
    })),
  })
    .then((response) => {
      setShowTeacherForm(false);
      setSelectedTeachers([]);
      alert("Success:"+ response.data.message);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};
const handleTeacherButton = async () => {
  try {
    const response = await AxiosInstance.patch(
      `/semesters/active-teacher-form/?category=${category}&year=${year}&sem=${semester}&div=${div ?? ''}`
    );
    alert(`Success: ${response.data.message}`);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};
const handleStudentButton = async () => {
  try {
    const response = await AxiosInstance.patch(
      `/semesters/active-student-form/?category=${category}&year=${year}&sem=${semester}&div=${div}`
    );
    alert(`Success: ${response.data.message}`);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};

const [isAllocateOpen, setIsAllocateOpen] = useState(false);
const [preferences, setPreferences] = useState(null);
const [projectId, setProjectID] = useState("")
const handleOpenPopup = async (projectID) => {
  if (!projectID) return; 
  try {
    console.log(projectID);
    setProjectID(projectID);
    const response = await AxiosInstance.get(
      `/projectpreference/project-pref/?projectID=${projectID}`
    );
    setPreferences(response.data);
    console.log(response.data)
  } catch (error) {
    console.error("Error:", error.response?.data.error || error.message);
  } finally {
    setIsAllocateOpen(true); // Ensure modal opens even if an error occurs
  }
};

// Close the popup
const handleClosePopup = () => {
  setIsAllocateOpen(false);
};
const handleSubmitTask = async () => {
  console.log(selectedWeek);
  console.log(selectedSem);
  const payload = {
    week_number: selectedWeek,
    tasks: taskText.split(",").map(t => t.trim()).filter(Boolean),
  };

  if (semester === "Major Project" && selectedSem) { // from your selected dropdown
    payload.sem = selectedSem; // either "sem_7" or "sem_8"
  }

  try {
    const res = await AxiosInstance.post(`/week/create_or_update_week/?category=${category}&year=${year}&sem=${semester}&div=${div}`, payload);
    alert(res.data.message);
    fetchWeeklyTasks();
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
};
const handleDeleteWeek = async (weekNumber) => {
  try {
    const data = {};

    if (semester === "Major Project") {
      data.sem = selectedSem;  
    }
    const res = await AxiosInstance.delete(
      `/week/delete_week/?category=${category}&year=${year}&sem=${semester}&div=${div}&week_number=${weekNumber}`,data
    );
    alert(res.data.message);
    fetchWeeklyTasks(); // refresh UI
  } catch (err) {
    console.error("Error deleting week:", err);
  }
};

  const [domainsData, setDomainsData] = useState([]);
  const [domainselected, setDomainSelected] = useState("");
  const [selectedGuide, setSelectedGuide] = useState('');
  const [guides, setGuides] = useState([]);
  const fetchDomainData = async () => {
    try {
      const response = await AxiosInstance.get(`/teacherpreferences/availability/?category=${category}&year=${year}&sem=${semester}&div=${div}`);
      setDomainsData(response.data); 
      console.log(response.data); // Set the data in state
    } catch (error) {
      console.error('Error fetching domain teacher data:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await AxiosInstance.get(`/teacherpreferences/availability/?category=${category}&year=${year}&sem=${semester}&div=${div}`);
      setFilteredGuides(response.data); 
      console.log(response.data); // Set the data in state
    } catch (error) {
      console.error('Error fetching domain teacher data:', error);
    }
  };

  useEffect(() => {
    if(semester == "Major Project"){
      fetchDomainData();
    }
    else{
      fetchAvailability();
    }
  }, [semester]);

  const [filteredCoGuides, setFilteredCoGuides] = useState([]);

  const handleDomainChange = (event) => {
    const domainId = event.target.value;
    setDomainSelected(domainId);
    
    // Update guides list based on the selected domain
    const selectedDomainData = domainsData.find(domain => domain.domain_id === parseInt(domainId));
    if (selectedDomainData) {
      setGuides(selectedDomainData.teachers);
      setFilteredCoGuides(selectedDomainData.co_guides);
    }
  };
  const handleManual = async (event) => {
    event.preventDefault();
    let payload = {}
    // Prepare the data to be sent to the backend
    if (semester == "Major Project"){
      payload = {
        projectID: projectId,
        domainID: domainselected,
        guideID: selectedGuide,
      };
    }
    else{
      payload = {
        projectID: projectId,
        guideID: selectedGuide,
      };
    }

  
    try {
      const response = await AxiosInstance.post(
        '/projectpreference/manual_save_project/', // Adjust to your backend URL
        payload
      );
      console.log('Data saved:', response.data);
      alert("Saved Successfully");
      // Handle successful save, close the popup, and update state if necessary
      setIsAllocateOpen(false);
      setProjectID(null);
      setDomainSelected(null);
      setSelectedGuide(null);
      fetchProjects(category, year, semester, div);
    } catch (error) {
      console.error('Error saving data:', error.response?.data.error || error.message);
    }
  };

  const [addPopup, setAddPopup] = useState(false);
  const [editPopup, setEditPopup] = useState(false);
  
  const [coGuide, setCoGuide] = useState("");
  useEffect(() => {
    if (semester !== "Major Project") {
      setDomainSelected("");
      setSelectedGuide("");
      setCoGuide("");
      setGuides([]);
    }
  }, [semester]);

  const [availstudents, setAvailStudents] = useState([]);

  const fetchStudents = async () => {
    try {
      const response = await AxiosInstance.get("/semesters/available_students", {
        params: {
          category: category,
          year: year,
          sem: semester,
          div: div,
        },
      });
      setAvailStudents(response.data.students);
      console.log(response.data.students);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    if (category && year && semester && div) {
      fetchStudents();
    }
  }, [category, year, selectedSem, div]);

  const handleMemberChange = (index, value) => {
    const updatedMembers = [...members];  // clone
    updatedMembers[index] = value;         // update at correct index
    setMembers(updatedMembers);            // update state
  };

  const [leader, setLeader] = useState("");
  const [members, setMembers] = useState(["", "", ""]);
  const [division, setDivision] = useState("");

  const handleAddSubmit = async () => {
    try {
      const payload = {
        leader: leader,
        members: members.filter(m => m !== ""),  
        domain: domainselected || null,
        guide: selectedGuide,
        co_guide: coGuide || null,
        division: division || null,  
      };
      console.log(payload);
  
      const response = await AxiosInstance.post(`/projectpreference/create-project/?category=${category}&year=${year}&sem=${semester}&div=${div}`, payload);
  
      if (response.status === 201) {
        alert("Project created successfully!");
        setAddPopup(false);
        fetchProjects(category, year, semester, div);
        // clear form
      } else {
        alert("Error creating project.");
      }
    } catch (error) {
      console.error(error);
      alert("Server error.");
    }
  };

  const handleDeleteProjects = async () => {
    if (selectedRows.length === 0) return;

  try {
    const response = await AxiosInstance.post("/projectpreference/delete-project/", {
      project_ids: selectedRows,
    });

    alert(response.data.message);
    // Optionally refresh the project list
    fetchProjects(category, year, semester, div);
    setSelectedRows([]);
  } catch (err) {
    console.error("Error deleting projects:", err);
    alert("An error occurred while deleting.");
  }
  };

  const [selectedProjectToEdit,setSelectedProjectToEdit] = useState("");

  const [uniqueStudents, setUniqueStudents] = useState([]);

  const handleEditClick = async () => {
    if (selectedRows.length !== 1) {
      alert("Please select exactly one project to edit.");
      return;
    }
  
    const projectId = selectedRows[0];  // because selectedRows is an array of IDs
  
    try {
      const response = await AxiosInstance.get(`/projectpreference/${projectId}/fetch-project/`);
      const projectData = response.data;
  
      // Set form fields with fetched data
      setLeader({
        name: projectData.leader.name,
        moodle_id: projectData.leader.moodle_id,
      });
  
      setMembers(
        projectData.members.map((member) => ({
          name: member.name,
          moodle_id: member.moodle_id,
        }))
      );
      setDivision(projectData.division || "");
      setDomainSelected(projectData.domain || "");
      setSelectedGuide(projectData.guide);
      setCoGuide(projectData.co_guide || "");
  
      setSelectedProjectToEdit(projectId);
      
      const allStudents = [
        ...availstudents,  // assuming backend sends available students also
        {
          name: projectData.leader.name,
          moodle_id: projectData.leader.moodle_id,
        },
        ...projectData.members,
      ];
  
      const uniqueStudents = Array.from(
        new Map(allStudents.map((s) => [s.moodle_id, s])).values()
      );
  
      setUniqueStudents(uniqueStudents); 

      setEditPopup(true);  // Open your edit popup/modal
    } catch (error) {
      console.error("Error fetching project:", error);
      alert("Failed to load project details.");
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedProjectToEdit) return;
      console.log(selectedProjectToEdit);
    const payload = {
      project_id: selectedProjectToEdit,
      leader_id: leader?.moodle_id,
      member_ids: members.filter(Boolean).map(m => m.moodle_id), // filter out empty slots
      guide_id: selectedGuide,
      co_guide_id: coGuide || null,
      domain_id: domainselected || null,
      division: division || "",
      semester,
    };
  
    try {
      console.log(payload);
      const response = await AxiosInstance.put(
        `/projectpreference/${selectedProjectToEdit}/update/`, // adjust to your endpoint
        payload
      );
  
      if (response.status === 200) {
        alert("Project updated successfully!");
        setEditPopup(false);
        setSelectedProjectToEdit(null);
        fetchProjects(category, year, semester, div);
        // optionally refresh project list
      } else {
        alert("Failed to update project.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating.");
    }
  };
  
  

  return (
    <div className={`p-6 transition duration-300 ${isDarkMode ? "bg-[#121138] text-white" : "bg-white text-black"} pt-16`}>
      {/* Breadcrumb Navigation */}
      <p className="text-2xl mb-4 font-medium">
        <span className="text-red-500 cursor-pointer hover:underline" onClick={() => navigate(`/department`)}>{category}</span> &gt;
        <span className="text-red-500 cursor-pointer hover:underline" onClick={() => navigate(`/department/${category}/${year}/Semester`)}>{year}</span> &gt;
        <span className="text-blue-500">{semester}{div && div !== "null" ? ` ${div}` : ""}</span>
      </p>

      {/* Show ProjectDetailView if a project is selected */}
      {/* {selectedProject ? (
        <ProjectDetailView
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          isDarkMode={isDarkMode}
          selectedCategory={selectedCategory}
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
        />
      ) : ( */}
          {/* Tabs */}
      <div className="flex border-b mb-4">
        {(visibleTabs.length > 0 ? visibleTabs : ["Projects"]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-lg font-medium transition border-b-4 ${activeTab === tab
                ? isDarkMode
                  ? "border-green-400 text-green-300"
                  : "border-blue-700 text-blue-700"
                : isDarkMode
                  ? "border-gray-600 text-gray-400"
                  : "border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-500"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-[#2a2a40] text-white" : "bg-white text-black"}`}>
        {activeTab === "Projects" ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-3xl font-semibold">Projects</h2>
                  {/* <FaFilter className={`cursor-pointer transition ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-black"}`} size={22} title="Filter Projects" /> */}
                </div>

                
                <div className="overflow-x-auto p-2">
                <div className="flex justify-between items-center mb-4 space-x-4">
        {/* Search Box */}
        <input
        type="text"
        placeholder="Search by leader, guide, co-guide..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg flex-1"
      />

        {/* Domain Filter */}
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-1/4"
        >
          <option value="">All Domains</option>
          {[...new Set(projects.map((group) => group.domain))].map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        <select
    value={selectedDiv}
    onChange={(e) => setSelectedDiv(e.target.value)}
    className="px-4 py-2 border border-gray-300 rounded-lg"
  >
    <option value="">All Divisions</option>
    {Array.from(new Set(projects.map(p => p.div))).map((div, index) => (
    <option key={index} value={div}>{div}</option>
  ))}
  </select>

        {/* Action Buttons */}
        {(isProjectCoordinator || isProjectCoCoordinator) && (
  <div className="flex space-x-2">
    {addPopup && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-10">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Add Project</h2>

        {/* Leader */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Leader:</label>
          <select
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select Leader</option>
            {availstudents.map((student) => (
              <option key={student.moodle_id} value={student.moodle_id}>
                {student.name} ({student.moodle_id})
              </option>
            ))}
          </select>
        </div>

        {/* Members */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Members (up to 3):</label>
          {Array.from({ length: 3 }).map((_, idx) => (
            <select
              key={idx}
              value={members[idx] || ""}
              onChange={(e) => handleMemberChange(idx, e.target.value)}
              className="w-full p-2 border rounded-md mt-2"
            >
              <option value="">Select Member {idx + 1}</option>
              {availstudents.map((student) => (
              <option key={student.moodle_id} value={student.moodle_id}>
                {student.name} ({student.moodle_id})
              </option>
            ))}
            </select>
          ))}
        </div>

        {/* Conditional rendering based on semester */}
        {semester === "Major Project" ? (
          <div>
            {/* Domain */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Domain:</label>
              <select
                value={domainselected}
                onChange={handleDomainChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">-- Select Domain --</option>
                {domainsData.map((domain) => (
                  <option key={domain.domain_id} value={domain.domain_id}>
                    {domain.domain_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Guide */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Guide:</label>
              <select
                className="p-2 border rounded-md w-full"
                disabled={!domainselected}
                value={selectedGuide}
                onChange={(e) => setSelectedGuide(e.target.value)}
              >
                <option value="">-- Select Guide --</option>
                {guides.length > 0 ? (
                  guides.map((guide) => (
                    <option key={guide.teacher_id} value={guide.teacher_id}>
                      {guide.teacher_name} (Available: {guide.availability})
                    </option>
                  ))
                ) : (
                  <option value="">No guides available</option>
                )}
              </select>
            </div>

            {/* Co-Guide */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Co-Guide:</label>
              <select
                value={coGuide}
                onChange={(e) => setCoGuide(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={!domainselected}
              >
                <option value="">Select Co-Guide</option>
                {filteredCoGuides.length > 0 ? (
                  filteredCoGuides.map((coGuide) => (
                    <option key={coGuide.teacher_id} value={coGuide.teacher_id}>
                      {coGuide.teacher_name}
                    </option>
                  ))
                ) : (
                  <option value="">No co-guides available</option>
                )}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium"  >Division:</label>
              <input type="text" value={division}
  onChange={(e) => setDivision(e.target.value)} className="w-full p-2 border rounded-md"/>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {/* Guide only */}
            <label className="font-medium">Select Guide:</label>
            <select
              className="p-2 border rounded-md w-full"
              value={selectedGuide}
              onChange={(e) => setSelectedGuide(e.target.value)}
            >
              <option value="">-- Select Guide --</option>
              {filteredGuides.length > 0 ? (
                filteredGuides.map((guide) => (
                  <option key={guide.teacher_id} value={guide.teacher_id}>
                    {guide.teacher_name} (Available: {guide.availability})
                  </option>
                ))
              ) : (
                <option value="">No guides available</option>
              )}
            </select>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => {
              setAddPopup(false);
              setDomainSelected("");
              setSelectedGuide("");
              setCoGuide("");
              setGuides([]);
            }}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleAddSubmit}
          >
            Submit
          </button>
        </div>
    </div>
  </div>
)}
{editPopup && selectedProjectToEdit && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-10">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Edit Project</h2>
      
      {/* Leader */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Leader:</label>
        <select
          value={leader?.moodle_id || ""}
          onChange={(e) => setLeader(
            uniqueStudents.find(student => student.moodle_id === e.target.value)
          )}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select Leader</option>
          {uniqueStudents.map((student) => (
            <option key={student.moodle_id} value={student.moodle_id}>
              {student.name} ({student.moodle_id})
            </option>
          ))}
        </select>
      </div>

      {/* Members */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Members (up to 3):</label>
        {Array.from({ length: 3 }).map((_, idx) => (
          <select
            key={idx}
            value={members[idx]?.moodle_id || ""}
            onChange={(e) => handleMemberChange(
              idx, 
              uniqueStudents.find(student => student.moodle_id === e.target.value)
            )}
            className="w-full p-2 border rounded-md mt-2"
          >
            <option value="">Select Member {idx + 1}</option>
            {uniqueStudents.map((student) => (
              <option key={student.moodle_id} value={student.moodle_id}>
                {student.name} ({student.moodle_id})
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* Conditional Fields */}
      {semester === "Major Project" ? (
        <div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Domain:</label>
            <select
              value={domainselected}
              onChange={handleDomainChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">-- Select Domain --</option>
              {domainsData.map((domain) => (
                <option key={domain.domain_id} value={domain.domain_id}>
                  {domain.domain_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Guide:</label>
            <select
              className="p-2 border rounded-md w-full"
              disabled={!domainselected}
              value={selectedGuide}
              onChange={(e) => setSelectedGuide(e.target.value)}
            >
              <option value="">-- Select Guide --</option>
              {guides.length > 0 ? (
                guides.map((guide) => (
                  <option key={guide.teacher_id} value={guide.teacher_id}>
                    {guide.teacher_name} (Available: {guide.availability})
                  </option>
                ))
              ) : (
                <option value="">No guides available</option>
              )}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Co-Guide:</label>
            <select
              value={coGuide}
              onChange={(e) => setCoGuide(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={!domainselected}
            >
              <option value="">Select Co-Guide</option>
              {filteredCoGuides.length > 0 ? (
                filteredCoGuides.map((coGuide) => (
                  <option key={coGuide.teacher_id} value={coGuide.teacher_id}>
                    {coGuide.teacher_name}
                  </option>
                ))
              ) : (
                <option value="">No co-guides available</option>
              )}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Division:</label>
            <input
              type="text"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <label className="font-medium">Select Guide:</label>
          <select
            className="p-2 border rounded-md w-full"
            value={selectedGuide}
            onChange={(e) => setSelectedGuide(e.target.value)}
          >
            <option value="">-- Select Guide --</option>
            {filteredGuides.length > 0 ? (
              filteredGuides.map((guide) => (
                <option key={guide.teacher_id} value={guide.teacher_id}>
                  {guide.teacher_name} (Available: {guide.availability})
                </option>
              ))
            ) : (
              <option value="">No guides available</option>
            )}
          </select>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={() => {
            setEditPopup(false);
            setSelectedProjectToEdit(null);
          }}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          // onClick={handleEditSubmit}
          onClick={handleEditSubmit}
        >
          Update
        </button>
      </div>
    </div>
  </div>
)}
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={() => setAddPopup(true)}>Add</button>
    
    <button
      className={`px-4 py-2 rounded-lg ${
        selectedRows.length === 1 ? "bg-yellow-500 text-white" : "bg-gray-400 text-gray-200 cursor-not-allowed"
      }`}
      disabled={selectedRows.length !== 1}
      onClick={handleEditClick}
    >
      Edit
    </button>
    
    <button
      className={`px-4 py-2 rounded-lg ${
        selectedRows.length > 0 ? "bg-red-600 text-white" : "bg-gray-400 text-gray-200 cursor-not-allowed"
      }`}
      disabled={selectedRows.length === 0}
      onClick={handleDeleteProjects}
    >
      Remove
    </button>
  </div>
)}
      </div>

      
      
      {/* <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
  <table className="w-full border-collapse">
  <thead className="sticky top-0 bg-gray-200 z-20 shadow-lg ">
          <tr>
            <th className="p-3 border">
              <input type="checkbox" disabled />
            </th>
            <th className="p-3 border">Group No</th>
            <th className="p-3 border">Leader Name</th>
            <th className="p-3 border">Domain</th>
            <th className="p-3 border">Project Guide</th>
            <th className="p-3 border">Co-Guide</th>
          </tr>
        </thead>
        <tbody>
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <tr
                key={group.id}
                className={`text-center ${
                  selectedRows.includes(group.id) ? "bg-green-100" : "bg-white"
                }`}
              >
                <td className="p-3 border">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(group.id)}
                    onChange={() => handleRowSelection(group.id)}
                  />
                </td>
                <td className="p-3 border">{group.div}{group.id}</td>
                <td className="p-3 border">{group.leader_name}</td>
                <td className="p-3 border">{group.domain}</td>
                <td className="p-3 border">{group.project_guide_name}</td>
                <td className="p-3 border">{group.project_co_guide_name || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="p-3 text-center text-gray-500">
                No matching records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div> */}
    </div>

            
                <div className="mt-6">
                      <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
  <table className="w-full border-collapse">
  <thead className="sticky top-0 bg-gray-200 shadow-lg ">
          <tr>
            <th className="p-3 border">
              <input type="checkbox" disabled />
            </th>
            <th className="p-3 border">Group No</th>
            <th className="p-3 border">Leader Name</th>
            <th className="p-3 border">Domain</th>
            <th className="p-3 border">Project Guide</th>
            <th className="p-3 border">Co-Guide</th>
          </tr>
        </thead>
        <tbody>
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <tr
                key={group.id}
                className={`text-center ${
                  selectedRows.includes(group.id) ? "bg-green-100" : "bg-white"
                }`}
              >
                <td className="p-3 border">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(group.id)}
                    onChange={() => handleRowSelection(group.id)}
                  />
                </td>
                <td className="p-3 border border-gray-300 underline cursor-pointer hover:text-blue-500 transition"
                onClick={() =>
                  navigate(
                      `/department/${category}/${year}/${semester}/projects/view`,
                      {
                          state: {
                              group:group.id,
                              
                          }
                      }
                  )
              }
                >{group.group_no ? group.group_no : `${group.div}${group.id}`}</td>
                <td className="p-3 border">{group.leader_name}</td>
                <td className="p-3 border">{group.domain}</td>
                <td className="p-3 border">{group.project_guide_name}</td>
                <td className="p-3 border">{group.project_co_guide_name || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="p-3 text-center text-gray-500">
                No projects found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div></div> 
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
                    {/* <button className="bg-blue-500 text-white py-2 px-4 rounded-lg">
                      <FaUpload /> Upload
                    </button> */}
                    {/* <button className="bg-gray-500 text-white py-2 px-4 rounded-lg flex items-center gap-2 group">
                      <FaDownload /> Download
                    </button> */}

                    {/* Form Popup for Students */}
                    {showStudentForm && (
                      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-10`}>
                        <div className={`max-h-[80vh] overflow-y-auto bg-white p-8 rounded-lg shadow-lg ${isDarkMode ? "text-white" : "text-black"}`} style={{ width: "600px" }}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-2xl font-semibold">Students</h3>
                          <button className="text-red-500" onClick={() => setShowStudentForm(false)}>
                            <FaTimes size={22} />
                          </button>
                        </div>

                          {/* Tabs for Student Form */}
                          <div className="flex mb-4 border-b-2">
                            <button
                              className={`px-6 py-2 font-medium ${studentMode === "bulk" ? "bg-blue-100 text-blue-500" : "bg-transparent text-black border-b-2 border-gray-300"}`}
                              onClick={() => setStudentMode("bulk")}
                            >
                              Manual
                            </button>
                            <button
                              className={`px-6 py-2 font-medium ${studentMode === "single" ? "bg-blue-100 text-blue-500" : "bg-transparent text-black border-b-2 border-gray-300"}`}
                              onClick={() => setStudentMode("single")}
                            >
                              Excel/CSV
                            </button>
                          </div>

                          {/* Bulk Tab Content */}
                          {studentMode === "bulk" && (
                            <div className="flex flex-col gap-6">
                              <select 
                              className="border p-2 rounded w-full mb-1"
                              value={selectedBatch}
                              onChange={(e) => setSelectedBatch(e.target.value)}
                            >
                              <option value="">Select Batch</option>
                              {batches.map((batch) => (
                                <option key={batch.id} value={batch.id}>
                                  {batch.batch} - {batch.department}
                                </option>
                              ))}
                            </select>

                            {/* Search Bar */}
                            {selectedBatch && (
                              <input
                                type="text"
                                placeholder="Search students by name or Moodle ID"
                                className="border p-2 w-full rounded mb-1"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            )}

                            {/* Student List */}
                            {selectedBatch && (
                              <div className="max-h-60 overflow-y-auto border rounded p-2">
                                {filteredStudents.length > 0 ? (
                                  filteredStudents.map((student) => (
                                    <label key={student.moodleid} className="block p-2 border-b flex items-center">
                                      <input type="checkbox" className="mr-2" 
                                      checked={selectedStudents.includes(student.moodleid)}
                                      onChange={() => handleStudentSelection(student.moodleid)}/>
                                      {student.first_name} {student.last_name} - {student.moodleid}
                                    </label>
                                  ))
                                ) : (
                                  <p className="text-gray-500 text-center">No students found.</p>
                                )}
                              </div>
                            )}

                            {/* Register Button */}
                            {selectedBatch && (
                              <button className="bg-blue-500 text-white w-full py-2 mt-4 rounded" onClick={handleRegister}>
                                Register
                              </button>
                            )}
                          </div>
                        )}

                          {/* Single Tab Content */}
                          {studentMode === "single" && (
                          <div className="flex flex-col gap-6">
                            <label className="font-semibold">Upload Excel/CSV File:</label>
                            <div className="text-gray-700 -mt-3">
                              <p><strong>Required Columns:</strong></p>
                              <p>
                                moodleId, firstname, lastname, middlename
                              </p>
                            </div>

                            <input
                              type="file"
                              accept=".csv, .xlsx"
                              onChange={handleFileUpload}
                              className="p-2 border w-full"
                            />

                            <button
                              onClick={handleUpload}
                              className="bg-blue-500 text-white py-2 px-4 rounded-lg mt-4 w-full"
                            >
                              Upload & Process
                            </button>
                          </div>
                          
                        )}
{uploadResult && (
  <div className="mt-4 space-y-2 bg-gray-100 p-4 rounded">
    {uploadResult.success && (
      <div className="text-green-600 font-semibold">{uploadResult.success}</div>
    )}
    {uploadResult.already_exists && (
      <div className="text-yellow-600">{uploadResult.already_exists}</div>
    )}
    {uploadResult.name_mismatch && uploadResult.name_mismatch.length > 0 && (
      <div className="text-red-500">
        <strong>Name mismatch for Moodle IDs:</strong> {uploadResult.name_mismatch.join(", ")}
      </div>
    )}
    {uploadResult.errors && uploadResult.errors.length > 0 && (
      <div className="text-red-700">
        <strong>Errors:</strong>
        <ul className="list-disc ml-6">
          {uploadResult.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    )}
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
                    {/* <button className="bg-green-500 text-white py-2 px-4 rounded-lg">
                      <FaUpload /> Upload
                    </button>
                    <button className="bg-gray-500 text-white py-2 px-4 rounded-lg flex items-center gap-2 group">
                      <FaDownload />
                      <span className="hidden group-hover:inline">Download</span>
                    </button> */}

                    {/* Form Popup for Teachers */}
                    {showTeacherForm && (
                      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-10`}>
                        <div className={`bg-white p-8 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto ${isDarkMode ? "text-white" : "text-black"}`} style={{ width: "600px" }}>
                           {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold">Teacher Registration</h3>
          <button className="text-red-500" onClick={() => setShowTeacherForm(false)}>
            <FaTimes size={22} />
          </button>
        </div>
        <div className="mb-4">
        <h4 className="font-semibold">Select Teachers:</h4>

        <input
      type="text"
      className="w-full p-2 mb-2 border rounded"
      placeholder="Search by name..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
    />
          <div className="flex items-center gap-2 mb-2">
      <select
        className="p-2 border rounded"
        value={experienceFilterType}
        onChange={(e) => setExperienceFilterType(e.target.value)}
      >
        <option value="">-- Filter by Experience --</option>
        <option value="greater">Greater than</option>
        <option value="lesser">Less than</option>
      </select>

      <input
        type="number"
        min="0"
        className="w-20 p-2 border rounded"
        placeholder="Years"
        value={experienceThreshold}
        onChange={(e) => setExperienceThreshold(e.target.value.replace(/\D/, ""))}
        onWheel={(e) => e.target.blur()}
      />
    </div>
        <div className="mb-2">
      <label className="font-semibold">Set Default Availability:</label>
      <input
        type="number"
        min="0"
        className="w-full p-2 border rounded"
        placeholder="Enter default groups"
        value={defaultAvailability}
        onChange={(e) => setDefaultAvailability(Number(e.target.value))}
        onWheel={(e) => e.target.blur()}
        required
      />
    </div>
    <div className="mb-2">
      <label className="flex items-center font-semibold">
        <input
          type="checkbox"
          className="mr-2"
          checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
          onChange={() => {
            if (selectedTeachers.length === filteredTeachers.length) {
              setSelectedTeachers([]); // Deselect all
            } else {
              setSelectedTeachers(filteredTeachers.map((teacher) => teacher.moodleid)); // Select all
            }
          }}
        />
        Select All
      </label>
    </div>
    <div className="max-h-40 overflow-auto border p-2">
      {filteredTeachers.map((teacher) => (
        <div key={teacher.moodleid} className="flex items-center justify-between p-1">
          <label className="flex items-center">
            <input
              type="checkbox"
              value={teacher.moodleid}
              className="mr-2"
              checked={selectedTeachers.includes(teacher.moodleid)}
              onChange={() => handleSelectionChange(teacher.moodleid)}
            />
            {teacher.first_name} {teacher.last_name} ({teacher.experience || 0} yrs)
          </label>
          <input
            type="number"
            min="0"
            className="w-20 p-1 border rounded"
            placeholder="groups"
            value={teacherAvailability[teacher.moodleid] ?? defaultAvailability}
            onChange={(e) => updateAvailability(teacher.moodleid, e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
        </div>
      ))}
    </div>
        </div>

        <button className="bg-blue-500 text-white py-2 px-4 rounded-lg w-full" onClick={handleSubmit}>
          Register
        </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weekly Task Section */}
                <div className="border-l-4 rounded-lg shadow-md hover:shadow-xl transition-all border-yellow-500 p-6">
                  <h3 className="font-semibold text-xl">Weekly Task</h3>
                  {semester === "Major Project" ? (
  <div>
    {/* Tabs for selecting semester */}
    <div className="flex border-b border-gray-300 mb-6">
      {["Sem 7", "Sem 8"].map((sem) => (
        <div
          key={sem}
          onClick={() => setSelectedSem(sem)}
          className={`cursor-pointer px-6 py-2 text-lg font-semibold border-b-4 transition-all duration-300 ${
            selectedSem === sem
              ? "border-yellow-500 text-yellow-600"
              : "border-transparent text-gray-600 hover:text-yellow-600"
          }`}
        >
          {sem}
        </div>
      ))}
    </div>

    {/* Conditionally render Weekly Task section based on selectedSem */}
    {selectedSem && (
      <div>
        <div className="flex justify-between mt-4">
          {selectedWeeks.length === 0 ? (
            <button
              className="bg-yellow-500 text-white py-2 px-2 w-20 rounded-lg"
              onClick={() => setShowTaskForm(true)}
            >
              <FaPlus /> Add
            </button>
          ) : (
            <button
              className="bg-yellow-500 text-white py-2 px-2 w-20 rounded-lg"
              onClick={() => setShowTasksTable(!showTasksTable)}
            >
              {showTasksTable ? "Cancel" : "View"}
            </button>
          )}
        </div>

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-10">
            <div
              className={`bg-white p-8 rounded-lg shadow-lg ${
                isDarkMode ? "text-white" : "text-black"
              }`}
              style={{ width: "600px" }}
            >
              <button
                className="relative top-[-8px] right-[-520px] text-red-500"
                onClick={() => setShowTaskForm(false)}
              >
                <FaTimes size={22} />
              </button>
              <h3 className="text-xl font-semibold mb-4">
                Pre-saved tasks will be added. You can edit or remove it. Also more weeks can be added
              </h3>
              <button
                className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg"
                onClick={handleAddWeeklyTask}
              >
                Add Tasks
              </button>
            </div>
          </div>
        )}

        {/* Weekly Tasks Table */}
        {showTasksTable && selectedWeeks.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-end mb-4">
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded-lg"
                onClick={() => {
                  const nextWeek = selectedWeeks.length > 0
                    ? Math.max(...selectedWeeks.map(w => Number(w.week))) + 1
                    : 1;
                  setSelectedWeek(nextWeek);
                  setTaskText("");
                  setShowAddModal(true);
                }}
              >
                Add Task
              </button>
            </div>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr
                  className={`${
                    isDarkMode ? "bg-yellow-600 text-white" : "bg-yellow-500 text-black"
                  }`}
                >
                  <th className="p-3 border border-gray-300">Week</th>
                  <th className="p-3 border border-gray-300">Task</th>
                  <th className="p-3 border border-gray-300">Edit</th>
                  <th className="p-3 border border-gray-300">Remove</th>
                </tr>
              </thead>
              <tbody>
                {selectedWeeks.map((task, index) => (
                  <tr
                    key={index}
                    className={`${
                      isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
                    }`}
                  >
                    <td className="p-3 border border-gray-300">{task.week}</td>
                    <td className="p-3 border border-gray-300">
                      {Array.isArray(task.task)
                        ? task.task.map((t, i) => <div key={i}>{i + 1}. {t}</div>)
                        : task.task}
                    </td>
                    <td className="p-3 border border-gray-300">
                      <button className="bg-blue-500 text-white py-1 px-3 rounded-lg"
                      onClick={() => {
                        setSelectedWeek(index+1); // this index comes from your `.map()`
                        setTaskText(task.task.join(", "));
                        setShowEditModal(true);
                      }}>Edit</button>
                    </td>
                    <td className="p-3 border border-gray-300">
                      <button className="bg-red-500 text-white py-1 px-3 rounded-lg" onClick={() => handleDeleteWeek(index+1)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
  </div>
) : (
  // If not Major Project
  <div>
    <div className="flex justify-between mt-4">
                    {/* <button className="bg-yellow-500 text-white py-2 px-2 w-20 rounded-lg" onClick={() => setShowTaskForm(true)}>
                      <FaPlus /> Add
                    </button> */}
                    {weeklyTasks.length === 0 ? (
                      <button className="bg-yellow-500 text-white py-2 px-2 w-20 rounded-lg" onClick={() => setShowTaskForm(true)}>
                        <FaPlus /> Add
                      </button>
                    ) : (
                      <button
                        className="bg-yellow-500 text-white py-2 px-2 w-20 rounded-lg"
                        onClick={() => setShowTasksTable(!showTasksTable)}
                      >
                        {showTasksTable ? "Cancel" : "View"}
                      </button>
                    )}
                  </div>

                  {/* Form Popup for Weekly Task */}
                  {showTaskForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-10">
                      <div className={`bg-white p-8 rounded-lg shadow-lg ${isDarkMode ? "text-white" : "text-black"}`} style={{ width: "600px" }}>
                        <button className="relative top-[-8px] right-[-520px] text-red-500" onClick={() => setShowTaskForm(false)}>
                          <FaTimes size={22} />
                        </button>
                        <h3 className="text-xl font-semibold mb-4">Pre-saved tasks will be added. You can edit or remove it. Also more weeks can be added</h3>
                        {/* <input
                          type="number"
                          value={taskCount}
                          onChange={(e) => setTaskCount(e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          placeholder="Enter number of tasks"
                          className="p-2 border w-full mb-4"
                        /> */}
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
                  {showTasksTable && weeklyTasks.length > 0 && (
                    <div className="mt-6">
                      <div className="flex justify-end mb-4">
                        <button
                          className="bg-blue-500 text-white py-2 px-4 rounded-lg"
                          onClick={() => {
                            const nextWeek = weeklyTasks.length > 0
                              ? Math.max(...weeklyTasks.map(w => Number(w.week))) + 1
                              : 1;
                            setSelectedWeek(nextWeek);
                            setTaskText("");
                            setShowAddModal(true);
                          }}
                        >
                          Add Task
                        </button>
                      </div>
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
                                <button className="bg-blue-500 text-white py-1 px-3 rounded-lg" onClick={() => {
    setSelectedWeek(index+1); // this index comes from your `.map()`
    setTaskText(task.task.join(", "));
    setShowEditModal(true);
  }}>Edit</button>
                              </td>
                              <td className="p-3 border border-gray-300">
                                <button className="bg-red-500 text-white py-1 px-3 rounded-lg" onClick={() => handleDeleteWeek(index+1)}>Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
  </div>
)}
{showAddModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Add Task</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Week</label>
        <input
          type="number"
          value={selectedWeek}
          readOnly
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="w-full border px-3 py-2 rounded-md"
          placeholder="Enter week number"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Task (comma separated)</label>
        <textarea
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          className="w-full border px-3 py-2 rounded-md"
          rows={4}
          placeholder="e.g., Design UI, Write API"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          className="bg-gray-300 px-4 py-2 rounded-lg"
          onClick={() => {
            setShowAddModal(false);
            setTaskText("");
            setSelectedWeek("");
          }}
        >
          Cancel
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          onClick={async () => {
            await handleSubmitTask();           // Call your async function
            setShowAddModal(false);            // Close modal after submission
            setTaskText("");                   // Reset task text
            setSelectedWeek("");               // Reset selected week
          }}
        >
          Add
        </button>
      </div>
    </div>
  </div>
)}      
{showEditModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Edit Task</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Task (comma separated)</label>
        <textarea
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          className="w-full border px-3 py-2 rounded-md"
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          className="bg-gray-300 px-4 py-2 rounded-lg"
          onClick={() => {
            setShowEditModal(false);
            setTaskText("");
            setSelectedWeek(null);
          }}
        >
          Cancel
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          onClick={async () => {
            await handleSubmitTask();
            setShowEditModal(false);
            setTaskText("");
            setSelectedWeek(null);
          }}
        >
          Update
        </button>
      </div>
    </div>
  </div>
)}

                </div>                   
                

                {/* Display Guide allocation*/}
                   <div className="space-y-6 mt-8">
            <div className="border-l-4 rounded-lg shadow-md hover:shadow-xl transition-all border-purple-500 p-6">
              <h3 className="font-semibold text-xl mb-4">Guide Allocation</h3>
              <div className="grid grid-cols-2 gap-4 relative">
                <div className="flex flex-col gap-4">
                  <h4 className="text-lg font-semibold mb-3">Teachers</h4>
                  <button
                className={`bg-purple-500 text-white py-2 px-4 rounded-lg w-80 
                  ${isTeacherActive ? "bg-purple-900 opacity-50 cursor-not-allowed":"hover:bg-purple-700"}`}
                onClick={handleTeacherButton}
                disabled={semester !== "Major Project" || isTeacherActive}
              >
                Activate Form
              </button>
                  <div className="flex gap-2">
                    <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700" 
                    // onClick={handleGuideAllocation}
                    onClick={() => {
                      const proceed = window.confirm("Do you want to proceed with guide allocation?");
                      if (proceed) {
                        handleGuideAllocation(); 
                      }
                    }}
                    >Guide Allocation</button>
                    <AllocationSummaryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        summary={summary}
      />
                    <button
                  className="bg-yellow-500 text-white py-2 px-4 rounded-lg"
                  onClick={toggleManualAllocationTable}
                >
                  Manual Allocation
                </button>

                {/* Manual Allocation Table */}
                
                    
                  </div>
                </div>
                 {/* Show Manual Allocation Form if the button is clicked */}
                 
                <div className="flex flex-col gap-4">
                  <h4 className="text-lg font-semibold mb-3">Students</h4>
                  <button className={`bg-purple-500 text-white py-2 px-4 rounded-lg w-80 
    ${isStudentActive ? "bg-purple-900 opacity-50 cursor-not-allowed":"hover:bg-purple-700" }`} 
    onClick={handleStudentButton}
    disabled={isStudentActive}
    >Activate Form</button>
                  <div className="flex gap-2">
                    <button className="bg-blue-500 text-white py-2 px-4 rounded-lg w-40 hover:bg-blue-700" onClick={handleOpenPDF}>PDF</button>
                    <button className="bg-yellow-500 text-white py-2 px-4 rounded-lg w-40 hover:bg-yellow-600" onClick={handleDownload}>Excel</button>
                  </div>
                </div>
                
              </div>
              <div id="manual-allocation-table" className="hidden mt-4">
                  <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-3 border">Group No.</th>
                        <th className="p-3 border">Project Leader</th>
                        <th className="p-3 border">Domain Allocated</th>
                        <th className="p-3 border">Guide Allocated</th>
                        <th className="p-3 border"></th>
                      </tr>
                    </thead>
                    <tbody>
                    {projects.map((project) => 
                      project.final === 1 ? (
                      <tr key={project.id}>
                        <td className="p-3 border">{project.group_no}</td>
                        <td className="p-3 border">{project.leader_name}</td>
                        <td className="p-3 border">{project.domain}</td>
                        <td className="p-3 border">{project.project_guide_name}</td>
                        
                        <td className="p-3 border">
                          <button className="bg-green-500 text-white py-1 px-3 rounded-lg" onClick={() => handleOpenPopup(project.id)}>Allocate</button>
                        </td>
                      </tr>
                    ) : null)}
                    </tbody>
                  </table>
                </div>
                {isAllocateOpen && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-10">
    <div className={`max-h-[80vh] overflow-y-auto bg-white p-8 rounded-lg shadow-lg ${isDarkMode ? "text-white" : "text-black"}`} style={{ width: "600px" }}>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold">Guide Allocation</h3>
        <button className="text-red-500" onClick={handleClosePopup}>
          <FaTimes size={22} />
        </button>
      </div>

      {semester === "Major Project" ? (
        <>
          <div className="space-y-3">
            {Object.entries(preferences).map(([domain, teachers], index) => (
              <div key={domain} className="p-2 border rounded-md bg-gray-100">
                <label className="font-medium">
                  {index + 1}{index === 0 ? "st" : index === 1 ? "nd" : "rd"} Preference:
                  <span className="text-blue-600"> {domain}</span>
                </label>
                <ul className="mt-1 text-sm text-gray-700">
                  {teachers.map((teacher, i) => (
                    <li key={i}>Prof. {teacher}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <form>
            <div className="mt-4">
          <label className="font-medium">Select Domain:</label>
      <select value={domainselected} onChange={handleDomainChange} className="p-2 border rounded-md">
        <option value="">-- Select Domain --</option>
        {domainsData.map((domain) => (
          <option key={domain.domain_id} value={domain.domain_id}>
            {domain.domain_name}
          </option>
        ))}
      </select>
      </div>
      <div className="mt-4">
        <label className="font-medium mt-4">Select Guide:</label>
        <select className="p-2 border rounded-md" disabled={!domainselected} value={selectedGuide} onChange={(e) => setSelectedGuide(e.target.value)}>
          <option value="">-- Select Guide --</option>
          {guides.length > 0 ? (
            guides.map((guide) => (
              <option key={guide.teacher_id} value={guide.teacher_id}>
                {guide.teacher_name} (Available: {guide.availability})
              </option>
            ))
          ) : (
            <option value="">No guides available</option>
          )}
        </select>
      </div>

          <div className="mt-4 text-center">
            <button className="bg-blue-500 text-white py-2 px-5 rounded-lg hover:bg-blue-600" onClick={handleManual}  >
              Submit
            </button>
          </div>
          </form>
        </>
      ) : (
        <>
          <div className="space-y-4">
          <div className="space-y-3">
            {preferences.map((teacher, i) => (
                <ul className="mt-1 text-m text-gray-700">
                    <li key={i}>Prof. {teacher}</li>
                </ul>
            ))}
          </div>
          <form>
          <div className="mt-4">
            <label className="font-medium">Select Guide:</label>
            <select className="p-2 border rounded-md" value={selectedGuide} onChange={(e) => setSelectedGuide(e.target.value)}>
              <option value="">-- Select Guide --</option>
              {filteredGuides.length > 0 ? (
                filteredGuides.map((guide) => (
                  <option key={guide.teacher_id} value={guide.teacher_id}>
                    {guide.teacher_name} (Available: {guide.availability})
                  </option>
                ))
              ) : (
                <option value="">No guides available</option>
              )}
            </select>
          </div>

            <div className="mt-4 text-center">
              <button className="bg-blue-500 text-white py-2 px-5 rounded-lg hover:bg-blue-600" onClick={handleManual}>
                Submit
              </button>
            </div>
            </form>
          </div>
        </>
      )}
      
    </div>
  </div>
)}

                {/* {isAllocateOpen && (
            <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-10`}>
            <div className={`max-h-[80vh] overflow-y-auto bg-white p-8 rounded-lg shadow-lg ${isDarkMode ? "text-white" : "text-black"}`} style={{ width: "600px" }}>
            <div className="flex justify-between items-center mb-4">
                          <h3 className="text-2xl font-semibold">Guide Allocation</h3>
                          <button className="text-red-500" onClick={handleClosePopup}>
                            <FaTimes size={22} />
                          </button>
                        </div>

<div className="space-y-3">
  {Object.entries(preferences).map(([domain, teachers], index) => (
  <div key={domain} className="p-2 border rounded-md bg-gray-100">
    <label className="font-medium">
      {index + 1}{index === 0 ? "st" : index === 1 ? "nd" : "rd"} Preference:
      <span className="text-blue-600"> {domain}</span>
    </label>
    <ul className="mt-1 text-sm text-gray-700">
      {teachers.map((teacher, i) => (
        <li key={i}>Prof. {teacher}</li>
      ))}
    </ul>
  </div>
  ))}
</div>

<div className="mt-4">
  <label className="font-medium">Select Domain:</label>
      <select value={domain} onChange={handleDomainChange} className="p-2 border rounded-md">
        <option value="">-- Select Domain --</option>
        {Object.keys(preferences).map((domain, index) => (
          <option key={index} value={domain}>
            {domain}
          </option>
        ))}
      </select>
  </div>
  <div className="mt-4">
      <label className="font-medium mt-4">Select Guide:</label>
      <select className="p-2 border rounded-md" disabled={!domain}>
        <option value="">-- Select Guide --</option>
        {filteredGuides.length > 0 ? (
          filteredGuides.map((guide, index) => (
            <option key={index} value={guide}>
              {guide}
            </option>
          ))
        ) : (
          <option value="">No guides available</option>
        )}
      </select>
</div>

<div className="mt-4 text-center">
  <button className="bg-blue-500 text-white py-2 px-5 rounded-lg hover:bg-blue-600">
    Submit
  </button>

              </div>
            </div>
          </div>
        
      )} */}
            </div>
            
          </div>
          
              </div>

              
            
            
            ) : activeTab === "Status" ? (
              <div>
                {/* Add Status Content Here */}
                {/* <h2 className="text-2xl font-semibold">Status Section</h2> */}
                <div className="grid grid-cols-3 gap-6">
        {/* Groups Section */}
        <div className="p-4 bg-white shadow-lg rounded-lg flex flex-col items-center">
          <h2 className="text-lg font-bold mb-2">Groups</h2>
            <PieChart width={300} height={200}>
              <Pie
                data={groupsData}
                cx={150}
                cy={100}
                outerRadius={80}
                dataKey="value"
                onClick={(data) => groupDownload(data.name)} // Pass the clicked segment's name or value
              >
                {groupsData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
        </div>
        {/* Publications Section */}
        <div className="p-4 bg-white shadow-lg rounded-lg flex flex-col items-center">
          <h2 className="text-lg font-bold mb-2">Publications</h2>
          <PieChart width={300} height={200}>
            <Pie data={publicationData} cx={150} cy={100} outerRadius={80} dataKey="value" onClick={(data) => publicationDownload(data.name)}>
              {publicationData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        {/* Copyrights Section */}
        <div className="p-4 bg-white shadow-lg rounded-lg flex flex-col items-center">
          <h2 className="text-lg font-bold mb-2">Copyrights & Patents</h2>
          {selectedCopyright ? (
          <>
            <h3 className="text-md font-semibold mb-2">{selectedCopyrightLabel}</h3>
            <PieChart width={300} height={200}>
              <Pie
                data={copyrightBreakdown[selectedCopyright]}
                cx={150}
                cy={100}
                startAngle={180}
                endAngle={0}
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
                onClick={(data) => copyrightDownload(data.name)}
              >
                {copyrightBreakdown[selectedCopyright].map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>

            <button
            className="-mt-5 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            onClick={() => setSelectedCopyright(null)}
            >
              Back
            </button>
          </>
        ) : (
          <PieChart width={300} height={200}>
            <Pie
              data={copyrightData}
              cx={150}
              cy={100}
              outerRadius={80}
              dataKey="value"
              onClick={(data, index) => handleCopyrightClick(data, index)}
            >
              {copyrightData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
        </div>
      </div>

       {/* Weekly Tasks Section */}
       <div className="p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-lg font-bold mb-4">Weekly Tasks</h2>
        {/* <ResponsiveContainer width="100%" height={250}  >
          <BarChart data={weeklyTasksData} activeBar={{ fill: "none" }}>
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip cursor={{ fill: "transparent" }}/>
            <Bar dataKey="groups" fill="#0088FE"/>
          </BarChart>
        </ResponsiveContainer> */}
        {semester === "Major Project" ? (
        <div className="mb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setSemActive("sem_7")}
              className={`px-4 py-2 rounded ${semActive === "sem_7" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              Sem 7
            </button>
            <button
              onClick={() => setSemActive("sem_8")}
              className={`px-4 py-2 rounded ${semActive === "sem_8" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              Sem 8
            </button>
          </div>

          <div className="mt-6 -ml-8">
            {semActive === "sem_7" && renderChart(chartData.sem_7)}
            {semActive === "sem_8" && renderChart(chartData.sem_8)}
          </div>
        </div>
      ) : (
        <div className="mt-6">{renderChart(chartData.default)}</div>
      )}
      </div>
      
              </div>
                
              // </div>
            ): (
              <div>
                <Resources category={category} year={year} semester={semester} div={div}/>
              </div>
            )}
          </div>
    </div>
  );
};

export default ProjectDetails;
