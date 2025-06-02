import React, { useState } from "react";

const StudentAddModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("manual"); // "manual" or "csv"
  const [formData, setFormData] = useState({
    moodleId: "",
    name: "",
    department: "",
    batch: "",
    semester: "",
    email: "",
    phone: "",
  });
  const [csvFile, setCsvFile] = useState(null);

  // Handle form input change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file upload
  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  // Handle form submission (manual)
  const handleManualSubmit = (e) => {
    e.preventDefault();
    console.log("Manual Data Submitted:", formData);
    onClose(); // Close modal after submission
  };

  // Handle CSV upload submission
  const handleCsvSubmit = () => {
    console.log("CSV File Uploaded:", csvFile);
    onClose();
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Add Student</h2>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={`flex-1 p-2 ${activeTab === "manual" ? "border-b-2 border-blue-500 font-bold" : ""}`}
              onClick={() => setActiveTab("manual")}
            >
              Manual Entry
            </button>
            <button
              className={`flex-1 p-2 ${activeTab === "csv" ? "border-b-2 border-blue-500 font-bold" : ""}`}
              onClick={() => setActiveTab("csv")}
            >
              CSV Upload
            </button>
          </div>

          {/* Manual Entry Form */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input type="text" name="moodleId" placeholder="Moodle ID" className="border p-2 w-full" onChange={handleInputChange} required />
              <input type="text" name="name" placeholder="Name" className="border p-2 w-full" onChange={handleInputChange} required />
              <input type="text" name="department" placeholder="Department" className="border p-2 w-full" onChange={handleInputChange} required />
              <input type="text" name="batch" placeholder="Academic Batch" className="border p-2 w-full" onChange={handleInputChange} required />
              <input type="number" name="semester" placeholder="Current Semester" className="border p-2 w-full" onChange={handleInputChange} required />
              <input type="email" name="email" placeholder="Email ID" className="border p-2 w-full" onChange={handleInputChange} required />
              <input type="tel" name="phone" placeholder="Phone Number" className="border p-2 w-full" onChange={handleInputChange} required />
              <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">Submit</button>
            </form>
          )}

          {/* CSV Upload */}
          {activeTab === "csv" && (
            <div className="space-y-3">
              <input type="file" accept=".csv" className="border p-2 w-full" onChange={handleFileChange} />
              <button className="bg-green-500 text-white p-2 w-full rounded" onClick={handleCsvSubmit} disabled={!csvFile}>
                Upload CSV
              </button>
            </div>
          )}

          {/* Close Button */}
          <button className="bg-gray-500 text-white p-2 w-full rounded mt-3" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    )
  );
};

export default StudentAddModal;
