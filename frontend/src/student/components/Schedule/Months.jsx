import React, { useState, useRef } from "react";

const events = [
  { date: "2024-12-25", name: "Christmas" },
  { date: "2025-01-01", name: "New Year's Day" },
  { date: "2025-01-06", name: "Guru Govind Jayanti" },
  { date: "2025-01-14", name: "Makar Sankranti" },
  { date: "2025-01-26", name: "Republic Day" },
  { date: "2025-02-02", name: "Vasant Panchami" },
  { date: "2025-02-19", name: "Shivaji Jayanti" },
  { date: "2025-02-26", name: "Mahashivratri" },
  { date: "2025-03-08", name: "International Women's Day" },
  { date: "2025-03-21", name: "Holi" },
  { date: "2025-04-14", name: "Ambedkar Jayanti" },
  { date: "2025-04-22", name: "Earth Day" },
  { date: "2025-05-01", name: "Labor Day" },
  { date: "2025-05-09", name: "Mother's Day" },
  { date: "2025-06-05", name: "World Environment Day" },
  { date: "2025-06-21", name: "International Yoga Day" },
  { date: "2025-08-15", name: "Independence Day (India)" },
  { date: "2025-08-22", name: "Raksha Bandhan" },
  { date: "2025-09-05", name: "Teacher's Day" },
  { date: "2025-09-17", name: "Vishwakarma Puja" },
  { date: "2025-10-02", name: "Gandhi Jayanti" },
  { date: "2025-10-24", name: "Dussehra" },
  { date: "2025-11-01", name: "All Saints' Day" },
  { date: "2025-11-12", name: "Diwali" },
  { date: "2025-11-14", name: "Children's Day" },
  { date: "2025-12-25", name: "Christmas" },
];

const IndianCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [newEvent, setNewEvent] = useState({ name: "", time: "" });
  const [eventList, setEventList] = useState(events);
  const calendarRef = useRef();

  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const getLastDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const generateCalendarDays = (date) => {
    const firstDay = getFirstDayOfMonth(date);
    const lastDay = getLastDayOfMonth(date);

    const days = [];
    const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0);
    const prevDaysCount = firstDay.getDay();

    for (let i = prevMonthLastDay.getDate() - prevDaysCount + 1; i <= prevMonthLastDay.getDate(); i++) {
      days.push(new Date(prevMonthLastDay.getFullYear(), prevMonthLastDay.getMonth(), i));
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    const nextDaysCount = 6 - lastDay.getDay();
    for (let i = 1; i <= nextDaysCount; i++) {
      days.push(new Date(date.getFullYear(), date.getMonth() + 1, i));
    }

    return days;
  };

  const handleNextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

  const isToday = (day) => {
    const today = new Date();
    return day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
  };

  const handleDayClick = (day, event) => {
    const calendarRect = calendarRef.current.getBoundingClientRect();
    const popupWidth = 200; // Approximate width of the popup
    const popupHeight = 150; // Approximate height of the popup
    const calendarWidth = calendarRect.width;

    let top = event.clientY - calendarRect.top + 10; // Position just below the clicked date
    let left = event.clientX - calendarRect.left; // Align horizontally with the clicked date

    // Adjust position if the popup goes beyond the right edge
    if (left + popupWidth > calendarWidth) {
      left = calendarWidth - popupWidth - 10; // Shift popup to the left
    }

    // Prevent popup from going above the calendar container
    if (top + popupHeight > calendarRect.height) {
      top = calendarRect.height - popupHeight - 10; // Shift popup up
    }

    setSelectedDay(day);
    setModalPosition({ top, left });
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = () => {
    if (!newEvent.name || !newEvent.time) return;
    const formattedDate = selectedDay.toISOString().split("T")[0];
    setEventList((prev) => [...prev, { ...newEvent, date: formattedDate }]);
    setSelectedDay(null);
    setNewEvent({ name: "", time: "" });
  };

  const handleClosePopup = () => {
    setSelectedDay(null);
    setNewEvent({ name: "", time: "" });
  };

  const calendarDays = generateCalendarDays(currentDate);

  return (
    <div ref={calendarRef} className="relative w-1200 p-3 bg-gray-50  dark:bg-gray-600 dark:text-gray-500 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 bg-blue-500 rounded hover:bg-blue-700 text-white font-bold">{"<"}</button>
        <h2 className="text-xl font-bold text-[#5cc800]">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <button onClick={handleNextMonth} className="p-2 bg-blue-500 rounded hover:bg-blue-700 text-white font-bold">{">"}</button>
      </div>

      <div className="grid grid-cols-7 border border-gray-300">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-3 text-center font-bold text-white border bg-[#3C763D]">{day}</div>
        ))}
        {calendarDays.map((day, index) => (
         <div
         key={index}
         className={`p-8 border cursor-pointer flex flex-col items-center relative ${
           isToday(day) ? "bg-blue-200" : "bg-white"
         } ${day.getMonth() !== currentDate.getMonth() ? "text-gray-400" : "text-black"}`}
         onClick={(e) => handleDayClick(day, e)}
       >
         <div>{day.getDate()}</div> {/* Date */}
         {eventList
           .filter((event) => event.date === day.toLocaleDateString("en-CA"))
           .map((event, index) => (
             <div 
               key={index} 
               className="absolute bottom-0 left-0 w-full bg-[#5cc800] text-white text-sm px-2 py-1 rounded text-center"
             >
               {event.name}
             </div>
           ))}
       </div>
       
        ))}
      </div>

     
    </div>
  );
};

export default IndianCalendar;
