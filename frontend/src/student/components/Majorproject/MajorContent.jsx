import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const MajorProjectPopup = () => {
  const navigate = useNavigate();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // State for group details
  const [groupDetails, setGroupDetails] = useState({
    leaderId: '',
    leaderName: '',
    members: Array(3).fill({ name: '', id: '' }),
  });

  // State for domain preferences and teachers
  const [selectedDomain, setSelectedDomain] = useState(['', '', '']);
  const [teacherList, setTeacherList] = useState([[], [], []]);

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
  };

  // Handle moving to the next step or submitting
  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Group Details:', groupDetails);
      console.log('Selected Domains:', selectedDomain);
      console.log('Selected Teachers:', teacherList);
      handlePopup(); // Close popup after submission
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
    updatedTeachers[step - 1] = teachers[domain] || [];
    setTeacherList(updatedTeachers);
  };

  return (
    <div className="w-full p-4 dark:bg-gray-600 dark:text-gray-500 rounded-lg">
      <div className="flex justify-between items-center mb-4 border p-3 rounded-md bg-[#2777a6]">
        <h2 className="text-2xl font-bold text-white">Major Projects</h2>
        <button
          onClick={handlePopup}
          className="w-10 h-10 bg-[#121138] text-white p-2 rounded-full font-bold hover:bg-[#121138] transition shadow-md hover:scale-105"
        >
          +
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#62d0f3] p-4 rounded-lg relative hover:shadow-md cursor-pointer">
          <h3 className="text-lg font-bold text-center text-blue-600">Project Space</h3>
          <p className="mt-1 text-white font-bold text-center">A comprehensive web framework to manage academic projects by using genetic algorithm and machine learning</p>
          <button className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 py-1 rounded hover:bg-blue-700 transition text-sm hover:scale-105 font-bold" onClick={() => navigate("/major_project")} >
            View all
          </button>
        </div>
      </div>

      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg mt-1 w-3/4 md:w-1/3">
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
                                const members = [...groupDetails.members];
                                members[index].id = e.target.value;
                                setGroupDetails({ ...groupDetails, members });
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
                                const members = [...groupDetails.members];
                                members[index].name = e.target.value;
                                setGroupDetails({ ...groupDetails, members });
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

                  <h4 className="font-bold mt-4">Available Teachers:</h4>
                  <div className="space-y-2">
                    {teacherList[currentStep - 2].map((teacher, index) => (
                      <div key={index} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`teacher${currentStep - 1}`}
                          value={teacher}
                          className="mr-2 cursor-pointer"
                        />
                        <label className="text-sm">{teacher}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-4">
                {/* Show Close button in Group Details and Previous button in Preferences Steps */}
                {currentStep === 1 ? (
                  <button
                    className="bg-gray-500 text-white p-2 rounded hover:bg-gray-400 transition"
                    onClick={handlePopup}
                  >
                    Close
                  </button>
                ) : (
                  currentStep > 1 && (
                    <button
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-400 transition"
                      onClick={handlePreviousStep}
                    >
                      Previous
                    </button>
                  )
                )}
                <button
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-400 transition"
                  onClick={handleNextStep}
                >
                  {currentStep < 4 ? 'Next' : 'Submit'}
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
