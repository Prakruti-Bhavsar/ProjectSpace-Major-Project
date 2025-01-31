import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import Semesters from "../Department/Semester"; // Import Semesters component

const DeptDetail = ({ isDarkMode }) => {
  const [selectedCategory, setSelectedCategory] = useState("IT");
  const [selectedYear, setSelectedYear] = useState(null);

  const categories = {
    IT: ["2025-2024", "2024-2023", "2023-2022", "2022-2021", "2021-2020", "2020-2019"],
    CS: ["2025-2024", "2024-2023", "2023-2022", "2022-2021", "2021-2020"],
    DS: ["2025-2024", "2024-2023", "2023-2022", "2022-2021"],
    AIML: ["2025-2024", "2024-2023", "2023-2022", "2022-2021", "2021-2020"],
  };

  return (
    <div className={`p-6 transition duration-300 ${isDarkMode ? 'bg-[#121138] text-white' : 'bg-light text-black'}`}>
      {selectedYear ? (
        <Semesters 
          selectedYear={selectedYear} 
          selectedCategory={selectedCategory} // Pass selectedCategory to Semesters.jsx
          onBack={() => setSelectedYear(null)} 
          isDarkMode={isDarkMode} 
        />
      ) : (
        <>
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
              {categories[selectedCategory].map((year) => (
                <div
                  key={year}
                  onClick={() => setSelectedYear(year)} // Set selected year
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
    </div>
  );
};

export default DeptDetail;
