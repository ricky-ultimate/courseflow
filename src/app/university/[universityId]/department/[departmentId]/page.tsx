"use client"
import React, { useState } from 'react';
import departments from '@/data/departments'; // Updated data structure

const DepartmentPage = ({ params }) => {
  const { universityId, departmentId } = params;
  const department = departments[universityId]?.find(dept => dept.id === departmentId);
  const [level, setLevel] = useState('100lvl');

  if (!department) {
    return <div>Department not found</div>;
  }

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
      {/* Assuming TimeTable component now accepts level as prop */}
      <Timetable data={department.timetable[level]} />
    </div>
  );
};

export default DepartmentPage;
