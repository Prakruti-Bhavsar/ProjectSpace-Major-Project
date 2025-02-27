import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

const events = [
  { date: "30 Jan, Thu", isEvent: false, eventName: null },
  { date: "31 Jan, Fri", isEvent: true, eventName: "Assignment: SELF JOIN ASSIGNMENT ONE" },
  { date: "2 Feb, Sun", isEvent: true, eventName: "Vasant Panchami" },
  { date: "12 Feb, Wed", isEvent: true, eventName: "Guru Ravidas Jayanti" },
  { date: "19 Feb, Wed", isEvent: true, eventName: "Shivaji Jayanti" },
  { date: "23 Feb, Sun", isEvent: true, eventName: "Maharishi Dayanand Saraswati Jayanti" },
  { date: "26 Feb, Wed", isEvent: true, eventName: "Maha Shivaratri/Shivaratri" },
  { date: "2 Mar, Sun", isEvent: true, eventName: "Ramadan Start (tentative)" },
  { date: "13 Mar, Thu", isEvent: true, eventName: "Holika Dahana" },
  { date: "2025-04-14",isEvent: true, eventName: "Ambedkar Jayanti" },
  { date: "2025-04-22",isEvent: true, eventName: "Earth Day" },
  { date: "2025-05-01", isEvent: true,eventName: "Labor Day" },
  { date: "2025-05-09",isEvent: true, eventName: "Mother's Day" },
  { date: "2025-06-05", isEvent: true,eventName: "World Environment Day" },
  { date: "2025-06-21", isEvent: true, eventName: "International Yoga Day" },
  { date: "2025-08-15", isEvent: true,eventName: "Independence Day (India)" },
  { date: "2025-08-22",isEvent: true, eventName: "Raksha Bandhan" },
  { date: "2025-09-05", isEvent: true,eventName: "Teacher's Day" },
  { date: "2025-09-17", isEvent: true,eventName: "Vishwakarma Puja" },
  { date: "2025-10-02", isEvent: true,eventName: "Gandhi Jayanti" },
  { date: "2025-10-24", isEvent: true,eventName: "Dussehra" },
  { date: "2025-11-01", isEvent: true,eventName: "All Saints' Day" },
  { date: "2025-11-12", isEvent: true,eventName: "Diwali" },
  { date: "2025-11-14", isEvent: true,eventName: "Children's Day" },
  { date: "2025-12-25", isEvent: true,eventName: "Christmas" },
];

export default function IndianCalendar2025() {
  const currentDate = "30 Jan, Thu";

  return (
    <div className="p-4 bg-gray-50 ml-64  dark:bg-gray-600 dark:text-gray-500">
      <div className="space-y-0"> {/* Space between events */}
        {events.map((event, index) => (
          <div
            key={index}
            className={`p-4 flex items-center justify-between border ${
              event.date === currentDate && !event.isEvent
                ? ""
                : "bg-white"
            }`}
          >
            <div className="flex items-center gap-10 flex-nowrap">
              <span
                className={`text-lg font-semibold ${
                  event.date === currentDate && !event.isEvent
                    ? "text-red-500"
                    : "text-gray-800 font-bold"
                }`}
              >
                {event.date}
              </span>

              {/* Green or Red circle after the date */}
              {event.isEvent ? (
                <FontAwesomeIcon icon={faCircle} className="text-green-500" size="sm" />
              ) : event.date === currentDate ? (
                <FontAwesomeIcon icon={faCircle} className="text-red-500" size="sm" />
              ) : null}
            </div>

            <div className="flex items-center gap-6">
              {event.isEvent ? (
                <>
                  {/* Green circle and "All day" text with event name */}
                  <span className="text-green-600 font-semibold">All day</span>
                  <span className="text-gray-700 font-semibold">{event.eventName}</span>
                </>
              ) : event.date === currentDate ? (
                // If current date has no event, show a message
                <span className="text-red-500"></span>
              ) : null}
            </div>

            {event.date === currentDate && !event.isEvent && (
              <div className="w-full border-t-2 border-red-500 align-middle"></div> // Full-width red line for no event
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
