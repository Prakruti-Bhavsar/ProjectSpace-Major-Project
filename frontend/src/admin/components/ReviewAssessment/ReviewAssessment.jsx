import React, { useState } from 'react';
import YearBox from '../../components/YearBox/YearBox';
import AddYearForm from '../../components/AddYearForm/AddYearForm';
import { FaPlus } from 'react-icons/fa';  // Import Plus Icon

const ReviewAssessment = ({ isDarkMode }) => {
  const [isAddFormOpen, setAddFormOpen] = useState(false);

  const toggleAddForm = () => {
    setAddFormOpen(!isAddFormOpen);
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-[#121138] text-white' : 'bg-white text-[#121138]'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#121138]'}`}>
          Review Assessment
        </h2>
        <button
          onClick={toggleAddForm}
          className={`py-2 px-4 rounded-lg flex items-center transition-colors duration-300 ${
            isDarkMode ? 'bg-[#5cc800] hover:bg-[#4b9c00] text-white' : 'bg-[#006d2c] hover:bg-[#005b26] text-white'
          }`}
        >
          <FaPlus className="mr-2" />
          Add Year
        </button>
      </div>

      {isAddFormOpen && <AddYearForm onClose={toggleAddForm} />}

      <div className="space-y-4">
        <YearBox year="23-24" />
        <YearBox year="24-25" />
        <YearBox year="25-26" />
      </div>
    </div>
  );
};

export default ReviewAssessment;
