import { useState } from "react";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";

const Profile = () => {
  const [openSections, setOpenSections] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [tags, setTags] = useState([]);

  const sections = ["General", "User picture", "Interests", "Optional"];

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleAll = () => {
    const newState = !allExpanded;
    const updatedSections = sections.reduce((acc, _, index) => {
      acc[index] = newState;
      return acc;
    }, {});
    setOpenSections(updatedSections);
    setAllExpanded(newState);
  };

  const addTag = (event) => {
    if (event.key === "Enter" && event.target.value.trim() !== "") {
      setTags((prevTags) => [...prevTags, event.target.value.trim()]);
      event.target.value = "";
    }
  };

  const removeTag = (tagToRemove) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="mt-2 p-6 bg-white shadow-lg rounded-lg w-1200 ml-64  dark:bg-gray-700 dark:text-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">PAYAL GUPTA</h2>
        <button className="bg-[#5cc800] text-white font-semibold hover:border-green-500 px-4 py-2 rounded" onClick={toggleAll}>
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>
      <div>
        {sections.map((section, index) => (
          <div key={index} className="border-b py-2">
            <button
              className="flex justify-between items-center w-full text-lg font-semibold"
              onClick={() => toggleSection(index)}
            >
              {section}
              {openSections[index] ? (
                <FaChevronDown className="text-gray-600 dark:text-gray-200" />
              ) : (
                <FaChevronRight className="text-gray-600 dark:text-gray-200" />
              )}
            </button>
            {openSections[index] && (
              <div className="p-3 bg-gray-100 rounded-md mt-2 text-gray-700  dark:bg-gray-700 dark:text-gray-200">
                {section === "General" ? (
                  <div className="space-y-4">
                    {[
                      { label: "First Name", type: "text", placeholder: "Enter first name" },
                      { label: "Last Name", type: "text", placeholder: "Enter last name" },
                      { label: "Email Address", type: "email", value: "payalgupta264@apsit.edu.com" },
                      { label: "City", type: "text", value: "Thane" },
                      {
                        label: "Country",
                        type: "select",
                        options: ["India", "US", "UK", "Canada"],
                      },
                      {
                        label: "Time Zone",
                        type: "select",
                        options: ["Asia/Kolkata", "EST", "PST", "IST"],
                      },
                      { label: "Description", type: "textarea", placeholder: "Enter description" },
                    ].map(({ label, type, ...props }, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="w-40">{label}</span>
                        {type === "textarea" ? (
                          <textarea className="flex-1 p-2 border rounded" {...props}></textarea>
                        ) : type === "select" ? (
                          <select className="flex-1 p-2 border rounded">
                            {props.options.map((option, i) => (
                              <option key={i}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input className="flex-1 p-2 border rounded" type={type} {...props} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : section === "User picture" ? (
                  <div>
                    <div className="flex items-center gap-4">
                      <span className="w-40">Current Picture</span>
                      <span className="italic">None</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="w-40">New Picture</span>
                      <div className="border-dashed border-2 border-gray-300 p-4 rounded-md flex flex-col items-center flex-1">
                        <span className="text-gray-500">Drag and drop files here to add them.</span>
                        <input type="file" accept="image/*" className="mt-2 text-sm" />
                      </div>
                    </div>
                  </div>
                ) : section === "Interests" ? (
                  <div className="flex items-center gap-4">
                    <span className="w-40">List of Interests</span>
                    <div className="flex-1 border p-2 rounded flex flex-wrap gap-2">
                      {tags.map((tag, i) => (
                        <div key={i} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center">
                          {tag}
                          <button className="ml-2 text-sm text-white" onClick={() => removeTag(tag)}>
                            &times;
                          </button>
                        </div>
                      ))}
                      <input
                        type="text"
                        placeholder="Enter tags..."
                        className="border-none outline-none"
                        onKeyDown={addTag}
                      />
                    </div>
                  </div>
                ) : section === "Optional" ? (
                  <div>
                    {[
                      { label: "ID Number", type: "text", placeholder: "Enter ID number" },
                      { label: "Institution", type: "text", value: "APSIT Thane" },
                      { label: "Department", type: "text", placeholder: "Enter department" },
                      { label: "Phone", type: "text", placeholder: "Enter phone number" },
                      { label: "Mobile Phone", type: "text", placeholder: "Enter mobile phone number" },
                      { label: "Address", type: "textarea", placeholder: "Enter address" },
                    ].map(({ label, type, ...props }, i) => (
                      <div key={i} className="flex items-center gap-4 mt-2">
                        <span className="w-40">{label}</span>
                        {type === "textarea" ? (
                          <textarea className="flex-1 p-2 border rounded" {...props}></textarea>
                        ) : (
                          <input className="flex-1 p-2 border rounded text-black" type={type} {...props} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Update profile</button>
        <button className="bg-[#5cc800] text-white px-4 py-2 rounded">Cancel</button>
      </div>
    </div>
  );
};

export default Profile;
