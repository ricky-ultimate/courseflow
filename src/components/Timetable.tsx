import React from 'react';
import { Department } from '@/data/universities/[universityId]/departments';

interface TimetableProps {
  department: Department;
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

const Timetable: React.FC<TimetableProps> = ({ department, data }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2>{department.name} Timetable</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {data.map((item, index) => (
          <div key={index} className="border p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-black">{item.day}</h3>
              {item.courses.map((course, courseIndex) => (
                <div key={courseIndex} className="mb-2">
                <p className="font-medium text-black">{course.time}</p>
                <p className="text-black">{course.code}: {course.name}</p>
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
