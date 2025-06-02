import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import AxiosInstance from "../../../AxiosInstance";
ChartJS.register(ArcElement, Tooltip);

const HomePage = ({ isDarkMode }) => {
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // For opening/closing the preference form modal
  const [currentPage, setCurrentPage] = useState(1); // To manage pages in the form
  const [selectedPreferences, setSelectedPreferences] = useState({
    preference1: "",
    preference2: "",
    preference3: "",
  });

  const [domains, setDomains] = useState([]);
  const [domain_error, setDomainError] = useState("");

  useEffect(() => {
    AxiosInstance
      .get("/domains/") 
      .then((response) => setDomains(response.data))
      .catch(() => setDomainError("Failed to load domains"));
  }, []);

  const[isFormVisibile,setIsFormVisible]= useState(false)

  useEffect(() => {
    AxiosInstance
      .get("/semesters/teacher-form-visibility") 
      .then((response) => setIsFormVisible(response.data.status))
      .catch(() => console.error("Error fetching form status:", error.response?.data || error.message));
  }, []);

  const [preferences, setPreferences] = useState([
    { id: "", rank: 1 },
    { id: "", rank: 2 },
    { id: "", rank: 3 }
  ]);
  const [error, setError] = useState(""); 

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (preferences.some(pref => pref.id === "")) {
      setError("Please select a domain for all preferences.");
      return;
    }

    console.log("Preferences:", preferences);

    try {
      const response = await AxiosInstance.post("/teacherpreferences/save_preferences/", {
        preferences: preferences, 
      });
  
      alert(response.data.message);  // Show success message
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert(error.response?.data?.error || "Failed to save preferences");
    }

    closeModal();
  };


  const addPreference = () => {
    if (preferences.length >= 3) {
      setPreferences([...preferences, { id: "", rank: preferences.length + 1 }]);
    }
  };

  const removePreference = (index) => {
    if (preferences.length > 3) {
      const updatedPreferences = preferences.filter((_, i) => i !== index);
      setPreferences(updatedPreferences);
    }
  };

  // Handle domain selection change
  const handleDomainChange = (index, domainId) => {

    if (preferences.some((pref, i) => pref.id === domainId && i !== index)) {
      setError("This domain is already selected in another preference!");
      return;
    }

    setError("");

    const updatedPreferences = [...preferences];
    updatedPreferences[index].id = domainId;
    setPreferences(updatedPreferences);
  };

  const selectedDomains = preferences.map(pref => pref.id);


  const handleTabClick = (tab) => setActiveTab(tab);
  const handlePieChartClick = (section) => setSelectedSection(section);

  // const getPieChartData = (section) => {
  //   const projects = getProjects(section);
  //   return {
  //     labels: Object.keys(projects).map((division) => `${section}-${division}`),
  //     datasets: [
  //       {
  //         data: Object.values(projects),
  //         backgroundColor: ["#FF9500", "#2196F3", "#FFC107", "#FF5722"],
  //         borderColor: "#000",
  //         borderWidth: 1,
  //       },
  //     ],
  //   };
  // };


  // const getTableData = (section, division) => {
  //   return Array.from(
  //     { length: getProjects(section)[division] },
  //     (_, index) => ({
  //       projectName: `Project ${section} - ${division} - ${index + 1}`,
  //       leader: `Leader ${index + 1}`,
  //       status: Math.random() > 0.5 ? "Completed" : "Pending",
  //       logbook: (
  //         <div className="flex items-center gap-2">
  //           <span className="text-green-600">✔️</span>
  //           <span className="text-red-500">❌</span>
  //         </div>
  //       ),
  //     })
  //   );
  // };

  const handleYearClick = (year) => {
    setSelectedYear(year);
    setSelectedSection("");
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handlePreferenceChange = (event) => {
    const { name, value } = event.target;
    setSelectedPreferences((prevPreferences) => ({
      ...prevPreferences,
      [name]: value,
    }));
  };

  const isOptionDisabled = (option) => {
    return Object.values(selectedPreferences).includes(option);
  };

  const preferenceOptions = [
    "Cybersecurity", "AI-ML", "Cloud Computing", "Big Data",
    "Networking", "Blockchain", "DevOps", "IoT"
  ];

  const [data, setData] = useState({});
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [previousYears, setPreviousYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState([]);
  useEffect(() => {
    AxiosInstance.get('/projects/my-projects-sem-wise/')
      .then(res => {
        const receivedData = res.data;
        setData(receivedData);

        const years = Object.keys(receivedData);
        if (years.length > 0) {
          setActiveTab(years[0]);
          const allSems = Object.keys(receivedData[years[0]]);
          setSemesters(allSems);
        }
      })
      .catch(error => {
        console.error("Error fetching project data:", error);
        setLoading(false);
      });
  }, []);

  const getProjectsByDivision = (semester) => {
    const yearData = data?.[activeTab];
    if (!yearData) return {};

    const semesterData = yearData?.[semester];
    if (!semesterData) return {};

    const divisionCounts = {};

    Object.entries(semesterData).forEach(([division, projectsArray]) => {
      if (Array.isArray(projectsArray)) {
        divisionCounts[division] = projectsArray.length;
      }
    });

    return divisionCounts;
  };

  const getAllProjectsInSemester = (semester) => {
    const yearData = data?.[activeTab];
    if (!yearData) return [];

    const semesterData = yearData?.[semester];
    if (!semesterData) return [];

    let allProjects = [];
    Object.values(semesterData).forEach((projectsArray) => {
      if (Array.isArray(projectsArray)) {
        allProjects = allProjects.concat(projectsArray);
      }
    });

    return allProjects;
  };

  const [selectedSemesterForTable, setSelectedSemesterForTable] = useState("");

  const handleChartClick = (semester) => {
    if (selectedSemesterForTable === semester) {
      // If already selected, toggle off
      setSelectedSemesterForTable("");
    } else {
      setSelectedSemesterForTable(semester);
    }
  };

  const getProjectsArray = (section) => {
  if (activeTab !== "Previous") {
    return data?.[activeTab]?.[section] || [];
  } else {
    if (!selectedYear) return [];
    return data?.[selectedYear]?.[section] || [];
  }
};

const getDivisionCounts = (section) => {
  const projectsArray = getProjectsArray(section);
  const divisionCounts = {};

  projectsArray.forEach((project) => {
    const div = project.div || "Unknown";
    divisionCounts[div] = (divisionCounts[div] || 0) + 1;
  });

  return divisionCounts;
};

const getProjectCounts = (section) => {
  if (activeTab !== "Previous") {
    // Defensive: ensure data and nested keys exist and are arrays
    const projectsArray = Array.isArray(data?.[activeTab]?.[section])
      ? data[activeTab][section]
      : [];

    const divisionCounts = {};
    projectsArray.forEach((project) => {
      const div = project.div || "Unknown";
      divisionCounts[div] = (divisionCounts[div] || 0) + 1;
    });
    return divisionCounts;
  } else {
    if (!selectedYear) return {};
    const projectsArray = Array.isArray(data?.[selectedYear]?.[section])
      ? data[selectedYear][section]
      : [];

    const divisionCounts = {};
    projectsArray.forEach((project) => {
      const div = project.div || "Unknown";
      divisionCounts[div] = (divisionCounts[div] || 0) + 1;
    });
    console.log(projectsArray);
    console.log(divisionCounts);
    return divisionCounts;
  }
};


const getTableData = (semester, division) => {
  const projectsArray = getProjectsArray(semester);
  return projectsArray.filter((project) => (project.div || "Unknown") === division);
};

const getPieChartData = (semester) => {
    const projectCounts = getProjectsByDivision(semester);

    return {
      labels: Object.keys(projectCounts).map(
        (division) => `${semester} - Div ${division}`
      ),
      datasets: [
        {
          data: Object.values(projectCounts),
          backgroundColor: ['#FF9500', '#2196F3', '#FFC107', '#FF5722', '#4CAF50'],
          borderColor: '#000',
          borderWidth: 1,
        },
      ],
    };
  };



  return (
    <div
      className={`p-6 space-y-6 ${
        isDarkMode ? "bg-[#121138] text-white" : "bg-gray-100 text-gray-900"
      } py-16`}
    >
      {/* Title */}
      <h1 className="text-3xl font-extrabold tracking-tight">Academic Year</h1>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-96 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Preferences</h2>
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dynamic Preferences */}
            {preferences.map((pref, index) => (
              <div key={index} className="flex space-x-2">
                {/* Preference Rank (Auto-Assigned) */}
                <span className="w-8 flex items-center justify-center bg-gray-200 rounded-md">{index + 1}</span>

                {/* Domain Selection Dropdown */}
                <select
                  value={pref.id}
                  onChange={(e) => handleDomainChange(index, e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Domain</option>
                  {domains.map((domain) => (
                    <option
                      key={domain.id}
                      value={domain.id}
                      disabled={selectedDomains.includes(domain.id) && pref.id !== domain.id} // Disable already selected domains
                    >
                      {domain.name}
                    </option>))}
                  
                </select>
                {/* Remove Button (Only for extra preferences) */}
                {index >= 3 && (
                  <button 
                    type="button" 
                    onClick={() => removePreference(index)}
                    className="bg-amber-500 text-white px-3 py-1 rounded-md hover:bg-amber-600"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}

            {/* Add More Preferences Button */}
            {preferences.length >= 3 && (
              <button
                type="button"
                onClick={addPreference}
                className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
              >
                + Add More Preferences
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
            >
              Submit Preferences
            </button>
      </form>
        </div>
        </div>
      )}
      {/* Marquee Section */}
      {isFormVisibile && (
        <div className="bg-pink-500 text-white py-2 px-4 text-center font-semibold mb-6 text-1xl">
        Provide your domain preference{" "}
        <span
          className="text-blue-600 underline cursor-pointer"
          onClick={openModal} // Open the preference form modal on click
        >
          [Click here]
        </span>
        
    </div>
    
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-96 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Preferences</h2>
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dynamic Preferences */}
            {preferences.map((pref, index) => (
              <div key={index} className="flex space-x-2">
                {/* Preference Rank (Auto-Assigned) */}
                <span className="w-8 flex items-center justify-center bg-gray-200 rounded-md">{index + 1}</span>

                {/* Domain Selection Dropdown */}
                <select
                  value={pref.id}
                  onChange={(e) => handleDomainChange(index, e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Domain</option>
                  {domains.map((domain) => (
                    <option
                      key={domain.id}
                      value={domain.id}
                      disabled={selectedDomains.includes(domain.id) && pref.id !== domain.id} // Disable already selected domains
                    >
                      {domain.name}
                    </option>))}
                  
                </select>
                {/* Remove Button (Only for extra preferences) */}
                {index >= 3 && (
                  <button 
                    type="button" 
                    onClick={() => removePreference(index)}
                    className="bg-amber-500 text-white px-3 py-1 rounded-md hover:bg-amber-600"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}

            {/* Add More Preferences Button */}
            {preferences.length >= 3 && (
              <button
                type="button"
                onClick={addPreference}
                className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
              >
                + Add More Preferences
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
            >
              Submit Preferences
            </button>
      </form>
        </div>
        </div>
      )}
      

      {/* Tabs */}
      {/* <div className="flex justify-between items-center border-b border-gray-300">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`py-2 px-6 font-semibold text-lg transition-all duration-300 ${
              activeTab === tab
                ? "border-b-4 border-blue-500 text-blue-500 transform scale-105"
                : "text-gray-500 hover:text-blue-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div> */}
      {/* Year Tabs */}
      <div className="flex items-center border-b border-gray-300">
        {Object.keys(data).map((year) => (
          <button
            key={year}
            className={`py-2 px-6 font-semibold text-lg transition-all duration-300 ${
              activeTab === year
                ? "border-b-4 border-blue-500 text-blue-500 transform scale-105"
                : "text-gray-500 hover:text-blue-400"
            }`}
            onClick={() => {
              setActiveTab(year);
              setSemesters(Object.keys(data[year]));
            }}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Semester Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-6">
        {semesters.map((semester) => {
          const chartData = getPieChartData(semester);
          return (
            <div key={semester} className="border p-4 rounded shadow-md">
              <h2 className="text-xl font-semibold mb-4">{semester}</h2>

              {/* Donut Chart */}
              <div
                className="relative w-60 h-60 mx-auto flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow duration-300 bg-transparent rounded-lg transform hover:scale-105"
                onClick={() => handleChartClick(semester)}
              >
                <Pie
                  data={chartData}
                  options={{
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || "";
                            const value = context.raw || 0;
                            return `${label}: ${value} Projects`;
                          },
                        },
                      },
                    },
                    cutout: "50%",
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>

              {/* Toggle Table: shows below donut chart if this semester is selected */}
            </div>
          );
        })}
      </div>
      {selectedSemesterForTable && (
  <div className="w-full mt-10 border p-6 rounded shadow-md">
    <h3 className="text-xl font-semibold mb-4">
      Project Details for {selectedSemesterForTable}
    </h3>
    <table className="min-w-full border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 border">Group</th>
          <th className="p-2 border">Division</th>
          <th className="p-2 border">Domain</th>
          <th className="p-2 border">Topic</th>
        </tr>
      </thead>
      <tbody>
        {getAllProjectsInSemester(selectedSemesterForTable).map((project) => (
          <tr key={project.id}>
            <td className="p-2 border text-center">{project.group_no}</td>
            <td className="p-2 border text-center">{project.div}</td>
            <td className="p-2 border text-center">{project.domain}</td>
            <td className="p-2 border">{project.final_topic}</td>
          </tr>
        ))}
        {getAllProjectsInSemester(selectedSemesterForTable).length === 0 && (
          <tr>
            <td colSpan={4} className="p-4 text-center text-gray-500">
              No projects available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}

     
      {/* Modal for Preferences */}
      
    </div>
  );
};

export default HomePage;
