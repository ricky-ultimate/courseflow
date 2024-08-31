"use client";

import React from 'react';
import { useParams } from 'next/navigation';  // Use `useParams` for dynamic route segments
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
    return <div>No timetable found for this department.</div>;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{departmentId?.replace(/-/g, ' ')} Timetable</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Day</th>
            <th className="border p-2">Time</th>
            <th className="border p-2">Course Code</th>
            <th className="border p-2">Course Name</th>
            <th className="border p-2">Venue</th>
          </tr>
        </thead>
        <tbody>
          {timetableData.map((daySchedule, dayIndex) => (
            <React.Fragment key={dayIndex}>
              {daySchedule.courses.map((course, courseIndex) => (
                <tr key={courseIndex}>
                  <td className="border p-2">{daySchedule.day}</td>
                  <td className="border p-2">{course.time}</td>
                  <td className="border p-2">{course.code}</td>
                  <td className="border p-2">{course.name}</td>
                  <td className="border p-2">{course.venue}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetablePage;
