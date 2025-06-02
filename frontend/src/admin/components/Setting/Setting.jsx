import React, { useState, useEffect } from 'react';
import { FiEdit, FiCamera } from 'react-icons/fi';
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import AxiosInstance from "../../../AxiosInstance";

const AdminProfile = () => {
  const [openSections, setOpenSections] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [tags, setTags] = useState([]);
  const [profileData, setProfileData] = useState(null); // State to hold profile data

  const [generalForm, setGeneralForm] = useState({
    title:"",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    experience:"",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const sections = ["General", "Optional", "Password Update"];

  // Function to fetch student profile data
  const fetchProfileData = async () => {
      try {
        const response = await AxiosInstance.get('/teacher-profile/');  // Adjust API endpoint based on your Django URL
        setProfileData(response.data); 
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching student profile data:", error);
      }
    };
  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if(profileData){
      setGeneralForm({
            title: profileData.title || "",
            first_name: profileData.first_name,
            middle_name: profileData.middle_name || "",
            last_name: profileData.last_name,
            email: profileData.email,
            experience: profileData.experience || "",
          });
    }
  }, [profileData]);

  const handleGeneralChange = (e) => {
    setGeneralForm({ ...generalForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleGeneralSubmit = async () => {
    try {
      await AxiosInstance.patch('/teacher-profile/update-profile/', generalForm);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    const { current_password, new_password, confirm_password } = passwordForm;
    if (new_password !== confirm_password) return alert("Passwords do not match");

     if (!passwordRegex.test(new_password)) {
      alert("Password does not meet constraints.");
      return;
    }

    try {
      await AxiosInstance.post('/teacher-profile/update_password/', {
        current_password,
        new_password
      });
      setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: ""
      })
      alert("Password updated successfully!");
    } catch (err) {
      setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: ""
      })
      alert(err.response.data.error || "Error updating the password");
    }
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  const toggleAll = () => {
    const newState = !allExpanded;
    const updatedSections = sections.reduce((acc, _, index) => {
      acc[index] = newState;
      return acc;
    }, {});
    setOpenSections(updatedSections);
    setAllExpanded(newState);
  };

  const addTag = (event) => {
    if (event.key === "Enter" && event.target.value.trim() !== "") {
      setTags((prevTags) => [...prevTags, event.target.value.trim()]);
      event.target.value = "";
    }
  };

  const removeTag = (tagToRemove) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToRemove));
  };
  
  if (!profileData) return <div>Loading...</div>;

  return (
    <div className="bg-gray-100 min-h-screen pt-16">
       <div
  className={`
    mt-2 p-2 md:p-6 bg-white shadow-lg rounded-lg w-full
    dark:bg-gray-800 dark:border-gray-600 dark:text-white
    transition-all duration-300 max-w-[1200]
  `}
>
  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
    <h2 className="text-xl md:text-2xl font-bold text-center md:text-left">
      {`${profileData.first_name} ${profileData.last_name}`}
    </h2>
    <button
      className="bg-[#5cc800] text-white font-semibold hover:border-green-500 px-3 md:px-4 py-2 rounded"
      onClick={toggleAll}
    >
      {allExpanded ? "Collapse All" : "Expand All"}
    </button>
  </div>
  <div>
    {sections.map((section, index) => (
      <div key={index} className="border-b py-2">
        <button
          className="flex justify-between items-center w-full text-base md:text-lg font-semibold"
          onClick={() => toggleSection(index)}
        >
          {section}
          {openSections[index] ? (
            <FaChevronDown className="text-gray-600 dark:text-gray-200" />
          ) : (
            <FaChevronRight className="text-gray-600 dark:text-gray-200" />
          )}
        </button>
        {openSections[index] && (
          <div className="p-2 md:p-3 bg-gray-100 rounded-md mt-2 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {section === "General" ? (
              <div className="space-y-4">
                {["title","first_name", "middle_name", "last_name", "email", "experience"].map((field, i) => (
                  <div
                    key={i}
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2"
                  >
                    <span className="w-full md:w-40 capitalize">{field.replace("_", " ")}</span>
                    <input
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      value={generalForm[field]}
                      onChange={handleGeneralChange}
                      className="flex-1 p-2 border rounded text-black"
                    />
                  </div>
                ))}
                <button
                  onClick={handleGeneralSubmit}
                  className="bg-blue-600 text-white px-3 md:px-4 py-2 mt-2 md:mt-4 rounded w-full md:w-auto"
                >
                  Update Profile
                </button>
              </div>
            ) : section === "Optional" ? (
              <div className="space-y-4">
                {[
                  { label: "ID Number", type: "text", placeholder: "Enter ID number", value: profileData.moodleid },
                  { label: "Institution", type: "text", value: "APSIT Thane" },
                  { label: "Department", type: "text", placeholder: "Enter department", value: profileData.department },
                ].map(({ label, type, ...props }, i) => (
                  <div
                    key={i}
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2"
                  >
                    <span className="w-full md:w-40">{label}</span>
                    <input className="flex-1 p-2 border rounded text-black" type={type} {...props} />
                  </div>
                ))}
              </div>
            ) : section === "Password Update" ? (
              <div className="space-y-3">
                {[
                  { label: "Current Password", name: "current_password" },
                  { label: "New Password", name: "new_password" },
                  { label: "Confirm Password", name: "confirm_password" },
                ].map(({ label, name }, i) => (
                  <div
                    key={i}
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4"
                  >
                    <span className="w-full md:w-40">{label}</span>
                    <input
                      type="password"
                      name={name}
                      onChange={handlePasswordChange}
                      className="flex-1 p-2 border rounded"
                    />
                  </div>
                ))}
                <div className="text-sm text-gray-600 bg-gray-100 p-2 md:p-3 rounded">
                  <p>Password must contain:</p>
                  <ul className="list-disc ml-6">
                    <li>At least 8 characters</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one lowercase letter</li>
                    <li>At least one number</li>
                    <li>At least one special character</li>
                  </ul>
                </div>
                <button
                  onClick={handlePasswordSubmit}
                  className="bg-blue-600 text-white px-3 md:px-4 py-2 mt-2 md:mt-4 rounded w-full md:w-auto"
                >
                  Change Password
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    ))}
  </div>
</div>
    </div>
  );
};

export default AdminProfile;
