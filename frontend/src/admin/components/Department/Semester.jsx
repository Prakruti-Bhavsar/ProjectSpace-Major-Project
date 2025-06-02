import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faCog, faFilter, faTimes, faPlus, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons"; // Import ProjectDetails
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../../AxiosInstance";

const Semesters = ({ isDarkMode }) => {
  const { category, year } = useParams();
  const [showSettings, setShowSettings] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [newSemester, setNewSemester] = useState({
    semester: "",
    division: "",
    projectCoordinator: "",
    projectCocoordinator: "",
    classInCharge: "",
    tech:""
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState({
    semester: "",
    division: "",
    projectCoordinator: "",
    projectCocoordinator: "",
    classInCharge: "",
    tech:""
  });

  const fetchSemesters = () => {
    if (category && year) {
      AxiosInstance.get(`/semesters/?category=${category}&year=${year}`) // Use query parameters
        .then((response) => {
          console.log(response.data);
          setSemesters(response.data);
        })
        .catch((error) => {
          console.error("Error fetching semesters:", error.response.data.error);
        });
    }
  };
  
  useEffect(() => {
    fetchSemesters(); // Call the function to fetch semesters
  }, [category, year]);
  
  const navigate = useNavigate();
  
  // const categories = {
  //   "Information Technology": ["SEM-III", "SEM-IV", "SEM-V", "SEM-VI", "MAJOR PROJECT"],
  //   "Computer Science": ["SEM-III", "SEM-IV", "SEM-V", "SEM-VI", "MAJOR PROJECT"],
  //   "Computer Science(DS)": ["SEM-III", "SEM-IV", "SEM-V", "SEM-VI", "MAJOR PROJECT"],
  //   "Computer Science (AIML)": ["SEM-III", "SEM-IV", "SEM-V", "SEM-VI", "MAJOR PROJECT"],
  // };

  const handleCheckboxChange = (row) => {
    setSelectedRows((prev) =>
      prev.some((r) => r.semester === row.semester && r.division === row.division)
        ? prev.filter((r) => r.semester !== row.semester || r.division !== row.division)
        : [...prev, row]
    );
  };

  const handleAdd = () => setShowAddModal(true);

  const handleEdit = async () => {
    if (selectedRows.length === 1) {
      console.log(selectedRows[0]);
      const semesterId = selectedRows[0].id; // Assuming selected row has an 'id' field
      try {
        const response = await AxiosInstance.put(`/semesters/${semesterId}/edit-semester/`, {
          semester: editingSemester.semester,
          division: editingSemester.division,
          projectCoordinator: editingSemester.projectCoordinator,
          projectCocoordinator: editingSemester.projectCocoordinator,
          classInCharge: editingSemester.classInCharge,
          tech: editingSemester.tech,
        });
        console.log(response.data); // Handle the response
        alert("Semester updated!");
        setShowEditModal(false);
        fetchSemesters();
      } catch (error) {
        console.error("Error updating semester:", error.response.data.error);
      }
    }
  };

  const handleRemove = async () => {
    if (selectedRows.length === 0) return;
  
    const semesterIds = selectedRows.map((row) => row.id);  // Ensure the row has an 'id' field
  
    try {
      const response = await AxiosInstance.post('/semesters/delete-semesters/', { ids: semesterIds });
      alert('Semesters removed successfully');
      // Optionally, re-fetch semesters or update the state to remove the deleted semesters from the UI
      setSemesters((prev) => prev.filter((sem) => !semesterIds.includes(sem.id)));
    } catch (error) {
      console.error('Error deleting semesters:', error.response?.data?.error || error.message);
    }
  };
  
  const uniqueSemesters = [...new Set(semesters.map(semester => semester.sem))];

  const filteredSemesters = selectedSemester
  ? semesters.filter((semester) => semester.sem === selectedSemester)
  : semesters;

  const [teachers, setTeachers] = useState([]);
  useEffect(() => {
    // Fetch teacher data from the backend
    AxiosInstance.get(`/teacher/by-department/${category}/`)
      .then((response) => {
        // Assuming response.data contains an array of teacher names
        setTeachers(response.data); // Store the teachers' list
      })
      .catch((error) => {
        console.error('Error fetching teachers:', error.response.data.error);
      });
  }, []);

  const handleAddSemester = async () => {
    try {
      console.log(newSemester);
      const response = await AxiosInstance.post(`/semesters/add-semester/?category=${category}&year=${year}`, newSemester);
  
      if (response) {
        // Success
        alert("Semester added successfully!");
        setShowAddModal(false);  
        setNewSemester({  
          semester: '',
          division: '',
          projectCoordinator: '',
          projectCocoordinator: '',
          classInCharge: '',
        });
        fetchSemesters();
      } else {
        const data = await response.json();
        console.error(data);
        alert("Failed to add semester!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  };

  const handleEditButtonClick = () => {
    // Assuming selectedRows is an array, and you want to edit the first selected row
    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      console.log(selectedRows[0]); // Get the first selected row
      setEditingSemester({
        semester: row.sem,
        division: row.div,
        projectCoordinator: row.project_coordinator_name,
        projectCocoordinator: row.project_co_coordinator_name,
        classInCharge: row.class_incharge_name,
        tech: row.tech,
      });

      console.log(editingSemester);
  
      // Open the edit modal
      setShowEditModal(true);
    } else {
      alert("Please select a single semester to edit.");
    }
  };

  return (
    
    <div className={`p-6 transition duration-300 ${isDarkMode ? 'bg-[#121138] text-white' : 'bg-light text-black'} pt-16`}>
      <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate(`/department`)}
                className={`text-lg font-medium underline transition hover:text-blue-600 ${
                  isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-blue-500 hover:text-blue-700'
                }`}
              >
                ← Back to Academic Years
              </button>
      
              {/* Settings Button */}
              {!showSettings && (
                <FontAwesomeIcon
                  icon={faCog}
                  className="text-2xl cursor-pointer hover:text-gray-500 transition"
                  onClick={() => setShowSettings(true)}
                />
              )}
            </div>

      <h2 className="text-3xl font-semibold mb-4">Academic Year: {year}</h2>

      {/* SETTINGS PANEL (Only Shown When showSettings is True) */}
    {showSettings ? (
      <div
        className={`p-6 rounded-lg shadow-lg transition duration-300 ${
          isDarkMode ? "bg-[#1a1a40]" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Semester Settings</h3>
          <FontAwesomeIcon
            icon={faTimes}
            className="text-xl cursor-pointer hover:text-gray-500 transition"
            onClick={() => setShowSettings(false)} // Hide settings when clicked
          />
        </div>

        {/* Semester Dropdown & Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            className="p-2 border rounded-md w-1/3"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            {uniqueSemesters.map((semester) => (
    <option key={semester} value={semester}>
      {semester}
    </option>
  ))}
          </select>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              onClick={handleAdd}
            >
              <FontAwesomeIcon icon={faPlus} /> Add
            </button>
            <button className={`px-4 py-2 rounded-md ${
                selectedRows.length === 1 ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={handleEditButtonClick}
              disabled={selectedRows.length !== 1}
            >
              <FontAwesomeIcon icon={faEdit} /> Edit
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              onClick={handleRemove}
              disabled={selectedRows.length === 0}
            >
              <FontAwesomeIcon icon={faTrash} /> Remove
            </button>
            {/* Filter Icon with Functionality */}
            {/* <FontAwesomeIcon
              icon={faFilter}
              className="text-xl cursor-pointer hover:text-gray-500 transition ml-2"
              onClick={() => setShowFilter(!showFilter)}
            /> */}
          </div>
        </div>

        {/* Search & Filter Section */}
        {/* {showFilter && (
          <div className="p-4 bg-gray-100 rounded-md shadow-md transition mb-5">
            <div className="flex items-center gap-5 mb-4">
              <input
                type="text"
                placeholder="Search..."
                className="p-2 border rounded-md w-1/3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="p-2 border rounded-md w-1/4"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">Select Semester</option>
                {semesters.map((semester) => (
                  <option key={semester.sem} value={semester.sem}>
                    {semester.sem}
                  </option>
                ))}
              </select>
              <select
                className="p-2 border rounded-md w-1/4"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
              >
                <option value="">Select Division</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>
          </div>
        )} */}

        {/* Semester Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border">Select</th>
                <th className="p-3 border">Semester</th>
                <th className="p-3 border">Division</th>
                <th className="p-3 border">Project Coordinator</th>
                <th className="p-3 border">Project Co-coordinator</th>
                <th className="p-3 border">Class In-Charge</th>
                <th className="p-3 border">Domain</th>
              </tr>
            </thead>
            <tbody>
            {filteredSemesters?.map(({ id, sem, div, project_coordinator_name, project_co_coordinator_name, class_incharge_name, tech }) => (
        <tr key={`${sem}-${div}`} className="border">
          <td className="p-3 border text-center">
            <input
              type="checkbox"
              checked={selectedRows.some((r) => r.sem === sem && r.div === div)}
              onChange={() => handleCheckboxChange({ id, sem, div, project_coordinator_name, project_co_coordinator_name, class_incharge_name, tech })}
            />
          </td>
          <td className="p-3 border">{sem}</td>
          <td className="p-3 border">{div}</td>
          <td className="p-3 border">{project_coordinator_name}</td>
          <td className="p-3 border">{project_co_coordinator_name}</td>
          <td className="p-3 border">{class_incharge_name}</td>
          <td className="p-3 border">{tech}</td>
        </tr>
      ))}
              {/* {selectedSemester ? (
                <tr className="border">
                  <td className="p-3 border text-center">
                    <input type="checkbox" />
                  </td>
                  <td className="p-3 border">{selectedSemester}</td>
                  <td className="p-3 border">{selectedDivision || "A"}</td>
                  <td className="p-3 border">John Doe</td>
                  <td className="p-3 border">Jane Smith</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="5" className="p-3 text-center text-gray-500">
                    Select a Semester to View Details
                  </td>
                </tr>
              )} */}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      // SEMESTER GRID (Only Show When Settings are Hidden)
      <div
        className={`p-6 rounded-lg shadow-lg transition duration-300 ${
          isDarkMode ? "bg-[#1a1a40]" : "bg-white"
        }`}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {semesters.map((semester) => (
            <div
              key={`${semester.sem}-${semester.div}`}
              onClick={() =>
                navigate(
                  `/department/${category}/${year}/${semester.sem}/${semester.div}/projects`
                )
              }
              className={`p-6 rounded-lg shadow-md border-2 border-green-400 transition transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center text-lg font-semibold ${
                isDarkMode
                  ? "text-white bg-transparent border-secondary"
                  : "text-gray-900 bg-transparent"
              }`}
            >
              <FontAwesomeIcon
                icon={faFolder}
                className="text-orange-600 text-5xl mb-2"
              />
              <span>
                {semester.sem === "Major Project"
                  ? semester.sem
                  : `Sem ${semester.sem} ${semester.div || ""}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
            {/* Add Semester Modal */}
            {showAddModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                  <h2 className="text-xl font-semibold mb-4">Add Semester</h2>
      
                  <input
                    type="text"
                    placeholder="Semester"
                    className="w-full p-2 border rounded-md mb-3"
                    value={newSemester.semester}
                    onChange={(e) => setNewSemester({ ...newSemester, semester: e.target.value })}
                    required
                  />
                  <input
  className="w-full p-2 border rounded-md mb-3"
  type="text"
  value={newSemester.division}
  onChange={(e) => setNewSemester({ ...newSemester, division: e.target.value })}
  placeholder="Enter Division"
  maxLength={1}  // Optional: Limit the input to 1 character (A or B)
  pattern="[A-Ba-b]" 
  required// Optional: Allow only A or B as valid input
/>
                  {/* <input
                    type="text"
                    placeholder="Project Coordinator"
                    className="w-full p-2 border rounded-md mb-3"
                    value={newSemester.projectCoordinator}
                    onChange={(e) => setNewSemester({ ...newSemester, projectCoordinator: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Project Coordinator"
                    className="w-full p-2 border rounded-md mb-3"
                    value={newSemester.projectCoordinator}
                    onChange={(e) => setNewSemester({ ...newSemester, projectCocoordinator: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Class In-Charge"
                    className="w-full p-2 border rounded-md mb-3"
                    value={newSemester.classInCharge}
                    onChange={(e) => setNewSemester({ ...newSemester, classInCharge: e.target.value })}
                  /> */}
                  <select
                    className="w-full p-2 border rounded-md mb-3"
                    value={newSemester.projectCoordinator}
                    required
                    onChange={(e) => setNewSemester({ ...newSemester, projectCoordinator: e.target.value })}
                  >
                    <option value="">Select Project Coordinator</option>
                    {teachers.map((teacher) => (
    <option key={teacher.moodleid} value={teacher.moodleid}>
      {teacher.first_name} {teacher.middle_name ? teacher.middle_name + " " : ""}{teacher.last_name}
    </option>
  ))}
                  </select>

                  {/* Project Co-coordinator Select */}
                  <select
                    className="w-full p-2 border rounded-md mb-3"
                    value={newSemester.projectCocoordinator}
                    required
                    onChange={(e) => setNewSemester({ ...newSemester, projectCocoordinator: e.target.value })}
                  >
                    <option value="">Select Project Co-coordinator</option>
                    {teachers.map((teacher) => (
    <option key={teacher.moodleid} value={teacher.moodleid}>
      {teacher.first_name} {teacher.middle_name ? teacher.middle_name + " " : ""}{teacher.last_name}
    </option>
  ))}
                  </select>

                  {/* Class In-Charge Select */}
                  <select
                    className="w-full p-2 border rounded-md mb-3"
                    value={newSemester.classInCharge}
                    required
                    onChange={(e) => setNewSemester({ ...newSemester, classInCharge: e.target.value })}
                  >
                    <option value="">Select Class In-Charge</option>
                    {teachers.map((teacher) => (
    <option key={teacher.moodleid} value={teacher.moodleid}>
      {teacher.first_name} {teacher.middle_name ? teacher.middle_name + " " : ""}{teacher.last_name}
    </option>
  ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Domain"
                    className="w-full p-2 border rounded-md mb-3"
                    value={newSemester.tech}
                    onChange={(e) => setNewSemester({ ...newSemester, tech: e.target.value })}
                    required
                  />
      
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                      onClick={() => setShowAddModal(false)}
                    >
                      Close
                    </button>
                    <button
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                      onClick={handleAddSemester}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

      {/* <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-[#121138]' : 'bg-white'}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories[category]?.map((semester) => (
            <div
              key={semester}
              onClick={() => navigate(`/department/${category}/${year}/${semester}/projects`)} // Navigate to ProjectDetails
              className={`p-6 rounded-lg shadow-md border-2 border-green-400 transition transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center text-lg font-semibold ${
                isDarkMode ? 'text-white bg-transparent border-secondary' : 'text-gray-900 bg-transparent'
              }`}
            >
              <FontAwesomeIcon icon={faFolder} className="text-orange-600 text-5xl mb-2" />
              <span>{semester}</span>
            </div>
          ))}
        </div>
      </div> */}
      {/* {showEditModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 dark:bg-gray-800 dark:text-white">
      <h2 className="text-xl font-semibold mb-4">Edit Semester</h2>

      <select
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.semester}
        onChange={(e) =>
          setEditingSemester({ ...editingSemester, semester: e.target.value })
        }
      >
        <option value="">Select Semester</option>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
          <option key={num} value={num}>
            Semester {num}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Enter Division"
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.division}
        onChange={(e) => setEditingSemester({ ...editingSemester, division: e.target.value })}
        maxLength={1}
        pattern="[A-Ba-b]"
      />

      <select
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.projectCoordinator}
        onChange={(e) =>
          setEditingSemester({ ...editingSemester, projectCoordinator: e.target.value })
        }
      >
        <option value="">Select Project Coordinator</option>
        {teachers.map((teacher) => (
          <option
            key={teacher.moodleid}
            value={`${teacher.first_name} ${teacher.middle_name ? teacher.middle_name + ' ' : ''}${teacher.last_name}`}
          >
            {teacher.first_name} {teacher.middle_name ? teacher.middle_name + " " : ""}{teacher.last_name}
          </option>
        ))}
      </select>

      <select
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.projectCocoordinator}
        onChange={(e) =>
          setEditingSemester({ ...editingSemester, projectCocoordinator: e.target.value })
        }
      >
        <option value="">Select Project Co-coordinator</option>
        {teachers.map((teacher) => (
          <option
            key={teacher.moodleid}
            value={`${teacher.first_name} ${teacher.middle_name ? teacher.middle_name + ' ' : ''}${teacher.last_name}`}
          >
            {teacher.first_name} {teacher.middle_name ? teacher.middle_name + " " : ""}{teacher.last_name}
          </option>
        ))}
      </select>

      <select
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.classInCharge}
        onChange={(e) =>
          setEditingSemester({ ...editingSemester, classInCharge: e.target.value })
        }
      >
        <option value="">Select Class In-Charge</option>
        {teachers.map((teacher) => (
          <option
            key={teacher.moodleid}
            value={`${teacher.first_name} ${teacher.middle_name ? teacher.middle_name + ' ' : ''}${teacher.last_name}`}
          >
            {teacher.first_name} {teacher.middle_name ? teacher.middle_name + " " : ""}{teacher.last_name}
          </option>
        ))}
      </select>

      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
          onClick={() => setShowEditModal(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)} */}
{showEditModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 dark:bg-gray-800 dark:text-white">
      <h2 className="text-xl font-semibold mb-4">Edit Semester</h2>

      {/* Editable Semester Input (pre-filled) */}
      <input
        type="text"
        placeholder="Semester"
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.semester}
        onChange={(e) =>
          setEditingSemester({ ...editingSemester, semester: e.target.value })
        }
      />

      {/* Editable Division Input (pre-filled) */}
      <input
        type="text"
        placeholder="Enter Division"
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.division}
        onChange={(e) => setEditingSemester({ ...editingSemester, division: e.target.value })}
        maxLength={1}
        pattern="[A-Ba-b]"
      />

      {/* Editable Project Coordinator Dropdown (pre-filled) */}
      <select
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.projectCoordinator}
        onChange={(e) =>
          setEditingSemester({ ...editingSemester, projectCoordinator: e.target.value })
        }
      >
        <option value="">Select Project Coordinator</option>
        {teachers.map((teacher) => (
          <option
            key={teacher.moodleid}
            value={teacher.moodleid}
          >
            {teacher.first_name} {teacher.middle_name ? teacher.middle_name + " " : ""}{teacher.last_name}
          </option>
        ))}
      </select>

      {/* Editable Project Co-coordinator Dropdown (pre-filled) */}
      <select
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.projectCocoordinator}
        onChange={(e) =>
          setEditingSemester({ ...editingSemester, projectCocoordinator: e.target.value })
        }
      >
        <option value="">Select Project Co-coordinator</option>
        {teachers.map((teacher) => (
          <option
            key={teacher.moodleid}
            value={teacher.moodleid}
          >
            {teacher.first_name} {teacher.middle_name ? teacher.middle_name + " " : ""}{teacher.last_name}
          </option>
        ))}
      </select>

      {/* Editable Class In-Charge Dropdown (pre-filled) */}
      <select
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.classInCharge}
        onChange={(e) =>
          setEditingSemester({ ...editingSemester, classInCharge: e.target.value })
        }
      >
        <option value="">Select Class In-Charge</option>
        {teachers.map((teacher) => (
          <option
            key={teacher.moodleid}
            value={teacher.moodleid}
          >
            {teacher.first_name} {teacher.middle_name ? teacher.middle_name + " " : ""}{teacher.last_name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Domain"
        className="w-full p-2 border rounded-md mb-3"
        value={editingSemester.tech}
        onChange={(e) =>
          setEditingSemester({ ...editingSemester, tech: e.target.value })
        }
      />

      {/* Save and Cancel Buttons */}
      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
          onClick={() => setShowEditModal(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={handleEdit}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Semesters;
