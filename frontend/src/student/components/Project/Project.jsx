// components/MiniprojectBox.jsx
import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

const MiniprojectBox = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="items-center w-1/2 mx-auto p-4 bg-white rounded-lg shadow-md ">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Miniproject</h2>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          onClick={handleOpen}
        >
          <FaPlus size={20} color="#fff" />
        </button>
      </div>
      <div className="flex flex-wrap justify-center mb-4">
        <div className="w-1/4 p-4 bg-gray-100 rounded-lg m-2">
          <h3 className="text-lg font-bold">Box 1</h3>
        </div>
        <div className="w-1/4 p-4 bg-gray-100 rounded-lg m-2">
          <h3 className="text-lg font-bold">Box 2</h3>
        </div>
        <div className="w-1/4 p-4 bg-gray-100 rounded-lg m-2">
          <h3 className="text-lg font-bold">Box 3</h3>
        </div>
        <div className="w-1/4 p-4 bg-gray-100 rounded-lg m-2">
          <h3 className="text-lg font-bold">Box 4</h3>
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-zinc-100 bg-opacity-75 flex justify-center items-center"
          onClick={handleClose}
        >
          <div className="bg-white p-4 rounded-lg shadow-md w-1/2">
            <h2 className="text-lg font-bold">Popup Content</h2>
            <p>This is the popup content.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniprojectBox;