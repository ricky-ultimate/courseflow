import React from 'react';

interface TimetableProps {
  data: {
    day: string;
    courses: {
      time: string;
      code: string;
      name: string;
      venue: string;
    }[];
  }[];
}

const Timetable: React.FC<TimetableProps> = ({ data }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-black">Timetable</h2>  {/* Ensure header is black */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {data.map((daySchedule, index) => (
          <div key={index} className="border p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-black">{daySchedule.day}</h3>  {/* Ensure day is black */}
            {daySchedule.courses.map((course, idx) => (
              <div key={idx} className="mb-2">
                <p className="font-medium text-black">{course.time}</p>  {/* Ensure time is black */}
                <p className="text-black">{course.code}: {course.name}</p>  {/* Ensure course code and name are black */}
                <p className="text-sm text-gray-600">{course.venue}</p>  {/* Ensure venue is gray for readability */}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timetable;
