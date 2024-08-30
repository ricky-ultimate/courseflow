import React from 'react';

interface TimetableProps {
  data: {
    day: string;
    time: string;
    courses: {
      code: string;
      name: string;
      venue: string;
    }[];
  }[];
}

const Timetable: React.FC<TimetableProps> = ({ data }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Timetable</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {data.map((daySchedule, index) => (
          <div key={index} className="border p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">{daySchedule.day}</h3>
            {daySchedule.courses.map((course, idx) => (
              <div key={idx} className="mb-2">
                <p className="font-medium">{course.time}</p>
                <p>{course.code}: {course.name}</p>
                <p className="text-sm text-gray-600">{course.venue}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timetable;
