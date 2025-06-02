import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import AxiosInstance from "../../../AxiosInstance";

const EditPanelPage = ({ isDarkMode }) => {
  const { event } = useParams();
  console.log(event);
  const navigate = useNavigate();

  // State for panels and unassigned teachers/students
  const [panelData, setPanelData] = useState({});
  const [unassigned, setUnassigned] = useState({
    teachers: [],
    students: [],
  });
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [assigningItem, setAssigningItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await AxiosInstance.get(`/event/${event}/panel-data/?_=${Date.now()}`); // Replace with your actual API endpoint
        const fetchedData = response.data;
        console.log(response.data);

        const { panels = {}, groups = {}, unassigned_teachers = [], remaining_groups = [] } = fetchedData;

        // Initializing panels dynamically
        const initialPanels = Object.keys(panels).reduce((acc, panelName) => {
          acc[panelName] = {
            teachers: (panels[panelName] || []).map((t) => ({
              id: t.id,
              name: t.name, // Or any other field you want to show in UI
            })),
            students: (groups[panelName] || []).map((g) => ({
              id:g.id,
              title: g.Group,
              domain: g.Domain,
              guide: g.Guide,
              members: g.members || [], // Optional: if members are returned from backend
            })),
          };
          return acc;
        }, {});

        setPanelData(initialPanels);
        setUnassigned({
          teachers: unassigned_teachers.map((t) => ({
            id: t.id,
            name: t.name,
          })),
          students: remaining_groups.map((g) => ({
            id:g.id,
            title: g.Group,
            domain: g.Domain,
            guide: g.Guide,
            members: g.members || [],
          })),
        });
      } catch (err) {
        setError("Failed to load panel data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchData();
  }, [event]);

  // Remove from panel
  const handleRemoveFromPanel = (panelName, type, item) => {
    setPanelData((prev) => ({
      ...prev,
      [panelName]: {
        ...prev[panelName],
        [type]: prev[panelName][type].filter((t) => t !== item),
      },
    }));

    setUnassigned((prev) => ({
      ...prev,
      [type]: [...prev[type], item],
    }));
  };

  // Assign to panel
  const handleAssignToPanel = (panelName, type, item) => {
    setUnassigned((prev) => ({
      ...prev,
      [type]: prev[type].filter((t) => t !== item),
    }));

    setPanelData((prev) => ({
      ...prev,
      [panelName]: {
        ...prev[panelName],
        [type]: [...prev[panelName][type], item],
      },
    }));
  };
  
  const handleSubmit = async () => {
    const formattedData = {
      panels: Object.entries(panelData).map(([panelName, panel]) => ({
        panel: panelName,
        teachers: panel.teachers.map((t) => t.id),  // Send teacher IDs
        students: panel.students.map((s) => s.id),  // Send student group IDs (assuming `title` is the group ID)
      })),
      unassigned: {
        teachers: unassigned.teachers.map((t) => t.id),  // Send unassigned teacher IDs
        students: unassigned.students.map((s) => s.id),  // Send unassigned group IDs
      },
    };
  
    try {
      console.log(formattedData);
      const response = await AxiosInstance.post(`/event/${event}/update_panels/`, formattedData);
      alert("Panels updated successfully!");
    } catch (err) {
      console.error("Error submitting data:", err);
      alert("Failed to update panels. Please try again.");
    }
  };
  
  const panelStyle = isDarkMode ? "bg-[#2c2c2e] text-white" : "bg-white text-[#2c3e50]";
  const sectionStyle = isDarkMode ? "bg-[#444] text-white" : "bg-[#f1f5f9] text-[#2c3e50]";
  const teacherStyle = isDarkMode
    ? "flex items-center bg-gray-700 text-white px-4 py-2 rounded-full shadow-md"
    : "flex items-center bg-blue-200 px-4 py-2 rounded-full shadow-md";
  const studentStyle = isDarkMode ? "p-4 bg-gray-800 rounded-lg shadow-md" : "p-4 bg-gray-100 rounded-lg shadow-md";
  
  return (
    <div className="overflow-y auto pt-16">
     <div className="flex justify-between items-center mx-6">
  <button
    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
    onClick={() => navigate(-1)}
  >
    Back
  </button>

  <button
    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
    onClick={handleSubmit}
  >
    Submit Changes
  </button>
</div>
      <div className="flex h-screen">
      <div className="flex-grow">
        <main className="h-full p-6 space-y-6">
          {Object.keys(panelData).sort().map((panelName) => (
            <div key={panelName} className={`p-6 rounded-lg shadow-md ${panelStyle}`}>
              <h3 className="text-2xl font-bold mb-4">{panelName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg ${sectionStyle}`}>
                  <h4 className="text-lg font-semibold mb-3">Teachers</h4>
                  <div className="flex flex-wrap gap-2">
                    {panelData[panelName].teachers.map((teacher) => (
                      <div key={teacher} className={teacherStyle}>
                        <span>{teacher.name}</span>
                        <button className="ml-2 text-red-500" onClick={() => handleRemoveFromPanel(panelName, "teachers", teacher)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${sectionStyle}`}>
                  <h4 className="text-lg font-semibold mb-3">Student Groups</h4>
                  <div className="space-y-4">
                    {panelData[panelName].students.map((group, index) => (
                      <div key={index} className={studentStyle}>
                        <p className="font-semibold">{group.title}</p>
                        <p>Domain: {group.domain}</p>
                        <p>Guide: {group.guide}</p>
                        <button className="text-red-500 mt-2" onClick={() => handleRemoveFromPanel(panelName, "students", group)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Unassigned Section */}
          <div className={`p-6 rounded-lg shadow-md ${panelStyle}`}>
            <h3 className="text-2xl font-bold mb-4">Unassigned</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg ${sectionStyle}`}>
                <h4 className="text-lg font-semibold mb-3">Teachers</h4>
                <div className="flex flex-wrap gap-2">
                  {unassigned.teachers.map((teacher) => (
                    <div key={teacher} className={teacherStyle}>
                      <span>{teacher.name}</span>
                      <button className="ml-2 text-green-500" onClick={() => setAssigningItem({ type: "teachers", item: teacher })}>
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${sectionStyle}`}>
                <h4 className="text-lg font-semibold mb-3">Student Groups</h4>
                <div className="space-y-4">
                  {unassigned.students.map((group, index) => (
                    <div key={index} className={studentStyle}>
                      <p className="font-semibold">{group.title}</p>
                      <p>Domain: {group.domain}</p>
                      <p>Guide: {group.guide}</p>
                      <button className="text-green-500 mt-2" onClick={() => setAssigningItem({ type: "students", item: group })}>
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal for Assigning */}
      {assigningItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setAssigningItem(null)}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Assign To Panel</h3>
            <p>
  Assign "{assigningItem.type === 'teachers' ? assigningItem.item.name : assigningItem.item.title}" to:
</p>

            <div className="flex justify-between mt-4">
              {Object.keys(panelData).map((panelName) => (
                <button
                  key={panelName}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  onClick={() => {
                    handleAssignToPanel(panelName, assigningItem.type, assigningItem.item);
                    setAssigningItem(null);
                  }}
                >
                  {panelName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default EditPanelPage;
