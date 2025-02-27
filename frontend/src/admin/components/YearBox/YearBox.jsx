import React, { useState } from "react";
import { FaAngleRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../../AxiosInstance";
const YearBox = ({ year, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [events, setEvents] = useState(["Poster Presentation"]); // Default content
  const navigate = useNavigate();

  // Toggle year box content visibility
  const toggleYearContent = () => setIsOpen(!isOpen);

  // Navigate to the content detail page
  const handleContentClick = (eventName) => {
    navigate(`/assessment/${year}/${eventName}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const eventName = formData.get("eventName");
    const noOfPanels = formData.get("noOfPanels");
    const teachers = formData.get("teachers");
    const noOfTeachers = formData.get("noOfTeachers");

    setEvents([...events, eventName]);

    try {
      AxiosInstance.post(`clustering/cluster_and_allocate/`, {
        eventName,
        noOfPanels,
        teachers,
        noOfTeachers,
      })
        .then((response) => {
          const { event_id } = eventName;
          console.log(response.data);
          navigate(`/assessment/${year}/${event_id}`, { state: response.data });
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  return (
    <div
      className={`flex flex-col mb-6 border rounded-lg shadow-md overflow-hidden ${
        isDarkMode ? "bg-[#272827] border-[#444444]" : "bg-white border-[#E0E0E0]"
      }`}
    >
      {/* Year Box Header */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer ${
          isDarkMode ? "text-white" : "text-[#121138]"
        } hover:bg-opacity-80 transition-all`}
        onClick={toggleYearContent}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-6 h-6 flex items-center justify-center border-2 rounded-full transition-all ${
              isDarkMode ? "border-[#5CC800] bg-[#272827]" : "border-[#5CC800] bg-white"
            }`}
          >
            <FaAngleRight
              className={`transform transition-transform duration-300 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </div>
          <span className="text-lg font-medium">{`Year ${year}`}</span>
        </div>

        {/* Add Content Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFormOpen(true);
          }}
          className={`py-2 px-4 rounded-lg transition-all ${
            isDarkMode
              ? "bg-[#5CC800] text-white hover:bg-[#3fa600]"
              : "bg-[#f3d727] text-black hover:bg-[#ffec6f]"
          }`}
        >
          + Add
        </button>
      </div>

      {/* Content Area */}
      {isOpen && (
        <div
          className={`px-4 py-4 ${
            isDarkMode ? "bg-[#272827] text-white" : "bg-white text-[#121138]"
          }`}
        >
          {events.length > 0 ? (
            <ul className="list-disc pl-6 space-y-2">
              {events.map((event, index) => (
                <li
                  key={index}
                  className="cursor-pointer hover:underline"
                  onClick={() => handleContentClick(event)}
                >
                  {event}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No content added yet.</p>
          )}
        </div>
      )}

      {/* Popup Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] h-[80vh] max-h-[90vh] shadow-lg overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add Event</h3>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Event Name</label>
                <input
                  type="text"
                  name="eventName"
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              {/* Panel Information */}
              <hr className="my-4" />
              <h4 className="font-semibold">Panel Information</h4>
              <div>
                <label className="block text-sm font-medium mb-2">No. of Panels</label>
                <input
                  type="number"
                  name="noOfPanels"
                  className="w-full p-2 border rounded-lg appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  required
                  min="1" max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teachers</label>
                <select
                  name="teachers"
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="guide">Guide</option>
                  <option value="guide and co-guide">Guide and Co-guide</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">No. of Teachers per Panel</label>
                <input
                  type="number"
                  name="noOfTeachers"
                  className="w-full p-2 border rounded-lg appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  required
                  min="1" max="100"
                />
              </div>

              {/* Rubrics */}
              {/* <hr className="my-4" />
              <h4 className="font-semibold">Rubrics</h4>
              <div>
                <label className="block text-sm font-medium mb-2">Detect</label>
                <input
                  type="text"
                  name="detectRubrics"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Manually Add</label>
                <input
                  type="text"
                  name="manualRubrics"
                  className="w-full p-2 border rounded-lg"
                />
              </div> */}

              {/* Buttons */}
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#5CC800] text-white py-2 px-4 rounded-lg"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearBox;
