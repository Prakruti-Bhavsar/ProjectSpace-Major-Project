import React, { useState } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';

const LatestNews = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTitle, setFilterTitle] = useState('');

  const newsItems = [
    {
      date: '8th - 10th July 2021',
      time: '8 A.M - 9 A.M',
      title: 'Review-1',
      color: 'bg-blue-500',
    },
    {
      date: '13th July 2021',
      time: '8 A.M - 9 A.M',
      title: 'Logbook correction',
      color: 'bg-pink-500',
    },
    
  ];

  const modalItems = [
    {
      date: '15th July 2021',
      time: '10 A.M - 12 P.M',
      title: 'Presentation Day',
      color: 'bg-yellow-500',
    },
    {
      date: '20th July 2021',
      time: '9 A.M - 11 A.M',
      title: 'Final Submission',
      color: 'bg-purple-500',
    },
    {
      date: '13th July 2021',
      time: '8 A.M - 9 A.M',
      title: 'Review Paper checking',
      color: 'bg-pink-500',
    },
    {
      date: '13th July 2021',
      time: '8 A.M - 9 A.M',
      title: 'Logbook correction',
      color: 'bg-pink-500',
    },
  ];

  const filteredItems = modalItems.filter((item) =>
    filterTitle
      ? item.title.toLowerCase().includes(filterTitle.toLowerCase())
      : true
  );

  return (
    <div className="w-full  p-4 bg-white rounded-md dark:bg-gray-600 dark:text-gray-300 shadow-lg transition-shadow duration-30 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Upcoming Events</h2>
        <button
          className="text-sm font-semibold bg-blue-500 text-white rounded-md p-2 hover:bg-blue-700 shadow-md hover:scale-105 transition-shadow"
          onClick={() => setIsModalOpen(true)}
        >
          See all
        </button>
      </div>
      <div className="space-y-4">
        {newsItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between w-full p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-[#5cc800]"
          >
            <button className="flex items-center space-x-4 w-full text-left">
              <div
                className={`w-12 h-12 flex items-center justify-center text-white rounded-full ${item.color}`}
              >
                {index + 1}
              </div>
              <div>
                <h3 className="text-base font-semibold text-black">{item.title}</h3>
                <p className="text-sm text-white">{item.date}</p>
                <p className="text-sm text-white">{item.time}</p>
                <p className="text-sm text-white">{item.location}</p>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="w-full max-w-3xl bg-white rounded-md dark:bg-gray-700 dark:text-gray-300 p-6 relative">
            <button
              className="absolute top-3 right-4 text-gray-600 dark:text-gray-300 hover:text-red-500 text-4xl text-bold"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
              <div className="flex items-center space-x-2 mb-4">
                {/* Search Bar */}
                <div className="flex items-center bg-gray-100 rounded-md p-2 w-full">
                  <FaSearch className="text-blue-500" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ml-2 bg-transparent focus:outline-none w-full"
                  />
                </div>
                {/* Filter Button */}
                <button
                  className="flex items-center space-x-2 bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600"
                  onClick={() => setFilterTitle(searchTerm)}
                >
                  <FaFilter />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between w-full p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-[#5cc800]"
                >
                  <button className="flex items-center space-x-4 w-full text-left">
                    <div
                      className={`w-12 h-12 flex items-center justify-center text-white rounded-full ${item.color}`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-black">{item.title}</h3>
                      <p className="text-sm text-white">{item.date}</p>
                      <p className="text-sm text-white">{item.time}</p>
                      <p className="text-sm text-white">{item.location}</p>
                    </div>
                  </button>
                 
                </div>
              ))}
              {!filteredItems.length && (
                <p className="text-center text-gray-500">No events found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LatestNews;
