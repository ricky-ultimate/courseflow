"use client";

import React, { useState } from 'react';
import { departments, Department } from '@/data/universities/[universityId]/departments';
import Timetable from '@/components/Timetable';

interface DepartmentPageParams {
  universityId: string;
  departmentId: string;
}

const DepartmentPage: React.FC<{ params: DepartmentPageParams }> = ({ params }) => {
  const { universityId, departmentId } = params;

  const universityDepartments = departments[universityId] as Department[] | undefined;

  if (!universityDepartments) {
    return <div>University not found</div>;
  }

  const department = universityDepartments.find((dept) => dept.id === departmentId);

  if (!department) {
    return <div>Department not found</div>;
  }

  const [level, setLevel] = useState('100lvl');

  // Transform the data to match the expected structure
  const transformedTimetableData = department.timetable[level as keyof typeof department.timetable].map(course => ({
    day: "Unknown", // Replace this with the actual day if available in your data structure
    courses: [{
      time: "Unknown", // Replace this with the actual time if available in your data structure
      code: course, // Assuming the course array contains course codes as strings
      name: "Unknown", // Replace this with the actual course name if available
      venue: "Unknown", // Replace this with the actual venue if available
    }]
  }));

  return (
    <div className="min-h-screen p-8 bg-black text-mocha">
      <h1 className="text-3xl font-bold mb-6">{department.name} - {level}</h1>
      <div className="mb-6">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="p-4 rounded-lg text-black"
        >
          <option value="100lvl">100lvl</option>
          <option value="200lvl">200lvl</option>
          <option value="300lvl">300lvl</option>
          <option value="400lvl">400lvl</option>
          <option value="500lvl">500lvl</option>
        </select>
      </div>
      <Timetable department={department} data={transformedTimetableData} />
    </div>
  );
};

export default DepartmentPage;
