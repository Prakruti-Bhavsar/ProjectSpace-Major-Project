import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const MiniProject = () => {
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
  const [selectedDomain, setSelectedDomain] = useState('');
  const [teacherList, setTeacherList] = useState([]);
  const [projectTopics, setProjectTopics] = useState(['', '', '']); // For storing project topics

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
    setSelectedDomain('');
    setTeacherList([]);
    setProjectTopics(['', '', '']);
  };

  // Handle moving to the next step
  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      console.log('Group Details:', groupDetails);
      console.log('Selected Domain:', selectedDomain);
      console.log('Selected Teachers:', teacherList);
      console.log('Project Topics:', projectTopics);
      handlePopup(); // Close popup after submission
    }
  };

  // Handle domain change and dynamic teacher loading
  const handleDomainChange = (domain) => {
    setSelectedDomain(domain);
    setTeacherList(teachers[domain] || []);
  };

  // Handle project topic change
  const handleProjectTopicChange = (index, value) => {
    const updatedTopics = [...projectTopics];
    updatedTopics[index] = value;
    setProjectTopics(updatedTopics);
  };

  return (
    <div className="w-full p-4 dark:bg-gray-600 dark:text-gray-500 rounded-lg">
      {/* Heading and Plus Button */}
      <div className="flex justify-between items-center mb-4 p-3 rounded-md border-2 border-green-500 shadow-md bg-[#DFF0D8]">
        <h2 className="text-2xl font-bold text-[#3C763D]">Mini Projects</h2>
        <button
          onClick={handlePopup}
          className="w-10 h-10 bg-green-700 text-white text-2xl rounded-full font-bold transition shadow-lg hover:scale-105 flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* Grid Layout for Four Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#62d0f3] p-5 rounded-lg relative hover:shadow-md">
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
        </div>
      </div>

      {/* Popup */}
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
                  <div className="flex justify-between mt-4">
                    <button
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-400 transition"
                      onClick={handlePopup}
                    >
                      Close
                    </button>
                    <button
                      className="bg-blue-500 text-white p-2 rounded hover:bg-blue-400 transition"
                      onClick={handleNextStep}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Selection of Domain, Teachers and Topic</h3>
                  <div className="space-y-2">
                    <label className="mb-1 text-sm">Select Domain</label>
                    {Object.keys(teachers).map((domain) => (
                      <div key={domain}>
                        <input
                          type="radio"
                          id={domain}
                          name="domain"
                          value={domain}
                          checked={selectedDomain === domain}
                          onChange={() => handleDomainChange(domain)}
                        />
                        <label htmlFor={domain} className="ml-2">{domain}</label>
                      </div>
                    ))}
                    {selectedDomain && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold">Available Teachers:</h4>
                        <ul className="list-disc ml-6">
                          {teacherList.map((teacher, index) => (
                            <li key={index}>{teacher}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h4 className="text-md font-semibold">Project Topics:</h4>
                    {projectTopics.map((topic, index) => (
                      <div key={index} className="flex flex-col">
                        <label className="mb-1 text-sm">Topic {index + 1}</label>
                        <input
                          type="text"
                          className="border p-1 rounded"
                          value={topic}
                          onChange={(e) => handleProjectTopicChange(index, e.target.value)}
                        />
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
                      onClick={handleNextStep}
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
