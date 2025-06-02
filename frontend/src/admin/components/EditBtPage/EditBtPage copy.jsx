import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const EditPanelPage = ({ isDarkMode }) => {
  const location = useLocation();
  const responseData = location.state || {};

  // const [panel1, setPanel1] = useState({
  //   teachers: ["Dr. John Smith", "Prof. Emily Davis"],
  //   students: [
  //     { title: "AI in Healthcare", members: ["Alice", "Bob"] },
  //     { title: "Sustainable Architecture", members: ["Emma", "John"] },
  //   ],
  // });

  // const [panel2, setPanel2] = useState({
  //   teachers: ["Dr. Alan Walker", "Prof. Sarah Lee"],
  //   students: [
  //     { title: "Blockchain in Finance", members: ["Sarah", "Lee"] },
  //     { title: "Renewable Energy Systems", members: ["Mike", "Dave"] },
  //   ],
  // });

  // const [unassigned, setUnassigned] = useState({
  //   students: [
  //     { title: "Quantum Computing", members: ["Anna", "Mark"] },
  //     { title: "Machine Learning Basics", members: ["Sam", "Chris"] },
  //   ],
  //   teachers: ["Prof. Jane Doe", "Dr. Eric Brown"],
  // });

  const transformData = (data) => {
    const panels = {};
    Object.entries(data.panels || {}).forEach(([panelName, teachers]) => {
      panels[panelName] = {
        teachers: teachers,
        students: (data.groups[panelName] || []).map((group) => ({
          title: group.Group,
          members: [group.Domain, group.Guide], // Store domain & guide
        })),
      };
    });

    return {
      panels,
      unassigned: {
        students: data.remaining_groups || [],
        teachers: data.unassigned_teachers || [],
      },
    };
  };

  // const [assigningItem, setAssigningItem] = useState(null);

  // const handleRemoveFromPanel = (panel, type, item) => {
  //   const setPanel = panel === 1 ? setPanel1 : setPanel2;
  //   const currentPanel = panel === 1 ? panel1 : panel2;

  //   setPanel({
  //     ...currentPanel,
  //     [type]: currentPanel[type].filter((t) => t !== item),
  //   });

  //   setUnassigned({
  //     ...unassigned,
  //     [type]: [...unassigned[type], item],
  //   });
  // };

  // const handleAssignToPanel = (panel, type, item) => {
  //   const setPanel = panel === 1 ? setPanel1 : setPanel2;
  //   const currentPanel = panel === 1 ? panel1 : panel2;

  //   setUnassigned({
  //     ...unassigned,
  //     [type]: unassigned[type].filter((t) => t !== item),
  //   });

  //   setPanel({
  //     ...currentPanel,
  //     [type]: [...currentPanel[type], item],
  //   });
  // };

  const initialData = transformData(responseData);
  const [panelData, setPanelData] = useState(initialData.panels);
  const [unassigned, setUnassigned] = useState(initialData.unassigned);
  const [assigningItem, setAssigningItem] = useState(null);

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

  const panelStyle = isDarkMode
    ? "bg-[#2c2c2e] text-white"
    : "bg-white text-[#2c3e50]";
  const sectionStyle = isDarkMode
    ? "bg-[#444] text-white"
    : "bg-[#f1f5f9] text-[#2c3e50]";
  const teacherStyle = isDarkMode
    ? "flex items-center bg-gray-700 text-white px-4 py-2 rounded-full shadow-md"
    : "flex items-center bg-blue-200 px-4 py-2 rounded-full shadow-md";
  const studentStyle = isDarkMode
    ? "p-4 bg-gray-800 rounded-lg shadow-md"
    : "p-4 bg-gray-100 rounded-lg shadow-md";

  return (
    <div className="flex h-screen">
      <div className="flex-grow overflow-hidden">
        <main className="h-full overflow-y-auto p-6 space-y-6">
          {Object.entries(panelData).map(([panelName, panel]) => (
            <div key={panelName} className={`p-6 rounded-lg shadow-md ${panelStyle}`}>
              <h3 className="text-2xl font-bold mb-4">{panelName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg ${sectionStyle}`}>
                  <h4 className="text-lg font-semibold mb-3">Teachers</h4>
                  <div className="flex flex-wrap gap-2">
                    {panel.teachers.map((teacher) => (
                      <div key={teacher} className={teacherStyle}>
                        <span>{teacher}</span>
                        <button className="ml-2 text-red-500" onClick={() => handleRemoveFromPanel(panelName, "teachers", teacher)}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${sectionStyle}`}>
                  <h4 className="text-lg font-semibold mb-3">Student Groups</h4>
                  <div className="space-y-4">
                    {panel.students.map((group, index) => (
                      <div key={index} className={studentStyle}>
                        <p className="font-semibold">{group.title}</p>
                        <p>Members: {group.members.join(", ")}</p>
                        <button className="text-red-500 mt-2" onClick={() => handleRemoveFromPanel(panelName, "students", group)}>Remove</button>
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
                      <span>{teacher}</span>
                      <button className="ml-2 text-green-500" onClick={() => setAssigningItem({ type: "teachers", item: teacher })}>Assign</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${sectionStyle}`}>
                <h4 className="text-lg font-semibold mb-3">Students</h4>
                <div className="space-y-4">
                  {unassigned.students.map((group, index) => (
                    <div key={index} className={studentStyle}>
                      <p className="font-semibold">{group.Group}</p>
                      <p>Domain: {group.Domain}</p>
                      <p>Guide: {group.Guide}</p>
                      <button className="text-green-500 mt-2" onClick={() => setAssigningItem({ type: "students", item: group })}>Assign</button>
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
            <p>Assign "{assigningItem.item.title || assigningItem.item}" to:</p>
            <div className="flex justify-between mt-4">
              {Object.keys(panelData).map((panelName) => (
                <button key={panelName} className="bg-green-500 text-white px-4 py-2 rounded-lg" onClick={() => {
                  handleAssignToPanel(panelName, assigningItem.type, assigningItem.item);
                  setAssigningItem(null);
                }}>
                  {panelName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPanelPage;
