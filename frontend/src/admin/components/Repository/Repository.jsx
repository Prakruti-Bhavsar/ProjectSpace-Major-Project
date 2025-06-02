import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faPaperPlane, faTimes } from "@fortawesome/free-solid-svg-icons";
import AxiosInstance from "../../../AxiosInstance";

const FilterProjects = () => {
    const [filters, setFilters] = useState({ year: [], domain: [], semester: [] });
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

    // const projects = [
    //     { id: 1, title: "Bully-Box: Stop Bullying, Report It Fully", year: "Second Year", domain: "Java", semester: "3" },
    //     { id: 2, title: "HealthMeta: AI-Powered Personalized Health Tracker and Advisor", year: "Second Year", domain: "Python", semester: "4" },
    //     { id: 3, title: "Project Pro: Smart Project Allocation and Management System", year: "Third Year", domain: "AI-ML", semester: "5" },
    //     { id: 4, title: "BMI Tracker: Intelligent Health Monitoring System with Identity Verification", year: "Third Year", domain: "Blockchain", semester: "6" },
    //     { id: 5, title: "Project Space: Framework for Automated Project Guide Allocation", year: "Fourth Year", domain: "AI-ML", semester: "7-8" },
    // ];

    const filteredProjects = projects.filter((project) => {
        const yearMatch = filters.year.length ? filters.year.includes(project.year) : true;
        const domainMatch = filters.domain.length ? filters.domain.includes(project.domain) : true;
        const semesterMatch =
            filters.semester.includes("7") || filters.semester.includes("8")
                ? ["7", "8"].includes(project.semester)
                : filters.semester.length
                    ? filters.semester.includes(project.semester)
                    : true;

        return yearMatch && domainMatch && semesterMatch;
    });


    return (
        <div className={`p-6 transition duration-300 bg-white text-black pt-16`} style={{overflowY: "auto" }}>
            {/* <div className="w-full max-w-[1200px] border-2 border-[#5cc800] rounded-lg shadow-md dark:bg-gray-800 bg-white p-6 relative"> */}
                <h1 className="text-2xl font-bold text-[#181818] mb-6">All Projects</h1>
                <div className="flex flex-wrap md:flex-nowrap gap-6">
                    {/* Filters */}
                    <div className="md:w-1/5 w-full">
                        <div className="space-y-6">
                            {/* Year */}
                            <div>
                                <h3 className="text-[#181818] font-semibold mb-2">Year</h3>
                                <div className="flex flex-col gap-2">
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

                            {/* Domain */}
                            <div>
                                <h3 className="text-[#181818] font-semibold mb-2">Domain</h3>
                                <div className="flex flex-col gap-2">
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

                            {/* Semester */}
                            <div>
                                <h3 className="text-[#181818] font-semibold mb-2">Semester</h3>
                                <div className="flex flex-col gap-2">
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

                    {/* Divider */}
                    <div className="w-[2px] bg-green-500 hidden md:block" />

                    {/* Projects */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-[#181818] mb-4">Projects</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
            {/* </div> */}
        </div>
        // <div className="flex justify-center items-start px-4 pt-16 w-full">
        //     <div className="w-full max-w-[1200px] border-2 border-[#5cc800] rounded-lg shadow-md dark:bg-gray-800 bg-white p-6 relative">
        //         <h1 className="text-2xl font-bold text-[#181818] mb-6">All Projects</h1>
        //         {loading ? (
        //             <p>Loading projects...</p>
        //         ) : (
        //             <div className="flex flex-wrap md:flex-nowrap gap-6">
        //                 {/* Your filter UI remains same */}
        //                 {/* Your project cards remain same */}
        //                 {/* (You already wrote it nicely) */}
        //             </div>
        //         )}
        //     </div>
        // </div>
    );
};

export default FilterProjects;
