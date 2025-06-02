import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faPaperPlane, faTimes } from "@fortawesome/free-solid-svg-icons";
import AxiosInstance from "../../../AxiosInstance";
const FilterProjects = ({ isSidebarOpen, isMobile }) => {
    const [filters, setFilters] = useState({
        year: [],
        domain: [],
        semester: [],
    });
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await AxiosInstance.get("/projects/"); // Adjust the URL if needed
                const fetchedProjects = response.data.map(project => ({
                    id: project.id,
                    title: project.final_topic,
                    year: project.year,
                    domain: project.domain,
                    semester: project.sem,
                    leader_name: project.leader_name,
                    members: project.members,
                    project_guide_name: project.project_guide_name,
                    project_co_guide_name: project.project_co_guide_name,
                    abstract: project.final_abstract,
                }));
                setProjects(fetchedProjects);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching projects:", error);
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const [selectedProject, setSelectedProject] = useState(null);

    const handleCheckboxChange = (category, value) => {
        setFilters((prev) => {
            const isSelected = prev[category].includes(value);
            return {
                ...prev,
                [category]: isSelected
                    ? prev[category].filter((item) => item !== value)
                    : [...prev[category], value],
            };
        });
    };

    const uniqueYears = Array.from(new Set(projects.map(p => p.year))).filter(Boolean);
    const uniqueDomains = Array.from(new Set(projects.map(p => p.domain))).filter(Boolean);
    const uniqueSemesters = Array.from(new Set(projects.map(p => p.semester))).filter(Boolean);


    const filteredProjects = projects.filter((project) => {
        const yearMatch = filters.year.length
            ? filters.year.includes(project.year)
            : true;
        const domainMatch = filters.domain.length
            ? filters.domain.includes(project.domain)
            : true;

        const semesterMatch =
            filters.semester.includes("7") || filters.semester.includes("8")
                ? ["7", "8"].includes(project.semester)
                : filters.semester.length
                    ? filters.semester.includes(project.semester)
                    : true;

        return yearMatch && domainMatch && semesterMatch;
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const toggleFilters = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    return (
        <div className="w-full">
            {/* Filters and Projects Section */}
            <div className={`p-4 bg-white dark:bg-gray-700 dark:text-gray-300 shadow-md rounded-lg relative
        transition-all duration-300
        ${!isMobile ? 'md:ml-64' : isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <h1 className="font-bold text-lg mb-2 text-[#5cc800]">All Projects</h1>
                {isMobile && (
                    <button
                        onClick={toggleFilters}
                        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded-md w-full"
                    >
                        {isFilterOpen ? "Hide Filters" : "Show Filters"}
                    </button>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Filter Section */}
                    <div className={`${isMobile && !isFilterOpen ? 'hidden' : 'block'} w-full md:w-1/4`}>
                        <div className="space-y-4">
                            {/* Year Filter */}
                            <div>
                                <h3 className="font-semibold text-[#5cc800]">Year</h3>
                                <div className="flex flex-col space-y-2">
                                {uniqueYears.map((year, idx) => (
                                        <label key={idx} className="flex items-center text-sm font-medium text-blue-700">
                                            <input
                                                type="checkbox"
                                                className="mr-2 accent-green-600"
                                                onChange={() => handleCheckboxChange("year", year)}
                                                checked={filters.year.includes(year)}
                                            />
                                            {year}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Domain Filter */}
                            <div>
                                <h3 className="font-semibold">Domain</h3>
                                <div className="flex flex-col space-y-2">
                                {uniqueDomains.map((domain, idx) => (
                                        <label key={idx} className="flex items-center text-sm font-medium text-blue-700">
                                            <input
                                                type="checkbox"
                                                className="mr-2 accent-green-600"
                                                onChange={() => handleCheckboxChange("domain", domain)}
                                                checked={filters.domain.includes(domain)}
                                            />
                                            {domain}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Semester Filter */}
                            <div>
                                <h3 className="font-semibold">Semester</h3>
                                <div className="flex flex-col space-y-2">
                                {uniqueSemesters.map((semester, idx) => (
                                        <label key={idx} className="flex items-center text-sm font-medium text-blue-700">
                                            <input
                                                type="checkbox"
                                                className="mr-2 accent-green-600"
                                                onChange={() => handleCheckboxChange("semester", semester)}
                                                checked={filters.semester.includes(semester)}
                                            />
                                            {semester === "Major Project" ? semester : `Semester ${semester}`}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider Line */}
                    <div className="border-2 border-green-500 mx-4"></div>

                    {/* Projects Section */}
                    <div className="w-full md:w-3/4">
                        <h2 className="text-lg font-bold mb-4 text-[#5cc800]">Projects</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Render Projects */}
                            {filteredProjects.map((project) => (
                                <div key={project.id} className="p-4 bg-[#fffcfc] dark:bg-gray-700 rounded border border-green-500 shadow cursor-pointer hover:shadow-lg transition" onClick={() => setSelectedProject(project)}>
                                    <h3 className="font-semibold text-[#fba02a] mb-2">{project.title}</h3>
                                    <p className="text-sm text-blue-700">Year: {project.year}</p>
                                    <p className="text-sm text-blue-700">Domain: {project.domain}</p>
                                    <p className="text-sm text-blue-700">Semester: {project.semester}</p>
                                </div>
                            ))}
                        </div>
                        {filteredProjects.length === 0 && (
                            <p className="text-gray-500 font-medium dark:text-gray-300 mt-4">No projects found for selected filters.</p>
                        )}
                        {selectedProject && (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[90%] max-w-xl relative shadow-lg overflow-y-auto max-h-[80vh]">
            <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold"
            >
                &times;
            </button>

            <h2 className="text-2xl font-bold mb-4 text-green-600">{selectedProject.title}</h2>
            <p className="text-md text-gray-700 mb-2"><strong>Year:</strong> {selectedProject.year}</p>
            <p className="text-md text-gray-700 mb-2"><strong>Semester:</strong> {selectedProject.semester}</p>
            <p className="text-md text-gray-700 mb-2"><strong>Domain:</strong> {selectedProject.domain}</p>
            <p className="text-md text-gray-700 mb-4"><strong>Abstract:</strong><br /> {selectedProject.abstract}</p>

            <div className="text-md text-gray-700">
                <p><strong>Guide:</strong> {selectedProject.project_guide_name}</p>
                <p><strong>Co-Guide:</strong> {selectedProject.project_co_guide_name || 'N/A'}</p>
                <p className="mt-2"><strong>Team Members:</strong></p>
                <ul className="list-disc list-inside">
                    <li>{selectedProject.leader_name}</li>
                    {selectedProject.members.map((member, idx) => (
                        <li key={idx}>{member}</li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
)}
                    </div>
                </div>
            </div>

           
            </div>
    );
};

export default FilterProjects;
