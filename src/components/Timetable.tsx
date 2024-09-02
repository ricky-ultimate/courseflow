import React from 'react';
import { Department } from '@/data/universities/[universityId]/departments';

interface TimetableProps {
  department: Department;
}
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

const Timetable: React.FC<TimetableProps> = ({ department }) => {
  return (
    <div>
      <h2>{department.name} Timetable</h2>
      <ul>
        {department.courses.map((course, index) => (
          <li key={index}>{course}</li>
        ))}
      </ul>
    </div>
  );
};

export default Timetable;
