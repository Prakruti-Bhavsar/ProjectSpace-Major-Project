import React, { useState } from 'react';

const AddYearForm = ({ onClose }) => {
  const [newYear, setNewYear] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can handle adding the new year (e.g., updating state or making an API call)
    console.log('New Year Added:', newYear);
    onClose(); // Close the form after submitting
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-80">
        <h3 className="text-xl font-semibold mb-4 text-black">Add New Year</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="year" className="block text-sm text-black">Year</label>
            <input
              type="text"
              id="year"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex justify-between">
            <button
              type="submit"
              className="bg-[#5cc800] text-white py-2 px-4 rounded-lg"
            >
              Add Year
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-black py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddYearForm;
