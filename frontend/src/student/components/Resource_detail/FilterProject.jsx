import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faPaperPlane, faTimes } from "@fortawesome/free-solid-svg-icons";

const FilterProjects = () => {
    const [filters, setFilters] = useState({
        year: [],
        domain: [],
        semester: [],
    });

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");

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

    const projects = [
        { id: 1, title: "Bully-Box:Stop Bullying, Report It Fully", year: "Second Year", domain: "Java", semester: "3" },
        { id: 2, title: "HealthMeta:AI-Powered Personalized Health Tracker and Advisor", year: "Second Year", domain: "Python", semester: "4" },
        { id: 3, title: "Project Pro:Smart Project Allocation and Management System", year: "Third Year", domain: "AI-ML", semester: "5" },
        { id: 4, title: "BMI Tracker:Intelligent Health Monitoring System with Identity Verification.", year: "Third Year", domain: "Blockchain", semester: "6" },
        { id: 5, title: "Project Space:A Comprehensive Framework for Automated Project Guide Allocation in Academic Institutions.", year: "Fourth Year", domain: "AI-ML", semester: "7-8" },
    ];

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

    const handleChatToggle = () => setIsChatOpen(!isChatOpen);

    const handleChatSendMessage = () => {
        if (chatInput.trim()) {
            setChatMessages([...chatMessages, { text: chatInput, sender: "user" }]);
            setChatInput("");
            simulateChatBotResponse(chatInput);
        }
    };

    const simulateChatBotResponse = (userMessage) => {
        const botReply = `You said: "${userMessage}"`;
        setTimeout(() => {
            setChatMessages((prev) => [...prev, { text: botReply, sender: "bot" }]);
        }, 1000);
    };

    return (
        <div className="w-full">
            {/* Filters and Projects Section */}
            <div className="p-4 ml-64 w-1200 mt-2 rounded-lg mr-1 dark:bg-gray-700 dark:text-gray-300 bg-white shadow-md relative">
                <h1 className="font-bold text-lg mb-2 text-[#5cc800]">All Projects</h1>
                <div className="flex gap-4">
                    {/* Filter Section */}
                    <div className="w-1/4">
                        <div className="space-y-4">
                            {/* Year Filter */}
                            <div>
                                <h3 className="font-semibold text-[#5cc800]">Year</h3>
                                <div className="flex flex-col space-y-2">
                                    {["Second Year", "Third Year", "Fourth Year"].map((year, index) => (
                                        <label key={index} className="flex items-center space-x-2 text-blue-500 font-semibold">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox"
                                                onChange={() => handleCheckboxChange("year", year)}
                                            />
                                            <span>{year}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Domain Filter */}
                            <div>
                                <h3 className="font-semibold">Domain</h3>
                                <div className="flex flex-col space-y-2">
                                    {["Java", "Python", "AI-ML", "Blockchain"].map((domain, index) => (
                                        <label key={index} className="flex items-center space-x-2 text-blue-500 font-semibold">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox"
                                                onChange={() => handleCheckboxChange("domain", domain)}
                                            />
                                            <span>{domain}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Semester Filter */}
                            <div>
                                <h3 className="font-semibold">Semester</h3>
                                <div className="flex flex-col space-y-2">
                                    {["3", "4", "5", "6", "7-8"].map((semester, index) => (
                                        <label key={index} className="flex items-center space-x-2 text-blue-500 font-semibold">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox"
                                                onChange={() => handleCheckboxChange("semester", semester)}
                                            />
                                            <span>Semester {semester}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider Line */}
                    <div className="border-2 border-green-500 mx-4"></div>

                    {/* Projects Section */}
                    <div className="w-3/4">
                        <h2 className="text-lg font-bold mb-4 text-[#5cc800]">Projects</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Render Projects */}
                            {filteredProjects.map((project) => (
                                <div key={project.id} className="p-4 border border-green-500 rounded shadow">
                                    <h3 className="font-semibold text-[#fba02a]">{project.title}</h3>
                                    <p className="text-blue-500 font-semibold">Year: {project.year}</p>
                                    <p className="text-blue-500 font-semibold">Domain: {project.domain}</p>
                                    <p className="text-blue-500 font-semibold">Semester: {project.semester}</p>
                                </div>
                            ))}
                        </div>
                        {filteredProjects.length === 0 && (
                            <p className="text-gray-500 font-medium dark:text-gray-300 mt-4">Projects are not their.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Gray Section for Chatbot */}
            <div className="ml-64 w-1200  mt-7 dark:text-gray-300">
                <div className="relative group flex justify-end">
                    <button
                        onClick={handleChatToggle}
                        className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center hover:scale-95"
                    >
                        <FontAwesomeIcon icon={faComments} />
                    </button>

                    {/* Chatbot Popup */}
                    {isChatOpen && (
                        <div className="w-60 border border-gray-300 shadow-lg rounded-lg overflow-hidden absolute bottom-full mb-2 right-0">
                            <div className="p-4 bg-blue-500 text-white font-bold flex justify-between items-center">
                                <span>Chatbot</span>
                                <button onClick={handleChatToggle}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <div className="p-4 h-50 overflow-y-auto bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                {chatMessages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`mb-2 p-2 rounded ${msg.sender === "user" ? "bg-blue-100 text-right" : "bg-[#d7e9f2] text-left"}`}
                                    >
                                        {msg.text}
                                    </div>
                                ))}
                            </div>
                            <div className="p-2 border-t flex">
                                <input
                                    type="text"
                                    className="flex-1 p-2 border rounded-l focus:outline-none"
                                    placeholder="Type a message..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                />
                                <button
                                    onClick={handleChatSendMessage}
                                    className="bg-blue-500 text-white p-2 rounded-r flex items-center justify-center"
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterProjects;
