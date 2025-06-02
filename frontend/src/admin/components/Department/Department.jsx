import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faCog, faPlus, faEdit, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";
 // Import Semesters component
import { useNavigate} from "react-router-dom";
import AxiosInstance from "../../../AxiosInstance";

const DeptDetail = ({ isDarkMode }) => {
  const [selectedCategory, setSelectedCategory] = useState("IT");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editData, setEditData] = useState({ name: "", year: "" });

  const navigate = useNavigate(); // Initialize navigate function

  const handleRowSelection = (department, year) => {
    const isSelected = selectedRows.some((row) => row.department === department && row.year === year);
  
    if (isSelected) {
      // Remove if already selected
      setSelectedRows(selectedRows.filter((row) => !(row.department === department && row.year === year)));
    } else {
      // Add new selection
      setSelectedRows([...selectedRows, { department, year }]);
    }
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = () => {
    setDepartments(departments.map((dept) => (dept.name === editData.name ? editData : dept)));
    setShowEditPopup(false);
  };

  const handleAddDepartment = (newDept) => {
    setDepartments([...departments, newDept]);
    setShowAddPopup(false);
  };
  // const categories = {
  //   IT: ["2025-2024", "2024-2023", "2023-2022", "2022-2021", "2021-2020", "2020-2019"],
  //   CS: ["2025-2024", "2024-2023", "2023-2022", "2022-2021", "2021-2020"],
  //   DS: ["2025-2024", "2024-2023", "2023-2022", "2022-2021"],
  //   AIML: ["2025-2024", "2024-2023", "2023-2022", "2022-2021", "2021-2020"],
  // };
  const [academicYear, setAcademicYear] = useState("");
  const [categories, setCategories] = useState({});

  const fetchCategories = async () => {
    try {
      const response = await AxiosInstance.get("/years/grouped-by-department/"); // Replace with your backend URL
      const sortedData = {};
  
      // Reverse the order of years for each department
      Object.keys(response.data).forEach((department) => {
        sortedData[department] = response.data[department].sort((a, b) => b.localeCompare(a));
      });
      console.log(response.data);
      setCategories(response.data);
      const firstCategory = Object.keys(response.data)[0];
      if (firstCategory) {
        setSelectedCategory(firstCategory);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  
  useEffect(() => {
    fetchCategories(); // Call the fetchCategories function
  }, []);

    const handleSave = () => {
      if (!selectedDepartment || !academicYear) {
        alert("Please select both department and academic year.");
        return;
      }
    
      AxiosInstance.post("/years/", {
        department_name: selectedDepartment,
        year: academicYear,
      })
        .then((response) => {
          alert("Year added successfully!");
          setShowAddPopup(false);
          fetchCategories();
          // Optionally refresh your data here if needed
        })
        .catch((error) => {
          console.error("Error saving year:", error);
          alert(error.response.data.error);
        });
    };

    const handleRemove = async () => {
      if (selectedRows.length === 0) return;  // No rows selected, prevent action
    
      // Confirmation prompt
      const isConfirmed = window.confirm("Are you sure you want to delete the selected rows?");
      
      if (!isConfirmed) {
        return;  // If not confirmed, do nothing
      }
    
      try {
        const response = await AxiosInstance.delete('/years/delete_selected/', {
          data: { ids: selectedRows }, // Send selected row IDs in the request body
        });
    
        if (response.status === 200) {
          // Handle success (e.g., update the UI)
          alert(response.data.success);
          fetchCategories();
          // Optionally, update your state to remove deleted rows from the UI
        }
      } catch (error) {
        console.error('Error removing selected rows:', error);
        alert('Failed to delete selected rows');
      }
    };

  return (
    <div className={`p-6 transition duration-300 ${isDarkMode ? 'bg-[#121138] text-white' : 'bg-light text-black'} pt-16`}>
      {!showSettings && (
              <div className="flex justify-end">
                <FontAwesomeIcon
                  icon={faCog}
                  className="w-6 h-6 cursor-pointer text-gray-600 hover:text-gray-900 transition"
                  onClick={() => setShowSettings(true)}
                />
              </div>
            )}
      {showSettings ? (
              <div className="mt-4 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {/* Back Button at Top */}
                <button
                  onClick={() => setShowSettings(false)}
                  className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Back
                </button>
      
                <h2 className="text-xl font-semibold mb-4">Settings</h2>
      
                {/* Dropdown & Buttons in One Row */}
                <div className="flex justify-between items-center mb-4">
                  <select
                    className="border p-2 rounded"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {Object.keys(categories).map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
      
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-md"
                      onClick={() => setShowAddPopup(true)}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add
                    </button>
                    {/* <button
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md ${selectedRows.length !== 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={selectedRows.length !== 1}
                      onClick={() => {
                        setEditData(selectedRows[0]);
                        setShowEditPopup(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button> */}
                    <button
                      className={`px-4 py-2 bg-red-600 text-white rounded-md ${selectedRows.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={selectedRows.length === 0}
                      onClick={handleRemove}
                    >
                      <FontAwesomeIcon icon={faTrash} /> Remove
                    </button>
                  </div>
                </div>
      
                {/* Table with Filtering */}
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                      <tr>
                        <th className="border p-2">Select</th>
                        <th className="border p-2">Department</th>
                        <th className="border p-2">Academic Year</th>
                      </tr>
                    </thead>
                    <tbody>
                    {Object.keys(categories)
      .filter((department) => selectedDepartment === "" || department === selectedDepartment)
      .map((department, index) =>
        categories[department].map((year, subIndex) => (
          <tr key={`${index}-${subIndex}`}>
            <td className="border p-2 text-center">
                        <input
                          type="checkbox"
                          onChange={() => handleRowSelection(department, year)}
            checked={selectedRows.some((row) => row.department === department && row.year === year)}
                        />
                      </td>
            <td className="border p-2">{department}</td>
            <td className="border p-2">{year}</td>
          </tr>
        ))
      )}
                        {/* {Object.keys(categories).map((department, index) => (
      categories[department].map((year, subIndex) => (
        <tr key={`${index}-${subIndex}`}>
          <td className="border p-2">{department}</td>
          <td className="border p-2">{year}</td>
        </tr>
      ))
    ))} */}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                {/* Main Content */}
                <h1 className="text-3xl font-semibold mb-4">Academic Year</h1>
          <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-[#121138]' : 'bg-white'}`}>
            {/* Department Buttons */}
            <div className="flex space-x-3 mb-6">
              {Object.keys(categories).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-lg font-medium text-lg transition shadow-md ${
                    selectedCategory === category
                      ? `${isDarkMode ? 'bg-[#5cc800] text-white' : 'bg-blue-700 text-white'}`
                      : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Academic Years */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories[selectedCategory]?.map((year) => (
                <div
                  key={year}
                  onClick={() => navigate(`/department/${selectedCategory}/${year}/Semester`)} // Navigate on click TO SEMSTER.JSX
                  className={`p-6 rounded-lg shadow-md border-2 border-green-400 transition transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center text-lg font-semibold ${isDarkMode ? 'text-white bg-transparent border-secondary' : 'text-gray-900 bg-transparent'}`}
                >
                  <FontAwesomeIcon icon={faFolder} className="text-orange-600 text-5xl mb-2" />
                  <span>{year}</span>
                </div>
              ))}
            </div>
          </div>
              </>
            )}

{/* {showEditPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Edit Department</h2>
            <input type="text" name="name" value={editData.department} onChange={handleEditChange} className="border p-2 w-full rounded mb-4" />
            <input type="text" name="year" value={editData.year} onChange={handleEditChange} className="border p-2 w-full rounded mb-4" />
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-500 text-white rounded-lg" onClick={() => setShowEditPopup(false)}>Cancel</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg" onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )} */}
      
            {/* Popup Form for Adding a New Department */}
            {showAddPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10">
                <div className="bg-white p-6 rounded-lg w-96">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Add Department</h2>
                    <FontAwesomeIcon
                      icon={faTimes}
                      className="cursor-pointer text-red-600"
                      onClick={() => setShowAddPopup(false)}
                    />
                  </div>
                  {/* <input type="text" placeholder="Department Name" className="border p-2 w-full rounded mb-4" /> */}
                  <select
        value={selectedDepartment}
        onChange={(e) => setSelectedDepartment(e.target.value)}
        className="border p-2 w-full rounded mb-4"
      >
        <option value="">Select Department</option>
        {Object.keys(categories).map((department) => (
          <option key={department} value={department}>
            {department}
          </option>
        ))}
      </select>
                  <input type="text" placeholder="Academic year" className="border p-2 w-full rounded mb-4" onChange={(e) => setAcademicYear(e.target.value)}/>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg w-full" onClick={handleSave}>Save</button>
                </div>
              </div>
            )}
          
        
      
    </div>
  );
};

export default DeptDetail;
