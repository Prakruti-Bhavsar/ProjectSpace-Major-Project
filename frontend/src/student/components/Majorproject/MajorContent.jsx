import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from "../../../AxiosInstance";

const MajorProjectPopup = () => {
  const navigate = useNavigate();

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

  const [formActive, setFormActive] = useState(false);
  const [projectExists, setProjectExists] = useState(false);
  const [project, setProject] = useState(null);

  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // State for group details
  const [groupDetails, setGroupDetails] = useState({
    leaderId: '',
    leaderName: '',
    div:'',
    members: Array(3).fill({ name: '', id: '' }),
  });

  useEffect(() => {
    const fetchProjectStatus = async () => {
      try {
        const response = await AxiosInstance.get('/projects/status-project/?sem=1'); // Adjust the URL to match your API

        if (response.data.status) {
          // If status is true, visibility is allowed, check for project data
          setFormActive(true);   
        } 
        if (response.data.project) {
          setProjectExists(true);
          setProject(response.data.project); // Store project data
        }
      } catch (error) {
        console.error('Error fetching project status:', error);
      }
    };
    fetchProjectStatus();
  },[]);


  // State for domain preferences and teachers
  const [selectedDomain, setSelectedDomain] = useState(['', '', '']);
  const [teacherList, setTeacherList] = useState([[], [], []]);

  const [preferences, setPreferences] = useState([
    { domain: '', preference1: '', preference2: '', preference3: '' },
    { domain: '', preference1: '', preference2: '', preference3: '' },
    { domain: '', preference1: '', preference2: '', preference3: '' }
  ]);

  const [teachers, setTeacherPreferences] = useState({});

  const validateStep = () => {
    if (currentStep === 1) {
      const { leaderId, leaderName, div, members } = groupDetails;
  
      if (!leaderId.trim() || !leaderName.trim() || !div.trim()) {
        alert("Team Leader ID, Name, and Division are required.");
        return false;
      }
  
      const validMembers = members.filter(m => m.name.trim() && m.id.trim());
      if (validMembers.length < 2) {
        alert("At least 2 team members with name and Moodle ID are required.");
        return false;
      }
      
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
  
    if ([2, 3, 4].includes(currentStep)) {
      const index = currentStep - 2;
    
      const domain = selectedDomain[index];
      if (!domain) {
        alert(`Please select a domain for Preference ${index + 1}`);
        return false;
      }
    
      const teacher1 = document.querySelector(`input[name="teacher1_${currentStep - 1}"]:checked`)?.value || '';
      const teacher2 = document.querySelector(`input[name="teacher2_${currentStep - 1}"]:checked`)?.value || '';
      const teacher3 = document.querySelector(`input[name="teacher3_${currentStep - 1}"]:checked`)?.value || '';

      // if (!teacher1 || !teacher2 || !teacher3) {
      //   alert("Please select all three teacher preferences.");
      //   return false;
      // }
    
      const teachers = [teacher1, teacher2, teacher3];
      
      // Create a set from the non-empty teachers list
      const teacherSet = new Set(teachers.filter(Boolean));
    
      // If the size of the set is not equal to the number of non-empty teacher values, it means there are duplicates
      if (teacherSet.size !== teachers.filter(Boolean).length) {
        alert("Teacher preferences within a domain must be unique.");
        return false;
      }
    }
  
    return true;
  };
  
  const validateFinalSubmission = () => {
    const allDomains = preferences.map(p => p.domain);
    const domainSet = new Set(allDomains);
    if (domainSet.size !== preferences.length) {
      alert("All domain preferences must be different.");
      return false;
    }
    return true;
  };
  // Handle opening and closing the popup
  const handlePopup = () => {
    AxiosInstance.get("/teacherpreferences/get_preferences/") // Assuming ViewSet is registered in `urls.py`
      .then(response => setTeacherPreferences(response.data))
      .catch(error => console.error("Failed to fetch teacher preferences", error));

    setIsPopupOpen(!isPopupOpen);
  };

  // Handle moving to the next step or submitting
  const handleNextStep = () => {
    if (!validateStep()) return;
    if (currentStep < 4) {
      // Save current preferences before moving to the next step
      const updatedPreferences = [...preferences];
      const currentPreferenceIndex = currentStep - 2; // Index for current step preferences

      updatedPreferences[currentPreferenceIndex] = {
        domain: selectedDomain[currentPreferenceIndex],
        preference1: document.querySelector(`input[name="teacher1_${currentStep - 1}"]:checked`)?.value || '',
        preference2: document.querySelector(`input[name="teacher2_${currentStep - 1}"]:checked`)?.value || '',
        preference3: document.querySelector(`input[name="teacher3_${currentStep - 1}"]:checked`)?.value || '',
      };

      setPreferences(updatedPreferences);
      setCurrentStep(currentStep + 1);
    } else {
      if (!validateFinalSubmission()) return;
      const updatedPreferences = [...preferences];
      const currentPreferenceIndex = currentStep - 2; // Index for current step preferences

      updatedPreferences[currentPreferenceIndex] = {
        domain: selectedDomain[currentPreferenceIndex],
        preference1: document.querySelector(`input[name="teacher1_${currentStep - 1}"]:checked`)?.value || '',
        preference2: document.querySelector(`input[name="teacher2_${currentStep - 1}"]:checked`)?.value || '',
        preference3: document.querySelector(`input[name="teacher3_${currentStep - 1}"]:checked`)?.value || '',
      };

      setPreferences(updatedPreferences);

      const payload = {
        leaderId: groupDetails.leaderId,
        leaderName: groupDetails.leaderName,
        div: groupDetails.div,
        members: groupDetails.members,
        preferences,
      };

      console.log('Payload to submit:', payload);
      submitGroupData(payload);
    }
  };

  const submitGroupData = async (payload) => {
    try {
      const response = await AxiosInstance.post('/projectpreference/save_project/', {payload:payload});
      alert(`Group saved successfully: ${response.data.message}`);
      setIsPopupOpen(false)
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred while saving the group.';
      alert(`Error saving group: ${errorMessage}`);
    }
  };

  // Handle moving to the previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle domain change and dynamic teacher loading
  const handleDomainChange = (domain, step) => {
    const updatedDomains = [...selectedDomain];
    updatedDomains[step - 1] = domain;
    setSelectedDomain(updatedDomains);
    const updatedTeachers = [...teacherList];
    const teachersForDomain = teachers[domain] || [];
    updatedTeachers[step - 1] = teachersForDomain;
    setTeacherList(updatedTeachers);
  };

  return (
    <div className="w-full p-4 dark:bg-gray-600 dark:text-gray-500 rounded-lg">
      <div className="flex justify-between items-center mb-4 p-3 rounded-md border-2 border-green-500 bg-[#DFF0D8]">
        <h2 className="text-2xl font-bold text-[#3C763D]">Major Projects</h2>
      </div>
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ">
        <div className="bg-[#62d0f3] p-4 rounded-lg relative hover:shadow-md cursor-pointer">
          <h3 className="text-lg font-bold text-center text-blue-600">Project Space</h3>
          <p className="mt-1 text-white font-semibold text-center">A comprehensive web framework to manage academic projects by using genetic algorithm and machine learning</p>
          <button className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 py-1 rounded hover:bg-blue-700 transition text-sm hover:scale-105 font-bold" onClick={() => navigate("/major_project")} >
            View all
          </button>
        </div>
      </div> */}

      {/* {username === "21104067" || username === "21104057" ? (
        <div className="bg-[#62d0f3] p-4 rounded-lg relative hover:shadow-md cursor-pointer">
          <h3 className="text-lg font-bold text-center text-blue-600">Project Space</h3>
          <p className="mt-1 text-white font-semibold text-center">
            A comprehensive web framework to manage academic projects by using genetic algorithm and machine learning
          </p>
          <button
            className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 py-1 rounded hover:bg-blue-700 transition text-sm hover:scale-105 font-bold"
            onClick={() => navigate("/major_project")}
          >
            View all
          </button>
        </div>
      ) : (
        <div className="bg-gray-200 p-4 rounded-lg text-center">
          <h3 className="text-lg font-bold text-gray-700">Provide Your Group Details</h3>
          <p className="mt-1 text-gray-600">Fill in your project preferences to proceed.</p>
          <button
            className="mt-2 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-700 transition font-bold"
            onClick={handlePopup}
          >
            Open Form
          </button>
        </div>
      )} */}

{projectExists ? (
      <div className="bg-[#62d0f3] p-4 rounded-lg relative hover:shadow-md cursor-pointer">
        <h3 className="text-lg font-bold text-center text-blue-600">{project.div}{project.id}</h3>
        {/* <p className="mt-1 text-white font-semibold text-center">
          A comprehensive web framework to manage academic projects by using genetic algorithm and machine learning
        </p> */}
        <button
          className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 py-1 rounded hover:bg-blue-700 transition text-sm hover:scale-105 font-bold"
          onClick={() => navigate(`/major_project/${project.id}`)}
        >
          View
        </button>
      </div>
    ) : formActive ? (
      <div className="bg-gray-200 p-4 rounded-lg text-center">
        <h3 className="text-lg font-bold text-gray-700">Provide Your Group Details</h3>
        <p className="mt-1 text-gray-600">Fill in your project preferences to proceed.</p>
        <button
          className="mt-2 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-700 transition font-bold"
          onClick={handlePopup}
        >
          Open Form
        </button>
      </div>
    ) : null}

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
                        required
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
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-1 text-sm">Division</label>
                      <input
                        type="text"
                        className="border p-1 rounded"  
                        value={groupDetails.div}
                        onChange={(e) =>
                          setGroupDetails({ ...groupDetails, div: e.target.value })
                        }
                        required       
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
                </div>
              )}

               {/* Preferences Steps */}
               {[2, 3, 4].includes(currentStep) && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Preference {currentStep - 1}</h3>
                  <div className="space-y-2">
                    <h4 className="font-bold">Select Domain:</h4>
                    {Object.keys(teachers).map((domain) => (
                      <div key={domain} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`domain${currentStep - 1}`}
                          value={domain}
                          checked={selectedDomain[currentStep - 2] === domain}
                          onChange={() => handleDomainChange(domain, currentStep - 1)}
                          className="cursor-pointer"
                        />
                        <label className="ml-2 text-sm">{domain}</label>
                      </div>
                    ))}
                  </div>

                  {/* Render teacher preferences */}
                  <h4 className="font-bold mt-4">Available Teachers:</h4>
                  <div className="space-y-4">
                    {teacherList[currentStep - 2].length > 0 && (
                      <>
                        <div>
                          <label className="font-bold">Preference 1:</label>
                          <div>
                            {teacherList[currentStep - 2].map((teacher, index) => (
                              <div key={index} className="flex items-center">
                                <input
                                  type="radio"
                                  name={`teacher1_${currentStep - 1}`}
                                  value={teacher}
                                  className="cursor-pointer"
                                />
                                <label className="ml-2 text-sm">{teacher}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                        {teacherList[currentStep - 2].length > 1 && (
                          <div>
                            <label className="font-bold">Preference 2:</label>
                            <div>
                              {teacherList[currentStep - 2].map((teacher, index) => (
                                <div key={index} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`teacher2_${currentStep - 1}`}
                                    value={teacher}
                                    className="cursor-pointer"
                                  />
                                  <label className="ml-2 text-sm">{teacher}</label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {teacherList[currentStep - 2].length > 2 && (
                          <div>
                            <label className="font-bold">Preference 3:</label>
                            <div>
                              {teacherList[currentStep - 2].map((teacher, index) => (
                                <div key={index} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`teacher3_${currentStep - 1}`}
                                    value={teacher}
                                    className="cursor-pointer"
                                  />
                                  <label className="ml-2 text-sm">{teacher}</label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-4">
                {currentStep === 1 && (
                  <button
                    className="bg-gray-500 text-white p-2 rounded hover:bg-gray-400 transition"
                    onClick={handlePopup}
                  >
                    Close
                  </button>
                )}
                {currentStep > 1 && (
                  <button
                    className="bg-gray-300 text-gray-700 p-2 rounded"
                    onClick={handlePreviousStep}
                  >
                    Previous
                  </button>
                )}
                <button
                  className="bg-blue-500 text-white p-2 rounded"
                  onClick={handleNextStep}
                >
                  {currentStep === 4 ? 'Submit' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MajorProjectPopup;
