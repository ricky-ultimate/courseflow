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
    <div>
      <h2>{department.name} Timetable</h2>
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            <h3>{item.day}</h3>
            <ul>
              {item.courses.map((course, courseIndex) => (
                <li key={courseIndex}>{`${course.time} - ${course.code}: ${course.name} at ${course.venue}`}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Timetable;
