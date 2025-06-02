import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../../../AxiosInstance';

const MiniProject = () => {
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [username, setUsername] = useState("");
  useEffect(() => {
    AxiosInstance.get("/user/user-info/")
      .then((response) => {
        setUsername(response.data.username);
      })
      .catch(() => {
        setUsername("Guest");
      });
  }, []);

  // State for group details
  const [groupDetails, setGroupDetails] = useState({
    leaderId: '',
    leaderName: '',
    members: Array(3).fill({ name: '', id: '' }),
  });

  const [teacherList, setTeacherList] = useState([]);
  
  const [selectedTeachers, setSelectedTeachers] = useState(["", "", ""]);

  const handleTeacherChange = (index, value) => {
    const newSelected = [...selectedTeachers];
    newSelected[index] = value;
    setSelectedTeachers(newSelected);
  };// For storing project topics

  const validateStep = () => {
    // Step 1: Validate group details
    if (currentStep === 1) {
      const { leaderId, leaderName, members } = groupDetails;
  
      // Validate leader details and division
      if (!leaderId.trim() || !leaderName.trim()) {
        alert("Team Leader ID, Name are required.");
        return false;
      }
  
      // Validate team members - at least 2 members with name and Moodle ID
      const validMembers = members.filter(m => m.name.trim() && m.id.trim());
      if (validMembers.length < 2) {
        alert("At least 2 team members with name and Moodle ID are required.");
        return false;
      }
  
      // Validate uniqueness of Moodle IDs (leader + members)
      const moodleIds = [leaderId.trim(), ...members.map(m => m.id.trim())];
      const uniqueIds = new Set(moodleIds);
      if (uniqueIds.size !== moodleIds.length) {
        alert("All Moodle IDs (leader and members) must be unique.");
        return false;
      }
  
      // Check if at least one Moodle ID matches the logged-in user's Moodle ID
      const userMatch = moodleIds.some(id => id === username.trim()); // Ensure username is also trimmed
      if (!userMatch) {
        alert("At least one Moodle ID should match your own login ID.");
        return false;
      }
    }
  
    // Step 2: Validate project guides selection
    if (currentStep === 2) {
      const selectedGuide1 = selectedTeachers[0];
      const selectedGuide2 = selectedTeachers[1];
      const selectedGuide3 = selectedTeachers[2];
  
      // Check if all three guides are selected
      if (!selectedGuide1 || !selectedGuide2 || !selectedGuide3) {
        alert("Please select all three guide preferences.");
        return false;
      }
  
      // Check if the guide preferences are unique
      const guides = [selectedGuide1, selectedGuide2, selectedGuide3];
      const guideSet = new Set(guides);
      if (guideSet.size !== guides.length) {
        alert("Guide preferences must be unique.");
        return false;
      }
    }
  
    return true;
  };
  
  const validateFinalSubmission = () => {
    // Step 3: Final domain preferences validation (if required)
    const allDomains = preferences.map(p => p.domain);
    const domainSet = new Set(allDomains);
    if (domainSet.size !== preferences.length) {
      alert("All domain preferences must be different.");
      return false;
    }
  
    return true;
  };
  // Predefined teacher data
  const teachers = {
    'Smart Automation': ['Prof. Vishal Badgujar', 'Prof. Safaq Sayed'],
    'Cyber Security': ['Prof. Manjusha Kashilkar', 'Prof. Sneha Dalvi'],
    'Block Chain': ['Prof. Mandar Ganjapurkar', 'Prof. Sonal Balpande'],
    'IOT': ['Prof. Charul Singh', 'Prof. Selvin Fartado'],
    'Cloud Computing': ['Prof. Sonal Jain', 'Prof. Sonia Anish']
  };

  // Handle opening and closing the popup
  const handlePopup = () => {
    setIsPopupOpen(!isPopupOpen);
    setCurrentStep(1); // Reset to step 1 when closing
    setGroupDetails({
      leaderId: '',
      leaderName: '',
      members: Array(3).fill({ name: '', id: '' }),
    });
    setSelectedTeachers(['', '', '']);
  };

  // Handle moving to the next step
  // const handleNextStep = () => {
  //   if (currentStep === 1) {
  //     setCurrentStep(2);
  //   } else {
  //     console.log('Group Details:', groupDetails);
  //     console.log('Selected Teachers:', selectedTeachers);
  //     handlePopup(); // Close popup after submission
  //   }
  // };
  const handleNextStep = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      try {
        // Prepare the data to be sent
        const groupData = {
          leaderId: groupDetails.leaderId,
          members: groupDetails.members,
          selectedTeachers: selectedTeachers,
        };

        console.log(groupData);
  
        // Send a POST request to the backend
        const response = await AxiosInstance.post('/projectpreference/create-group/', groupData);
  
        // Handle the response
        if (response.status === 201) {
          handlePopup();
          alert('Group created successfully'); // Close popup after successful submission
        }
      } catch (error) {
        alert(error.response.data.error);
        console.error('Error creating group:', error);
      }
    }
  };

  const fetchTeacherList = async () => {
    try {
      const response = await AxiosInstance.get('/teacher/teacher-list/');  // Call the API to fetch teacher list
      setTeacherList(response.data.teachers);  // Store the teacher list in state
    } catch (error) {
      console.error("Error fetching teacher list:", error);
    }
  };

  // Fetch teacher list when component mounts
  useEffect(() => {
    fetchTeacherList();
  }, []);
  
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    try {
      const response = await AxiosInstance.get(`/projects/get_user_projects/`);
      console.log(response.data);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [username]);

  // Handle domain change and dynamic teacher loading

  const [formActive, setFormActive] = useState(false);
  useEffect(() => {
      const fetchProjectStatus = async () => {
        try {
          const response = await AxiosInstance.get('/projects/status-project/?sem=0'); // Adjust the URL to match your API
  
          if (response.data.status) {
            setFormActive(true);   
          } 
        } catch (error) {
          console.error('Error fetching project status:', error);
        }
      };
      fetchProjectStatus();
    },[]);


  return (
    <div className="w-full p-4 dark:bg-gray-600 dark:text-gray-500 rounded-lg">
      {/* Heading and Plus Button */}
      <div className="flex justify-between items-center mb-4 p-3 rounded-md border-2 border-green-500 shadow-md bg-[#DFF0D8]">
        <h2 className="text-2xl font-bold text-[#3C763D]">Mini Projects</h2>
        <button
          onClick={handlePopup}
          className="w-10 h-10 bg-green-700 text-white text-2xl rounded-full font-bold transition shadow-lg hover:scale-105 flex items-center justify-center"
          disabled={!formActive}
        >
          +
        </button>
      </div>

      {/* Grid Layout for Four Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {projects.length > 0 ? (
    projects.map((project) => (
      <div key={project.id} className="bg-[#62d0f3] p-5 rounded-lg relative hover:shadow-md">
        <h3 className="text-lg font-bold text-center text-blue-600">
        {project.final_topic
            ? project.final_topic
            : project.group_no
            ? `Group ${project.group_no}`
            : `${project.div || 'DivX'}-${project.id}`}
        </h3>

        <p className="mt-1 text-white font-semibold text-center">
          {project.final_topic
            ? ""
            : project.group_no
            ? ""
            : "Temporary ID."}
        </p>

        <button 
          className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 rounded hover:bg-blue-700 transition text-sm hover:scale-105 font-bold"
          onClick={() => navigate(`/project-details/${project.id}`)}
        >
          View
        </button>
      </div>
    ))
  ) : (
    <p className="col-span-full text-center text-gray-500">No projects found!</p>
  )}
        {/* <div className="bg-[#62d0f3] p-5 rounded-lg relative hover:shadow-md">
          <h3 className="text-lg font-bold text-center text-blue-600">Bully Box</h3>
          <p className="mt-1 text-white font-semibold text-center">System to give information and raise awareness against bullying by experts.</p>
         
          <button className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 py-1 rounded hover:bg-blue-700 transition text-sm hover:scale-105 font-bold"onClick={() => navigate("/bully-box")} >
            View all
          </button> 
        </div>

        <div className="bg-[#62d0f3] p-5 rounded-lg relative hover:shadow-md">
          <h3 className="text-lg font-bold text-center text-blue-600">HealthMeta</h3>
          <p className="mt-1 text-white font-semibold text-center">System to give real-time health-related problem solutions.</p>
          <button className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 py-1 rounded hover:bg-blue-700 transition text-sm hover:scale-105 font-bold" onClick={() => navigate("/health-meta")}>
            View all
          </button>
        </div>

        <div className="bg-[#62d0f3] p-5 rounded-lg relative hover:shadow-md">
          <h3 className="text-lg font-bold text-center text-blue-600">ProjectPro</h3>
          <p className="mt-1 text-white font-semibold text-center">System to reduce the manual process of project allocation.</p>
          <button className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 py-1 rounded hover:bg-blue-700 transition text-sm hover:scale-105 font-bold" onClick={() => navigate("/project-pro")}>
            View all
          </button>
        </div>

        <div className="bg-[#62d0f3] p-5 rounded-lg relative hover:shadow-md">
          <h3 className="text-lg font-bold text-center text-blue-600">BMI Tracker</h3>
          <p className="mt-1 text-white font-semibold text-center">System to calculate the BMI of any health.</p>
          <button className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 py-1 rounded hover:bg-blue-700 transition text-sm hover:scale-105 font-bold" onClick={() => navigate("/bmi-calculator")}>
            View all
          </button>
        </div> */}
      </div>

      {/* Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg mt-1 w-3/4 md:w-1/3 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
              {currentStep === 1 && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Group Details</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold mb-2">Team Leader Details</h3>
                      <label className="mb-1 text-sm">Team Leader Moodle ID</label>
                      <input
                        type="text"
                        className="border p-1 rounded"
                        value={groupDetails.leaderId}
                        onChange={(e) =>
                          setGroupDetails({ ...groupDetails, leaderId: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-1 text-sm">Team Leader Name</label>
                      <input
                        type="text"
                        className="border p-1 rounded"
                        value={groupDetails.leaderName}
                        onChange={(e) =>
                          setGroupDetails({ ...groupDetails, leaderName: e.target.value })
                        }
                      />
                    </div>
                    <h3 className="text-lg font-bold mt-4">Team Members</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {groupDetails.members.map((member, index) => (
                                              <React.Fragment key={index}>
                                                <div className="flex flex-col">
                                                  <label className="mb-1 text-sm">Member {index + 1} Moodle ID</label>
                                                  <input
                                                    type="text"
                                                    className="border p-1 rounded"
                                                    value={member.id}
                                                    onChange={(e) => {
                                                      const updatedMembers = groupDetails.members.map((m, i) =>
                                                        i === index ? { ...m, id: e.target.value } : m
                                                      );
                                                      setGroupDetails({ ...groupDetails, members: updatedMembers });
                                                    }}
                                                  />
                                                </div>
                                                <div className="flex flex-col">
                                                  <label className="mb-1 text-sm">Member {index + 1} Name</label>
                                                  <input
                                                    type="text"
                                                    className="border p-1 rounded"
                                                    value={member.name}
                                                    onChange={(e) => {
                                                      const updatedMembers = groupDetails.members.map((m, i) =>
                                    i === index ? { ...m, name: e.target.value } : m
                                  );
                                  setGroupDetails({ ...groupDetails, members: updatedMembers });
                                                    }}
                                                  />
                                                </div>
                                              </React.Fragment>
                                            ))}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <button
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-400 transition"
                      onClick={handlePopup}
                    >
                      Close
                    </button>
                    <button
                      className="bg-blue-500 text-white p-2 rounded hover:bg-blue-400 transition"
                      onClick={() => {
                        if (validateStep()) {
                          handleNextStep(); // Proceed to the next step
                        }
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

{currentStep === 2 && (
  <div>
    <h3 className="text-lg font-bold mb-2">Select Project Guides</h3>
    <div className="space-y-4">

      {[1, 2, 3].map((num) => (
        <div key={num} className="flex flex-col">
          <label className="mb-1 text-sm">Select Guide {num}</label>
          <select
            className="border p-2 rounded"
            value={selectedTeachers[num - 1] || ""}
            onChange={(e) => handleTeacherChange(num - 1, e.target.value)}
          >
            <option value="">-- Select a Teacher --</option>
            {teacherList.map((teacher, index) => (
              <option key={index} value={teacher.moodleid}>Prof. {teacher.first_name} {teacher.middle_name ? teacher.middle_name : ''} {teacher.last_name}</option>
            ))}
          </select>
        </div>
      ))}

    </div>

    <div className="flex justify-between mt-4">
      <button
        className="bg-red-500 text-white p-2 rounded hover:bg-red-400 transition"
        onClick={handlePopup}
      >
        Close
      </button>
      <button
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-400 transition"
        onClick={() => {
          if (validateStep()) {
            handleNextStep(); // Proceed with form submission
          }
        }}
      >
        Submit
      </button>
    </div>
  </div>
)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniProject;
