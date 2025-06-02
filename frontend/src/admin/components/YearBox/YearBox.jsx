import React, { useState, useEffect} from "react";
import { FaAngleRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../../AxiosInstance";
const YearBox = ({ id, year, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [events, setEvents] = useState([]); // Default content
  const navigate = useNavigate();

  const fetchEvents = async () => {
    console.log(id)
    try {
      const response = await AxiosInstance.get(`review/by-year/?id=${id}`);
      console.log(response.data);
      setEvents(response.data);  // assuming it returns a list of event names
    } catch (error) {
      console.error("Failed to fetch events:", error.response.data.error);
    }
  };
  
  // Option 1: fetch when expanded
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  // Toggle year box content visibility
  const toggleYearContent = () => setIsOpen(!isOpen);

  // Navigate to the content detail page
  const handleContentClick = (event) => {
    navigate(`/assessment/${year}/${event}`);
  };

  const [semesterOptions, setSemesterOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [semDivMap, setSemDivMap] = useState({});

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await AxiosInstance.get(`/semesters/get_semesters_and_divisions/`, {
          params: {
            id: id,        
          }
        });
        const semDivData = response.data;
        setSemesterOptions(Object.keys(semDivData));
        setDivisionOptions([]); // reset
        setSemDivMap(semDivData); // store for later use
      } catch (err) {
        console.error("Failed to load semesters/divisions", err);
      }
    };
  
    if (id) {
      fetchSemesters();
    }
  }, [id]);

  const handleSemesterChange = (e) => {
    const selectedSem = e.target.value;
    setFormData({ ...formData, semester: selectedSem, div: "" });
    if (semDivMap[selectedSem]) {
      setDivisionOptions(["All",...semDivMap[selectedSem]]);
    } else {
      setDivisionOptions([]);
    }
  };

  const [formStep, setFormStep] = useState(1); // 1 = Event Details, 2 = Rubrics, 3 = Panel Info
  const [formData, setFormData] = useState({
    eventName: "",
    semester: "",
    div: "",
    noOfPanels: "",
    teachers: "guide",
    noOfTeachers: "",
  });

  const [rubrics, setRubrics] = useState([]);

  const handleRubricChange = (index, field, value) => {
    const updated = [...rubrics];
    updated[index][field] = value;
    setRubrics(updated);
  };

  const addRubric = () => {
    setRubrics([...rubrics, { name: '', maxMarks: '' }]);
  };

  const removeRubric = (index) => {
    const updated = [...rubrics];
    updated.splice(index, 1);
    setRubrics(updated);
  };

  const [usePreviousPanel, setUsePreviousPanel] = useState(null); // null | 'yes' | 'no'
  const [previousEventId, setPreviousEventId] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData, 
      rubrics: rubrics.filter(r => r.name && r.maxMarks), 
      usePreviousPanel,
      previousEventId: usePreviousPanel === 'yes' ? previousEventId : null,
      year: id,
    };
    console.log(payload);
    try {
      AxiosInstance.post(`clustering/cluster_and_allocate/`, {
        payload,
      })
        .then((response) => {
          setIsFormOpen(false);
          alert("Panel Formed");
          // const { event_id } = response.data;
          // navigate(`/assessment/${year}/${event_id}`);
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
              {events.map((event) => (
                <li
                  key={event.id}
                  className="cursor-pointer hover:underline"
                  onClick={() => handleContentClick(event.id)}
                >
                  {event.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No content added yet.</p>
          )}
        </div>
      )}

      {/* Popup Form */}
      {/* {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] h-[80vh] max-h-[90vh] shadow-lg overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add Event</h3>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Event Name</label>
                <input
                  type="text"
                  name="eventName"
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
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
                  onWheel={(e) => e.target.blur()}
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
                  onWheel={(e) => e.target.blur()}
                />
              </div>
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
      )} */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] h-[80vh] max-h-[90vh] shadow-lg overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add Event</h3>
            <form className="space-y-4">
              {/* Step 1: Event Details */}
              {formStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Name</label>
                    <input
                      type="text"
                      name="eventName"
                      value={formData.eventName}
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Semester</label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleSemesterChange}
                      className="w-full p-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Semester</option>
                      {semesterOptions.map((sem) => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Division</label>
                    <select
                      name="div"
                      value={formData.div}
                      onChange={(e) => setFormData({ ...formData, div: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Division</option>
                      {divisionOptions.map((div) => (
                        <option key={div} value={div}>
                        {div}
                        </option>
                      ))}
                    </select>
                  </div>
            {/* <div>
              <label className="block text-sm font-medium mb-2">Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select Semester</option>
                <option value="Sem 7">Sem 7</option>
                <option value="Sem 8">Sem 8</option>
              </select>
            </div> */}
            {/* <div>
              <label className="block text-sm font-medium mb-2">Division</label>
              <input
                type="text"
                name="div"
                value={formData.div}
                onChange={(e) => setFormData({ ...formData, div: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div> */}
          </>
        )}

        {/* Step 2: Rubrics */}
        {formStep === 2 && (
          <>
            <h4 className="font-semibold">Rubrics (Optional)</h4>
            {rubrics.map((rubric, index) => (
  <div key={index} className="flex space-x-2 items-center">
    {/* Rubric Name Input */}
    <input
      type="text"
      placeholder={`Rubric ${index + 1} name`}
      value={rubric.name}
      onChange={(e) => handleRubricChange(index, 'name', e.target.value)}
      className="flex-1 p-2 border rounded-md"
    />

    {/* Max Marks Input */}
    <input
      type="number"
      placeholder="Max Marks"
      value={rubric.maxMarks}
      onChange={(e) => handleRubricChange(index, 'maxMarks', e.target.value)}
      className="w-32 p-2 border rounded-md"
      min="0"
      required
    />

    {/* Remove Button (Optional Rubrics) */}
    {index >= 0 && (
      <button
        type="button"
        onClick={() => removeRubric(index)}
        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
      >
        ✖
      </button>
    )}
  </div>
))}

{/* Add Rubric Button */}
<div className="mt-3">
  <button
    type="button"
    onClick={addRubric}
    className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600"
  >
    + Add Rubric
  </button>
</div>
          </>
        )}

        {/* Step 3: Panel Info */}
        {formStep === 3 && (
          <>
            <div>
  <label className="block text-sm font-medium mb-2">Use Previously Generated Panel?</label>
  <div className="flex space-x-4">
    <button
      type="button"
      className={`py-2 px-4 rounded-lg ${usePreviousPanel === 'yes' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
      onClick={() => setUsePreviousPanel('yes')}
    >
      Yes
    </button>
    <button
      type="button"
      className={`py-2 px-4 rounded-lg ${usePreviousPanel === 'no' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
      onClick={() => setUsePreviousPanel('no')}
    >
      No
    </button>
  </div>
</div>

{usePreviousPanel === 'yes' && (
  <div className="mt-4">
    <label className="block text-sm font-medium mb-2">Select Previous Event</label>
    <select
      className="w-full p-2 border rounded-lg"
      value={previousEventId}
      onChange={(e) => setPreviousEventId(e.target.value)}
    >
      <option value="">-- Select Event --</option>
      {/* {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name}
        </option>
      ))} */}
      {events.map(event => (
        <option key={event.id} value={event.id}>
          {event.name}
        </option>
      ))}
    </select>
  </div>
)}
{usePreviousPanel === 'no' && (
  <div className="mt-4 space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">No. of Panels</label>
      <input
        type="number"
        name="noOfPanels"
        className="w-full p-2 border rounded-lg"
        required
        min="1"
        value={formData.noOfPanels}
        onChange={(e) => setFormData({ ...formData, noOfPanels: e.target.value })}
        onWheel={(e) => e.target.blur()}
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Teachers</label>
      <select
        name="teachers"
        className="w-full p-2 border rounded-lg"
        value={formData.teachers}
        onChange={(e) => setFormData({ ...formData, teachers: e.target.value })}
        required
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
        value={formData.noOfTeachers}
        onChange={(e) => setFormData({ ...formData, noOfTeachers: e.target.value })}
        className="w-full p-2 border rounded-lg"
        required
        min="1"
        onWheel={(e) => e.target.blur()}
      />
    </div>
  </div>
)}

          </>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => {
              if (formStep === 1) setIsFormOpen(false);
              else setFormStep((prev) => prev - 1);
            }}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg"
          >
            {formStep === 1 ? "Cancel" : "Back"}
          </button>

          {formStep < 3 ? (
            <button
              type="button"
              onClick={() => setFormStep((prev) => prev + 1)}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg"
            >
              Next
            </button>
          ) : (
            <button type="button" className="bg-[#5CC800] text-white py-2 px-4 rounded-lg" onClick={handleSubmit}>
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default YearBox;
