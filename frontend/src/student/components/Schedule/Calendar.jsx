import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCalendar } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from 'react-router-dom';
import Months from "./Months";
import Schedule from "./Schedule";

const Calendar = () => {
  const navigate = useNavigate()
  const [year, setYear] = useState(2025); // Default year
  const [selectedOption, setSelectedOption] = useState("Year");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMonth, setPopupMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const today = new Date();

  const handleDropdownSelect = (option) => {
    setSelectedOption(option);
    setDropdownVisible(false);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleDayClick = (day, month, year) => {
    setSelectedDay({ day, month, year });
  };

  const resetToToday = () => {
    setYear(today.getFullYear());
    setPopupMonth(today.getMonth());
    setSelectedOption("Year");
    setSelectedDay(null);
  };

  const openYearPopup = () => {
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
  };

  const changeMonth = (direction) => {
    setPopupMonth((prevMonth) => {
      let newMonth = prevMonth + direction;
      if (newMonth < 0) {
        newMonth = 11;
        setYear((prevYear) => prevYear - 1);
      } else if (newMonth > 11) {
        newMonth = 0;
        setYear((prevYear) => prevYear + 1);
      }
      return newMonth;
    });
  };

  const renderPopup = () => {
    const monthName = new Date(year, popupMonth).toLocaleString("default", { month: "long" });
    const daysInMonth = getDaysInMonth(popupMonth, year);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-4 rounded-md w-[320px] shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <button className="p-2 border rounded bg-gray-200" onClick={() => changeMonth(-1)}>
              &lt;
            </button>
            <h2 className="font-bold text-center text-lg">{monthName} {year}</h2>
            <button className="p-2 border rounded bg-gray-200" onClick={() => changeMonth(1)}>
              &gt;
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div key={index} className="font-bold text-sm">{day}</div>
            ))}
            {[...Array(daysInMonth).keys()].map((day) => (
              <div
                key={day}
                className={`py-2 cursor-pointer border ${popupMonth === today.getMonth() &&
                    year === today.getFullYear() &&
                    day + 1 === today.getDate()
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700"
                  }`}
                onClick={() => handleDayClick(day + 1, popupMonth, year)}
              >
                {day + 1}
              </div>
            ))}
          </div>
          <button className="mt-4 w-full p-2 bg-[#5cc800] text-white rounded" onClick={closePopup}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    return (
      <div className="grid grid-cols-3 gap-6 mt-3">
        {Array.from({ length: 12 }).map((_, index) => {
          const monthName = new Date(year, index).toLocaleString("default", { month: "long" });
          const daysInMonth = getDaysInMonth(index, year);
          return (
            <div key={index} className="p-4 rounded-md bg-gray-100 border-gray-200 border-2">
              <h3 className="text-center font-bold mb-2">{monthName}</h3>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="font-bold text-sm">{day}</div>
                ))}
                {[...Array(daysInMonth).keys()].map((day) => (
                  <div
                    key={day}
                    className={`py-2 cursor-pointer border ${index === today.getMonth() &&
                        year === today.getFullYear() &&
                        day + 1 === today.getDate()
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700"
                      }`}
                    onClick={() => handleDayClick(day + 1, index, year)}
                  >
                    {day + 1}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 ml-64 mr-1 relative bg-white rounded-md">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button className="p-2 border rounded bg-[#10acd0] hover:bg-[#10acd0] text-white" onClick={() => setYear((prevYear) => prevYear - 1)}>
            &lt;
          </button>
          <span className="p-2 border rounded bg-[#5cc800] cursor-pointer text-white font-semibold" onClick={openYearPopup}>
            {year}
          </span>
          <button className="p-2 border rounded bg-[#10acd0] hover:bg-[#10acd0] text-white" onClick={() => setYear((prevYear) => prevYear + 1)}>
            &gt;
          </button>
          <button className="ml-2 p-2 border rounded bg-blue-500 text-white hover:bg-blue-600 font-semibold"
            onClick={(e) => {  // Prevent dropdown from closing
              setDropdownVisible(true); // Keep dropdown visible
              navigate("/today");
            }}>
            Today
          </button>
        </div>
        <div className="relative">
          <button
            className="p-2 border rounded bg-[#10acd0] flex items-center gap-2 hover:bg-[#10acd0] text-white font-semibold"
            onClick={() => setDropdownVisible(!dropdownVisible)}
          >
            <FontAwesomeIcon icon={faCalendar} className="text-white" />
            {selectedOption}
            <FontAwesomeIcon icon={faCaretDown} className="text-white" />
          </button>
          {dropdownVisible && (
            <div className="absolute top-full right-0 mt-1 bg-white shadow-md rounded-md z-10">
              {["Year", "Months", "Schedule"].map((option) => (
                <button
                  key={option}
                  className={`block w-full text-left px-4 py-2 ${selectedOption === option ? "bg-[#10acd0]" : ""
                    } hover:bg-[#10acd0]`}
                  onClick={() => handleDropdownSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedOption === "Year" && renderYearView()}
      {popupVisible && renderPopup()}
      {selectedOption === "Months" && <Months year={year} getDaysInMonth={getDaysInMonth} />}
      {selectedOption === "Schedule" && <Schedule />}
    </div>
  );
};

export default Calendar;
