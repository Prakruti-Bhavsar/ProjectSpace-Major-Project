import React, { useState, useEffect } from 'react';
import YearBox from '../../components/YearBox/YearBox';
import AddYearForm from '../../components/AddYearForm/AddYearForm';
import { FaPlus } from 'react-icons/fa';  // Import Plus Icon
import AxiosInstance from '../../../AxiosInstance';

const ReviewAssessment = ({ isDarkMode }) => {
  const [isAddFormOpen, setAddFormOpen] = useState(false);
  const [years, setYears] = useState([]);
  const toggleAddForm = () => {
    setAddFormOpen(!isAddFormOpen);
  };
  const [categories, setCategories] = useState({}); // departments with their years
  const [selectedDepartment, setSelectedDepartment] = useState("");
 
  const fetchCategories = async () => {
    try {
      const response = await AxiosInstance.get("/years/by-department/");
      setCategories(response.data);
      const firstDepartment = Object.keys(response.data)[0];
      if (firstDepartment) {
        setSelectedDepartment(firstDepartment);
      }
    } catch (error) {
      console.error("Error fetching departments and years:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    AxiosInstance.get('/years/by-department/')
      .then(res => setYears(res.data))
      .catch(err => console.error('Failed to fetch years:', err));
  }, []);

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-[#121138] text-white' : 'bg-[#f9f9f9] text-[#121138]'} pt-16`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Review Assessment</h2>
      </div>

      {/* {isAddFormOpen && <AddYearForm onClose={toggleAddForm} />}
       <div className="space-y-4">
        {years.map((year) => (
          <YearBox key={year.id} id={year.id} year={year.year} />
        ))}
      </div> */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(categories).map((department) => (
          <button
            key={department}
            onClick={() => setSelectedDepartment(department)}
            className={`px-4 py-2 rounded-md border ${selectedDepartment === department ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}`}
          >
            {department}
          </button>
        ))}
      </div>

      {/* Add Year Form Button */}
      {/* {isAddFormOpen && <AddYearForm onClose={toggleAddForm} />} */}
      
      {/* Years List for selected department */}
      <div className="space-y-4">
        {categories[selectedDepartment]?.map((year) => (
          <YearBox key={year.id} id={year.id} year={year.year} />
        ))}
      </div>
    </div>
  );
};

export default ReviewAssessment;
