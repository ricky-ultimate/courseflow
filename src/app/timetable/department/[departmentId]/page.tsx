"use client";

import React from 'react';
import { useParams } from 'next/navigation';  // Use `useParams` for dynamic route segments
import Timetable from '@/components/Timetable';
import cyberSecurityTimetable from '@/data/cyber-security/timetable';
import foodScienceTimetable from '@/data/food-science-and-technology/timetable';
import biochemistryTimetable from '@/data/biochemistry/timetable';

const TimetablePage = () => {
  const params = useParams();
  const departmentId = Array.isArray(params.departmentId) ? params.departmentId[0] : params.departmentId;

  let timetableData;

  switch (departmentId) {
    case 'cyber-security':
      timetableData = cyberSecurityTimetable;
      break;
    case 'food-science-and-technology':
      timetableData = foodScienceTimetable;
      break;
    case 'biochemistry':
      timetableData = biochemistryTimetable;
      break;
    default:
      timetableData = null;
  }

  if (!timetableData) {
    return <div className="text-center text-[#F5E0DC]">No timetable found for this department.</div>;  // Ensure error message matches theme
  }

  return (
    <div className="min-h-screen bg-[#1E1E2E] text-[#F5E0DC]">
      <h2 className="text-4xl font-bold text-center my-10">{departmentId?.replace(/-/g, ' ')} Timetable</h2>
      <Timetable data={timetableData} />
    </div>
  );
};

export default TimetablePage;
