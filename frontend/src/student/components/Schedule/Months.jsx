import React, { useState } from "react";

const events = [
  { date: "2024-12-25", name:"Christmas"},
  { date: "2025-01-01", name: "New Year's Day" },
  { date: "2025-01-06", name: "Guru Govind Singh Jayanti"},
  { date: "2025-01-14", name: "Makar Sankranti"},
  { date: "2025-01-26", name: "Republic Day"},
  { date: "2025-02-02", name: "Vasant Panchami"},
  { date: "2025-02-19", name: "Shivaji Jayanti"},
  { date: "2025-03-08", name: "International Women's Day" },
  { date: "2025-03-21", name: "Holi" },
  { date: "2025-04-14", name: "Ambedkar Jayanti" },
  { date: "2025-04-22", name: "Earth Day" },
  { date: "2025-05-01", name: "Labor Day" },
  { date: "2025-05-09", name: "Mother's Day" },
  { date: "2025-06-05", name: "World Environment Day" },
  { date: "2025-06-21", name: "International Yoga Day" },
  { date: "2025-07-04", name: "Independence Day (USA)" },
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
  // Add more events here
];

const Months = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null); // Track selected day
  const [newEvent, setNewEvent] = useState({ name: "", time: "" }); // Track new event details
  const [eventList, setEventList] = useState(events); // Store all events

  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const getLastDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const generateCalendarDays = (date) => {
    const firstDay = getFirstDayOfMonth(date);
    const lastDay = getLastDayOfMonth(date);

    const days = [];
    const firstDayOfWeek = firstDay.getDay();
    const lastDayOfWeek = 6 - lastDay.getDay();

    // Add previous month's days
    const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0);
    const prevMonthStartDay = prevMonthLastDay.getDate() - firstDayOfWeek + 1;

    for (let i = prevMonthStartDay; i <= prevMonthLastDay.getDate(); i++) {
      days.push(new Date(prevMonthLastDay.getFullYear(), prevMonthLastDay.getMonth(), i));
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    // Add next month's days
    for (let i = 1; i <= lastDayOfWeek; i++) {
      days.push(new Date(date.getFullYear(), date.getMonth() + 1, i));
    }

    return days;
  };

  const handleNextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

  const isToday = (day) => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  const getEventsForDay = (day) => {
    const formattedDate = day.toISOString().split("T")[0];
    return eventList.filter((event) => event.date === formattedDate);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day); // Set selected day
    const formattedDate = day.toISOString().split("T")[0];
    const existingEvent = eventList.find((event) => event.date === formattedDate);
    if (existingEvent) {
      setNewEvent({ name: existingEvent.name, time: existingEvent.time });
    } else {
      setNewEvent({ name: "", time: "" });
    }
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = () => {
    if (!newEvent.name || !newEvent.time) return; // Prevent saving empty events
    const formattedDate = selectedDay.toISOString().split("T")[0];
    const updatedEvents = [...eventList, { ...newEvent, date: formattedDate }];
    setEventList(updatedEvents);
    setSelectedDay(null); // Close the popup after saving
  };

  const handleClosePopup = () => {
    setSelectedDay(null); // Close the popup without saving
  };

  const calendarDays = generateCalendarDays(currentDate);

  return (
    <div className="w-[1200px] mx-auto p-4 bg-white mr-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 bg-gray-200 rounded hover:bg-gray-300">
          {"<"}
        </button>
        <h2 className="text-xl font-bold">{currentDate.toLocaleString("default", { month: "long", year: "numeric" })}</h2>
        <button onClick={handleNextMonth} className="p-2 bg-gray-200 rounded hover:bg-gray-300">
          {">"}
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center font-bold bg-white border p-2"
            style={{ height: "100px", width: "140px" }}
          >
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const eventsForDay = getEventsForDay(day);

          return (
            <div
              key={index}
              className={`p-2 border ${isCurrentMonth ? "bg-white" : "bg-gray-100"} ${isToday(day) ? "bg-blue-200" : ""}`}
              style={{ height: "100px", width: "140px" }}
              onClick={() => handleDayClick(day)} // Handle day click
            >
              <div className="text-sm font-semibold">{day.getDate()}</div>
              {eventsForDay.map((event, idx) => (
                <div key={idx} className="text-xs bg-green-500 text-white rounded mt-1 px-1">
                  {event.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Event Popup */}
      {selectedDay && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 border rounded shadow-lg">
          <button onClick={handleClosePopup} className="absolute top-0 right-0 p-2 text-red-500">
            X
          </button>
          <h3 className="text-lg font-semibold">Create Event</h3>
          <div className="mt-2">
            <label className="block">Event Name:</label>
            <input
              type="text"
              name="name"
              value={newEvent.name}
              onChange={handleEventChange}
              className="border p-2 w-full"
            />
          </div>
          <div className="mt-2">
            <label className="block">Event Time:</label>
            <input
              type="time"
              name="time"
              value={newEvent.time}
              onChange={handleEventChange}
              className="border p-2 w-full"
            />
          </div>
          <button onClick={handleSaveEvent} className="mt-4 p-2 bg-blue-500 text-white rounded w-full">
            Save Event
          </button>
        </div>
      )}
    </div>
  );
};

export default Months;
