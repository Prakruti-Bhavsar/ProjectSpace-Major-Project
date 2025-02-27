import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import ProjectDetails from "../Department/ProjectDetails"; // Import ProjectDetails

const Semesters = ({ selectedYear, selectedCategory, onBack, isDarkMode }) => {
  const [selectedSemester, setSelectedSemester] = useState(null);

  const categories = {
    IT: ["SEM-III", "SEM-IV", "SEM-V", "SEM-VI", "MAJOR PROJECT"],
    CS: ["SEM-III", "SEM-IV", "SEM-V", "SEM-VI", "MAJOR PROJECT"],
    DS: ["SEM-III", "SEM-IV", "SEM-V", "SEM-VI", "MAJOR PROJECT"],
    AIML: ["SEM-III", "SEM-IV", "SEM-V", "SEM-VI", "MAJOR PROJECT"],
  };

  return selectedSemester ? (
    <ProjectDetails
      selectedCategory={selectedCategory}
      selectedYear={selectedYear}
      selectedSemester={selectedSemester}
      onBack={() => setSelectedSemester(null)} // Back to Semesters
      isDarkMode={isDarkMode}
    />
  ) : (
    <div className={`p-6 transition duration-300 ${isDarkMode ? 'bg-[#121138] text-white' : 'bg-light text-black'}`}>
      <button
        onClick={onBack}
        className={`relative mb-4 ml-[-28px] mt-[-10px] text-lg font-medium underline transition hover:text-blue-600 ${
          isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-blue-500 hover:text-blue-700'
        }`}
      >
        ← Back to Academic Years
      </button>

      <h2 className="relative ml-[-28px] text-3xl font-semibold mb-4">Academic Year: {selectedYear}</h2>

      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-[#121138]' : 'bg-white'}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories[selectedCategory].map((semester) => (
            <div
              key={semester}
              onClick={() => setSelectedSemester(semester)}
              className={`p-6 rounded-lg shadow-md border-2 border-green-400 transition transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center text-lg font-semibold ${
                isDarkMode ? 'text-white bg-transparent border-secondary' : 'text-gray-900 bg-transparent'
              }`}
            >
              <FontAwesomeIcon icon={faFolder} className="text-orange-600 text-5xl mb-2" />
              <span>{semester}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Semesters;
