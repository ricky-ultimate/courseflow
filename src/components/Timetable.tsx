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
    <div className="bg-[#1E1E2E] shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-[#F5E0DC]">Timetable</h2> {/* Use Catpuccin Mocha text color */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {data.map((daySchedule, index) => (
          <div key={index} className="border p-4 rounded-lg bg-[#282A36]">
            <h3 className="text-xl font-semibold mb-2 text-[#F5E0DC]">{daySchedule.day}</h3> {/* Use Catpuccin Mocha text color */}
            {daySchedule.courses.map((course, idx) => (
              <div key={idx} className="mb-2">
                <p className="font-medium text-[#F5E0DC]">{course.time}</p> {/* Use Catpuccin Mocha text color */}
                <p className="text-[#F5E0DC]">{course.code}: {course.name}</p> {/* Use Catpuccin Mocha text color */}
                <p className="text-sm text-[#B4BEFE]">{course.venue}</p> {/* Use a lighter shade for venue */}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timetable;
