import React from "react";

const events = [
  { date: "1 Jan", day: "Wed", title: "New Year’s Day" },
  { date: "6 Jan", day: "Mon", title: "Guru Govind Singh Jayanti" },
  { date: "14 Jan", day: "Tue", title: "Hazrat Ali’s Birthday" },
  { date: "14 Jan", day: "Tue", title: "Makar Sankranti" },
  { date: "14 Jan", day: "Tue", title: "Pongal" },
  { date: "26 Jan", day: "Sun", title: "Republic Day" },
  { date: "2 Feb", day: "Sun", title: "Vasant Panchami" },
  { date: "12 Feb", day: "Wed", title: "Guru Ravidas Jayanti" },
  { date: "19 Feb", day: "Wed", title: "Shivaji Jayanti" },
  { date: "23 Feb", day: "Sun", title: "Maharishi Dayanand Saraswati Jayanti" },
  { date: "26 Feb", day: "Wed", title: "Maha Shivaratri/Shivaratri" },
  { date: "2 Mar", day: "Sun", title: "Ramadan Start (tentative)" },
  { date: "13 Mar", day: "Thu", title: "Holika Dahana" },
  { date: "14 Mar", day: "Fri", title: "Dolyatra" },
  { date: "21 Mar", day: "Fri", title: "Holi" },
  { date: "14 Apr ", day: "Mon", title: "Ambedkar Jayanti" },
  { date: "22 Apr", day: "Tue", title: "Earth Day" },
  { date: "1 May", day: "Thur", title: "Labor Day" },
  { date: "9 May", day: "Fri", title: "Mother's Day" },
  { date: "5 Jun", day: "Thur", title: "World Enviornment Day" },
  { date: "21 Jun", day: "Sat", title: "International Yoga Day" },
  { date: "15 Aug", day: "Fri", title: "Independence Day" },
  { date: "22 Aug", day: "Sat", title: "Rakhsha Bandhan" },
  { date: "5 Sept", day: "Fri", title: "Teacher's Day" },
  { date: "17 Sept", day: "Wed", title: "Vishwakarma Puja" },
  { date: "2 Oct", day: "Thur", title: "Gandhi Jayanti" },
  { date: "24 Oct", day: "Fri", title: "Dusshera" },
  { date: "1 Nov", day: "Sat", title: "All Saint's Day" },
  { date: "12 Nov", day: "Wed", title: "Diwali" },
  { date: "14 Nov", day: "Fri", title: "Children's Day" },
  { date: "25 Dec", day: "Thur", title: "Christmas" },
  // Add more events here...
];

const Schedule = () => {
  return (
    <div className="flex flex-col items-start p-3 bg-gray-100 min-h-screen rounded-md">
      <h1 className="text-2xl font-bold mb-2 text-blue-500">Schedule</h1>
      <div className="bg-white shadow-lg rounded-lg w-full border border-gray-100">
        {events.map((event, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-4 border-b border-gray-300 ${
              index === events.length - 1 ? "border-b-0" : ""
            }`}
          >
            {/* Date and Weekday */}
            <div className="flex items-center gap-4 w-1/3">
              <div className="text-lg text-gray-800 font-semibold">
                {event.date}
              </div>
              <div className="text-sm text-gray-600 font-semibold">{event.day}</div>
            </div>
            {/* Green Circle and Event Name */}
            <div className="flex items-center gap-4 w-2/3">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              <div className="text-lg text-gray-600 mr-4 font-semibold">All Day</div> {/* Added margin-right to create space */}
              <span className="text-lg text-gray-600 font-semibold">{event.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Schedule;
