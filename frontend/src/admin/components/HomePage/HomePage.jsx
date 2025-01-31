import React, { useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

const getProjects = (section) => {
  if (section === "SE") {
    return {
      A: 3,
      B: 5,
    };
  }
  if (section === "TE") {
    return {
      A: 2,
      B: 4,
    };
  }
  if (section === "BE") {
    return {
      A: 1,
      B: 3,
    };
  }
  return {};
};

const HomePage = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState("24-25");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const handleTabClick = (tab) => setActiveTab(tab);
  const handlePieChartClick = (section) => setSelectedSection(section);

  const tabs = ["24-25", "23-24", "22-23", "Previous"];

  const getPieChartData = (section) => {
    const projects = getProjects(section);
    return {
      labels: Object.keys(projects).map((division) => `${section}-${division}`),
      datasets: [
        {
          data: Object.values(projects),
          backgroundColor: ["#FF9500", "#2196F3", "#FFC107", "#FF5722"],
          borderColor: "#000",
          borderWidth: 1,
        },
      ],
    };
  };

  const getTableData = (section, division) => {
    return Array.from(
      { length: getProjects(section)[division] },
      (_, index) => ({
        projectName: `Project ${section} - ${division} - ${index + 1}`,
        leader: `Leader ${index + 1}`,
        status: Math.random() > 0.5 ? "Completed" : "Pending",
        logbook: (
          <div className="flex items-center gap-2">
            <span className="text-green-600">✔️</span>
            <span className="text-red-500">❌</span>
          </div>
        ),
      })
    );
  };

  const handleYearClick = (year) => {
    setSelectedYear(year);
    setSelectedSection("");
  };

  return (
    <div
      className={`p-6 space-y-6 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Title */}
      <h1 className="text-3xl font-extrabold tracking-tight">Home</h1>

      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-gray-300">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`py-2 px-6 font-semibold text-lg transition-all duration-300 ${
              activeTab === tab
                ? "border-b-4 border-blue-500 text-blue-500 transform scale-105"
                : "text-gray-500 hover:text-blue-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Section */}
      <div className="flex flex-col items-center mt-6">
        <div className="w-full max-h-[500px] overflow-y-auto">
          {activeTab !== "Previous" && (
            <>
              {/* Pie Charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-6">
                {"SE TE BE".split(" ").map((section) => (
                  <div
                    key={section}
                    onClick={() => handlePieChartClick(section)}
                    className="relative w-60 h-60 mx-auto flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow duration-300 bg-transparent rounded-lg transform hover:scale-105"
                  >
                    <Pie
                      data={getPieChartData(section)}
                      options={{
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const label = context.label || "";
                                const value = context.raw || 0;
                                return `${label}: ${value} Projects`;
                              },
                            },
                          },
                        },
                        cutout: "50%",
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                    <div
                      className={`absolute inset-0 flex flex-col items-center justify-center font-bold text-lg pointer-events-none ${
                        selectedSection === section
                          ? "text-blue-700"
                          : "text-gray-500"
                      }`}
                    >
                      {section}
                      <span className="text-sm">
                        Total Projects:{" "}
                        {Object.values(getProjects(section)).reduce(
                          (a, b) => a + b,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Division Details */}
              {selectedSection && (
                <div className="mt-10 w-full">
                  {"A B".split(" ").map((division) => (
                    <div key={division} className="mt-6">
                      <h2 className="text-2xl font-bold mb-4">
                        {selectedSection} - {division} Details
                      </h2>
                      <table className="w-full border-collapse bg-transparent rounded-lg shadow-md">
                        <thead>
                          <tr className="bg-green-600 text-gray-200">
                            <th className="p-4 text-left">Project Name</th>
                            <th className="p-4 text-left">Leader</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left">Logbook</th>
                            <th className="p-4 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getTableData(selectedSection, division).map(
                            (data, index) => (
                              <tr
                                key={index}
                                className={`border-t ${
                                  index % 2 === 0
                                    ? isDarkMode
                                      ? "bg-gray-800 text-gray-200"
                                      : "bg-gray-100 text-gray-800"
                                    : isDarkMode
                                    ? "bg-gray-700 text-gray-200"
                                    : "bg-gray-50 text-gray-800"
                                }`}
                              >
                                <td className="p-4">{data.projectName}</td>
                                <td className="p-4">{data.leader}</td>
                                <td className="p-4">{data.status}</td>
                                <td className="p-4">{data.logbook}</td>
                                <td className="p-4">
                                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300">
                                    View
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Previous Tab Content */}
          {activeTab === "Previous" && (
  <div className="w-full mt-6">
    {!selectedYear ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[400px]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg shadow-md flex items-center justify-center text-2xl font-bold border transition-transform duration-300 ${
              isDarkMode
                ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600 hover:border-blue-500"
                : "bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200 hover:border-blue-500"
            } hover:scale-105 cursor-pointer`}
            onClick={() => handleYearClick(`20${15 + index}-${16 + index}`)}
          >
            Academic Year 20{15 + index}-20{16 + index}
          </div>
        ))}
      </div>
    ) : !selectedSection ? (
      <div className="w-full">
        {/* Back Button */}
        <button
          className="px-4 py-2 mb-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
          onClick={() => setSelectedYear("")}
        >
          Back to Academic Years
        </button>
        {/* Display Selected Year */}
        <h2 className="text-2xl font-bold mb-6">
          Selected Year: {selectedYear}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {"SE TE BE".split(" ").map((section) => (
            <div
              key={section}
              onClick={() => handlePieChartClick(section)}
              className="relative w-60 h-60 mx-auto flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow duration-300 bg-transparent rounded-lg transform hover:scale-105"
            >
              <Pie
                data={getPieChartData(section)}
                options={{
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || "";
                          const value = context.raw || 0;
                          return `${label}: ${value} Projects`;
                        },
                      },
                    },
                  },
                  cutout: "50%",
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center font-bold text-lg pointer-events-none ${
                  selectedSection === section
                    ? "text-blue-700"
                    : "text-gray-500"
                }`}
              >
                {section}
                <span className="text-sm">
                  Total Projects:{" "}
                  {Object.values(getProjects(section)).reduce(
                    (a, b) => a + b,
                    0
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="w-full">
        {/* Back Button */}
        <button
          className="px-4 py-2 mb-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
          onClick={() => setSelectedSection("")}
        >
          Back to Pie Charts
        </button>
        {/* Display Table */}
        {"A B".split(" ").map((division) => (
          <div key={division} className="mt-6">
            <h2 className="text-2xl font-bold mb-4">
              {selectedSection} - {division} Details
            </h2>
            <table className="w-full border-collapse bg-transparent rounded-lg shadow-md">
              <thead>
                <tr className="bg-green-600 text-gray-200">
                  <th className="p-4 text-left">Project Name</th>
                  <th className="p-4 text-left">Leader</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Logbook</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getTableData(selectedSection, division).map((data, index) => (
                  <tr
                    key={index}
                    className={`border-t ${
                      index % 2 === 0
                        ? isDarkMode
                          ? "bg-gray-800 text-gray-200"
                          : "bg-gray-100 text-gray-800"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-200"
                        : "bg-gray-50 text-gray-800"
                    }`}
                  >
                    <td className="p-4">{data.projectName}</td>
                    <td className="p-4">{data.leader}</td>
                    <td className="p-4">{data.status}</td>
                    <td className="p-4">{data.logbook}</td>
                    <td className="p-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    )}
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default HomePage;
