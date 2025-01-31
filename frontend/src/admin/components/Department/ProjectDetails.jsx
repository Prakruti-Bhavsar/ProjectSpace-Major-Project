import { useState } from "react";
import { FaFilter, FaDownload, FaPlus, FaUpload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ProjectDetailView from "./ProjectDetailView"; // Import ProjectDetailView

const ProjectDetails = ({ selectedCategory, selectedYear, selectedSemester, onBack, isDarkMode, onDeptBack }) => {
  const [activeTab, setActiveTab] = useState("Projects");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  const handleDeptBack = () => {
    onDeptBack();
    navigate("/department");
  };

  return (
    <div className={`p-6 transition duration-300 ${isDarkMode ? "bg-[#121138] text-white" : "bg-white text-black"}`} style={{ maxHeight: "100vh", overflowY: "auto" }}>
      {/* Breadcrumb Navigation */}
      <p className="text-2xl mb-4 font-medium">
        <span className="text-red-500 cursor-pointer hover:underline" onClick={handleDeptBack}>{selectedCategory}</span> &gt;
        <span className="text-red-500 cursor-pointer hover:underline" onClick={onBack}>{selectedYear}</span> &gt;
        <span className="text-blue-500">{selectedSemester}</span>
      </p>

      {/* Show ProjectDetailView if a project is selected */}
      {selectedProject ? (
        <ProjectDetailView
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          isDarkMode={isDarkMode}
          selectedCategory={selectedCategory}
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b mb-4">
            {["Projects", "Operations"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-lg font-medium transition border-b-4 ${
                  activeTab === tab
                    ? `${isDarkMode ? "border-green-400 text-green-300" : "border-blue-700 text-blue-700"}`
                    : `${isDarkMode ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-500"}`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-[#2a2a40] text-white" : "bg-white text-black"}`}>
            {activeTab === "Projects" ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-3xl font-semibold">Projects</h2>
                  <FaFilter className={`cursor-pointer transition ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-black"}`} size={22} title="Filter Projects" />
                </div>

                {/* Division A and B Projects Table */}
                {["A", "B"].map((division) => (
                  <div key={division} className="mb-6">
                    <h2 className="text-xl font-semibold">Division {division} Projects</h2>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className={`${isDarkMode ? (division === "A" ? "bg-green-600" : "bg-blue-600") : (division === "A" ? "bg-green-600" : "bg-blue-600")} text-white`}>
                          <th className="p-3 border border-gray-300">Group No.</th>
                          <th className="p-3 border border-gray-300">Name</th>
                          <th className="p-3 border border-gray-300">Leader</th>
                          <th className="p-3 border border-gray-300">Guide</th>
                          <th className="p-3 border border-gray-300">Co-Guide</th>
                          <th className="p-3 border border-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4].map((num) => (
                          <tr key={num} className={`${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}`}>
                            <td className="p-3 border border-gray-300">{num}</td>
                            <td className="p-3 border border-gray-300 underline cursor-pointer hover:text-blue-500 transition" 
                                onClick={() => setSelectedProject({
                                  name: `Project ${division}-${num}`,
                                  leader: `Leader ${num}`,
                                  guide: `Dr. Guide ${num}`,
                                  coGuide: `Prof. Co-Guide ${num}`,
                                  status: num % 2 === 0 ? "Completed" : "Ongoing"
                                })}>
                              Project {division}-{num}
                            </td>
                            <td className="p-3 border border-gray-300">Leader {num}</td>
                            <td className="p-3 border border-gray-300">Dr. Guide {num}</td>
                            <td className="p-3 border border-gray-300">Prof. Co-Guide {num}</td>
                            <td className="p-3 border border-gray-300">{num % 2 === 0 ? "Completed" : "Ongoing"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            ) : (
              <div className="space-y-6 mt-8">
                {["Students", "Teachers", "Weekly Task"].map((section, index) => (
                  <div key={index} className={`p-6 border-l-4 rounded-lg shadow-md hover:shadow-xl transition-all ${section === "Students" ? "border-green-500" : section === "Teachers" ? "border-blue-500" : "border-yellow-500"}`}>
                    <h3 className="font-semibold text-xl">{section}</h3>
                    <div className="flex justify-between mt-4">
                      <button className="bg-green-500 text-white py-2 px-2 w-20 rounded-lg">
                        <FaPlus /> Add
                      </button>
                      {section !== "Weekly Task" && (
                        <>
                          <button className="bg-blue-500 text-white py-2 px-4 rounded-lg">
                            <FaUpload /> Upload
                          </button>
                          <button className="bg-gray-500 text-white py-2 px-4 rounded-lg flex items-center gap-2 group">
                            <FaDownload />
                            <span className="hidden group-hover:inline">Download</span>
                          </button>
                          <input type="file" id={`file-input-${section}`} className="hidden" accept=".xls,.xlsx" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectDetails;
